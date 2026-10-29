"""Tileable paper textures (PNG tiles) used as SVG patterns for the paper-cut look."""
import os
import numpy as np
from PIL import Image

OUT = os.path.join('public', 'tex')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


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


def save(img, name, mode='L'):
    a = np.clip(img * 255, 0, 255).astype(np.uint8) if img.dtype != np.uint8 else img
    Image.fromarray(a, mode=mode).save(os.path.join(OUT, name))
    print('wrote', name, a.shape)


# fine grain: dense high frequency speckle
g = periodic_noise(256, beta=0.35, seed=1)
g = 0.5 + (g - 0.5) * 0.85
save(g, 'grain.png')

# fibre: horizontally stretched streaks (paper pulp direction)
fb = periodic_noise(512, beta=0.9, seed=2, aniso=6.0)
fb = 0.5 + (fb - 0.5) * 0.9
save(fb, 'fiber.png')

# soft blotch: low frequency unevenness for large paper sheets
bl = periodic_noise(512, beta=2.2, seed=3)
bl = 0.5 + (bl - 0.5) * 0.7
save(bl, 'blotch.png')

# dust: sparse specks (used very subtly over big shapes)
d = periodic_noise(256, beta=0.2, seed=4)
d = np.clip((d - 0.72) * 3.4, 0, 1) ** 1.3
save(d, 'dust.png')
