/*
 * 硬件与行为配置
 * -------------------------------------------------------------
 * 换屏幕 / 换引脚 / 改扫描节奏，都在这个文件里改。
 */
#pragma once

// ---------------- OLED（SSD1306 128x64，I2C 四线） ----------------
#define I2C_SDA_PIN    4      // OLED SDA -> GPIO4
#define I2C_SCL_PIN    5      // OLED SCL -> GPIO5
#define OLED_I2C_ADDR  0x3C   // 常见 0x3C，部分模块是 0x3D（代码会自动探测）
#define SCREEN_W       128
#define SCREEN_H       64

// ---------------- 按键 ----------------
#define BTN_PIN            9     // 板载 BOOT 键，低电平按下
#define BTN_DEBOUNCE_MS    25
#define BTN_LONG_MS        700   // 长按多久触发“立即重扫”

// ---------------- 扫描 ----------------
#define MAX_APS            40      // 最多保留多少个热点（按信号排序后）
#define SCAN_INTERVAL_MS   15000   // 空闲时自动重扫间隔
#define SCAN_TIMEOUT_MS    20000   // 单次扫描超时保护
