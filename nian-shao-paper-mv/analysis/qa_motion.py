"""Motion / cut audit of the rendered sequence.

Samples the rendered frames and reports, per time slice:
  * how much the picture changes (mean abs difference to the previous sample)
  * where the hard cuts are (the biggest spikes)
  * stretches that are too static (a dead frame in a music video)

    python analysis/qa_motion.py
"""
import glob
import os

import numpy as np
from PIL import Image

STEP = 12
CUTS = [900, 1817, 2603, 3523, 4367, 5664, 6715, 7627]


def load(i):
    p = os.path.join('out', 'frames', f'element-{i:04d}.png')
    im = Image.open(p).convert('L').resize((240, 135), Image.BILINEAR)
    return np.asarray(im, dtype=np.float32) / 255.0


def main():
    files = sorted(glob.glob('out/frames/element-*.png'))
    print('frames', len(files))
    idx = list(range(0, len(files), STEP))
    prev = None
    rows = []
    for i in idx:
        a = load(i)
        d = 0.0 if prev is None else float(np.abs(a - prev).mean())
        lum = float(a.mean())
        rows.append((i, i / 30.0, d, lum))
        prev = a

    diffs = np.array([r[2] for r in rows])
    print(f'mean change {diffs.mean()*100:.2f}  p50 {np.percentile(diffs,50)*100:.2f}  p95 {np.percentile(diffs,95)*100:.2f}  max {diffs.max()*100:.2f}')

    print('\n-- biggest changes (cuts) --')
    order = np.argsort(-diffs)[:14]
    for k in sorted(order, key=lambda k: rows[k][0]):
        print(f'  frame {rows[k][0]:5d}  {rows[k][1]:7.2f}s  delta {rows[k][2]*100:6.2f}')

    print('\n-- cut lineup check --')
    for c in CUTS:
        j = min(range(len(rows)), key=lambda k: abs(rows[k][0] - c))
        window = diffs[max(0, j - 1):j + 2]
        print(f'  cut {c:5d} ({c/30:7.2f}s)  local delta {window.max()*100:6.2f}')

    print('\n-- static stretches (delta < 0.4 for 3+ samples) --')
    run = 0
    for i, (fr, s, d, lum) in enumerate(rows):
        if d < 0.004:
            run += 1
        else:
            if run >= 3:
                print(f'  {rows[i-run][1]:7.2f}s .. {rows[i][1]:7.2f}s  ({run} samples)')
            run = 0
    if run >= 3:
        print(f'  {rows[len(rows)-run][1]:7.2f}s .. end  ({run} samples)')

    print('\n-- luminance per 10 s --')
    bucket = {}
    for fr, s, d, lum in rows:
        bucket.setdefault(int(s // 10) * 10, []).append(lum)
    print('  ' + '  '.join(f'{k}:{np.mean(v):.2f}' for k, v in sorted(bucket.items())))


if __name__ == '__main__':
    main()
