/*
 * Flappy Bird 的游戏逻辑与画面。
 *
 * 分工：
 *   main.cpp  负责硬件（I2C / 按键）和固定步长循环
 *   game.cpp  只管状态机、物理、碰撞、绘制
 *
 * 时间全部由外部传进来（now / step），方便单独调逻辑，也不依赖 millis()。
 */
#pragma once

#include <Arduino.h>

class Adafruit_SSD1306;

namespace game {

enum class State : uint8_t {
  Ready,     // 标题页，等第一次按键
  Playing,   // 游戏中
  Dying,     // 撞了：闪屏 + 坠落，不再接受输入
  GameOver,  // 结算面板，按键重开
};

void begin();                                   // 读 NVS 最高分，进入标题页
void onPress(uint32_t now);                     // 按键按下沿
void step(uint32_t now);                        // 逻辑帧，固定 30Hz 调用
void render(Adafruit_SSD1306 &g, uint32_t now); // 画一帧（不推 I2C）

State state();
uint16_t score();
uint16_t best();
const char *stateName(State s);

}  // namespace game
