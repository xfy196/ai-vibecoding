/*
 * 天气数据：provider 适配 + JSON 解析
 * -------------------------------------------------------------
 * 默认 Open-Meteo：免 Key、HTTPS、JSON 简单，适合长期挂着的桌面设备。
 * 可选 OpenWeather：需要自己在官网申请 Key，配网页面里填。
 */
#pragma once

#include <Arduino.h>
#include <math.h>

#include <stddef.h>
#include <stdint.h>

#include "provision.h"

enum class Sky : uint8_t {
  Clear,
  Partly,
  Cloudy,
  Overcast,
  Fog,
  Drizzle,
  Rain,
  HeavyRain,
  Snow,
  Thunder,
  Unknown,
};

struct Weather {
  bool valid = false;
  Sky sky = Sky::Unknown;
  bool isDay = true;
  float temp = NAN;
  float feels = NAN;
  float tmax = NAN;
  float tmin = NAN;
  int humidity = -1;
  float windKph = NAN;
  int windDeg = -1;
  char text[20] = "";      // 中文短描述，最多 4 个汉字
  uint32_t fetchedAt = 0;  // Unix 时间；没校时的话是 0
};

/** 城市名 -> 经纬度（Open-Meteo Geocoding，免 Key） */
bool weatherGeocode(const char *city, float &lat, float &lon, String &resolved, String &err);

/** 拉取当前天气；失败时 out 不改动，err 是短句 */
bool weatherFetch(const AppConfig &cfg, Weather &out, String &err);

/** 兜底的中文描述 */
const char *skyText(Sky s);
