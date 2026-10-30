"""Read the rendered stills back as numbers: luminance ASCII + palette, so the
composition can be checked without opening the images."""
import sys, glob, os
import numpy as np
from PIL import Image

CH = ' .:-=+*#%@'


def report(path, cols=44, rows=22):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255.0
    h, w, _ = a.shape
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    print('=' * 60)
    print(os.path.basename(path), 'mean_lum=%.3f' % lum.mean())
    # ascii art
    ys = np.linspace(0, h, rows + 1).astype(int)
    xs = np.linspace(0, w, cols + 1).astype(int)
    for i in range(rows):
        line = ''
        for j in range(cols):
            cell = lum[ys[i]:ys[i + 1], xs[j]:xs[j + 1]]
            v = cell.mean()
            line += CH[min(len(CH) - 1, int(v * len(CH) * 1.15))]
        print('|' + line + '|')
    # palette: quantised dominant colours
    q = (a * 8).astype(int)
    key = q[:, :, 0] * 64 + q[:, :, 1] * 8 + q[:, :, 2]
    flat = key.reshape(-1)
    vals, counts = np.unique(flat, return_counts=True)
    order = np.argsort(-counts)[:6]
    print('palette:')
    for o in order:
        k = vals[o]
        r, g, b = (k // 64) % 8, (k // 8) % 8, k % 8
        print('  #%02x%02x%02x  %5.1f%%' % (int(r * 32), int(g * 32), int(b * 32), 100 * counts[o] / len(flat)))
    # contrast / coverage
    print('near_black=%.1f%%  bright=%.1f%%  std=%.3f' % (
        100 * (lum < 0.02).mean(), 100 * (lum > 0.8).mean(), lum.std()))


if __name__ == '__main__':
    paths = sys.argv[1:] or sorted(glob.glob('out/stills/f*.png'))
    for p in paths:
        report(p)
