"""Numeric QA for the generated bed: level curve, kick alignment on the 9 cuts,
spectral balance. Prints a compact report we can reason about without listening."""
import wave, sys, numpy as np

p = sys.argv[1] if len(sys.argv) > 1 else r'public\music\bed.wav'
w = wave.open(p, 'rb')
sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
x = x.reshape(-1, ch).mean(axis=1)
print('dur %.3f sr %d peak %.3f rms %.4f' % (len(x)/sr, sr, np.abs(x).max(), np.sqrt((x**2).mean())))

print('\n-- level per 0.5 s (dBFS rms)')
for i in range(0, int(len(x)/sr*2)):
    seg = x[int(i*0.5*sr):int((i+1)*0.5*sr)]
    r = np.sqrt((seg**2).mean())
    db = 20*np.log10(r+1e-9)
    print('%5.1fs %6.1f dB %s' % (i*0.5, db, '#'*max(0, int((db+60)/1.5))))

print('\n-- low band (20-160 Hz) energy around each cut: is there a kick transient?')
X = np.abs(np.fft.rfft(x))
f = np.fft.rfftfreq(len(x), 1/sr)
low = (f>20)&(f<160)
print('low band share %.3f' % (X[low].sum()/X.sum()))

cuts = [3.6, 5.7, 7.4, 10.4, 13.8, 17.3, 20.2, 22.4]
n2048 = 2048
for c in cuts:
    i = int(c*sr)
    pre = x[max(0,i-int(0.25*sr)):i]
    post = x[i:i+int(0.25*sr)]
    # transient sharpness: max sample-to-sample jump right after the cut
    d = np.abs(np.diff(post)).max() if len(post) else 0
    print('cut %5.2f  pre_rms %.4f  post_rms %.4f  onset_jump %.4f' % (
        c, np.sqrt((pre**2).mean()), np.sqrt((post**2).mean()), d))
