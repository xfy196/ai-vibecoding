"""All shots of the film. fn(t) -> (world_image, cam); cam = (x0, y0, zoom).

Framing rules used throughout (captions sit at world y = 158 at zoom 1):
  WIDE  : feet at 150 — the caption box starts at 158, so nothing important is below it.
  MED   : zoom 2 with y0 = 64 — visible band 64..154, the caption covers y > 143,
          so feet sit at 140 and faces land at 100..126.
  INSERT: a 160x90 canvas used whole; keep the subject above y = 78.
"""
import math
from engine import (spr, put, hx, lerp, sm, lin, walkframe, head_top, side_hand, front_hand,
                    shadow, rain, Canvas, layer, thumbs_press, clasped_hands, pixtext, pixtext_c,
                    text_w, ghost, Image, ImageDraw, SPECS)
import world as wo
import cast
from cast import windbreaker, coat_over_shoulders, coat_close
import scene as sc

W, H = 320, 180
WF = 150


def lt(t):
    """Local time inside the current shot — every timed animation must use this, not absolute t."""
    return t - getattr(__import__('engine'), 'CURRENT_START', 0.0)          # feet on a wide shot
MF = 146          # feet on a medium (y0 = 72)
SHOTS = []


def S(t0, t1, fn):
    SHOTS.append((t0, t1, fn, None))
    return fn


# ---------------------------------------------------------------- grades
def tint(im, q, col='#8a9ac8'):
    p = im.load(); c = hx(col)
    for y in range(im.height):
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], c, q)


def white_out(im, q):
    p = im.load(); w = (245, 238, 232)
    for y in range(im.height):
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], w, q)


def plate(im, y0, y1, q=0.8, col='#141020'):
    """A flat dark plate behind small credit text: keeps the background from breaking the strokes."""
    p = im.load(); c = hx(col)
    for y in range(max(0, y0), min(im.height, y1)):
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], c, q)


def band_overlay(im, y0, y1, alpha=140, col='#141020'):
    """A soft dark band behind title/credit text so it reads on any background (world space)."""
    p = im.load(); c = hx(col)
    for y in range(max(0, y0), min(im.height, y1)):
        q = math.sin(math.pi * (y - y0) / max(1, y1 - y0)) ** .5 * alpha / 255
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], c, q)


def steam(im, x, y, t, n=5):
    for i in range(n):
        q = (t * .7 + i / n) % 1.0
        c = int(150 + 40 * q)
        ImageDraw.Draw(im).ellipse((x - 3 + math.sin(q * 6 + i) * 3, y - q * 16 - 3,
                                    x + 3 + math.sin(q * 6 + i) * 3, y - q * 16 + 3),
                                   fill=hx('#%02x%02x%02x' % (c, c, c)))


# ================================================================ INTRO
def intro1(t):
    """A wet street at night. He comes in with the old coat over his arm; she is already waiting."""
    im = wo.street()
    sc.rain_on(im, t, n=110, wind=3)
    x = 44 + 28 * lin(lt(t), 0, 3.0)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='sad',
                hands={'near': (0, 9)}, t=t), x, WF)
    c = windbreaker()
    im.paste(c, (int(x) + 7, 126), c)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 8)}, t=t), 214, WF + 1)
    return sc.wide(im)
intro1.loc = 'street'


def title_card(t):
    """Title over the lake: song, singer, credits."""
    im = wo.fuji('dusk').copy()
    sc.shimmer(im, t, 122, 168, 30, '#b0b6d8')
    wo.falling_snow(im, t, 34, 1, '#e8eef8')
    band_overlay(im, 34, 140, 130)
    plate(im, 42, 132, .62)
    pixtext_c(im, 46, '富士山下', 30, '#fbf6ea')
    pixtext_c(im, 88, '陈奕迅', 14, '#f2d2a2')
    pixtext_c(im, 110, '词 林夕   曲 Christopher Chak', 11, '#d0c8de')
    return sc.wide(im)
title_card.loc = 'fuji'


def intro2(t):
    """The two of them under the shop light, both soaked through."""
    im = wo.street()
    sc.rain_on(im, t, n=100, wind=2)
    put(im, spr('he', view='side', expr='sad', hands={'near': (0, 8)}, t=t), 132, MF)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t), 166, MF + 1)
    sc.breath(im, 126, 118, t, 4, -1)
    return im, sc.medium(74)
intro2.loc = 'street'


def intro3(t):
    """The florist's shutter is half down; one bulb still burns over the buckets."""
    im = wo.florist()
    sc.rain_on(im, t, n=90, wind=2)
    put(im, spr('florist', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t), 226, WF + 2)
    steam(im, 118, 132, t, 4)
    return sc.wide(im)
intro3.loc = 'florist'


def intro4(t):
    """The mountain in the rain — the motif, once, from far off."""
    im = wo.fuji('rain').copy()
    sc.rain_on(im, t, n=95, wind=4)
    sc.shimmer(im, t, 122, 168, 22, '#8a90b8')
    return sc.wide(im)
intro4.loc = 'fuji'


# ================================================================ V1
def v1_shiver(t):
    """She is shaking; he opens the coat behind her like a door he is afraid of."""
    im = wo.street()
    sc.rain_on(im, t, n=100, wind=2)
    shiver = round(math.sin(t * 16) * .6)
    put(im, spr('he', view='side', expr='sad', hands={'near': (10, 2)}, t=t), 130, MF - 1)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t, bob=shiver), 178, MF)
    c = windbreaker(17, 21)                                # the coat, held out in his hands
    im.paste(c, (142, 114 + shiver), c)
    return im, sc.medium(76)
v1_shiver.loc = 'street'


def v1_shiver_close(t):
    """Same moment, pushed in: the rain coming down like snow, her shoulders shaking."""
    im = wo.street()
    sc.rain_on(im, t, n=120, wind=2)
    shiver = round(math.sin(t * 16) * .6)
    put(im, spr('he', view='side', expr='sad', hands={'near': (10, 2)}, t=t), 130, MF - 1)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t, bob=shiver), 178, MF)
    c = windbreaker(17, 21)
    im.paste(c, (142, 114 + shiver), c)
    return im, sc.medium(122, 56)
v1_shiver_close.loc = 'street'


def v1_coat_insert(t):
    """Insert: his hands hold the windbreaker open; the worn collar has frayed into a little flower."""
    im = Image.new('RGB', (160, 90), hx('#33304a'))
    wo.gradient(im, (0, 0, 160, 90), ['#3c3456', '#2a2740'])
    c = coat_close(1.0, sm(lt(t), .4, 3.4), .25, cast.HE_S[:2])
    im.paste(c, (0, 2), c)
    return im, (0, 0, 2)
v1_coat_insert.loc = 'hands'


def v1_box(t):
    """He crosses with a cardboard box — the transfer he took without saying anything."""
    im = wo.street()
    sc.rain_on(im, t, n=90, wind=3)
    x = 252 - 30 * lin(lt(t), 0, 4.5)
    f = walkframe(t, 5)
    put(im, spr('he', view='side', frame=f, walking=True, expr='sad', hands={'near': (4, 4)}, t=t), x, WF, mirror=True)
    d = ImageDraw.Draw(im)
    d.rectangle((int(x) - 24, 120, int(x) - 8, 136), fill=hx('#a87c4e'))
    d.rectangle((int(x) - 24, 120, int(x) - 8, 123), fill=hx('#c0925e'))
    d.line((int(x) - 16, 120, int(x) - 16, 136), fill=hx('#8a6238'))
    return sc.wide(im)
v1_box.loc = 'street'


def v1_car_door(t):
    """He holds the door; she folds herself into the back seat, out of the rain."""
    im = wo.car()
    wo.glass_rain(im, t)
    d = ImageDraw.Draw(im)
    d.polygon([(0, 24), (46, 48), (46, 152), (0, 172)], fill=hx('#2f2a44'))
    d.polygon([(3, 46), (42, 62), (42, 146), (3, 162)], fill=hx('#4a4066'))
    for k in range(6):
        d.line((6 + k * 6, 50 + k * 3, 8 + k * 6, 62 + k * 3), fill=hx('#9fb3e0'))
    sc.sit_she(im, 152, 128, expr='sad', hands={'near': (6, 2)}, t=t)
    put(im, spr('he', view='side', expr='sad', hands={'near': (8, 4)}, t=t), 104, 156)
    return sc.wide(im)
v1_car_door.loc = 'car'


def v1_roses(t):
    """The buckets under the awning: he looks at the red roses, and walks past them."""
    im = wo.florist()
    sc.rain_on(im, t, n=80, wind=2)
    put(im, spr('he', view='side', expr='sad', hands={'near': (0, 8)}, t=t), 196, WF + 2)
    put(im, spr('florist', view='side', expr='smile', mirror=True, hands={'near': (4, 2)}, t=t), 120, WF)
    d = ImageDraw.Draw(im)
    for k in range(7):
        d.ellipse((138 + k * 3, 110 + (k % 2), 146 + k * 3, 118 + (k % 2)), fill=hx('#d8483e'))
    d.rectangle((146, 118, 154, 130), fill=hx('#3a5a3a'))
    return im, sc.medium(84)
v1_roses.loc = 'florist'


def v1_petals(t):
    """Insert: petals floating in a puddle while the rain keeps breaking the surface."""
    im = Image.new('RGB', (160, 90), hx('#2c2940'))
    wo.gradient(im, (0, 0, 160, 90), ['#454063', '#2b2840'])
    d0 = ImageDraw.Draw(im)
    for k in range(9):
        d0.ellipse((6 + k * 17, 56 + (k * 7) % 16, 26 + k * 17, 66 + (k * 7) % 16), fill=hx('#39355a'))
    d = ImageDraw.Draw(im)
    d.ellipse((16, 20, 144, 76), fill=hx('#4e4a70'))
    d.ellipse((22, 24, 138, 72), fill=hx('#5a567e'))
    for k in range(8):
        cx = 30 + (k * 15) % 96; cy = 32 + (k * 11) % 26
        d.ellipse((cx - 3, cy - 2, cx + 3, cy + 2), fill=hx('#d8687a' if k % 2 else '#ec8f9e'))
        d.point((cx, cy), fill=hx('#f8d0d8'))
    for i in range(9):
        ph = (t * .9 + i / 9) % 1.0
        r = int(ph * 13) + 2
        cx = 32 + (i * 29) % 88; cy = 34 + (i * 17) % 24
        c = lerp(hx('#5a567e'), hx('#a4aad0'), 1 - ph)
        d.ellipse((cx - r, cy - r // 2, cx + r, cy + r // 2), outline=c)
    return im, (0, 0, 2)
v1_petals.loc = 'insert'


def v1_car_talk(t):
    """Inside the car: she turns to him, and he studies the windscreen wipers."""
    im = wo.car()
    wo.glass_rain(im, t)
    resp = sm(lt(t), 1.6, 3.2)
    sc.sit_she(im, 136, 128, expr='sad' if resp < .5 else 'cry', hands={'near': (4, 3)}, t=t)
    sc.sit_he(im, 190, 128, expr='sad', hands={'near': (2, 6)}, t=t)
    return im, sc.medium(102, 56)
v1_car_talk.loc = 'car'


def v1_tear(t):
    """Close: a tear, and the rain running down the glass behind her."""
    im = wo.car()
    wo.glass_rain(im, t, n=46)
    sc.sit_she(im, 156, 130, expr='cry', hands={'near': (4, 3)}, t=t)
    return im, (110, 76, 2)
v1_tear.loc = 'car'


# ================================================================ CHORUS 1
def hand_bg():
    """Background for a hand close-up: out-of-focus car window, rain, and the seat band below."""
    im = Image.new('RGB', (160, 90), hx('#2b2540'))
    wo.gradient(im, (0, 0, 160, 52), ['#2a2440', '#453a5e'])
    for x in (18, 78, 132):
        light_ = ImageDraw.Draw(im)
        light_.ellipse((x - 12, 22, x + 12, 44), fill=hx('#4a3a5e'))
    for k in range(26):                                   # blurred rain streaks
        x = (k * 23) % 160; y = 6 + (k * 11) % 40
        ImageDraw.Draw(im).line((x, y, x + 1, y + 4), fill=hx('#7c86a4'))
    ImageDraw.Draw(im).rectangle((0, 52, 159, 58), fill=hx('#3e3556'))
    ImageDraw.Draw(im).rectangle((0, 58, 159, 89), fill=hx('#2f2840'))
    return im


def c1_hands(t):
    """Their hands, clasped — then his fingers slide back out of hers."""
    im = hand_bg()
    q = sm(lt(t), 2.8, 3.8)
    h = clasped_hands(left=cast.HE_S, right=cast.SHE_S) if q < .5 else \
        thumbs_press(max(0.0, 1 - (q - .5) * 1.6), L=cast.SHE_S, R=cast.HE_S)
    im.paste(h, (0, 0), h)
    return im, (0, 0, 2)
c1_hands.loc = 'hands'


def c1_coat_on(t):
    """The coat goes round her shoulders from behind; she does not turn around."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(lt(t), .8, 2.4)
    sc.sit_she(im, 150, 128, expr='sad', hands={'near': (3, 4)}, t=t)
    if q > .2: coat_over_shoulders(im, 150, 144, int((1 - q) * 3))
    put(im, spr('he', view='side', expr='sad', hands={'near': (-1, 3)}, t=t), 196, 144)
    return im, sc.medium(104, 56)
c1_coat_on.loc = 'car'


def c1_snow_walk(t):
    """Memory: the two of them on the snow road, hand in hand, walking away."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 60)
    wo.footprints(im, [(148 + i * 5, 152 + i) for i in range(13)])
    f = walkframe(t, 5)
    put(im, spr('she', view='side', frame=(f + 2) % 4, walking=True, expr='smile',
                hands={'near': (7, 4)}, t=t), 148, WF + 1)          # far figure first
    put(im, spr('he', view='side', frame=f, walking=True, expr='smile',
                hands={'far': (-7, 4)}, t=t), 164, WF - 2)           # near figure on top
    tint(im, .26, '#9aa8d0')
    return sc.wide(im)
c1_snow_walk.loc = 'snow'


def c1_snow_face(t):
    """Her face in the snow light, crying about something good."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 40)
    put(im, spr('she', view='front', expr='cry', t=t), 150, 144)
    tint(im, .18, '#b0bcd8')
    return im, (86, 80, 2)
c1_snow_face.loc = 'snow'


def c1_fuji_far(t):
    """The mountain and two very small people on the pier."""
    im = wo.fuji('dusk').copy()
    sc.shimmer(im, t, 122, 168, 30, '#b6bcdc')
    put(im, spr('he', view='back', expr='neutral', t=t), 234, 164)
    put(im, spr('she', view='back', expr='neutral', t=t), 252, 165)
    return sc.wide(im)
c1_fuji_far.loc = 'fuji'


def c1_tube(t):
    """Insert: a test tube of dark liquid. Grief does not show up in a test tube."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    d.rectangle((74, 26, 86, 76), fill=hx('#3c4458'))
    d.rectangle((75, 40, 85, 75), fill=hx('#4a2a3a'))
    d.line((75, 40, 75, 74), fill=hx('#a8c0d8'))
    d.rectangle((76, 24, 84, 28), fill=hx('#e8f0f8'))
    for k in range(4):
        d.point((77 + k % 3, 42 + int((t * 12 + k * 7) % 30)), fill=hx('#7a4a5a'))
    return im, (0, 0, 2)
c1_tube.loc = 'lab'


def c1_stone(t):
    """He picks a stone off the bank, weighs it, and throws."""
    im = wo.river()
    sc.shimmer(im, t, 108, 142, 18, '#8a92b8')
    q = sm(lt(t), 1.2, 2.6)
    put(im, spr('he', view='side', expr='sad', hands={'near': (3, 9 - 5 * q), 'far': (-2, 8 - 4 * q)}, t=t), 146, MF)
    d = ImageDraw.Draw(im)
    d.ellipse((158, 112 - 10 * q, 164, 118 - 10 * q), fill=hx('#6d6780'))
    return im, sc.medium(90)
c1_stone.loc = 'river'


def c1_splash(t):
    """Insert: the stone breaks the water; the rings spread and fade."""
    im = Image.new('RGB', (160, 90), hx('#3c4360'))
    wo.gradient(im, (0, 0, 160, 90), ['#4c5478', '#333a56'])
    for y in range(0, 90, 3):
        ImageDraw.Draw(im).line((0, y, 159, y), fill=hx('#46507a' if (y // 3) % 2 else '#3a4264'))
    for i in range(7):
        ph = (t * .55 + i / 7) % 1.0
        r = int(ph * 66)
        c = lerp(hx('#3c4360'), hx('#e6eefc'), (1 - ph) * .85)
        ImageDraw.Draw(im).ellipse((84 - r, 44 - r // 3, 84 + r, 44 + r // 3), outline=c)
    for k in range(6):
        ph = (t * 1.4 + k * .2) % 1.0
        ImageDraw.Draw(im).point((84 + (k - 3) * 3, 44 - int(ph * 16) + 16), fill=hx('#dfe8f8'))
    return im, (0, 0, 2)
c1_splash.loc = 'insert'


def c1_crowd(t):
    """He walks into the shopping street and the crowd keeps closing behind him."""
    im = wo.market()
    x = 40 + 24 * (lt(t) % 4.5)
    for i in range(5):
        px_ = (i * 66 + t * 12) % 360 - 20
        put(im, spr('oldlady' if i % 2 else 'couple_m', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', mirror=i % 2 == 0, t=t), px_, WF + (i % 2) * 2)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='soft', hands={'near': (0, 8)}, t=t), x, WF + 4)
    for i in range(3):
        px_ = 200 + i * 42
        put(im, spr('couple_f' if i % 2 else 'clerk', view='side', frame=walkframe(t + 2, 4), walking=True,
                    expr='neutral', mirror=True, t=t), px_, WF + 6)
    wo.light(im, 160, 136, 80, .1, '#ffc887')
    return sc.wide(im)
c1_crowd.loc = 'market'


def c1_empty(t):
    """The corner afterwards: rain, a puddle, and nobody."""
    im = wo.street()
    sc.rain_on(im, t, n=110, wind=3)
    return sc.wide(im)
c1_empty.loc = 'street'


# ================================================================ V2
def v2_hair(t):
    """He touches the very end of her hair — the only touch he allows himself."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(lt(t), .6, 2.6)
    sc.sit_she(im, 148, 128, expr='sad', hands={'near': (3, 4)}, t=t)
    hx_, hy_ = side_hand('he', 200, 128, (0, 8), seated=True)
    target = (162, 120)
    hands = {'near': (round((target[0] - hx_) * q), round((target[1] - hy_) * q) + 8)}
    sc.sit_he(im, 200, 128, expr='sad', hands=hands, t=t)
    d = ImageDraw.Draw(im)
    for k in range(3):
        d.line((160 + k, 118, 166 + k, 128), fill=hx('#3a2a22'))
    return im, sc.medium(112, 56)
v2_hair.loc = 'car'


def v2_her_face(t):
    """Close: her face; he is looking at his own hands, off-frame."""
    im = wo.car()
    wo.glass_rain(im, t, n=40)
    sc.sit_she(im, 156, 130, expr='cry', hands={'near': (3, 4)}, t=t)
    return im, (110, 76, 2)
v2_her_face.loc = 'car'


def v2_car_wide(t):
    """Both of them, fog on the glass, the heater ticking somewhere."""
    im = wo.car()
    wo.glass_rain(im, t, n=34)
    sc.sit_she(im, 128, 128, expr='sad', hands={'near': (3, 4)}, t=t)
    sc.sit_he(im, 188, 128, expr='sad', hands={'near': (2, 6)}, t=t)
    d = ImageDraw.Draw(im)
    for k in range(4):                                     # her breath fogging the glass
        r = 4 + k * 3
        d.ellipse((120 - r, 62 - r // 2, 120 + r, 62 + r // 2), outline=hx('#6a6488'))
    return sc.wide(im)
v2_car_wide.loc = 'car'


def v2_wrist(t):
    """Insert: her fist locked round her own wrist; his hand comes in from the right and covers it."""
    im = hand_bg()
    q = sm(lt(t), .7, 2.4)
    # her forearm coming in from the left, her fist gripping it
    cv = Canvas(160, 90)
    sk, sks, sl, sls = cast.SHE_S
    cv.rect(0, 44, 34, 22, sl); cv.rect(0, 44, 34, 4, sls)
    cv.rrect(28, 46, 54, 18, sk, 5)                       # forearm
    cv.rect(30, 60, 50, 3, sks)
    cv.rrect(52, 40, 24, 30, sk, 6)                       # her fist over the wrist
    for i in range(4): cv.rect(54 + i * 5, 42, 4, 12, sk); cv.rect(54 + i * 5, 52, 4, 2, sks)
    cv.rect(52, 66, 24, 3, sks)
    layer(im, cv)
    # his hand arriving from the right
    cv2 = Canvas(160, 90)
    sk2, sks2, sl2, sls2 = cast.HE_S
    x0 = int(150 - 34 * q)
    cv2.rect(x0 + 30, 40, 30, 22, sl2); cv2.rect(x0 + 30, 40, 30, 4, sls2)
    cv2.rrect(x0, 36, 34, 30, sk2, 7)                     # palm over the back of her hand
    for i in range(4): cv2.rect(x0 - 6, 40 + i * 6, 9, 4, sk2); cv2.rect(x0 - 6, 43 + i * 6, 9, 1, sks2)
    cv2.rect(x0 + 8, 40, 1, 22, sks2)
    layer(im, cv2)
    return im, (0, 0, 2)
v2_wrist.loc = 'hands'


def v2_roof(t):
    """High above the city he stands at the railing and lets the cold do the work."""
    im = wo.roof()
    d = ImageDraw.Draw(im)
    for k in range(34):
        x = (k * 23 + t * 9) % W
        d.point((x, 100 + (k * 13) % 28), fill=hx('#ffd8a0'))
    wo.light(im, 96, 150, 40, .14, '#ffc887')
    put(im, spr('he', view='back', expr='sad', t=t), 96, 152)
    return sc.wide(im)
v2_roof.loc = 'roof'


def v2_road(t):
    """A long road home, streetlights one by one, and how far it still is."""
    im = wo.street('night').copy()
    d = ImageDraw.Draw(im)
    for k in range(34):
        x = (k * 37 + t * 30) % W
        d.line((x, 146 + (k * 11) % 24, x + 1, 150 + (k * 11) % 24), fill=hx('#4a4568'))
    put(im, spr('he', view='back', expr='sad', t=t), 140, 146)
    return sc.wide(im)
v2_road.loc = 'street'


def v2_sakura(t):
    """Spring, another year: the avenue in bloom and she walks it alone."""
    im = wo.sakura()
    wo.petals(im, t, 40)
    put(im, spr('she', view='side', frame=walkframe(t, 4), walking=True, expr='soft',
                hands={'near': (0, 8)}, t=t), 118 + 20 * (lt(t) % 4.5), 146, mirror=False)
    return sc.wide(im)
v2_sakura.loc = 'sakura'


def v2_train(t):
    """The train window: the mountain slides past and her face doubles in the glass."""
    im = wo.train()
    d = ImageDraw.Draw(im)
    for k in range(6):
        x = (20 + k * 50 + t * 40) % 300
        d.line((x, 34, x + 2, 96), fill=hx('#9aa4bc'))
    # her reflection first (in the glass, above), then the real girl on the seat
    ghost(im, lambda l: put(l, spr('she', view='side', expr='sad', mirror=True,
                                   hands={'near': (0, 8)}, t=t), 78, 118), .55)
    sc.sit_she(im, 78, 158, expr='sad', hands={'near': (4, 4)}, t=t)
    return sc.wide(im)
v2_train.loc = 'train'


# ================================================================ CHORUS 2
def c2_hands(t):
    """Her hand opens; his stays where it was, in the air."""
    im = hand_bg()
    h = thumbs_press(1 - sm(lt(t), 1.4, 3.6) * .95, L=cast.SHE_S, R=cast.HE_S)
    im.paste(h, (0, 0), h)
    return im, (0, 0, 2)
c2_hands.loc = 'hands'


def c2_coat_front(t):
    """The coat goes on her shoulders again — this time we watch her face while it happens."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(lt(t), .5, 2.2)
    sc.sit_she(im, 148, 128, expr='sad', hands={'near': (2, 5)}, t=t)
    if q > .15: coat_over_shoulders(im, 148, 144 + int((1 - q) * 2))
    sc.sit_he(im, 196, 128, expr='sad', hands={'near': (-2, 4 - 2 * q)}, t=t)
    return im, sc.medium(100, 56)
c2_coat_front.loc = 'car'


def c2_footprints(t):
    """Only one line of footprints goes on now."""
    im = wo.snow('night').copy()
    wo.falling_snow(im, t, 60)
    wo.footprints(im, [(118 + i * 6, 152 + i) for i in range(16)])
    put(im, spr('he', view='side', frame=walkframe(t, 4), walking=True, expr='sad', t=t), 96, MF)
    tint(im, .18, '#8a98c0')
    return sc.wide(im)
c2_footprints.loc = 'snow'


def c2_crowd_cry(t):
    """She cries in the snow while strangers go past under umbrellas."""
    im = wo.snow('night').copy()
    wo.falling_snow(im, t, 70)
    for i in range(3):
        x = (i * 96 + t * 14) % 400 - 40
        put(im, spr('oldlady' if i % 2 else 'couple_m', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', t=t), x, WF + 2)
        d = ImageDraw.Draw(im)
        d.polygon([(x - 14, 112), (x + 16, 112), (x + 1, 98)], fill=hx('#4a4462'))
        d.line((x + 1, 112, x + 1, 126), fill=hx('#3a3450'))
    put(im, spr('she', view='front', expr='cry', t=t), 168, 146)
    tint(im, .12, '#9aa8c8')
    return im, sc.medium(96)
c2_crowd_cry.loc = 'snow'


def c2_fuji_dawn(t):
    """Dawn on the lake: the mountain has not moved for anyone."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 120, 168, 34, '#d8c0b8')
    wo.falling_snow(im, t, 24, 1, '#f4f0e8')
    return sc.wide(im)
c2_fuji_dawn.loc = 'fuji'


def c2_lab_petal(t):
    """The tube again — this time a single petal is sealed inside it."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    d.rectangle((78, 20, 92, 76), fill=hx('#3c4458'))
    d.rectangle((79, 34, 91, 75), fill=hx('#3a3a4e'))
    for k in range(3):
        d.ellipse((81, 46 + k * 5, 89, 51 + k * 5), fill=hx('#d8687a'))
    d.line((79, 34, 79, 74), fill=hx('#a8c0d8'))
    return im, (0, 0, 2)
c2_lab_petal.loc = 'lab'


def c2_his_eyes(t):
    """Close: his eyes, dry."""
    im = wo.car()
    wo.glass_rain(im, t, n=26)
    put(im, spr('he', view='front', expr='sad', t=t), 152, 146)
    return im, (104, 74, 2)
c2_his_eyes.loc = 'car'


def c2_her_eyes(t):
    """Close: her eyes, not dry. A match cut from his."""
    im = wo.car()
    wo.glass_rain(im, t, n=26)
    put(im, spr('she', view='front', expr='cry', t=t), 154, 147)
    return im, (106, 74, 2)
c2_her_eyes.loc = 'car'


def c2_stone_pocket(t):
    """He does not throw it this time. He puts it in his pocket and keeps it."""
    im = wo.river()
    sc.shimmer(im, t, 108, 142, 18, '#8a92b8')
    q = sm(lt(t), .8, 2.6)
    put(im, spr('he', view='side', expr='soft', hands={'near': (3 + 2 * q, 9 + 4 * q)}, t=t), 146, MF)
    if q < .6:
        d = ImageDraw.Draw(im)
        d.ellipse((160, 118, 166, 124), fill=hx('#6d6780'))
    return im, sc.medium(90)
c2_stone_pocket.loc = 'river'


def c2_swallowed(t):
    """The crowd takes him; the sign keeps swinging."""
    im = wo.market()
    x = 60 + 30 * (lt(t) % 4.2)
    for i in range(6):
        px_ = (i * 56 + t * 15) % 400 - 30
        put(im, spr('couple_m' if i % 2 else 'couple_f', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', mirror=i % 3 == 0, t=t), px_, WF + (i % 3))
    put(im, spr('he', view='back', expr='sad', t=t), x, WF + 4)
    return sc.wide(im)
c2_swallowed.loc = 'market'


# ================================================================ CHORUS 3
def c3_one_hand(t):
    """One hand, empty, still held out."""
    im = hand_bg()
    cv = Canvas(160, 90)
    sk, sks, sl, sls = cast.HE_S
    cv.line((-10, 62), (76, 46), sl, 14); cv.line((-10, 56), (74, 42), sls, 8)
    cv.rrect(72, 30, 38, 22, sk, 8)
    for i in range(4): cv.rect(108, 32 + i * 5, 7, 4, sk)
    cv.rect(74, 46, 34, 3, sks)
    layer(im, cv)
    return im, (0, 0, 2)
c3_one_hand.loc = 'hands'


def c3_coat_wind(t):
    """She pulls the coat closed against the wind at the mouth of the alley."""
    im = wo.alley()
    wo.falling_snow(im, t, 50, 2)
    put(im, spr('she', view='side', expr='sad', hands={'near': (5, 5)}, t=t), 152, 146)
    coat_over_shoulders(im, 152, 146, 1, front=True)
    return im, sc.medium(96)
c3_coat_wind.loc = 'alley'


def c3_paths(t):
    """Two lines of footprints meet; after that only one goes on."""
    im = wo.snow('dawn').copy()
    wo.falling_snow(im, t, 26)
    for i in range(9): wo.footprints(im, [(104 + i * 5, 148 + i * 2)])
    for i in range(9): wo.footprints(im, [(198 - i * 5, 156 + i * 2)])
    wo.footprints(im, [(152 + i * 6, 166 - i) for i in range(10)])
    tint(im, .15, '#e0c0b8')
    return sc.wide(im)
c3_paths.loc = 'snow'


def c3_laugh(t):
    """Memory, dipped to white: she laughs in the snow and the sound is long gone."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 50)
    put(im, spr('she', view='front', expr='laugh', t=t), 150, 146)
    tint(im, .28, '#f0e4dc')
    white_out(im, .14)
    return im, (88, 82, 2)
c3_laugh.loc = 'snow'


def c3_fuji_still(t):
    """The same view, the same mountain — only the light has changed."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 120, 168, 30, '#e0c8bc')
    return sc.wide(im)
c3_fuji_still.loc = 'fuji'


def c3_pour(t):
    """He pours the dark liquid away at the bench. The tube comes out clean."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    q = sm(lt(t), .6, 2.4)
    tx = 148 - int(22 * q); ty = 34 + int(12 * q)
    d.rectangle((tx, ty, tx + 12, ty + 42), fill=hx('#3c4458'))
    y_end = max(ty + 15, ty + 40 - int(24 * (1 - q)))
    d.rectangle((tx + 1, ty + 12, tx + 11, y_end), fill=hx('#4a2a3a'))
    if q > .2:
        for k in range(5): d.point((tx + 6, ty + 44 + k * 4), fill=hx('#5a3a4a'))
    put(im, spr('he', view='side', expr='soft', hands={'near': (6, 4)}, t=t), 208, 146)
    return im, sc.medium(116)
c3_pour.loc = 'lab'


def c3_river_away(t):
    """He walks away from the river with the stone in his pocket."""
    im = wo.river()
    sc.shimmer(im, t, 108, 142, 16, '#8a92b8')
    x = 150 - 18 * lin(lt(t), 0, 4.6)
    put(im, spr('he', view='side', frame=walkframe(t, 4), walking=True, expr='soft', t=t), x, MF, mirror=True)
    return sc.wide(im)
c3_river_away.loc = 'river'


def c3_river_empty(t):
    """The bank afterwards: the stones he did not throw."""
    im = wo.river()
    sc.shimmer(im, t, 108, 142, 22, '#8a92b8')
    d = ImageDraw.Draw(im)
    d.ellipse((160, 132, 167, 138), fill=hx('#6d6780'))
    d.arc((160, 132, 167, 138), 190, 330, fill=hx('#7d7794'))
    return im, sc.medium(90, 60)
c3_river_empty.loc = 'river'


def c3_dawn_cross(t):
    """Market at dawn: the shutters are half up; he crosses and is gone down the street."""
    im = wo.market()
    tint(im, .1, '#e0b090')
    x = 258 - 22 * (lt(t) % 4.5)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='soft', t=t), x, WF, mirror=True)
    for i in range(3):
        put(im, spr('clerk' if i % 2 else 'kid_g', view='side', expr='neutral', t=t), 40 + i * 50, WF + 2)
    return sc.wide(im)
c3_dawn_cross.loc = 'market'


def c3_signal(t):
    """The crossing is empty; the light changes for nobody."""
    im = wo.street('dawn').copy()
    d = ImageDraw.Draw(im)
    on = int(t * .8) % 2
    d.rectangle((250, 88, 262, 112), fill=hx('#2a2634'))
    d.ellipse((253, 90, 259, 96), fill=hx('#e8584a' if on else '#4a3030'))
    d.ellipse((253, 102, 259, 108), fill=hx('#4a4a3a' if on else '#7ad890'))
    sc.rain_on(im, t, n=80, wind=2)
    return sc.wide(im)
c3_signal.loc = 'street'


# ================================================================ FINAL
def f_coat_offer(t):
    """At her door he takes the old coat off his own shoulders and holds it out in both hands."""
    im = wo.door()
    wo.falling_snow(im, t, 38)
    q = sm(lt(t), .4, 2.0)                       # he lifts it a little higher as he speaks
    put(im, spr('he', view='side', expr='soft', hands={'near': (7, 4 - 3 * q)}, t=t), 108, 152)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (2, 7)}, t=t), 148, 153)
    c = windbreaker(16, 20)
    im.paste(c, (114, int(126 - 4 * q)), c)
    return im, sc.medium(52, 78)
f_coat_offer.loc = 'door'


def f_coat_take(t):
    """Close: her hands close on the old coat; she holds it against herself and does not cry."""
    im = Image.new('RGB', (160, 90), hx('#3a2e30'))
    wo.gradient(im, (0, 0, 160, 90), ['#4a3a38', '#2e2630'])
    c = coat_close(1.0, .9, sm(lt(t), .4, 2.4), cast.SHE_S[:2])
    im.paste(c, (0, 0), c)
    return im, (0, 0, 2)
f_coat_take.loc = 'hands'


def f_close_face(t):
    """She has the coat on now. A long hold on her face while the song lets go."""
    im = wo.door()
    wo.falling_snow(im, t, 26)
    put(im, spr('she', view='front', expr='soft', t=t), 152, 150)
    coat_over_shoulders(im, 152, 150, 1, front=True)
    return im, (96, 86, 2)
f_close_face.loc = 'door'


# ================================================================ OUTRO
def o_walk(t):
    """She walks away down the lane in his coat; he stays where he is."""
    im = wo.alley()
    wo.falling_snow(im, t, 60)
    x = 124 + 22 * (lt(t) % 4.6)
    put(im, spr('he', view='back', expr='sad', t=t), 96, WF + 2)
    put(im, spr('she', view='back', frame=walkframe(t, 4), walking=True, expr='neutral', t=t), x, WF)
    coat_over_shoulders(im, x, WF, 1)
    return sc.wide(im)
o_walk.loc = 'alley'


def o_fuji_bookend(t):
    """The bookend: the same lake, one small figure walking the pier."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 118, 168, 28, '#f0d8c8')
    wo.falling_snow(im, t, 28, 1, '#f8f4ee')
    x = 240 + 13 * (lt(t) % 4.0)
    put(im, spr('she', view='back', frame=walkframe(t, 4), walking=True, expr='neutral', t=t), x, 164)
    coat_over_shoulders(im, x, 164, 1)
    return sc.wide(im)
o_fuji_bookend.loc = 'fuji'


def o_door_empty(t):
    """The doorway, the light still on, snow filling his footprints."""
    im = wo.door()
    wo.falling_snow(im, t, 46)
    d = ImageDraw.Draw(im)
    for k in range(5):
        d.ellipse((116 + k * 8, 148 + (k % 2) * 3, 122 + k * 8, 152 + (k % 2) * 3), fill=hx('#a8b2c8'))
    return sc.wide(im)
o_door_empty.loc = 'door'


def o_end_card(t):
    """End card over the mountain: the MV credit."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 118, 168, 24, '#e8ccc0')
    band_overlay(im, 92, 160, 150)
    plate(im, 100, 166, .82)
    pixtext_c(im, 104, '富士山下', 22, '#fbf6ea')
    pixtext_c(im, 134, 'MV 制作 · 像素手绘动画', 12, '#f2e6d0')
    pixtext_c(im, 152, '词 林夕   曲 Christopher Chak', 11, '#d8cfe4')
    return sc.wide(im)
o_end_card.loc = 'fuji'


# ================================================================ the cut
S(0.0, 3.0, intro1)
S(3.0, 5.7, title_card)
S(5.7, 9.4, intro2)
S(9.4, 13.2, intro3)
S(13.2, 16.8, intro4)
S(16.8, 21.96, v1_shiver)

S(21.96, 26.46, v1_shiver_close)
S(26.46, 31.02, v1_coat_insert)
S(31.02, 35.62, v1_box)
S(35.62, 40.18, v1_car_door)
S(40.18, 44.74, v1_roses)
S(44.74, 49.34, v1_petals)
S(49.34, 53.88, v1_car_talk)
S(53.88, 58.44, v1_tear)

S(58.44, 63.61, c1_hands)
S(63.61, 68.18, c1_coat_on)
S(68.18, 72.73, c1_snow_walk)
S(72.73, 77.29, c1_snow_face)
S(77.29, 81.91, c1_fuji_far)
S(81.91, 86.40, c1_tube)
S(86.40, 90.30, c1_stone)
S(90.30, 94.14, c1_splash)
S(94.14, 98.56, c1_crowd)
S(98.56, 102.64, c1_empty)

S(102.64, 107.19, v2_hair)
S(107.19, 111.79, v2_her_face)
S(111.79, 116.38, v2_car_wide)
S(116.38, 120.95, v2_wrist)
S(120.95, 125.50, v2_roof)
S(125.50, 130.09, v2_road)
S(130.09, 134.70, v2_sakura)
S(134.70, 139.23, v2_train)

S(139.23, 144.39, c2_hands)
S(144.39, 148.94, c2_coat_front)
S(148.94, 153.51, c2_footprints)
S(153.51, 158.09, c2_crowd_cry)
S(158.09, 162.68, c2_fuji_dawn)
S(162.68, 167.21, c2_lab_petal)
S(167.21, 171.00, c2_his_eyes)
S(171.00, 174.21, c2_her_eyes)
S(174.21, 179.07, c2_stone_pocket)
S(179.07, 183.31, c2_swallowed)

S(183.31, 188.69, c3_one_hand)
S(188.69, 193.39, c3_coat_wind)
S(193.39, 198.16, c3_paths)
S(198.16, 202.85, c3_laugh)
S(202.85, 207.56, c3_fuji_still)
S(207.56, 212.25, c3_pour)
S(212.25, 217.00, c3_river_away)
S(217.00, 221.29, c3_river_empty)
S(221.29, 226.59, c3_dawn_cross)
S(226.59, 232.00, c3_signal)

S(232.00, 236.30, f_coat_offer)
S(236.30, 238.20, f_coat_take)
S(238.20, 241.00, f_close_face)

S(241.00, 245.60, o_walk)
S(245.60, 249.60, o_fuji_bookend)
S(249.60, 253.60, o_door_empty)
S(253.60, 259.13, o_end_card)


# ---------------------------------------------------------------- a very slow camera push
# Long emotional holds would otherwise measure as dead frames: tilt up a couple of native pixels over the shot.
DEAD = {'v1_coat_insert', 'v1_tear', 'c1_hands', 'c1_snow_walk', 'c1_snow_face', 'c1_fuji_far', 'v2_her_face',
        'v2_car_wide', 'v2_wrist', 'v2_roof', 'v2_road', 'c2_hands', 'c2_footprints', 'c2_fuji_dawn',
        'c2_lab_petal', 'c2_stone_pocket', 'c3_one_hand', 'c3_coat_wind', 'c3_paths', 'c3_laugh',
        'c3_fuji_still', 'c3_pour', 'c3_river_away', 'c3_dawn_cross', 'f_coat_take', 'o_end_card'}


def _push(im, q, amp=2.4):
    d = int(round(amp * min(1.0, q)))
    if d <= 0: return im
    out = im.copy()
    out.paste(im.crop((0, d, im.width, im.height)), (0, 0))
    last = im.crop((0, im.height - 1, im.width, im.height))
    out.paste(last.resize((im.width, d), Image.NEAREST), (0, im.height - d))
    return out


def _wrap(fn):
    def g(t):
        im, cam = fn(t)
        return _push(im, (t - getattr(__import__('engine'), 'CURRENT_START', 0.0)) / 4.6), cam
    g.__name__ = fn.__name__; g.loc = getattr(fn, 'loc', fn.__name__)
    return g


for _i, (_a, _b, _fn, _st) in enumerate(SHOTS):
    if _fn.__name__ in DEAD:
        SHOTS[_i] = (_a, _b, _wrap(_fn), _st)
