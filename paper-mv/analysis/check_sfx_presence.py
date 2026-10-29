"""Presence test that does not depend on waveform correlation: after removing the
bed, the residual around each cue must be louder than a control window 0.6 s later."""
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
        k = s // sr
        if k > 1:
            x = x[:len(x) // k * k].reshape(-1, k).mean(axis=1)
    return x


fin = load('analysis/final_audio.wav')
bed = load('public/music/bed.wav')
n = min(len(fin), len(bed))
fin, bed = fin[:n], bed[:n]
res = fin - 0.78 * bed
print('residual rms overall %.4f' % np.sqrt((res ** 2).mean()))

cues = [
    ('paper_swish', 0.6), ('splash', 3.6), ('heartbeat', 3.6), ('lantern_ping', 4.2),
    ('bubble_pop', 6.0), ('boom', 7.4), ('whale', 8.4), ('crowd', 10.5),
    ('paper_tear', 13.8), ('chime_gold', 17.34), ('whoosh_push', 20.2),
    ('paper_fall', 22.4), ('tick', 6.5 * 0.6),
]


def rms(a, b):
    return float(np.sqrt((res[int(a * SR):int(b * SR)] ** 2).mean()) + 1e-9)


print('\nsfx              cue      win rms   ctrl rms   delta dB')
for name, t in cues:
    w1 = rms(t, t + 0.3)
    w2 = rms(t + 0.7, t + 1.0)
    db = 20 * np.log10(w1 / w2)
    print('%-15s %6.2fs   %.4f     %.4f    %+6.1f  %s' % (
        name, t, w1, w2, db, 'OK' if db > 2.0 else ('weak' if db > 0.5 else 'ABSENT')))
