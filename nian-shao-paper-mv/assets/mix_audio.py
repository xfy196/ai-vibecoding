"""Mix the soundtrack: the original song + every procedural sound effect.

Remotion's own ffmpeg pipe is broken on this machine (``write EOF``), so the
audio is assembled here with numpy instead of through ``<Audio>`` during the
render. The cue sheet is read straight out of ``src/cues.ts`` so there is still
exactly one source of truth for where a sound happens.

    python assets/mix_audio.py            -> out/mix.wav (44.1 kHz / 16-bit / stereo)
    python assets/mix_audio.py --sfx-only -> out/sfx_only.wav  (QA)
"""
import argparse
import json
import os
import re
import subprocess
import wave

import numpy as np

SR = 44100
SRC = os.path.join('public', 'music', 'song.mp3')
CUES_TS = os.path.join('src', 'cues.ts')
SFX_DIR = os.path.join('public', 'sfx')


def decode_song():
    cmd = ['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype='<f4').astype(np.float32).reshape(-1, 2)
    return x


def read_wav(path):
    with wave.open(path, 'rb') as w:
        ch = w.getnchannels()
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float32) / 32768.0
    if ch == 1:
        data = np.stack([data, data], axis=1)
    return data.reshape(-1, ch)


def parse_cues():
    src = open(CUES_TS, encoding='utf8').read()
    cues = []
    # a(seconds, 'sfx', volume)
    for m in re.finditer(r"\ba\(\s*([0-9.]+)\s*,\s*'([a-z_]+)'\s*,\s*([0-9.]+)\s*\)", src):
        cues.append({'at': float(m.group(1)), 'sfx': m.group(2), 'vol': float(m.group(3))})
    # rep(start, count, step, 'sfx', vol[, rampTo])
    for m in re.finditer(
        r"\brep\(\s*([0-9.]+)\s*,\s*([0-9]+)\s*,\s*([0-9.]+)\s*,\s*'([a-z_]+)'\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)",
        src,
    ):
        start, count, step, sfx, vol = float(m.group(1)), int(m.group(2)), float(m.group(3)), m.group(4), float(m.group(5))
        to = float(m.group(6)) if m.group(6) else None
        for i in range(count):
            v = vol if to is None else vol + (to - vol) * (i / max(1, count - 1))
            cues.append({'at': start + i * step, 'sfx': sfx, 'vol': v})
    cues.sort(key=lambda c: c['at'])
    return cues


def write_wav(path, x):
    x = np.clip(x, -1.0, 1.0)
    pcm = (x * 32767.0).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sfx-only', action='store_true')
    args = ap.parse_args()

    song = decode_song()
    n = len(song)
    cues = parse_cues()
    print(f'{len(cues)} cues parsed from src/cues.ts; song {n / SR:.3f}s')

    sfx = np.zeros((n, 2), dtype=np.float32)
    cache = {}
    missing = set()
    for c in cues:
        name = c['sfx']
        if name not in cache:
            p = os.path.join(SFX_DIR, name + '.wav')
            if not os.path.exists(p):
                missing.add(name)
                cache[name] = None
            else:
                cache[name] = read_wav(p)
        buf = cache[name]
        if buf is None:
            continue
        s = int(round(c['at'] * SR))
        if s >= n:
            continue
        e = min(n, s + len(buf))
        sfx[s:e] += buf[: e - s] * c['vol']

    if missing:
        print('MISSING SFX:', sorted(missing))

    print(f'sfx layer peak {np.abs(sfx).max():.3f}  rms {np.sqrt((sfx ** 2).mean()):.4f}')
    print(f'song peak {np.abs(song).max():.3f}  rms {np.sqrt((song ** 2).mean()):.4f}')

    if args.sfx_only:
        out = os.path.join('out', 'sfx_only.wav')
        write_wav(out, sfx)
    else:
        mix = song * 1.0 + sfx
        peak = float(np.abs(mix).max())
        print(f'mix peak {peak:.3f}' + (' -> trimming' if peak > 0.999 else ''))
        if peak > 0.999:
            mix = mix / peak * 0.999
        out = os.path.join('out', 'mix.wav')
        write_wav(out, mix)

    os.makedirs('analysis', exist_ok=True)
    json.dump(cues, open(os.path.join('analysis', 'cues.parsed.json'), 'w', encoding='utf8'), indent=1)
    print('wrote', out)


if __name__ == '__main__':
    main()
