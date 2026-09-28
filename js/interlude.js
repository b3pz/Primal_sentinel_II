'use strict';
/* ============================================================
   1.14 — INTERVALLI IN BORGHESE
   Nei momenti chiave della storia i Sentinels si tolgono l'armatura:
   una scena tranquilla (chi sono, cosa provano, cosa rischiano) e una
   piccola attività facoltativa che dà un premio per il capitolo dopo.
     dopo il cap. 2  LA MATTINA DOPO   · il forno di Ciusky   (monete)
     dopo il cap. 4  CREPE             · l'allenamento di Boris (barra squadra)
     dopo il cap. 6  MESSAGGI A CASA   · il cabinato del bar  (monete)
     dopo il cap. 7  L'ULTIMA ORA      · il giuramento dei Cuori (vita in più)
   Tutto lo stato è JSON semplice: l'host lo invia così com'è agli
   ospiti online (vista { m: 'inter' }).
   ============================================================ */
const CIVIL_OF = { CIUSKY: 0, BEPS: 1, KATHY: 2, KIKI: 3, DILIK: 4 };
const INTERLUDES = {
  1: {
    title: 'LA MATTINA DOPO', place: 'PORTO AURORA · LA PIZZERIA SUL LUNGOMARE · 6:40',
    bg: 'port', zoom: 1.1, ox: 0.08, tint: 'rgba(255,150,90,.20)', shade: 0.3,
    cast: [['KATHY', 250], ['BEPS', 390], ['CIUSKY', 540], ['KIKI', 690], ['DILIK', 830], ['DOTT.SSA VALLI', 1040]],
    amb: [['waiter', 60, 1], ['fisher', 1220, -1]],
    lines: [
      ['NARRATORE', 'Porto Aurora, 6:40. La città dorme ancora. In una pizzeria del lungomare il forno è già acceso.'],
      ['CIUSKY', 'Colazione per tutti. Pizza fritta: l\'unica cosa che so fare meglio che prendere a pugni i mostri.'],
      ['KATHY', 'Quindi sei tu quello rosso. Ti facevo più alto.'],
      ['BEPS', 'Ieri notte eravamo cinque armature, stamattina cinque sconosciuti. Io sono Beps: ripariamo motori, io e mio padre.'],
      ['KIKI', 'Kiki. Studio canto al conservatorio. E, a quanto pare, sparo raggi rosa.'],
      ['DILIK', 'Dilik. Faccio il fabbro. Non parlo molto.'],
      ['DOTT.SSA VALLI', 'Siete così giovani... Quando trovai quei cristalli pensavo che avrebbero cambiato il mondo. Non immaginavo così.'],
      ['CIUSKY', 'Allora mangi, dottoressa. Il mondo lo cambiamo dopo colazione.'],
    ],
    game: 'forno',
    after: [
      ['ASTRO', 'Buongiorno Sentinels! Il radar del parco preistorico si è acceso. Sotto il recinto del tirannosauro qualcosa si sta svegliando!'],
      ['KATHY', 'Ecco. Lo sapevo che la colazione era troppo bella per durare.'],
    ],
  },
  3: {
    title: 'CREPE', place: 'LA CAMERA DEI CUORI, SOTTO IL FARO · NOTTE',
    bg: 'base', zoom: 1.0, ox: 0.5, tint: 'rgba(40,60,140,.18)', shade: 0.35,
    cast: [['DILIK', 230], ['KIKI', 360], ['CIUSKY', 490], ['KATHY', 610], ['BEPS', 740], ['ARMV3Z', 960], ['BORIS', 1140], ['ASTRO', 1215]],
    amb: [],
    lines: [
      ['NARRATORE', 'La Camera dei Cuori, sotto il faro. È notte fonda, ma nessuno ha voglia di dormire.'],
      ['BEPS', 'Mille anni. Città rase al suolo. E ce l\'hai detto solo perché uno specchio ti ha costretto.'],
      ['ARMV3Z', 'Ve l\'avrei detto. Aspettavo che foste pronti.'],
      ['BEPS', 'Nessuno è pronto per una cosa del genere. Nemmeno tu, mi sa.'],
      ['KIKI', 'Beps... neanche i titani hanno scelto chi erano. Come Kharon.'],
      ['DILIK', 'Io non ho bisogno di sapere tutto. Mi basta sapere da che parte stiamo stanotte.'],
      ['BORIS', 'Stanotte state dalla parte di chi si allena. In piedi. Tutti e cinque.'],
      ['ASTRO', 'Boris dice così quando è preoccupato. Lo so, lo conosco da trecento anni!'],
    ],
    game: 'seq',
    after: [
      ['ARMV3Z', 'Beps, hai ragione. Da ora in poi vi dirò quello che so, appena lo so.'],
      ['BEPS', '...Allora comincia da Kharon. Chi era, per te?'],
      ['ARMV3Z', 'Il mio migliore amico. Per stanotte, è tutto quello che riesco a dire.'],
    ],
  },
  5: {
    title: 'MESSAGGI A CASA', place: 'IL MOLO DI PORTO AURORA · TRAMONTO',
    bg: 'harbor', zoom: 1.05, ox: 0.35, tint: 'rgba(255,110,60,.24)', shade: 0.25,
    cast: [['KATHY', 260], ['DILIK', 400], ['KIKI', 540], ['CIUSKY', 680], ['BEPS', 820], ['BORIS', 1060], ['ASTRO', 1150]],
    amb: [['elder', 1240, -1], ['kid', 40, 1]],
    lines: [
      ['NARRATORE', 'Il molo, al tramonto. Tra un\'ora il varco di Kharon si aprirà sulla Dimensione Oscura.'],
      ['KATHY', 'Ho scritto a mia madre che dormo da un\'amica. Non so neanche se l\'ha letto.'],
      ['DILIK', 'Io ho lasciato le chiavi dell\'officina al vicino. Così, per sicurezza.'],
      ['KIKI', 'Non parlate così. Torniamo tutti. È una promessa, va bene?'],
      ['CIUSKY', 'Va bene. E chi torna per ultimo paga le pizze a tutti.'],
      ['BEPS', 'Il bar del porto ha ancora il cabinato di Astro Invaders. Un\'ultima partita, prima di andare?'],
      ['ASTRO', 'Un videogioco che porta il mio nome! Lo sapevo, lo sapevo di essere famoso!'],
    ],
    game: 'arcade',
    after: [
      ['BORIS', 'Il varco è aperto. Le armature sono pronte. Voi?'],
      ['CIUSKY', 'No. Ma andiamo lo stesso.'],
      ['KIKI', 'Tutti insieme. E tutti insieme si torna.'],
    ],
  },
  6: {
    title: 'L\'ULTIMA ORA', place: 'I TETTI DI PORTO AURORA · UN\'ORA PRIMA DELL\'ALBA',
    bg: 'siege', zoom: 1.05, ox: 0.5, tint: 'rgba(30,40,110,.30)', shade: 0.35,
    cast: [['KIKI', 220], ['DILIK', 350], ['KATHY', 480], ['BEPS', 610], ['CIUSKY', 740], ['SIRIO', 930], ['ARMV3Z', 1120]],
    amb: [],
    lines: [
      ['NARRATORE', 'I tetti di Porto Aurora, un\'ora prima dell\'alba. Laggiù, i cinque titani camminano verso la fortezza.'],
      ['SIRIO', 'Mille anni in quella corazza. E la prima cosa che vedo da libero è la città che volevo salvare... che brucia.'],
      ['ARMV3Z', 'L\'hai già salvata una volta, Sirio. Con loro la salverai di nuovo.'],
      ['SIRIO', 'Ragazzi, non vi conosco. Ma vi ho combattuti, e so una cosa: voi non vi arrendete mai. Perché?'],
      ['KIKI', 'Perché abbiamo qualcosa da proteggere. La mia scuola, le mie amiche, questa città.'],
      ['DILIK', 'La mia officina. E la gente che ci passa davanti ogni mattina.'],
      ['KATHY', 'Mia madre. Che ancora non sa niente di tutto questo.'],
      ['BEPS', 'Mio padre. E il diritto di fare domande.'],
      ['CIUSKY', 'Tutti quanti. Anche quelli che non sapranno mai chi siamo.'],
    ],
    game: 'oath',
    after: [
      ['SIRIO', 'Li avete sentiti? I titani hanno rallentato. Stanno ascoltando.'],
      ['ARMV3Z', 'Allora andate a parlare con loro. È l\'ultima alba di Vespera.'],
    ],
  },
};
for (const k in INTERLUDES) INTERLUDES[k].key = +k;
const MINIGAMES = {
  forno: { name: 'IL FORNO DI CIUSKY', desc: 'SFORNA OGNI PIZZA AL PUNTO GIUSTO · LE MANCE VANNO NELLA CASSA DI BORIS', how: 'ATTACCO: SFORNA' },
  seq: { name: 'L\'ALLENAMENTO DI BORIS', desc: 'RIPETETE LE SEQUENZE DI FRECCE PER SINCRONIZZARE I CUORI · PREMIO: BARRA SQUADRA PIENA', how: 'FRECCE: RIPETI LA SEQUENZA' },
  arcade: { name: 'IL CABINATO DEL BAR', desc: 'UNA PARTITA AD ASTRO INVADERS · IL PUNTEGGIO DIVENTA MONETE', how: '◀ ▶ MUOVI · ATTACCO / PISTOLA: SPARA' },
  oath: { name: 'IL GIURAMENTO DEI CUORI', desc: 'PREMETE ATTACCO A TEMPO CON IL BATTITO DEI CUORI · PREMIO: UNA VITA IN PIÙ', how: 'ATTACCO A TEMPO CON IL BATTITO' },
};
const INTER_DIRS = ['u', 'r', 'd', 'l'];
/* dedicated backgrounds (optional): drop them in assets/bg/ and they are used instead of the chapter ones */
const INTER_BG = { 1: 'intervallo_pizzeria', 3: 'intervallo_camera', 5: 'intervallo_molo', 6: 'intervallo_tetti' };
for (const k in INTER_BG) { const i = new Image(); i.onload = () => { IMG[INTER_BG[k]] = i; }; i.onerror = () => {}; i.src = `assets/bg/${INTER_BG[k]}.jpg`; }
const INTER_ARROW = { u: '▲', r: '▶', d: '▼', l: '◀' };

Object.assign(Game, {
  /* after a chapter's cinematic: an interlude if this is a key moment */
  maybeInterlude(idx, then) {
    if (this.modeKind !== 'campaign' || !INTERLUDES[idx]) { then(); return; }
    this.interlude(idx, then);
  },
  interlude(idx, then) {
    this.mode = 'inter';
    this.afterInter = then;
    this._interPrev = {};
    this.I = { id: idx, ph: 'card', t: 0, i: 0, sel: 0, game: null, res: null, heroes: this.players.map((p) => p.hero) };
    Audio.playSong(8);
    UI.hide();
  },
  interSnd(n) { this.pendingEv.push({ t: 'snd', n }); },
  /* per-player edges for directions (held states come from the controls) */
  interEdges(ctrls) {
    const out = [];
    this.players.forEach((p, slot) => {
      const c = ctrls[p.id]; if (!c || p.device === 'gone') return;
      const pr = this._interPrev[p.id] || {};
      const e = { slot, hero: p.hero, c, dir: null };
      for (const d of INTER_DIRS) if (c[d] && !pr[d]) e.dir = d;
      this._interPrev[p.id] = { u: c.u, d: c.d, l: c.l, r: c.r };
      out.push(e);
    });
    return out;
  },
  tickInter(dt, ctrls) {
    const I = this.I; if (!I) return;
    const D = INTERLUDES[I.id];
    I.t += dt;
    const ed = this.interEdges(ctrls);
    const adv = this.anyPress(ctrls, 'punch', 'jump', 'shoot');
    const skip = this.anyPress(ctrls, 'start');
    const talk = (list, next) => {
      const line = list[I.i];
      if (!line) { next(); return; }
      const full = line[1].length / 48;
      if (skip) { I.i = list.length; next(); return; }
      if (adv) { if (I.t < full) I.t = full; else { I.i++; I.t = 0; this.interSnd('select'); } }
      else if (I.t > full + 5) { I.i++; I.t = 0; }
      if (I.i >= list.length) next();
    };
    switch (I.ph) {
      case 'card': if (I.t > 3 || (I.t > 0.8 && (adv || skip))) { I.ph = 'talk'; I.t = 0; I.i = 0; } break;
      case 'talk': talk(D.lines, () => { I.ph = 'ask'; I.t = 0; I.sel = 0; }); break;
      case 'ask': {
        if (I.t < 0.4) break;
        if (ed.some((e) => e.dir)) { I.sel = 1 - I.sel; this.interSnd('select'); }
        if (this.anyPress(ctrls, 'punch', 'jump', 'start')) {
          this.interSnd('confirm');
          if (I.sel === 0) { I.ph = 'play'; I.t = 0; I.game = MG_INIT[D.game](this.players.filter((p) => p.device !== 'gone')); if (D.game === 'arcade') Audio.playSong(3); }
          else { I.ph = 'after'; I.t = 0; I.i = 0; }
        }
        break;
      }
      case 'play': {
        const G = I.game;
        MG_TICK[D.game](G, dt, ed, (n) => this.interSnd(n));
        if (G.over) { I.ph = 'res'; I.t = 0; I.res = MG_REWARD[D.game](G); this.interApply(I.res); this.interSnd('team'); Audio.playSong(8); }
        break;
      }
      case 'res': if (I.t > 1.4 && (adv || skip)) { I.ph = 'after'; I.t = 0; I.i = 0; } break;
      case 'after': talk(D.after, () => { const then = this.afterInter; this.afterInter = null; this.I = null; then && then(); }); break;
    }
  },
  interApply(r) {
    if (r.coins && this.shop) this.shop.coins += r.coins;
    if (r.team) this.interBonus = { team: true };
    if (r.life) for (const p of this.players) p.lives = Math.max(3, p.lives || 3) + 1;
  },
  interView() { const I = this.I; if (!I) return null; return { m: 'inter', ...I, t: +I.t.toFixed(2) }; },
});

/* ------------------------------------------------------------
   MINI-GAMES: init(players) · tick(G, dt, edges, snd) · reward(G)
   ------------------------------------------------------------ */
const FORNO_N = 6;
function fornoZone(n) { return { c: 0.58 + Math.random() * 0.26, pw: 0.05 - n * 0.004, gw: 0.12 - n * 0.008 }; }
const MG_INIT = {
  forno: (pl) => ({ t: 0, lanes: pl.map((p) => ({ h: p.hero, x: 0, n: 0, perf: 0, good: 0, miss: 0, fb: '', fbT: 0, wait: 0.8, z: fornoZone(0) })) }),
  seq: () => ({ t: 0, r: 0, seq: mkSeq(3), ph: 'show', pt: 0, k: 0, err: 0, fb: '', fbT: 0, lit: null }),
  arcade: (pl) => ({
    t: 0, time: 45, score: 0, wave: 0, ships: pl.map((p, i) => ({ h: p.hero, x: 280 + (i - (pl.length - 1) / 2) * 90, cd: 0, stun: 0, pts: 0 })),
    shots: [], bombs: [], foes: [], fx: 0, fdir: 1, fsp: 40, drop: 0,
  }),
  oath: (pl) => ({ t: 0, per: 0.86, n: 16, start: 1.6, marks: pl.map((p) => ({ h: p.hero, j: [] })), last: -1 }),
};
function mkSeq(n) { const s = []; for (let i = 0; i < n; i++) s.push(INTER_DIRS[Math.floor(Math.random() * 4)]); return s; }
function arcadeWave(G) {
  G.wave++; G.foes = [];
  const rows = Math.min(5, 3 + Math.floor(G.wave / 2)), cols = 8;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) G.foes.push({ x: 60 + c * 56, y: 40 + r * 40, k: r % 3, hp: 1 });
  G.fx = 0; G.fdir = 1; G.fsp = 40 + G.wave * 14;
}
const MG_TICK = {
  forno(G, dt, ed, snd) {
    G.t += dt;
    for (const L of G.lanes) {
      if (L.fbT > 0) L.fbT -= dt;
      if (L.n >= FORNO_N) continue;
      if (L.wait > 0) { L.wait -= dt; continue; }
      L.x += (0.32 + L.n * 0.06) * dt;
      const e = ed.find((q) => q.hero === L.h);
      const press = e && (e.c.pressed.punch || e.c.pressed.jump);
      const d = Math.abs(L.x - L.z.c);
      if (press || L.x >= 1) {
        if (L.x < 1 && d <= L.z.pw) { L.perf++; L.fb = 'PERFETTA!'; snd('pickup'); }
        else if (L.x < 1 && d <= L.z.gw) { L.good++; L.fb = L.x < L.z.c ? 'UN PO\' CRUDA' : 'BEN COTTA'; snd('select'); }
        else { L.miss++; L.fb = L.x >= 1 ? 'BRUCIATA!' : L.x < L.z.c ? 'CRUDA!' : 'BRUCIATA!'; snd('empty'); }
        L.fbT = 0.9; L.n++; L.x = 0; L.wait = 0.7; L.z = fornoZone(L.n);
      }
    }
    if (G.lanes.every((L) => L.n >= FORNO_N) && G.lanes.every((L) => L.fbT <= 0)) G.over = true;
  },
  seq(G, dt, ed, snd) {
    G.t += dt; G.pt += dt; if (G.fbT > 0) G.fbT -= dt;
    const step = Math.max(0.36, 0.6 - G.r * 0.04);
    if (G.ph === 'show') {
      const i = Math.floor(G.pt / step);
      G.lit = i < G.seq.length && G.pt % step < step * 0.75 ? G.seq[i] : null;
      if (G.lit && Math.floor((G.pt - dt) / step) !== i) snd('select');
      if (G.pt > G.seq.length * step + 0.3) { G.ph = 'in'; G.pt = 0; G.k = 0; G.lit = null; }
    } else if (G.ph === 'in') {
      if (G.pt > 0.25) G.lit = null;
      const e = ed.find((q) => q.dir);
      if (e) {
        G.lit = e.dir; G.pt = 0;
        if (e.dir === G.seq[G.k]) { G.k++; snd('hit'); if (G.k >= G.seq.length) { G.ph = 'ok'; G.pt = 0; G.fb = 'SINCRONIA!'; G.fbT = 0.9; snd('team'); } }
        else { G.err++; G.ph = 'ko'; G.pt = 0; G.fb = G.err >= 3 ? 'BASTA COSÌ PER STANOTTE' : 'SBAGLIATO: DI NUOVO!'; G.fbT = 1; snd('hurt'); }
      }
    } else if (G.ph === 'ok') {
      if (G.pt > 1) { G.r++; if (G.r >= 6) { G.over = true; return; } G.seq = mkSeq(3 + G.r); G.ph = 'show'; G.pt = 0; }
    } else if (G.ph === 'ko') {
      if (G.pt > 1.1) { if (G.err >= 3) { G.over = true; return; } G.ph = 'show'; G.pt = 0; }
    }
  },
  arcade(G, dt, ed, snd) {
    G.t += dt; G.time -= dt;
    if (!G.foes.length) { if (G.wave) { G.score += 100; snd('team'); } arcadeWave(G); }
    for (const s of G.ships) {
      const e = ed.find((q) => q.hero === s.h); if (!e) continue;
      s.cd -= dt; if (s.stun > 0) { s.stun -= dt; continue; }
      s.x = clamp(s.x + ((e.c.r ? 1 : 0) - (e.c.l ? 1 : 0)) * 300 * dt, 20, 540);
      if ((e.c.pressed.punch || e.c.pressed.shoot || e.c.pressed.jump || (e.c.held && (e.c.held.punch || e.c.held.shoot))) && s.cd <= 0) { G.shots.push({ x: s.x, y: 350, h: s.h }); s.cd = 0.28; snd('laser'); }
    }
    // formation
    let minX = 1e9, maxX = -1e9;
    for (const f of G.foes) { minX = Math.min(minX, f.x + G.fx); maxX = Math.max(maxX, f.x + G.fx); }
    G.fx += G.fdir * G.fsp * dt;
    if ((maxX > 540 && G.fdir > 0) || (minX < 20 && G.fdir < 0)) { G.fdir *= -1; for (const f of G.foes) f.y += 16; }
    if (Math.random() < dt * (0.8 + G.wave * 0.3) && G.foes.length) { const f = G.foes[Math.floor(Math.random() * G.foes.length)]; G.bombs.push({ x: f.x + G.fx, y: f.y + 14 }); }
    for (const b of G.shots) b.y -= 520 * dt;
    for (const b of G.bombs) b.y += 200 * dt;
    for (const b of G.shots) for (const f of G.foes) {
      if (f.hp > 0 && Math.abs(b.x - (f.x + G.fx)) < 20 && Math.abs(b.y - f.y) < 16) { f.hp = 0; b.y = -99; G.score += 10 * (3 - f.k); const s = G.ships.find((q) => q.h === b.h); if (s) s.pts += 10 * (3 - f.k); snd('hit'); }
    }
    for (const b of G.bombs) for (const s of G.ships) if (s.stun <= 0 && Math.abs(b.x - s.x) < 20 && Math.abs(b.y - 360) < 14) { s.stun = 1.2; b.y = 999; snd('hurt'); }
    G.foes = G.foes.filter((f) => f.hp > 0);
    if (G.foes.some((f) => f.y > 330)) { for (const s of G.ships) s.stun = 1; G.foes = []; G.wave = Math.max(0, G.wave - 1); snd('boom'); }
    G.shots = G.shots.filter((b) => b.y > -20); G.bombs = G.bombs.filter((b) => b.y < 420);
    if (G.time <= 0) { G.time = 0; G.over = true; }
  },
  oath(G, dt, ed, snd) {
    G.t += dt;
    const bt = (i) => G.start + i * G.per;
    const cur = Math.floor((G.t - G.start) / G.per + 0.5);
    if (cur !== G.last && cur >= 0 && cur < G.n && G.t >= bt(cur) - 0.02) { G.last = cur; snd('stomp'); }
    for (const M of G.marks) {
      const e = ed.find((q) => q.hero === M.h);
      if (e && (e.c.pressed.punch || e.c.pressed.jump)) {
        const i = clamp(Math.round((G.t - G.start) / G.per), 0, G.n - 1);
        if (M.j[i] === undefined) { const d = Math.abs(G.t - bt(i)); M.j[i] = d < 0.1 ? 2 : d < 0.22 ? 1 : 0; if (M.j[i]) snd(M.j[i] === 2 ? 'pickup' : 'select'); }
      }
      for (let i = 0; i < G.n; i++) if (M.j[i] === undefined && G.t > bt(i) + 0.3) M.j[i] = 0;
    }
    if (G.t > bt(G.n - 1) + 1.2) G.over = true;
  },
};
const MG_REWARD = {
  forno(G) {
    const perf = G.lanes.reduce((a, L) => a + L.perf, 0), good = G.lanes.reduce((a, L) => a + L.good, 0), all = G.lanes.length * FORNO_N;
    const coins = perf * 2 + good;
    return { title: perf >= all * 0.7 ? 'PIZZAIOLI NATI!' : perf + good >= all / 2 ? 'NON MALE!' : 'MEGLIO I MOSTRI...', lines: [`PERFETTE ${perf} · BUONE ${good} · DA BUTTARE ${all - perf - good}`, `MANCE: +${coins} MONETE PER IL NEGOZIO DI BORIS`], coins };
  },
  seq(G) {
    const team = G.r >= 4;
    return { title: G.r >= 6 ? 'CUORI IN PERFETTA SINCRONIA' : team ? 'BUONA SINCRONIA' : 'SERVE ANCORA ALLENAMENTO', lines: [`SEQUENZE COMPLETATE: ${G.r} / 6`, team ? 'PREMIO: BARRA SQUADRA PIENA ALL\'INIZIO DEL CAPITOLO' : `PREMIO: +${G.r * 2} MONETE (ne servivano 4 per la barra piena)`], coins: team ? G.r : G.r * 2, team };
  },
  arcade(G) {
    const coins = Math.min(30, Math.floor(G.score / 50));
    return { title: G.score >= 1200 ? 'NUOVO RECORD DEL BAR!' : 'GAME OVER... PER GIOCO', lines: [`PUNTEGGIO ${G.score} · ONDATE ${G.wave}`, `+${coins} MONETE PER IL NEGOZIO DI BORIS`], coins };
  },
  oath(G) {
    const tot = G.marks.reduce((a, M) => a + M.j.reduce((x, y) => x + (y || 0), 0), 0);
    const sync = tot / (2 * G.n * G.marks.length);
    const life = sync >= 0.6, team = !life && sync >= 0.35;
    return { title: life ? 'I TITANI VI HANNO SENTITO' : team ? 'I CUORI BATTONO INSIEME' : 'IL BATTITO È ANCORA INCERTO', lines: [`SINTONIA DELLA SQUADRA: ${Math.round(sync * 100)}%`, life ? 'PREMIO: UNA VITA IN PIÙ PER TUTTI' : team ? 'PREMIO: BARRA SQUADRA PIENA ALL\'INIZIO DEL CAPITOLO' : `PREMIO: +${Math.round(sync * 10)} MONETE`], coins: life || team ? 0 : Math.round(sync * 10), life, team, sync };
  },
};

/* ------------------------------------------------------------
   DRAWING
   ------------------------------------------------------------ */
function interWhoColor(who) {
  if (CIVIL_OF[who] !== undefined) return HEROES[CIVIL_OF[who]].color;
  const sp = SPEAKERS[who]; return sp ? sp[2] : '#ffcf7a';
}
function interVoice(who) { return CIVIL_OF[who] !== undefined ? HEROES[CIVIL_OF[who]].name : who; }
function drawInterScene(D, who, t, typing) {
  const own = IMG[INTER_BG[D.key]];
  if (own) { coverImage(INTER_BG[D.key], 1, 0.5, 0.5); g.fillStyle = 'rgba(3,6,14,.12)'; g.fillRect(0, 0, W, H); }
  else {
    coverImage(D.bg, D.zoom || 1.05, D.ox ?? 0.5, 0.5);
    g.fillStyle = D.tint || 'rgba(0,0,0,0)'; g.fillRect(0, 0, W, H);
    g.fillStyle = `rgba(3,6,14,${D.shade ?? 0.3})`; g.fillRect(0, 0, W, H);
  }
  // passers-by walking slowly across the background
  for (const [k, x0, dir] of D.amb || []) {
    const x = ((x0 + dir * t * 40) % 1400 + 1400) % 1400 - 60;
    spr('people', `${k}_walk${Math.floor(t * 7) % 6}`, x, 470, { scale: 1.25, face: dir, alpha: 0.55 });
  }
  const floor = 610;
  for (const [name, x] of D.cast) {
    const on = name === who;
    const bob = on && typing ? Math.sin(t * 16) * 2 : 0;
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.28; g.fillStyle = interWhoColor(name); g.beginPath(); g.ellipse(x, floor - 120, 70, 150, 0, 0, 7); g.fill(); g.restore(); }
    const h = CIVIL_OF[name];
    const face = x > 640 ? -1 : 1;
    if (h !== undefined) {
      const key = `${HEROES[h].id}C_` + (on && typing && Math.floor(t * 3) % 3 === 0 ? 'point' : 'idle' + (Math.floor(t * 1.6 + x) % 2));
      drawShadow(x, floor, 38); spr('people', key, x, floor + bob, { scale: 1.75, face });
    } else if (name === 'DOTT.SSA VALLI') {
      drawShadow(x, floor, 34); spr('people', on && typing && Math.floor(t * 3) % 3 === 0 ? 'scientist_point' : 'scientist_idle' + (Math.floor(t * 1.6) % 2), x, floor + bob, { scale: 1.9, face: -1 });
    } else if (name === 'SIRIO') {
      drawShadow(x, floor, 40); heroSpr(5, 0, x, floor + bob, { scale: 1.0, face: -1 });
    } else if (name === 'ARMV3Z') {
      glowAt(x, floor - 170, 200, '#6fc8ff', 0.3 + Math.sin(t * 3) * 0.08);
      drawShadow(x, floor, 80); spr('mentors', on && typing && Math.floor(t * 7) % 2 ? 'argo_1' : 'argo_0', x, floor, { scale: 0.85, face: -1 });
    } else if (name === 'ASTRO' || name === 'BORIS') {
      const key = on && typing && Math.floor(t * 6) % 2 ? 'sette_2' : 'sette_0';
      drawShadow(x, floor, 40); spr('mentors', key, x, floor, { scale: name === 'BORIS' ? 1.15 : 0.95, face: -1, img: name === 'BORIS' ? skinned('mentors', key, 'boris') : undefined });
    }
  }
}
function drawInterPortrait(who, col) {
  const h = CIVIL_OF[who];
  g.save(); g.beginPath(); g.rect(60, H - 262, 220, 222); g.clip();
  const grd = g.createRadialGradient(170, H - 150, 10, 170, H - 150, 150); grd.addColorStop(0, col + '66'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(60, H - 262, 220, 222);
  if (h !== undefined) {
    // head and shoulders of the civilian sprite, enlarged
    const f = frameOf('people', `${HEROES[h].id}C_idle0`);
    if (f && IMG.people) {
      const sh = f[3] * 0.45, s = Math.min(200 / f[2], 205 / sh) * 0.95;
      g.imageSmoothingEnabled = false;
      g.drawImage(IMG.people, f[0], f[1], f[2], sh, 170 - f[2] * s / 2, H - 250, f[2] * s, sh * s);
    }
  } else {
    const pk = PORTRAIT[who];
    if (pk) {
      const [psheet, pkey] = pk.includes(':') ? pk.split(':') : ['extra', pk];
      const f = frameOf(psheet, pkey);
      spr(psheet, pkey, 170, H - 40, { scale: f ? Math.min(1.1, 212 / f[3]) : 1.1, img: who === 'BORIS' ? skinned(psheet, pkey, 'boris') : undefined });
    }
  }
  g.restore();
  g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(60, H - 262, 220, 222);
}
function drawInterLine(line, t, idx, total) {
  const [who, text] = line;
  const col = interWhoColor(who);
  g.fillStyle = 'rgba(4,10,20,.9)'; g.fillRect(60, H - 190, W - 120, 150);
  g.fillStyle = col; g.fillRect(60, H - 190, W - 120, 3);
  const narr = who === 'NARRATORE';
  const tx = narr ? 90 : 300;
  if (!narr) { drawInterPortrait(who, col); ptxt(who, tx, H - 154, 14, col, 'left'); }
  const shown = text.slice(0, Math.floor(t * 48));
  { const nb = Math.floor(shown.length / 3); if (drawInterLine._k !== who + idx) { drawInterLine._k = who + idx; drawInterLine._b = 0; } if (nb > drawInterLine._b && shown.length < text.length && !/[ .,]$/.test(shown)) { drawInterLine._b = nb; Audio.voice(interVoice(who), nb); } }
  wrapText(shown, W - tx - 110, 24).forEach((ln, i) => txt(ln, tx, H - (narr ? 140 : 112) + i * 34, 24, narr ? '#dfe7ef' : '#f4f6fa', 'left', narr ? 600 : 700));
  if (shown.length >= text.length && Math.floor(t * 2.5) % 2) txt('▼', W - 90, H - 60, 18, '#ffcf7a', 'center', 900);
  txt(`${idx + 1}/${total}  ·  ATTACCO: AVANTI  ·  START: SALTA`, W - 80, H - 12, 13, '#9fb0c2', 'right', 600);
  return shown.length < text.length;
}
function drawInter(v) {
  const D = INTERLUDES[v.id]; if (!D) return;
  const t = v.t, T = performance.now() / 1000;
  if (v.ph === 'card') {
    drawInterScene(D, null, T, false);
    g.fillStyle = 'rgba(3,6,14,.55)'; g.fillRect(0, 0, W, H);
    const a = clamp(Math.min(t * 2, (3 - t) * 2), 0, 1);
    g.globalAlpha = a;
    ptxt('INTERVALLO', W / 2, 290, 16, '#ffcf7a', 'center');
    ptitle(D.title, W / 2, 370, 40, '#fff6d6', '#ffb03a');
    ptxt(D.place, W / 2, 418, 11, '#c8d6e4', 'center');
    g.globalAlpha = 1;
    return;
  }
  if (v.ph === 'talk' || v.ph === 'after') {
    const list = v.ph === 'talk' ? D.lines : D.after;
    const line = list[v.i] || list[list.length - 1];
    const typing = t * 48 < line[1].length;
    drawInterScene(D, line[0], T, typing);
    ptxt(`INTERVALLO · ${D.title}`, 40, 40, 10, '#ffcf7a');
    drawInterLine(line, t, v.i, list.length);
    return;
  }
  if (v.ph === 'ask') {
    drawInterScene(D, null, T, false);
    g.fillStyle = 'rgba(3,6,14,.6)'; g.fillRect(0, 0, W, H);
    const M = MINIGAMES[D.game];
    ptxt('UN MOMENTO PER VOI', W / 2, 190, 12, '#ffcf7a', 'center');
    ptitle(M.name, W / 2, 250, 32, '#fff6d6', '#ffb03a');
    ptxt(M.desc, W / 2, 292, 9, '#c8d6e4', 'center');
    const opts = ['GIOCA', 'PROSEGUI LA STORIA'];
    opts.forEach((o, i) => {
      const x = W / 2 + (i ? 190 : -190), sel = v.sel === i;
      panel(x - 170, 360, 340, 70, sel ? '#ffd35a' : '#6f8aa2', sel ? 0.95 : 0.7);
      ptitle(o, x, 404, sel ? 20 : 16, sel ? '#ffffff' : '#9fb4c8', sel ? '#ffd35a' : '#6f8aa2');
    });
    ptxt('◀ ▶ SCEGLI · ATTACCO: CONFERMA · L\'ATTIVITÀ È FACOLTATIVA', W / 2, 480, 8, '#9fb4c8', 'center');
    return;
  }
  if (v.ph === 'play' && v.game) { MG_DRAW[D.game](v.game, T, D); ptxt(MINIGAMES[D.game].how, W / 2, H - 16, 9, '#9fb4c8', 'center'); return; }
  if (v.ph === 'res' && v.res) {
    drawInterScene(D, null, T, false);
    g.fillStyle = 'rgba(3,6,14,.7)'; g.fillRect(0, 0, W, H);
    ptxt(MINIGAMES[D.game].name, W / 2, 200, 12, '#ffcf7a', 'center');
    const k = clamp(t * 3, 0, 1);
    g.save(); g.translate(W / 2, 270); g.scale(1.6 - k * 0.6, 1.6 - k * 0.6); g.globalAlpha = k; ptitle(v.res.title, 0, 0, 30, '#ffffff', '#7bf0b1'); g.restore();
    v.res.lines.forEach((l, i) => { if (t > 0.5 + i * 0.35) ptxt(l, W / 2, 340 + i * 40, 12, i ? '#ffd35a' : '#dfe7ef', 'center'); });
    if (t > 1.4 && Math.floor(t * 2) % 2) ptxt('PREMI ATTACCO PER CONTINUARE', W / 2, 520, 11, '#ffffff', 'center');
  }
}
/* the mini-games */
function drawOven(x, y, w, h, heat) {
  g.fillStyle = '#2a1a14'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * 0.45); g.quadraticCurveTo(x + w / 2, y - h * 0.25, x + w, y + h * 0.45); g.lineTo(x + w, y + h); g.fill();
  const grd = g.createRadialGradient(x + w / 2, y + h * 0.8, 4, x + w / 2, y + h * 0.8, w * 0.55);
  grd.addColorStop(0, `rgba(255,${160 - heat * 60},60,.95)`); grd.addColorStop(1, 'rgba(120,30,10,0)');
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  g.strokeStyle = '#8a5a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * 0.45); g.quadraticCurveTo(x + w / 2, y - h * 0.25, x + w, y + h * 0.45); g.lineTo(x + w, y + h); g.stroke();
}
function pizzaColor(x) {
  // raw dough → golden → burnt
  const c = x < 0.6 ? [lerp(240, 230, x / 0.6), lerp(225, 170, x / 0.6), lerp(190, 80, x / 0.6)] : [lerp(230, 60, (x - 0.6) / 0.4), lerp(170, 35, (x - 0.6) / 0.4), lerp(80, 20, (x - 0.6) / 0.4)];
  return `rgb(${c.map(Math.round).join(',')})`;
}
const MG_DRAW = {
  forno(G, T, D) {
    coverImage(D.bg, 1.2, 0.05, 0.5); g.fillStyle = 'rgba(20,8,4,.78)'; g.fillRect(0, 0, W, H);
    ptitle('IL FORNO DI CIUSKY', W / 2, 60, 26, '#fff6d6', '#ff8a5a');
    spr('people', `ignisC_${Math.floor(T * 2) % 2 ? 'stance' : 'point'}`, 110, 690, { scale: 1.9 });
    const n = G.lanes.length, rowH = Math.min(140, 520 / n);
    G.lanes.forEach((L, i) => {
      const y = 110 + i * rowH, col = HEROES[L.h].color;
      panel(220, y, 900, rowH - 14, col, 0.85);
      drawOven(250, y + 8, 120, rowH - 34, L.x);
      if (L.n < FORNO_N) {
        // the pizza inside the oven
        const px = 310, py = y + rowH * 0.62, r = Math.min(34, rowH * 0.24);
        g.fillStyle = pizzaColor(L.x); g.beginPath(); g.ellipse(px, py, r, r * 0.45, 0, 0, 7); g.fill();
        g.fillStyle = '#c2332a'; g.beginPath(); g.ellipse(px, py - 2, r * 0.72, r * 0.3, 0, 0, 7); g.fill();
        g.fillStyle = '#f4efe0'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(px - r * 0.4 + k * r * 0.27, py - 3 + (k % 2) * 4, r * 0.1, 0, 7); g.fill(); }
      }
      // cooking bar
      const bx = 400, bw = 560, by = y + rowH * 0.32, bh = 22;
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = 'rgba(255,211,90,.55)'; g.fillRect(bx + (L.z.c - L.z.gw) * bw, by, L.z.gw * 2 * bw, bh);
      g.fillStyle = 'rgba(123,240,177,.9)'; g.fillRect(bx + (L.z.c - L.z.pw) * bw, by, L.z.pw * 2 * bw, bh);
      g.fillStyle = '#ff6a5a'; g.fillRect(bx + bw - 6, by, 6, bh);
      if (L.n < FORNO_N && L.wait <= 0) { g.fillStyle = '#ffffff'; g.fillRect(bx + L.x * bw - 3, by - 8, 6, bh + 16); }
      ptxt('CRUDA', bx, by + bh + 16, 7, '#9fb4c8'); ptxt('BRUCIATA', bx + bw, by + bh + 16, 7, '#ff9a8a', 'right');
      ptxt(`${HEROES[L.h].civil.toUpperCase()} · PIZZA ${Math.min(L.n + 1, FORNO_N)}/${FORNO_N}`, 1100, y + 26, 9, col, 'right');
      ptxt(`★${L.perf}  ✓${L.good}  ✕${L.miss}`, 1100, y + 50, 10, '#ffffff', 'right');
      if (L.fbT > 0) ptitle(L.fb, 680, by - 12, 16, '#ffffff', /PERF/.test(L.fb) ? '#7bf0b1' : /BRUC|CRUDA!/.test(L.fb) ? '#ff6a5a' : '#ffd35a');
    });
  },
  seq(G, T, D) {
    coverImage(D.bg, 1.0, 0.5, 0.5); g.fillStyle = 'rgba(3,6,20,.72)'; g.fillRect(0, 0, W, H);
    ptitle('L\'ALLENAMENTO DI BORIS', W / 2, 60, 26, '#fff6d6', '#5d9bff');
    const bk = G.ph === 'show' && G.lit ? 'sette_2' : G.ph === 'ko' ? 'sette_3' : G.ph === 'ok' ? 'sette_5' : 'sette_0';
    drawShadow(1060, 640, 60); spr('mentors', bk, 1060, 640, { scale: 1.9, face: -1, img: skinned('mentors', bk, 'boris') });
    ptxt(G.ph === 'show' ? 'BORIS: GUARDATE BENE.' : G.ph === 'in' ? 'BORIS: ADESSO VOI.' : G.ph === 'ok' ? 'BORIS: ...ACCETTABILE.' : 'BORIS: CONCENTRAZIONE.', 1060, 340, 10, '#ffd35a', 'center');
    // four arrow pads in a diamond, like the Cuore's crest
    const cx = 520, cy = 390, R = 120;
    const pos = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0] };
    for (const d of INTER_DIRS) {
      const [dx, dy] = pos[d], x = cx + dx * R, y = cy + dy * R, on = G.lit === d;
      g.fillStyle = on ? (G.ph === 'show' ? '#ffd35a' : '#7bf0b1') : 'rgba(255,255,255,.1)';
      g.beginPath(); g.arc(x, y, 58, 0, 7); g.fill();
      g.strokeStyle = on ? '#ffffff' : '#5d9bff'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 58, 0, 7); g.stroke();
      txt(INTER_ARROW[d], x, y + 18, 50, on ? '#08101c' : '#cfe3ff', 'center', 900);
    }
    glowAt(cx, cy, 70, '#8cc4ff', 0.3 + Math.sin(T * 4) * 0.1);
    // progress of the sequence
    const n = G.seq.length;
    for (let i = 0; i < n; i++) { const x = cx - (n - 1) * 22 + i * 44; g.fillStyle = G.ph === 'in' && i < G.k ? '#7bf0b1' : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(x, 580, 12, 0, 7); g.fill(); }
    ptxt(`SEQUENZA ${Math.min(G.r + 1, 6)} / 6 · ${n} FRECCE`, 120, 140, 12, '#cfe3ff');
    ptxt(`ERRORI ${'✕'.repeat(G.err)}${'·'.repeat(Math.max(0, 3 - G.err))}`, 120, 170, 12, G.err ? '#ff9a8a' : '#9fb4c8');
    if (G.fbT > 0) ptitle(G.fb, cx, 250, 22, '#ffffff', G.ph === 'ok' ? '#7bf0b1' : '#ff6a5a');
  },
  arcade(G, T) {
    g.fillStyle = '#07040f'; g.fillRect(0, 0, W, H);
    // the cabinet
    const ox = 360, oy = 110, sw = 560, sh = 400;
    g.fillStyle = '#1b1030'; g.fillRect(ox - 60, 20, sw + 120, H - 20);
    g.fillStyle = '#ffcf3a'; g.fillRect(ox - 40, 30, sw + 80, 60);
    ptitle('ASTRO INVADERS', W / 2, 72, 26, '#1b1030', '#ff5b4f');
    g.fillStyle = '#000'; g.fillRect(ox, oy, sw, sh);
    g.save(); g.beginPath(); g.rect(ox, oy, sw, sh); g.clip(); g.translate(ox, oy);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect((i * 97) % sw, (i * 53 + T * 30 * (1 + i % 3)) % sh, 2, 2); }
    // the invaders: little faceless masks
    for (const f of G.foes) {
      const x = f.x + G.fx, y = f.y, c = ['#c07bff', '#ff78bb', '#5fe0ff'][f.k], fr = Math.floor(T * 3) % 2;
      g.fillStyle = c; g.fillRect(x - 16, y - 10, 32, 18); g.fillRect(x - 12, y - 14, 24, 4);
      g.fillStyle = '#000'; g.fillRect(x - 10, y - 4, 7, 5); g.fillRect(x + 3, y - 4, 7, 5);
      g.fillStyle = c; g.fillRect(x - 16 + fr * 4, y + 8, 6, 6); g.fillRect(x + 10 - fr * 4, y + 8, 6, 6);
    }
    g.fillStyle = '#fff'; for (const b of G.shots) g.fillRect(b.x - 2, b.y - 8, 4, 12);
    g.fillStyle = '#ff6a5a'; for (const b of G.bombs) g.fillRect(b.x - 3, b.y - 6, 6, 10);
    for (const s of G.ships) {
      if (s.stun > 0 && Math.floor(T * 12) % 2) continue;
      g.fillStyle = HEROES[s.h].color; g.beginPath(); g.moveTo(s.x, 344); g.lineTo(s.x + 20, 372); g.lineTo(s.x - 20, 372); g.fill();
      g.fillStyle = '#fff'; g.fillRect(s.x - 3, 350, 6, 8);
    }
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < sh; y += 4) g.fillRect(0, y, sw, 2);   // scanlines
    g.restore();
    g.strokeStyle = '#3a2a5a'; g.lineWidth = 10; g.strokeRect(ox - 5, oy - 5, sw + 10, sh + 10);
    ptxt(`PUNTI ${String(G.score).padStart(5, '0')}`, ox + 10, oy + sh + 34, 14, '#ffd35a');
    ptxt(`ONDATA ${G.wave}`, W / 2, oy + sh + 34, 12, '#cfe3ff', 'center');
    ptxt(`TEMPO ${Math.ceil(G.time)}`, ox + sw - 10, oy + sh + 34, 14, G.time < 10 ? '#ff6a5a' : '#ffffff', 'right');
    G.ships.forEach((s, i) => ptxt(`${HEROES[s.h].civil.toUpperCase()} ${s.pts}`, 40, 160 + i * 34, 11, HEROES[s.h].color));
    spr('mentors', Math.floor(T * 3) % 2 ? 'sette_7' : 'sette_5', 1110, 680, { scale: 1.2, face: -1 });
    ptxt('ASTRO: FORZA! SONO IO! CIOÈ, NO... COLPITELI!', 1200, 470, 8, '#ffd35a', 'right');
  },
  oath(G, T, D) {
    coverImage(D.bg, 1.05, 0.5, 0.5); g.fillStyle = 'rgba(3,6,24,.78)'; g.fillRect(0, 0, W, H);
    ptitle('IL GIURAMENTO DEI CUORI', W / 2, 60, 26, '#fff6d6', '#3fd06a');
    const cx = W / 2, cy = 330;
    const ph = (G.t - G.start) / G.per, near = Math.round(ph), d = ph - near;
    const pulse = G.t > G.start - 0.1 && near >= 0 && near < G.n ? Math.max(0, 1 - Math.abs(d) * 5) : 0;
    // six Cuori around the heart
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * 130, y = cy + Math.sin(a) * 130, c = HEROES[i].color;
      glowAt(x, y, 40 + pulse * 20, c, 0.35 + pulse * 0.4);
      g.fillStyle = c; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x + 14, y); g.lineTo(x, y + 20); g.lineTo(x - 14, y); g.fill();
    }
    glowAt(cx, cy, 90 + pulse * 40, '#ffffff', 0.25 + pulse * 0.5);
    // the ring closing on the beat
    for (let k = 0; k < 2; k++) {
      const i = Math.ceil(ph) + k; if (i < 0 || i >= G.n) continue;
      const left = (G.start + i * G.per - G.t) / G.per;
      if (left < 0 || left > 1.2) continue;
      g.strokeStyle = `rgba(157,255,191,${1 - left * 0.7})`; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 60 + left * 160, 0, 7); g.stroke();
    }
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 60, 0, 7); g.stroke();
    if (G.t < G.start) ptitle('PRONTI...', cx, cy + 12, 22, '#ffffff', '#3fd06a');
    // everybody's beats
    G.marks.forEach((M, r) => {
      const y = 540 + r * 36, col = HEROES[M.h].color;
      ptxt(HEROES[M.h].civil.toUpperCase(), 240, y + 6, 10, col, 'right');
      for (let i = 0; i < G.n; i++) {
        const j = M.j[i], x = 270 + i * 48;
        g.fillStyle = j === 2 ? '#7bf0b1' : j === 1 ? '#ffd35a' : j === 0 ? '#ff6a5a' : 'rgba(255,255,255,.15)';
        g.fillRect(x, y - 8, 36, 16);
      }
    });
    ptxt('VERDE: PERFETTO · GIALLO: BUONO · ROSSO: FUORI TEMPO', W / 2, 520, 8, '#9fb4c8', 'center');
  },
};
