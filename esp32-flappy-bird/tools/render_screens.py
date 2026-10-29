#!/usr/bin/env python3
"""
生成 docs/screens.svg：把 READY / PLAYING / GAME OVER 三帧按 128x64 的
逻辑坐标放大 3 倍画出来。

坐标和 game.cpp 保持一致：
  - 小鸟 12x8，游戏时停在 x=24
  - 水管宽 12，缺口 23，地面 y=59
  - HUD 分数 size=2，面板 8,8,112x42

只依赖标准库：python3 tools/render_screens.py
"""

from pathlib import Path

W, H = 800, 940
SCALE = 3
MONO = "'DejaVu Sans Mono','Consolas','Courier New',monospace"
SANS = ("-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',"
        "'Segoe UI',sans-serif")

STARS = [(6, 24, 1), (18, 12, 1), (30, 30, 3), (44, 20, 1), (58, 36, 1),
         (70, 10, 1), (82, 50, 1), (96, 26, 3), (108, 14, 1), (118, 42, 1),
         (12, 54, 1), (64, 52, 1), (102, 34, 1), (124, 20, 1)]


def text(x, y, s, size, color="#e8f1ff", anchor="start", weight="400"):
    """Adafruit 5x7 字体的近似：等宽 0.6em，字距 6*size，字高 7*size。"""
    anchor_attr = ' text-anchor="middle"' if anchor == "middle" else ""
    return (f'<text x="{x:.2f}" y="{y:.2f}" font-family="{MONO}" '
            f'font-size="{size * 10}" font-weight="{weight}" fill="{color}"'
            f'{anchor_attr}>{s}</text>')


def centered(y, s, size, color="#e8f1ff", weight="400"):
    return text(64, y + size * 7, s, size, color, "middle", weight)


def bird(x, y):
    return f'''<g transform="translate({x},{y})">
      <ellipse cx="6" cy="4" rx="5.6" ry="4" fill="#e8f1ff"/>
      <circle cx="8.5" cy="2.5" r="1" fill="#05080f"/>
      <path d="M10.5 3.4 L13 4.2 L10.5 5.2 Z" fill="#e8f1ff"/>
      <path d="M2 4.6 q3 2.8 6 1" fill="none" stroke="#05080f" stroke-width="0.8"/>
    </g>'''


def pipe(x, gap_y):
    top_h = gap_y
    bot_y = gap_y + 23
    bot_h = 59 - bot_y
    return f'''<g fill="none" stroke="#e8f1ff" stroke-width="1.2">
      <rect x="{x}" y="0" width="12" height="{top_h}"/>
      <rect x="{x}" y="{bot_y}" width="12" height="{bot_h}"/>
    </g>
    <g fill="#e8f1ff">
      <rect x="{x - 2}" y="{top_h - 4}" width="16" height="4"/>
      <rect x="{x - 2}" y="{bot_y}" width="16" height="4"/>
    </g>'''


def background():
    stars = "".join(
        f'<rect x="{x}" y="{y}" width="{ln}" height="1"/>' for x, y, ln in STARS)
    ground = ['<rect x="0" y="59" width="128" height="1"/>']
    for x in range(0, 128, 12):
        ground.append(f'<rect x="{x}" y="61" width="6" height="1"/>')
        ground.append(f'<rect x="{x + 6}" y="63" width="6" height="1"/>')
    return (f'<g fill="#e8f1ff" shape-rendering="crispEdges">{stars}</g>'
            f'<g fill="#e8f1ff" shape-rendering="crispEdges">{"".join(ground)}</g>')


def ready_screen():
    return f'''<rect width="128" height="64" fill="#05080f"/>
    {background()}
    {centered(4, "FLAPPY", 2)}
    {centered(21, "BIRD", 2)}
    {bird(14, 36)}
    {centered(40, "PRESS BOOT", 1)}
    {centered(51, "BEST 0", 1)}'''


def score(y, value, size=2):
    width = len(value) * 6 * size
    x = 64 - width / 2
    return (f'<text x="{x:.2f}" y="{y + size * 7}" font-family="{MONO}" '
            f'font-size="{size * 10}" font-weight="700" fill="#e8f1ff" '
            f'stroke="#05080f" stroke-width="2" paint-order="stroke">{value}</text>')


def playing_screen():
    return f'''<rect width="128" height="64" fill="#05080f"/>
    {background()}
    {pipe(52, 18)}
    {pipe(106, 28)}
    {score(0, "7")}
    {bird(24, 27)}'''


def gameover_screen():
    return f'''<rect width="128" height="64" fill="#05080f"/>
    {background()}
    {pipe(52, 18)}
    {pipe(106, 28)}
    {bird(24, 51)}
    <rect x="8" y="8" width="112" height="42" rx="5" fill="#e8f1ff"/>
    {text(37, 17, "GAME OVER", 1, "#05080f")}
    {text(52, 32, "12", 2, "#05080f", weight="700")}
    {text(43, 41, "BEST 20", 1, "#05080f")}
    {text(28, 49, "BOOT = RETRY", 1, "#05080f")}'''


def panel(y, title, subtitle, bullets, screen_svg, accent):
    bezel = y
    sx, sy = 50, y + 10
    out = [
        f'<rect x="40" y="{bezel}" width="404" height="212" rx="12" fill="#1e293b" stroke="#0b1220"/>',
        f'<circle cx="428" cy="{bezel + 12}" r="3" fill="{accent}" opacity="0.9"/>',
        f'<g transform="translate({sx},{sy}) scale({SCALE})" shape-rendering="crispEdges">{screen_svg}</g>',
        f'<text x="480" y="{y + 30}" font-size="19" font-weight="700" fill="#0f172a">{title}</text>',
        f'<text x="480" y="{y + 52}" font-size="11" fill="#64748b">{subtitle}</text>',
    ]
    for i, line in enumerate(bullets):
        by = y + 82 + i * 24
        out.append(f'<circle cx="485" cy="{by - 4}" r="2" fill="{accent}"/>')
        out.append(f'<text x="496" y="{by}" font-size="10.5" fill="#475569">{line}</text>')
    return "\n    ".join(out)


def state_diagram():
    boxes = [
        (40, "READY", "按 BOOT 开始", "#f59e0b"),
        (226, "PLAYING", "按 BOOT 扇翅膀", "#2563eb"),
        (412, "DYING", "坠落 0.7s · 闪屏 0.24s", "#dc2626"),
        (598, "GAME OVER", "按 BOOT 重开", "#16a34a"),
    ]
    out = ['<text x="40" y="812" font-size="12.5" font-weight="700" fill="#0f172a">状态机</text>']
    for x, name, sub, color in boxes:
        out.append(
            f'<rect x="{x}" y="824" width="152" height="50" rx="10" fill="#ffffff" stroke="{color}" stroke-width="1.4"/>'
            f'<text x="{x + 76}" y="846" font-size="12" font-weight="700" fill="{color}" text-anchor="middle">{name}</text>'
            f'<text x="{x + 76}" y="862" font-size="8.5" fill="#64748b" text-anchor="middle">{sub}</text>')
    # 正向箭头
    for x in (192, 378, 564):
        out.append(f'<path d="M{x + 6} 849 h20 m-5 -4 l5 4 l-5 4" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>')
    out.append('<text x="208" y="819" font-size="7.5" fill="#94a3b8" text-anchor="middle">开始</text>')
    out.append('<text x="394" y="819" font-size="7.5" fill="#94a3b8" text-anchor="middle">撞管 / 落地</text>')
    out.append('<text x="580" y="819" font-size="7.5" fill="#94a3b8" text-anchor="middle">动画结束</text>')
    # 重开箭头：GAME OVER 底部绕回 PLAYING
    out.append('<path d="M674 874 v18 H302 v-18" fill="none" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round"/>')
    out.append('<path d="M302 879 l-4 -6 h8 z" fill="#16a34a"/>')
    out.append('<text x="488" y="903" font-size="8" fill="#15803d" text-anchor="middle">重开（直接进入 PLAYING，不经过标题页）</text>')
    return "\n    ".join(out)


def build():
    rows = [
        panel(100, "READY", "标题页 · 等第一次按键", [
            "FLAPPY BIRD 标题 + 小鸟上下浮动",
            "BEST 从 NVS 读取，断电、重烧都不丢",
            "按 BOOT：开始，并立刻扇一次翅膀",
        ], ready_screen(), "#f59e0b"),
        panel(340, "PLAYING", "30Hz 逻辑 · 固定步长帧循环", [
            "重力 0.32，扇翅膀 -2.70，水管 1.15 px/帧",
            "过一根管 +1 分；数字用黑边描字，压管也看得清",
            "碰撞盒内缩 1px：碰管 / 落地 → DYING",
        ], playing_screen(), "#2563eb"),
        panel(580, "GAME OVER", "结算面板 · 新纪录写回 NVS", [
            "反色闪 0.24s + 坠落 0.7s，期间输入锁定",
            "面板显示本局分数 / BEST / NEW!",
            "BOOT = RETRY；350ms 锁定期防死亡连按",
        ], gameover_screen(), "#16a34a"),
    ]

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"
     font-family="{SANS}">
  <rect width="{W}" height="{H}" fill="#f4f6fb"/>
  <circle cx="762" cy="42" r="108" fill="#e3eaf8" opacity="0.7"/>
  <circle cx="20" cy="900" r="78" fill="#e3eaf8" opacity="0.55"/>

  <text x="40" y="46" font-size="23" font-weight="700" fill="#0f172a">界面预览 · 128×64 上的 Flappy Bird</text>
  <text x="40" y="68" font-size="11.5" fill="#64748b">READY / PLAYING / GAME OVER · 几何按 game.cpp 的坐标放大 3 倍 · 真实屏幕只有黑白两色</text>

  <rect x="560" y="27" width="200" height="32" rx="16" fill="#ffffff" stroke="#dbe3f0"/>
  <circle cx="575" cy="43" r="3.4" fill="#16a34a"/>
  <text x="584" y="47" font-size="10.5" font-weight="700" fill="#15803d">30 fps · 1 键 · 0 网络</text>

  {rows[0]}

  {rows[1]}

  {rows[2]}

  {state_diagram()}

  <text x="40" y="928" font-size="9" fill="#94a3b8">示意图：字体用等宽字体近似 Adafruit 5×7，像素几何与固件一致</text>
  <text x="760" y="928" font-size="9" fill="#94a3b8" text-anchor="end">esp32-flappy-bird · docs/screens.svg</text>
</svg>
'''
    out = Path(__file__).resolve().parent.parent / "docs" / "screens.svg"
    out.write_text(svg, encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    build()
