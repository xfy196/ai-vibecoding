"""Rough tempo / section analysis of the song, so the film's pulses sit on the grid.

Reads public/music/song.mp3 via ffmpeg (decoded to raw f32), computes a spectral
flux onset envelope, estimates the beat period by autocorrelation, and prints the
tempo plus a per-10-second RMS curve (used to sanity-check the section map).

    python assets/analyze_song.py
"""
import json
import os
import subprocess

import numpy as np

SR = 22050
MP3 = os.path.join('public', 'music', 'song.mp3')
OUT = os.path.join('analysis', 'song.json')


def decode():
    cmd = ['ffmpeg', '-v', 'error', '-i', MP3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').astype(np.float32)


def onset_env(x, hop=512, win=1024):
    n = 1 + (len(x) - win) // hop
    w = np.hanning(win).astype(np.float32)
    flux = np.zeros(n, dtype=np.float32)
    prev = None
    for i in range(n):
        seg = np.fft.rfft(x[i * hop:i * hop + win] * w)
        mag = np.abs(seg)
        if prev is not None:
            d = mag - prev
            flux[i] = np.maximum(d, 0).sum()
        prev = mag
    return flux


def main():
    x = decode()
    dur = len(x) / SR
    env = onset_env(x)
    fps_e = SR / 512
    # tempo by autocorrelation of the onset envelope, 50..180 BPM
    e = env - env.mean()
    ac = np.correlate(e, e, mode='full')[len(e) - 1:]
    best = None
    for bpm in np.arange(50, 180, 0.1):
        lag = 60.0 / bpm * fps_e
        i = int(round(lag))
        if i + 1 >= len(ac):
            continue
        v = np.interp(lag, [i, i + 1], [ac[i], ac[i + 1]])
        if best is None or v > best[1]:
            best = (bpm, v)
    # rms per 10 s
    step = 10 * SR
    rms = [float(np.sqrt(np.mean(x[i:i + step] ** 2))) for i in range(0, len(x), step)]
    data = {
        'duration': round(dur, 3),
        'bpm': round(float(best[0]), 2),
        'beat_seconds': round(float(60.0 / best[0]), 4),
        'rms_each_10s': [round(r, 4) for r in rms],
    }
    os.makedirs('analysis', exist_ok=True)
    with open(OUT, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
