import sys, numpy as np, collections, math

p = r'public\bgm.mp4'
data = open(p, 'rb').read()
print('size', len(data))
CH = 1 << 18
for i in range(0, len(data), CH):
    ch = data[i:i+CH]
    zeros = ch.count(0) / len(ch)
    cnt = collections.Counter(ch)
    ent = -sum((c/len(ch)) * math.log2(c/len(ch)) for c in cnt.values())
    # count mp4 atom-like headers rough: presence of 'mdat','moov'
    print(f'{i/1048576:7.2f}MB zeros={zeros:.3f} entropy={ent:.2f}')

for tag in (b'mdat', b'moov', b'moof', b'mvhd', b'stco', b'sidx'):
    idx = data.find(tag)
    print(tag, idx)
