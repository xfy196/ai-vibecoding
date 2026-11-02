"""All shots of the film. Each fn(t) -> (world_image, cam); cam = (x0, y0, zoom).
Every shot carries a @loc tag so shot_report() can check location variety."""
import math
from engine import (spr, put, hx, lerp, sm, lin, walkframe, head_top, side_hand, front_hand,
                    shadow, rain, Canvas, layer, thumbs_press, clasped_hands, polaroid, pixtext, pixtext_c,
                    text_w, ghost, Image, ImageDraw, SPECS)
import world as wo
import cast
from cast import windbreaker, coat_over_shoulders, coat_close
import scene as sc

W, H = 320, 180
SHOTS = []


def S(t0, t1, fn):
    SHOTS.append((t0, t1, fn, None))
    return fn


def tint(im, q, col='#8a9ac8'):
    """Memory / cold-exterior grade on the world image."""
    p = im.load(); c = hx(col)
    for y in range(im.height):
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], c, q)


def desat(im, q):
    p = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = p[x, y]
            m = (r * 30 + g * 59 + b * 11) // 100
            p[x, y] = (round(r + (m - r) * q), round(g + (m - g) * q), round(b + (m - b) * q))


def white_out(im, q):
    p = im.load(); w = (247, 240, 232)
    for y in range(im.height):
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], w, q)


def band_overlay(im, y0, y1, alpha=140, col='#141020'):
    """A soft dark band behind title/credit text so it reads on any background (drawn in world space)."""
    p = im.load(); c = hx(col)
    for y in range(max(0, y0), min(im.height, y1)):
        q = math.sin(math.pi * (y - y0) / max(1, y1 - y0)) ** .6 * alpha / 255
        for x in range(im.width):
            p[x, y] = lerp(p[x, y], c, q)


def steam(im, x, y, t, n=5):
    for i in range(n):
        q = (t * .7 + i / n) % 1.0
        c = int(180 + 60 * q)
        ImageDraw.Draw(im).ellipse((x - 3 + math.sin(q * 6 + i) * 3, y - q * 16 - 3,
                                    x + 3 + math.sin(q * 6 + i) * 3, y - q * 16 + 3),
                                   fill=hx('#%02x%02x%02x' % (c, c, c)))


# ================================================================ INTRO
def intro1(t):
    """Rainy street, he arrives with the coat over his arm."""
    im = wo.street()
    sc.rain_on(im, t, n=110, wind=3)
    x = 40 + 26 * lin(t, 0, 3.0)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='sad',
                hands={'near': (0, 9)}, t=t), x, 160)
    c = windbreaker()
    im.paste(c, (int(x) + 6, 132), c)                        # coat over his arm
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 8)}, t=t), 210, 161)
    return sc.wide(im)
intro1.loc = 'street'


def title_card(t):
    """Title on the lake: song, singer, credits (2.6 s hold)."""
    im = wo.fuji('dusk').copy()
    sc.shimmer(im, t, 122, 168, 30, '#b0b6d8')
    wo.falling_snow(im, t, 40, 1, '#e8eef8')
    band_overlay(im, 56, 128, 160)
    pixtext_c(im, 66, '富士山下', 26, '#f8f2e4')
    pixtext_c(im, 100, '陈奕迅', 13, '#f0d0a0')
    pixtext_c(im, 118, '词 林夕  曲 Christopher Chak', 9, '#c8c0d8')
    return sc.wide(im)
title_card.loc = 'fuji'


def intro2(t):
    """He stops beside her under the awning, both soaked."""
    im = wo.street()
    sc.rain_on(im, t, n=100, wind=2)
    put(im, spr('he', view='side', expr='sad', hands={'near': (0, 8)}, t=t), 146, 160)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t), 178, 161)
    sc.breath(im, 152, 128, t, 5, 1)
    return im, sc.medium(74)
intro2.loc = 'street'


def intro3(t):
    """The florist's shutter is down; one bulb still burns over the buckets."""
    im = wo.florist()
    sc.rain_on(im, t, n=90, wind=2)
    put(im, spr('florist', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t), 236, 158)
    steam(im, 120, 130, t)
    return sc.wide(im)
intro3.loc = 'florist'


def intro4(t):
    """The mountain in the rain — the motif, stated once, far away."""
    im = wo.fuji('rain').copy()
    sc.rain_on(im, t, n=120, wind=4)
    sc.shimmer(im, t, 122, 168, 22, '#8a90b8')
    return sc.wide(im)
intro4.loc = 'fuji'


# ================================================================ V1
def v1_shiver(t):
    """She is shivering; he holds the coat open behind her."""
    im = wo.street()
    sc.rain_on(im, t, n=100, wind=2)
    shiver = round(math.sin(t * 18) * .5)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 7)}, t=t, bob=shiver), 176, 161)
    put(im, spr('he', view='side', expr='sad', hands={'near': (-4, 4)}, t=t), 140, 160)
    c = windbreaker(15, 19)
    im.paste(c, (156, 120), c)
    return im, sc.medium(78, 56)
v1_shiver.loc = 'street'


def v1_coat_insert(t):
    """Insert: his two hands holding the windbreaker; the worn collar has frayed into a little flower."""
    im = Image.new('RGB', (160, 90), hx('#2f2b40'))
    wo.gradient(im, (0, 0, 160, 90), ['#3a3350', '#2b2740'])
    c = coat_close(1.0, sm(t, 0, 3.0) * .5 + .5)
    c = c.resize((110, 62), Image.NEAREST)
    im.paste(c, (26, 8), c)
    # two hands holding the shoulders of the coat from below
    for side, x in ((0, 20), (1, 122)):
        cv = Canvas(160, 90)
        sk, sks, sl, sls = cast.HE_S
        cv.rect(x - 8, 66, 22, 10, sl); cv.rect(x - 8, 74, 22, 4, sls)
        cv.rrect(x - 4, 54, 16, 16, sk, 3); cv.rect(x - 2, 67, 12, 2, sks)
        layer(im, cv)
    return im, (0, 0, 2)
v1_coat_insert.loc = 'hands'


def v1_box(t):
    """He crosses with a cardboard box — the transfer he took without complaint."""
    im = wo.street()
    sc.rain_on(im, t, n=90, wind=3)
    x = 250 - 32 * lin(t, 0, 4.5)
    f = walkframe(t, 5)
    put(im, spr('he', view='side', frame=f, walking=True, expr='sad', hands={'near': (2, 5)}, t=t), x, 160)
    d = ImageDraw.Draw(im)
    d.rectangle((int(x) - 4, 118, int(x) + 14, 134), fill=hx('#a87c4e'))
    d.rectangle((int(x) - 4, 118, int(x) + 14, 121), fill=hx('#c0925e'))
    d.line((int(x) + 5, 118, int(x) + 5, 134), fill=hx('#8a6238'))
    return sc.wide(im)
v1_box.loc = 'street'


def v1_car_door(t):
    """She gets into the car; he holds the door."""
    im = wo.car()
    wo.glass_rain(im, t)
    # the open door: a bright wedge of street light on the left
    d = ImageDraw.Draw(im)
    d.polygon([(0, 40), (54, 60), (54, 150), (0, 170)], fill=hx('#3e3756'))
    d.polygon([(4, 58), (50, 72), (50, 146), (4, 160)], fill=hx('#4a4064'))
    sc.sit_she(im, 150, 152, expr='sad', hands={'near': (6, 2)}, t=t)
    put(im, spr('he', view='side', expr='sad', hands={'near': (6, 3)}, t=t), 100, 162)
    return im, sc.medium(60, 50)
v1_car_door.loc = 'car'


def v1_roses(t):
    """He stops at the flower buckets, looks at the red roses, and walks on."""
    im = wo.florist()
    sc.rain_on(im, t, n=80, wind=2)
    put(im, spr('he', view='side', expr='sad', hands={'near': (0, 8)}, t=t), 200, 158)
    put(im, spr('florist', view='side', expr='smile', mirror=True, hands={'near': (4, 2)}, t=t), 132, 157)
    # a bunch of roses held out toward him
    d = ImageDraw.Draw(im)
    for k in range(6):
        d.ellipse((144 + k * 3, 118 + (k % 2), 152 + k * 3, 126 + (k % 2)), fill=hx('#d8483e'))
    d.rectangle((150, 126, 158, 138), fill=hx('#3a5a3a'))
    return im, sc.medium(96, 52)
v1_roses.loc = 'florist'


def v1_petals(t):
    """Insert: petals floating in a puddle, rain breaking the surface."""
    im = Image.new('RGB', (160, 90), hx('#2b2740'))
    wo.gradient(im, (0, 0, 160, 90), ['#4a4568', '#33304a'])
    for y in range(90):
        for x in range(160):
            if (x * 7 + y * 3) % 23 == 0: im.putpixel((x, y), hx('#3d3a58'))
    d = ImageDraw.Draw(im)
    for k in range(9):
        cx, cy = 18 + (k * 17) % 126, 30 + (k * 13) % 50
        d.ellipse((cx - 3, cy - 2, cx + 3, cy + 2), fill=hx('#d8687a' if k % 2 else '#e8879a'))
        d.point((cx, cy), fill=hx('#f7c6d0'))
    for i in range(20):                                   # ripples
        r = int((t * 22 + i * 9) % 26)
        cx, cy = 20 + (i * 37) % 120, 20 + (i * 23) % 60
        d.ellipse((cx - r, cy - r // 2, cx + r, cy + r // 2), outline=hx('#5c5878'))
    return im, (0, 0, 2)
v1_petals.loc = 'insert'


def v1_car_talk(t):
    """Inside: she turns to him; he keeps looking at the windscreen."""
    im = wo.car()
    wo.glass_rain(im, t)
    sc.sit_she(im, 138, 150, expr='sad', hands={'near': (4, 3)}, t=t)
    sc.sit_he(im, 190, 150, expr='sad', hands={'near': (2, 6)}, t=t)
    resp = sm(t, 1.2, 2.6)
    sc.sit_she(im, 138, 150, expr='sad' if resp < .5 else 'cry', hands={'near': (4, 3)}, t=t)
    return im, sc.medium(104, 66)
v1_car_talk.loc = 'car'


def v1_tear(t):
    """Close on her: a tear, and the rain running down the glass behind her."""
    im = wo.car()
    wo.glass_rain(im, t, n=50)
    sc.sit_she(im, 156, 152, expr='cry', hands={'near': (4, 3)}, t=t)
    return im, (104, 74, 2)
v1_tear.loc = 'car'


# ================================================================ CHORUS 1
def c1_hands(t):
    """Their hands, clasped — then his fingers slide out of hers."""
    im = Image.new('RGB', (160, 90), hx('#241f30'))
    wo.gradient(im, (0, 0, 160, 90), ['#332c44', '#221d2e'])
    q = sm(t, 2.6, 3.6)
    if q < .5:
        h = clasped_hands(left=cast.HE_S, right=cast.SHE_S)
    else:
        h = thumbs_press(1 - (q - .5) * 1.4, L=cast.SHE_S, R=cast.HE_S)
    im.paste(h, (0, 0), h)
    return im, (0, 0, 2)
c1_hands.loc = 'hands'


def c1_coat_on(t):
    """He puts the coat around her shoulders, from behind: she does not turn."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(t, .6, 2.2)
    sc.sit_she(im, 156, 150, expr='sad', hands={'near': (3, 4)}, t=t)
    if q > .2: cast.coat_over_shoulders(im, 156, 150, int((1 - q) * 3))
    put(im, spr('he', view='side', expr='sad', hands={'near': (-2, 3)}, t=t), 196, 150)
    return im, sc.medium(112, 62)
c1_coat_on.loc = 'car'


def c1_snow_walk(t):
    """Memory: the two of them on the snow road, hand in hand, walking away."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 60)
    wo.footprints(im, [(150 + i * 5, 150 + i) for i in range(14)])
    x = 150 + 10 * (t - t % 4.5)
    f = walkframe(t, 5)
    put(im, spr('he', view='side', frame=f, walking=True, expr='smile', hands={'far': (8, 4)}, t=t), 158 + 6, 148)
    put(im, spr('she', view='side', frame=(f + 2) % 4, walking=True, expr='smile', mirror=True,
                hands={'near': (-8, 4)}, t=t), 146, 151)
    tint(im, .28, '#9aa8d0')
    return sc.wide(im)
c1_snow_walk.loc = 'snow'


def c1_snow_face(t):
    """Her face in the snow light, crying for something good."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 40)
    put(im, spr('she', view='front', expr='cry', t=t), 150, 152)
    tint(im, .2, '#b0bcd8')
    return im, (86, 62, 2)
c1_snow_face.loc = 'snow'


def c1_fuji_far(t):
    """The mountain, and two tiny people on the pier."""
    im = wo.fuji('dusk').copy()
    sc.shimmer(im, t, 122, 168, 30, '#b6bcdc')
    put(im, spr('he', view='back', expr='neutral', t=t), 236, 170)
    put(im, spr('she', view='back', expr='neutral', t=t), 254, 171)
    return sc.wide(im)
c1_fuji_far.loc = 'fuji'


def c1_tube(t):
    """Insert: a test tube of dark liquid — grief does not show up in a test tube."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    d.rectangle((146, 78, 158, 120), fill=hx('#3c4458'))
    d.rectangle((147, 90, 157, 119), fill=hx('#4a2a3a'))
    d.line((147, 90, 147, 118), fill=hx('#a8c0d8'))
    d.rectangle((148, 76, 156, 80), fill=hx('#e8f0f8'))
    for k in range(4):
        yy = 92 + int((t * 12 + k * 7) % 24)
        d.point((149 + k % 3, yy), fill=hx('#7a4a5a'))
    return im, (96, 56, 2)
c1_tube.loc = 'lab'


def c1_stone(t):
    """He picks a stone off the riverbank, weighs it, throws."""
    im = wo.river()
    sc.shimmer(im, t, 108, 144, 18, '#8a92b8')
    q = sm(t, 1.2, 2.6)
    hands = {'near': (3, 10 - 6 * q), 'far': (-2, 9 - 5 * q)}
    put(im, spr('he', view='side', expr='sad', hands=hands, t=t), 150, 148)
    d = ImageDraw.Draw(im)
    d.ellipse((168, 118 - 6 * q, 174, 124 - 6 * q), fill=hx('#6d6780'))
    return im, sc.medium(96, 46)
c1_stone.loc = 'river'


def c1_splash(t):
    """Insert: the stone breaks the water; the rings spread out and fade."""
    im = Image.new('RGB', (160, 90), hx('#3c4360'))
    wo.gradient(im, (0, 0, 160, 90), ['#4c5478', '#333a56'])
    for y in range(0, 90, 3):
        ImageDraw.Draw(im).line((0, y, 159, y), fill=hx('#46507a' if (y // 3) % 2 else '#3a4264'))
    for i in range(6):
        r = int((t * 26 + i * 6) % 60)
        a = max(0, 1 - r / 60)
        c = lerp(hx('#3c4360'), hx('#dfe8f8'), a * .9)
        ImageDraw.Draw(im).ellipse((84 - r, 46 - r // 3, 84 + r, 46 + r // 3), outline=c)
    return im, (0, 0, 2)
c1_splash.loc = 'insert'


def c1_crowd(t):
    """He walks into the shopping street and the crowd keeps closing behind him."""
    im = wo.market()
    d = ImageDraw.Draw(im)
    x = 40 + 22 * (t % 4.5)
    for i in range(5):
        px_ = (i * 66 + t * 12) % 360 - 20
        put(im, spr('oldlady' if i % 2 else 'couple_m', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', mirror=i % 2 == 0, t=t), px_, 158 + (i % 2) * 2)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='soft', hands={'near': (0, 8)}, t=t), x, 162)
    for i in range(3):
        px_ = 200 + i * 40
        put(im, spr('couple_f' if i % 2 else 'clerk', view='side', frame=walkframe(t + 2, 4), walking=True,
                    expr='neutral', mirror=True, t=t), px_, 164)
    wo.light(im, 160, 140, 80, .12, '#ffc887')
    return sc.wide(im)
c1_crowd.loc = 'market'


def c1_empty(t):
    """The corner afterwards: only rain, a puddle, and the sign swinging."""
    im = wo.street()
    sc.rain_on(im, t, n=110, wind=3)
    return sc.wide(im)
c1_empty.loc = 'street'


# ================================================================ V2
def v2_hair(t):
    """He touches the very end of her hair — the only touch he allows himself."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(t, .5, 2.4)
    sc.sit_she(im, 150, 150, expr='sad', hands={'near': (3, 4)}, t=t)
    # his hand reaching to her hair ends: computed from his shoulder, kept within reach
    hx_, hy_ = side_hand('he', 204, 150, (0, 8))
    tx, ty_ = 168, 128
    hands = {'near': (round((tx - hx_) * q) + 0, round((ty_ - hy_) * q) + 8)}
    sc.sit_he(im, 204, 150, expr='sad', hands=hands, t=t)
    d = ImageDraw.Draw(im)
    for k in range(3):                                   # a strand of hair between his fingers
        d.line((166 + k, 126, 172 + k, 134), fill=hx('#3a2a22'))
    return im, sc.medium(120, 64)
v2_hair.loc = 'car'


def v2_her_face(t):
    """Close: her face; he is looking at his own hands."""
    im = wo.car()
    wo.glass_rain(im, t, n=44)
    sc.sit_she(im, 158, 152, expr='cry', hands={'near': (3, 4)}, t=t)
    return im, (108, 76, 2)
v2_her_face.loc = 'car'


def v2_car_wide(t):
    """Both of them, fog on the glass, the heater ticking."""
    im = wo.car()
    wo.glass_rain(im, t, n=40)
    sc.sit_she(im, 132, 150, expr='sad', hands={'near': (3, 4)}, t=t)
    sc.sit_he(im, 192, 150, expr='sad', hands={'near': (2, 6)}, t=t)
    d = ImageDraw.Draw(im)
    for k in range(5):                                    # breath fog on the window
        r = 6 + k * 3
        d.ellipse((126 - r, 112 - r // 2, 126 + r, 112 + r // 2), outline=hx('#5a5478'))
    return sc.wide(im)
v2_car_wide.loc = 'car'


def v2_wrist(t):
    """Insert: her hand gripping her own wrist; his hand comes over it and holds."""
    im = Image.new('RGB', (160, 90), hx('#2f2a3c'))
    wo.gradient(im, (0, 0, 160, 90), ['#3a3350', '#26222f'])
    cv = Canvas(160, 90)
    sk, sks, sl, sls = cast.SHE_S
    cv.rect(0, 30, 40, 26, sl); cv.rect(0, 30, 40, 4, sls)         # her sleeve, left
    cv.rrect(30, 34, 66, 22, sk, 6)
    for i in range(4): cv.rect(84, 36 + i * 5, 12, 3, sk)
    cv.rect(34, 50, 54, 3, sks)
    layer(im, cv)
    cv2 = Canvas(160, 90)
    sk2, sks2, sl2, sls2 = cast.HE_S
    cv2.rect(160, 26, 40, 24, sl2); cv2.rect(160, 26, 40, 4, sls2)
    q = sm(t, .8, 2.2)
    x0 = int(160 - 40 - 46 * q)
    cv2.rrect(x0, 30, 56, 24, sk2, 6)
    for i in range(4): cv2.rect(x0 - 8, 34 + i * 5, 10, 3, sk2)
    cv2.rect(x0 + 4, 50, 46, 3, sks2)
    layer(im, cv2)
    return im, (0, 0, 2)
v2_wrist.loc = 'hands'


def v2_roof(t):
    """High above the city: he stands at the railing and lets the cold do the work."""
    im = wo.roof()
    d = ImageDraw.Draw(im)
    for k in range(30):                                   # car lights moving on the streets below
        x = (k * 23 + t * 9) % W
        d.point((x, 100 + (k * 13) % 28), fill=hx('#ffd8a0'))
    put(im, spr('he', view='back', expr='sad', t=t), 92, 148)
    return sc.wide(im)
v2_roof.loc = 'roof'


def v2_road(t):
    """A long road home, streetlights one by one, and how far it still is."""
    im = wo.street('night').copy()
    d = ImageDraw.Draw(im)
    for k in range(40):                                   # rain on the asphalt
        x = (k * 37 + t * 30) % W
        d.line((x, 150 + (k * 11) % 26, x + 1, 154 + (k * 11) % 26), fill=hx('#4a4568'))
    put(im, spr('he', view='back', expr='sad', t=t), 140, 158)
    return sc.wide(im)
v2_road.loc = 'street'


def v2_sakura(t):
    """Spring, another year: the avenue in bloom and she walks it alone."""
    im = wo.sakura()
    wo.petals(im, t, 40)
    put(im, spr('she', view='side', frame=walkframe(t, 4), walking=True, expr='soft',
                hands={'near': (0, 8)}, t=t), 120 + 18 * (t % 4.5), 156)
    return sc.wide(im)
v2_sakura.loc = 'sakura'


def v2_train(t):
    """The train window: the mountain slides past, her face doubles in the glass."""
    im = wo.train()
    d = ImageDraw.Draw(im)
    for k in range(6):                                     # passing streaked landscape
        x = (20 + k * 50 + t * 40) % 300
        d.line((x, 32, x + 2, 100), fill=hx('#9aa4bc'))
    ghost(im, lambda l: put(l, spr('she', view='side', expr='sad', mirror=True,
                                   hands={'near': (0, 8)}, t=t), 70, 156), .55)
    return im, sc.medium(0, 34)
v2_train.loc = 'train'


# ================================================================ CHORUS 2
def c2_hands(t):
    """Her hand opens; his stays where it was."""
    im = Image.new('RGB', (160, 90), hx('#21202e'))
    wo.gradient(im, (0, 0, 160, 90), ['#2e2a3e', '#1e1c28'])
    h = thumbs_press(1 - sm(t, 1.2, 3.4) * .92, L=cast.SHE_S, R=cast.HE_S)
    im.paste(h, (0, 0), h)
    return im, (0, 0, 2)
c2_hands.loc = 'hands'


def c2_coat_front(t):
    """The coat goes on her shoulders — this time we see her face while it happens."""
    im = wo.car()
    wo.glass_rain(im, t)
    q = sm(t, .4, 2.0)
    sc.sit_she(im, 150, 150, expr='sad', hands={'near': (2, 5)}, t=t)
    if q > .15: cast.coat_over_shoulders(im, 150, 150 + int((1 - q) * 2))
    sc.sit_he(im, 196, 150, expr='sad', hands={'near': (-2, 4 - 2 * q)}, t=t)
    return im, sc.medium(108, 62)
c2_coat_front.loc = 'car'


def c2_footprints(t):
    """Only one line of footprints goes on now."""
    im = wo.snow('night').copy()
    wo.falling_snow(im, t, 60)
    wo.footprints(im, [(120 + i * 6, 156 + i) for i in range(16)])
    put(im, spr('he', view='side', frame=walkframe(t, 4), walking=True, expr='sad', t=t), 96, 150)
    tint(im, .2, '#8a98c0')
    return sc.wide(im)
c2_footprints.loc = 'snow'


def c2_crowd_cry(t):
    """She cries in the snow while strangers walk past with umbrellas."""
    im = wo.snow('night').copy()
    wo.falling_snow(im, t, 70)
    for i in range(3):
        x = (i * 90 + t * 14) % 380 - 30
        put(im, spr('oldlady' if i % 2 else 'couple_m', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', t=t), x, 152)
        d = ImageDraw.Draw(im)                            # umbrella
        d.polygon([(x - 14, 118), (x + 16, 118), (x + 1, 104)], fill=hx('#4a4462'))
        d.line((x + 1, 118, x + 1, 132), fill=hx('#3a3450'))
    put(im, spr('she', view='front', expr='cry', t=t), 170, 154)
    tint(im, .14, '#9aa8c8')
    return im, sc.medium(100, 58)
c2_crowd_cry.loc = 'snow'


def c2_fuji_dawn(t):
    """Dawn on the lake: the mountain has not moved for anyone."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 120, 170, 34, '#d8c0b8')
    wo.falling_snow(im, t, 26, 1, '#f4f0e8')
    return sc.wide(im)
c2_fuji_dawn.loc = 'fuji'


def c2_lab_petal(t):
    """The tube again — this time a single petal is sealed inside it."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    d.rectangle((146, 74, 158, 120), fill=hx('#3c4458'))
    d.rectangle((147, 92, 157, 119), fill=hx('#3a3a4e'))
    for k in range(3):
        d.ellipse((149, 100 + k * 5, 155, 104 + k * 5), fill=hx('#d8687a'))
    d.line((147, 92, 147, 118), fill=hx('#a8c0d8'))
    return im, (100, 54, 2)
c2_lab_petal.loc = 'lab'


def c2_his_eyes(t):
    """Close: his eyes, dry."""
    im = wo.car()
    wo.glass_rain(im, t, n=30)
    put(im, spr('he', view='front', expr='sad', t=t), 156, 152)
    return im, (104, 74, 2)
c2_his_eyes.loc = 'car'


def c2_her_eyes(t):
    """Close: her eyes, not dry. Match cut from his."""
    im = wo.car()
    wo.glass_rain(im, t, n=30)
    put(im, spr('she', view='front', expr='cry', t=t), 158, 153)
    return im, (106, 75, 2)
c2_her_eyes.loc = 'car'


def c2_stone_pocket(t):
    """He does not throw it this time. He puts it in his pocket and keeps it."""
    im = wo.river()
    sc.shimmer(im, t, 108, 144, 18, '#8a92b8')
    q = sm(t, .8, 2.6)
    put(im, spr('he', view='side', expr='soft', hands={'near': (3 + 2 * q, 9 + 4 * q)}, t=t), 150, 150)
    d = ImageDraw.Draw(im)
    if q < .6: d.ellipse((168, 126, 174, 132), fill=hx('#6d6780'))
    return im, sc.medium(96, 48)
c2_stone_pocket.loc = 'river'


def c2_swallowed(t):
    """The crowd takes him; the sign keeps swinging."""
    im = wo.market()
    x = 60 + 30 * (t % 4.2)
    for i in range(6):
        px_ = (i * 56 + t * 15) % 400 - 30
        put(im, spr('couple_m' if i % 2 else 'couple_f', view='side', frame=walkframe(t + i, 4), walking=True,
                    expr='neutral', mirror=i % 3 == 0, t=t), px_, 160)
    put(im, spr('he', view='back', expr='sad', t=t), x, 162)
    return sc.wide(im)
c2_swallowed.loc = 'market'


# ================================================================ CHORUS 3
def c3_one_hand(t):
    """One hand, empty, still held out."""
    im = Image.new('RGB', (160, 90), hx('#2b2740'))
    wo.gradient(im, (0, 0, 160, 90), ['#3a3450', '#221f30'])
    cv = Canvas(160, 90)
    sk, sks, sl, sls = cast.HE_S
    cv.line((-10, 60), (90, 44), sl, 14); cv.line((-10, 54), (88, 40), sls, 8)
    cv.rrect(86, 30, 40, 22, sk, 8)
    for i in range(4): cv.rect(124, 32 + i * 5, 8, 4, sk)
    cv.rect(88, 46, 36, 3, sks)
    layer(im, cv)
    return im, (0, 0, 2)
c3_one_hand.loc = 'hands'


def c3_coat_wind(t):
    """She pulls the coat closed against the wind on the alley corner."""
    im = wo.alley()
    wo.falling_snow(im, t, 50, 2)
    put(im, spr('she', view='side', expr='sad', hands={'near': (5, 5)}, t=t), 156, 158)
    coat_over_shoulders(im, 156, 158, 1)
    return im, sc.medium(100, 58)
c3_coat_wind.loc = 'alley'


def c3_paths(t):
    """Two lines of footprints meet, and after that only one goes on."""
    im = wo.snow('dawn').copy()
    wo.falling_snow(im, t, 30)
    for i in range(9): wo.footprints(im, [(104 + i * 5, 150 + i * 2)])
    for i in range(9): wo.footprints(im, [(196 - i * 5, 158 + i * 2)])
    wo.footprints(im, [(150 + i * 6, 168 - i) for i in range(10)])
    tint(im, .18, '#e0c0b8')
    return sc.wide(im)
c3_paths.loc = 'snow'


def c3_laugh(t):
    """Memory, dipped to white: she laughs in the snow and the sound is gone."""
    im = wo.snow('dusk').copy()
    wo.falling_snow(im, t, 50)
    put(im, spr('she', view='front', expr='laugh', t=t), 152, 154)
    tint(im, .3, '#f0e4dc')
    white_out(im, .16)
    return im, (90, 60, 2)
c3_laugh.loc = 'snow'


def c3_fuji_still(t):
    """The same view, the same mountain — only the light has changed."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 120, 170, 30, '#e0c8bc')
    return sc.wide(im)
c3_fuji_still.loc = 'fuji'


def c3_pour(t):
    """He pours the dark liquid away at the bench. The tube comes out clean."""
    im = wo.lab()
    d = ImageDraw.Draw(im)
    q = sm(t, .6, 2.4)
    tx = 150 - int(20 * q); ty = 96 + int(10 * q)
    d.rectangle((tx, ty, tx + 12, 120), fill=hx('#3c4458'))
    y_end = max(ty + 15, 119 - int(26 * (1 - q)))
    d.rectangle((tx + 1, ty + 14, tx + 11, y_end), fill=hx('#4a2a3a'))
    for k in range(5):                                    # the stream
        if q > .15: d.point((tx + 6, 118 + k * 3), fill=hx('#5a3a4a'))
    put(im, spr('he', view='side', expr='soft', hands={'near': (6, 4)}, t=t), 210, 152)
    return im, sc.medium(120, 52)
c3_pour.loc = 'lab'


def c3_river_away(t):
    """He walks away from the river with the stone in his pocket."""
    im = wo.river()
    sc.shimmer(im, t, 108, 144, 16, '#8a92b8')
    x = 150 - 16 * lin(t, 0, 4.6)
    put(im, spr('he', view='side', frame=walkframe(t, 4), walking=True, expr='soft', t=t), x, 152)
    return sc.wide(im)
c3_river_away.loc = 'river'


def c3_river_empty(t):
    """The bank afterwards: the stones he did not throw."""
    im = wo.river()
    sc.shimmer(im, t, 108, 144, 22, '#8a92b8')
    d = ImageDraw.Draw(im)
    d.ellipse((166, 140, 172, 145), fill=hx('#6d6780'))
    return im, sc.medium(96, 60)
c3_river_empty.loc = 'river'


def c3_dawn_cross(t):
    """Market at dawn: shutter half up, he crosses and is gone down the street."""
    im = wo.market()
    for i in range(3): tint(im, .12, '#e0b090')
    x = 260 - 20 * (t % 4.5)
    put(im, spr('he', view='side', frame=walkframe(t, 5), walking=True, expr='soft', t=t), x, 160)
    for i in range(3):
        put(im, spr('clerk' if i % 2 else 'kid_g', view='side', expr='neutral', t=t), 40 + i * 50, 158)
    return sc.wide(im)
c3_dawn_cross.loc = 'market'


def c3_signal(t):
    """The crossing is empty; the light changes for nobody."""
    im = wo.street('dawn').copy()
    d = ImageDraw.Draw(im)
    on = int(t * .8) % 2
    d.rectangle((252, 96, 262, 118), fill=hx('#2a2634'))
    d.ellipse((254, 98, 260, 104), fill=hx('#e8584a' if on else '#4a3030'))
    d.ellipse((254, 108, 260, 114), fill=hx('#4a4a3a' if on else '#7ad890'))
    sc.rain_on(im, t, n=80, wind=2)
    return sc.wide(im)
c3_signal.loc = 'street'


# ================================================================ FINAL
def f_coat_offer(t):
    """At her door he takes the old coat off his own shoulders and holds it out with both hands."""
    im = wo.door()
    wo.falling_snow(im, t, 40)
    q = sm(t, .4, 1.8)
    put(im, spr('he', view='side', expr='soft', hands={'near': (8, 3)}, t=t), 126, 170)
    put(im, spr('she', view='side', expr='sad', mirror=True, hands={'near': (0, 8)}, t=t), 176, 171)
    if q < .8:
        c = windbreaker(15, 19)
        im.paste(c, (142, int(138 - 2 * q)), c)
    return im, sc.medium(70, 76)
f_coat_offer.loc = 'door'


def f_coat_take(t):
    """Close: her hands close on the old coat. She holds it against her chest and does not cry."""
    im = Image.new('RGB', (160, 90), hx('#3a2e30'))
    wo.gradient(im, (0, 0, 160, 90), ['#4a3a38', '#2e2630'])
    q = sm(t, .3, 2.6)
    c = coat_close(1.0, .9)
    c = c.resize((96, 54), Image.NEAREST)
    im.paste(c, (26, 6), c)
    for side, x in ((0, 24), (1, 112)):
        cv = Canvas(160, 90)
        sk, sks, sl, sls = cast.SHE_S
        cv.rect(x - 10, 62, 26, 12, sl); cv.rect(x - 10, 70, 26, 4, sls)
        cv.rrect(x - 6, 48 - int(6 * q), 20, 18, sk, 3)
        for i in range(4): cv.rect(x - 4 + i * 4, 40 - int(8 * q), 3, 10, sk)
        layer(im, cv)
    return im, (0, 0, 2)
f_coat_take.loc = 'hands'


def f_close_face(t):
    """She has the coat on now; a long hold on her face while the song lets go."""
    im = wo.door()
    wo.falling_snow(im, t, 30)
    put(im, spr('she', view='front', expr='soft', t=t), 158, 172)
    coat_over_shoulders(im, 158, 172, 1)
    return im, (100, 82, 2)
f_close_face.loc = 'door'


# ================================================================ OUTRO
def o_walk(t):
    """She walks away down the lane in his coat; he does not follow."""
    im = wo.alley()
    wo.falling_snow(im, t, 60)
    x = 120 + 22 * (t % 4.6)
    put(im, spr('she', view='back', frame=walkframe(t, 4), walking=True, expr='neutral', t=t), x, 158)
    put(im, spr('he', view='back', expr='sad', t=t), 100, 160)
    return sc.wide(im)
o_walk.loc = 'alley'


def o_fuji_bookend(t):
    """The bookend: the same lake, one small figure walking the pier."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 118, 170, 28, '#f0d8c8')
    wo.falling_snow(im, t, 30, 1, '#f8f4ee')
    x = 250 + 12 * (t % 4.0)
    put(im, spr('she', view='back', frame=walkframe(t, 4), walking=True, expr='neutral', t=t), x, 170)
    return sc.wide(im)
o_fuji_bookend.loc = 'fuji'


def o_door_empty(t):
    """The doorway, the light still on, snow filling his footprints."""
    im = wo.door()
    wo.falling_snow(im, t, 50)
    d = ImageDraw.Draw(im)
    for k in range(5):
        d.ellipse((118 + k * 9, 156 + (k % 2) * 3, 124 + k * 9, 160 + (k % 2) * 3), fill=hx('#a8b2c8'))
    return sc.wide(im)
o_door_empty.loc = 'door'


def o_end_card(t):
    """End card on the mountain: the MV credit."""
    im = wo.fuji('dawn').copy()
    sc.shimmer(im, t, 118, 170, 24, '#e8ccc0')
    band_overlay(im, 52, 130, 130)
    pixtext_c(im, 70, '富士山下', 18, '#f8f2e4')
    pixtext_c(im, 96, 'MV 制作 · 像素手绘动画', 10, '#e8dcc8')
    pixtext_c(im, 114, '词 林夕  曲 Christopher Chak', 9, '#c0b8d0')
    return sc.wide(im)
o_end_card.loc = 'fuji'


# ================================================================ the cut
S(0.0, 3.0, intro1)
S(3.0, 5.7, title_card)
S(5.7, 9.4, intro2)
S(9.4, 13.2, intro3)
S(13.2, 16.8, intro4)
S(16.8, 21.96, v1_shiver)

S(21.96, 26.46, v1_shiver)
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
S(236.30, 241.00, f_coat_take)

S(241.00, 245.60, o_walk)
S(245.60, 249.60, o_fuji_bookend)
S(249.60, 253.60, o_door_empty)
S(253.60, 259.13, o_end_card)
