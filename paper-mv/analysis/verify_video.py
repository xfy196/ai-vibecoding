"""Verify the render: cut positions, beat-driven level steps, per-shot palette.
Reads a raw rgb24 stream of the preview produced by ffmpeg."""
import sys, subprocess
import numpy as np

FF = r'node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'
W, H = 192, 108
src = sys.argv[1] if len(sys.argv) > 1 else 'out/preview.mp4'
raw = subprocess.run([FF, '-v', 'error', '-i', src, '-vf', 'scale=%d:%d' % (W, H),
                      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8)
n = len(frames) // (W * H * 3)
v = frames[:n * W * H * 3].reshape(n, H, W, 3).astype(np.float32) / 255.0
print('frames', n)
lum = 0.2126 * v[:, :, :, 0] + 0.7152 * v[:, :, :, 1] + 0.0722 * v[:, :, :, 2]
mean = lum.reshape(n, -1).mean(axis=1)
diff = np.abs(np.diff(v.reshape(n, -1), axis=0)).mean(axis=1)

print('\n-- biggest frame-to-frame changes (expected at the 9 cuts)')
order = np.argsort(-diff)[:14]
for i in sorted(order):
    print('  frame %3d -> %3d  diff=%.4f' % (i, i + 1, diff[i]))

cuts = [0, 108, 171, 222, 312, 414, 519, 606, 672, 723]
print('\n-- diff at each cut (should be large)')
for c in cuts[1:-1]:
    print('  cut %3d  diff=%.4f   neighbours %.4f / %.4f' % (c, diff[c], diff[c - 2], diff[c + 2]))

print('\n-- mean luminance per frame, 3-frame buckets (beat steps should show)')
line = ''
for f in range(0, n, 3):
    line += '%d:%.2f ' % (f, mean[f])
    if (f // 3) % 12 == 11:
        print('  ' + line)
        line = ''
print('  ' + line)

print('\n-- per shot')
for a, b in zip(cuts[:-1], cuts[1:]):
    seg = v[a:b]
    m = seg.reshape(-1, 3).mean(axis=0)
    print('shot %d  frames %3d-%3d  mean rgb=(%.2f,%.2f,%.2f)  lum=%.3f  lum_std=%.3f' % (
        cuts.index(a) + 1, a, b, m[0], m[1], m[2], float(lum[a:b].mean()), float(lum[a:b].std())))
