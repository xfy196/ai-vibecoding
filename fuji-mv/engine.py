"""Pixel story-MV engine: native 320x180 canvas, integer zoom, lyric captions, hand close-ups, ffmpeg out (optional date stamps, off by default).
A film is a list of Shot(start, end, fn[, stamp]); fn(t) -> (world_image, (x0, y0, zoom)) with zoom 1, 2 or 'hi'."""
import functools, json, math, os, re, shutil, subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFont
from chars import sprite, flip, layout, CX, icecream

FPS, OUT_W, OUT_H = 24, 1920, 1080

# ffmpeg: use the one in ./bin (a static build) when the system has none
_here = os.path.dirname(os.path.abspath(__file__))
FFMPEG = os.path.join(_here, 'bin', 'ffmpeg') if os.path.exists(os.path.join(_here, 'bin', 'ffmpeg')) else (shutil.which('ffmpeg') or 'ffmpeg')
FONT = '/System/Library/Fonts/STHeiti Medium.ttc'
FONT_INDEX = 1                     # STHeiti Medium.ttc: 0 = Heiti TC, 1 = Heiti SC (simplified)
MONO = '/System/Library/Fonts/Menlo.ttc'
MONO_INDEX = 1
OUTLINE = (43, 34, 51)


def font(size, path=None, index=None):
    """Local font loader: the .ttc faces used here are Bold weight at a specific index."""
    return ImageFont.truetype(path or FONT, size, index=FONT_INDEX if index is None else index)


# ---------------------------------------------------------------- small helpers
def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
def lerp(a, b, q): return tuple(round(a[i] + (b[i] - a[i]) * q) for i in range(3))
def sm(t, a, b): q = min(max((t - a) / (b - a), 0), 1); return q * q * (3 - 2 * q)
def lin(t, a, b): return min(max((t - a) / (b - a), 0), 1)
def walkframe(t, rate=7): return int(t * rate) % 4


def load_lrc(path):
    out = []
    for ln in open(path, encoding='utf-8'):
        m = re.match(r'\[(\d+):(\d+\.\d+)\](.*)', ln.strip())
        if m: out.append((int(m[1]) * 60 + float(m[2]), m[3].strip()))
    return out


def beats(audio, cache='work/timing.json'):
    if os.path.exists(cache) and os.path.getmtime(cache) >= os.path.getmtime(audio): return json.load(open(cache))['beats']  # stale cache = wrong song
    import librosa
    y, sr = librosa.load(audio, sr=22050, mono=True)
    _, b = librosa.beat.beat_track(y=y, sr=sr, units='time')
    os.makedirs(os.path.dirname(cache) or '.', exist_ok=True)
    json.dump({'beats': [float(x) for x in b], 'duration': len(y) / sr}, open(cache, 'w'))
    return [float(x) for x in b]


def snapper(beat_list, tol=.22):
    def snap(t):
        b = min(beat_list, key=lambda x: abs(x - t)); return b if abs(b - t) <= tol else t
    return snap


# ---------------------------------------------------------------- drawing helpers (native pixels)
def gradient(im, box, stops, dither=False):
    """Vertical gradient. dither=False (default) gives clean bands — use it for anything seen at zoom 2."""
    x0, y0, x1, y1 = box; cols = [hx(c) for c in stops]; d = ImageDraw.Draw(im)
    B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for y in range(y0, y1):
        f = (y - y0) / max(1, y1 - y0 - 1) * (len(cols) - 1); i = min(int(f), len(cols) - 2); q = f - i
        if not dither: d.line((x0, y, x1 - 1, y), fill=cols[i + 1] if q > .5 else cols[i]); continue
        for x in range(x0, x1): im.putpixel((x, y), cols[i + 1] if q * 16 > B[y % 4][x % 4] + .5 else cols[i])


def light(im, cx, cy, r, strength=.3, col='#ffd99a'):
    """Warm light pool as 3 clean bands (never a dithered screen-door: it turns into a checkerboard at x12)."""
    px = im.load(); c = hx(col); W, H = im.size
    for y in range(max(0, int(cy - r)), min(H, int(cy + r))):
        for x in range(max(0, int(cx - r)), min(W, int(cx + r))):
            dd = math.hypot(x - cx, y - cy) / r
            if dd < 1:
                q = math.floor((1 - dd) ** 1.6 * strength * 3) / 3
                if q > 0: px[x, y] = lerp(px[x, y], c, min(q, .8))


def pixtext(im, xy, text, size, col):
    """Hard-edged CJK text at native resolution. Size 11 is the smallest that stays legible.
    xy is the top-left of the ink (measured from the glyph bbox), so nothing is clipped by ascender/descender."""
    f = font(size)
    bx0, by0, bx1, by1 = f.getbbox(text)
    m = Image.new('L', (max(1, bx1 - bx0) + 4, max(1, by1 - by0) + 4), 0); d = ImageDraw.Draw(m)
    d.text((1 - bx0, 1 - by0), text, font=f, fill=255)
    thr = 96 if size < 14 else 120          # small sizes need a softer cut or thin strokes break up
    im.paste(hx(col), (int(xy[0]), int(xy[1])), m.point(lambda v: 255 if v > thr else 0))


def text_w(text, size):
    f = font(size); bx0, _, bx1, _ = f.getbbox(text); return bx1 - bx0


def pixtext_c(im, y, text, size, col, shadow='#2b2233', cx=None):
    """Centred hard-edged text for title / credit / end cards, with a 1 px drop shadow so it reads on any background."""
    f = font(size); w = int(ImageDraw.Draw(im).textlength(text, font=f)); x = (im.width // 2 if cx is None else cx) - w // 2
    if shadow: pixtext(im, (x + 1, y + 1), text, size, shadow)
    pixtext(im, (x, y), text, size, col)


def loc(name):
    """@loc('candy_shop') tags a shot function with its location so shot_report() can show runtime per location."""
    def deco(fn): fn.loc = name; return fn
    return deco


def put(im, s, x, feet, mirror=False, clip=None):
    """Paste a 32x52 sprite so its shoe-bottom row (45) lands on y=feet, centred on x. clip=(x0,y0,x1,y1)."""
    if mirror: s = flip(s)
    px, py = int(round(x)) - 16, int(round(feet)) - 45
    cx0, cy0, cx1, cy1 = clip if clip else (0, 0, im.width - 1, im.height - 1)
    x0, y0, x1, y1 = max(px, cx0), max(py, cy0), min(px + s.width, cx1 + 1), min(py + s.height, cy1 + 1)
    if x1 > x0 and y1 > y0:
        part = s.crop((x0 - px, y0 - py, x1 - px, y1 - py)); im.paste(part, (x0, y0), part)


def shadow(im, x, feet, w=12): ImageDraw.Draw(im).ellipse((x - w // 2, feet - 1, x + w // 2, feet + 2), fill=hx('#4d3b3f'))


def ghost(im, draw_fn, alpha):
    """Translucent memory figures: draw_fn(layer) draws onto a copy, which is blended in."""
    if alpha <= 0: return im
    layer = im.copy(); draw_fn(layer); return Image.blend(im, layer, alpha)


# ---------------------------------------------------------------- cast registry + cached sprites
SPECS = {}


@functools.lru_cache(maxsize=4096)
def _spr(key):
    name, kw = key; kw = dict(kw)
    if kw.get('hands') is not None: kw['hands'] = dict(kw['hands'])
    mir = kw.pop('mirror', False)
    ice = kw.pop('ice', False)
    if ice == 'both':
        a, b = icecream('l'), icecream('r'); kw['prop'] = lambda *z: (a(*z), b(*z))
    elif ice: kw['prop'] = icecream('l' if str(ice).endswith('_l') else 'r', melt=str(ice).startswith('melt'))
    im = sprite(SPECS[name], **kw)
    return flip(im) if mir else im


def spr(name, **kw):
    if kw.get('hands') is not None: kw['hands'] = tuple(sorted(kw['hands'].items()))
    if 't' in kw: kw['t'] = round(kw['t'] * 12) / 12
    return _spr((name, tuple(sorted(kw.items()))))


def head_top(name, feet): return feet - 45 + layout(SPECS[name])[2]


def side_hand(name, x, feet, off, mirror=False, seated=False):
    """World position of a side-view hand at offset `off` from the shoulder. seated=True adds the sit drop."""
    sp = SPECS[name]; hip, sh, ty = layout(sp)
    hx_, hy_ = CX - 1 + off[0], sh + 1 + off[1]
    if mirror: hx_ = 31 - hx_
    return x - 16 + hx_, feet - 45 + hy_ + ((sp['leg_h'] - 1) if seated else 0)


def front_hand(name, x, feet, side, off):
    sp = SPECS[name]; hip, sh, ty = layout(sp); tw, aw = sp['torso_w'], sp['arm_w']
    sgn = -1 if side == 'l' else 1
    sx = CX + sgn * (tw // 2 + 1 + (aw - 1) // 2) - (1 if side == 'l' and aw == 3 else 0)
    return x - 16 + sx + off[0], feet - 45 + sh + 1 + off[1]


# ---------------------------------------------------------------- free canvas with auto-outline (hand close-ups etc.)
class Canvas:
    def __init__(s, w, h): s.w, s.h = w, h; s.p = [[None] * w for _ in range(h)]
    def put(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < s.w and 0 <= y < s.h: s.p[y][x] = c
    def get(s, x, y): return s.p[y][x] if 0 <= x < s.w and 0 <= y < s.h else None
    def rect(s, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.put(xx, yy, c)
    def ell(s, cx, cy, rx, ry, c):
        for y in range(max(0, int(cy - ry - 1)), min(s.h, int(cy + ry + 2))):
            for x in range(max(0, int(cx - rx - 1)), min(s.w, int(cx + rx + 2))):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1: s.put(x, y, c)
    def rrect(s, x, y, w, h, c, r=2):
        s.rect(x + r, y, w - 2 * r, h, c); s.rect(x, y + r, w, h - 2 * r, c)
        for cx, cy in ((x + r, y + r), (x + w - r - 1, y + r), (x + r, y + h - r - 1), (x + w - r - 1, y + h - r - 1)): s.ell(cx + .5, cy + .5, r + .4, r + .4, c)
    def line(s, a, b, c, w=1):
        (x0, y0), (x1, y1) = a, b; n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            q = i / max(n, 1); s.rect(round(x0 + (x1 - x0) * q) - (w - 1) // 2, round(y0 + (y1 - y0) * q) - (w - 1) // 2, w, w, c)
    def outline(s):
        add = [(x, y) for y in range(s.h) for x in range(s.w) if s.p[y][x] is None and
               any(s.get(x + dx, y + dy) not in (None, 'OUT') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        for x, y in add: s.p[y][x] = 'OUT'
    def image(s):
        im = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0)); px = im.load()
        for y in range(s.h):
            for x in range(s.w):
                c = s.p[y][x]
                if c is not None: px[x, y] = (OUTLINE if c == 'OUT' else hx(c)) + (255,)
        return im


def layer(im, cv):
    """Outline a canvas and paste it: draw each hand on its own canvas so overlaps keep an ink line."""
    cv.outline(); l = cv.image(); im.paste(l, (0, 0), l)


def _thumb_fist(cv, x, y, sk, sks, sl, sls, arm_from, flip_=False):
    def X(dx, w=1): return x + dx if not flip_ else x + 19 - dx - w + 1
    cv.line(arm_from, (X(2), y + 16), sl, 13); cv.line((arm_from[0], arm_from[1] + 3), (X(2), y + 19), sls, 6)
    cv.rect(X(-1, 4), y + 6, 4, 18, sls); cv.rrect(X(0, 20), y + 4, 20, 20, sk, 4); cv.rect(X(2, 14), y + 20, 14, 3, sks)
    for i in range(4):
        fy = y + 6 + i * 4; cv.rrect(X(13, 9), fy, 9, 4, sk, 1)
        if i: cv.rect(X(13, 8), fy, 8, 1, 'OUT')
    cv.rect(X(12, 1), y + 6, 1, 16, sks)
    bx, by, tx, ty = X(14), y + 5, X(22), y - 12
    cv.line((bx, by), (tx, ty + 3), sk, 7); cv.ell(tx + .5, ty + 2.5, 3.6, 3.6, sk)
    cv.rect(tx - 1 if not flip_ else tx, ty, 2, 3, '#f7dccb')


def thumbs_press(q=1.0, L=('#f0c3a2', '#d4977b', '#c8674a', '#a24f38'), R=('#e8b896', '#c98a6e', '#3f6fb5', '#2f5590')):
    """160x90 RGBA: two thumbs pressed tip to tip ('seal the promise'); q 0 = apart, 1 = touching.
    L/R = (skin, skin shade, sleeve, sleeve shade) — match each person's side in the previous wide shot."""
    gap = round(14 * (1 - q)); im = Image.new('RGBA', (160, 90), (0, 0, 0, 0))
    cr = Canvas(160, 90); _thumb_fist(cr, 85 + gap, 38, *R, (170, 100), flip_=True); layer(im, cr)
    cl = Canvas(160, 90); _thumb_fist(cl, 55 - gap, 38, *L, (-10, 100)); layer(im, cl)
    return im


def clasped_hands(left=('#a24f38', '#c8674a'), right=('#2f5590', '#3f6fb5')):
    """160x90 RGBA: holding hands — right person's fingers wrap the back of the left person's hand, left thumb on top."""
    im = Image.new('RGBA', (160, 90), (0, 0, 0, 0)); sk, sks, sk2, sk2s = '#f0c3a2', '#d4977b', '#e8b896', '#c98a6e'
    a = Canvas(160, 90); a.line((-10, 4), (56, 40), left[0], 15); a.line((-10, 0), (54, 36), left[1], 9); a.rect(50, 30, 6, 22, left[0])
    a.rrect(54, 30, 30, 26, sk, 6); a.rect(57, 51, 24, 3, sks); layer(im, a)
    b = Canvas(160, 90); b.line((170, 4), (110, 40), right[0], 15); b.line((170, 0), (112, 36), right[1], 9); b.rect(106, 30, 6, 24, right[0])
    b.rrect(84, 30, 24, 26, sk2, 6); b.rect(86, 51, 20, 3, sk2s)
    for i in range(4):
        fy = 32 + i * 6; b.rrect(62, fy, 28, 5, sk2, 2); b.rect(64, fy + 4, 22, 1, sk2s)
        if i: b.rect(62, fy, 26, 1, 'OUT')
    b.rect(89, 33, 1, 22, sk2s); layer(im, b)
    c = Canvas(160, 90); c.rrect(76, 24, 18, 8, sk, 3); c.rect(78, 30, 14, 1, sks); layer(im, c)
    return im


def rain(im, t, n=160, wind=4, col='#9fb3e0', shelter=None):
    """shelter=(x0, y_top, x1): no drops under an umbrella / jacket / roof."""
    d = ImageDraw.Draw(im); c = hx(col); W, H = im.size
    for i in range(n):
        x = (i * 37 + t * 60 * wind) % (W + 40) - 20; y = (i * 53 + t * 240) % (H + 20) - 10
        if shelter and shelter[0] - 4 <= x <= shelter[2] + 4 and y + 6 >= shelter[1]: continue
        d.line((round(x), round(y), round(x - wind), round(y + 6)), fill=c)


def polaroid(src, k=1):
    """White-bordered print of a native crop at integer scale k (shrink-into-album animations step 4->3->2->1)."""
    ph = src if k == 1 else src.resize((src.width * k, src.height * k), Image.NEAREST)
    b = 4 * k; card = Image.new('RGB', (ph.width + 2 * b, ph.height + 2 * b + 6 * k), hx('#fbf8f1')); card.paste(ph, (b, b))
    return card


# ---------------------------------------------------------------- captions, optional stamps, compositing, render
@functools.lru_cache(maxsize=64)
def caption_img(text):
    f = font(44); tw = ImageDraw.Draw(Image.new('RGB', (1, 1))).textlength(text, font=f)
    note = text[:1] not in ('词', '曲', '编')
    w = int(tw + (140 if note else 60)); h = 78
    im = Image.new('RGBA', (w + 8, h + 8), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 6, w + 6, h + 6), 14, fill=(46, 30, 26, 200))
    d.rounded_rectangle((0, 0, w, h), 14, fill=(247, 237, 216, 255), outline=(138, 104, 72, 255), width=4)
    if note: d.text((30, 11), '♪', font=f, fill=(206, 72, 56)); d.text((92, 11), text, font=f, fill=(74, 52, 40))
    else: d.text((30, 11), text, font=f, fill=(74, 52, 40))
    return im


@functools.lru_cache(maxsize=64)
def stamp_img(text):
    """Optional orange film-camera date (off by default: shots pass stamp=None). The dark ink outline keeps it legible on warm backgrounds."""
    f = font(40, MONO, MONO_INDEX); im = Image.new('RGBA', (300, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for dx in (-3, -2, 0, 2, 3):
        for dy in (-3, -2, 0, 2, 3): d.text((12 + dx, 8 + dy), text, font=f, fill=(43, 34, 51, 235))
    d.text((12, 8), text, font=f, fill=(255, 168, 72, 255)); return im


def crop(world, cam):
    x0, y0, z = cam
    if z == 'hi': return world                       # 640x360 canvas, scaled x3 (album / photo shots)
    return world.crop((x0, y0, x0 + 320 // z, y0 + 180 // z))


class Film:
    def __init__(s, song, shots, caps, seg, fade_in=.7, fade_out=.65):
        """shots: list of (start, end, fn, stamp) — stamp is None, a string, or fn(t)->str|None.
        caps: list of (start, end, text). seg: (start, end) seconds of the song to render.
        fade_in / fade_out: seconds of dip-to-black at the ends (0 = none). Frame 0 is black when fade_in > 0, so make the
        cover with film.poster(), never from the first frame."""
        s.song, s.shots, s.caps, s.seg, s.fade_in, s.fade_out = song, sorted(shots, key=lambda r: r[0]), caps, seg, fade_in, fade_out

    def shot_at(s, t):
        for r in s.shots:
            if r[0] <= t < r[1]: return r
        return s.shots[-1]

    def frame(s, t):
        a, b, fn, st = s.shot_at(t)
        globals()['CURRENT_START'] = a          # shots read this so their animations run on local time
        world, cam = fn(t)
        img = crop(world, cam).resize((OUT_W, OUT_H), Image.NEAREST).convert('RGBA')
        if callable(st): st = st(t)
        if st: S = stamp_img(st); img.alpha_composite(S, (OUT_W - S.width - 70, OUT_H - 120))
        for (c0, c1, text) in s.caps:
            if c0 <= t < c1: c = caption_img(text); img.alpha_composite(c, ((OUT_W - c.width) // 2, OUT_H - 128))
        img = img.convert('RGB')
        fi = sm(t, s.seg[0], s.seg[0] + s.fade_in) if s.fade_in > 0 else 1
        fo = 1 - sm(t, s.seg[1] - s.fade_out, s.seg[1] - .15) if s.fade_out > .2 else 1
        fade = min(fi, fo)
        return Image.blend(Image.new('RGB', img.size), img, max(fade, 0)) if fade < 1 else img

    def render(s, out, a=None, b=None, gain_db=-4.0):
        """Video + the song's own audio. gain_db: loud masters push AAC true-peak above 0 dBFS — keep headroom."""
        a = s.seg[0] if a is None else a; b = s.seg[1] if b is None else b; n = int(round((b - a) * FPS))
        cmd = [FFMPEG, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT_W}x{OUT_H}', '-r', str(FPS), '-i', '-',
               '-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', s.song,
               '-filter:a', f'volume={gain_db}dB' + (f',afade=t=in:st=0:d={s.fade_in * .85:.2f}' if s.fade_in > 0 else '')
               + (f',afade=t=out:st={b - a - s.fade_out - .05:.3f}:d={s.fade_out + .05:.2f}' if s.fade_out > .2 else ''),
               # -tune animation + crf 16: flat pixel art has hard edges that platforms smear on re-encode; spend the bits
               '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation', '-crf', '16',
               '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-shortest', out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for k in range(n):
            p.stdin.write(s.frame(a + k / FPS).tobytes())
            if k % 240 == 0: print(f'{k}/{n}', flush=True)
        p.stdin.close(); p.wait()

    def stills(s, out, times, cols=4):
        tiles = [s.frame(t).resize((480, 270), Image.LANCZOS) for t in times]
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * 486 + 6, rows * 276 + 6), (250, 247, 240))
        for k, im in enumerate(tiles): sheet.paste(im, (6 + (k % cols) * 486, 6 + (k // cols) * 276))
        sheet.save(out)

    def check_bounds(s, step=.25):
        """Every camera crop must stay inside its world image (out-of-bounds shows up as black bars)."""
        bad, t = [], s.seg[0]
        while t < s.seg[1]:
            a, b, fn, st = s.shot_at(t); w, (x0, y0, z) = fn(t)
            if z != 'hi' and (x0 < 0 or y0 < 0 or x0 + 320 // z > w.width or y0 + 180 // z > w.height): bad.append((round(t, 2), fn.__name__))
            t += step
        return bad

    # ------------------------------------------------------------ QA (run all of these before every delivery)
    def _view(s, t):
        a, b, fn, st = s.shot_at(t)
        globals()['CURRENT_START'] = a
        world, cam = fn(t); return crop(world, cam).convert('RGB')

    def poster(s, out, t=None):
        """Cover / thumbnail frame with no fade (frame 0 of the file is black)."""
        s.frame(s.seg[0] + s.fade_in + .3 if t is None else t).save(out)

    def check_holes(s, step=1.0, min_px=6):
        """Pure black never appears in the art (outline is #2b2233; night sky should be e.g. #1a1424), so any #000 pixel is a hole:
        a gap between buildings, a layer that stops short of the camera edge, a pan that exposes the bare canvas.
        Returns [(t, shot_fn, n_pixels, bbox)]. Must be [] (intentional black cards: use #101018 instead)."""
        out, t = [], s.seg[0] + .05
        while t < s.seg[1]:
            r, g, b = s._view(t).split()
            m = ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda x: 255 if x == 0 else 0); n = m.histogram()[255]
            if n >= min_px: out.append((round(t, 2), s.shot_at(t)[2].__name__, n, m.getbbox()))
            t += step
        return out

    def sync_report(s, beat_list, tol=.08):
        """Are the shot starts on the beat grid? Returns dict(on_beat, total, pct, chance_pct, off=[(start, shot_fn, offset_s)]).
        pct should clearly beat chance_pct. Ballads often detect at double tempo, so also try beat_list[::2]."""
        bl = sorted(beat_list); gaps = sorted(y - x for x, y in zip(bl, bl[1:])); per = gaps[len(gaps) // 2]
        starts = [r for r in s.shots if r[0] > s.seg[0] + .5]; off, hit = [], 0
        for a, b, fn, st in starts:
            d = min(abs(a - x) for x in bl)
            if d <= tol: hit += 1
            else: off.append((round(a, 2), fn.__name__, round(d, 2)))
        return dict(on_beat=hit, total=len(starts), pct=round(100 * hit / max(1, len(starts))), chance_pct=round(100 * min(1, 2 * tol / per)), off=off)

    def shot_report(s, max_len=4.5, static_pct=1.0):
        """Pacing + variety. static = shots longer than max_len where under static_pct % of pixels change between start and end
        (add motion or cut); locations = (name, n_shots, seconds) sorted by runtime. Tag shots with @loc('name').
        Rule of thumb: >= 1 distinct location per ~25 s of song, no non-motif location over ~25 % of runtime."""
        static, share = [], {}
        for a, b, fn, st in s.shots:
            L = b - a; name = getattr(fn, 'loc', fn.__name__); e = share.setdefault(name, [0, 0.0]); e[0] += 1; e[1] += L
            if L > max_len:
                d = ImageChops.difference(s._view(a + .3), s._view(b - .3)).convert('L').point(lambda x: 255 if x > 8 else 0)
                ch = 100 * d.histogram()[255] / (d.width * d.height)
                if ch < static_pct: static.append((round(a, 2), round(L, 1), fn.__name__, round(ch, 2)))
        return dict(static=static, locations=sorted(((k, v[0], round(v[1], 1)) for k, v in share.items()), key=lambda r: -r[2]))
