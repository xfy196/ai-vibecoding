#include "game.h"

#include <Adafruit_SSD1306.h>
#include <Preferences.h>
#include <esp_system.h>
#include <stdio.h>
#include <string.h>

#include "config.h"

namespace {

using game::State;

// ---------------------------------------------------------------- 数据
struct Pipe {
  float x;        // 左边缘
  int16_t gapY;   // 缺口上沿
  bool scored;    // 这一根是否已经计过分
};

struct Star {
  uint8_t x, y, len;
};

// 12x8，两帧：翅膀收起 / 翅膀下压。位图按行存，宽度 12 补齐到 2 字节。
const uint8_t BIRD_UP[] PROGMEM = {
    0x0F, 0x80, 0x3F, 0xC0, 0x7F, 0x60, 0xFF, 0xF0,
    0x7F, 0xE0, 0x3F, 0xC0, 0x1F, 0x80, 0x0F, 0x00,
};
const uint8_t BIRD_DOWN[] PROGMEM = {
    0x0F, 0x80, 0x3F, 0xC0, 0x7F, 0x60, 0xFF, 0xF0,
    0x7F, 0xE0, 0x3F, 0xC0, 0x7F, 0x00, 0xE7, 0x80,
};

// 背景里随水管一起左移的小星点，给“在往前飞”一点参照物。
const Star STARS[] = {
    {6, 24, 1},  {18, 12, 1},  {30, 30, 3},  {44, 20, 1},  {58, 36, 1},
    {70, 10, 1}, {82, 50, 1},  {96, 26, 3},  {108, 14, 1}, {118, 42, 1},
    {12, 54, 1}, {64, 52, 1},  {102, 34, 1}, {124, 20, 1},
};

State g_state = State::Ready;
Pipe g_pipes[PIPE_COUNT];
float g_birdY = READY_BIRD_Y;
float g_birdV = 0.0f;
uint16_t g_score = 0;
uint16_t g_best = 0;
bool g_newBest = false;
uint32_t g_stateMs = 0;   // 进入当前状态的时刻
uint32_t g_ticks = 0;     // 逻辑帧计数，给动画用
uint16_t g_scroll = 0;    // 背景滚动，0..1279
int16_t g_lastGapY = PIPE_MIN_GAP_Y;
Preferences g_prefs;

// ---------------------------------------------------------------- 小工具
int16_t randomGap(int16_t prev) {
  const int16_t span = 2 * PIPE_GAP_JITTER + 1;
  int16_t v = prev + (int16_t)(esp_random() % span) - PIPE_GAP_JITTER;
  if (v < PIPE_MIN_GAP_Y) v = PIPE_MIN_GAP_Y;
  if (v > PIPE_MAX_GAP_Y) v = PIPE_MAX_GAP_Y;
  return v;
}

bool overlap(float ax, float ay, float aw, float ah, float bx, float by, float bw,
             float bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

void loadBest() {
  g_prefs.begin(NVS_NAMESPACE, true);
  g_best = g_prefs.getUShort(NVS_KEY_BEST, 0);
  g_prefs.end();
}

void saveBest() {
  g_prefs.begin(NVS_NAMESPACE, false);
  g_prefs.putUShort(NVS_KEY_BEST, g_best);
  g_prefs.end();
}

void setState(State s, uint32_t now) {
  if (s == g_state) return;
  Serial.printf("[game] %s -> %s\n", game::stateName(g_state), game::stateName(s));
  g_state = s;
  g_stateMs = now;
}

// ---------------------------------------------------------------- 状态迁移
void startRound(uint32_t now) {
  g_score = 0;
  g_newBest = false;
  g_birdY = (PLAY_TOP + GROUND_Y - BIRD_H) / 2.0f;
  g_birdV = FLAP_VY;  // 开局先扇一下翅膀，手感更直接

  g_lastGapY = PIPE_MIN_GAP_Y +
               (int16_t)(esp_random() % (PIPE_MAX_GAP_Y - PIPE_MIN_GAP_Y + 1));
  for (uint8_t i = 0; i < PIPE_COUNT; ++i) {
    g_pipes[i].x = SCREEN_W - 12 + i * PIPE_SPACING;
    g_pipes[i].gapY = randomGap(g_lastGapY);
    g_pipes[i].scored = false;
    g_lastGapY = g_pipes[i].gapY;
  }

  setState(State::Playing, now);
  Serial.printf("[game] start  score=0 best=%u\n", game::best());
}

void crash(uint32_t now) {
  if (g_state != State::Playing) return;

  if (g_score > g_best) {
    g_best = g_score;
    g_newBest = true;
    saveBest();
  }
  Serial.printf("[game] crash  score=%u best=%u\n", g_score, g_best);
  setState(State::Dying, now);
}

void flap() {
  g_birdV = FLAP_VY;
}

// ---------------------------------------------------------------- 绘制
void centerText(Adafruit_SSD1306 &g, int y, uint8_t size, const char *text,
                uint16_t color) {
  g.setTextSize(size);
  g.setTextColor(color);
  const int16_t w = (int16_t)strlen(text) * 6 * size;
  g.setCursor((SCREEN_W - w) / 2, y);
  g.print(text);
}

void drawBackground(Adafruit_SSD1306 &g) {
  const int off = g_scroll % SCREEN_W;
  for (const Star &s : STARS) {
    int x = (int)s.x - off;
    if (x < 0) x += SCREEN_W;
    if (x + s.len <= SCREEN_W) {
      g.drawFastHLine(x, s.y, s.len, 1);
    } else {
      const int first = SCREEN_W - x;
      g.drawFastHLine(x, s.y, first, 1);
      g.drawFastHLine(0, s.y, s.len - first, 1);
    }
  }

  // 地面：一条实线 + 两排交错的短划线，随背景一起滚。
  g.drawFastHLine(0, GROUND_Y, SCREEN_W, 1);
  const int goff = g_scroll % 12;
  for (int x = -goff; x < SCREEN_W; x += 12) {
    g.drawFastHLine(x, GROUND_Y + 2, 6, 1);
    g.drawFastHLine(x + 6, GROUND_Y + 4, 6, 1);
  }
}

void drawPipes(Adafruit_SSD1306 &g) {
  for (const Pipe &p : g_pipes) {
    const int x = (int)p.x;
    if (x > SCREEN_W || x + PIPE_WIDTH < 0) continue;

    const int topH = p.gapY;
    const int botY = p.gapY + PIPE_GAP;

    // 管身只画边框，露出天空，单色屏上更容易和鸟区分。
    g.drawRect(x, 0, PIPE_WIDTH, topH, 1);
    g.drawRect(x, botY, PIPE_WIDTH, GROUND_Y - botY, 1);

    // 缺口两侧的加宽管口。
    g.fillRect(x - 2, topH - 4, PIPE_WIDTH + 4, 4, 1);
    g.fillRect(x - 2, botY, PIPE_WIDTH + 4, 4, 1);
  }
}

void drawBird(Adafruit_SSD1306 &g, int x, int y, const uint8_t *frame) {
  g.drawBitmap(x, y, frame, BIRD_W, BIRD_H, 1);
}

void drawReady(Adafruit_SSD1306 &g, uint32_t now) {
  static const int8_t bob[] = {0, 1, 2, 3, 3, 2, 1, 0, -1, -2, -3, -3, -2, -1};
  const int birdY = READY_BIRD_Y + bob[(g_ticks / 3) % (sizeof(bob) / sizeof(bob[0]))];
  const uint8_t *frame = ((g_ticks / 8) & 1) ? BIRD_DOWN : BIRD_UP;

  centerText(g, 4, 2, "FLAPPY", 1);
  centerText(g, 21, 2, "BIRD", 1);
  drawBird(g, READY_BIRD_X, birdY, frame);

  if (((now / 500) & 1) == 0) {
    centerText(g, 40, 1, "PRESS BOOT", 1);
  }

  char buf[16];
  snprintf(buf, sizeof(buf), "BEST %u", (unsigned)g_best);
  centerText(g, 51, 1, buf, 1);
}

void drawHud(Adafruit_SSD1306 &g) {
  char buf[8];
  snprintf(buf, sizeof(buf), "%u", (unsigned)g_score);

  const int16_t w = (int16_t)strlen(buf) * 12;
  const int16_t x = (SCREEN_W - w) / 2;

  // 先在 8 个方向描一圈黑边，再画白字：水管从顶部穿过时数字依然清楚，
  // 又不会像一整块黑条那样把管子切断。
  g.setTextSize(2);
  g.setTextColor(0);
  for (int8_t dy = -1; dy <= 1; ++dy) {
    for (int8_t dx = -1; dx <= 1; ++dx) {
      if (dx == 0 && dy == 0) continue;
      g.setCursor(x + dx, dy);
      g.print(buf);
    }
  }

  g.setTextColor(1);
  g.setCursor(x, 0);
  g.print(buf);
}

void drawGameOverPanel(Adafruit_SSD1306 &g, uint32_t now) {
  g.fillRoundRect(8, 8, 112, 42, 5, 1);

  centerText(g, 10, 1, "GAME OVER", 0);

  char buf[24];
  snprintf(buf, sizeof(buf), "%u", (unsigned)g_score);
  centerText(g, 18, 2, buf, 0);

  if (g_newBest) {
    snprintf(buf, sizeof(buf), "BEST %u  NEW!", (unsigned)g_best);
  } else {
    snprintf(buf, sizeof(buf), "BEST %u", (unsigned)g_best);
  }
  centerText(g, 34, 1, buf, 0);

  // 提示放在面板内部，别压到地上的小鸟和地面线。
  if (((now / 450) & 1) == 0) {
    centerText(g, 42, 1, "BOOT = RETRY", 0);
  }
}

const uint8_t *birdFrame() {
  if (g_state == State::Playing) {
    return ((g_ticks / 4) & 1) ? BIRD_DOWN : BIRD_UP;
  }
  if (g_state == State::Ready) {
    return ((g_ticks / 8) & 1) ? BIRD_DOWN : BIRD_UP;
  }
  return BIRD_DOWN;  // Dying / GameOver：翅膀摊开
}

}  // namespace

// ---------------------------------------------------------------- 对外接口
namespace game {

void begin() {
  loadBest();

  g_state = State::Ready;
  g_stateMs = millis();
  g_birdY = READY_BIRD_Y;
  g_birdV = 0.0f;
  g_ticks = 0;
  g_scroll = 0;
  g_score = 0;

  Serial.printf("[game] ready  best=%u\n", (unsigned)g_best);
}

void onPress(uint32_t now) {
  switch (g_state) {
    case State::Ready:
      startRound(now);
      break;

    case State::Playing:
      flap();
      break;

    case State::Dying:
      break;  // 撞击后锁输入，别让乱按影响动画

    case State::GameOver:
      if ((uint32_t)(now - g_stateMs) >= RETRY_LOCK_MS) {
        startRound(now);
      }
      break;
  }
}

void step(uint32_t now) {
  ++g_ticks;

  if (g_state == State::Ready || g_state == State::Playing) {
    g_scroll = (g_scroll + 1) % (SCREEN_W * 10);
  }

  switch (g_state) {
    case State::Ready:
      break;

    case State::Playing: {
      // 鸟
      g_birdV += GRAVITY;
      if (g_birdV > VY_MAX) g_birdV = VY_MAX;
      g_birdY += g_birdV;

      if (g_birdY < PLAY_TOP) {  // 撞天花板：贴边、不掉速度
        g_birdY = PLAY_TOP;
        if (g_birdV < 0.0f) g_birdV = 0.0f;
      }

      // 水管：左移、计分、从右边回收
      for (Pipe &p : g_pipes) {
        p.x -= PIPE_SPEED;

        if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) {
          p.scored = true;
          if (g_score < 999) ++g_score;
        }

        if (p.x < -PIPE_WIDTH - 4) {
          p.x += PIPE_COUNT * PIPE_SPACING;
          p.gapY = randomGap(g_lastGapY);
          g_lastGapY = p.gapY;
          p.scored = false;
        }
      }

      // 碰撞：用内缩过的矩形，避免“擦边就死”的挫败感
      const float hx = BIRD_X + BIRD_HIT_INSET;
      const float hy = g_birdY + BIRD_HIT_INSET;
      const float hw = BIRD_W - 2 * BIRD_HIT_INSET;
      const float hh = BIRD_H - 2 * BIRD_HIT_INSET;

      bool hit = false;
      for (const Pipe &p : g_pipes) {
        if (overlap(hx, hy, hw, hh, p.x, 0, PIPE_WIDTH, p.gapY) ||
            overlap(hx, hy, hw, hh, p.x, p.gapY + PIPE_GAP, PIPE_WIDTH,
                    GROUND_Y - (p.gapY + PIPE_GAP))) {
          hit = true;
          break;
        }
      }

      if (hit || g_birdY + BIRD_H >= GROUND_Y) {
        crash(now);
      }
      break;
    }

    case State::Dying: {
      g_birdV += GRAVITY;
      if (g_birdV > VY_MAX) g_birdV = VY_MAX;
      g_birdY += g_birdV;

      const float floorY = GROUND_Y - BIRD_H;
      if (g_birdY > floorY) {
        g_birdY = floorY;
        g_birdV = 0.0f;
      }

      if ((uint32_t)(now - g_stateMs) >= DEATH_ANIM_MS) {
        setState(State::GameOver, now);
      }
      break;
    }

    case State::GameOver:
      break;
  }
}

void render(Adafruit_SSD1306 &g, uint32_t now) {
  // 撞击后的头 240ms 用硬件反色闪两下，比逐像素取反便宜。
  bool flash = false;
  if (g_state == State::Dying) {
    const uint32_t t = now - g_stateMs;
    flash = (t < 240) && (((t / 60) & 1) != 0);
  }
  static bool flashApplied = false;
  if (flash != flashApplied) {
    g.invertDisplay(flash);
    flashApplied = flash;
  }

  g.clearDisplay();
  drawBackground(g);

  if (g_state == State::Ready) {
    drawReady(g, now);
  } else {
    drawPipes(g);
    drawBird(g, BIRD_X, (int)(g_birdY + 0.5f), birdFrame());

    if (g_state == State::GameOver) {
      // 结算面板自己显示本局分数，再画顶部 HUD 会被面板切掉一半。
      drawGameOverPanel(g, now);
    } else {
      drawHud(g);
    }
  }
}

State state() { return g_state; }
uint16_t score() { return g_score; }
uint16_t best() { return g_best; }

const char *stateName(State s) {
  switch (s) {
    case State::Ready: return "ready";
    case State::Playing: return "playing";
    case State::Dying: return "dying";
    case State::GameOver: return "gameover";
  }
  return "?";
}

}  // namespace game
