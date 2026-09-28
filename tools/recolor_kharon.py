"""Kharon, the sixth Sentinel, in green (1.6.6): recolours the playable sheet
assets/sprites/heroes2.png in place (the enemy Kharon keeps his dark armour).
blue armour -> emerald green · red cape -> gold · purple Veil energy -> green energy."""
import os
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
p = os.path.join(ROOT, 'assets', 'sprites', 'heroes2.png')
im = Image.open(p).convert('RGBA')
a = np.array(im).astype(np.float32)
rgb = a[..., :3] / 255
hsv = np.array(Image.fromarray(a[..., :3].astype(np.uint8)).convert('HSV')).astype(np.float32)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
sat = s > 0.18
blue = sat & (h >= 190) & (h < 262)
purple = sat & (h >= 262) & (h < 330)
red = sat & ((h >= 330) | (h < 25))
h2 = h.copy(); s2 = s.copy(); v2 = v.copy()
h2[blue] = 140; s2[blue] = np.clip(s[blue] * 1.25, 0, 1); v2[blue] = np.clip(v[blue] * 1.35 + 0.04, 0, 1)
h2[purple] = 135; v2[purple] = np.clip(v[purple] * 1.05, 0, 1)
h2[red] = 44; s2[red] = np.clip(s[red] * 0.95, 0, 1); v2[red] = np.clip(v[red] * 1.25 + 0.05, 0, 1)
out = np.stack([h2 / 360 * 255, s2 * 255, v2 * 255], -1).astype(np.uint8)
rgb2 = np.array(Image.fromarray(out, 'HSV').convert('RGB'))
a[..., :3] = np.where((blue | purple | red)[..., None], rgb2, a[..., :3])
Image.fromarray(a.astype(np.uint8), 'RGBA').save(p, optimize=True)
print('recoloured', int(blue.sum()), int(purple.sum()), int(red.sum()))
