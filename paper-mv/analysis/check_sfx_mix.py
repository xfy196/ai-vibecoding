"""Confirm the SFX really landed: for each cue, the final mix must carry more
energy than the bare bed in that window (especially in the noise bands)."""
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
bed, sr2 = load('public/music/bed.wav')

def band(x, a, b, sr):
    X = np.abs(np.fft.rfft(x))
    f = np.fft.rfftfreq(len(x), 1 / sr)
    m = (f >= a) & (f < b)
    return float(np.sqrt((X[m] ** 2).mean()))

cues = [
    ('paper_swish  @0.0', 0.00), ('paper_swish  @0.6', 0.60), ('paper_swish  @1.2', 1.20),
    ('paper_big    @3.4', 3.40), ('splash       @3.6', 3.60),
    ('heartbeat    @3.6', 3.60), ('lantern_ping @4.2', 4.20),
    ('bubble       @6.0', 6.00), ('boom         @7.4', 7.40), ('whale        @8.4', 8.40),
    ('crowd        @10.8', 10.80), ('paper_tear   @13.8', 13.80),
    ('chime_gold   @17.3', 17.30), ('whoosh_push  @20.2', 20.20),
    ('paper_fall   @22.4', 22.40),
]

print('cue                    band 400-8000 Hz: bed dB -> final dB  (delta)')
for name, t in cues:
    a = int(t * 22050)
    b = a + int(0.18 * 22050)
    if b > len(fin):
        continue
    db_bed = 20 * np.log10(band(bed[a:b], 400, 8000, sr2) + 1e-9)
    db_fin = 20 * np.log10(band(fin[a:b], 400, 8000, sr) + 1e-9)
    print('%-22s %6.1f -> %6.1f  (%+0.1f)' % (name, db_bed, db_fin, db_fin - db_bed))

print('\noverall: bed rms %.4f  final rms %.4f  peak %.3f' % (
    np.sqrt((bed ** 2).mean()), np.sqrt((fin ** 2).mean()), np.abs(fin).max()))
