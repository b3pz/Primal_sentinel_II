'use strict';
/* ============================================================
   PROVA E CALIBRA IL CONTROLLER (1.8.1)
   Prova: premi i tasti e guarda quali si accendono sul disegno.
   Calibra: il gioco chiede ✕, ○, □, △, L1, R1, L2, R2, SELECT,
   START e le quattro frecce, e ricorda per quel modello di
   controller quale tasto "vero" corrisponde a ciascuno.
   ============================================================ */
const CAL_STEPS = [[0, '✕'], [1, '○'], [2, '□'], [3, '△'], [4, 'L1'], [5, 'R1'], [6, 'L2'], [7, 'R2'], [8, 'SELECT'], [9, 'START'], [12, 'FRECCIA SU'], [13, 'FRECCIA GIÙ'], [14, 'FRECCIA SINISTRA'], [15, 'FRECCIA DESTRA']];
const CAL_STEPS_XB = { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'VIEW', 9: 'MENU' };

Object.assign(Game, {
  padTest(from) {
    this.mode = 'padtest';
    this.pt = { t: 0, cal: null, from, msg: '' };
    this.back = () => { this.capture = null; this.pt = null; this.options(from); };
    this.capture = { pad: false, test: true };   // the menu must not react to the buttons being tested
    UI.show(`<nav class="padtest-nav"><button id="cal" class="primary">CALIBRA</button><button id="uncal">TOGLI LA CALIBRAZIONE</button><button id="back">INDIETRO</button></nav>`, 'padtest');
    UI.on('#cal', () => this.startCal());
    UI.on('#uncal', () => { const p = this.testPad(); if (p && PADCAL[p.id]) { delete PADCAL[p.id]; savePadCal(); this.pt.msg = 'CALIBRAZIONE TOLTA'; this.pt.msgT = 2.5; } });
    UI.on('#back', () => this.back());
  },
  testPad() {
    const ps = Input.pads();
    if (this.pt && this.pt.idx !== undefined) { const p = ps.find((q) => q.index === this.pt.idx); if (p) return p; }
    const last = (this.lastDevice || '').startsWith('pad') ? +this.lastDevice.slice(3) : -1;
    return ps.find((q) => q.index === last) || ps[0] || null;
  },
  startCal() {
    const p = this.testPad();
    if (!p) { this.pt.msg = 'NESSUN CONTROLLER: COLLEGALO E PREMI UN TASTO'; this.pt.msgT = 3; return; }
    this.pt.idx = p.index;
    this.pt.cal = { step: 0, map: {}, wait: true, t: 0, rest: p.axes.slice() };
    Audio.sfx('confirm');
  },
  tickPadTest(dt) {
    const P = this.pt; if (!P) return;
    P.t += dt; if (P.msgT) P.msgT -= dt;
    if (Input.keyEdge.Escape || Input.keyEdge.Backspace) { if (P.cal) { P.cal = null; P.msg = 'CALIBRAZIONE ANNULLATA'; P.msgT = 2; } else this.back(); return; }
    if (Input.keyEdge.Enter && !P.cal) { this.startCal(); return; }
    // the pad that pressed something last is the one on test
    for (const q of Input.pads()) if (!P.cal && q.buttons.some((b) => b.pressed)) P.idx = q.index;
    const C = P.cal; if (!C) return;
    const p = Input.pads().find((q) => q.index === P.idx);
    if (!p) { P.cal = null; return; }
    const raw = p.buttons.map((b) => b.pressed);
    const moved = p.axes.map((v, a) => Math.abs(v - (C.rest[a] ?? 0)) > 0.5);
    C.t += dt;
    if (C.wait) { if (!raw.some(Boolean) && !moved.some(Boolean)) { C.wait = false; C.t = 0; } return; }   // everything released first
    if (Input.keyEdge.Space || C.t > 10) { this.nextCal(p, null); return; }   // skip this one
    const [slot] = CAL_STEPS[C.step];
    const dpad = slot >= 12;
    const bi = raw.findIndex(Boolean);
    if (bi >= 0) { this.nextCal(p, { b: bi }); return; }
    for (let a = 0; a < p.axes.length; a++) {
      if (!moved[a] || (a < 2 && !dpad)) continue;
      const v = p.axes[a], h = hatDir(v);
      if (dpad && h && Math.abs(C.rest[a] ?? 0) > 1.05) { this.nextCal(p, { a, h: { 12: 'u', 13: 'd', 14: 'l', 15: 'r' }[slot] }); return; }
      if (Math.abs(v) > 0.5) { this.nextCal(p, { a, v: Math.round(v * 100) / 100 }); return; }
    }
  },
  nextCal(p, src) {
    const C = this.pt.cal;
    const [slot] = CAL_STEPS[C.step];
    if (src) { C.map[slot] = src; Audio.sfx('select'); }
    C.step++; C.wait = true; C.t = 0;
    if (C.step >= CAL_STEPS.length) {
      const arr = []; for (let i = 0; i < 17; i++) arr[i] = C.map[i] || null;
      PADCAL[p.id] = arr; savePadCal();
      Input.padPrev = {};
      this.pt.cal = null; this.pt.msg = 'CALIBRATO! ORA PROVA I TASTI'; this.pt.msgT = 3;
      Audio.sfx('team');
    }
  },
});

function drawPadTest(P) {
  g.fillStyle = '#060b14'; g.fillRect(0, 0, W, H);
  if (!P) return;
  const p = Game.testPad();
  ptitle('PROVA E CALIBRA IL CONTROLLER', W / 2, 60, 26, '#fff6d6', '#ffb03a');
  const ps = padStyle() === 'ps';
  const b = p ? padButtons(p) : [];
  const ox = W / 2 - 382 * 1.2 / 2, oy = 118, sc = 1.2;
  if (ps && IMG.pad_ps) {
    g.drawImage(IMG.pad_ps, ox, oy, IMG.pad_ps.width * sc, IMG.pad_ps.height * sc);
    const at = { 0: PS_PAD_AT[0], 1: PS_PAD_AT[1], 2: PS_PAD_AT[2], 3: PS_PAD_AT[3], 4: PS_PAD_AT[4], 5: PS_PAD_AT[5], 6: [88, 4, 16], 7: [295, 4, 16], 8: PS_PAD_AT[8], 9: PS_PAD_AT[9], 12: PS_PAD_AT.up, 13: PS_PAD_AT.down, 14: PS_PAD_AT.left, 15: PS_PAD_AT.right };
    const C = P.cal, want = C ? CAL_STEPS[C.step][0] : -1;
    for (const k in at) {
      const [px, py, r] = at[k], X = ox + px * sc, Y = oy + py * sc, on = b[k];
      if (+k === want) { g.save(); g.strokeStyle = '#ffd35a'; g.lineWidth = 4; g.setLineDash([6, 5]); g.lineDashOffset = -P.t * 30; g.beginPath(); g.arc(X, Y, r * sc * 1.5, 0, 7); g.stroke(); g.restore(); }
      if (!on) continue;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.fillStyle = +k < 4 ? PS_COL[k] : '#ffd35a'; g.beginPath(); g.arc(X, Y, r * sc * 1.5, 0, 7); g.fill(); g.restore();
      g.save(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X, Y, r * sc * 1.2, 0, 7); g.stroke(); g.restore();
    }
    if (b[6]) ptxt('L2', ox + 88 * sc, oy - 4, 10, '#ffd35a', 'center');
    if (b[7]) ptxt('R2', ox + 295 * sc, oy - 4, 10, '#ffd35a', 'center');
  } else {
    const lit = []; const nm = ['jump', 'special', 'punch', 'shoot', 'team', 'dodge'];
    for (let i = 0; i < 6; i++) if (b[i]) { const a = padAct(i); if (a) lit.push(a); }
    if (b[12]) lit.push('up'); if (b[13]) lit.push('down'); if (b[14]) lit.push('left'); if (b[15]) lit.push('right');
    void nm; drawPad(W / 2 - 230, 150, lit, '#ffd35a');
  }
  // what the game reads right now
  const y0 = 470;
  panel(140, y0, W - 280, 150, '#5fe0ff', 0.9);
  if (!p) {
    ptxt('NESSUN CONTROLLER TROVATO: COLLEGALO E PREMI UN TASTO', W / 2, y0 + 70, 12, '#ffb0a0', 'center');
  } else if (P.cal) {
    const [slot, name] = CAL_STEPS[P.cal.step];
    const label = ps ? name : (CAL_STEPS_XB[slot] || name);
    ptxt(`CALIBRAZIONE ${P.cal.step + 1}/${CAL_STEPS.length}`, W / 2, y0 + 34, 10, '#9fe8ff', 'center');
    if (P.cal.wait) ptxt('LASCIA TUTTI I TASTI…', W / 2, y0 + 76, 18, '#ffffff', 'center');
    else if (PS_GLYPHS.includes(label)) { ptitle('PREMI', W / 2 - 30, y0 + 82, 28, '#fff6d6', '#ffd35a'); padGlyph(PS_GLYPHS.indexOf(label), W / 2 + 70, y0 + 70, 14, PS_COL[PS_GLYPHS.indexOf(label)]); }
    else ptitle(`PREMI ${label}`, W / 2, y0 + 82, 28, '#fff6d6', '#ffd35a');
    ptxt('SPAZIO: SALTA QUESTO TASTO · ESC: ANNULLA', W / 2, y0 + 124, 8, '#8a9aac', 'center');
  } else {
    const names = []; b.forEach((on, i) => { if (on) names.push(padName(i)); });
    const raw = p.buttons.map((x, i) => (x.pressed ? i : -1)).filter((i) => i >= 0);
    ptxt((p.id || '').slice(0, 70).toUpperCase(), W / 2, y0 + 30, 8, '#9fb4c8', 'center');
    ptxt(`${p.mapping === 'standard' ? 'SCHEMA STANDARD' : 'SCHEMA NON STANDARD'} · ${PADCAL[p.id] ? 'CALIBRATO' : padPreset(p) ? 'RICONOSCIUTO: ' + padPreset(p).name : p.mapping === 'standard' ? 'RICONOSCIUTO' : 'NON CALIBRATO'}`, W / 2, y0 + 50, 9, PADCAL[p.id] || padPreset(p) || p.mapping === 'standard' ? '#7bf0b1' : '#ffb03a', 'center');
    ptxt(names.length ? 'IL GIOCO LEGGE: ' + names.join(' ') : 'PREMI UN TASTO DEL CONTROLLER', W / 2, y0 + 84, 14, '#ffffff', 'center');
    ptxt(`(numeri grezzi: ${raw.join(', ') || '—'})`, W / 2, y0 + 106, 8, '#6f8aa2', 'center');
    ptxt('SE IL TASTO ACCESO NON È QUELLO CHE PREMI: CALIBRA (INVIO)', W / 2, y0 + 130, 8, '#ffd35a', 'center');
  }
  if (P.msg && P.msgT > 0) ptitle(P.msg, W / 2, 110, 18, '#fff6d6', '#7bf0b1');
}
