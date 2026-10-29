/*
 * ESP32 DevKit V1 + 0.96" OLED 天气屏
 * =============================================================
 * 一块 128x64 的 SSD1306，显示：城市 / 时间 / 天气图标 / 当前温度 /
 * 体感 / 天气描述 / 湿度 / 今日最高最低。
 *
 * 数据默认走 Open-Meteo（免 Key，HTTPS + JSON）；也可以在配网页面里
 * 切到 OpenWeather（填自己的 API Key）。城市名通过 Open-Meteo 的
 * Geocoding 自动转成经纬度，存在 NVS 里，下次不再查。
 *
 * 刷新策略：常驻供电，15 分钟拉一次天气，失败 3 分钟重试；
 * 屏幕上的时间每分钟更新一次；22:00-07:00 自动调低对比度。
 *
 * 接线（以模块丝印为准）
 *   OLED VCC -> 3V3    GND -> GND    SDA -> GPIO21    SCL -> GPIO22
 *   按钮（可选）一端 -> GPIO4，另一端 -> GND
 */
#include <Arduino.h>
#include <WiFi.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include <sys/time.h>
#include <time.h>

#include "config.h"
#include "net.h"
#include "provision.h"
#include "ui.h"
#include "weather.h"

static AppConfig gCfg;
static Weather gWeather;

static uint32_t gWeatherMs = 0;        // 上次成功拉取时的 millis
static uint32_t gNextWeatherMs = 0;    // 下次该拉天气的 millis
static uint32_t gNextWifiMs = 0;       // 下次允许重连的 millis
static uint32_t gNextProvisionMs = 0;  // 配网超时后，下次再开热点
static uint32_t gLastNtpMs = 0;
static int gLastMinute = -1;
static bool gNight = false;
static bool gLastFetchOk = false;
static bool gForceRefresh = false;
static uint32_t gLastWifiOkMs = 0;      // 上次连上 WiFi 的时刻（0 = 开机后还没连上）
static bool gAutoProvisionDone = false; // 「死活连不上」时的自动配网只做一次，别反复开热点

// ---------------------------------------------------------------- 界面
static void drawStatus() {
  if (!gWeather.valid) return;

  const bool fresh =
      gWeatherMs != 0 && (uint32_t)(millis() - gWeatherMs) < 2UL * REFRESH_MIN * 60000UL;

  UiStatus st;
  st.city = gCfg.city;
  st.now = (time_t)netEpoch();
  st.haveTime = netTimeValid();
  st.wifiOk = netIsConnected();
  st.stale = !fresh || !gLastFetchOk;
  st.rssi = netRssi();
  uiMain(gWeather, st);
}

static void updateNight() {
#if NIGHT_DIM
  if (!netTimeValid()) return;
  struct tm lt;
  const time_t now = time(nullptr);
  localtime_r(&now, &lt);
  const bool night = lt.tm_hour >= NIGHT_START_HOUR || lt.tm_hour < NIGHT_END_HOUR;
  if (night != gNight) {
    gNight = night;
    uiContrast(night ? NIGHT_CONTRAST : DAY_CONTRAST);
  }
#else
  (void)0;
#endif
}

// ---------------------------------------------------------------- 配网
static void enterProvision() {
  char apName[24] = {0};
  uiBoot("配网模式", "请连接手机 WiFi");
  if (DEBUG_SERIAL && Serial) Serial.println("[setup] entering provisioning");
  provisionRun(gCfg, apName, sizeof apName);  // 保存成功会直接重启

  // 超时 / 开热点失败：继续正常流程，5 分钟后再试
  WiFi.mode(WIFI_OFF);
  configLoad(gCfg);
  setenv("TZ", gCfg.tz, 1);
  tzset();
  gNextProvisionMs = millis() + (uint32_t)PROVISION_RETRY_SEC * 1000UL;
  gNextWeatherMs = millis();
  if (DEBUG_SERIAL && Serial) Serial.println("[setup] provisioning timeout");
}

// ---------------------------------------------------------------- 网络 / 定位
static bool ensureWifi() {
  if (netIsConnected()) return true;
  if ((int32_t)(millis() - gNextWifiMs) < 0) return false;

  gNextWifiMs = millis() + (uint32_t)WIFI_RETRY_SEC * 1000UL;
  if (gCfg.ssid[0] == '\0') return false;

  if (DEBUG_SERIAL && Serial) Serial.printf("[wifi] connecting to %s\n", gCfg.ssid);
  if (!netConnect(gCfg, WIFI_CONNECT_TIMEOUT_MS)) return false;

  netSyncTime(gCfg.tz, NTP_TIMEOUT_MS);
  gLastNtpMs = millis();
  updateNight();
  return true;
}

static bool ensureLocation() {
  if (gCfg.hasLocation()) return true;
  if (!netIsConnected()) return false;
  if (gCfg.city[0] == '\0') return false;

  String resolved;
  String err;
  float lat = NAN;
  float lon = NAN;

  uiBoot("定位城市", gCfg.city);
  if (!weatherGeocode(gCfg.city, lat, lon, resolved, err)) {
    if (DEBUG_SERIAL && Serial) Serial.printf("[geo] %s\n", err.c_str());
    return false;
  }

  gCfg.lat = lat;
  gCfg.lon = lon;
  configStore(gCfg);
  return true;
}

static void refreshWeather() {
  if (!ensureWifi()) {
    gNextWeatherMs = millis() + (uint32_t)RETRY_MIN * 60000UL;
    if (!gWeather.valid) {
      uiNotice("连不上 WiFi", "检查路由器 / 密码", "长按按钮3秒重新配网");
    }
    return;
  }

  if (!netTimeValid() ||
      (uint32_t)(millis() - gLastNtpMs) > (uint32_t)NTP_RESYNC_HOURS * 3600000UL) {
    // 每 6 小时真正重校一次，纠正 RTC 漂移
    netSyncTime(gCfg.tz, NTP_TIMEOUT_MS, true);
    gLastNtpMs = millis();
    updateNight();
  }

  if (!ensureLocation()) {
    gNextWeatherMs = millis() + (uint32_t)RETRY_MIN * 60000UL;
    if (!gWeather.valid) {
      uiNotice("城市没有定位", "填经纬度或换城市名", "长按按钮3秒重新配网");
    }
    return;
  }

  Weather w;
  String err;
  uiBoot("更新天气", gCfg.city);
  if (!weatherFetch(gCfg, w, err)) {
    if (DEBUG_SERIAL && Serial) Serial.printf("[weather] failed: %s\n", err.c_str());
    gNextWeatherMs = millis() + (uint32_t)RETRY_MIN * 60000UL;
    gLastFetchOk = false;
    if (!gWeather.valid) {
      uiNotice("天气获取失败", err.c_str(), "3分钟后自动重试", "长按按钮3秒重新配网");
    } else {
      drawStatus();
    }
    return;
  }

  gWeather = w;
  gWeatherMs = millis();
  gLastFetchOk = true;
  gNextWeatherMs = millis() + (uint32_t)REFRESH_MIN * 60000UL;
  gLastMinute = -1;  // 强制重画
  updateNight();
  drawStatus();
}

// ---------------------------------------------------------------- 按钮
static void handleButton() {
#if BTN_ENABLED
  static bool wasDown = false;
  static bool longFired = false;
  static uint32_t downAt = 0;

  const bool down = digitalRead(BTN_PIN) == LOW;
  if (down && !wasDown) {
    downAt = millis();
    longFired = false;
  }
  if (down && !longFired && millis() - downAt >= BTN_PROVISION_MS) {
    longFired = true;
    enterProvision();
  }
  if (!down && wasDown && !longFired && millis() - downAt > 60) {
    if (DEBUG_SERIAL && Serial) Serial.println("[btn] refresh");
    gForceRefresh = true;
  }
  wasDown = down;
#endif
}

// ---------------------------------------------------------------- setup / loop
void setup() {
#if DEBUG_SERIAL
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("[boot] ESP32 weather OLED");
#endif

#if BTN_ENABLED
  pinMode(BTN_PIN, INPUT_PULLUP);
#endif

  configLoad(gCfg);
  setenv("TZ", gCfg.tz, 1);
  tzset();

  const bool oledOk = uiBegin();
#if DEBUG_SERIAL
  Serial.printf("[oled] %s\n", oledOk ? "ok" : "not found");
#endif
  uiBoot(BOARD_TITLE, "启动中…");

  if (!gCfg.hasWifi()) {
    enterProvision();
  }

  if (netConnect(gCfg, WIFI_CONNECT_TIMEOUT_MS)) {
    gLastWifiOkMs = millis();
    netSyncTime(gCfg.tz, NTP_TIMEOUT_MS);
    gLastNtpMs = millis();
    updateNight();
  }

  refreshWeather();

  if (DEBUG_SERIAL && Serial) {
    Serial.printf("[weather] provider=%s\n",
                  gCfg.provider == PROVIDER_OPENWEATHER ? "OpenWeather" : "Open-Meteo");
  }
}

void loop() {
  handleButton();

  if (gForceRefresh) {
    gForceRefresh = false;
    refreshWeather();
  }

  const bool wifiUp = netIsConnected();
  if (wifiUp) gLastWifiOkMs = millis();

  if (!gCfg.hasWifi()) {
    // 根本没配过：一直等，配网超时后 5 分钟再开一次热点
    if ((int32_t)(millis() - gNextProvisionMs) >= 0) {
      enterProvision();
    }
  } else if (!gAutoProvisionDone && !wifiUp &&
             (uint32_t)(millis() - gLastWifiOkMs) > (uint32_t)WIFI_LOST_PROVISION_MIN * 60000UL) {
    // 配置在，但（大概率密码错 / 路由器换了）一直连不上：
    // 自动开一次热点，没接按钮也有救。只自动一次，救不回来就靠长按按钮。
    gAutoProvisionDone = true;
    gNextWeatherMs = millis();
    enterProvision();
  }

  if ((int32_t)(millis() - gNextWeatherMs) >= 0) {
    refreshWeather();
  }

  if (gWeather.valid && netTimeValid()) {
    struct tm lt;
    const time_t now = time(nullptr);
    localtime_r(&now, &lt);
    if (lt.tm_min != gLastMinute) {
      gLastMinute = lt.tm_min;
      drawStatus();
      updateNight();
    }
  }

  delay(20);
}
