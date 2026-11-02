"""Cast for 富士山下 MV — colour variants of the skill's chibi builds + the story's hero prop: the old windbreaker."""
import math
import engine
from engine import SPECS, hx, put, light, sm, lin
from chars import SIS_ADULT, BRO_ADULT, SIS_KID, BRO_KID, CX
from PIL import Image, ImageDraw

# ---------------------------------------------------------------- leads
# HE: navy windbreaker that he will give away twice (scenes must show him in a thin shirt after the first hand-over)
HE = dict(BRO_ADULT, name='he', hair='#232430', hair_sh='#171820', hair_hi='#4d5876',
          top='#33495e', top_sh='#243546', top_hi='#4f6f8a', string='#e8dfcc',
          pants='#3b4150', pants_sh='#2c313d', shoe='#4a4a54', sole='#2e2e36')

HE_THIN = dict(HE, name='he_thin', outfit='tee_stripe', bottom='pants',
               top='#d8d2c4', top_sh='#b8b1a1', top_hi='#efe9dc', stripe='#7d8a99',
               pants='#3b4150', pants_sh='#2c313d')

# SHE: camel coat, long dark hair, red scarf
SHE = dict(SIS_ADULT, name='she', hair='#33241f', hair_sh='#221713', hair_hi='#6b4a38',
           tie='#b8493f', ear='#d9a86a',
           top='#cf9a63', top_sh='#ac7a48', top_hi='#e8bb85', inner='#f3e7cf',
           skirt='#6d5a48', skirt_sh='#554636', shoe='#5a3a2a', sole='#33211a',
           pants='#6d5a48', pants_sh='#554636')

# side cast
FLORIST = dict(SIS_ADULT, name='florist', hair='#8e8782', hair_sh='#6e6762', hair_hi='#b4aea8', ear=None,
               top='#7f8f6a', top_sh='#5f6d4e', top_hi='#9dab84', inner='#efe6d8',
               skirt='#4a4a52', skirt_sh='#3a3a44')
CLERK = dict(BRO_KID, name='clerk', kind='kid', hair='#20202a', hair_sh='#15151c', hair_hi='#414c66')
CLERK = dict(CLERK, top='#e8e4d8', top_sh='#c8c2b2', top_hi='#ffffff', stripe='#5f8fa8', pants='#3b4150')
OLD_LADY = dict(SIS_ADULT, name='oldlady', hair='#cfcac4', hair_sh='#a9a49f', hair_hi='#eae6e2', ear=None,
                top='#6a5f74', top_sh='#4f4657', top_hi='#8a7f94', inner='#efe6d8',
                skirt='#3f3f4a', skirt_sh='#32323a')
COUPLE_M = dict(BRO_ADULT, name='couple_m', hair='#2a2620', hair_sh='#1c1915', hair_hi='#5a5040',
                top='#5a6a58', top_sh='#43503f', top_hi='#7d8f78', pants='#3a3f4a', pants_sh='#2c3038')
COUPLE_F = dict(SIS_ADULT, name='couple_f', hair='#4a3026', hair_sh='#33201a', hair_hi='#7d5a44',
                top='#b5717a', top_sh='#955a62', top_hi='#d0909a', skirt='#4a4450', skirt_sh='#3a3540')
KID_G = dict(SIS_KID, name='kid_g', hair='#2c2c3e', hair_sh='#1d1d2b', hair_hi='#5a6283', tie='#4f86c6',
             top='#f2c94c', top_sh='#d9a92a', top_hi='#ffe28a', pants='#f2c94c', pants_sh='#d9a92a',
             shoe='#e9554a', sole='#9a3a33')

for _s in (HE, HE_THIN, SHE, FLORIST, CLERK, OLD_LADY, COUPLE_M, COUPLE_F, KID_G):
    SPECS[_s['name']] = _s

# ---------------------------------------------------------------- hero prop: 陈年风褛 (the old windbreaker)
COAT = dict(body='#33495e', body_sh='#243546', body_hi='#4a6580', collar='#e0d6c2', collar_sh='#c0b49c',
            btn='#c9a24a', flower='#e08a9a', flower2='#f2b8c2', inner='#8d7a63')


# (skin, skin shade, sleeve, sleeve shade) for the hand close-ups — must match each lead's outfit
HE_S = ('#e8b896', '#c98a6e', '#33495e', '#243546')
SHE_S = ('#f0c3a2', '#d4977b', '#cf9a63', '#ac7a48')


def windbreaker(w=13, h=17, hang=True):
    """Small native-pixel windbreaker (13x17 default) for wide/medium shots.
    hang=True: shoulders up, sleeves down (held by the collar). hang=False: bundled over an arm."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    b, bs, bh = hx(COAT['body']), hx(COAT['body_sh']), hx(COAT['body_hi'])
    col, cs = hx(COAT['collar']), hx(COAT['collar_sh'])
    if hang:
        d.rectangle((1, 0, w - 2, h - 1), fill=b)                       # body
        d.rectangle((w - 4, 0, w - 2, h - 1), fill=bs)                  # shaded side
        d.rectangle((1, 0, w - 2, 2), fill=col)                         # sherpa collar
        d.rectangle((1, 2, w - 2, 2), fill=cs)
        d.rectangle((1, 3, 2, h - 3), fill=bh)                          # sleeve highlight
        for yy in range(5, h - 2, 4): d.point((w // 2, yy), fill=hx(COAT['btn']))   # buttons
        d.point((w - 3, h - 2), fill=hx(COAT['flower']))                # the little mended flower at the cuff
        d.point((w - 3, h - 3), fill=hx(COAT['flower2']))
    else:
        d.rectangle((0, 2, w - 1, h - 1), fill=b); d.rectangle((0, h - 3, w - 1, h - 1), fill=bs)
        d.rectangle((0, 2, w - 1, 4), fill=col)
    return im


def coat_over_shoulders(im, x, feet, sway=0, front=False):
    """The coat draped over her shoulders. A chibi head takes 19 of the 36 px, so the coat must hang
    BESIDE the torso, not across it: front=True draws two side panels + collar tips, leaving her face and chest clear.
    front=False (back view) draws the full back of the coat."""
    w, h = 18, 16
    y0 = int(feet) - 19            # shoulder line: the chibi head bottom sits at feet-18
    x0 = int(x - w // 2)
    d = ImageDraw.Draw(im)
    b, bs = hx(COAT['body']), hx(COAT['body_sh'])
    col = hx(COAT['collar'])
    if front:
        d.rectangle((x0, y0, x0 + 5, y0 + h - 1), fill=b)                 # left panel
        d.rectangle((x0 + w - 6, y0, x0 + w - 1, y0 + h - 1), fill=bs)    # right panel
        d.rectangle((x0 + 1, y0, x0 + 5, y0 + 1), fill=col)               # collar tips
        d.rectangle((x0 + w - 6, y0, x0 + w - 2, y0 + 1), fill=col)
        d.point((x0 + 2, y0 + h - 2), fill=hx(COAT['flower']))
    else:
        d.rectangle((x0, y0, x0 + w - 1, y0 + h - 1), fill=b)
        d.rectangle((x0, y0, x0 + 3, y0 + h - 1), fill=bs)
        d.rectangle((x0 + w - 3, y0, x0 + w - 1, y0 + h - 1), fill=bs)
        d.rectangle((x0 + 2, y0 - 2, x0 + w - 3, y0), fill=col)
        d.line((x0 + 3, y0 + 4 + sway, x0 + 3, y0 + h - 2), fill=bs)
        d.point((x0 + w - 4, y0 + h - 3), fill=hx(COAT['flower']))


# ---------------------------------------------------------------- close-up canvases (160x90)
def coat_close(phase=1.0, wear=0.0, grip=0.0, hand=('skin', 'skin_sh')):
    """160x90 RGBA: the old windbreaker filling a close-up, seen from the front and held at the shoulders.
    wear 0..1 grows the frayed '襟花' at the collar; grip 0..1 curls the fingers of the two holding hands."""
    from engine import Canvas, layer
    im = Image.new('RGBA', (160, 90), (0, 0, 0, 0))
    b, bs, bh = COAT['body'], COAT['body_sh'], COAT['body_hi']
    col, cs = COAT['collar'], COAT['collar_sh']
    cv = Canvas(160, 90)
    cv.rect(14, 8, 132, 84, b)                      # body
    cv.rect(14, 8, 10, 84, bs); cv.rect(136, 8, 10, 84, bs)
    cv.rect(14, 74, 132, 4, bs)                     # hem shadow
    for k in range(5):                              # fabric folds
        x = 30 + k * 22
        cv.line((x, 26), (x - 3, 84), bs, 1)
    cv.rect(78, 18, 3, 62, bs)                      # zip / front seam
    for y in (36, 56): cv.rect(84, y, 4, 4, COAT['btn'])
    cv.rect(10, 6, 140, 12, col)                    # sherpa collar
    cv.rect(10, 16, 140, 4, cs)
    for k in range(10): cv.put(14 + k * 14, 9 + (k % 3), cs)
    cv.rect(62, 16, 36, 10, b)                      # collar opening
    cv.line((64, 16), (78, 34), bh, 1); cv.line((96, 16), (82, 34), bs, 1)
    # sleeves falling away at both edges
    cv.rect(0, 12, 14, 40, b); cv.rect(146, 12, 14, 40, b)
    for k in range(3):
        cv.line((2, 16 + k * 5), (12, 20 + k * 5), bs, 1); cv.line((148, 16 + k * 5), (158, 20 + k * 5), bs, 1)
    n = int(2 + wear * 6)                            # the frayed flower at the collar
    for k in range(n):
        a = k * 1.15
        cv.put(44 + math.cos(a) * 5, 22 + math.sin(a) * 4, COAT['flower'] if k % 2 else COAT['flower2'])
    layer(im, cv)
    # two hands gripping the coat at shoulder height, fingers curling as grip -> 1
    sk, sks = hand
    for x, flip in ((22, False), (138, True)):
        ch = Canvas(160, 90)
        ch.rrect(x - 10, 40, 20, 26, sk, 5)
        ch.rect(x - 8, 58, 16, 4, sks)
        for i in range(4):
            fy = 44 + i * 4
            w = 12 + int(6 * grip)
            ch.rrect(x - 4 + (0 if not flip else 0), fy, w, 4, sk, 2)
            ch.rect(x - 4, fy + 3, w, 1, sks)
        ch.rect(x + (6 if not flip else -6), 62, 3, 8, sk)   # thumb
        layer(im, ch)
    return im
