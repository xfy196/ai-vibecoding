"""Cover / thumbnail frames (no caption, no fade) — frame 0 of the film is black, so never use it."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build, shots, engine
from engine import pixtext_c
from PIL import Image

film, L = build.build()

# 79.4 s: the lake bookend with the two of them tiny on the pier
engine.CURRENT_START = 77.29
img = film._view(79.4).resize((1920, 1080), Image.NEAREST)
img.save('out/cover.png')

# a titled variant for thumbnail use
t = img.copy()
band = Image.new('RGBA', t.size, (0, 0, 0, 0))
small = film._view(79.4).copy()
shots.band_overlay(small, 40, 140, 215)
shots.pixtext_c(small, 58, '富士山下', 28, '#fbf6ea')
shots.pixtext_c(small, 94, '陈奕迅 · 像素叙事 MV', 14, '#f0e0c6')
small.resize((1920, 1080), Image.NEAREST).save('out/cover_title.png')
print('covers written')
