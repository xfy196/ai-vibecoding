/*
 * ESP32 DevKit V1 + 0.96" OLED · 无线便利贴
 * =============================================================
 * 引脚、网络、笔记长度、显示排版参数都在这里。
 * 改接线只动「引脚」，改热点名/密码只动「无线」，改排版只动「显示」。
 */
#pragma once

// ================= 引脚 / 屏幕 =================
#define I2C_SDA_PIN       21      // OLED SDA -> GPIO21（ESP32 默认 SDA）
#define I2C_SCL_PIN       22      // OLED SCL -> GPIO22（ESP32 默认 SCL）
#define I2C_CLOCK_HZ      400000  // SSD1306 支持 400kHz，全屏 1KB 约 25ms
#define OLED_I2C_ADDR     0x3C    // 常见 0x3C；失败会自动再试 0x3D
#define SCREEN_W          128
#define SCREEN_H          64

// ================= 无线 =================
// 没有填 secrets.h（或填了但连不上）时，板子自己开热点。
#define AP_SSID_PREFIX    "StickyNote-"  // 后面自动补 MAC 末两字节，如 StickyNote-A1B2
#define AP_PASSWORD       "stickynote"  // WPA2 最少 8 位；改完记得重新连热点
#define AP_CHANNEL        6
#define AP_MAX_CLIENTS    4
#define WIFI_CONNECT_TIMEOUT_MS  15000  // 连家里 WiFi 等多久后放弃、改开热点
#define MDNS_HOST         "sticky"      // 局域网模式可访问 http://sticky.local

// ================= 笔记 =================
#define MAX_NOTE_BYTES    600       // UTF-8 字节上限，约 200 个汉字
#define SAVE_DEBOUNCE_MS  1500      // 停止输入 1.5s 后写 Flash，避免每个字都写
#define NVS_NAMESPACE     "sticky"
#define NVS_KEY_NOTE      "note"

// ================= 显示 =================
#define TEXT_X            2         // 正文左边距
#define TEXT_W            120       // 正文最大宽度（10 个全角字 / 20 个半角字）
#define LINE_H            12        // wqy12 的行高
#define BODY_TOP          10        // 第一行基线
#define PAGE_LINES        5         // 一屏 5 行
#define PAGE_MS           3200      // 多页时每页停留时间
#define TYPE_HOLD_MS      2400      // 正在打字时先停在最后一页
#define CARET_BLINK_MS    530       // 光标闪烁周期
#define SPLASH_MS         5000      // 开机信息页停留时间

// ================= 按键（板载 BOOT） =================
#define BTN_PIN           0         // DevKit V1 的 BOOT 键 = GPIO0，板上已有 10k 上拉
#define BTN_SHORT_MS      60        // 短按：显示连接信息
#define BTN_CLEAR_MS      1200      // 长按：清空便签

// ================= 杂项 =================
#define SERIAL_BAUD       115200
#define DEBUG_SERIAL      1
