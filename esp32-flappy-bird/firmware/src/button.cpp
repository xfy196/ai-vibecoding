#include "button.h"

#include "config.h"

void Button::begin(uint8_t pin, bool activeLow) {
  pin_ = pin;
  activeLow_ = activeLow;
  pinMode(pin_, activeLow_ ? INPUT_PULLUP : INPUT);

  lastRaw_ = activeLow_ ? (digitalRead(pin_) == LOW) : (digitalRead(pin_) == HIGH);
  stable_ = lastRaw_;
  lastChangeMs_ = millis();
}

bool Button::pressed(uint32_t nowMs) {
  const bool raw =
      activeLow_ ? (digitalRead(pin_) == LOW) : (digitalRead(pin_) == HIGH);

  if (raw != lastRaw_) {
    lastRaw_ = raw;
    lastChangeMs_ = nowMs;
  }

  // 原始电平必须稳定 BTN_DEBOUNCE_MS，才认一次状态变化。
  if (raw != stable_ && (uint32_t)(nowMs - lastChangeMs_) >= BTN_DEBOUNCE_MS) {
    stable_ = raw;
    if (stable_) return true;  // 只上报按下沿
  }
  return false;
}
