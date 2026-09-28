"""HD level backgrounds (1.6): assets/source/bg_hd/<name>.png -> assets/bg/<name>.jpg

Every image is scaled so that the edge of the walkable floor (FLOOR, in source px)
lands on y=465 of a 720 px tall background, like Porto Aurora; the floor part is
resized to fill the 255 px below. Run: python3 build_hd_bg.py
"""
import os
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC, OUT = os.path.join(ROOT, 'assets', 'source', 'bg_hd'), os.path.join(ROOT, 'assets', 'bg')
T, H = 465, 720
FLOOR = {'rail': 440, 'park': 550, 'theater': 530, 'siege': 455, 'graveyard': 458, 'veil': 488, 'dawn': 540}
for name, f in FLOOR.items():
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
    s = T / f
    w = round(im.width * s)
    top = im.crop((0, 0, im.width, f)).resize((w, T), Image.LANCZOS)
    floor = im.crop((0, f, im.width, im.height)).resize((w, H - T), Image.LANCZOS)
    out = Image.new('RGB', (w, H)); out.paste(top, (0, 0)); out.paste(floor, (0, T))
    out.save(os.path.join(OUT, name + '.jpg'), quality=88)
    print(name, out.size)
