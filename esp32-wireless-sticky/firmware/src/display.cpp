#include "display.h"

#include <U8g2lib.h>
#include <Wire.h>

#include <vector>

#include "config.h"

namespace display {
namespace {

// 复位脚没有接（-1），时钟/数据脚用 config.h 里的定义
U8G2_SSD1306_128X64_NONAME_F_HW_I2C sOled(U8G2_R0, U8X8_PIN_NONE, I2C_SCL_PIN, I2C_SDA_PIN);

const uint8_t* const FONT_BODY = u8g2_font_wqy12_t_gb2312;
const uint8_t* const FONT_SMALL = u8g2_font_6x10_tr;
const uint8_t* const FONT_TITLE = u8g2_font_7x13B_tr;

String sNote;
String sUrl = "http://192.168.4.1";
std::vector<String> sLines;

int sPages = 1;
int sPage = 0;
uint32_t sPageAt = 0;
uint32_t sHoldUntil = 0;
uint32_t sSplashUntil = 0;
uint32_t sToastUntil = 0;
String sToast;
String sSplash[4];  // 3 行小字 + 1 行提示
int sOnline = 0;
bool sCaretOn = false;
bool sDirty = true;
bool sReady = false;  // 没找到屏幕时，所有绘制都直接跳过

size_t utf8Len(uint8_t c) {
  if (c < 0x80) return 1;
  if ((c & 0xE0) == 0xC0) return 2;
  if ((c & 0xF0) == 0xE0) return 3;
  if ((c & 0xF8) == 0xF0) return 4;
  return 0;
}

// 把一段（不含 \n）按像素宽度折行。按 UTF-8 字符推进，不会切坏汉字。
void wrapParagraph(const String& para) {
  if (para.isEmpty()) {
    sLines.emplace_back("");
    return;
  }

  String line;
  const char* p = para.c_str();
  const size_t n = para.length();

  for (size_t i = 0; i < n;) {
    const size_t len = utf8Len((uint8_t)p[i]);
    if (len == 0 || i + len > n) {
      ++i;
      continue;
    }

    const String ch = para.substring(i, i + len);
    if (!line.isEmpty() && sOled.getUTF8Width((line + ch).c_str()) > TEXT_W) {
      sLines.push_back(line);
      line = ch;
    } else {
      line += ch;
    }
    i += len;
  }

  if (!line.isEmpty()) sLines.push_back(line);
}

void layout() {
  sLines.clear();

  size_t start = 0;
  while (true) {
    const int nl = sNote.indexOf('\n', start);
    const String para = (nl < 0) ? sNote.substring(start) : sNote.substring(start, nl);
    wrapParagraph(para);
    if (nl < 0) break;
    start = (size_t)nl + 1;
  }

  if (sLines.empty()) sLines.emplace_back("");
  sPages = ((int)sLines.size() + PAGE_LINES - 1) / PAGE_LINES;
  if (sPages < 1) sPages = 1;
}

int textWidth(const String& s) { return (int)sOled.getUTF8Width(s.c_str()); }

void drawCentered(const uint8_t* font, int baseline, const String& s) {
  sOled.setFont(font);
  int x = (SCREEN_W - textWidth(s)) / 2;
  if (x < 2) x = 2;
  sOled.drawUTF8(x, baseline, s.c_str());
}

void drawStatusDot() {
  if (sOnline > 0) {
    sOled.drawBox(123, 2, 3, 3);
  } else {
    sOled.drawFrame(123, 2, 3, 3);
  }
}

void drawPageDots() {
  if (sPages <= 1) return;

  const int step = 5;
  const int total = (sPages - 1) * step + 2;
  int y = (SCREEN_H - total) / 2;
  if (y < 20) y = 20;

  for (int i = 0; i < sPages; ++i) {
    if (i == sPage) {
      sOled.drawBox(125, y, 2, 2);
    } else {
      sOled.drawPixel(125, y);
    }
    y += step;
  }
}

void drawCaret() {
  if (sOnline <= 0 || sPage != sPages - 1 || sNote.isEmpty()) return;
  if (!sCaretOn) return;

  const int last = (int)sLines.size() - 1;
  const int slot = last - sPage * PAGE_LINES;
  if (slot < 0 || slot >= PAGE_LINES) return;

  int x = TEXT_X + textWidth(sLines[last]) + 1;
  if (x > TEXT_X + TEXT_W - 1) return;

  const int baseline = BODY_TOP + slot * LINE_H;
  sOled.drawBox(x, baseline - 9, 1, 10);
}

void drawToast() {
  if (sToastUntil == 0) return;

  sOled.setFont(FONT_BODY);
  const int w = textWidth(sToast) + 16;
  const int boxW = (w > SCREEN_W - 4) ? SCREEN_W - 4 : w;
  const int x = (SCREEN_W - boxW) / 2;
  const int y = 23;

  sOled.setDrawColor(1);
  sOled.drawRBox(x, y, boxW, 19, 4);
  sOled.setDrawColor(0);
  sOled.setFont(FONT_BODY);
  sOled.drawUTF8(x + 8, y + 14, sToast.c_str());
  sOled.setDrawColor(1);
}

void drawEmpty() {
  drawCentered(FONT_BODY, 24, "无线便利贴");
  drawCentered(FONT_BODY, 43, "手机浏览器打开");
  drawCentered(FONT_SMALL, 57, sUrl);
}

void drawNote() {
  sOled.clearBuffer();
  sOled.setFont(FONT_BODY);
  sOled.setDrawColor(1);

  if (sNote.isEmpty()) {
    drawEmpty();
  } else {
    const int first = sPage * PAGE_LINES;
    for (int i = 0; i < PAGE_LINES; ++i) {
      const int idx = first + i;
      if (idx >= (int)sLines.size()) break;
      sOled.drawUTF8(TEXT_X, BODY_TOP + i * LINE_H, sLines[idx].c_str());
    }
    drawCaret();
  }

  drawStatusDot();
  drawPageDots();
  drawToast();
  sOled.sendBuffer();
}

void drawSplash() {
  sOled.clearBuffer();

  drawCentered(FONT_TITLE, 16, "WIRELESS STICKY");
  sOled.setDrawColor(1);
  drawCentered(FONT_SMALL, 29, sSplash[0]);
  drawCentered(FONT_SMALL, 40, sSplash[1]);
  drawCentered(FONT_SMALL, 51, sSplash[2]);
  drawCentered(FONT_BODY, 62, sSplash[3]);

  sOled.sendBuffer();
}

}  // namespace

bool begin() {
  // 先用 Wire 扫一遍地址，方便串口里看清 0x3C / 0x3D
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  uint8_t addr = 0;
  const uint8_t candidates[] = {(uint8_t)OLED_I2C_ADDR, (uint8_t)0x3D};
  for (uint8_t candidate : candidates) {
    Wire.beginTransmission(candidate);
    if (Wire.endTransmission() == 0) {
      addr = candidate;
      break;
    }
    if (DEBUG_SERIAL) Serial.printf("[oled] 0x%02X no answer\n", candidate);
  }
  if (addr == 0) return false;

  // U8g2 的 setI2CAddress() 要 8 位地址：0x3C -> 0x78，0x3D -> 0x7A
  sOled.setI2CAddress((uint8_t)(addr << 1));
  sOled.setBusClock(I2C_CLOCK_HZ);
  if (!sOled.begin()) return false;

  sOled.setFont(FONT_BODY);
  sOled.clearBuffer();
  sOled.sendBuffer();

  sReady = true;
  sDirty = true;

  if (DEBUG_SERIAL) Serial.printf("[oled] 0x%02X ok\n", addr);
  return true;
}

void setUrl(const String& url) { sUrl = url; }

void splash(const String& line1, const String& line2, const String& line3, const String& hint,
            uint32_t ms) {
  sSplash[0] = line1;
  sSplash[1] = line2;
  sSplash[2] = line3;
  sSplash[3] = hint;
  sSplashUntil = millis() + (ms > 0 ? ms : 1);
  sDirty = true;
}

void setNote(const String& text) {
  sNote = text;
  layout();

  sPage = sPages - 1;  // 先看最新输入的那一页
  sPageAt = millis();
  sHoldUntil = sPageAt + TYPE_HOLD_MS;
  sDirty = true;
}

void setOnline(int clients) {
  if (clients == sOnline) return;
  sOnline = clients;
  sDirty = true;
}

void toast(const String& text, uint32_t ms) {
  sToast = text;
  sToastUntil = millis() + ms;
  sDirty = true;
}

void tick() {
  if (!sReady) return;

  const uint32_t now = millis();

  if (sSplashUntil != 0) {
    if ((int32_t)(now - sSplashUntil) < 0) {
      if (sDirty) {
        drawSplash();
        sDirty = false;
      }
      return;
    }
    sSplashUntil = 0;
    sDirty = true;
  }

  if (sToastUntil != 0 && (int32_t)(now - sToastUntil) >= 0) {
    sToastUntil = 0;
    sDirty = true;
  }

  if (sPages > 1) {
    if (sHoldUntil != 0 && (int32_t)(now - sHoldUntil) >= 0) {
      sHoldUntil = 0;
      sPageAt = now;
      if (sPage != 0) {
        sPage = 0;
        sDirty = true;
      }
    } else if (sHoldUntil == 0 && (uint32_t)(now - sPageAt) >= PAGE_MS) {
      sPage = (sPage + 1) % sPages;
      sPageAt = now;
      sDirty = true;
    }
  } else {
    sHoldUntil = 0;
    sPage = 0;
  }

  // 光标闪烁只影响最后一页，别为它整屏重画前面的页
  const bool caretOn = (now / CARET_BLINK_MS) % 2 == 0;
  if (caretOn != sCaretOn) {
    sCaretOn = caretOn;
    if (sOnline > 0 && sPage == sPages - 1) sDirty = true;
  }

  if (sDirty) {
    drawNote();
    sDirty = false;
  }
}

}  // namespace display
