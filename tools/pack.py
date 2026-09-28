"""Shelf packer: frames -> atlas PNG + metadata dict."""
from PIL import Image


def pack(frames, max_w=2048, pad=2):
    """frames: list of (key, PIL.Image RGBA, ax, ay). Returns atlas image and meta."""
    items = sorted(frames, key=lambda f: -f[1].height)
    x = y = shelf_h = 0
    placed = []
    for key, im, ax, ay in items:
        w, h = im.width + pad, im.height + pad
        if x + w > max_w:
            x = 0
            y += shelf_h
            shelf_h = 0
        placed.append((key, im, ax, ay, x, y))
        x += w
        shelf_h = max(shelf_h, h)
    total_h = y + shelf_h
    atlas = Image.new('RGBA', (max_w if len(placed) > 1 else placed[0][1].width + pad, total_h), (0, 0, 0, 0))
    meta = {}
    used_w = 0
    for key, im, ax, ay, px, py in placed:
        atlas.alpha_composite(im, (px, py))
        meta[key] = [px, py, im.width, im.height, round(ax, 1), round(ay, 1)]
        used_w = max(used_w, px + im.width + pad)
    atlas = atlas.crop((0, 0, used_w, total_h))
    return atlas, meta
