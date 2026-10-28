/*
 * 硬件与行为配置
 * -------------------------------------------------------------
 * 换屏幕 / 换引脚 / 换时区 / 改校时节奏，都在这个文件里改。
 * WiFi 账号不在这里，见 src/secrets.h。
 */
#pragma once

// ================= 板型：换板子只改这里 + platformio.ini 的编译环境 =================
// platformio.ini 里两个环境各自定义一个宏：
//   pio run -e esp32c3     -> BOARD_ESP32_C3          ESP32-C3 SuperMini
//   pio run -e esp32dev    -> BOARD_ESP32_DEVKIT_V1   ESP32 DevKit V1 (WROOM-32, 30 pin)
// 没有定义任何宏（例如在 Arduino IDE 里直接编译）时按 C3 处理。
#if !defined(BOARD_ESP32_DEVKIT_V1)
#define BOARD_ESP32_C3 1
#endif

#if defined(BOARD_ESP32_DEVKIT_V1)

// ---------------- ESP32 DevKit V1 / WROOM-32 ----------------
#define BOARD_TITLE     "ESP32 DevKit V1"
#define BOARD_SUBTITLE  "WROOM-32 30-pin 2.4GHz"
#define BOARD_BOOT_TEXT "ESP32-WROOM + SSD1306"

#define I2C_SDA_PIN    21     // OLED SDA -> GPIO21（ESP32 默认 SDA）
#define I2C_SCL_PIN    22     // OLED SCL -> GPIO22（ESP32 默认 SCL）
#define BTN_PIN         4     // 按钮 -> GPIO4（RTC IO，可从深睡唤醒）
#define BTN_WAKE_EXT0   1     // 经典 ESP32 没有 GPIO 唤醒 API，用 ext0 单脚唤醒
#define LED_PIN         2     // 板载 LED 在 GPIO2，高电平点亮
#define LED_ACTIVE_LOW  0

#else

// ---------------- ESP32-C3 SuperMini ----------------
#define BOARD_TITLE     "ESP32-C3"
#define BOARD_SUBTITLE  "SuperMini RISC-V 2.4GHz"
#define BOARD_BOOT_TEXT "ESP32-C3 + SSD1306"

#define I2C_SDA_PIN     4     // OLED SDA -> IO4
#define I2C_SCL_PIN     5     // OLED SCL -> IO5
#define BTN_PIN         3     // 按钮 -> IO3（GPIO 深睡唤醒，低电平）
#define BTN_WAKE_EXT0   0     // C3 用 esp_deep_sleep_enable_gpio_wakeup()
#define LED_PIN         8     // 板载 LED 在 IO8，低电平点亮
#define LED_ACTIVE_LOW  1

#endif

// ================= OLED（SSD1306 128x64，I2C 四线） =================
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
// 按钮一端接 BTN_PIN，另一端接 GND；不接按钮也能正常当时钟用。
//   ESP32-C3：只有 GPIO0–GPIO5 能从深睡唤醒，IO4/IO5 已被 I2C 占用，所以按钮放 IO3。
//   ESP32   ：只有 RTC GPIO 能唤醒（0 / 2 / 4 / 12–15 / 25–27 / 32–39），
//             21/22 已被 I2C 占用，所以按钮放 GPIO4。
//             板载 BOOT 键就是 GPIO0，也能当唤醒键，但按住复位会进下载模式。
#define BTN_ENABLED 1
#define BTN_LONG_MS 1200      // 短按 1.2s 内松手 = 立即校时
#define BTN_PROVISION_MS 3000 // 按住 3s 以上 = 重新配网
#define DIAG_HOLD_SEC 8       // 长按 1.2s 后诊断页停留时间

// ================= 配网（AP 热点 + 网页） =================
#define PROVISION_TIMEOUT_MS (10UL * 60UL * 1000UL)  // 配网页最多开 10 分钟
#define PROVISION_RETRY_SEC  300                     // 配网超时后睡 5 分钟再试

// 板载 LED 的引脚 / 极性跟着板型走，见文件开头的板型区
// （C3：IO8 低电平点亮；DevKit V1：GPIO2 高电平点亮）。睡眠前务必关掉。
