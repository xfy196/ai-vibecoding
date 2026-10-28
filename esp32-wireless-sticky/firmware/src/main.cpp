/*
 * 无线便利贴 · 主程序
 * =============================================================
 * 上电后：
 *   1. 有 secrets.h 且能连上家里 WiFi -> 局域网模式（屏幕显示 IP）
 *   2. 否则自己开热点 StickyNote-XXXX / stickynote
 *   3. 手机浏览器打开屏幕上的地址，打字即上屏
 *
 * loop() 里只做四件事：
 *   - 把 note 的新版本推给屏幕和所有 WebSocket 客户端
 *   - 跑显示（翻页 / 光标 / 弹窗）
 *   - 处理 BOOT 键（短按看地址，长按清空）
 *   - 局域网掉线超过 60 秒自动切回热点
 */
#include <Arduino.h>
#include <ESPmDNS.h>
#include <WiFi.h>

#include "config.h"
#include "display.h"
#include "note.h"
#include "web.h"

#if __has_include("secrets.h")
#include "secrets.h"
#define HAS_WIFI_SECRETS 1
#endif

namespace {

enum NetMode { NET_AP, NET_STA };

NetMode sMode = NET_AP;
String sIp = "192.168.4.1";
String sSsid;
bool sCaptive = true;

bool sWebStarted = false;
uint32_t sStaLostAt = 0;  // 局域网断开的时间点，0 表示当前正常

// BOOT 键状态机
bool sBtnDown = false;
bool sBtnLongFired = false;
uint32_t sBtnAt = 0;

// 用 MAC 末两字节做热点后缀，几块板子放一起也不会重名
String makeApSsid() {
  String mac = WiFi.macAddress();  // AA:BB:CC:DD:EE:FF
  String suffix = mac.substring(mac.length() - 5);
  suffix.replace(":", "");
  suffix.toUpperCase();
  return String(AP_SSID_PREFIX) + suffix;
}

// 开机页 / 短按 BOOT：把「怎么连」写在屏幕上
void showInfo(uint32_t ms = SPLASH_MS) {
  if (sMode == NET_AP) {
    display::splash(String("AP   ") + sSsid, String("PASS ") + AP_PASSWORD,
                    String("OPEN ") + sIp, "连上热点，打开地址", ms);
  } else {
    display::splash("STA  connected", String("IP   ") + sIp, "OPEN sticky.local",
                    "手机连同一个 WiFi", ms);
  }
}

#ifdef HAS_WIFI_SECRETS
void startMdns() {
  if (!MDNS.begin(MDNS_HOST)) {
    if (DEBUG_SERIAL) Serial.println("[mdns] start failed");
    return;
  }
  MDNS.addService("http", "tcp", 80);
  if (DEBUG_SERIAL) Serial.printf("[mdns] http://%s.local/\n", MDNS_HOST);
}

bool startSta(uint32_t timeoutMs) {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setHostname(MDNS_HOST);

  if (DEBUG_SERIAL) Serial.printf("[wifi] connecting to \"%s\" ...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  const uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < timeoutMs) {
    display::tick();  // 让「正在连接」那一页能画出来
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    sMode = NET_STA;
    sCaptive = false;
    sSsid = WIFI_SSID;
    sIp = WiFi.localIP().toString();
    sStaLostAt = 0;
    startMdns();
    if (DEBUG_SERIAL) {
      Serial.printf("[wifi] connected, ip=%s rssi=%d\n", sIp.c_str(), WiFi.RSSI());
    }
    return true;
  }

  if (DEBUG_SERIAL) Serial.println("[wifi] timeout, falling back to AP");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(100);
  return false;
}
#endif

bool startAp() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP);

  sSsid = makeApSsid();
  const bool ok = WiFi.softAP(sSsid.c_str(), AP_PASSWORD, AP_CHANNEL, false, AP_MAX_CLIENTS);
  delay(100);

  sMode = NET_AP;
  sCaptive = true;
  sIp = WiFi.softAPIP().toString();

  if (DEBUG_SERIAL) {
    if (ok) {
      Serial.printf("[wifi] AP \"%s\" pass=%s ip=%s\n", sSsid.c_str(), AP_PASSWORD, sIp.c_str());
    } else {
      Serial.println("[wifi] softAP failed");
    }
  }
  return ok;
}

void beginNetwork() {
#ifdef HAS_WIFI_SECRETS
  if (WIFI_SSID[0] != '\0') {
    display::splash("STA  connecting", String("SSID ") + WIFI_SSID, "please wait...",
                    "正在连接家里的 WiFi", WIFI_CONNECT_TIMEOUT_MS + 1000);
    display::tick();

    if (startSta(WIFI_CONNECT_TIMEOUT_MS)) return;
  }
#endif
  startAp();
}

// 局域网掉线太久：关掉 STA，改开热点
void fallbackToAp() {
  if (sMode != NET_STA) return;

  if (DEBUG_SERIAL) Serial.println("[wifi] STA lost > 60s, switching to AP");

  MDNS.end();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(100);

  if (!startAp()) return;

  if (sWebStarted) {
    web::setNetwork("ap", sIp, sSsid, true);
  }
  display::setUrl(String("http://") + sIp);
  showInfo(6000);
}

// 短按：看连接信息；长按 1.2s：清空便签
void handleButton() {
  const bool pressed = digitalRead(BTN_PIN) == LOW;
  const uint32_t now = millis();

  if (pressed && !sBtnDown) {
    sBtnDown = true;
    sBtnLongFired = false;
    sBtnAt = now;
    return;
  }

  if (!pressed) {
    if (!sBtnDown) return;
    const uint32_t held = now - sBtnAt;
    sBtnDown = false;
    if (!sBtnLongFired && held >= BTN_SHORT_MS) {
      showInfo();
    }
    return;
  }

  // 按住不放：到达长按阈值时立刻执行一次，不等松手
  if (!sBtnLongFired && now - sBtnAt >= BTN_CLEAR_MS) {
    sBtnLongFired = true;
    note::clear();
    display::toast("已清空", 1200);
    if (DEBUG_SERIAL) Serial.println("[btn] long press: note cleared");
  }
}

}  // namespace

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(200);

  if (DEBUG_SERIAL) {
    Serial.println();
    Serial.println("=== Wireless Sticky ===");
  }

  pinMode(BTN_PIN, INPUT_PULLUP);

  const bool oledOk = display::begin();
  note::begin();

  beginNetwork();

  web::begin(sMode == NET_AP ? "ap" : "sta", sIp, sSsid, sCaptive);
  sWebStarted = true;

  display::setUrl(String("http://") + sIp);
  display::setOnline(0);

  // 把 NVS 里的旧便签先排好版，等开机页消失就能直接显示
  String restored;
  if (note::takeChange(restored)) {
    display::setNote(restored);
  }

  showInfo();

  if (DEBUG_SERIAL) {
    if (!oledOk) Serial.println("[oled] not found, running headless");
    Serial.printf("[web] open http://%s/ in your phone browser\n", sIp.c_str());
    Serial.println("BOOT: short press = connection info, long press = clear note");
  }
}

void loop() {
  note::tick();

  // 内容变了：重排屏幕 + 群发手机
  String content;
  if (note::takeChange(content)) {
    display::setNote(content);
    web::broadcastNote(content);
  }

  web::tick();
  display::setOnline(web::clientCount());
  display::tick();

  handleButton();

  // 局域网掉线兜底：连续 60 秒连不上就改开热点
  if (sMode == NET_STA) {
    if (WiFi.status() == WL_CONNECTED) {
      sStaLostAt = 0;
    } else if (sStaLostAt == 0) {
      sStaLostAt = millis();
    } else if ((uint32_t)(millis() - sStaLostAt) > 60000) {
      fallbackToAp();
    }
  }

  delay(5);
}
