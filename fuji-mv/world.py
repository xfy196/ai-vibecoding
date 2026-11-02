"""World builders — every location in the film, drawn at native 320x180.
Rules: every region filled (no #000 anywhere), buildings reach the ground, layers reach the frame edge,
each surface gets 2-4 tones plus texture, and every wide shot holds a warm light source against the cold.
Each builder returns a fresh copy of a cached base; animated layers are added per frame.
"""
import math, functools
from engine import hx, lerp, sm, lin, gradient, light, pixtext, pixtext_c, text_w, put, rain, shadow
from PIL import Image, ImageDraw

W, H = 320, 180


def d(im): return ImageDraw.Draw(im)


def rect(im, x, y, w, h, col): d(im).rectangle((x, y, x + w - 1, y + h - 1), fill=hx(col))
def px(im, x, y, col): d(im).point((int(x), int(y)), fill=hx(col))
def vline(im, x, y0, y1, col): d(im).line((int(x), y0, int(x), y1), fill=hx(col))
def hline(im, y, x0, x1, col): d(im).line((int(x0), int(y), int(x1), int(y)), fill=hx(col))


# ---------------------------------------------------------------- shared parts
def windows(im, x, y, w, h, cols=3, rows=4, lit='#f2c98a', dark='#3c3a52', dim='#8a6a5a', seed=0):
    gapx = max(3, (w - cols * 4) // max(1, cols)); gapy = max(4, (h - rows * 4) // max(1, rows))
    for r in range(rows):
        for c in range(cols):
            k = (r * 7 + c * 3 + seed * 5) % 9
            col = lit if k in (0, 1, 4) else (dim if k == 6 else dark)
            rect(im, x + 3 + c * gapx, y + 4 + r * gapy, 3, 3, col)


def building(im, x, y, w, h, body='#3a3550', shade='#2e2a42', cap='#4a4462', win_cols=3, seed=0, ground=180,
             lit='#f2c98a'):
    rect(im, x, y, w, ground - y, body)
    rect(im, x + w - 3, y, 3, ground - y, shade)
    rect(im, x, y, w, 2, cap)
    if h > 26: windows(im, x, y + 5, w, min(h - 8, ground - y - 6), cols=win_cols,
                       rows=max(1, (h - 8) // 9), seed=seed, lit=lit)


def lamp(im, x, y_top, y_ground, warm='#ffd08a', pool=True, r=34):
    vline(im, x, y_top, y_ground, '#2a2634'); vline(im, x + 1, y_top, y_ground, '#3a3548')
    rect(im, x - 4, y_top - 2, 9, 3, '#3a3646')
    rect(im, x - 3, y_top, 7, 1, warm)
    if pool: light(im, x, y_ground - 4, r, .34, '#ffcf8a')


def puddle(im, x, y, w, h=3, col='#5a5478', rim='#8a80a0'):
    d(im).ellipse((x, y, x + w, y + h), fill=hx(col))
    hline(im, y, x + 2, x + w - 2, rim)


def reflect(im, x, y_ground, w, col='#ffcf8a', h=10, q=0.30, seed=0):
    """A wet-ground reflection: a smooth vertical smear that narrows and fades downward, broken by a few
    ripple gaps. Widening w / raising q = a shop window; small w = a single lamp."""
    c = hx(col)
    for i in range(h):
        a = (1 - i / h) ** 1.25 * q * .8
        if a <= .02: break
        if (i * 7 + seed * 5) % 13 == 0: continue          # ripple break
        wdt = max(1, int(w * (.4 + 1.1 * i / h)))
        x0 = x - wdt // 2 + ((i * 3 + seed) % 3) - 1
        y = y_ground + i
        if not (0 <= y < H): continue
        for dx in range(wdt):
            xx = x0 + dx
            if 0 <= xx < W:
                edge = 1 - abs((dx / max(1, wdt - 1)) - .5) * 1.3
                im.putpixel((xx, y), lerp(im.getpixel((xx, y)), c, min(.85, a * (0.45 + 0.55 * edge))))


def wires(im, x0, y0, x1, y1, sag=6, col='#211f2c'):
    n = 30
    for i in range(n):
        q0, q1 = i / n, (i + 1) / n
        ay = y0 + (y1 - y0) * q0 + math.sin(math.pi * q0) * sag
        by = y0 + (y1 - y0) * q1 + math.sin(math.pi * q1) * sag
        d(im).line((x0 + (x1 - x0) * q0, ay, x0 + (x1 - x0) * q1, by), fill=hx(col))


def fuji_silhouette(im, cx, base, w, h, snow='#e6ebf7', rock='#4e4a6e', shade='#3a3656',
                    snow_line=.44, haze=None, plateau=.07, curve=1.3):
    """Mt Fuji: a small flat summit, flanks that curve slightly inward (half-width ~ u**curve, so it is not a
    triangle), an irregular snow tongue and clipped rock ridges. All detail is clipped to the body."""
    hw = w / 2.0
    top = base - h
    half_of = [max(1.5, hw * (plateau + (1 - plateau) * ((i / max(1, h - 1)) ** curve))) for i in range(h)]
    for i in range(h):
        u = i / max(1, h - 1); y = top + i; half = half_of[i]
        col = snow if u < snow_line else (rock if u < .84 else shade)
        d(im).line((cx - half, y, cx + half, y), fill=hx(col))
        if u > .08:                                        # rim light on the left flank
            d(im).line((cx - half, y, cx - half + max(1, int(half * .12)), y),
                       fill=hx('#f6f8ff' if u < snow_line else '#635e90'))
    inside = lambda x, y: 0 <= x < W and top <= y < base and abs(x - cx) <= half_of[int(y - top)]
    for k in range(int(hw * 2)):                           # ragged snow tongue, deeper in the gullies
        x = cx - int(hw) + k
        zig = .022 * math.sin(k * .55) + .014 * math.sin(k * 1.9)
        ey = top + int(h * (snow_line + zig))
        for y in range(ey, min(base, ey + int(h * .035))):
            if inside(x, y): px(im, x, y, snow)
    for k in range(4):                                     # faint wind ribs just under the crest
        gx = cx - int(hw * .26) + k * int(hw * .16)
        for i in range(int(h * .10)):
            x, y = gx + i // 9, top + int(h * .30) + i
            if inside(x, y): px(im, x, y, '#cfd6ea')
    for k in range(5):                                     # a few gullies in the rock band
        gx = cx - int(hw * .58) + k * int(hw * .29)
        for i in range(int(h * .16)):
            x, y = gx + i // 9, top + int(h * snow_line) + int(h * .07) + i
            if inside(x, y): px(im, x, y, shade)
    if haze:                                               # footfall haze into the horizon
        for i in range(7):
            y = base - i
            half = half_of[h - 1 - i] + i * 1.4
            d(im).line((cx - half, y, cx + half, y), fill=hx(haze))


# ---------------------------------------------------------------- 1. rainy street at night
@functools.lru_cache(maxsize=4)
def street_base(mood='night'):
    im = Image.new('RGB', (W, H))
    sky = {'night': ['#151026', '#221a38', '#38294c', '#4a3450'],
           'dusk': ['#2b2340', '#5a3a55', '#9a5a5a', '#c9866a'],
           'dawn': ['#2a2440', '#5b4a72', '#b07a86', '#e8b09a']}[mood]
    gradient(im, (0, 0, W, 148), sky)
    # --- far skyline (bluer, lower contrast: depth)
    for x, y, w in ((-4, 58, 40), (40, 44, 34), (78, 62, 28), (108, 36, 40),
                    (176, 60, 30), (210, 46, 36), (250, 66, 30), (284, 52, 40)):
        rect(im, x, y, w, 134 - y, '#2b2545')
        for r in range((134 - y) // 8):
            for c in range(w // 8):
                if (r * 5 + c * 3 + x) % 8 == 0: rect(im, x + 5 + c * 8, y + 6 + r * 8, 2, 2, '#cfa878')
    # --- left terrace house row
    building(im, -8, 52, 56, 82, '#3e3757', '#312b48', '#4e486e', 3, 1)
    rect(im, 4, 72, 30, 26, '#2a2640'); rect(im, 6, 74, 26, 22, '#e8c48a' if mood == 'night' else '#e8a86a')
    rect(im, 6, 88, 26, 2, '#8a6a48'); pixtext(im, (8, 76), '蕎麦', 10, '#5a3a28')
    building(im, 50, 66, 32, 68, '#3a3454', '#2e2946', '#4a4468', 2, 4)
    # --- the konbini: warm island, glass front with goods
    rect(im, 84, 78, 66, 56, '#262236')
    rect(im, 86, 82, 62, 40, '#e8dcb8')                     # lit glass
    gradient(im, (86, 82, 148, 124), ['#f6ecca', '#e0d2a8'])
    for y in range(88, 122, 7):                             # shelves inside, goods as soft blocks
        rect(im, 88, y, 40, 2, '#b89e78')
        for k in range(6): rect(im, 89 + k * 7, y - 3, 5, 3, ['#b06a58', '#6a86a8', '#88a07a', '#c0a468'][k % 4])
    rect(im, 130, 84, 16, 38, '#f2e6c0'); pixtext(im, (132, 92), '新', 10, '#c05a3a')
    for x in (86, 116, 148): vline(im, x, 82, 124, '#2a2640')
    hline(im, 104, 86, 148, '#2a2640')
    rect(im, 84, 78, 66, 4, '#4a4260')
    pixtext(im, (88, 66), '24H', 11, '#8ad0b0')
    pixtext(im, (112, 66), '便利店', 10, '#f2c98a')
    light(im, 116, 122, 46, .32, '#ffe3b0')
    # --- right block: eatery with a lantern + a vending machine
    building(im, 156, 54, 74, 80, '#3c3456', '#2f2a48', '#4c466c', 3, 2)
    rect(im, 162, 86, 34, 48, '#33262c')
    rect(im, 164, 90, 30, 28, '#e8a05a')
    pixtext(im, (167, 92), '居酒', 10, '#7a2a22')
    pixtext(im, (174, 105), '屋', 10, '#7a2a22')
    light(im, 179, 126, 26, .3, '#ffb457')
    rect(im, 200, 84, 22, 36, '#2f2b42'); rect(im, 202, 86, 18, 32, '#7a4e60')
    pixtext(im, (204, 90), '自販', 8, '#ffd8a0')
    building(im, 226, 62, 46, 72, '#39325a', '#2d2948', '#494370', 2, 8)
    rect(im, 268, 68, 52, 66, '#352f4e')                     # wall to the frame edge
    rect(im, 268, 68, 52, 4, '#484268')
    pixtext(im, (282, 84), '薬', 12, '#9ad8c0')
    # --- ground: a deep wet pavement (the characters live here), kerb, road below
    rect(im, 0, 132, W, 38, '#3d3854')
    rect(im, 0, 132, W, 2, '#4e4868')
    for i, y in enumerate((140, 150, 161)):                    # paving lines in perspective
        hline(im, y, 0, W, '#454060'); hline(im, y + 1, 0, W, '#37324c')
    for x in range(0, W, 22): vline(im, x, 132, 170, '#443e5a')
    for x in range(11, W, 22): vline(im, x, 140, 170, '#403a56')
    rect(im, 0, 170, W, 2, '#565072')                          # kerb edge
    rect(im, 0, 172, W, 8, '#26232f')                          # road at the very bottom
    for x in range(2, W, 22): rect(im, x, 176, 12, 2, '#86785a')
    # --- wet reflections: long vertical smears under every warm source
    reflect(im, 116, 133, 40, '#ffe0a8', 34, .5)
    reflect(im, 179, 133, 20, '#ffb457', 26, .45)
    reflect(im, 66, 168, 14, '#ffcf8a', 10, .4)
    reflect(im, 216, 168, 14, '#ffcf8a', 10, .4)
    reflect(im, 210, 133, 10, '#ff9a7a', 14, .3)
    puddle(im, 20, 154, 42, 5, '#514c74', '#8a80a0'); puddle(im, 140, 160, 54, 6, '#4f4a72', '#867a96')
    puddle(im, 236, 152, 38, 5, '#514c74', '#8a80a0')
    for x, col in ((30, '#ffe0a8'), (250, '#ffcf8a')): reflect(im, x, 153, 12, col, 8, .34)
    # --- lamps, pole, wires
    lamp(im, 66, 56, 168, r=30); lamp(im, 216, 60, 168, r=30)
    vline(im, 8, 14, 170, '#241f30'); vline(im, 9, 14, 170, '#332c40')
    rect(im, 0, 24, 18, 2, '#241f30'); rect(im, 0, 34, 18, 2, '#241f30')
    wires(im, 9, 24, 216, 52, 7); wires(im, 9, 34, 216, 62, 9)
    # --- wet reflections: long vertical smears under every warm source
    reflect(im, 116, 150, 30, '#ffe0a8', 22, .5)
    reflect(im, 179, 150, 14, '#ffb457', 18, .45)
    reflect(im, 66, 150, 10, '#ffcf8a', 14, .4)
    reflect(im, 216, 150, 10, '#ffcf8a', 14, .4)
    reflect(im, 210, 150, 8, '#ff9a7a', 10, .3)
    puddle(im, 24, 156, 40, 5, '#4e496c', '#8a80a0'); puddle(im, 138, 164, 52, 6, '#4c4770', '#867a96')
    puddle(im, 240, 158, 36, 5, '#4e496c', '#8a80a0')
    for x, col in ((24, '#ffe0a8'), (240, '#ffcf8a')): reflect(im, x + 12, 156, 8, col, 6, .3)
    return im


def street(mood='night'):
    return street_base(mood).copy()


# ---------------------------------------------------------------- 2. inside the car (side view, the two of them)
@functools.lru_cache(maxsize=1)
def car_base():
    """Back seat, seen from the side. Window band 26..78, seat band 82..126, cushion 126..134, floor below.
    The characters sit with their shoes at y = 128 so their heads land at 98 — level with the window."""
    im = Image.new('RGB', (W, H))
    # --- outside the side window: night traffic, smeared by rain
    gradient(im, (0, 0, W, 82), ['#1c1732', '#2e2548', '#4a3660'])
    for x, y, w, h in ((-10, 26, 90, 52), (86, 18, 70, 60), (168, 30, 96, 50), (272, 22, 70, 56)):
        rect(im, x, y, w, h, '#3a3158')
        for k in range(w // 11):
            if (k + x) % 3: rect(im, x + 5 + k * 11, y + 8 + (k % 4) * 8, 5, 4, '#e8bc78')
    for x in (30, 128, 240):
        light(im, x, 70, 26, .5, '#ffb85a'); light(im, x, 70, 9, .6, '#fff0c0')
    for x in range(0, W, 7): rect(im, x, 74, 4, 2, '#4e4270')
    # --- roof + dome light
    rect(im, 0, 0, W, 22, '#2b2536')
    rect(im, 0, 19, W, 3, '#3c3448')
    rect(im, 142, 3, 30, 6, '#4a4058'); rect(im, 144, 5, 26, 3, '#ffe6b8')
    light(im, 160, 10, 40, .2, '#ffe0b0')
    # --- window frame + belt line + pillar
    rect(im, 0, 22, W, 4, '#211d2a')
    rect(im, 0, 78, W, 5, '#211d2a'); rect(im, 0, 79, W, 2, '#3a3448')
    vline(im, 4, 26, 78, '#241f2e'); vline(im, 315, 26, 78, '#241f2e')
    rect(im, 152, 26, 8, 52, '#2a2536'); rect(im, 153, 26, 2, 52, '#3c3448')
    # --- seat band: headrests + backs (the whole band filled so the canvas never shows)
    rect(im, 0, 82, W, 44, '#332c46')
    rect(im, 0, 82, W, 2, '#3e3757')
    for x in (128, 190):
        rect(im, x - 9, 80, 18, 12, '#463c5e'); rect(im, x - 7, 82, 14, 8, '#544a70')
        rect(im, x - 11, 92, 22, 36, '#463c60'); rect(im, x - 9, 94, 18, 32, '#554a72')
        rect(im, x - 11, 92, 2, 36, '#332c46'); rect(im, x - 9, 110, 18, 2, '#3a3252')
        rect(im, x - 9, 94, 18, 1, '#6a5e8a')
    # --- cushion + floor
    rect(im, 0, 126, W, 8, '#4c4368'); rect(im, 0, 126, W, 2, '#5e5480')
    for x in range(0, W, 26): vline(im, x, 128, 132, '#3e3757')
    rect(im, 0, 134, W, 46, '#2a2438')
    for y in (144, 154, 164): hline(im, y, 0, W, '#322b40')
    for x in range(4, W, 13): vline(im, x, 136, 180, '#2f2940')
    rect(im, 236, 150, 22, 14, '#463a52'); rect(im, 236, 150, 22, 3, '#564868')
    # --- door hardware
    rect(im, 262, 146, 46, 4, '#4a4058'); rect(im, 270, 138, 14, 5, '#5a5070')
    d(im).ellipse((14, 150, 40, 166), fill=hx('#332c46')); d(im).ellipse((17, 153, 37, 163), outline=hx('#453c5c'))
    # --- rear-view mirror + her charm
    rect(im, 134, 1, 44, 10, '#1d1926'); rect(im, 136, 3, 40, 6, '#3a3448')
    vline(im, 156, 11, 18, '#5a4a3a')
    rect(im, 153, 16, 8, 8, '#c8463c'); rect(im, 154, 18, 6, 4, '#e8d8b0')
    # --- warmth from below
    light(im, 160, 160, 70, .16, '#ffb457')
    return im


def car():
    return car_base().copy()


def glass_rain(im, t, n=58):
    """Rain crawling down the side window (band 22..78)."""
    for i in range(n):
        x = 8 + (i * 71) % 300
        y0 = 24 + int((i * 37 + t * 9) % 52)
        L = 3 + i % 4
        vline(im, x, y0, min(77, y0 + L), '#c8d2e6' if i % 3 else '#96a0bc')
    for i in range(7):
        x = 22 + i * 30; y = 26 + int((i * 13 + t * 3) % 46)
        vline(im, x, y, y + 6, '#a6b0c8')


# ---------------------------------------------------------------- 3. florist stall
@functools.lru_cache(maxsize=1)
def florist_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 120), ['#1c1730', '#2d2446', '#4a3450'])
    building(im, 0, 26, 210, 114, '#3c3454', '#2f2a46', '#4c466a', 4, 5)
    building(im, 210, 42, 110, 98, '#37324c', '#2b2740', '#464260', 3, 6)
    for i in range(23): rect(im, 10 + i * 13, 56, 13, 13, '#8e4a4a' if i % 2 else '#ecdcbe')
    rect(im, 10, 69, 300, 2, '#5a3434')
    pixtext(im, (150, 34), '生 花', 14, '#f2d8a0')
    pixtext(im, (168, 72), '花束', 10, '#f2d8a0')
    # interior: wall of hanging flowers, counter
    rect(im, 18, 82, 284, 60, '#3a2a34')
    gradient(im, (18, 82, 302, 118), ['#4a3038', '#3a2630'])
    light(im, 160, 92, 84, .34, '#ffd08a')
    for i in range(5):                                  # hanging bunches
        x = 30 + i * 56
        rect(im, x + 4, 82, 2, 8, '#5a4a3a')
        for k in range(5):
            px(im, x + 2 + (k % 3), 90 + k * 3, ['#e06a7a', '#f2e0a0', '#c08ad8'][i % 3])
    rect(im, 18, 114, 284, 28, '#2a2230')
    rect(im, 18, 114, 284, 3, '#4a3a44')
    for y in range(116, 141, 4): hline(im, y, 18, 302, '#332a36')   # half-down metal shutter
    rect(im, 96, 60, 10, 4, '#4a3a3a'); rect(im, 98, 64, 6, 3, '#ffe6b0')
    light(im, 101, 74, 30, .34, '#ffe0a8')
    # pavement + buckets of flowers
    for bx, hcol in ((22, '#e06a7a'), (52, '#f2e0a0'), (82, '#c08ad8'), (206, '#f2f2f0'), (236, '#e85a4a'), (266, '#f0a0c0')):
        rect(im, bx, 114, 26, 20, '#3a3448'); rect(im, bx, 114, 26, 2, '#5a5270')
        rect(im, bx + 1, 132, 24, 2, '#2f2a3c')
        for k in range(8):
            fx = bx + 3 + k * 3; fy = 104 + ((k * 5) % 5)
            vline(im, fx, fy + 2, 114, '#46543a')
            rect(im, fx - 1, fy - 3 + (k % 2), 4, 4, hcol)
            px(im, fx, fy - 3 + (k % 2), '#fff0e0')
    rect(im, 0, 138, W, 42, '#39344a'); rect(im, 0, 138, W, 4, '#4a4462')
    for y in range(148, 180, 9): hline(im, y, 0, W, '#433e58')
    for x in range(0, W, 24): vline(im, x, 142, 180, '#403b56')
    reflect(im, 160, 144, 30, '#ffd8a0', 12, .26)
    puddle(im, 108, 156, 66, 6, '#4e4a6c', '#8a7a9a')
    light(im, 160, 152, 44, .26, '#ffd08a')
    return im


def florist():
    return florist_base().copy()


# ---------------------------------------------------------------- 4. the snow road (memory)
@functools.lru_cache(maxsize=3)
def snow_base(mood='dusk'):
    im = Image.new('RGB', (W, H))
    sky = {'dusk': ['#3a3560', '#6b5580', '#b07a86', '#e8b4a0'],
           'night': ['#191730', '#282444', '#3a3360', '#4a3f68'],
           'dawn': ['#2a2a4c', '#6a5a86', '#c88a96', '#f0c8b0']}[mood]
    gradient(im, (0, 0, W, 130), sky)
    for x in range(W):                                     # far ridge
        y = 92 - int(9 * math.sin(x * .02) + 5 * math.sin(x * .05))
        vline(im, x, y, 132, '#4e4870')
    fuji_silhouette(im, 238, 112, 108, 74, snow='#dfe4f2', rock='#5a5480', shade='#464064', snow_line=.46)
    for x in range(W):                                     # nearer ridge
        y = 120 - int(4 * math.sin(x * .03 + 1))
        vline(im, x, y, 134, '#5e5880')
    # pines: layered triangles with snow on the left side
    for i, (x, hh) in enumerate(((-2, 30), (22, 38), (44, 26), (272, 34), (296, 42), (316, 28))):
        for k in range(hh):
            wd = max(1, int((hh - k) * .42))
            y = 132 - hh + k
            d(im).line((x - wd, y, x + wd, y), fill=hx('#26314a'))
            d(im).line((x - wd, y, x - wd + 2, y), fill=hx('#dfe6f0'))
        rect(im, x - 1, 130, 3, 8, '#3a2e2a')
    # snow field + ploughed road
    rect(im, 0, 130, W, 50, '#c6ceE2'.lower())
    rect(im, 0, 130, W, 3, '#eef2fa')
    d(im).polygon([(92, 180), (148, 130), (180, 130), (252, 180)], fill=hx('#b6c0d6'))
    d(im).polygon([(118, 180), (156, 130), (172, 130), (208, 180)], fill=hx('#cdd4e4'))
    for y in range(134, 180, 7): hline(im, y, 98, 248, '#a8b2ca')
    d(im).polygon([(0, 150), (50, 141), (80, 152), (0, 166)], fill=hx('#e4eaf6'))
    d(im).polygon([(246, 148), (320, 139), (320, 164), (252, 158)], fill=hx('#e4eaf6'))
    for k in range(50): px(im, (k * 37) % W, 132 + (k * 13) % 46, '#ffffff')
    light(im, 160, 118, 90, .14, '#ffd8b0')
    return im


def snow(mood='dusk'):
    return snow_base(mood).copy()


def footprints(im, pts, col='#a2aec8'):
    for (x, y) in pts:
        rect(im, x, y, 2, 1, col); rect(im, x + 3, y + 2, 2, 1, col)


# ---------------------------------------------------------------- 5. Fuji across the lake
@functools.lru_cache(maxsize=3)
def fuji_base(mood='dusk'):
    im = Image.new('RGB', (W, H))
    sky = {'dusk': ['#2a2242', '#4a3560', '#8a5a72', '#d89a8a', '#f0c8a8'],
           'rain': ['#22203a', '#33304c', '#4a4460', '#5a5470'],
           'dawn': ['#2e2a4c', '#6a5480', '#c08494', '#f0b8a0', '#ffe0c0']}[mood]
    gradient(im, (0, 0, W, 118), sky)
    if mood == 'rain':
        for x in range(0, W, 3):
            b = 30 + (x * 7) % 14
            vline(im, x, 0, 96, '#%02x%02x%02x' % (b, b + 4, b + 14))
    fuji_silhouette(im, 158, 118, 176, 96,
                    snow='#eef2fc' if mood != 'rain' else '#cdd3e4',
                    rock='#514c74' if mood != 'rain' else '#4a4766',
                    shade='#3c3758', snow_line=.42)
    for x in range(W):
        y = 118 - int(5 * math.sin(x * .014 + 2) + 3 * math.sin(x * .04))
        vline(im, x, y, 126, '#403a60')
    # lake
    rect(im, 0, 118, W, 62, '#43406a')
    for y in range(120, 180, 2):
        hline(im, y, 0, W, '#4d4a78' if (y // 2) % 2 else '#3b3862')
    for i in range(20):                                   # mountain reflection, broken by ripples
        y = 120 + i * 2; wd = int(64 * (1 - i / 22))
        if wd <= 1: break
        seg = max(1, wd // 5)
        for j in range(6):
            x0 = 158 - wd + j * seg * 2 + (i * 3) % 4
            hline(im, y, x0, min(158 + wd, x0 + seg + (i % 3)), '#6a6692' if i > 3 else '#8e94b8')
    for i in range(8):
        y = 122 + i * 2; wd = int(26 * (1 - i / 10))
        if wd <= 1: break
        hline(im, y, 158 - wd, 158 + wd, '#a2a8c8')
    for k in range(34): px(im, (k * 47) % W, 132 + (k * 17) % 44, '#8a88b8')
    # shore: a wooden pier + post
    rect(im, 0, 170, W, 10, '#2e2a44')
    for x in range(0, W, 12): vline(im, x, 170, 180, '#3a3450')
    for y in range(166, 172): hline(im, y, 236, 320, '#5a4a44')
    for x in (240, 258, 276, 294, 312): vline(im, x, 166, 172, '#443436')
    return im


def fuji(mood='dusk'):
    return fuji_base(mood).copy()


# ---------------------------------------------------------------- 6. lab bench (the test tube)
@functools.lru_cache(maxsize=1)
def lab_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 122), ['#131726', '#1d2334', '#282e42'])
    rect(im, 0, 120, W, 60, '#2b2c38'); rect(im, 0, 120, W, 3, '#3e4050')
    rect(im, 0, 120, W, 40, '#2e2f3c')
    # window with snow outside
    rect(im, 198, 28, 96, 78, '#1a2030'); rect(im, 202, 32, 88, 70, '#39445e')
    for k in range(34): px(im, 204 + (k * 29) % 84, 34 + (k * 17) % 66, '#c8d4e8')
    vline(im, 246, 32, 102, '#1a2030'); hline(im, 66, 202, 290, '#1a2030')
    # shelves with glassware
    rect(im, 14, 46, 160, 4, '#33343f'); rect(im, 14, 46, 160, 1, '#494a5a')
    for i in range(8):
        x = 20 + i * 19
        rect(im, x, 34, 3, 12, '#5a6478'); rect(im, x - 3, 42, 9, 4, '#7a8498')
        px(im, x + 1, 36, '#9fc8e0'); px(im, x + 1, 38, '#7aa0c0')
    rect(im, 14, 80, 160, 4, '#33343f'); rect(im, 14, 80, 160, 1, '#494a5a')
    for i in range(6):
        x = 22 + i * 24
        d(im).ellipse((x, 68, x + 14, 80), fill=hx('#454d60'))
        d(im).arc((x, 68, x + 14, 80), 200, 340, fill=hx('#6a7288'))
    # bench with vessels
    rect(im, 0, 120, W, 2, '#424456')
    for x, hgt, col in ((56, 22, '#4a2a3a'), (86, 28, '#38284a'), (116, 18, '#2a3a46')):
        rect(im, x, 120 - hgt, 9, hgt, '#3c4458')
        rect(im, x + 1, 126 - hgt, 7, hgt - 7, col)
        vline(im, x + 2, 124 - hgt, 120 - 2, '#a8c0d8')
        rect(im, x + 3, 121 - hgt, 3, 2, '#e8f0f8')
    # the lamp
    vline(im, 292, 92, 122, '#33343f'); d(im).line((292, 92, 268, 80), fill=hx('#33343f'), width=2)
    d(im).polygon([(254, 80), (276, 74), (283, 90), (261, 95)], fill=hx('#3c3e4e'))
    d(im).polygon([(258, 84), (274, 79), (279, 89), (263, 93)], fill=hx('#ffe0a8'))
    light(im, 266, 100, 50, .36, '#ffd8a0')
    reflect(im, 266, 122, 20, '#ffd8a0', 10, .2)
    return im


def lab():
    return lab_base().copy()


# ---------------------------------------------------------------- 7. riverbank (the stone)
@functools.lru_cache(maxsize=1)
def river_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 108), ['#241f3e', '#4a3a5e', '#8a5f6e', '#c08a7a'])
    for x in range(W):
        y = 82 - int(5 * math.sin(x * .02 + 1))
        vline(im, x, y, 106, '#3a3454')
    for x in range(W):                                    # far hills
        y = 96 - int(4 * math.sin(x * .03 + 2))
        vline(im, x, y, 106, '#312d4a')
    # bridge silhouette with lamps
    rect(im, 40, 96, 240, 4, '#2a2740')
    for k in range(2):
        d(im).arc((60 + k * 110, 60, 150 + k * 110, 110), 180, 360, fill=hx('#2a2740'), width=4)
        d(im).arc((68 + k * 110, 68, 142 + k * 110, 110), 180, 360, fill=hx('#2a2740'), width=2)
    for x in range(56, 268, 16): vline(im, x, 84, 96, '#2a2740')
    for x in (76, 132, 196, 252):
        rect(im, x, 80, 2, 4, '#ffc887'); light(im, x, 84, 10, .3, '#ffc887')
    # water
    rect(im, 0, 106, W, 38, '#3c4360')
    for y in range(108, 144, 2): hline(im, y, 0, W, '#465072' if (y // 2) % 3 else '#343a56')
    for k in range(26):
        x = (k * 53) % W; y = 110 + (k * 11) % 32
        hline(im, y, x, x + 6 + (k % 5) * 3, '#6a7a9c')
    for x in (76, 132, 196, 252):                          # lamp reflections in the water
        reflect(im, x, 108, 6, '#ffc887', 14, .3)
    # near bank of stones
    d(im).polygon([(0, 140), (W, 132), (W, 180), (0, 180)], fill=hx('#4a4458'))
    d(im).polygon([(0, 140), (W, 132), (W, 136), (0, 144)], fill=hx('#5c566c'))
    for i, (x, y, w, h) in enumerate(((20, 152, 18, 9), (54, 160, 12, 7), (106, 148, 22, 10), (166, 158, 16, 8),
                                      (212, 150, 20, 9), (266, 160, 14, 7))):
        d(im).ellipse((x, y, x + w, y + h), fill=hx('#5f5a70' if i % 2 else '#6d6780'))
        d(im).arc((x, y, x + w, y + h), 190, 330, fill=hx('#837d98'))
        d(im).arc((x, y + h - 3, x + w, y + h + 1), 20, 160, fill=hx('#3e394e'))
    for k in range(24): px(im, (k * 41) % W, 144 + (k * 19) % 34, '#7a7488')
    return im


def river():
    return river_base().copy()


# ---------------------------------------------------------------- 8. crowded shopping street
@functools.lru_cache(maxsize=1)
def market_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 104), ['#1a1428', '#2e2138', '#4a2c3c'])
    for i in range(9):
        x = -8 + i * 38
        building(im, x, 30 + (i % 3) * 10, 38, 108, '#3c3654' if i % 2 else '#352f4a', '#2b2742', '#4c466c', 2, i)
    # shopfronts with warm light
    for x, col, txt in ((4, '#c8663a', '茶'), (78, '#3a7a8a', '湯'), (154, '#a8543a', '酒'),
                        (226, '#4a7a4a', '鮨'), (286, '#6a5a9a', '宿')):
        rect(im, x, 104, 26, 24, col); rect(im, x + 2, 108, 22, 20, '#f0d8a8')
        pixtext(im, (x + 6, 110), txt, 12, '#4a2a22')
        light(im, x + 13, 120, 20, .3, '#ffcf8a')
        # vertical neon sign
        rect(im, x + 2, 44, 18, 32, '#8a3a5a' if x % 3 == 0 else '#2a5a6a')
        rect(im, x + 4, 46, 14, 28, '#8a3a5a' if x % 3 == 0 else '#2a5a6a')
        pixtext(im, (x + 6, 50), txt, 13, '#ffe8c0')
    # lanterns strung overhead
    for i in range(12):
        x = 2 + i * 28; y = 70 + int(4 * math.sin(i * .7))
        vline(im, x, y - 6, y, '#3a2a2a')
        d(im).ellipse((x - 4, y, x + 4, y + 10), fill=hx('#d8563e' if i % 2 else '#e8c07a'))
        d(im).ellipse((x - 2, y + 2, x + 2, y + 6), fill=hx('#f8e0b0'))
    rect(im, 0, 128, W, 52, '#3a3446'); rect(im, 0, 128, W, 4, '#4c4664')
    for y in range(138, 180, 10): hline(im, y, 0, W, '#453f5c')
    for x in range(0, W, 20): vline(im, x, 132, 180, '#423c56')
    for x in (17, 95, 173, 251, 309): reflect(im, x, 130, 12, '#ffcf8a', 12, .26)
    light(im, 160, 142, 90, .16, '#ffc887')
    return im


def market():
    return market_base().copy()


# ---------------------------------------------------------------- 9. rooftop over the city
@functools.lru_cache(maxsize=1)
def roof_base():
    """A rooftop at night: a glowing sky over a dark skyline, a railing, and the city that will not care."""
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 120), ['#0f0c1c', '#1b1632', '#33254a', '#5a3c52', '#7a4a52'])
    # towers as silhouettes, sparse windows
    blocks = ((-6, 44, 40), (30, 62, 30), (56, 36, 34), (88, 54, 26), (112, 46, 44),
              (154, 66, 28), (180, 40, 38), (216, 58, 30), (244, 34, 40), (282, 50, 44))
    for i, (x, y, w) in enumerate(blocks):
        rect(im, x, y, w, 120 - y, '#241d3a')
        rect(im, x, y, w, 2, '#302747')
        for r in range((118 - y) // 8):
            for c in range(max(1, w // 8)):
                if (r * 5 + c * 3 + i * 2) % 7 == 0:
                    rect(im, x + 4 + c * 8, y + 6 + r * 8, 2, 3, '#f0c078')
        if i % 3 == 0: px(im, x + w // 2, y, '#e8584a')
    # streets: a low band of warm light between the towers, fading
    light(im, 160, 118, 120, .3, '#ffb070')
    light(im, 60, 116, 60, .2, '#ff9a60')
    # the roof we stand on
    rect(im, 0, 120, W, 60, '#2c2740'); rect(im, 0, 120, W, 2, '#3e3756')
    for x in range(0, W, 12): vline(im, x, 124, 180, '#332e48')
    for y in (140, 158): hline(im, y, 0, W, '#383149')
    # railing
    for x in range(0, W, 15): vline(im, x, 112, 136, '#4a4262')
    hline(im, 114, 0, W, '#5a5276'); hline(im, 114, 0, W, '#5a5276')
    hline(im, 134, 0, W, '#443c5c')
    # a water tank at the right, a lamp at the left
    rect(im, 262, 92, 46, 30, '#2f2946'); rect(im, 262, 92, 46, 3, '#403a58')
    rect(im, 266, 84, 3, 8, '#2a2540'); rect(im, 300, 84, 3, 8, '#2a2540')
    rect(im, 40, 84, 3, 30, '#3a3450'); rect(im, 36, 82, 11, 4, '#4a4258')
    rect(im, 37, 84, 9, 2, '#ffe0a8'); light(im, 41, 90, 26, .3, '#ffcf8a')
    # wet patch on the deck
    d(im).ellipse((120, 152, 196, 168), fill=hx('#39324e'))
    reflect(im, 158, 154, 26, '#ffb070', 12, .26)
    return im


def roof():
    return roof_base().copy()


# ---------------------------------------------------------------- 10. cherry-blossom avenue (spring)
@functools.lru_cache(maxsize=1)
def sakura_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 116), ['#2c2748', '#4e3d5e', '#8e6c84', '#c99aa0'])
    # trunks + branches
    for x in (12, 78, 150, 234, 306):
        rect(im, x, 78, 7, 64, '#3a2a30'); rect(im, x + 5, 78, 2, 64, '#281c22')
        d(im).line((x + 3, 96, x + 20, 76), fill=hx('#3a2a30'), width=3)
        d(im).line((x + 3, 100, x - 14, 82), fill=hx('#3a2a30'), width=3)
    # canopies: clustered blossoms (3 tones), closing overhead
    for cx, cy, r in ((24, 46, 36), (96, 34, 44), (172, 44, 40), (250, 32, 46), (314, 50, 30)):
        for k in range(46):
            a = k * 2.4; rr = r * (0.35 + 0.65 * ((k * 7) % 11) / 11)
            bx = cx + math.cos(a) * rr * 1.15; by = cy + math.sin(a) * rr * .62
            col = ('#d79aa8', '#e8b4be', '#f6cfd6', '#fce2e6')[(k * 3) % 4]
            d(im).ellipse((bx - 3, by - 2, bx + 3, by + 2), fill=hx(col))
    d(im).line((0, 60, W, 54), fill=hx('#e8b4be'), width=1)   # a low branch crossing the frame
    # a wall of blossom behind the trees so no gap shows between trunks
    rect(im, 0, 104, W, 40, '#b07e8e')
    for k in range(90):
        x = (k * 37) % W; y = 106 + (k * 13) % 34
        px(im, x, y, ('#c99aa0', '#dba8b4', '#b07e8e', '#e8bcc6')[k % 4])
    # stone path
    rect(im, 0, 140, W, 40, '#4a4458'); rect(im, 0, 140, W, 3, '#5c566c')
    for y in range(148, 180, 8): hline(im, y, 0, W, '#544e64')
    for x in range(0, W, 18): vline(im, x, 144, 180, '#514b60')
    for k in range(34): px(im, (k * 37) % W, 142 + (k * 13) % 36, '#f0c8d2')
    light(im, 160, 130, 90, .18, '#ffd8e0')
    return im


def sakura():
    return sakura_base().copy()


# ---------------------------------------------------------------- 11. train window / platform
@functools.lru_cache(maxsize=1)
def train_base():
    im = Image.new('RGB', (W, H))
    rect(im, 0, 0, W, H, '#262232')
    rect(im, 10, 12, 300, 96, '#181e2a')                     # window frame
    rect(im, 14, 16, 292, 88, '#6a7890')
    gradient(im, (14, 16, 306, 104), ['#7a86a0', '#a8b0c0', '#d0c8bc'])
    for x in range(14, 306):
        y = 72 - int(4 * math.sin(x * .03))
        vline(im, x, y, 104, '#68738a')
    fuji_silhouette(im, 100, 74, 80, 50, snow='#f2f5fc', rock='#7a8498', shade='#5e6678', snow_line=.45)
    for x in range(14, 306, 6): hline(im, 96 + (x % 7), x, x + 4, '#b8c0cc')
    for k in range(6): rect(im, 20 + k * 48, 100, 30, 5, '#7a8a78')
    hline(im, 16, 14, 306, '#5a6478')
    # carriage below the glass
    rect(im, 0, 108, W, 4, '#1c1826')
    rect(im, 0, 112, W, 68, '#2b2636'); rect(im, 0, 112, W, 2, '#3c3648')
    # luggage rack + hanging straps
    for x in range(24, 300, 30):
        vline(im, x, 108, 118, '#413a50'); rect(im, x - 3, 116, 7, 5, '#554c68')
    # seats
    for x0 in (0, 224):
        rect(im, x0, 124, 96, 40, '#413a52'); rect(im, x0, 124, 96, 4, '#544a68')
        rect(im, x0, 160, 96, 6, '#332e42')
        for k in range(3): vline(im, x0 + 20 + k * 28, 128, 158, '#4a4260')
    rect(im, 0, 166, W, 14, '#221e2e')
    for x in (120, 200): rect(im, x, 20, 2, 88, '#2a2634')
    light(im, 160, 60, 110, .2, '#e8e0d0')
    return im


def train():
    return train_base().copy()


# ---------------------------------------------------------------- 12. apartment entrance at night
@functools.lru_cache(maxsize=1)
def door_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 124), ['#191530', '#282242', '#3a3150'])
    building(im, 0, 16, 320, 124, '#3c3452', '#2f2a46', '#4c4668', 5, 3)
    for x, y in ((10, 26), (56, 26), (104, 32), (196, 26), (250, 32), (298, 26)):
        rect(im, x, y, 18, 20, '#2a2640'); rect(im, x + 2, y + 2, 14, 16, '#f0c88a' if x % 3 else '#5a5470')
        if x % 3 == 0: rect(im, x + 2, y + 2, 14, 16, '#5a5470')
    pixtext(im, (126, 38), '2F', 12, '#c8b090')
    # recessed entrance
    rect(im, 112, 52, 96, 88, '#241f36')
    rect(im, 118, 58, 84, 82, '#3a2e30')
    rect(im, 122, 62, 46, 78, '#c89a6a'); rect(im, 124, 64, 42, 74, '#dcb488')
    rect(im, 126, 68, 38, 32, '#f6dfae'); rect(im, 126, 104, 38, 26, '#eccb9a')
    for y in range(70, 100, 6): hline(im, y, 126, 164, '#bfa070')
    rect(im, 170, 62, 26, 78, '#2a2438')
    for y in range(68, 134, 10):
        rect(im, 173, y, 20, 7, '#3e3856'); px(im, 190, y + 3, '#ffb457')
    # a lit lamp above the door + light spill on the ground
    rect(im, 134, 50, 16, 4, '#3a3646'); rect(im, 136, 54, 12, 2, '#ffe0a8')
    light(im, 142, 132, 74, .36, '#ffcf8a')
    # steps + snow on the ledge
    for i in range(3): rect(im, 104 - i * 5, 140 + i * 4, 112 + i * 10, 4, '#4a4560')
    rect(im, 100, 138, 118, 3, '#dfe6f2')
    rect(im, 0, 152, W, 28, '#4a4458'); rect(im, 0, 152, W, 3, '#5c5672')
    for x in range(0, W, 16): vline(im, x, 156, 180, '#544e64')
    for k in range(18): px(im, (k * 37) % W, 158 + (k * 13) % 20, '#e4ebf6')
    puddle(im, 30, 160, 54, 6, '#5a5478', '#8a7a9a')
    reflect(im, 142, 154, 26, '#ffcf8a', 12, .3)
    return im


def door():
    return door_base().copy()


# ---------------------------------------------------------------- 13. convenience store
@functools.lru_cache(maxsize=1)
def konbini_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 124), ['#151228', '#221b38', '#322a44'])
    building(im, 0, 20, 320, 120, '#352f4a', '#292543', '#433d5e', 5, 7)
    rect(im, 16, 50, 288, 84, '#221e34')
    rect(im, 20, 54, 280, 76, '#f4e8c4')
    rect(im, 20, 54, 280, 5, '#fff2d0')
    # interior: shelves + counter
    for y in range(64, 126, 5):
        rect(im, 24, y, 132, 2, '#cdb692')
        for k in range(15):
            rect(im, 26 + k * 8, y - 3, 5, 3, ['#c85a4a', '#5a8ac8', '#8ac86a', '#d8b04a'][k % 4])
    rect(im, 168, 62, 106, 46, '#efdcb4')
    pixtext(im, (172, 66), 'HOT', 13, '#c04a3a')
    for k in range(4): rect(im, 172 + k * 26, 86, 18, 20, '#e0cba0')
    rect(im, 20, 100, 280, 6, '#e2ccA0'.lower())        # counter line
    rect(im, 150, 60, 3, 70, '#b89060')
    pixtext(im, (40, 30), '24H', 14, '#8ad0b0')
    # window frames + door
    for x in (20, 152, 296): vline(im, x, 54, 130, '#2a2640')
    hline(im, 98, 20, 300, '#2a2640')
    rect(im, 210, 96, 78, 34, '#e8d8b0'); rect(im, 212, 98, 74, 30, '#f6e8c8')
    pixtext(im, (214, 100), 'OPEN', 10, '#c04a3a')
    rect(im, 0, 130, W, 50, '#3a3448'); rect(im, 0, 130, W, 3, '#4c4664')
    for x in range(0, W, 20): vline(im, x, 134, 180, '#433d54')
    light(im, 160, 154, 96, .34, '#ffe3b0')
    light(im, 160, 96, 110, .18, '#ffe3b0')
    reflect(im, 160, 136, 40, '#ffe3b0', 16, .3)
    return im


def konbini():
    return konbini_base().copy()


# ---------------------------------------------------------------- 14. back alley at dawn
@functools.lru_cache(maxsize=1)
def alley_base():
    im = Image.new('RGB', (W, H))
    gradient(im, (0, 0, W, 126), ['#3a3456', '#7a5f7e', '#c08a92', '#f0c0a8'])
    building(im, -8, 18, 74, 120, '#4c4464', '#3c3652', '#5e5676', 3, 11)
    building(im, 78, 34, 52, 104, '#463e5a', '#37304a', '#58506c', 2, 12)
    building(im, 206, 26, 62, 112, '#483f60', '#38314e', '#5a5272', 3, 13)
    building(im, 270, 42, 62, 96, '#423a58', '#342e4a', '#524a68', 2, 14)
    pixtext(im, (86, 42), '宿', 12, '#c8a878')
    # the alley gap: wall, a back door, crates, a bicycle
    rect(im, 126, 56, 84, 84, '#2e2a44'); rect(im, 130, 60, 76, 80, '#39334e')
    rect(im, 150, 92, 34, 48, '#4a3a3a'); rect(im, 154, 96, 26, 40, '#5a4444')
    px(im, 176, 118, '#e8c07a')
    pixtext(im, (132, 64), '路地', 10, '#8a7aa0')
    rect(im, 136, 124, 14, 10, '#3b3550'); rect(im, 136, 124, 14, 2, '#4d4666')
    # a cat on the wall
    d(im).ellipse((196, 108, 206, 116), fill=hx('#2e2a3e'))
    d(im).ellipse((198, 102, 203, 109), fill=hx('#2e2a3e'))
    px(im, 199, 104, '#f2c94c'); px(im, 202, 104, '#f2c94c')
    # a back wall closing the alley so nothing shows through
    rect(im, 0, 120, W, 20, '#3a3352')
    for k in range(50):
        x = (k * 41) % W; y = 122 + (k * 17) % 16
        px(im, x, y, '#443c5c')
    # ground: snow with a cleared path
    rect(im, 0, 138, W, 42, '#cdd4e6'); rect(im, 0, 138, W, 3, '#eef2fa')
    d(im).polygon([(92, 180), (138, 138), (176, 138), (230, 180)], fill=hx('#bac4d8'))
    for k in range(34): px(im, (k * 41) % W, 142 + (k * 17) % 36, '#ffffff')
    for k in range(7): px(im, 120 + k * 12, 150 + k * 3, '#a8b2c8')
    light(im, 150, 138, 76, .24, '#ffd8b0')
    return im


def alley():
    return alley_base().copy()


# ---------------------------------------------------------------- animated overlays
def falling_snow(im, t, n=70, wind=1, col='#eef2fa'):
    dr = d(im)
    for i in range(n):
        x = (i * 61 + math.sin(t * .6 + i) * 10 + t * 6 * wind) % (W + 10) - 5
        y = (i * 43 + t * 22) % (H + 10) - 5
        dr.point((round(x), round(y)), fill=hx(col))
        if i % 3 == 0: dr.point((round(x), round(y) - 1), fill=hx(col))


def petals(im, t, n=26, col='#f2c0d0'):
    for i in range(n):
        x = (i * 71 + t * 14) % (W + 20) - 10
        y = (i * 37 + t * 26 + math.sin(t * 1.2 + i) * 6) % (H + 10) - 5
        px(im, x, y, col)
        if i % 4 == 0: px(im, x + 1, y, '#ffdce4')


def vignette(im, strength=.26, col='#1a1424'):
    p = im.load(); c = hx(col)
    for y in range(H):
        for x in range(W):
            dx, dy = (x - 160) / 160, (y - 90) / 90
            q = min(1, (dx * dx + dy * dy) * .55) * strength
            if q > .01: p[x, y] = lerp(p[x, y], c, q)
