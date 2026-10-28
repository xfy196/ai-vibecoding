/*
 * ESP32-C3 SuperMini · 0.96" OLED NTP 网络时钟
 * =============================================================
 * 功能
 *   - 连 WiFi，SNTP 校时，按 POSIX TZ 字符串换算本地时间（支持夏令时）
 *   - 七段大字号 HH:MM，顶栏日期星期 + WiFi 信号，底栏时区 + 校时状态
 *   - 深睡到下一个 30 秒 / 分钟边界，醒来只做「刷新屏幕」这一件事
 *   - 每 SYNC_INTERVAL_MIN 分钟联网校一次时；用实测误差自动补偿 RC 计时漂移
 *   - 手机网页配网：没配置过就开热点 NTP-CLOCK-XXXX，连上填 SSID / 密码 / 时区
 *   - IO3 外接按钮（可选）：短按立即校时，长按 1.2s 看诊断页，按住 3s 重新配网
 *
 * 接线（以模块丝印为准）
 *   OLED VCC -> 3V3      OLED SDA -> IO4
 *   OLED GND -> GND      OLED SCL -> IO5
 *   按钮一端 -> IO3，另一端 -> GND
 *
 * 时间基准存在 RTC 内存里，深睡和复位都不丢；只有彻底断电才需要重新联网校时。
 * WiFi 账号密码存在 NVS 里，掉电不丢。
 */

#include <Arduino.h>
#include <WiFi.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <esp_timer.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include <sys/time.h>
#include <time.h>

#include "config.h"
#include "provision.h"
#include "ui.h"

#if __has_include("secrets.h")
#include "secrets.h"
#else
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#endif

#if BTN_ENABLED && BTN_PIN > 5
#error "ESP32-C3 只有 GPIO0–GPIO5 能从深睡唤醒，BTN_PIN 超范围了"
#endif

// ---------------------------------------------------------------- 掉电保持
// RTC 内存：深睡不丢、复位不丢、拔电才丢。
static const uint32_t STATE_MAGIC = 0x4E545044;  // "NTPD"

struct Persist {
  uint32_t magic;
  uint8_t  haveTime;     // 有没有可信的时间基准
  uint8_t  lastSyncOk;   // 上一次校时是否成功
  uint8_t  driftDirty;   // 本次间隔里被按钮提前叫醒过，漂移样本不可信
  uint8_t  failStreak;   // 连续失败次数，攒够 3 次又没时间就转去配网
  int16_t  lastRssi;
  int64_t  nowUs;        // 本次唤醒时刻的 UTC 微秒
  int64_t  sleepStartUs; // 上一次进入深睡时的 UTC 微秒
  int64_t  wakeAtUs;     // 上一次睡前计划唤醒的时刻（UTC 微秒）
  int64_t  nextSyncUs;   // 下次该校时的时刻
  int64_t  lastSyncUs;   // 上次成功校时的时刻
  int64_t  accumUs;      // 上次校时以来「内部计时」走过的微秒（含清醒时间）
  int32_t  scalePpm;     // 深睡计时补偿：内部比真实快/慢多少 ppm
  uint32_t boots;
  uint32_t syncs;
};

RTC_DATA_ATTR static Persist g;

static ClockConfig gCfg;        // NVS 里的 WiFi / 时区配置
static int64_t gBootUs = 0;     // 本次开机的 esp_timer 起点
static bool    gForceSync = false;
static bool    gShowDiag = false;
static bool    gWantProvision = false;
static char    gIp[16] = "--";

// ---------------------------------------------------------------- 时间
static inline int64_t timeNowUs() {
  return g.nowUs + (esp_timer_get_time() - gBootUs);
}

static bool syncDue() {
  if (!g.haveTime) return true;
  return timeNowUs() >= g.nextSyncUs;
}

static ClockView buildView(int64_t us) {
  static struct tm tmv;
  const time_t sec = (time_t)(us / 1000000LL);
  localtime_r(&sec, &tmv);

  ClockView v;
  v.t = &tmv;
#if CLOCK_BLINK_COLON
  v.colonOn = ((sec / 30) & 1) == 0;
#else
  v.colonOn = true;
#endif
  v.synced = g.syncs > 0;
  v.syncAgeMin = (g.lastSyncUs > 0) ? (int)((us - g.lastSyncUs) / 60000000LL) : -1;
  v.wifiOk = (v.syncAgeMin >= 0 && v.syncAgeMin < SYNC_INTERVAL_MIN * 2);
  v.rssi = g.lastRssi;
  return v;
}

static void drawClockNow() { uiClock(buildView(timeNowUs())); }

// ---------------------------------------------------------------- 联网
static bool connectWiFi() {
  uiBusy("WIFI CONNECT", gCfg.ssid);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(false);
  WiFi.setSleep(false);
  WiFi.begin(gCfg.ssid, gCfg.pass);

  const uint32_t t0 = millis();
  while (millis() - t0 < WIFI_CONNECT_TIMEOUT_MS) {
    if (WiFi.status() == WL_CONNECTED) {
      g.lastRssi = (int16_t)WiFi.RSSI();
      snprintf(gIp, sizeof gIp, "%s", WiFi.localIP().toString().c_str());
      if (Serial) {
        Serial.printf("[wifi] %s  %d dBm  %lums\n", gIp, (int)g.lastRssi,
                      (unsigned long)(millis() - t0));
      }
      return true;
    }
    uiBusyTick();
    delay(20);
  }

  if (Serial) Serial.printf("[wifi] timeout, status=%d\n", (int)WiFi.status());
  return false;
}

static bool fetchNtp(int64_t &outUs) {
  uiBusy("NTP SYNC", NTP_SERVER_1);
  configTzTime(gCfg.tz, NTP_SERVER_1, NTP_SERVER_2, NTP_SERVER_3);

  const uint32_t t0 = millis();
  while (millis() - t0 < NTP_TIMEOUT_MS) {
    struct timeval tv;
    if (gettimeofday(&tv, nullptr) == 0 && tv.tv_sec > 1700000000) {
      outUs = (int64_t)tv.tv_sec * 1000000LL + (int64_t)tv.tv_usec;
      return true;
    }
    uiBusyTick();
    delay(30);
  }
  return false;
}

/**
 * 采用 SNTP 时间，并顺便量一下深睡计时误差。
 * 深睡时 RTC 计时器跑的是内部 RC，和真实秒长有千分之几的偏差；
 * 用「上次校时到现在真正过了多久」对比「内部计时走了多久」就能算出补偿系数，
 * 下次睡前按比例缩放 sleep 时长，分钟跳变就不会越走越偏。
 */
static void applyNtp(int64_t ntpUs) {
  const int64_t awakeUs = esp_timer_get_time() - gBootUs;

  if (g.lastSyncUs > 0 && g.accumUs > 0 && g.syncs >= 1 && !g.driftDirty) {
    const int64_t trueElapsed = ntpUs - g.lastSyncUs;
    const int64_t internalElapsed = g.accumUs + awakeUs;
    if (trueElapsed > 5LL * 60000000LL && internalElapsed > 1000000LL) {
      const double k = (double)trueElapsed / (double)internalElapsed;  // 真实秒 / 内部秒
      int32_t ppm = (int32_t)lround((1.0 / k - 1.0) * 1e6);
      if (ppm > 50000) ppm = 50000;
      if (ppm < -50000) ppm = -50000;
      if (g.syncs <= 1) {
        g.scalePpm = ppm;
      } else {
        g.scalePpm = (g.scalePpm * 3 + ppm) / 4;  // 平滑一下
      }
      if (Serial) {
        Serial.printf("[drift] %+ld ppm  scale %+ld ppm\n", (long)ppm,
                      (long)g.scalePpm);
      }
    }
  }

  g.nowUs = ntpUs;
  gBootUs = esp_timer_get_time();
  g.lastSyncUs = ntpUs;
  g.accumUs = 0;
  g.driftDirty = 0;
  g.haveTime = 1;
  g.failStreak = 0;
  g.nextSyncUs = ntpUs + (int64_t)SYNC_INTERVAL_MIN * 60000000LL;
  g.syncs++;
}

static void noteSyncFailure() {
  g.lastSyncOk = 0;
  if (g.failStreak < 255) g.failStreak++;
  g.nextSyncUs = timeNowUs() + (int64_t)SYNC_RETRY_MIN * 60000000LL;
  if (!g.haveTime) g.nowUs = 0;
}

// ---------------------------------------------------------------- 校时流程
static void syncAndDraw(bool wantDiag) {
  if (!gCfg.hasWifi()) {
    noteSyncFailure();
    uiNotice("NO WIFI", "hold btn 3s", "to set up wifi", "retry in 5 min");
    return;
  }

  if (!connectWiFi()) {
    noteSyncFailure();
    WiFi.mode(WIFI_OFF);
    if (g.haveTime) {
      drawClockNow();
    } else {
      uiNotice("WIFI FAILED", "check ssid / password", "or 2.4G signal", "retry in 5 min");
    }
    return;
  }

  int64_t ntpUs = 0;
  const bool ok = fetchNtp(ntpUs);
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);

  if (!ok) {
    noteSyncFailure();
    if (g.haveTime) {
      drawClockNow();
    } else {
      uiNotice("NTP FAILED", "udp 123 blocked?", "router / dns?", "retry in 5 min");
    }
    return;
  }

  g.lastSyncOk = 1;
  applyNtp(ntpUs);
  drawClockNow();

  if (wantDiag) {
    char l1[24], l2[24], l3[24], l4[24];
    struct tm tmv;
    const time_t sec = (time_t)(ntpUs / 1000000LL);
    localtime_r(&sec, &tmv);
    snprintf(l1, sizeof l1, "IP   %s", gIp);
    snprintf(l2, sizeof l2, "RSSI %d dBm", (int)g.lastRssi);
    snprintf(l3, sizeof l3, "DRIFT %+.2f%%", g.scalePpm / 10000.0);
    snprintf(l4, sizeof l4, "SYNC %02d:%02d #%lu", tmv.tm_hour, tmv.tm_min,
             (unsigned long)g.syncs);
    uiNotice("DIAG", l1, l2, l3, l4);
    delay(DIAG_HOLD_SEC * 1000);
    drawClockNow();
  }
}

// ---------------------------------------------------------------- 深睡 / 调试保持清醒
/**
 * 正常模式进深睡（不返回）；DEBUG_KEEP_AWAKE 时用 delay 顶满周期后返回，
 * 这样原生 USB CDC 不会掉，串口监视器能一直挂着。
 */
static void armWake(uint64_t us) {
#if DEBUG_KEEP_AWAKE
  g.driftDirty = 1;  // delay 路径别拿去算深睡漂移
  if (Serial) {
    Serial.printf("[debug] stay awake %lu ms (USB CDC kept)\n",
                  (unsigned long)(us / 1000ULL));
  }
  // 切开睡，按键还能响应；到点就返回给 loop 继续跑
  uint64_t left = us;
  while (left > 0) {
#if BTN_ENABLED
    if (digitalRead(BTN_PIN) == LOW) {
      const uint32_t t0 = millis();
      uint32_t held = 0;
      while (digitalRead(BTN_PIN) == LOW && held < BTN_PROVISION_MS + 3000) {
        delay(5);
        held = millis() - t0;
      }
      gWantProvision = held >= BTN_PROVISION_MS;
      gShowDiag = !gWantProvision && held >= BTN_LONG_MS;
      gForceSync = true;
      const uint32_t t1 = millis();
      const uint32_t waitMs = gWantProvision ? 15000 : 5000;
      while (digitalRead(BTN_PIN) == LOW && millis() - t1 < waitMs) delay(10);
      if (Serial) {
        Serial.printf("[debug] btn held %lums provision=%d diag=%d\n",
                      (unsigned long)held, (int)gWantProvision, (int)gShowDiag);
      }
      return;
    }
#endif
    const uint32_t slice = left > 50000ULL ? 50UL : (uint32_t)(left / 1000ULL);
    if (slice == 0) break;
    delay(slice);
    left = (left > (uint64_t)slice * 1000ULL) ? left - (uint64_t)slice * 1000ULL : 0;
  }
#else
#if BTN_ENABLED
  // C3 没有 ext1，用的是 GPIO 深睡唤醒：低电平触发，内部上拉由 IDF 自己开关。
  gpio_pullup_en((gpio_num_t)BTN_PIN);
  gpio_pulldown_dis((gpio_num_t)BTN_PIN);
  esp_deep_sleep_enable_gpio_wakeup(1ULL << BTN_PIN, ESP_GPIO_WAKEUP_GPIO_LOW);
#endif
  esp_sleep_enable_timer_wakeup(us);
  esp_deep_sleep_start();
#endif
}

/**
 * 非整点对齐的睡眠：配网重试 / 没时间基准时的等待。
 * 有时间基准时顺手把 nowUs 推到醒来那一刻，避免醒来后时间停在睡前。
 */
static void sleepFor(uint64_t us, const char *why) {
  if (g.haveTime) {
    const int64_t now = timeNowUs();
    g.sleepStartUs = now;
    g.nowUs = now + (int64_t)us;
    g.wakeAtUs = g.nowUs;
    g.accumUs += esp_timer_get_time() - gBootUs + (int64_t)us;
    g.driftDirty = 1;  // 这段不是正常刷新间隔，别拿它算漂移
  }
  if (Serial) Serial.printf("[sleep] %lus (%s)\n", (unsigned long)(us / 1000000ULL), why);
  armWake(us);
}

static void sleepNow() {
  if (gWantProvision) {
    sleepFor((uint64_t)PROVISION_RETRY_SEC * 1000000ULL, "provision retry");
    return;
  }

  if (!g.haveTime) {
    sleepFor((uint64_t)NO_TIME_RETRY_SEC * 1000000ULL, "no time base");
    return;
  }

  const int64_t now = timeNowUs();
  const int64_t period = CLOCK_BLINK_COLON ? 30000000LL : 60000000LL;
  int64_t target = (now / period + 1) * period;
  if (target - now < 2000000LL) target += period;  // 太近了就再等一个周期

  const int64_t desired = target - now;

  // 内部计时已经走过的部分：清醒时间 + 本次要睡的时长（按补偿系数缩放后）
  g.accumUs += esp_timer_get_time() - gBootUs;
  const int64_t req = desired + desired * g.scalePpm / 1000000LL;

  g.sleepStartUs = now;
  g.nowUs = target;
  g.wakeAtUs = target;
  g.accumUs += req;

  if (Serial) {
    time_t ts = (time_t)(target / 1000000LL);
    struct tm tmv;
    localtime_r(&ts, &tmv);
    char stamp[12];
    strftime(stamp, sizeof stamp, "%H:%M:%S", &tmv);
    Serial.printf("[sleep] %.2fs -> %s (ppm %+ld)\n", req / 1e6, stamp,
                  (long)g.scalePpm);
  }

  armWake((uint64_t)req);
}

// ---------------------------------------------------------------- 配网
/**
 * 开热点 + 网页表单。保存成功会直接重启（不返回）；
 * 超时则睡 5 分钟，醒来如果还是没配置就再来一次。
 */
static void startProvisioning() {
  if (Serial) Serial.println("[setup] entering provisioning");
  g.failStreak = 0;
  g.nextSyncUs = 0;  // 配网保存重启后立刻校一次时，别用配网前的旧时间硬撑

  char apName[24];
  if (!provisionRun(gCfg, apName, sizeof apName)) {
    uiNotice("SETUP TIMEOUT", "nothing saved", "hold btn 3s to retry", "sleep 5 min");
    delay(1500);
    gWantProvision = true;
    sleepNow();  // 不会返回
  }
}

// ---------------------------------------------------------------- 入口
void setup() {
  gBootUs = esp_timer_get_time();

  const esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
  const bool coldBoot = cause == ESP_SLEEP_WAKEUP_UNDEFINED;
  const bool btnWake = cause == ESP_SLEEP_WAKEUP_GPIO || cause == ESP_SLEEP_WAKEUP_EXT1;

  if (g.magic != STATE_MAGIC) {
    memset(&g, 0, sizeof g);
    g.magic = STATE_MAGIC;
    gBootUs = esp_timer_get_time();
  } else if (cause == ESP_SLEEP_WAKEUP_TIMER && g.haveTime) {
    g.nowUs = g.wakeAtUs;  // 定时唤醒：按计划时刻对齐
  } else if (btnWake && g.haveTime) {
    // 按钮唤醒拿不到真实睡眠时长，只能先用「睡前时刻」兜底，
    // 短按本来就会立刻校时，校完就准了。
    g.nowUs = g.sleepStartUs;
    g.driftDirty = 1;  // 这一次的间隔少睡了一段，别拿它算漂移
  } else if (coldBoot) {
    // 复位（RST / 重新烧录）后 RTC 内存还在，时间继续用；
    // 但上一次的睡眠被这次复位打断了，漂移样本不能用。
    gBootUs = esp_timer_get_time();
    g.driftDirty = 1;
  }

  g.boots++;

  Serial.begin(115200);
#if DEBUG_KEEP_AWAKE
  // 等主机打开串口，避免开机前几行被吃掉
  {
    const uint32_t t0 = millis();
    while (!Serial && millis() - t0 < 3000) delay(10);
  }
  Serial.println("\n[debug] DEBUG_KEEP_AWAKE=1  (no deep sleep, USB stays up)");
#endif
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LED_ACTIVE_LOW ? HIGH : LOW);  // 关掉板载 LED

#if BTN_ENABLED
  pinMode(BTN_PIN, INPUT_PULLUP);

  if (btnWake) {
    // 一直数到松手：1.2s 以上 = 诊断，3s 以上 = 重新配网
    const uint32_t t0 = millis();
    uint32_t held = 0;
    while (digitalRead(BTN_PIN) == LOW && held < BTN_PROVISION_MS + 3000) {
      delay(5);
      held = millis() - t0;
    }
    gWantProvision = held >= BTN_PROVISION_MS;
    gShowDiag = !gWantProvision && held >= BTN_LONG_MS;

    // 等松手再睡，否则深睡唤醒会一直被按住的低电平立刻再触发
    const uint32_t t1 = millis();
    const uint32_t waitMs = gWantProvision ? 15000 : 5000;
    while (digitalRead(BTN_PIN) == LOW && millis() - t1 < waitMs) delay(10);
    gForceSync = true;
  }
#endif

  configLoad(gCfg, WIFI_SSID, WIFI_PASSWORD);
  setenv("TZ", gCfg.tz, 1);
  tzset();

  uiBegin();
  uiSetTzLabel(gCfg.tzLabel);

  if (Serial) {
    Serial.printf("\n[boot] #%lu cause=%d time=%s syncs=%lu wifi=%s\n",
                  (unsigned long)g.boots, (int)cause, g.haveTime ? "yes" : "no",
                  (unsigned long)g.syncs, gCfg.hasWifi() ? gCfg.ssid : "(none)");
  }

  // 需要配网的三种情况：按钮要求 / 从没配置过 / 连试 3 次都没有时间基准
  if (gWantProvision || !gCfg.hasWifi() || (!g.haveTime && g.failStreak >= 3)) {
    if (!g.haveTime) {
      uiBoot();
      delay(600);
    }
    startProvisioning();
  }

  const bool needSync = gForceSync || syncDue();

  if (!g.haveTime) {
    uiBoot();
    delay(600);
  } else if (!needSync) {
    drawClockNow();  // 30 秒醒一次只干这件事
  }

  if (needSync) {
    syncAndDraw(gShowDiag);
    gShowDiag = false;
  }

  sleepNow();  // 正常模式深睡不返回；调试模式 delay 后返回进 loop
}

void loop() {
#if DEBUG_KEEP_AWAKE
  // 模拟定时唤醒：时间跳到睡前计划的 wakeAt，再跑一轮刷新 / 校时
  gBootUs = esp_timer_get_time();
  if (g.haveTime) g.nowUs = g.wakeAtUs;
  g.boots++;

  if (Serial) {
    Serial.printf("\n[boot] #%lu cause=debug-loop time=%s syncs=%lu\n",
                  (unsigned long)g.boots, g.haveTime ? "yes" : "no",
                  (unsigned long)g.syncs);
  }

  if (gWantProvision || !gCfg.hasWifi() || (!g.haveTime && g.failStreak >= 3)) {
    startProvisioning();
  }

  const bool needSync = gForceSync || syncDue();
  gForceSync = false;

  if (!g.haveTime) {
    uiBoot();
    delay(600);
  } else if (!needSync) {
    drawClockNow();
  }

  if (needSync) {
    syncAndDraw(gShowDiag);
    gShowDiag = false;
  }

  sleepNow();
#else
  // 正常模式到不了这里：setup() 末尾已经深睡
  delay(1000);
#endif
}
