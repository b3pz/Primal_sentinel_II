"""Second batch of generated sheets: titans in battle, giant monsters, the five beasts,
the combination sequence, new enemies, stage props and dialogue portraits."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from segment import segment, SRC
from build_hd import clean, scaled, cut


def to_h(f, h):
    return scaled(f, h / f['img'].height)


def col_bands(name, min_gap=18, thr=200):
    """cut a single-row sheet by empty vertical bands (keeps floating parts together)"""
    a = np.array(Image.open(os.path.join(SRC, name)).convert('RGBA'))
    m = a[..., 3] > thr
    m = ndi.binary_opening(m, structure=np.ones((3, 3)))
    cols = m.sum(0) > 0
    bands, x, W = [], 0, len(cols)
    while x < W:
        if cols[x]:
            s = x
            gap = 0
            while x < W and gap < min_gap:
                gap = 0 if cols[x] else gap + 1
                x += 1
            bands.append((s, x - gap))
        else:
            x += 1
    out = []
    for x0, x1 in bands:
        if x1 - x0 < 40:
            continue
        sub = m[:, x0:x1]
        ys = np.nonzero(sub.any(1))[0]
        y0, y1 = ys.min(), ys.max() + 1
        crop = a[y0:y1, x0:x1].copy()
        keep = sub[y0:y1]
        crop[..., 3] = np.where(keep, 255, 0); crop[~keep] = 0
        im = Image.fromarray(crop)
        out.append({'img': im, 'ax': im.width / 2, 'ay': im.height})
    return out


def fixed_bands(name, xs, ref_w, thr=200):
    """cut by fixed x boundaries (measured on a ref_w-wide preview); each component goes to the band of its centre"""
    a = np.array(Image.open(os.path.join(SRC, name)).convert('RGBA'))
    k = a.shape[1] / ref_w
    m = a[..., 3] > thr
    m = ndi.binary_opening(m, structure=np.ones((3, 3)))
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    com = ndi.center_of_mass(m, lab, range(1, n + 1))
    size = ndi.sum(m, lab, range(1, n + 1))
    out = []
    for i in range(len(xs) - 1):
        ids = [j + 1 for j in range(n) if size[j] > 60 and xs[i] * k <= com[j][1] < xs[i + 1] * k]
        keep = np.isin(lab, ids)
        ys, xx = np.nonzero(keep)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xx.min(), xx.max() + 1
        crop = a[y0:y1, x0:x1].copy(); kk = keep[y0:y1, x0:x1]
        crop[..., 3] = np.where(kk, 255, 0); crop[~kk] = 0
        im = Image.fromarray(crop)
        out.append({'img': im, 'ax': im.width / 2, 'ay': im.height})
    return out


def giants_frames():
    out = []
    # Tiranno rosso: idle, walk, bite, tail whip, charge, roar, hit, down
    g = cut('rex-battle.png', 2, 4)
    k = 300 / g[(0, 0)]['img'].height
    for i in range(8):
        f = g.get((i // 4, i % 4))
        if f:
            im, ax, ay = scaled(f, k); out.append((f'rexb_{i}', im, ax, ay))
    # Concordia: idle, walk, punch, uppercut, block, hit, final attack, kneel
    g = cut('concordia-battle.png', 2, 4)
    k = 470 / g[(0, 0)]['img'].height
    for i in range(8):
        f = g.get((i // 4, i % 4))
        if f:
            im, ax, ay = scaled(f, k); out.append((f'conc_{i}', im, ax, ay))
    # giant monsters (they face right in the sheet): idle, wind-up, attack, hit, defeated
    g = cut('giants.png', 3, 5)
    for r, n in enumerate(['trivorG', 'masticeG', 'eclipseG']):
        k = 430 / g[(r, 0)]['img'].height
        for c in range(5):
            f = g.get((r, c))
            if f:
                im, ax, ay = scaled(f, k); out.append((f'{n}_{c}', im, ax, ay))
    # the five beasts: dormant, awakening, running, roaring
    g = cut('titans-beasts.png', 5, 4, row_cuts=[0, 415, 665, 897, 1120, 1402])
    for r, n in enumerate(['rex', 'tri', 'cat', 'ptero', 'mammoth']):
        k = 230 / g[(r, 3)]['img'].height
        for c, pose in enumerate(['sleep', 'wake', 'run', 'roar']):
            f = g.get((r, c))
            if f:
                im, ax, ay = scaled(f, k); out.append((f'beast_{n}_{pose}', im, ax, ay))
    # combination sequence, 6 stages
    stages = fixed_bands('titans-combine.png', [0, 465, 720, 1005, 1330, 1645, 2000], 2000)
    print('combine stages', len(stages))
    k = 470 / stages[-1]['img'].height
    for i, f in enumerate(stages[:6]):
        im, ax, ay = scaled(f, k); out.append((f'combo_{i}', im, ax, ay))
    return out


ENEMY_ROWS = ['drone', 'shield', 'grenadier', 'dog', 'ninja']


def enemy_frames(soldier_h):
    """6 poses: idle, move 1, move 2, wind-up, attack, hit"""
    g = cut('enemies-hd.png', 5, 6)
    k = soldier_h / g[(1, 0)]['img'].height
    out = []
    for r, n in enumerate(ENEMY_ROWS):
        for c in range(6):
            f = g.get((r, c))
            if f:
                im, ax, ay = scaled(f, k); out.append((f'{n}_{c}', im, ax, ay))
    return out


PROP_KEYS = [['car', 'scooter', 'sign', 'spotlight', 'mirror', 'antenna'],
             ['generator', 'press', 'conveyor', 'rock', 'capsule', 'capsule2']]
PROP_SIZE = {'car': ('w', 212), 'scooter': ('w', 120), 'sign': ('w', 150), 'spotlight': ('w', 250), 'mirror': ('h', 200), 'antenna': ('h', 290),
             'generator': ('h', 170), 'press': ('h', 200), 'conveyor': ('w', 260), 'rock': ('w', 200), 'capsule': ('h', 180), 'capsule2': ('h', 180)}


def prop_frames():
    g = cut('props-hd.png', 2, 6)
    out = []
    for r in range(2):
        for c in range(6):
            f = g.get((r, c))
            if not f:
                continue
            key = PROP_KEYS[r][c]
            mode, s = PROP_SIZE[key]
            k = s / (f['img'].width if mode == 'w' else f['img'].height)
            im, ax, ay = scaled(f, k)
            out.append((key, im, im.width / 2, im.height))
    return out


PORTRAITS = [['ignis', 'azur', 'lyra', 'aura'], ['onyx', 'marco', 'nadia', 'valli'], ['vespera', 'kharon', 'kharon_face', 'mastice']]


def portrait_frames():
    g = cut('portraits.png', 3, 4)
    out = []
    for r in range(3):
        for c in range(4):
            f = g.get((r, c))
            if f:
                im, ax, ay = to_h(f, 200)
                out.append((f'pt_{PORTRAITS[r][c]}', im, im.width / 2, im.height))
    return out
