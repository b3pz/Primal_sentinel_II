'use strict';
/* ============================================================
   MECCANICHE DEI CAPITOLI — ogni capitolo ha qualcosa di suo:
   1 traffico di scooter · 4 specchi che generano copie e riflettori
   che cadono · 5 antenna da difendere · 6 generatori e presse ·
   7-8 gravità ridotta · livello bonus: la capsula oscura.
   ============================================================ */
const BONUS_AFTER = [];   // II: no capsule bonus stages (yet)   // after chapters 2, 4 and 6
function bonusLevel(idx) {
  const bg = ['rail', 'theater', 'graveyard'][BONUS_AFTER.indexOf(idx)] || 'veil';
  return { n: 'BONUS', bonus: true, bg, place: 'LIVELLO BONUS', title: 'LA CAPSULA OSCURA', length: W + 100, music: 3, zones: [{ x: 380, name: 'DISTRUGGI LA CAPSULA!' }], intro: [], outro: [] };
}

/* extra props, placed per chapter/zone */
const MECH_PROPS = {
  3: [['mirror', 1900, 520, 1], ['mirror', 2150, 660, 1], ['mirror', 2950, 530, 2], ['mirror', 3200, 670, 2]],
  4: [['antenna', 3150, 520, 2]],
  5: [['generator', 780, 520, 0], ['generator', 1850, 520, 1], ['generator', 2900, 520, 2]],
};
const LOW_GRAVITY = [];   // II: set per chapter with L.lowGrav

function mechInit(S) {
  S.haz = [];
  S.hazT = 3;
  if (S.L.bonus) {
    S.props.push({ id: nid(), type: 'capsule', x: 640, y: 600, hp: 30 + S.players.length * 18, max: 30 + S.players.length * 18, shake: 0 });
    S.bonusT = 30; S.phase = 'stage';
    S.banner = { text: 'LIVELLO BONUS!', sub: 'DISTRUGGI LA CAPSULA OSCURA IN 30 SECONDI', t: 3 };
    return;
  }
  for (const [type, x, y, zone] of (S.L.mechProps || [])) S.props.push({ id: nid(), type, x, y, hp: PROPS[type].hp, max: PROPS[type].hp, shake: 0, zone, cd: 0, spawnT: 3 + Math.random() * 3 });
  if (S.L.press) S.haz.push({ id: nid(), type: 'press', x: 2250, y: 600, t: 0, zone: 1 });
}

/* props with special behaviour when hit; returns true when handled */
function mechHitProp(S, o, who) {
  if (o.type === 'generator') {
    if (o.cd > 0) { sparks(S, o.x, o.y - 80, '#8a96a6', 6); return true; }
    o.cd = 8; o.shake = 0.3;
    ev(S, { t: 'ring', x: o.x, y: o.y - 60, c: '#c07bff', r: 260, life: 0.6 }); sparks(S, o.x, o.y - 90, '#c07bff', 24, 'fire'); sfx(S, 'special');
    for (const p of S.players) if (!p.out && Math.abs(p.x - o.x) < 260) { p.en = 100; floatText(S, p.x, p.y - 180, 'ENERGIA PIENA!', '#c9a0ff', 16); }
    S.team = Math.min(100, S.team + 10);
    return true;
  }
  if (o.type === 'antenna') return true;   // players cannot damage the antenna
  if (o.type === 'capsule') {
    o.hp--; o.shake = 0.15; sparks(S, o.x, o.y - 90, '#c07bff', 8); sfx(S, 'hit');
    if (who && who.score !== undefined) who.score += 50;
    if (o.hp <= 0) { ev(S, { t: 'boom', x: o.x, y: o.y - 90, big: 1 }); ev(S, { t: 'flash', c: '#ffffff', v: 0.6 }); sfx(S, 'boom'); shake(S, 16); S.bonusWin = true; }
    return true;
  }
  return false;
}

function stepMech(S, dt) {
  const L = S.L;
  for (const o of S.props) if (o.cd > 0) o.cd = Math.max(0, o.cd - dt);
  // ---- bonus stage timer
  if (L.bonus) {
    if (S.banner && S.banner.t > 0 && S.t < 3) return;
    if (!S.bonusDone) {
      S.bonusT -= dt;
      if (S.bonusWin || S.bonusT <= 0) {
        S.bonusDone = true; S.bonusEnd = S.t;
        const bonus = S.bonusWin ? 10000 + Math.round(S.bonusT) * 500 : 0;
        for (const p of S.players) p.score += Math.round(bonus / S.players.length);
        ev(S, { t: 'pop', x: 640, y: 250, s: S.bonusWin ? `CAPSULA DISTRUTTA! +${bonus}` : 'TEMPO SCADUTO!', c: S.bonusWin ? '#ffd35a' : '#ff8a7a', big: 1, fixed: 1 });
      }
    } else if (S.t - S.bonusEnd > 2.2) S.result = 'bonus';
    return;
  }
  const zone = S.zoneIdx, on = S.zoneOn;
  // ---- chapter 1: scooters crossing the street during the fights
  if (S.L.scooters && on && zone < 3) {
    S.hazT -= dt;
    if (S.hazT <= 0) { S.hazT = rand(5, 8); S.haz.push({ id: nid(), type: 'scooter', x: S.cam + W + 120, y: rand(FLOOR_TOP + 20, FLOOR_BOTTOM - 10), t: -1.1, hit: new Set() }); sfx(S, 'siren'); }
  }
  // ---- chapter 4: stage spotlights fall on the players
  if (S.L.spots && on && zone < 3 && zone > 0) {
    S.hazT -= dt;
    if (S.hazT <= 0) { S.hazT = rand(5, 7); const p = pick(alivePlayers(S)); if (p) S.haz.push({ id: nid(), type: 'spot', x: p.x, y: p.y, t: 0 }); }
  }
  // ---- chapter 4: dark mirrors keep spawning shadow copies until broken
  for (const o of S.props) {
    if (o.type !== 'mirror' || o.hp <= 0 || o.zone !== zone || !on) continue;
    o.spawnT -= dt;
    if (o.spawnT <= 0 && S.enemies.filter((e) => e.hp > 0).length < 6) {
      o.spawnT = rand(6, 9);
      const e = spawnEnemy(S, 'shade', o.x + 40, clamp(o.y + 20, FLOOR_TOP, FLOOR_BOTTOM)); e.st = 'walk';
      sparks(S, o.x, o.y - 100, '#b77dff', 20, 'fire'); sfx(S, 'laser');
      floatText(S, o.x, o.y - 220, 'ROMPI GLI SPECCHI!', '#d0b0ff', 16);
    }
  }
  // ---- chapter 5: the Veil soldiers attack the antenna
  for (const o of S.props) {
    if (o.type !== 'antenna' || !on || o.zone !== zone) continue;
    for (const e of S.enemies) {
      if (e.boss || e.hp <= 0 || !['walk', 'idle'].includes(e.st)) continue;
      if (Math.abs(e.x - o.x) < 110 && Math.abs(e.y - o.y) < 50) { o.hp -= dt * 6; o.shake = 0.1; if (Math.random() < dt * 3) sparks(S, o.x, o.y - 150, '#ffd35a', 5); }
    }
    if (o.hp <= 0) {
      o.hp = o.max * 0.5;
      ev(S, { t: 'boom', x: o.x, y: o.y - 150 }); sfx(S, 'boom');
      ev(S, { t: 'pop', x: 640, y: 230, s: 'ANTENNA COLPITA!', c: '#ff8a7a', big: 1, fixed: 1 });
      for (const p of alivePlayers(S)) hurtPlayer(S, p, 18, { from: p.x - p.face });
    }
  }
  // ---- hazards
  for (const h of S.haz) {
    h.t += dt;
    if (h.type === 'scooter' && h.crash) {
      h.ct += dt; if (h.ct > 3) h.dead = true;
      continue;
    }
    if (h.type === 'scooter' && h.t > 0) {
      // a Sentinel attacking it head-on knocks the rider off (1.8)
      const hitter = S.players.find((p) => !p.out && p.st === 'atk' && p.face === 1 && h.x - p.x > 20 && h.x - p.x < 120 && Math.abs(p.y - h.y) < 30 && p.z < 60);
      if (hitter && frameOf('extra2', 'scooter_3')) {
        h.crash = true; h.ct = 0; sfx(S, 'heavy'); shake(S, 8);
        ev(S, { t: 'boom', x: Math.round(h.x), y: Math.round(h.y - 40) });
        floatText(S, h.x, h.y - 190, 'GIÙ DALLO SCOOTER!', '#ffe08a', 18);
        hitter.score += 500;
        const e = spawnEnemy(S, 'soldier', h.x - 30, h.y); e.st = 'knock'; e.t = 0; e.vx = -320; e.vz = 320; e.z = 60; e.face = 1;
        continue;
      }
      h.x -= 560 * dt;
      for (const p of S.players) if (!p.out && p.st !== 'dead' && !h.hit.has(p.id) && Math.abs(p.x - h.x) < 50 && Math.abs(p.y - h.y) < 24 && p.z < 40) { h.hit.add(p.id); hurtPlayer(S, p, 12, { knock: true, from: h.x + 50 }); }
      for (const e of S.enemies) if (hittable(e) && !e.boss && !h.hit.has(e.id) && Math.abs(e.x - h.x) < 50 && Math.abs(e.y - h.y) < 24) { h.hit.add(e.id); damageEnemy(S, null, e, 30, { knock: true, heavy: true, from: h.x + 50 }); }
      if (h.x < S.cam - 200) h.dead = true;
    }
    if (h.type === 'spot' && h.t > 1.2 && !h.hitDone) {
      h.hitDone = true; ev(S, { t: 'boom', x: Math.round(h.x), y: Math.round(h.y) }); sfx(S, 'heavy'); shake(S, 10);
      for (const p of S.players) if (!p.out && Math.hypot(p.x - h.x, (p.y - h.y) * 1.5) < 90 && p.z < 60) hurtPlayer(S, p, 20, { knock: true, from: h.x });
      for (const e of S.enemies) if (hittable(e) && !e.boss && Math.hypot(e.x - h.x, (e.y - h.y) * 1.5) < 90) damageEnemy(S, null, e, 40, { knock: true, heavy: true, from: h.x });
    }
    if (h.type === 'spot' && h.t > 2.4) h.dead = true;
    if (h.type === 'press') {
      // 1.12: the press runs on an overhead rail and HUNTS the players: it follows the nearest one, locks on
      // (red target on the floor), then slams. It crushes the Veil soldiers too: lure them under it.
      const active = S.zoneIdx === h.zone && S.zoneOn;
      const c = h.t % 3.2;
      if (!active) { h.t = 0; h.slam = false; continue; }
      const tgt = alivePlayers(S).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      if (tgt && c < 1.9) { h.x += clamp(tgt.x - h.x, -1, 1) * Math.min(Math.abs(tgt.x - h.x), 230 * dt); h.y += clamp(tgt.y - h.y, -1, 1) * Math.min(Math.abs(tgt.y - h.y), 120 * dt); }
      if (c >= 1.9 && !h.warned) { h.warned = true; floatText(S, h.x, h.y - 260, 'PRESSA! SPOSTATI!', '#ff8a5a', 20); sfx(S, 'siren'); }
      if (c >= 2.6 && !h.slam) {
        h.slam = true; sfx(S, 'stomp'); sfx(S, 'heavy'); shake(S, 12); ev(S, { t: 'ring', x: h.x, y: h.y, c: '#ffd35a', r: 200, life: 0.45 }); sparks(S, h.x, h.y - 20, '#ffd35a', 20);
        for (const p of S.players) if (!p.out && Math.abs(p.x - h.x) < 100 && Math.abs(p.y - h.y) < 48 && p.z < 80) hurtPlayer(S, p, 24, { knock: true, from: h.x });
        let n = 0;
        for (const e of S.enemies) if (hittable(e) && !e.boss && Math.abs(e.x - h.x) < 100 && Math.abs(e.y - h.y) < 48) { damageEnemy(S, null, e, 90, { knock: true, heavy: true, from: h.x }); n++; }
        if (n) { ev(S, { t: 'pop', x: Math.round(h.x), y: Math.round(h.y - 220), s: n > 1 ? `SCHIACCIATI ×${n}!` : 'SCHIACCIATO!', c: '#ffd35a' }); for (const p of alivePlayers(S)) p.score += 400 * n; }
      }
      if (c < 1.9) { h.slam = false; h.warned = false; }
      h.x = clamp(h.x, S.cam + 120, S.cam + W - 120); h.y = clamp(h.y, FLOOR_TOP + 20, FLOOR_BOTTOM - 10);
    }
  }
  S.haz = S.haz.filter((h) => !h.dead);
}

/* zone can't be cleared while its dark mirrors stand */
function mechZoneBlocked(S) { return S.props.some((o) => o.type === 'mirror' && o.hp > 0 && o.zone === S.zoneIdx) || tunnelBlocked(S); }

function mechView(S, d, r) {
  for (const h of S.haz) {
    if (h.type === 'scooter') {
      if (h.t < 0) d.push({ i: h.id, tg: [r(S.cam + W - 60), r(h.y), 60], x: r(h.x), y: r(h.y) });
      else if (frameOf('extra2', 'scooter_0')) {
        // 1.8: scooter + Veil rider drawn together (faces left): wheelie as it bursts in, crashed with smoke
        const f = h.crash ? 3 : h.t < 0.3 ? 2 : Math.floor(h.t * 10) % 2;
        d.push({ i: h.id, s: 'extra2', f: 'scooter_' + f, x: r(h.x), y: r(h.y), fc: 1, sc: 1, sh: 60, a: h.crash ? +clamp(3 - h.ct, 0, 1).toFixed(2) : 1 });
      } else {
        // a Veil soldier riding it (drawn first: the scooter covers his legs)
        d.push({ i: h.id + 0.5, s: 'fighters', f: 'soldier_4', x: r(h.x + 4), y: r(h.y) - 1, z: 6, fc: -1, sc: 0.78, sh: 0 });
        d.push({ i: h.id, s: 'extra', f: 'scooter', x: r(h.x), y: r(h.y), fc: -1, sc: 1.1, sh: 40 });
      }
    } else if (h.type === 'spot') {
      if (h.t < 1.2) d.push({ i: h.id, tg: [r(h.x), r(h.y), 85], x: r(h.x), y: r(h.y), s: 'extra', f: 'spotlight', z: r(Math.max(0, 700 - (h.t / 1.2) * 700 * (h.t > 0.9 ? 1 : 0.2))), sc: 0.6, sh: 0, a: h.t > 0.9 ? 1 : 0.0001 });
      else d.push({ i: h.id, s: 'extra', f: 'spotlight', x: r(h.x), y: r(h.y), sc: 0.6, sh: 50, r: 0.2, a: +clamp(2.4 - h.t, 0, 1).toFixed(2) });
    } else if (h.type === 'press') {
      const c = h.t % 3.2, on = S.zoneIdx === h.zone && S.zoneOn;
      const lock = c > 1.9 && c < 2.6, down = c >= 2.6 && c < 2.95;
      // the head hangs high while it hunts, drops on the slam, then rises again
      const lift = !on ? 170 : down ? 0 : c < 1.9 ? 170 : lock ? 170 - (c - 1.9) / 0.7 * 40 : 170 * clamp((c - 2.95) / 0.25, 0, 1);
      d.push({ i: h.id, pr: r(lift * 1.6), x: r(h.x), y: r(h.y), sy: h.y + 2, tg: on && c < 2.6 ? [r(h.x), r(h.y), lock ? 105 : 60] : undefined, fl: down ? 1 : 0 });
    }
  }
}
