"""PRIMAL SENTINELS logo: chrome lettering, five Hearts, claw slashes, ribbon.

Output: assets/ui/logo.png + js/logo.js (positions of the five cores, used by the
game to make them pulse and to sweep a shine over the letters).
Run: python3 logo.py
"""
import os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FONT = os.path.join(os.path.dirname(__file__), 'fonts', 'Bungee.ttf')
FONT2 = os.path.join(os.path.dirname(__file__), 'fonts', 'BlackOpsOne.ttf')
S = 2                      # supersampling
Wd, Hd = 1100, 560         # final size
W_, H_ = Wd * S, Hd * S

HERO_COLS = ['#ff4a3d', '#3f86ff', '#ffd13a', '#ff5fae', '#d9e2ec']


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


def text_mask(text, size, font=FONT, track=0, shear=-0.2):
    f = ImageFont.truetype(font, size)
    # render letters one by one for tracking
    widths = [f.getbbox(c)[2] - f.getbbox(c)[0] for c in text]
    total = sum(f.getlength(c) for c in text) + track * (len(text) - 1)
    im = Image.new('L', (int(total + size), int(size * 1.4)), 0)
    d = ImageDraw.Draw(im)
    x = size * 0.2
    for c in text:
        d.text((x, size * 0.1), c, font=f, fill=255)
        x += f.getlength(c) + track
    # italic shear
    w, h = im.size
    im = im.transform((w + int(abs(shear) * h), h), Image.AFFINE, (1, shear, shear * h if shear < 0 else 0, 0, 1, 0), Image.BICUBIC)
    bb = im.getbbox()
    return np.array(im.crop(bb)).astype(float) / 255


def dilate(m, r):
    if r <= 0:
        return m
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    k = (x * x + y * y) <= r * r
    return ndi.grey_dilation(m, footprint=k)


def chrome(h, top, mid_dark, mid_light, bottom, horizon=0.52):
    """vertical chrome ramp: sky reflection on top, dark horizon line, bright ground"""
    t = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, 1, 3))
    a = t < horizon
    k1 = (t / horizon)
    k2 = ((t - horizon) / (1 - horizon))
    top, md, ml, bottom = map(hexrgb, (top, mid_dark, mid_light, bottom))
    upper = top * (1 - k1 ** 1.6) + md * (k1 ** 1.6)
    lower = ml * (1 - k2) + bottom * k2
    out = np.where(a[..., None], upper[:, None, :] if upper.ndim == 2 else upper, lower[:, None, :] if lower.ndim == 2 else lower)
    return out.reshape(h, 1, 3)


def layer_word(canvas, mask, x, y, fill_fn, strokes):
    """strokes: list of (radius, color) from outer to inner, then the chrome fill"""
    h, w = mask.shape
    pad = max(r for r, _ in strokes) + 8
    big = np.zeros((h + pad * 2, w + pad * 2))
    big[pad:pad + h, pad:pad + w] = mask
    X, Y = x - pad, y - pad
    # drop shadow
    sh = dilate(big, strokes[0][0])
    sh_img = Image.fromarray((sh * 170).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6 * S))
    shadow = Image.new('RGBA', sh_img.size, (0, 0, 0, 0))
    shadow.putalpha(sh_img)
    canvas.alpha_composite(shadow, (X + 8 * S, Y + 12 * S))
    for r, col in strokes:
        m = dilate(big, r)
        rgba = np.zeros(m.shape + (4,), np.uint8)
        if callable(col):
            rgba[..., :3] = col(m.shape[0], m.shape[1])
        else:
            rgba[..., :3] = hexrgb(col)
        rgba[..., 3] = (np.clip(m, 0, 1) * 255).astype(np.uint8)
        canvas.alpha_composite(Image.fromarray(rgba), (X, Y))
    # chrome fill
    fill = fill_fn(big.shape[0], big.shape[1])
    # bevel: light from top-left using the gradient of a blurred mask
    bl = ndi.gaussian_filter(big, 3 * S)
    gy, gx = np.gradient(bl)
    light = np.clip(-(gx * 0.7 + gy * 1.0) * 14 * S, -1, 1)
    fill = fill + (light[..., None] * np.where(light[..., None] > 0, 255 - fill, fill) * 0.85)
    # inner shine line near the top edge
    rgba = np.zeros(big.shape + (4,), np.uint8)
    rgba[..., :3] = np.clip(fill, 0, 255)
    rgba[..., 3] = (np.clip(big, 0, 1) * 255).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(rgba), (X, Y))
    return big, (X, Y)


def slash(canvas, x0, y0, x1, y1, width):
    """a tapered claw slash (orange/red with dark outline)"""
    L = Image.new('L', canvas.size, 0)
    d = ImageDraw.Draw(L)
    n = 400
    for i in range(n + 1):
        t = i / n
        w = width * math.sin(t * math.pi) ** 0.8 + 1
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        d.ellipse([x - w, y - w, x + w, y + w], fill=255)
    m = np.array(L).astype(float) / 255
    out = dilate(m, 5 * S)
    for mm, col in ((out, '#14060a'), (m, None)):
        rgba = np.zeros(mm.shape + (4,), np.uint8)
        if col:
            rgba[..., :3] = hexrgb(col)
        else:
            yy = np.linspace(0, 1, mm.shape[0])[:, None]
            c1, c2 = hexrgb('#ffcf5a'), hexrgb('#d8261e')
            rgba[..., :3] = (c1 * (1 - yy[..., None]) + c2 * yy[..., None]).repeat(mm.shape[1], 1).reshape(mm.shape + (3,))
        rgba[..., 3] = (np.clip(mm, 0, 1) * 255).astype(np.uint8)
        canvas.alpha_composite(Image.fromarray(rgba))


def gem(canvas, cx, cy, r, color):
    d = ImageDraw.Draw(canvas)
    c = tuple(hexrgb(color).astype(int))
    d.ellipse([cx - r - 9 * S, cy - r - 9 * S, cx + r + 9 * S, cy + r + 9 * S], fill=(10, 14, 22, 255))
    # bezel: silver ring
    for i in range(7 * S, 0, -1):
        k = i / (7 * S)
        v = int(120 + 120 * (1 - k))
        d.ellipse([cx - r - i, cy - r - i, cx + r + i, cy + r + i], outline=(v, v + 8, v + 16, 255), width=1)
    # radial gradient gem
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    dist = np.sqrt((xx + r * 0.25) ** 2 + (yy + r * 0.3) ** 2) / r
    inside = (xx ** 2 + yy ** 2) <= r * r
    base = np.array(c, float)
    col = base[None, None, :] * (1.15 - dist[..., None] * 0.55)
    col = np.where(dist[..., None] < 0.35, col + (255 - col) * (0.35 - dist[..., None]) * 2.2, col)
    rgba = np.zeros((2 * r + 1, 2 * r + 1, 4), np.uint8)
    rgba[..., :3] = np.clip(col, 0, 255)
    rgba[..., 3] = inside * 255
    canvas.alpha_composite(Image.fromarray(rgba), (cx - r, cy - r))
    d.ellipse([cx - r * 0.55, cy - r * 0.62, cx - r * 0.15, cy - r * 0.3], fill=(255, 255, 255, 230))


def ribbon(canvas, cx, cy, w, h, text):
    d = ImageDraw.Draw(canvas)
    fold = h * 0.55
    dark, red, red2 = (14, 8, 12, 255), (196, 30, 36, 255), (130, 16, 24, 255)
    # tails
    for sgn in (-1, 1):
        x = cx + sgn * w / 2
        pts = [(x - sgn * 10 * S, cy - h / 2 + fold * 0.5), (x + sgn * fold * 1.4, cy - h / 2 + fold * 0.5), (x + sgn * fold * 0.8, cy + h / 2 * 0.5 + fold * 0.5), (x + sgn * fold * 1.4, cy + h / 2 + fold * 0.5), (x - sgn * 10 * S, cy + h / 2 + fold * 0.5)]
        d.polygon([(p[0] + sgn * 0, p[1]) for p in pts], fill=red2, outline=dark)
        d.line([pts[0], pts[1], pts[2], pts[3], pts[4]], fill=dark, width=4 * S)
    # body
    body = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    d.polygon(body, fill=red)
    d.rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + 5 * S], fill=(255, 110, 90, 255))
    d.rectangle([cx - w / 2, cy + h / 2 - 6 * S, cx + w / 2, cy + h / 2], fill=red2)
    d.line(body + [body[0]], fill=dark, width=5 * S)
    f = ImageFont.truetype(FONT, int(h * 0.52))
    tw = f.getlength(text)
    tx, ty = cx - tw / 2, cy - h * 0.34
    d.text((tx + 3 * S, ty + 3 * S), text, font=f, fill=(40, 6, 10, 255))
    d.text((tx, ty), text, font=f, fill=(255, 243, 214, 255))


def build():
    canvas = Image.new('RGBA', (W_, H_), (0, 0, 0, 0))
    # claw slashes behind the words
    for i in range(3):
        o = i * 95 * S
        slash(canvas, 760 * S + o, 0 * S, 150 * S + o, 520 * S, 30 * S)
    primal = text_mask('PRIMAL', 150 * S, font=FONT2, track=6 * S)
    sent = text_mask('SENTINELS', 150 * S, font=FONT2, track=4 * S)
    # scale SENTINELS to the full width
    target_w = 1000 * S
    k = target_w / sent.shape[1]
    sent = np.array(Image.fromarray((sent * 255).astype(np.uint8)).resize((int(sent.shape[1] * k), int(sent.shape[0] * k)), Image.LANCZOS)).astype(float) / 255
    kp = 640 * S / primal.shape[1]
    primal = np.array(Image.fromarray((primal * 255).astype(np.uint8)).resize((int(primal.shape[1] * kp), int(primal.shape[0] * kp)), Image.LANCZOS)).astype(float) / 255

    def fire_chrome(h, w):
        c = chrome(h, '#fff6d6', '#b0480e', '#ffe07a', '#ff8a1e', 0.5)
        return np.repeat(c, w, 1)

    def steel_chrome(h, w):
        c = chrome(h, '#ffffff', '#27405e', '#c9e6ff', '#6f8fb4', 0.5)
        return np.repeat(c, w, 1)

    def gold_ramp(h, w):
        return np.repeat(chrome(h, '#ffe9a8', '#b8741c', '#f2c052', '#7a4410', 0.5), w, 1)

    def red_ramp(h, w):
        return np.repeat(chrome(h, '#ff6a50', '#8a0e16', '#e0282a', '#5a0610', 0.5), w, 1)

    px = (W_ - primal.shape[1]) // 2 - 40 * S
    layer_word(canvas, primal, px, 36 * S, fire_chrome, [(16 * S, '#07080d'), (12 * S, red_ramp), (6 * S, '#150a0a')])
    sx = (W_ - sent.shape[1]) // 2
    sy = 36 * S + primal.shape[0] + 12 * S
    layer_word(canvas, sent, sx, sy, steel_chrome, [(17 * S, '#05070c'), (13 * S, gold_ramp), (6 * S, '#0b1322')])
    # five hearts on a steel band under SENTINELS
    band_y = sy + sent.shape[0] + 44 * S
    d = ImageDraw.Draw(canvas)
    bw = 430 * S
    d.rounded_rectangle([W_ / 2 - bw / 2 - 6 * S, band_y - 30 * S, W_ / 2 + bw / 2 + 6 * S, band_y + 30 * S], radius=30 * S, fill=(5, 7, 12, 255))
    for i in range(24 * S):
        v = int(90 + 140 * (1 - abs(i - 12 * S) / (12 * S)))
        d.rounded_rectangle([W_ / 2 - bw / 2 + i * 0, band_y - 24 * S + i, W_ / 2 + bw / 2, band_y - 24 * S + i + 1], radius=2, fill=(v, v + 10, v + 22, 255))
    d.rounded_rectangle([W_ / 2 - bw / 2, band_y - 24 * S, W_ / 2 + bw / 2, band_y + 24 * S], radius=24 * S, outline=(5, 7, 12, 255), width=3 * S)
    cores = []
    for i, col in enumerate(HERO_COLS):
        cx = int(W_ / 2 + (i - 2) * 84 * S)
        gem(canvas, cx, band_y, 25 * S, col)
        cores.append([round(cx / S), round(band_y / S), 25, col])
    # ribbon
    ribbon(canvas, W_ / 2, band_y + 72 * S, 520 * S, 54 * S, 'IL CUORE DEI TITANI')
    out = canvas.resize((Wd, Hd), Image.LANCZOS)
    bb = out.getbbox()
    out = out.crop(bb)
    for c in cores:
        c[0] -= bb[0]; c[1] -= bb[1]
    out.save(os.path.join(ROOT, 'assets', 'ui', 'logo.png'), optimize=True)
    # alpha-only mask used for the shine sweep is derived at runtime from the logo itself
    js = '// Generated by tools/logo.py\nwindow.LOGO = ' + json.dumps({'w': out.width, 'h': out.height, 'cores': cores}) + ';\n'
    open(os.path.join(ROOT, 'js', 'logo.js'), 'w').write(js)
    print(out.size, cores)


if __name__ == '__main__':
    build()
