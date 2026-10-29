#include "weather.h"

#include <Arduino.h>
#include <ArduinoJson.h>

#include <stdio.h>
#include <string.h>

#include "config.h"
#include "net.h"

namespace {

// ---------------------------------------------------------------- UTF-8
int utf8Len(uint8_t c) {
  if ((c & 0x80) == 0) return 1;
  if ((c & 0xE0) == 0xC0) return 2;
  if ((c & 0xF0) == 0xE0) return 3;
  if ((c & 0xF8) == 0xF0) return 4;
  return 1;
}

int utf8Count(const char *s) {
  int n = 0;
  for (size_t i = 0; s[i];) {
    i += utf8Len((uint8_t)s[i]);
    ++n;
  }
  return n;
}

// 按「字符」截断，避免把一个汉字劈成两半
void copyUtf8(char *dst, size_t dstSize, const char *src, int maxChars) {
  if (!dst || dstSize == 0) return;
  dst[0] = '\0';
  if (!src) return;
  size_t o = 0;
  int n = 0;
  for (size_t i = 0; src[i] && n < maxChars; ++n) {
    const int len = utf8Len((uint8_t)src[i]);
    if (o + (size_t)len + 1 > dstSize) break;
    memcpy(dst + o, src + i, (size_t)len);
    o += (size_t)len;
    i += (size_t)len;
  }
  dst[o] = '\0';
}

// ---------------------------------------------------------------- 天气代码映射
Sky skyFromWmo(int code) {
  switch (code) {
    case 0:
    case 1:
      return code == 0 ? Sky::Clear : Sky::Partly;
    case 2:
      return Sky::Partly;
    case 3:
      return Sky::Overcast;
    case 45:
    case 48:
      return Sky::Fog;
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return Sky::Drizzle;
    case 61:
    case 63:
    case 66:
    case 67:
    case 80:
    case 81:
      return Sky::Rain;
    case 65:
    case 82:
      return Sky::HeavyRain;
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return Sky::Snow;
    case 95:
    case 96:
    case 99:
      return Sky::Thunder;
    default:
      return Sky::Unknown;
  }
}

const char *wmoText(int code) {
  switch (code) {
    case 0: return "晴";
    case 1: return "晴间多云";
    case 2: return "多云";
    case 3: return "阴";
    case 45:
    case 48: return "雾";
    case 51:
    case 53:
    case 55: return "毛毛雨";
    case 56:
    case 57: return "冻雨";
    case 61: return "小雨";
    case 63: return "中雨";
    case 65: return "大雨";
    case 66:
    case 67: return "冻雨";
    case 71: return "小雪";
    case 73: return "中雪";
    case 75: return "大雪";
    case 77: return "米雪";
    case 80: return "阵雨";
    case 81: return "强阵雨";
    case 82: return "暴雨";
    case 85:
    case 86: return "阵雪";
    case 95: return "雷阵雨";
    case 96:
    case 99: return "雷暴冰雹";
    default: return "未知";
  }
}

Sky skyFromOwm(int id) {
  if (id >= 200 && id < 300) return Sky::Thunder;
  if (id >= 300 && id < 400) return Sky::Drizzle;
  if (id >= 500 && id < 600) {
    if (id == 502 || id == 503 || id == 504 || id == 522) return Sky::HeavyRain;
    return Sky::Rain;
  }
  if (id >= 600 && id < 700) return Sky::Snow;
  if (id >= 700 && id < 800) return Sky::Fog;
  if (id == 800) return Sky::Clear;
  if (id == 801) return Sky::Partly;
  if (id == 802 || id == 803) return Sky::Cloudy;
  if (id == 804) return Sky::Overcast;
  return Sky::Unknown;
}

}  // namespace

const char *skyText(Sky s) {
  switch (s) {
    case Sky::Clear: return "晴";
    case Sky::Partly: return "多云";
    case Sky::Cloudy: return "多云";
    case Sky::Overcast: return "阴";
    case Sky::Fog: return "雾";
    case Sky::Drizzle: return "毛毛雨";
    case Sky::Rain: return "小雨";
    case Sky::HeavyRain: return "大雨";
    case Sky::Snow: return "小雪";
    case Sky::Thunder: return "雷阵雨";
    default: return "未知";
  }
}

bool weatherGeocode(const char *city, float &lat, float &lon, String &resolved, String &err) {
  err = "";
  resolved = "";
  if (!city || city[0] == '\0') {
    err = "城市为空";
    return false;
  }

  String url = "https://geocoding-api.open-meteo.com/v1/search?name=";
  url += urlEncode(city);
  url += "&count=1&language=zh&format=json";

  String body;
  if (!netHttpGet(url, body, err, PROVIDER_OPEN_METEO)) return false;

  JsonDocument doc;
  const DeserializationError e = deserializeJson(doc, body);
  if (e) {
    err = "JSON 解析失败";
    if (DEBUG_SERIAL && Serial) Serial.printf("[geo] json: %s\n", e.c_str());
    return false;
  }

  JsonObject r = doc["results"][0];
  if (r.isNull()) {
    err = "找不到这个城市";
    return false;
  }

  lat = r["latitude"] | NAN;
  lon = r["longitude"] | NAN;
  if (!(lat == lat) || !(lon == lon)) {
    err = "城市数据异常";
    return false;
  }

  resolved = String((const char *)(r["name"] | ""));
  if (!r["admin1"].isNull()) {
    resolved += " ";
    resolved += (const char *)(r["admin1"] | "");
  }
  if (DEBUG_SERIAL && Serial) {
    Serial.printf("[geo] %s -> %s (%.4f, %.4f)\n", city, resolved.c_str(), lat, lon);
  }
  return true;
}

bool weatherFetch(const AppConfig &cfg, Weather &out, String &err) {
  err = "";
  if (!cfg.hasLocation()) {
    err = "还没有经纬度";
    return false;
  }

  char url[512];
  if (cfg.provider == PROVIDER_OPENWEATHER) {
    if (cfg.apiKey[0] == '\0') {
      err = "缺少 API Key";
      return false;
    }
    snprintf(url, sizeof url,
             "https://api.openweathermap.org/data/2.5/weather?lat=%.4f&lon=%.4f"
             "&appid=%s&units=metric&lang=zh_cn",
             cfg.lat, cfg.lon, cfg.apiKey);
  } else {
    snprintf(url, sizeof url,
             "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f"
             "&current=temperature_2m,relative_humidity_2m,apparent_temperature,"
             "is_day,weather_code,wind_speed_10m,wind_direction_10m"
             "&daily=weather_code,temperature_2m_max,temperature_2m_min"
             "&timezone=auto&forecast_days=1",
             cfg.lat, cfg.lon);
  }

  String body;
  if (!netHttpGet(url, body, err, cfg.provider)) return false;

  JsonDocument doc;
  const DeserializationError e = deserializeJson(doc, body);
  if (e) {
    err = "JSON 解析失败";
    if (DEBUG_SERIAL && Serial) {
      Serial.printf("[weather] json: %s  body=%.160s\n", e.c_str(), body.c_str());
    }
    return false;
  }

  Weather w;
  w.fetchedAt = netEpoch();

  if (cfg.provider == PROVIDER_OPENWEATHER) {
    if (doc["weather"][0].isNull()) {
      err = doc["message"] | "数据为空";
      return false;
    }
    const int id = doc["weather"][0]["id"] | 800;
    const String icon = doc["weather"][0]["icon"] | "01d";
    w.sky = skyFromOwm(id);
    w.isDay = !icon.endsWith("n");
    w.temp = doc["main"]["temp"] | NAN;
    w.feels = doc["main"]["feels_like"] | NAN;
    w.tmax = doc["main"]["temp_max"] | NAN;
    w.tmin = doc["main"]["temp_min"] | NAN;
    w.humidity = doc["main"]["humidity"] | -1;

    const float windMs = doc["wind"]["speed"] | NAN;
    w.windKph = (windMs == windMs) ? windMs * 3.6f : NAN;
    w.windDeg = doc["wind"]["deg"] | -1;

    const char *desc = doc["weather"][0]["description"] | "";
    if (utf8Count(desc) >= 1 && utf8Count(desc) <= 4) {
      copyUtf8(w.text, sizeof w.text, desc, 4);
    } else {
      copyUtf8(w.text, sizeof w.text, skyText(w.sky), 4);
    }
  } else {
    if (doc["error"].as<bool>()) {
      err = doc["reason"] | "数据为空";
      return false;
    }
    JsonObject cur = doc["current"];
    if (cur.isNull()) {
      err = "数据为空";
      return false;
    }

    const int code = cur["weather_code"] | -1;
    w.sky = skyFromWmo(code);
    w.isDay = (cur["is_day"] | 1) != 0;
    w.temp = cur["temperature_2m"] | NAN;
    w.feels = cur["apparent_temperature"] | NAN;
    w.humidity = cur["relative_humidity_2m"] | -1;
    w.windKph = cur["wind_speed_10m"] | NAN;
    w.windDeg = cur["wind_direction_10m"] | -1;
    w.tmax = doc["daily"]["temperature_2m_max"][0] | NAN;
    w.tmin = doc["daily"]["temperature_2m_min"][0] | NAN;
    copyUtf8(w.text, sizeof w.text, wmoText(code), 4);
  }

  if (!(w.temp == w.temp)) {
    err = "没有温度数据";
    return false;
  }
  if (w.text[0] == '\0') copyUtf8(w.text, sizeof w.text, skyText(w.sky), 4);
  w.valid = true;

  if (DEBUG_SERIAL && Serial) {
    Serial.printf("[weather] %s %.1fC %s %s hum=%d age=%lu\n", cfg.city, w.temp,
                  w.text, w.isDay ? "day" : "night", w.humidity,
                  (unsigned long)w.fetchedAt);
  }
  out = w;
  return true;
}
