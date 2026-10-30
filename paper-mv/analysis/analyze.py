import wave, sys, numpy as np
from PIL import Image

path = sys.argv[1]
w = wave.open(path, 'rb')
sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
dur = len(x) / sr
print('dur %.3f sr %d' % (dur, sr))

nfft, hop = 1024, 256
frames = 1 + (len(x) - nfft) // hop
win = np.hanning(nfft)
S = np.empty((frames, nfft // 2 + 1), dtype=np.float32)
for i in range(frames):
    seg = x[i*hop:i*hop+nfft] * win
    S[i] = np.abs(np.fft.rfft(seg))
S = 20 * np.log10(S + 1e-6)
S -= S.max()
freqs = np.fft.rfftfreq(nfft, 1/sr)

# log-frequency remap for display
H = 480
logidx = np.geomspace(1, len(freqs)-1, H).astype(int)
img = S[:, logidx].T[::-1]
img = np.clip((img + 70) / 70, 0, 1)
im = Image.fromarray((img * 255).astype(np.uint8))
im = im.resize((1400, H), Image.BILINEAR)
im.save('analysis/spec.png')
print('spec saved', im.size)

# onset envelope (spectral flux), 100 fps
flux = np.maximum(0, np.diff(S, axis=0)).mean(axis=1)
flux = flux - flux.mean()
# tempo via autocorrelation of flux
fps = sr / hop
ac = np.correlate(flux, flux, 'full')[len(flux)-1:]
lags = np.arange(len(ac)) / fps
mask = (lags > 60/180) & (lags < 60/50)
best = np.argmax(ac[mask]) + np.argmax(mask)
print('tempo est: bpm=%.1f period=%.3fs' % (60/lags[best], lags[best]))
for name, lo, hi in (('50-80', 50, 80), ('80-110', 80, 110), ('110-150', 110, 150), ('150-180', 150, 180)):
    m = (lags > 60/hi) & (lags < 60/lo)
    b = np.argmax(ac[m]) + np.argmax(m)
    print('  band %s -> %.1f bpm (%.3fs) strength %.2f' % (name, 60/lags[b], lags[b], ac[b] / ac[1]))

# peaks in flux (onsets)
th = flux.mean() + flux.std() * 1.0
peaks = [i for i in range(1, len(flux)-1) if flux[i] > th and flux[i] >= flux[i-1] and flux[i] >= flux[i+1]]
print('onsets:', [round(i/fps, 2) for i in peaks][:80])

# band energies per 100ms: low(20-200), mid(200-2k), high(2k-8k)
bands = [(20, 200), (200, 2000), (2000, 8000)]
idx = [np.where((freqs >= a) & (freqs < b))[0] for a, b in bands]
E = np.stack([S[:, i].mean(axis=1) for i in idx], axis=1)
E -= E.min(axis=0)
step = int(round(fps / 10))
for i in range(0, len(E) - step, step):
    t = i / fps
    seg = E[i:i+step].mean(axis=0)
    bar = ''.join('#' * max(0, int(v / 3)) for v in seg)
    print('t=%5.2f %s' % (t, bar))
