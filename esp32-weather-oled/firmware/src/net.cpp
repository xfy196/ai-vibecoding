#include "net.h"

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_sntp.h>
#include <time.h>

#include "config.h"
#if TLS_VERIFY
#include "certs.h"
#endif

namespace {

const char *NTP1 = "ntp.aliyun.com";
const char *NTP2 = "ntp.tencent.com";
const char *NTP3 = "cn.pool.ntp.org";

bool timeLooksValid() {
  const time_t t = time(nullptr);
  return t > 1700000000;  // 2023-11 之后都算校时成功
}

}  // namespace

bool netConnect(const AppConfig &cfg, uint32_t timeoutMs) {
  if (cfg.ssid[0] == '\0') return false;

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setHostname("esp32-weather");
  WiFi.begin(cfg.ssid, cfg.pass);

  const uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) {
    delay(100);
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (DEBUG_SERIAL && Serial) Serial.println("[wifi] timeout");
    return false;
  }

  WiFi.setSleep(true);  // 省一点电；桌面 USB 供电时也够快
  WiFi.setAutoReconnect(true);
  if (DEBUG_SERIAL && Serial) {
    Serial.printf("[wifi] %s  %d dBm  %lums\n", WiFi.localIP().toString().c_str(),
                  WiFi.RSSI(), (unsigned long)(millis() - t0));
  }
  return true;
}

bool netIsConnected() { return WiFi.status() == WL_CONNECTED; }

int netRssi() { return netIsConnected() ? WiFi.RSSI() : 0; }

bool netTimeValid() { return timeLooksValid(); }

bool netSyncTime(const char *tz, uint32_t timeoutMs, bool force) {
  if (!netIsConnected()) return false;
  if (!force && timeLooksValid()) return true;

  // 只负责 SNTP 取 UTC；本地时间靠下面的 TZ 环境变量
  configTime(0, 0, NTP1, NTP2, NTP3);
  // 注意：configTime() 会把 TZ 改成 UTC0，必须马上按配置改回来
  setenv("TZ", (tz && tz[0]) ? tz : "UTC0", 1);
  tzset();

  const uint32_t t0 = millis();
  // force 时不能只看 time()（本来就是对的），要等这一次 SNTP 真正完成
  while (millis() - t0 < timeoutMs) {
    if (timeLooksValid() && (!force || sntp_get_sync_status() == SNTP_SYNC_STATUS_COMPLETED)) {
      break;
    }
    delay(100);
  }

  const bool ok = timeLooksValid();
  if (DEBUG_SERIAL && Serial) {
    if (ok) {
      Serial.printf("[time] %s  epoch=%lu\n", force ? "resync" : "sync",
                    (unsigned long)time(nullptr));
    } else {
      Serial.println("[time] sync timeout");
    }
  }
  return ok;
}

uint32_t netEpoch() { return timeLooksValid() ? (uint32_t)time(nullptr) : 0; }

bool netHttpGet(const String &url, String &body, String &err, uint8_t provider) {
  body = "";
  err = "";

  if (!netIsConnected()) {
    err = "WiFi 未连接";
    return false;
  }
#if TLS_VERIFY
  if (!timeLooksValid()) {
    err = "时间未同步";
    return false;
  }
#endif

  WiFiClientSecure client;
  client.setHandshakeTimeout(10);
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);
#if TLS_VERIFY
  // 证书链会轮换：证书过期 / 换了根证书时，先看 README 的「HTTPS 证书」一节
  if (provider == PROVIDER_OPENWEATHER) {
    client.setCACert(OPENWEATHER_ROOT_CA);
  } else {
    client.setCACert(OPEN_METEO_ROOT_CA);
  }
#else
  client.setInsecure();  // 仍然加密，但不验证服务器身份
#endif

  HTTPClient http;
  http.setReuse(false);
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, url)) {
    err = "HTTPS 初始化失败";
    return false;
  }
  http.setUserAgent("esp32-weather-oled/1.0");
  http.addHeader("Accept", "application/json");

  const int code = http.GET();
  if (code <= 0) {
    switch (code) {
      case HTTPC_ERROR_CONNECTION_REFUSED: err = "连接被拒绝"; break;
      case HTTPC_ERROR_SEND_HEADER_FAILED:
      case HTTPC_ERROR_SEND_PAYLOAD_FAILED: err = "发送失败"; break;
      case HTTPC_ERROR_NOT_CONNECTED: err = "WiFi 未连接"; break;
      case HTTPC_ERROR_CONNECTION_LOST: err = "连接断开"; break;
      case HTTPC_ERROR_NO_STREAM: err = "无响应流"; break;
      case HTTPC_ERROR_NO_HTTP_SERVER: err = "服务器无响应"; break;
      case HTTPC_ERROR_TOO_LESS_RAM: err = "内存不足"; break;
      case HTTPC_ERROR_ENCODING: err = "编码不支持"; break;
      case HTTPC_ERROR_READ_TIMEOUT: err = "读取超时"; break;
      default: err = "TLS / 网络握手失败"; break;
    }
    if (DEBUG_SERIAL && Serial) {
      Serial.printf("[http] %s -> %s\n", url.c_str(), http.errorToString(code).c_str());
    }
    http.end();
    return false;
  }
  if (code != HTTP_CODE_OK) {
    const String msg = http.getString();
    if (DEBUG_SERIAL && Serial) {
      Serial.printf("[http] %s -> %d  %s\n", url.c_str(), code, msg.substring(0, 200).c_str());
    }
    if (code == 401 || code == 403) {
      err = "API Key 无效";
    } else if (code == 429) {
      err = "请求太频繁";
    } else if (code >= 500) {
      err = "服务端错误 " + String(code);
    } else {
      err = "HTTP " + String(code);
    }
    http.end();
    return false;
  }

  body = http.getString();
  http.end();

  if (body.length() == 0) {
    err = "响应为空";
    return false;
  }
  return true;
}

String urlEncode(const String &s) {
  static const char *kHex = "0123456789ABCDEF";  // 注意别叫 HEX，Arduino 里是宏
  String o;
  o.reserve(s.length() * 3);
  for (size_t i = 0; i < s.length(); ++i) {
    const uint8_t c = (uint8_t)s[i];
    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
        c == '-' || c == '_' || c == '.' || c == '~') {
      o += (char)c;
    } else {
      o += '%';
      o += kHex[c >> 4];
      o += kHex[c & 0x0F];
    }
  }
  return o;
}
