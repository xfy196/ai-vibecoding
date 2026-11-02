"""Parametric chibi pixel characters, drawn entirely in code (same look as the approved test).
Sprite canvas 32x52, shoe bottom row y=45, body centre x=16.
"""
import math
from PIL import Image

W, H = 32, 52
CX = 16
OUT = (43, 34, 51)


def hexc(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


BASE = dict(skin='#f2c6a0', skin_sh='#d99a7a', blush='#ee8f8a', mouth='#8a3d3d', tongue='#e0707a',
            tear='#9fd3f5', white='#f4f4f0')

BRO_ADULT = dict(BASE, name='bro', kind='adult', hair_style='boy', rx=9.2, ry=8.6, torso_h=12, torso_w=13, leg_h=8, arm_w=3,
                 outfit='hoodie', bottom='pants',
                 hair='#2c2c3e', hair_sh='#1d1d2b', hair_hi='#5a6283',
                 top='#3f6fb5', top_sh='#2f5590', top_hi='#5f8fd0', string='#eef0f2',
                 pants='#4d5a73', pants_sh='#3b465c', shoe='#eeeeee', sole='#a9adb5')

BRO_KID = dict(BASE, name='bro_kid', kind='kid', hair_style='boy', rx=8.4, ry=7.8, torso_h=8, torso_w=11, leg_h=4, arm_w=2,
               outfit='tee_stripe', bottom='shorts',
               hair='#2c2c3e', hair_sh='#1d1d2b', hair_hi='#5a6283',
               top='#f4f1e8', top_sh='#d6d0c2', top_hi='#ffffff', stripe='#4f86c6',
               pants='#c9a46a', pants_sh='#a8854f', shoe='#e9554a', sole='#9a3a33', sock='#f4f4f0')

SIS_KID = dict(BASE, name='sis_kid', kind='kid', hair_style='pigtails', rx=8.6, ry=8.0, torso_h=8, torso_w=11, leg_h=5, arm_w=2,
               outfit='dress', bottom='dress',
               skin='#f3c8a4', hair='#5a3a2c', hair_sh='#3f271d', hair_hi='#8a5e44', tie='#e2493f',
               top='#f08a5d', top_sh='#cf6a43', top_hi='#ffad85', collar='#fbf6ea',
               pants='#f08a5d', pants_sh='#cf6a43', shoe='#7a4ea0', sole='#4b2f66', sock='#f4f4f0')

SIS_TEEN = dict(BASE, name='sis_teen', kind='kid', hair_style='ponytail', rx=8.9, ry=8.3, torso_h=10, torso_w=12, leg_h=6, arm_w=2,
                outfit='dress', bottom='dress', skin='#f3c8a4', hair='#5a3a2c', hair_sh='#3f271d', hair_hi='#8a5e44', tie='#e2493f',
                top='#f2c14e', top_sh='#d4a037', top_hi='#ffe08a', collar='#fbf6ea',
                pants='#f2c14e', pants_sh='#d4a037', shoe='#7a4ea0', sole='#4b2f66', sock='#f4f4f0')

BRO_TEEN = dict(BASE, name='bro_teen', kind='kid', hair_style='boy', rx=8.9, ry=8.3, torso_h=10, torso_w=12, leg_h=6, arm_w=2,
                outfit='tee_stripe', bottom='pants', hair='#2c2c3e', hair_sh='#1d1d2b', hair_hi='#5a6283',
                top='#f4f1e8', top_sh='#d6d0c2', top_hi='#ffffff', stripe='#d2463c',
                pants='#4d5a73', pants_sh='#3b465c', shoe='#eeeeee', sole='#a9adb5', sock='#f4f4f0')

SIS_ADULT = dict(BASE, name='sis', kind='adult', hair_style='ponytail', rx=9.2, ry=8.6, torso_h=12, torso_w=13, leg_h=7, arm_w=3,
                 outfit='cardigan', bottom='longskirt',
                 skin='#f0c3a2', skin_sh='#d4977b', blush='#e98a84', tie='#e7c35a',
                 hair='#5a3a2c', hair_sh='#3f271d', hair_hi='#8a5e44', ear='#e7c35a',
                 top='#c8674a', top_sh='#a24f38', top_hi='#e0866a', inner='#f3e7cf',
                 skirt='#5f6b45', skirt_sh='#4a5536', shoe='#6b4630', sole='#3d2a1f',
                 pants='#5f6b45', pants_sh='#4a5536')


class G:
    def __init__(s): s.p = [[None] * W for _ in range(H)]
    def put(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H: s.p[y][x] = c
    def get(s, x, y):
        return s.p[y][x] if 0 <= x < W and 0 <= y < H else None
    def rect(s, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.put(xx, yy, c)
    def ell(s, cx, cy, rx, ry, c, where=None):
        for y in range(H):
            for x in range(W):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1 and (where is None or where(x, y)):
                    s.put(x, y, c)
    def line(s, a, b, c, w=1):
        (x0, y0), (x1, y1) = a, b
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            q = i / max(n, 1); x = round(x0 + (x1 - x0) * q); y = round(y0 + (y1 - y0) * q)
            s.rect(x - (w - 1) // 2, y - (w - 1) // 2, w, w, c)
    def outline(s):
        add = [(x, y) for y in range(H) for x in range(W) if s.p[y][x] is None and
               any(s.get(x + dx, y + dy) not in (None, 'OUT') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        for x, y in add: s.p[y][x] = 'OUT'
    def image(s, sp):
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = im.load()
        for y in range(H):
            for x in range(W):
                c = s.p[y][x]
                if c is None: continue
                if c == 'OUT': col = OUT
                elif c.startswith('#'): col = hexc(c)
                else: col = hexc(sp.get(c, '#ff00ff'))
                px[x, y] = col + (255,)
        return im


def layout(sp, sit=0):
    hip = 44 - sp['leg_h']
    sh = hip - sp['torso_h']
    ty = sh - round(2 * sp['ry']) + 1
    return hip, sh, ty


# ------------------------------------------------------------------ hair
def hair(g, sp, view, ty, cx):
    rx, ry = sp['rx'], sp['ry']; cy = ty + ry + .4
    er = round(ry * 1.28)                     # eye row (relative)
    st = sp['hair_style']
    hx, hy, hrx, hry = cx, cy - .6, rx + .9, ry + .7
    def rel(y): return y - ty
    if st == 'boy':
        if view == 'front':
            pat = [1, 1, 0, 0, 1, 0, -1, 0, 1, 0, -1, -1, 0, 1, 0, -1, 0, 0, 1, 1, 1]
            def hw(x, y):
                dx = x - cx
                if abs(dx + .5) >= rx - .5: return rel(y) <= er - 1
                return rel(y) <= er - 3 + pat[int(dx + 10) % len(pat)] - 1
            g.ell(hx, hy, hrx, hry, 'hair', hw)
            for dx, dy in ((-5, -1), (-4, -1), (1, -1), (2, -2), (3, -1)): g.put(cx + dx, ty + dy, 'hair')
        elif view == 'side':
            def hw(x, y):
                dx = x - cx
                if dx < -1: return rel(y) <= ry * 1.75
                if dx < 4: return rel(y) <= er - 4 + (1 if x % 3 == 0 else 0)
                return rel(y) <= er - 3 - (dx - 4) // 2 + (1 if x % 2 else 0)
            g.ell(hx - .4, hy, hrx, hry, 'hair', hw)
            for dx, dy in ((-4, -1), (0, -1), (1, -2), (2, -1), (9, 4)): g.put(cx + dx, ty + dy, 'hair')
        else:
            g.ell(hx, hy, hrx, hry, 'hair', lambda x, y: rel(y) <= ry * 1.75)
            for dx, dy in ((-5, -1), (1, -1), (2, -2)): g.put(cx + dx, ty + dy, 'hair')
    elif st == 'pigtails':
        tufts = []
        if view == 'front':
            def hw(x, y):
                dx = x - cx
                if abs(dx + .5) >= rx - 1.5: return rel(y) <= er + 1
                return rel(y) <= er - 3 - (1 if abs(dx) in (0, 5) else 0)
            g.ell(hx, hy, hrx, hry, 'hair', hw)
            tufts = [(cx - rx - 2.2, ty + er), (cx + rx + 1.8, ty + er)]
        elif view == 'side':
            def hw(x, y):
                dx = x - cx
                if dx < -1: return rel(y) <= ry * 1.6
                return rel(y) <= er - 3 - max(0, dx - 5) // 2
            g.ell(hx - .4, hy, hrx, hry, 'hair', hw)
            tufts = [(cx - rx - 1.4, ty + er)]
        else:
            g.ell(hx, hy, hrx, hry, 'hair', lambda x, y: rel(y) <= ry * 1.6)
            tufts = [(cx - rx - 2.2, ty + er), (cx + rx + 1.8, ty + er)]
            g.put(cx, ty + 1, 'hair_sh'); g.put(cx, ty + 3, 'hair_sh'); g.put(cx, ty + 5, 'hair_sh')
        for (tx, tyy) in tufts:
            side = 1 if tx < cx else -1
            g.ell(tx, tyy + 1.8, 2.7, 3.8, 'hair')
            g.put(tx - side, tyy + 4, 'hair_sh'); g.put(tx, tyy + 5, 'hair_sh'); g.put(tx - side, tyy, 'hair_hi')
            g.rect(int(round(tx + side * 1.6)) - (1 if side < 0 else 0), int(tyy) - 2, 2, 3, 'tie')
    elif st == 'ponytail':
        if view == 'front':
            def hw(x, y):
                dx = x - cx
                if abs(dx + .5) >= rx - 1.2: return rel(y) <= er + 2
                d = abs(dx + .5)
                return rel(y) <= 3 + (d >= 1.5) + (d >= 3.5) + (d >= 5.5) + 2 * (d >= 7)
            g.ell(hx, hy, hrx, hry, 'hair', hw)
            g.put(cx - 1, ty + 1, 'hair_sh')
        elif view == 'side':
            def hw(x, y):
                dx = x - cx
                if dx < -1: return rel(y) <= ry * 1.7
                if dx < 3: return rel(y) <= 6
                return rel(y) <= 5 - (dx - 3) // 3 + (dx > 6)
            g.ell(hx - .4, hy, hrx, hry, 'hair', hw)
            # ponytail hanging behind the head
            px0 = cx - rx - .2
            for i in range(11):
                w = 3 if i < 8 else 2
                g.rect(px0 - 2 + (1 if i > 5 else 0) - (i // 4), ty + 6 + i, w, 1, 'hair' if i % 4 else 'hair_sh')
            g.rect(px0 - 1, ty + 5, 2, 2, 'tie')
        else:
            g.ell(hx, hy, hrx, hry, 'hair', lambda x, y: rel(y) <= ry * 1.7)
            g.rect(cx - 1, ty + 9, 3, 12, 'hair'); g.rect(cx, ty + 12, 1, 8, 'hair_sh')
            g.rect(cx - 1, ty + 8, 3, 1, 'tie')
    # shading + highlights
    for y in range(H):
        for x in range(W):
            if g.get(x, y) != 'hair': continue
            dx, r = x - cx, rel(y)
            if view == 'front':
                if (dx >= 6 and r >= 3) or (r >= er - 2 and abs(dx) >= rx - 1.5): g.put(x, y, 'hair_sh')
            elif view == 'side':
                if dx <= -4 and r >= 5: g.put(x, y, 'hair_sh')
            else:
                if r >= er or dx >= 6: g.put(x, y, 'hair_sh')
    hi = {'front': [(-5, 2), (-4, 1), (-3, 1), (-2, 1), (-6, 3), (2, 2), (3, 2)],
          'side': [(-2, 1), (-1, 1), (0, 1), (1, 1), (-3, 2), (4, 2), (5, 3)],
          'back': [(-4, 2), (-3, 1), (-2, 1), (-1, 1), (2, 1), (3, 2), (-5, 3)]}[view]
    for dx, dy in hi:
        if g.get(cx + dx, ty + dy) in ('hair', 'hair_sh'): g.put(cx + dx, ty + dy, 'hair_hi')
    if view == 'back' and st == 'boy':
        for dx, dy in ((-3, 7), (-3, 8), (-2, 9), (3, 7), (3, 8), (2, 9), (0, 4), (0, 5)):
            if g.get(cx + dx, ty + dy) == 'hair': g.put(cx + dx, ty + dy, 'hair_sh')


def head(g, sp, view, ty, expr, t, look=0):
    rx, ry = sp['rx'], sp['ry']
    cx = CX if view != 'side' else CX
    cy = ty + ry + .4
    er = round(ry * 1.28)
    g.ell(cx, cy, rx, ry, 'skin')
    if view == 'side':
        g.ell(cx + 2.2, cy + 1.6, rx - 2.3, ry - 2.3, 'skin')
    if view == 'front':
        g.rect(int(cx - rx - .6), ty + er - 1, 1, 3, 'skin'); g.rect(int(cx + rx - .4), ty + er - 1, 1, 3, 'skin')
    hair(g, sp, view, ty, cx)
    if view == 'side':
        g.rect(cx - 2, ty + er - 1, 2, 3, 'skin'); g.put(cx - 2, ty + er, 'skin_sh')
    if view == 'front' and sp.get('ear'):
        g.put(int(cx - rx - .6), ty + er + 2, 'ear'); g.put(int(cx + rx - .4), ty + er + 2, 'ear')
    if view == 'front':
        for y in range(ty + er + 2, ty + er + 7):
            for x in range(cx + 5, cx + 10):
                if g.get(x, y) == 'skin' and ((x + 1.5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 > 1: g.put(x, y, 'skin_sh')
    if view != 'back':
        face(g, sp, view, ty, cx, er, expr, t, look)


def face(g, sp, view, ty, cx, er, expr, t, look):
    ey = ty + er
    eyes = [(cx - 4 + look, ey), (cx + 3 + look, ey)] if view == 'front' else [(cx + 5, ey)]
    blink = expr.endswith('_blink'); e = expr.replace('_blink', '')
    for (x, y) in eyes:
        if blink:
            g.put(x, y + 1, 'OUT'); g.put(x + (1 if (x < cx or view == 'side') else -1), y + 1, 'OUT')
        elif e in ('smile', 'laugh', 'soft'):
            g.put(x - 1, y + 1, 'OUT'); g.put(x, y, 'OUT'); g.put(x + 1, y + 1, 'OUT')
        elif e == 'surprise':
            g.rect(x, y - 1, 1, 3, 'OUT')
        elif e == 'cry':
            inner = 1 if (x > cx or view == 'side') else -1
            g.put(x - inner, y, 'OUT'); g.put(x, y + 1, 'OUT'); g.put(x + inner, y + 1, 'OUT')   # squeezed shut
            g.put(x - inner, y - 2, 'OUT'); g.put(x, y - 2, 'OUT')
        elif e == 'silly':
            if x < cx and view == 'front':
                g.put(x - 1, y + 1, 'OUT'); g.put(x, y + 1, 'OUT'); g.put(x + 1, y + 1, 'OUT')   # wink
            else:
                g.rect(x, y - 1, 1, 3, 'OUT')
        elif e == 'angry':
            g.rect(x, y, 1, 2, 'OUT')
            inner = 1 if (x < cx and view == 'front') else -1
            if view == 'side': inner = 1
            g.put(x - inner, y - 2, 'OUT'); g.put(x, y - 2, 'OUT'); g.put(x + inner, y - 1, 'OUT')
        else:
            g.rect(x, y, 1, 2, 'OUT')
            if e == 'sad':
                inner = 1 if (x > cx or view == 'side') else -1
                g.put(x - inner, y - 1, 'OUT'); g.put(x, y - 2, 'OUT')
    if view == 'front':
        g.rect(cx - 6, ey + 3, 2, 1, 'blush'); g.rect(cx + 4, ey + 3, 2, 1, 'blush')
        my = ey + 4
        if e in ('smile', 'soft'): g.rect(cx - 1, my, 2, 1, 'mouth'); g.put(cx - 2, my - 1, 'mouth'); g.put(cx + 1, my - 1, 'mouth')
        elif e == 'laugh': g.rect(cx - 2, my - 1, 4, 1, 'mouth'); g.rect(cx - 1, my, 2, 1, 'tongue'); g.put(cx - 2, my, 'mouth'); g.put(cx + 1, my, 'mouth')
        elif e in ('sad', 'angry'): g.rect(cx - 1, my, 2, 1, 'mouth'); g.put(cx - 2, my + 1, 'mouth'); g.put(cx + 1, my + 1, 'mouth')
        elif e == 'surprise': g.rect(cx - 1, my, 2, 2, 'mouth')
        elif e == 'cry':
            open_ = int(t * 4) % 2
            g.rect(cx - 2, my - 1, 4, 2 + open_, 'mouth'); g.rect(cx - 1, my + open_, 2, 1, 'tongue')
        elif e == 'silly': g.rect(cx - 1, my, 3, 1, 'mouth'); g.rect(cx, my + 1, 2, 1, 'tongue')
        else: g.rect(cx - 1, my, 2, 1, 'mouth')
        if e == 'cry':                                     # streaming tears
            for (x, _) in eyes:
                for k in range(3):
                    yy = ey + 2 + (int(t * 10) + k * 2) % 6
                    g.put(x, yy, 'tear')
        if expr.startswith('soft') and sp.get('tearful'):
            g.put(cx + 3 + look, ey + 2 + int(t * 1.5) % 3, 'tear')
    else:
        g.rect(cx + 3, ey + 3, 2, 1, 'blush')
        g.put(cx + 8, ty + er + 1, 'skin'); g.put(cx + 8, ty + er + 2, 'skin')
        my = ey + 4
        if e == 'surprise': g.rect(cx + 6, my, 1, 2, 'mouth')
        elif e in ('smile', 'soft'): g.put(cx + 6, my, 'mouth'); g.put(cx + 7, my - 1, 'mouth')
        elif e == 'laugh': g.rect(cx + 6, my - 1, 2, 2, 'mouth'); g.put(cx + 6, my, 'tongue')
        elif e in ('sad', 'cry'): g.put(cx + 6, my, 'mouth'); g.put(cx + 7, my + 1, 'mouth')
        elif e == 'angry': g.put(cx + 6, my, 'mouth'); g.put(cx + 7, my, 'mouth'); g.put(cx + 8, my, 'skin'); g.rect(cx + 2, ey + 3, 3, 1, 'blush')
        else: g.put(cx + 6, my, 'mouth')
        if e == 'cry':
            for k in range(2): g.put(cx + 5, ey + 2 + (int(t * 10) + k * 3) % 6, 'tear')


# ------------------------------------------------------------------ body
WALK = [(3, -3, 0, 0), (1, -1, 0, 1), (-3, 3, 0, 0), (-1, 1, 1, 0)]


def torso_front(g, sp, view, sh, hip, tb):
    tw = sp['torso_w']; x0 = CX - tw // 2
    o = sp['outfit']
    bottom = hip if sp['bottom'] not in ('longskirt',) else hip - 2
    g.rect(x0, tb, tw, bottom - tb, 'top')
    g.rect(x0 + tw - 3, tb + 1, 3, bottom - tb - 1, 'top_sh')
    g.rect(CX - 1, sh - 1, 3, 1, 'skin')
    if view == 'front':
        g.put(CX - 1, sh - 1, 'skin_sh'); g.put(CX + 1, sh - 1, 'skin_sh')
    if o == 'hoodie':
        if view == 'front':
            g.rect(x0 + 2, tb, tw - 4, 1, 'top_sh')
            for dy in (1, 2, 3): g.put(CX - 2, tb + dy, 'string')
            for dy in (1, 2): g.put(CX + 2, tb + dy, 'string')
            g.rect(x0 + 2, hip - 5, tw - 4, 1, 'top_sh'); g.put(CX, hip - 4, 'top_sh'); g.put(CX, hip - 3, 'top_sh')
            g.put(x0 + 2, tb + 2, 'top_hi'); g.put(x0 + 1, tb + 3, 'top_hi')
        else:
            g.rect(CX - 3, tb, 7, 3, 'top_sh'); g.rect(CX - 2, tb + 3, 5, 1, 'top_sh')
        g.rect(x0, hip - 1, tw, 1, 'top_sh')
    elif o == 'tee_stripe':
        for y in range(tb + 2, hip, 2): g.rect(x0, y, tw, 1, 'stripe')
        if view == 'front': g.rect(CX - 1, tb, 3, 1, 'top_sh')
    elif o == 'dress':
        if view == 'front':
            g.rect(CX - 2, tb, 2, 1, 'collar'); g.rect(CX + 1, tb, 2, 1, 'collar'); g.put(CX - 2, tb + 1, 'collar'); g.put(CX + 2, tb + 1, 'collar')
            g.put(CX, tb + 3, 'top_sh'); g.put(CX, tb + 5, 'top_sh')
    elif o == 'cardigan':
        if view == 'front':
            g.rect(CX - 1, tb, 3, bottom - tb, 'inner')
            g.put(CX - 2, tb, 'top_hi'); g.put(CX + 2, tb, 'top_hi')
            for y in range(tb + 2, bottom, 3): g.put(CX - 2, y, 'top_sh')
        else:
            pass


def legs_front(g, sp, hip, lifts=(0, 0)):
    b = sp['bottom']; lh = sp['leg_h']
    if b == 'longskirt':
        for i, x0 in enumerate((CX - 4, CX + 1)):
            l = lifts[i]; g.rect(x0, 44 - l, 4, 1, 'shoe'); g.rect(x0, 45 - l, 4, 1, 'sole')
        for k, y in enumerate(range(hip - 2, 44)):
            w = 12 + k // 3; x0 = CX - w // 2
            g.rect(x0, y, w, 1, 'skirt'); g.rect(x0 + w - 2, y, 2, 1, 'skirt_sh')
        for k, y in enumerate(range(hip, 44)):
            g.put(CX - 2 - k // 4, y, 'skirt_sh'); g.put(CX + 2 + k // 4, y, 'skirt_sh')
        return
    kid = sp['kind'] == 'kid'
    lw = 3 if kid else 4
    xs = (CX - lw - 1 + (1 if kid else 0), CX + 1) if kid else (CX - 4, CX + 1)
    for i, x0 in enumerate(xs):
        l = lifts[i]
        if b == 'pants':
            g.rect(x0, hip, lw, 44 - hip - l, 'pants'); g.rect(x0 + lw - 1 if i else x0, hip, 1, 44 - hip - l, 'pants_sh')
        elif b == 'shorts':
            g.rect(x0, hip, lw, 2, 'pants'); g.rect(x0, hip + 2, lw, 44 - hip - 2 - l, 'skin')
            g.rect(x0, 43 - l, lw, 1, 'sock')
        else:   # dress: bare legs + socks
            g.rect(x0, hip, lw, 44 - hip - l, 'skin'); g.rect(x0, 42 - l, lw, 2, 'sock')
        sw = lw + 1
        g.rect(x0 - (1 if i == 0 else 0), 44 - l, sw, 1, 'shoe'); g.rect(x0 - (1 if i == 0 else 0), 45 - l, sw, 1, 'sole')
    if b == 'shorts':
        g.rect(xs[0], hip, xs[1] + lw - xs[0], 1, 'pants')
    if b == 'dress':        # flared hem
        tw = sp['torso_w']
        for k in range(3):
            w = tw + 2 + k; x0 = CX - w // 2
            g.rect(x0, hip - 1 + k, w, 1, 'top'); g.rect(x0 + w - 3, hip - 1 + k, 3, 1, 'top_sh')
        g.rect(CX - (tw + 4) // 2, hip + 2, tw + 4, 1, 'top_sh')


def arm(g, sp, shoulder, hand, sleeve, shade=False):
    aw = sp['arm_w']
    col = 'top_sh' if shade else 'top'
    sx, sy = shoulder; hx, hy = hand
    L = max(1, math.hypot(hx - sx, hy - sy))
    sl = {'long': 1.0, 'short': .38}[sleeve]
    mid = (sx + (hx - sx) * sl, sy + (hy - sy) * sl)
    if sleeve == 'long':
        g.line(shoulder, hand, col, aw)
    else:
        g.line(shoulder, mid, col, aw); g.line(mid, hand, 'skin_sh' if shade else 'skin', max(2, aw - 1))
    g.rect(hx - (aw - 1) // 2, hy, aw, 2, 'skin_sh' if shade else 'skin')


def sprite(sp, view='front', frame=0, walking=False, expr='neutral', t=0.0, hands=None, look=0, samehand=False,
           pose=None, prop=None, bob=0):
    """hands: dict side->(dx,dy) hand offset from shoulder (front: 'l','r'; side: 'near','far')."""
    g = G()
    hip, sh, ty = layout(sp)
    b = (1 if walking and frame in (1, 3) else 0) + bob
    kid = sp['kind'] == 'kid'
    sleeve = 'short' if sp['outfit'] in ('tee_stripe', 'dress') else 'long'
    aw = sp['arm_w']; alen = sp['torso_h'] - (2 if kid else 3)
    tw = sp['torso_w']
    hands = hands or {}
    if pose == 'sit_side':           # side view, sitting on bed edge, shins hanging
        drop = sp['leg_h'] - 1
        hip2, sh2, ty2 = hip + drop, sh + drop, ty + drop
        thigh = 8 if kid else 11
        legcol = 'pants' if sp['bottom'] in ('pants', 'shorts') else ('skirt' if sp['bottom'] == 'longskirt' else 'top')
        g.rect(CX - 3, hip2 - (1 if kid else 2), thigh, 2 if kid else 3, legcol)
        swing = round(math.sin(t * 6) * 1) if expr in ('laugh', 'smile') else 0
        shin = 4 if kid else 6
        kx = CX - 3 + thigh - (2 if kid else 3)
        shcol = 'skin' if sp['bottom'] in ('dress', 'shorts') else ('skirt' if sp['bottom'] == 'longskirt' else 'pants')
        g.rect(kx + swing, hip2 + 1, 2 if kid else 3, shin, shcol)
        if kid: g.rect(kx + swing, hip2 + shin - 1, 2, 1, 'sock')
        g.rect(kx + swing, hip2 + 1 + shin, 4, 1, 'shoe'); g.rect(kx + swing, hip2 + 2 + shin, 4, 1, 'sole')
        g.rect(CX - 4, sh2 + b, 9, hip2 - sh2 - b, 'top'); g.rect(CX - 4, sh2 + 1 + b, 2, hip2 - sh2 - 1 - b, 'top_sh')
        if sp['outfit'] == 'tee_stripe':
            for y in range(sh2 + 2 + b, hip2, 2): g.rect(CX - 4, y, 9, 1, 'stripe')
        hn = hands.get('near', (2, alen - 1))
        arm(g, sp, (CX, sh2 + 1 + b), (CX + hn[0], sh2 + 1 + b + hn[1]), sleeve)
        before = [r[:] for r in g.p]
        head(g, sp, 'side', ty2 + b, expr, t)
        _chin(g, before, ty2 + b)
        g.outline(); return g.image(sp)

    if view in ('front', 'back'):
        lifts = [(0, 1), (0, 0), (1, 0), (0, 0)][frame] if walking else (0, 0)
        legs_front(g, sp, hip, lifts)
        tb = sh + b
        torso_front(g, sp, view, sh + b, hip, tb)
        sw = [(1, -1), (0, 0), (-1, 1), (0, 0)][frame] if walking else (0, 0)
        for i, side in enumerate(('l', 'r')):
            sgn = -1 if side == 'l' else 1
            sx = CX + sgn * (tw // 2 + 1 + (aw - 1) // 2) - (1 if side == 'l' and aw == 3 else 0)
            if side == 'r' and aw == 3: sx -= 0
            shoulder = (sx, tb + 1)
            dx, dy = hands.get(side, (sgn * 1 if aw == 2 else 0, alen + sw[i]))
            arm(g, sp, shoulder, (sx + dx, tb + 1 + dy), sleeve)
        if prop: prop(g, sp, view, hands, tb)
        before = [r[:] for r in g.p]
        head(g, sp, view, ty + b, expr, t, look)
        _chin(g, before, ty + b)
    else:   # side, facing right
        fl, bl, lf, lb = WALK[frame] if walking else (0, 0, 0, 0)
        if kid: fl, bl = round(fl * .67), round(bl * .67)
        tb = sh + b
        sway = round(fl * .8) if walking else 0
        near_swing = (sway if samehand else -sway)
        hf = hands.get('far', (-near_swing, alen))
        arm(g, sp, (CX - 1, tb + 1), (CX - 1 + hf[0], tb + 1 + hf[1]), sleeve, shade=True)
        lw = 3 if kid else 4
        b_ = sp['bottom']
        if b_ == 'longskirt':
            for dx, lift, back in ((bl, lb, True), (fl, lf, False)):
                x0 = CX - 2 + dx // 2 + 1
                g.rect(x0, 44 - lift, 5, 1, 'sole' if back else 'shoe'); g.rect(x0, 45 - lift, 5, 1, 'sole')
            for k, y in enumerate(range(hip - 2, 44)):
                w = 9 + k // 3
                g.rect(CX - w // 2 + (1 if walking and frame in (0, 2) and k > 6 else 0), y, w, 1, 'skirt')
            for y in range(hip, 44): g.put(CX - 4 + (y - hip) // 4, y, 'skirt_sh')
        else:
            for dx, lift, back in ((bl, lb, True), (fl, lf, False)):
                x0 = CX - 2 + dx
                if not back:
                    for y in range(hip + 1, 45 - lift):
                        if g.get(x0 - 1, y) not in (None, 'OUT'): g.put(x0 - 1, y, 'OUT')
                        if g.get(x0 + lw, y) not in (None, 'OUT'): g.put(x0 + lw, y, 'OUT')
                shade = back
                if b_ == 'pants':
                    g.rect(x0, hip, lw, 44 - hip - lift, 'pants_sh' if shade else 'pants')
                elif b_ == 'shorts':
                    g.rect(x0, hip, lw, 2, 'pants_sh' if shade else 'pants'); g.rect(x0, hip + 2, lw, 44 - hip - 2 - lift, 'skin_sh' if shade else 'skin')
                    g.rect(x0, 43 - lift, lw, 1, 'sock')
                else:
                    g.rect(x0, hip, lw, 44 - hip - lift, 'skin_sh' if shade else 'skin'); g.rect(x0, 42 - lift, lw, 2, 'sock')
                g.rect(x0, 44 - lift, lw + 1, 1, 'sole' if back else 'shoe'); g.rect(x0 + lw + 1, 44 - lift, 1, 1, 'OUT' if back else 'shoe')
                g.rect(x0, 45 - lift, lw + 2, 1, 'sole')
        bottom = hip if b_ != 'longskirt' else hip - 2
        tws = tw - 4 if not kid else tw - 3
        x0 = CX - tws // 2 - 1
        g.rect(x0, tb, tws, bottom - tb, 'top'); g.rect(x0, tb + 1, 2, bottom - tb - 1, 'top_sh')
        g.rect(CX - 1, sh - 1 + b, 3, 1, 'skin')
        o = sp['outfit']
        if o == 'hoodie':
            g.rect(x0, tb, 4, 3, 'top_sh'); g.rect(x0, hip - 1, tws, 1, 'top_sh')
            for dy in (1, 2, 3): g.put(x0 + tws - 2, tb + dy, 'string')
        elif o == 'tee_stripe':
            for y in range(tb + 2, hip, 2): g.rect(x0, y, tws, 1, 'stripe')
        elif o == 'cardigan':
            g.rect(x0 + tws - 2, tb, 2, bottom - tb, 'inner')
        elif o == 'dress':
            g.put(x0 + tws - 1, tb, 'collar'); g.put(x0 + tws - 2, tb, 'collar')
            for k in range(3):
                g.rect(x0 - 1, hip - 1 + k, tws + 2 + k, 1, 'top')
            g.rect(x0 - 1, hip + 2, tws + 4, 1, 'top_sh')
        hn = hands.get('near', (near_swing, alen))
        nsx = CX - 1
        arm(g, sp, (nsx, tb + 1), (nsx + hn[0], tb + 1 + hn[1]), sleeve)
        if sleeve == 'long': g.rect(nsx + 1 if aw == 3 else nsx, tb + 1, 1, max(1, int(hn[1] * .8)), 'top_hi') if hn[0] == near_swing and abs(hn[0]) < 2 else None
        if prop: prop(g, sp, view, hands, tb)
        before = [r[:] for r in g.p]
        head(g, sp, 'side', ty + b, expr, t)
        _chin(g, before, ty + b)
    g.outline()
    return g.image(sp)


def _chin(g, before, ty):
    headpx = {(x, y) for y in range(H) for x in range(W) if g.p[y][x] != before[y][x] and g.p[y][x] is not None}
    for (x, y) in headpx:
        if (x, y + 1) not in headpx and g.get(x, y + 1) not in (None, 'OUT') and y + 1 > ty + 11:
            g.put(x, y + 1, 'OUT')


# ------------------------------------------------------------------ props
def icecream(side='r', melt=False):
    def draw(g, sp, view, hands, tb):
        if view == 'side':
            dx, dy = hands.get('near', (2, 6)); hx, hy = CX - 1 + dx, tb + 1 + dy
        else:
            sgn = 1 if side == 'r' else -1
            dx, dy = hands.get(side, (0, 6)); hx, hy = CX + sgn * (sp['torso_w'] // 2 + 1) + dx - (1 if side == 'l' else 0), tb + 1 + dy
        g.rect(hx, hy - 2, 2, 3, '#c98b4a'); g.put(hx, hy - 1, '#e0a865'); g.rect(hx - 1, hy - 3, 4, 1, '#e0a865')
        g.rect(hx - 1, hy - 6, 4, 3, '#f7c6da'); g.rect(hx, hy - 7, 2, 1, '#f7c6da')
        g.put(hx - 1, hy - 6, '#ffeef4'); g.put(hx, hy - 7, '#ffeef4'); g.rect(hx + 2, hy - 5, 1, 2, '#e195b5')
        if melt:
            g.put(hx - 1, hy - 2, '#f7c6da'); g.put(hx + 2, hy - 2, '#f7c6da'); g.put(hx + 2, hy - 1, '#f7c6da'); g.put(hx + 1, hy + 1, '#f7c6da')
    return draw


def flip(im):
    return im.transpose(Image.FLIP_LEFT_RIGHT)


# ------------------------------------------------------------------ later-life cast (colour variants of the same build)
MOM = dict(SIS_ADULT, name='mom', hair='#8e8782', hair_sh='#6e6762', hair_hi='#b4aea8', ear=None,
           top='#7a6a9a', top_sh='#5e5080', top_hi='#9a8aba', inner='#efe6d8', skirt='#4a4a5a', skirt_sh='#3a3a48', tie='#b4aea8')
DAD = dict(BRO_ADULT, name='dad', hair='#9a9690', hair_sh='#76726c', hair_hi='#c4c0ba',
           top='#8a5a3a', top_sh='#6a4428', top_hi='#a87452', string='#8a5a3a', pants='#4a4a5a', pants_sh='#3a3a48')
SIS_OLD = dict(SIS_ADULT, name='sis_old', hair='#cbc6c1', hair_sh='#a9a49f', hair_hi='#ebe7e3', top='#a06a58', top_sh='#80503f', top_hi='#bf8672')
BRO_OLD = dict(BRO_ADULT, name='bro_old', hair='#cbc6c1', hair_sh='#a9a49f', hair_hi='#ebe7e3', top='#4a6a8a', top_sh='#38526c', top_hi='#6a8aaa')
KID_G = dict(SIS_KID, name='kid_g', hair='#2c2c3e', hair_sh='#1d1d2b', hair_hi='#5a6283', tie='#4f86c6',
             top='#f2c94c', top_sh='#d9a92a', top_hi='#ffe28a', pants='#f2c94c', pants_sh='#d9a92a', shoe='#e9554a', sole='#9a3a33')
KID_B = dict(BRO_KID, name='kid_b', hair='#5a3a2c', hair_sh='#3f271d', hair_hi='#8a5e44', stripe='#5aa86a', pants='#4d5a73', pants_sh='#3b465c',
             shoe='#4f86c6', sole='#2f5590')
