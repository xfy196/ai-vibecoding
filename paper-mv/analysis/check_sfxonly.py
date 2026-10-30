"""Ground truth: the SFX-only render contains nothing but the cue sheet, so each
cue can be located exactly. Confirms placement to the frame."""
import subprocess, wave
import numpy as np

FF = r'node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'
subprocess.run([FF, '-y', '-v', 'error', '-i', 'out/sfxonly.mp4', '-vn', '-ac', '1',
                '-ar', '22050', '-acodec', 'pcm_s16le', 'analysis/sfxonly.wav'], check=True)

w = wave.open('analysis/sfxonly.wav', 'rb')
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
print('sfx-only duration %.3fs peak %.3f' % (len(x) / sr, np.abs(x).max()))

env = np.abs(x)
hop = int(0.01 * sr)
e = np.array([env[i:i + hop].max() for i in range(0, len(env) - hop, hop)])
thr = 0.01
onsets = []
i = 0
while i < len(e):
    if e[i] > thr:
        j = i
        while j + 1 < len(e) and e[j + 1] > thr * 0.5:
            j += 1
        k = i + int(np.argmax(e[i:j + 1]))
        onsets.append((k * hop / sr, float(e[k])))
        i = j + 1
    else:
        i += 1

print('\nfound %d events (first 40):' % len(onsets))
for t, a in onsets[:40]:
    print('  %6.3fs  frame %3d  beat %5.2f  amp %.3f' % (t, round(t * 30), t / 0.6, a))
