/*
 * 硬件与行为配置
 * -------------------------------------------------------------
 * 引脚、刷新节奏、夜间调光都在这里改。
 * WiFi / 城市 / API Key 不在这里：第一次上电用手机网页配网，存 NVS。
 */
#pragma once

// ================= 板型：ESP32 DevKit V1 (WROOM-32, 30 pin) =================
#define BOARD_TITLE "ESP32 DevKit V1"
#define I2C_SDA_PIN 21  // OLED SDA -> GPIO21（ESP32 默认 SDA）
#define I2C_SCL_PIN 22  // OLED SCL -> GPIO22（ESP32 默认 SCL）
#define BTN_PIN 4       // 可选按钮 -> GPIO4，另一端接 GND（低电平触发）
#define LED_PIN 2       // 板载 LED（暂时没用，留着）
#define LED_ACTIVE_LOW 0

// ================= OLED（SSD1306 128x64，I2C 四线） =================
#define OLED_I2C_ADDR 0x3C  // 常见 0x3C，部分模块 0x3D（代码会自动探测）
#define SCREEN_W 128
#define SCREEN_H 64

// ================= 时区 =================
// POSIX TZ 字符串，符号是反的：UTC+8 要写 CST-8。
// 配网页面里可以选，存 NVS 后覆盖这里的默认值。
#define TZ_STRING "CST-8"

// ================= 联网 =================
#define WIFI_CONNECT_TIMEOUT_MS 15000  // 单次连 WiFi 超时
#define WIFI_RETRY_SEC 30              // 掉线后多久重连
#define WIFI_LOST_PROVISION_MIN 10     // 有配置但一直连不上，多久后自动回配网（只自动一次）
#define NTP_TIMEOUT_MS 10000           // 等 SNTP 回包超时
#define NTP_RESYNC_HOURS 6             // 多久重新校一次时
#define HTTP_TIMEOUT_MS 12000          // HTTPS 请求超时

// 天气刷新：成功 15 分钟一次；失败 3 分钟重试（免费 API 完全够用）
#define REFRESH_MIN 15
#define RETRY_MIN 3

// ================= 夜间调光 =================
// 0 = 不调光；1 = 晚上把 OLED 对比度降下来（22:00 - 07:00）
#define NIGHT_DIM 1
#define NIGHT_START_HOUR 22
#define NIGHT_END_HOUR 7
#define NIGHT_CONTRAST 30
#define DAY_CONTRAST 255

// ================= 配网（AP 热点 + 网页） =================
#define PROVISION_AP_PREFIX "WEATHER"
#define PROVISION_TIMEOUT_MS (10UL * 60UL * 1000UL)  // 配网页最多开 10 分钟
#define PROVISION_RETRY_SEC 300                      // 没配好时 5 分钟后再开

// ================= 按钮（可选） =================
// 不接按钮也能用：短按立刻刷新，长按 3 秒重新配网。
#define BTN_ENABLED 1
#define BTN_PROVISION_MS 3000

// ================= 调试 =================
#define DEBUG_SERIAL 1

// ================= HTTPS 证书校验 =================
// 0 = 只加密、不校验证书（默认，第一次就能跑通，适合桌面玩具）
// 1 = 校验证书：把 certs.h.example 复制成 certs.h，并按你的数据源改 CA。
//     注意：设备时间必须先校时成功，否则 TLS 会直接失败。
#define TLS_VERIFY 0

// ================= 数据源默认值 =================
// 0 = Open-Meteo（免 Key，默认）
// 1 = OpenWeather（需要 API Key）
// 配网页面里选的会覆盖这里。
#define DEFAULT_PROVIDER 0

// ================= 城市 =================
// 配网时没填经纬度的话，会用 Open-Meteo 的 Geocoding 把城市名转成经纬度。
#define DEFAULT_CITY ""
