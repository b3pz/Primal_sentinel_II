'use strict';
/* ============================================================
   PRIMAL SENTINELS II — i minigiochi degli intervalli
   (tutti nuovi, diversi da quelli del primo gioco)
     dopo il cap. 3  IL BANCO DEGLI ARANCINI  · al volo con il vassoio   (monete)
     dopo il cap. 4  LA GONDOLA               · remate a ritmo ◀ ▶        (barra squadra)
     dopo il cap. 6  PALLEGGI AL LIDO         · non far cadere il pallone (monete)
     dopo il cap. 7  IL VOLO DELLE STELLE     · schiva le braci dell'Etna (vita in più)
   ============================================================ */
Object.assign(MINIGAMES, {
  arancini: { name: 'IL BANCO DEGLI ARANCINI', desc: 'PRENDETE AL VOLO ARANCINI E CANNOLI · QUELLI BRUCIATI NO!', how: '◀ ▶ MUOVI IL VASSOIO' },
  gondola: { name: 'LA GONDOLA', desc: 'REMATE A TEMPO: ◀ E ▶ QUANDO LA FRECCIA ARRIVA SULLA LINEA · PREMIO: BARRA SQUADRA PIENA', how: '◀ ▶ A TEMPO' },
  palleggi: { name: 'PALLEGGI AL LIDO', desc: 'NON FATE CADERE IL PALLONE · SFIDA CON RIGEL AL TRAMONTO', how: '◀ ▶ MUOVI · ATTACCO: COLPISCI IL PALLONE' },
  volo: { name: 'IL VOLO DELLE STELLE', desc: 'GUIDATE LA VOSTRA STELLA TRA LE BRACI DEL VULCANO · PREMIO: UNA VITA IN PIÙ', how: '▲ ▼ VOLA · RACCOGLI LE SCINTILLE' },
});
INTERLUDES[2].game = 'arancini';
INTERLUDES[3].game = 'gondola';
INTERLUDES[5].game = 'palleggi';
INTERLUDES[6].game = 'volo';

const ARA_Y = 600, VOLO_X = 320;
function gondolaNotes() {
  const n = [], per = 0.62;
  for (let i = 0; i < 26; i++) { n.push({ t: 1.8 + i * per, d: Math.random() < 0.5 ? 'l' : 'r' }); if (i > 8 && i % 5 === 0) n.push({ t: 1.8 + i * per + per / 2, d: Math.random() < 0.5 ? 'l' : 'r' }); }
  return n.sort((a, b) => a.t - b.t);
}

Object.assign(MG_INIT, {
  arancini: (pl) => ({ t: 0, time: 40, drop: 0.5, items: [], seq: 0, trays: pl.map((p, i) => ({ h: p.hero, x: 640 + (i - (pl.length - 1) / 2) * 180, got: 0, burnt: 0, stun: 0, fb: '', fbT: 0 })) }),
  gondola: (pl) => ({ t: 0, notes: gondolaNotes(), rows: pl.map((p) => ({ h: p.hero, j: [], fb: '', fbT: 0 })), boat: 0 }),
  palleggi: (pl) => ({
    t: 0, time: 40,
    cols: pl.map((p, i) => { const w = 1100 / pl.length, cx = 90 + w * (i + 0.5); return { h: p.hero, cx, w, x: cx, bx: cx, by: 180, vx: 0, vy: 0, wait: 1, hits: 0, best: 0, run: 0, drops: 0, swing: 0 }; }),
  }),
  volo: (pl) => ({
    t: 0, time: 40, embers: [], sparks: [], eT: 0.8, sT: 0.4, seq: 0,
    stars: pl.map((p, i) => ({ h: p.hero, y: 260 + i * 90, x: VOLO_X - i * 50, got: 0, hit: 0, stun: 0 })),
  }),
});

Object.assign(MG_TICK, {
  arancini(G, dt, ed, snd) {
    G.t += dt; G.time -= dt;
    const hard = clamp(G.t / 40, 0, 1);
    G.drop -= dt;
    if (G.drop <= 0 && G.time > 1.5) {
      G.drop = 0.62 - hard * 0.3;
      const r = Math.random();
      const k = r < 0.2 + hard * 0.12 ? 'burnt' : r < 0.36 ? 'cannolo' : 'arancino';
      G.items.push({ id: ++G.seq, k, x: 200 + Math.random() * 880, y: 150, vy: 120 + Math.random() * 60, rot: Math.random() * 6 });
    }
    for (const T of G.trays) {
      if (T.fbT > 0) T.fbT -= dt;
      if (T.stun > 0) { T.stun -= dt; continue; }
      const e = ed.find((q) => q.hero === T.h); if (!e) continue;
      T.x = clamp(T.x + ((e.c.r ? 1 : 0) - (e.c.l ? 1 : 0)) * 620 * dt, 150, 1130);
    }
    for (const it of G.items) {
      const py = it.y; it.vy += 360 * dt; it.y += it.vy * dt; it.rot += dt * 3;
      if (py < ARA_Y && it.y >= ARA_Y) {
        const T = G.trays.find((q) => q.stun <= 0 && Math.abs(q.x - it.x) < 62);
        if (T) {
          it.gone = true;
          if (it.k === 'burnt') { T.burnt++; T.stun = 0.7; T.fb = 'BRUCIATO!'; T.fbT = 0.7; snd('hurt'); }
          else { T.got += it.k === 'cannolo' ? 2 : 1; T.fb = it.k === 'cannolo' ? '+2' : '+1'; T.fbT = 0.5; snd('pickup'); }
        }
      }
    }
    G.items = G.items.filter((it) => !it.gone && it.y < H + 40);
    if (G.time <= 0) { G.time = 0; G.over = true; }
  },
  gondola(G, dt, ed, snd) {
    G.t += dt;
    const N = G.notes;
    for (const R of G.rows) {
      if (R.fbT > 0) R.fbT -= dt;
      const e = ed.find((q) => q.hero === R.h);
      if (e && (e.dir === 'l' || e.dir === 'r')) {
        // the nearest note not judged yet
        let best = -1, bd = 1e9;
        N.forEach((n, i) => { if (R.j[i] === undefined) { const d = Math.abs(G.t - n.t); if (d < bd) { bd = d; best = i; } } });
        if (best >= 0 && bd < 0.3) {
          const ok = N[best].d === e.dir;
          R.j[best] = !ok ? 0 : bd < 0.1 ? 2 : 1;
          R.fb = !ok ? 'REMO SBAGLIATO' : bd < 0.1 ? 'PERFETTO!' : 'BUONO'; R.fbT = 0.5;
          snd(!ok ? 'empty' : bd < 0.1 ? 'pickup' : 'select');
          if (ok) G.boat += bd < 0.1 ? 1 : 0.6;
        } else { R.fb = 'FUORI TEMPO'; R.fbT = 0.4; snd('empty'); }
      }
      N.forEach((n, i) => { if (R.j[i] === undefined && G.t > n.t + 0.3) R.j[i] = 0; });
    }
    if (G.t > N[N.length - 1].t + 1.2) G.over = true;
  },
  palleggi(G, dt, ed, snd) {
    G.t += dt; G.time -= dt;
    for (const C of G.cols) {
      const e = ed.find((q) => q.hero === C.h);
      if (e) C.x = clamp(C.x + ((e.c.r ? 1 : 0) - (e.c.l ? 1 : 0)) * 520 * dt, C.cx - C.w / 2 + 40, C.cx + C.w / 2 - 40);
      if (C.swing > 0) C.swing -= dt;
      if (C.wait > 0) { C.wait -= dt; if (C.wait <= 0) { C.bx = C.cx + (Math.random() - 0.5) * C.w * 0.4; C.by = 160; C.vx = 0; C.vy = 0; } continue; }
      C.vy += (560 + Math.min(C.run, 20) * 12) * dt; C.bx += C.vx * dt; C.by += C.vy * dt;
      if (C.bx < C.cx - C.w / 2 + 24 || C.bx > C.cx + C.w / 2 - 24) { C.vx *= -1; C.bx = clamp(C.bx, C.cx - C.w / 2 + 24, C.cx + C.w / 2 - 24); }
      if (e && e.c.pressed.punch && C.swing <= 0) {
        C.swing = 0.25;
        if (C.vy > -100 && C.by > 400 && C.by < 560 && Math.abs(C.bx - C.x) < 70) {
          C.vy = -640 - Math.random() * 120; C.vx = (C.bx - C.x) * 4 + (Math.random() - 0.5) * 160;
          C.hits++; C.run++; C.best = Math.max(C.best, C.run); snd('kick');
        }
      }
      if (C.by > 640) { C.drops++; C.run = 0; C.wait = 0.9; C.by = 640; snd('empty'); }
    }
    if (G.time <= 0) { G.time = 0; G.over = true; }
  },
  volo(G, dt, ed, snd) {
    G.t += dt; G.time -= dt;
    const hard = clamp(G.t / 40, 0, 1);
    G.eT -= dt; G.sT -= dt;
    if (G.eT <= 0 && G.time > 1) { G.eT = 0.55 - hard * 0.28; G.embers.push({ id: ++G.seq, x: W + 40, y: 120 + Math.random() * 500, v: 330 + hard * 220 + Math.random() * 80, r: 18 + Math.random() * 16 }); }
    if (G.sT <= 0 && G.time > 1) { G.sT = 0.45; G.sparks.push({ id: ++G.seq, x: W + 40, y: 120 + Math.random() * 500, v: 300 + hard * 150 }); }
    for (const o of G.embers) o.x -= o.v * dt;
    for (const o of G.sparks) o.x -= o.v * dt;
    for (const S of G.stars) {
      if (S.stun > 0) { S.stun -= dt; continue; }
      const e = ed.find((q) => q.hero === S.h);
      if (e) S.y = clamp(S.y + ((e.c.d ? 1 : 0) - (e.c.u ? 1 : 0)) * 420 * dt, 110, 640);
      for (const o of G.embers) if (!o.hit && Math.abs(o.x - S.x) < o.r + 16 && Math.abs(o.y - S.y) < o.r + 16) { o.hit = true; S.hit++; S.stun = 0.9; S.got = Math.max(0, S.got - 3); snd('hurt'); }
      for (const o of G.sparks) if (!o.gone && Math.abs(o.x - S.x) < 34 && Math.abs(o.y - S.y) < 34) { o.gone = true; S.got++; snd('pickup'); }
    }
    G.embers = G.embers.filter((o) => o.x > -60 && !o.hit);
    G.sparks = G.sparks.filter((o) => o.x > -60 && !o.gone);
    if (G.time <= 0) { G.time = 0; G.over = true; }
  },
});

Object.assign(MG_REWARD, {
  arancini(G) {
    const got = G.trays.reduce((a, T) => a + T.got, 0), burnt = G.trays.reduce((a, T) => a + T.burnt, 0);
    const coins = Math.min(30, got);
    return { title: got >= 25 * G.trays.length ? 'MANI D\'ORO!' : got >= 12 * G.trays.length ? 'BANCO PIENO!' : 'MEZZO BANCO...', lines: [`PRESI AL VOLO ${got} · BRUCIATI ${burnt}`, `+${coins} MONETE PER IL NEGOZIO DI BORIS`], coins };
  },
  gondola(G) {
    const tot = G.rows.reduce((a, R) => a + R.j.reduce((x, y) => x + (y || 0), 0), 0);
    const acc = tot / (2 * G.notes.length * G.rows.length), team = acc >= 0.55;
    return { title: acc >= 0.8 ? 'GONDOLIERI DOC!' : team ? 'SI VA DRITTI!' : 'LA GONDOLA GIRA IN TONDO', lines: [`RITMO DELLA SQUADRA: ${Math.round(acc * 100)}%`, team ? 'PREMIO: BARRA SQUADRA PIENA ALL\'INIZIO DEL CAPITOLO' : `PREMIO: +${Math.round(acc * 12)} MONETE (serviva il 55% per la barra piena)`], coins: team ? 0 : Math.round(acc * 12), team };
  },
  palleggi(G) {
    const hits = G.cols.reduce((a, C) => a + C.hits, 0), best = Math.max(...G.cols.map((C) => C.best));
    const coins = Math.min(30, Math.floor(hits / 2));
    return { title: best >= 20 ? 'RIGEL È IMPRESSIONATO' : best >= 10 ? 'BELLA SERIE!' : 'IL PALLONE VINCE', lines: [`PALLEGGI ${hits} · SERIE MIGLIORE ${best}`, `+${coins} MONETE PER IL NEGOZIO DI BORIS`], coins };
  },
  volo(G) {
    const got = G.stars.reduce((a, S) => a + S.got, 0) / G.stars.length;
    const life = got >= 22, team = !life && got >= 12;
    return { title: life ? 'LE STELLE VI SEGUONO' : team ? 'BUON VOLO' : 'TROPPE BRACI', lines: [`SCINTILLE (MEDIA): ${Math.round(got)}`, life ? 'PREMIO: UNA VITA IN PIÙ PER TUTTI' : team ? 'PREMIO: BARRA SQUADRA PIENA ALL\'INIZIO DEL CAPITOLO' : `PREMIO: +${Math.round(got / 3)} MONETE (ne servivano 22 per la vita in più)`], coins: life || team ? 0 : Math.round(got / 3), life, team };
  },
});

Object.assign(MG_DRAW, {
  arancini(G, T, D) {
    coverImage(D.bg, 1.15, 0.2, 0.5); g.fillStyle = 'rgba(20,8,4,.62)'; g.fillRect(0, 0, W, H);
    ptitle('IL BANCO DEGLI ARANCINI', W / 2, 56, 26, '#fff6d6', '#ff8a5a');
    ptxt(`TEMPO ${Math.ceil(G.time)}`, W - 40, 50, 16, G.time < 8 ? '#ff6a5a' : '#ffffff', 'right');
    // the fryer
    g.fillStyle = '#3a2a22'; g.fillRect(160, 90, 960, 50);
    const grd = g.createLinearGradient(0, 100, 0, 140); grd.addColorStop(0, '#ffd35a'); grd.addColorStop(1, '#a8541a');
    g.fillStyle = grd; g.fillRect(170, 100, 940, 30);
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,240,200,.5)'; g.beginPath(); g.arc(190 + ((i * 53 + T * 40) % 920), 112 + Math.sin(T * 6 + i) * 4, 3, 0, 7); g.fill(); }
    for (const it of G.items) {
      const key = it.k === 'cannolo' ? 'cannolo' : 'arancino';
      spr('items', key, it.x, it.y + 26, { scale: 1.7, rot: it.rot, img: it.k === 'burnt' ? tinted('items', 'arancino', '#1a0c06', 'source-atop', 0.82) : undefined });   // burnt ones smoke
      if (it.k === 'burnt') { g.fillStyle = 'rgba(120,110,110,.4)'; g.beginPath(); g.arc(it.x - 6, it.y - 30 - (T * 30) % 20, 8, 0, 7); g.fill(); }
    }
    for (const Tr of G.trays) {
      const c = HEROES[Tr.h].color, hid = HEROES[Tr.h].id;
      if (Tr.stun > 0 && Math.floor(T * 12) % 2) g.globalAlpha = 0.5;
      spr('people', `${hid}C_${Tr.stun > 0 ? 'point' : 'stance'}`, Tr.x, 720, { scale: 1.25 });
      g.fillStyle = '#d8d8e0'; g.fillRect(Tr.x - 62, ARA_Y + 4, 124, 8); g.fillStyle = c; g.fillRect(Tr.x - 62, ARA_Y + 12, 124, 4);
      g.globalAlpha = 1;
      ptxt(`${HEROES[Tr.h].civil.toUpperCase()} ${Tr.got}`, Tr.x, ARA_Y + 40, 10, c, 'center');
      if (Tr.fbT > 0) ptitle(Tr.fb, Tr.x, ARA_Y - 40 - (0.7 - Tr.fbT) * 40, 16, '#ffffff', Tr.fb === 'BRUCIATO!' ? '#ff4a3a' : '#7bf0b1');
    }
  },
  gondola(G, T, D) {
    coverImage(D.bg, 1.1, (G.boat * 0.004) % 1, 0.5); g.fillStyle = 'rgba(4,10,24,.55)'; g.fillRect(0, 0, W, H);
    ptitle('LA GONDOLA', W / 2, 56, 26, '#fff6d6', '#4fb8ff');
    // the gondola gliding on the canal
    const gx = 640, gy = 250 + Math.sin(T * 2) * 4;
    g.fillStyle = '#16141f'; g.strokeStyle = '#c9a032'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx - 220, gy); g.quadraticCurveTo(gx, gy + 50, gx + 220, gy - 10); g.lineTo(gx + 250, gy - 60); g.lineTo(gx + 205, gy - 8); g.quadraticCurveTo(gx, gy + 30, gx - 200, gy - 10); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c9a032'; g.fillRect(gx + 238, gy - 70, 8, 26);
    G.rows.forEach((R, i) => spr('people', `${HEROES[R.h].id}C_idle${Math.floor(T * 2 + i) % 2}`, gx - 140 + i * 70, gy + 8, { scale: 0.9 }));
    g.strokeStyle = 'rgba(200,240,255,.35)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { const x = (gx - 240 - ((T * 120 + k * 90) % 400)); g.beginPath(); g.moveTo(x, gy + 22 + k * 3); g.lineTo(x - 50, gy + 24 + k * 3); g.stroke(); }
    // the lanes of arrows
    const hitX = 260, sp = 330;
    G.rows.forEach((R, r) => {
      const y = 380 + r * 78, c = HEROES[R.h].color;
      g.fillStyle = 'rgba(4,10,20,.75)'; g.fillRect(120, y - 30, 1060, 60);
      ptxt(HEROES[R.h].civil.toUpperCase(), 110, y + 5, 10, c, 'right');
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(hitX - 26, y - 26, 52, 52);
      G.notes.forEach((n, i) => {
        const x = hitX + (n.t - G.t) * sp; if (x < 110 || x > 1190) return;
        const j = R.j[i];
        const col = j === 2 ? '#7bf0b1' : j === 1 ? '#ffd35a' : j === 0 ? '#ff6a5a' : c;
        g.globalAlpha = j === undefined ? 1 : 0.35;
        ptitle(n.d === 'l' ? '◀' : '▶', x, y + 14, 36, '#ffffff', col);
        g.globalAlpha = 1;
      });
      if (R.fbT > 0) ptxt(R.fb, hitX + 50, y - 34, 10, R.fb === 'PERFETTO!' ? '#7bf0b1' : R.fb === 'BUONO' ? '#ffd35a' : '#ff8a7a');
    });
    if (G.t < 1.6) ptitle('PRONTI A REMARE...', W / 2, 330, 22, '#ffffff', '#4fb8ff');
  },
  palleggi(G, T, D) {
    coverImage(D.bg, 1.08, 0.5, 0.5); g.fillStyle = 'rgba(20,8,10,.35)'; g.fillRect(0, 0, W, H);
    ptitle('PALLEGGI AL LIDO', W / 2, 56, 26, '#fff6d6', '#ff78bb');
    ptxt(`TEMPO ${Math.ceil(G.time)}`, W - 40, 50, 16, G.time < 8 ? '#ff6a5a' : '#ffffff', 'right');
    g.fillStyle = 'rgba(240,210,150,.55)'; g.fillRect(0, 640, W, H - 640);   // the sand
    G.cols.forEach((C, i) => {
      const c = HEROES[C.h].color, hid = HEROES[C.h].id;
      if (i) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(C.cx - C.w / 2, 120); g.lineTo(C.cx - C.w / 2, 700); g.stroke(); g.setLineDash([]); }
      spr('people', `${hid}C_${C.swing > 0 ? 'raise' : 'stance'}`, C.x, 690, { scale: 1.3 });
      // the beach ball
      if (C.wait <= 0 || C.by < 640) {
        const r = 22, rot = T * 5 + i;
        drawShadow(C.bx, 690, 20 * clamp(C.by / 640, 0.3, 1));
        const cols = ['#ff5b4f', '#ffffff', '#5d9bff', '#ffffff', '#f7d046', '#ffffff'];
        for (let k = 0; k < 6; k++) { g.fillStyle = cols[k]; g.beginPath(); g.moveTo(C.bx, C.by); g.arc(C.bx, C.by, r, rot + k * Math.PI / 3, rot + (k + 1) * Math.PI / 3); g.fill(); }
        g.strokeStyle = '#1a1020'; g.lineWidth = 2; g.beginPath(); g.arc(C.bx, C.by, r, 0, 7); g.stroke();
      }
      ptxt(`${HEROES[C.h].civil.toUpperCase()} ${C.hits}`, C.cx, 150, 11, c, 'center');
      if (C.run > 2) ptitle(`${C.run} DI FILA!`, C.cx, 190, 16, '#ffffff', c);
    });
    // Rigel watches from the side
    spr('rigel', 'rigel_0', 1200, 690, { scale: 0.8, face: -1 });
  },
  volo(G, T, D) {
    coverImage(D.bg, 1.1, (G.t * 0.02) % 1, 0.4); g.fillStyle = 'rgba(10,4,20,.55)'; g.fillRect(0, 0, W, H);
    ptitle('IL VOLO DELLE STELLE', W / 2, 56, 26, '#fff6d6', '#ffd35a');
    ptxt(`TEMPO ${Math.ceil(G.time)}`, W - 40, 50, 16, G.time < 8 ? '#ff6a5a' : '#ffffff', 'right');
    for (const o of G.sparks) { glowAt(o.x, o.y, 26, '#ffe9a0', 0.5); g.fillStyle = '#ffffff'; g.fillRect(o.x - 3, o.y - 3, 6, 6); }
    for (const o of G.embers) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,90,30,.35)'; g.beginPath(); g.arc(o.x + 10, o.y, o.r * 1.5, 0, 7); g.fill();
      g.restore();
      g.fillStyle = '#ff6a2a'; g.beginPath(); g.arc(o.x, o.y, o.r, 0, 7); g.fill();
      g.fillStyle = '#ffd35a'; g.beginPath(); g.arc(o.x - o.r * 0.25, o.y - o.r * 0.25, o.r * 0.45, 0, 7); g.fill();
    }
    G.stars.forEach((S, i) => {
      const c = HEROES[S.h].color;
      for (let k = 1; k < 6; k++) { g.globalAlpha = 0.25 - k * 0.04; g.fillStyle = c; g.beginPath(); g.arc(S.x - k * 18, S.y, 12 - k, 0, 7); g.fill(); }
      g.globalAlpha = S.stun > 0 && Math.floor(T * 12) % 2 ? 0.4 : 1;
      glowAt(S.x, S.y, 44, c, 0.45);
      g.fillStyle = c; g.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 12 : 28; g.lineTo(S.x + Math.cos(a) * rr, S.y + Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
      g.globalAlpha = 1;
      ptxt(`${HEROES[S.h].civil.toUpperCase()} ${S.got}`, 40, 110 + i * 26, 11, c);
    });
  },
});
