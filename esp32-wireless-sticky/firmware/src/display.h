/*
 * OLED 显示
 * =============================================================
 * 一屏 128×64，正文用 wqy12（GB2312 常用字 + ASCII）：
 *   - 5 行 × 每行 120px，约 10 个汉字 / 20 个半角字符
 *   - 超出 5 行自动分页，每 3.2 秒翻一页；正在打字时先停在最后一页
 *   - 右上角小方块 = 是否有手机连着；右侧小点 = 当前第几页
 *   - 最后一行末尾有闪烁光标（有设备连接时）
 */
#pragma once

#include <Arduino.h>

#include "config.h"

namespace display {

// 初始化 I2C + OLED；找不到屏幕返回 false
bool begin();

// 空便签时显示的访问地址，例如 http://192.168.4.1
void setUrl(const String& url);

// 开机 / 短按 BOOT 的信息页：标题 + 3 行小字 + 1 行中文提示
void splash(const String& line1, const String& line2, const String& line3, const String& hint,
            uint32_t ms = SPLASH_MS);

// 换一张便签（会重新排版并跳到最后一页）
void setNote(const String& text);

// 当前有几台手机连着（右上角状态点）
void setOnline(int clients);

// 屏幕中间弹一个反色小提示，如「已清空」
void toast(const String& text, uint32_t ms = 900);

// loop() 里调用：负责翻页、光标闪烁、真正推 I2C
void tick();

}  // namespace display
