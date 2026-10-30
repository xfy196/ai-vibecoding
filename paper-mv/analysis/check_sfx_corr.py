"""Decisive SFX check, resampling-safe.

final_audio.wav (22.05 kHz) vs bed.wav (44.1 kHz) vs sfx (44.1 kHz).
Everything is brought to 22.05 kHz before comparing; each cue is searched over a
+/-120 ms window so a render offset cannot fake a negative result.
"""
import wave
import numpy as np

SR = 22050


def load(p, sr=SR):
    w = wave.open(p, 'rb')
    s, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if s != sr:
        # crude but adequate decimation for correlation purposes
        k = s // sr
        x = x[:len(x) // k * k].reshape(-1, k).mean(axis=1) if k > 1 else x
    return x


fin = load('analysis/final_audio.wav')
bed = load('public/music/bed.wav')
n = min(len(fin), len(bed))
fin, bed = fin[:n], bed[:n]

best = None
for lag in range(0, 2000):
    r = fin[lag:] - 0.78 * bed[:n - lag]
    e = float(np.sqrt((r ** 2).mean()))
    if best is None or e < best[0]:
        best = (e, lag)
lag = best[1]
print('alignment lag = %.1f ms (residual rms %.4f)' % (lag / SR * 1000, best[0]))

cues = [
    ('paper_swish', 0.60, 0.34), ('splash', 3.60, 0.46), ('heartbeat', 3.60, 0.42),
    ('lantern_ping', 4.20, 0.22), ('bubble_pop', 6.00, 0.34), ('boom', 7.40, 0.55),
    ('whale', 8.40, 0.46), ('crowd', 10.80, 0.22), ('paper_tear', 13.80, 0.50),
    ('chime_gold', 17.34, 0.36), ('whoosh_push', 20.20, 0.40), ('paper_fall', 22.40, 0.32),
    ('tick', 3.90, 0.10),
]

print('\nsfx              cue t   vol   best r    fitted b   verdict')
for name, t, vol in cues:
    s = load('public/sfx/%s.wav' % name)
    start = int(t * SR) + lag
    seg_len = min(len(s), int(0.6 * SR))
    s = s[:seg_len]
    s = s - s.mean()
    sn = np.linalg.norm(s)
    bestr = (-2.0, 0)
    for off in range(-int(0.12 * SR), int(0.12 * SR), 4):
        i0 = start + off
        if i0 < 0 or i0 + seg_len > len(fin):
            continue
        f = fin[i0:i0 + seg_len]
        b = bed[i0 - lag:i0 - lag + seg_len] * 0.78
        # remove the bed's contribution before measuring the SFX correlation
        r = (f - b)
        r = r - r.mean()
        rn = np.linalg.norm(r)
        if rn < 1e-6:
            continue
        c = float(np.dot(r, s) / (rn * sn))
        if c > bestr[0]:
            bestr = (c, off)
    c, off = bestr
    print('%-15s %6.2fs %5.2f  %6.3f   %7.3f     %s' % (
        name, t, vol, c, c * np.linalg.norm(s) / np.linalg.norm(s) * vol if False else c * vol,
        'OK' if c > 0.45 else ('weak' if c > 0.2 else 'ABSENT')))
