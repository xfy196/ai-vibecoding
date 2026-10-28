/*
 * 便签内容仓库
 * =============================================================
 * 只有一份正文，被三个地方读写：
 *   - AsyncWebServer 的异步任务（HTTP POST / WebSocket 消息）
 *   - loop() 里的显示与广播
 *   - loop() 里的防抖持久化
 *
 * 所以用互斥锁包住 String，对外只给「整体替换」和「取快照」两个动作，
 * 不做增量修改，避免半个 UTF-8 字符被读到。
 */
#pragma once

#include <Arduino.h>

namespace note {

// 初始化：建锁、从 NVS 读回上次的便签
void begin();

// 整体替换（会去掉控制字符、按 UTF-8 边界截断到 MAX_NOTE_BYTES）
void set(const String& text);

// 清空
void clear();

// 取当前正文（线程安全副本）
String get();

// 版本号：每次内容真的变化才 +1
uint32_t rev();

// loop() 里调用：停止输入 SAVE_DEBOUNCE_MS 后写一次 NVS
void tick();

// 有新版本时返回 true，并输出正文；用于「重画屏幕 + WebSocket 广播」
bool takeChange(String& out);

}  // namespace note
