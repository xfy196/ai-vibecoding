
import sys
from PIL import Image
import numpy as np
for f in sys.argv[1:]:
    im = Image.open(f).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    lum = (0.2126*a[:,:,0]+0.7152*a[:,:,1]+0.0722*a[:,:,2])
    print(f.split("frame-")[-1].ljust(20), "mean=%5.1f" % lum.mean(), "dark%%=%5.1f" % (100*(lum<12).mean()),
          "colors=%d" % len(np.unique((a//16).astype(np.uint8).reshape(-1,3), axis=0)))

