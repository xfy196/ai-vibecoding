
import numpy as np, subprocess, sys
path = r"C:\Users\Administrator\Downloads\M800004ZIk0p1U4MSC.mp3"
raw = subprocess.run(["ffmpeg","-v","error","-i",path,"-ac","1","-ar","22050","-f","s16le","-"],capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32)/32768.0
sr = 22050
win = sr  # 1s
n = len(x)//win
rms = np.array([np.sqrt(np.mean(x[i*win:(i+1)*win]**2)) for i in range(n)])
# band energy ratio: 300-3400Hz (vocal band) vs total
def band(i):
    seg = x[i*win:(i+1)*win]
    if len(seg)<1024: return 0,0
    S = np.abs(np.fft.rfft(seg*np.hanning(len(seg))))
    f = np.fft.rfftfreq(len(seg), 1/sr)
    tot = np.sum(S**2)+1e-9
    voc = np.sum(S[(f>=300)&(f<=3400)]**2)
    hi = np.sum(S[(f>3400)]**2)
    return voc/tot, hi/tot
rows=[]
for i in range(n):
    v,h = band(i)
    rows.append((i, rms[i], v, h))
# print summary every second as csv-ish compact
out=[]
for i,r,v,h in rows:
    out.append(f"{i} {r:.4f} {v:.3f} {h:.3f}")
print("\n".join(out))

