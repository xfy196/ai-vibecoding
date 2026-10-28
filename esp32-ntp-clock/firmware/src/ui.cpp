/*
 * OLED 界面：七段大字号时钟 + 等待 / 提示页
 * -------------------------------------------------------------
 * 128x64 单色屏，Adafruit GFX 默认 5x7 字库（只有 ASCII）。
 */
#include "ui.h"

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

#include "config.h"

static Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

// ---------------------------------------------------------------- 七段数字
// 单个数字 22x38，笔画粗 4px，圆角 2px。
static const int SEG_T   = 4;
static const int DIG_W   = 22;
static const int DIG_H   = 38;
static const int DIG_Y   = 12;              // 数字顶部
static const int DIG_X[4] = {10, 35, 71, 96};
static const int COLON_X  = 62;

static void segH(int x, int y, int len, bool on) {
  if (on) {
    display.fillRoundRect(x, y, len, SEG_T, SEG_T / 2, SSD1306_WHITE);
  } else if (CLOCK_GHOST_SEGMENTS) {
    display.drawFastHLine(x + 2, y + SEG_T / 2, len - 4, SSD1306_WHITE);
  }
}

static void segV(int x, int y, int len, bool on) {
  if (on) {
    display.fillRoundRect(x, y, SEG_T, len, SEG_T / 2, SSD1306_WHITE);
  } else if (CLOCK_GHOST_SEGMENTS) {
    display.drawFastVLine(x + SEG_T / 2, y + 2, len - 4, SSD1306_WHITE);
  }
}

// 位序：0=A 1=B 2=C 3=D 4=E 5=F 6=G
static uint8_t digitMask(uint8_t d) {
  static const uint8_t M[10] = {
      0b0111111,  // 0  A B C D E F
      0b0000110,  // 1  B C
      0b1011011,  // 2  A B G E D
      0b1001111,  // 3  A B G C D
      0b1100110,  // 4  F G B C
      0b1101101,  // 5  A F G C D
      0b1111101,  // 6  A F G E C D
      0b0000111,  // 7  A B C
      0b1111111,  // 8  全亮
      0b1101111,  // 9  A B C D F G
  };
  return d < 10 ? M[d] : 0;
}

static void drawDigit(int x, int y, uint8_t d) {
  const uint8_t m = digitMask(d);
  segH(x + 4,     y,         DIG_W - 8, m & 0x01);  // A 上横
  segV(x + 18,    y + 4,     DIG_H / 2 - 7, m & 0x02);  // B 右上竖
  segV(x + 18,    y + 21,    DIG_H / 2 - 7, m & 0x04);  // C 右下竖
  segH(x + 4,     y + 34,    DIG_W - 8, m & 0x08);  // D 下横
  segV(x,         y + 21,    DIG_H / 2 - 7, m & 0x10);  // E 左下竖
  segV(x,         y + 4,     DIG_H / 2 - 7, m & 0x20);  // F 左上竖
  segH(x + 4,     y + 17,    DIG_W - 8, m & 0x40);  // G 中横
}

// ---------------------------------------------------------------- 文字
static int textWidth(const char *s) { return (int)strlen(s) * 6 - 1; }

static void textCenter(int y, const char *s) {
  display.setCursor((SCREEN_W - textWidth(s)) / 2, y);
  display.print(s);
}

static void textRight(int y, const char *s) {
  display.setCursor(SCREEN_W - 2 - (int)strlen(s) * 6, y);
  display.print(s);
}

static void rule(int y) { display.drawFastHLine(0, y, SCREEN_W, SSD1306_WHITE); }

static void copyClipped(char *dst, size_t n, const char *src, int maxChars) {
  if (!src) {
    dst[0] = '\0';
    return;
  }
  snprintf(dst, n, "%s", src);
  dst[maxChars] = '\0';
}

// ---------------------------------------------------------------- 顶栏图标
static void wifiIcon(int level, bool online) {
  const int x = 114;
  const int base = 8;
  for (int i = 0; i < 4; ++i) {
    const int bx = x + i * 3;
    const int h = 2 + i * 2;
    if (online && i < level) {
      display.fillRect(bx, base - h + 1, 2, h, SSD1306_WHITE);
    } else {
      display.drawPixel(bx, base, SSD1306_WHITE);
    }
  }
}

static int rssiLevel(int rssi) {
  if (rssi == 0) return 0;
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  return 1;
}

// ---------------------------------------------------------------- 初始化
bool uiBegin() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 400000);
  Wire.setClock(400000);

  uint8_t addr = 0;
  const uint8_t candidates[] = {OLED_I2C_ADDR, 0x3D};
  for (const uint8_t c : candidates) {
    Wire.beginTransmission(c);
    if (Wire.endTransmission() == 0) {
      addr = c;
      break;
    }
  }
  if (addr == 0) addr = OLED_I2C_ADDR;

  const bool ok = display.begin(SSD1306_SWITCHCAPVCC, addr, true, false);
  display.setTextWrap(false);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.clearDisplay();
  display.display();
  Serial.printf("[oled] 0x%02X %s\n", addr, ok ? "ok" : "begin failed");
  return ok;
}

// ---------------------------------------------------------------- 开机画面
void uiBoot() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor((SCREEN_W - 36) / 2, 9);
  display.print("NTP");
  display.setTextSize(1);
  textCenter(30, "C L O C K");
  rule(40);
  textCenter(45, BOARD_BOOT_TEXT);
  textCenter(55, "SNTP / deep sleep");
  display.display();
}

// ---------------------------------------------------------------- 等待画面
static char gBusyTitle[20];
static char gBusyDetail[22];
static uint32_t gBusyFrame = 0;
static uint32_t gBusyLastMs = 0;

static void drawBusyFrame() {
  display.clearDisplay();

  const float cx = SCREEN_W / 2.0f;
  const float cy = 18.0f;
  const float r = 8.0f;
  for (int i = 0; i < 8; ++i) {
    const float a = (i * 45.0f - 90.0f) * 0.0174533f;
    const int x = (int)lroundf(cx + cosf(a) * r);
    const int y = (int)lroundf(cy + sinf(a) * r);
    const int tail = (i - (int)(gBusyFrame % 8) + 8) % 8;
    if (tail == 0) {
      display.fillCircle(x, y, 2, SSD1306_WHITE);
    } else if (tail < 4) {
      display.drawPixel(x, y, SSD1306_WHITE);
    }
  }

  textCenter(32, gBusyTitle);
  textCenter(44, gBusyDetail);
  rule(53);

  // 底部跑马灯，纯粹表示“还在动”
  const int pos = (int)(gBusyFrame * 4 % (SCREEN_W + 24)) - 12;
  display.fillRect(pos, 58, 12, 2, SSD1306_WHITE);

  display.display();
}

void uiBusy(const char *title, const char *detail) {
  copyClipped(gBusyTitle, sizeof gBusyTitle, title, 20);
  copyClipped(gBusyDetail, sizeof gBusyDetail, detail, 21);
  gBusyFrame = 0;
  gBusyLastMs = 0;
  drawBusyFrame();
}

void uiBusyTick() {
  const uint32_t now = millis();
  if (now - gBusyLastMs < 110) return;
  gBusyLastMs = now;
  ++gBusyFrame;
  drawBusyFrame();
}

// ---------------------------------------------------------------- 时钟
static char gTzLabel[12] = TZ_LABEL;

void uiSetTzLabel(const char *label) {
  copyClipped(gTzLabel, sizeof gTzLabel, (label && label[0]) ? label : TZ_LABEL, 11);
}

void uiClock(const ClockView &v) {
  display.clearDisplay();

  char buf[24];

  // 顶栏：日期 + 星期（左侧），WiFi 信号（右侧）
  static const char *const WD[7] = {"SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"};
  snprintf(buf, sizeof buf, "%02d/%02d %s", v.t->tm_mon + 1, v.t->tm_mday,
           WD[v.t->tm_wday & 7]);
  display.setCursor(2, 1);
  display.print(buf);

  const int level = rssiLevel(v.rssi);
  wifiIcon(level, v.wifiOk);
  rule(9);

  // 时间：七段大数字
  int hour = v.t->tm_hour;
#if CLOCK_12H
  hour %= 12;
  if (hour == 0) hour = 12;
#endif
  const char hh[3] = {(char)('0' + hour / 10), (char)('0' + hour % 10), 0};
  const char mm[3] = {(char)('0' + v.t->tm_min / 10), (char)('0' + v.t->tm_min % 10), 0};

#if CLOCK_12H
  if (hh[0] != '0') drawDigit(DIG_X[0], DIG_Y, hh[0] - '0');
#else
  drawDigit(DIG_X[0], DIG_Y, hh[0] - '0');
#endif
  drawDigit(DIG_X[1], DIG_Y, hh[1] - '0');
  drawDigit(DIG_X[2], DIG_Y, mm[0] - '0');
  drawDigit(DIG_X[3], DIG_Y, mm[1] - '0');

  if (v.colonOn) {
    display.fillRect(COLON_X, 23, 4, 4, SSD1306_WHITE);
    display.fillRect(COLON_X, 35, 4, 4, SSD1306_WHITE);
  }

  // 底栏：时区（或 AM/PM）+ 校时状态
  rule(52);
#if CLOCK_12H
  display.setCursor(2, 55);
  display.print(v.t->tm_hour < 12 ? "AM" : "PM");
#else
  display.setCursor(2, 55);
  display.print(gTzLabel);
#endif

  if (!v.synced || v.syncAgeMin < 0) {
    strcpy(buf, "NO NTP");
  } else if (v.syncAgeMin < 1) {
    strcpy(buf, "NTP OK");
  } else if (v.syncAgeMin < 100) {
    snprintf(buf, sizeof buf, "SYNC %dm", v.syncAgeMin);
  } else {
    strcpy(buf, "OFFLINE");
  }
  textRight(55, buf);

  display.display();
}

// ---------------------------------------------------------------- 配网引导页
void uiProvision(const char *apName, const char *ip, uint32_t frame) {
  display.clearDisplay();

  display.setCursor(2, 1);
  display.print("SETUP MODE");
  textRight(1, "AP");
  rule(9);

  display.setCursor(2, 12);
  display.print("1 JOIN WIFI");
  display.setCursor(2, 21);
  display.print(apName && apName[0] ? apName : "NTP-CLOCK");

  display.setCursor(2, 31);
  display.print("2 OPEN BROWSER");
  display.setCursor(2, 40);
  display.print(ip && ip[0] ? ip : "192.168.4.1");

  rule(49);

  // 底部提示：文字固定居中，后面的点自己闪，避免整行左右跳
  const char *label = "OPEN NETWORK";
  const int lw = textWidth(label);
  const int lx = (SCREEN_W - lw) / 2;
  display.setCursor(lx, 52);
  display.print(label);

  const int dots = (int)((frame / 2) % 4);
  for (int i = 0; i < dots; ++i) {
    display.fillRect(lx + lw + 4 + i * 3, 56, 2, 2, SSD1306_WHITE);
  }

  display.display();
}

// ---------------------------------------------------------------- 提示页
void uiNotice(const char *title, const char *l1, const char *l2, const char *l3,
              const char *l4) {
  display.clearDisplay();

  char line[24];
  copyClipped(line, sizeof line, title, 21);
  display.setCursor(6, 6);
  display.print(line);
  rule(17);

  const char *lines[4] = {l1, l2, l3, l4};
  int y = 22;
  for (const char *src : lines) {
    if (src) {
      copyClipped(line, sizeof line, src, 21);
      display.setCursor(6, y);
      display.print(line);
    }
    y += 11;
  }

  display.display();
}
