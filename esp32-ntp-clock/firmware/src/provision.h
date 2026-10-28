/*
 * WiFi 配网 + 配置存储
 * -------------------------------------------------------------
 * - 账号密码 / 时区存在 NVS（Preferences），掉电不丢
 * - 没配置过（或长按按钮 3 秒）就开一个开放热点 + 网页表单
 * - 手机连上热点后一般会自动弹出配网页；不弹就手动开 192.168.4.1
 */
#pragma once

#include <stddef.h>

struct ClockConfig {
  char ssid[33];
  char pass[65];
  char tz[48];       // POSIX TZ 字符串
  char tzLabel[12];  // 屏幕底栏的短标签
  bool hasWifi() const { return ssid[0] != '\0'; }
};

/** 从 NVS 读取配置；没有就用 secrets.h 里的默认值，再没有就用 config.h 的时区 */
void configLoad(ClockConfig &cfg, const char *defSsid, const char *defPass);

/** 写入 NVS */
void configStore(const ClockConfig &cfg);

/**
 * 进入配网模式（阻塞）。
 * 保存成功会直接 ESP.restart()，不会返回；超时返回 false。
 * apName 会被填成热点名（NTP-CLOCK-XXXX）。
 */
bool provisionRun(const ClockConfig &cfg, char *apName, size_t apNameLen);
