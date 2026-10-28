#!/usr/bin/env python3
"""用真实的 Adafruit 5x7 字库 + 固件里同样的七段几何，渲染 docs/screens.svg。

画法是从 firmware/src/ui.cpp 一行行搬过来的：
同样的数字坐标、同样的笔画粗细、同样的顶栏 / 底栏。改了 ui.cpp 记得同步这里。

先跑一次 `pio run` 让 PlatformIO 把 Adafruit GFX 拉下来，然后：
    python3 tools/render_preview.py
"""

import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_FILE = ROOT / "firmware/.pio/libdeps/esp32c3/Adafruit GFX Library/glcdfont.c"
OUT_FILE = ROOT / "docs/screens.svg"

W, H = 128, 64
DIG_Y = 12
DIG_X = [10, 35, 71, 96]
COLON_X = 62
SEG_T = 4
GHOST = False  # 对应 config.h 里的 CLOCK_GHOST_SEGMENTS
DIG_W = 22
DIG_H = 38

SEGMENTS = {
    "A": (4, 0, 14, 4, "h"),
    "B": (18, 4, 4, 12, "v"),
    "C": (18, 21, 4, 12, "v"),
    "D": (4, 34, 14, 4, "h"),
    "E": (0, 21, 4, 12, "v"),
    "F": (0, 4, 4, 12, "v"),
    "G": (4, 17, 14, 4, "h"),
}
BITS = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6}
DIGIT_MASK = [0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110,
              0b1101101, 0b1111101, 0b0000111, 0b1111111, 0b1101111]


# ---------------------------------------------------------------- 字体
def load_font():
    if not FONT_FILE.exists():
        raise SystemExit(f"找不到字库：{FONT_FILE}\n请先在 firmware/ 里跑一次 pio run")
    text = FONT_FILE.read_text(encoding="utf-8", errors="ignore")
    values = [int(v, 16) for v in re.findall(r"0x([0-9A-Fa-f]{2})", text)]
    if len(values) < 1280:
        values += [0] * (1280 - len(values))
    return values[:1280]


FONT = load_font()


class Screen:
    def __init__(self):
        self.px = [[0] * W for _ in range(H)]

    def pixel(self, x, y, color=1):
        if 0 <= x < W and 0 <= y < H:
            self.px[y][x] = color

    def fill(self, x, y, w, h, color=1):
        for yy in range(max(0, y), min(H, y + h)):
            row = self.px[yy]
            for xx in range(max(0, x), min(W, x + w)):
                row[xx] = color

    def round_fill(self, x, y, w, h, r, color=1):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                cx = min(max(xx, x + r), x + w - 1 - r)
                cy = min(max(yy, y + r), y + h - 1 - r)
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r:
                    self.pixel(xx, yy, color)

    def circle(self, cx, cy, r, color=1):
        for yy in range(cy - r, cy + r + 1):
            for xx in range(cx - r, cx + r + 1):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r:
                    self.pixel(xx, yy, color)

    def text(self, x, y, s, color=1):
        for ch in s:
            cols = FONT[(ord(ch) & 0xFF) * 5:(ord(ch) & 0xFF) * 5 + 5]
            for cx, bits in enumerate(cols):
                for cy in range(7):
                    if (bits >> cy) & 1:
                        self.pixel(x + cx, y + cy, color)
            x += 6

    def text_right(self, y, s, color=1):
        self.text(W - 2 - len(s) * 6, y, s, color)

    def text_mid(self, y, s, color=1):
        self.text((W - (len(s) * 6 - 1)) // 2, y, s, color)


# ---------------------------------------------------------------- 七段
def digit(s, x, y, d):
    mask = DIGIT_MASK[d] if 0 <= d <= 9 else 0
    for name, (dx, dy, w, h, kind) in SEGMENTS.items():
        on = (mask >> BITS[name]) & 1
        if on:
            if kind == "h":
                s.round_fill(x + dx, y + dy, w, SEG_T, SEG_T // 2)
            else:
                s.round_fill(x + dx, y + dy, SEG_T, h, SEG_T // 2)
        elif GHOST and kind == "h":
            s.fill(x + dx + 2, y + dy + SEG_T // 2, w - 4, 1)
        elif GHOST:
            s.fill(x + dx + SEG_T // 2, y + dy + 2, 1, h - 4)


def wifi_icon(s, level, online):
    x, base = 114, 8
    for i in range(4):
        bx = x + i * 3
        h = 2 + i * 2
        if online and i < level:
            s.fill(bx, base - h + 1, 2, h)
        else:
            s.pixel(bx, base)


# ---------------------------------------------------------------- 界面
STATUS_AGE = 3


def draw_clock(s, hour, minute, mon, day, wd, colon=True, online=True, rssi=-58,
               status="SYNC 3m"):
    s.fill(0, 0, W, H, 0)
    s.text(2, 1, f"{mon:02d}/{day:02d} {wd}")
    wifi_icon(s, 4 if online else 0, online)
    s.fill(0, 9, W, 1)

    hh = f"{hour:02d}"
    mm = f"{minute:02d}"
    for i, ch in enumerate(hh + mm):
        digit(s, DIG_X[i], DIG_Y, int(ch))
    if colon:
        s.fill(COLON_X, 23, 4, 4)
        s.fill(COLON_X, 35, 4, 4)

    s.fill(0, 52, W, 1)
    s.text(2, 55, "UTC+8")
    s.text_right(55, status)
    return s


def draw_busy(s, frame, title, detail):
    s.fill(0, 0, W, H, 0)
    cx, cy, r = W / 2, 18.0, 8.0
    for i in range(8):
        a = math.radians(i * 45 - 90)
        x = round(cx + math.cos(a) * r)
        y = round(cy + math.sin(a) * r)
        tail = (i - frame % 8 + 8) % 8
        if tail == 0:
            s.circle(x, y, 2)
        elif tail < 4:
            s.pixel(x, y)
    s.text_mid(32, title)
    s.text_mid(44, detail)
    s.fill(0, 53, W, 1)
    pos = (frame * 4) % (W + 24) - 12
    s.fill(pos, 58, 12, 2)
    return s


def draw_notice(s, title, lines):
    s.fill(0, 0, W, H, 0)
    s.text(6, 6, title)
    s.fill(0, 17, W, 1)
    y = 22
    for line in lines:
        if line:
            s.text(6, y, line)
        y += 11
    return s


def draw_provision(s, ap_name, ip, frame):
    s.fill(0, 0, W, H, 0)
    s.text(2, 1, "SETUP MODE")
    s.text_right(1, "AP")
    s.fill(0, 9, W, 1)

    s.text(2, 12, "1 JOIN WIFI")
    s.text(2, 21, ap_name)

    s.text(2, 31, "2 OPEN BROWSER")
    s.text(2, 40, ip)

    s.fill(0, 49, W, 1)
    label = "OPEN NETWORK"
    lw = len(label) * 6 - 1
    lx = (W - lw) // 2
    s.text(lx, 52, label)
    dots = (frame // 2) % 4
    for i in range(dots):
        s.fill(lx + lw + 4 + i * 3, 56, 2, 2)
    return s


# ---------------------------------------------------------------- SVG
def runs(s):
    out = []
    for y in range(H):
        x = 0
        while x < W:
            if s.px[y][x]:
                start = x
                while x < W and s.px[y][x]:
                    x += 1
                out.append((start, y, x - start))
            else:
                x += 1
    return out


def screen_svg(s, x, y, scale, lit="#e8f1ff"):
    parts = []
    for rx, ry, rw in runs(s):
        parts.append(
            f'<rect x="{x + rx * scale}" y="{y + ry * scale}" '
            f'width="{rw * scale}" height="{scale}" fill="{lit}"/>'
        )
    return "\n".join(parts)


def bezel(x, y, scale):
    sw = W * scale
    sh = H * scale
    pad = scale * 3
    return f"""
  <rect x="{x}" y="{y}" width="{sw + pad * 2}" height="{sh + pad * 2}" rx="18" fill="#0b1220" stroke="#1e293b" stroke-width="1.2"/>
  <rect x="{x + 4}" y="{y + 4}" width="{sw + pad * 2 - 8}" height="{sh + pad * 2 - 8}" rx="14" fill="none" stroke="#243044"/>
  <circle cx="{x + sw + pad * 2 - 18}" cy="{y + 15}" r="3" fill="#22c55e"/>
  <circle cx="{x + sw + pad * 2 - 18}" cy="{y + 15}" r="6" fill="#22c55e" opacity="0.18"/>
  <rect x="{x + pad}" y="{y + pad}" width="{sw}" height="{sh}" rx="2" fill="#05080f" stroke="#2b3648"/>
"""


def main():
    scale = 3
    pad = scale * 3
    bezel_w = W * scale + pad * 2
    bezel_h = H * scale + pad * 2
    top = 104
    gap_x = 34
    gap_y = 84
    xs = [40, 40 + bezel_w + gap_x]
    ys = [top, top + bezel_h + gap_y]
    canvas_w = xs[1] + bezel_w + 44
    canvas_h = ys[1] + bezel_h + 96

    panels = [
        (draw_clock(Screen(), 12, 34, 10, 28, "WED", True, True, -58, "SYNC 3m"),
         "正常走时", "七段大字号 + 日期星期 + 信号格 + 时区，右侧是距上次校时多久"),
        (draw_provision(Screen(), "NTP-CLOCK-A1B2", "192.168.4.1", 6),
         "手机配网", "没配置过 / 长按 3 秒就开热点，手机连上填 SSID、密码、时区"),
        (draw_busy(Screen(), 3, "NTP SYNC", "ntp.aliyun.com"),
         "校时中", "每 15 分钟（可调）醒一次联网；连 WiFi 和等 SNTP 都有转圈动画"),
        (draw_clock(Screen(), 12, 34, 10, 28, "WED", False, False, 0, "OFFLINE"),
         "离线兜底", "没网也照常走时，只是信号格变暗、底栏显示 OFFLINE"),
    ]

    parts = [
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="{canvas_w * 2}" height="{canvas_h * 2}" viewBox="0 0 {canvas_w} {canvas_h}"
     font-family="-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif">

  <!-- 背景 -->
  <rect width="{canvas_w}" height="{canvas_h}" fill="#f4f6fb"/>
  <circle cx="{canvas_w - 40}" cy="30" r="96" fill="#e3eaf8" opacity="0.65"/>
  <circle cx="18" cy="{canvas_h - 40}" r="66" fill="#e3eaf8" opacity="0.5"/>

  <!-- 标题 -->
  <text x="40" y="46" font-size="23" font-weight="700" fill="#0f172a">OLED 界面预览 · 128×64</text>
  <text x="40" y="68" font-size="11.5" fill="#64748b">七段大字号 · 每 30 秒醒一次翻冒号 · 深睡时保持最后一帧 · 手机网页配网</text>

  <rect x="{canvas_w - 216}" y="28" width="176" height="30" rx="15" fill="#eef2ff" stroke="#c7d2fe"/>
  <text x="{canvas_w - 128}" y="47" font-size="10.5" font-weight="600" fill="#4338ca" text-anchor="middle">SSD1306 · I2C · 单色</text>
"""
    ]

    coords = [(x, y) for y in ys for x in xs]

    for (screen, title, note), (x, y) in zip(panels, coords):
        parts.append(bezel(x, y, scale))
        parts.append("  <g>")
        parts.append(screen_svg(screen, x + pad, y + pad, scale))
        parts.append("  </g>")
        parts.append(f'  <text x="{x}" y="{y + bezel_h + 30}" font-size="12.5" font-weight="700" fill="#0f172a">{title}</text>')
        parts.append(f'  <text x="{x}" y="{y + bezel_h + 48}" font-size="10.5" fill="#64748b">{note}</text>')

    parts.append(f"""
  <line x1="40" y1="{canvas_h - 46}" x2="{canvas_w - 40}" y2="{canvas_h - 46}" stroke="#e2e8f0"/>
  <text x="40" y="{canvas_h - 20}" font-size="9.5" fill="#94a3b8">示意时间 12:34 · 冒号每 30 秒亮灭一次，深睡期间屏幕内容不变 · 长按 3 秒重新配网</text>
  <text x="{canvas_w - 40}" y="{canvas_h - 20}" font-size="9.5" fill="#94a3b8" text-anchor="end">esp32-ntp-clock · docs/screens.svg</text>
</svg>
""")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text("\n".join(parts), encoding="utf-8")
    print(f"wrote {OUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
