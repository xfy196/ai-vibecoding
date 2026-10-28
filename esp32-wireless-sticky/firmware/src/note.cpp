#include "note.h"

#include <Preferences.h>

#include "config.h"

namespace note {
namespace {

SemaphoreHandle_t sLock = nullptr;
Preferences sPrefs;

String sText;
uint32_t sRev = 0;           // 内容版本
uint32_t sBroadcastRev = 0;  // 已经送出去（显示 + WebSocket）的版本
uint32_t sSavedRev = 0;      // 已经写进 Flash 的版本
uint32_t sEditAt = 0;        // 最后一次修改的 millis

// 返回这个 UTF-8 字符占几个字节，非法首字节返回 0
size_t utf8Len(uint8_t c) {
  if (c < 0x80) return 1;
  if ((c & 0xE0) == 0xC0) return 2;
  if ((c & 0xF0) == 0xE0) return 3;
  if ((c & 0xF8) == 0xF0) return 4;
  return 0;
}

// 去掉 \r、其它控制字符，\t 换成两个空格；按字节上限截断且不切断汉字
String sanitize(const String& in) {
  String out;
  out.reserve(in.length() < MAX_NOTE_BYTES ? in.length() : MAX_NOTE_BYTES);

  const char* p = in.c_str();
  const size_t n = in.length();
  for (size_t i = 0; i < n;) {
    const uint8_t c = (uint8_t)p[i];

    if (c == '\r') {
      ++i;
      continue;
    }
    if (c == '\t') {
      if (out.length() + 2 > MAX_NOTE_BYTES) break;
      out += "  ";
      ++i;
      continue;
    }
    // 保留 \n，其余 0x00-0x1F 和 DEL 全部丢弃
    if ((c < 0x20 && c != '\n') || c == 0x7F) {
      ++i;
      continue;
    }

    const size_t len = utf8Len(c);
    if (len == 0 || i + len > n) {  // 非法字节，跳过
      ++i;
      continue;
    }
    if (out.length() + len > MAX_NOTE_BYTES) break;
    out.concat(p + i, len);
    i += len;
  }
  return out;
}

}  // namespace

void begin() {
  if (sLock == nullptr) {
    sLock = xSemaphoreCreateMutex();
  }
  sPrefs.begin(NVS_NAMESPACE, false);
  sText = sanitize(sPrefs.getString(NVS_KEY_NOTE, ""));

  // 让第一轮 loop() 把内容推给屏幕；有客户端连上时也会主动同步
  sRev = 1;
  sBroadcastRev = 0;
  sSavedRev = 1;

  if (DEBUG_SERIAL) {
    Serial.printf("[note] restored %u bytes\n", (unsigned)sText.length());
  }
}

void set(const String& text) {
  const String clean = sanitize(text);

  bool changed = false;
  xSemaphoreTake(sLock, portMAX_DELAY);
  if (clean != sText) {
    sText = clean;
    ++sRev;
    sEditAt = millis();
    changed = true;
  }
  xSemaphoreGive(sLock);

  if (changed && DEBUG_SERIAL) {
    Serial.printf("[note] rev=%u bytes=%u\n", (unsigned)sRev, (unsigned)clean.length());
  }
}

void clear() { set(""); }

String get() {
  xSemaphoreTake(sLock, portMAX_DELAY);
  String copy = sText;
  xSemaphoreGive(sLock);
  return copy;
}

uint32_t rev() {
  xSemaphoreTake(sLock, portMAX_DELAY);
  const uint32_t r = sRev;
  xSemaphoreGive(sLock);
  return r;
}

bool takeChange(String& out) {
  xSemaphoreTake(sLock, portMAX_DELAY);
  const bool changed = sRev != sBroadcastRev;
  if (changed) {
    out = sText;
    sBroadcastRev = sRev;
  }
  xSemaphoreGive(sLock);
  return changed;
}

void tick() {
  uint32_t revNow;
  uint32_t editAt;
  xSemaphoreTake(sLock, portMAX_DELAY);
  revNow = sRev;
  editAt = sEditAt;
  xSemaphoreGive(sLock);

  if (revNow == sSavedRev) return;
  if ((uint32_t)(millis() - editAt) < SAVE_DEBOUNCE_MS) return;

  const String snapshot = get();
  sPrefs.putString(NVS_KEY_NOTE, snapshot);
  sSavedRev = revNow;  // 写的期间又改过也没关系：sRev 变了，下一轮会再写

  if (DEBUG_SERIAL) {
    Serial.printf("[note] saved %u bytes\n", (unsigned)snapshot.length());
  }
}

}  // namespace note
