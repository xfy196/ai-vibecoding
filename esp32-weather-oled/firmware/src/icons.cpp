#include "icons.h"

#include <Arduino.h>
#include <math.h>

namespace {

// 实心云：三个圆 + 一条底边，宽约 25px、高约 15px
void cloudBig(U8G2 &g, int x, int y) {
  g.drawDisc(x + 11, y + 13, 5);
  g.drawDisc(x + 19, y + 10, 7);
  g.drawDisc(x + 26, y + 13, 5);
  g.drawBox(x + 9, y + 13, 19, 5);
}

// 小云，用于「多云」图标，右下角 20x12 左右
void cloudSmall(U8G2 &g, int x, int y) {
  g.drawDisc(x + 15, y + 17, 4);
  g.drawDisc(x + 21, y + 15, 5);
  g.drawDisc(x + 26, y + 17, 4);
  g.drawBox(x + 13, y + 17, 15, 4);
}

void sun(U8G2 &g, int cx, int cy, int r) {
  g.drawDisc(cx, cy, r);
  for (int i = 0; i < 8; ++i) {
    const float a = (float)i * (PI / 4.0f);
    const int x1 = cx + (int)lroundf(cosf(a) * (r + 2));
    const int y1 = cy + (int)lroundf(sinf(a) * (r + 2));
    const int x2 = cx + (int)lroundf(cosf(a) * (r + 5));
    const int y2 = cy + (int)lroundf(sinf(a) * (r + 5));
    g.drawLine(x1, y1, x2, y2);
    // 加一点厚度，小屏上更醒目
    const int ox = (int)lroundf(-sinf(a));
    const int oy = (int)lroundf(cosf(a));
    g.drawLine(x1 + ox, y1 + oy, x2 + ox, y2 + oy);
  }
}

void moon(U8G2 &g, int cx, int cy, int r) {
  g.drawDisc(cx, cy, r);
  g.setDrawColor(0);
  g.drawDisc(cx + (r / 2), cy - (r / 2), r - 1);
  g.setDrawColor(1);
}

void star(U8G2 &g, int cx, int cy) {
  g.drawLine(cx - 2, cy, cx + 2, cy);
  g.drawLine(cx, cy - 2, cx, cy + 2);
}

void raindrop(U8G2 &g, int x, int y, int len, int slant) {
  g.drawLine(x, y, x - slant, y + len);
  g.drawLine(x + 1, y, x + 1 - slant, y + len);
}

void snowflake(U8G2 &g, int cx, int cy) {
  g.drawLine(cx - 2, cy - 2, cx + 2, cy + 2);
  g.drawLine(cx - 2, cy + 2, cx + 2, cy - 2);
  g.drawLine(cx - 2, cy, cx + 2, cy);
  g.drawLine(cx, cy - 2, cx, cy + 2);
}

}  // namespace

void iconDraw(U8G2 &g, int x, int y, Sky sky, bool isDay) {
  g.setDrawColor(1);

  switch (sky) {
    case Sky::Clear:
      if (isDay) {
        sun(g, x + 16, y + 16, 6);
      } else {
        moon(g, x + 15, y + 15, 8);
        star(g, x + 26, y + 6);
        star(g, x + 5, y + 24);
      }
      break;

    case Sky::Partly:
      if (isDay) {
        sun(g, x + 9, y + 9, 4);
      } else {
        moon(g, x + 9, y + 8, 5);
        star(g, x + 26, y + 5);
      }
      cloudSmall(g, x + 2, y + 3);
      break;

    case Sky::Cloudy:
      cloudBig(g, x, y + 2);
      break;

    case Sky::Overcast:
      cloudBig(g, x, y + 1);
      // 两道黑色缝隙，让实心云看起来像两层
      g.setDrawColor(0);
      g.drawLine(x + 10, y + 8, x + 24, y + 8);
      g.drawLine(x + 8, y + 12, x + 27, y + 12);
      g.setDrawColor(1);
      break;

    case Sky::Fog:
      cloudBig(g, x, y - 2);
      g.drawLine(x + 5, y + 22, x + 23, y + 22);
      g.drawLine(x + 10, y + 26, x + 29, y + 26);
      g.drawLine(x + 3, y + 30, x + 19, y + 30);
      break;

    case Sky::Drizzle:
      cloudBig(g, x, y - 3);
      raindrop(g, x + 11, y + 21, 4, 1);
      raindrop(g, x + 19, y + 21, 4, 1);
      raindrop(g, x + 27, y + 21, 4, 1);
      break;

    case Sky::Rain:
      cloudBig(g, x, y - 3);
      raindrop(g, x + 10, y + 20, 7, 2);
      raindrop(g, x + 18, y + 20, 7, 2);
      raindrop(g, x + 26, y + 20, 7, 2);
      break;

    case Sky::HeavyRain:
      cloudBig(g, x, y - 4);
      raindrop(g, x + 8, y + 19, 10, 2);
      raindrop(g, x + 15, y + 19, 10, 2);
      raindrop(g, x + 22, y + 19, 10, 2);
      raindrop(g, x + 29, y + 19, 10, 2);
      break;

    case Sky::Snow:
      cloudBig(g, x, y - 3);
      snowflake(g, x + 9, y + 24);
      snowflake(g, x + 18, y + 27);
      snowflake(g, x + 27, y + 23);
      break;

    case Sky::Thunder: {
      cloudBig(g, x, y - 3);
      const int bx = x + 19;
      g.drawLine(bx - 1, y + 17, bx - 5, y + 24);
      g.drawLine(bx, y + 17, bx - 4, y + 24);
      g.drawLine(bx - 5, y + 24, bx - 1, y + 24);
      g.drawLine(bx - 4, y + 24, bx, y + 24);
      g.drawLine(bx - 1, y + 24, bx - 6, y + 31);
      g.drawLine(bx, y + 24, bx - 5, y + 31);
      break;
    }

    case Sky::Unknown:
    default:
      cloudBig(g, x, y + 2);
      g.drawPixel(x + 13, y + 24);
      g.drawPixel(x + 18, y + 24);
      g.drawPixel(x + 23, y + 24);
      break;
  }
}
