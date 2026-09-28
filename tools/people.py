"""Procedural pixel-art people (civilians + the five heroes out of armour).

Each character is a small skeleton posed with forward kinematics, drawn at low
resolution with cel shading and a dark outline, then upscaled x2 so that it sits
next to the arcade sprites of the fighters atlas.
"""
import math
import numpy as np
from PIL import Image
from pixel import Canvas, hexc, shade, trim

K = 2
W, H = 60, 78
FOOT_Y = 75
OUTL = (16, 10, 20, 255)

SKINS = ['f2c7a0', 'e0a57a', 'c68152', '8d5a3b', '5e3b27']


def P(x, y):
    return (x, y)


def at(p, length, ang):
    """Point at `length` from p, angle in degrees from straight-down, + = forward."""
    a = math.radians(ang)
    return (p[0] + math.sin(a) * length, p[1] + math.cos(a) * length)


class Look:
    def __init__(self, **kw):
        self.skin = hexc(SKINS[kw.get('skin', 0)])
        self.hair = hexc(kw.get('hair', '3b2a20'))
        self.hair_style = kw.get('style', 'short')
        self.top = hexc(kw.get('top', 'e8e8e8'))              # shirt
        self.jacket = hexc(kw['jacket']) if kw.get('jacket') else None
        self.sleeve = kw.get('sleeve', 'long')                  # long / short
        self.legs = hexc(kw.get('legs', '34425a'))              # trousers
        self.skirt = hexc(kw['skirt']) if kw.get('skirt') else None
        self.shorts = kw.get('shorts', False)
        self.shoes = hexc(kw.get('shoes', '2a2226'))
        self.hat = hexc(kw['hat']) if kw.get('hat') else None
        self.hat_style = kw.get('hat_style', 'cap')
        self.apron = hexc(kw['apron']) if kw.get('apron') else None
        self.glasses = kw.get('glasses', False)
        self.beard = hexc(kw['beard']) if kw.get('beard') else None
        self.tie = hexc(kw['tie']) if kw.get('tie') else None
        self.bulk = kw.get('bulk', 1.0)
        self.scale = kw.get('scale', 1.0)
        self.stripe = hexc(kw['stripe']) if kw.get('stripe') else None
        self.glow = hexc(kw['glow']) if kw.get('glow') else None  # hero's core light


def pose_walk(i, n=6, stride=24, arm=22, lean=3):
    ph = 2 * math.pi * i / n
    s = math.sin(ph)
    return dict(lean=lean, bob=-abs(math.cos(ph)) * 1.2 + 0.6,
                thigh_f=stride * s, knee_f=max(0, 38 * math.sin(ph - 1.2)) + 4,
                thigh_b=-stride * s, knee_b=max(0, 38 * math.sin(ph + math.pi - 1.2)) + 4,
                sh_f=-arm * s, el_f=18, sh_b=arm * s, el_b=18, mouth=0)


def pose_run(i, n=6):
    ph = 2 * math.pi * i / n
    s = math.sin(ph)
    return dict(lean=12, bob=-abs(math.cos(ph)) * 2.5 + 1,
                thigh_f=38 * s + 8, knee_f=max(0, 70 * math.sin(ph - 1.0)) + 10,
                thigh_b=-38 * s + 8, knee_b=max(0, 70 * math.sin(ph + math.pi - 1.0)) + 10,
                # panic: arms thrown up and flailing
                sh_f=150 + 18 * s, el_f=-25, sh_b=-165 + 18 * s, el_b=25, mouth=1)


def pose_idle(i):
    b = [0, 0.6][i % 2]
    return dict(lean=0, bob=b, thigh_f=6, knee_f=3, thigh_b=-5, knee_b=3,
                sh_f=8, el_f=12, sh_b=-6, el_b=10, mouth=0)


def pose_cower():
    return dict(lean=18, bob=12, thigh_f=75, knee_f=110, thigh_b=40, knee_b=120,
                sh_f=165, el_f=-120, sh_b=150, el_b=-110, mouth=1, crouch=True)


def pose_point():
    return dict(lean=-4, bob=0, thigh_f=10, knee_f=2, thigh_b=-8, knee_b=4,
                sh_f=140, el_f=5, sh_b=-8, el_b=14, mouth=1, look_up=True)


def pose_stance():   # heroes: ready to transform, fist raised to the chest
    return dict(lean=0, bob=0, thigh_f=14, knee_f=6, thigh_b=-14, knee_b=6,
                sh_f=40, el_f=-110, sh_b=-15, el_b=30, mouth=0)


def pose_raise():    # heroes: morpher raised to the sky
    return dict(lean=-3, bob=0, thigh_f=14, knee_f=4, thigh_b=-14, knee_b=4,
                sh_f=170, el_f=-5, sh_b=-25, el_b=20, mouth=0, look_up=True)


def pose_fight(i):   # civilian-clothes fighting stance (level opening)
    return dict(lean=4, bob=[0, 0.8][i % 2], thigh_f=22, knee_f=18, thigh_b=-18, knee_b=14,
                sh_f=55, el_f=-95, sh_b=35, el_b=-100, mouth=0)


def draw(look: Look, pose, flip=False):
    c = Canvas(W, H)
    s = look.scale
    bulk = look.bulk
    cx = W / 2
    thigh, shin = 15.5 * s, 15 * s
    torso = 20 * s
    upper, fore = 11 * s, 10.5 * s
    head_r = 6.3 * (0.9 + 0.1 * s) if s < 1 else 6.3
    hip_y = FOOT_Y - (thigh + shin) - 1 + pose.get('bob', 0)
    hip = P(cx, hip_y)
    lean = pose['lean']
    neck = at(hip, torso, 180 + lean) if False else (hip[0] + math.sin(math.radians(lean)) * torso,
                                                      hip[1] - math.cos(math.radians(lean)) * torso)
    hip_f = P(hip[0] + 1.5 * bulk, hip[1])
    hip_b = P(hip[0] - 1.5 * bulk, hip[1])
    sh_f = P(neck[0] + 2.2 * bulk, neck[1] + 2.5)
    sh_b = P(neck[0] - 2.6 * bulk, neck[1] + 2.5)

    def leg(h, th, kn):
        knee = at(h, thigh, th)
        foot = at(knee, shin, th - kn)
        return knee, foot

    knee_f, foot_f = leg(hip_f, pose['thigh_f'], pose['knee_f'])
    knee_b, foot_b = leg(hip_b, pose['thigh_b'], pose['knee_b'])
    # keep lowest foot on the floor (unless crouching, handled by bob)
    low = max(foot_f[1], foot_b[1])
    dy = FOOT_Y - low if not pose.get('crouch') else FOOT_Y - low
    def mv(p):
        return (p[0], p[1] + dy)
    hip, neck, hip_f, hip_b, sh_f, sh_b = map(mv, (hip, neck, hip_f, hip_b, sh_f, sh_b))
    knee_f, foot_f, knee_b, foot_b = map(mv, (knee_f, foot_f, knee_b, foot_b))

    def arm(sh, a, e):
        elbow = at(sh, upper, a)
        hand = at(elbow, fore, a + e)
        return elbow, hand

    el_f, hand_f = arm(sh_f, pose['sh_f'], pose['el_f'])
    el_b, hand_b = arm(sh_b, pose['sh_b'], pose['el_b'])

    dark = lambda col, k=0.72: shade(col, k)
    legs_col = look.legs
    skin = look.skin
    thick_leg = 2.9 * bulk
    thick_arm = 2.3 * bulk

    def draw_leg(h, knee, foot, back):
        col = dark(legs_col) if back else legs_col
        skn = dark(skin) if back else skin
        # thigh: trouser colour (or skin if shorts / skirt)
        c.limb(h, knee, thick_leg, col if not (look.skirt) else skn)
        shin_col = col if not (look.shorts or look.skirt) else skn
        c.limb(knee, foot, thick_leg * 0.86, shin_col)
        # shoe points forward
        sh = dark(look.shoes, 0.8) if back else look.shoes
        fx, fy = foot
        c.poly([(fx - 2.5, fy - 2.5), (fx + 4.5, fy - 1.5), (fx + 5, fy + 0.5), (fx - 2.5, fy + 0.5)], sh)

    def draw_arm(sh, el, hand, back):
        sleeve = look.jacket or look.top
        sl = dark(sleeve) if back else sleeve
        skn = dark(skin) if back else skin
        c.limb(sh, el, thick_arm, sl)
        c.limb(el, hand, thick_arm * 0.85, sl if look.sleeve == 'long' else skn)
        c.ell(hand[0] - 1.9, hand[1] - 1.9, hand[0] + 1.9, hand[1] + 1.9, skn)

    # ---- back limbs
    draw_arm(sh_b, el_b, hand_b, True)
    draw_leg(hip_b, knee_b, foot_b, True)
    draw_leg(hip_f, knee_f, foot_f, False)

    # ---- torso
    wS, wH = 7.4 * bulk, 6.0 * bulk
    ln = math.radians(lean)
    ox, oy = math.cos(ln), math.sin(ln)
    torso_pts = [(neck[0] - wS * ox, neck[1] + 1.5 - wS * oy), (neck[0] + wS * ox * 0.9, neck[1] + 1.5 + wS * oy),
                 (hip[0] + wH * ox, hip[1] + 2 + wH * oy), (hip[0] - wH * ox, hip[1] + 2 - wH * oy)]
    body = look.jacket or look.top
    c.poly(torso_pts, body)
    if look.jacket:  # shirt visible at the open front of the jacket
        fr = [(neck[0] + 2.2 * ox, neck[1] + 2), (neck[0] + wS * ox * 0.85, neck[1] + 2 + wS * oy * 0.8),
              (hip[0] + wH * ox * 0.9, hip[1] + 1), (hip[0] + 1.5 * ox, hip[1] + 1)]
        c.poly(fr, look.top)
    if look.stripe:
        mid = ((neck[0] + hip[0]) / 2, (neck[1] + hip[1]) / 2)
        c.line([(mid[0] - wS * ox, mid[1] - wS * oy), (mid[0] + wS * ox, mid[1] + wS * oy)], look.stripe, 2)
    if look.tie:
        c.line([(neck[0] + 3 * ox, neck[1] + 2), (hip[0] + 3 * ox, hip[1] - 6)], look.tie, 2)
    if look.apron:
        c.poly([(hip[0] - 1 * ox, hip[1] - 4), (hip[0] + wH * ox + 1, hip[1] - 4),
                (knee_f[0] + 3, knee_f[1] + 3), (knee_f[0] - 5, knee_f[1] + 4)], look.apron)
    if look.skirt:
        c.poly([(hip[0] - wH - 1, hip[1] - 1), (hip[0] + wH + 1, hip[1] - 1),
                (hip[0] + wH + 5 + max(0, pose['thigh_f'] * 0.12), hip[1] + 14 * s),
                (hip[0] - wH - 5 + min(0, pose['thigh_b'] * 0.12), hip[1] + 14 * s)], look.skirt)
    # belt line
    c.line([(hip[0] - wH * ox, hip[1] - 1 - wH * oy), (hip[0] + wH * ox, hip[1] - 1 + wH * oy)], dark(legs_col, 0.55), 1)
    if look.glow:
        gx, gy = neck[0] + 2 * ox, neck[1] + 7
        c.ell(gx - 1.6, gy - 1.6, gx + 1.6, gy + 1.6, look.glow)

    # ---- head
    hx, hy = neck[0] + 1 + math.sin(ln) * 2, neck[1] - head_r - 0.5
    c.limb(neck, (neck[0] + 0.5, neck[1] - 2.5), 1.8, dark(skin, 0.85))
    hair = look.hair
    # hair behind the head
    st = look.hair_style
    if st == 'long':
        c.poly([(hx - head_r - 0.5, hy - 1), (hx + 1, hy - head_r), (hx - 1, hy + head_r + 8), (hx - head_r - 2, hy + head_r + 7)], dark(hair, 0.85))
    if st == 'pony':
        sw = pose.get('lean', 0) * 0.2 + math.sin(pose.get('bob', 0) * 3) * 2
        c.limb((hx - head_r + 1, hy - 1), (hx - head_r - 5, hy + 5 + sw), 2, hair)
    if st == 'bun':
        c.ell(hx - head_r - 2, hy - head_r - 1, hx - head_r + 4, hy - head_r + 5, hair)
    c.ell(hx - head_r, hy - head_r, hx + head_r, hy + head_r, skin)
    c.ell(hx + head_r - 2.5, hy - 0.5, hx + head_r + 1.2, hy + 2.2, skin)  # nose / jaw forward
    # hair on top
    if st in ('short', 'long', 'pony', 'bun', 'spiky', 'neat'):
        c.poly([(hx - head_r - 0.5, hy + 1.5), (hx - head_r, hy - head_r * 0.6), (hx - 1, hy - head_r - 1.2),
                (hx + head_r * 0.8, hy - head_r * 0.7), (hx + head_r + 0.5, hy - 1.5), (hx + 1, hy - 2.5),
                (hx - 1.5, hy + 0.5), (hx - 2.5, hy + 3)], hair)
        if st == 'spiky':
            for k in range(4):
                bx = hx - head_r + 1 + k * 2.6
                c.poly([(bx - 1.5, hy - head_r + 1), (bx - 2.5 + k * 0.4, hy - head_r - 3.5), (bx + 1.5, hy - head_r)], hair)
        if st == 'long':
            c.poly([(hx - head_r, hy - 2), (hx - 1, hy - 2), (hx - 2, hy + head_r + 3), (hx - head_r - 1, hy + head_r + 2)], hair)
    elif st == 'shaved':
        c.poly([(hx - head_r, hy), (hx - head_r * 0.6, hy - head_r * 0.85), (hx + head_r * 0.5, hy - head_r), (hx + head_r * 0.2, hy - 2), (hx - 2, hy + 1)], dark(skin, 0.7))
    elif st == 'bald':
        c.poly([(hx - head_r, hy + 1), (hx - head_r, hy - 1), (hx - 2, hy + 1), (hx - 3, hy + 3)], hexc('d8d8d8'))
    if look.hat:
        if look.hat_style == 'cap':
            c.poly([(hx - head_r - 0.5, hy - 0.5), (hx - head_r * 0.6, hy - head_r - 0.8), (hx + head_r * 0.6, hy - head_r - 0.8),
                    (hx + head_r + 0.3, hy - 1.5)], look.hat)
            c.rect(hx + 1, hy - 1.8, hx + head_r + 3.5, hy - 0.8, dark(look.hat))
        elif look.hat_style == 'beanie':
            c.poly([(hx - head_r - 0.5, hy - 1.5), (hx - head_r * 0.5, hy - head_r - 3), (hx + head_r * 0.6, hy - head_r - 2.5),
                    (hx + head_r + 0.3, hy - 2.8)], look.hat)
            c.rect(hx - head_r - 0.5, hy - 3.2, hx + head_r + 0.3, hy - 2.2, dark(look.hat, 0.8))
        elif look.hat_style == 'fedora':
            c.rect(hx - head_r - 3, hy - 2.5, hx + head_r + 3, hy - 1.5, dark(look.hat))
            c.poly([(hx - head_r + 0.5, hy - 2), (hx - head_r + 1.5, hy - head_r - 3), (hx + head_r - 1.5, hy - head_r - 3),
                    (hx + head_r - 0.5, hy - 2)], look.hat)
            c.rect(hx - head_r + 0.5, hy - 3.5, hx + head_r - 0.5, hy - 2.5, hexc('2a1d14'))
    if look.beard:
        c.poly([(hx - 1.5, hy + 1.5), (hx + 0.5, hy + 2.8), (hx + head_r + 0.8, hy + 2.8), (hx + head_r - 0.5, hy + head_r - 0.3), (hx + 0.5, hy + head_r + 0.8)], look.beard)
    # face
    look_up = pose.get('look_up')
    ex, ey = hx + head_r * 0.45, hy - (1.2 if look_up else 0.2)
    c.px(round(ex), round(ey), hexc('1a1216'))
    c.px(round(ex) + 1, round(ey) - 2, dark(hair, 0.8))
    if look.glasses:
        c.rect(round(ex) - 1, round(ey) - 1, round(ex) + 2, round(ey) + 1, hexc('202830'))
        c.px(round(ex), round(ey), hexc('bfe8ff'))
    if pose.get('mouth'):
        c.rect(round(hx + head_r - 1), round(hy + 2.5), round(hx + head_r), round(hy + 3.5), hexc('5a1f24'))

    # ---- front arm on top
    draw_arm(sh_f, el_f, hand_f, False)

    c.light(0.16)
    c.outline(OUTL)
    im = c.scaled(K)
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im


CIVILIANS = {
    'waiter': Look(skin=1, hair='2a1d16', style='neat', top='f4f4f0', jacket='1d1d24', sleeve='long', legs='22222a', apron='f4f4f0', shoes='121212'),
    'fisher': Look(skin=2, hair='3a2a20', style='short', top='f2c230', jacket='f2c230', legs='2f4058', shoes='3b2a20', hat='2c5f9e', hat_style='beanie', beard='3a2a20', bulk=1.1),
    'lady': Look(skin=0, hair='1f1516', style='long', top='c62f3c', sleeve='short', legs='c62f3c', skirt='c62f3c', shoes='5a1a22'),
    'elder': Look(skin=0, hair='d8d8d8', style='bald', top='d9d2c0', jacket='7a5a3a', legs='6a6a70', shoes='2a1f18', hat='4a3a2c', hat_style='fedora', beard='d8d8d8'),
    'tourist': Look(skin=3, hair='1a1414', style='short', top='3aa36a', sleeve='short', legs='d8c38a', shorts=True, shoes='f0f0f0', hat='e0492f', hat_style='cap'),
    'girl': Look(skin=1, hair='e3b55a', style='pony', top='f0f0f0', jacket='2b9a9a', legs='3b4f8a', shoes='f0f0f0'),
    'suit': Look(skin=2, hair='2a2020', style='neat', top='f0f0f0', jacket='5a6270', legs='5a6270', shoes='1a1a1a', tie='b02a3a'),
    'kid': Look(skin=4, hair='1a1212', style='short', top='3b7ad8', stripe='f0f0f0', sleeve='short', legs='2f3a4a', shorts=True, shoes='d94a3a', scale=0.72),
    'scientist': Look(skin=1, hair='5a3222', style='bun', top='7fb6d8', jacket='f4f6f8', legs='3a3f4a', shoes='2a2a30', glasses=True),
}

HEROES_CIVIL = {
    'ignis': Look(skin=1, hair='1d1414', style='spiky', top='f0f0f0', jacket='c3262b', legs='2f4a7a', shoes='e8e8e8', glow='ff5a4a'),
    'azur': Look(skin=0, hair='3a2a1e', style='neat', top='2d5fc4', jacket='2d5fc4', legs='5a5f6a', shoes='20242c', glasses=True, glow='5aa8ff'),
    'lyra': Look(skin=3, hair='1a1212', style='pony', top='1a1a1a', jacket='f0c02a', legs='1d1d22', shoes='f0f0f0', glow='ffe066'),
    'aura': Look(skin=0, hair='8a3a2a', style='long', top='f4f4f4', jacket='e56aa8', legs='f4f4f4', skirt='f4f4f4', shoes='b04a7a', glow='ff8ac8'),
    'onyx': Look(skin=4, hair='101010', style='shaved', top='3a3a42', jacket='17171b', sleeve='long', legs='2a2a30', shoes='101010', bulk=1.25, glow='d0d8e0'),
}


def build():
    frames = []
    for name, look in CIVILIANS.items():
        for i in range(2):
            frames.append((f'{name}_idle{i}', draw(look, pose_idle(i))))
        for i in range(6):
            frames.append((f'{name}_walk{i}', draw(look, pose_walk(i))))
        for i in range(6):
            frames.append((f'{name}_run{i}', draw(look, pose_run(i))))
        frames.append((f'{name}_cower', draw(look, pose_cower())))
        frames.append((f'{name}_point', draw(look, pose_point())))
    for name, look in HEROES_CIVIL.items():
        for i in range(2):
            frames.append((f'{name}C_idle{i}', draw(look, pose_idle(i))))
        for i in range(6):
            frames.append((f'{name}C_walk{i}', draw(look, pose_walk(i))))
        for i in range(6):
            frames.append((f'{name}C_dash{i}', draw(look, dict(pose_walk(i, stride=34, arm=40, lean=10), mouth=0))))
        frames.append((f'{name}C_stance', draw(look, pose_stance())))
        frames.append((f'{name}C_raise', draw(look, pose_raise())))
        frames.append((f'{name}C_point', draw(look, pose_point())))
    out = []
    for k, im in frames:
        tim, x0, y0 = trim(im, 0)
        out.append((k, tim, W * K / 2 - x0, FOOT_Y * K + K - y0))
    return out


if __name__ == '__main__':
    fr = build()
    names = list(CIVILIANS) + [h + 'C' for h in HEROES_CIVIL]
    rows = []
    for n in names:
        rows.append([f for f in fr if f[0].startswith(n + '_')])
    cw, ch = W * K + 4, H * K + 4
    cols = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (cols * cw, len(rows) * ch), (48, 52, 70, 255))
    for ri, r in enumerate(rows):
        for ci, (k, im, ax, ay) in enumerate(r):
            sheet.alpha_composite(im, (int(ci * cw + cw / 2 - ax), int(ri * ch + FOOT_Y * K - ay + 2)))
    sheet.save('/tmp/claude-0/-home-claude/3434d8e8-e296-554c-ac5f-070a00e2bd55/scratchpad/people.png')
    print(sheet.size)
