'use strict';
/* ============================================================
   MODALITÀ E SCHERMATE EXTRA (1.6)
   Boss Rush · Sopravvivenza · Sfida a tempo · classifiche con
   le iniziali · demo del cabinato · galleria · opzioni (volume
   musica/effetti, tasti personalizzabili) · sbloccabili.
   ============================================================ */
const HS_KEY = 'primal-hiscores', UNLOCK_KEY = 'primal-unlocks';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.';
const BOARDS = [
  { id: 'campaign', name: 'STORIA' },
  { id: 'bossrush', name: 'BOSS RUSH' },
  { id: 'survival', name: 'SOPRAVVIVENZA' },
  { id: 'timeattack', name: 'SFIDA A TEMPO' },
];
const MODE_NAMES = { campaign: 'STORIA', bossrush: 'BOSS RUSH', survival: 'SOPRAVVIVENZA', timeattack: 'SFIDA A TEMPO' };
const ACTIONS = [
  ['l', 'SINISTRA'], ['r', 'DESTRA'], ['u', 'SU'], ['d', 'GIÙ'],
  ['punch', 'ATTACCO'], ['shoot', 'PISTOLA'], ['jump', 'SALTO'], ['special', 'SPECIALE'], ['dodge', 'SCHIVATA'], ['team', 'SQUADRA'], ['start', 'PAUSA'],
];

Object.assign(Game, {
  modeKind: 'campaign',

  /* ---------------- sbloccabili ---------------- */
  unlocks() { try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}'); } catch (e) { return {}; } },
  setUnlock(k) { try { const u = this.unlocks(); u[k] = 1; localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); } catch (e) {} },
  sigilTotal() { return Object.values(this.sigilsSaved()).reduce((a, l) => a + l.length, 0); },
  heroCount() { return this.unlocks().story || this.progress() >= 5 ? HEROES.length : CORE_HEROES; },   // II: Rigel after chapter 5
  skinsUnlocked() { const out = [0]; if (this.sigilTotal() >= 12) out.push(1); if (this.unlocks().story) out.push(2); return out; },

  /* ---------------- menu delle modalità extra ---------------- */
  extras() {
    this.mode = 'menu';
    this.back = () => this.menu();
    const prog = this.progress();
    UI.show(`<span class="eyebrow">MODALITÀ EXTRA · 1-4 GIOCATORI</span><h2>Scegli la sfida</h2>
      <nav class="col arcade">
        <button class="primary" id="rush" autofocus>BOSS RUSH · GLI 8 BOSS DI FILA</button>
        <button id="surv">SOPRAVVIVENZA · ONDATE INFINITE</button>
        <button id="ta">SFIDA A TEMPO · CAPITOLO ${this.taLevel + 1}</button>
        <button id="tach">◀ ▶ CAPITOLO: ${this.taLevel + 1} · ${LEVELS[this.taLevel].title}</button>
        <button id="back">INDIETRO</button>
      </nav>
      <p>Niente continui: quando la squadra cade la partita finisce e si entra in classifica con le iniziali.
      Nella Sfida a tempo si gioca un capitolo già sbloccato, senza dialoghi: conta solo il cronometro.</p>`);
    UI.on('#rush', () => { this.modeKind = 'bossrush'; this.lobby(); });
    UI.on('#surv', () => { this.modeKind = 'survival'; this.lobby(); });
    UI.on('#ta', () => { this.modeKind = 'timeattack'; this.lobby(); });
    UI.on('#tach', () => { this.taLevel = (this.taLevel + 1) % (prog + 1); this.extras(); const b = screenEl.querySelector('#tach'); if (b) b.focus(); });
    UI.on('#back', () => this.menu());
  },
  taLevel: 0,

  /* ---------------- avvio delle modalità ---------------- */
  beginMode() {
    UI.hide();
    this.credits = 0;
    for (const p of this.players) { p.score = 0; p.lives = 3; }
    FX.parts = []; FX.team = null;
    if (this.modeKind === 'bossrush') { this.rushIdx = 0; this.rushTime = 0; this.rushHp = {}; this.rushStage(0); }
    else if (this.modeKind === 'survival') {
      this.levelIdx = 0;
      this.S = newStage(0, this.simPlayers(true), 0, survivalLevel());
      this.S.credits = 0; this.S.summonOK = this.sigilTotal() >= 3; this.S.taT = 0;
      this.mode = 'stage'; this.G = null; Audio.playSong(4);
    } else if (this.modeKind === 'timeattack') {
      const i = this.taLevel;
      this.levelIdx = i;
      this.S = newStage(i, this.simPlayers(true), 0);
      this.S.phase = 'stage'; this.S.players.forEach((p) => { p.civil = false; p.inv = 1; });
      this.S.banner = { text: 'SFIDA A TEMPO', sub: `CAPITOLO ${i + 1} · ${LEVELS[i].title}`, t: 2.5 };
      this.S.credits = 0; this.S.summonOK = this.sigilTotal() >= 3; this.S.taT = 0;
      this.mode = 'stage'; this.G = null; Audio.playSong(LEVELS[i].music);
    }
  },
  rushStage(i) {
    this.levelIdx = i;
    const S = newStage(i, this.simPlayers(true), 0, rushLevel(i));
    S.credits = 0; S.summonOK = this.sigilTotal() >= 3; S.taT = this.rushTime;
    S.banner = { text: `BOSS ${i + 1}/8`, sub: BOSSES[S.L.zones[0].boss].name, t: 2 };
    // health carries over between bosses, with a small refill
    for (const p of S.players) { const h = this.rushHp[p.id]; if (h !== undefined) p.hp = Math.min(p.max, h + p.max * 0.35); }
    this.S = S; this.mode = 'stage'; this.G = null; FX.parts = [];
    Audio.playSong(LEVELS[i].music, 'boss');
  },
  /* stage finished in an extra mode (win); returns true when handled */
  modeStageResult(r) {
    const S = this.S;
    if (this.modeKind === 'bossrush') {
      this.rushTime = S.taT;
      this.carryScores(S.players);
      for (const p of S.players) this.rushHp[p.id] = p.out ? 0 : p.hp;
      if (this.rushIdx >= LEVELS.length - 1) {
        const bonus = Math.max(0, Math.round((900 - this.rushTime) * 60));
        for (const p of this.players) p.score += bonus;
        this.runResult = { kind: 'bossrush', win: true, bosses: 8, time: this.rushTime, bonus };
        this.afterRun();
      } else { this.rushIdx++; this.rushStage(this.rushIdx); }
      return true;
    }
    if (this.modeKind === 'timeattack') {
      if (r === 'ride') { startRide(S); return true; }
      if (r === 'board') { boardTrain(S); return true; }
      S.taStop = true;
      this.carryScores(S.players);
      this.runResult = { kind: 'timeattack', win: true, lvl: this.levelIdx, time: S.taT };
      this.afterRun();
      return true;
    }
    return false;
  },
  /* after GAME OVER / ending / an extra mode: high score entry, table, then back */
  afterRun() {
    const R = this.runResult || { kind: 'campaign' };
    this.runResult = null;
    const S = this.S;
    if (R.kind === 'bossrush' && !R.win) { R.bosses = this.rushIdx; R.time = S ? S.taT : 0; }
    if (R.kind === 'survival') R.waves = S && S.sv ? Math.max(0, S.sv.wave - 1) : 0;
    const back = () => (this.attract ? this.title() : this.menu());
    const list = [];
    for (const p of this.players) {
      if (p.device === 'gone') continue;
      const rec = { s: p.score || 0, h: p.hero };
      if (R.kind === 'campaign') { rec.c = R.end ? 'FINE' : String(this.levelIdx + 1); rec.d = DIFF.name; }
      if (R.kind === 'bossrush') { rec.b = R.bosses; rec.tm = +(R.time || 0).toFixed(1); }
      if (R.kind === 'survival') rec.w = R.waves;
      if (R.kind === 'timeattack') { if (!R.win) continue; rec.tm = +R.time.toFixed(1); rec.l = R.lvl; }
      if (this.qualifies(R.kind, rec)) list.push({ p, rec });
    }
    // one entry for the whole team in time attack (the time is shared)
    const entries = R.kind === 'timeattack' ? list.slice(0, 1) : list;
    const showBoard = () => this.showScores(BOARDS.findIndex((b) => b.id === R.kind), back, R);
    if (!entries.length) { showBoard(); return; }
    this.entry = { queue: entries, i: 0, letters: [0, 0, 0], pos: 0, t: 0, kind: R.kind, then: showBoard };
    this.startEntry();
  },
  startEntry() {
    const E = this.entry, cur = E.queue[E.i];
    const nm = (cur.p.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    E.letters = /^\dP$/.test(cur.p.name) || !nm ? [0, 0, 0] : [0, 1, 2].map((k) => Math.max(0, LETTERS.indexOf(nm[k] || 'A')));
    E.pos = 0; E.t = 0;
    this.mode = 'entry'; UI.hide(); Audio.playSong(8, 'sigla');
    // remote players (online) keep their name
    if (cur.p.device === 'remote') this.commitEntry();
  },
  commitEntry() {
    const E = this.entry, cur = E.queue[E.i];
    cur.rec.n = E.letters.map((k) => LETTERS[k]).join('');
    this.addScore(E.kind, cur.rec);
    Audio.sfx('team');
    E.i++;
    if (E.i < E.queue.length) this.startEntry();
    else { const then = E.then; this.entry = null; then(); }
  },
  tickEntry(dt, ctrls) {
    const E = this.entry;
    if (!E) return;
    E.t += dt;
    const cur = E.queue[E.i];
    const dev = cur.p.device;
    if (dev === 'remote' || dev === 'gone' || !dev) { this.commitEntry(); return; }
    const c = this.lobbyControl(dev);
    const m = this.menuEdges();
    const up = c.pressed.u || (dev.startsWith('kb') && m.u), down = c.pressed.d || (dev.startsWith('kb') && m.d);
    const n = LETTERS.length;
    if (up) { E.letters[E.pos] = (E.letters[E.pos] + 1) % n; Audio.sfx('select'); }
    if (down) { E.letters[E.pos] = (E.letters[E.pos] + n - 1) % n; Audio.sfx('select'); }
    if (c.pressed.l && E.pos > 0) { E.pos--; Audio.sfx('select'); }
    if (c.pressed.shoot && E.pos > 0) { E.pos--; Audio.sfx('select'); }
    if (c.pressed.punch || c.pressed.r || c.pressed.jump || (dev.startsWith('kb') && Input.keyEdge.Enter)) {
      if (E.pos < 2) { E.pos++; Audio.sfx('confirm'); } else this.commitEntry();
      return;
    }
    if (E.t > 40) this.commitEntry();
  },

  /* ---------------- classifiche ---------------- */
  scores() { try { return JSON.parse(localStorage.getItem(HS_KEY) || '{}'); } catch (e) { return {}; } },
  sortBoard(kind, list) {
    const f = { campaign: (a, b) => b.s - a.s, bossrush: (a, b) => (b.b - a.b) || (b.s - a.s), survival: (a, b) => (b.w - a.w) || (b.s - a.s), timeattack: (a, b) => a.tm - b.tm }[kind];
    return list.sort(f);
  },
  boardList(kind, lvl) {
    const all = this.scores();
    if (kind === 'timeattack') return ((all.timeattack || {})[lvl] || []).slice();
    if (all[kind] && all[kind].length) return all[kind].slice();
    // default table, like a real cabinet
    if (kind === 'campaign') return ['B3P', 'KIK', 'MIM', 'SEN', 'VEL', 'KHA', 'ONX', 'AUR', 'LYR', 'AZR'].map((n, i) => ({ n, s: 60000 - i * 5000, h: i % 5, c: String(8 - Math.floor(i / 2)), d: 'NORMALE', cpu: 1 }));
    return [];
  },
  qualifies(kind, rec) {
    const list = this.boardList(kind, rec.l);
    const max = kind === 'timeattack' ? 5 : 10;
    if (list.length < max) return true;
    const test = this.sortBoard(kind, [...list, rec]);
    return test.indexOf(rec) < max;
  },
  addScore(kind, rec) {
    try {
      const all = this.scores();
      const max = kind === 'timeattack' ? 5 : 10;
      if (kind === 'timeattack') {
        all.timeattack = all.timeattack || {};
        all.timeattack[rec.l] = this.sortBoard(kind, [...(all.timeattack[rec.l] || []), rec]).slice(0, max);
      } else all[kind] = this.sortBoard(kind, [...this.boardList(kind).filter((r) => !r.cpu), rec]).slice(0, max);
      localStorage.setItem(HS_KEY, JSON.stringify(all));
      this.lastRec = rec;
    } catch (e) {}
  },
  showScores(board = 0, then = null, R = null) {
    this.mode = 'scores'; UI.hide();
    this.sc = { b: Math.max(0, board), t: 0, then: then || (() => this.menu()), lvl: R && R.lvl !== undefined ? R.lvl : 0 };
  },
  tickScores(dt, ctrls) {
    const s = this.sc; s.t += dt;
    const e = this.menuEdges();
    if (e.l || e.r) { s.b = (s.b + (e.r ? 1 : BOARDS.length - 1)) % BOARDS.length; s.t = 0.5; Audio.sfx('select'); }
    if (e.u || e.d) { s.lvl = (s.lvl + (e.d ? 1 : 7)) % 8; Audio.sfx('select'); }
    const go = (s.t > 1 && (e.ok || this.anyPress(ctrls, 'punch', 'start'))) || (this.attract && s.t > 8) || Input.keyEdge.Backspace;
    if (this.attract && s.t > 0.3 && (Object.keys(Input.keyEdge).length || this.anyPad())) { this.attract = false; this.menu(); return; }
    if (go) { const then = s.then; this.sc.then = null; Audio.sfx('confirm'); then && then(); }
  },
  anyPad() { return Input.pads().some((p) => Object.values(Input.read('pad' + p.index).pressed).some(Boolean)); },

  /* ---------------- demo del cabinato ---------------- */
  startDemo() {
    const lvl = pick([0, 1, 1, 2, 3, 4, 5, 6, 7]);
    const zone = lvl === 0 ? pick([0, 1]) : pick([0, 1, 2]);
    const h1 = Math.floor(Math.random() * 5), h2 = (h1 + 1 + Math.floor(Math.random() * 4)) % 5;
    const S = newStage(lvl, [{ id: 1, hero: h1, name: 'CPU' }, { id: 2, hero: h2, name: 'CPU' }], zone);
    S.credits = 0;
    if (lvl === 1 && zone === 2) S.players.forEach((p, i) => { p.x = LEVELS[1].zones[2].x - 200 - i * 40; });
    this.demo = { S, t: 0, k: 0 };
    this.mode = 'demo'; UI.hide(); FX.parts = []; FX.team = null;
    Audio.playSong(LEVELS[lvl].music);
  },
  tickDemo(dt) {
    const D = this.demo;
    D.t += dt; D.k++;
    const S = D.S;
    const ctrls = {};
    for (const p of S.players) { ctrls[p.id] = cpuControl(S, p, D.k); if (p.hp < p.max * 0.25) p.hp = p.max * 0.6; }
    stepStage(S, ctrls, dt);
    if (S.result === 'ride') { S.result = null; startRide(S); }
    if (S.result === 'board') { S.result = null; boardTrain(S); }
    this.pendingEv.push(...S.events.filter((e) => e.t !== 'snd' || ['boom', 'special', 'team', 'morph'].includes(e.n)));
    const quit = Object.keys(Input.keyEdge).length || this.anyPad();
    if (quit && D.t > 0.3) { this.attract = false; this.demo = null; Audio.unlock(); this.menu(); return; }
    if (D.t > 42 || S.result || S.players.every((p) => p.out)) { this.demo = null; this.title(); }
  },
  /* attract loop: title → intro → high scores → CPU demo → title */
  nextAttract() {
    this.attractStep = ((this.attractStep ?? -1) + 1) % 3;
    this.attract = true; this.players = [];
    if (this.attractStep === 0) { this.mode = 'intro'; this.introT = 0; this.prevIntroT = 0; }
    else if (this.attractStep === 1) this.showScores(0, () => this.title());
    else this.startDemo();
  },

  /* ---------------- galleria ---------------- */
  gallery() {
    this.mode = 'gallery'; UI.hide();
    this.gal = this.gal || { pg: 0, i: 0, t: 0 };
    this.gal.t = 0;
    Audio.playSong(8, 'sigla');
  },
  galleryPages() {
    const prog = this.progress(), u = this.unlocks();
    const cines = [
      { id: 'intro', name: 'INTRO · LA NOTTE DELLE SIRENE', ok: true },
      ...LEVELS.map((L, i) => ({ id: i, name: `DOPO IL CAPITOLO ${i + 1}`, ok: prog > i || (i === 7 && u.story) })),
      { id: 'board', name: 'IL CONVOGLIO PARTE', ok: prog > 1 },
      { id: 'awake', name: 'IL RISVEGLIO DEL TIRANNO', ok: prog > 2 },
      { id: 'union', name: 'L\'UNIONE DEI TITANI', ok: prog > 4 },
      { id: 'final', name: 'CONCORDIA ALBA', ok: prog >= 7 },
      { id: 'ending', name: 'FINALE', ok: !!u.story },
    ];
    return [
      { name: 'SENTINELS', items: HEROES.map((h, i) => ({ kind: 'hero', i, name: h.name, ok: i < CORE_HEROES || !!u.story })) },
      { name: 'ALLEATI', items: [{ kind: 'ally', a: 'argo', name: 'ARMV3Z', ok: true }, { kind: 'ally', a: 'sette', name: 'ASTRO', ok: true }, { kind: 'ally', a: 'boris', name: 'BORIS', ok: true }, { kind: 'ally', a: 'valli', name: 'DOTT.SSA VALLI', ok: prog >= 2 }] },
      { name: 'NEMICI', items: Object.keys(ENEMIES).map((k) => ({ kind: 'enemy', k, name: ENEMIES[k].name.toUpperCase(), ok: true })) },
      { name: 'BOSS', items: Object.keys(BOSSES).filter((k) => k !== 'kharon2').map((k, i) => ({ kind: 'boss', k, name: BOSSES[k].name, ok: prog >= i || !!u.story })) },
      { name: 'TITANI', items: [...['leone', 'grifone', 'lupa', 'sirena', 'toro', 'paladino', 'paladinoS'].map((k) => ({ kind: 'folk', k, name: TITAN_KINDS[k].name, ok: !!u.story || prog > ({ paladino: 6, paladinoS: 7 }[k] ?? FOLK_FROM[k]) })), ...Object.keys(GIANTS).filter((k) => LEVELS.some((L) => L.giant && L.giant.enemy === k)).map((k) => ({ kind: 'giant', k, name: GIANTS[k].name, ok: !!u.story || prog > LEVELS.findIndex((L) => L.giant && L.giant.enemy === k) }))] },
      { name: 'CINEMATICHE', items: cines.map((c) => ({ kind: 'cine', ...c })) },
      { name: 'LUOGHI', items: ['port', 'rail', 'park', 'theater', 'siege', 'graveyard', 'veil', 'dawn', 'story_cores', 'cine_cavern', 'cine_rex', 'cine_run', 'cine_cockpit', 'cine_duel', 'cine_dawn'].map((b, i) => ({ kind: 'bg', b, name: i < 8 ? LEVELS[i].place : ['LA CAMERA DEI CUORI', 'LA CAVERNA DEI TITANI', 'IL TIRANNO ROSSO', 'LA CORSA DEI TITANI', 'LA CABINA DI CONCORDIA', 'IL DUELLO', 'L\'ALBA'][i - 8], ok: i >= 8 ? prog >= 2 || i === 8 : prog >= i })) },
    ];
  },
  tickGallery(dt, ctrls) {
    const G = this.gal; G.t += dt;
    const pages = this.galleryPages();
    const e = this.menuEdges();
    const pg = pages[G.pg];
    if (e.u || e.d) { G.pg = (G.pg + (e.d ? 1 : pages.length - 1)) % pages.length; G.i = 0; G.t = 0; Audio.sfx('select'); return; }
    if (e.l || e.r) { G.i = (G.i + (e.r ? 1 : pg.items.length - 1)) % pg.items.length; G.t = 0; Audio.sfx('select'); }
    if (Input.keyEdge.Escape || Input.keyEdge.Backspace || this.padBack()) { Audio.sfx('select'); this.menu(); return; }
    const it = pg.items[G.i];
    const ok = Input.keyEdge.Enter || Input.keyEdge.KeyJ || Input.keyEdge.KeyF || Input.keyEdge.Space || this.padOk();
    if (ok && it.kind === 'cine' && it.ok) {
      Audio.sfx('confirm');
      const back = () => { this.gallery(); };
      if (it.id === 'intro') { this.players = []; this.galleryIntro = true; this.mode = 'intro'; this.introT = 0; this.prevIntroT = 0; }
      else if (it.id === 'ending') { this.players = []; this.galleryEnd = true; this.mode = 'ending'; this.endT = 0; Audio.playSong(8, 'finale'); }
      else this.playCine(it.id, back);
    }
  },
  padOk() { return Input.pads().some((p) => { const b = padButtons(p), pr = Input.padPrev[p.index] || []; return (b[0] && !pr[0]) || (b[2] && !pr[2]); }); },
  padBack() { return Input.pads().some((p) => { const b = padButtons(p), pr = Input.padPrev[p.index] || []; return (b[1] && !pr[1]) || (b[3] && !pr[3]); }); },

  /* ---------------- opzioni ---------------- */
  options(from) {
    this.mode = from === 'pause' ? 'pause' : 'menu';
    const back = from === 'pause' ? () => this.pause() : () => this.menu();
    this.back = back;
    const bar = (v) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));
    const fs = !!document.fullscreenElement;
    UI.show(`<span class="eyebrow">OPZIONI</span><h2>Suono, schermo e comandi</h2>
      <nav class="col arcade">
        <button id="mus" autofocus>MUSICA  ${bar(Audio.musicVol)} ${Math.round(Audio.musicVol * 100)}%</button>
        <button id="fx">EFFETTI ${bar(Audio.sfxVol)} ${Math.round(Audio.sfxVol * 100)}%</button>
        <button id="mute">AUDIO: ${Audio.muted ? 'SPENTO' : 'ACCESO'} (TASTO M)</button>
        <button id="full">SCHERMO INTERO: ${fs ? 'SÌ' : 'NO'}</button>
        <button id="keys">TASTI DELLA TASTIERA</button>
        <button id="padtest">PROVA E CALIBRA IL CONTROLLER</button>
        <button id="padkeys">PULSANTI DEL CONTROLLER</button>
        <button id="padstyle">SIMBOLI CONTROLLER: ${PAD_STYLE_NAMES[padStyleSetting()]}${padStyleSetting() === 'auto' ? ' (' + PAD_STYLE_NAMES[padStyle()] + ')' : ''}</button>
        <button id="back">INDIETRO</button>
      </nav>
      <p>Ogni pressione alza il volume del 10%; dopo il 100% si torna a zero.${Object.values(Audio.fileOK).some(Boolean) ? ' Brani MP3 trovati in assets/music.' : ' Metti i brani MP3 in assets/music per sostituire la musica sintetizzata (vedi LEGGIMI).'}</p>`, from === 'pause' ? 'center' : '');
    const step = (v) => (v >= 0.99 ? 0 : Math.min(1, Math.round(v * 10 + 1) / 10));
    const refocus = (id) => { const b = screenEl.querySelector(id); if (b) b.focus(); };
    UI.on('#mus', () => { Audio.setVolumes(step(Audio.musicVol), Audio.sfxVol); this.options(from); refocus('#mus'); });
    UI.on('#fx', () => { Audio.setVolumes(Audio.musicVol, step(Audio.sfxVol)); this.options(from); refocus('#fx'); Audio.sfx('pickup'); });
    UI.on('#mute', () => { Audio.setMuted(!Audio.muted); this.options(from); refocus('#mute'); });
    UI.on('#full', () => {
      const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      Promise.resolve(p).catch(() => {}).finally(() => setTimeout(() => { this.options(from); refocus('#full'); }, 150));
    });
    UI.on('#keys', () => this.remap('kb', from));
    UI.on('#padkeys', () => this.remap('pad', from));
    UI.on('#padtest', () => this.padTest(from));
    UI.on('#padstyle', () => { const o = ['auto', 'ps', 'xbox']; setPadStyle(o[(o.indexOf(padStyleSetting()) + 1) % 3]); this.options(from); refocus('#padstyle'); });
    UI.on('#back', back);
  },
  remap(scheme = 'kb', from) {
    this.mode = from === 'pause' ? 'pause' : 'menu';
    this.back = () => this.options(from);
    const pad = scheme === 'pad';
    const map = pad ? PADMAP : KEYMAPS[scheme];
    const label = (a) => pad ? (PADMAP[a] || []).map((i) => padHTML(i)).join(' / ') : (map[a] || []).map(codeLabel).join(' / ');
    const acts = pad ? ACTIONS.filter(([a]) => !['l', 'r', 'u', 'd'].includes(a)) : ACTIONS;
    const tabs = [['kb', 'TASTIERA'], ['kbA', 'TASTIERA 1P (IN DUE)'], ['kbB', 'TASTIERA 2P (IN DUE)'], ['pad', 'CONTROLLER']];
    UI.show(`<span class="eyebrow">OPZIONI · COMANDI</span><h2>Scegli un'azione e premi il nuovo tasto</h2>
      <nav>${tabs.map(([k, n]) => `<button class="${k === scheme ? 'primary' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>
      <div class="keygrid">${acts.map(([a, n]) => `<button data-act="${a}"><span>${n}</span><b>${label(a)}</b></button>`).join('')}</div>
      <nav>${pad ? `<button id="pstyle">SIMBOLI: ${PAD_STYLE_NAMES[padStyleSetting()]}${padStyleSetting() === 'auto' ? ' (' + PAD_STYLE_NAMES[padStyle()] + ')' : ''}</button>` : ''}<button id="reset">RIPRISTINA PREDEFINITI</button><button id="back">INDIETRO</button></nav>
      <p>${pad ? 'Scegli un\'azione (con il mouse, il tocco o la croce + ✕/A), poi premi sul controller il pulsante da assegnare. Se era già usato da un\'altra azione, le due si scambiano. Il movimento resta su levetta sinistra e croce.' : 'Premi il nuovo tasto. Se era già usato da un\'altra azione, le due si scambiano. Canc annulla.'}</p>`, from === 'pause' ? 'center' : '');
    screenEl.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { Audio.sfx('select'); this.remap(b.dataset.tab, from); });
    screenEl.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => {
      Audio.sfx('confirm');
      const a = b.dataset.act;
      b.querySelector('b').textContent = pad ? 'PREMI UN PULSANTE…' : 'PREMI UN TASTO…';
      const done = () => { this.capture = null; setTimeout(() => { this.remap(scheme, from); const nb = screenEl.querySelector(`[data-act="${a}"]`); if (nb) nb.focus(); }, 120); };
      if (pad) { this.capture = { pad: true, fn: (idx) => { const old = PADMAP[a]; for (const k in PADMAP) if (k !== a && PADMAP[k].includes(idx)) PADMAP[k] = PADMAP[k].filter((x) => x !== idx).concat(old.slice(0, 1)); PADMAP[a] = [idx]; saveKeymaps(); done(); } }; return; }
      const onKey = (e) => {
        e.preventDefault(); e.stopImmediatePropagation();
        removeEventListener('keydown', onKey, true);
        if (e.code !== 'Delete') {
          const old = map[a] || [];
          for (const k in map) if (k !== a && map[k].includes(e.code)) map[k] = map[k].filter((x) => x !== e.code).concat(old.slice(0, 1));
          map[a] = [e.code];
          saveKeymaps();
        }
        done();
      };
      this.capture = { pad: false };
      addEventListener('keydown', onKey, true);
    });
    UI.on('#reset', () => { resetKeymaps(); this.remap(scheme, from); });
    UI.on('#pstyle', () => { const o = ['auto', 'ps', 'xbox']; setPadStyle(o[(o.indexOf(padStyleSetting()) + 1) % 3]); this.remap('pad', from); const nb = screenEl.querySelector('#pstyle'); if (nb) nb.focus(); });
    UI.on('#back', () => this.options(from));
  },
  /* the next gamepad button pressed is assigned (see frame loop) */
  pollPadCapture() {
    if (!this.capture || !this.capture.pad) return false;
    for (const p of Input.pads()) {
      const prev = Input.padPrev[p.index] || [];
      const i = padButtons(p).findIndex((b, k) => b && !prev[k] && k < 12);
      if (i >= 0) { const fn = this.capture.fn; this.capture = null; fn(i); return true; }
    }
    return true;
  },
});

/* ---------------- disegno delle schermate ---------------- */
function drawEntry(v) {
  drawStageBackdrop('port', 300);
  g.fillStyle = 'rgba(3,6,16,.82)'; g.fillRect(0, 0, W, H);
  ptitle('NUOVO RECORD!', W / 2, 120, 40, '#fff6d6', '#ffb03a');
  ptxt(MODE_NAMES[v.kind] || '', W / 2, 160, 12, '#9fe8ff', 'center');
  const h = v.h ?? 0;
  glowAt(300, 560, 180, (HEROES[h] || HEROES[0]).color, 0.35);
  drawShadow(300, 600, 44); heroSpr(h, v.t % 1.2 < 0.6 ? 5 : 0, 300, 600, { scale: 1.5, face: 1 });
  ptxt(`${v.pl}P · ${(HEROES[h] || HEROES[0]).name}`, 300, 640, 12, (HEROES[h] || HEROES[0]).color, 'center');
  ptxt(v.val, W / 2 + 140, 230, 14, '#ffd27a', 'center');
  ptxt('INSERISCI LE TUE INIZIALI', W / 2 + 140, 290, 12, '#c8d6e4', 'center');
  v.letters.forEach((k, i) => {
    const x = W / 2 + 40 + i * 100, y = 420, sel = i === v.pos;
    panel(x - 40, y - 70, 80, 96, sel ? '#ffd35a' : '#3a5068', 0.9);
    ptitle(LETTERS[k], x, y, 44, sel ? '#ffffff' : '#c8d6e4', sel ? '#ffb03a' : '#6f8aa2');
    if (sel && Math.floor(v.t * 4) % 2) { ptxt('▲', x, y - 84, 14, '#ffd35a', 'center'); ptxt('▼', x, y + 52, 14, '#ffd35a', 'center'); }
  });
  ptxt('▲▼ LETTERA · ATTACCO / ▶ AVANTI · PISTOLA / ◀ INDIETRO', W / 2 + 140, 540, 9, '#9fb4c8', 'center');
  ptxt(`${Math.max(0, Math.ceil(40 - v.t))}`, W - 60, 60, 16, '#ff8a7a', 'right');
}
function drawScores(v) {
  drawStageBackdrop(['port', 'siege', 'veil', 'rail'][v.b] || 'port', 300);
  g.fillStyle = 'rgba(3,6,16,.84)'; g.fillRect(0, 0, W, H);
  ptitle('CLASSIFICHE', W / 2, 78, 34, '#fff6d6', '#ffb03a');
  BOARDS.forEach((b, i) => { const x = W / 2 + (i - 1.5) * 250; panel(x - 110, 102, 220, 36, i === v.b ? '#ffd35a' : '#3a5068', i === v.b ? 0.95 : 0.6); ptxt(b.name, x, 127, 10, i === v.b ? '#ffd35a' : '#9fb4c8', 'center'); });
  const kind = BOARDS[v.b].id;
  const rows = v.rows || [];
  const cols = { campaign: ['#', 'NOME', 'PUNTI', 'EROE', 'CAPITOLO', 'DIFFICOLTÀ'], bossrush: ['#', 'NOME', 'BOSS', 'TEMPO', 'EROE', 'PUNTI'], survival: ['#', 'NOME', 'ONDATE', 'EROE', 'PUNTI', ''], timeattack: ['#', 'NOME', 'TEMPO', 'EROE', '', ''] }[kind];
  const xs = [200, 270, 470, 690, 880, 1060];
  if (kind === 'timeattack') ptxt(`CAPITOLO ${v.lvl + 1} · ${LEVELS[v.lvl].title}  (▲▼ CAMBIA)`, W / 2, 176, 11, '#9fe8ff', 'center');
  cols.forEach((c, i) => ptxt(c, xs[i], 214, 10, '#6fd8d3'));
  if (!rows.length) ptxt('NESSUN RECORD: TOCCA A TE!', W / 2, 360, 14, '#9fb4c8', 'center');
  rows.forEach((r, i) => {
    const y = 256 + i * 40, me = v.me && r.n === v.me.n && (r.s === v.me.s) && (r.tm === v.me.tm);
    const col = me && Math.floor(v.t * 6) % 2 ? '#ffffff' : i === 0 ? '#ffd35a' : i < 3 ? '#ffe9a8' : '#c8d6e4';
    const hero = HEROES[r.h] || HEROES[0];
    const vals = {
      campaign: [`${i + 1}`, r.n, String(r.s).padStart(7, '0'), hero.name, r.c === 'FINE' ? 'FINE ★' : `CAP. ${r.c}`, r.d || ''],
      bossrush: [`${i + 1}`, r.n, `${r.b}/8`, fmtTime(r.tm || 0), hero.name, String(r.s).padStart(7, '0')],
      survival: [`${i + 1}`, r.n, String(r.w), hero.name, String(r.s).padStart(7, '0'), ''],
      timeattack: [`${i + 1}`, r.n, fmtTime(r.tm), hero.name, '', ''],
    }[kind];
    vals.forEach((t, k) => ptxt(t, xs[k], y, 13, k === 3 && kind !== 'campaign' ? hero.color : col));
  });
  if (Math.floor(v.t * 2) % 2) ptxt(Game.attract ? 'PREMI START' : '◀ ▶ CLASSIFICA · ATTACCO / INVIO: CONTINUA', W / 2, H - 30, 10, '#ffd35a', 'center');
}
function drawDemoOverlay(t) {
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, H / 2 - 40, W, 80);
  if (Math.floor(t * 1.6) % 2) ptitle(Touch.on ? 'DEMO · TOCCA LO SCHERMO' : 'DEMO · PREMI START', W / 2, H / 2 + 14, 28, '#ffffff', '#ffd35a');
  drawLogo(W - 150, H - 70, 0.2, t);
}
const GAL_TEXT = {
  soldier: 'Il soldato senza volto della Dimensione Oscura. Da solo è debole, in gruppo accerchia.',
  lancer: 'Veloce, affonda con la lama da lontano: schiva e contrattacca.',
  brute: 'Lento ma pesantissimo: i suoi colpi ti mandano a terra.',
  segment: 'Un pezzo di Centipede che si è staccato e combatte da solo.',
  drone: 'Vola fuori portata: sparagli in diagonale (su + pistola) o saltagli addosso.',
  shield: 'Lo scudo ferma i colpi normali: usa l\'arma, gli speciali o colpiscilo alle spalle.',
  grenadier: 'Lancia granate da lontano: guarda l\'ombra e spostati.',
  dog: 'Mastino meccanico: rapidissimo, morde e salta addosso.',
  ninja: 'Si teletrasporta alle tue spalle: non restare fermo.',
  shade: 'Copia oscura di uno di voi, creata dagli specchi di Mimesi.',
  mastice: 'Colosso d\'asfalto. Pugni e schianti: allontanati quando alza le braccia.',
  centipede: 'Si divide in segmenti che attaccano da soli.',
  trivor: 'Trivella e si interra: il cerchio a terra mostra dove riemerge.',
  mimesi: 'Ruba le vostre mosse e crea copie oscure.',
  kharon: 'Sirio, imprigionato nella corazza di Vespera: para e lancia onde di spada. Colpiscilo alle spalle.',
  custode: 'Difensore dell\'antica flotta: sfere che inseguono e rinforzi.',
  vespera: 'La Regina Oscura: raggio, teletrasporto, evocazioni.',
};
function drawGallery(v) {
  const pages = Game.galleryPages();
  const pg = pages[v.pg], it = pg.items[v.i];
  const t = v.t;
  coverImage('story_cores', 1.05, 0.5, 0.5);
  g.fillStyle = 'rgba(3,6,16,.86)'; g.fillRect(0, 0, W, H);
  ptitle('GALLERIA', 150, 64, 26, '#fff6d6', '#ffb03a', 'left');
  pages.forEach((p, i) => ptxt(p.name, 60, 130 + i * 44, 11, i === v.pg ? '#ffd35a' : '#6f8aa2'));
  ptxt('▶', 40, 130 + v.pg * 44, 11, '#ffd35a');
  panel(300, 96, 940, 560, '#6fd8d3', 0.7);
  ptxt(`${v.i + 1}/${pg.items.length}`, 1220, 124, 9, '#9fb4c8', 'right');
  const cx = 540, cy = 600;
  const lockedTxt = () => { ptitle('???', cx, 380, 60, '#3a5068', '#1d3046'); ptxt('ANCORA BLOCCATO', 880, 330, 14, '#ff8a7a', 'center'); };
  ptitle(it.ok ? it.name : '???', 880, 170, it.name.length > 18 ? 16 : 22, '#fff6d6', '#ffb03a');
  const info = (lines, y0 = 230) => lines.forEach((l, i) => { const w = wrapText(l, 440, 14); w.forEach((ww, k) => txt(ww, 660, y0 + (i * 2 + k) * 26 + i * 10, 14, i === 0 ? '#ffe9a8' : '#c8d6e4', 'left', 700)); });
  if (!it.ok) {
    lockedTxt();
    const need = { hero: 'Completa la storia per sbloccare Sirio, il sesto Sentinel.', cine: 'Arriva più avanti nella storia.', bg: 'Arriva più avanti nella storia.' }[it.kind] || 'Arriva più avanti nella storia.';
    txt(need, 880, 380, 15, '#9fb4c8', 'center', 700);
  } else if (it.kind === 'hero') {
    const h = HEROES[it.i];
    const seq = [0, 1, 2, 3, 2, 5, 6, 9, 10, 11, 12, 15];
    const f = seq[Math.floor(t * 2.5) % seq.length];
    const skins = Game.skinsUnlocked();
    const sk = skins[Math.floor(t / 4) % skins.length];
    glowAt(cx, cy - 120, 200, h.color, 0.35);
    drawShadow(cx - (h.sheet ? 40 : 0), cy, 50); heroSpr(it.i, f, cx - (h.sheet ? 40 : 0), cy, { scale: h.sheet ? 1.55 : 1.9, face: 1, skin: sk });
    if (sk) ptxt('COSTUME ' + SKINS[sk].name, cx, cy + 36, 9, '#ffd35a', 'center');
    info([`${h.civil.toUpperCase()} · ${h.role.toUpperCase()}`, `ARMA: ${h.weapon}`, `SPECIALE: ${h.special} — ${h.specialText}`, `TITANO: ${h.titan}`]);
    const bars = [['POTENZA', h.power / 1.3], ['VELOCITÀ', h.speed / 310], ['VITA', h.hp / 150]];
    bars.forEach(([n, val], i) => { ptxt(n, 660, 520 + i * 30, 9, '#9fb4c8'); segBar(780, 510 + i * 30, 300, 10, val, 0, h.color, 10); });
  } else if (it.kind === 'ally') {
    if (it.a === 'argo') { glowAt(cx, cy - 190, 220, '#6fc8ff', 0.35); spr('mentors', `argo_${[0, 1, 0, 2, 4, 3][Math.floor(t * 1.2) % 6]}`, cx, cy, { scale: 1.1 }); info(['IL GUARDIANO DEI CUORI', 'Forgiò i Cuori nella Dimensione Oscura e mille anni fa portò i titani a Porto Aurora. La sua anima vive nella Camera dei Cuori.']); }
    else if (it.a === 'boris') { drawShadow(cx, cy, 60); const k = `sette_${[0, 2, 4, 6][Math.floor(t * 1.2) % 4]}`; spr('mentors', k, cx, cy, { scale: 2.1, img: skinned('mentors', k, 'boris') }); info(['BORIS, IL ROBOT DELLE RIPARAZIONI', 'Grosso e brontolone: ripara le armature e tiene la bottega. Parla poco, ma tiene sempre Astro.']); }
    else if (it.a === 'sette') { drawShadow(cx, cy, 50); spr('mentors', `sette_${Math.floor(t * 1.5) % 8}`, cx, cy, { scale: 1.7 }); info(['ASTRO, IL ROBOT DEI RADAR', 'Controlla sensori e allarmi, conta i secondi quando è nervoso e festeggia ballando.']); }
    else { drawShadow(cx, cy, 40); spr('people', Math.floor(t) % 3 ? 'scientist_idle0' : 'scientist_point', cx, cy, { scale: 2 }); info(['SCIENZIATA', 'Irene Valli ha studiato le armature per vent\'anni. Liberata dal convoglio, scopre dove dormono i titani.']); }
  } else if (it.kind === 'enemy') {
    const d = ENEMIES[it.k];
    const own = d.sheet === 'ferrea' || d.sheet === 'drone2';
    const f = own ? [0, 1, 0, 2, 3, 4, 5][Math.floor(t * 3) % 7] % (d.sheet === 'drone2' ? 6 : 6) : d.sheet === 'extra' || d.villain ? [0, 1, 0, 2, 3, 4, 5][Math.floor(t * 3) % 7] : [0, 1, 2, 3, 4, 5, 6, 7][Math.floor(t * 3) % 8];
    const sheet = own ? d.sheet : d.sheet === 'extra' ? 'extra' : d.villain ? 'bosses' : 'fighters';
    const key = d.shade ? `${HEROES[Math.floor(t / 3) % 5].id}_${f}` : `${d.pre}_${f}`;
    drawShadow(cx, cy, 50);
    spr(sheet, key, cx, cy - (d.flying ? 120 : 0), { scale: 1.6 * (d.scale / 0.86), face: -1, img: d.shade ? tinted(sheet, key, '#3a1466', 'source-atop', 0.62) : undefined });
    info([`VITA ${d.hp} · DANNO ${d.dmg} · PUNTI ${d.score}`, GAL_TEXT[it.k] || '']);
  } else if (it.kind === 'boss') {
    const B = BOSSES[it.k];
    const s = B.sprite || it.k, p8 = !!frameOf('bosses2', `${s}P_0`);
    const sheet = p8 ? 'bosses2' : 'bosses', key = (f) => p8 ? `${s}P_${f}` : `${s}_${f}`;
    const f = Math.floor(t * 2.5) % (p8 ? 8 : B.frames || 6);
    drawShadow(cx, cy, 90);
    spr(sheet, key(f), cx - 40, cy, { scale: Math.min(1.9, 330 / (frameOf(sheet, key(0)) || [0, 0, 0, 200])[3]), face: 1 });
    info([B.title, GAL_TEXT[it.k] || '', `CAPITOLO ${LEVELS.findIndex((L) => L.zones.some((z) => z.boss === it.k)) + 1}`]);
  } else if (it.kind === 'beast') {
    const pose = ['sleep', 'wake', 'run', 'roar'][Math.floor(t / 1.5) % 4];
    drawShadow(cx, cy, 120); spr(beastSheet(`beast_${it.b}_${pose}`), `beast_${it.b}_${pose}`, cx, cy, { scale: 1.3, face: 1 });
    const hi = BEAST_OF.indexOf(it.b);
    info([`IL TITANO DI ${HEROES[hi].name}`, 'Si risveglia con il Cuore del suo Sentinel. Con 3 Sigilli dei Titani puoi evocarlo una volta per capitolo: tieni premuto COLPO DI SQUADRA.']);
  } else if (it.kind === 'folk') {
    const T = TITAN_KINDS[it.k], f = Math.floor(t * 1.5) % 8, hi = FOLK_OF.indexOf(it.k);
    drawShadow(cx, cy, 160); spr(T.sheet, `${T.pre}_${f}`, cx, cy, { scale: 0.8, face: 1 });
    info([hi >= 0 ? `IL TITANO DI ${HEROES[hi].name}` : 'I CINQUE TITANI UNITI', `${T.jab} · ${T.heavy} · ${T.fin}`, hi >= 0 ? 'Con 3 Sigilli puoi evocarlo una volta per capitolo: tieni premuto COLPO DI SQUADRA.' : 'Nei duelli giganti lo pilotate tutti insieme.']);
  } else if (it.kind === 'conc') {
    const f = [0, 1, 2, 3, 4, 5, 6, 7][Math.floor(t * 1.5) % 8];
    drawShadow(cx, cy, 160); spr('giants', `conc_${f}`, cx, cy, { scale: 0.95, face: 1 });
    info(['I CINQUE TITANI UNITI', 'Pugno Zanna, Carica del Corno e l\'arma finale Cuore Unito. Nei duelli giganti la pilotate tutti insieme.']);
  } else if (it.kind === 'giant') {
    const f = Math.floor(t * 1.5) % 5;
    const E = GIANTS[it.k], sh = E.sheet || 'giants', key = E.keys ? E.keys[f] : `${E.sprite}G_${f}`;
    drawShadow(cx, cy, 160); spr(sh, key, cx, cy, { scale: 0.95, face: -1, img: E.tint ? tinted(sh, key, E.tint, 'source-atop', 0.45) : undefined });
    info(['MOSTRO GIGANTE', `Vita ${GIANTS[it.k].hp}. Sbilancialo con i colpi pesanti, poi arma finale.`]);
  } else if (it.kind === 'cine') {
    g.save(); g.beginPath(); g.rect(320, 200, 560, 315); g.clip(); g.translate(320, 200); g.scale(560 / W, 315 / H);
    if (it.id === 'intro') drawIntro(6 + (t % 6)); else if (it.id === 'ending') drawEnding(3 + (t % 3), []); else drawChapterCine(it.id, 1.5 + (t % 4));
    g.restore();
    g.strokeStyle = '#6fd8d3'; g.lineWidth = 3; g.strokeRect(320, 200, 560, 315);
    ptitle(it.name, 600, 580, it.name.length > 26 ? 14 : 18, '#fff6d6', '#ffb03a');
    if (Math.floor(t * 2) % 2) ptxt('ATTACCO / INVIO: GUARDA', 600, 620, 11, '#ffd35a', 'center');
  } else if (it.kind === 'bg') {
    g.save(); g.beginPath(); g.rect(330, 200, 880, 420); g.clip();
    const img = IMG[it.b];
    if (img) { const s = Math.max(880 / img.width, 420 / img.height); const ox = (img.width * s - 880) * (0.5 + 0.5 * Math.sin(t * 0.3)); g.drawImage(img, 330 - ox, 200, img.width * s, img.height * s); }
    g.restore();
    g.strokeStyle = '#6fd8d3'; g.lineWidth = 3; g.strokeRect(330, 200, 880, 420);
  }
  ptxt('▲▼ SEZIONE · ◀ ▶ SCORRI · ESC / B: MENU', W / 2 + 130, H - 22, 9, '#9fb4c8', 'center');
}

/* ============================================================
   LA BOTTEGA DI BORIS (1.7): tra un capitolo e l'altro la squadra
   spende le monete raccolte (monete, frammenti, sigilli, boss,
   zone liberate e civili salvati) in potenziamenti che valgono
   per tutta la partita.
   ============================================================ */
const SHOP_ITEMS = [
  { k: 'hp', name: 'CUORE RINFORZATO', desc: '+15 vita massima per tutti', cost: [6, 10, 14] },
  { k: 'en', name: 'NUCLEO DI ENERGIA', desc: 'Più energia all\'inizio, si ricarica più in fretta', cost: [5, 9, 13] },
  { k: 'ammo', name: 'CARICATORI EXTRA', desc: '+6 colpi di pistola e caricatore più capiente', cost: [4, 7, 10] },
  { k: 'team', name: 'SINTONIA DI SQUADRA', desc: 'La barra squadra parte già carica di un terzo', cost: [8, 14] },
  { k: 'cr', name: 'GETTONE', desc: '+1 credito per continuare', cost: [12, 16, 20] },
];
Object.assign(Game, {
  openShop(then) {
    this.mode = 'shop'; UI.hide();
    this.shopUI = { i: 0, t: 0, then, msg: 'BOTTEGA APERTA. SCEGLIETE.', mood: 'hello', moodT: 0, prev: {} };
    Audio.playSong(8, 'sigla');
  },
  shopItems() { return SHOP_ITEMS.filter((it) => it.k !== 'cr' || this.credits !== Infinity); },
  tickShop(dt, ctrls) {
    const U = this.shopUI, items = this.shopItems();
    U.t += dt; U.moodT -= dt;
    // every player (local or online) can shop: edge-detect their directions
    let up = false, down = false, buy = false, leave = false;
    for (const [id, c] of Object.entries(ctrls)) {
      const p = U.prev[id] || {};
      if (c.u && !p.u) up = true; if (c.d && !p.d) down = true;
      if (c.pressed.punch) buy = true; if (c.pressed.jump || c.pressed.start) leave = true;
      U.prev[id] = { u: c.u, d: c.d };
    }
    if (Input.keyEdge.Enter || Input.keyEdge.Escape) leave = true;
    const n = items.length + 1;   // last row = continue
    if (up) { U.i = (U.i + n - 1) % n; Audio.sfx('select'); }
    if (down) { U.i = (U.i + 1) % n; Audio.sfx('select'); }
    if (U.t < 0.4) return;
    if (buy && U.i === items.length) leave = true;
    else if (buy) {
      const it = items[U.i], lv = this.shop.lv[it.k], cost = it.cost[lv];
      if (cost === undefined) { U.msg = 'QUESTO È AL MASSIMO!'; U.mood = 'point'; U.moodT = 1.2; Audio.sfx('empty'); }
      else if (this.shop.coins < cost) { U.msg = 'SERVONO PIÙ MONETE.'; U.mood = 'panic'; U.moodT = 1.4; Audio.sfx('hurt'); }
      else {
        this.shop.coins -= cost; this.shop.lv[it.k]++;
        if (it.k === 'cr') this.credits++;
        U.msg = pick(['FATTO.', 'BUONA SCELTA.', 'NON ROMPETELO.']); U.mood = 'joy'; U.moodT = 1.2; Audio.sfx('team');
      }
    }
    if (leave) { Audio.sfx('confirm'); const then = U.then; U.then = null; this.shopUI = null; then && then(); }
  },
});
function drawShop(v) {
  coverImage('story_cores', 1.05, 0.5, 0.5);
  g.fillStyle = 'rgba(3,6,14,.78)'; g.fillRect(0, 0, W, H);
  ptitle('LA BOTTEGA DI BORIS', W / 2, 70, 34, '#fff6d6', '#ffb03a');
  ptxt('POTENZIAMENTI PER TUTTA LA SQUADRA · VALGONO FINO ALLA FINE DELLA PARTITA', W / 2, 100, 9, '#9fb4c8', 'center');
  // Boris at the counter
  const pose = v.mood === 'joy' && v.mt > 0 ? (Math.floor(v.t * 6) % 2 ? 'sette_7' : 'sette_5') : v.mood === 'panic' && v.mt > 0 ? (Math.floor(v.t * 5) % 2 ? 'sette_3' : 'sette_0') : v.mood === 'point' && v.mt > 0 ? 'sette_4' : Math.floor(v.t) % 4 === 3 ? 'sette_2' : 'sette_6';
  drawShadow(230, 600, 70); spr('mentors', pose, 230, 600, { scale: 2.3, img: skinned('mentors', pose, 'boris') });
  panel(60, 150, 340, 70, '#ffd35a', 0.9);
  const lines = wrapText(v.msg, 300, 15);
  lines.slice(0, 2).forEach((l, i) => txt(l, 76, 180 + i * 24, 15, '#fff1c6', 'left', 700));
  // wallet
  const fc = frameOf('items', 'coin');
  panel(60, 630, 340, 60, '#ffd35a', 0.9);
  if (fc) g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], 80, 642, fc[2], fc[3]);
  ptitle(`${v.coins}`, 190, 675, 28, '#ffffff', '#ffd35a', 'left');
  ptxt('MONETE', 330, 668, 9, '#ffd35a', 'center');
  // items
  v.items.forEach((it, i) => {
    const y = 150 + i * 92, sel = v.i === i;
    panel(450, y, 770, 80, sel ? '#ffd35a' : '#3a5068', sel ? 0.95 : 0.8);
    ptxt(it.name, 474, y + 28, 13, sel ? '#ffd35a' : '#e8eef4');
    txt(it.desc, 474, y + 58, 15, '#c8d6e4', 'left', 600);
    for (let k = 0; k < it.max; k++) { g.fillStyle = k < it.lv ? '#ffd35a' : '#26384a'; g.fillRect(1010 + k * 26, y + 16, 20, 20); }
    ptxt(it.cost === null ? 'MAX' : `${it.cost}`, 1196, y + 62, 14, it.cost === null ? '#7bf0b1' : it.cost <= v.coins ? '#ffffff' : '#ff8a7a', 'right');
    if (it.cost !== null && fc) g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], 1110, y + 44, fc[2] * 0.6, fc[3] * 0.6);
    if (sel) ptxt('▶', 458, y + 30, 11, '#ffd35a');
  });
  const cy = 150 + v.items.length * 92, sel = v.i === v.items.length;
  panel(450, cy, 770, 50, sel ? '#7bf0b1' : '#3a5068', 0.9);
  ptxt('CONTINUA LA MISSIONE ▶', 835, cy + 32, 13, sel ? '#7bf0b1' : '#c8d6e4', 'center');
  ptxt('▲▼ SCEGLI · ATTACCO: COMPRA · SALTO / START: CONTINUA', W / 2 + 190, H - 12, 9, '#9fb4c8', 'center');
}
