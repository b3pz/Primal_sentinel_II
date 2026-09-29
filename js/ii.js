'use strict';
/* ============================================================
   PRIMAL SENTINELS II — le meccaniche nuove
   · FORMA STELLARE: la barra stella (capitoli con l'armatura Cuori di Stella)
     si riempie colpendo; piena, SPECIALE trasforma per 12 secondi
   · MOSSE DI COPPIA: due speciali quasi insieme e vicini = colpo combinato
   · DRONI RIPROGRAMMATI: il chip di Ferrea porta un drone dalla vostra parte
   · ACQUA ALTA: a Venezia l'acqua sale e rallenta tutti
   ============================================================ */
const STAR_TIME = 12;
const STAR_GAIN = { hit: 2.2, ko: 7 };
const II_STATS = { star: 0, pair: 0, ally: 0 };   // counters for the tests

/* ---------------- Forma Stellare ---------------- */
function starGain(S, p, v) {
  if (!S.L.stella || S.L.unarmored || !p || p.score === undefined || p.starT > 0 || p.hero === undefined || heroOf(p).sheet) return;
  const was = p.star || 0;
  p.star = Math.min(100, was + v);
  if (was < 100 && p.star >= 100) {
    ev(S, { t: 'pop', x: Math.round(p.x), y: Math.round(p.y - 230), s: 'STELLA PRONTA!', c: '#ffd35a', big: 1 });
    sfx(S, 'confirm');
  }
}
function canStar(S, p) { return S.L.stella && !S.L.unarmored && (p.star || 0) >= 100 && !(p.starT > 0) && !heroOf(p).sheet && !p.civil; }
function stellarForm(S, p) {
  const hero = heroOf(p);
  p.star = 0; p.starT = STAR_TIME; p.en = 100; II_STATS.star++;
  p.st = 'pose'; p.teamTo = null; p.t = 1.4; p.starPose = 1; p.inv = Math.max(p.inv, 1.4);
  S.hitstop = 0.12;
  ev(S, { t: 'flash', c: '#ffe9a0', v: 0.75 }); shake(S, 12);
  ev(S, { t: 'ring', x: Math.round(p.x), y: Math.round(p.y), r: 260, life: 0.8, c: '#ffd35a' });
  ev(S, { t: 'ring', x: Math.round(p.x), y: Math.round(p.y), r: 170, life: 0.6, c: hero.color });
  sparks(S, p.x, p.y - 120, '#ffd35a', 30, 'fire');
  S.banner = { text: 'FORMA STELLARE!', sub: hero.name + ' · IL CUORE DI STELLA BRUCIA', t: 1.8 };
  sfx(S, 'team'); sfx(S, 'special');
}
function stepStar(S, p, dt) {
  if (!(p.starT > 0)) return;
  p.starT -= dt;
  if (Math.floor(p.starT * 6) !== Math.floor((p.starT + dt) * 6)) sparks(S, p.x + rand(-30, 30), p.y - rand(40, 170), '#ffe08a', 2, 'trail');
  if (p.starT <= 0) { p.starT = 0; floatText(S, p.x, p.y - 190, 'FORMA STELLARE FINITA', '#ffe3a0', 15); }
}

/* ---------------- mosse di coppia ---------------- */
const PAIR_NAMES = {
  'azur+ignis': 'ALI DI FUOCO', 'ignis+lyra': 'ZANNE DEL SOLE', 'aura+ignis': 'CANTO DI FIAMMA', 'ignis+onyx': 'MAGLIO ARDENTE',
  'azur+lyra': 'TEMPESTA D\'ARTIGLI', 'aura+azur': 'VENTO SUL MARE', 'azur+onyx': 'PICCHIATA DEL TORO',
  'aura+lyra': 'ULULATO DELLE ONDE', 'lyra+onyx': 'CARICA DEI SETTE COLLI', 'aura+onyx': 'MAREGGIATA DI FERRO',
};
function pairName(a, b) {
  const ids = [heroOf(a).id, heroOf(b).id].sort();
  if (ids.includes('rigel')) return 'LAMA DELLE DUE STELLE';
  return PAIR_NAMES[ids.join('+')] || 'CUORI GEMELLI';
}
function tryPairSpecial(S, p) {
  p.spAt = S.t;
  if (S.L.unarmored || S.pairFx) return;
  const q = S.players.find((o) => o !== p && !o.out && !o.civil && o.st !== 'ko' && o.st !== 'dead' && o.spAt !== undefined && S.t - o.spAt < 0.6 && Math.abs(o.x - p.x) < 340 && Math.abs(o.y - p.y) < 140);
  if (!q) return;
  p.spAt = q.spAt = undefined;
  const x = (p.x + q.x) / 2, y = (p.y + q.y) / 2;
  S.pairFx = { t: 0, x, y, a: p.id, b: q.id, ca: heroOf(p).color, cb: heroOf(q).color, done: false };
  S.banner = { text: pairName(p, q) + '!', sub: 'MOSSA DI COPPIA · ' + heroOf(p).name + ' + ' + heroOf(q).name, t: 1.8 };
  S.pairMoves = (S.pairMoves || 0) + 1; II_STATS.pair++;
  ev(S, { t: 'flash', c: '#ffffff', v: 0.4 }); sfx(S, 'team');
}
function stepPairFx(S, dt) {
  const F = S.pairFx;
  if (!F) return;
  F.t += dt;
  if (F.t < 0.35) { if (Math.floor(F.t * 20) % 2) sparks(S, F.x + rand(-80, 80), F.y - rand(40, 200), Math.random() < 0.5 ? F.ca : F.cb, 3, 'trail'); return; }
  if (!F.done) {
    F.done = true;
    const owner = S.players.find((o) => o.id === F.a) || S.players[0];
    ev(S, { t: 'ring', x: Math.round(F.x), y: Math.round(F.y), r: 560, life: 0.7, c: F.ca });
    ev(S, { t: 'ring', x: Math.round(F.x), y: Math.round(F.y), r: 420, life: 0.6, c: F.cb });
    ev(S, { t: 'boom', x: Math.round(F.x), y: Math.round(F.y - 80), big: 1 });
    ev(S, { t: 'flash', c: F.ca, v: 0.5 }); shake(S, 20); sfx(S, 'boom');
    for (const e of S.enemies) {
      if (!hittable(e) || Math.abs(e.x - F.x) > 560 || Math.abs(e.y - F.y) > 200) continue;
      const wasGuard = e.guarding; e.guarding = false;
      damageEnemy(S, owner, e, e.boss ? Math.min(150, e.max * 0.07) : 80, { knock: true, heavy: true, unblockable: true, from: F.x });
      e.guarding = wasGuard;
    }
    for (const o of S.props) if (o.hp > 0 && Math.abs(o.x - F.x) < 400 && !SOLID[o.type]) hitProp(S, o, owner);
  }
  if (F.t > 1) S.pairFx = null;
}

/* ---------------- droni riprogrammati ---------------- */
function reprogramDrone(S, p) {
  let best = null, bd = 1e9;
  for (const e of S.enemies) {
    if (e.hp <= 0 || e.boss || !e.def || e.def.sheet !== 'drone2') continue;
    const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
    if (d < bd && e.x > S.cam - 40 && e.x < S.cam + W + 40) { bd = d; best = e; }
  }
  let x = p.x - p.face * 90, y = p.y;
  if (best) { x = best.x; y = best.y; best.hp = 0; best.st = 'dead'; best.t = 1.2; best.gone = true; }
  S.allies = S.allies || [];
  if (S.allies.length >= 3) S.allies.shift();
  II_STATS.ally++;
  S.allies.push({ id: nid(), x, y, z: 150, by: p.id, t: 0, life: 22, cd: 0.8, face: p.face, flash: 0.3 });
  ev(S, { t: 'pop', x: Math.round(x), y: Math.round(y - 260), s: best ? 'DRONE RIPROGRAMMATO!' : 'DRONE ALLEATO!', c: '#6fe0ff', big: 1 });
  sparks(S, x, y - 150, '#6fe0ff', 20); sfx(S, 'confirm');
}
function stepAllies(S, dt) {
  if (!S.allies || !S.allies.length) return;
  for (const a of S.allies) {
    a.t += dt; a.life -= dt; a.cd -= dt; a.flash = Math.max(0, a.flash - dt);
    const owner = S.players.find((o) => o.id === a.by && !o.out) || S.players.find((o) => !o.out);
    let tgt = null, bd = 1e9;
    for (const e of S.enemies) {
      if (!hittable(e) || e.x < S.cam - 20 || e.x > S.cam + W + 20) continue;
      const d = Math.abs(e.x - a.x) + Math.abs(e.y - a.y) * 1.5;
      if (d < bd) { bd = d; tgt = e; }
    }
    // hover next to its Sentinel, or in range of the target
    const hx = tgt ? tgt.x - Math.sign(tgt.x - a.x || 1) * 260 : owner ? owner.x - owner.face * 90 : a.x;
    const hy = tgt ? tgt.y : owner ? owner.y - 10 : a.y;
    a.x += clamp(hx - a.x, -260 * dt, 260 * dt); a.y += clamp(hy - a.y, -160 * dt, 160 * dt);
    a.z = (tgt ? 100 : 150) + Math.sin(a.t * 3) * 10;
    a.face = tgt ? Math.sign(tgt.x - a.x) || 1 : owner ? owner.face : a.face;
    if (tgt && a.cd <= 0 && Math.abs(tgt.x - a.x) < 620) {
      a.cd = 1.1; a.shotT = 0.18;
      damageEnemy(S, owner, tgt, tgt.boss ? 10 : 16, { from: a.x });
      ev(S, { t: 'beam', x: Math.round(a.x + a.face * 60), y: Math.round(a.y - a.z + 10), dir: a.face, len: Math.round(Math.abs(tgt.x - a.x) - 40), c: '#6fe0ff', w: 8 });
      sparks(S, tgt.x, tgt.y - 110, '#6fe0ff', 8); sfx(S, 'laser');
    }
    if (a.shotT > 0) a.shotT -= dt;
  }
  for (const a of S.allies) if (a.life <= 0) { ev(S, { t: 'boom', x: Math.round(a.x), y: Math.round(a.y - a.z) }); sfx(S, 'boom'); }
  S.allies = S.allies.filter((a) => a.life > 0);
}

/* ---------------- acqua alta (Venezia) ---------------- */
const AQ_PERIOD = 34, AQ_RISE = 3, AQ_HIGH = 11, AQ_FALL = 2.5;
function stepAcqua(S, dt) {
  if (S.L.id !== 'venezia' || S.phase !== 'stage') { S.aq = 0; return; }
  S.aqT = (S.aqT ?? 14) + dt;
  const k = S.aqT % AQ_PERIOD;
  const prev = S.aq || 0;
  S.aq = k < AQ_RISE ? k / AQ_RISE : k < AQ_RISE + AQ_HIGH ? 1 : k < AQ_RISE + AQ_HIGH + AQ_FALL ? 1 - (k - AQ_RISE - AQ_HIGH) / AQ_FALL : 0;
  if (prev === 0 && S.aq > 0) { S.banner = { text: 'ACQUA ALTA!', sub: 'LA LAGUNA SALE: TUTTI PIÙ LENTI, SALTATE!', t: 2.2 }; sfx(S, 'siren'); }
  if (S.aq > 0.5) for (const p of S.players) if (!p.out && p.st === 'walk' && p.z <= 0 && Math.random() < dt * 6) sparks(S, p.x + rand(-20, 20), p.y - 4, '#cfeaff', 4, 'dust');
}
function aqSlow(S) { return 1 - 0.32 * (S.aq || 0); }
function drawAcquaAlta(a, t, cam) {
  if (!a) return;
  const top = 462 + (1 - a) * 260;
  g.save();
  const gr = g.createLinearGradient(0, top, 0, H);
  gr.addColorStop(0, `rgba(120,200,230,${0.42 * a})`); gr.addColorStop(1, `rgba(30,90,130,${0.6 * a})`);
  g.fillStyle = gr; g.fillRect(0, top, W, H - top);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = `rgba(200,240,255,${0.35 * a})`; g.lineWidth = 2;
  for (let row = 0; row < 7; row++) {
    const y = top + 18 + row * 36;
    g.beginPath();
    for (let x = -20; x <= W + 20; x += 20) { const yy = y + Math.sin((x + cam * 0.6) * 0.03 + t * 2 + row) * 4; if (x === -20) g.moveTo(x, yy); else g.lineTo(x, yy); }
    g.stroke();
  }
  g.restore();
}

/* ---------------- hooks ---------------- */
function stepII(S, dt) {
  for (const p of S.players) stepStar(S, p, dt);
  stepPairFx(S, dt);
  stepAllies(S, dt);
  stepAcqua(S, dt);
}
function iiView(S, d, r) {
  for (const a of S.allies || []) {
    const f = a.shotT > 0 ? 2 : Math.floor(a.t * 6) % 2;
    d.push({ i: a.id, s: 'drone2', f: `droneF_${f}`, x: r(a.x), y: r(a.y), z: r(a.z), fc: a.face, sc: 1.05, sh: 34, au: '#6fe0ff', a: a.life < 3 && Math.floor(a.t * 8) % 2 ? 0.5 : undefined });
  }
}
function iiHud(S) {
  const o = {};
  if (S.aq) o.aq = +S.aq.toFixed(2);
  if (S.L.stella && !S.L.unarmored) o.st = S.players.map((p) => heroOf(p).sheet ? -1 : p.starT > 0 ? -Math.max(1, Math.ceil(p.starT)) - 1 : Math.round(p.star || 0));
  return o;
}
