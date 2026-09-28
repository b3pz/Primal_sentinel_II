'use strict';
/* ============================================================
   DUELLO TRA GIGANTI — titano (o Concordia) contro mostro gigante.
   Tutti i giocatori pilotano insieme: ogni pilota può attaccare,
   parare e contribuire alla barra dell'arma finale.
   ============================================================ */
const TITAN_KINDS = {
  rex: { key: 'rex_side', name: 'TIRANNO ROSSO', scale: 1.75, hp: 520, jab: 'MORSO', heavy: 'CODATA', fin: 'RUGGITO PRIMORDIALE', color: '#ff5b4f' },
  concordia: { key: 'concordia_side', name: 'CONCORDIA', scale: 1.22, hp: 620, jab: 'PUGNO ZANNA', heavy: 'CARICA DEL CORNO', fin: 'ARMA FINALE · CUORE UNITO', color: '#ffd35a' },
  // Primal Sentinels II: the folk titans (placeholder art: Concordia recoloured until their sheets arrive)
  leone: { base: 'concordia', name: 'LEONE ALATO', scale: 1.22, hp: 560, jab: 'ARTIGLIO DI BRONZO', heavy: 'VOLO DEL LEONE', fin: 'RUGGITO DI SAN MARCO', color: '#ff5b4f', tint: '#c8342a' },
  lupa: { base: 'concordia', name: 'LUPA', scale: 1.22, hp: 540, jab: 'MORSO RAPIDO', heavy: 'BALZO DEI SETTE COLLI', fin: 'ULULATO DELLA LUPA', color: '#f7d046', tint: '#d8a820' },
  sirena: { base: 'concordia', name: 'SIRENA DELLO STRETTO', scale: 1.22, hp: 560, jab: 'ONDA', heavy: 'CANTO DI SCILLA', fin: 'FATA MORGANA', color: '#ff78bb', tint: '#d0508f' },
  paladino: { base: 'concordia', name: 'PALADINO', scale: 1.22, hp: 680, jab: 'SPADONE', heavy: 'CARICA DEL CAVALIERE', fin: 'DURLINDANA', color: '#ffd35a' },
  paladinoS: { base: 'concordia', name: 'PALADINO STELLARE', finalName: 'PALADINO STELLARE', scale: 1.22, hp: 700, jab: 'SPADONE STELLARE', heavy: 'ALI D\'ARGENTO', fin: 'CUORI DI STELLA', color: '#bfe6ff', tint: '#dff4ff' },
};

function newGiant(levelIdx, players, prev) {
  const L = LEVELS[levelIdx];
  const conf = L.giant;
  const T = TITAN_KINDS[conf.player];
  const E = GIANTS[conf.enemy];
  const final = !!conf.final;
  const hpMul = 1 + (players.length - 1) * 0.12;
  return {
    phase: 'giant', lvl: levelIdx, L, t: 0, events: [], hitstop: 0, conf, T, E, final,
    players: players.map((p, i) => ({ id: p.id, slot: i, hero: p.hero, name: p.name, score: p.score || 0, lives: p.lives ?? 3, act: 0 })),
    pl: { x: 330, hp: T.hp * (final ? 1.2 : 1), max: T.hp * (final ? 1.2 : 1), st: 'intro', t: 0, cool: 0, en: 40, guard: false, flash: 0, off: 0 },
    en: { x: 930, hp: E.hp * hpMul, max: E.hp * hpMul, st: 'intro', t: 0, bal: 100, cool: 2.2, move: null, flash: 0, off: 0, pat: 0, walk: 0 },
    shots: [], result: null, banner: { text: final ? (T.finalName || 'CONCORDIA ALBA') : T.name, sub: 'VS ' + E.name, t: 3 },
  };
}

/* 1.11 — the duel has real rhythm:
   · ATTACCO ×3 = combo (the third hit pushes the monster back); mashing makes it BLOCK and counter
   · PARATA pressed just before the hit = PARATA PERFETTA (no damage, stuns it, 1.2 s of counter-attack ×1.6)
     held for long = normal parry (35% of the damage; the beam goes through at 60%)
   · SALTO = jump (over the shockwave) · ◀ + SALTO = dodge back (invulnerable, beats swipes and charges)
   · CODATA while it winds up a swipe or a charge = INTERROTTO
   · its PRESA starts a SCONTRO: every pilot mashes ATTACCO to win the arm-wrestling
   · below half health it goes into FURIA: faster, grabs more often */
function stepGiant(G, ctrls, dt) {
  G.events.length = 0;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.slowT > 0) { G.slowT -= dt; dt *= 0.3; }   // final blow: slow motion
  G.t += dt;
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  const P = G.pl, E = G.en, T = G.T;
  P.t += dt; E.t += dt;
  P.flash = Math.max(0, P.flash - dt); E.flash = Math.max(0, E.flash - dt);
  P.cool = Math.max(0, P.cool - dt); P.inv = Math.max(0, (P.inv || 0) - dt);
  G.counter = Math.max(0, (G.counter || 0) - dt); G.comboT = Math.max(0, (G.comboT || 0) - dt);
  const gev = (e) => G.events.push(e);
  const say = (s, c = '#fff1a6', size = 30) => gev({ t: 'txt', x: 640, y: 270, s, c, size, fixed: 1 });

  // merge controls of every pilot
  let dx = 0, guard = false, mash = 0;
  const press = { punch: null, shoot: null, special: null, jump: null };
  for (const pl of G.players) {
    const c = ctrls[pl.id] || EMPTY_CTRL;
    dx += (c.r ? 1 : 0) - (c.l ? 1 : 0);
    if (c.held.dodge || c.held.team) guard = true;
    for (const k of Object.keys(press)) if (c.pressed[k] && !press[k]) press[k] = pl;
    if (c.pressed.punch || c.pressed.shoot) { mash++; if (G.clash) credit(G, pl, 20); }
    pl.act = Math.max(0, pl.act - dt);
    if (Object.keys(press).some((k) => press[k] === pl) || c.held.dodge) pl.act = 0.3;
  }
  dx = clamp(dx, -1, 1);
  P.guardT = guard ? (P.guardT || 0) + dt : 0;

  // ---- SCONTRO: arm-wrestling, every pilot mashes ATTACCO
  if (G.clash) {
    const C = G.clash, n = G.players.length;
    C.t += dt;
    C.p += mash * 7 / Math.max(1, n * 0.7) - dt * (E.hp < E.max * 0.5 ? 30 : 24);
    if (C.p >= 100 || C.p <= 0 || C.t > 5) {
      const won = C.p >= 50;
      G.clash = null; P.st = 'idle'; P.t = 0; E.t = 0;
      if (won) {
        say('PROIEZIONE!', '#7bf0b1', 40);
        E.st = 'hurt'; E.x += 260;
        gev({ t: 'boom', x: E.x - 60, y: 600, big: 1 }); gev({ t: 'shake', v: 22 }); gev({ t: 'snd', n: 'boom' });
        giantHitEnemy(G, 55, 45, true);
      } else {
        say('RESPINTO!', '#ff8a7a', 36);
        E.st = 'recover'; E.move = 'swipe';
        giantHitPlayer(G, G.E.dmg + 12, true);
        P.x -= 120;
      }
    } else if (Math.floor(C.t * 8) !== Math.floor((C.t - dt) * 8)) gev({ t: 'shake', v: 5 });
    P.x = clamp(P.x, 180, E.x - 300);
    stepGiantShots(G, dt);
    return;
  }

  // ---- player titan
  const dist = () => E.x - P.x;
  switch (P.st) {
    case 'intro': if (P.t > 1.5) { P.st = 'idle'; P.t = 0; } break;
    case 'idle': case 'walk': case 'guard': {
      P.guard = guard;
      if (press.jump && P.cool <= 0) {
        if (dx < 0) { P.st = 'dodge'; P.t = 0; P.inv = 0.42; gev({ t: 'snd', n: 'dodge' }); }
        else { P.st = 'hop'; P.t = 0; gev({ t: 'snd', n: 'jump' }); gev({ t: 'shake', v: 4 }); }
        break;
      }
      if (guard) { P.st = 'guard'; break; }
      if (press.special) {
        if (E.st === 'stagger') { P.st = 'finisher'; P.t = 0; G.hitstop = 0.15; gev({ t: 'snd', n: 'team' }); gev({ t: 'flash', c: '#ffffff', v: 0.7 }); credit(G, press.special, 800); break; }
        if (P.en >= 50) { P.en -= 50; P.st = 'heavy'; P.t = 0; P.super = true; P.hitDone = false; gev({ t: 'snd', n: 'special' }); credit(G, press.special, 200); break; }
      }
      if (press.punch && P.cool <= 0) { P.st = 'jab'; P.t = 0; P.hitDone = false; P.combo = G.comboT > 0 ? (P.combo + 1) % 3 : 0; P.buf = false; gev({ t: 'snd', n: P.combo === 2 ? 'wind' : 'punch' }); credit(G, press.punch, 50); break; }
      if (press.shoot && P.cool <= 0) { P.st = 'heavy'; P.t = 0; P.super = false; P.hitDone = false; gev({ t: 'snd', n: 'wind' }); credit(G, press.shoot, 80); break; }
      if (dx) { P.x += dx * 175 * dt; P.st = 'walk'; if (Math.floor(G.t * 2.4) !== Math.floor((G.t - dt) * 2.4)) gev({ t: 'snd', n: 'stomp' }), gev({ t: 'shake', v: 3 }); }
      else P.st = 'idle';
      break;
    }
    case 'dodge': P.x -= 560 * dt * (1 - P.t / 0.4); if (P.t > 0.4) { P.st = 'idle'; P.cool = 0.12; } break;
    case 'hop': if (P.t > 0.6) { P.st = 'idle'; P.cool = 0.1; gev({ t: 'shake', v: 8 }); gev({ t: 'snd', n: 'stomp' }); } break;
    case 'jab': {
      if (press.punch && P.t > 0.1) P.buf = true;
      if (P.t > 0.14 && !P.hitDone) {
        P.hitDone = true;
        const third = P.combo === 2;
        P.x += third ? 30 : 12;
        if (dist() < 520) giantHitEnemy(G, third ? 26 : 14, third ? 22 : 8, third, false, third ? 120 : 22, true);
        G.comboT = 0.55;
      }
      if (P.t > (P.combo === 2 ? 0.46 : 0.3)) {
        if (P.buf && P.combo < 2) { P.t = 0; P.hitDone = false; P.combo++; P.buf = false; gev({ t: 'snd', n: P.combo === 2 ? 'wind' : 'punch' }); }
        else { P.st = 'idle'; P.cool = P.combo === 2 ? 0.35 : 0.06; if (P.combo === 2) G.comboT = 0; }
      }
      break;
    }
    case 'heavy': {
      const wind = P.super ? 0.35 : 0.45;
      if (P.t > wind && !P.hitDone) {
        P.hitDone = true;
        if (dist() < 560) {
          // interrupting its wind-up
          if (E.st === 'wind' && ['swipe', 'charge', 'grapple'].includes(E.move)) { say('INTERROTTO!', '#7bf0b1', 34); E.st = 'hurt'; E.t = 0; E.cool = 1; giantHitEnemy(G, P.super ? 60 : 30, P.super ? 45 : 32, true, false, 160); }
          else giantHitEnemy(G, P.super ? 60 : 32, P.super ? 40 : 24, true, false, P.super ? 200 : 130);
        } else gev({ t: 'shake', v: 6 });
        P.super = false;
      }
      if (P.t > wind + 0.4) { P.st = 'idle'; P.cool = 0.2; }
      break;
    }
    case 'finisher': {
      if (P.t > 0.6 && !P.hitDone) {
        P.hitDone = true;
        gev({ t: 'beam', x: P.x + 150, y: 330, dir: 1, len: 900, c: T.color, big: 1 });
        giantHitEnemy(G, Math.round(E.max * (G.final ? 0.3 : 0.34)), 0, true, true, 180);
      }
      if (P.t > 1.6) { P.st = 'idle'; P.hitDone = false; if (E.st === 'stagger') { E.st = 'recover'; E.t = 0; E.bal = 100; } }
      break;
    }
    case 'hurt': if (P.t > 0.45) P.st = 'idle'; break;
    case 'down': if (P.t > 2.5) { G.result = 'lose'; } break;
  }
  P.x = clamp(P.x, 160, E.x - 300);

  // ---- enemy giant
  const phase2 = E.hp < E.max * 0.5;
  if (phase2 && !G.fury && E.st !== 'dead') { G.fury = true; G.banner = { text: 'FURIA!', sub: G.E.name + ' È ALLO STREMO: ATTACCHI PIÙ VELOCI E PIÙ PRESE', t: 2.4 }; gev({ t: 'snd', n: 'bosswind' }); }
  // mashing the same button: it closes its guard and answers
  G.jabs = (G.jabs || []).filter((x) => G.t - x < 2.2);
  switch (E.st) {
    case 'intro': E.walk += dt * 3; if (E.t > 1.6) { E.st = 'idle'; E.t = 0; } break;
    case 'idle': {
      E.cool -= dt * (phase2 ? 1.35 : 1);
      E.bal = Math.min(100, E.bal + dt * 3);
      const want = 420;
      if (Math.abs(dist() - want) > 30) { E.x -= Math.sign(dist() - want) * 120 * dt; E.walk += dt * 3; }
      if (G.jabs.length >= 5) { E.st = 'block'; E.t = 0; G.jabs = []; say('SI PROTEGGE! USA LA CODATA', '#ffd0a0', 26); break; }
      if (E.cool <= 0) {
        const pattern = G.final ? ['swipe', 'beam', 'grapple', 'charge', 'rain', 'stomp', 'swipe', 'beam']
          : phase2 ? ['swipe', 'grapple', 'charge', 'stomp', 'grapple', 'beam'] : ['swipe', 'charge', 'swipe', 'grapple', 'beam', 'stomp'];
        E.move = pattern[E.pat++ % pattern.length];
        E.st = 'wind'; E.t = 0; gev({ t: 'snd', n: 'bosswind' });
      }
      break;
    }
    case 'block': if (E.t > 1.0) { E.st = 'wind'; E.t = 0.55; E.move = 'swipe'; gev({ t: 'snd', n: 'bosswind' }); } break;   // quick counter
    case 'wind': {
      const wt = { swipe: 0.9, charge: 1.0, beam: 1.2, stomp: 1.0, rain: 1.1, grapple: 1.0 }[E.move] * (phase2 ? 0.8 : 1);
      if (E.t > wt) { E.st = 'atk'; E.t = 0; E.hitDone = false; }
      break;
    }
    case 'atk': {
      const m = E.move;
      if (m === 'charge' || m === 'grapple') {
        E.x -= (m === 'charge' ? 900 : 700) * dt;
        if (!E.hitDone && dist() < 320) {
          E.hitDone = true;
          if (m === 'grapple' && P.inv <= 0 && P.st !== 'down' && P.st !== 'finisher') {
            G.clash = { p: 50, t: 0 }; P.st = 'clash'; E.st = 'clash'; E.t = 0; E.x = P.x + 330;
            gev({ t: 'snd', n: 'heavy' }); gev({ t: 'shake', v: 18 }); gev({ t: 'flash', c: '#ffffff', v: 0.4 });
            break;
          }
          if (m === 'charge') giantHitPlayer(G, G.E.dmg + 9);
        }
        if (dist() < 300 || E.t > 0.8) { E.st = 'recover'; E.t = 0; }
      } else if (!E.hitDone) {
        E.hitDone = true;
        if (m === 'swipe') { if (dist() < 580) giantHitPlayer(G, G.E.dmg); gev({ t: 'snd', n: 'heavy' }); }
        if (m === 'beam') { gev({ t: 'beam', x: E.x - 160, y: 360, dir: -1, len: 1100, c: '#c07bff', big: 1 }); gev({ t: 'snd', n: 'laser' }); giantHitPlayer(G, G.E.dmg + 6, false, true); }
        if (m === 'stomp') { gev({ t: 'shock', x: E.x - 120, y: 640, dir: -1 }); gev({ t: 'snd', n: 'stomp' }); gev({ t: 'shake', v: 16 }); G.shock = { x: E.x - 120, t: 0 }; }
        if (m === 'rain') { for (let i = 0; i < 5; i++) G.shots.push({ x: P.x - 200 + i * 110 + rand(-30, 30), y: -60 - i * 90, vy: 620, hit: false }); gev({ t: 'snd', n: 'laser' }); }
      }
      if (m !== 'charge' && m !== 'grapple' && E.t > 0.6) { E.st = 'recover'; E.t = 0; }
      break;
    }
    case 'recover': {
      if (E.move === 'charge' || E.move === 'grapple') E.x += 200 * dt;
      if (E.t > 0.7) { E.st = 'idle'; E.t = 0; E.cool = rand(1.0, 1.8) * (phase2 ? 0.75 : 1); }
      break;
    }
    case 'hurt': if (E.t > 0.45) { E.st = 'idle'; E.t = 0; E.cool = Math.max(E.cool, 0.5); } break;
    case 'stagger': if (E.t > 3.2) { E.st = 'idle'; E.t = 0; E.bal = 60; } break;
    case 'dead': {
      if (E.t < 2.6 && Math.random() < dt * 16) gev({ t: 'boom', x: E.x + rand(-160, 160), y: rand(180, 600), big: 1 });
      if (Math.random() < dt * 5) gev({ t: 'snd', n: 'boom' });
      if (E.t > 3.2) G.result = 'win';
      break;
    }
  }
  E.x = clamp(E.x, P.x + 300, 1150);
  stepGiantShots(G, dt);
}
function stepGiantShots(G, dt) {
  const P = G.pl;
  // shockwave travelling along the ground: jump over it
  if (G.shock) {
    G.shock.t += dt; G.shock.x -= 700 * dt;
    if (!G.shock.hit && Math.abs(G.shock.x - P.x) < 90) { G.shock.hit = true; if (P.st === 'hop' && P.t > 0.08 && P.t < 0.55) { G.events.push({ t: 'txt', x: 640, y: 270, s: 'SCHIVATO!', c: '#7bf0b1', size: 30, fixed: 1 }); G.pl.en = Math.min(100, G.pl.en + 10); } else giantHitPlayer(G, G.E.dmg, true); }
    if (G.shock.x < -100) G.shock = null;
  }
  for (const s of G.shots) {
    s.y += s.vy * dt;
    if (!s.hit && s.y > 420 && Math.abs(s.x - P.x) < 140) { s.hit = true; giantHitPlayer(G, 9, true); }
    if (s.y > 700 && !s.boomed) { s.boomed = true; G.events.push({ t: 'boom', x: s.x, y: 690, big: 1 }); }
  }
  G.shots = G.shots.filter((s) => s.y < 760);
}

function credit(G, pl, pts) { if (pl) { pl.score += pts; } }

function giantHitEnemy(G, dmg, bal, heavy = false, finisher = false, push = 0, jab = false) {
  const E = G.en;
  if (E.st === 'dead') return;
  if (jab) G.jabs = (G.jabs || []).concat(G.t);
  if (E.st === 'block' && !finisher) {
    if (heavy) { E.st = 'hurt'; E.t = 0; E.bal -= 30; G.events.push({ t: 'txt', x: 640, y: 270, s: 'GUARDIA SFONDATA!', c: '#7bf0b1', size: 32, fixed: 1 }); }
    else { G.events.push({ t: 'spark', x: E.x - 120, y: 380, c: '#bfe6ff', n: 10, big: 1 }); G.events.push({ t: 'snd', n: 'weapon' }); return; }
  }
  const staggered = E.st === 'stagger';
  if (E.st === 'wind' && !heavy && !staggered) { dmg *= 0.6; }
  const ctr = G.counter > 0 && !finisher;
  if (ctr) { dmg *= 1.6; bal *= 2; }
  E.hp -= Math.round(dmg * (staggered && !finisher ? 1.5 : 1));
  E.flash = 0.15; E.off = heavy ? 40 : 18;
  if (push && !staggered) E.x += push;
  G.pl.en = Math.min(100, G.pl.en + (heavy ? 10 : 6));
  G.players.forEach((p) => p.score += Math.round(dmg * 8));
  G.events.push({ t: 'spark', x: E.x - 90, y: 360 + rand(-60, 60), c: ctr ? '#7bf0b1' : '#ffd06a', n: heavy ? 26 : 14, big: 1 });
  G.events.push({ t: 'snd', n: heavy ? 'heavy' : 'hit' });
  G.events.push({ t: 'shake', v: heavy ? 14 : 7 });
  if (ctr && heavy) G.events.push({ t: 'txt', x: E.x - 100, y: 260, s: 'CONTRATTACCO!', c: '#7bf0b1', size: 26 });
  G.hitstop = heavy ? 0.09 : 0.05;
  if (!staggered) {
    E.bal -= bal;
    if (E.bal <= 0 && E.hp > 0) {
      E.st = 'stagger'; E.t = 0; E.bal = 0;
      G.events.push({ t: 'txt', x: 640, y: 180, s: 'SBILANCIATO! PREMI SPECIALE!', c: '#fff1a6', size: 34, fixed: 1 });
      G.events.push({ t: 'snd', n: 'siren' });
    } else if (heavy && E.st !== 'atk') { E.st = 'hurt'; E.t = 0; }
  }
  if (E.hp <= 0) {
    E.hp = 0; E.st = 'dead'; E.t = 0; G.hitstop = 0.3; G.slowT = 1.8;
    G.events.push({ t: 'flash', c: '#ffffff', v: 1 });
    G.events.push({ t: 'pop', x: 640, y: 270, s: 'K.O.!', c: '#ffd35a', big: 1, fixed: 1 });
    G.events.push({ t: 'snd', n: 'boom' });
  }
}

function giantHitPlayer(G, dmg, unblockable = false, beam = false) {
  const P = G.pl;
  if (P.st === 'finisher' || P.st === 'down') return;
  if (P.inv > 0 && !unblockable) { G.events.push({ t: 'txt', x: 640, y: 270, s: 'SCHIVATO!', c: '#7bf0b1', size: 30, fixed: 1 }); P.en = Math.min(100, P.en + 8); return; }
  const guarding = (P.guard || P.st === 'guard') && !unblockable;
  if (guarding && P.guardT < 0.28) {
    // PARATA PERFETTA: no damage, it staggers back, counter-attack window
    G.counter = 1.2; P.en = Math.min(100, P.en + 15);
    G.en.bal -= 30; if (G.en.st !== 'stagger' && G.en.st !== 'dead') { G.en.st = G.en.bal <= 0 ? 'stagger' : 'hurt'; G.en.t = 0; if (G.en.bal <= 0) G.en.bal = 0; }
    G.events.push({ t: 'spark', x: P.x + 180, y: 380, c: '#ffffff', n: 34, big: 1 });
    G.events.push({ t: 'txt', x: 640, y: 270, s: 'PARATA PERFETTA! CONTRATTACCA!', c: '#7bf0b1', size: 32, fixed: 1 });
    G.events.push({ t: 'snd', n: 'team' }); G.events.push({ t: 'flash', c: '#bfe6ff', v: 0.35 });
    G.hitstop = 0.12;
    return;
  }
  if (guarding) {
    dmg = Math.round(dmg * (beam ? 0.6 : 0.35));
    G.events.push({ t: 'spark', x: P.x + 140, y: 380, c: '#bfe6ff', n: 22, big: 1 });
    G.events.push({ t: 'txt', x: P.x + 60, y: 200, s: beam ? 'IL RAGGIO PASSA!' : 'PARATA', c: '#bfe6ff', size: 22 });
    G.events.push({ t: 'snd', n: 'weapon' });
    G.en.bal -= 6;
  } else {
    P.st = 'hurt'; P.t = 0; P.flash = 0.2; P.off = -40;
    G.events.push({ t: 'spark', x: P.x + 100, y: 380, c: '#ff7a5e', n: 22, big: 1 });
    G.events.push({ t: 'snd', n: 'hurt' });
    G.events.push({ t: 'shake', v: 16 });
  }
  P.hp -= dmg;
  if (P.hp <= 0) { P.hp = 0; P.st = 'down'; P.t = 0; G.events.push({ t: 'snd', n: 'ko' }); }
}

function buildGiantView(G) {
  const P = G.pl, E = G.en;
  P.off = lerp(P.off, 0, 0.2); E.off = lerp(E.off, 0, 0.2);
  // titan pose parameters (translation / rotation over time)
  let px = P.x, py = 690, prot = 0, psx = 1, glow = 0;
  const bob = Math.sin(G.t * 2.2) * 4;
  switch (P.st) {
    case 'jab': { const k = Math.sin(Math.min(1, P.t / 0.36) * Math.PI); px += k * 40; break; }
    case 'heavy': { const w = P.super ? 0.35 : 0.5; const k = P.t < w ? -P.t / w : Math.sin(Math.min(1, (P.t - w) / 0.4) * Math.PI); px += k * (k < 0 ? 30 : 80); glow = P.super ? 1 : 0; break; }
    case 'finisher': glow = 1; break;
    case 'hurt': px -= 20; break;
    case 'dodge': px -= 10; break;
    case 'clash': px += Math.sin(G.t * 30) * 6; break;
  }
  if (P.st === 'hop') py -= Math.sin(Math.min(1, P.t / 0.6) * Math.PI) * 150;
  // real poses from the generated sheets
  const rex = G.T === TITAN_KINDS.rex || G.T.base === 'rex';
  const heavyWind = P.st === 'heavy' && P.t < (P.super ? 0.35 : 0.5);
  const pf = {
    intro: rex ? 5 : 0, idle: 0, walk: [0, 1][Math.floor(G.t * 3) % 2], jab: 2,
    heavy: heavyWind ? (rex ? 4 : 1) : 3, guard: 4, step: rex ? 4 : 1, dodge: rex ? 4 : 1, hop: rex ? 4 : 1, clash: Math.floor(G.t * 10) % 2 ? 2 : (rex ? 4 : 1),
    finisher: rex ? 5 : 6, hurt: rex ? 6 : 5, down: 7,
  }[P.st] ?? 0;
  const eDef = G.E;
  // giant monster sheet: 0 idle · 1 wind-up · 2 attack · 3 hit · 4 defeated
  const ef = { wind: 1, atk: 2, recover: E.t < 0.35 ? 2 : 0, hurt: 3, stagger: 3, block: 1, clash: Math.floor(G.t * 10) % 2 ? 2 : 1, dead: E.t < 0.8 ? 3 : 4 }[E.st] ?? 0;
  return {
    m: 'giant', lv: G.lvl, bg: G.conf.bg, t: +G.t.toFixed(2),
    pl: { k: G.conf.player, f: (rex ? 'rexb_' : 'conc_') + pf, x: Math.round(px + P.off), y: Math.round(py + bob * 0.3), r: +prot.toFixed(3), sx: psx, gl: glow, fl: P.flash > 0 ? 1 : 0, gd: P.guard || P.st === 'guard' ? 1 : 0, fin: P.st === 'finisher' ? +P.t.toFixed(2) : 0, fz: G.final ? 1 : 0 },
    en: { s: eDef.sheet || 'giants', f: eDef.keys ? eDef.keys[ef] : `${eDef.sprite}G_${ef}`, ti: eDef.tint, ch: eDef.chains ? 1 : 0, st2: E.st, x: Math.round(E.x + E.off + (E.st === 'clash' ? Math.sin(G.t * 30 + 1) * 6 : 0)), y: 690, sc: 1, bk: E.st === 'block' ? 1 : 0, fl: E.flash > 0 || (E.st === 'dead' && Math.floor(E.t * 12) % 2) ? 1 : 0, wn: E.st === 'wind' ? E.move : 0, a: E.st === 'dead' ? +Math.max(0, 1 - Math.max(0, E.t - 2.2) / 0.8).toFixed(2) : 1, st: E.st === 'stagger' ? 1 : 0 },
    sh: G.shock ? Math.round(G.shock.x) : 0,
    rn: G.shots.map((s) => [Math.round(s.x), Math.round(s.y)]),
    hud: {
      p: G.players.map((p) => ({ h: p.hero, n: p.name, sc: p.score, act: p.act > 0 ? 1 : 0, lv: p.lives })),
      thp: Math.round(P.hp), tmx: Math.round(P.max), ten: Math.round(P.en), tn: G.final ? (G.T.finalName || 'CONCORDIA ALBA') : G.T.name,
      ehp: Math.round(E.hp), emx: Math.round(E.max), en: G.E.name, bal: Math.round(E.bal), stg: E.st === 'stagger' ? 1 : 0,
      ban: G.banner ? { t: G.banner.text, s: G.banner.sub, k: +G.banner.t.toFixed(2), e: +((G.banner.tot || (G.banner.tot = G.banner.t)) - G.banner.t).toFixed(2), b: 1 } : null,
      moves: [G.T.jab, G.T.heavy, G.T.fin],
      cl: G.clash ? +clamp(G.clash.p / 100, 0, 1).toFixed(3) : -1, cm: G.comboT > 0 && P.st === 'jab' ? P.combo + 1 : 0, ct: G.counter > 0 ? 1 : 0, fu: G.fury ? 1 : 0,
    },
    ev: G.events.slice(),
  };
}
