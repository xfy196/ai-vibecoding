#!/usr/bin/env python3
"""用真实的 Adafruit 5x7 字库渲染 docs/ui-preview.svg。

先跑一次 `pio run` 让 PlatformIO 把 Adafruit GFX 库下载到 .pio/，
然后执行：python3 tools/render_preview.py
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_FILE = (
    ROOT
    / "firmware/.pio/libdeps/esp32c3/Adafruit GFX Library/glcdfont.c"
)
OUT_FILE = ROOT / "docs/ui-preview.svg"

W, H = 128, 64
SCALE = 4
VISIBLE_ROWS = 5
ROW_H = 10

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

    def text(self, x, y, s, color=1):
        for ch in s:
            cols = FONT[(ord(ch) & 0xFF) * 5 : (ord(ch) & 0xFF) * 5 + 5]
            for cx, bits in enumerate(cols):
                for cy in range(7):
                    if (bits >> cy) & 1:
                        self.pixel(x + cx, y + cy, color)
            x += 6

    def bars(self, x, y, level, color=1):
        for b in range(level):
            h = 3 + b * 2
            self.fill(x + b * 3, y + 9 - h, 2, h, color)

    def lock(self, x, y, color=1):
        self.pixel(x + 1, y, color)
        self.pixel(x + 2, y, color)
        self.pixel(x, y + 1, color)
        self.pixel(x + 3, y + 1, color)
        self.fill(x, y + 2, 4, 4, color)


def rssi_level(rssi):
    if rssi >= -55:
        return 4
    if rssi >= -65:
        return 3
    if rssi >= -75:
        return 2
    return 1


class Ap:
    def __init__(self, ssid, rssi, channel, secure=True):
        self.ssid = ssid
        self.rssi = rssi
        self.channel = channel
        self.secure = secure


APS = [
    Ap("ChinaNet-8F2A", -42, 6),
    Ap("TP-LINK_5G_EXT", -48, 11),
    Ap("Xiaomi_AX3000", -55, 1),
    Ap("CMCC-5G-9C21", -61, 6),
    Ap("?_5G", -63, 1),          # 中文名字折叠后的样子
    Ap("HUAWEI-4F2A", -70, 9),
    Ap("TP-LINK_2.4G", -76, 3),
    Ap("AP 3F2A", -80, 3, False),
    Ap("ChinaNet-2.4G", -83, 6),
    Ap("HUAWEI-9C21", -84, 6),
    Ap("MERCURY_5G", -85, 11),
    Ap("Xiaomi_5G", -86, 6),
    Ap("DIRECT-7A-HP", -87, 1),
    Ap("?_2.4G", -88, 9),
    Ap("CMCC-XXXX", -89, 1),
    Ap("TP-LINK_EXT", -90, 6),
    Ap("Redmi_AX6000", -91, 3),
    Ap("ChinaNet-9A2B", -92, 11),
    Ap("?_5G", -93, 1),
    Ap("HUAWEI-9C21", -94, 6),
    Ap("AP 7A2B", -95, 3, False),
    Ap("Xiaomi_AX3000", -96, 11),
    Ap("AP 9C21", -97, 3),
]


def draw_row(s, idx, y, selected):
    ap = APS[idx]
    if selected:
        s.fill(0, y, W - 4, ROW_H, 1)
        fg = 0
    else:
        fg = 1

    s.bars(2, y, rssi_level(ap.rssi), fg)
    s.text(15, y + 2, ap.ssid, fg)
    rssi = str(ap.rssi)
    s.text(122 - len(rssi) * 6, y + 2, rssi, fg)


def draw_screen(count, selected, scroll_row, scanning, scroll_px=None):
    s = Screen()
    scroll_px = scroll_row if scroll_px is None else scroll_px

    # 列表（会被标题栏/底部条覆盖，模拟固件的后画覆盖裁剪）
    offset = round(scroll_px * ROW_H)
    for i in range(len(APS)):
        y = 10 + i * ROW_H - offset
        if y + ROW_H <= 10 or y >= 60:
            continue
        draw_row(s, i, y, i == selected)

    # 标题栏
    s.fill(0, 0, W, 10, 0)
    s.text(2, 1, f"WiFi {count}")
    if scanning:
        s.text(84, 1, "scan")
        for i in range(2):
            s.fill(109 + i * 6, 5, 2, 2, 1)
    else:
        ap = APS[selected]
        right = f"{ap.rssi} ch{ap.channel}"
        s.text(W - 2 - len(right) * 6, 1, right)
    if APS[selected].secure:
        s.lock(74, 1, 1)
    s.fill(0, 9, W, 1, 1)

    # 底部条
    s.fill(0, 60, W, 4, 0)
    s.fill(0, 60, W, 1, 1)
    if scanning:
        s.fill(40, 62, 28, 2, 1)

    # 滚动条
    total = 23
    if total > VISIBLE_ROWS:
        for y in range(10, 60, 3):
            s.pixel(126, y, 1)
        thumb = max(10, (50 * VISIBLE_ROWS) // total)
        p = scroll_px / (total - VISIBLE_ROWS)
        y = 10 + round((50 - thumb) * p)
        s.fill(124, y, 3, thumb, 1)

    return s


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


def screen_svg(s, x, y, lit="#e8f1ff"):
    parts = []
    for rx, ry, rw in runs(s):
        parts.append(
            f'<rect x="{x + rx * SCALE}" y="{y + ry * SCALE}" '
            f'width="{rw * SCALE}" height="{SCALE}" fill="{lit}"/>'
        )
    return "\n".join(parts)


def main():
    a = draw_screen(23, 0, 0, scanning=True)
    b = draw_screen(23, 12, 8, scanning=False)

    screen_w = W * SCALE
    screen_h = H * SCALE
    pad = 16
    bezel_w = screen_w + pad * 2
    bezel_h = screen_h + pad * 2

    canvas_w = 1160
    canvas_h = 500
    ax, ay = 56, 112
    bx, by = 604, 112

    def bezel(x, y):
        return f"""
  <rect x="{x}" y="{y}" width="{bezel_w}" height="{bezel_h}" rx="16" fill="#0b1220" stroke="#1e293b" stroke-width="1.2"/>
  <rect x="{x + 4}" y="{y + 4}" width="{bezel_w - 8}" height="{bezel_h - 8}" rx="12" fill="none" stroke="#243044"/>
  <circle cx="{x + bezel_w - 20}" cy="{y + 18}" r="3" fill="#22c55e"/>
  <circle cx="{x + bezel_w - 20}" cy="{y + 18}" r="6" fill="#22c55e" opacity="0.18"/>
  <rect x="{x + pad}" y="{y + pad}" width="{screen_w}" height="{screen_h}" rx="3" fill="#05080f" stroke="#2b3648"/>
"""

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{canvas_w}" height="{canvas_h}" viewBox="0 0 {canvas_w} {canvas_h}"
     font-family="-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif">

  <rect width="{canvas_w}" height="{canvas_h}" fill="#f4f6fb"/>
  <circle cx="1116" cy="36" r="92" fill="#e3eaf8" opacity="0.65"/>
  <circle cx="22" cy="470" r="66" fill="#e3eaf8" opacity="0.5"/>

  <text x="40" y="46" font-size="23" font-weight="700" fill="#0f172a">OLED 界面预览 · 128×64</text>
  <text x="40" y="68" font-size="11.5" fill="#64748b">5 行列表 · 平滑滚动 · 右侧滚动条 · 反显为当前选中项</text>

  <rect x="944" y="28" width="176" height="30" rx="15" fill="#eef2ff" stroke="#c7d2fe"/>
  <text x="1032" y="47" font-size="10.5" font-weight="600" fill="#4338ca" text-anchor="middle">SSD1306 · I2C · 单色</text>
{bezel(ax, ay)}

  <g>
{screen_svg(a, ax + pad, ay + pad)}
  </g>

{bezel(bx, by)}

  <g>
{screen_svg(b, bx + pad, by + pad)}
  </g>

  <text x="{ax}" y="{ay + bezel_h + 34}" font-size="12.5" font-weight="700" fill="#0f172a">扫描中</text>
  <text x="{ax}" y="{ay + bezel_h + 52}" font-size="10.5" fill="#64748b">右上角 scan 动画，底部一条来回扫动的进度条</text>

  <text x="{bx}" y="{by + bezel_h + 34}" font-size="12.5" font-weight="700" fill="#0f172a">扫描完成</text>
  <text x="{bx}" y="{by + bezel_h + 52}" font-size="10.5" fill="#64748b">BOOT 短按下一条；列表跟随滚动，右侧滑块同步</text>

  <line x1="40" y1="{canvas_h - 52}" x2="{canvas_w - 40}" y2="{canvas_h - 52}" stroke="#e2e8f0"/>
  <text x="40" y="{canvas_h - 26}" font-size="9.5" fill="#94a3b8">示例数据；中文 SSID 会折叠成 “?”，纯中文名字显示为 AP + BSSID 后四位</text>
  <text x="{canvas_w - 40}" y="{canvas_h - 26}" font-size="9.5" fill="#94a3b8" text-anchor="end">esp32-wifi-scanner · docs/ui-preview.svg</text>
</svg>
"""
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(svg, encoding="utf-8")
    print(f"wrote {OUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
