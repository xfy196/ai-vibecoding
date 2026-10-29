"""Least-squares probe: in each cue window, fit final = a*bed + b*sfx and report
b. If the SFX really rendered, b lands near its cue volume."""
import wave
import numpy as np


def load(p):
    w = wave.open(p, 'rb')
    sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return x, sr


fin, sr = load('analysis/final_audio.wav')
bed, _ = load('public/music/bed.wav')
n = min(len(fin), len(bed))
fin, bed = fin[:n], bed[:n]

# global alignment
best = None
for lag in range(0, 1200):
    r = fin[lag:] - 0.78 * bed[:n - lag]
    e = float(np.sqrt((r ** 2).mean()))
    if best is None or e < best[0]:
        best = (e, lag)
lag = best[1]
print('alignment lag = %.1f ms' % (lag / sr * 1000))

cues = [
    ('splash', 3.6, 0.46), ('heartbeat', 3.6, 0.42), ('lantern_ping', 4.2, 0.22),
    ('bubble_pop', 6.0, 0.34), ('boom', 7.4, 0.55), ('whale', 8.4, 0.46),
    ('crowd', 10.8, 0.22), ('paper_tear', 13.8, 0.5), ('chime_gold', 17.34, 0.36),
    ('whoosh_push', 20.2, 0.4), ('paper_fall', 22.4, 0.32), ('tick', 3.9, 0.1),
]

print('\nsfx                 cue t   cue vol   fitted b   verdict')
for name, t, vol in cues:
    sfx, sr3 = load('public/sfx/%s.wav' % name)
    i0 = int(t * sr) + lag
    win = min(int(0.5 * sr), len(fin) - i0, len(sfx))
    if win <= 100:
        print('%-16s  -- out of range' % name)
        continue
    F = fin[i0:i0 + win]
    B = bed[i0 - lag:i0 - lag + win] * 0.78
    S = sfx[:win]
    A = np.stack([B, S], axis=1)
    coef, *_ = np.linalg.lstsq(A, F, rcond=None)
    print('%-16s %6.2fs  %5.2f     %6.2f     %s' % (
        name, t, vol, coef[1],
        'OK' if coef[1] > vol * 0.4 else 'LOW/ABSENT'))
