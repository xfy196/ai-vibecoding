#!/usr/bin/env python3
"""生成 docs/screens.svg —— 六个场景的 128x64 预览，放大 3 倍排成 2x3。

几何 / 数值和 firmware/src/scenes.cpp 保持一致：
  - 数字雨 21 列，6x10 字体，头部反白
  - 心形参数方程 + 扫描线填充 + 64 点心电表
  - 示波器 128 点、2ms 采样、6.5Hz
  - 小人 7x5 字符、4 帧
  - 随机数 logisoso24 三位数 + 16 根直方图
  - HUD：10x20 帧率、旋转六边形、内存条、帧率柱

只依赖标准库：python tools/render_screens.py
"""

import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "docs" / "screens.svg"

SANS = ("-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',"
        "'Segoe UI',sans-serif")
MONO = "'DejaVu Sans Mono','Consolas','Courier New',monospace"
INK = "#e8f1ff"
BG = "#05080f"

W, H = 880, 940
SCALE = 3
CARD_W, CARD_H = 404, 250
POS = [(30, 110), (450, 110), (30, 380), (450, 380), (30, 650), (450, 650)]

out = []
add = out.append


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def t(x, y, s, adv, size, fill=INK, weight="400", anchor="start"):
    """用 textLength 把字符压成 U8g2 那种等宽点阵感。"""
    if not s:
        return
    w = len(s) * adv
    x0 = x - w / 2 if anchor == "middle" else x
    a = ' text-anchor="middle"' if anchor == "middle" else ""
    add(f'<text x="{x0}" y="{y}" font-family="{MONO}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" textLength="{w}" '
        f'lengthAdjust="spacingAndGlyphs"{a}>{esc(s)}</text>')


def rect(x, y, w, h, fill=INK):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>')


def center(s, adv, y, size, **kw):
    t(64 - len(s) * adv / 2, y, s, adv, size, **kw)


# ============================================================
# 1. 数字雨
# ============================================================
def scene_rain():
    rng = random.Random(7)
    glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\|+*="
    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    for col in range(21):
        x = col * 6
        head = rng.randint(12, 62)
        length = rng.randint(3, 7)
        for j in range(1, length + 1):
            y = head - j * 9
            if y < 8:
                continue
            out.append(f'<text x="{x}" y="{y}" font-family="{MONO}" '
                       f'font-size="8" fill="{INK}">'
                       f'{esc(glyphs[rng.randrange(len(glyphs))])}</text>')
        out.append(f'<rect x="{x}" y="{head - 8}" width="6" height="9" '
                   f'fill="{INK}"/>')
        out.append(f'<text x="{x}" y="{head}" font-family="{MONO}" '
                   f'font-size="8" fill="{BG}">'
                   f'{esc(glyphs[rng.randrange(len(glyphs))])}</text>')
    return "".join(out)


# ============================================================
# 2. 跳动的心
# ============================================================
ECG = [0] * 36 + [1, 2, 4, 7, 9, -6, -3, 0] + [0] * 20


def scene_heart():
    pts = []
    for i in range(241):
        a = i * 2 * math.pi / 240
        sa = math.sin(a)
        hx = 16 * sa ** 3
        hy = (13 * math.cos(a) - 5 * math.cos(2 * a)
              - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((64 + hx * 1.9, 26 - hy * 1.45))

    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    rows = []
    for row in range(64):
        cross = []
        for i in range(240):
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]
            if (y0 <= row < y1) or (y1 <= row < y0):
                k = (row - y0) / (y1 - y0)
                cross.append(x0 + k * (x1 - x0))
        cross.sort()
        for j in range(0, len(cross) - 1, 2):
            rows.append(f'<rect x="{cross[j]:.1f}" y="{row}" '
                        f'width="{max(cross[j + 1] - cross[j], 1):.1f}" '
                        f'height="1"/>')
    out.append(f'<g fill="{INK}">' + "".join(rows) + "</g>")

    ecg = " ".join(f"{x},{60 - ECG[(x + 12) % 64]}" for x in range(128))
    out.append(f'<polyline points="{ecg}" fill="none" stroke="{INK}" '
               f'stroke-width="1"/>')
    out.append(f'<text x="2" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="24" lengthAdjust="spacingAndGlyphs">'
               f'72 BPM</text>')
    out.append(f'<circle cx="124" cy="3" r="2" fill="{INK}"/>')
    return "".join(out)


# ============================================================
# 3. 示波器
# ============================================================
def scene_scope():
    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    dots = []
    for x in range(0, 128, 8):
        for y in range(0, 64, 4):
            dots.append(f'<rect x="{x}" y="{y}" width="1" height="1"/>')
    for y in range(0, 64, 8):
        for x in range(0, 128, 4):
            dots.append(f'<rect x="{x}" y="{y}" width="1" height="1"/>')
    out.append(f'<g fill="{INK}">{"".join(dots)}</g>')
    out.append(f'<rect x="0" y="32" width="128" height="1" fill="{INK}"/>')

    phase = 0.0
    step = 2 * math.pi * 6.5 * 0.002
    pts = []
    for i in range(128):
        v = (math.sin(phase) * 0.78 + math.sin(phase * 3 + 1.1) * 0.16)
        y = round(32 - v * 26)
        pts.append(f"{i},{y}")
        phase += step
    out.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{INK}" '
               f'stroke-width="1.4"/>')

    out.append(f'<rect x="0" y="0" width="62" height="9" fill="{BG}"/>')
    out.append(f'<text x="2" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="48" lengthAdjust="spacingAndGlyphs">'
               f'6.5Hz Vpp3.0V</text>')
    out.append(f'<rect x="110" y="0" width="18" height="9" fill="{BG}"/>')
    out.append(f'<text x="114" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="12" lengthAdjust="spacingAndGlyphs">'
               f'RUN</text>')
    return "".join(out)


# ============================================================
# 4. ASCII 帧动画
# ============================================================
WALK = [
    ["   O   ", "  /|\\  ", "   |   ", "  / \\  ", " /   \\ "],
    ["   O   ", "  /|\\  ", "   |   ", "   |   ", "  / \\  "],
    ["   O   ", "  /|\\  ", "   |   ", "  / \\  ", " \\   / "],
    ["   O   ", "  /|\\  ", "   |   ", "   |   ", "  | |  "],
]


def scene_walk():
    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    out.append(f'<text x="2" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="40" lengthAdjust="spacingAndGlyphs">'
               f'ASCII WALK</text>')
    out.append(f'<text x="96" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="24" lengthAdjust="spacingAndGlyphs">'
               f'140MS</text>')
    # ???????? 6x10 ??????? 6px ??
    for r, line in enumerate(WALK[2]):
        for c, ch in enumerate(line):
            if ch == " ":
                continue
            out.append(f'<text x="{43 + c * 6}" y="{16 + r * 10}" '
                       f'font-family="{MONO}" font-size="10" fill="{INK}">'
                       f'{esc(ch)}</text>')
    for x in range(-4, 128, 12):
        out.append(f'<rect x="{x}" y="58" width="5" height="1"/>')
    for i in range(3):
        ln = 8 - i * 2
        x = 30 - i * 8
        out.append(f'<rect x="{x - ln}" y="{22 + i * 11}" width="{ln}" '
                   f'height="1"/>')
    out.append(f'<text x="2" y="63" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="36" lengthAdjust="spacingAndGlyphs">'
               f'FRAME 3/4</text>')
    return "".join(out)


# ============================================================
# 5. 随机数老虎机
# ============================================================
def scene_random():
    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    out.append(f'<text x="2" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="56" lengthAdjust="spacingAndGlyphs">'
               f'RANDOM // ESP32</text>')
    out.append(f'<text x="82" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="44" lengthAdjust="spacingAndGlyphs">'
               f'ESP32 RNG</text>')

    # 三位数：logisoso24 近似，字宽 15，间距 6
    digits = "417"
    total = 3 * 15 + 2 * 6
    x = 64 - total / 2
    for d in digits:
        out.append(f'<text x="{x}" y="44" font-family="{MONO}" font-size="26" '
                   f'fill="{INK}" textLength="15" '
                   f'lengthAdjust="spacingAndGlyphs">{d}</text>')
        x += 21
    out.append(f'<rect x="8" y="48" width="112" height="1"/>')

    rng = random.Random(3)
    for i in range(16):
        h = rng.randint(2, 12)
        out.append(f'<rect x="{i * 8 + 1}" y="{63 - h}" width="6" '
                   f'height="{h}"/>')
    return "".join(out)


# ============================================================
# 6. U8G2 绘图 HUD
# ============================================================
def scene_hud():
    out = [f'<rect width="128" height="64" fill="{BG}"/>']
    out.append(f'<text x="2" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="56" lengthAdjust="spacingAndGlyphs">'
               f'U8G2 // SYSTEM</text>')
    out.append(f'<text x="82" y="6" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="44" lengthAdjust="spacingAndGlyphs">'
               f'UP 00:12</text>')

    out.append(f'<text x="2" y="30" font-family="{MONO}" font-size="20" '
               f'fill="{INK}" textLength="20" '
               f'lengthAdjust="spacingAndGlyphs">47</text>')
    out.append(f'<text x="26" y="30" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="12" lengthAdjust="spacingAndGlyphs">'
               f'FPS</text>')

    # 旋转六边形
    pts = []
    for i in range(6):
        a = 0.35 + i * math.pi / 3
        pts.append((102 + math.cos(a) * 12, 22 + math.sin(a) * 12))
    poly = " ".join(f"{px:.1f},{py:.1f}" for px, py in pts)
    out.append(f'<polygon points="{poly}" fill="none" stroke="{INK}" '
               f'stroke-width="1"/>')
    out.append(f'<circle cx="102" cy="22" r="7" fill="none" stroke="{INK}" '
               f'stroke-width="1"/>')

    out.append(f'<text x="2" y="37" font-family="{MONO}" font-size="6" '
               f'fill="{INK}" textLength="40" lengthAdjust="spacingAndGlyphs">'
               f'HEAP 245K</text>')
    out.append(f'<rect x="2" y="39" width="124" height="6" fill="none" '
               f'stroke="{INK}" stroke-width="1"/>')
    out.append(f'<rect x="3" y="40" width="56" height="4" fill="{INK}"/>')

    rng = random.Random(11)
    for i in range(62):
        h = rng.randint(0, 13)
        if h:
            out.append(f'<rect x="{2 + i * 2}" y="{62 - h}" width="1" '
                       f'height="{h}"/>')
    return "".join(out)


# ============================================================
# 排版
# ============================================================
SCENES = [
    (scene_rain, "DIGITAL RAIN", "数字雨：21 列，头部反白，尾巴随机闪烁"),
    (scene_heart, "BEATING HEART", "参数方程心形 + 扫描线填充 + 底部心电"),
    (scene_scope, "OSCILLOSCOPE", "128 点环形缓冲，2ms 采样，点阵网格"),
    (scene_walk, "ASCII WALK", "7×5 字符小人，4 帧走路循环 + 滚动地面"),
    (scene_random, "RANDOM NUMBERS", "三位数老虎机 + 16 根随机分布直方图"),
    (scene_hud, "U8G2 PRIMITIVES", "大号字 / 旋转六边形 / 内存条 / 帧率柱"),
]

add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
    f'viewBox="0 0 {W} {H}" font-family="{SANS}">')
add(f'<rect width="{W}" height="{H}" fill="#f4f6fb"/>')
add('<circle cx="842" cy="42" r="108" fill="#e3eaf8" opacity="0.7"/>')
add('<circle cx="24" cy="900" r="78" fill="#e3eaf8" opacity="0.55"/>')

add('<text x="30" y="46" font-size="23" font-weight="700" fill="#0f172a">'
    '界面预览 · 128×64 上的六个场景</text>')
add('<text x="30" y="68" font-size="11.5" fill="#64748b">'
    '每 12 秒自动轮播 · 短按 GPIO4 切换 · 长按开关 AUTO · 真实屏幕只有黑白两色'
    '</text>')

for i, ((fn, name, desc), (cx, cy)) in enumerate(zip(SCENES, POS)):
    add(f'<rect x="{cx}" y="{cy}" width="{CARD_W}" height="{CARD_H}" rx="12" '
        f'fill="#1e293b" stroke="#0b1220"/>')
    add(f'<circle cx="{cx + 20}" cy="{cy + 12}" r="3" fill="#334155"/>')
    add(f'<rect x="{cx + 10}" y="{cy + 10}" width="384" height="192" '
        f'fill="{BG}" stroke="#2b3648"/>')
    add(f'<g transform="translate({cx + 10},{cy + 10}) scale({SCALE})" '
        f'shape-rendering="crispEdges">{fn()}</g>')
    add(f'<text x="{cx + 10}" y="{cy + 224}" font-size="14.5" '
        f'font-weight="700" fill="#f8fafc">{name}</text>')
    add(f'<text x="{cx + 10}" y="{cy + 240}" font-size="9.5" '
        f'fill="#94a3b8">{desc}</text>')

add('</svg>')

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote {OUT}")
