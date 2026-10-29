/*
 * Web 服务：HTTP 页面 + WebSocket 实时通道 + AP 模式的 DNS 劫持
 * =============================================================
 * 所有回调都跑在 AsyncTCP 任务里，只通过 note::set/clear 改内容；
 * 广播和屏幕刷新统一由 loop() 里的 note::takeChange() 驱动，
 * 避免在异步任务里直接碰显示和 I2C。
 */
#pragma once

#include <Arduino.h>

namespace web {

// 启动 HTTP / WebSocket；captive=true 时同时开 DNS 劫持（AP 模式）
void begin(const String& mode, const String& ip, const String& ssid, bool captive);

// 运行中从 STA 切到 AP 时更新状态页
void setNetwork(const String& mode, const String& ip, const String& ssid, bool captive);

// loop() 里调用：清理断开的 WebSocket、处理 DNS、广播在线数
void tick();

// 群发一条更新后的便签
void broadcastNote(const String& text);

int clientCount();

}  // namespace web
