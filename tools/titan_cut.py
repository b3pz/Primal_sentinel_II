"""Taglio a griglia per tavole 2x4 dove le figure (e i bagliori) si toccano:
tagli di riga e di colonna nei punti con meno pixel pieni, poi dentro ogni cella
si tiene il corpo più grande e i pezzi vicini."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from segment import SRC


def best_cut(proj, centre, span):
    lo, hi = max(1, centre - span), min(len(proj) - 1, centre + span)
    seg = proj[lo:hi]
    m = seg.min()
    idx = np.nonzero(seg <= m + max(2, m * 0.1))[0]
    return lo + int(idx[len(idx) // 2])     # middle of the emptiest stretch


def cut_grid(name, rows=2, cols=4, thr=110, merge=30, span=None):
    rgba = np.array(Image.open(SRC + name).convert('RGBA'))
    H, W = rgba.shape[:2]
    mask = rgba[..., 3] > thr
    rc = [0] + [best_cut(mask.sum(1), H * r // rows, H // 6) for r in range(1, rows)] + [H]
    out = {}
    for r in range(rows):
        band = mask[rc[r]:rc[r + 1]]
        cc = [0] + [best_cut(band.sum(0), W * c // cols, span or W // 12) for c in range(1, cols)] + [W]
        for c in range(cols):
            y0, y1, x0, x1 = rc[r], rc[r + 1], cc[c], cc[c + 1]
            m = mask[y0:y1, x0:x1]
            lab, n = ndi.label(m, structure=np.ones((3, 3)))
            sizes = ndi.sum(m, lab, range(1, n + 1))
            body = int(np.argmax(sizes)) + 1
            near = ndi.binary_dilation(lab == body, iterations=merge)
            keep = np.zeros_like(m)
            for i in range(1, n + 1):
                comp = lab == i
                spill = (c > 0 and comp[:, 0].any()) or (c < cols - 1 and comp[:, -1].any())   # a neighbour's glow
                if i == body or (sizes[i - 1] >= 20 and not spill and (comp & near).any()):
                    keep |= comp
            ys, xs = np.nonzero(keep)
            by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            crop = rgba[y0:y1, x0:x1][by0:by1, bx0:bx1].copy()
            k = keep[by0:by1, bx0:bx1]
            crop[~k] = 0
            crop[k, 3] = 255
            bm = (lab == body)[by0:by1, bx0:bx1]
            yy, xx = np.nonzero(bm)
            foot, top = yy.max(), yy.min()
            mid = (yy > top + (foot - top) * 0.25) & (yy < top + (foot - top) * 0.6)
            out[(r, c)] = dict(row=r, col=c, img=Image.fromarray(crop), ax=float(xx[mid].mean()), ay=float(foot + 1),
                               bh=float(foot - top))
    return out
