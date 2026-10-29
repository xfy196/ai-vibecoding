"""Decisive check: subtract the bed (at its render volume) from the final mix and
look for residual spikes. Their positions must match the SFX cue sheet."""
import wave
import numpy as np

BED_VOL = 0.78


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

# align: find the lag that minimises the residual (renders can shift by a few samples)
best = None
for lag in range(0, 400):
    r = fin[lag:] - BED_VOL * bed[:n - lag]
    e = float(np.sqrt((r ** 2).mean()))
    if best is None or e < best[0]:
        best = (e, lag)
e, lag = best
res = fin[lag:] - BED_VOL * bed[:n - lag]
print('best lag %d samples (%.2f ms), residual rms %.4f' % (lag, lag / sr * 1000, e))

# residual envelope in 20 ms hops
hop = int(0.02 * sr)
env = np.array([np.abs(res[i:i + hop]).max() for i in range(0, len(res) - hop, hop)])
thr = env.mean() + 3 * env.std()
peaks = []
i = 0
while i < len(env):
    if env[i] > thr:
        j = i
        while j + 1 < len(env) and env[j + 1] > thr * 0.6:
            j += 1
        k = i + int(np.argmax(env[i:j + 1]))
        peaks.append((k * hop / sr, float(env[k])))
        i = j + 1
    else:
        i += 1

print('\nresidual spikes (time s, amplitude) — these should be the SFX:')
for t, a in peaks[:40]:
    beat = t / 0.6
    print('  %6.3fs  amp %.3f   beat %5.2f  frame %3d' % (t, a, beat, round(t * 30)))
