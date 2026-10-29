"""Does the picture actually move on the beat? Measures motion energy per
beat slot so the 'one layer per beat' / 'new batch of people per beat'
mechanics can be confirmed numerically."""
import sys, subprocess
import numpy as np

FF = r'node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'
W, H = 192, 108
src = sys.argv[1] if len(sys.argv) > 1 else 'out/preview.mp4'
raw = subprocess.run([FF, '-v', 'error', '-i', src, '-vf', 'scale=%d:%d' % (W, H),
                      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
f = np.frombuffer(raw, dtype=np.uint8)
n = len(f) // (W * H * 3)
v = f[:n * W * H * 3].reshape(n, H, W, 3).astype(np.float32) / 255.0
d = np.abs(np.diff(v, axis=0)).mean(axis=(1, 2, 3))  # motion energy per frame step

BEAT = 18


def window(start_frame, end_frame, slot, label, rows=8):
    print('\n-- motion energy per %d-frame slot: %s' % (slot, label))
    for k in range(start_frame, end_frame, slot):
        seg = d[k:min(k + slot, end_frame)]
        if len(seg) == 0:
            break
        print('  frame %3d  mean=%.4f  peak=%.4f  %s' % (
            k, seg.mean(), seg.max(), '#' * int(seg.mean() * 400)))


window(0, 108, BEAT, 'shot 1: six seas, one per beat (bumps every 18)')
window(312, 414, BEAT, 'shot 5: a new batch of people every beat')
window(519, 606, BEAT // 2, 'shot 7: one lantern every half beat')
window(672, 723, BEAT, 'shot 9: one sea drops each beat')
