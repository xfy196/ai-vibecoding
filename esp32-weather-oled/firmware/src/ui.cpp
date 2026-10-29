#include "ui.h"

#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

#include "config.h"
#include "icons.h"

namespace {

U8G2_SSD1306_128X64_NONAME_F_HW_I2C g(U8G2_R0, U8X8_PIN_NONE);
bool gReady = false;

const uint8_t *CITY_FONT = u8g2_font_wqy12_t_gb2312;
const uint8_t *BIG_FONT = u8g2_font_logisoso30_tn;
const uint8_t *MID_FONT = u8g2_font_logisoso24_tn;

void rule(int y) { g.drawLine(0, y, SCREEN_W - 1, y); }

int utf8Len(uint8_t c) {
  if ((c & 0x80) == 0) return 1;
  if ((c & 0xE0) == 0xC0) return 2;
  if ((c & 0xF0) == 0xE0) return 3;
  if ((c & 0xF8) == 0xF0) return 4;
  return 1;
}

void clipChars(char *dst, size_t n, const char *src, int maxChars) {
  if (!dst || n == 0) return;
  dst[0] = '\0';
  if (!src) return;
  size_t o = 0;
  int c = 0;
  for (size_t i = 0; src[i] && c < maxChars; ++c) {
    const int len = utf8Len((uint8_t)src[i]);
    if (o + (size_t)len + 1 > n) break;
    memcpy(dst + o, src + i, (size_t)len);
    o += (size_t)len;
    i += (size_t)len;
  }
  dst[o] = '\0';
}

void drawRight(int right, int baseline, const char *s) {
  g.drawUTF8(right - g.getUTF8Width(s), baseline, s);
}

void drawCenter(int y, const char *s) {
  g.drawUTF8((SCREEN_W - g.getUTF8Width(s)) / 2, y, s);
}

int rssiLevel(int rssi) {
  if (rssi == 0) return 0;
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  return 1;
}

void wifiBars(int x, int baseline, int level, bool online) {
  for (int i = 0; i < 4; ++i) {
    const int h = 2 + i * 2;
    const int bx = x + i * 3;
    if (online && i < level) {
      g.drawBox(bx, baseline - h + 1, 2, h);
    } else {
      g.drawPixel(bx, baseline);
    }
  }
}

// 底部小水滴，表示湿度
void dropIcon(int x, int y) {
  g.drawPixel(x + 2, y);
  g.drawLine(x + 1, y + 1, x + 3, y + 3);
  g.drawLine(x + 3, y + 1, x + 1, y + 3);
  g.drawDisc(x + 2, y + 5, 1);
}

void tempDegree(int x, int y) {
  g.drawCircle(x, y, 2);
  g.drawCircle(x, y, 1);
}

}  // namespace

bool uiBegin() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000);

  uint8_t addr = 0;
  const uint8_t candidates[] = {OLED_I2C_ADDR, 0x3D};
  for (uint8_t a : candidates) {
    if (a == 0) continue;
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      addr = a;
      break;
    }
  }
  if (addr == 0) return false;

  g.setI2CAddress((uint8_t)(addr << 1));
  g.setBusClock(400000);
  g.begin();
  g.setContrast(DAY_CONTRAST);
  g.clearBuffer();
  g.sendBuffer();
  gReady = true;
  return true;
}

void uiContrast(uint8_t v) {
  if (gReady) g.setContrast(v);
}

void uiBoot(const char *title, const char *detail) {
  if (!gReady) return;
  g.clearBuffer();
  g.setDrawColor(1);
  g.setFont(CITY_FONT);
  drawCenter(28, title);
  if (detail && detail[0]) {
    drawCenter(48, detail);
  }
  g.sendBuffer();
}

void uiNotice(const char *title, const char *l1, const char *l2, const char *l3) {
  if (!gReady) return;
  g.clearBuffer();
  g.setDrawColor(1);
  g.setFont(CITY_FONT);
  drawCenter(16, title);
  rule(21);
  const char *lines[] = {l1, l2, l3};
  int y = 36;
  for (const char *s : lines) {
    if (s && s[0]) {
      g.drawUTF8(4, y, s);
      y += 13;
    }
  }
  g.sendBuffer();
}

void uiMain(const Weather &w, const UiStatus &st) {
  if (!gReady) return;
  if (!w.valid) {
    uiNotice("等待天气数据", "正在连接网络…", "长按按钮3秒可配网");
    return;
  }

  g.clearBuffer();
  g.setDrawColor(1);

  // ---------------- 顶栏：城市 / WiFi / 时间
  g.setFont(CITY_FONT);
  char city[32];
  const char *citySrc = (st.city && st.city[0]) ? st.city : "未设置";
  for (int n = 6; n >= 1; --n) {
    clipChars(city, sizeof city, citySrc, n);
    if (g.getUTF8Width(city) <= 72) break;
  }
  g.drawUTF8(2, 10, city);

  wifiBars(78, 10, rssiLevel(st.rssi), st.wifiOk);

  char hm[8];
  if (st.haveTime) {
    struct tm lt;
    localtime_r(&st.now, &lt);
    snprintf(hm, sizeof hm, "%02d:%02d", lt.tm_hour, lt.tm_min);
  } else {
    snprintf(hm, sizeof hm, "--:--");
  }
  drawRight(126, 10, hm);

  if (st.stale) {
    g.drawUTF8(92, 10, "!");
  }

  rule(13);

  // ---------------- 主区：图标 + 大温度 + 体感
  iconDraw(g, 2, 15, w.sky, w.isDay);

  char temp[12];
  snprintf(temp, sizeof temp, "%d", (int)lroundf(w.temp));
  g.setFont(BIG_FONT);
  int tw = g.getUTF8Width(temp);
  int baseline = 45;
  bool big = true;
  if (tw > 36) {
    g.setFont(MID_FONT);
    tw = g.getUTF8Width(temp);
    baseline = 44;
    big = false;
  }
  g.drawUTF8(42, baseline, temp);
  tempDegree(42 + tw + 5, big ? 22 : 20);

  if (big && w.feels == w.feels) {
    g.setFont(CITY_FONT);
    g.drawUTF8(88, 29, "体感");
    char feels[12];
    snprintf(feels, sizeof feels, "%d°", (int)lroundf(w.feels));
    g.drawUTF8(92, 45, feels);
  }

  rule(49);

  // ---------------- 底栏：天气描述 / 湿度 / 最高最低
  g.setFont(CITY_FONT);
  g.drawUTF8(2, 63, w.text);

  const int textW = g.getUTF8Width(w.text);
  int hx = 2 + textW + 7;

  char hi[20];
  hi[0] = '\0';
  int hiX = 127;
  if (w.tmax == w.tmax && w.tmin == w.tmin) {
    snprintf(hi, sizeof hi, "%d/%d°", (int)lroundf(w.tmax), (int)lroundf(w.tmin));
    hiX = 126 - g.getUTF8Width(hi);
  }

  char hum[12];
  hum[0] = '\0';
  if (st.stale) {
    snprintf(hum, sizeof hum, "离线");
  } else if (w.humidity >= 0) {
    snprintf(hum, sizeof hum, "%d%%", w.humidity);
  }

  // 底栏只有 128px：描述太长、温度带负号时，先牺牲湿度，别让文字叠在一起
  const int humW = hum[0] ? (7 + g.getUTF8Width(hum)) : 0;
  if (hum[0] && hx + humW <= hiX - 4) {
    if (st.stale) {
      g.drawUTF8(hx, 63, hum);
    } else {
      dropIcon(hx, 53);
      g.drawUTF8(hx + 7, 63, hum);
    }
  }

  if (hi[0]) drawRight(126, 63, hi);

  g.sendBuffer();
}

void uiProvision(const char *apName, const char *ip, uint32_t frame) {
  if (!gReady) return;
  g.clearBuffer();
  g.setDrawColor(1);
  g.setFont(CITY_FONT);
  drawCenter(10, "配网模式");
  rule(13);

  g.drawUTF8(4, 25, "1. 连接热点");
  g.drawUTF8(4, 37, apName);

  char line[48];
  snprintf(line, sizeof line, "2. 打开 %s", ip ? ip : "192.168.4.1");
  g.drawUTF8(4, 50, line);

  char dots[5] = "...";
  const int n = (int)(frame % 4);
  for (int i = 0; i < 4; ++i) dots[i] = i < n ? '.' : ' ';
  dots[4] = '\0';

  const char *wait = "等待手机连接";
  const int waitW = g.getUTF8Width(wait);
  const int totalW = waitW + 20;
  const int waitX = (SCREEN_W - totalW) / 2;
  g.drawUTF8(waitX, 63, wait);
  g.drawUTF8(waitX + waitW + 2, 63, dots);

  g.sendBuffer();
}
