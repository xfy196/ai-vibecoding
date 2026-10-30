#!/usr/bin/env python3
"""Frame sanity metrics for the blind-review loop.
usage: python3 tools/analyze.py out/check/*.jpg  |  python3 tools/analyze.py --sheet out/check/a.jpg
Reports, per image: mean colour, ink coverage, paper coverage, pure black/white, the clay
(protagonist) and pale-blue (her) pixel bounding boxes, and the lyric-band occupancy."""
import sys, numpy as np
from PIL import Image

PAPER = (243, 235, 220)
CLAY  = [(217, 119, 87), (168, 77, 51), (245, 179, 148)]
HER   = [(201, 220, 235), (143, 169, 196), (239, 247, 253)]

def near(a, c, tol):
    return np.all(np.abs(a.astype(np.int16) - np.array(c, np.int16)) <= tol, axis=-1)

def report(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    v = a.max(axis=2)
    dark = (v < 95).mean()
    paper = near(a, PAPER, 16).mean()
    black = np.all(a < 12, axis=-1).mean()
    white = np.all(a > 246, axis=-1).mean()
    m = np.zeros((h, w), bool)
    for c in CLAY: m |= near(a, c, 26)
    her = np.zeros((h, w), bool)
    for c in HER: her |= near(a, c, 22)
    def box(mask):
        if mask.sum() < 40: return None
        ys, xs = np.nonzero(mask)
        return (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), int(mask.sum()))
    band = (v[int(h*0.90):int(h*0.99)] < 95).mean()
    print(f"{path.split('/')[-1]:22s} {w}x{h} mean=({a[...,0].mean():.0f},{a[...,1].mean():.0f},{a[...,2].mean():.0f}) "
          f"ink={dark*100:5.1f}% paper={paper*100:5.1f}% blk={black*100:4.1f}% wht={white*100:4.1f}% "
          f"clay={box(m)} her={box(her)} band={band*100:4.1f}%")

for p in sys.argv[1:]:
    if p.startswith('--'): continue
    try: report(p)
    except Exception as e: print(p, 'ERR', e)
