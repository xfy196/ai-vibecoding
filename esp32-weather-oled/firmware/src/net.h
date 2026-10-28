/*
 * 网络小工具：WiFi / SNTP / HTTPS GET
 * -------------------------------------------------------------
 * 这一层只负责「连上、对时、把 JSON 文本拿回来」，
 * 具体字段怎么解析在 weather.cpp 里。
 */
#pragma once

#include <Arduino.h>

#include "provision.h"

/** 连接 WiFi（阻塞）。成功返回 true 并打印 IP / RSSI。 */
bool netConnect(const AppConfig &cfg, uint32_t timeoutMs);

/** 当前是否连着 WiFi */
bool netIsConnected();

int netRssi();

/** 系统时间是否已经可信（SNTP 成功过） */
bool netTimeValid();

/**
 * 触发 SNTP 并等待时间可用（阻塞，timeoutMs 毫秒）。tz 是 POSIX 时区串。
 * force=false：时间已经可信就直接返回；
 * force=true ：即使时间可用也重新注水（用于每 N 小时纠正 RTC 漂移）。
 */
bool netSyncTime(const char *tz, uint32_t timeoutMs, bool force = false);

/** 当前 Unix 时间（秒）；时间不可信时返回 0 */
uint32_t netEpoch();

/**
 * HTTPS GET，返回 body。
 * provider 只用来选择证书（TLS_VERIFY=1 时）。
 * 失败时 err 里是给屏幕看的短句。
 */
bool netHttpGet(const String &url, String &body, String &err, uint8_t provider);

/** URL 百分号编码（城市名是 UTF-8，必须编码） */
String urlEncode(const String &s);
