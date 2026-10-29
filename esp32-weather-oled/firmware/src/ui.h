/*
 * OLED 界面
 * -------------------------------------------------------------
 * 只负责画，不碰网络和定时。所有坐标都是 128x64 上的像素。
 * 中文用 U8g2 的 wqy12 GB2312 字库，数字用 logisoso。
 */
#pragma once

#include <stdint.h>
#include <time.h>

#include "weather.h"

struct UiStatus {
  const char *city;
  time_t now;
  bool haveTime;
  bool wifiOk;
  bool stale;
  int rssi;
};

/** 初始化 I2C + OLED，返回 false 表示 0x3C / 0x3D 都没应答 */
bool uiBegin();

/** 设置对比度（夜间调光用） */
void uiContrast(uint8_t v);

/** 开机 / 等待画面 */
void uiBoot(const char *title, const char *detail);

/** 提示 / 错误页：标题 + 最多 3 行小字 */
void uiNotice(const char *title, const char *l1 = nullptr, const char *l2 = nullptr,
              const char *l3 = nullptr);

/** 主界面 */
void uiMain(const Weather &w, const UiStatus &st);

/** 配网引导页：热点名 + 网页地址，frame 用来让底部提示闪动 */
void uiProvision(const char *apName, const char *ip, uint32_t frame);
