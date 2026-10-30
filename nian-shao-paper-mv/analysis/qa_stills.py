"""Text-based visual QA for rendered stills.

The model doing the work cannot view images directly, so this prints a compact
numeric + ASCII description of each still: luminance map, colour regions, edge
density and per-region brightness. Enough to catch empty frames, blown-out
frames, dead layers and bad compositions.

    python analysis/qa_stills.py out/stills/*.png
"""
import glob
import sys

import numpy as np
from PIL import Image

RAMP = ' .:-=+*#%@'


def load(p, w=60):
    im = Image.open(p).convert('RGB')
    ratio = im.height / im.width
    h = max(8, int(round(w * ratio * 0.5)))
    return np.asarray(im.resize((w, h), Image.LANCZOS), dtype=np.float32) / 255.0


def luma(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def ascii_map(l, ramp=RAMP):
    lo, hi = 0.0, 1.0
    idx = np.clip(((l - lo) / (hi - lo) * (len(ramp) - 1)).astype(int), 0, len(ramp) - 1)
    return '\n'.join(''.join(ramp[i] for i in row) for row in idx)


def region_table(l, rows=3, cols=3):
    h, w = l.shape
    out = []
    for r in range(rows):
        row = []
        for c in range(cols):
            seg = l[r * h // rows:(r + 1) * h // rows, c * w // cols:(c + 1) * w // cols]
            row.append(f'{seg.mean():.2f}')
        out.append(' '.join(row))
    return out


def dominant_colors(a, k=6):
    q = (a.reshape(-1, 3) * 15).astype(int)
    key = q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2]
    vals, counts = np.unique(key, return_counts=True)
    order = np.argsort(-counts)[:k]
    res = []
    for i in order:
        r, g, b = vals[i] // 256, (vals[i] // 16) % 16, vals[i] % 16
        res.append(f'#{r*17:02x}{g*17:02x}{b*17:02x}:{counts[i]/len(key)*100:.0f}%')
    return res


def edge_density(l):
    gx = np.abs(np.diff(l, axis=1)).mean()
    gy = np.abs(np.diff(l, axis=0)).mean()
    return (gx + gy) * 100


def report(paths):
    for p in paths:
        a = load(p)
        l = luma(a)
        print('=' * 78)
        print(p, f'  mean={l.mean():.3f} p05={np.percentile(l,5):.3f} p95={np.percentile(l,95):.3f}')
        print('edges', f'{edge_density(l):.2f}', ' colors', ' '.join(dominant_colors(a)))
        print('brightness 3x3:')
        for row in region_table(l):
            print('   ', row)
        print(ascii_map(l))


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        args = sorted(glob.glob('out/stills/*.png'))
    report(args)
