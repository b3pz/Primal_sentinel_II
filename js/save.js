'use strict';
/* ============================================================
   1.13 — SALVATAGGIO DELLA STORIA e PAGELLE VERE
   Storia (Facile / Normale): il gioco salva da solo all'inizio di
   ogni capitolo e a ogni zona raggiunta. "GIOCA" → CONTINUA riparte
   da lì con monete, potenziamenti e punteggi. In Arcade niente
   salvataggi: si parte sempre dal capitolo 1.
   Pagella: sei voci con un punteggio ciascuna, totale su 100 e voto
   da D a S (la S serve quasi perfetta; in Facile al massimo A).
   ============================================================ */
const STORY_KEY = 'primal-story-save';
const BEST_KEY = 'primal-best-grades';
/* par time of the walking part of each chapter (seconds) */
const PAR_TIME = [115, 150, 215, 165, 185, 195, 220, 300];
const GRADES = [[95, 'S'], [90, 'A+'], [84, 'A'], [78, 'A-'], [72, 'B+'], [65, 'B'], [58, 'B-'], [50, 'C+'], [40, 'C'], [0, 'D']];
const GRADE_ORDER = GRADES.map((g) => g[1]);
const GRADE_COL = { S: '#ffd35a', A: '#7bf0b1', B: '#69c0ff', C: '#c8d6e4', D: '#ff9a8a' };
function gradeCol(r) { return GRADE_COL[(r || 'C')[0]] || '#fff'; }
/* 1 when v is at "good" or better, 0 at "bad" or worse */
function linScore(v, good, bad) { return clamp((bad - v) / (bad - good), 0, 1); }
function zeroAcc() { return { time: 0, dmg: 0, lives: 0, cont: 0, fresh: true }; }
function addAcc(a, S) { return { time: a.time + S.t, dmg: a.dmg + S.dmgTaken, lives: a.lives + (S.livesLost || 0), cont: a.cont, fresh: false }; }

/* the report card: rows [label, shown value, points, max] */
function gradeStats(st) {
  const n = Math.max(1, (st.players || []).length);
  const par = PAR_TIME[st.lvl] || 220;
  const rows = [];
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  rows.push(['TEMPO', `${fmt(st.time)}  (OBIETTIVO ${fmt(par)})`, Math.round(20 * linScore(st.time, par, par * 1.8)), 20]);
  const dpp = (st.dmg || 0) / n;
  rows.push(['DANNI SUBITI', n > 1 ? `${Math.round(dpp)} A TESTA` : String(st.dmg || 0), Math.round(25 * linScore(dpp, 40, 420)), 25]);
  const lpp = (st.lives || 0) / n;
  rows.push(['VITE PERSE', String(st.lives || 0), lpp === 0 ? 15 : lpp <= 0.5 ? 9 : lpp <= 1 ? 4 : 0, 15]);
  rows.push(['CONTINUI USATI', String(st.cont || 0), st.cont ? 0 : 10, 10]);
  const cb = Math.max(0, ...(st.players || []).map((p) => p.cb || 0));
  rows.push(['COMBO MASSIMA', `${cb} COLPI`, Math.round(10 * linScore(-cb, -25, -5)), 10]);
  const sg = (st.sigils || []).length;
  rows.push(['SIGILLI DEI TITANI', `${sg} / 3`, [0, 3, 6, 10][sg] || 0, 10]);
  if (st.duel) rows.push(['DUELLO DEI TITANI', `TITANO AL ${Math.round(st.duel.hp * 100)}%`, Math.round(10 * linScore(-st.duel.hp, -0.8, -0.15)), 10]);
  const got = rows.reduce((a, r) => a + r[2], 0), max = rows.reduce((a, r) => a + r[3], 0);
  const score = Math.round(got / max * 100);
  let rank = GRADES.find(([min]) => score >= min)[1];
  if (st.diff === 'easy' && (rank === 'S' || rank === 'A+')) rank = 'A';   // like Cuphead's "simple": no top marks
  return { rows, score, rank };
}

Object.assign(Game, {
  /* ---------- saving ---------- */
  storySave() {
    try { const s = JSON.parse(localStorage.getItem(STORY_KEY) || 'null'); return s && LEVELS[s.lvl] ? s : null; } catch (e) { return null; }
  },
  canSave() { return this.modeKind === 'campaign' && !this.online && this.diffKey() !== 'arcade'; },
  writeSave(lvl, cp) {
    if (!this.canSave()) return;
    const S = this.S && this.S.lvl === lvl && !this.S.L.bonus ? this.S : null;
    const a = this.chapAcc || zeroAcc();
    const acc = S && cp ? addAcc(a, S) : { ...a };
    acc.cont = (this.chapterCont || 0) + (S && cp ? S.contUsed : 0);
    delete acc.fresh;
    const pl = S && cp ? S.players : null;
    const data = {
      v: 1, lvl, cp, diff: this.diffKey(), at: Date.now(), credits: this.credits === Infinity ? -1 : this.credits,
      shop: this.shop ? { coins: this.shop.coins + (S && cp ? S.coins || 0 : 0), lv: { ...this.shop.lv } } : null,
      team: this.players.map((p) => { const sp = pl && pl.find((q) => q.id === p.id); return { hero: p.hero, skin: p.skin || 0, score: sp ? sp.score : p.score || 0 }; }),
      acc,
    };
    try { localStorage.setItem(STORY_KEY, JSON.stringify(data)); } catch (e) {}
    this._saveKey = `${lvl}:${cp}`;
    this.savedT = 2.2;   // small "SALVATAGGIO…" badge
  },
  clearSave() { try { localStorage.removeItem(STORY_KEY); } catch (e) {} },
  /* called every simulation step while a chapter is being played */
  autoSave() {
    const S = this.S;
    if (!S || S.L.bonus || !this.canSave() || !S.checkpoint) return;
    const k = `${S.lvl}:${S.checkpoint}`;
    if (k !== this._saveKey) this.writeSave(S.lvl, S.checkpoint);
  },
  saveLabel(s) {
    const L = LEVELS[s.lvl], z = s.cp ? L.zones[s.cp] : null;
    const d = new Date(s.at);
    const when = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `CAPITOLO ${L.n} · ${z && z.name ? z.name.toUpperCase() : 'INIZIO'} · ${(DIFFS[s.diff] || DIFF).name} · ${when}`;
  },
  /* "GIOCA": continue the saved story or start a new one */
  playMenu() {
    const s = this.storySave();
    const newGame = () => { this.resumeData = null; this.modeKind = 'campaign'; this.startLevel = 0; this.lobby(); };
    if (!s || this.diffKey() === 'arcade') { newGame(); return; }
    this.cmenu({ eyebrow: 'LA STORIA', title: 'GIOCA', back: () => this.menu(),
      note: 'IL GIOCO SALVA DA SOLO A OGNI CAPITOLO E A OGNI ZONA (NON IN ARCADE)',
      items: [
        { label: () => 'CONTINUA LA STORIA', desc: this.saveLabel(s), act: () => {
          if (DIFFS[s.diff]) { DIFF = DIFFS[s.diff]; try { localStorage.setItem('primal-diff', s.diff); } catch (e) {} }
          this.resumeData = s; this.modeKind = 'campaign'; this.startLevel = s.lvl; this.lobby();
        } },
        { label: () => 'NUOVA PARTITA', desc: 'DAL CAPITOLO 1 · IL SALVATAGGIO VERRÀ SOSTITUITO', act: newGame },
        { label: () => 'INDIETRO', act: () => this.menu() },
      ] });
  },
  /* restore a save right after the character select (players may be different from the saved ones) */
  applyResume() {
    const s = this.resumeData; this.resumeData = null;
    if (!s) return false;
    if (s.shop) { this.shop = { coins: s.shop.coins, lv: { ...this.shop.lv, ...s.shop.lv } }; UPGRADES = this.shop.lv; }
    this.credits = s.credits < 0 ? Infinity : Math.max(1, s.credits);
    this.players.forEach((p, i) => { const t = s.team[i]; if (t) p.score = t.score; });
    this.levelIdx = s.lvl;
    this.chapterStart(s.lvl, s.cp, { ...zeroAcc(), ...s.acc, fresh: true });
    this.chapterCont = s.acc.cont || 0;
    return true;
  },

  /* ---------- report card ---------- */
  bestGrades() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch (e) { return {}; } },
  saveBest(lvl, rank) {
    const b = this.bestGrades();
    if (!b[lvl] || GRADE_ORDER.indexOf(rank) < GRADE_ORDER.indexOf(b[lvl])) { b[lvl] = rank; try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) {} return true; }
    return false;
  },
});

/* the report card screen (host and online guests) */
function drawSummary(v) {
  const st = v.st || {};
  const L = LEVELS[st.lvl || 0];
  coverImage(L.bg, 1.05, 0.4, 0.5);
  g.fillStyle = 'rgba(3,6,14,.82)'; g.fillRect(0, 0, W, H);
  const t = v.t;
  ptxt(`CAPITOLO ${L.n} COMPLETATO · PAGELLA`, W / 2, 56, 14, '#ffcf7a', 'center');
  ptitle(L.title, W / 2, 100, L.title.length > 22 ? 24 : 30, '#fff6d6', '#ffb03a');
  const rows = st.rows || [];
  const y0 = 130, dy = rows.length > 6 ? 50 : 56;
  rows.forEach(([a, b, pts, max], i) => {
    const t0 = 0.3 + i * 0.28;
    if (t < t0) return;
    const y = y0 + i * dy, k = clamp((t - t0) / 0.25, 0, 1);
    panel(120, y, 640, dy - 8, '#6fd8d3', 0.85);
    ptxt(a, 144, y + 20, 10, '#c8d6e4');
    txt(b, 144, y + 38, 13, '#ffffff', 'left', 700);
    // points bar
    const bx = 520, bw = 150, bh = 12, by = y + 16;
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx, by, bw, bh);
    const f = pts / max;
    g.fillStyle = f >= 0.8 ? '#7bf0b1' : f >= 0.5 ? '#ffd35a' : f > 0 ? '#ffb03a' : '#ff6a5a';
    g.fillRect(bx, by, bw * f * k, bh);
    ptxt(`${Math.round(pts * k)}/${max}`, 740, y + 27, 10, '#ffffff', 'right');
  });
  const tEnd = 0.3 + rows.length * 0.28 + 0.3;
  // total
  if (t > tEnd - 0.2) {
    const k = clamp((t - tEnd + 0.2) / 0.6, 0, 1);
    const y = y0 + rows.length * dy;
    ptxt(`TOTALE ${Math.round((st.score || 0) * k)} / 100`, 740, y + 22, 14, '#ffd35a', 'right');
  }
  // players strip
  (st.players || []).forEach((p, i) => {
    if (t < tEnd) return;
    const x = 120 + i * 160, y = 610;
    drawPortrait(p.h, x + 30, y + 30, 0.36);
    ptxt(`${p.sc}`, x + 66, y + 18, 9, '#ffd27a');
    ptxt(`KO ${p.ko} · COMBO ${p.cb}`, x + 66, y + 38, 7, '#c8d6e4');
  });
  // the grade, stamped
  if (t > tEnd) {
    const k = clamp((t - tEnd) * 4, 0, 1);
    g.save(); g.translate(1000, 300); g.scale(2.2 - k * 1.2, 2.2 - k * 1.2); g.globalAlpha = k;
    ptxt('VOTO', 0, -120, 14, '#ffcf7a', 'center');
    ptitle(st.rank || 'C', 0, 55, (st.rank || 'C').length > 1 ? 120 : 150, '#ffffff', gradeCol(st.rank));
    g.restore();
    if (st.best && t > tEnd + 0.5) ptxt(Math.floor(t * 4) % 2 ? 'NUOVO RECORD DEL CAPITOLO!' : '', 1000, 400, 10, '#ffd35a', 'center');
    else if (st.prevBest && t > tEnd + 0.5) ptxt(`MIGLIOR VOTO: ${st.prevBest}`, 1000, 400, 9, '#9fb4c8', 'center');
    if (st.diff === 'easy' && t > tEnd + 0.5) ptxt('IN FACILE IL VOTO MASSIMO È A', 1000, 422, 8, '#9fb4c8', 'center');
  }
  const r0 = (st.rank || 'C')[0];
  if (t > tEnd + 0.3 && frameOf('mentors', 'sette_0')) {
    const pose = { S: Math.floor(t * 4) % 2 ? 'sette_7' : 'sette_5', A: 'sette_5', B: 'sette_2', C: Math.floor(t * 4) % 2 ? 'sette_3' : 'sette_0', D: Math.floor(t * 4) % 2 ? 'sette_3' : 'sette_0' }[r0] || 'sette_2';
    const say = { S: 'ASTRO: PERFETTO! NEMMENO ARMV3Z CI RIUSCIVA!', A: 'ASTRO: OTTIMO LAVORO, SENTINELS!', B: 'BORIS: SI PUÒ FARE MEGLIO.', C: 'BORIS: ALLENAMENTO. SUBITO.', D: 'BORIS: …NON DICO NIENTE. RIPROVATE.' }[r0] || '';
    const boris = /B|C|D/.test(r0);
    drawShadow(1180, 700, 30); spr('mentors', pose, 1180, 700, { scale: boris ? 1 : 0.85, face: -1, img: boris ? skinned('mentors', pose, 'boris') : undefined });
    ptxt(say, 1150, 470, 8, '#ffd35a', 'right');
  }
  (st.unlock || []).forEach((u, i) => { if (t > tEnd + 0.6 + i * 0.4) { panel(800, 500 + i * 40, 420, 32, '#ffd35a', 0.9); ptxt('SBLOCCATO! ' + u, 1010, 521 + i * 40, 9, Math.floor(t * 6) % 2 ? '#ffffff' : '#ffd35a', 'center'); } });
  if (t > tEnd + 0.4 && Math.floor(t * 2) % 2) ptxt('PREMI ATTACCO PER CONTINUARE', W / 2, H - 16, 11, '#ffffff', 'center');
}
/* summary length depends on the number of rows */
function summaryReadyT(st) { return 0.3 + ((st && st.rows) || []).length * 0.28 + 0.7; }

/* small "saving" badge in the corner of the stage */
function drawSaveBadge(dt) {
  if (!(Game.savedT > 0)) return;
  Game.savedT -= dt;
  const a = clamp(Game.savedT / 0.4, 0, 1);
  g.save(); g.globalAlpha = a;
  const x = W - 150, y = H - 44;
  panel(x, y, 136, 30, '#7bf0b1', 0.8);
  g.strokeStyle = '#7bf0b1'; g.lineWidth = 3; g.beginPath(); g.arc(x + 18, y + 15, 7, performance.now() / 150, performance.now() / 150 + 4.5); g.stroke();
  ptxt('SALVATAGGIO', x + 32, y + 20, 8, '#dfffea');
  g.restore();
}

/* II: new chapter backgrounds (PROMPT_IMMAGINI_II.md, block 2 A) replace the recoloured ones as soon as they are in assets/bg/ */
for (const L of LEVELS) if (L.bg2) {
  const i = new Image();
  i.onload = () => { IMG[L.bg2] = i; L.bg = L.bg2; L.tint = null; if (L.giant) L.giant.bg = L.bg2; };
  i.onerror = () => {};
  i.src = `assets/bg/${L.bg2}.jpg`;
}
