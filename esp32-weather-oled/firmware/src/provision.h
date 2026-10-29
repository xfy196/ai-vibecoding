/*
 * WiFi 配网 + 配置存储
 * -------------------------------------------------------------
 * - WiFi / 城市 / 经纬度 / 时区 / 数据源 / API Key 存在 NVS，掉电不丢
 * - 没配置过，或按住按钮 3 秒，就开热点 WEATHER-XXXX + 网页表单
 * - 手机连上热点后一般会自动弹出配网页；不弹就手动开 192.168.4.1
 */
#pragma once

#include <stddef.h>
#include <stdint.h>

enum : uint8_t {
  PROVIDER_OPEN_METEO = 0,
  PROVIDER_OPENWEATHER = 1,
};

struct AppConfig {
  char ssid[33];
  char pass[65];
  char city[24];
  float lat;   // NAN 表示还没定位
  float lon;   // NAN 表示还没定位
  char tz[48]; // POSIX TZ 字符串
  uint8_t provider;
  char apiKey[64]; // OpenWeather 用；Open-Meteo 留空

  bool hasWifi() const { return ssid[0] != '\0'; }
  bool hasLocation() const {
    return lat == lat && lon == lon && lat >= -90.0f && lat <= 90.0f &&
           lon >= -180.0f && lon <= 180.0f;
  }
};

/** 从 NVS 读取配置；没有就用 secrets.h（可选）和 config.h 的默认值 */
void configLoad(AppConfig &cfg);

/** 写入 NVS */
void configStore(const AppConfig &cfg);

/**
 * 进入配网模式（阻塞）。
 * 保存成功会直接 ESP.restart()，不会返回；超时返回 false。
 * apName 会被填成热点名（WEATHER-XXXX）。
 */
bool provisionRun(const AppConfig &cfg, char *apName, size_t apNameLen);
