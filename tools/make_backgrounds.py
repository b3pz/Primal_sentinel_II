"""Build the level backgrounds from assets/source/campaign-worlds.png and port.png.

Each panel is upscaled to 720 px height and remapped so that the walkable floor
starts at y=465 (same horizon as Porto Aurora); the floor is stretched to give
room to the fights. Run: python3 make_backgrounds.py
"""
import os
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC, OUT = os.path.join(ROOT, 'assets', 'source'), os.path.join(ROOT, 'assets', 'bg')
T = 465  # target horizon
# panel (col,row) → name, floor line (in the 720px upscaled panel)
PANELS = {(0, 0): ('harbor', 566), (1, 0): ('rail', 570), (0, 1): ('park', 574), (1, 1): ('theater', 530),
          (0, 2): ('siege', 580), (1, 2): ('graveyard', 580), (0, 3): ('veil', 510), (1, 3): ('dawn', 540)}
im = Image.open(os.path.join(SRC, 'campaign-worlds.png')).convert('RGB')
xs = [(1, 884), (889, 1773)]
ys = [(1, 222), (226, 442), (445, 663), (667, 886)]
for (c, r), (name, f) in PANELS.items():
    p = im.crop((xs[c][0], ys[r][0], xs[c][1], ys[r][1]))
    w = round(p.width * 720 / p.height)
    big = p.resize((w, 720), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    top = big.crop((0, f - T, w, f))
    floor = big.crop((0, f, w, 720)).resize((w, 720 - T), Image.BICUBIC)
    out = Image.new('RGB', (w, 720)); out.paste(top, (0, 0)); out.paste(floor, (0, T))
    out.save(os.path.join(OUT, name + '.jpg'), quality=86)
    print(name, out.size)
Image.open(os.path.join(SRC, 'port.png')).convert('RGB').save(os.path.join(OUT, 'port.jpg'), quality=90)
