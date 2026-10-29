
import glob, os
from PIL import Image
import numpy as np
d = r"D:\porojects\ai-vibecoding\pixel-vibe\.hyperframes\artifacts\snapshots\88f3728a-e1f3-4d1c-9f6b-0108f8e7f71f"
files = sorted(glob.glob(os.path.join(d,"frame-*.png")), key=lambda p:int(''.join(c for c in os.path.basename(p).split('-at-')[0] if c.isdigit())))
for f in files:
    im = Image.open(f).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    lum = (0.2126*a[:,:,0]+0.7152*a[:,:,1]+0.0722*a[:,:,2])
    h,w = lum.shape
    print(os.path.basename(f).ljust(24), im.size, "mean=%5.1f" % lum.mean(),
          "dark%%=%5.1f" % (100*(lum<12).mean()),
          "bright%%=%4.1f" % (100*(lum>200).mean()),
          "colors=%d" % len(np.unique((a//16).astype(np.uint8).reshape(-1,3), axis=0)))

