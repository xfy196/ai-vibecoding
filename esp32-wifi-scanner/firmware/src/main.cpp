/*
 * ESP32-C3 SuperMini · 0.96" OLED WiFi 扫描器
 * =============================================================
 * 功能
 *   - 异步扫描 2.4G 热点（扫描时界面不卡）
 *   - 按信号强度排序，5 行列表 + 平滑滚动 + 右侧滚动条
 *   - 每行显示信号格、SSID、RSSI；顶栏显示选中项的加密锁
 *   - 顶部：热点数量 / 当前选中项的 RSSI 与信道 / 扫描动画
 *   - 底部：扫描时显示来回扫动的进度条
 *
 * 操作
 *   - BOOT 短按：下一条
 *   - BOOT 长按 0.7s：立即重扫
 *   - 空闲 15s：自动重扫（会尽量保持当前选中项）
 *
 * 接线（以模块丝印为准）
 *   OLED VCC -> 3V3      OLED SDA -> GPIO4
 *   OLED GND -> GND      OLED SCL -> GPIO5
 *
 * 注意：C3 只有 2.4GHz，5GHz 的 SSID 不会出现在列表里。
 *       5x7 字库不含中文，中文 SSID 会被折叠成 "?"；
 *       纯中文名字显示为 "AP xxxx"（BSSID 后四位），方便区分。
 */

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

#include "config.h"

// ---------------------------------------------------------------- 显示
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

// ---------------------------------------------------------------- 布局
static const int ROW_H        = 10;  // 每行高度
static const int LIST_TOP     = 10;  // 列表区上边界（标题栏 10px）
static const int LIST_BOTTOM  = 60;  // 列表区下边界（不含）
static const int VISIBLE_ROWS = (LIST_BOTTOM - LIST_TOP) / ROW_H;  // 5 行
static const int SSID_COLS    = 14;  // SSID 最多 14 个字符（6px/字）
static const int BAR_X        = 2;   // 信号格起点
static const int SSID_X       = 15;
static const int HEADER_LOCK_X = 74; // 顶栏的小锁，表示选中项已加密
static const int RSSI_RIGHT   = 122; // RSSI 右对齐位置
static const int SCROLL_X     = 124; // 滚动条 3px 宽

// ---------------------------------------------------------------- 数据
struct ApInfo {
  char ssid[33];
  int8_t rssi;
  uint8_t channel;
  uint8_t auth;
  uint8_t bssid[6];
};

static ApInfo gAps[MAX_APS];
static int gApCount = 0;

static bool gScanning = false;
static uint32_t gScanStartedMs = 0;
static uint32_t gLastScanMs = 0;
static bool gNeedDraw = true;

static int gSelected = 0;      // 选中行
static int gScrollRow = 0;     // 目标：列表顶部显示的行号
static float gScrollPx = 0.0f; // 当前动画位置（行号，浮点）
static uint32_t gLastAnimMs = 0;
static uint32_t gLastDrawMs = 0;

// ---------------------------------------------------------------- 工具
static int maxScrollRow() {
  const int m = gApCount - VISIBLE_ROWS;
  return m > 0 ? m : 0;
}

/** 让选中项保持在可视区域内 */
static void ensureVisible() {
  if (gSelected < 0) gSelected = 0;
  if (gApCount > 0 && gSelected >= gApCount) gSelected = gApCount - 1;
  if (gApCount == 0) gSelected = 0;

  if (gSelected < gScrollRow) {
    gScrollRow = gSelected;
  } else if (gSelected >= gScrollRow + VISIBLE_ROWS) {
    gScrollRow = gSelected - VISIBLE_ROWS + 1;
  }

  const int maxScroll = maxScrollRow();
  if (gScrollRow > maxScroll) gScrollRow = maxScroll;
  if (gScrollRow < 0) gScrollRow = 0;
}

/** 按 RSSI 从强到弱排序（插入排序，最多 40 条，足够快） */
static void sortByRssi() {
  for (int i = 1; i < gApCount; ++i) {
    const ApInfo tmp = gAps[i];
    int j = i - 1;
    while (j >= 0 && gAps[j].rssi < tmp.rssi) {
      gAps[j + 1] = gAps[j];
      --j;
    }
    gAps[j + 1] = tmp;
  }
}

/**
 * 把 SSID 变成 5x7 字库能显示的字符串：
 *   - 可打印 ASCII 原样保留
 *   - 一串连续的非 ASCII（中文/emoji）折叠成一个 '?'
 *   - 纯中文名字退化成 "AP xxxx"（BSSID 后四位）
 */
static void formatSsid(const ApInfo &ap, char *out, size_t outSize) {
  size_t w = 0;
  bool lastWasWide = false;
  const uint8_t *p = reinterpret_cast<const uint8_t *>(ap.ssid);

  while (*p != 0 && w + 1 < outSize) {
    const uint8_t c = *p;
    if (c < 0x80) {
      out[w++] = (c >= 0x20 && c < 0x7F) ? static_cast<char>(c) : ' ';
      ++p;
      lastWasWide = false;
    } else {
      int len = 1;
      if ((c & 0xE0) == 0xC0) len = 2;
      else if ((c & 0xF0) == 0xE0) len = 3;
      else if ((c & 0xF8) == 0xF0) len = 4;
      p += len;
      if (!lastWasWide) {
        out[w++] = '?';
        lastWasWide = true;
      }
    }
  }
  out[w] = '\0';

  if (w == 0 || (w == 1 && out[0] == '?')) {
    snprintf(out, outSize, "AP %02X%02X", ap.bssid[4], ap.bssid[5]);
  }
}

// ---------------------------------------------------------------- 绘制
static void drawSignalBars(int x, int y, int rssi, uint16_t color) {
  const int level = rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  for (int b = 0; b < level; ++b) {
    const int h = 3 + b * 2;
    display.fillRect(x + b * 3, y + 9 - h, 2, h, color);
  }
}

/** 4x6 的小锁，表示加密网络 */
static void drawLock(int x, int y, uint16_t color) {
  display.drawPixel(x + 1, y, color);
  display.drawPixel(x + 2, y, color);
  display.drawPixel(x, y + 1, color);
  display.drawPixel(x + 3, y + 1, color);
  display.fillRect(x, y + 2, 4, 4, color);
}

static void drawRow(int idx, int y) {
  const ApInfo &ap = gAps[idx];
  const bool selected = (idx == gSelected);
  const uint16_t fg = selected ? SSD1306_BLACK : SSD1306_WHITE;

  if (selected) {
    display.fillRect(0, y, SCREEN_W - 4, ROW_H, SSD1306_WHITE);
  }

  drawSignalBars(BAR_X, y, ap.rssi, fg);

  char label[SSID_COLS + 1];
  formatSsid(ap, label, sizeof(label));
  display.setTextColor(fg);
  display.setCursor(SSID_X, y + 2);
  display.print(label);

  char rssi[8];
  snprintf(rssi, sizeof(rssi), "%d", static_cast<int>(ap.rssi));
  const int tw = static_cast<int>(strlen(rssi)) * 6;
  display.setCursor(RSSI_RIGHT - tw, y + 2);
  display.print(rssi);
}

static void drawRows() {
  if (gApCount == 0) {
    const char *msg = gScanning ? "scanning..." : "no networks";
    const int w = static_cast<int>(strlen(msg)) * 6;
    display.setTextColor(SSD1306_WHITE);
    display.setCursor((SCREEN_W - w) / 2, 31);
    display.print(msg);
    return;
  }

  const int offset = static_cast<int>(lroundf(gScrollPx * ROW_H));
  for (int i = 0; i < gApCount; ++i) {
    const int y = LIST_TOP + i * ROW_H - offset;
    if (y + ROW_H <= LIST_TOP || y >= LIST_BOTTOM) continue;
    drawRow(i, y);  // 超出列表区的部分由标题栏/底部条覆盖
  }
}

static void drawHeader() {
  display.fillRect(0, 0, SCREEN_W, LIST_TOP, SSD1306_BLACK);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(2, 1);
  display.print("WiFi ");
  display.print(gApCount);

  char right[12];
  if (gScanning) {
    // 固定位置，避免点数量变化导致整段文字左右跳
    display.setCursor(84, 1);
    display.print("scan");
    const int lit = (millis() / 220) & 3;
    for (int i = 0; i < 3; ++i) {
      if (i < lit) display.fillRect(109 + i * 6, 5, 2, 2, SSD1306_WHITE);
    }
  } else {
    if (gApCount > 0 && gSelected < gApCount) {
      const ApInfo &ap = gAps[gSelected];
      snprintf(right, sizeof(right), "%d ch%u", static_cast<int>(ap.rssi),
               static_cast<unsigned>(ap.channel));
    } else {
      snprintf(right, sizeof(right), "idle");
    }
    const int w = static_cast<int>(strlen(right)) * 6;
    display.setCursor(SCREEN_W - 2 - w, 1);
    display.print(right);
  }

  // 选中项已加密时，在顶部状态区补一个小锁
  if (gApCount > 0 && gSelected < gApCount &&
      gAps[gSelected].auth != WIFI_AUTH_OPEN) {
    drawLock(HEADER_LOCK_X, 1, SSD1306_WHITE);
  }

  display.drawFastHLine(0, LIST_TOP - 1, SCREEN_W, SSD1306_WHITE);
}

static void drawScrollbar() {
  if (gApCount <= VISIBLE_ROWS) return;

  const int trackTop = LIST_TOP;
  const int trackH = LIST_BOTTOM - LIST_TOP;

  // 轨道：点状，避免和滑块糊成一条白线
  for (int y = trackTop; y < LIST_BOTTOM; y += 3) {
    display.drawPixel(SCROLL_X + 2, y, SSD1306_WHITE);
  }

  int thumbH = (trackH * VISIBLE_ROWS) / gApCount;
  if (thumbH < 10) thumbH = 10;

  const int maxScroll = maxScrollRow();
  float p = maxScroll > 0 ? (gScrollPx / static_cast<float>(maxScroll)) : 0.0f;
  if (p < 0.0f) p = 0.0f;
  if (p > 1.0f) p = 1.0f;

  const int y = trackTop + static_cast<int>(lroundf((trackH - thumbH) * p));
  display.fillRect(SCROLL_X, y, 3, thumbH, SSD1306_WHITE);
}

static void drawBottomStrip() {
  display.fillRect(0, LIST_BOTTOM, SCREEN_W, SCREEN_H - LIST_BOTTOM, SSD1306_BLACK);
  display.drawFastHLine(0, LIST_BOTTOM, SCREEN_W, SSD1306_WHITE);

  if (gScanning) {
    const int barW = 28;
    const int span = SCREEN_W + barW;
    const int x = static_cast<int>((millis() / 7) % span) - barW;
    display.fillRect(x, SCREEN_H - 2, barW, 2, SSD1306_WHITE);
  }
}

static void drawUi() {
  display.clearDisplay();
  drawRows();
  drawHeader();      // 后画，盖住平滑滚动时溢出到标题栏的内容
  drawBottomStrip(); // 同上
  drawScrollbar();
  display.display();
}

// ---------------------------------------------------------------- 扫描
static void startScan() {
  if (gScanning) return;

  gScanning = true;
  gScanStartedMs = millis();
  gNeedDraw = true;

  const int16_t ret = WiFi.scanNetworks(true /*async*/, false /*show_hidden*/);
  if (ret == WIFI_SCAN_FAILED) {
    gScanning = false;
    gLastScanMs = millis();
  }
}

static void applyResults(int n) {
  // 记住当前选中项的 BSSID，重扫后尽量停在同一个热点上
  uint8_t keepBssid[6] = {0};
  const bool keep = (gApCount > 0 && gSelected >= 0 && gSelected < gApCount);
  if (keep) {
    memcpy(keepBssid, gAps[gSelected].bssid, sizeof(keepBssid));
  }

  int count = 0;
  for (int i = 0; i < n; ++i) {
    const String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;  // 隐藏网络不显示

    ApInfo ap;
    strncpy(ap.ssid, ssid.c_str(), sizeof(ap.ssid) - 1);
    ap.ssid[sizeof(ap.ssid) - 1] = '\0';
    ap.rssi = static_cast<int8_t>(WiFi.RSSI(i));
    ap.channel = static_cast<uint8_t>(WiFi.channel(i));
    ap.auth = static_cast<uint8_t>(WiFi.encryptionType(i));

    const uint8_t *bssid = WiFi.BSSID(i);
    if (bssid != nullptr) {
      memcpy(ap.bssid, bssid, 6);
    } else {
      memset(ap.bssid, 0, 6);
    }

    if (count < MAX_APS) {
      gAps[count++] = ap;
    } else {
      // 超过上限时，用更强的热点替换当前最弱的一条
      int weakest = 0;
      for (int j = 1; j < count; ++j) {
        if (gAps[j].rssi < gAps[weakest].rssi) weakest = j;
      }
      if (ap.rssi > gAps[weakest].rssi) gAps[weakest] = ap;
    }
  }

  gApCount = count;
  sortByRssi();

  gSelected = 0;
  if (keep) {
    for (int i = 0; i < gApCount; ++i) {
      if (memcmp(gAps[i].bssid, keepBssid, 6) == 0) {
        gSelected = i;
        break;
      }
    }
  }

  const int maxScroll = maxScrollRow();
  if (gScrollRow > maxScroll) gScrollRow = maxScroll;
  ensureVisible();
  gNeedDraw = true;

  Serial.printf("[scan] %d APs, top: %s %d dBm\n", gApCount,
                gApCount > 0 ? gAps[0].ssid : "-", gApCount > 0 ? gAps[0].rssi : 0);
}

static void pollScan() {
  const int16_t n = WiFi.scanComplete();

  if (n == WIFI_SCAN_RUNNING) {
    if (millis() - gScanStartedMs > SCAN_TIMEOUT_MS) {
      WiFi.scanDelete();
      gScanning = false;
      gLastScanMs = millis();
      gNeedDraw = true;
      Serial.println("[scan] timeout");
    }
    return;
  }

  if (n >= 0) {
    applyResults(n);
  } else if (n == WIFI_SCAN_FAILED) {
    Serial.println("[scan] failed");
  }

  WiFi.scanDelete();
  gScanning = false;
  gLastScanMs = millis();
  gNeedDraw = true;
}

// ---------------------------------------------------------------- 按键
static bool gBtnRaw = true;      // true = 松开
static bool gBtnDown = false;
static bool gBtnLongFired = false;
static uint32_t gBtnDownMs = 0;
static uint32_t gBtnChangedMs = 0;

static void nextNetwork() {
  if (gApCount == 0) return;
  gSelected = (gSelected + 1) % gApCount;
  ensureVisible();
  gNeedDraw = true;
}

static void handleButton() {
  const bool raw = digitalRead(BTN_PIN);  // LOW = 按下
  const uint32_t now = millis();

  if (raw != gBtnRaw) {
    gBtnRaw = raw;
    gBtnChangedMs = now;
  }
  if (now - gBtnChangedMs < BTN_DEBOUNCE_MS) return;

  if (gBtnRaw == LOW && !gBtnDown) {
    gBtnDown = true;
    gBtnDownMs = now;
    gBtnLongFired = false;
  } else if (gBtnRaw == LOW && gBtnDown && !gBtnLongFired && now - gBtnDownMs >= BTN_LONG_MS) {
    gBtnLongFired = true;
    startScan();  // 长按：立即重扫
  } else if (gBtnRaw == HIGH && gBtnDown) {
    gBtnDown = false;
    if (!gBtnLongFired) nextNetwork();
  }
}

// ---------------------------------------------------------------- 动画
static void animateScroll(uint32_t now) {
  float dt = (now - gLastAnimMs) / 1000.0f;
  gLastAnimMs = now;
  if (dt > 0.1f) dt = 0.1f;

  const float target = static_cast<float>(gScrollRow);
  const float diff = target - gScrollPx;
  if (fabsf(diff) < 0.004f) {
    gScrollPx = target;
    return;
  }

  const float k = 1.0f - expf(-dt / 0.06f);  // 约 60ms 时间常数
  gScrollPx += diff * k;
}

// ---------------------------------------------------------------- 初始化
static uint8_t findOled() {
  const uint8_t candidates[] = {OLED_I2C_ADDR, 0x3D};
  for (const uint8_t addr : candidates) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) return addr;
  }
  return 0;
}

void setup() {
  Serial.begin(115200);

  pinMode(BTN_PIN, INPUT_PULLUP);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 400000);
  Wire.setClock(400000);

  uint8_t addr = findOled();
  if (addr == 0) {
    Serial.println("[oled] 0x3C/0x3D 都没响应，检查 SDA=GPIO4 / SCL=GPIO5 / 3V3 / GND");
    addr = OLED_I2C_ADDR;
  } else {
    Serial.printf("[oled] found at 0x%02X\n", addr);
  }

  if (!display.begin(SSD1306_SWITCHCAPVCC, addr, true, false)) {
    Serial.println("[oled] begin failed");
  }
  display.clearDisplay();
  display.display();

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  WiFi.setSleep(false);

  Serial.println();
  Serial.println("ESP32-C3 WiFi scanner");
  Serial.println("BOOT 短按=下一条 / 长按=重扫");

  gLastAnimMs = millis();
  startScan();
}

void loop() {
  const uint32_t now = millis();

  handleButton();

  if (gScanning) {
    pollScan();
  } else {
    // 没扫到任何热点时（可能是刚上电驱动还没就绪）3 秒后重试
    const uint32_t interval = (gApCount == 0) ? 3000 : SCAN_INTERVAL_MS;
    if (now - gLastScanMs >= interval) startScan();
  }

  animateScroll(now);

  const bool animating = fabsf(gScrollPx - static_cast<float>(gScrollRow)) > 0.005f;
  const bool scanFrame = gScanning && (now - gLastDrawMs >= 40);

  if (gNeedDraw || animating || scanFrame || (now - gLastDrawMs >= 1000)) {
    drawUi();
    gNeedDraw = false;
    gLastDrawMs = millis();
  }

  delay(5);
}
