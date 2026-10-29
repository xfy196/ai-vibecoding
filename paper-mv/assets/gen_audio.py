"""Procedural audio for the paper-cut MV.

Outputs (44.1 kHz, 16-bit):
  public/sfx/*.wav   - sound effects, frame-accurately placed by Remotion
  public/music/bed.mp3 - 24.1 s instrumental bed at 100 BPM
Everything is synthesised from scratch with numpy: no samples, no downloads.
"""
import os
import numpy as np

SR = 44100
DUR = 24.1
N = int(round(DUR * SR))
BPM = 100.0
BEAT = 60.0 / BPM          # 0.6 s
BAR = BEAT * 4             # 2.4 s
rng = np.random.default_rng(20261029)

OUT_SFX = os.path.join('public', 'sfx')
OUT_MUS = os.path.join('public', 'music')
os.makedirs(OUT_SFX, exist_ok=True)
os.makedirs(OUT_MUS, exist_ok=True)


# ---------------------------------------------------------------- utilities
def t_axis(dur):
    return np.arange(int(round(dur * SR))) / SR


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def onepole_lp(x, cutoff, sr=SR):
    a = np.exp(-2 * np.pi * cutoff / sr)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def onepole_hp(x, cutoff, sr=SR):
    return x - onepole_lp(x, cutoff, sr)


def lp_fast(x, cutoff, sr=SR):
    """Cheap FFT brick-ish low pass with soft knee."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    g = 1.0 / (1.0 + (f / cutoff) ** 4)
    return np.fft.irfft(X * g, len(x)).real.astype(np.float32)


def bp_fast(x, lo, hi, sr=SR):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    g = 1.0 / (1.0 + (f / hi) ** 4)
    g *= 1.0 - 1.0 / (1.0 + (f / lo) ** 4)
    return np.fft.irfft(X * g, len(x)).real.astype(np.float32)


def env_exp(n, decay, attack=0.002, sr=SR):
    t = np.arange(n) / sr
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return (a * np.exp(-t / decay)).astype(np.float32)


def fade(x, fin=0.004, fout=0.02):
    n = len(x)
    a = int(fin * SR)
    b = int(fout * SR)
    y = x.copy()
    if a:
        y[:a] *= np.linspace(0, 1, a) ** 1.5
    if b:
        y[-b:] *= np.linspace(1, 0, b) ** 1.5
    return y


def norm(x, peak):
    m = np.abs(x).max()
    return x if m < 1e-9 else (x / m * peak).astype(np.float32)


def reverb_ir(dur=1.1, decay=0.42, sr=SR):
    n = int(dur * sr)
    ir = noise(n) * np.exp(-np.arange(n) / (decay * sr))
    ir = lp_fast(ir, 6000)
    ir[:int(0.012 * sr)] *= np.linspace(0, 1, int(0.012 * sr))
    return (ir / np.abs(ir).max()).astype(np.float32)


def fftconv(x, ir):
    n = len(x) + len(ir) - 1
    nn = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nn) * np.fft.rfft(ir, nn), nn)[:n]
    return y[:len(x)].astype(np.float32)


def stereo(x, width=0.0):
    """Return (n,2) float32. width adds a tiny haas/pan shimmer."""
    if x.ndim == 2:
        return x
    if width <= 0:
        return np.stack([x, x], axis=1)
    d = int(0.004 * SR)
    r = np.concatenate([np.zeros(d, np.float32), x[:-d]])
    return np.stack([x * (1 - width * 0.2), (x * (1 - width) + r * width)], axis=1)


def write_wav(path, x, peak=0.9):
    import wave
    x = np.asarray(x, dtype=np.float32)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.abs(x).max()
    if m > 0:
        x = x / m * peak
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    w = wave.open(path, 'wb')
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
    w.close()
    print('wrote %-34s %6.2fs' % (path, len(x) / SR))


def bell(freq, dur, decay, sr=SR, partials=((1.0, 1.0), (2.01, 0.45), (3.02, 0.2), (4.7, 0.09))):
    t = t_axis(dur)
    y = np.zeros_like(t)
    for mult, amp in partials:
        y += amp * np.sin(2 * np.pi * freq * mult * t) * np.exp(-t / (decay / mult ** 0.6))
    y *= np.clip(t / 0.004, 0, 1)
    return y.astype(np.float32)


def pluck(freq, dur, decay=0.32, bright=1.0, sr=SR):
    t = t_axis(dur)
    y = (np.sin(2 * np.pi * freq * t) * np.exp(-t / decay)
         + 0.42 * bright * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / (decay * 0.55))
         + 0.16 * bright * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t / (decay * 0.35))
         + 0.07 * bright * np.sin(2 * np.pi * 4.02 * freq * t) * np.exp(-t / (decay * 0.25)))
    y *= np.clip(t / 0.006, 0, 1)
    return y.astype(np.float32)


def kick(dur=0.34, f0=112, f1=44, decay=0.14):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / decay)
    y += 0.25 * noise(len(t)) * np.exp(-t / 0.006)
    return lp_fast(y.astype(np.float32), 2500)


def snare(dur=0.22):
    t = t_axis(dur)
    y = 0.6 * bp_fast(noise(len(t)), 1400, 7000) * np.exp(-t / 0.055)
    y += 0.3 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.045)
    return y.astype(np.float32)


def hat(dur=0.07, open_=False):
    t = t_axis(dur)
    y = bp_fast(noise(len(t)), 7500, 15000) * np.exp(-t / (0.09 if open_ else 0.022))
    return y.astype(np.float32)


def tom(dur=0.3, f=120):
    t = t_axis(dur)
    y = np.sin(2 * np.pi * (f * np.exp(-t / 0.08) + f * 0.6) * t) * np.exp(-t / 0.12)
    return y.astype(np.float32)


# ---------------------------------------------------------------- sound fx
def sfx_paper_swish(dur=0.30, lo=420, hi=2600, peak=0.55):
    n = int(dur * SR)
    y = bp_fast(noise(n), lo, hi) * env_exp(n, dur * 0.42, 0.006)
    wob = 1 + 0.35 * np.sin(2 * np.pi * 26 * np.arange(n) / SR)
    return norm(y * wob, peak)


def sfx_paper_big(dur=0.75, peak=0.7):
    n = int(dur * SR)
    base = noise(n)
    t = np.arange(n) / SR
    # sweeping band pass by crossfading two filtered copies
    a = bp_fast(base, 200, 1400)
    b = bp_fast(base, 900, 5200)
    m = np.clip(t / dur, 0, 1) ** 1.4
    y = a * (1 - m) + b * m
    y *= np.clip(t / 0.05, 0, 1) * np.exp(-np.maximum(t - 0.08, 0) / (dur * 0.45))
    return norm(y.astype(np.float32), peak)


def sfx_wave_rise(dur=1.05, peak=0.62):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = bp_fast(noise(n), 150, 3000) * (np.clip(t / dur, 0, 1) ** 2.2)
    y += 0.55 * np.sin(2 * np.pi * (58 + 40 * t / dur) * t) * (np.clip(t / dur, 0, 1) ** 2)
    y *= np.clip((dur - t) / 0.12, 0, 1)
    return norm(y.astype(np.float32), peak)


def sfx_splash(dur=0.45, peak=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = bp_fast(noise(n), 500, 6000) * env_exp(n, 0.13, 0.004)
    crack = np.zeros(n, np.float32)
    for _ in range(14):
        i = rng.integers(0, n - 400)
        crack[i:i + 400] += noise(400) * np.exp(-np.arange(400) / 60.0)
    y += 0.45 * bp_fast(crack, 900, 7000)
    y += 0.3 * np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.09)
    return norm(y.astype(np.float32), peak)


def sfx_lantern_ping(peak=0.4):
    y = bell(1046.5, 1.1, 0.42) * 0.8
    b2 = bell(1568.0, 0.9, 0.3) * 0.35
    y[:len(b2)] += b2
    y = fftconv(y, reverb_ir(0.8, 0.3))[:int(1.1 * SR)]
    return norm(fade(y, 0.003, 0.12), peak)


def sfx_bubble_pop(peak=0.42):
    dur = 0.26
    t = t_axis(dur)
    f = 380 + 900 * (t / dur) ** 0.6
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.055)
    y += 0.4 * bp_fast(noise(len(t)), 800, 5000) * np.exp(-t / 0.012)
    return norm(fade(y.astype(np.float32), 0.002, 0.06), peak)


def sfx_paper_tear(peak=0.62):
    dur = 0.55
    n = int(dur * SR)
    t = np.arange(n) / SR
    gate = (rng.random(n) > 0.55).astype(np.float32)
    gate = np.convolve(gate, np.ones(60, np.float32) / 60, 'same')
    gate = 0.35 + 0.9 * gate
    y = bp_fast(noise(n), 1100, 7200) * gate * env_exp(n, 0.22, 0.01)
    y += 0.25 * bp_fast(noise(n), 200, 900) * env_exp(n, 0.3, 0.02)
    return norm(y.astype(np.float32), peak)


def sfx_whale(peak=0.55):
    dur = 1.6
    t = t_axis(dur)
    f = 210 * np.exp(-t / 1.1) + 78
    f *= 1 + 0.02 * np.sin(2 * np.pi * 4.5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * 0.9 + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    y *= np.clip(t / 0.18, 0, 1) * np.clip((dur - t) / 0.5, 0, 1)
    y = y + 0.25 * fftconv(y, reverb_ir(1.4, 0.5))[:len(y)]
    return norm(fade(y.astype(np.float32), 0.01, 0.2), peak)


def sfx_whoosh_push(peak=0.5):
    dur = 0.62
    n = int(dur * SR)
    t = np.arange(n) / SR
    a = bp_fast(noise(n), 300, 1800)
    b = bp_fast(noise(n), 2200, 9000)
    m = np.clip(t / dur, 0, 1) ** 2
    y = a * (1 - m) + b * m
    y *= np.clip(t / 0.06, 0, 1) * np.exp(-np.maximum(t - 0.1, 0) / 0.22)
    return norm(y.astype(np.float32), peak)


def sfx_chime_gold(peak=0.45):
    dur = 2.2
    y = np.zeros(int(dur * SR), np.float32)
    for f, off, amp in ((523.25, 0.0, 0.9), (659.25, 0.05, 0.7), (783.99, 0.1, 0.7),
                        (1046.5, 0.16, 0.55), (1567.98, 0.24, 0.3)):
        b = bell(f, dur - off, 0.9) * amp
        i = int(off * SR)
        y[i:i + len(b)] += b[:len(y) - i]
    y = y + 0.3 * fftconv(y, reverb_ir(1.6, 0.55))[:len(y)]
    return norm(fade(y.astype(np.float32), 0.004, 0.5), peak)


def sfx_tick(peak=0.22):
    dur = 0.09
    t = t_axis(dur)
    y = bp_fast(noise(len(t)), 3000, 12000) * np.exp(-t / 0.008)
    y += 0.3 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.01)
    return norm(fade(y.astype(np.float32), 0.001, 0.03), peak)


def sfx_paper_fall(peak=0.42):
    dur = 0.55
    n = int(dur * SR)
    t = np.arange(n) / SR
    a = bp_fast(noise(n), 1200, 6000)
    b = bp_fast(noise(n), 300, 1600)
    m = np.clip(t / dur, 0, 1) ** 1.5
    y = (a * (1 - m) + b * m) * np.clip(t / 0.04, 0, 1) * np.exp(-t / 0.2)
    return norm(y.astype(np.float32), peak)


def sfx_heartbeat(peak=0.5):
    dur = 0.55
    n = int(dur * SR)
    y = np.zeros(n, np.float32)
    for off, amp, f0 in ((0.0, 1.0, 92), (0.19, 0.62, 78)):
        t = t_axis(dur - off)
        b = np.sin(2 * np.pi * (f0 * np.exp(-t / 0.05) + 34) * t) * np.exp(-t / 0.07) * amp
        i = int(off * SR)
        y[i:i + len(b)] += b[:n - i]
    return norm(lp_fast(y, 400), peak)


def sfx_paper_crowd(peak=0.26):
    dur = 1.5
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = bp_fast(noise(n), 300, 3000) * 0.35
    steps = np.zeros(n, np.float32)
    for _ in range(9):
        i = rng.integers(0, n - 2000)
        b = bp_fast(noise(2000), 400, 2600) * np.exp(-np.arange(2000) / 420.0)
        steps[i:i + 2000] += b
    y = y * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)) + 0.5 * steps
    y *= np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 0.35, 0, 1)
    return norm(y.astype(np.float32), peak)


def sfx_boom(peak=0.75):
    """Downbeat accent for the biggest hit of the film."""
    dur = 1.4
    t = t_axis(dur)
    y = np.sin(2 * np.pi * (70 * np.exp(-t / 0.25) + 32) * t) * np.exp(-t / 0.5)
    y += 0.5 * bp_fast(noise(len(t)), 60, 900) * np.exp(-t / 0.22)
    y += 0.2 * bp_fast(noise(len(t)), 2000, 8000) * np.exp(-t / 0.05)
    y = y + 0.25 * fftconv(y, reverb_ir(1.6, 0.5))[:len(y)]
    return norm(fade(y.astype(np.float32), 0.002, 0.3), peak)


def sfx_glow(peak=0.3):
    """soft airy rise for warm colour shifts / glow-ups"""
    dur = 0.9
    t = t_axis(dur)
    y = bp_fast(noise(len(t)), 800, 7000) * (np.clip(t / dur, 0, 1) ** 1.6) * np.clip((dur - t) / 0.3, 0, 1)
    y += 0.25 * np.sin(2 * np.pi * 1046 * t) * np.clip(t / 0.3, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    return norm(y.astype(np.float32), peak)


FX = {
    'paper_swish': sfx_paper_swish,
    'paper_big': sfx_paper_big,
    'wave_rise': sfx_wave_rise,
    'splash': sfx_splash,
    'lantern_ping': sfx_lantern_ping,
    'bubble_pop': sfx_bubble_pop,
    'paper_tear': sfx_paper_tear,
    'whale': sfx_whale,
    'whoosh_push': sfx_whoosh_push,
    'chime_gold': sfx_chime_gold,
    'tick': sfx_tick,
    'paper_fall': sfx_paper_fall,
    'heartbeat': sfx_heartbeat,
    'crowd': sfx_paper_crowd,
    'boom': sfx_boom,
    'glow': sfx_glow,
}


# ---------------------------------------------------------------- music bed
NOTE = {}
_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def nf(name):
    if name in NOTE:
        return NOTE[name]
    # e.g. A3, C#4
    for i, n in enumerate(_names):
        if name.startswith(n):
            octv = int(name[len(n):])
            NOTE[name] = 440.0 * 2 ** ((i - 9) / 12 + (octv - 4))
            return NOTE[name]
    raise ValueError(name)


CHORDS = {
    'Am9': ['A2', 'E3', 'A3', 'C4', 'B4'],
    'Fmaj7': ['F2', 'C3', 'A3', 'C4', 'E4'],
    'Cmaj7': ['C3', 'G3', 'E4', 'B4', 'D4'],
    'G6': ['G2', 'D3', 'B3', 'D4', 'E4'],
    'Am7': ['A2', 'E3', 'G3', 'C4', 'E4'],
}

# one chord per bar (2.4 s), mapped to the nine shots
PROG = ['Am9', 'Am9', 'Fmaj7', 'Cmaj7', 'G6', 'Fmaj7', 'Cmaj7', 'G6', 'Am7', 'Fmaj7', 'Cmaj7']


def section_gain(t):
    """dynamic automation: intro soft -> climax loud -> golden -> intimate -> fade"""
    pts = [(0.0, 0.55), (3.6, 0.5), (5.7, 0.72), (7.4, 1.0), (10.4, 0.9),
           (13.8, 0.66), (17.3, 0.85), (20.2, 0.72), (22.4, 0.6), (23.5, 0.3), (24.1, 0.0)]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return float(np.interp(t, xs, ys))


def build_bed():
    n = N
    t = np.arange(n) / SR
    pad = np.zeros((n, 2), np.float32)
    plucks = np.zeros(n, np.float32)
    mel = np.zeros(n, np.float32)
    bass = np.zeros(n, np.float32)
    drums = np.zeros(n, np.float32)
    air = np.zeros(n, np.float32)

    bars = int(np.ceil(DUR / BAR))
    for b in range(bars):
        t0 = b * BAR
        name = PROG[b % len(PROG)]
        freqs = [nf(x) for x in CHORDS[name]]
        if t0 >= DUR:
            break
        seg_len = min(BAR + 0.6, DUR - t0)
        i0 = int(t0 * SR)
        seg_n = int(seg_len * SR)
        seg_t = np.arange(seg_n) / SR
        # sustained pad, slow swell
        a = np.clip(seg_t / 0.55, 0, 1) * np.clip((seg_len - seg_t) / 0.7, 0, 1)
        for f in freqs:
            for det, pan in ((0.996, 0.0), (1.004, 1.0)):
                v = (np.sin(2 * np.pi * f * det * seg_t)
                     + 0.22 * np.sin(2 * np.pi * 2 * f * det * seg_t)
                     + 0.08 * np.sin(2 * np.pi * 3 * f * det * seg_t))
                v = lp_fast(v.astype(np.float32), 2600) * a * 0.12
                pad[i0:i0 + seg_n, 0] += v * (1 - 0.35 * pan)
                pad[i0:i0 + seg_n, 1] += v * (1 - 0.35 * (1 - pan))
        # bass: root on beat 1 and 3
        root = freqs[0] / 2
        for k in (0, 2):
            if t0 + k * BEAT >= DUR:
                continue
            j0 = int((t0 + k * BEAT) * SR)
            ln = min(int(0.85 * BEAT * SR), n - j0)
            tt = np.arange(ln) / SR
            v = (np.sin(2 * np.pi * root * tt) + 0.3 * np.sin(2 * np.pi * 2 * root * tt)) * np.exp(-tt / 0.35)
            bass[j0:j0 + ln] += (v * 0.5).astype(np.float32)
        # plucked arpeggio, 8th notes
        arp = [freqs[2], freqs[3], freqs[4], freqs[3]] * 2
        for k in range(8):
            tt0 = t0 + k * BEAT / 2
            if tt0 >= DUR - 0.05:
                continue
            vel = 0.55 + 0.45 * ((k % 4) == 0)
            j0 = int(tt0 * SR)
            p = pluck(arp[k % len(arp)] * 2, 0.5, 0.26) * vel * 0.2
            ln = min(len(p), n - j0)
            plucks[j0:j0 + ln] += p[:ln]
    # melody: sparse, diatonic, follows the nine phrases
    phrases = [
        (0.6, ['E5', 'A5'], 0.6),
        (3.1, ['G5', 'E5'], 0.6),
        (5.0, ['D5', 'C5'], 0.6),
        (6.3, ['A4', 'C5', 'D5'], 0.6),
        (7.6, ['E5', 'A5', 'B5'], 0.45),
        (9.4, ['C6', 'B5', 'A5'], 0.45),
        (10.9, ['G5', 'A5'], 0.6),
        (12.6, ['F5', 'E5', 'D5'], 0.6),
        (14.4, ['C5', 'D5'], 0.7),
        (16.1, ['E5', 'D5'], 0.7),
        (17.6, ['A5', 'C6', 'E6'], 0.45),
        (19.4, ['D6', 'C6'], 0.6),
        (20.5, ['B5', 'A5'], 0.7),
        (21.6, ['G5', 'E5', 'A5'], 0.55),
        (22.7, ['C5', 'A4'], 0.9),
    ]
    for start, notes, step in phrases:
        for i, nm in enumerate(notes):
            tt0 = start + i * step
            if tt0 >= DUR - 0.1:
                continue
            j0 = int(tt0 * SR)
            p = pluck(nf(nm), 0.9, 0.45, bright=1.25) * 0.22
            ln = min(len(p), n - j0)
            mel[j0:j0 + ln] += p[:ln]
    # drums
    def add(sig, at, gain=1.0):
        j0 = int(at * SR)
        if j0 >= n:
            return
        ln = min(len(sig), n - j0)
        drums[j0:j0 + ln] += sig[:ln] * gain

    beat_i = 0
    t_cur = 0.0
    while t_cur < DUR - 0.02:
        beat_i += 1
        t_cur = beat_i * BEAT
        bar_pos = beat_i % 4
        in_intro = t_cur < 3.05
        in_climax = 7.35 <= t_cur < 13.85
        in_gold = 17.25 <= t_cur < 20.25
        in_mid = 10.35 <= t_cur < 13.85
        if in_intro:
            continue
        if bar_pos == 0 or bar_pos == 2:
            add(kick(), t_cur, 0.9 if in_climax else 0.6)
        if bar_pos in (1, 3) and not in_gold:
            add(snare(), t_cur, 0.5 if in_climax else 0.28)
        if in_climax or in_mid:
            add(hat(open_=(bar_pos == 3)), t_cur, 0.22)
            add(hat(), t_cur + BEAT / 2, 0.16)
            if in_climax:
                add(hat(), t_cur + BEAT / 4, 0.09)
                add(hat(), t_cur + 3 * BEAT / 4, 0.09)
        if in_gold and bar_pos == 0:
            add(tom(f=150), t_cur, 0.25)
    # toms fill into the climax
    for i, tt0 in enumerate((6.6, 6.85, 7.05, 7.25)):
        add(tom(f=220 - i * 30), tt0, 0.22 + 0.05 * i)
    # accents exactly on the nine cut points
    CUTS = [3.6, 5.7, 7.4, 10.4, 13.8, 17.3, 20.2, 22.4, 24.1]
    for c in CUTS:
        if c >= DUR - 0.02:
            continue
        add(kick(f0=120, f1=40, decay=0.2), c, 0.85)
        # soft reverse-ish air before each cut
        ln = int(0.3 * SR)
        j0 = max(0, int((c - 0.3) * SR))
        sw = bp_fast(noise(ln), 600, 6000) * np.linspace(0, 1, ln) ** 3 * 0.16
        k = min(ln, n - j0)
        air[j0:j0 + k] += sw[:k]
    # shimmer air throughout (paper atmosphere)
    air += (bp_fast(noise(n), 2500, 9000) * 0.02
            * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t))) * np.clip(t / 1.5, 0, 1)

    # per-section dynamic automation
    auto = np.array([section_gain(x) for x in t], dtype=np.float32)

    plucks_r = fftconv(plucks, reverb_ir(1.2, 0.4))[:n]
    mel_r = fftconv(mel, reverb_ir(1.5, 0.5))[:n]
    pad_r = fftconv(pad[:, 0], reverb_ir(1.4, 0.5))[:n]

    pad_w = pad * 0.9
    mix = np.zeros((n, 2), np.float32)
    mix[:, 0] = (pad_w[:, 0] * 0.85 + pad_r * 0.25
                 + plucks * 0.85 + plucks_r * 0.35
                 + mel * 0.85 + mel_r * 0.4
                 + bass * 0.9 + drums * 0.85 + air * 0.7)
    mix[:, 1] = (pad_w[:, 1] * 0.85 + pad_r * 0.25
                 + plucks * 0.85 + plucks_r * 0.35
                 + mel * 0.85 + mel_r * 0.4
                 + bass * 0.9 + drums * 0.85 + air * 0.7)
    mix *= auto[:, None]
    # gain staging: bring the sum to a sane level, THEN saturate gently on the bus
    pk = float(np.abs(mix).max())
    mix = mix / max(pk, 1e-9) * 0.72
    mix = np.tanh(mix * 1.25) / np.tanh(1.25)
    m = float(np.abs(mix).max())
    mix = (mix / m * 0.92).astype(np.float32)
    # tiny fade at the very end so the loop point is clean
    tail = int(0.25 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2
    return mix


def write_bed():
    mix = build_bed()
    assert len(mix) == N
    import wave
    p = os.path.join(OUT_MUS, 'bed.wav')
    data = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    w = wave.open(p, 'wb')
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
    w.close()
    print('wrote %s  %.3fs  peak=%.3f rms=%.4f' % (p, len(mix) / SR, float(np.abs(mix).max()),
                                                   float(np.sqrt((mix ** 2).mean()))))


if __name__ == '__main__':
    for name, fn in FX.items():
        write_wav(os.path.join(OUT_SFX, name + '.wav'), stereo(fn(), 0.12), peak=0.9)
    write_bed()
