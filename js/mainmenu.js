'use strict';
/* ============================================================
   MENU PRINCIPALE (1.9.1) — disegnato sul canvas come il resto
   del gioco: logo, voci in stile sala giochi, Sentinels in posa
   ai lati. Frecce/croce + ✕/INVIO, mouse o tocco.
   ============================================================ */
const MM_ITEMS = [
  { id: 'play', label: 'GIOCA', desc: 'CUORI DI STELLA · LA STORIA IN 8 CAPITOLI · DA 1 A 4 GIOCATORI' },
  { id: 'online', label: 'COOPERATIVA ONLINE', desc: 'GIOCA CON GLI AMICI, OGNUNO SUL SUO PC O TELEFONO' },
  { id: 'extras', label: 'MODALITÀ EXTRA', desc: 'BOSS RUSH · SOPRAVVIVENZA · SFIDA A TEMPO' },
  { id: 'chapters', label: 'CAPITOLI', desc: 'RIPARTI DA UN CAPITOLO GIÀ SBLOCCATO' },
  { id: 'diff', label: 'DIFFICOLTÀ', desc: '' },
  { id: 'scores', label: 'CLASSIFICHE', desc: 'I MIGLIORI PUNTEGGI E TEMPI' },
  { id: 'gallery', label: 'GALLERIA', desc: 'SENTINELS, NEMICI, BOSS, TITANI E CINEMATICHE' },
  { id: 'howto', label: 'COME SI GIOCA', desc: 'IL TUTORIAL ANIMATO CON I TUOI COMANDI' },
  { id: 'options', label: 'OPZIONI', desc: 'AUDIO · SCHERMO · TASTI · CONTROLLER' },
];
const MM_Y0 = 272, MM_DY = 40;

Object.assign(Game, {
  menu() {
    this.mode = 'mmenu';
    this.back = null;
    if (this.online) { Net.leave(); this.online = null; }
    this.local.twoKeyboards = false;
    this.attract = false; this.capture = null;
    UI.hide();
    Audio.playSong(8, 'sigla');
    this.mm = { i: this.mm ? this.mm.i : 0, t: 0, flash: 0, idle: 0 };
    MM_POINTER.shownAt = performance.now();
  },
  mmLabel(it) {
    if (it.id === 'chapters') { const prog = this.progress(); return prog > 0 ? `CAPITOLI · ${prog + 1}/8` : 'CAPITOLI'; }
    if (it.id === 'diff') return `DIFFICOLTÀ: ${DIFF.name}`;
    if (it.id === 'play' && this.diffKey() !== 'arcade' && this.storySave()) return 'GIOCA · CONTINUA';
    return it.label;
  },
  mmCycleDiff(dir = 1) {
    const keys = Object.keys(DIFFS); const k = keys[(keys.indexOf(this.diffKey()) + dir + keys.length) % keys.length];
    DIFF = DIFFS[k]; try { localStorage.setItem('primal-diff', k); } catch (e) {}
    Audio.sfx('select');
  },
  mmActivate(i) {
    const it = MM_ITEMS[i]; if (!it) return;
    if (it.id === 'diff') { this.mmCycleDiff(1); return; }
    Audio.sfx('confirm');
    this.mm.flash = 0.25;
    const go = {
      play: () => this.playMenu(),
      online: () => this.onlineMenu(),
      extras: () => this.extras(),
      chapters: () => this.chapters(),
      scores: () => this.showScores(0, () => this.menu()),
      gallery: () => this.gallery(),
      howto: () => this.howto(() => this.menu()),
      options: () => this.options(),
    }[it.id];
    go && go();
  },
  tickMainMenu(dt) {
    const M = this.mm; if (!M) return;
    M.t += dt; M.idle += dt; if (M.flash > 0) M.flash -= dt;
    const K = Input.keyEdge, n = MM_ITEMS.length;
    let move = 0, lr = 0, ok = !!(K.Enter || K.NumpadEnter || K.Space || K.KeyJ || K.KeyF);
    if (K.ArrowDown || K.KeyS) move = 1; if (K.ArrowUp || K.KeyW) move = -1;
    if (K.ArrowLeft || K.KeyA) lr = -1; if (K.ArrowRight || K.KeyD) lr = 1;
    for (const p of Input.pads()) {
      const b = padButtons(p), pr = Input.padPrev[p.index] || [], ed = (i) => b[i] && !pr[i];
      if (ed(13)) move = 1; if (ed(12)) move = -1; if (ed(14)) lr = -1; if (ed(15)) lr = 1;
      if (ed(0) || ed(2) || ed(9)) ok = true;
      const ay = p.axes[1] || 0, ax = p.axes[0] || 0, latch = M.axLatch || (M.axLatch = {});
      if (Math.abs(ay) > 0.6 && !latch[p.index]) { move = ay > 0 ? 1 : -1; latch[p.index] = true; }
      else if (Math.abs(ax) > 0.6 && !latch[p.index]) { lr = ax > 0 ? 1 : -1; latch[p.index] = true; }
      if (Math.abs(ay) < 0.3 && Math.abs(ax) < 0.3) latch[p.index] = false;
    }
    if (move) { M.i = (M.i + move + n) % n; M.t = 0; M.idle = 0; Audio.sfx('select'); }
    if (lr && MM_ITEMS[M.i].id === 'diff') { this.mmCycleDiff(lr); M.idle = 0; }
    // mouse / touch
    const P = MM_POINTER;
    if (P.move) { const h = mmHit(P.x, P.y); if (h >= 0 && h !== M.i) { M.i = h; M.t = 0; Audio.sfx('select'); } P.move = false; M.idle = 0; }
    if (P.up) { const h = mmHit(P.x, P.y); P.up = false; if (h >= 0) { M.i = h; this.mmActivate(h); return; } }
    if (ok) { M.idle = 0; this.mmActivate(M.i); return; }
    if (M.idle > 40) { this.mm.idle = 0; this.nextAttract(); }   // arcade attract loop when nobody plays
  },
});

/* pointer on the canvas, in game coordinates */
const MM_POINTER = { x: 0, y: 0, move: false, up: false, downAt: 0, shownAt: 0 };
function mmHit(x, y) {
  for (let i = 0; i < MM_ITEMS.length; i++) if (Math.abs(y - (MM_Y0 + i * MM_DY)) < MM_DY / 2 && Math.abs(x - W / 2) < 250) return i;
  return -1;
}
{
  const cv = document.querySelector('#game');
  const pos = (e) => { const r = cv.getBoundingClientRect(); MM_POINTER.x = (e.clientX - r.left) * W / r.width; MM_POINTER.y = (e.clientY - r.top) * H / r.height; };
  cv.addEventListener('pointermove', (e) => { if (!['mmenu', 'cmenu'].includes(Game.mode) || e.pointerType === 'touch') return; pos(e); MM_POINTER.move = true; });
  cv.addEventListener('pointerdown', () => { MM_POINTER.downAt = performance.now(); });
  // a tap that started before the menu appeared (the one that left the title) does not choose anything
  cv.addEventListener('pointerup', (e) => { if (!['mmenu', 'cmenu'].includes(Game.mode) || MM_POINTER.downAt < MM_POINTER.shownAt) return; pos(e); MM_POINTER.up = true; });
}

/* the Sentinels on both sides of the menu: guard, weapon stance and their pose, in turn */
function drawMenuHeroes(k) {
  const n = Game.heroCount ? Game.heroCount() : CORE_HEROES;
  const spots = [[0, 175, 700, 1.45, 1], [1, 300, 650, 1.2, 1], [2, 80, 640, 1.15, 1], [3, 1105, 700, 1.45, -1], [4, 985, 650, 1.25, -1], [5, 1215, 640, 1.2, -1]];
  spots.filter(([h]) => h < n).sort((a, b) => a[2] - b[2]).forEach(([h, x, y, s, f]) => {
    const ph = (k * 0.35 + h * 0.37) % 3;
    const pose = ph < 1.3 ? 0 : ph < 2.2 ? 1 : 2;
    glowAt(x, y - 120 * s, 110 * s, HEROES[h].color, (pose === 1 ? 0.34 : 0.2) + Math.sin(k * 2 + h) * 0.05);
    drawShadow(x, y, 40 * s);
    poseSpr(h, pose, x, y, { scale: s * 0.92, face: f });
  });
}

function drawMainMenu(M) {
  if (!M) return;
  const t = Game.menuT || 0;
  drawStageBackdrop('port', 300 + Math.sin(t * 0.1) * 40);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, 'rgba(3,6,16,.72)'); grd.addColorStop(0.55, 'rgba(3,6,16,.45)'); grd.addColorStop(1, 'rgba(3,6,16,.9)');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // coloured light beams behind the logo
  g.save(); g.globalCompositeOperation = 'lighter';
  HEROES.slice(0, 5).forEach((h, i) => {
    const a = -Math.PI / 2 + (i - 2) * 0.32 + Math.sin(t * 0.7 + i) * 0.05;
    g.fillStyle = h.color; g.globalAlpha = 0.07;
    g.beginPath(); g.moveTo(W / 2, 150); g.lineTo(W / 2 + Math.cos(a - 0.08) * 900, 150 + Math.sin(a - 0.08) * 900); g.lineTo(W / 2 + Math.cos(a + 0.08) * 900, 150 + Math.sin(a + 0.08) * 900); g.fill();
  });
  g.restore();
  drawMenuHeroes(t);
  // central panel
  g.save(); g.globalAlpha = 0.78; g.fillStyle = '#040a14';
  g.beginPath(); g.moveTo(W / 2 - 236, 238); g.lineTo(W / 2 + 236, 238); g.lineTo(W / 2 + 252, 250); g.lineTo(W / 2 + 252, 668); g.lineTo(W / 2 - 252, 668); g.lineTo(W / 2 - 252, 250); g.closePath(); g.fill();
  g.globalAlpha = 1; g.strokeStyle = '#ffd35a55'; g.lineWidth = 2; g.stroke(); g.restore();
  drawLogo(W / 2, 128, 0.42, t + 2);
  // the items
  MM_ITEMS.forEach((it, i) => {
    const y = MM_Y0 + i * MM_DY, sel = i === M.i, label = Game.mmLabel(it);
    if (sel) {
      const w = 500, pulse = 0.5 + Math.sin(t * 6) * 0.5;
      const bar = g.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
      bar.addColorStop(0, 'rgba(232,154,44,0)'); bar.addColorStop(0.18, '#e89a2c'); bar.addColorStop(0.82, '#e89a2c'); bar.addColorStop(1, 'rgba(232,154,44,0)');
      g.fillStyle = bar; g.beginPath(); g.moveTo(W / 2 - w / 2 + 14, y - 17); g.lineTo(W / 2 + w / 2, y - 17); g.lineTo(W / 2 + w / 2 - 14, y + 17); g.lineTo(W / 2 - w / 2, y + 17); g.fill();
      if (M.flash > 0) { g.fillStyle = `rgba(255,255,255,${M.flash * 3})`; g.fillRect(W / 2 - w / 2, y - 17, w, 34); }
      g.fillStyle = `rgba(255,240,200,${0.2 + pulse * 0.25})`; g.fillRect(W / 2 - w / 2 + 40, y - 17, w - 80, 3);
      const ax = 170 + Math.sin(t * 8) * 6 + (it.id === 'diff' ? 40 : 0);
      if (it.id === 'diff') { ptxt('◀', W / 2 - ax - 40, y + 7, 18, '#10161e', 'center', false); ptxt('▶', W / 2 + ax + 40, y + 7, 18, '#10161e', 'center', false); }
      ptitle(label, W / 2, y + 9, 22, '#fff6d6', '#ffd35a');
    } else {
      ptxt(label, W / 2, y + 6, 14, '#b9c9d8', 'center');
    }
  });
  // description of the chosen item
  const it = MM_ITEMS[M.i];
  const sv = it.id === 'play' && Game.diffKey() !== 'arcade' ? Game.storySave() : null;
  const desc = it.id === 'diff' ? (DIFF.desc || '').toUpperCase() + (Game.diffKey() === 'arcade' ? ' · NIENTE SALVATAGGI' : ' · SALVATAGGIO AUTOMATICO') : sv ? 'SALVATO: ' + Game.saveLabel(sv) : it.desc;
  ptxt(desc, W / 2, 646, 9, '#9fe8ff', 'center');
  ptxt(Touch.on ? 'TOCCA UNA VOCE' : '▲ ▼ SCEGLI · INVIO / ' + padName(0) + ' CONFERMA', W / 2, 690, 8, '#6f8aa2', 'center');
  ptxt('IDEATO E SVILUPPATO DA b3pZ · II · ANTEPRIMA 0.6', W - 20, H - 12, 7, '#56687a', 'right');
}

/* ============================================================
   SOTTOMENU (1.12) — extra, capitoli, opzioni e pausa disegnati
   sul canvas con lo stesso stile del menu principale.
   spec = { eyebrow, title, items: [{ label: () => str, desc, act, lr(dir), off }], back, over, note }
   ============================================================ */
const CM_DY = 44;
function cmY0(n) { return Math.round(H / 2 - (n * CM_DY) / 2 + 40); }
Object.assign(Game, {
  cmenu(spec) {
    if (spec.over && this.mode !== 'cmenu') this.cmUnder = this.lastDrawn || null;
    if (!spec.over) this.cmUnder = null;
    this.mode = 'cmenu'; UI.hide();
    const keep = this.cm && this.cm.spec.title === spec.title ? this.cm.i : 0;
    this.cm = { spec, i: Math.min(keep, spec.items.length - 1), t: 0, flash: 0 };
    while (this.cm.spec.items[this.cm.i] && this.cm.spec.items[this.cm.i].off) this.cm.i++;
    this.back = spec.back || null;
    MM_POINTER.shownAt = performance.now();
  },
  tickCMenu(dt) {
    const M = this.cm; if (!M) return;
    M.t += dt; if (M.flash > 0) M.flash -= dt;
    const items = M.spec.items, n = items.length;
    const K = Input.keyEdge;
    let move = 0, lr = 0, ok = !!(K.Enter || K.NumpadEnter || K.Space || K.KeyJ || K.KeyF), back = !!(K.Escape || K.Backspace);
    if (K.ArrowDown || K.KeyS) move = 1; if (K.ArrowUp || K.KeyW) move = -1;
    if (K.ArrowLeft || K.KeyA) lr = -1; if (K.ArrowRight || K.KeyD) lr = 1;
    for (const p of Input.pads()) {
      const b = padButtons(p), pr = Input.padPrev[p.index] || [], ed = (i) => b[i] && !pr[i];
      if (ed(13)) move = 1; if (ed(12)) move = -1; if (ed(14)) lr = -1; if (ed(15)) lr = 1;
      if (ed(0) || ed(2) || ed(9)) ok = true; if (ed(1) || ed(3)) back = true;
      const ay = p.axes[1] || 0, ax = p.axes[0] || 0, latch = M.axLatch || (M.axLatch = {});
      if (Math.abs(ay) > 0.6 && !latch[p.index]) { move = ay > 0 ? 1 : -1; latch[p.index] = true; }
      else if (Math.abs(ax) > 0.6 && !latch[p.index]) { lr = ax > 0 ? 1 : -1; latch[p.index] = true; }
      if (Math.abs(ay) < 0.3 && Math.abs(ax) < 0.3) latch[p.index] = false;
    }
    if (move) { let i = M.i; for (let k = 0; k < n; k++) { i = (i + move + n) % n; if (!items[i].off) break; } M.i = i; M.t = 0; Audio.sfx('select'); }
    const it = items[M.i];
    if (lr && it && it.lr) { it.lr(lr); Audio.sfx('select'); }
    const P = MM_POINTER, y0 = cmY0(n);
    const hit = (x, y) => { for (let i = 0; i < n; i++) if (!items[i].off && Math.abs(y - (y0 + i * CM_DY)) < CM_DY / 2 && Math.abs(x - W / 2) < 300) return i; return -1; };
    if (P.move) { const h = hit(P.x, P.y); if (h >= 0 && h !== M.i) { M.i = h; Audio.sfx('select'); } P.move = false; }
    if (P.up) { const h = hit(P.x, P.y); P.up = false; if (h >= 0) { M.i = h; ok = true; } }
    if (ok && it && !it.off) { Audio.sfx('confirm'); M.flash = 0.2; if (it.act) it.act(); else if (it.lr) it.lr(1); return; }
    if (back && M.spec.back) { Audio.sfx('select'); M.spec.back(); }
  },

  /* ---- the submenus ---- */
  extras() {
    const prog = this.progress();
    this.cmenu({ eyebrow: 'MODALITÀ EXTRA · 1-4 GIOCATORI', title: 'SCEGLI LA SFIDA', back: () => this.menu(),
      note: 'NIENTE CONTINUI: QUANDO LA SQUADRA CADE SI ENTRA IN CLASSIFICA',
      items: [
        { label: () => 'BOSS RUSH', desc: 'GLI 8 BOSS DI FILA, CON LE LORO TRE FASI', act: () => { this.modeKind = 'bossrush'; this.lobby(); } },
        { label: () => 'SOPRAVVIVENZA', desc: 'ONDATE INFINITE, UN BOSS OGNI 5', act: () => { this.modeKind = 'survival'; this.lobby(); } },
        { label: () => `SFIDA A TEMPO · CAPITOLO ${this.taLevel + 1}`, desc: `◀ ▶ CAMBIA CAPITOLO · ${LEVELS[this.taLevel].title}`, act: () => { this.modeKind = 'timeattack'; this.lobby(); }, lr: (d) => { this.taLevel = (this.taLevel + d + prog + 1) % (prog + 1); } },
        { label: () => 'INDIETRO', act: () => this.menu() },
      ] });
  },
  chapters() {
    const arcade = this.diffKey() === 'arcade', prog = arcade ? 0 : this.progress(), sg = this.sigilsSaved();
    const tot = Object.values(sg).reduce((a, l) => a + l.length, 0);
    const best = this.bestGrades();
    this.cmenu({ eyebrow: `CAPITOLI · SIGILLI DEI TITANI ${tot}/24`, title: arcade ? 'IN ARCADE SI PARTE DAL CAPITOLO 1' : 'DA DOVE RIPARTIRE', back: () => this.menu(),
      items: [...LEVELS.map((L, i) => ({ label: () => i > prog ? `${L.n} · BLOCCATO` : `${L.n} · ${L.title}`, off: i > prog,
        desc: `${L.place} · SIGILLI ${'★'.repeat((sg[i] || []).length)}${'☆'.repeat(3 - (sg[i] || []).length)}${best[i] ? ' · MIGLIOR VOTO ' + best[i] : ''}`,
        act: () => { this.resumeData = null; this.modeKind = 'campaign'; this.startLevel = i; this.lobby(); } })),
      { label: () => 'INDIETRO', act: () => this.menu() }] });
  },
  options(from) {
    const back = from === 'pause' ? () => this.pause(true) : () => this.menu();
    const bar = (v) => `${Math.round(v * 100)}%`;
    const vol = (v, d) => clamp(Math.round(v * 10 + d) / 10, 0, 1);
    const ps = ['auto', 'ps', 'xbox'];
    this.cmenu({ eyebrow: 'OPZIONI', title: 'SUONO, SCHERMO E COMANDI', back, over: from === 'pause',
      items: [
        { label: () => `MUSICA: ${bar(Audio.musicVol)}`, desc: '◀ ▶ CAMBIA IL VOLUME', lr: (d) => Audio.setVolumes(vol(Audio.musicVol, d), Audio.sfxVol) },
        { label: () => `EFFETTI: ${bar(Audio.sfxVol)}`, desc: '◀ ▶ CAMBIA IL VOLUME', lr: (d) => { Audio.setVolumes(Audio.musicVol, vol(Audio.sfxVol, d)); Audio.sfx('pickup'); } },
        { label: () => `AUDIO: ${Audio.muted ? 'SPENTO' : 'ACCESO'}`, desc: 'ANCHE CON IL TASTO M', act: () => Audio.setMuted(!Audio.muted) },
        { label: () => `SCHERMO INTERO: ${document.fullscreenElement ? 'SÌ' : 'NO'}`, desc: '', act: () => { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); Promise.resolve(p).catch(() => {}); } },
        { label: () => 'TASTI DELLA TASTIERA', desc: 'CAMBIA I TASTI PER 1 O 2 GIOCATORI', act: () => this.remap('kb', from) },
        { label: () => 'PROVA E CALIBRA IL CONTROLLER', desc: 'SE I TASTI NON CORRISPONDONO', act: () => this.padTest(from) },
        { label: () => 'PULSANTI DEL CONTROLLER', desc: 'CAMBIA COSA FA OGNI PULSANTE', act: () => this.remap('pad', from) },
        { label: () => `SIMBOLI: ${PAD_STYLE_NAMES[padStyleSetting()]}${padStyleSetting() === 'auto' ? ' (' + PAD_STYLE_NAMES[padStyle()] + ')' : ''}`, desc: '◀ ▶ PLAYSTATION O XBOX', lr: (d) => setPadStyle(ps[(ps.indexOf(padStyleSetting()) + d + 3) % 3]) },
        { label: () => 'INDIETRO', act: back },
      ] });
  },
  pause(again) {
    if (this.online === 'client') return;
    if (!again) this.pausedFrom = this.mode;
    if (this.online === 'host') this.broadcastView({ m: 'pause' });
    const retry = () => { if (!(this.credits > 0)) return; this.credits--; if (this.pausedFrom === 'giant') { this.G = newGiant(this.levelIdx, this.simPlayers()); this.mode = 'giant'; } else this.enterStage(this.levelIdx, this.S.checkpoint); };
    this.cmenu({ eyebrow: 'PAUSA', title: 'PORTO AURORA ASPETTA', back: () => this.resume(), over: true,
      items: [
        { label: () => 'RIPRENDI', act: () => this.resume() },
        { label: () => `RICOMINCIA LA ZONA (1 CREDITO)`, off: !(this.credits > 0), desc: 'RIPARTI DALL\'INIZIO DELLA ZONA', act: retry },
        { label: () => 'COME SI GIOCA', act: () => { const from = this.pausedFrom; this.howto(() => { this.mode = from; this.pause(true); }); } },
        { label: () => 'OPZIONI E COMANDI', act: () => this.options('pause') },
        { label: () => 'ESCI AL MENU', desc: 'LA PARTITA IN CORSO SI PERDE', act: () => this.menu() },
      ] });
  },
  resume() { UI.hide(); this.mode = this.pausedFrom || 'stage'; this.back = null; Input.keyEdge = {}; this.capture = null; this.cm = null; },
});

function drawCMenu(M) {
  if (!M) return;
  const t = M.t, S = M.spec, items = S.items, n = items.length;
  if (S.over && Game.cmUnder) { Game.draw(Game.cmUnder); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(3,6,16,.72)'; g.fillRect(0, 0, W, H); }
  else {
    drawStageBackdrop('port', 300 + Math.sin((Game.menuT || 0) * 0.1) * 40);
    g.fillStyle = 'rgba(3,6,16,.62)'; g.fillRect(0, 0, W, H);
    drawMenuHeroes(Game.menuT || 0);
  }
  const y0 = cmY0(n), top = y0 - 110, bot = y0 + (n - 1) * CM_DY + 70;
  g.save(); g.globalAlpha = 0.85; g.fillStyle = '#040a14';
  g.beginPath(); g.moveTo(W / 2 - 300, top); g.lineTo(W / 2 + 300, top); g.lineTo(W / 2 + 320, top + 14); g.lineTo(W / 2 + 320, bot); g.lineTo(W / 2 - 320, bot); g.lineTo(W / 2 - 320, top + 14); g.closePath(); g.fill();
  g.globalAlpha = 1; g.strokeStyle = '#ffd35a55'; g.lineWidth = 2; g.stroke(); g.restore();
  ptxt(S.eyebrow || '', W / 2, top + 34, 10, '#64dedb', 'center');
  ptitle(S.title || '', W / 2, top + 72, S.title && S.title.length > 26 ? 18 : 24, '#fff6d6', '#ffb03a');
  items.forEach((it, i) => {
    const y = y0 + i * CM_DY, sel = i === M.i, label = it.label();
    if (sel) {
      const w = 580;
      const bar = g.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
      bar.addColorStop(0, 'rgba(232,154,44,0)'); bar.addColorStop(0.15, '#e89a2c'); bar.addColorStop(0.85, '#e89a2c'); bar.addColorStop(1, 'rgba(232,154,44,0)');
      g.fillStyle = bar; g.beginPath(); g.moveTo(W / 2 - w / 2 + 14, y - 18); g.lineTo(W / 2 + w / 2, y - 18); g.lineTo(W / 2 + w / 2 - 14, y + 18); g.lineTo(W / 2 - w / 2, y + 18); g.fill();
      if (M.flash > 0) { g.fillStyle = `rgba(255,255,255,${M.flash * 3})`; g.fillRect(W / 2 - w / 2, y - 18, w, 36); }
      if (it.lr) { ptxt('◀', W / 2 - w / 2 + 34, y + 7, 16, '#10161e', 'center', false); ptxt('▶', W / 2 + w / 2 - 34, y + 7, 16, '#10161e', 'center', false); }
      ptitle(label, W / 2, y + 8, label.length > 30 ? 15 : 19, '#fff6d6', '#ffd35a');
    } else ptxt(label, W / 2, y + 6, 13, it.off ? '#4a5a6a' : '#b9c9d8', 'center');
  });
  const it = items[M.i];
  if (it && it.desc) txt(it.desc, W / 2, bot - 22, 15, '#9fe8ff', 'center', 700);
  if (S.note) txt(S.note, W / 2, bot + 30, 14, '#8a9aac', 'center', 600);
  ptxt(Touch.on ? 'TOCCA UNA VOCE' : `▲ ▼ SCEGLI · INVIO / ${padName(0)} CONFERMA · ESC / ${padName(1)} INDIETRO`, W / 2, H - 22, 8, '#6f8aa2', 'center');
}
