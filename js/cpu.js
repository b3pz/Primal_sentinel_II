'use strict';
/* ============================================================
   CPU — un giocatore controllato dal computer. Serve per la demo
   del cabinato (attract mode) e per i test automatici.
   Restituisce lo stesso "controllo" astratto di tastiera/controller.
   ============================================================ */
function cpuControl(S, p, k) {
  const c = cpuRaw(S, p, k);
  // stuck against something too tall: back up and move vertically
  const moved = Math.abs(p.x - (p._bx ?? p.x)) > 0.5; p._bx = p.x;
  if ((p._stuck || 0) > 20) {
    // escape manoeuvre: back up, then slide along the depth axis, then try again
    p._stuck++;
    if (p._stuck === 22) { p._back = c.r ? 1 : -1; p._vdir = p.y < 600 ? 1 : -1; }
    c.r = 0; c.l = 0; c.u = 0; c.d = 0;
    if (p._stuck < 40) { c.l = p._back > 0 ? 1 : 0; c.r = p._back < 0 ? 1 : 0; }
    if (p._vdir > 0) c.d = 1; else c.u = 1;
    if (p._stuck > 85) p._stuck = 0;
    return c;
  }
  if ((c.r || c.l) && !moved && p.st === 'walk') p._stuck = (p._stuck || 0) + 1; else if (moved) p._stuck = 0;
  return c;
}
function cpuRaw(S, p, k) {
  const c = { l: 0, r: 0, u: 0, d: 0, held: {}, pressed: {} };
  if (p.out || p.st === 'dead' || p.st === 'ko') return c;
  if (p.civil) { if (S.t > 1 + p.slot * 0.3) c.pressed.special = true; return c; }
  const goX = (dx) => { c.r = dx > 0 ? 1 : 0; c.l = dx < 0 ? 1 : 0; };
  const goY = (dy) => { if (Math.abs(dy) > 12) { c.d = dy > 0 ? 1 : 0; c.u = dy < 0 ? 1 : 0; } };
  const targets = S.enemies.filter((e) => e.hp > 0 && !['dead', 'gone', 'rise', 'enter'].includes(e.st) && e.x > S.cam - 40 && e.x < S.cam + W + 40);
  // riding the titan: steer toward the enemies and bite
  if (p.riding) {
    const R = S.ride; if (!R) return c;
    const t = targets.sort((a, b) => Math.abs(a.x - R.x) - Math.abs(b.x - R.x))[0];
    if (!t) { if (p.slot === 0) c.r = 1; return c; }
    if (p.slot === 0) {
      const dx = t.x - R.x;
      if (Math.abs(dx) > 220 || Math.sign(dx) !== R.face) goX(dx);
      goY(t.y - R.y);
      if (Math.abs(dx) < 300 && Math.abs(t.y - R.y) < 60 && k % 14 === 0) c.pressed[Math.sign(dx) === R.face ? 'punch' : 'jump'] = true;
      if (targets.length >= 4 && k % 60 === 0) c.pressed.special = true;
    } else if (k % 40 === p.slot * 7 && p.ammo > 3) { c.pressed.shoot = true; c.u = t.def && t.def.flying ? 1 : 0; }
    return c;
  }
  // chapter 2 tunnel: duck under girders, jump over barriers
  const beam = S.haz && S.haz.find((h) => h.type === 'beam' && h.t >= 0 && beamX(h, p.y) > p.x - 10 && beamX(h, p.y) - p.x < 260);
  if (beam) {
    if (beam.kind === 'high') { c.held.dodge = true; if (p.st !== 'duck' && p.st !== 'dodge') c.pressed.dodge = true; return c; }
    if (beamX(beam, p.y) - p.x < 150 && p.st !== 'jump') { c.pressed.jump = true; return c; }
  }
  // a partner is down: go and revive them
  const ko = S.players.find((q) => q !== p && q.st === 'ko');
  if (ko && (targets.length < 3 || Math.abs(ko.x - p.x) < 300)) {
    const dx = ko.x - p.x, dy = ko.y - p.y;
    if (Math.abs(dx) > 70) goX(dx); goY(dy);
    if (Math.abs(dx) < 100 && Math.abs(dy) < 36) { c.held.punch = true; if (p.st !== 'revive') c.pressed.punch = true; }
    return c;
  }
  // low on health: grab food nearby
  if (p.hp < p.max * 0.4) {
    const food = S.items.filter((i) => ITEMS[i.type].heal && Math.abs(i.x - p.x) < 500).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (food) { goX(food.x - p.x); goY(food.y - p.y); return c; }
  }
  const props = S.props.filter((o) => o.hp > 0 && !(PROPS[o.type] && PROPS[o.type].deco) && !['antenna', 'generator'].includes(o.type) && Math.abs(o.x - p.x) < 400);
  const tgt = targets.sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) - Math.abs(b.x - p.x) - Math.abs(b.y - p.y))[0] || props[0];
  if (!tgt) {
    if (S.escape || !S.zoneOn || S.L.bonus) c.r = 1;
    if (p.st !== 'jump' && inGap(S.L, p.x + 70, p.y)) c.pressed.jump = true;
    return c;
  }
  const dx = tgt.x - p.x, dy = tgt.y - p.y;
  if (tgt.def && tgt.def.flying) {
    // drones: shoot upward, or jump-kick them
    if (Math.abs(dx) < 70) { goX(p.x > S.cam + W / 2 ? -1 : 1); if (p.st !== 'jump' && (k + p.id) % 25 === 0) c.pressed.jump = true; if (p.st === 'jump' && p.z > 60) c.pressed.punch = true; return c; }
    if (Math.sign(dx) !== p.face) { goX(dx); return c; }
    goY(dy);
    if (p.ammo > 0 && Math.abs(dx) < 500 && Math.abs(dy) < 30 && k % 12 === 0) { c.u = 1; c.d = 0; c.pressed.shoot = true; return c; }
    if (Math.abs(dx) > 90) goX(dx);
    else if (p.st !== 'jump' && k % 20 === 0) c.pressed.jump = true;
    if (p.st === 'jump' && p.z > 60) c.pressed.punch = true;
    return c;
  }
  // dodge an incoming heavy blow now and then
  if (tgt.st === 'wind' && Math.abs(dx) < 140 && Math.abs(dy) < 30 && (k + p.id * 7) % 37 === 0) { c.pressed.dodge = true; goX(-dx); return c; }
  const want = tgt.boss ? 150 : 80;
  // standing on a car or a rock while the enemy is on the street below: step off the front
  const onTop = groundAt(S, p.x, p.y);
  if (onTop > 40 && p.z >= onTop - 4 && (tgt.z || 0) < 20 && Math.abs(dx) < 260) {
    const b = S.plats.find((q) => p.x > q.x - q.w / 2 && p.x < q.x + q.w / 2 && p.y > q.y - q.d && p.y <= q.y + 1);
    if (b && b.y + 12 <= FLOOR_BOTTOM) { c.d = 1; c.u = 0; return c; }
    c.u = 1; c.d = 0; return c;
  }
  goY(dy);
  if (Math.abs(dx) > want) {
    goX(dx);
    if (p.st !== 'jump' && (inGap(S.L, p.x + Math.sign(dx) * 70, p.y) || groundAt(S, p.x + Math.sign(dx) * 30, p.y) > p.z + 10)) c.pressed.jump = true;
  }
  if (Math.abs(dx) <= want && Math.abs(dy) > 12 && groundAt(S, p.x, p.y + Math.sign(dy) * 20) > p.z + 10 && p.st !== 'jump') c.pressed.jump = true;
  else if (Math.sign(dx) !== p.face) goX(dx);
  else if (Math.abs(dy) <= 20) {
    if (k % 9 === p.id % 9 && (Math.abs(dx) < want + 40 || p.z > 60)) c.pressed.punch = true;
    if (k % 50 === (p.id * 3) % 50 && p.ammo > 4) c.pressed.shoot = true;
    const near = targets.filter((e) => Math.abs(e.x - p.x) < 260).length;
    if (p.en >= 40 && (near >= 3 || tgt.boss) && k % 45 === 0) c.pressed.special = true;
    if (S.team >= 100) c.pressed.team = true;
  }
  return c;
}
