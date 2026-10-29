/*
 * ESP32 DevKit V1 + 0.96" OLED · Flappy Bird
 * =============================================================
 * 只用一个键（板载 BOOT / GPIO0）：
 *   READY      按一下 = 开始
 *   PLAYING    按一下 = 扇翅膀
 *   DYING      输入锁定，坠落 0.7s（前 240ms 反色闪屏）
 *   GAME OVER  按一下 = 重开
 *
 * 接线只有 4 根线：
 *   OLED VCC -> 3V3   GND -> GND   SDA -> GPIO21   SCL -> GPIO22
 *   BOOT 键是板载的，不用接线。
 *
 * 主循环是「固定步长 + 累积器」：逻辑永远 30Hz，渲染跟着 tick 走。
 * SSD1306 在 400kHz I2C 下推一帧约 25ms，所以 30fps 是这块屏的实际上限。
 */
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <Wire.h>

#include "button.h"
#include "config.h"
#include "game.h"

static Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
static Button bootButton;

static bool initDisplay() {
  const uint8_t addrs[] = {OLED_I2C_ADDR, 0x3D};
  for (uint8_t addr : addrs) {
    if (display.begin(SSD1306_SWITCHCAPVCC, addr, true, false)) {
      Serial.printf("[oled] 0x%02X ok\n", addr);
      display.clearDisplay();
      display.display();
      return true;
    }
    Serial.printf("[oled] 0x%02X no answer\n", addr);
  }
  return false;
}

static void haltWithBlink() {
  for (;;) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(120);
  }
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(150);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(I2C_CLOCK_HZ);

  Serial.printf("\n[boot] ESP32 Flappy Bird  SDA=%d SCL=%d BTN=%d (%dHz)\n",
                I2C_SDA_PIN, I2C_SCL_PIN, BTN_PIN, TICK_HZ);

  if (!initDisplay()) {
    Serial.println("[oled] init failed: check VCC=3V3, GND, SDA=21, SCL=22");
    haltWithBlink();
  }

  bootButton.begin(BTN_PIN, BTN_ACTIVE_LOW);
  game::begin();
}

void loop() {
  static uint32_t prevMs = millis();
  static uint32_t accumulator = 0;

  const uint32_t now = millis();
  uint32_t elapsed = now - prevMs;
  prevMs = now;

  // 串口打印 / 烧录时可能卡很久，别让累积器一口气补几百帧。
  if (elapsed > 250) elapsed = 250;

  if (bootButton.pressed(now)) {
    game::onPress(now);
  }

  accumulator += elapsed;
  bool stepped = false;
  while (accumulator >= TICK_MS) {
    accumulator -= TICK_MS;
    game::step(now);
    stepped = true;
  }

  if (stepped) {
    game::render(display, now);
    display.display();  // 真正推 I2C 的地方，约 25ms
  }
}
