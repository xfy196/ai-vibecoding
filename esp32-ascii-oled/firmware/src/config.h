#pragma once

// ============================================================
//  ESP32 DevKit V1 + 0.96" SSD1306 OLED · ASCII 动画屏
//  所有可调参数集中在这里，改完重新编译即可
// ============================================================

// ---------- OLED / I2C ----------
#define PIN_OLED_SDA 21
#define PIN_OLED_SCL 22
#define OLED_BUS_HZ 400000

// ---------- 按键（可选：一端 GPIO4，一端 GND）----------
#define PIN_BUTTON 4
#define BTN_DEBOUNCE_MS 25
#define BTN_LONGPRESS_MS 700

// ---------- 场景 ----------
#define SCENE_AUTO_ADVANCE_MS 12000  // 自动轮播间隔（毫秒）
#define FRAME_MS 16                  // 主循环最小帧间隔，约 60fps 上限

// ---------- 示波器 ----------
// 0 = 内部合成波形，什么都不用接
// 1 = 读 GPIO34 的模拟电压（电位器中间脚接 GPIO34，两端接 3V3 / GND）
#define SCOPE_USE_ADC 0
#define PIN_SCOPE_ADC 34
#define SCOPE_SAMPLE_US 2000  // 采样间隔 2ms = 500Hz

// ---------- 数字雨 ----------
#define RAIN_STEP_MS 40  // 每列下落一格的基础时间，越小越快
