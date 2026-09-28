"""Re-cut the original sheets along real silhouettes and pack clean atlases."""
import json, colorsys
import numpy as np
from PIL import Image
import os
from segment import segment, SRC, ROOT
from pack import pack

OUT = os.path.join(ROOT, 'assets', 'sprites') + os.sep
META = {}


def save(name, frames):
    atlas, meta = pack(frames)
    atlas.save(OUT + name + '.png', optimize=True)
    META[name] = meta
    print(name, atlas.size, len(meta))


def recolor(img, fn):
    a = np.array(img).astype(np.float32)
    out = fn(a)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def purple_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (b > 120) & (r > 90) & (g < 0.75 * np.minimum(r, b)) & (a[..., 3] > 0)


# ---------------- heroes + soldiers ----------------
heroes = ['ignis', 'azur', 'lyra', 'aura', 'onyx', 'soldier']
fr, _ = segment('fighters.png', 6, 8)
frames = []
for f in fr:
    name = heroes[f['row']]
    img = f['img']
    if name == 'onyx' and f['col'] == 7:
        # the source frame has the soldier's purple gem: paint it like Onyx's suit
        def fix(a):
            m = purple_mask(a)
            lum = a[..., :3].mean(-1, keepdims=True)
            a[..., :3] = np.where(m[..., None], lum * 0.35 + 18, a[..., :3])
            return a
        img = recolor(img, fix)
    frames.append((f'{name}_{f["col"]}', img, f['ax'], f['ay']))
    if name == 'soldier':
        # variant 1: "lama" — crimson visor/gem, blue-steel armour
        def lancer(a):
            m = purple_mask(a)
            out = a.copy()
            out[..., 0] = np.where(m, a[..., 2] * 1.1 + 20, a[..., 0] * 0.85)
            out[..., 1] = np.where(m, a[..., 1] * 0.5, a[..., 1] * 0.9)
            out[..., 2] = np.where(m, a[..., 1] * 0.4, a[..., 2] * 1.05 + 6)
            return out
        frames.append((f'lancer_{f["col"]}', recolor(img, lancer), f['ax'], f['ay']))

        # variant 2: "bruto" — rust/bronze plating, amber gem
        def brute(a):
            m = purple_mask(a)
            lum = a[..., :3].mean(-1)
            out = a.copy()
            out[..., 0] = np.where(m, 255, lum * 1.25 + 14)
            out[..., 1] = np.where(m, 170, lum * 0.95 + 4)
            out[..., 2] = np.where(m, 40, lum * 0.62)
            return out
        frames.append((f'brute_{f["col"]}', recolor(img, brute), f['ax'], f['ay']))
# weapon poses from the generated sheet (frames 8..15)
from build_hd import armed_frames
idle_h = {k.split('_')[0]: im.height for k, im, ax, ay in frames if k.endswith('_0') and k.split('_')[0] in ('ignis', 'azur', 'lyra', 'aura', 'onyx')}
frames += armed_frames(idle_h)
save('fighters', frames)

# ---------------- bosses ----------------
frames = []
fr, _ = segment('mastice.png', 2, 4)
for f in fr:
    frames.append((f'mastice_{f["row"] * 4 + f["col"]}', f['img'], f['ax'], f['ay']))
villains = ['centipede', 'trivor', 'mimesi', 'kharon', 'custode', 'vespera', 'eclipse']
fr, _ = segment('campaign-villains.png', 7, 6)
for f in fr:
    frames.append((f'{villains[f["row"]]}_{f["col"]}', f['img'], f['ax'], f['ay']))
save('bosses', frames)

# ---------------- titans ----------------
frames = []
titans = ['rex', 'tri', 'cat', 'ptero', 'mammoth', 'concordia']
views = ['side', 'front', 'back']
fr, _ = segment('titans-reference.png', 6, 3, row_cuts=[0, 235, 448, 623, 856, 1080, 1536])
for f in fr:
    frames.append((f'{titans[f["row"]]}_{views[f["col"]]}', f['img'], f['ax'], f['ay']))
save('titans', frames)


