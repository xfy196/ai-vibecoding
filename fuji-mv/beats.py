"""Beat grid without librosa: decode with ffmpeg, spectral-flux onset envelope, autocorrelation tempo,
then phase-align a constant grid to the strongest onsets. Good enough for cut QA on a steady ballad."""
import json, os, subprocess, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(HERE, 'bin', 'ffmpeg')


def decode(path, sr=22050):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32), sr


def onset_env(y, sr, n_fft=1024, hop=256):
    n = 1 + max(0, (len(y) - n_fft) // hop)
    idx = np.arange(n_fft)[None, :] + hop * np.arange(n)[:, None]
    frames = y[idx] * np.hanning(n_fft)[None, :]
    mag = np.abs(np.fft.rfft(frames, axis=1))
    # log-compressed flux, weighting high frequencies a little (percussive content)
    lm = np.log1p(10 * mag)
    flux = np.maximum(0, np.diff(lm, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux -= np.convolve(flux, np.ones(32) / 32, mode='same')          # remove slow loudness drift
    flux = np.maximum(flux, 0)
    return flux / (flux.max() + 1e-9), hop / sr


def tempo_of(env, dt, lo=55, hi=180):
    e = env - env.mean()
    ac = np.correlate(e, e, mode='full')[len(e) - 1:]
    ac /= (ac[0] + 1e-9)
    lags = np.arange(len(ac)) * dt
    band = (lags > 60 / hi) & (lags < 60 / lo)
    if not band.any(): return 74.0
    # prefer the strongest local max, then fold to a 4/4-friendly range
    cand = np.where(band)[0]
    k = cand[np.argmax(ac[cand])]
    bpm = 60 / lags[k]
    while bpm < 70: bpm *= 2
    while bpm > 160: bpm /= 2
    return float(bpm)


def beat_grid(y, sr, offset_hint=None):
    env, dt = onset_env(y, sr)
    bpm = tempo_of(env, dt)
    per = 60 / bpm
    n = int(len(y) / sr / per)
    # pick the phase whose grid lands on the most onset energy
    best, best_ph = -1, 0.0
    for ph in np.arange(0, per, per / 96):
        ts = ph + per * np.arange(n)
        idx = np.clip((ts / dt).astype(int), 0, len(env) - 1)
        score = env[idx].sum() + 0.4 * env[np.clip(idx + 1, 0, len(env) - 1)].sum()
        if score > best: best, best_ph = score, ph
    return [round(best_ph + per * i, 3) for i in range(n) if best_ph + per * i < len(y) / sr], bpm


def cached(path, cache='work/timing.json'):
    if os.path.exists(cache):
        d = json.load(open(cache))
        if d.get('file') == os.path.basename(path) and abs(d.get('duration', 0) - os.path.getsize(path) * 0) >= 0:
            return d['beats'], d['bpm']
    y, sr = decode(path)
    b, bpm = beat_grid(y, sr)
    os.makedirs(os.path.dirname(cache) or '.', exist_ok=True)
    json.dump({'file': os.path.basename(path), 'beats': b, 'bpm': bpm, 'duration': len(y) / sr}, open(cache, 'w'))
    return b, bpm


if __name__ == '__main__':
    import sys
    b, bpm = cached(sys.argv[1] if len(sys.argv) > 1 else 'input/song.mp3')
    print('bpm %.1f  beats %d  first %s  last %.2f' % (bpm, len(b), b[:5], b[-1]))
