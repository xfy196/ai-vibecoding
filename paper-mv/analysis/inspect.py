import wave, sys, numpy as np, json

def load(path):
    w = wave.open(path, 'rb')
    n = w.getnframes(); sr = w.getframerate(); ch = w.getnchannels()
    raw = w.readframes(n)
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return x, sr

x, sr = load(sys.argv[1])
print('dur', len(x)/sr, 'sr', sr, 'peak', float(np.abs(x).max()), 'rms', float(np.sqrt((x**2).mean())))

# per-second rms
sec = sr
for i in range(0, len(x)//sec):
    seg = x[i*sec:(i+1)*sec]
    r = float(np.sqrt((seg**2).mean()))
    print(f'{i:3d}s rms={r:.4f} peak={float(np.abs(seg).max()):.3f}')

# spectral flatness per second (noise vs tonal)
def flat(seg, sr):
    n = 2048
    if len(seg) < n: return 0.0
    S = np.abs(np.fft.rfft(seg[:len(seg)//n*n].reshape(-1, n) * np.hanning(n), axis=1)) + 1e-9
    g = np.exp(np.mean(np.log(S), axis=1)); a = np.mean(S, axis=1)
    return float(np.mean(g/a))
print('--- flatness')
for i in range(0, len(x)//sec):
    seg = x[i*sec:(i+1)*sec]
    print(f'{i:3d}s flat={flat(seg, sr):.4f}')
