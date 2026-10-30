# verify_lyrics.py: 直接量成片里歌词条的高亮进度，证明逐字填充跟着人声走。
#
# 原理：karaoke.js 在草稿上先写奶油白字 (#FFF5E2)，再用赭石色 (#E8AA38) 按进度"裁切"覆盖一遍。
# 所以歌词条里赭石色像素的横向跨度 = 当前填充进度。抽若干时刻量一下，看它是不是线性推进到行尾。
#
# 用法: python tools/verify_lyrics.py [视频]
import subprocess, sys, os, tempfile
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', '忘记时间_水彩MV.mp4')

# 歌词条：y≈975-1080（正文 56px 居中于 1024，笔刷底框 982-1070）
CROP = (0, 968, 1920, 1082)
OCHRE = np.array([232, 170, 56])          # PAL.ochre

# 抽两个代表性长句：第1行(慢，原实现提前 4.44s)、第4行(最严重，提前 5.05s)
CASES = [
    ('第1行 沉默着走了有 多遥远', 33.538, 40.979,
     [34.5, 36.5, 38.5, 40.0, 40.7]),
    ('第4行 倔强坚持 对抗时间', 55.374, 63.129,
     [56.5, 58.2, 60.0, 61.8, 62.9]),
]

def ochre_span(t):
    """返回该时刻赭石高亮的横向跨度（像素）与该行奶油字总跨度。"""
    png = os.path.join(tempfile.gettempdir(), '_vlyr.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', VID,
                    '-frames:v', '1', png], check=True)
    a = np.asarray(Image.open(png).convert('RGB')).astype(np.int16)
    a = a[CROP[1]:CROP[3], CROP[0]:CROP[2]]
    d_ochre = np.abs(a - OCHRE).sum(axis=2) < 90
    # 奶油白：很亮、偏暖、但不黄（B 通道高）
    d_cream = (a[:, :, 0] > 225) & (a[:, :, 1] > 210) & (a[:, :, 2] > 190) & (np.abs(a - OCHRE).sum(axis=2) >= 90)
    def span(mask):
        cols = np.where(mask.sum(axis=0) > 1)[0]
        return (cols.max() - cols.min() + 1) if len(cols) else 0
    os.remove(png)
    return span(d_ochre), span(d_cream), int(d_ochre.sum()), int(d_cream.sum())

print(f'视频: {VID}')
print()
for name, a, b, ts in CASES:
    n_old = None
    print(f'== {name}   a={a}s  b={b}s  行时长 {b-a:.2f}s')
    print(f'   期望填充: {a:.2f}s 起，到 {a + (b - a) * .85:.2f}s 填满（新逻辑 = 行尾前 15%）')
    print('   t(s)   赭石跨度  奶油跨度  赭石%   说明')
    for t in ts:
        so, sc_, po, pc = ochre_span(t)
        pct = (po / (po + pc) * 100) if (po + pc) else 0
        note = ''
        if t > a + (b - a) * .85:
            note = '应已填满'
        elif t < a + 1.2:
            note = '刚开始'
        print(f'   {t:5.1f}  {so:7d}  {sc_:8d}  {pct:5.1f}%  {note}')
    print()
