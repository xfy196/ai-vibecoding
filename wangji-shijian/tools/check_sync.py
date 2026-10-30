# check_sync.py: 量化 LRC/karaoke 时间轴与音频的对齐度（两个互补指标）。
#
#   1) 掩码相关性：人声带能量 vs "此刻在唱"的掩码。整体偏移的粗筛，平坦度高，只能当参考。
#   2) 起点对齐（决定性）：逐行起点处应有一个音节/乐句的"起音"（onset）。用谱流量（spectral flux）
#      在每个 a_i 附近取峰值统计量，再整体平移扫一遍，看峰值落在哪个偏移上。
#      如果时间轴是对的，峰在 0 附近；如果整体偏了，峰会明确迁移。
#
# 用法: python tools/check_sync.py [assets/song.mp3]
import subprocess, sys, os, wave
import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'assets', 'song.mp3')
WAV = os.path.join(HERE, 'out', '_sync.wav')

LY = [
 (33.538, 40.979), (40.979, 47.784), (47.784, 55.374), (55.374, 63.129),
 (63.129, 70.522), (70.522, 77.331), (77.331, 84.464), (84.464, 91.290),
 (91.290, 95.046), (95.046, 99.231), (99.231, 106.106), (106.106, 109.791),
 (109.791, 114.306), (114.306, 122.103), (122.103, 129.437), (129.437, 136.389),
 (136.389, 143.409), (143.409, 149.500),
 (179.930, 183.587), (183.587, 187.783), (187.783, 194.676), (194.676, 198.356),
 (198.356, 202.805), (202.805, 209.467), (209.467, 213.198), (213.198, 217.604),
 (217.604, 224.000),
]

SR = 22050
os.makedirs(os.path.dirname(WAV), exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC,
                '-ac', '1', '-ar', str(SR), '-f', 'wav', WAV], check=True)
with wave.open(WAV) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768.0
os.remove(WAV)

nfft, hop = 2048, 256                     # ~11.6 ms 帧移，起音定位够细
nframe = (len(x) - nfft) // hop + 1
fps_f = SR / hop
win = np.hanning(nfft).astype(np.float32)
freqs = np.fft.rfftfreq(nfft, 1.0 / SR)
band_v = (freqs >= 300) & (freqs <= 3400)
band_l = (freqs < 200)

spec = np.empty((nframe, len(freqs)), dtype=np.float32)
for i in range(nframe):
    spec[i] = np.abs(np.fft.rfft(x[i * hop: i * hop + nfft] * win))
t_frame = np.arange(nframe) / fps_f

def db(a):
    return 10 * np.log10(a + 1e-12)

# 起音强度：谱流量的正向部分，只在人声带内算，避开贝斯/鼓的低频轰鸣
S = spec[:, band_v]
flux = np.maximum(0.0, np.diff(S, axis=0)).sum(axis=1)
flux = np.concatenate([[0.0], flux])
flux = (flux - flux.mean()) / (flux.std() + 1e-9)

# 人声带能量（再压掉低频），只用于粗筛
v = db((spec[:, band_v] ** 2).sum(axis=1)) - 0.6 * db((spec[:, band_l] ** 2).sum(axis=1))
v = (v - v.mean()) / (v.std() + 1e-9)

# ---- 指标 1：掩码相关性 ----
def mask_corr(shift):
    m = np.zeros(nframe, dtype=bool)
    for a, b in LY:
        m |= (t_frame >= a + shift) & (t_frame < b + shift)
    if m.sum() == 0 or (~m).sum() == 0:
        return np.nan
    return float(v[m].mean() - v[~m].mean())

# ---- 指标 2：起点落在起音上的强度 ----
def onset_at(starts, halfwidth=0.25):
    """每个起点附近 ±halfwidth 内 flux 的峰值，取平均。"""
    vals = []
    for a in starts:
        lo, hi = a - halfwidth, a + halfwidth
        idx = np.where((t_frame >= lo) & (t_frame <= hi))[0]
        if len(idx) == 0:
            continue
        vals.append(flux[idx].max())
    return float(np.mean(vals)) if vals else np.nan

starts0 = np.array([a for a, _ in LY])

shifts = np.arange(-3.0, 3.001, 0.05)
cor = np.array([mask_corr(s) for s in shifts])
ons = np.array([onset_at(starts0 + s) for s in shifts])

print(f'时长 {len(x)/SR:.2f}s   帧率 {fps_f:.1f}/s   行数 {len(LY)}')
print()
print('【指标 1】掩码相关性（越平坦越说明这个指标没信息量）')
print(f'  0 偏移: {mask_corr(0):+.4f}    峰值 {np.nanmax(cor):+.4f} @ {shifts[int(np.nanargmax(cor))]:+.2f}s'
      f'    峰谷差 {np.nanmax(cor)-np.nanmin(cor):.4f}')
print()
print('【指标 2】行首起音强度（决定性指标：峰在 0 = 时间轴对）')
bi = int(np.nanargmax(ons))
print(f'  0 偏移: {onset_at(starts0):+.3f}    峰值 {ons.max():+.3f} @ {shifts[bi]:+.2f}s'
      f'    峰谷差 {ons.max()-ons.min():.3f}')
print()
print('  平移曲线（每 0.25s 抽样，行首起音强度）:')
for s in np.arange(-3.0, 3.001, 0.25):
    i = int(np.argmin(np.abs(shifts - s)))
    bar = '#' * max(0, int((ons[i] - ons.min()) / (ons.max() - ons.min() + 1e-9) * 40))
    mark = ' <= 当前时间轴' if abs(s) < 0.001 else ''
    print(f'    {s:+.2f}s  {ons[i]:+.3f}  {bar}{mark}')

print()
print('【逐行】当前时间轴下，行首最近的起音距离（秒，0 = 完美落在起音上）')
offs = []
for i, a in enumerate(starts0, 1):
    idx = np.where((t_frame >= a - 0.6) & (t_frame <= a + 0.6))[0]
    if len(idx) == 0:
        continue
    k = idx[int(np.argmax(flux[idx]))]
    d = t_frame[k] - a
    offs.append(d)
    print(f'  {i:2d} a={a:7.3f}  最近起音 {t_frame[k]:7.3f}  差 {d:+.2f}s')
offs = np.array(offs)
print(f'\n  中位数偏差 {np.median(offs):+.2f}s   平均 {offs.mean():+.2f}s   标准差 {offs.std():.2f}s')
