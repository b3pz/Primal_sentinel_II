"""Tiny pixel-art toolkit: draw on a low-res canvas, shade, outline, upscale."""
import numpy as np
from PIL import Image, ImageDraw


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def shade(c, k):
    """k<1 darker, k>1 lighter (towards white)."""
    r, g, b = c[:3]
    if k <= 1:
        return (int(r * k), int(g * k), int(b * k), 255)
    t = k - 1
    return (int(r + (255 - r) * t), int(g + (255 - g) * t), int(b + (255 - b) * t), 255)


class Canvas:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.w, self.h = w, h

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle([x0, y0, x1, y1], fill=c)

    def ell(self, x0, y0, x1, y1, c):
        self.d.ellipse([x0, y0, x1, y1], fill=c)

    def poly(self, pts, c):
        self.d.polygon([tuple(p) for p in pts], fill=c)

    def line(self, pts, c, w=1):
        self.d.line([tuple(p) for p in pts], fill=c, width=w)

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.im.putpixel((int(x), int(y)), c)

    def limb(self, a, b, r, c):
        """Thick capsule between points a and b (radius r)."""
        ax, ay = a
        bx, by = b
        n = max(2, int(np.hypot(bx - ax, by - ay) * 2))
        for i in range(n + 1):
            t = i / n
            x, y = ax + (bx - ax) * t, ay + (by - ay) * t
            self.d.ellipse([x - r, y - r, x + r, y + r], fill=c)

    def outline(self, color=(14, 10, 20, 255), thick=1):
        a = np.array(self.im)
        m = a[..., 3] > 0
        o = np.zeros_like(m)
        for _ in range(thick):
            mm = m | o
            n = np.zeros_like(m)
            n[1:] |= mm[:-1]; n[:-1] |= mm[1:]; n[:, 1:] |= mm[:, :-1]; n[:, :-1] |= mm[:, 1:]
            o |= n & ~mm
        a[o] = color
        self.im = Image.fromarray(a)
        self.d = ImageDraw.Draw(self.im)
        return self

    def light(self, strength=0.22, from_left=True):
        """Cheap cel lighting: brighten pixels whose upper/left neighbour is empty, darken
        pixels whose lower/right neighbour is empty (reads as rim light + form shadow)."""
        a = np.array(self.im).astype(np.int32)
        m = a[..., 3] > 0
        up = np.zeros_like(m); up[1:] = m[:-1]
        dn = np.zeros_like(m); dn[:-1] = m[1:]
        lf = np.zeros_like(m); lf[:, 1:] = m[:, :-1]
        rt = np.zeros_like(m); rt[:, :-1] = m[:, 1:]
        hi = m & (~up | (~lf if from_left else ~rt))
        lo = m & (~dn | (~rt if from_left else ~lf))
        rgb = a[..., :3]
        rgb[hi & ~lo] = rgb[hi & ~lo] + (255 - rgb[hi & ~lo]) * strength
        rgb[lo & ~hi] = rgb[lo & ~hi] * (1 - strength * 1.2)
        a[..., :3] = np.clip(rgb, 0, 255)
        self.im = Image.fromarray(a.astype(np.uint8))
        self.d = ImageDraw.Draw(self.im)
        return self

    def scaled(self, k):
        return self.im.resize((self.w * k, self.h * k), Image.NEAREST)


def trim(im, pad=1):
    bb = im.getbbox()
    if not bb:
        return im, 0, 0
    x0, y0, x1, y1 = bb
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1)), x0, y0
