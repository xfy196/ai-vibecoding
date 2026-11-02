"""Scene helpers: camera framings, two-shots, contact-computed hand positions, memory tints."""
import math
from engine import (spr, put, hx, lerp, sm, lin, walkframe, side_hand, front_hand, head_top,
                    shadow, caption_img, rain, Canvas, layer, thumbs_press, clasped_hands, polaroid)
from PIL import Image, ImageDraw
import world as wo
import cast

W, H = 320, 180


# ---------------------------------------------------------------- framings
def wide(im): return im, (0, 0, 1)
def medium(x0, y0=72):
    return (int(x0), max(40, int(y0)), 2)      # 40 is the guard rail: higher would put feet behind the caption
def close(x0, y0=88):
    return (int(x0), int(y0), 2)
def hi(im): return im, (0, 0, 'hi')          # 640x360 canvas for polaroids


def follow(x, cx=160):
    """Camera x for a tracking shot: round() so the character does not shake."""
    return int(round(x)) - cx


# ---------------------------------------------------------------- two shots
def stand_he(im, x, feet, expr='neutral', hands=None, look=0, mirror=False, t=0.0, bob=0):
    put(im, spr('he', view='side', expr=expr, hands=hands or {'near': (0, 8)}, look=look, t=t, bob=bob),
        x, feet, mirror=mirror)


def stand_she(im, x, feet, expr='neutral', hands=None, look=0, mirror=True, t=0.0, bob=0, coat=False):
    put(im, spr('she', view='side', expr=expr, hands=hands or {'near': (0, 8)}, look=look, t=t, bob=bob),
        x, feet, mirror=mirror)
    if coat: cast.coat_over_shoulders(im, x, feet)


def sit_he(im, x, feet, expr='neutral', hands=None, t=0.0):
    put(im, spr('he', view='side', expr=expr, pose='sit_side', hands=hands or {'near': (2, 6)}, t=t), x, feet)


def sit_she(im, x, feet, expr='neutral', hands=None, t=0.0):
    put(im, spr('she', view='side', expr=expr, pose='sit_side', hands=hands or {'near': (2, 6)}, t=t), x, feet)


def facing_pair(im, x_he, feet, gap=28, he=dict(), she=dict()):
    """He faces right, she faces left, faces at least `gap` apart so they never overlap."""
    stand_he(im, x_he, feet, **he); stand_she(im, x_he + gap, feet, **she)


# ---------------------------------------------------------------- overlays
def breath(im, x, y, t, n=7, dirn=-1):
    """Cold breath: 3 puffs drifting up and to the side. Native pixels, 1px thick."""
    for i in range(n):
        q = (t * .9 + i / n) % 1.0
        px_ = x + dirn * (2 + q * 12); py = y - q * 10
        a = int(1 + q * 2)
        ImageDraw.Draw(im).ellipse((px_ - a, py - a, px_ + a, py + a), outline=hx('#dfe8f6'))


def fog(im, t, y0=60, y1=120, col='#cfd8ea', dens=.5):
    for i in range(26):
        x = (i * 53 + t * 8) % (W + 40) - 20
        y = y0 + (i * 37) % (y1 - y0)
        ImageDraw.Draw(im).line((x, y, x + 14, y), fill=hx(col))


def shimmer(im, t, y0=120, y1=170, n=26, col='#a8b0d0'):
    """Moving highlights on water — keeps a wide lake shot alive without a camera move."""
    for i in range(n):
        x = (i * 47 + t * 13) % W
        y = y0 + (i * 17) % (y1 - y0)
        L = 3 + (i % 4) * 2
        ImageDraw.Draw(im).line((x, y, min(W - 1, x + L), y), fill=hx(col))


def tilt_up(im, q, dz=40):
    """Cheap downward tilt: the world slides down as we look up. q 0..1."""
    src = im.copy()
    sh = int(q * dz)
    im.paste(src.crop((0, 0, W, H - sh)), (0, sh))
    if sh:
        im.paste(src.crop((0, H - 1 - sh, W, H - 1)), (0, H - sh - 1))


def rain_on(im, t, n=90, wind=3, shelter=None):
    rain(im, t, n=n, wind=wind, col='#a8bce8', shelter=shelter)


def warm_kiss(im, cx, cy, r=40, q=.22):
    from engine import light
    light(im, cx, cy, r, q, '#ffd0a0')


# ---------------------------------------------------------------- close-up hands (160x90 canvases)
HE_S = ('#e8b896', '#c98a6e', '#33495e', '#243546')
SHE_S = ('#f0c3a2', '#d4977b', '#cf9a63', '#ac7a48')


def hands_pair(q=1.0):
    return thumbs_press(q, L=SHE_S, R=HE_S)


def hands_clasp():
    return clasped_hands(left=HE_S, right=SHE_S)
