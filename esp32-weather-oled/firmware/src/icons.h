/*
 * 天气图标：用几何图形现画，不占位图空间
 * -------------------------------------------------------------
 * 每枚图标都是 32x32，左上角对齐 (x, y)。
 * 太阳 / 月亮 / 云 / 雨滴 / 雪花 / 闪电都由圆、线、方块拼出来，
 * 换字体或换分辨率都不用重新做图。
 */
#pragma once

#include <U8g2lib.h>

#include "weather.h"

void iconDraw(U8G2 &g, int x, int y, Sky sky, bool isDay);
