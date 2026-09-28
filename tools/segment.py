"""Segment sprite sheets by real silhouettes instead of a fixed grid.

For each sheet we threshold alpha, find connected components, and assign each
component to the frame whose body is nearest (bodies = large components found per
row). Fragments (flying hair, magic, drill tips, feet) are attached to the closest
body so nothing gets clipped. Output: cleaned frames with a foot anchor.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import json, sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'assets', 'source') + os.sep


def clean_alpha(rgba, thr=128):
    a = rgba[..., 3]
    m = a >= thr
    # drop isolated specks
    m = ndi.binary_opening(m, structure=np.ones((2, 2))) | (m & ndi.binary_erosion(m))
    m = ndi.binary_fill_holes(m) & (a > 20) | m
    return m


def rows_by_projection(mask, n_rows):
    """Split sheet into n_rows horizontal bands at the emptiest lines."""
    h = mask.shape[0]
    prof = mask.sum(1).astype(float)
    cuts = [0]
    for k in range(1, n_rows):
        c = int(h * k / n_rows)
        win = int(h / n_rows * 0.35)
        lo, hi = max(1, c - win), min(h - 1, c + win)
        seg = prof[lo:hi]
        # choose the minimum; prefer center among ties
        best = lo + int(np.argmin(seg + np.abs(np.arange(lo, hi) - c) * 1e-3))
        cuts.append(best)
    cuts.append(h)
    return cuts


def segment(name, n_rows, n_cols, thr=128, row_cuts=None, merge_dist=60, min_frag=12):
    img = Image.open(SRC + name).convert('RGBA')
    rgba = np.array(img)
    mask = clean_alpha(rgba, thr)
    cuts = row_cuts or rows_by_projection(mask, n_rows)
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    objs = ndi.find_objects(lab)
    comps = []
    for i in range(n):
        sl = objs[i]
        ys, xs = np.nonzero(lab[sl] == i + 1)
        comps.append(dict(id=i + 1, size=sizes[i], x0=sl[1].start, x1=sl[1].stop,
                          y0=sl[0].start, y1=sl[0].stop, cx=xs.mean() + sl[1].start,
                          cy=ys.mean() + sl[0].start))
    bodies = []
    for r in range(n_rows):
        inband = [c for c in comps if cuts[r] <= c['cy'] < cuts[r + 1]]
        inband.sort(key=lambda c: -c['size'])
        bs = inband[:n_cols]
        bs.sort(key=lambda c: c['cx'])
        for ci, b in enumerate(bs):
            b['row'], b['col'] = r, ci
            bodies.append(b)
    bid = set(b['id'] for b in bodies)
    groups = {b['id']: [b] for b in bodies}
    for c in comps:
        if c['id'] in bid or c['size'] < min_frag:
            continue
        def dist(b):
            dx = max(b['x0'] - c['x1'], c['x0'] - b['x1'], 0)
            dy = max(b['y0'] - c['y1'], c['y0'] - b['y1'], 0)
            return np.hypot(dx, dy)
        ds = [dist(b) for b in bodies]
        k = int(np.argmin(ds))
        if ds[k] > merge_dist:
            continue
        groups[bodies[k]['id']].append(c)
    frames = []
    for body in bodies:
        grp = groups[body['id']]
        ids = [c['id'] for c in grp]
        x0 = min(c['x0'] for c in grp); x1 = max(c['x1'] for c in grp)
        y0 = min(c['y0'] for c in grp); y1 = max(c['y1'] for c in grp)
        sub = lab[y0:y1, x0:x1]
        cm = np.isin(sub, ids)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(cm, 255, 0)
        crop[~cm] = 0
        bm = sub == body['id']
        yy, xx = np.nonzero(bm)
        foot_y = yy.max()
        top = yy.min()
        low = yy > foot_y - (foot_y - top) * 0.2
        foot_x = xx[low].mean()
        mid = (yy > top + (foot_y - top) * 0.25) & (yy < top + (foot_y - top) * 0.6)
        torso_x = xx[mid].mean() if mid.any() else foot_x
        frames.append(dict(row=body['row'], col=body['col'], img=Image.fromarray(crop),
                           ax=float(torso_x), ay=float(foot_y + 1), fx=float(foot_x),
                           src=(int(x0), int(y0))))
    return frames, cuts


def debug_sheet(frames, n_cols, path, cell=None):
    rows = max(f['row'] for f in frames) + 1
    cw = max(f['img'].width for f in frames) + 10
    ch = max(f['img'].height for f in frames) + 10
    out = Image.new('RGBA', (cw * n_cols, ch * rows), (40, 40, 60, 255))
    from PIL import ImageDraw
    d = ImageDraw.Draw(out)
    for f in frames:
        ox, oy = f['col'] * cw + 5, f['row'] * ch + 5
        d.rectangle([ox, oy, ox + f['img'].width, oy + f['img'].height], outline=(90, 90, 120))
        out.alpha_composite(f['img'], (ox, oy))
        ax, ay = ox + f['ax'], oy + f['ay']
        d.line([ax - 6, ay, ax + 6, ay], fill=(0, 255, 0))
        d.line([ax, ay - 6, ax, ay], fill=(0, 255, 0))
    out.save(path)
