/*
 * WiFi 配网：AP 热点 + 网页表单 + 配置存 NVS
 * -------------------------------------------------------------
 * 页面故意做得像一张卡片：选 WiFi、填城市、选时区、选数据源。
 * 手机连上热点后，iOS / Android / Windows 的联网检测请求也会被
 * 引到这里（DNSServer 把所有域名都指到 192.168.4.1），所以大概率会
 * 自动弹出「登录网络」的页面。
 */
#include "provision.h"

#include <Arduino.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

#include "config.h"
#include "ui.h"

#if __has_include("secrets.h")
#include "secrets.h"
#else
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#endif

namespace {

const char *NVS_NS = "weather";

WebServer gServer(80);
DNSServer gDns;

AppConfig gCurrent;
String gSsidOptions;
bool gSaved = false;

struct TzPreset {
  const char *name;
  const char *posix;
};

const TzPreset PRESETS[] = {
    {"中国 · UTC+8", "CST-8"},
    {"香港 / 台北 · UTC+8", "HKT-8"},
    {"日本 · UTC+9", "JST-9"},
    {"韩国 · UTC+9", "KST-9"},
    {"美东 · ET（含夏令时）", "EST5EDT,M3.2.0,M11.1.0"},
    {"美西 · PT（含夏令时）", "PST8PDT,M3.2.0,M11.1.0"},
    {"英国 · UK（含夏令时）", "GMT0BST,M3.5.0/1,M10.5.0"},
    {"欧洲中部 · CET（含夏令时）", "CET-1CEST,M3.5.0,M10.5.0/3"},
};

// ---------------------------------------------------------------- 小工具
// 按 UTF-8 边界截断，避免把一个汉字劈成两半（snprintf 不管字符边界）
void copyUtf8(char *dst, size_t dstSize, const String &src) {
  if (!dst || dstSize == 0) return;
  size_t o = 0;
  const char *s = src.c_str();
  const size_t n = src.length();
  for (size_t i = 0; i < n;) {
    const uint8_t c = (uint8_t)s[i];
    size_t len = 1;
    if ((c & 0xE0) == 0xC0) {
      len = 2;
    } else if ((c & 0xF0) == 0xE0) {
      len = 3;
    } else if ((c & 0xF8) == 0xF0) {
      len = 4;
    } else if ((c & 0x80) != 0) {
      len = 1;  // 非法起始字节：原样保留，后面照样消耗
    }
    if (i + len > n || o + len + 1 > dstSize) break;
    memcpy(dst + o, s + i, len);
    o += len;
    i += len;
  }
  dst[o] = '\0';
}

String esc(const String &s) {
  String o;
  o.reserve(s.length() + 8);
  for (size_t i = 0; i < s.length(); ++i) {
    const char c = s[i];
    switch (c) {
      case '&': o += F("&amp;"); break;
      case '<': o += F("&lt;"); break;
      case '>': o += F("&gt;"); break;
      case '"': o += F("&quot;"); break;
      case '\'': o += F("&#39;"); break;
      default: o += c;
    }
  }
  return o;
}

String htmlPage(const String &body, const String &title) {
  String h;
  h.reserve(4200);
  h += F("<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\">");
  h += F("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  h += F("<title>");
  h += title;
  h += F("</title><style>");
  h += F(":root{color-scheme:light}*{box-sizing:border-box}"
         "body{margin:0;padding:24px 16px 48px;background:#f4f6fb;color:#0f172a;"
         "font:15px/1.55 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}"
         ".card{max-width:440px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;"
         "border-radius:16px;padding:22px;box-shadow:0 8px 30px rgba(15,23,42,.06)}"
         "h1{font-size:19px;margin:0 0 4px}"
         ".sub{margin:0 0 16px;color:#64748b;font-size:13px}"
         "label{display:block;font-size:12px;font-weight:600;color:#475569;margin:14px 0 6px}"
         "select,input{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;"
         "font-size:15px;background:#fff;color:#0f172a}"
         "select:focus,input:focus{outline:2px solid #bfdbfe;border-color:#2563eb}"
         "button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:11px;"
         "background:#2563eb;color:#fff;font-size:16px;font-weight:600}"
         "button:active{background:#1d4ed8}"
         ".row{display:flex;gap:10px}.row>div{flex:1}"
         ".hint{font-size:12px;color:#94a3b8;margin-top:12px}"
         ".hint a{color:#2563eb}"
         ".ok{color:#15803d}.bad{color:#b91c1c}");
  h += F("</style></head><body><div class=\"card\">");
  h += body;
  h += F("</div></body></html>");
  return h;
}

String tzOptions() {
  String o;
  bool found = false;
  for (const TzPreset &p : PRESETS) {
    const bool sel = strcmp(p.posix, gCurrent.tz) == 0;
    if (sel) found = true;
    o += F("<option value=\"");
    o += esc(p.posix);
    o += sel ? F("\" selected>") : F("\">");
    o += p.name;
    o += F("</option>");
  }
  if (!found && gCurrent.tz[0]) {
    String cur = F("<option value=\"");
    cur += esc(gCurrent.tz);
    cur += F("\" selected>当前设置</option>");
    o = cur + o;
  }
  return o;
}

String providerOptions() {
  String o;
  o += F("<option value=\"0\"");
  if (gCurrent.provider == PROVIDER_OPEN_METEO) o += F(" selected");
  o += F(">Open-Meteo（免 Key，推荐）</option>");
  o += F("<option value=\"1\"");
  if (gCurrent.provider == PROVIDER_OPENWEATHER) o += F(" selected");
  o += F(">OpenWeather（需要 API Key）</option>");
  return o;
}

void scanInto() {
  gSsidOptions = "";
  const int n = WiFi.scanNetworks(false, true);
  int shown = 0;
  for (int i = 0; i < n && shown < 16; ++i) {
    String s = WiFi.SSID(i);
    if (s.length() == 0) continue;
    gSsidOptions += F("<option value=\"");
    gSsidOptions += esc(s);
    gSsidOptions += F("\">");
    gSsidOptions += esc(s);
    gSsidOptions += F(" (");
    gSsidOptions += String(WiFi.RSSI(i));
    gSsidOptions += F(" dBm)</option>");
    ++shown;
  }
  WiFi.scanDelete();
}

// ---------------------------------------------------------------- 路由
void handleRoot() {
  String body;
  body += F("<h1>天气屏配网</h1><p class=\"sub\">填好保存，设备会自动重启并拉取天气</p>");
  body += F("<form method=\"post\" action=\"/save\">");

  body += F("<label>WiFi（只支持 2.4GHz）</label><select name=\"ssid\">");
  body += gSsidOptions;
  body += F("<option value=\"__manual__\">— 手动输入 / 隐藏网络 —</option></select>");
  body += F("<label>或手动输入 SSID</label>");
  body += F("<input name=\"manual\" placeholder=\"留空则用上面的选择\" "
           "autocapitalize=\"off\" autocorrect=\"off\" spellcheck=\"false\">");
  body += F("<label>密码</label><input name=\"pass\" type=\"password\" "
           "placeholder=\"留空则保持原密码\">");

  body += F("<label>城市</label>");
  body += F("<input name=\"city\" value=\"");
  body += esc(gCurrent.city);
  body += F("\" placeholder=\"例如：杭州、北京、Shenzhen\" autocapitalize=\"off\" "
           "autocorrect=\"off\" spellcheck=\"false\">");

  body += F("<div class=\"row\"><div><label>纬度（可选）</label>");
  body += F("<input name=\"lat\" inputmode=\"decimal\" placeholder=\"");
  if (gCurrent.hasLocation()) {
    body += String(gCurrent.lat, 4);
    body += F(", 当前值");
  } else {
    body += F("自动定位");
  }
  body += F("\"></div><div><label>经度（可选）</label>");
  body += F("<input name=\"lon\" inputmode=\"decimal\" placeholder=\"");
  if (gCurrent.hasLocation()) {
    body += String(gCurrent.lon, 4);
    body += F(", 当前值");
  } else {
    body += F("自动定位");
  }
  body += F("\"></div></div>");

  body += F("<label>时区</label><select name=\"tz\">");
  body += tzOptions();
  body += F("</select>");

  body += F("<label>天气数据源</label><select name=\"provider\">");
  body += providerOptions();
  body += F("</select>");

  body += F("<label>OpenWeather API Key（选 Open-Meteo 可留空）</label>");
  body += F("<input name=\"apiKey\" value=\"");
  body += esc(gCurrent.apiKey);
  body += F("\" placeholder=\"32 位十六进制 Key\" autocapitalize=\"off\" "
           "autocorrect=\"off\" spellcheck=\"false\">");

  body += F("<button>保存并重启</button></form>");
  body += F("<p class=\"hint\">当前 WiFi：");
  body += gCurrent.hasWifi() ? esc(gCurrent.ssid) : String("未设置");
  body += F(" · <a href=\"/rescan\">重新扫描附近 WiFi</a><br>"
           "城市名会自动转成经纬度；填了经纬度就不再查询。"
           "和风天气 2026 起改用独立 Host + gzip + JWT，本固件暂不内置。</p>");
  gServer.send(200, "text/html; charset=utf-8", htmlPage(body, F("天气屏配网")));
}

void sendError(const String &title, const String &detail) {
  String b = F("<h1>");
  b += title;
  b += F("</h1><p class=\"sub bad\">");
  b += detail;
  b += F("</p><p class=\"hint\"><a href=\"/\">返回重新填写</a></p>");
  gServer.send(400, "text/html; charset=utf-8", htmlPage(b, F("出错了")));
}

void handleSave() {
  String ssid = gServer.arg("ssid");
  String manual = gServer.arg("manual");
  const String pass = gServer.arg("pass");
  String city = gServer.arg("city");
  String latS = gServer.arg("lat");
  String lonS = gServer.arg("lon");
  const String tz = gServer.arg("tz");
  const String providerS = gServer.arg("provider");
  String apiKey = gServer.arg("apiKey");

  ssid.trim();
  manual.trim();
  city.trim();
  latS.trim();
  lonS.trim();
  apiKey.trim();

  if (ssid == "__manual__" || ssid.length() == 0) ssid = manual;

  if (ssid.length() == 0) {
    sendError(F("SSID 不能为空"), F("返回上一页重新填写"));
    return;
  }
  if (ssid.length() > 32 || pass.length() > 63) {
    sendError(F("长度超了"), F("SSID 最多 32 字节，密码最多 63 字节"));
    return;
  }
  if (city.length() == 0 && (latS.length() == 0 || lonS.length() == 0)) {
    sendError(F("城市不能为空"), F("填一个城市名，或者同时填纬度和经度"));
    return;
  }

  float lat = NAN;
  float lon = NAN;
  if (latS.length() > 0 || lonS.length() > 0) {
    if (latS.length() == 0 || lonS.length() == 0) {
      sendError(F("经纬度要成对填"), F("只填一个的话没法定位"));
      return;
    }
    lat = latS.toFloat();
    lon = lonS.toFloat();
    if (!(lat >= -90.0f && lat <= 90.0f && lon >= -180.0f && lon <= 180.0f)) {
      sendError(F("经纬度不合法"), F("纬度 -90~90，经度 -180~180"));
      return;
    }
  }

  const uint8_t provider = providerS.toInt() == 1 ? PROVIDER_OPENWEATHER : PROVIDER_OPEN_METEO;
  if (provider == PROVIDER_OPENWEATHER && apiKey.length() == 0) {
    sendError(F("缺少 API Key"), F("OpenWeather 必须有 Key；也可以切回 Open-Meteo"));
    return;
  }

  AppConfig next = gCurrent;
  copyUtf8(next.ssid, sizeof next.ssid, ssid);
  if (pass.length() > 0) {
    copyUtf8(next.pass, sizeof next.pass, pass);
  }
  copyUtf8(next.city, sizeof next.city, city);
  if (tz.length() > 0) copyUtf8(next.tz, sizeof next.tz, tz);
  next.provider = provider;
  copyUtf8(next.apiKey, sizeof next.apiKey, apiKey);

  if (latS.length() > 0) {
    next.lat = lat;
    next.lon = lon;
    if (next.city[0] == '\0') {
      // 只填了经纬度：顶栏显示坐标，总比「未设置」清楚
      snprintf(next.city, sizeof next.city, "%.2f,%.2f", lat, lon);
    }
  } else if (strcmp(city.c_str(), gCurrent.city) != 0) {
    // 城市改了、又没手动填经纬度：清掉旧坐标，重启后重新 geocode
    next.lat = NAN;
    next.lon = NAN;
  }

  configStore(next);
  gCurrent = next;
  gSaved = true;

  gServer.send(200, "text/html; charset=utf-8",
               htmlPage(F("<h1>已保存</h1><p class=\"sub ok\">设备正在重启并拉取天气…</p>"
                          "<p class=\"hint\">连不上路由器也没关系，设备会继续重试；"
                          "按住按钮 3 秒可以再次进入配网。</p>"),
                        F("已保存")));
}

void handleRescan() {
  scanInto();
  gServer.sendHeader("Location", "/", true);
  gServer.send(302, "text/plain", "");
}

void handleNotFound() {
  if (gServer.method() == HTTP_GET) {
    handleRoot();  // 手机的联网检测请求也引到配网页
  } else {
    gServer.send(404, "text/plain", "not found");
  }
}

void endAp() {
  gServer.stop();
  gDns.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_OFF);
}

}  // namespace

// ---------------------------------------------------------------- 配置存取
void configLoad(AppConfig &cfg) {
  memset(&cfg, 0, sizeof cfg);
  cfg.lat = NAN;
  cfg.lon = NAN;
  cfg.provider = DEFAULT_PROVIDER;

  Preferences p;
  if (p.begin(NVS_NS, true)) {
    p.getString("ssid", "").toCharArray(cfg.ssid, sizeof cfg.ssid);
    p.getString("pass", "").toCharArray(cfg.pass, sizeof cfg.pass);
    p.getString("city", "").toCharArray(cfg.city, sizeof cfg.city);
    p.getString("tz", "").toCharArray(cfg.tz, sizeof cfg.tz);
    cfg.lat = p.getFloat("lat", NAN);
    cfg.lon = p.getFloat("lon", NAN);
    cfg.provider = p.getUChar("prov", DEFAULT_PROVIDER);
    p.getString("key", "").toCharArray(cfg.apiKey, sizeof cfg.apiKey);
    p.end();
  }

  if (cfg.provider > PROVIDER_OPENWEATHER) cfg.provider = PROVIDER_OPEN_METEO;

  // NVS 里没有就用 secrets.h（可选）
  if (cfg.ssid[0] == '\0' && WIFI_SSID[0] != '\0') {
    snprintf(cfg.ssid, sizeof cfg.ssid, "%s", WIFI_SSID);
    snprintf(cfg.pass, sizeof cfg.pass, "%s", WIFI_PASSWORD);
  }
  if (cfg.city[0] == '\0') snprintf(cfg.city, sizeof cfg.city, "%s", DEFAULT_CITY);
  if (cfg.tz[0] == '\0') snprintf(cfg.tz, sizeof cfg.tz, "%s", TZ_STRING);
}

void configStore(const AppConfig &cfg) {
  Preferences p;
  if (!p.begin(NVS_NS, false)) return;
  p.putString("ssid", cfg.ssid);
  p.putString("pass", cfg.pass);
  p.putString("city", cfg.city);
  p.putString("tz", cfg.tz);
  // 没有定位就删掉键，而不是把 NaN 写进 NVS
  if (cfg.hasLocation()) {
    p.putFloat("lat", cfg.lat);
    p.putFloat("lon", cfg.lon);
  } else {
    p.remove("lat");
    p.remove("lon");
  }
  p.putUChar("prov", cfg.provider);
  p.putString("key", cfg.apiKey);
  p.end();
}

// ---------------------------------------------------------------- 配网主循环
bool provisionRun(const AppConfig &cfg, char *apName, size_t apNameLen) {
  gCurrent = cfg;
  gSaved = false;

  uint8_t mac[6] = {0};
  WiFi.macAddress(mac);
  snprintf(apName, apNameLen, "%s-%02X%02X", PROVISION_AP_PREFIX, mac[4], mac[5]);

  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);  // AP_STA 才能一边开热点一边扫周边 WiFi
  if (!WiFi.softAP(apName)) {  // 开放热点，不设密码
    if (DEBUG_SERIAL && Serial) Serial.println("[setup] softAP failed");
    return false;
  }
  delay(150);

  const String ip = WiFi.softAPIP().toString();
  if (DEBUG_SERIAL && Serial) Serial.printf("[setup] AP %s  http://%s\n", apName, ip.c_str());

  uiProvision(apName, ip.c_str(), 0);  // 先让屏幕给出热点名，扫描要几秒

  gDns.start(53, "*", WiFi.softAPIP());
  scanInto();

  gServer.on("/", HTTP_GET, handleRoot);
  gServer.on("/save", HTTP_POST, handleSave);
  gServer.on("/rescan", HTTP_GET, handleRescan);
  gServer.onNotFound(handleNotFound);
  gServer.begin();

  const uint32_t t0 = millis();
  uint32_t frame = 1;
  uint32_t lastDraw = millis();
  while (millis() - t0 < PROVISION_TIMEOUT_MS) {
    gDns.processNextRequest();
    gServer.handleClient();
    if (gSaved) break;
    if (millis() - lastDraw >= 500) {
      lastDraw = millis();
      uiProvision(apName, ip.c_str(), frame++);
    }
    delay(2);
  }

  if (gSaved) {
    // 先把「已保存」页真正发出去，再关热点/重启，否则手机端可能看到连接被重置
    uiBoot("已保存", "正在重启…");
    gServer.client().flush();
    delay(500);
  }

  endAp();

  if (gSaved) {
    delay(300);
    if (DEBUG_SERIAL && Serial) Serial.println("[setup] saved, restarting");
    ESP.restart();
  }

  if (DEBUG_SERIAL && Serial) Serial.println("[setup] timeout");
  return false;
}
