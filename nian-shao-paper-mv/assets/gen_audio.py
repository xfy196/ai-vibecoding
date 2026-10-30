"""Procedural sound design for the paper-cut MV.

Every sound effect in the film is synthesised here from numpy noise + sine
partials: no samples, no downloads, no licences.

Output: public/sfx/*.wav  (44.1 kHz, 16-bit, stereo)

    python assets/gen_audio.py
"""
import os
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(20261030)
OUT = os.path.join('public', 'sfx')
os.makedirs(OUT, exist_ok=True)


# ----------------------------------------------------------------- utilities
def t_axis(dur):
    return np.arange(int(round(dur * SR)), dtype=np.float32) / SR


def noise(dur):
    return rng.standard_normal(int(round(dur * SR))).astype(np.float32)


def fft_filter(x, lo=None, hi=None, slope=4.0):
    """Zero-phase soft brick filter (lo/hi in Hz, None = open)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi is not None:
        g *= 1.0 / (1.0 + (f / hi) ** slope)
    if lo is not None:
        g *= 1.0 - 1.0 / (1.0 + (f / max(lo, 1.0)) ** slope)
    return np.fft.irfft(X * g, n).real.astype(np.float32)


def sweep_filter(x, lo_from, lo_to, hi_from, hi_to, blocks=12):
    """Time-varying band filter, done as windowed blocks with crossfades."""
    n = len(x)
    out = np.zeros(n, dtype=np.float32)
    win = np.hanning(n // blocks * 2).astype(np.float32)
    step = max(1, n // blocks)
    for b in range(blocks):
        s = b * step
        e = min(n, s + step * 2)
        seg = x[s:e]
        k = b / max(1, blocks - 1)
        lo = lo_from + (lo_to - lo_from) * k
        hi = hi_from + (hi_to - hi_from) * k
        seg = fft_filter(seg, lo, hi)
        w = win[: len(seg)]
        out[s:e] += seg * w
    return out


def env_exp(n, decay, attack=0.003):
    t = np.arange(n, dtype=np.float32) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return (a * np.exp(-t / decay)).astype(np.float32)


def env_ar(n, attack, release_pow=2.0):
    t = np.arange(n, dtype=np.float32) / SR
    total = n / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.clip((total - t) / max(total - attack, 1e-4), 0, 1) ** release_pow
    return (a * r).astype(np.float32)


def gate(x, freq, duty=0.5, smooth=0.003):
    t = np.arange(len(x), dtype=np.float32) / SR
    g = (np.sin(2 * np.pi * freq * t) > np.cos(np.pi * duty)).astype(np.float32)
    k = max(1, int(smooth * SR))
    g = np.convolve(g, np.ones(k, dtype=np.float32) / k, mode='same')
    return x * (0.25 + 0.75 * g)


def fade(x, fin=0.003, fout=0.03):
    n = len(x)
    a = min(n, int(fin * SR))
    b = min(n, int(fout * SR))
    y = x.copy()
    if a:
        y[:a] *= np.linspace(0, 1, a, dtype=np.float32) ** 1.5
    if b:
        y[-b:] *= np.linspace(1, 0, b, dtype=np.float32) ** 1.5
    return y


def norm(x, peak=0.85):
    m = float(np.abs(x).max())
    return x if m < 1e-9 else (x / m * peak).astype(np.float32)


def add_at(dst, src, at):
    """Mix src into dst at sample offset `at`."""
    s = int(at * SR)
    if s >= len(dst):
        return
    e = min(len(dst), s + len(src))
    dst[s:e] += src[: e - s]


def reverb(x, dur=1.4, decay=0.5, cutoff=6500, mix=0.35):
    n = int(dur * SR)
    ir = rng.standard_normal(n).astype(np.float32) * np.exp(-np.arange(n) / (decay * SR))
    ir = fft_filter(ir, 200, cutoff)
    ir[: int(round(0.010 * SR))] *= np.linspace(0, 1, int(round(0.010 * SR)), dtype=np.float32)
    ir = (ir / np.abs(ir).max()).astype(np.float32)
    nn = 1 << (len(x) + n - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, nn) * np.fft.rfft(ir, nn), nn)[: len(x)]
    wet = wet.astype(np.float32)
    wet /= max(1e-9, np.abs(wet).max())
    wet *= np.abs(x).max()
    return ((1 - mix) * x + mix * wet).astype(np.float32)


def partials(dur, specs, attack=0.004):
    """Sum of exponentially decaying sine partials.

    specs: list of (freq, amp, decay_seconds)
    """
    t = t_axis(dur)
    out = np.zeros(len(t), dtype=np.float32)
    for f, a, d in specs:
        out += (a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / d)).astype(np.float32)
    a_env = np.clip(t / attack, 0, 1)
    return (out * a_env).astype(np.float32)


def stereo(x, width=0.25, spread_ms=6.0):
    d = int(spread_ms * 0.001 * SR)
    left = x
    right = np.concatenate([np.zeros(d, np.float32), x[:-d]]) if d else x
    return np.stack([left * (1 - width * 0.5), right * (1 - width * 0.5) + x * width * 0.5], axis=1)


def write_wav(name, x, peak=0.9, width=0.25):
    if x.ndim == 1:
        x = stereo(x, width)
    x = np.asarray(x, dtype=np.float32)
    x = norm(x, peak)
    pcm = np.clip(x * 32767.0, -32768, 32767).astype('<i2')
    path = os.path.join(OUT, name + '.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'{name:16s} {len(x) / SR:5.2f}s  peak={np.abs(x).max():.2f}')


# ------------------------------------------------------------------- paper
def s_paper_slide():
    d = 0.85
    n = noise(d)
    body = sweep_filter(n, 260, 900, 1400, 5000, blocks=10)
    squeak = fft_filter(noise(d), 2200, 3600) * 0.18
    x = body + squeak
    x *= env_ar(len(x), 0.09, 1.6)
    return fade(x, 0.01, 0.25)


def s_paper_swish():
    d = 0.26
    x = sweep_filter(noise(d), 500, 1600, 2600, 7000, blocks=6)
    x *= env_exp(len(x), 0.055, 0.004)
    return fade(x, 0.002, 0.1)


def s_paper_flip():
    d = 0.3
    x = np.zeros(int(d * SR), dtype=np.float32)
    a = sweep_filter(noise(0.09), 900, 2200, 3000, 8000, blocks=4) * env_exp(int(round(0.09 * SR)), 0.02)
    b = sweep_filter(noise(0.12), 700, 1800, 2400, 6500, blocks=4) * env_exp(int(round(0.12 * SR)), 0.03)
    click = partials(0.05, [(2400, 0.25, 0.008), (4100, 0.12, 0.005)])
    add_at(x, a, 0.0)
    add_at(x, click, 0.075)
    add_at(x, b, 0.10)
    return fade(x, 0.002, 0.08)


def s_paper_tear():
    d = 1.35
    n = noise(d)
    # irregular rip: fast random amplitude modulation + bursts
    t = t_axis(d)
    mod = np.abs(np.sin(2 * np.pi * (22 + 14 * np.sin(2 * np.pi * 3.1 * t)) * t))
    mod = 0.25 + 0.75 * mod ** 2
    x = fft_filter(n, 700, 6500) * mod
    # individual fibres snapping
    for _ in range(46):
        at = rng.uniform(0.05, 1.15)
        k = rng.integers(2, 6)
        burst = fft_filter(noise(0.02), 1800, 9000) * env_exp(int(round(0.02 * SR)), 0.005)
        add_at(x, burst * (0.5 * k / 6), at)
    x *= np.concatenate([
        np.linspace(0, 1, int(round(0.05 * SR)), dtype=np.float32),
        np.exp(-(t[: len(x) - int(round(0.05 * SR))]) / 0.55).astype(np.float32),
    ])[: len(x)]
    return fade(x, 0.002, 0.2)


def s_paper_crack():
    d = 0.5
    x = np.zeros(int(d * SR), dtype=np.float32)
    thud = partials(0.25, [(150, 0.5, 0.05), (92, 0.4, 0.09), (330, 0.1, 0.03)])
    snap = fft_filter(noise(0.06), 1500, 9000) * env_exp(int(round(0.06 * SR)), 0.012)
    add_at(x, snap, 0.0)
    add_at(x, thud, 0.004)
    debris = fft_filter(noise(0.35), 1200, 7000) * env_exp(int(round(0.35 * SR)), 0.07) * 0.3
    add_at(x, debris, 0.05)
    return fade(x, 0.001, 0.15)


def s_paper_fall():
    d = 1.1
    x = fft_filter(noise(d), 900, 4200)
    t = t_axis(d)
    flutter = 0.35 + 0.65 * np.abs(np.sin(2 * np.pi * (6.5 + 2.5 * np.sin(2 * np.pi * 1.7 * t)) * t)) ** 1.5
    x *= flutter
    x *= env_ar(len(x), 0.05, 1.4)
    return fade(x, 0.005, 0.3)


def s_paper_big():
    d = 1.6
    x = np.zeros(int(d * SR), dtype=np.float32)
    thud = partials(0.9, [(58, 0.9, 0.22), (86, 0.5, 0.14), (130, 0.22, 0.08)], attack=0.002)
    hit = fft_filter(noise(0.22), 300, 3000) * env_exp(int(round(0.22 * SR)), 0.045)
    slide = fft_filter(noise(0.8), 700, 5000) * env_ar(int(round(0.8 * SR)), 0.02, 2.0) * 0.35
    add_at(x, hit, 0.0)
    add_at(x, thud, 0.0)
    add_at(x, slide, 0.06)
    return fade(reverb(x, 1.0, 0.35, 4000, 0.2), 0.002, 0.4)


def s_paper_stamp():
    d = 1.5
    x = np.zeros(int(d * SR), dtype=np.float32)
    thud = partials(0.8, [(72, 1.0, 0.16), (118, 0.45, 0.1), (240, 0.15, 0.05)], attack=0.0015)
    slap = fft_filter(noise(0.12), 400, 6000) * env_exp(int(round(0.12 * SR)), 0.02)
    ink = fft_filter(noise(0.5), 1500, 8000) * env_exp(int(round(0.5 * SR)), 0.1) * 0.12
    add_at(x, slap, 0.0)
    add_at(x, thud, 0.0)
    add_at(x, ink, 0.03)
    return fade(reverb(x, 1.6, 0.55, 5000, 0.3), 0.001, 0.6)


# ----------------------------------------------------------------- visual props
def s_tv_static():
    d = 1.8
    x = fft_filter(noise(d), 900, 9000)
    t = t_axis(d)
    # crackle
    crack = np.zeros(len(x), dtype=np.float32)
    for _ in range(120):
        at = rng.uniform(0, d - 0.1)
        b = fft_filter(noise(0.01), 2500, 12000) * env_exp(int(round(0.01 * SR)), 0.004)
        add_at(crack, b, at)
    whine = (0.02 * np.sin(2 * np.pi * 15734 * t)).astype(np.float32)
    x = x * 0.9 + crack * 0.5 + whine
    x *= env_ar(len(x), 0.02, 1.2)
    return fade(x, 0.01, 0.25)


def s_tv_off():
    d = 0.45
    t = t_axis(d)
    f = 1800 * np.exp(-t * 11) + 70
    zipx = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32) * env_exp(len(t), 0.08, 0.002) * 0.5
    click = partials(0.08, [(1600, 0.5, 0.006), (2600, 0.2, 0.004)], attack=0.0005)
    x = zipx.copy()
    add_at(x, click, 0.0)
    return fade(x, 0.001, 0.1)


def s_phone_buzz():
    d = 1.4
    t = t_axis(d)
    carrier = (np.sin(2 * np.pi * 168 * t) + 0.5 * np.sin(2 * np.pi * 336 * t)).astype(np.float32)
    x = gate(carrier, 22.0, duty=0.42) * fft_filter(noise(d), 100, 900) * 0.25
    x = x + 0.35 * gate(carrier, 22.0, duty=0.42)
    x *= env_ar(len(x), 0.04, 0.9)
    return fade(fft_filter(x, 60, 1200), 0.01, 0.2)


def s_ui_blip():
    d = 0.16
    t = t_axis(d)
    f = 1180 + 520 * np.clip(t / 0.05, 0, 1)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32) * env_exp(len(t), 0.035, 0.002)
    x += 0.25 * np.sin(2 * np.pi * 2360 * t).astype(np.float32) * env_exp(len(t), 0.02, 0.001)
    return fade(x, 0.001, 0.05)


def s_tape_rip():
    d = 1.15
    x = fft_filter(noise(d), 1600, 11000)
    t = t_axis(d)
    mod = np.abs(np.sin(2 * np.pi * (30 + 18 * np.sin(2 * np.pi * 2.3 * t)) * t))
    x *= 0.2 + 0.8 * mod ** 1.4
    for _ in range(30):
        add_at(x, fft_filter(noise(0.015), 2500, 10000) * env_exp(int(round(0.015 * SR)), 0.004), rng.uniform(0.02, 1.0))
    x *= env_ar(len(x), 0.01, 1.8)
    return fade(x, 0.002, 0.2)


def s_clock_tick():
    d = 0.12
    x = partials(0.12, [(3100, 0.6, 0.012), (4400, 0.25, 0.008), (1500, 0.2, 0.02)], attack=0.0008)
    add_at(x, fft_filter(noise(0.02), 2500, 12000) * env_exp(int(round(0.02 * SR)), 0.004) * 0.5, 0.0)
    x = np.concatenate([x, np.zeros(int(round(0.03 * SR)), dtype=np.float32)])
    return fade(x, 0.0005, 0.03)


def s_lamp_click():
    d = 0.3
    x = partials(0.3, [(1800, 0.4, 0.02), (2700, 0.2, 0.012)], attack=0.0006)
    add_at(x, fft_filter(noise(0.03), 1200, 9000) * env_exp(int(round(0.03 * SR)), 0.006), 0.0)
    x += 0.15 * np.sin(2 * np.pi * 120 * t_axis(0.3)).astype(np.float32) * env_exp(int(round(0.3 * SR)), 0.05)
    return fade(x, 0.0005, 0.08)


def s_spoon_tink():
    d = 0.9
    x = partials(d, [(2310, 0.7, 0.16), (3870, 0.35, 0.1), (5620, 0.2, 0.06), (7180, 0.1, 0.04)], attack=0.0012)
    add_at(x, 0.2 * fft_filter(noise(0.05), 2000, 12000) * env_exp(int(round(0.05 * SR)), 0.008), 0.0)
    return fade(reverb(x, 0.9, 0.25, 6000, 0.25), 0.0005, 0.3)


def s_steam_hiss():
    d = 3.0
    x = fft_filter(noise(d), 2200, 8200)
    t = t_axis(d)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 0.23 * t)
    x *= am
    x *= env_ar(len(x), 0.55, 1.0)
    return fade(x, 0.2, 0.6, ) if False else fade(x, 0.2, 0.8)


def s_wall_thud():
    d = 1.3
    x = np.zeros(int(d * SR), dtype=np.float32)
    body = partials(0.7, [(44, 1.0, 0.2), (63, 0.6, 0.14), (98, 0.3, 0.09), (145, 0.15, 0.05)], attack=0.001)
    crunch = fft_filter(noise(0.5), 300, 4500) * env_exp(int(round(0.5 * SR)), 0.06) * 0.55
    add_at(x, body, 0.0)
    add_at(x, crunch, 0.0)
    for _ in range(14):
        add_at(x, fft_filter(noise(0.03), 1200, 8000) * env_exp(int(round(0.03 * SR)), 0.008) * 0.2, rng.uniform(0.03, 0.7))
    return fade(reverb(x, 1.3, 0.4, 3500, 0.3), 0.001, 0.4)


def s_glass_clink():
    d = 1.7
    x = partials(d, [
        (1830, 0.6, 0.32), (2970, 0.4, 0.22), (4380, 0.3, 0.16),
        (5210, 0.2, 0.12), (6900, 0.12, 0.08), (9110, 0.06, 0.05),
    ], attack=0.001)
    tr = fft_filter(noise(0.04), 3000, 14000) * env_exp(int(round(0.04 * SR)), 0.006) * 0.4
    add_at(x, tr, 0.0)
    return fade(reverb(x, 1.6, 0.5, 9000, 0.3), 0.0005, 0.5)


def s_coin_rain():
    d = 2.4
    x = np.zeros(int(d * SR), dtype=np.float32)
    for _ in range(34):
        at = rng.uniform(0.0, 1.9) ** 0.8
        tap = fft_filter(noise(0.02), 1800, 7000) * env_exp(int(round(0.02 * SR)), 0.004) * rng.uniform(0.15, 0.4)
        add_at(x, tap, at)
    x += fft_filter(noise(d), 1500, 6000) * env_ar(int(d * SR), 0.05, 2.0) * 0.12
    return fade(x, 0.005, 0.5)


def s_crowd_walla():
    d = 8.0
    x = fft_filter(noise(d), 180, 1500)
    t = t_axis(d)
    # murmur: several slow AM voices in formant-ish bands
    for k, f in enumerate([0.31, 0.47, 0.63, 0.88, 1.21]):
        band = fft_filter(noise(d), 220 * (k + 1), 900 * (k + 1))
        x += band * (0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * f * t + k)))
    x *= env_ar(len(x), 1.2, 1.0)
    return fade(x, 0.8, 1.5)


def s_rain_loop():
    d = 12.0
    x = fft_filter(noise(d), 400, 9000) * 0.7
    for _ in range(260):
        at = rng.uniform(0, d - 0.2)
        drop = partials(0.09, [(rng.uniform(2200, 6200), 0.5, 0.02)], attack=0.0006)
        add_at(x, drop * rng.uniform(0.1, 0.35), at)
    x *= 0.55 + 0.25 * np.sin(2 * np.pi * 0.09 * t_axis(d))
    # gentle loop crossfade
    k = int(round(0.6 * SR))
    x[:k] *= np.linspace(0, 1, k, dtype=np.float32)
    x[-k:] *= np.linspace(1, 0, k, dtype=np.float32)
    return x


def s_thunder_far():
    d = 4.0
    x = fft_filter(noise(d), 28, 260) * 1.2
    t = t_axis(d)
    x *= np.exp(-t / 1.5).astype(np.float32)
    x *= 0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * t))
    x += 0.25 * fft_filter(noise(d), 120, 900) * env_exp(len(t), 1.1)
    return fade(x, 0.15, 1.2)


def s_roof_wind():
    d = 9.0
    t = t_axis(d)
    x = fft_filter(noise(d), 90, 1200)
    whistle = fft_filter(noise(d), 620, 940) * 0.25
    am = 0.45 + 0.55 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t + 1.2))
    x = (x + whistle) * am
    x *= env_ar(len(x), 1.5, 1.0)
    return fade(x, 1.0, 2.0)


def s_room_tone():
    d = 8.0
    x = fft_filter(noise(d), 40, 380) * 0.5
    t = t_axis(d)
    x += 0.06 * np.sin(2 * np.pi * 50 * t).astype(np.float32)
    x += 0.03 * np.sin(2 * np.pi * 100 * t).astype(np.float32)
    x *= env_ar(len(x), 0.8, 1.0)
    return fade(x, 0.6, 1.2)


def s_chime_gold():
    d = 2.6
    x = partials(d, [
        (880, 0.55, 0.9), (1320, 0.3, 0.6), (1760, 0.2, 0.45),
        (2640, 0.12, 0.3), (3520, 0.07, 0.2),
    ], attack=0.006)
    shimmer = fft_filter(noise(d), 3500, 12000) * env_exp(int(d * SR), 0.35) * 0.05
    x += shimmer
    return fade(reverb(x, 2.4, 0.9, 8000, 0.35), 0.002, 0.8)


def s_whoosh_up():
    d = 1.7
    x = sweep_filter(noise(d), 180, 520, 900, 6200, blocks=14)
    x *= env_ar(len(x), 0.55, 1.6)
    x *= 0.9
    return fade(x, 0.02, 0.5)


def s_lantern_whoosh():
    d = 1.5
    x = sweep_filter(noise(d), 240, 700, 700, 3800, blocks=12)
    t = t_axis(d)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 3.2 * t + rng.uniform(0, 6))
    x *= env_ar(len(x), 0.4, 1.8)
    return fade(x, 0.02, 0.45)


def s_boom_soft():
    d = 2.6
    t = t_axis(d)
    f = 62 * np.exp(-t * 0.9) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32) * env_exp(len(t), 0.7, 0.004)
    hit = fft_filter(noise(0.35), 120, 2200) * env_exp(int(round(0.35 * SR)), 0.06) * 0.5
    x = sub.copy()
    add_at(x, hit, 0.0)
    x += 0.15 * fft_filter(noise(d), 300, 3000) * env_exp(len(t), 0.5)
    return fade(reverb(x, 2.0, 0.7, 3000, 0.28), 0.002, 0.7)


def s_heart_thud():
    d = 1.1
    x = np.zeros(int(d * SR), dtype=np.float32)
    for at, amp in ((0.0, 1.0), (0.26, 0.62)):
        beat = partials(0.35, [(56, 0.9, 0.06), (84, 0.5, 0.04)], attack=0.004)
        add_at(x, beat * amp, at)
        add_at(x, fft_filter(noise(0.08), 80, 600) * env_exp(int(round(0.08 * SR)), 0.02) * 0.3 * amp, at)
    return fade(reverb(x, 0.8, 0.3, 1500, 0.2), 0.002, 0.3)


def s_wind_low():
    d = 10.0
    t = t_axis(d)
    x = fft_filter(noise(d), 35, 520)
    x *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t) ** 2
    x *= env_ar(len(x), 1.6, 1.0)
    return fade(x, 1.2, 2.5)


def s_chair_scrape():
    d = 0.9
    x = fft_filter(noise(d), 300, 2600)
    t = t_axis(d)
    x *= (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 17 * t))) ** 2
    x *= env_ar(len(x), 0.04, 2.0)
    return fade(x, 0.005, 0.25)


BUILDERS = {k[2:]: v for k, v in sorted(globals().items()) if k.startswith('s_')}
PEAKS = {
    'rain_loop': 0.5, 'crowd_walla': 0.45, 'room_tone': 0.3, 'roof_wind': 0.45,
    'wind_low': 0.4, 'steam_hiss': 0.5, 'thunder_far': 0.7, 'tv_static': 0.6,
}

if __name__ == '__main__':
    for name, fn in BUILDERS.items():
        write_wav(name, fn(), PEAKS.get(name, 0.9), width=0.3)
    print(len(BUILDERS), 'effects written to', OUT)
