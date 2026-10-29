/*
 * 单键输入：消抖 + 只上报「按下」这一条边沿。
 *
 * 游戏里只关心“刚刚按下了”，不关心按住多久、什么时候松开。
 * 每 33ms 的逻辑帧轮询一次就够，但循环里其实每毫秒都会调，
 * 所以手感不受帧率影响。
 */
#pragma once

#include <Arduino.h>

class Button {
 public:
  // activeLow = true：按下读到 LOW（BOOT 键就是这种，内部/板载上拉）
  void begin(uint8_t pin, bool activeLow);

  // 返回 true 表示“这一帧刚刚按下”，一次按下只会返回一次
  bool pressed(uint32_t nowMs);

 private:
  uint8_t pin_ = 255;
  bool activeLow_ = true;
  bool stable_ = false;       // 消抖后的状态，true = 按下
  bool lastRaw_ = false;      // 上一次读到的原始状态
  uint32_t lastChangeMs_ = 0; // 原始状态最后一次变化的时刻
};
