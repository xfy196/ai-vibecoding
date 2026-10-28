/*
 * WiFi 配网：AP 热点 + 网页表单 + 配置存 NVS
 * -------------------------------------------------------------
 * 页面故意做得像一张卡片：选 WiFi、填密码、选时区、保存。
 * 手机连上热点后，iOS / Android / Windows 的联网检测请求也会被
 * 引到这里（DNSServer 把所有域名都指到 192.168.4.1），所以大概率
 * 会自动弹出「登录网络」的页面。
 */
#include "provision.h"

#include <Arduino.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>
#include <stdio.h>
#include <string.h>

#include "config.h"
#include "ui.h"

namespace {

const char *NVS_NS = "clock";

WebServer gServer(80);
DNSServer gDns;

ClockConfig gCurrent;      // 本次配网用的副本
String gSsidOptions;       // 预渲染好的 <option> 列表
bool gSaved = false;

struct TzPreset {
  const char *name;
  const char *posix;
  const char *shortLabel;
};

const TzPreset PRESETS[] = {
    {"中国 · UTC+8", "CST-8", "UTC+8"},
    {"香港 / 台北 · UTC+8", "HKT-8", "UTC+8"},
    {"日本 · UTC+9", "JST-9", "UTC+9"},
    {"韩国 · UTC+9", "KST-9", "UTC+9"},
    {"美东 · ET（含夏令时）", "EST5EDT,M3.2.0,M11.1.0", "ET"},
    {"美西 · PT（含夏令时）", "PST8PDT,M3.2.0,M11.1.0", "PT"},
    {"英国 · UK（含夏令时）", "GMT0BST,M3.5.0/1,M10.5.0", "UK"},
    {"欧洲中部 · CET（含夏令时）", "CET-1CEST,M3.5.0,M10.5.0/3", "CET"},
};

// ---------------------------------------------------------------- 小工具
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
  h.reserve(3200);
  h += F("<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\">");
  h += F("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  h += F("<title>");
  h += title;
  h += F("</title><style>");
  h += F(":root{color-scheme:light}*{box-sizing:border-box}"
         "body{margin:0;padding:24px 16px 48px;background:#f4f6fb;color:#0f172a;"
         "font:15px/1.55 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}"
         ".card{max-width:420px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;"
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
  body += F("<h1>NTP 时钟配网</h1><p class=\"sub\">填好保存，设备会自动重启并校时</p>");
  body += F("<form method=\"post\" action=\"/save\">");
  body += F("<label>WiFi（只支持 2.4GHz）</label><select name=\"ssid\">");
  body += gSsidOptions;
  body += F("<option value=\"__manual__\">— 手动输入 / 隐藏网络 —</option></select>");
  body += F("<label>或手动输入 SSID</label>");
  body += F("<input name=\"manual\" placeholder=\"留空则用上面的选择\" "
           "autocapitalize=\"off\" autocorrect=\"off\" spellcheck=\"false\">");
  body += F("<label>密码</label><input name=\"pass\" type=\"password\" "
           "placeholder=\"留空则保持原密码\">");
  body += F("<label>时区</label><select name=\"tz\">");
  body += tzOptions();
  body += F("</select><button>保存并重启</button></form>");
  body += F("<p class=\"hint\">当前 WiFi：");
  body += gCurrent.hasWifi() ? esc(gCurrent.ssid) : String("未设置");
  body += F(" · <a href=\"/rescan\">重新扫描附近 WiFi</a></p>");
  gServer.send(200, "text/html; charset=utf-8", htmlPage(body, F("NTP 时钟配网")));
}

void handleSave() {
  String ssid = gServer.arg("ssid");
  String manual = gServer.arg("manual");
  const String pass = gServer.arg("pass");
  const String tz = gServer.arg("tz");

  ssid.trim();
  manual.trim();
  if (ssid == "__manual__" || ssid.length() == 0) ssid = manual;

  if (ssid.length() == 0) {
    gServer.send(400, "text/html; charset=utf-8",
                 htmlPage(F("<h1>SSID 不能为空</h1><p class=\"sub bad\">返回上一页重新填写</p>"),
                          F("出错了")));
    return;
  }

  if (ssid.length() > 32 || pass.length() > 63) {
    gServer.send(400, "text/html; charset=utf-8",
                 htmlPage(F("<h1>长度超了</h1><p class=\"sub bad\">SSID 最多 32 字节，"
                            "密码最多 63 字节</p>"),
                          F("出错了")));
    return;
  }

  ClockConfig next = gCurrent;
  snprintf(next.ssid, sizeof next.ssid, "%s", ssid.c_str());
  if (pass.length() > 0) {
    snprintf(next.pass, sizeof next.pass, "%s", pass.c_str());
  }
  if (tz.length() > 0) {
    snprintf(next.tz, sizeof next.tz, "%s", tz.c_str());
    for (const TzPreset &p : PRESETS) {
      if (tz == p.posix) {
        snprintf(next.tzLabel, sizeof next.tzLabel, "%s", p.shortLabel);
        break;
      }
    }
  }

  configStore(next);
  gCurrent = next;
  gSaved = true;

  gServer.send(200, "text/html; charset=utf-8",
               htmlPage(F("<h1>已保存</h1><p class=\"sub ok\">设备正在重启并连接 WiFi…</p>"
                          "<p class=\"hint\">屏幕会在几秒内出时间；连不上会回到这个配网页。</p>"),
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

}  // namespace

// ---------------------------------------------------------------- 配置存取
void configLoad(ClockConfig &cfg, const char *defSsid, const char *defPass) {
  memset(&cfg, 0, sizeof cfg);

  Preferences p;
  if (p.begin(NVS_NS, true)) {
    p.getString("ssid", "").toCharArray(cfg.ssid, sizeof cfg.ssid);
    p.getString("pass", "").toCharArray(cfg.pass, sizeof cfg.pass);
    p.getString("tz", "").toCharArray(cfg.tz, sizeof cfg.tz);
    p.getString("tzl", "").toCharArray(cfg.tzLabel, sizeof cfg.tzLabel);
    p.end();
  }

  // NVS 里没有就用 secrets.h（兼容老用法）
  if (cfg.ssid[0] == '\0' && defSsid && defSsid[0]) {
    snprintf(cfg.ssid, sizeof cfg.ssid, "%s", defSsid);
    if (defPass) snprintf(cfg.pass, sizeof cfg.pass, "%s", defPass);
  }
  if (cfg.tz[0] == '\0') {
    snprintf(cfg.tz, sizeof cfg.tz, "%s", TZ_STRING);
  }
  if (cfg.tzLabel[0] == '\0') {
    snprintf(cfg.tzLabel, sizeof cfg.tzLabel, "%s", TZ_LABEL);
  }
}

void configStore(const ClockConfig &cfg) {
  Preferences p;
  if (!p.begin(NVS_NS, false)) return;
  p.putString("ssid", cfg.ssid);
  p.putString("pass", cfg.pass);
  p.putString("tz", cfg.tz);
  p.putString("tzl", cfg.tzLabel);
  p.end();
}

// ---------------------------------------------------------------- 配网主循环
bool provisionRun(const ClockConfig &cfg, char *apName, size_t apNameLen) {
  gCurrent = cfg;
  gSaved = false;

  uint8_t mac[6] = {0};
  WiFi.macAddress(mac);
  snprintf(apName, apNameLen, "NTP-CLOCK-%02X%02X", mac[4], mac[5]);

  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);  // AP_STA 才能一边开热点一边扫周边 WiFi
  if (!WiFi.softAP(apName)) {  // 开放热点，不设密码
    if (Serial) Serial.println("[setup] softAP failed");
    return false;
  }
  delay(150);

  const String ip = WiFi.softAPIP().toString();
  if (Serial) Serial.printf("[setup] AP %s  http://%s\n", apName, ip.c_str());

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

  gServer.stop();
  gDns.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_OFF);

  if (gSaved) {
    if (Serial) Serial.println("[setup] saved, restarting");
    delay(600);
    ESP.restart();
  }

  if (Serial) Serial.println("[setup] timeout");
  return false;
}
