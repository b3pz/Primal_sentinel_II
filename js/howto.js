'use strict';
/* ============================================================
   COME SI GIOCA — tutorial animato in stile cabinato.
   A sinistra un ranger dimostra la mossa, a destra i tasti
   (tastiera, controller o due giocatori) si illuminano a tempo.
   ============================================================ */
const HOWTO_PAGE = 8.4;
const SCHEMES = ['kb', 'pad', 'kb2', 'touch'];
const SCHEME_NAMES = { kb: 'TASTIERA', pad: 'CONTROLLER', kb2: 'DUE GIOCATORI SU UNA TASTIERA', touch: 'TOUCH (TELEFONO / TABLET)' };
/* key labels follow the key maps (they can be changed in OPZIONI → COMANDI) */
function actKeys(scheme) {
  if (scheme === 'touch') return { up: '▲', left: '◀', down: '▼', right: '▶', punch: 'ATTACCO', shoot: 'PISTOLA', special: 'SPECIALE', jump: 'SALTO', dodge: 'SCHIVA', team: 'SQUADRA' };
  if (scheme === 'pad') {
    const b = (a) => PAD_NAMES[(PADMAP[a] || [])[0]] || '?';
    return { up: '▲', left: '◀', down: '▼', right: '▶', punch: b('punch'), shoot: b('shoot'), special: b('special'), jump: b('jump'), dodge: b('dodge'), team: b('team') };
  }
  const m = KEYMAPS[scheme === 'kb2' ? 'kbA' : scheme === 'kbB' ? 'kbB' : 'kb'];
  const k = (a) => codeLabel((m[a] || [])[0]);
  return { up: k('u'), left: k('l'), down: k('d'), right: k('r'), punch: k('punch'), shoot: k('shoot'), special: k('special'), jump: k('jump'), dodge: k('dodge'), team: k('team') };
}
const walkF = (t) => [1, 2, 3, 2][Math.floor(t * 8) % 4];

/* each page: title, caption(keys, state) and a script(t) → { hero pose, enemy, lit actions } */
const HOWTO = [
  {
    title: 'MUOVITI', cap: (k) => `${k.up} ${k.left} ${k.down} ${k.right}: CAMMINA · DOPPIO TOCCO ${k.right}: CORSA`,
    run(t) {
      const seq = [['right', 1.4], ['up', 1], ['left', 1.4], ['down', 1], ['dash', 2.2], ['idle', 1.4]];
      let acc = 0, x = 220, y = 560, act = 'idle', local = 0;
      for (const [a, d] of seq) {
        const k = clamp((t - acc) / d, 0, 1);
        if (a === 'right') x += k * 150; if (a === 'left') x -= k * 150;
        if (a === 'up') y -= k * 60; if (a === 'down') y += k * 60;
        if (t >= acc && t < acc + d) { act = a; local = t - acc; }
        acc += d;
      }
      if (act === 'dash') x = 220 + clamp((t - 5.8) / 2.2, 0, 1) * 300; else if (t > 8) x = 520;
      const walking = act !== 'idle';
      const lit = act === 'dash' ? (local < 0.12 || (local > 0.24 && local < 1.9) ? ['right'] : []) : walking ? [act] : [];
      return { x, y, face: act === 'left' ? -1 : 1, f: walking ? [1, 2, 3, 2][Math.floor(t * (act === 'dash' ? 14 : 8)) % 4] : 0, ghost: act === 'dash', lit, note: act === 'dash' ? 'CORSA!' : '' };
    },
  },
  {
    title: 'ATTACCO: LA COMBO', cap: (k) => `${k.punch} ${k.punch} ${k.punch} ${k.punch}: PUGNO, CALCIO E DUE COLPI CON LA TUA ARMA`,
    run(t) {
      const beats = [0.9, 1.25, 1.62, 2.05];
      let f = 0, wf = 0, lit = [], enemy = { f: 0, x: 540, rot: 0 };
      beats.forEach((b, i) => {
        if (t > b && t < b + 0.36) {
          lit = ['punch'];
          if (i === 0) f = t < b + 0.06 ? 4 : 5;
          else if (i === 1) f = t < b + 0.06 ? 4 : 6;
          else wf = t < b + 0.12 ? 8 : i === 3 ? 10 : 9;
          if (i < 3) enemy.f = 7;
        }
      });
      if (t > 2.2) { const k = clamp((t - 2.2) / 0.5, 0, 1); enemy.x = 540 + k * 150; enemy.rot = -k * 1.5; enemy.z = Math.sin(k * Math.PI) * 60; enemy.f = 7; }
      if (t > 4) { enemy.rot = -1.5 * clamp(1 - (t - 4) / 0.4, 0, 1); enemy.f = t > 4.4 ? 0 : 4; enemy.z = 0; enemy.x = 690 - clamp((t - 4.4) / 1, 0, 1) * 150; }
      const note = t > 0.9 && t < 1.25 ? 'PUGNO' : t > 1.25 && t < 1.62 ? 'CALCIO' : t > 1.62 && t < 2.05 ? 'ARMA!' : t > 2.05 && t < 2.9 ? 'COLPO FINALE!' : '';
      return { x: 420, y: 580, face: 1, f, wf, lit, enemy, note, slash: wf ? (wf === 10 ? 2 : 1) : 0 };
    },
  },
  {
    title: 'LA PISTOLA', cap: (k) => `${k.shoot}: SPARA · ${k.up} + ${k.shoot}: SPARA IN ALTO CONTRO I DRONI · CARICATORI NELLE CASSE E DAI NEMICI`,
    run(t) {
      const shots = [0.9, 1.5, 2.1];
      let f = 0, lit = [], gun = false, bolts = [], ammo = 8, enemy = { f: 0, x: 640 };
      shots.forEach((b) => {
        if (t > b) ammo--;
        if (t > b && t < b + 0.3) { f = t < b + 0.05 ? 4 : 5; gun = true; lit = ['shoot']; }
        const bx = 500 + (t - b) * 900;
        if (t > b && bx < 620) bolts.push(bx);
        if (bx >= 620 && t < b + 0.5) enemy.f = 7;
      });
      if (t > 4) { const k = clamp((t - 4) / 1, 0, 1); enemy.x = 640; if (t > 4.6 && t < 5.2) { enemy.f = 0; } }
      return { x: 420, y: 580, face: 1, f, lit, gun, bolts, ammoHud: ammo, enemy, note: t > 0.9 && t < 2.6 ? 'BANG!' : '' };
    },
  },
  {
    title: 'SALTO E CALCIO VOLANTE', cap: (k) => `${k.jump}: SALTO (SUL TRENO SALTA I BUCHI TRA I VAGONI) · ${k.jump} + ${k.punch}: CALCIO VOLANTE`,
    run(t) {
      let f = 0, lit = [], z = 0, x = 380, enemy = { f: 0, x: 580 };
      if (t > 0.8 && t < 1.6) { const k = (t - 0.8) / 0.8; z = Math.sin(k * Math.PI) * 130; f = 4; if (t < 0.95) lit = ['jump']; }
      if (t > 3 && t < 4.2) {
        const k = (t - 3) / 1.2; z = Math.sin(k * Math.PI) * 150; x = 380 + k * 140; f = t > 3.45 ? 6 : 4;
        lit = t < 3.15 ? ['jump'] : t > 3.45 && t < 3.6 ? ['punch'] : [];
        if (t > 3.6) { enemy.f = 7; enemy.rot = -clamp((t - 3.6) * 4, 0, 1.5); enemy.x = 580 + (t - 3.6) * 200; }
      }
      if (t >= 4.2) { x = 520; enemy.f = 7; enemy.rot = -1.5; enemy.x = 700; if (t > 5.5) { enemy.rot = 0; enemy.f = 0; enemy.x = 600; } }
      return { x, y: 580, z, face: 1, f, lit, enemy, note: t > 3.4 && t < 4.2 ? 'VOLANTE!' : '' };
    },
  },
  {
    title: 'PRESE E LANCI', cap: (k) => `CAMMINA CONTRO UN NEMICO: LO AFFERRI · ${k.punch} GINOCCHIATE · INDIETRO + ${k.punch} LANCIO ALLE SPALLE · ${k.jump} LANCIO IN AVANTI`,
    run(t) {
      let f = 0, lit = [], x = 440, face = 1, enemy = { f: 7, x: 520, face: -1, tag: t < 1.2 }, enemy2 = { f: 0, x: 250 };
      if (t < 1.2) { f = walkF(t); x = 380 + t * 50; lit = ['right']; }
      if (t > 1.2 && t < 3.1) { f = 4; enemy.x = x + 52; enemy.z = 14; lit = []; }
      [1.8, 2.4].forEach((b) => { if (t > b && t < b + 0.26) { lit = ['punch']; f = t > b + 0.08 ? 6 : 4; } });
      if (t > 3.1) {
        face = -1; lit = t < 3.3 ? ['left', 'punch'] : [];
        const k = clamp((t - 3.1) / 0.7, 0, 1);
        f = t < 3.4 ? 5 : 0;
        enemy.x = x - 52 - k * 150; enemy.z = Math.sin(k * Math.PI) * 90; enemy.rot = k * 1.5; enemy.face = 1;
        if (k >= 1) { enemy2.f = 7; enemy2.rot = clamp((t - 3.8) * 4, 0, 1.5); enemy2.x = 250 - clamp((t - 3.8) * 150, 0, 60); }
      }
      return { x, y: 580, face, f, lit, enemy, enemy2, note: t > 1.2 && t < 3.1 ? 'PRESO!' : t > 3.2 && t < 4.6 ? 'LANCIO ALLE SPALLE!' : '' };
    },
  },
  {
    title: 'MOSSA SPECIALE', cap: (k, s) => `${k.special}: ${HEROES[s.hero || 0].special} · ${HEROES[s.hero || 0].specialText.toUpperCase()} · 40 ENERGIA`,
    run(t, loop) {
      const hero = loop % 5;
      let f = 0, lit = [], weapon = null, fx = null, en = 100;
      if (t > 1 && t < 2.4) {
        const k = t - 1;
        lit = k < 0.2 ? ['special'] : []; en = 60;
        const id = HEROES[hero].id;
        f = id === 'onyx' ? (k < 0.3 ? 4 : 5) : id === 'lyra' ? (Math.floor(k / 0.08) % 2 ? 5 : 6) : k < 0.16 ? 4 : 5;
        weapon = id === 'ignis' ? clamp(-1.6 + k / 0.16 * 1.9, -1.6, 0.3) : id === 'onyx' ? (k < 0.3 ? -2.0 : 0.95) : 0;
        fx = { id, k };
      } else if (t >= 2.4) en = 60;
      return { hero, x: 360, y: 580, face: 1, f, lit, weapon, fx, en, note: t > 1 && t < 2.6 ? HEROES[hero].special : '', enemy: { f: t > 1.3 && t < 2.6 ? 7 : 0, x: 620, rot: t > 1.4 && t < 2.6 ? -1.4 : 0 } };
    },
  },
  {
    title: 'SCHIVATA E OGGETTI', cap: (k) => `${k.dodge}: SCHIVATA · ROMPI LE CASSE: DENTRO CIBO, ENERGIA E CARICATORI`,
    run(t) {
      let f = 0, lit = [], x = 440, ghost = false, enemy = { f: 0, x: 560 }, crate = true, food = null;
      if (t > 0.7 && t < 1.2) enemy.f = t < 0.95 ? 4 : 5;
      if (t > 0.85 && t < 1.15) { ghost = true; lit = ['dodge']; x = 440 - (t - 0.85) * 400; f = 1; }
      if (t >= 1.15) x = 320;
      if (t > 3 && t < 3.3) { f = t < 3.06 ? 4 : 5; lit = ['punch']; }
      if (t > 3.8 && t < 4.1) { f = t < 3.86 ? 4 : 6; lit = ['punch']; }
      if (t > 3.95) { crate = false; food = { x: 250, z: Math.max(0, Math.sin(clamp((t - 3.95) / 0.5, 0, 1) * Math.PI) * 50) }; }
      if (t > 5) { const k = clamp((t - 5) / 0.8, 0, 1); x = 320 - k * 70; f = k < 1 ? walkF(t) : 0; lit = k < 1 ? ['left'] : []; }
      if (t > 5.8) food = null;
      return { x, y: 580, face: t > 2.5 ? -1 : 1, f, lit, ghost, enemy, crate, food, note: t > 0.85 && t < 1.6 ? 'SCHIVATA!' : t > 5.8 && t < 7 ? '+30 VITA' : '' };
    },
  },
  {
    title: 'IN SQUADRA', cap: (k) => `VICINO A UN COMPAGNO K.O. TIENI ${k.punch}: LO RIANIMI · ${k.punch} MENTRE SALTA: LO LANCI · ${k.punch} SU UN NEMICO GIÀ AFFERRATO: PRESA DOPPIA · IL CIBO SI DIVIDE`,
    run(t, loop) {
      const mate = (HOWTO_STATE.hero + 1 + (loop % 4)) % 5;
      let f = 0, lit = [], x = 300, enemy = { f: 0, x: 600 }, partner = { hero: mate, x: 430, y: 600, face: 1, f: 14, ko: 0 }, note = '';
      if (t < 2.6) {
        // revive
        x = 300 + clamp(t / 0.6, 0, 1) * 60; f = t < 0.6 ? walkF(t) : 4; lit = t < 0.6 ? ['right'] : t < 2 ? ['punch'] : [];
        partner.ko = clamp((t - 0.6) / 1.4, 0, 1);
        if (t > 2) { partner.f = t < 2.2 ? 4 : 0; partner.ko = 0; note = 'IN PIEDI!'; } else note = t > 0.6 ? 'RIANIMA…' : 'K.O.!';
        enemy.hide = true;
      } else if (t < 5) {
        // partner throw
        const k = t - 2.6; x = 380; partner.x = 420; partner.f = 12;
        partner.z = k < 0.5 ? Math.sin(k / 0.5 * Math.PI / 2) * 90 : 90;
        if (k > 0.5 && k < 0.7) { lit = ['punch']; f = 5; }
        if (k > 0.6) { const q = clamp((k - 0.6) / 0.8, 0, 1); partner.x = 420 + q * 240; partner.z = 90 + Math.sin(q * Math.PI) * 60 - q * 90; partner.rot = q * 12; }
        if (k > 1.4) { partner.f = 0; partner.rot = 0; partner.z = 0; partner.x = 660; }
        if (k > 1.1) { enemy.f = 7; enemy.rot = -clamp((k - 1.1) * 4, 0, 1.5); enemy.x = 600 + clamp(k - 1.1, 0, 0.5) * 120; }
        note = k > 0.5 && k < 1.6 ? 'LANCIO IN COPPIA!' : '';
      } else {
        // double grab
        const k = t - 5; x = 400; f = 4; partner.x = 560; partner.face = -1; partner.f = 0;
        enemy.x = 470; enemy.f = 7; enemy.face = -1; enemy.z = 14;
        if (k > 0.6) { lit = ['punch']; partner.f = 8; }
        if (k > 0.7) { const q = clamp((k - 0.7) / 0.5, 0, 1); enemy.z = Math.sin(q * Math.PI) * 150; enemy.rot = q * 3; f = 8; partner.f = q > 0.5 ? 9 : 8; }
        if (k > 1.2) { enemy.z = 0; enemy.rot = -1.5; f = 9; partner.f = 9; }
        note = k > 0.6 ? 'PRESA DOPPIA!' : 'PRESO!';
        lit = k > 0.6 && k < 0.9 ? ['punch'] : [];
      }
      return { x, y: 580, face: 1, f, lit, enemy, partner, note };
    },
  },
  {
    title: 'TITANO E GALLERIA', cap: (k) => `CON 3 SIGILLI: TIENI ${k.team} PER EVOCARE IL TUO TITANO (UNA VOLTA PER CAPITOLO) · TIENI ${k.dodge}: TI ABBASSI SOTTO LE TRAVI`,
    run(t) {
      let f = 0, lit = [], note = '', beast = null, beam = null, x = 360;
      if (t < 1.2) { lit = ['team']; f = 4; note = 'TIENI PREMUTO…'; }
      else if (t < 3.6) { f = 0; beast = { x: -250 + (t - 1.2) * 520, f: t < 1.5 ? 'roar' : 'run' }; note = 'EVOCAZIONE!'; }
      else { const k = t - 3.6; beam = 760 - k * 300; const duck = beam < 560 && beam > 180; if (duck) { f = 4; lit = ['dodge']; } note = duck ? 'ABBASSATI!' : ''; }
      return { x, y: 580, face: 1, f, lit, note, beast, beam, duck: lit.includes('dodge'), enemy: { f: beast && beast.x > 420 ? 7 : 0, x: 600, rot: beast && beast.x > 500 ? -1.4 : 0 } };
    },
  },
  {
    title: 'COLPO DI SQUADRA', cap: (k) => `COLPISCI PER RIEMPIRE LA BARRA SQUADRA · ${k.team}: LE CINQUE ARMI DIVENTANO IL CANNONE PRIMORDIALE`,
    run(t) {
      const bar = clamp(t / 2.2, 0, 1);
      const lit = t > 2.6 && t < 2.9 ? ['team'] : [];
      if (t > 2.6 && !HOWTO_STATE.teamFired) { HOWTO_STATE.teamFired = true; FX.team = { t: 0, heroes: [HOWTO_STATE.hero || 0] }; Audio.sfx('team'); }
      return { x: 440, y: 580, face: 1, f: t < 2.2 ? [4, 5][Math.floor(t * 5) % 2] : 0, lit, team: bar, note: t > 2.2 && t < 2.6 ? 'BARRA PIENA!' : '', enemy: { f: t < 2.2 ? 7 : 0, x: 560 } };
    },
  },
  {
    title: 'DUELLI TRA GIGANTI', cap: (k) => `${k.punch}×3: COMBO · ${k.shoot}: CODATA (INTERROMPE) · ${k.dodge} AL MOMENTO GIUSTO: PARATA PERFETTA · ${k.jump}: SALTO · SCONTRO: PREMI ${k.punch} VELOCE · SBILANCIALO E ${k.special}: ARMA FINALE`,
    run(t) {
      let lit = [], guard = false, px = 380, beam = 0, stagger = false;
      if (t > 0.6 && t < 1.6) { guard = true; lit = ['dodge']; }
      [2.2, 2.6, 3.0, 3.4].forEach((b) => { if (t > b && t < b + 0.3) { lit = [b === 3.4 ? 'shoot' : 'punch']; px = 380 + Math.sin((t - b) / 0.3 * Math.PI) * 40; } });
      if (t > 3.8) stagger = true;
      if (t > 4.6 && t < 4.9) lit = ['special'];
      if (t > 4.9 && t < 6) beam = 1;
      return { giant: true, px, guard, beam, stagger, lit, bal: t < 2.2 ? 1 : clamp(1 - (t - 2.2) / 1.6, 0, 1), note: guard ? 'PARATA!' : stagger && t < 4.9 ? 'SBILANCIATO!' : beam ? 'ARMA FINALE!' : '' };
    },
  },
];
const HOWTO_STATE = { teamFired: false, hero: 0 };

function drawKey(x, y, label, lit, color, w = 58, h = 54) {
  const press = lit ? 4 : 0;
  g.fillStyle = '#05070c'; g.fillRect(x - 3, y - 3 + press, w + 6, h + 6);
  g.fillStyle = lit ? shadeCol(color) : '#3a4656'; g.fillRect(x, y + h - 8 + press, w, 8);
  g.fillStyle = lit ? color : '#c8d2dc'; g.fillRect(x, y + press, w, h - 8);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 4, y + 4 + press, w - 8, 4);
  if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45; g.fillStyle = color; g.fillRect(x - 10, y - 10 + press, w + 20, h + 20); g.restore(); }
  const sz = label.length > 3 ? 10 : 16;
  g.font = `400 ${sz}px ${PXFONT}`; g.textAlign = 'center'; g.fillStyle = '#10161e';
  g.fillText(label, x + w / 2, y + (h - 8) / 2 + sz / 2 + press);
}
function shadeCol(c) { return c === '#ffffff' ? '#9aa6b2' : c + '99'; }

function drawKeyboard(x, y, lit, color, scheme) {
  const k = actKeys(scheme === 'kb2' ? 'kb2' : 'kb');
  const L = (a) => lit.includes(a);
  const lab = (t, xx, yy) => ptxt(t, xx, yy, 8, '#9fb4c8', 'center');
  // movement cluster
  drawKey(x + 66, y, k.up, L('up'), color);
  drawKey(x, y + 62, k.left, L('left'), color);
  drawKey(x + 66, y + 62, k.down, L('down'), color);
  drawKey(x + 132, y + 62, k.right, L('right'), color);
  lab('MUOVI', x + 95, y + 136);
  // attack keys
  const bx = x + 250;
  drawKey(bx + 66, y, k.team, L('team'), '#ffd35a');
  lab('SQUADRA', bx + 95, y - 10);
  drawKey(bx, y + 62, k.punch, L('punch'), color);
  drawKey(bx + 66, y + 62, k.shoot, L('shoot'), color);
  drawKey(bx + 132, y + 62, k.special, L('special'), color);
  lab('ATTACCO', bx + 29, y + 136); lab('PISTOLA', bx + 95, y + 136); lab('SPECIALE', bx + 161, y + 136);
  // bottom row
  drawKey(x, y + 160, k.dodge, L('dodge'), color, 124);
  drawKey(x + 150, y + 160, k.jump, L('jump'), color, 280);
  lab('SCHIVATA', x + 62, y + 236); lab('SALTO', x + 290, y + 236);
  if (scheme === 'kb2') { const b = actKeys('kbB'); ptxt(`2P: ${b.up}${b.left}${b.down}${b.right} · ${b.punch} ATTACCO · ${b.shoot} PISTOLA · ${b.jump} SALTO · ${b.special} SPECIALE · ${b.team} SQUADRA`, x + 215, y + 272, 8, '#ffcf7a', 'center'); }
}
/* PlayStation symbols drawn as shapes (the pixel font has no ✕ ○ □ △) */
function padGlyph(i, x, y, r, col) {
  g.save(); g.strokeStyle = col; g.lineWidth = Math.max(2, r / 3.2); g.lineCap = 'round';
  g.beginPath();
  if (i === 0) { g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); }
  else if (i === 1) g.arc(x, y, r, 0, 7);
  else if (i === 2) g.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
  else if (i === 3) { g.moveTo(x, y - r * 1.05); g.lineTo(x + r, y + r * 0.75); g.lineTo(x - r, y + r * 0.75); g.closePath(); }
  g.stroke(); g.restore();
}
const PS_COL = ['#7fa8ff', '#ff5a5a', '#ff8ad8', '#4fe0b0'], XB_COL = ['#58e0a0', '#ff4a3d', '#3f86ff', '#f2c230'];
const ACT_SHORT = { punch: 'ATTACCO', shoot: 'PISTOLA', jump: 'SALTO', special: 'SPECIALE', dodge: 'SCHIVATA', team: 'SQUADRA', start: 'PAUSA' };
function padAct(i) { return Object.keys(PADMAP).find((a) => (PADMAP[a] || []).includes(i)); }
/* PlayStation: the controller picture (assets/ui/pad_ps.png) with the pressed buttons lighting up */
const PS_PAD_AT = { 0: [295, 131, 17], 1: [324, 102, 17], 2: [266, 102, 17], 3: [295, 72, 17], 4: [88, 16, 22], 5: [295, 16, 22], 8: [170, 122, 12], 9: [212, 122, 12],
  up: [88, 79, 14], down: [88, 122, 14], left: [65, 101, 14], right: [108, 101, 14] };
function drawPadPS(x, y, lit, color) {
  const L = (a) => lit.includes(a), img = IMG.pad_ps, sc = 1.2, ox = x + 2, oy = y + 10;
  g.drawImage(img, ox, oy, img.width * sc, img.height * sc);
  const glow = (k, col) => {
    const [px, py, r] = PS_PAD_AT[k], X = ox + px * sc, Y = oy + py * sc;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 + Math.sin(performance.now() / 90) * 0.1;
    g.fillStyle = col; g.beginPath(); g.arc(X, Y, r * sc * 1.6, 0, 7); g.fill(); g.restore();
    g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(X, Y, r * sc * 1.25, 0, 7); g.stroke(); g.restore();
    if (typeof k === 'number' && k < 4) padGlyph(k, X, Y, 7 * sc, '#ffffff');
  };
  for (const d of ['up', 'down', 'left', 'right']) if (L(d)) glow(d, color);
  // the buttons really pressed on the controller right now: white ring
  const lp = (Game.lastDevice || '').startsWith('pad') ? Input.pads().find((q) => q.index === +Game.lastDevice.slice(3)) : null;
  if (lp) { const rb = padButtons(lp); const k2 = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
    for (const i of [0, 1, 2, 3, 4, 5, 8, 9, 12, 13, 14, 15]) if (rb[i]) { const [px, py, r] = PS_PAD_AT[k2[i] || i]; g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.arc(ox + px * sc, oy + py * sc, r * sc * 1.45, 0, 7); g.stroke(); g.restore(); } }
  for (const i of [0, 1, 2, 3, 4, 5, 8, 9]) { const a = padAct(i); if (a && L(a)) glow(i, i < 4 ? PS_COL[i] : color); }
  // what the shoulder buttons do
  const nm = (i) => ACT_SHORT[padAct(i)] || '';
  ptxt(nm(4), ox + 88 * sc, oy - 6, 8, '#dfe8f0', 'center'); ptxt(nm(5), ox + 295 * sc, oy - 6, 8, '#dfe8f0', 'center');
  // legend under the picture
  const ly = oy + img.height * sc + 22;
  ptxt('CROCE: MUOVI', ox + 20, ly, 8, '#dfe8f0');
  [2, 3, 0, 1].forEach((i, k) => {
    const gx = ox + 140 + (k % 2) * 115, gy = ly + Math.floor(k / 2) * 20;
    padGlyph(i, gx - 10, gy - 4, 5, PS_COL[i]); ptxt(nm(i) || '—', gx, gy, 8, '#dfe8f0');
  });
  if (padAct(9)) ptxt('START ' + nm(9), ox + 20, ly + 20, 8, '#dfe8f0');
}
function drawPad(x, y, lit, color) {
  const L = (a) => lit.includes(a);
  const ps = padStyle() === 'ps';
  if (ps && IMG.pad_ps) { drawPadPS(x, y, lit, color); return; }
  g.save();
  // body
  g.fillStyle = '#05070c';
  roundRect(x - 4, y + 36, 468, 196, 90); g.fill();
  const grd = g.createLinearGradient(0, y + 40, 0, y + 230); grd.addColorStop(0, ps ? '#e9edf3' : '#39465a'); grd.addColorStop(1, ps ? '#aeb6c2' : '#161d28');
  g.fillStyle = grd; roundRect(x, y + 40, 460, 188, 86); g.fill();
  if (ps) { g.fillStyle = '#1a1f28'; roundRect(x + 150, y + 48, 160, 74, 14); g.fill(); }   // touchpad
  // shoulders (L1 / R1)
  const sh = (sx, i) => { const on = L(padAct(i)); g.fillStyle = '#05070c'; roundRect(sx - 3, y - 3 + (on ? 4 : 0), 116, 42, 12); g.fill(); g.fillStyle = on ? color : '#8a96a6'; roundRect(sx, y + (on ? 4 : 0), 110, 36, 10); g.fill(); ptxt(padName(i), sx + 55, y + 24 + (on ? 4 : 0), 12, '#10161e', 'center', false); };
  sh(x + 40, 4); sh(x + 310, 5);
  // d-pad
  const dx = x + 110, dy = y + 130;
  const dir = (a, ox, oy) => { g.fillStyle = L(a) ? color : '#1a212b'; g.fillRect(dx + ox - 18, dy + oy - 18, 36, 36); };
  g.fillStyle = '#05070c'; g.fillRect(dx - 58, dy - 22, 116, 44); g.fillRect(dx - 22, dy - 58, 44, 116);
  dir('up', 0, -36); dir('down', 0, 36); dir('left', -36, 0); dir('right', 36, 0); g.fillStyle = '#1a212b'; g.fillRect(dx - 18, dy - 18, 36, 36);
  // face buttons: 0 bottom, 1 right, 2 left, 3 top (standard layout)
  const cx = x + 350, cy = y + 130;
  const at = [[0, 44], [44, 0], [-44, 0], [0, -44]];
  for (let i = 0; i < 4; i++) {
    const bx = cx + at[i][0], on = L(padAct(i)), by = cy + at[i][1] + (on ? 3 : 0), col = (ps ? PS_COL : XB_COL)[i];
    g.fillStyle = '#05070c'; g.beginPath(); g.arc(bx, by, 27, 0, 7); g.fill();
    g.fillStyle = on ? '#ffffff' : ps ? '#1b2029' : col; g.beginPath(); g.arc(bx, by, 23, 0, 7); g.fill();
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.fillStyle = col; g.beginPath(); g.arc(bx, by, 40, 0, 7); g.fill(); g.restore(); }
    if (ps) padGlyph(i, bx, by, 10, on ? '#10161e' : col);
    else ptxt(padName(i), bx, by + 8, 14, '#10161e', 'center', false);
  }
  g.restore();
  const lab = (t, xx, yy) => ptxt(t, xx, yy, 8, '#dfe8f0', 'center');
  const nm = (i) => ACT_SHORT[padAct(i)] || '—';
  lab('MUOVI', dx, y + 250); lab(nm(4), x + 95, y - 12); lab(nm(5), x + 365, y - 12);
  // what each face button does, with its symbol
  const rowY = [y + 250, y + 250, y + 268, y + 268], colX = [cx - 150, cx - 50, cx - 150, cx - 50];
  for (const i of [2, 3, 0, 1]) {
    const k = [2, 3, 0, 1].indexOf(i), gx = colX[k], gy = rowY[k];
    if (ps) padGlyph(i, gx - 8, gy - 4, 4, PS_COL[i]); else ptxt(padName(i), gx - 8, gy, 8, XB_COL[i], 'center');
    ptxt(nm(i), gx, gy, 8, '#dfe8f0', 'left');
  }
}
function drawTouchPad(x, y, lit, color) {
  const L = (a) => lit.includes(a);
  g.save();
  g.fillStyle = '#05070c'; roundRect(x - 6, y + 14, 472, 250, 34); g.fill();
  g.fillStyle = '#1b2330'; roundRect(x, y + 20, 460, 238, 30); g.fill();
  g.fillStyle = '#0b1320'; g.fillRect(x + 26, y + 36, 408, 206);
  // stick
  const sx = x + 110, sy = y + 170, mv = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  let kx = 0, ky = 0; for (const k in mv) if (L(k)) { kx += mv[k][0]; ky += mv[k][1]; }
  g.strokeStyle = '#ffffff55'; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy, 52, 0, 7); g.stroke();
  g.fillStyle = kx || ky ? color : '#ffffff40'; g.beginPath(); g.arc(sx + kx * 26, sy + ky * 26, 24, 0, 7); g.fill();
  // buttons
  const b = (bx, by, r, label, on, col) => {
    g.fillStyle = on ? '#ffffff' : col + '55'; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
    g.strokeStyle = col; g.lineWidth = 3; g.stroke();
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.fillStyle = col; g.beginPath(); g.arc(bx, by, r + 14, 0, 7); g.fill(); g.restore(); }
    ptxt(label, bx, by + 4, 7, on ? '#10161e' : '#ffffff', 'center', false);
  };
  const rx = x + 438, ry = y + 244, u = 3.1;   // bottom-right corner, 1 vmin ≈ 3.1 px here
  b(rx - 18 * u, ry - 20 * u, 11 * u, 'ATTACCO', L('punch'), '#ffd35a');
  b(rx - 41 * u, ry - 10 * u, 8 * u, 'SALTO', L('jump'), '#5fe0ff');
  b(rx - 40 * u, ry - 31 * u, 7.5 * u, 'SPECIALE', L('special'), '#ff7a5a');
  b(rx - 10 * u, ry - 42 * u, 7 * u, 'PISTOLA', L('shoot'), '#b9c7d6');
  b(rx - 29 * u, ry - 47 * u, 6.2 * u, 'SCHIVA', L('dodge'), '#7bf0b1');
  b(rx - 9 * u, ry - 62 * u, 6 * u, 'SQUADRA', L('team'), '#ff8ad8');
  g.restore();
  ptxt('LEVETTA: MUOVI · IN FONDO: CORSA', sx, y + 290, 8, '#dfe8f0', 'center');
}
function roundRect(x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ---------- drawing the demo stage ---------- */
function puppet(heroIdx, s) {
  const id = HEROES[heroIdx].id;
  let f = s.f || 0;
  if (s.gun) f = 11;
  else if (s.weapon !== null && s.weapon !== undefined) f = s.fx ? (s.f === 4 ? 8 : 10) : (s.weapon < -0.5 ? 8 : 9);
  else if (s.z > 0 && f === 4) f = 12;
  if (s.wf) f = s.wf;
  const key = `${id}_${f}`;
  const z = s.z || 0;
  drawShadow(s.x, s.y, 36, z);
  if (s.ko) { g.save(); g.strokeStyle = '#7bf0b1'; g.lineWidth = 8; g.beginPath(); g.arc(s.x, s.y - 120, 22, -Math.PI / 2, -Math.PI / 2 + s.ko * Math.PI * 2); g.stroke(); g.restore(); ptxt('K.O.', s.x, s.y - 116, 9, '#fff', 'center'); }
  if (s.rot) { spr('fighters', key, s.x, s.y - z - 60, { scale: 1.0, face: s.face, rot: s.rot }); return; }
  if (s.duck) { spr('fighters', key, s.x, s.y - z, { scale: 1.0, face: s.face, sy: 0.78 }); return; }
  if (s.ghost) for (let i = 2; i >= 1; i--) spr('fighters', key, s.x - s.face * i * 24, s.y - z, { scale: 1.0, face: s.face, alpha: 0.2 * (3 - i) });
  spr('fighters', key, s.x, s.y - z, { scale: 1.0, face: s.face });
  if (s.slash) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(s.x, s.y - 95); g.strokeStyle = HEROES[heroIdx].glow; g.lineWidth = s.slash === 2 ? 20 : 13; g.globalAlpha = 0.7; g.beginPath(); g.arc(0, 0, s.slash === 2 ? 150 : 120, -1.6, 0.8); g.stroke(); g.restore(); }
  if (s.weapon !== null && s.weapon !== undefined) drawSigWeapon('w_' + id, key, s.x, s.y - z, s.face, 1.0, s.weapon, HEROES[heroIdx].glow, Game.howT || 0);
  for (const bx of s.bolts || []) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HEROES[heroIdx].glow; g.fillRect(bx - 40, s.y - 108, 50, 10); g.fillStyle = '#fff'; g.fillRect(bx - 20, s.y - 105, 26, 4); g.restore(); }
}
function enemyPuppet(e, y = 580, key = 'soldier') {
  if (!e || e.hide) return;
  const z = e.z || 0;
  drawShadow(e.x, y, 36, z);
  spr('fighters', `${key}_${e.f || 0}`, e.x + (e.rot ? -10 : 0), y - z, { scale: 1.0, face: e.face || -1, rot: e.rot || 0 });
  if (e.tag && Math.floor((Game.howT || 0) * 6) % 2) ptxt('PRESA!', e.x, y - 175, 10, '#ffe08a', 'center');
}

function drawHowto(pg, t, scheme, hero, opt = {}) {
  const P = HOWTO[pg];
  const loop = Math.floor(t / HOWTO_PAGE);
  const lt = t % HOWTO_PAGE;
  if (lt < 0.05) HOWTO_STATE.teamFired = false;
  HOWTO_STATE.hero = hero;
  if (HOWTO_STATE.pg !== pg) { HOWTO_STATE.pg = pg; FX.team = null; HOWTO_STATE.teamFired = false; }
  const s = P.run(lt, loop);
  const color = HEROES[s.hero ?? hero].color;
  // backdrop
  g.fillStyle = '#060b14'; g.fillRect(0, 0, W, H);
  // left: demo window
  const vx = 40, vy = 110, vw = 660, vh = 470;
  g.save();
  g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  if (s.giant) {
    coverImage('siege', 1.0, 0.3, 0.5, 1);
    g.fillStyle = 'rgba(6,10,30,.35)'; g.fillRect(vx, vy, vw, vh);
    spr('giants', 'conc_' + (s.beam ? 6 : s.guard ? 4 : s.lit.includes('punch') ? 2 : s.lit.includes('shoot') ? 3 : 0), s.px - 120, vy + vh - 10, { scale: 0.62 });
    spr('giants', `masticeG_${s.stagger ? 3 : lt > 0.4 && lt < 1.6 ? 2 : 0}`, 540, vy + vh - 10, { scale: 0.62, face: -1, flash: s.beam ? 0.6 : 0 });
    if (s.guard) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.strokeStyle = '#bfe6ff'; g.lineWidth = 6; g.beginPath(); g.ellipse(s.px - 40, vy + 300, 34, 140, 0, -1.3, 1.3); g.stroke(); g.restore(); }
    if (s.beam) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffd35a'; g.globalAlpha = 0.7; g.fillRect(s.px - 120, vy + 240, 520, 60); g.fillStyle = '#fff'; g.fillRect(s.px - 120, vy + 258, 520, 24); g.restore(); }
    ptxt('EQUILIBRIO', 440, vy + 30, 8, '#f0c0a0');
    segBar(440, vy + 40, 220, 8, s.bal, 0, s.stagger ? '#fff1a6' : '#f0a05a', 5);
  } else {
    // a strip of the harbour as floor
    const img = IMG.port, sc = H / img.height;
    g.drawImage(img, 300 / sc, 0, vw / sc, img.height, vx, vy - 120, vw, H);
    g.fillStyle = 'rgba(4,8,16,.25)'; g.fillRect(vx, vy, vw, vh);
    if (s.crate) { drawShadow(250, 590, 30); spr('items', 'crate', 250, 590, { scale: 1.05 }); }
    if (s.food) { drawShadow(s.food.x, 590, 18); spr('items', 'pizza', s.food.x, 590 - s.food.z, { scale: 1.2 }); }
    const actors = [];
    if (s.enemy) actors.push([s.enemy.y || 580, () => enemyPuppet(s.enemy)]);
    if (s.enemy2) actors.push([580, () => enemyPuppet(s.enemy2)]);
    actors.push([s.y + 0.1, () => puppet(s.hero ?? hero, s)]);
    if (s.partner) actors.push([s.partner.y, () => puppet(s.partner.hero, s.partner)]);
    if (s.beast) actors.push([700, () => { drawShadow(s.beast.x, 640, 110); spr(beastSheet(`beast_${BEAST_OF[s.hero ?? hero]}_${s.beast.f}`), `beast_${BEAST_OF[s.hero ?? hero]}_${s.beast.f}`, s.beast.x, 640, { scale: 0.9, face: 1 }); }]);
    actors.sort((a, b) => a[0] - b[0]).forEach((a) => a[1]());
    if (s.fx) drawSpecialFx(s.fx, s, color);
    if (s.beam !== null && s.beam !== undefined) { g.fillStyle = '#05070c'; g.fillRect(s.beam - 22, vy + 236, 44, 94); g.fillStyle = '#c07a2a'; g.fillRect(s.beam - 18, vy + 240, 36, 86); g.fillStyle = '#ffd35a'; for (let k = 0; k < 3; k++) g.fillRect(s.beam - 18, vy + 248 + k * 28, 36, 8); g.strokeStyle = '#222'; g.lineWidth = 4; g.beginPath(); g.moveTo(s.beam, vy); g.lineTo(s.beam, vy + 236); g.stroke(); }
    if (s.ammoHud !== undefined) { ptxt('COLPI', vx + 20, vy + 30, 8, '#bfe6ff'); ptxt('×' + s.ammoHud, vx + 90, vy + 32, 14, '#bfe6ff'); }
    if (s.en !== undefined) { ptxt('ENERGIA', vx + 20, vy + 30, 8, '#9fc8ea'); segBar(vx + 20, vy + 40, 200, 10, s.en / 100, 0, '#5fc2ff', 5); }
    if (s.team !== undefined) { ptxt('BARRA SQUADRA', vx + 20, vy + 30, 8, '#ffd35a'); segBar(vx + 20, vy + 40, 260, 10, s.team, 0, s.team >= 1 ? '#ffd35a' : '#9d8cff', 10); }
  }
  if (s.note) ptitle(s.note, vx + vw / 2, vy + 110, 22, '#fff6d6', '#ffb03a');
  g.restore();
  g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(vx - 2, vy - 2, vw + 4, vh + 4);
  // right: controls
  const cx = 740, cy = 180;
  panel(cx - 20, vy, 520, vh, color, 0.9);
  ptxt(scheme === 'pad' ? 'CONTROLLER ' + PAD_STYLE_NAMES[padStyle()] : SCHEME_NAMES[scheme], cx + 240, vy + 34, 10, '#9fe8ff', 'center');
  if (scheme === 'pad') drawPad(cx + 10, cy + 20, s.lit, color);
  else if (scheme === 'touch') drawTouchPad(cx + 10, cy, s.lit, color);
  else drawKeyboard(cx + 20, cy + 30, s.lit, color, scheme);
  // Sette presents the lesson from the corner of the control panel
  if (frameOf('mentors', 'sette_0')) { const pose = lt < 1.2 ? 'sette_5' : Math.floor(lt * 2) % 4 === 0 ? 'sette_2' : 'sette_4'; spr('mentors', pose, 1175, vy + vh - 6, { scale: 0.8, face: -1 }); }
  // header
  ptitle('COME SI GIOCA', W / 2, 62, 30, '#fff6d6', '#ffb03a');
  ptxt(`${pg + 1}/${HOWTO.length} · ${P.title}`, 40, 98, 12, color);
  // caption
  const cap = P.cap(actKeys(scheme), s);
  panel(40, 600, W - 80, 56, color, 0.85);
  const lines = wrapCap(cap, W - 140);
  lines.forEach((ln, i) => ptxt(ln, W / 2, 626 + i * 20 - (lines.length - 1) * 9, 11, '#f4f7fa', 'center'));
  ptxt(opt.footer || (scheme === 'touch' ? '◀ ▶ PAGINA · ▲ ▼ ALTRI COMANDI · ATTACCO: ESCI' : '◀ ▶ PAGINA · ▲ ▼ TASTIERA/CONTROLLER · PUGNO: ESCI'), W / 2, 700, 9, '#8a9aac', 'center');
  // progress dots
  HOWTO.forEach((_, i) => { g.fillStyle = i === pg ? color : '#2a3848'; g.fillRect(W - 40 - (HOWTO.length - i) * 18, 88, 12, 12); });
  if (FX.team) drawTeamPose();
}
function wrapCap(t, maxW) {
  g.font = `400 11px ${PXFONT}`;
  const words = t.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  return lines;
}
function drawSpecialFx(fx, s, color) {
  const { id, k } = fx;
  g.save(); g.globalCompositeOperation = 'lighter';
  if (id === 'ignis' && k > 0.16 && k < 0.7) { const x = s.x + 70 + (k - 0.16) * 820; g.fillStyle = '#ff5a1e'; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x - 30, s.y - 190); g.quadraticCurveTo(x + 80, s.y - 80, x - 30, s.y + 30); g.quadraticCurveTo(x + 20, s.y - 80, x - 30, s.y - 190); g.fill(); }
  if (id === 'azur' && k < 0.6) { g.fillStyle = '#8cc4ff'; g.globalAlpha = 0.5; g.fillRect(s.x - 200, s.y - 110, 200, 60); }
  if (id === 'lyra') { g.strokeStyle = '#ffe98a'; g.lineWidth = 4; g.globalAlpha = 0.9; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.x + 70, s.y - 90 + i * 16, 34, -1.2 + k * 8, 0.6 + k * 8); g.stroke(); } }
  if (id === 'aura' && k > 0.2) { [-40, 0, 40].forEach((dy) => { const x = s.x + 60 + (k - 0.2) * 900; g.fillStyle = '#ff78bb'; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(x - 30, s.y - 130 + dy); g.quadraticCurveTo(x + 40, s.y - 80 + dy, x - 30, s.y - 30 + dy); g.quadraticCurveTo(x + 5, s.y - 80 + dy, x - 30, s.y - 130 + dy); g.fill(); }); }
  if (id === 'onyx' && k > 0.3) { g.strokeStyle = '#e3ecf5'; g.lineWidth = 8; g.globalAlpha = 1.3 - k; g.beginPath(); g.ellipse(s.x + 70, s.y, 30 + (k - 0.3) * 220, 10 + (k - 0.3) * 70, 0, 0, 7); g.stroke(); }
  g.restore();
}
