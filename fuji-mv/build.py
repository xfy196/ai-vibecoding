"""Assemble the film, run QA, render. Usage:
  python3 build.py sheet 12 40 70 ...      contact sheet of those times
  python3 build.py qa                     bounds / holes / sync / pacing
  python3 build.py render out.mp4 [a b]   render (optionally a section)
"""
import sys, os, json
import engine
from engine import Film, load_lrc, FPS

HERE = os.path.dirname(os.path.abspath(__file__))
SONG = os.path.join(HERE, 'input/song.mp3')
LRC = os.path.join(HERE, 'input/song.lrc')
CREDITS_PREFIX = ('作词', '作曲', '编曲', '制作人')


def captions():
    L = [x for x in load_lrc(LRC) if x[1].strip()]
    L = [x for x in L if not x[1].startswith(CREDITS_PREFIX)]
    L = [x for x in L if 20.0 <= x[0] <= 240.0]        # drop the sleeve notes at the tail of the LRC
    caps = []
    for i, (t, txt) in enumerate(L):
        end = L[i + 1][0] - .2 if i + 1 < len(L) else 240.4
        caps.append((t, end, txt))
    return caps, L


def build():
    import shots
    caps, L = captions()
    film = Film(SONG, list(shots.SHOTS), caps, (0.0, 259.13), fade_in=.8, fade_out=1.2)
    return film, L


def main():
    film, L = build()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'qa'
    if cmd == 'sheet':
        ts = [float(x) for x in sys.argv[2:]]
        film.stills('/tmp/sheet.png', ts, cols=4)
        print('wrote /tmp/sheet.png', len(ts), 'tiles')
    elif cmd == 'one':
        t = float(sys.argv[2]); out = sys.argv[3] if len(sys.argv) > 3 else '/tmp/one.png'
        film.frame(t).save(out); print('wrote', out)
    elif cmd == 'qa':
        print('bounds', film.check_bounds())
        print('holes ', film.check_holes())
        try:
            sys.path.insert(0, HERE); import beats
            b, bpm = beats.cached(SONG)
            print('bpm %.1f' % bpm)
            print('sync  ', film.sync_report(b, tol=.12))
            print('sync/2', film.sync_report(b[::2], tol=.24))
        except Exception as e:
            print('sync skipped:', e)
        r = film.shot_report()
        print('static', r['static'])
        print('locations', r['locations'])
        total = sum(v[2] for v in r['locations'])
        print('total %.1fs' % total)
    elif cmd == 'render':
        out = sys.argv[2]
        a = float(sys.argv[3]) if len(sys.argv) > 3 else None
        b = float(sys.argv[4]) if len(sys.argv) > 4 else None
        film.render(out, a, b, gain_db=1.4)
        print('rendered', out)


if __name__ == '__main__':
    main()
