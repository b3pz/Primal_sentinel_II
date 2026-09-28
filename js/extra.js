'use strict';
/* ============================================================
   EXTRA DEI LIVELLI (1.6)
   · mosse in coppia: lancio del compagno, presa doppia
   · evocazione del titano (una volta per capitolo, con 3 sigilli)
   · capitolo 2: la galleria (travi da schivare abbassandosi o saltando)
   · capitolo 3: in sella al Tiranno rosso
   · capitolo 8: la fuga tra i frammenti della città che crolla
   · modalità extra: Boss Rush, Sopravvivenza, Sfida a tempo
   ============================================================ */

/* ---------------- mosse in coppia ---------------- */
function partnerThrow(S, p, mate) {
  // p launches the partner who is jumping right next to them
  p.st = 'throw'; p.t = 0;
  mate.st = 'cannon'; mate.t = 0; mate.face = p.face; mate.vx = p.face * 900; mate.vz = 460; mate.z = Math.max(mate.z, 40);
  mate.hit = new Set(); mate.inv = Math.max(mate.inv, 0.9); mate.atk = null;
  S.pairMoves++;
  sfx(S, 'heavy'); sfx(S, 'jump');
  ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 220), s: 'LANCIO IN COPPIA!', c: heroOf(mate).color, big: 1 });
}
function pairSlam(S, p, e) {
  // two heroes grab the same enemy, lift it and slam it down
  const holder = S.players.find((q) => q.id === e.holder);
  if (holder) { holder.st = 'pairslam'; holder.t = 0; holder.hold = 0; }
  p.st = 'pairslam'; p.t = 0; p.face = e.x > p.x ? 1 : -1;
  e.st = 'slam'; e.t = 0; e.holder = 0; e.slamBy = p.id; e.inv = 0;
  S.pairMoves++;
  sfx(S, 'special');
  ev(S, { t: 'pop', x: Math.round(e.x), y: Math.round(e.y - 230), s: 'PRESA DOPPIA!', c: '#ffe08a', big: 1 });
}

/* ---------------- evocazione del titano ---------------- */
function summonTitan(S, p) {
  const b = BEAST_OF[p.hero] || 'rex';
  S.summonUsed = true;
  S.summon = { id: nid(), b, t: 0, by: p.id, x: S.cam - 380, y: 640, hit: new Set() };
  for (const q of alivePlayers(S)) q.inv = Math.max(q.inv, 2.8);
  p.st = 'pose'; p.t = 1.6;
  ev(S, { t: 'flash', c: heroOf(p).glow, v: 0.7 }); shake(S, 10);
  ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 230), s: 'EVOCAZIONE!', c: heroOf(p).color, big: 1 });
  S.banner = { text: BEAST_NAME[b] + '!', sub: 'IL TITANO DI ' + heroOf(p).name + ' ACCORRE IN AIUTO', t: 2.2 };
  sfx(S, 'team'); sfx(S, 'bosswind');
}
function stepSummon(S, dt) {
  const m = S.summon;
  if (!m) return;
  m.t += dt;
  if (m.t < 0.45) return;
  m.x += 920 * dt;
  if (Math.floor(m.t * 4) !== Math.floor((m.t - dt) * 4)) { shake(S, 7); sfx(S, 'stomp'); }
  const owner = S.players.find((q) => q.id === m.by);
  for (const e of S.enemies) {
    if (m.hit.has(e.id) || !hittable(e) || Math.abs(e.x - m.x) > 170) continue;
    m.hit.add(e.id);
    const wasGuard = e.guarding; e.guarding = false;
    damageEnemy(S, owner, e, e.boss ? Math.min(140, e.max * 0.08) : 95, { knock: true, heavy: true, unblockable: true, from: m.x - 10 });
    e.guarding = wasGuard;
  }
  for (const o of S.props) if (o.hp > 0 && !m.hit.has(o.id) && Math.abs(o.x - m.x) < 120 && !SOLID[o.type]) { m.hit.add(o.id); hitProp(S, o, owner); }
  if (m.x > S.cam + W + 420) S.summon = null;
}

/* ---------------- capitolo 3: in sella al Tiranno rosso ---------------- */
const RIDE_Z = 150, RIDE_SC = 1.0;   // 1.10: the titan towers over the soldiers; the Sentinels are inside its Heart (not drawn)
const RIDE_SEATS = [-18, -70, 28, -118];
function startRide(S) {
  const n = S.players.filter((p) => !p.out).length || 1;
  const x = clamp(S.cam + 360, 320, S.L.length - 320);
  S.ride = { id: nid(), x, y: 610, face: 1, st: 'roar', t: 0, hp: 420 + 120 * n, max: 420 + 120 * n, walk: 0, inv: 0, flash: 0, roarCd: 0, alpha: 1 };
  for (const p of S.players) {
    if (p.out) continue;
    // the titan picks everybody up, even who was down
    if (p.st === 'dead' || p.st === 'ko' || p.hp <= 0) p.hp = Math.round(p.max * 0.5);
    p.riding = true; p.st = 'idle'; p.t = 0; p.z = 0; p.atk = null; p.hold = 0; p.inv = 0; p.run = false;
  }
  placeRiders(S);
  S.banner = { text: 'IL TIRANNO ROSSO COMBATTE CON VOI!', sub: 'LO GUIDATE CON I CUORI · ATTACCO: MORSO · SALTO: CODATA · SPECIALE: RUGGITO · PISTOLA: SFERE DI FUOCO', t: 4 };
  ev(S, { t: 'flash', c: '#ff8a5a', v: 0.6 }); shake(S, 14); sfx(S, 'bosswind'); sfx(S, 'stomp');
}
function placeRiders(S) {
  const R = S.ride;
  S.players.filter((p) => p.riding).forEach((p, i) => {
    p.x = R.x + RIDE_SEATS[i % 4] * R.face; p.y = R.y + 1 + i * 0.1; p.face = R.face; p.z = 0;
  });
}
function hurtRide(S, dmg, opt) {
  const R = S.ride;
  if (!R || R.leaving || R.inv > 0) return false;
  dmg = Math.max(1, Math.round(dmg * DIFF.dmg * 0.8));
  R.hp -= dmg; R.inv = 0.35; R.flash = 0.12; S.dmgTaken += dmg;
  if (R.st === 'idle' || R.st === 'walk') { R.st = 'hurt'; R.t = 0; }
  sparks(S, R.x, R.y - 170, '#ff6a5e', 12); sfx(S, 'hurt'); shake(S, 6);
  if (R.hp <= 0) endRide(S, false);
  return true;
}
function endRide(S, ok) {
  const R = S.ride;
  if (!R || R.leaving) return;
  R.leaving = true; R.st = ok ? 'roar' : 'down'; R.t = 0; R.hp = Math.max(0, R.hp);
  S.players.filter((p) => p.riding).forEach((p, i) => {
    p.riding = false; p.st = 'drop'; p.t = 0; p.z = RIDE_Z; p.vz = 0; p.inv = 2;
    p.x = clamp(R.x + (i - 1.5) * 70, S.cam + 60, S.cam + W - 60);
  });
  S.rideDone = true;
  S.banner = ok ? { text: 'GRAZIE, TIRANNO ROSSO!', sub: 'IL TITANO TORNA NELLA FORESTA · AVANTI A PIEDI', t: 3 } : { text: 'IL TITANO È STREMATO!', sub: 'SI CONTINUA A PIEDI', t: 3 };
  sfx(S, ok ? 'bosswind' : 'heavy');
}
function stepRide(S, ctrls, dt) {
  const R = S.ride;
  if (!R) return;
  R.t += dt; R.inv = Math.max(0, R.inv - dt); R.flash = Math.max(0, R.flash - dt); R.roarCd = Math.max(0, R.roarCd - dt);
  if (R.leaving) {
    if (R.st === 'down') { if (R.t > 1.4) R.alpha = Math.max(0, 1 - (R.t - 1.4) / 0.6); if (R.t > 2) S.ride = null; }
    else { if (R.t > 1) { R.st = 'walk'; R.face = 1; R.x += 560 * dt; R.walk += dt * 7; } if (R.x > S.cam + W + 420) S.ride = null; }
    return;
  }
  const riders = S.players.filter((p) => p.riding);
  if (!riders.length) { endRide(S, false); return; }
  let dx = 0, dy = 0;
  const press = {};
  for (const p of riders) {
    const c = ctrls[p.id] || EMPTY_CTRL;
    dx += (c.r ? 1 : 0) - (c.l ? 1 : 0); dy += (c.d ? 1 : 0) - (c.u ? 1 : 0);
    for (const k of ['punch', 'jump', 'special', 'team']) if (c.pressed[k] && !press[k]) press[k] = p;
    // every rider shoots with their own blaster from the back of the titan
    if (c.pressed.shoot) { if (p.ammo > 0) { p.face = R.face; p.aim = c.u ? 1 : 0; const ox = p.x, oy = p.y; p.x = R.x + R.face * 190; p.y = R.y; fireBolt(S, p); p.x = ox; p.y = oy; } else sfx(S, 'empty'); }
  }
  dx = clamp(dx, -1, 1); dy = clamp(dy, -1, 1);
  const hitFront = (x0, x1, depth, dmg, who) => {
    for (const e of S.enemies) {
      if (!hittable(e)) continue;
      const rx = (e.x - R.x) * R.face;
      if (rx > x0 && rx < x1 && Math.abs(e.y - R.y) < depth) damageEnemy(S, who, e, dmg, { knock: true, heavy: true, from: R.x });
    }
    for (const o of S.props) { const rx = (o.x - R.x) * R.face; if (o.hp > 0 && rx > x0 && rx < x1 && Math.abs(o.y - R.y) < depth) hitProp(S, o, who); }
  };
  switch (R.st) {
    case 'roar':
      if (R.t > 0.3 && !R.did) { R.did = true; stunAll(S, R, R.by || riders[0], R.first !== false); }
      if (R.t > 1.0) { R.st = 'idle'; R.t = 0; R.did = false; R.first = false; }
      break;
    case 'idle': case 'walk': {
      if (press.team && S.team >= 100) { teamAttack(S, press.team); break; }
      if (press.punch) { R.st = 'bite'; R.t = 0; R.did = false; R.by = press.punch; sfx(S, 'wind'); break; }
      if (press.jump) { R.st = 'tail'; R.t = 0; R.did = false; R.by = press.jump; sfx(S, 'wind'); break; }
      if (press.special) {
        if (R.roarCd <= 0) { R.st = 'roar'; R.t = 0; R.did = false; R.roarCd = 7; R.by = press.special; sfx(S, 'bosswind'); break; }
        floatText(S, R.x, R.y - 330, 'RUGGITO IN CARICA…', '#ffb0a0', 16);
      }
      if (dx) R.face = dx;
      R.x += dx * 250 * dt; R.y += dy * 150 * dt;
      R.st = dx || dy ? 'walk' : 'idle'; if (dx || dy) R.walk += dt * 5;
      break;
    }
    case 'bite':
      if (R.t < 0.2) R.x += R.face * 260 * dt;
      if (R.t > 0.16 && !R.did) { R.did = true; sfx(S, 'heavy'); shake(S, 8); sparks(S, R.x + R.face * 270, R.y - 190, '#ffe0a0', 14, 'slash'); hitFront(-60, 520, 110, 44, R.by); }
      if (R.t > 0.42) { R.st = 'idle'; R.t = 0; }
      break;
    case 'tail':
      if (R.t > 0.22 && !R.did) { R.did = true; sfx(S, 'heavy'); shake(S, 8); ev(S, { t: 'ring', x: Math.round(R.x - R.face * 200), y: Math.round(R.y), c: '#ff8a5a', r: 320, life: 0.4 }); hitFront(-520, 90, 115, 30, R.by); }
      if (R.t > 0.5) { R.st = 'idle'; R.t = 0; }
      break;
    case 'hurt': if (R.t > 0.28) { R.st = 'idle'; R.t = 0; } break;
  }
  const lo = S.cam + 250, hi = S.camLock !== null ? S.camLock + W - 250 : Math.min(S.L.length - 250, S.cam + W - 250);
  R.x = clamp(R.x, lo, hi); R.y = clamp(R.y, FLOOR_TOP + 40, FLOOR_BOTTOM);
  placeRiders(S);
  // the titan picks up what it walks over (its whole body, not just the feet): it goes to the nearest Sentinel
  const nearest = riders[0];
  if (nearest) collectItems(S, nearest, R.x, R.y, 190, 60, 0);
}
function stunAll(S, R, who, intro) {
  ev(S, { t: 'ring', x: Math.round(R.x + R.face * 120), y: Math.round(R.y - 20), c: '#ff5b4f', r: 520, life: 0.7 }); ev(S, { t: 'flash', c: '#ff8a5a', v: 0.35 }); shake(S, 16); sfx(S, 'stomp');
  if (!intro) ev(S, { t: 'pop', x: Math.round(R.x), y: Math.round(R.y - 360), s: 'RUGGITO!', c: '#ff5b4f', big: 1 });
  for (const e of S.enemies) {
    if (!hittable(e) || e.x < S.cam - 40 || e.x > S.cam + W + 40) continue;
    if (!e.boss) { damageEnemy(S, who, e, intro ? 6 : 14, { noKnock: true, from: R.x }); if (e.hp > 0 && !e.def.flying) { e.st = 'hurt'; e.t = -1.3; } }
  }
}
function rideFrame(R) {
  // rexb: 0 guardia · 1 passo · 2 morso · 3 codata · 4 carica · 5 ruggito · 6 colpito · 7 a terra
  switch (R.st) {
    case 'walk': return 'rexb_' + (Math.floor(R.walk * 2) % 2 ? 1 : 0);
    case 'bite': return 'rexb_2';
    case 'tail': return 'rexb_3';
    case 'roar': return 'rexb_5';
    case 'hurt': return 'rexb_6';
    case 'down': return R.t < 0.3 ? 'rexb_6' : 'rexb_7';
  }
  return 'rexb_0';
}

/* ---------------- capitolo 2: la galleria ---------------- */
function beamX(h, y) { return h.x - (y - 465) / 255 * GAP_SLANT; }
function stepTunnel(S, dt) {
  const z = S.L.zones[S.zoneIdx];
  const active = !!(S.L.train && z && z.tunnel && S.zoneOn);
  S.tun = clamp((S.tun || 0) + (active ? dt : -dt) * 1.4, 0, 1);
  if (!active) return;
  if (S.tunT === undefined) { S.tunT = 0; S.beamT = 2.2; S.banner = { text: 'LA GALLERIA!', sub: 'TRAVI BASSE: TIENI SCHIVATA PER ABBASSARTI · BARRIERE: SALTA', t: 3.4 }; }
  S.tunT += dt;
  S.beamT -= dt;
  if (S.beamT <= 0 && S.tunT < z.tunnel - 1.5) {
    S.beamT = rand(2.3, 3.3);
    S.haz.push({ id: nid(), type: 'beam', kind: Math.random() < 0.5 ? 'high' : 'low', x: S.cam + W + 190, y: 600, t: -1.2, hit: new Set() });
    sfx(S, 'siren');
  }
}
function tunnelBlocked(S) { const z = S.L.zones[S.zoneIdx]; return !!(z && z.tunnel && (S.tunT || 0) < z.tunnel); }
function stepBeam(S, h, dt) {
  if (h.t < 0) return;
  h.x -= 980 * dt;
  if (Math.floor(h.t * 10) !== Math.floor((h.t - dt) * 10) && Math.abs(h.x - S.cam - W / 2) < W / 2) { /* whoosh */ }
  for (const p of S.players) {
    if (p.out || p.st === 'dead' || p.st === 'ko' || h.hit.has(p.id) || p.riding) continue;
    if (Math.abs(beamX(h, p.y) - p.x) > 34) continue;
    h.hit.add(p.id);
    const safe = h.kind === 'high' ? ['duck', 'dodge', 'down', 'knock'].includes(p.st) : p.z > 44;
    if (safe) { p.score += 200; floatText(S, p.x, p.y - 170, 'SCHIVATO!', '#9fe8ff', 16); }
    else { p.inv = 0; hurtPlayer(S, p, 14, { knock: true, from: p.x + 60 }); floatText(S, p.x, p.y - 190, h.kind === 'high' ? 'ABBASSATI!' : 'SALTA!', '#ffb0a0', 18); }
  }
  for (const e of S.enemies) {
    if (h.hit.has(e.id) || !hittable(e) || e.boss || e.def.flying) continue;
    if (Math.abs(beamX(h, e.y) - e.x) > 34) continue;
    h.hit.add(e.id);
    if (h.kind === 'low' && (e.z || 0) > 44) continue;
    damageEnemy(S, null, e, 30, { knock: true, heavy: true, from: e.x + 60 });
  }
  if (h.x < S.cam - 260) h.dead = true;
}

/* ---------------- capitolo 8: la fuga dal crollo ---------------- */
function startEscape(S, z) {
  S.zoneOn = true; S.camLock = null;
  S.escape = { end: clamp(z.x - 380 + z.escape, 0, S.L.length - W), spd: 170, spawnT: 1.2, rockT: 1.4 };
  S.banner = { text: 'IL CROLLO!', sub: 'LA FORTEZZA SI SGRETOLA: CORRETE E NON RESTATE INDIETRO', t: 3.2 };
  ev(S, { t: 'flash', c: '#c07bff', v: 0.5 }); shake(S, 18); sfx(S, 'siren'); sfx(S, 'boom');
}
function stepEscape(S, z, dt) {
  const E = S.escape;
  if (!E) return;
  S.cam = Math.min(E.end, S.cam + E.spd * dt);
  if (Math.random() < dt * 1.5) shake(S, 3);
  E.rockT -= dt;
  if (E.rockT <= 0) {
    E.rockT = rand(0.6, 1.1);
    const tgt = Math.random() < 0.45 ? pick(alivePlayers(S)) : null;
    const x = tgt ? tgt.x + rand(-40, 120) : S.cam + rand(260, W + 120), y = tgt ? tgt.y : rand(FLOOR_TOP + 10, FLOOR_BOTTOM - 10);
    S.haz.push({ id: nid(), type: 'debris', x, y: clamp(y, FLOOR_TOP, FLOOR_BOTTOM), t: -1.3, rot: rand(0, 6) });
  }
  E.spawnT -= dt;
  if (E.spawnT <= 0 && S.enemies.filter((e) => e.hp > 0).length < 5 && S.cam < E.end - 400) {
    E.spawnT = rand(2, 3.2);
    const type = pick(['shade', 'ninja', 'lancer', 'drone', 'dog', 'soldier']);
    const e = spawnEnemy(S, type, S.cam + W + 60, rand(FLOOR_TOP + 20, FLOOR_BOTTOM - 10));
    if (type === 'drone') e.z = 170;
  }
  // whoever stays behind is swallowed by the void
  for (const e of S.enemies) if (!e.boss && e.hp > 0 && e.x < S.cam - 50 && !['fall', 'dead'].includes(e.st)) { e.st = 'fall'; e.t = 0; e.hp = 0; }
  if (S.cam >= E.end - 0.5) {
    S.escape = null; S.zoneOn = false; S.zoneIdx++;
    ev(S, { t: 'go' }); ev(S, { t: 'pop', x: 640, y: 230, s: 'CE L\'AVETE FATTA!', c: '#ffd35a', big: 1, fixed: 1 });
    for (const p of alivePlayers(S)) { p.hp = Math.min(p.max, p.hp + 25); p.score += 3000; }
  }
}
function stepDebris(S, h, dt) {
  if (h.t >= 0 && !h.done) {
    h.done = true;
    ev(S, { t: 'boom', x: Math.round(h.x), y: Math.round(h.y - 10) }); sfx(S, 'heavy'); shake(S, 8);
    sparks(S, h.x, h.y - 20, '#b77dff', 12, 'chip');
    for (const p of S.players) if (!p.out && !['dead', 'ko'].includes(p.st) && Math.hypot(p.x - h.x, (p.y - h.y) * 1.6) < 85 && p.z < 70) hurtPlayer(S, p, 16, { knock: true, from: h.x });
    for (const e of S.enemies) if (hittable(e) && !e.boss && Math.hypot(e.x - h.x, (e.y - h.y) * 1.6) < 85) damageEnemy(S, null, e, 45, { knock: true, heavy: true, from: h.x });
  }
  if (h.t > 0.6 || h.x < S.cam - 200) h.dead = true;
}

/* ---------------- modalità extra ---------------- */
function rushLevel(i) {
  const L = LEVELS[i], z = L.zones.find((q) => q.boss);
  return { n: `${i + 1}/8`, id: 'rush', title: 'BOSS RUSH', place: L.place, bg: L.bg, length: W + 100, music: L.music, rush: true, zones: [{ x: 380, name: z.name, boss: z.boss }], intro: [], outro: [] };
}
const SURV_BG = ['port', 'harbor', 'park', 'theater', 'siege', 'graveyard', 'veil', 'dawn'];
function survivalLevel() {
  return { n: '∞', id: 'survival', title: 'SOPRAVVIVENZA', place: 'ARENA DEI SENTINELS', bg: 'port', length: W + 100, music: 4, survival: true, zones: [{ x: 380, name: 'SOPRAVVIVENZA' }], intro: [], outro: [] };
}
function stepSurvival(S, dt) {
  S.camLock = 0; S.cam = 0; S.zoneOn = true;
  const V = S.sv || (S.sv = { wave: 0, breakT: 2.2, queue: [] });
  const alive = S.enemies.filter((e) => e.hp > 0).length;
  // trickle in the rest of the wave
  if (V.queue.length && alive < 6) {
    V.qT = (V.qT || 0) - dt;
    if (V.qT <= 0) { V.qT = 0.5; const type = V.queue.shift(); const side = Math.random() < 0.5 ? -1 : 1; const e = spawnEnemy(S, type, side > 0 ? W + 60 : -60, rand(FLOOR_TOP + 20, FLOOR_BOTTOM - 10)); if (type === 'drone') e.z = 170; }
  }
  const bossAnim = S.enemies.some((e) => e.boss && e.st === 'dead');
  if (alive === 0 && !V.queue.length && !bossAnim) {
    if (V.breakT === null) {
      V.breakT = 3;
      if (V.wave > 0) {
        for (const p of alivePlayers(S)) { p.score += 250 * V.wave; p.hp = Math.min(p.max, p.hp + 8); }
        ev(S, { t: 'pop', x: 640, y: 230, s: `ONDATA ${V.wave} SUPERATA!`, c: '#ffd35a', big: 1, fixed: 1 });
        if (V.wave % 3 === 0) { const it = makeItem(Math.random() < 0.4 ? 'chicken' : 'pizza', rand(300, 980), rand(560, 660), 200); it.vz = 0; S.items.push(it); }
        if (V.wave % 3 === 0) { const it = makeItem('ammo', rand(300, 980), rand(560, 660), 200); S.items.push(it); }
      }
    }
    V.breakT -= dt;
    if (V.breakT <= 0) { V.breakT = null; V.wave++; spawnSurvivalWave(S, V.wave); }
  }
}
function spawnSurvivalWave(S, w) {
  const V = S.sv;
  S.boost = 1 + (w - 1) * 0.07;
  S.lvl = Math.min(5, Math.floor((w - 1) / 2));   // enemy damage grows with the level (6-7 would bring low gravity)
  S.L.bg = SURV_BG[Math.floor((w - 1) / 4) % SURV_BG.length];
  const pool = ['soldier'];
  if (w >= 2) pool.push('lancer'); if (w >= 3) pool.push('dog'); if (w >= 4) pool.push('brute');
  if (w >= 6) pool.push('shield', 'grenadier'); if (w >= 7) pool.push('ninja', 'drone'); if (w >= 9) pool.push('shade', 'segment');
  const n = Math.min(18, 3 + Math.floor(w * 1.1) + Math.max(0, alivePlayers(S).length - 1) * 2);
  V.queue = Array.from({ length: n }, () => pick(pool));
  V.qT = 0;
  S.banner = { text: `ONDATA ${w}`, sub: w % 5 === 0 ? 'ARRIVA UN BOSS!' : 'RESISTETE!', t: 2.2, boss: w % 5 === 0 };
  sfx(S, 'siren');
  if (w % 5 === 0) {
    const bosses = w >= 15 ? Object.keys(BOSSES) : ['mastice', 'centipede', 'trivor', 'mimesi', 'kharon', 'custode'];
    const key = bosses[(w / 5 - 1) % bosses.length];
    const b = spawnBoss(S, key, W + 120, 600);
    b.hp = b.max = Math.round(b.max * 0.55);
    V.queue = V.queue.slice(0, Math.ceil(n / 2));
  }
}

/* ---------------- step, view, HUD ---------------- */
function stepExtra(S, ctrls, dt) {
  stepRide(S, ctrls, dt);
  stepSummon(S, dt);
  if (S.L.train) stepTunnel(S, dt);
  for (const h of S.haz) {
    if (h.type === 'beam') stepBeam(S, h, dt);
    else if (h.type === 'debris') stepDebris(S, h, dt);
  }
  if (S.taT !== undefined && !S.taStop) S.taT += dt;
}
function extraView(S, d, r) {
  const R = S.ride;
  if (R) d.push({ i: R.id, s: 'giants', f: rideFrame(R), x: r(R.x), y: r(R.y), fc: R.face, sc: RIDE_SC, sh: 120, fl: R.flash > 0 ? 1 : 0, a: R.alpha < 1 ? +R.alpha.toFixed(2) : undefined, au: R.st === 'roar' && R.t > 0.25 && R.t < 0.7 ? '#ff5b4f' : undefined });
  const m = S.summon;
  if (m) d.push({ i: m.id, s: beastSheet(`beast_${m.b}_run`), f: `beast_${m.b}_${m.t < 0.45 ? 'roar' : 'run'}`, x: r(m.x), y: m.y, z: m.b === 'ptero' ? 150 : 0, fc: 1, sc: 1.3, sh: 110, gh: 1, au: BEAST_COL[BEASTS.indexOf(m.b)] || (m.b === 'dragon' ? '#3fd06a' : '#ff5b4f') });
  for (const h of S.haz) {
    if (h.type === 'beam' && h.t >= 0) d.push({ i: h.id, bm: h.kind, x: r(h.x), y: h.kind === 'high' ? 721 : 466 });
    else if (h.type === 'debris') {
      if (h.t < 0) d.push({ i: h.id, tg: [r(h.x), r(h.y), 80], x: r(h.x), y: r(h.y), s: 'extra', f: 'rock', z: r(760 * (-h.t / 1.3)), sc: 0.42, r: +(h.rot + h.t * 3).toFixed(2), sh: 0 });
      else d.push({ i: h.id, s: 'extra', f: 'rock', x: r(h.x), y: r(h.y), sc: 0.42, r: +h.rot.toFixed(2), sh: 34, a: +clamp((0.6 - h.t) / 0.3, 0, 1).toFixed(2) });
    }
  }
}
function extraHud(S) {
  const o = {};
  if (S.ride && !S.ride.leaving) o.rd = [Math.max(0, Math.round(S.ride.hp)), S.ride.max, S.ride.roarCd > 0 ? 0 : 1];
  if (S.tun) o.tun = +S.tun.toFixed(2);
  const w = S.haz.find((h) => h.type === 'beam' && h.t < 0);
  if (w) o.tw = w.kind;
  if (S.escape) o.esc = +clamp(1 - (S.escape.end - S.cam) / 2600, 0, 1).toFixed(3);
  if (S.summonOK && !S.summonUsed && !S.L.bonus) o.sm = 1;
  if (S.sv) o.sv = S.sv.wave;
  if (S.taT !== undefined) o.ta = +S.taT.toFixed(1);
  if (S.L.rush) o.rush = S.L.n;
  if (S.coinBase !== undefined) o.cn = S.coinBase + S.coins;
  if (S.vs) o.vs = [S.vs.k, +S.vs.t.toFixed(2), S.players.filter((p) => !p.out).map((p) => p.hero)];
  return o;
}
