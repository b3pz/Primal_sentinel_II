"""Cut the hand-made (generated) sheets: civilians, heroes in civilian clothes,
armed rangers and items. Frames are cleaned (halo removed, dark 1px outline)
and scaled to match the fighters atlas. Used by build_all.py."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from segment import segment, SRC

OUTLINE = np.array([20, 12, 20, 255], np.uint8)


def clean(img):
    """binary alpha + dark 1px outline: hides the coloured fringe of the generator"""
    a = np.array(img.convert('RGBA'))
    m = a[..., 3] > 0
    inner = ndi.binary_erosion(m, iterations=1)
    edge = m & ~inner
    a[edge] = OUTLINE
    a[~m] = 0
    return Image.fromarray(a)


def scaled(f, k):
    img = f['img']
    w, h = max(1, round(img.width * k)), max(1, round(img.height * k))
    im = img.resize((w, h), Image.LANCZOS)
    a = np.array(im); a[..., 3] = np.where(a[..., 3] > 110, 255, 0); a[a[..., 3] == 0] = 0
    return clean(Image.fromarray(a)), f['ax'] * k, f['ay'] * k


def cut(name, rows, cols, thr=200, row_cuts=None):
    fr, _ = segment(name, rows, cols, thr=thr, merge_dist=40, row_cuts=row_cuts)
    grid = {}
    for f in fr:
        grid[(f['row'], f['col'])] = f
    missing = [(r, c) for r in range(rows) for c in range(cols) if (r, c) not in grid]
    if missing:
        print('WARNING', name, 'missing', missing)
    return grid


CIV1 = ['waiter', 'fisher', 'lady', 'elder', 'tourist']
CIV2 = ['girl', 'suit', 'kid', 'scientist']
HEROES = ['ignis', 'azur', 'lyra', 'aura', 'onyx']


def people_frames():
    out = []
    TARGET = 142  # adult height on screen at scale 1

    def civ_sheet(sheet, names):
        grid = cut(sheet, len(names), 7)
        # common scale for the sheet: median idle height of the adults
        hs = [grid[(r, 0)]['img'].height for r, n in enumerate(names) if n != 'kid' and (r, 0) in grid]
        k = TARGET / float(np.median(hs))
        for r, n in enumerate(names):
            F = lambda c: scaled(grid[(r, c)], k)
            idle, w1, w2, w3, cower, point, thank = [F(c) for c in range(7)]
            keys = {'idle0': idle, 'idle1': idle, 'cower': cower, 'point': point, 'thank': thank}
            for i, fr in enumerate([w1, w2, w3, w1, w2, w3]):
                keys[f'walk{i}'] = fr
                keys[f'run{i}'] = fr
            for key, (im, ax, ay) in keys.items():
                out.append((f'{n}_{key}', im, ax, ay))

    civ_sheet('civilians-1.png', CIV1)
    civ_sheet('civilians-2.png', CIV2)
    grid = cut('heroes-civil.png', 5, 8)
    hs = [grid[(r, 0)]['img'].height for r in range(4) if (r, 0) in grid]
    k = TARGET / float(np.median(hs))
    for r, n in enumerate(HEROES):
        F = lambda c: scaled(grid[(r, c)], k)
        idle, w1, w2, w3, run, stance, raise_, point = [F(c) for c in range(8)]
        keys = {'idle0': idle, 'idle1': idle, 'stance': stance, 'raise': raise_, 'point': point}
        for i, fr in enumerate([w1, w2, w3, w1, w2, w3]):
            keys[f'walk{i}'] = fr
        for i, fr in enumerate([run, w2, run, w3, run, w1]):
            keys[f'dash{i}'] = fr
        for key, (im, ax, ay) in keys.items():
            out.append((f'{n}C_{key}', im, ax, ay))
    return out


def armed_frames(idle_heights):
    """8 new poses per ranger, numbered 8..15 after the 0..7 of the original sheet:
    8 wind-up · 9 weapon strike · 10 special · 11 pistol · 12 jump · 13 knocked · 14 lying · 15 grab"""
    grid = cut('rangers-armed.png', 5, 8)
    out = []
    for r, n in enumerate(HEROES):
        ref = grid.get((r, 3))  # pistol pose: standing upright like the idle pose
        k = idle_heights[n] / ref['img'].height * 0.97
        for c in range(8):
            if (r, c) not in grid:
                continue
            im, ax, ay = scaled(grid[(r, c)], k)
            if c == 7:
                ax = im.width * 0.3   # grab: the ranger is the left figure, the enemy is part of the pose
            out.append((f'{n}_{8 + c}', im, ax, ay))
    return out


ITEM_ORDER = ['w_ignis', 'w_azur', 'w_lyra', 'w_aura', 'w_onyx', 'w_gun', 'w_cannon',
              'ammo', 'pizza', 'chicken', 'can', 'energy', 'coin', 'gem']
ITEM_SIZE = {'w_cannon': ('w', 300), 'w_gun': ('w', 64), 'chicken': ('w', 76), 'pizza': ('h', 50),
             'can': ('h', 40), 'energy': ('h', 46), 'coin': ('h', 36), 'gem': ('h', 42), 'ammo': ('h', 46)}


def item_frames():
    img = Image.open(os.path.join(SRC, 'items-hd.png')).convert('RGBA')
    a = np.array(img)
    m = a[..., 3] > 200
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    objs = ndi.find_objects(lab)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    boxes = [[o[1].start, o[0].start, o[1].stop, o[0].stop, [i + 1]] for i, o in enumerate(objs) if sizes[i] > 150]
    # merge boxes closer than 40 px (the two daggers, the bow string…)
    merged = True
    while merged:
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                A, B = boxes[i], boxes[j]
                dx = max(A[0] - B[2], B[0] - A[2], 0); dy = max(A[1] - B[3], B[1] - A[3], 0)
                if max(dx, dy) < 20:
                    boxes[i] = [min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3]), A[4] + B[4]]
                    boxes.pop(j); merged = True; break
            if merged:
                break
    # reading order: rows by centre y
    boxes.sort(key=lambda b: (round((b[1] + b[3]) / 2 / 330), b[0]))
    if len(boxes) != len(ITEM_ORDER):
        print('WARNING items found', len(boxes))
    out = []
    for key, b in zip(ITEM_ORDER, boxes):
        x0, y0, x1, y1, ids = b
        crop = a[y0:y1, x0:x1].copy()
        keep = np.isin(lab[y0:y1, x0:x1], ids)
        crop[..., 3] = np.where(keep, 255, 0); crop[~keep] = 0
        im = Image.fromarray(crop)
        mode, size = ITEM_SIZE.get(key, ('max', 104))
        k = size / (im.width if mode == 'w' else im.height if mode == 'h' else max(im.width, im.height))
        im, _, _ = scaled({'img': im, 'ax': 0, 'ay': 0}, k)
        if key.startswith('w_') and key not in ('w_cannon', 'w_gun'):
            ax, ay = im.width / 2, im.height / 2          # icons: centre
        elif key == 'w_cannon':
            ax, ay = im.width * 0.32, im.height * 0.62     # grip
        elif key == 'w_gun':
            ax, ay = im.width * 0.2, im.height * 0.7
        else:
            ax, ay = im.width / 2, im.height               # pickups: bottom centre
        out.append((key, im, ax, ay))
    return out
