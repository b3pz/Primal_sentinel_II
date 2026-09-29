'use strict';
/* ============================================================
   SIMULAZIONE — gira sull'host (o in locale). Produce "view"
   serializzabili che il renderer e i client online disegnano.
   ============================================================ */
const HERO_SCALE = 0.86;
let NEXT_ID = 1;
const nid = () => NEXT_ID++;

function newStage(levelIdx, players, checkpoint = 0, Lover = null) {
  const L = Lover || LEVELS[levelIdx];
  const S = {
    lvl: levelIdx, L, phase: 'stage', t: 0, cam: 0, camLock: null, zoneIdx: checkpoint, zoneOn: false, wave: 0,
    players: [], enemies: [], props: [], items: [], shots: [], civs: [], events: [], team: 0,
    banner: { text: L.place, sub: `CAPITOLO ${L.n}`, t: 3 }, cleared: false, clearT: 0, bossId: 0, endT: 0,
    hitstop: 0, flashT: 0, checkpoint, ambientT: 1.5, giant: null, result: null,
    plats: [], sigils: [], saved: 0, dmgTaken: 0, contUsed: 0, credits: Infinity,
    boost: 1, slowT: 0, summonOK: false, summonUsed: false, pairMoves: 0, revives: 0, coins: 0,
  };
  const UP = (!Lover || Lover.bonus) && typeof UPGRADES !== 'undefined' && UPGRADES ? UPGRADES : null;   // la Bottega di Sette
  const X = (!Lover && LEVEL_EXTRAS[levelIdx]) || { plats: [], sigils: [], drones: {}, more: {} };
  for (const [type, x, y] of X.plats) S.plats.push({ id: nid(), type, x, y, ...PLATS[type] });
  // waves of every zone, with the extra drone waves of this chapter
  S.zw = L.zones.map((z, i) => (z.w ? z.w.concat((X.more || {})[i] || []).concat(X.drones[i] ? [['drone', X.drones[i]]] : []) : null));
  const startX = checkpoint ? L.zones[checkpoint - 1].x + 420 : 200;
  players.forEach((p, i) => {
    const hero = HEROES[p.hero];
    S.players.push({
      id: p.id, slot: i, hero: p.hero, name: p.name || `G${i + 1}`, skin: p.skin || 0, rev: 0,
      x: startX - i * 60, y: 560 + i * 36, z: 0, vz: 0, vx: 0, face: 1,
      hp: hero.hp, max: hero.hp, en: 60, lives: p.lives ?? 3, score: p.score || 0,
      st: 'idle', t: 0, atk: null, hit: new Set(), combo: 0, comboT: 0, inv: 1.5, weapon: null,
      tapT: 0, tapDir: 0, run: false, hold: 0, holdN: 0, walk: 0, respawn: 0, out: false, kos: 0, maxCombo: 0, hits: 0, ammo: 12, ammoT: 0, gz: 0,
    });
  });
  if (UP) {
    for (const p of S.players) {
      p.max += 15 * UP.hp; p.hp = p.max;
      p.ammoMax = 20 + 6 * UP.ammo; p.ammo = 12 + 6 * UP.ammo;
      p.en = Math.min(100, 60 + 15 * UP.en); p.enRate = 1 + 0.35 * UP.en;
    }
    S.team = 34 * UP.team;
  }
  S.cam = clamp(startX - 380, 0, L.length - W);
  if (L.civilStart && !checkpoint && !Lover) {
    S.phase = 'morph';
    S.players.forEach((p) => { if (p.hero < CORE_HEROES) { p.civil = true; p.inv = 0; } });
    S.banner = { text: 'PREMI SPECIALE PER TRASFORMARTI', sub: 'I CUORI SONO ANCORA CON VOI', t: 12 };
  }
  // props & weapons
  for (const z of L.zones) for (const [type, x, y] of z.p || []) S.props.push({ id: nid(), type, x, y, hp: PROPS[type].hp, shake: 0 });
  // Sigilli dei Titani: 3 collectibles per chapter
  X.sigils.forEach(([x, y, where], idx) => {
    if (where === 'crate') {
      let best = null; for (const o of S.props) if (!best || Math.abs(o.x - x) < Math.abs(best.x - x)) best = o;
      if (best) { best.sigil = idx; return; }
    }
    const it = makeItem('sigil', x, y, where === 'top' ? groundAt(S, x, y) : 0); it.sigil = idx; it.base = it.z; S.items.push(it);
  });
  // intro ambience: civilians fleeing across the street
  if (!checkpoint && !Lover) for (let i = 0; i < 5; i++) S.civs.push(makeCiv(pick(CIVS), S.cam + W + 60 + i * 110, 505 + (i * 37) % 170, 'flee'));
  mechInit(S);
  return S;
}

/* ---------- chapter 2: gaps between the wagons of the moving train ---------- */
const WAGON = 1100, GAP_W = 104, GAP_SLANT = 50;
function trainOn(L, x) { return !!(L && L.train && x > L.train + 300); }
/* left edge of the gap near world x at floor depth y (slanted by perspective) */
function gapLeft(wx, y) { return wx + 40 - (y - 465) / 255 * GAP_SLANT; }
function inGap(L, x, y, margin = 0) {
  if (!trainOn(L, x)) return false;
  if (L.loco && x > L.loco - 80) return false;   // the locomotive is one long piece
  const wx = Math.round(x / WAGON) * WAGON;
  const l = gapLeft(wx, y);
  return x > l + 14 + margin && x < l + GAP_W - 14 - margin;
}

/* ---------- platforms: cars, dumpsters, bus shelters you can climb on ---------- */
function groundAt(S, x, y) {
  let g = 0;
  for (const p of S.plats) if (x > p.x - p.w / 2 && x < p.x + p.w / 2 && y > p.y - p.d && y <= p.y + 1) g = Math.max(g, p.h);
  return g;
}
/* move an actor unless it would walk into the side of something taller than it */
const SOLID = { capsula: [100, 30], capsule: [44, 26], antenna: [40, 24], generator: [90, 30], mirror: [44, 22] };
function solidAt(S, x, y) {
  for (const o of S.props) { const sd = SOLID[o.type]; if (sd && o.hp > 0 && Math.abs(x - o.x) < sd[0] && Math.abs(y - o.y) < sd[1]) return true; }
  return false;
}
function tryMove(S, a, dx, dy) {
  const z = a.z || 0;
  const ok = (x, y) => groundAt(S, x, y) <= z + 10 && (z > 60 || !solidAt(S, x, y) || solidAt(S, a.x, a.y));
  if (ok(a.x + dx, a.y + dy)) { a.x += dx; a.y += dy; return true; }
  if (dx && ok(a.x + dx, a.y)) { a.x += dx; return false; }
  if (dy && ok(a.x, a.y + dy)) { a.y += dy; return false; }
  return false;
}

function makeItem(type, x, y, z = 0) {
  return { id: nid(), type, x, y, z, vz: z ? 0 : 0, life: ITEMS[type].weapon || ITEMS[type].sigil ? 1e9 : 18, bob: Math.random() * 6, base: 0 };
}
function makeCiv(type, x, y, mode) {
  return { id: nid(), type, x, y, face: -1, mode, t: Math.random(), speed: rand(170, 230), said: false };
}

/* ---------------- events ---------------- */
function ev(S, e) { S.events.push(e); }
function sparks(S, x, y, c, n = 10, kind = 'spark') { ev(S, { t: kind, x: Math.round(x), y: Math.round(y), c, n }); }
function sfx(S, n) { ev(S, { t: 'snd', n }); }
function floatText(S, x, y, s, c = '#fff1c6', size = 22) { ev(S, { t: 'txt', x: Math.round(x), y: Math.round(y), s, c, size }); }
function shake(S, v) { ev(S, { t: 'shake', v }); }
function ring(S, x, y, c, r = 220, life = 0.5) { ev(S, { t: 'ring', x: Math.round(x), y: Math.round(y), c, r, life }); }

/* ---------------- moves ---------------- */
const MOVES = {
  jab: { dur: 0.24, hitAt: 0.07, frames: [[0.06, 4], [1, 5]], dmg: 9, reach: 104, depth: 36, snd: 'punch' },
  jab2: { dur: 0.32, hitAt: 0.1, frames: [[0.06, 4], [1, 6]], dmg: 11, reach: 124, depth: 38, snd: 'kick' },
  fin: { dur: 0.42, hitAt: 0.13, frames: [[0.1, 8], [1, 9]], dmg: 15, reach: 160, depth: 42, snd: 'weapon', lunge: 90, sig: true },
  fin2: { dur: 0.56, hitAt: 0.2, frames: [[0.16, 8], [1, 10]], dmg: 24, reach: 180, depth: 46, knock: true, heavy: true, snd: 'weapon', lunge: 150, sig: true, big: true },
  shoot: { dur: 0.3, hitAt: 0.06, frames: [[1, 11]], dmg: 0, reach: 0, depth: 0, snd: null, gun: true },
  air: { dur: 9, hitAt: 0, frames: [[99, 6]], dmg: 15, reach: 120, depth: 44, knock: true, snd: 'kick', air: true },
  dash: { dur: 0.38, hitAt: 0.05, frames: [[1, 9]], dmg: 17, reach: 138, depth: 42, knock: true, snd: 'weapon', lunge: 420, multi: true, sig: true },
  knee: { dur: 0.26, hitAt: 0.1, frames: [[0.08, 4], [1, 6]], dmg: 8, reach: 70, depth: 30, snd: 'kick', grab: true },
  swing: { dur: 0.34, hitAt: 0.11, frames: [[0.1, 4], [1, 5]], dmg: 11, reach: 104, depth: 42, snd: 'weapon', weapon: true },
};

function heroOf(p) { return HEROES[p.hero]; }

const COMBO_NEXT = { 1: 'jab2', 2: 'fin', 3: 'fin2' };
const COMBO_STEP = { jab: 1, jab2: 2, fin: 3, fin2: 0 };
function startMove(S, p, name) {
  const m = MOVES[name];
  p.st = 'atk'; p.t = 0; p.atk = name; p.hit = new Set(); p._slashed = false;
  if (m.snd) sfx(S, m.snd);
}

/* =========================================================
   STEP
   ========================================================= */
function stepStage(S, ctrls, dt) {
  S.events.length = 0;
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  // boss presentation: the action waits (any ATTACK / START skips it)
  if (S.vs) {
    S.vs.t += dt;
    if (S.vs.t > 0.6 && Object.values(ctrls).some((c) => c.pressed.punch || c.pressed.start || c.pressed.jump)) S.vs.t = Math.max(S.vs.t, 4.1);
    if (S.vs.t > 4.6) S.vs = null; else return;
  }
  // last blow on a boss: slow motion
  if (S.slowT > 0) { S.slowT -= dt; dt *= 0.3; }
  S.t += dt;
  const L = S.L;
  if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }

  for (const p of S.players) stepPlayer(S, p, ctrls[p.id] || EMPTY_CTRL, dt);
  stepExtra(S, ctrls, dt);
  if (S.phase === 'morph' && S.players.every((p) => !p.civil)) { S.phase = 'stage'; S.banner = { text: L.place, sub: `CAPITOLO ${L.n} · ${L.title}`, t: 2.6 }; }
  tickCounters(S, dt);
  stepTeam(S, dt);
  if (!S.teamT) for (const e of S.enemies) stepEnemy(S, e, dt);
  S.enemies = S.enemies.filter((e) => !(e.st === 'dead' && e.t > 1.1));
  stepShots(S, dt);
  stepItems(S, dt);
  stepCivs(S, dt);
  stepMech(S, dt);
  stepZones(S, dt);
  stepCamera(S, dt);

  // team meter decays very slowly when nothing happens
  S.team = S.L.unarmored ? 0 : clamp(S.team, 0, 100);   // II cap. 3: no team power without the Cuori
  for (const pr of S.props) pr.shake = Math.max(0, pr.shake - dt);
}
const EMPTY_CTRL = { l: 0, r: 0, u: 0, d: 0, held: {}, pressed: {} };

function alivePlayers(S) { return S.players.filter((p) => !p.out && p.st !== 'dead' && p.st !== 'ko'); }
/* a KO player can be revived while at least one partner is still standing */
function canBeRevived(S, p) { return S.players.some((q) => q !== p && !q.out && q.st !== 'dead' && q.st !== 'ko'); }
function goDown(S, p) {
  p.hp = 0;
  if (canBeRevived(S, p)) { p.st = 'ko'; p.t = 0; p.koT = 8; p.rev = 0; floatText(S, p.x, p.y - 150, 'K.O.! AIUTATELO!', '#ffb0a0', 18); sfx(S, 'ko'); }
  else { p.st = 'dead'; p.t = 0; p.lives--; S.livesLost = (S.livesLost || 0) + 1; sfx(S, 'ko'); }
}

/* ---------------- player ---------------- */
function stepPlayer(S, p, c, dt) {
  const hero = heroOf(p);
  p.t += dt;
  p.inv = Math.max(0, p.inv - dt);
  p.comboT = Math.max(0, p.comboT - dt);
  p.tapT = Math.max(0, p.tapT - dt);
  if (!S.L.noRegen) p.en = Math.min(100, p.en + dt * 1.8 * (p.enRate || 1));
  if (p.ammo < 4) { p.ammoT += dt; if (p.ammoT > 5) { p.ammoT = 0; p.ammo++; } } else p.ammoT = 0;

  if (p.out) {
    // continue: press start/punch to jump back in
    if ((c.pressed.start || c.pressed.punch) && S.credits > 0 && !p.gone) {
      S.credits--; S.contUsed++;
      p.out = false; p.lives = 3; p.score = Math.floor(p.score / 2); p.hp = p.max; p.st = 'drop'; p.t = 0;
      p.x = S.cam + 200; p.y = 580; p.z = 500; p.vz = 0; p.inv = 2.5;
      floatText(S, p.x, p.y - 200, 'CONTINUA!', hero.color, 28);
    }
    return;
  }
  if (p.st === 'ko') {
    // on the floor, waiting for a partner: hold ATTACK close to them to revive
    p.koT -= dt;
    if (!p._revving) p.rev = Math.max(0, p.rev - dt * 0.35);
    p._revving = false;
    if (p.koT <= 0 || !canBeRevived(S, p)) { p.st = 'dead'; p.t = 0; p.lives--; S.livesLost = (S.livesLost || 0) + 1; }
    return;
  }
  if (p.riding) return;   // chapter 3: on the back of the Tiranno rosso (see extra.js)
  if (p.st === 'dead') {
    if (p.t > 1.6) {
      if (p.lives > 0) {
        p.st = 'drop'; p.t = 0; p.hp = p.max; p.en = Math.max(p.en, 50); p.inv = 3;
        p.x = clamp(p.x, S.cam + 120, S.cam + W - 120); p.z = 520; p.vz = 0; p.weapon = null;
      } else { p.out = true; }
    }
    return;
  }

  const dx = (c.r ? 1 : 0) - (c.l ? 1 : 0), dy = (c.d ? 1 : 0) - (c.u ? 1 : 0);
  if (p.civil) {
    // chapter 1 opening: civilian clothes, the first transformation is played by the player
    if (p.morphT > 0) {
      p.morphT -= dt;
      if (p.morphT <= 0) {
        p.civil = false; p.st = 'idle'; p.t = 0; p.inv = 1.2;
        ev(S, { t: 'flash', c: hero.glow, v: 0.5 }); ring(S, p.x, p.y, hero.color, 260, 0.6); sparks(S, p.x, p.y - 80, hero.glow, 30, 'fire');
        floatText(S, p.x, p.y - 190, hero.name + '!', hero.color, 30);
      }
      return;
    }
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * hero.speed * 0.8 * dt; p.y += (dy / len) * hero.speed * 0.5 * dt;
    if (dx) p.face = dx;
    p.st = dx || dy ? 'walk' : 'idle'; if (dx || dy) p.walk += dt * 9;
    p.x = clamp(p.x, S.cam + 40, S.cam + W - 40); p.y = clamp(p.y, FLOOR_TOP, FLOOR_BOTTOM);
    if (c.pressed.special || c.pressed.team || S.t > 12 + p.slot * 0.4) {
      p.morphT = 1.0; p.st = 'idle'; p.face = 1;
      sfx(S, 'morph'); ev(S, { t: 'morph', x: Math.round(p.x), y: Math.round(p.y), c: hero.color });
    }
    return;
  }
  const free = p.st === 'idle' || p.st === 'walk';
  // chapter 2: stepping into the gap between two wagons = falling off the train
  if (p.st !== 'fall' && p.z <= 0 && !['jump', 'drop', 'knock'].includes(p.st) && inGap(S.L, p.x, p.y)) {
    p.st = 'fall'; p.t = 0; p.hold = 0; p.atk = null; S.falls = (S.falls || 0) + 1;
    sfx(S, 'hurt'); floatText(S, p.x, p.y - 160, 'CADUTA!', '#ffb0a0', 20);
  }
  // double-tap to run
  if (free && c.pressed && (c.l || c.r)) {
    const dir = dx;
    if (dir && !p._prevDir) {
      if (p.tapT > 0 && p.tapDir === dir) p.run = true;
      p.tapT = 0.28; p.tapDir = dir;
    }
  }
  if (c.dash && dx && free) p.run = true;   // touch stick pushed all the way
  if (!dx) p.run = false;
  p._prevDir = dx;

  switch (p.st) {
    case 'idle': case 'walk': {
      // co-op: revive a KO partner (hold attack), throw a jumping partner, double grab
      if (c.pressed.punch || c.held.punch) {
        const ko = S.players.find((q) => q !== p && q.st === 'ko' && Math.abs(q.x - p.x) < 110 && Math.abs(q.y - p.y) < 44);
        if (ko) { p.st = 'revive'; p.t = 0; p.revId = ko.id; p.face = ko.x > p.x ? 1 : -1; break; }
      }
      if (c.pressed.punch) {
        const mate = S.players.find((q) => q !== p && q.st === 'jump' && !q.civil && Math.abs(q.x - p.x) < 80 && Math.abs(q.y - p.y) < 36 && q.z > 20 && q.z < 170);
        if (mate) { partnerThrow(S, p, mate); break; }
        const held = S.enemies.find((e) => e.st === 'held' && e.holder !== p.id && Math.abs(e.x - p.x) < 110 && Math.abs(e.y - p.y) < 34);
        if (held) { pairSlam(S, p, held); break; }
      }
      // titan summon: hold TEAM for a second (once per chapter, needs 3 sigils)
      if (c.held.team && !S.L.unarmored && S.team < 100 && S.summonOK && !S.summonUsed && !S.summon) {
        p.teamHold = (p.teamHold || 0) + dt;
        if (p.teamHold > 0.9) { p.teamHold = 0; summonTitan(S, p); break; }
      } else p.teamHold = 0;
      // grab: a stunned enemy right in front → attack (or walking into it) grabs it
      const gr = grabbable(S, p);
      if (gr && ((c.pressed.punch && gr.st === 'hurt') || (dx === p.face && !p.run && (p.pushT = (p.pushT || 0) + dt) > 0.15))) { p.pushT = 0; grab(S, p, gr); break; }
      if (!gr) p.pushT = 0;
      if (c.pressed.team && S.team >= 100 && !S.L.unarmored) { teamAttack(S, p); break; }
      if (c.pressed.special && !S.L.unarmored) { special(S, p); break; }
      if (c.pressed.jump) { p.st = 'jump'; p.t = 0; p.vz = S.L.lowGrav && !S.L.bonus ? 650 : 620; p.jdx = dx * (p.run ? 1.35 : 1); p.jdy = dy; sfx(S, 'jump'); break; }
      if (c.pressed.dodge && hero.id === 'kharon' && !dx) { p.st = 'parry'; p.t = 0; sfx(S, 'weapon'); break; }   // trait: Kharon parries
      if (c.pressed.dodge) { p.st = 'dodge'; p.t = 0; p.inv = 0.38; p.ddir = dx || -p.face; sfx(S, 'dodge'); break; }
      if (c.pressed.shoot) { p.aim = c.u ? 1 : 0; shoot(S, p); break; }
      if (c.pressed.punch) {
        if (p.run) { startMove(S, p, 'dash'); p.run = false; break; }
        const name = p.comboT > 0 ? COMBO_NEXT[p.combo] || 'jab' : 'jab';
        p.combo = COMBO_STEP[name];
        startMove(S, p, name);
        break;
      }
      // movement
      const sp = hero.speed * (p.run ? 1.55 : 1);
      const len = Math.hypot(dx, dy) || 1;
      tryMove(S, p, (dx / len) * sp * dt, (dy / len) * sp * 0.62 * dt);
      if (dx) p.face = dx;
      // walked off the edge of a car / dumpster → fall
      if (groundAt(S, p.x, p.y) < p.z - 2) { p.st = 'jump'; p.t = 0; p.vz = 0; p.jdx = 0; p.jdy = 0; p.airDone = true; break; }
      p.st = dx || dy ? 'walk' : 'idle';
      if (dx || dy) p.walk += dt * (p.run ? 13 : 8.5);
      break;
    }
    case 'jump': {
      p.z += p.vz * dt; p.vz -= (S.L.lowGrav && !S.L.bonus ? 1050 : 1500) * dt;
      // air control: the jump can be steered, needed to land on cars and dumpsters
      p.jdx = lerp(p.jdx, dx * (p.run ? 1.35 : 1), Math.min(1, dt * 8)); p.jdy = lerp(p.jdy, dy, Math.min(1, dt * 8));
      if (dx) p.face = dx;
      tryMove(S, p, p.jdx * hero.speed * 1.05 * dt, p.jdy * hero.speed * 0.55 * dt);
      // traits: Kathy jumps again in mid air, Kiki glides holding the jump button
      if (hero.id === 'lyra' && c.pressed.jump && !p.dbl && p.t > 0.08) { p.dbl = true; p.vz = 470; sfx(S, 'jump'); sparks(S, p.x, p.y - p.z, hero.glow, 8, 'trail'); }
      if (hero.id === 'aura' && c.held.jump && p.vz < -60) { p.vz = -60; p.glide = true; if (Math.random() < 0.4) sparks(S, p.x - p.face * 30, p.y - p.z - 80, hero.glow, 1, 'trail'); } else p.glide = false;
      if (c.pressed.punch && !p.airDone) { p.airDone = true; p.atk = 'air'; p.hit = new Set(); sfx(S, 'kick'); }
      if (c.pressed.shoot && p.ammo > 0 && !p.airShot) { p.airShot = true; p.aim = c.u ? 1 : c.d ? -1 : 0; fireBolt(S, p); }
      if (p.atk === 'air') hitScan(S, p, MOVES.air);
      { const gz = groundAt(S, p.x, p.y); if (p.z <= gz && p.vz <= 0) { p.z = gz; p.vz = 0; p.st = 'land'; p.t = 0; p.atk = null; p.airDone = false; p.airShot = false; p.dbl = false; p.glide = false; } }
      break;
    }
    case 'land': if (p.t > 0.08) p.st = 'idle'; break;
    case 'drop': {
      p.z = Math.max(groundAt(S, p.x, p.y), p.z - 900 * dt);
      if (p.z === groundAt(S, p.x, p.y)) { p.st = 'land'; p.t = 0; ring(S, p.x, p.y, hero.color, 160, 0.4); shake(S, 4); }
      break;
    }
    case 'dodge': {
      tryMove(S, p, p.ddir * 620 * dt * (1 - p.t / 0.3), 0);
      if (groundAt(S, p.x, p.y) < p.z - 2) { p.st = 'jump'; p.t = 0; p.vz = 0; p.jdx = 0; p.jdy = 0; p.airDone = true; break; }
      if (p.t > 0.3) p.st = c.held.dodge ? 'duck' : 'idle';
      break;
    }
    case 'duck': if (!c.held.dodge) { p.st = 'idle'; p.t = 0; } break;
    case 'parry': if (p.t > 0.45) { p.st = c.held.dodge ? 'duck' : 'idle'; p.t = 0; } break;   // crouched (tunnel beams pass over)
    case 'revive': {
      const q = S.players.find((qq) => qq.id === p.revId);
      if (!q || q.st !== 'ko' || !c.held.punch || Math.abs(q.x - p.x) > 130) { p.st = 'idle'; p.t = 0; break; }
      q._revving = true; q.rev += dt / 1.3;
      if (Math.random() < dt * 8) sparks(S, q.x, q.y - 40, heroOf(p).glow, 3, 'fire');
      if (q.rev >= 1) {
        q.st = 'getup'; q.t = 0; q.hp = Math.round(q.max * 0.45); q.inv = 2; q.rev = 0;
        ring(S, q.x, q.y, heroOf(q).color, 200, 0.6); ev(S, { t: 'pop', x: Math.round(q.x), y: Math.round(q.y - 200), s: 'IN PIEDI!', c: heroOf(q).color, big: 1 });
        sfx(S, 'morph'); p.score += 500; S.revives++; p.st = 'idle'; p.t = 0;
      }
      break;
    }
    case 'cannon': {
      // thrown by a partner: a human cannonball
      p.x += p.vx * dt; p.z += p.vz * dt; p.vz -= 1300 * dt;
      if (Math.random() < 0.7) sparks(S, p.x - p.face * 30, p.y - 60 - p.z, heroOf(p).glow, 2, 'trail');
      for (const e of S.enemies) if (hittable(e) && !p.hit.has(e.id) && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 44 && Math.abs((e.z || 0) - p.z) < 150) { p.hit.add(e.id); damageEnemy(S, p, e, 34 * heroOf(p).power, { knock: true, heavy: true }); }
      const gz = groundAt(S, p.x, p.y);
      if (p.z <= gz && p.vz < 0) { p.z = gz; p.st = 'land'; p.t = 0; ring(S, p.x, p.y, heroOf(p).color, 170, 0.4); shake(S, 6); sfx(S, 'stomp'); }
      break;
    }
    case 'pairslam': if (p.t > 0.62) { p.st = 'idle'; p.t = 0; } break;
    case 'atk': {
      const m = MOVES[p.atk];
      if (m.gun) {
        if (!p._swung && p.t >= m.hitAt) { p._swung = true; fireBolt(S, p); }
        if (c.pressed.shoot && p.t > 0.12) p.buffer = 'shoot';
        if (p.t >= m.dur) { p._swung = false; p.st = 'idle'; p.t = 0; if (p.buffer === 'shoot') { p.buffer = null; shoot(S, p); } p.buffer = null; }
        break;
      }
      if (m.lunge && p.t < m.dur * 0.6) tryMove(S, p, p.face * m.lunge * dt * (p.atk === 'dash' ? 1 : 2.2 * (1 - p.t / m.dur)), 0);
      if (m.sig && !p._slashed && p.t >= m.hitAt - 0.03) { p._slashed = true; ev(S, { t: 'wslash', x: Math.round(p.x), y: Math.round(p.y - p.z), f: p.face, c: heroOf(p).color, g: heroOf(p).glow, big: m.big ? 1 : 0, w: heroOf(p).id }); }
      if (p.t >= m.hitAt && (m.multi ? p.t < m.dur * 0.8 : !p._swung)) { hitScan(S, p, m); if (!m.multi) p._swung = true; }
      // buffered combo input
      if (c.pressed.punch && p.t > m.hitAt) p.buffer = 'punch';
      if (p.t >= m.dur) {
        p._swung = false; p.st = 'idle'; p.t = 0;
        if (['jab', 'jab2', 'fin'].includes(p.atk)) p.comboT = 0.45; else p.combo = 0;
        if (p.buffer === 'punch' && p.comboT > 0 && COMBO_NEXT[p.combo]) {
          const name = COMBO_NEXT[p.combo]; p.combo = COMBO_STEP[name]; startMove(S, p, name);
        }
        p.buffer = null;
      }
      break;
    }
    case 'grab': {
      const e = S.enemies.find((e) => e.id === p.hold);
      if (!e || e.st !== 'held') { p.st = 'idle'; p.hold = 0; break; }
      e.x = p.x + p.face * 52; e.y = p.y + 1; e.face = -p.face;
      if (c.pressed.punch && dx && dx !== p.face) {
        // back + attack: flip the enemy over the shoulder, behind you
        p.face = dx; e.x = p.x + p.face * 52; e.face = -p.face; throwEnemy(S, p, e);
      } else if (c.pressed.punch) {
        startMove(S, p, 'knee'); p.st = 'grabatk'; p.holdN++;
      } else if (c.pressed.jump || c.pressed.shoot || p.t > 2.2) {
        throwEnemy(S, p, e);
      }
      break;
    }
    case 'grabatk': {
      const e = S.enemies.find((e) => e.id === p.hold);
      if (!e) { p.st = 'idle'; break; }
      e.x = p.x + p.face * 52; e.y = p.y + 1;
      if (p.t > 0.1 && !p._swung) {
        p._swung = true;
        damageEnemy(S, p, e, 8 * heroOf(p).power, { noKnock: true, keepHeld: true });
      }
      if (p.t > 0.26) {
        p._swung = false; p.st = 'grab'; p.t = 0;
        if (p.holdN >= 3 && e.hp > 0) throwEnemy(S, p, e);
        if (e.hp <= 0) { p.st = 'idle'; p.hold = 0; }
      }
      break;
    }
    case 'throw': if (p.t > 0.3) p.st = 'idle'; break;
    case 'special': stepSpecial(S, p, dt); break;
    case 'pose': {
      if (p.t > 2.6) { p.st = 'idle'; p.teamTo = null; }
      break;
    }
    case 'hurt': if (p.t > 0.32) p.st = 'idle'; break;
    case 'knock': {
      p.x += p.vx * dt; p.vx *= 0.96;
      p.z += p.vz * dt; p.vz -= 1600 * dt;
      if (p.z <= groundAt(S, p.x, p.y) && p.t > 0.1) { p.z = groundAt(S, p.x, p.y); p.st = 'down'; p.t = 0; shake(S, 3); sfx(S, 'heavy'); if (p.hp <= 0) goDown(S, p); }
      break;
    }
    case 'down': if (p.t > 0.7) { p.st = 'getup'; p.t = 0; } break;
    case 'getup': if (p.t > 0.3) { p.st = 'idle'; p.inv = 1.1; } break;
    case 'fall': {
      p.z -= 900 * dt * Math.min(1, p.t * 3);
      if (p.t > 0.7) {
        p.hp -= 14; p.z = 0;
        // back on the roof of the nearest wagon, landing from above
        const wx = Math.round(p.x / WAGON) * WAGON, l = gapLeft(wx, p.y);
        const lo = S.cam + 40, hi = S.camLock !== null ? S.camLock + W - 40 : S.cam + W - 40;
        const left = l - 40, right = l + GAP_W + 40;
        p.x = (p.x - l < GAP_W / 2 && left >= lo) || right > hi ? left : right;
        if (p.hp <= 0) { p.hp = 0; p.st = 'dead'; p.t = 0; p.lives--; S.livesLost = (S.livesLost || 0) + 1; sfx(S, 'ko'); }
        else { p.st = 'drop'; p.t = 0; p.z = 420; p.inv = 1.8; }
      }
      return;
    }
  }
  // bounds
  const lo = S.cam + 40, hi = S.camLock !== null ? S.camLock + W - 40 : Math.min(S.L.length - 40, S.cam + W - 40);
  // soft invisible walls: near the edges of the arena you are gently pushed back toward the centre,
  // harder when enemies are cornering you, so nobody stays stuck against the border of the screen
  if (!['knock', 'fall', 'cannon', 'grab', 'grabatk'].includes(p.st) && p.z <= groundAt(S, p.x, p.y) + 2) {
    const EDGE = 120;
    const cornered = S.enemies.some((e) => e.hp > 0 && Math.abs(e.x - p.x) < 160 && Math.abs(e.y - p.y) < 60);
    const push = (cornered ? 260 : 150) * dt;
    if (p.x < lo + EDGE) tryMove(S, p, Math.min(lo + EDGE - p.x, push * (lo + EDGE - p.x) / EDGE), 0);
    if (p.x > hi - EDGE && (S.camLock !== null || S.escape)) tryMove(S, p, -Math.min(p.x - hi + EDGE, push * (p.x - hi + EDGE) / EDGE), 0);
  }
  if (p.st === 'knock' && (p.x <= lo || p.x >= hi)) { p.vx = -p.vx * 0.45; sparks(S, p.x, p.y - 60, '#ffffff', 6, 'dust'); }
  p.x = clamp(p.x, lo, hi);
  p.y = clamp(p.y, FOOT_TOP(), FLOOR_BOTTOM);

  // pickups (consumables are automatic)
  collectItems(S, p, p.x, p.y, 46, 30, p.z);
}
/* consumables within (rx, ry) of a point go to player p — also used by the titan in chapter 3 */
function collectItems(S, p, px, py, rx, ry, pz = 0) {
  for (const it of S.items) {
    const d = ITEMS[it.type];
    if (d.weapon || it.life <= 0 || Math.abs(it.z - pz) > 34) continue;
    if (Math.abs(it.x - px) < rx && Math.abs(it.y - py) < ry) {
      it.life = 0;
      if (d.heal) {
        p.hp = Math.min(p.max, p.hp + d.heal); floatText(S, p.x, p.y - 170, `+${d.heal}`, '#7bf0b1');
        // shared meal: partners close by get half of it
        for (const q of alivePlayers(S)) if (q !== p && Math.abs(q.x - p.x) < 280 && Math.abs(q.y - p.y) < 120 && q.hp < q.max) {
          const h = Math.round(d.heal * 0.5); q.hp = Math.min(q.max, q.hp + h); floatText(S, q.x, q.y - 170, `CONDIVISO +${h}`, '#7bf0b1', 16);
        }
      }
      if (d.energy) { p.en = Math.min(100, p.en + d.energy); floatText(S, p.x, p.y - 170, 'ENERGIA', '#77ceff'); }
      if (d.score) { p.score += d.score; floatText(S, p.x, p.y - 170, `+${d.score}`, '#ffd76a'); }
      if (d.team) S.team = Math.min(100, S.team + d.team);
      if (d.sigil) { if (!S.sigils.includes(it.sigil)) S.sigils.push(it.sigil); p.score += 2000; ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 210 - p.z), s: `SIGILLO ${S.sigils.length}/3`, c: '#ffd35a', big: 1 }); sfx(S, 'team'); }
      if (it.type === 'coin') S.coins++;
      if (it.type === 'gem') S.coins += 3;
      if (d.sigil) S.coins += 3;
      if (d.ammo) { p.ammo = Math.min(p.ammoMax || 20, p.ammo + d.ammo); floatText(S, p.x, p.y - 170, `+${d.ammo} COLPI`, '#bfe6ff'); sfx(S, 'reload'); }
      sfx(S, 'pickup');
    }
  }
}
/* chapter 2: after the boarding scene everybody is on the roof of the last wagon */
function boardTrain(S) {
  S.cam = S.L.train - 470;
  alivePlayers(S).forEach((p, i) => { p.x = S.cam + 220 + i * 70; p.y = 560 + (i % 2) * 50; p.st = 'idle'; p.z = 0; p.vz = 0; });
  for (const e of S.enemies) if (!e.boss && e.x < S.cam + 100) e.hp = 0;
}
function FOOT_TOP() { return FLOOR_TOP; }

function grabbable(S, p) {
  return S.enemies.find((e) => !e.boss && !e.big && !e.def.flying && !(e.def.shield && e.st !== 'hurt') && ['hurt', 'idle', 'walk'].includes(e.st) && Math.abs((e.z || 0) - p.z) < 20 && e.hp > 0 &&
    Math.abs(e.y - p.y) < 24 && (e.x - p.x) * p.face > 0 && Math.abs(e.x - p.x) < 80);
}
/* the blaster: few shots, magazines are rare */
function shoot(S, p) {
  if (S.L.unarmored) return;   // II cap. 3: no blaster without the armour
  if (p.ammo <= 0) { sfx(S, 'empty'); floatText(S, p.x, p.y - 170, 'SCARICA!', '#ff9a8a', 16); p.st = 'atk'; p.atk = 'shoot'; p.t = 0.2; p._swung = true; p.hit = new Set(); return; }
  startMove(S, p, 'shoot');
}
const PRISONER_BONUS = [['chicken', 'POLLO!'], ['ammo', 'MUNIZIONI!'], ['energy', 'ENERGIA!'], ['gem', 'GEMMA!'], ['pizza', 'PIZZA!'], ['coin', 'MONETA!']];
function hitCage(S, c, p) {
  c.cageHp = (c.cageHp ?? 3) - 1; c.shake = 0.2;
  sparks(S, c.x, c.y - 80, '#c07bff', 8); sfx(S, 'hit');
  if (c.cageHp > 0) return;
  freePrisoner(S, c, p, true);
}
function freePrisoner(S, c, p, bonus) {
  c.caged = false; c.mode = 'saved'; c.face = -1; c.t = 0; S.saved++;
  ev(S, { t: 'uncage', x: Math.round(c.x), y: Math.round(c.y) }); sfx(S, 'confirm');
  if (!bonus) return;
  // the freed prisoner drops a present, like the hostages of the arcades
  const [type, label] = PRISONER_BONUS[(S.freed = (S.freed || 0) + 1) % PRISONER_BONUS.length];
  const it = makeItem(type, c.x + 40, c.y, 40); it.vz = 320; S.items.push(it);
  if (Math.random() < 0.35) { const w = makeItem('pipe', c.x - 40, c.y, 40); w.vz = 300; S.items.push(w); }
  S.coins += 2;
  if (p) p.score += 1000;
  ev(S, { t: 'pop', x: Math.round(c.x), y: Math.round(c.y - 200), s: 'LIBERATO! +1000', c: '#7bf0b1' });
  floatText(S, c.x, c.y - 160, 'GRAZIE! ' + label, '#ffe08a', 18);
}
function fireBolt(S, p) {
  p.ammo--;
  const hero = heroOf(p);
  const aim = p.aim || 0;
  S.shots.push({ id: nid(), kind: 'bolt', x: p.x + p.face * 70, y: p.y, z: p.z + 104, vz: aim * 760, vx: p.face * (aim ? 900 : 1250), owner: p.id, life: 0.95, dmg: 9 * hero.power, hit: new Set(), friendly: true, stun: true, c: hero.glow, single: true, aim });
  sfx(S, 'shot');
  ev(S, { t: 'spark', x: Math.round(p.x + p.face * 86), y: Math.round(p.y - 104), c: hero.glow, n: 5 });
}

function grab(S, p, e) {
  floatText(S, e.x, e.y - 170, 'PRESO!', '#ffe08a', 20);
  p.st = 'grab'; p.t = 0; p.hold = e.id; p.holdN = 0;
  e.st = 'held'; e.t = 0; e.holder = p.id;
  sfx(S, 'punch');
}
function throwEnemy(S, p, e) {
  e.st = 'thrown'; e.t = 0; e.vx = p.face * 560; e.vz = 330; e.z = 30; e.thrower = p.id; e.face = -p.face;
  p.st = 'throw'; p.t = 0; p.hold = 0;
  damageEnemy(S, p, e, 10 * heroOf(p).power, { noKnock: true, keepHeld: true, silent: true });
  sfx(S, 'heavy');
}

function hitScan(S, p, m) {
  const hero = heroOf(p);
  let reach = m.reach, dmg = m.dmg * hero.power * (S.L.unarmored ? 0.75 : 1), depth = m.depth;
  if (hero.id === 'azur') reach += 34;   // trait: the trident reaches further
  if (m.weapon && p.weapon) { reach += ITEMS[p.weapon.type].reach; dmg *= ITEMS[p.weapon.type].dmg; }
  let landed = false;
  for (const e of S.enemies) {
    if (p.hit.has(e.id) || !hittable(e)) continue;
    const rx = (e.x - p.x) * p.face;
    const w = e.boss || e.big ? 60 : 0;
    if (rx > -25 && rx < reach + w && Math.abs(e.y - p.y) < depth + (e.boss ? 18 : 0) && Math.abs((e.z || 0) - p.z) < 90) {
      p.hit.add(e.id);
      landed = true;
      damageEnemy(S, p, e, dmg, { knock: m.knock || (m.air && true), heavy: m.knock });
      if (hero.id === 'ignis' && m.sig) { e.burn = 2.2; e.burnBy = p.id; }   // trait: the fire sword sets enemies alight
    }
  }
  for (const o of S.props) {
    if (o.hp <= 0 || p.hit.has(o.id)) continue;
    const rx = (o.x - p.x) * p.face;
    if (rx > -20 && rx < reach + 10 && Math.abs(o.y - p.y) < 40) { p.hit.add(o.id); hitProp(S, o, p); landed = true; }
  }
  // chapter 2: hit the cage to free the prisoner (Metal Slug style): they thank you and leave a bonus
  for (const c of S.civs) {
    if (!c.caged || p.hit.has(c.id)) continue;
    const rx = (c.x - p.x) * p.face;
    if (rx > -25 && rx < reach + 20 && Math.abs(c.y - p.y) < depth + 20) { p.hit.add(c.id); hitCage(S, c, p); landed = true; }
  }
  if (landed && m.weapon && p.weapon) {
    p.weapon.uses--;
    if (p.weapon.uses <= 0) { floatText(S, p.x, p.y - 170, 'ARMA ROTTA', '#c0c8d0', 16); sparks(S, p.x + p.face * 60, p.y - 90, '#c8d2dc', 14); p.weapon = null; }
  }
}
function hittable(e) { return e.hp > 0 && !['dead', 'down', 'thrown', 'held', 'burrow', 'gone', 'rise', 'slam', 'fall', 'roar'].includes(e.st) && !(e.st === 'knock' && e.t > 0.05) && e.inv <= 0; }

function hitProp(S, o, who) {
  if (PROPS[o.type] && PROPS[o.type].deco) return;   // scenery (II: the fallen capsule)
  if (mechHitProp(S, o, who)) return;
  o.hp--; o.shake = 0.2;
  sparks(S, o.x, o.y - 30, '#d9a66b', 8, 'chip');
  sfx(S, 'break');
  if (o.hp > 0) return;
  const def = PROPS[o.type];
  if (who && who.score !== undefined) who.score += 100;
  if (o.type === 'crate' || o.type === 'bin') ev(S, { t: 'debris', x: o.x, y: o.y, k: o.type });
  if (def.explode) {
    ev(S, { t: 'boom', x: o.x, y: o.y - 30 }); sfx(S, 'boom'); shake(S, 14); S.hitstop = 0.05;
    for (const e of S.enemies) if (hittable(e) && Math.hypot(e.x - o.x, (e.y - o.y) * 1.6) < 190) damageEnemy(S, who, e, e.boss ? 45 : 60, { knock: true, heavy: true, from: o.x });
    for (const p of S.players) if (Math.hypot(p.x - o.x, (p.y - o.y) * 1.6) < 150 && p.inv <= 0 && p.st !== 'dead') hurtPlayer(S, p, 12, { knock: true, from: o.x });
    for (const q of S.props) if (q !== o && q.hp > 0 && Math.hypot(q.x - o.x, q.y - o.y) < 170) hitProp(S, q, who);
  }
  if (o.sigil !== undefined) { const it = makeItem('sigil', o.x, o.y, 30); it.vz = 300; it.sigil = o.sigil; S.items.push(it); ev(S, { t: 'pop', x: o.x, y: o.y - 120, s: 'SEGRETO!', c: '#ffd35a' }); }
  const drops = def.drops;
  if (drops.length) {
    // a guaranteed useful drop, weighted by need
    const lowHp = S.players.some((p) => p.hp < p.max * 0.5);
    let type = lowHp && Math.random() < 0.6 ? (Math.random() < 0.35 ? 'chicken' : 'pizza') : pick(drops);
    const it = makeItem(type, o.x, o.y, 30); it.vz = 260; S.items.push(it);
  }
}

function damageEnemy(S, p, e, dmg, opt = {}) {
  // II: the generals carry armour pieces that must be broken first (they soak most of the damage)
  if (e.boss && e.parts && e.parts.length && dmg > 0) {
    const part = e.parts[0];
    part.hp -= dmg * (opt.heavy ? 1.6 : 1);
    dmg *= 0.3;
    sparks(S, e.x - e.face * 30, e.y - 150, '#ffcf8a', 8);
    if (part.hp <= 0) {
      e.parts.shift();
      ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 280), s: part.name + ' ROTTO!', c: '#ffd35a', big: 1 }); sfx(S, 'break'); shake(S, 10);
      sparks(S, e.x, e.y - 140, '#ffb05a', 30, 'fire');
      if (!e.parts.length) { e.broken = true; ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 320), s: 'NUCLEO SCOPERTO!', c: '#ff6a5a', big: 1 }); }
    }
  }
  if (e.guarding && !opt.unblockable && p) {
    const from = opt.from !== undefined ? opt.from : p.x;
    if ((from - e.x) * e.face > 0) {
      // guard: hits from the front wear it down (weapon and heavy blows much more) and only scratch the boss
      e.gm -= dmg * (opt.heavy ? 2.4 : 1.3);
      sparks(S, e.x + e.face * 50, e.y - 130, '#e8f4ff', 12); sfx(S, 'weapon');
      if (e.gm <= 0) {
        e.guarding = false; e.st = 'hurt'; e.t = 0; e.broken = true;
        ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 260), s: 'GUARDIA ROTTA!', c: '#ffd35a', big: 1 }); ev(S, { t: 'flash', c: '#ffffff', v: 0.3 }); sfx(S, 'boom'); shake(S, 10);
      } else { dmg = dmg * 0.2; if (p.x !== undefined && p.face) p.x -= p.face * 22; }
    }
  }
  if (!e.boss && e.def.shield && !opt.heavy && !opt.unblockable && !opt.keepHeld && ['idle', 'walk', 'wind', 'atk', 'block', 'enter'].includes(e.st)) {
    const from = opt.from !== undefined ? opt.from : p ? p.x : e.x;
    if ((from - e.x) * e.face > 0) {
      // riot shield: only heavy blows (weapon finisher, running strike, specials) or hits from behind get through
      e.st = 'block'; e.t = 0; sparks(S, e.x + e.face * 40, e.y - 100, '#d0b0ff', 10); sfx(S, 'weapon');
      if (p && p.face) p.x -= p.face * 12;
      if (Math.random() < 0.35) floatText(S, e.x, e.y - 185, 'SCUDO! COLPO FORTE O ALLE SPALLE', '#d0b0ff', 13);
      return;
    }
  }
  dmg = Math.round(dmg);
  e.hp -= dmg;
  e.flash = 0.08;
  if (p && p.score !== undefined) {
    p.score += dmg * 10; p.hits++;
    p.combo2 = (p.comboHitT > 0 ? (p.combo2 || 0) + 1 : 1); p.comboHitT = 1.4; p.maxCombo = Math.max(p.maxCombo, p.combo2);
    p.en = Math.min(100, p.en + (S.L.noRegen ? 2 : 4));
    S.team = Math.min(100, S.team + dmg * 0.18);
  }
  const col = e.boss ? '#ffc052' : e.def && e.def.shade ? '#c79bff' : '#a58cff';
  if ((opt.heavy || e.hp <= 0) && p && p.hero !== undefined && Math.random() < (e.boss ? 0.5 : 0.8)) ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - (e.boss ? 200 : 140)), s: pick(['BAM!', 'POW!', 'CRASH!', 'WHAM!', 'SBAM!', 'KRAK!']), c: HEROES[p.hero].color });
  sparks(S, e.x + (p ? -p.face * 10 : 0), e.y - (e.boss ? 150 : 95) - (e.z || 0), col, e.boss ? 14 : 10);
  if (!opt.silent) sfx(S, opt.heavy ? 'heavy' : 'hit');
  shake(S, opt.heavy ? 6 : 3);
  S.hitstop = opt.heavy ? 0.07 : 0.035;
  const from = opt.from !== undefined ? opt.from : p ? p.x : e.x - e.face;
  const dir = e.x >= from ? 1 : -1;
  if (e.boss) {
    e.poise = (e.poise || 0) + dmg;
    if (e.poise > (e.big ? 999 : 70) && !['atk', 'dash', 'teleport', 'burrow'].includes(e.st)) { e.poise = 0; e.st = 'hurt'; e.t = 0; }
    if (e.hp <= 0) killBoss(S, e, p);
    return;
  }
  if (opt.keepHeld && e.st === 'held' && e.hp > 0) return;
  if (e.hp <= 0 || opt.knock) {
    e.st = 'knock'; e.t = 0; e.vx = dir * (opt.heavy ? 380 : 300); e.vz = 380; e.z = Math.max(e.z || 0, 1); e.face = -dir;
    if (e.holder) { const h = S.players.find((q) => q.id === e.holder); if (h && h.hold === e.id) { h.hold = 0; h.st = 'idle'; } e.holder = 0; }
  } else if (!opt.noKnock) {
    e.st = 'hurt'; e.t = 0; e.x += dir * 16; e.face = -dir;
  }
  if (e.hp <= 0) {
    e.killer = p ? p.id : 0;
    if (p && p.score !== undefined) { p.score += e.def.score; p.kos++; }
    // drops: every few KOs something useful
    S.koCount = (S.koCount || 0) + 1;
    if (S.koCount % 3 === 0) { const it = makeItem(Math.random() < 0.5 ? 'ammo' : pick(['energy', 'coin', 'can', 'pizza']), e.x, e.y, 40); it.vz = 220; S.items.push(it); }
    if (S.koCount % 9 === 0) { const it = makeItem('gem', e.x + 20, e.y, 40); it.vz = 260; S.items.push(it); }
  }
}

function hurtPlayer(S, p, dmg, opt = {}) {
  if (p.inv > 0 || p.st === 'dead' || p.st === 'ko' || p.out || p.st === 'down' || p.st === 'knock' || p.st === 'pose' || p.st === 'cannon' || p.st === 'pairslam') return false;
  if (p.riding) return hurtRide(S, dmg, opt);
  const hid = heroOf(p).id;
  if (p.st === 'parry' && ((opt.from ?? p.x + p.face) - p.x) * p.face >= 0) {
    // Kharon's parry: the blow is deflected and the attacker is left open
    sparks(S, p.x + p.face * 50, p.y - 110, '#ffffff', 14, 'slash'); sfx(S, 'weapon'); ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 200), s: 'PARATA!', c: heroOf(p).color });
    for (const e of S.enemies) if (!e.boss && e.hp > 0 && (e.x - p.x) * p.face > 0 && Math.abs(e.x - p.x) < 170 && Math.abs(e.y - p.y) < 50) { e.st = 'hurt'; e.t = -0.7; }
    p.inv = 0.3; S.team = Math.min(100, S.team + 4);
    return false;
  }
  // trait: Don doesn't flinch under light blows and takes a bit less damage
  if (hid === 'onyx' && !opt.knock && dmg <= 12 && p.hp > dmg && p.z <= 0 && !['grab', 'grabatk'].includes(p.st)) {
    dmg = Math.max(1, Math.round(dmg * DIFF.dmg * 0.8)); p.hp -= dmg; S.dmgTaken += dmg; p.inv = 0.35;
    sparks(S, p.x, p.y - 95, '#e3ecf5', 8); sfx(S, 'hit'); p.flash = 0.1;
    return true;
  }
  if (p.st === 'grab' || p.st === 'grabatk') {
    const e = S.enemies.find((e) => e.id === p.hold); if (e) { e.st = 'hurt'; e.t = 0; e.holder = 0; } p.hold = 0;
  }
  dmg = Math.max(1, Math.round(dmg * DIFF.dmg));
  p.hp -= dmg; S.dmgTaken += dmg; p.combo = 0; p.run = false; p.buffer = null;
  sparks(S, p.x, p.y - 95 - p.z, '#ff6a5e', 12);
  sfx(S, 'hurt'); shake(S, 7);
  const from = opt.from !== undefined ? opt.from : p.x - p.face;
  const dir = p.x >= from ? 1 : -1;
  if (p.hp <= 0 || opt.knock || p.z > 0) {
    p.hp = Math.max(0, p.hp);
    p.st = 'knock'; p.t = 0; p.vx = dir * 300; p.vz = 360; p.z = Math.max(p.z, 1); p.face = -dir; p.atk = null;
  } else { p.st = 'hurt'; p.t = 0; p.x += dir * 14; p.atk = null; }
  p.inv = 0.5;
  return true;
}

/* ---------------- specials ---------------- */
function special(S, p) {
  if (S.L.unarmored) { floatText(S, p.x, p.y - 190, 'NIENTE POTERI!', '#ff9a8a', 16); return; }
  const hero = heroOf(p);
  if (p.en < 40) {
    // desperation: costs health like classic arcades
    if (p.hp > 12) { p.hp -= 8; floatText(S, p.x, p.y - 170, '-8', '#ff8a7a', 16); } else { sfx(S, 'hurt'); return; }
  } else p.en -= 40;
  // the special is always thrown into the arena: face the side with more enemies (or the centre when at a border)
  {
    const lo = S.cam + 40, hi = S.camLock !== null ? S.camLock + W - 40 : S.cam + W - 40;
    let l = 0, r = 0;
    for (const e of S.enemies) if (e.hp > 0 && e.x > S.cam - 20 && e.x < S.cam + W + 20) { const w = (e.boss ? 3 : 1) * (Math.abs(e.x - p.x) < 300 ? 3 : 1); if (e.x < p.x) l += w; else r += w; }
    if (l || r) p.face = r >= l ? 1 : -1;
    else if (p.x < lo + 200) p.face = 1; else if (p.x > hi - 200) p.face = -1;
    if (p.x < lo + 80 && p.face === 1 || p.x > hi - 80 && p.face === -1) p.x += p.face * 40;   // step off the border
  }
  p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 0.7; p.spk = hero.id; ev(S, { t: 'snd', n: 'shout' + p.hero });
  sfx(S, 'special'); ev(S, { t: 'flash', c: hero.glow, v: 0.25 });
  ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 200), s: hero.special + '!', c: hero.color, big: 1 });
  S.hitstop = 0.06;
}
function stepSpecial(S, p, dt) {
  const hero = heroOf(p);
  const k = p.spk;
  const hitAll = (fn, dmg, knock = true) => {
    for (const e of S.enemies) if (hittable(e) && !p.hit.has(e.id) && fn(e)) { p.hit.add(e.id); damageEnemy(S, p, e, dmg * hero.power, { knock, heavy: true }); }
    for (const o of S.props) if (o.hp > 0 && !p.hit.has(o.id) && fn(o)) { p.hit.add(o.id); hitProp(S, o, p); }
  };
  if (k === 'ignis') {
    // sword, medium range: a crescent of fire slashed forward (~420 px)
    if (p.t > 0.16 && !p._s1) {
      p._s1 = 1; shake(S, 8); sfx(S, 'heavy');
      S.shots.push({ id: nid(), kind: 'flame', x: p.x + p.face * 70, y: p.y, z: 80, vx: p.face * 820, owner: p.id, life: 0.5, dmg: 42 * hero.power, hit: new Set(), friendly: true });
      sparks(S, p.x + p.face * 80, p.y - 90, '#ff8a3a', 24, 'fire');
    }
    if (p.t > 0.16 && p.t < 0.3) hitAll((e) => (e.x - p.x) * p.face > -20 && Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 50, 20);
    if (p.t > 0.55) end();
  } else if (k === 'azur') {
    if (p.t < 0.45) { p.x += p.face * 820 * dt; if (Math.random() < 0.6) sparks(S, p.x - p.face * 40, p.y - 70, '#8cc4ff', 3, 'trail'); }
    hitAll((e) => Math.abs(e.x - p.x) < 95 && Math.abs(e.y - p.y) < 55, 40);
    if (p.t > 0.62) end();
  } else if (k === 'lyra') {
    const n = Math.floor(p.t / 0.08);
    if (n !== p._n && p.t < 0.72) {
      p._n = n; p.hit = new Set(); p.face = n % 2 ? -p.face : p.face;
      sparks(S, p.x + p.face * 70, p.y - 90, '#ffe98a', 6, 'slash');
      hitAll((e) => Math.abs(e.x - p.x) < 120 && Math.abs(e.y - p.y) < 48, 10, n >= 8);
    }
    if (p.t > 0.8) end();
  } else if (k === 'aura') {
    if (p.t > 0.2 && !p._s1) {
      p._s1 = 1;
      // bow, long range: three winged arrows across the whole screen
      for (const dy of [-46, 0, 46]) S.shots.push({ id: nid(), kind: 'wing', x: p.x + p.face * 60, y: clamp(p.y + dy, FLOOR_TOP, FLOOR_BOTTOM), z: 80, vx: p.face * (980 - Math.abs(dy) * 2), owner: p.id, life: 1.5, dmg: 30 * hero.power, hit: new Set(), friendly: true });
      sfx(S, 'laser');
    }
    if (p.t > 0.5) end();
  } else if (k === 'kharon') {
    // Veil sword: two blade waves along the floor (long range)
    if (p.t > 0.18 && !p._s1) {
      p._s1 = 1; sfx(S, 'laser'); shake(S, 6);
      for (const dy of [-34, 34]) S.shots.push({ id: nid(), kind: 'wave', x: p.x + p.face * 70, y: clamp(p.y + dy, FLOOR_TOP, FLOOR_BOTTOM), z: 0, vx: p.face * 760, owner: p.id, life: 1.2, dmg: 34 * hero.power, hit: new Set(), friendly: true });
    }
    if (p.t > 0.5) end();
  } else if (k === 'rigel') {
    // light blade: one long crescent that crosses the screen
    if (p.t > 0.16 && !p._s1) {
      p._s1 = 1; sfx(S, 'laser'); shake(S, 6);
      S.shots.push({ id: nid(), kind: 'wave', x: p.x + p.face * 70, y: p.y, z: 0, vx: p.face * 900, owner: p.id, life: 1.3, dmg: 40 * hero.power, hit: new Set(), friendly: true, c: '#8fd8ff' });
      sparks(S, p.x + p.face * 80, p.y - 90, '#8fd8ff', 20, 'slash');
    }
    if (p.t > 0.16 && p.t < 0.3) hitAll((e) => (e.x - p.x) * p.face > -20 && Math.abs(e.x - p.x) < 160 && Math.abs(e.y - p.y) < 50, 22);
    if (p.t > 0.5) end();
  } else if (k === 'onyx') {
    // axe, close range: overhead smash that splits the ground
    if (p.t > 0.3 && !p._s1) { p._s1 = 1; ring(S, p.x + p.face * 70, p.y, '#e3ecf5', 220, 0.55); ev(S, { t: 'crack', x: p.x + p.face * 70, y: p.y }); shake(S, 18); sfx(S, 'stomp'); }
    if (p.t > 0.3) hitAll((e) => Math.hypot(e.x - (p.x + p.face * 60), (e.y - p.y) * 1.6) < 190, 60);
    if (p.t > 0.7) end();
  }
  function end() { p.st = 'idle'; p.t = 0; p._s1 = 0; p._n = -1; }
}

/* COLPO DI SQUADRA, right in the arena: the heroes line up where they are, the Sentinels who are not
   playing appear in columns of light, the weapons join into the Cannone Primordiale above the leader
   and it fires across the battlefield (2.6 s) */
function teamAttack(S, p) {
  if (S.L.unarmored) return;
  S.team = 0;
  sfx(S, 'team');
  const al = alivePlayers(S);
  const lo = S.cam + 60, hi = (S.camLock !== null ? S.camLock : S.cam) + W - 60;
  let l = 0, r = 0;
  for (const e of S.enemies) if (e.hp > 0 && e.x > S.cam - 20 && e.x < S.cam + W + 20) { if (e.x < p.x) l += e.boss ? 3 : 1; else r += e.boss ? 3 : 1; }
  const f = l || r ? (r >= l ? 1 : -1) : (p.x < (lo + hi) / 2 ? 1 : -1);
  const x0 = f > 0 ? clamp(p.x, lo + 300, lo + 480) : clamp(p.x, hi - 480, hi - 300);
  const y0 = clamp(p.y, FLOOR_TOP + 70, FLOOR_BOTTOM - 70);
  const order = [p, ...al.filter((q) => q !== p)];
  const extra = [0, 1, 2, 3, 4].filter((h) => !al.some((q) => q.hero === h));
  const slots = [...order.map((q) => [q.hero, 1]), ...extra.map((h) => [h, 0])].slice(0, 6).map(([h, pl], i) => {
    const dy = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 42;
    const sx = x0 - f * (40 + 55 * i) + (i === 0 ? f * 40 : 0);
    let sy = clamp(y0 + dy, FLOOR_TOP + 6, FLOOR_BOTTOM);
    const blk = blockedFor(S, sx, sy); if (blk) sy = clamp(blk.y + 14, FLOOR_TOP + 6, FLOOR_BOTTOM);   // not inside a car or a dumpster
    return [Math.round(sx), Math.round(sy), h, pl];
  });
  order.forEach((q, i) => { q.st = 'pose'; q.t = 0; q.inv = 3.2; q.atk = null; q.teamTo = [slots[i][0], slots[i][1]]; q.face = f; q.hold = 0; q.teamLead = i === 0; });
  ev(S, { t: 'team', heroes: al.map((q) => q.hero), arena: 1, f, slots });
  S.teamT = 2.6;
  S.hitstop = 0.1;
}

/* ---------------- enemies ---------------- */
function spawnEnemy(S, type, x, y, extra = {}) {
  const d = ENEMIES[type];
  const lvlBoost = (1 + S.lvl * 0.09) * DIFF.hp * (S.boost || 1);
  const e = {
    id: nid(), type, def: d, x, y, z: 0, vz: 0, vx: 0, face: x < S.cam + W / 2 ? 1 : -1,
    hp: Math.round(d.hp * lvlBoost), max: Math.round(d.hp * lvlBoost), st: 'enter', t: 0, cool: rand(0.4, 1.4), inv: 0, flash: 0,
    target: 0, walk: Math.random() * 3, side: Math.random() < 0.5 ? -1 : 1, ...extra,
  };
  if (d.shade) {
    const hs = S.players.length ? S.players.map((p) => p.hero) : [0, 1, 2, 3, 4];
    e.shadeHero = pick(hs);
  }
  S.enemies.push(e);
  return e;
}

function nearestPlayer(S, e) {
  let best = null, bd = 1e9;
  for (const p of S.players) {
    if (p.out || p.st === 'dead' || p.st === 'ko') continue;
    const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 1.5 + (p.id === e.target ? -120 : 0);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function stepEnemy(S, e, dt) {
  e.t += dt;
  e.inv = Math.max(0, e.inv - dt);
  e.flash = Math.max(0, (e.flash || 0) - dt);
  if (e.burn > 0 && e.hp > 0) {
    e.burn -= dt; e.burnT = (e.burnT || 0) + dt;
    if (Math.random() < dt * 14) sparks(S, e.x + rand(-20, 20), e.y - rand(40, 130) - (e.z || 0), pick(['#ff8a3a', '#ffd35a']), 1, 'fire');
    if (e.burnT > 0.5) { e.burnT = 0; const by = S.players.find((q) => q.id === e.burnBy); e.hp -= 3; if (by) by.score += 30; if (e.hp <= 0) { e.hp = 1; damageEnemy(S, by, e, 2, { knock: true, silent: true }); } }
  }
  if (e.boss) return stepBoss(S, e, dt);
  const d = e.def;
  const scale = 1 + S.lvl * 0.04;
  if (d.flying && ['enter', 'idle', 'walk', 'wind', 'atk', 'hurt'].includes(e.st)) { stepDrone(S, e, dt); return; }
  switch (e.st) {
    case 'enter': {
      // walk into the arena from off-screen (sides or from below the screen)
      const tx = clamp(e.x, S.cam + 80, S.cam + W - 80);
      e.x += Math.sign(tx - e.x) * d.speed * 1.2 * dt;
      if (e.y > FLOOR_BOTTOM) e.y -= d.speed * 0.9 * dt;
      e.walk += dt * 8;
      if ((Math.abs(tx - e.x) < 6 && e.y <= FLOOR_BOTTOM) || e.t > 4) { e.st = 'walk'; e.t = 0; }
      break;
    }
    case 'rise': {
      // climbing out of a Veil portal opened in the floor
      e.z = -150 + Math.min(1, e.t / 0.9) * 150;
      if (e.t > 0.9) { e.z = 0; e.st = 'walk'; e.t = 0; e.inv = 0; }
      break;
    }
    case 'idle': case 'walk': {
      const p = nearestPlayer(S, e);
      if (!p) { e.st = 'idle'; break; }
      e.target = p.id;
      e.cool -= dt * d.aggro * scale * DIFF.aggro;
      // how many are already attacking this player?
      const attackers = S.enemies.filter((o) => o !== e && !o.boss && o.target === p.id && ['wind', 'atk'].includes(o.st)).length;
      const close = S.enemies.filter((o) => o !== e && !o.boss && o.target === p.id && Math.abs(o.x - p.x) < d.reach + 30 && o.hp > 0).length;
      const side = e.x < p.x ? -1 : 1;
      const wantDist = d.ranged ? 360 : close >= 2 && attackers >= 1 ? 230 : d.reach * 0.78;
      const bigT = p.riding ? 240 : 0;   // the titan is huge: they fight it at its snout or its tail
      if (d.blink) {
        e.blinkT = (e.blinkT ?? rand(2, 4)) - dt;
        if (e.blinkT <= 0 && Math.abs(p.x - e.x) > 140) {
          e.blinkT = rand(3, 5); sparks(S, e.x, e.y - 80, '#b77dff', 16, 'fire');
          e.x = clamp(p.x - p.face * 95, S.cam + 40, S.cam + W - 40); e.y = p.y; e.face = p.x > e.x ? 1 : -1;
          sparks(S, e.x, e.y - 80, '#b77dff', 16, 'fire'); sfx(S, 'dodge'); e.cool = Math.min(e.cool, 0.25);
        }
      }
      const tx = p.x + side * (wantDist + bigT);
      const ty = p.y + (close >= 2 ? (e.id % 3 - 1) * 40 : 0);
      const ddx = tx - e.x, ddy = ty - e.y;
      e.face = p.x > e.x ? 1 : -1;
      if (Math.abs(ddx) > 10 || Math.abs(ddy) > 8) {
        const sp = d.speed * scale;
        // cars, dumpsters and shelters are obstacles for the soldiers (they don't climb on them)
        const mx = clamp(ddx, -1, 1) * Math.min(Math.abs(ddx), sp * dt), my = clamp(ddy, -1, 1) * Math.min(Math.abs(ddy), sp * 0.6 * dt);
        if (groundAt(S, e.x + mx, e.y + my) <= 40 || (e.z || 0) > 40) { e.x += mx; e.y += my; }
        else if (groundAt(S, e.x + mx, e.y) <= 40) e.x += mx;
        else {
          // walk around the obstacle: to its front or back edge, whichever is nearer (and inside the street)
          const b = S.plats.find((q) => q.h > 40 && e.x + mx * 4 > q.x - q.w / 2 && e.x + mx * 4 < q.x + q.w / 2 && e.y > q.y - q.d - 2 && e.y <= q.y + 2);
          let dir = e.y < 600 ? -1 : 1;
          if (b) { const front = b.y + 14, back = b.y - b.d - 14; dir = (back < FLOOR_TOP + 4 || (front <= FLOOR_BOTTOM && front - e.y < e.y - back)) ? 1 : -1; }
          const ny = clamp(e.y + dir * sp * 0.7 * dt, FLOOR_TOP, FLOOR_BOTTOM);
          if (groundAt(S, e.x, ny) <= 40) e.y = ny;
        }
        e.st = 'walk'; e.walk += dt * 7.5;
      } else e.st = 'idle';
      const inRange = d.ranged ? Math.abs(p.x - e.x) < 520 && Math.abs(p.y - e.y) < 90 : Math.abs(p.x - e.x) < d.reach + 8 + bigT && Math.abs(p.y - e.y) < (bigT ? 60 : 22);
      if (inRange && e.cool <= 0 && attackers < 2 && Math.abs(p.z - (e.z || 0)) < 60) {
        e.st = 'wind'; e.t = 0; e.kick = Math.random() < 0.35;
        sfx(S, 'wind');
      }
      break;
    }
    case 'wind': if (e.t > d.wind) { e.st = 'atk'; e.t = 0; e.didHit = false; } break;
    case 'atk': {
      if (d.lunge && e.t < 0.2) e.x += e.face * 330 * dt;
      if (!e.didHit && e.t > 0.05 && d.ranged) {
        e.didHit = true;
        const p = nearestPlayer(S, e);
        if (p) {
          const T = 0.95;
          S.shots.push({ id: nid(), kind: 'nade', x: e.x + e.face * 60, y: e.y, z: 110, vx: (p.x - e.x - e.face * 60) / T, vy: (p.y - e.y) / T, vz: (1100 * T * T / 2 - 110) / T, grav: 1100, owner: e.id, life: 3, dmg: Math.round(d.dmg * (1 + S.lvl * 0.07)), c: '#c07bff' });
          sfx(S, 'shot');
        }
      }
      if (!e.didHit && e.t > 0.05) {
        e.didHit = true;
        for (const p of S.players) {
          if (p.out || p.st === 'dead') continue;
          const rx = (p.x - e.x) * e.face;
          const bt = p.riding ? 260 : 0;
          if (rx > -10 && rx < d.reach + (d.lunge ? 50 : 0) + bt && Math.abs(p.y - e.y) < (bt ? 70 : 30) && Math.abs(p.z - (e.z || 0)) < 70)
            hurtPlayer(S, p, Math.round(d.dmg * (1 + S.lvl * 0.07)), { knock: d.heavy || e.kick && Math.random() < 0.3, from: e.x });
        }
      }
      if (e.t > 0.34) { e.st = 'walk'; e.t = 0; e.cool = rand(0.9, 1.9); }
      break;
    }
    case 'hurt': if (e.t > 0.38) { e.st = 'walk'; e.t = 0; e.cool = Math.max(e.cool, 0.5); } break;
    case 'block': if (e.t > 0.3) { e.st = 'walk'; e.t = 0; } break;
    case 'held': if (e.t > 3) { e.st = 'walk'; e.t = 0; const h = S.players.find((q) => q.id === e.holder); if (h) { h.st = 'idle'; h.hold = 0; } } break;
    case 'knock': case 'thrown': {
      e.x += e.vx * dt; e.vx *= 0.985;
      e.z += e.vz * dt; e.vz -= 1500 * dt;
      if (e.st === 'thrown') {
        // thrown bodies bowl over other enemies
        for (const o of S.enemies) if (o !== e && hittable(o) && Math.abs(o.x - e.x) < 60 && Math.abs(o.y - e.y) < 34 && !o.boss) {
          const thrower = S.players.find((q) => q.id === e.thrower);
          damageEnemy(S, thrower, o, 16, { knock: true, heavy: true, from: e.x - Math.sign(e.vx) });
        }
        for (const o of S.props) if (o.hp > 0 && Math.abs(o.x - e.x) < 50 && Math.abs(o.y - e.y) < 40) hitProp(S, o, S.players.find((q) => q.id === e.thrower));
      }
      // inside an arena bodies bounce off the invisible walls instead of flying off screen
      if (S.camLock !== null) { const a = S.camLock + 40, b = S.camLock + W - 40; if (e.x < a || e.x > b) { e.x = clamp(e.x, a, b); e.vx = -e.vx * 0.4; } }
      else e.x = clamp(e.x, S.cam - 40, S.cam + W + 40);
      if (e.z <= 0 && e.t > 0.1 && inGap(S.L, e.x, e.y)) {
        // knocked off the train!
        e.st = 'fall'; e.t = 0; e.z = 0; if (e.hp > 0) { const q = S.players.find((pp) => pp.id === (e.thrower || e.killer)); if (q) { q.score += e.def.score + 300; q.kos++; } e.hp = 0; }
        floatText(S, e.x, e.y - 150, 'GIÙ DAL TRENO!', '#ffe08a', 18); sfx(S, 'hurt');
        break;
      }
      const eg = groundAt(S, e.x, e.y) > 40 ? 0 : groundAt(S, e.x, e.y);   // enemies never land on top of a car
      if (e.z <= eg && e.vz < 0 && e.t > 0.1) {
        e.z = eg; e.st = e.hp > 0 ? 'down' : 'dead'; e.t = 0; shake(S, 3); sfx(S, 'heavy'); sparks(S, e.x, e.y, '#9aa0b0', 8, 'dust');
        if (e.hp <= 0 && e.def && e.def.shade) sparks(S, e.x, e.y - 60, '#b77dff', 20, 'fire');
      }
      break;
    }
    case 'slam': {
      // double grab: lifted by two heroes and slammed on the floor
      e.z = Math.sin(Math.min(1, e.t / 0.45) * Math.PI) * 170;
      if (e.t > 0.45) {
        e.z = 0; e.st = 'hurt'; e.inv = 0;
        const by = S.players.find((q) => q.id === e.slamBy);
        ev(S, { t: 'boom', x: Math.round(e.x), y: Math.round(e.y), big: 1 }); ring(S, e.x, e.y, '#ffd35a', 260, 0.6); shake(S, 16); sfx(S, 'stomp');
        ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 180), s: 'SCHIANTO DOPPIO!', c: '#ffd35a', big: 1 });
        damageEnemy(S, by, e, 75, { knock: true, heavy: true, unblockable: true });
        for (const o of S.enemies) if (o !== e && hittable(o) && Math.hypot(o.x - e.x, (o.y - e.y) * 1.5) < 220) damageEnemy(S, by, o, o.boss ? 20 : 32, { knock: !o.boss, heavy: true, from: e.x });
      }
      break;
    }
    case 'hop': {
      // jumping across the gap between two wagons
      e.x += e.hopDir * 300 * dt; e.z += e.vz * dt; e.vz -= 1500 * dt;
      if (e.z <= 0 && e.vz < 0) { e.z = 0; if (inGap(S.L, e.x, e.y)) e.vz = 320; else { e.st = 'walk'; e.t = 0; sparks(S, e.x, e.y, '#9aa0b0', 5, 'dust'); } }
      break;
    }
    case 'down': if (e.t > 0.85) { e.st = 'getup'; e.t = 0; } break;
    case 'getup': if (e.t > 0.3) { e.st = 'walk'; e.t = 0; e.inv = 0.3; e.cool = 0.8; } break;
    case 'fall': e.z -= 900 * dt * Math.min(1, e.t * 3); if (e.t > 0.8) { e.st = 'dead'; e.t = 2; } break;
  }
  // walking enemies jump over the gaps between wagons (a real jump) and climb on cars and dumpsters
  if (['walk', 'idle', 'enter'].includes(e.st) && !d.flying) {
    const dir = Math.sign(Math.round(e.x - (e._px ?? e.x)));
    if (S.L.train && dir && trainOn(S.L, e.x) && (inGap(S.L, e.x + dir * 60, e.y, -30) || inGap(S.L, e.x, e.y, -30))) { e.st = 'hop'; e.t = 0; e.vz = 560; e.hopDir = dir; e.face = dir; }
    else {
      let gz = groundAt(S, e.x, e.y);
      if (gz > 40 && (e.z || 0) < 40) { const b = blockedFor(S, e.x, e.y); if (b) e.y = Math.min(FLOOR_BOTTOM, e.y + 240 * dt); gz = 0; }   // pushed out of a car, never onto it
      e.z = e.z < gz ? Math.min(gz, e.z + 600 * dt) : Math.max(gz, e.z - 600 * dt);
    }
  }
  e._px = e.x;
  if (!['knock', 'thrown', 'held', 'dead', 'enter', 'rise', 'slam'].includes(e.st)) {
    e.y = clamp(e.y, FLOOR_TOP, FLOOR_BOTTOM);
    if (S.camLock !== null) {
      e.x = clamp(e.x, S.camLock + 30, S.camLock + W - 30);
      // enemies don't pile up against the borders either
      if (['idle', 'walk'].includes(e.st)) { if (e.x < S.camLock + 110) e.x += 90 * dt; if (e.x > S.camLock + W - 110) e.x -= 90 * dt; }
    }
  }
}

/* ---------------- drones: hover out of reach, fire down diagonally ---------------- */
function stepDrone(S, e, dt) {
  const p = nearestPlayer(S, e);
  e.walk += dt * 20;
  const hover = 165 + Math.sin(e.t * 3 + e.id) * 12;
  e.z = e.z < hover ? Math.min(hover, e.z + 260 * dt) : Math.max(hover, e.z - 260 * dt);
  if (e.st === 'hurt') { if (e.t > 0.3) { e.st = 'walk'; e.t = 0; } return; }
  if (!p) return;
  const side = e.x < p.x ? -1 : 1;
  const tx = p.x + side * 230, ty = p.y + ((e.id % 3) - 1) * 30;
  e.face = p.x > e.x ? 1 : -1;
  if (e.st === 'enter' || e.st === 'walk' || e.st === 'idle') {
    e.st = 'walk';
    e.x += clamp(tx - e.x, -1, 1) * Math.min(Math.abs(tx - e.x), 170 * dt);
    e.y += clamp(ty - e.y, -1, 1) * Math.min(Math.abs(ty - e.y), 110 * dt);
    e.cool -= dt * DIFF.aggro;
    if (e.cool <= 0 && Math.abs(p.x - e.x) < 420) { e.st = 'wind'; e.t = 0; sfx(S, 'wind'); }
  } else if (e.st === 'wind') {
    if (e.t > e.def.wind) {
      // aim at the player's chest: the bolt reaches the ground behind them
      const dx = p.x - e.x, time = Math.max(0.35, Math.abs(dx) / 520);
      S.shots.push({ id: nid(), kind: 'dbolt', x: e.x, y: e.y, z: e.z + 10, vx: dx / time, vy: (p.y - e.y) / time, vz: -(e.z + 10 - (p.z + 70)) / time, owner: e.id, life: 3, dmg: Math.round(e.def.dmg * (1 + S.lvl * 0.07)), c: '#c07bff' });
      sfx(S, 'laser'); e.st = 'atk'; e.t = 0;
    }
  } else if (e.st === 'atk' && e.t > 0.3) { e.st = 'walk'; e.t = 0; e.cool = rand(1.6, 2.6); }
  e.y = clamp(e.y, FLOOR_TOP, FLOOR_BOTTOM);
  if (S.camLock !== null) e.x = clamp(e.x, S.camLock + 40, S.camLock + W - 40);
}

/* ---------------- bosses ---------------- */
function spawnBoss(S, key, x, y) {
  const B = BOSSES[key];
  const hpMul = (1 + (alivePlayers(S).length - 1) * 0.45) * DIFF.hp;
  const e = {
    id: nid(), boss: true, key, B, sprite: B.sprite || key, x, y, z: 0, vz: 0, face: -1, hp: Math.round(B.hp * hpMul), max: Math.round(B.hp * hpMul),
    st: 'intro', t: 0, cool: 1.2, inv: 0, flash: 0, walk: 0, pat: 0, poise: 0, target: 0, alpha: 1,
  };
  if (B.parts) e.parts = B.parts.map(([name, hp]) => ({ name, hp: hp * hpMul }));
  S.enemies.push(e);
  S.bossId = e.id;
  return e;
}

function stepBoss(S, e, dt) {
  const B = e.B;
  // three phases: 2/3 and 1/3 of the life bar
  const ph = e.hp > e.max * 0.66 ? 1 : e.hp > e.max * 0.33 ? 2 : 3;
  if (ph > (e.phase || 1) && e.hp > 0 && !['dead', 'gone', 'teleport', 'burrow'].includes(e.st)) {
    e.phase = ph; e.st = 'roar'; e.t = 0; e.pat = 0; e.guarding = false; e.alpha = 1; e.z = 0;
    const P = BOSS_PHASES[e.key] || BOSS_PHASES[e.sprite];
    S.banner = { text: `FASE ${ph}`, sub: P ? P.ph[ph - 2] : 'FURIA', t: 2.2, boss: true };
    ev(S, { t: 'ring', x: Math.round(e.x), y: Math.round(e.y - 40), c: '#ff5a3a', r: 620, life: 0.8 }); ev(S, { t: 'flash', c: '#ff6a4a', v: 0.45 });
    shake(S, 18); sfx(S, 'roar'); sfx(S, 'boom');
    for (const q of S.players) if (!q.out && q.st !== 'dead' && q.st !== 'ko' && Math.abs(q.x - e.x) < 420) hurtPlayer(S, q, 6, { knock: true, from: e.x });
  }
  const phase2 = (e.phase || 1) >= 2;
  const PF = [1, 1, 1.15, 1.3][e.phase || 1];
  const sp = B.speed * PF;
  const p = nearestPlayer(S, e);
  if (!p && !['dead', 'gone'].includes(e.st)) { e.st = 'idle'; return; }
  const hurtAll = (test, dmg, knock = true) => {
    for (const q of S.players) if (!q.out && q.st !== 'dead' && test(q)) hurtPlayer(S, q, dmg, { knock, from: e.x });
  };
  switch (e.st) {
    case 'intro': {
      e.x -= 60 * dt; e.walk += dt * 5;
      if (e.t > 1.6) { e.st = 'walk'; e.t = 0; }
      break;
    }
    case 'idle': case 'walk': {
      e.target = p.id;
      e.cool -= dt * [1, 1, 1.3, 1.6][e.phase || 1];
      e.face = p.x > e.x ? 1 : -1;
      const PP = BOSS_PHASES[e.key] || BOSS_PHASES[e.sprite], pattern = (e.phase || 1) >= 3 && PP ? PP.p3 : (e.phase || 1) === 2 && PP ? PP.p2 : B.pattern;
      const ranged = ['orbs', 'blast', 'summon', 'split', 'mirror', 'wave', 'teleport', 'burrow'].includes(pattern[e.pat % pattern.length]);
      const want = ranged ? 360 : B.reach * 0.75;
      const ddx = p.x - e.face * want - e.x, ddy = p.y - e.y;
      if (Math.abs(ddx) > 14) { e.x += Math.sign(ddx) * Math.min(Math.abs(ddx), sp * dt); e.walk += dt * 6; e.st = 'walk'; }
      else e.st = 'idle';
      if (Math.abs(ddy) > 8) e.y += Math.sign(ddy) * Math.min(Math.abs(ddy), sp * 0.55 * dt);
      if (e.cool <= 0 && (Math.abs(ddx) < 60 || ranged || e.t > 2.2)) {
        e.move = pattern[e.pat % pattern.length]; e.pat++;
        e.st = 'wind'; e.t = 0; e.tx = p.x; e.ty = p.y;
        sfx(S, 'bosswind');
        if (e.move === 'guard') { e.st = 'guard'; e.guarding = true; e.gm = 100; e.turnT = 0; }
      }
      break;
    }
    case 'roar': if (e.t > 1.4) { e.st = 'walk'; e.t = 0; e.cool = 0.4; } break;
    case 'guard': {
      // turns slowly: a quick player can still get behind
      e.turnT = (e.turnT || 0) + dt;
      if (e.turnT > 0.8) { e.turnT = 0; e.face = p.x > e.x ? 1 : -1; }
      if (e.t > 2.2) { e.guarding = false; e.st = 'wind'; e.t = 0; e.move = 'slash'; }
      break;
    }
    case 'wind': {
      const wt = { punch: 0.75, slam: 0.95, charge: 0.7, lunge: 0.6, claw: 0.55, drill: 0.7, slash: 0.55, sweep: 0.8, blast: 0.9, orbs: 0.6, summon: 0.7, split: 0.7, mirror: 0.8, wave: 0.6, teleport: 0.4, burrow: 0.5 }[e.move] || 0.7;
      if (['slam'].includes(e.move)) { e.tx = lerp(e.tx, p.x, dt * 3); e.ty = lerp(e.ty, p.y, dt * 3); }
      if (e.t > wt * [1, 1, 0.85, 0.7][e.phase || 1]) { e.st = 'atk'; e.t = 0; e.didHit = false; bossAttack(S, e, p); }
      break;
    }
    case 'atk': {
      const m = e.move;
      if (['charge', 'lunge', 'drill'].includes(m)) {
        const dur = m === 'lunge' ? 0.45 : 0.9;
        e.x += e.face * (m === 'lunge' ? 620 : 700) * dt;
        hurtAll((q) => !e._hitSet.has(q.id) && Math.abs(q.x - e.x) < 110 && Math.abs(q.y - e.y) < 42 && q.z < 90 && (e._hitSet.add(q.id), true), B.dmg);
        if (S.camLock !== null) e.x = clamp(e.x, S.camLock + 60, S.camLock + W - 60);
        if (e.t > dur || (S.camLock !== null && (e.x <= S.camLock + 61 || e.x >= S.camLock + W - 61))) { e.st = 'recover'; e.t = 0; shake(S, 6); }
      } else if (e.t > 0.55) { e.st = 'recover'; e.t = 0; }
      break;
    }
    case 'recover': if (e.t > (phase2 ? 0.35 : 0.6)) { e.st = 'walk'; e.t = 0; e.cool = (e.phase || 1) >= 3 && Math.random() < 0.4 ? 0 : rand(0.9, 1.6); } break;   // phase 3: attacks can chain
    case 'hurt': if (e.t > (e.broken ? 1.8 : 0.45)) { e.st = 'walk'; e.t = 0; e.broken = false; e.cool = Math.min(e.cool, 0.5); } break;
    case 'teleport': {
      e.alpha = Math.max(0, 1 - e.t * 3);
      if (e.t > 0.5) {
        const q = p;
        e.x = clamp(q.x + (q.x - S.cam > W / 2 ? -380 : 380), S.cam + 100, S.cam + W - 100); e.y = q.y;
        e.st = 'appear'; e.t = 0;
        sparks(S, e.x, e.y - 120, '#b77dff', 30, 'fire');
      }
      break;
    }
    case 'appear': e.alpha = Math.min(1, e.t * 3); if (e.t > 0.4) { e.st = 'walk'; e.t = 0; e.cool = 0.4; } break;
    case 'burrow': {
      e.alpha = Math.max(0, 1 - e.t * 2.5);
      if (e.t < 1.2) { e.tx = lerp(e.tx, p.x, dt * 2.5); e.ty = lerp(e.ty, p.y, dt * 2.5); }
      if (e.t > 1.5) {
        e.x = e.tx; e.y = e.ty; e.alpha = 1; e.st = 'atk'; e.t = 0; e.move = 'erupt';
        ev(S, { t: 'boom', x: e.x, y: e.y - 20 }); sfx(S, 'stomp'); shake(S, 14);
        hurtAll((q) => Math.hypot(q.x - e.x, (q.y - e.y) * 1.5) < 150 && q.z < 60, B.dmg + 6);
      }
      break;
    }
    case 'dead': {
      e.alpha = 1;
      if (e.t < 2.2 && Math.random() < dt * 14) { ev(S, { t: 'boom', x: e.x + rand(-80, 80), y: e.y - rand(40, 220) }); if (Math.random() < 0.5) sfx(S, 'boom'); }
      if (e.t > 2.4) e.st = 'gone';
      break;
    }
  }
  e.y = clamp(e.y, FLOOR_TOP + 6, FLOOR_BOTTOM);
  if (['walk', 'idle', 'intro'].includes(e.st)) e.z = inGap(S.L, e.x, e.y, -40) ? 70 : 0;
  else if (e.st !== 'dead') e.z = 0;
}

function bossAttack(S, e, p) {
  const B = e.B, m = e.move;
  const phase2 = e.hp < e.max * 0.5;
  const hurtAll = (test, dmg, knock = true) => {
    for (const q of S.players) if (!q.out && q.st !== 'dead' && test(q)) hurtPlayer(S, q, dmg, { knock, from: e.x });
  };
  e._hitSet = new Set();
  switch (m) {
    case 'punch': case 'claw': case 'slash': case 'sweep':
      sfx(S, 'heavy');
      hurtAll((q) => { const rx = (q.x - e.x) * e.face; return rx > -30 && rx < B.reach + (m === 'sweep' ? 50 : 0) && Math.abs(q.y - e.y) < (m === 'sweep' ? 60 : 44) && q.z < 90; }, B.dmg, m !== 'claw');
      sparks(S, e.x + e.face * B.reach * 0.7, e.y - 110, '#ffd6a0', 10, 'slash');
      break;
    case 'slam':
      ev(S, { t: 'boom', x: e.tx, y: e.ty - 10 }); ring(S, e.tx, e.ty, '#ffaa4c', 150, 0.45); shake(S, 14); sfx(S, 'stomp');
      hurtAll((q) => Math.hypot(q.x - e.tx, (q.y - e.ty) * 1.4) < 130 && q.z < 40, B.dmg + 6);
      break;
    case 'charge': case 'lunge': case 'drill':
      sfx(S, 'heavy'); break;
    case 'blast': {
      sfx(S, 'laser'); ev(S, { t: 'beam', x: e.x + e.face * 90, y: e.y - 105, dir: e.face, len: 900, c: '#c07bff' }); shake(S, 8);
      hurtAll((q) => (q.x - e.x) * e.face > 0 && Math.abs(q.y - e.y) < 46 && q.z < 100, B.dmg);
      break;
    }
    case 'orbs': {
      const n = phase2 ? 5 : 3;
      for (let i = 0; i < n; i++) S.shots.push({ id: nid(), kind: 'orb', x: e.x + e.face * 60, y: e.y + (i - (n - 1) / 2) * 34, z: 100, vx: e.face * (220 + i * 25), vy: 0, owner: e.id, life: 4.5, dmg: 14, homing: 0.9, c: e.key === 'custode' ? '#4fe3d9' : '#c07bff' });
      sfx(S, 'laser');
      break;
    }
    case 'wave': {
      S.shots.push({ id: nid(), kind: 'wave', x: e.x + e.face * 80, y: e.y, z: 0, vx: e.face * 560, owner: e.id, life: 2.5, dmg: 18, c: e.sprite === 'rigel' ? '#8fd8ff' : undefined });
      if (phase2) S.shots.push({ id: nid(), kind: 'wave', x: e.x + e.face * 80, y: clamp(e.y + (e.y > 600 ? -70 : 70), FLOOR_TOP, FLOOR_BOTTOM), z: 0, vx: e.face * 520, owner: e.id, life: 2.5, dmg: 18, c: e.sprite === 'rigel' ? '#8fd8ff' : undefined });
      sfx(S, 'laser');
      break;
    }
    case 'summon': case 'split': case 'mirror': {
      const type = m === 'split' ? 'segment' : m === 'mirror' ? 'shade' : pick(['soldier', 'lancer', 'lancer']);
      const count = Math.min(m === 'summon' ? 3 : 2, 6 - S.enemies.filter((o) => !o.boss && o.hp > 0).length);
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        const x = m === 'summon' ? S.camLock + (side > 0 ? W + 60 : -60) : e.x + side * 90;
        const n = spawnEnemy(S, type, x, clamp(e.y + (i - 0.5) * 70, FLOOR_TOP, FLOOR_BOTTOM));
        if (m !== 'summon') { n.st = 'walk'; sparks(S, n.x, n.y - 80, m === 'split' ? '#ff6a4a' : '#b77dff', 16, 'fire'); }
      }
      if (m === 'split') { floatText(S, e.x, e.y - 260, 'SI DIVIDE!', '#ffb080', 22); e.hp -= 0; }
      if (m === 'mirror') floatText(S, e.x, e.y - 260, 'COPIE OSCURE', '#d0b0ff', 22);
      break;
    }
    case 'teleport': e.st = 'teleport'; e.t = 0; sfx(S, 'laser'); break;
    case 'burrow': e.st = 'burrow'; e.t = 0; sparks(S, e.x, e.y, '#8a7a5a', 30, 'dust'); sfx(S, 'stomp'); break;
  }
}

function killBoss(S, e, p) {
  if (e.st === 'dead' || e.st === 'gone') return;
  e.st = 'dead'; e.t = 0; e.hp = 0; e.guarding = false;
  S.hitstop = 0.25; S.slowT = 1.6; shake(S, 20); sfx(S, 'boom'); ev(S, { t: 'flash', c: '#ffffff', v: 1 });
  ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 260), s: 'K.O.!', c: '#ffd35a', big: 1 });
  if (p && p.score !== undefined) p.score += 5000;
  S.coins += 5;
  for (const o of S.enemies) if (!o.boss && o.hp > 0) { o.hp = 0; o.st = 'knock'; o.t = 0; o.vx = (o.x > e.x ? 1 : -1) * 300; o.vz = 300; o.z = 1; }
  S.shots = [];
}

/* ---------------- projectiles ---------------- */
function stepShots(S, dt) {
  for (const s of S.shots) {
    s.life -= dt;
    if (s.homing && !s.friendly) {
      const p = nearestPlayer(S, s);
      if (p) { s.vy = lerp(s.vy || 0, clamp(p.y - s.y, -120, 120), dt * s.homing); }
    }
    s.x += s.vx * dt; s.y += (s.vy || 0) * dt;
    if (s.grav) s.vz -= s.grav * dt;
    if (s.vz) { s.z += s.vz * dt; if (s.z <= groundAt(S, s.x, s.y) + 4) {
      s.life = 0;
      if (s.kind === 'nade') {
        ev(S, { t: 'boom', x: Math.round(s.x), y: Math.round(s.y - 20) }); sfx(S, 'boom'); shake(S, 6);
        for (const p of S.players) if (!p.out && p.st !== 'dead' && Math.hypot(p.x - s.x, (p.y - s.y) * 1.5) < 95 && p.z < 60) hurtPlayer(S, p, s.dmg, { knock: true, from: s.x });
      } else sparks(S, s.x, s.y, s.c || '#fff', 8);
      continue;
    } }
    if (s.friendly && s.kind === 'bolt') {
      // bolts travel at a height: they hit what is at that height (drones need an upward shot)
      const owner = S.players.find((q) => q.id === s.owner);
      for (const e of S.enemies) if (s.life > 0 && hittable(e) && Math.abs(e.x - s.x) < 46 && Math.abs(e.y - s.y) < 40) {
        const mid = (e.z || 0) + (e.def && e.def.flying ? 30 : e.boss ? 150 : 100);
        if (Math.abs(mid - s.z) > (e.boss ? 120 : 70)) continue;
        damageEnemy(S, owner, e, s.dmg, e.def && e.def.flying ? { knock: true, from: s.x - s.vx } : { from: s.x - s.vx }); s.life = 0;
      }
      for (const o of S.props) if (s.life > 0 && o.hp > 0 && s.z < 140 && Math.abs(o.x - s.x) < 40 && Math.abs(o.y - s.y) < 40) { hitProp(S, o, owner); s.life = 0; }
    } else if (s.friendly) {
      const owner = S.players.find((q) => q.id === s.owner);
      for (const e of S.enemies) if (s.life > 0 && hittable(e) && !s.hit.has(e.id) && Math.abs(e.x - s.x) < (s.kind === 'bolt' ? 46 : 70) && Math.abs(e.y - s.y) < (s.kind === 'bolt' ? 34 : 60)) {
        s.hit.add(e.id); damageEnemy(S, owner, e, s.dmg, s.stun ? { from: s.x - s.vx } : { knock: true, heavy: true, from: s.x - s.vx });
        if (s.single) s.life = 0;
      }
      for (const o of S.props) if (o.hp > 0 && !s.hit.has(o.id) && Math.abs(o.x - s.x) < 50 && Math.abs(o.y - s.y) < 50) { s.hit.add(o.id); hitProp(S, o, owner); }
    } else {
      if (s.kind !== 'nade') for (const p of S.players) if (!p.out && p.st !== 'dead' && Math.abs(p.x - s.x) < (s.kind === 'wave' ? 48 : 40) && Math.abs(p.y - s.y) < 30 && (s.kind === 'dbolt' ? Math.abs(p.z + 70 - s.z) < 70 : p.z - p.gz < (s.kind === 'wave' ? 50 : 140))) {
        if (hurtPlayer(S, p, s.dmg, { knock: s.kind === 'wave', from: s.x - s.vx })) { s.life = 0; sparks(S, s.x, s.y - s.z, s.c || '#c07bff', 12); }
      }
    }
    if (s.x < S.cam - 200 || s.x > S.cam + W + 200) s.life = 0;
  }
  S.shots = S.shots.filter((s) => s.life > 0);
}

/* ---------------- items ---------------- */
function stepItems(S, dt) {
  for (const it of S.items) {
    const fl = groundAt(S, it.x, it.y);
    if (it.z > fl || it.vz) { it.z += it.vz * dt; it.vz -= 900 * dt; if (it.z <= fl) { it.z = fl; it.vz = Math.abs(it.vz) > 120 ? -it.vz * 0.35 : 0; } }
    it.base = fl;
    if (!ITEMS[it.type].weapon && !ITEMS[it.type].sigil) it.life -= dt;
  }
  S.items = S.items.filter((i) => i.life > 0);
}

/* ---------------- civilians ---------------- */
/* civilians walk around cars, dumpsters, shelters and big props instead of through them */
function blockedFor(S, x, y) {
  for (const p of S.plats) if (x > p.x - p.w / 2 - 30 && x < p.x + p.w / 2 + 30 && y > p.y - p.d - 10 && y <= p.y + 12) return p;
  for (const o of S.props) if (o.hp > 0 && Math.abs(x - o.x) < (SOLID[o.type] ? SOLID[o.type][0] + 20 : 44) && Math.abs(y - o.y) < 24) return { y: o.y, d: 0 };
  return null;
}
function freeSpot(S, x, y) {
  for (let k = 0; k < 8 && blockedFor(S, x, y); k++) x += 90;
  return x;
}
function stepCivs(S, dt) {
  for (const c of S.civs) {
    c.t += dt;
    if (c.mode === 'flee' || c.mode === 'leave') {
      const ob = blockedFor(S, c.x + c.face * 150, c.y) || blockedFor(S, c.x + c.face * 40, c.y);
      if (ob) { const ty = Math.min(FLOOR_BOTTOM, ob.y + 18); c.y += Math.sign(ty - c.y) * Math.min(Math.abs(ty - c.y), 160 * dt); }
    }
    if (c.mode === 'flee') c.x += c.face * c.speed * dt;
    if (c.mode === 'saved') {
      // freed hostages stand up, thank the heroes, then walk away calmly
      if (!c.said && c.t > 0.15) { c.said = true; floatText(S, c.x, c.y - 160, pick(['GRAZIE!', 'SIETE VOI!', 'EVVIVA!', 'SALVI!']), '#ffffff', 18); }
      if (c.t > 1.6) { c.mode = 'leave'; c.t = 0; }
    }
    if (c.mode === 'leave') c.x += c.face * 95 * dt;
  }
  S.civs = S.civs.filter((c) => c.x > S.cam - 150 && c.x < S.cam + W + 400 || c.mode === 'cower' || c.mode === 'saved');
  // ambient: during the first chapter more people flee from the invasion
  S.ambientT -= dt;
  if (S.ambientT <= 0 && S.L.ambientCivs && !S.L.survival && !S.L.rush && S.zoneIdx < 3 && S.civs.length < 6) {
    S.ambientT = rand(2.5, 5);
    S.civs.push(makeCiv(pick(CIVS), S.cam + W + 60, rand(FLOOR_TOP, 540), 'flee'));
  }
}

/* ---------------- zones & waves ---------------- */
function stepZones(S, dt) {
  const L = S.L;
  if (L.bonus) { S.camLock = 0; S.cam = 0; return; }
  if (L.survival) { stepSurvival(S, dt); return; }
  if (L.loco && S.boarded && !S.locoMsg && S.cam > L.loco - 700) { S.locoMsg = true; S.banner = { text: 'LA LOCOMOTIVA!', sub: 'IL CUORE DEL CONVOGLIO · FERMATELO PRIMA DEL PORTALE', t: 3 }; sfx(S, 'siren'); }
  if (L.train && !S.boarded && S.cam > L.train - 520) { S.boarded = true; S.banner = { text: 'SUL TRENO IN CORSA!', sub: 'SALTA DA UN VAGONE ALL\'ALTRO · LIBERA I PRIGIONIERI', t: 3.2 }; ev(S, { t: 'flash', c: '#ffffff', v: 0.5 }); sfx(S, 'siren'); }
  const z = L.zones[S.zoneIdx];
  if (!z) return;
  const lead = Math.max(...alivePlayers(S).map((p) => p.x), S.cam + 200);
  if (!S.zoneOn && S.phase === 'stage') {
    if (lead > z.x - 120 && !S.cleared) {
      if (z.ride === 'start' && !S.ride && !S.rideAsked && !S.rideDone) { S.rideAsked = true; S.result = 'ride'; return; }
      if (z.board && !S.boarded && !S.boardAsked) { S.boardAsked = true; S.result = 'board'; return; }
      if (z.escape) { startEscape(S, z); return; }
      S.zoneOn = true; S.wave = 0; S.camLock = clamp(z.x - 380, 0, L.length - W);
      S.banner = { text: z.name, t: 2.4 };
      S.checkpoint = S.zoneIdx;
      if (z.boss) {
        const b = spawnBoss(S, z.boss, S.camLock + W + 120, 600);
        S.bossT0 = S.t;
        S.vs = { k: z.boss, t: 0 };   // "CONTRO" presentation with strengths and weaknesses
        sfx(S, 'bosswind'); sfx(S, 'boom');
        S.banner = { text: BOSSES[z.boss].name, sub: BOSSES[z.boss].title, t: 3, boss: true };
        sfx(S, 'siren');
      } else {
        spawnWave(S, z, 0);
        S.civTotal = (S.civTotal || 0) + (z.c || []).length; for (const [i, cv] of (z.c || []).entries()) { const cy = FLOOR_TOP + 4 + (i % 2) * 10; let cx = freeSpot(S, S.camLock + 260 + i * (z.c.length > 2 ? 360 : 520), cy); for (let k = 0; k < 4 && inGap(L, cx, cy, -60); k++) cx += 140; S.civs.push({ ...makeCiv(cv, cx, cy, 'cower'), face: i % 2 ? -1 : 1, caged: !!(L.train && z.x >= L.train) }); }
      }
    }
    return;
  }
  if (S.lastWaves) { S.endT += dt; if (S.endT > 1.5) S.result = L.giant ? 'giant' : 'clear'; return; }
  if (!S.zoneOn) return;
  if (z.escape) { stepEscape(S, z, dt); return; }
  if (z.boss) {
    const b = S.enemies.find((e) => e.boss);
    if (!b || b.st === 'gone') {
      if (!S.endT) { S.endT = 0.001; }
      S.endT += dt;
      if (S.endT > 1.2) S.result = L.giant ? 'giant' : 'clear';
    }
    return;
  }
  const alive = S.enemies.filter((e) => e.hp > 0 || !['dead'].includes(e.st)).filter((e) => e.hp > 0).length;
  const zw = S.zw[S.zoneIdx];
  if (S.wave < zw.length - 1 && alive <= 1) { S.wave++; spawnWave(S, z, S.wave); }
  else if (S.wave >= zw.length - 1 && alive === 0 && !mechZoneBlocked(S) && !S.enemies.some((e) => e.st === 'knock')) {
    // zone clear
    S.zoneOn = false; S.camLock = null; S.zoneIdx++;
    S.coins += 1 + S.civs.filter((c) => c.mode === 'cower').length;
    if (z.ride === 'end' && S.ride) endRide(S, true);
    for (const c of S.civs) if (c.mode === 'cower') { S.saved++; c.mode = 'saved'; c.face = -1; c.t = 0; if (c.caged) { c.caged = false; ev(S, { t: 'uncage', x: Math.round(c.x), y: Math.round(c.y) }); } for (const p of alivePlayers(S)) p.score += 300; }
    const zz = L.zones[S.zoneIdx];
    if (!zz) { S.endT = 0.001; S.zoneOn = true; S.zoneIdx--; S.lastWaves = true; }   // II: a chapter that ends with waves instead of a boss
    ev(S, { t: 'go' }); ev(S, { t: 'pop', x: 640, y: 230, s: 'ZONA LIBERATA!', c: '#ffd35a', big: 1, fixed: 1 });
    for (const p of S.players) p.hp = Math.min(p.max, p.hp + 10);
  }
}

function spawnWave(S, z, i) {
  const [type, n0] = S.zw[S.zoneIdx][i];
  const extra = Math.max(0, alivePlayers(S).length - 1);
  const n = n0 + Math.ceil(extra * n0 * 0.5);
  const veil = !!S.L.veil;   // chapters where the Veil opens portals in the floor
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? 1 : -1;
    const y = FLOOR_TOP + 20 + ((k * 53) % (FLOOR_BOTTOM - FLOOR_TOP - 30));
    if (type === 'drone') { const e = spawnEnemy(S, type, side > 0 ? S.camLock + W + 60 : S.camLock - 60, y); e.z = 170; continue; }
    if (k % 3 === 2 && i > 0) {
      const x = S.camLock + 260 + ((k * 211) % (W - 520));
      if (veil) { const e = spawnEnemy(S, type, x, y, { st: 'rise', z: -150 }); ev(S, { t: 'portal', x: Math.round(x), y: Math.round(y) }); sfx(S, 'laser'); }
      else spawnEnemy(S, type, x, FLOOR_BOTTOM + 140);   // from the bottom of the screen
      continue;
    }
    const x = side > 0 ? S.camLock + W + 60 + k * 40 : S.camLock - 60 - k * 40;
    spawnEnemy(S, type, x, y);
  }
}

function stepCamera(S, dt) {
  if (S.escape) return;   // chapter 8: the collapse scrolls the screen by itself
  const ps = alivePlayers(S);
  if (S.camLock !== null) { S.cam = lerp(S.cam, S.camLock, Math.min(1, dt * 4)); return; }
  if (!ps.length) return;
  const mid = ps.reduce((a, p) => a + p.x, 0) / ps.length;
  const minX = Math.min(...ps.map((p) => p.x));
  let target = clamp(mid - 440, 0, S.L.length - W);
  target = Math.min(target, minX - 60); // nobody left behind
  if (target > S.cam) S.cam = lerp(S.cam, target, Math.min(1, dt * 5));
}

/* =========================================================
   VIEW — dati minimi per disegnare (anche via rete)
   ========================================================= */
function playerFrame(p) {
  const pre = HEROES[p.hero].id;
  let f = 0, rot = 0;
  switch (p.st) {
    case 'walk': f = [1, 2, 3, 2][Math.floor(p.walk) % 4]; break;
    case 'jump': f = p.atk === 'air' ? 6 : 12; break;
    case 'land': f = 4; break;
    case 'drop': f = 12; break;
    case 'dodge': f = 1; break;
    case 'atk': {
      if (p.atk === 'pickup') { f = 4; break; }
      const m = MOVES[p.atk]; f = m.frames.find(([t]) => p.t < t)?.[1] ?? m.frames[m.frames.length - 1][1];
      break;
    }
    case 'grab': f = 4; break;
    case 'grabatk': f = p.t > 0.08 ? 6 : 4; break;
    case 'throw': f = 5; break;
    case 'special': {
      const k = p.spk;
      // weapon poses of the generated sheet: 8 wind-up · 9 strike · 10 special
      f = k === 'azur' ? 10 : k === 'lyra' ? (Math.floor(p.t / 0.08) % 2 ? 9 : 10) : k === 'onyx' ? (p.t < 0.3 ? 10 : 9) : k === 'aura' ? (p.t < 0.3 ? 10 : 9) : p.t < 0.16 ? 8 : 10;
      break;
    }
    case 'pose': f = p.teamTo ? (p.t < 0.45 ? [1, 2, 3, 2][Math.floor(p.walk) % 4] : p.t < 1.5 ? 8 : p.teamLead ? 11 : 0) : p.t < 0.3 ? 0 : 4; break;
    case 'hurt': f = 7; break;
    case 'knock': f = p.t < 0.12 ? 7 : 13; break;
    case 'down': case 'dead': f = 14; break;
    case 'getup': f = 4; rot = -(1 - p.t / 0.3) * 0.6; break;
    case 'fall': f = 7; rot = p.t * 3; break;
    case 'duck': case 'revive': f = 4; break;
    case 'parry': f = 8; break;
    case 'ko': f = 14; break;
    case 'cannon': f = 12; rot = p.t * 14 * p.face; break;
    case 'pairslam': f = p.t < 0.25 ? 8 : 9; break;
  }
  if (p.riding) { f = 4; rot = 0; }
  return [`${pre}_${f}`, rot];
}

function enemyFrame(e) {
  if (e.boss) {
    const B = e.B, s = e.sprite;
    const psh = bossPSheet(s);
    if (psh) {
      // 8-pose sheets: 0 guardia · 1 passo · 2 carica · 3 attacco · 4 speciale · 5 colpito · 6 a terra · 7 in ginocchio
      const special = ['summon', 'split', 'mirror', 'orbs', 'teleport'].includes(e.move);
      let f = 0;
      switch (e.st) {
        case 'walk': case 'intro': f = Math.floor(e.walk / 1.5) % 2 ? 1 : 0; break;
        case 'guard': f = 2; break;
        case 'wind': f = special ? 4 : 2; break;
        case 'roar': f = 4; break;
        case 'atk': f = special ? 4 : 3; break;
        case 'recover': f = special ? 4 : e.t < 0.3 ? 3 : 0; break;
        case 'burrow': f = 7; break;
        case 'teleport': case 'appear': f = 4; break;
        case 'hurt': f = e.broken ? 7 : 5; break;
        case 'dead': case 'gone': f = e.t < 0.35 ? 5 : 6; break;
      }
      return [`${s}P_${f}`, 0, psh];
    }
    let f = 0;
    const eight = B.frames === 8;
    switch (e.st) {
      case 'walk': case 'intro': f = eight ? [0, 1, 2, 1][Math.floor(e.walk) % 4] : [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'idle': case 'appear': case 'teleport': f = 0; break;
      case 'guard': f = eight ? 3 : 5; break;
      case 'wind': case 'roar': f = 3; break;
      case 'atk': f = eight ? (e.move === 'slam' ? 5 : 4) : 4; break;
      case 'recover': f = eight ? (e.move === 'slam' ? 5 : 4) : 4; break;
      case 'burrow': f = 3; break;
      case 'hurt': f = eight ? 6 : 5; break;
      case 'dead': case 'gone': f = eight ? 7 : 5; break;
    }
    return [`${s}_${f}`, 0];
  }
  const d = e.def;
  if (d.sheet === 'ferrea') {
    // II: 0 fermo · 1-2 passo · 3 carica · 4 attacco · 5 colpito · down (a terra, disegnato)
    let f = 0, rot = 0;
    switch (e.st) {
      case 'walk': case 'enter': f = [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'wind': case 'hop': case 'getup': f = 3; break;
      case 'atk': f = 4; break;
      case 'hurt': case 'held': case 'block': f = 5; break;
      case 'knock': case 'thrown': f = 5; rot = -Math.min(1, e.t * 4) * 0.9; break;
      case 'down': case 'dead': case 'fall': return [`${d.pre}_down`, 0, 'ferrea'];
    }
    return [`${d.pre}_${f}`, rot, 'ferrea'];
  }
  if (d.sheet === 'extra') {
    // generated sheets: 0 idle · 1-2 move · 3 wind-up · 4 attack · 5 hit
    let f = 0, rot = 0;
    switch (e.st) {
      case 'walk': case 'enter': f = [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'wind': case 'hop': f = 3; break; case 'atk': f = 4; break;
      case 'hurt': case 'held': case 'block': f = d.shield && e.st === 'block' ? 3 : 5; break;
      case 'knock': case 'thrown': f = 5; rot = -Math.min(1, e.t * 4) * 1.4; break;
      case 'down': case 'dead': case 'fall': f = 5; rot = -1.45; break;
      case 'getup': f = 3; break;
    }
    if (d.flying && ['walk', 'enter', 'idle'].includes(e.st)) f = [0, 1, 2, 1][Math.floor(e.walk / 4) % 4];
    return [`${d.pre}_${f}`, rot];
  }
  let pre = d.pre;
  if (d.shade) pre = HEROES[e.shadeHero].id;
  let f = 0, rot = 0;
  if (d.villain) {
    // centipede segments use the 6-frame villain layout
    switch (e.st) {
      case 'walk': case 'enter': f = [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'wind': case 'hop': f = 3; break; case 'atk': f = 4; break;
      case 'hurt': case 'held': f = 5; break;
      case 'knock': case 'thrown': f = 5; rot = -Math.min(1, e.t * 4) * 1.4; break;
      case 'down': case 'dead': f = 5; rot = -1.4; break;
      case 'getup': f = 3; break;
    }
    return [`${pre}_${f}`, rot];
  }
  switch (e.st) {
    case 'walk': case 'enter': f = [1, 2, 3, 2][Math.floor(e.walk) % 4]; break;
    case 'wind': case 'hop': f = 4; break;
    case 'atk': f = e.kick ? 6 : 5; break;
    case 'hurt': case 'held': f = 7; break;
    case 'knock': case 'thrown': f = 7; rot = -Math.min(1, e.t * 4) * Math.PI / 2 * 0.95; break;
    case 'down': case 'dead': f = 7; rot = -Math.PI / 2 * 0.95; break;
    case 'getup': f = 4; rot = -(1 - e.t / 0.3) * 0.6; break;
    case 'fall': f = 7; rot = e.t * 4; break;
  }
  if (e.z > 0 && (e.st === 'walk' || e.st === 'enter' || e.st === 'idle')) f = 4;
  return [`${pre}_${f}`, rot];
}

function civFrame(c) {
  const t = c.type;
  if (c.mode === 'cower') return `${t}_cower`;
  if (c.mode === 'flee') return `${t}_run${Math.floor(c.t * 11) % 6}`;
  if (c.mode === 'saved') return c.t < 0.35 ? `${t}_idle0` : `${t}_thank`;
  if (c.mode === 'leave') return `${t}_walk${Math.floor(c.t * 7) % 6}`;
  return `${t}_idle${Math.floor(c.t * 2) % 2}`;
}

function buildView(S) {
  const d = [];
  const r = (v) => Math.round(v);
  for (const pl of S.plats) d.push({ i: pl.id, pf: pl.type, x: r(pl.x), y: r(pl.y), sy: pl.y - pl.d, w: pl.w, dp: pl.d, h: pl.h });
  for (const o of S.props) if (o.hp > 0) {
    const pd = PROPS[o.type];
    const q = { i: o.id, s: pd.sheet || 'items', f: o.type === 'capsule' && o.hp < o.max / 2 ? 'capsule2' : o.type, x: r(o.x + (o.shake > 0 ? Math.sin(S.t * 80) * 3 : 0)), y: r(o.y), sc: pd.sc || (o.type === 'crate' ? 1.05 : 1.0), sh: 30 };
    if (o.type === 'antenna' || o.type === 'capsule' || o.type === 'mirror') q.hb = +(o.hp / o.max).toFixed(2);
    if (o.type === 'generator' && o.cd <= 0) q.au = '#c07bff';
    if (o.type === 'mirror') q.au = '#9a3aff';
    d.push(q);
  }
  mechView(S, d, r);
  extraView(S, d, r);
  for (const it of S.items) d.push({ i: it.id, s: 'items', f: it.type, x: r(it.x), y: r(it.y), z: r(it.z + (it.z === it.base && !ITEMS[it.type].weapon ? 4 + Math.sin(S.t * 4 + it.bob) * 3 : 0)), gz: r(it.base || 0), sc: ITEMS[it.type].weapon ? 1.1 : it.type === 'sigil' ? 1 : 1.15, sh: 18, sg: it.type === 'sigil' ? 1 : 0, a: it.life < 3 && !ITEMS[it.type].weapon ? (Math.floor(S.t * 10) % 2 ? 0.3 : 1) : 1, glow: ITEMS[it.type].weapon ? 0 : 1 });
  for (const c of S.civs) d.push({ i: c.id, s: 'people', f: civFrame(c), x: r(c.x), y: r(c.y), fc: c.face, sc: 1, sh: 26, cg: c.caged ? 1 : 0 });
  for (const e of S.enemies) {
    if (e.st === 'gone') continue;
    const [f, rot, sheet] = enemyFrame(e);
    const boss = e.boss;
    const sc = boss ? e.B.scale : e.def.scale * (e.def.villain ? 1 : 1);
    const o = { i: e.id, s: boss || e.def.villain ? 'bosses' : 'fighters', f, x: r(e.x), y: r(e.y), z: r(e.z || 0), fc: e.face, sc, r: rot, sh: boss ? 90 : 36, gz: r(boss || e.def.flying ? 0 : groundAt(S, e.x, e.y)) };
    if (sheet) o.s = sheet;
    if (e.def && e.def.sheet === 'extra') o.s = 'extra';
    if (e.def && e.def.flying) { o.sh = 24; o.gz = r(groundAt(S, e.x, e.y)); }
    if (e.def && e.def.shield && e.st !== 'knock' && e.st !== 'down') o.sd = 1;
    if (e.st === 'rise') { o.rz = 1; o.sh = 0; }
    if (e.flash > 0) o.fl = 1;
    if (e.st === 'held') { o.z = 16; o.sh = 0; o.x += Math.round(Math.sin(S.t * 40) * 2); }
    if (e.def && e.def.shade) o.ti = '#3a1466';
    if (e.def && e.def.tint) o.ti = e.def.tint;
    if (boss && e.B.tint) o.ti = e.B.tint;
    if (boss && e.alpha !== undefined && e.alpha < 1) o.a = +e.alpha.toFixed(2);
    if (e.st === 'dead') o.a = boss ? 1 : +(Math.max(0, 1 - e.t / 1.1) * (Math.floor(e.t * 16) % 2 ? 0.4 : 1)).toFixed(2);
    if (e.st === 'fall') { o.a = +Math.max(0, 1 - e.t / 0.8).toFixed(2); o.sh = 0; }
    if (boss && e.st === 'dead') { o.a = e.t > 1.8 ? +Math.max(0, 1 - (e.t - 1.8) / 0.6).toFixed(2) : 1; o.fl = Math.floor(e.t * 12) % 2; }
    if (!boss && e.hp > 0 && e.hp < e.max && e.st !== 'held') o.hb = +(e.hp / e.max).toFixed(2);
    if (!boss && e.st === 'hurt' && S.players.some((p) => !p.out && p.st !== 'dead' && Math.abs(p.y - e.y) < 24 && Math.abs(p.x - e.x) < 90)) o.gb = 1;
    if (e.st === 'wind' && boss && e.move === 'slam') o.tg = [r(e.tx), r(e.ty), 130];
    if (e.st === 'burrow') o.tg = [r(e.tx), r(e.ty), 140];
    if (e.st === 'wind' && boss && e.move === 'blast') o.bl = 1;
    if (e.st === 'wind' && !boss) o.wn = 1;
    if (e.guarding) o.gd = 1;
    d.push(o);
  }
  for (const p of S.players) {
    if (p.out || p.riding) continue;   // chapter 3: the players ARE the titan (only the Tiranno is drawn)
    const [f, rot] = playerFrame(p);
    p.gz = groundAt(S, p.x, p.y);
    const o = { i: p.id, s: 'fighters', f, x: r(p.x), y: r(p.y), z: r(p.z), gz: r(p.gz), fc: p.face, sc: HERO_SCALE, r: rot, sh: p.st === 'fall' ? 0 : 36, pl: p.slot + 1, pc: HEROES[p.hero].color };
    if (p.st === 'grab' || p.st === 'grabatk') o.hint = 'hold';
    if (p.ammo === 0 && p.st === 'atk' && p.atk === 'shoot') o.hint = 'noammo';
    // on-screen button prompts
    if (!p.civil && (p.st === 'idle' || p.st === 'walk')) {
      const near = S.enemies.filter((e) => e.hp > 0 && !e.boss && Math.abs(e.x - p.x) < 280 && Math.abs(e.y - p.y) < 90).length + (S.enemies.some((e) => e.boss && e.hp > 0 && Math.abs(e.x - p.x) < 320) ? 3 : 0);
      if (p.en >= 80 && near >= 3) o.hint = 'power';
      else if (grabbable(S, p)) o.hint = 'grab';
      else if (S.L.train && trainOn(S.L, p.x) && [50, 90, 130].some((d) => inGap(S.L, p.x + p.face * d, p.y))) o.hint = 'jump';
    }
    if (!p.civil && (p.st === 'idle' || p.st === 'walk') && !p.riding) {
      if (S.players.some((q) => q !== p && q.st === 'ko' && Math.abs(q.x - p.x) < 200 && Math.abs(q.y - p.y) < 80)) o.hint = 'revive';
      else if (S.players.some((q) => q !== p && q.st === 'jump' && Math.abs(q.x - p.x) < 80 && Math.abs(q.y - p.y) < 36 && q.z > 20 && q.z < 170)) o.hint = 'toss';
      else if (S.enemies.some((e) => e.st === 'held' && e.holder !== p.id && Math.abs(e.x - p.x) < 140 && Math.abs(e.y - p.y) < 40)) o.hint = 'pair';
    }
    if (p.st === 'revive') o.hint = 'reviving';
    if (p.st === 'ko') { o.ko = +clamp(p.koT / 8, 0, 1).toFixed(2); o.rv = +p.rev.toFixed(2); o.a = Math.floor(S.t * 4) % 2 ? 0.7 : 1; }
    if (p.st === 'duck') o.sq = 0.78;
    if (p.st === 'cannon') o.gh = 1;
    if (p.riding) { o.z = r(p.z + RIDE_Z); o.sh = 0; o.hint = undefined; }
    if (p.teamHold > 0.1) o.th = +clamp(p.teamHold / 0.9, 0, 1).toFixed(2);
    if (p.civil && !p.morphT) o.hint = 'morph';
    if (p.st === 'fall') o.a = +Math.max(0, 1 - p.t / 0.7).toFixed(2);
    if (p.civil) { o.s = 'people'; o.sc = 1; o.r = 0; o.f = `${HEROES[p.hero].id}C_` + (p.st === 'walk' ? 'walk' + (Math.floor(p.walk) % 6) : p.morphT > 0 ? 'raise' : 'idle' + (Math.floor(S.t * 2) % 2)); delete o.wp; }
    else if (S.L.unarmored && frameOf('people', `${HEROES[p.hero].id}C_idle0`)) {
      // II cap. 3: fighting in civilian clothes (placeholder poses until the dedicated sheet arrives)
      const hf = +String(o.f).split('_').pop();
      const civ = { 0: 'idle' + (Math.floor(S.t * 2) % 2), 4: 'stance', 5: 'point', 6: 'dash2', 7: 'raise', 8: 'stance', 9: 'point', 12: 'dash3', 13: 'stance', 14: 'stance', 15: 'point' }[hf];
      o.s = 'people'; o.sc = 1;
      o.f = `${HEROES[p.hero].id}C_` + (p.st === 'walk' ? 'walk' + (Math.floor(p.walk) % 6) : civ || 'stance');
      o.r = hf === 13 ? -0.9 : hf === 14 ? -1.45 : hf === 7 ? -0.25 : 0;
      delete o.wp;
    }
    if (S.L.stella && !p.civil) o.stl = 1;
    if (p.inv > 0 && p.st !== 'special' && p.st !== 'pose' && Math.floor(S.t * 20) % 2) o.a = 0.45;
    if (p.st === 'dead') o.a = +(Math.floor(p.t * 12) % 2 ? 0.3 : 1).toFixed(2);
    if (p.skin) o.sk = p.skin;
    if (HEROES[p.hero].sheet && !p.civil) {
      // Kharon: boss poses until his own sheet arrives
      const [sh, key, m, rr] = heroSprite(p.hero, +o.f.split('_')[1]);
      o.s = sh; o.f = key; o.sc = +(o.sc * m).toFixed(3); o.r = +((o.r || 0) + rr).toFixed(3);
    }
    // 1.8: real grab poses (the held enemy is drawn separately): 0 presa · 1 ginocchiata · 2 sollevamento · 3 lancio
    const gi = p.civil ? -1 : p.st === 'grab' ? 0 : p.st === 'grabatk' ? (p.t > 0.06 && p.t < 0.22 ? 1 : 0) : p.st === 'throw' ? (p.t < 0.1 ? 2 : 3) : p.st === 'pairslam' ? (p.t < 0.3 ? 2 : 3) : -1;
    const star = S.L.stella && !p.civil && !HEROES[p.hero].sheet && frameOf('stella2', `${HEROES[p.hero].id}S_0`);
    if (star) {
      // II: the Cuori di Stella armour — its own 16-pose sheet (tools/build_stella.py)
      const hid = HEROES[p.hero].id, gf = String(o.f).split('_').pop();
      const lead = p.st === 'pose' && p.teamTo && p.t >= 1.5 && p.teamLead;
      o.s = 'stella2'; o.f = `${hid}S_${lead ? 'v' : p.st === 'special' && p.spk === 'ignis' && p.t < 0.16 ? 'sw' : gf}`;
      delete o.stl; delete o.sk;
    }
    if (!star && gi >= 0 && frameOf('grabs', `${HEROES[p.hero].id}_g${gi}`)) { o.s = 'grabs'; o.f = `${HEROES[p.hero].id}_g${gi}`; o.sc = +(HERO_SCALE * (HEROES[p.hero].sheet ? 1.15 : 1)).toFixed(3); o.r = 0; }
    if (p.weapon) { o.wp = p.weapon.type; o.wa = p.st === 'atk' && p.atk === 'swing' && p.t > 0.1 ? 1 : 0; }
    if (p.st === 'special' || p.st === 'pose') o.au = HEROES[p.hero].glow;
    // personal weapon visible in the finisher, the running strike and the specials
    const hid = HEROES[p.hero].id;
    if (false) {
      o.sw = 'w_' + hid;
      o.sr = p.atk === 'dash' ? 0 : +(p.t < 0.1 ? -1.5 : clamp(-1.5 + (p.t - 0.1) / 0.12 * 1.7, -1.5, 0.2)).toFixed(2);
      if (hid === 'aura') o.sr = 0;
    } else if (false) {
      o.sw = 'w_' + hid;
      o.sr = hid === 'ignis' ? +clamp(-1.6 + p.t / 0.16 * 1.9, -1.6, 0.3).toFixed(2) : hid === 'onyx' ? (p.t < 0.3 ? -2.0 : 0.95) : 0;
    }
    if (p.st === 'dodge' || p.run && p.st === 'walk' || p.st === 'special' && p.spk === 'azur') o.gh = 1;
    d.push(o);
  }
  for (const s of S.shots) if (s.kind === 'nade') d.push({ i: s.id, s: 'items', f: 'gem', x: r(s.x), y: r(s.y), z: r(s.z), sc: 0.8, sh: 12, r: +(S.t * 12 % 6.28).toFixed(2) }); else d.push({ i: s.id, sh2: s.kind, x: r(s.x), y: r(s.y), z: r(s.z), fc: Math.sign(s.vx) || 1, c: s.c, am: s.aim || 0 });

  const boss = S.enemies.find((e) => e.boss && e.st !== 'gone');
  return {
    m: 'stage', lv: S.lvl, bg: S.L.bg, cam: r(S.cam), t: +S.t.toFixed(2), d,
    hud: {
      p: S.players.map((p) => ({ h: p.hero, n: p.name, hp: Math.max(0, Math.round(p.hp)), mx: p.max, en: Math.round(p.en), sc: p.score, lv: p.lives, out: p.out ? 1 : 0, wp: 0, am: p.ammo, cb: p.comboHitT > 0 && p.combo2 > 1 ? p.combo2 : 0 })),
      team: Math.round(S.team),
      boss: boss ? { n: boss.B.name, t: boss.B.title, hp: Math.max(0, boss.hp), mx: boss.max, g: boss.guarding ? 1 : 0, gm: Math.round(boss.gm || 0), br: boss.broken ? 1 : 0 } : null,
      cr: S.credits === Infinity ? -1 : S.credits, sg: S.L.survival || S.L.rush || S.L.bonus ? -1 : S.sigils.length, bt: S.L.bonus ? Math.max(0, +S.bonusT.toFixed(1)) : undefined,
      ban: S.banner ? { t: S.banner.text, s: S.banner.sub || '', k: +S.banner.t.toFixed(2), e: +((S.banner.tot || (S.banner.tot = S.banner.t)) - S.banner.t).toFixed(2), b: S.banner.boss ? 1 : 0 } : null,
      go: !S.zoneOn && S.zoneIdx < S.L.zones.length && S.zoneIdx > 0 && !S.cleared ? 1 : 0,
      lvl: S.lvl, place: S.L.place,
      portal: S.L.train && S.bossT0 !== undefined ? +clamp((S.t - S.bossT0) / 150, 0.05, 1).toFixed(3) : 0,
      ...extraHud(S),
    },
    ev: S.events.slice(),
  };
}

/* per-player tick for the "combo" counters */
function tickCounters(S, dt) { for (const p of S.players) { p.comboHitT = Math.max(0, (p.comboHitT || 0) - dt); } }

/* team attack resolution (after the pose) */
function stepTeam(S, dt) {
  if (!S.teamT) return;
  // the heroes walk into the line-up
  for (const q of S.players) if (q.teamTo && q.st === 'pose') { q.x = lerp(q.x, q.teamTo[0], Math.min(1, dt * 7)); q.y = lerp(q.y, q.teamTo[1], Math.min(1, dt * 7)); q.walk += dt * 10; }
  if (S.teamT > 0.6 && S.teamT - dt <= 0.6) { sfx(S, 'laser'); sfx(S, 'special'); shake(S, 16); }
  S.teamT -= dt;
  if (S.teamT <= 0) {
    S.teamT = 0;
    ev(S, { t: 'flash', c: '#ffffff', v: 0.8 }); shake(S, 24); sfx(S, 'boom');
    const q = alivePlayers(S)[0];
    for (const e of S.enemies) if (e.hp > 0 && e.st !== 'dead') {
      e.inv = 0; const wasGuard = e.guarding; e.guarding = false;
      damageEnemy(S, q, e, e.boss ? 110 : 90, { knock: true, heavy: true, unblockable: true, from: S.cam + W / 2 });
      e.guarding = wasGuard;
    }
    for (const o of S.props) if (o.hp > 0) hitProp(S, o, q);
    S.enemies.forEach((e) => ev(S, { t: 'boom', x: e.x, y: e.y - 80 }));
  }
}
