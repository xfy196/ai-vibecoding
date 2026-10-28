/*
 * OLED 界面
 * -------------------------------------------------------------
 * 只负责画，不碰网络和睡眠。所有坐标都是 128x64 上的像素。
 */
#pragma once

#include <stdint.h>
#include <time.h>

struct ClockView {
  const struct tm *t;  // 本地时间
  bool  colonOn;       // 冒号是否点亮（每 30 秒翻一次）
  bool  synced;        // 是否成功校过时
  int   syncAgeMin;    // 距离上次成功校时多少分钟，-1 表示从没成功过
  bool  wifiOk;        // 上一次校时是否连上了网
  int   rssi;          // 上次校时的信号强度，0 表示未知
};

/** 初始化 I2C + OLED，返回 false 表示 0x3C / 0x3D 都没应答 */
bool uiBegin();

/** 开机画面 */
void uiBoot();

/** 阻塞操作的等待画面（WiFi / NTP），配合 uiBusyTick() 转圈 */
void uiBusy(const char *title, const char *detail);
void uiBusyTick();

/** 时钟主界面 */
void uiClock(const ClockView &v);

/** 底栏时区标签（配网里选的时区会覆盖 config.h 的默认值） */
void uiSetTzLabel(const char *label);

/** 配网引导页：热点名 + 网页地址，frame 用来让底部提示闪动 */
void uiProvision(const char *apName, const char *ip, uint32_t frame);

/** 提示 / 错误 / 诊断页：标题 + 最多 4 行小字 */
void uiNotice(const char *title, const char *l1, const char *l2 = nullptr,
              const char *l3 = nullptr, const char *l4 = nullptr);
