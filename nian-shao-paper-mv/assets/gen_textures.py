"""Tileable paper textures (PNG tiles) used as SVG patterns for the paper-cut look.

All four tiles are generated from FFT-filtered white noise, so they tile perfectly
and cost nothing to ship. Run from the project root:

    python assets/gen_textures.py
"""
import os

import numpy as np
from PIL import Image

OUT = os.path.join('public', 'tex')
os.makedirs(OUT, exist_ok=True)


def periodic_noise(size, beta=1.0, seed=0, aniso=1.0):
    """FFT-generated noise that tiles perfectly."""
    r = np.random.default_rng(seed)
    fy = np.fft.fftfreq(size)[:, None]
    fx = np.fft.fftfreq(size)[None, :]
    f = np.sqrt(fx ** 2 + (fy * aniso) ** 2)
    f[0, 0] = 1e-6
    amp = f ** (-beta)
    amp[0, 0] = 0
    phase = r.uniform(0, 2 * np.pi, (size, size))
    spec = amp * np.exp(1j * phase)
    img = np.fft.ifft2(spec).real
    img -= img.min()
    img /= img.max()
    return img


def save(img, name):
    a = np.clip(img * 255, 0, 255).astype(np.uint8)
    Image.fromarray(a, mode='L').save(os.path.join(OUT, name))
    print('wrote', name, a.shape)


# fine grain: dense high frequency speckle -> paper tooth
g = periodic_noise(256, beta=0.35, seed=11)
save(0.5 + (g - 0.5) * 0.9, 'grain.png')

# fibre: horizontally stretched streaks (pulp direction)
fb = periodic_noise(512, beta=0.9, seed=12, aniso=6.0)
save(0.5 + (fb - 0.5) * 0.92, 'fiber.png')

# soft blotch: low frequency unevenness for large sheets
bl = periodic_noise(512, beta=2.2, seed=13)
save(0.5 + (bl - 0.5) * 0.72, 'blotch.png')

# dust: sparse specks (loose paper dust on the tabletop)
d = periodic_noise(256, beta=0.25, seed=14)
save(np.clip((d - 0.70) * 3.2, 0, 1) ** 1.3, 'dust.png')

# scratch: thin diagonal abrasions, used on the window "glass" sheet
s = periodic_noise(512, beta=0.55, seed=15, aniso=0.18)
s = np.clip((s - 0.45) * 3.0, 0, 1) ** 2.0
save(0.5 + (s - 0.5) * 0.6, 'scratch.png')
