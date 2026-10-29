#pragma once

#include <Arduino.h>
#include <U8g2lib.h>

// 一个场景 = 一个名字 + 进入时初始化 + 每帧绘制
struct Scene {
  const char *name;
  void (*setup)(U8G2 &g);
  void (*update)(U8G2 &g, uint32_t now, uint32_t elapsed);
};

extern const Scene kScenes[];
extern const uint8_t kSceneCount;

// 主循环里统计出来的帧率，HUD 场景会用
extern volatile uint16_t gFps;

// 用芯片硬件随机数给场景里的 xorshift 播种
void scenesSeed(uint32_t seed);
