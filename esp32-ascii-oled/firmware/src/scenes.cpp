#include "scenes.h"
#include "config.h"

#include <math.h>
#include <string.h>

// ============================================================
//  六个场景：数字雨 / 跳动的心 / 示波器 / ASCII 帧动画 /
//            随机数老虎机 / U8g2 绘图能力演示
//
//  约定：
//    - 每个场景自己 clear 之外的所有绘制都在 update() 里完成
//    - 所有坐标都是 128x64 逻辑像素，y 向下
//    - 字体位置默认是基线（baseline），drawStr 的 y = 字底
// ============================================================

namespace {

constexpr float PI_F = 3.14159265f;

// ---------- 小工具 ----------

// xorshift32：比 random() 快，也不会和 Arduino 的全局种子互相影响
uint32_t gRng = 0x9E3779B9u;

inline uint32_t rnd32() {
  gRng ^= gRng << 13;
  gRng ^= gRng >> 17;
  gRng ^= gRng << 5;
  return gRng;
}

inline uint32_t rndN(uint32_t n) { return rnd32() % n; }

inline int16_t rndRange(int16_t lo, int16_t hi) {
  return (int16_t)(lo + (int16_t)rndN((uint32_t)(hi - lo + 1)));
}

// ============================================================
//  1. 数字雨
//     6x10 等宽字体 → 128/6 = 21 列；每列一个雨滴，头部反白
// ============================================================

constexpr uint8_t RAIN_COLS = 21;
constexpr uint8_t RAIN_CELL_H = 9;  // 字符行距，比字高略小才有雨丝感
const char kRainChars[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\|+*=";
constexpr uint8_t RAIN_CHAR_N = sizeof(kRainChars) - 1;

struct RainDrop {
  int16_t y;         // 头部基线
  uint8_t len;       // 尾巴长度（字符数）
  uint16_t stepMs;   // 每落一格的间隔
  uint32_t nextMs;   // 下一次下落的时间戳
};

RainDrop gRain[RAIN_COLS];

void rainSpawn(uint8_t i, bool scatter) {
  RainDrop &d = gRain[i];
  d.y = scatter ? rndRange(-72, -8) : rndRange(-30, 0);
  d.len = (uint8_t)rndRange(3, 8);
  d.stepMs = (uint16_t)rndRange(RAIN_STEP_MS - 16, RAIN_STEP_MS + 24);
  d.nextMs = millis() + rndN(120);
}

void rainSetup(U8G2 &) {
  for (uint8_t i = 0; i < RAIN_COLS; ++i) rainSpawn(i, true);
}

void rainUpdate(U8G2 &g, uint32_t now, uint32_t) {
  for (uint8_t i = 0; i < RAIN_COLS; ++i) {
    RainDrop &d = gRain[i];
    if ((int32_t)(now - d.nextMs) >= 0) {
      d.nextMs = now + d.stepMs;
      d.y += 4;
      if (d.y - (int16_t)d.len * RAIN_CELL_H > 64) rainSpawn(i, false);
    }
  }

  g.setFont(u8g2_font_6x10_tf);

  for (uint8_t i = 0; i < RAIN_COLS; ++i) {
    const RainDrop &d = gRain[i];
    const int16_t x = (int16_t)i * 6;

    // 尾巴：每帧随机换字，才有闪烁感
    for (uint8_t j = d.len; j >= 1; --j) {
      const int16_t y = d.y - (int16_t)j * RAIN_CELL_H;
      if (y < 8 || y > 64) continue;
      char s[2] = {kRainChars[rndN(RAIN_CHAR_N)], 0};
      g.drawStr(x, y, s);
    }

    // 头部：整格反白 + 挖掉一个字
    if (d.y >= 8 && d.y <= 64) {
      char s[2] = {kRainChars[rndN(RAIN_CHAR_N)], 0};
      g.setDrawColor(1);
      g.drawBox(x, d.y - 8, 6, 9);
      g.setDrawColor(0);
      g.drawStr(x, d.y, s);
      g.setDrawColor(1);
    }
  }
}

// ============================================================
//  2. 跳动的心
//     参数方程画心形轮廓，再按行做扫描线填充；
//     心跳用「两下」的包络（咚—咚），底部跑一条心电小波形
// ============================================================

constexpr uint8_t HEART_SAMPLES = 240;
int16_t gHeartX[HEART_SAMPLES + 1];
int16_t gHeartY[HEART_SAMPLES + 1];

// 64 个采样点的心电图（相对基线的高度）
const int8_t kEcg[64] = {
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 2, 4, 7, 9, -6, -3, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
};

void heartSetup(U8G2 &) {}

void heartUpdate(U8G2 &g, uint32_t now, uint32_t) {
  const float t = (float)(now % 1000) / 1000.0f;

  // 一次心跳 = 一个主波 + 一个小的回弹波
  float beat = 0.0f;
  if (t < 0.10f) {
    beat = sinf(t / 0.10f * PI_F);
  } else if (t > 0.16f && t < 0.30f) {
    beat = 0.55f * sinf((t - 0.16f) / 0.14f * PI_F);
  }

  const float s = 1.0f + 0.16f * beat;
  const float cx = 64.0f;
  const float cy = 26.0f;

  // 先把心形轮廓算成一条闭合折线
  for (uint16_t i = 0; i <= HEART_SAMPLES; ++i) {
    const float a = (float)i * (2.0f * PI_F) / (float)HEART_SAMPLES;
    const float sa = sinf(a);
    const float hx = 16.0f * sa * sa * sa;
    const float hy = 13.0f * cosf(a) - 5.0f * cosf(2.0f * a) -
                     2.0f * cosf(3.0f * a) - cosf(4.0f * a);
    gHeartX[i] = (int16_t)lroundf(cx + hx * 1.9f * s);
    gHeartY[i] = (int16_t)lroundf(cy - hy * 1.45f * s);
  }

  // 扫描线填充：每行找出与折线的交点，排序后两两连线
  int16_t cross[8];
  for (int16_t y = 0; y < 64; ++y) {
    uint8_t n = 0;
    for (uint16_t i = 0; i < HEART_SAMPLES; ++i) {
      const int16_t y0 = gHeartY[i];
      const int16_t y1 = gHeartY[i + 1];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        const int16_t x0 = gHeartX[i];
        const float k = (float)(y - y0) / (float)(y1 - y0);
        const int16_t x =
            (int16_t)lroundf(x0 + k * (float)(gHeartX[i + 1] - x0));
        if (n < 8) cross[n++] = x;
      }
    }
    for (uint8_t a = 1; a < n; ++a) {  // 交点很少，插入排序够了
      const int16_t v = cross[a];
      int8_t b = (int8_t)a - 1;
      while (b >= 0 && cross[b] > v) {
        cross[b + 1] = cross[b];
        --b;
      }
      cross[b + 1] = v;
    }
    for (uint8_t k = 0; k + 1 < n; k += 2) {
      if (cross[k] < cross[k + 1]) g.drawLine(cross[k], y, cross[k + 1], y);
    }
  }

  // 底部心电波形（向左滚）
  const int16_t baseY = 60;
  int16_t prevY = baseY;
  for (int16_t x = 0; x < 128; ++x) {
    const int16_t idx = (int16_t)((x + (int16_t)(now / 8)) & 63);
    const int16_t y = baseY - kEcg[idx];
    if (x > 0) g.drawLine(x - 1, prevY, x, y);
    prevY = y;
  }

  // 左上角心率 + 右上角随心跳闪烁的点
  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2, 6, "72 BPM");
  if (beat > 0.05f) g.drawDisc(124, 3, 2);
}

// ============================================================
//  3. 示波器
//     环形缓冲 + 500Hz 采样，画成一条会向左滚的波形
// ============================================================

constexpr uint8_t SCOPE_N = 128;
int16_t gScope[SCOPE_N];
uint8_t gScopeHead = 0;
uint32_t gScopeNextUs = 0;
float gScopePhase = 0.0f;

void scopeSetup(U8G2 &) {
  for (uint8_t i = 0; i < SCOPE_N; ++i) gScope[i] = 32;
  gScopeHead = 0;
  gScopeNextUs = micros();
  gScopePhase = 0.0f;
}

void scopeUpdate(U8G2 &g, uint32_t, uint32_t) {
  const uint32_t t = micros();

  // 落后太多（比如刚切场景）就直接对齐，避免一次补几百个点
  if ((int32_t)(t - gScopeNextUs) > 200000) gScopeNextUs = t;

  uint8_t guard = 0;
  while ((int32_t)(t - gScopeNextUs) >= 0 && guard++ < 40) {
    gScopeNextUs += SCOPE_SAMPLE_US;

#if SCOPE_USE_ADC
    const int raw = analogRead(PIN_SCOPE_ADC);
    gScope[gScopeHead] = (int16_t)map(raw, 0, 4095, 63, 0);
#else
    gScopePhase += 2.0f * PI_F * 6.5f * (SCOPE_SAMPLE_US / 1000000.0f);
    if (gScopePhase > 2.0f * PI_F) gScopePhase -= 2.0f * PI_F;
    const float v = sinf(gScopePhase) * 0.78f +
                    sinf(gScopePhase * 3.0f + 1.1f) * 0.16f +
                    ((int32_t)rndN(200) - 100) * 0.0016f;
    gScope[gScopeHead] = (int16_t)lroundf(32.0f - v * 26.0f);
#endif

    gScopeHead = (uint8_t)((gScopeHead + 1) % SCOPE_N);
  }

  // 点阵网格
  for (uint8_t x = 0; x < 128; x += 8)
    for (uint8_t y = 0; y < 64; y += 4) g.drawPixel(x, y);
  for (uint8_t y = 0; y < 64; y += 8)
    for (uint8_t x = 0; x < 128; x += 4) g.drawPixel(x, y);
  g.drawLine(0, 32, 127, 32);  // 0V 中线

  // 波形：最老的点在 head，按时间顺序连线
  int16_t prevY = gScope[gScopeHead];
  int16_t lo = 63, hi = 0;
  for (uint8_t i = 1; i < SCOPE_N; ++i) {
    const int16_t y = gScope[(gScopeHead + i) % SCOPE_N];
    g.drawLine((int16_t)(i - 1), prevY, (int16_t)i, y);
    prevY = y;
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }

  // 左上角读数（先挖黑底，压住网格）
  char buf[20];
  g.setDrawColor(0);
  g.drawBox(0, 0, 62, 9);
  g.setDrawColor(1);
  g.setFont(u8g2_font_4x6_tf);
#if SCOPE_USE_ADC
  snprintf(buf, sizeof(buf), "ADC  %.1fV", (hi - lo) * 3.3f / 63.0f);
#else
  snprintf(buf, sizeof(buf), "6.5Hz  Vpp%.1fV", (hi - lo) * 3.3f / 63.0f);
#endif
  g.drawStr(2, 6, buf);

  // 右上角 RUN 指示
  if ((millis() / 400) & 1) {
    g.setDrawColor(0);
    g.drawBox(110, 0, 18, 9);
    g.setDrawColor(1);
    g.drawStr(114, 6, "RUN");
  }
}

// ============================================================
//  4. ASCII 帧动画
//     7x5 的字符小人，4 帧走路循环 + 滚动地面
// ============================================================

constexpr uint8_t WALK_FRAMES = 4;
constexpr uint8_t WALK_ROWS = 5;
const char *const kWalk[WALK_FRAMES][WALK_ROWS] = {
    {"   O   ", "  /|\\  ", "   |   ", "  / \\  ", " /   \\ "},
    {"   O   ", "  /|\\  ", "   |   ", "   |   ", "  / \\  "},
    {"   O   ", "  /|\\  ", "   |   ", "  / \\  ", " \\   / "},
    {"   O   ", "  /|\\  ", "   |   ", "   |   ", "  | |  "},
};

uint8_t gWalkFrame = 0;
uint32_t gWalkNext = 0;

void walkSetup(U8G2 &) {
  gWalkFrame = 0;
  gWalkNext = 0;
}

void walkUpdate(U8G2 &g, uint32_t now, uint32_t) {
  if ((int32_t)(now - gWalkNext) >= 0) {
    gWalkNext = now + 140;
    gWalkFrame = (uint8_t)((gWalkFrame + 1) % WALK_FRAMES);
  }

  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2, 6, "ASCII WALK");
  g.drawStr(96, 6, "140MS");

  // 小人：7 字 x 6px = 42px 宽，居中在 x=43
  g.setFont(u8g2_font_6x10_tf);
  const int16_t x0 = 43;
  const int16_t bob = (gWalkFrame & 1) ? 0 : -1;  // 上下颠一下
  for (uint8_t r = 0; r < WALK_ROWS; ++r) {
    g.drawStr(x0, 16 + (int16_t)r * 10 + bob, kWalk[gWalkFrame][r]);
  }

  // 向左滚的地面虚线
  const int16_t off = (int16_t)((now / 10) % 12);
  for (int16_t x = -off; x < 128; x += 12) {
    g.drawLine(x, 58, x + 5, 58);
  }

  // 身后的小速度线
  for (uint8_t i = 0; i < 3; ++i) {
    const int16_t len = 8 - i * 2;
    const int16_t x = 40 - (int16_t)((now / (14 + i * 8) + i * 23) % 44);
    g.drawLine(x - len, 22 + i * 11, x, 22 + i * 11);
  }

  char buf[16];
  snprintf(buf, sizeof(buf), "FRAME %u/%u", (unsigned)(gWalkFrame + 1),
           (unsigned)WALK_FRAMES);
  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2, 63, buf);
}

// ============================================================
//  5. 随机数老虎机
//     三位数滚动 → 依次锁死；底部是随机数直方图
// ============================================================

uint8_t gDigit[3] = {0, 0, 0};
bool gDigitLocked[3] = {false, false, false};
uint32_t gDigitNext[3] = {0, 0, 0};
uint32_t gSpinStart = 0;
uint32_t gSpinNext = 0;
uint8_t gHist[16];

void randomSetup(U8G2 &) {
  gSpinStart = millis();
  gSpinNext = gSpinStart + 3000;
  for (uint8_t i = 0; i < 3; ++i) gDigitLocked[i] = false;
  for (uint8_t i = 0; i < 16; ++i) gHist[i] = (uint8_t)rndRange(2, 12);
}

void randomUpdate(U8G2 &g, uint32_t now, uint32_t) {
  if ((int32_t)(now - gSpinNext) >= 0) {
    gSpinStart = now;
    gSpinNext = now + 3000;
    for (uint8_t i = 0; i < 3; ++i) gDigitLocked[i] = false;
    for (uint8_t i = 0; i < 16; ++i) gHist[i] = (uint8_t)rndRange(2, 12);
  }

  const uint32_t e = now - gSpinStart;
  for (uint8_t i = 0; i < 3; ++i) {
    const uint32_t lockAt = 900 + (uint32_t)i * 320;
    if (e < lockAt) {
      if ((int32_t)(now - gDigitNext[i]) >= 0) {
        gDigitNext[i] = now + 40 + (uint32_t)i * 15;
        gDigit[i] = (uint8_t)rndN(10);
      }
    } else if (!gDigitLocked[i]) {
      gDigitLocked[i] = true;
      gDigit[i] = (uint8_t)rndN(10);
    }
  }

  // 标题
  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2, 6, "RANDOM // ESP32");
  const char *tag = "ESP32 RNG";
  g.drawStr(128 - (int16_t)g.getStrWidth(tag) - 2, 6, tag);

  // 三位大数字
  g.setFont(u8g2_font_logisoso24_tn);
  char d[3][2];
  int16_t w[3];
  for (uint8_t i = 0; i < 3; ++i) {
    d[i][0] = (char)('0' + gDigit[i]);
    d[i][1] = 0;
    w[i] = (int16_t)g.getStrWidth(d[i]);
  }
  int16_t x = 64 - (w[0] + w[1] + w[2] + 12) / 2;
  for (uint8_t i = 0; i < 3; ++i) {
    g.drawStr(x, 44, d[i]);
    x += w[i] + 6;
  }

  g.drawLine(8, 48, 120, 48);

  // 直方图：16 根柱子，代表这一轮的随机分布
  for (uint8_t i = 0; i < 16; ++i) {
    const int16_t h = gHist[i];
    g.drawBox((int16_t)i * 8 + 1, 63 - h, 6, h);
  }
}

// ============================================================
//  6. U8g2 绘图能力演示（HUD）
//     大号字 / 旋转六边形 / 内存条 / 帧率柱状图
// ============================================================

uint8_t gFpsHist[62];
uint8_t gFpsHistIdx = 0;
uint32_t gFpsSampleMs = 0;

void hudSetup(U8G2 &) {
  memset(gFpsHist, 0, sizeof(gFpsHist));
  gFpsHistIdx = 0;
  gFpsSampleMs = 0;
}

void hudUpdate(U8G2 &g, uint32_t now, uint32_t) {
  char buf[24];

  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2, 6, "U8G2 // SYSTEM");
  snprintf(buf, sizeof(buf), "UP %02lu:%02lu", (unsigned long)(now / 60000),
           (unsigned long)((now / 1000) % 60));
  g.drawStr(128 - (int16_t)g.getStrWidth(buf) - 2, 6, buf);

  // 大号帧率
  g.setFont(u8g2_font_10x20_tf);
  snprintf(buf, sizeof(buf), "%u", (unsigned)gFps);
  g.drawStr(2, 30, buf);
  g.setFont(u8g2_font_4x6_tf);
  g.drawStr(2 + (int16_t)g.getStrWidth(buf) + 4, 30, "FPS");

  // 旋转六边形 + 同心圆
  const float rot = (float)now / 600.0f;
  int16_t px[6], py[6];
  for (uint8_t i = 0; i < 6; ++i) {
    const float a = rot + (float)i * PI_F / 3.0f;
    px[i] = (int16_t)lroundf(102.0f + cosf(a) * 12.0f);
    py[i] = (int16_t)lroundf(22.0f + sinf(a) * 12.0f);
  }
  for (uint8_t i = 0; i < 6; ++i) {
    const uint8_t j = (uint8_t)((i + 1) % 6);
    g.drawLine(px[i], py[i], px[j], py[j]);
  }
  g.drawCircle(102, 22, 7);

  // 内存条
  const uint32_t freeHeap = ESP.getFreeHeap();
  const uint32_t totalHeap = 320UL * 1024UL;
  int16_t used = (int16_t)((totalHeap - freeHeap) * 120UL / totalHeap);
  if (used < 0) used = 0;
  if (used > 120) used = 120;

  snprintf(buf, sizeof(buf), "HEAP %luK", (unsigned long)(freeHeap / 1024UL));
  g.drawStr(2, 37, buf);
  g.drawFrame(2, 39, 124, 6);
  g.drawBox(3, 40, used, 4);

  // 帧率历史柱状图
  if ((int32_t)(now - gFpsSampleMs) >= 0) {
    gFpsSampleMs = now + 120;
    gFpsHist[gFpsHistIdx] = (uint8_t)(gFps > 60 ? 60 : gFps);
    gFpsHistIdx = (uint8_t)((gFpsHistIdx + 1) % 62);
  }
  for (uint8_t i = 0; i < 62; ++i) {
    const uint8_t v = gFpsHist[(gFpsHistIdx + i) % 62];
    const int16_t h = (int16_t)(v / 4);
    if (h > 0) g.drawBox(2 + (int16_t)i * 2, 62 - h, 1, h);
  }
}

}  // namespace

// ============================================================
//  场景表
// ============================================================

const Scene kScenes[] = {
    {"DIGITAL RAIN", rainSetup, rainUpdate},
    {"BEATING HEART", heartSetup, heartUpdate},
    {"OSCILLOSCOPE", scopeSetup, scopeUpdate},
    {"ASCII WALK", walkSetup, walkUpdate},
    {"RANDOM NUMBERS", randomSetup, randomUpdate},
    {"U8G2 PRIMITIVES", hudSetup, hudUpdate},
};

const uint8_t kSceneCount = (uint8_t)(sizeof(kScenes) / sizeof(kScenes[0]));

void scenesSeed(uint32_t seed) { gRng = seed ? seed : 0x9E3779B9u; }
