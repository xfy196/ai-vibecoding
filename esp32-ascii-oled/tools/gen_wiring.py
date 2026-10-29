#!/usr/bin/env python3
"""生成 docs/wiring.svg —— ESP32 DevKit V1 + 0.96" SSD1306 OLED 接线图。

只依赖标准库：python tools/gen_wiring.py
坐标都是 800x940 画布上的绝对坐标，改完重跑一次即可。
"""

from pathlib import Path

W, H = 800, 940
OUT = Path(__file__).resolve().parents[1] / "docs" / "wiring.svg"

SANS = ("-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',"
        "'Segoe UI',sans-serif")
MONO = "'DejaVu Sans Mono','Consolas','Courier New',monospace"

RED = "#ef4444"
GND = "#334155"
BLUE = "#2563eb"
GREEN = "#16a34a"
AMBER = "#f59e0b"

out = []
add = out.append


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def text(x, y, s, size=10, fill="#475569", weight="400", anchor="start",
         extra=""):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    add(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" '
        f'fill="{fill}"{a}{extra}>{s}</text>')


def chip(x, y, w, label, dot, color, fill="#ffffff", stroke="#dbe3f0"):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="32" rx="16" '
        f'fill="{fill}" stroke="{stroke}"/>')
    add(f'<circle cx="{x + 15}" cy="{y + 16}" r="3.4" fill="{dot}"/>')
    add(f'<text x="{x + 25}" y="{y + 20}" font-size="10" font-weight="700" '
        f'fill="{color}">{label}</text>')


# ============================================================
# 背景 + 标题
# ============================================================
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
    f'viewBox="0 0 {W} {H}" font-family="{SANS}">')
add(f'<rect width="{W}" height="{H}" fill="#f4f6fb"/>')
add('<circle cx="762" cy="42" r="108" fill="#e3eaf8" opacity="0.7"/>')
add('<circle cx="20" cy="880" r="78" fill="#e3eaf8" opacity="0.55"/>')

text(40, 46, "ESP32 DevKit V1 × 0.96″ OLED", 23, "#0f172a", "700")
text(40, 68, "ASCII 动画屏 · SSD1306 128×64 · I2C 四线 + 一个按键 · 3.3V",
     11.5, "#64748b")

chip(430, 27, 78, "3V3", RED, "#b91c1c")
chip(512, 27, 78, "GND", GND, "#334155")
chip(594, 27, 92, "SDA 21", BLUE, "#1d4ed8")
chip(690, 27, 92, "SCL 22", GREEN, "#15803d")

# ============================================================
# ESP32 卡片
# ============================================================
add('<rect x="40" y="100" width="210" height="300" rx="16" fill="#1e293b" '
    'stroke="#0b1220" stroke-width="1.2"/>')
add('<rect x="48" y="108" width="194" height="284" rx="11" fill="none" '
    'stroke="#334155"/>')
text(60, 131, "ESP32 DevKit V1", 14.5, "#f8fafc", "700")
text(60, 147, "WROOM-32 · 30-pin · 2.4GHz", 9, "#94a3b8")

# 天线
add('<g stroke="#475569" stroke-width="2" fill="none" stroke-linecap="round">'
    '<path d="M146 180 h14 v-8 h14 v8 h14 v-8 h14 v8 h14"/></g>')
text(146, 196, "2.4G 天线", 6.5, "#64748b")

# WROOM 模块
add('<rect x="62" y="164" width="80" height="66" rx="4" fill="#cbd5e1" '
    'stroke="#94a3b8"/>')
add('<rect x="68" y="170" width="68" height="54" rx="2" fill="none" '
    'stroke="#94a3b8"/>')
text(102, 194, "WROOM-32", 8, "#475569", "700", "middle")
text(102, 207, "ESP32-D0WD", 6.5, "#64748b", "middle")

text(62, 246, "逻辑画法：只画用到的 5 个脚", 8, "#64748b")
text(62, 258, "真实排针顺序见右下角", 8, "#64748b")

add('<circle cx="66" cy="275" r="2.6" fill="#22c55e"/>')
text(73, 278, "GPIO2 = 板载 LED（高电平亮）", 7, "#94a3b8")

# EN / BOOT
add('<rect x="62" y="296" width="34" height="13" rx="3" fill="#334155" '
    'stroke="#475569"/>')
text(79, 305.5, "EN", 6.5, "#cbd5e1", "600", "middle")
add('<rect x="100" y="296" width="44" height="13" rx="3" fill="#3b2a12" '
    'stroke="#f59e0b"/>')
text(122, 305.5, "BOOT", 6.5, "#fff7ed", "700", "middle")
text(150, 305.5, "= GPIO0", 6.5, "#fbbf24")

# USB-UART
add('<rect x="62" y="330" width="84" height="16" rx="3" fill="#243144" '
    'stroke="#3b4a63"/>')
text(104, 341, "CH340 / CP2102", 6, "#8fa3bf", "400", "middle")
add('<rect x="62" y="360" width="38" height="13" rx="3" fill="#94a3b8" '
    'stroke="#64748b"/>')
add('<rect x="68" y="363" width="26" height="7" rx="1.5" fill="#475569"/>')
text(106, 369, "micro-USB", 6.5, "#94a3b8")

text(62, 391, "按键接 GPIO4，不用板载 BOOT", 7.5, "#fbbf24", "700")

# 右缘引脚（逻辑顺序）
pins = [
    ("3V3", 214, "#fbbf24", "#b45309", "#111827"),
    ("GND", 252, "#fbbf24", "#b45309", "#111827"),
    ("GPIO21", 290, "#bfdbfe", BLUE, "#1e3a8a"),
    ("GPIO22", 328, "#bbf7d0", GREEN, "#14532d"),
    ("GPIO4", 366, "#fde68a", AMBER, "#78350f"),
]
for name, cy, fill, stroke, fg in pins:
    add(f'<rect x="238" y="{cy - 9}" width="20" height="18" rx="4" '
        f'fill="{fill}" stroke="{stroke}"/>')
    add(f'<circle cx="256" cy="{cy}" r="2.6" fill="#111827"/>')
    text(230, cy + 4.5, name, 11.5, "#e2e8f0", "700", "end")

# ============================================================
# OLED 卡片
# ============================================================
add('<rect x="440" y="100" width="204" height="300" rx="16" fill="#1e293b" '
    'stroke="#0b1220" stroke-width="1.2"/>')
add('<rect x="448" y="108" width="188" height="284" rx="11" fill="none" '
    'stroke="#334155"/>')
text(464, 132, "OLED 0.96″", 15, "#f8fafc", "700")
text(464, 148, "SSD1306 · 128×64 · I2C", 9, "#94a3b8")

# 屏幕里的「跳动的心」预览（和 firmware 里同一套参数方程）
add('<rect x="474" y="160" width="148" height="74" rx="3" fill="#05080f" '
    'stroke="#2b3648"/>')
add('<g transform="translate(474,160) scale(1.15625)">')
add('<rect width="128" height="64" fill="#05080f"/>')

import math

pts = []
for i in range(241):
    a = i * 2 * math.pi / 240
    sa = math.sin(a)
    hx = 16 * sa ** 3
    hy = (13 * math.cos(a) - 5 * math.cos(2 * a)
          - 2 * math.cos(3 * a) - math.cos(4 * a))
    pts.append((64 + hx * 1.9, 26 - hy * 1.45))

heart = []
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
        heart.append(f'<rect x="{cross[j]:.1f}" y="{row}" '
                     f'width="{max(cross[j + 1] - cross[j], 1):.1f}" '
                     f'height="1"/>')
add('<g fill="#e8f1ff" shape-rendering="crispEdges">' + "".join(heart) + '</g>')

# 心电波形
ECG = [0] * 36 + [1, 2, 4, 7, 9, -6, -3, 0] + [0] * 20
ecg_pts = " ".join(f"{x},{60 - ECG[(x + 12) % 64]}" for x in range(128))
add(f'<polyline points="{ecg_pts}" fill="none" stroke="#e8f1ff" '
    f'stroke-width="1"/>')
add(f'<text x="2" y="6" font-family="{MONO}" font-size="6" fill="#e8f1ff">'
    f'72 BPM</text>')
add('<circle cx="124" cy="3" r="2" fill="#e8f1ff"/>')
add('</g>')
text(464, 250, "2. BEATING HEART", 7.5, "#64748b")

# 左缘引脚
for name, cy, fill, stroke, fg, color in [
    ("VCC", 214, "#fbbf24", "#b45309", "#111827", "#e2e8f0"),
    ("GND", 252, "#fbbf24", "#b45309", "#111827", "#e2e8f0"),
    ("SDA", 290, "#bfdbfe", BLUE, "#1e3a8a", "#dbeafe"),
    ("SCL", 328, "#bbf7d0", GREEN, "#14532d", "#dcfce7"),
]:
    add(f'<rect x="420" y="{cy - 9}" width="20" height="18" rx="4" '
        f'fill="{fill}" stroke="{stroke}"/>')
    add(f'<circle cx="424" cy="{cy}" r="2.6" fill="#111827"/>')
    text(452, cy + 4.5, name, 11.5, color, "700")

text(464, 366, "认准 4 针 I2C 版（丝印可能是", 8, "#64748b")
text(464, 378, "SDA/SDI、SCL/SCK），7 针 SPI 版不适用", 8, "#64748b")

# ============================================================
# 连线
# ============================================================
add('<g stroke-linecap="round" fill="none">')
for cy, color in [(214, RED), (252, GND), (290, BLUE), (328, GREEN)]:
    add(f'<line x1="258" y1="{cy}" x2="420" y2="{cy}" stroke="{color}" '
        f'stroke-width="3.4"/>')
# GPIO4：先向右、再向下、最后向左进按键卡
add(f'<path d="M258 366 H300 V412 H150 V430" stroke="{AMBER}" '
    f'stroke-width="3.4" stroke-linejoin="round"/>')
add(f'<circle cx="150" cy="430" r="3.2" fill="{AMBER}"/>')
add('</g>')

# 线缆标签
labels = [(214, 100, "3V3 → VCC"), (252, 50, "GND"), (290, 100, "GPIO21 · SDA"),
          (328, 100, "GPIO22 · SCL")]
for cy, w, label in labels:
    add(f'<rect x="{343 - w / 2}" y="{cy - 11}" width="{w}" height="22" rx="11" '
        f'fill="#ffffff" stroke="#e2e8f0"/>')
    text(343, cy + 4, label, 10.5, "#334155", "600", "middle")

add(f'<rect x="306" y="372" width="96" height="20" rx="10" fill="#fffbeb" '
    f'stroke="#fde68a"/>')
text(354, 386, "GPIO4 → 按键", 9.5, "#b45309", "700", "middle")

# ============================================================
# 按键卡片
# ============================================================
add('<rect x="40" y="430" width="352" height="270" rx="13" fill="#ffffff" '
    'stroke="#e2e8f0"/>')
add('<rect x="58" y="444" width="3" height="13" rx="1.5" fill="#f59e0b"/>')
text(70, 455, "按键 · 短按切场景 / 长按开关轮播", 12.5, "#0f172a", "700")

text(58, 478, "一端接 GPIO4，一端接 GND；GPIO4 开内部上拉，", 8.5)
text(58, 492, "所以不用外接电阻，也不用面包板。", 8.5)
text(58, 506, "短按 = 下一个场景，长按 0.7 秒 = AUTO ON / OFF。", 8.5)

add('<rect x="56" y="518" width="320" height="132" rx="8" fill="#f8fafc" '
    'stroke="#e2e8f0" stroke-dasharray="4 3"/>')
text(68, 534, "等效电路（上拉在芯片内部）", 7.5, "#94a3b8", "700")

# 3V3 - 内部上拉 - 节点 - GPIO4
add('<rect x="68" y="548" width="44" height="16" rx="3" fill="#fef3c7" '
    'stroke="#d97706"/>')
text(90, 559.5, "3V3", 8, "#92400e", "700", "middle")
add('<line x1="112" y1="556" x2="126" y2="556" stroke="#d97706" stroke-width="1.8"/>')
add('<path d="M126 556 l5 -6 l7 12 l7 -12 l7 12 l7 -12 l5 6" fill="none" '
    'stroke="#f59e0b" stroke-width="1.8" stroke-linejoin="round"/>')
text(143, 543, "上拉 ~45k", 7, "#94a3b8", "400", "middle")
add('<line x1="164" y1="556" x2="214" y2="556" stroke="#f59e0b" stroke-width="1.8"/>')
add('<circle cx="186" cy="556" r="2.6" fill="#f59e0b"/>')
add('<rect x="214" y="548" width="58" height="16" rx="3" fill="#fef3c7" '
    'stroke="#d97706"/>')
text(243, 559.5, "GPIO4", 8, "#92400e", "700", "middle")

# 节点 -> 按键 -> GND
add('<line x1="186" y1="558" x2="186" y2="584" stroke="#f59e0b" stroke-width="1.8"/>')
add('<rect x="168" y="584" width="36" height="32" rx="5" fill="#334155" '
    'stroke="#475569"/>')
add('<circle cx="186" cy="600" r="8" fill="#64748b" stroke="#94a3b8"/>')
add('<circle cx="186" cy="600" r="3.4" fill="#334155"/>')
add('<line x1="186" y1="616" x2="186" y2="630" stroke="#334155" stroke-width="1.8"/>')
add('<rect x="160" y="630" width="52" height="16" rx="3" fill="#e2e8f0" '
    'stroke="#94a3b8"/>')
text(186, 641.5, "GND", 8, "#334155", "700", "middle")

text(214, 590, "按下 = GPIO4 拉低", 7.5)
text(214, 602, "松开 = 内部上拉拉高", 7.5, "#94a3b8")

text(58, 672, "长按 0.7 秒切换自动轮播，屏幕右上角会提示 AUTO ON / OFF", 8,
     "#b45309")
text(58, 688, "按键引脚改 config.h 里的 PIN_BUTTON 即可", 8, "#94a3b8")

# ============================================================
# 30 pin 排针
# ============================================================
add('<rect x="408" y="430" width="352" height="270" rx="13" fill="#ffffff" '
    'stroke="#e2e8f0"/>')
add('<rect x="426" y="444" width="3" height="13" rx="1.5" fill="#2563eb"/>')
text(438, 455, "30 pin 真实排针（天线朝上，USB 朝下）", 12.5, "#0f172a", "700")

text(426, 472, "左排 ↓", 7.5, "#94a3b8", "700")
text(612, 472, "右排 ↓", 7.5, "#94a3b8", "700")

LEFT = ["EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26", "D27",
        "D14", "D12", "D13", "GND", "VIN"]
RIGHT = ["3V3", "GND", "D15", "D2", "D4", "D16", "D17", "D5", "D18", "D19",
         "D21", "D3", "D1", "D22", "D23"]

HOT_LEFT = {"GND"}
HOT_RIGHT = {"3V3", "GND", "D4", "D21", "D22"}


def pin_row(x, w, names, hot, y0=480, step=13):
    for i, name in enumerate(names):
        y = y0 + i * step
        if name in hot:
            fill, stroke, fg = "#fbbf24", "#b45309", "#111827"
        else:
            fill, stroke, fg = "#e2e8f0", "#94a3b8", "#334155"
        add(f'<rect x="{x}" y="{y}" width="{w}" height="12" rx="3" '
            f'fill="{fill}" stroke="{stroke}"/>')
        weight = "700" if name in hot else "400"
        text(x + w / 2, y + 9, name, 7.5, fg, weight, "middle")


pin_row(450, 48, LEFT, HOT_LEFT)
pin_row(632, 64, RIGHT, HOT_RIGHT)

# 板子示意
add('<rect x="510" y="484" width="100" height="186" rx="6" fill="#f8fafc" '
    'stroke="#dbe3f0"/>')
add('<rect x="518" y="492" width="84" height="16" rx="2" fill="#e2e8f0"/>')
text(542, 503, "天线端 ↑", 6.5, "#94a3b8", "400", "middle")
add('<rect x="530" y="516" width="60" height="42" rx="2" fill="#cbd5e1" '
    'stroke="#94a3b8"/>')
text(560, 541, "WROOM-32", 6.5, "#475569", "700", "middle")
text(560, 592, "30 pin", 7, "#cbd5e1", "400", "middle")
add('<rect x="542" y="634" width="36" height="14" rx="3" fill="#94a3b8" '
    'stroke="#64748b"/>')
add('<rect x="548" y="637" width="24" height="8" rx="1.5" fill="#475569"/>')
text(542, 660, "USB 端 ↓", 6.5, "#94a3b8", "400", "middle")

text(426, 682, "高亮 = 本项目用到的脚：3V3、GND、D4（按键）、D21（SDA）、D22（SCL）",
     7.5, "#64748b")
text(426, 694, "D21 / D22 中间隔着 D3(RX0) 和 D1(TX0)，按丝印找，别插错",
     7.5, "#94a3b8")

# ============================================================
# 接线要点
# ============================================================
add('<rect x="40" y="724" width="720" height="186" rx="13" fill="#ffffff" '
    'stroke="#e2e8f0"/>')
add('<rect x="58" y="740" width="3" height="13" rx="1.5" fill="#16a34a"/>')
text(70, 751, "接线要点 · 五句话", 12.5, "#0f172a", "700")

bullets = [
    'VCC 只接 <tspan font-weight="700" fill="#b45309">3V3</tspan>（右排最上面那根），'
    '接 5V / VIN 会烧屏；GND 必须共地。',
    'SDA = <tspan font-weight="700" fill="#1d4ed8">GPIO21</tspan>，'
    'SCL = <tspan font-weight="700" fill="#15803d">GPIO22</tspan>：'
    'ESP32 默认 I2C 脚，两脚中间隔着 RX0(3) / TX0(1)。',
    '按键一端 <tspan font-weight="700" fill="#b45309">GPIO4</tspan>、一端 GND，'
    '内部上拉，不用电阻；不接也能用，等 12 秒自动轮播。',
    '别占用 <tspan font-weight="700" fill="#b91c1c">GPIO2</tspan>（板载 LED）、'
    'GPIO0（BOOT）、GPIO12 / GPIO15（strapping）、GPIO6–11（Flash）、GPIO1 / 3（串口）。',
    '400kHz I2C 下全屏刷新约 25ms；USB 供电即可，整机约 40mA。',
]
for i, line in enumerate(bullets):
    y = 775 + i * 24
    add(f'<circle cx="64" cy="{y - 4}" r="2" fill="#94a3b8"/>')
    add(f'<text x="74" y="{y}" font-size="10.5" fill="#475569">{line}</text>')

text(58, 890, "想接真波形：10k 电位器中间脚 → GPIO34，两端 → 3V3 / GND，"
              "再把 config.h 的 SCOPE_USE_ADC 改成 1。", 8.5, "#64748b")
text(58, 903, "电位器不是必需品：默认的示波器场景是固件内部合成的 3.2Hz 波形。",
     8.5, "#94a3b8")

# ============================================================
# 页脚
# ============================================================
text(40, 930, "断电后接线 · 上电前复查 VCC / GND", 9, "#94a3b8")
text(760, 930, "esp32-ascii-oled · docs/wiring.svg", 9, "#94a3b8", "400", "end")

add('</svg>')

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote {OUT}  ({len(out)} elements)")
