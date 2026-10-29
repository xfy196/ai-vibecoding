/*
 * ESP32 DevKit V1 + 0.96" OLED · Flappy Bird
 * =============================================================
 * 硬件、版面、手感参数都在这个文件里。
 * 改难度只动「物理」一节，改接线只动「引脚」一节。
 */
#pragma once

// ================= 引脚 / 屏幕 =================
#define I2C_SDA_PIN     21     // OLED SDA -> GPIO21（ESP32 默认 SDA）
#define I2C_SCL_PIN     22     // OLED SCL -> GPIO22（ESP32 默认 SCL）
#define I2C_CLOCK_HZ    400000 // SSD1306 支持 400kHz，全屏 1KB 约 25ms

#define SCREEN_W        128
#define SCREEN_H        64
#define OLED_I2C_ADDR   0x3C   // 常见 0x3C；失败会自动再试 0x3D

// ================= 按键 =================
// DevKit V1 的板载 BOOT 键：一端 GPIO0，一端 GND，板上已有 10k 上拉。
// 烧录完不用接任何线，直接按 BOOT 就是游戏手柄。
#define BTN_PIN         0
#define BTN_ACTIVE_LOW  1
#define BTN_DEBOUNCE_MS 20

// ================= 帧循环 =================
// 逻辑固定 30Hz；渲染跟着 tick 走。I2C 一帧约 25ms，所以 30fps 是这块屏的舒适区。
#define TICK_MS         33
#define TICK_HZ         30

// ================= 物理（单位：像素 / 逻辑帧） =================
#define GRAVITY         0.32f  // 每帧重力加速度
#define FLAP_VY        -2.70f  // 按一下的瞬时上升速度
#define VY_MAX          4.20f  // 下落终端速度
#define PIPE_SPEED      1.15f  // 水管每帧左移像素（约 34.5 px/s）
#define PIPE_WIDTH      12
#define PIPE_GAP        23     // 上下管之间的空隙
#define PIPE_SPACING    54     // 相邻两根管的水平间距
#define PIPE_COUNT      4      // 环形复用的水管数量

#define PIPE_MIN_GAP_Y  18     // 缺口上沿的最小 y（顶部水管至少 18px）
#define PIPE_MAX_GAP_Y  30     // 缺口上沿的最大 y（底部水管至少 6px）
#define PIPE_GAP_JITTER 6      // 相邻两管缺口的高度差上限

#define BIRD_X          24
#define BIRD_W          12
#define BIRD_H          8
#define BIRD_HIT_INSET  1      // 碰撞盒向内缩，手感更宽容

// ================= 版面 =================
#define PLAY_TOP        16     // 顶部 HUD 占 0..15，游戏区从这里开始
#define GROUND_Y        59     // 地面线（鸟落地即结束）
#define READY_BIRD_X    14
#define READY_BIRD_Y    36

// ================= 状态时长 =================
#define DEATH_ANIM_MS   700    // 撞击后闪屏 + 坠落，之后出结算面板
#define RETRY_LOCK_MS   350    // 结算后多久才接受重开，防止死亡那一下连带重开

// ================= 其它 =================
#define LED_PIN         2      // DevKit V1 板载 LED，高电平点亮
#define SERIAL_BAUD     115200
#define NVS_NAMESPACE   "flappy"
#define NVS_KEY_BEST    "best"
