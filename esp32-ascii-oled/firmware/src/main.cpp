/*
 * ESP32 DevKit V1 + 0.96" SSD1306 OLED · ASCII 动画屏
 * =============================================================
 * 六个场景循环播放，短按 GPIO4 上的按钮切下一个场景，
 * 长按按钮开关「自动轮播」。
 *
 *   1. DIGITAL RAIN     数字雨（6x10 等宽字体，21 列，头部反白）
 *   2. BEATING HEART    参数方程心形 + 扫描线填充 + 底部心电波形
 *   3. OSCILLOSCOPE     环形缓冲 500Hz 采样，合成波形 / 可选 ADC
 *   4. ASCII WALK       7x5 字符小人 4 帧走路循环 + 滚动地面
 *   5. RANDOM NUMBERS   三位数老虎机 + 随机分布直方图
 *   6. U8G2 PRIMITIVES  大号字 / 旋转六边形 / 内存条 / 帧率柱状图
 *
 * 接线（详细见 docs/wiring.svg）：
 *   OLED VCC -> 3V3    GND -> GND    SDA -> GPIO21    SCL -> GPIO22
 *   按键：一端 GPIO4，一端 GND（内部上拉，不用外接电阻）
 *
 * 编译：pio run        烧录：pio run -t upload
 */
#include <Arduino.h>
#include <U8g2lib.h>

#include "config.h"
#include "scenes.h"

// 全屏缓冲（1KB RAM），硬件 I2C，400kHz
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE, PIN_OLED_SCL,
                                         PIN_OLED_SDA);

volatile uint16_t gFps = 0;

static uint8_t gScene = 0;
static uint32_t gSceneEnteredMs = 0;
static bool gAutoAdvance = true;

static uint32_t gToastUntil = 0;
static const char *gToastText = "";

static uint32_t gLastFrameMs = 0;
static uint32_t gFpsWindowMs = 0;
static uint16_t gFpsFrames = 0;

// ------------------------------------------------------------

static void showToast(const char *text, uint32_t now, uint32_t ms = 1200) {
  gToastText = text;
  gToastUntil = now + ms;
}

static void enterScene(uint8_t idx, uint32_t now) {
  gScene = (uint8_t)(idx % kSceneCount);
  gSceneEnteredMs = now;
  kScenes[gScene].setup(u8g2);
  showToast(kScenes[gScene].name, now);
  Serial.printf("[scene] %u/%u  %s\n", (unsigned)(gScene + 1),
                (unsigned)kSceneCount, kScenes[gScene].name);
}

// 短按 = 下一个场景；长按 = 开关自动轮播
static void pollButton(uint32_t now) {
  static bool stable = false;
  static bool lastRead = false;
  static uint32_t lastChangeMs = 0;
  static uint32_t pressStartMs = 0;
  static bool longFired = false;

  const bool raw = (digitalRead(PIN_BUTTON) == LOW);

  if (raw != lastRead) {
    lastRead = raw;
    lastChangeMs = now;
  }
  if (now - lastChangeMs < BTN_DEBOUNCE_MS) return;

  if (raw != stable) {
    stable = raw;
    if (stable) {
      pressStartMs = now;
      longFired = false;
    } else if (!longFired) {
      enterScene((uint8_t)(gScene + 1), now);
    }
    return;
  }

  if (stable && !longFired && now - pressStartMs >= BTN_LONGPRESS_MS) {
    longFired = true;
    gAutoAdvance = !gAutoAdvance;
    showToast(gAutoAdvance ? "AUTO ON" : "AUTO OFF", now);
    Serial.printf("[btn] auto advance %s\n", gAutoAdvance ? "on" : "off");
  }
}

// 场景名小标签，右上角，切换后停留 1.2 秒
static void drawToast(uint32_t now) {
  if ((int32_t)(now - gToastUntil) >= 0) return;

  u8g2.setFont(u8g2_font_4x6_tf);
  const int16_t w = (int16_t)u8g2.getStrWidth(gToastText) + 8;
  const int16_t x = 128 - w;

  u8g2.setDrawColor(1);
  u8g2.drawBox(x, 0, w, 9);
  u8g2.setDrawColor(0);
  u8g2.drawStr(x + 4, 6, gToastText);
  u8g2.setDrawColor(1);
}

// 开机动画：标题 + 进度条
static void splash() {
  const uint32_t start = millis();
  while (millis() - start < 900) {
    const int16_t p = (int16_t)((millis() - start) * 100 / 900);

    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_7x13B_tf);
    const char *title = "ASCII OLED";
    u8g2.drawStr((128 - (int16_t)u8g2.getStrWidth(title)) / 2, 26, title);

    u8g2.setFont(u8g2_font_4x6_tf);
    const char *sub = "6 SCENES / U8G2";
    u8g2.drawStr((128 - (int16_t)u8g2.getStrWidth(sub)) / 2, 38, sub);

    u8g2.drawFrame(24, 46, 80, 6);
    u8g2.drawBox(26, 48, (int16_t)(76 * p / 100), 2);
    u8g2.sendBuffer();

    delay(20);
  }
}

// ------------------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("[boot] ESP32 ASCII OLED  SDA=21 SCL=22 BTN=4");

  pinMode(PIN_BUTTON, INPUT_PULLUP);

#if SCOPE_USE_ADC
  analogReadResolution(12);
  pinMode(PIN_SCOPE_ADC, INPUT);
  Serial.println("[scope] ADC mode, pin GPIO34");
#endif

  // 用芯片硬件随机数播种，每次上电的数字雨/随机数都不一样
  scenesSeed(esp_random());

  u8g2.setBusClock(OLED_BUS_HZ);
  u8g2.setI2CAddress(0x3C << 1);
  bool ok = u8g2.begin();
  if (!ok) {  // 少数模块是 0x3D
    u8g2.setI2CAddress(0x3D << 1);
    ok = u8g2.begin();
  }
  Serial.printf("[oled] %s\n", ok ? "init ok" : "init failed, check SDA/SCL");

  splash();

  gLastFrameMs = millis();
  gFpsWindowMs = gLastFrameMs;
  enterScene(0, millis());
}

void loop() {
  const uint32_t now = millis();

  // 固定帧间隔，避免空转把 CPU 拉满
  if (now - gLastFrameMs < FRAME_MS) {
    delay(1);
    return;
  }
  gLastFrameMs = now;

  pollButton(now);

  if (gAutoAdvance && now - gSceneEnteredMs >= SCENE_AUTO_ADVANCE_MS) {
    enterScene((uint8_t)(gScene + 1), now);
  }

  u8g2.clearBuffer();
  kScenes[gScene].update(u8g2, now, now - gSceneEnteredMs);
  drawToast(now);
  u8g2.sendBuffer();

  // 每 500ms 算一次帧率
  ++gFpsFrames;
  const uint32_t windowMs = now - gFpsWindowMs;
  if (windowMs >= 500) {
    gFps = (uint16_t)(((uint32_t)gFpsFrames * 1000 + windowMs / 2) / windowMs);
    gFpsWindowMs = now;
    gFpsFrames = 0;
  }
}
