/*
 * 硬件与行为配置
 * -------------------------------------------------------------
 * 换屏幕 / 换引脚 / 换时区 / 改校时节奏，都在这个文件里改。
 * WiFi 账号不在这里，见 src/secrets.h。
 */
#pragma once

// ================= OLED（SSD1306 128x64，I2C 四线） =================
#define I2C_SDA_PIN    4      // OLED SDA -> IO4
#define I2C_SCL_PIN    5      // OLED SCL -> IO5
#define OLED_I2C_ADDR  0x3C   // 常见 0x3C，部分模块是 0x3D（代码会自动探测）
#define SCREEN_W       128
#define SCREEN_H       64

// ================= 时区 =================
// 用 POSIX TZ 字符串，tzset() 会按它算本地时间，支持夏令时。
//   中国标准时间      "CST-8"
//   香港 / 台北       "HKT-8"
//   日本              "JST-9"
//   韩国              "KST-9"
//   美东（含夏令时）  "EST5EDT,M3.2.0,M11.1.0"
//   美西（含夏令时）  "PST8PDT,M3.2.0,M11.1.0"
//   英国（含夏令时）  "GMT0BST,M3.5.0/1,M10.5.0"
//   欧洲中部（含夏令）"CET-1CEST,M3.5.0,M10.5.0/3"
// 注意：CST-8 的减号不能丢 —— POSIX 里符号是反的，UTC+8 要写成 CST-8。
#define TZ_STRING  "CST-8"
#define TZ_LABEL   "UTC+8"    // 屏幕底栏显示的短标签，6 个字符以内

// 0 = 24 小时制，1 = 12 小时制（12 小时制时底栏左侧显示 AM / PM）
#define CLOCK_12H  0

// ================= 联网 / 校时 =================
#define WIFI_CONNECT_TIMEOUT_MS  12000   // 单次连 WiFi 超时
#define NTP_TIMEOUT_MS            8000   // 单次等 SNTP 回包超时

#define SYNC_INTERVAL_MIN         15     // 正常多久联网校一次时（分钟）
#define SYNC_RETRY_MIN             5     // 失败后多久重试（分钟）
#define NO_TIME_RETRY_SEC         60     // 完全没时间基准时，多久后重试（秒）

// 校时服务器：依次尝试，能通一个就够
#define NTP_SERVER_1  "ntp.aliyun.com"
#define NTP_SERVER_2  "ntp.tencent.com"
#define NTP_SERVER_3  "cn.pool.ntp.org"

// ================= 深睡 / 刷新 =================
// 1 = 调试模式：不进深睡，USB CDC 串口一直在（费电，量产关掉）
// 0 = 正常省电：按周期深睡，串口会随 USB 掉电消失
#define DEBUG_KEEP_AWAKE    1

// 1 = 每 30 秒醒一次，冒号跟着闪；0 = 只在一分钟边界醒一次（更省电）
#define CLOCK_BLINK_COLON   1

// 1 = 未点亮的七段笔画用一根细线勾出来（数码管味道），0 = 完全不画
// 128x64 上细线会和亮笔画抢注意力，默认关掉更清楚
#define CLOCK_GHOST_SEGMENTS 0

// ================= 按键（可选） =================
// ESP32-C3 只有 GPIO0–GPIO5 能从深睡唤醒，而 IO4/IO5 已被 I2C 占用。
// 按钮一端接 IO3，另一端接 GND；不接按钮也能正常当时钟用。
#define BTN_ENABLED 1
#define BTN_PIN     3
#define BTN_LONG_MS 1200      // 短按 1.2s 内松手 = 立即校时
#define BTN_PROVISION_MS 3000 // 按住 3s 以上 = 重新配网
#define DIAG_HOLD_SEC 8       // 长按 1.2s 后诊断页停留时间

// ================= 配网（AP 热点 + 网页） =================
#define PROVISION_TIMEOUT_MS (10UL * 60UL * 1000UL)  // 配网页最多开 10 分钟
#define PROVISION_RETRY_SEC  300                     // 配网超时后睡 5 分钟再试

// 板载 LED（SuperMini 是 IO8，低电平点亮），睡眠前务必关掉
#define LED_PIN        8
#define LED_ACTIVE_LOW 1
