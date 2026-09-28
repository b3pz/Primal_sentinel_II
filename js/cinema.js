'use strict';
/* ============================================================
   CINEMATICHE — intro animata in tempo reale, dialoghi dei
   capitoli, finale. Tutto è funzione del tempo t: così l'host
   può sincronizzare i client online inviando solo t.
   ============================================================ */
const INTRO_LEN = 56;
const INTRO_SUBS = [
  [0.5, 8.5, 'PORTO AURORA · ORE 23:47', 'Una notte qualunque sul lungomare. Cinque persone che non si conoscono.'],
  [9, 13.5, '', 'Poi la terra tremò, e il cielo si aprì come un vetro rotto.'],
  [13.8, 22, '', 'Dagli specchi delle vetrine uscirono i Senzavolto, i soldati della Dimensione Oscura.'],
  [22.5, 31, 'LA DIMENSIONE OSCURA', '«Trovate i Cuori. Riportatemi i miei titani.» — Vespera, la Regina Oscura'],
  [31.5, 34.9, 'LA CAMERA DEI CUORI', '«Cuori, svegliatevi. Scegliete chi è pronto a proteggere gli altri.» — ArMV3z'],
  [35.1, 38, 'SOTTO LA CITTÀ', 'Cinque titani addormentati da mille anni aprirono gli occhi.'],
  [38.5, 45, '', 'E i Cuori scelsero: Ciusky, il pizzaiolo. Beps, lo studente. Kathy, la corriera. Kiki, l\'infermiera. Dilik, lo scaricatore del porto.'],
  [45.2, 52, '', ''],
];
const INTRO_CUES = [[0.1, 'crowd'], [9, 'stomp'], [9.4, 'siren'], [10.8, 'boom'], [11.5, 'siren'], [14, 'laser'], [15, 'laser'], [16.2, 'laser'], [17, 'crowd'], [18.5, 'crowd'], [23, 'laser'], [26.5, 'special'], [32, 'morph'], [44.5, 'confirm'], [45.3, 'morph'], [47.2, 'boom'], [49, 'team']];

/* scripted walkers for scene 1 */
const STROLL = [
  ['waiter', 180, 610, 0.35, 1], ['lady', -80, 560, 0.55, 1], ['elder', 1000, 520, -0.32, -1], ['fisher', 780, 660, -0.2, -1],
  ['kid', 60, 640, 0.9, 1], ['tourist', 1300, 590, -0.55, -1], ['girl', 420, 530, 0.45, 1], ['suit', 1180, 690, -0.62, -1],
];

function introSounds(t0, t1) {
  for (const [ct, n] of INTRO_CUES) if (ct > t0 && ct <= t1) Audio.sfx(n);
}

function coverImage(name, zoom = 1, ox = 0.5, oy = 0.5, alpha = 1) {
  const img = IMG[name]; if (!img) return;
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  g.globalAlpha = alpha;
  g.drawImage(img, (W - w) * ox, (H - h) * oy, w, h);
  g.globalAlpha = 1;
}

/* map a point of an image drawn with coverImage() to screen coordinates */
function coverPoint(name, zoom, ox, oy, px, py, wantScale) {
  const img = IMG[name];
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  if (wantScale) return [0, s];
  return [(W - w) * ox + px * s, (H - h) * oy + py * s];
}

function rift(cx, cy, open, t) {
  // animated tear in the sky
  g.save();
  g.globalCompositeOperation = 'lighter';
  const r = 30 + open * 210;
  const grd = g.createRadialGradient(cx, cy, 4, cx, cy, r * 1.6);
  grd.addColorStop(0, `rgba(230,190,255,${0.9 * open})`); grd.addColorStop(0.35, `rgba(150,60,230,${0.6 * open})`); grd.addColorStop(1, 'rgba(40,0,80,0)');
  g.fillStyle = grd; g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  g.strokeStyle = `rgba(255,240,255,${open})`; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + t * 0.2;
    g.beginPath(); g.moveTo(cx, cy);
    let x = cx, y = cy;
    for (let j = 0; j < 5; j++) { x += Math.cos(a + Math.sin(t * 3 + i + j) * 0.5) * r * 0.25; y += Math.sin(a + Math.cos(t * 2 + j) * 0.5) * r * 0.18; g.lineTo(x, y); }
    g.stroke();
  }
  g.restore();
}

function subtitle(t) {
  for (const [a, b, head, body] of INTRO_SUBS) {
    if (t < a || t > b || (!head && !body)) continue;
    const k = clamp(Math.min(t - a, b - t) * 2.5, 0, 1);
    g.globalAlpha = k;
    const n = Math.floor((t - a) * 42);
    const lines = wrapText(body.slice(0, n), W - 180, 24);
    const bh = 70 + Math.max(1, lines.length) * 32;
    g.fillStyle = 'rgba(2,6,12,.78)'; g.fillRect(0, H - 28 - bh, W, bh);
    if (head) ptxt(head, W / 2, H - bh + 2, 12, '#ffcf7a', 'center');
    lines.forEach((ln, i) => txt(ln, W / 2, H - bh + 44 + i * 32, 24, '#f2f6fa', 'center', 700));
    g.globalAlpha = 1;
  }
}

function letterbox() {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, 38); g.fillRect(0, H - 28, W, 28);
}

function walker(type, x, y, t, face, mode = 'walk', scale = 1) {
  const frame = mode === 'run' ? `${type}_run${Math.floor(t * 11) % 6}` : mode === 'walk' ? `${type}_walk${Math.floor(t * 7) % 6}` : mode === 'point' ? `${type}_point` : mode === 'cower' ? `${type}_cower` : `${type}_idle${Math.floor(t * 2) % 2}`;
  drawShadow(x, y, 24 * scale);
  spr('people', frame, x, y, { scale, face });
}

function drawIntro(t) {
  g.save();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  let shakeV = 0;
  if (t < 22) {
    // ---------------- scenes 1–3: the promenade ----------------
    const pan = 0;   // static camera: only the people move
    if (t > 9 && t < 14) shakeV = 6 * Math.sin((t - 9) * 3);
    g.translate(rand(-1, 1) * shakeV, rand(-1, 1) * shakeV);
    drawStageBackdrop('port', 260 + pan);
    const open = clamp((t - 10.4) / 2.5, 0, 1);
    if (open > 0) rift(980, 110, open, t);
    if (t > 10.8 && t < 11.3) { g.fillStyle = `rgba(220,180,255,${(11.3 - t) * 1.6})`; g.fillRect(0, 0, W, H); }
    // people
    const people = [];
    for (const [type, x0, y, v, face] of STROLL) {
      let x, mode, f = face;
      if (t < 9) { x = x0 + v * 60 * t - pan * 0.15; mode = 'walk'; }
      else if (t < 13.8) { x = x0 + v * 60 * 9 - pan * 0.15; mode = t > 10.6 ? 'point' : 'idle'; f = 1; }
      else { const k = t - 13.8; x = x0 + v * 60 * 9 - pan * 0.15 - k * 230 * (1 + (y % 3) * 0.12); mode = 'run'; f = -1; }
      people.push({ y, draw: () => walker(type, x, y, t + y, f, mode) });
    }
    // soldiers step out of the shop windows (scene 3)
    if (t > 13.8) {
      const k = t - 13.8;
      [[860, 540, 0], [1010, 600, 0.8], [1160, 520, 1.5], [940, 660, 2.3], [1210, 640, 3]].forEach(([x, y, d]) => {
        if (k < d) return;
        const kk = k - d;
        const alpha = clamp(kk * 2, 0, 1);
        const xx = x - kk * 60;
        people.push({ y, draw: () => {
          if (kk < 0.6) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - kk / 0.6; g.fillStyle = '#b77dff'; g.fillRect(xx - 45, y - 160, 90, 165); g.restore(); }
          drawShadow(xx, y, 34);
          spr('fighters', 'soldier_' + [1, 2, 3, 2][Math.floor(kk * 7) % 4], xx, y, { scale: HERO_SCALE, face: -1, alpha });
        } });
      });
    }
    people.sort((a, b) => a.y - b.y).forEach((p) => p.draw());
    // fade in/out
    if (t < 1) { g.fillStyle = `rgba(0,0,0,${1 - t})`; g.fillRect(-20, -20, W + 40, H + 40); }
    if (t > 21.2) { g.fillStyle = `rgba(0,0,0,${(t - 21.2) / 0.8})`; g.fillRect(-20, -20, W + 40, H + 40); }
  } else if (t < 31) {
    // ---------------- scene 4: Vespera beyond the veil ----------------
    const k = t - 22;
    coverImage('veil', 1.05, 0.5, 0.6);
    g.fillStyle = 'rgba(20,0,40,.45)'; g.fillRect(0, 0, W, H);
    // mirror frame
    g.save();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.globalAlpha = 0.9;
    g.beginPath(); g.ellipse(700, 390, 330, 300, 0, 0, 7); g.stroke();
    g.strokeStyle = '#6a4a1a'; g.lineWidth = 3; g.beginPath(); g.ellipse(700, 390, 318, 288, 0, 0, 7); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + Math.sin(k * 2) * 0.08; g.fillStyle = '#7a3ad0';
    g.beginPath(); g.ellipse(700, 390, 316, 286, 0, 0, 7); g.fill();
    g.restore();
    // Kharon kneels in the dark
    spr('bosses', 'kharon_0', 300, 640, { scale: 1.9, face: 1, alpha: clamp((k - 1) / 1.5, 0, 0.85) });
    // Vespera: full figure, animated, never clipped
    const vf = k < 3.8 ? 0 : k < 4.6 ? 3 : k < 6.6 ? 4 : k < 7.2 ? 3 : 0;
    const va = clamp(k / 1.2, 0, 1);
    spr('bosses', 'vespera_' + vf, 720, 660, { scale: 2.55, face: -1, alpha: va });
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4 + k * 0.7, rr = 220 + Math.sin(i + k) * 60;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * va; g.fillStyle = i % 2 ? '#c07bff' : '#7a3ad0';
      g.fillRect(700 + Math.cos(a) * rr, 390 + Math.sin(a) * rr * 0.9, 5, 5); g.restore();
    }
    if (k > 4.6 && k < 6.6) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = '#e0c0ff'; g.fillRect(0, 0, W, H); g.restore(); }
    if (k < 0.8) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.8})`; g.fillRect(0, 0, W, H); }
    if (k > 8.2) { g.fillStyle = `rgba(0,0,0,${(k - 8.2) / 0.8})`; g.fillRect(0, 0, W, H); }
  } else if (t < 38) {
    // ---------------- scene 5: the chamber of the cores ----------------
    const k = t - 31;
    const zoom = 1.04;
    coverImage('story_cores', zoom, 0.5, 0.45);
    g.fillStyle = 'rgba(0,10,20,.25)'; g.fillRect(0, 0, W, H);
    // capsule centres measured on the artwork (image pixels): glass from y 180 to 282
    const CAPS = [266, 354, 443, 531, 620];
    const P = (px, py) => coverPoint('story_cores', zoom, 0.5, 0.45, px, py);
    const [, sc] = coverPoint('story_cores', zoom, 0.5, 0.45, 0, 0, true);
    HEROES.slice(0, CORE_HEROES).forEach((h, i) => {
      const on = clamp((k - 0.8 - i * 0.55) * 2, 0, 1);
      if (!on) return;
      const [cx, cy] = P(CAPS[i], 243);
      const [, foot] = P(CAPS[i], 280);
      // the ranger appears inside the capsule as a hologram
      const f = frameOf('fighters', h.id + '_0');
      const hs = (98 * sc * 0.92) / f[3];
      g.save(); g.globalCompositeOperation = 'lighter';
      const grd = g.createRadialGradient(cx, cy, 4, cx, cy, 90 * sc / 1.6);
      grd.addColorStop(0, h.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = on * (0.55 + Math.sin(t * 8 + i) * 0.2); g.fillStyle = grd; g.fillRect(cx - 100 * sc, cy - 100 * sc, 200 * sc, 200 * sc);
      g.restore();
      spr('fighters', h.id + '_0', cx + (f[4] - f[2] / 2) * hs * 0, foot + Math.sin(t * 2 + i) * 2, { scale: hs, img: tinted('fighters', h.id + '_0', h.glow, 'source-atop', 0.45), alpha: on * (0.75 + Math.sin(t * 13 + i * 2) * 0.1) });
      // scan lines of the hologram
      g.save(); g.globalAlpha = 0.18 * on; g.fillStyle = '#000';
      for (let y = foot - f[3] * hs; y < foot; y += 3) g.fillRect(cx - f[2] * hs / 2, y, f[2] * hs, 1);
      g.restore();
    });
    // ArMV3z, the Guardian of the Hearts, lights up in his column and wakes the Hearts
    if (frameOf('mentors', 'argo_6') && k > 0.1) {
      const a = clamp((k - 0.1) / 0.5, 0, 1);
      const key = k < 0.9 ? 'argo_6' : k < 1.4 ? 'argo_2' : Math.floor(k * 7) % 2 ? 'argo_1' : 'argo_0';
      glowAt(1110, 520, 230, '#6fc8ff', 0.35 * a);
      spr('mentors', key, 1110, 715, { scale: 0.92, alpha: a });
      if (k > 0.8 && k < 1.2) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1.2 - k) * 2; g.fillStyle = '#bfe6ff'; g.fillRect(1090, 0, 40, 720); g.restore(); }
    }
    if (k > 3.6) {
      // cut to the cavern where the five titans sleep, their eyes lighting up one by one
      const a = clamp((k - 3.6) / 0.5, 0, 1);
      coverImage('cine_cavern', 1.0, 0.5, 0.5, a);
      const eyes = [[455, 270, '#ff4a3d'], [770, 372, '#5aa8ff'], [1080, 330, '#ffe066'], [870, 250, '#ff8ac8'], [1290, 290, '#ff4a3d']];
      eyes.forEach(([x, y, col], i) => { const on = clamp((k - 4.2 - i * 0.3) * 3, 0, 1); if (on) glowAt(x * 1280 / 1672, y * 720 / 941, 60, col, on * (0.6 + Math.sin(t * 6 + i) * 0.2)); });
    }
    if (false) {
      // silhouettes of the titans in the dark
      const a = clamp((k - 4.5) / 1.2, 0, 0.9);
      spr('titans', 'rex_side', 250, 700, { scale: 1.2, img: tinted('titans', 'rex_side', '#05070c', 'source-atop', 0.85), alpha: a });
      spr('titans', 'mammoth_side', 1050, 710, { scale: 1.1, face: -1, img: tinted('titans', 'mammoth_side', '#05070c', 'source-atop', 0.85), alpha: a });
    }
    if (k < 0.7) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.7})`; g.fillRect(0, 0, W, H); }
    if (k > 6.3) { g.fillStyle = `rgba(0,0,0,${(k - 6.3) / 0.7})`; g.fillRect(0, 0, W, H); }
  } else {
    // ---------------- scene 6: five ordinary people → transformation ----------------
    const k = t - 38;
    if (k > 9.2 && k < 10) shakeV = 8;
    g.translate(rand(-1, 1) * shakeV, rand(-1, 1) * shakeV);
    drawStageBackdrop('port', 1700);
    g.fillStyle = 'rgba(10,0,30,.25)'; g.fillRect(0, 0, W, H);
    rift(1100, 90, 1, t);
    // soldiers waiting on the right
    [[1040, 560], [1150, 620], [1090, 680], [1200, 540]].forEach(([x, y], i) => {
      const recoil = k > 9.2 ? Math.min(1, (k - 9.2) * 3) * 40 : 0;
      drawShadow(x + recoil, y, 34);
      spr('fighters', k > 9.2 ? 'soldier_7' : 'soldier_0', x + recoil, y, { scale: HERO_SCALE, face: -1 });
    });
    const xs = [250, 390, 530, 670, 810], ys = [600, 640, 580, 650, 610];
    const order = [0, 1, 2, 3, 4];
    const drawn = order.map((i) => ({ i, y: ys[i] })).sort((a, b) => a.y - b.y);
    for (const { i } of drawn) {
      const h = HEROES[i];
      const arrive = 0.5 + i * 0.45;
      const x = k < arrive + 1.4 ? lerp(-120, xs[i], clamp((k - arrive) / 1.4, 0, 1)) : xs[i];
      const y = ys[i];
      const morph = 7.2 + i * 0.35; // flash time of each hero
      if (k < morph) {
        let f;
        if (k < arrive + 1.4) f = `${h.id}C_dash${Math.floor(k * 11) % 6}`;
        else if (k < 5.8) f = `${h.id}C_stance`;
        else f = `${h.id}C_raise`;
        drawShadow(x, y, 26);
        spr('people', f, x, y, { scale: 1.05 });
        if (k > 4.2) { // core glowing on the chest
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 + Math.sin(t * 12) * 0.3; g.fillStyle = h.glow;
          g.beginPath(); g.arc(x + 4, y - 100, 10 + (k - 4.2) * 3, 0, 7); g.fill(); g.restore();
        }
      } else {
        const kk = k - morph;
        drawShadow(x, y, 36);
        spr('fighters', kk < 1.2 ? `${h.id}_4` : `${h.id}_0`, x, y, { scale: HERO_SCALE * 1.05, flash: Math.max(0, 1 - kk * 1.5) });
      }
      if (k > morph - 0.5 && k < morph + 0.7) {
        const kk = (k - morph + 0.5) / 1.2;
        g.save(); g.globalCompositeOperation = 'lighter';
        const w = 30 + kk * 60;
        const grd = g.createLinearGradient(x - w, 0, x + w, 0);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, h.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = Math.sin(kk * Math.PI); g.fillStyle = grd; g.fillRect(x - w, 0, w * 2, y);
        g.restore();
      }
    }
    // after the story is finished Kharon, the first pilot, joins the Sentinels
    const kh = typeof Game !== 'undefined' && Game.unlocks && Game.unlocks().story;
    if (kh && k > 8.3) {
      const kk = k - 8.3, x = 950, y = 630;
      if (kk < 0.5) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(kk / 0.5 * Math.PI); g.fillStyle = '#b77dff'; g.beginPath(); g.ellipse(x, y - 90, 70, 130, 0, 0, 7); g.fill(); g.restore(); }
      if (kk > 0.25) { drawShadow(x, y, 40); heroSpr(5, kk < 0.9 ? 10 : 0, x, y, { scale: HERO_SCALE * 1.05, face: -1 }); }
    }
    if (k > 7 && k < 7.3) { g.fillStyle = `rgba(255,255,255,${(7.3 - k) * 2})`; g.fillRect(0, 0, W, H); }
    if (k > 9.2) {
      // coloured explosion + title
      const kk = k - 9.2;
      g.save(); g.globalCompositeOperation = 'lighter';
      HEROES.slice(0, CORE_HEROES).forEach((h, i) => { g.globalAlpha = clamp(1 - kk / 2, 0, 0.6); g.fillStyle = h.color; g.beginPath(); g.arc(xs[i], 470, 80 + kk * 260, 0, 7); g.fill(); });
      g.restore();
      const a = clamp((kk - 0.4) * 2, 0, 1);
      if (a > 0) drawLogo(W / 2, 200, 0.62 + (1 - a) * 0.3, t, a);
    }
    if (k < 0.6) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.6})`; g.fillRect(-20, -20, W + 40, H + 40); }
    if (t > INTRO_LEN - 1) { g.fillStyle = `rgba(0,0,0,${t - (INTRO_LEN - 1)})`; g.fillRect(-20, -20, W + 40, H + 40); }
  }
  g.restore();
  letterbox();
  subtitle(t);
  ptxt('INVIO / PUGNO / A: SALTA', W - 20, 26, 8, '#8a9aac', 'right');
}

/* ---------------- chapter dialogue scenes ---------------- */
function drawDialog(v) {
  const L = LEVELS[v.lv];
  const line = v.lines[v.i] || ['', ''];
  let [who, text] = line; who = CIVIL_TO_HERO[who] || who;
  const k = v.t;
  // background: the chapter's stage, darkened
  const bgName = v.card ? L.bg : L.bg;
  coverImage(bgName, 1.05, 0.5, 0.5);
  g.fillStyle = 'rgba(3,6,14,.55)'; g.fillRect(0, 0, W, H);
  // chapter card
  if (v.card) {
    const a = clamp(Math.min(k * 2, (2.6 - k) * 2), 0, 1);
    g.globalAlpha = a;
    ptxt(`CAPITOLO ${L.n} / 8`, W / 2, 300, 16, '#ffcf7a', 'center');
    ptitle(L.title, W / 2, 380, L.title.length > 20 ? 30 : 40, '#fff6d6', '#ffb03a');
    ptxt(L.place, W / 2, 425, 12, '#9fb4c8', 'center');
    g.globalAlpha = 1;
    return;
  }
  // actors on stage: heroes of the players on the left, speaker on the right if villain
  const heroes = v.heroes && v.heroes.length ? v.heroes : [0];
  heroes.forEach((h, i) => { drawShadow(360 + i * 95, 560, 34); heroSpr(h, 0, 360 + i * 95, 560, { scale: 1.0, face: 1, alpha: 0.95 }); });
  const sp = SPEAKERS[who];
  const typing = text && k * 48 < text.length;
  if (sp && sp[0] === 'mentors') {
    // ArMV3z in his column of light, the robots Astro and Boris: they move their mouth / hands while talking
    const argo = who === 'ARMV3Z', boris = who === 'BORIS';
    const key = argo ? (typing && Math.floor(k * 7) % 2 ? 'argo_1' : /!/.test(text) ? 'argo_2' : 'argo_0')
      : /ahi|sparendo|non mi piace/i.test(text) ? (Math.floor(k * 5) % 2 ? 'sette_3' : 'sette_0') : /ballare|fatta/i.test(text) ? (Math.floor(k * 4) % 2 ? 'sette_7' : 'sette_5') : typing && Math.floor(k * 6) % 2 ? 'sette_2' : 'sette_0';
    if (argo) glowAt(1020, 430, 260, '#6fc8ff', 0.35 + Math.sin(k * 3) * 0.08);
    drawShadow(1020, 620, argo ? 110 : 50);
    if (boris) { spr('mentors', key, 1020, 620, { scale: 1.6, face: -1, img: skinned('mentors', key, 'boris') }); if (frameOf('mentors', 'sette_0')) spr('mentors', 'sette_0', 1150, 620, { scale: 1.1, face: -1, alpha: 0.9 }); }
    else if (who === 'ASTRO') { spr('mentors', key, 1020, 620, { scale: 1.3, face: -1 }); spr('mentors', 'sette_0', 1150, 620, { scale: 1.5, face: -1, alpha: 0.9, img: skinned('mentors', 'sette_0', 'boris') }); }
    else spr('mentors', key, 1020, 620, { scale: argo ? 1 : 1.3, face: -1 });
  } else if (sp && !HEROES.some((h) => h.name === who)) {
    const [sheet, key] = sp;
    const sc = sheet === 'people' ? 1.5 : sheet === 'bosses' ? (who === 'TRIVOR' ? 1.9 : 1.6) : sheet === 'ferreaG' ? 0.62 : 1.1;
    drawShadow(1020, 620, 60);
    spr(sheet, key, 1020, 620, { scale: sc, face: -1 });
  } else if (sp) {
    // a hero speaks: highlight them
    const idx = heroes.indexOf(HEROES.findIndex((h) => h.name === who));
    const x = idx >= 0 ? 360 + idx * 95 : 1020;
    if (idx < 0) { drawShadow(x, 620, 40); heroSpr(HEROES.findIndex((h) => h.name === who), 0, x, 620, { scale: 1.15, face: -1 }); }
    else { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = sp[2]; g.beginPath(); g.ellipse(x, 490, 60, 110, 0, 0, 7); g.fill(); g.restore(); }
  }
  // text box with the illustrated portrait of the speaker
  g.fillStyle = 'rgba(4,10,20,.9)'; g.fillRect(60, H - 190, W - 120, 150);
  const col = sp ? sp[2] : '#ffcf7a';
  g.fillStyle = col; g.fillRect(60, H - 190, W - 120, 3);
  let pk = PORTRAIT[who];
  if (who === 'KHARON' && (v.lv >= 6 || (v.lv === 5 && /libero|pilota|corazza/i.test(text)))) pk = 'pt_kharon_face';
  const tx = pk ? 300 : 90;
  if (pk) {
    const [psheet, pkey] = pk.includes(':') ? pk.split(':') : ['extra', pk];
    const f = frameOf(psheet, pkey);
    g.save(); g.beginPath(); g.rect(60, H - 262, 220, 222); g.clip();
    const grd = g.createRadialGradient(170, H - 150, 10, 170, H - 150, 150); grd.addColorStop(0, col + '66'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(60, H - 262, 220, 222);
    spr(psheet, pkey, 170, H - 40, { scale: f ? Math.min(1.1, 212 / f[3]) : 1.1, img: who === 'BORIS' ? skinned(psheet, pkey, 'boris') : undefined });
    g.restore();
    g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(60, H - 262, 220, 222);
  }
  if (who !== 'NARRATORE') { const hh = HEROES.find((h) => h.name === who); ptxt(hh && hh.civil && hh.civil.toUpperCase() !== who ? `${who} · ${hh.civil.toUpperCase()}` : who, tx, H - 154, 14, col, 'left'); }
  const shown = text.slice(0, Math.floor(k * 48));
  { const nb = Math.floor(shown.length / 3); if (drawDialog._line !== v.i) { drawDialog._line = v.i; drawDialog._blip = 0; } if (nb > (drawDialog._blip || 0) && shown.length < text.length && !/[ .,]$/.test(shown)) { drawDialog._blip = nb; Audio.voice(who, nb); } }
  const lines = wrapText(shown, W - tx - 110, 24);
  lines.forEach((ln, i) => txt(ln, tx, H - (who !== 'NARRATORE' ? 112 : 140) + i * 34, 24, who === 'NARRATORE' ? '#dfe7ef' : '#f4f6fa', 'left', who === 'NARRATORE' ? 600 : 700));
  if (shown.length >= text.length && Math.floor(k * 2.5) % 2) txt('▼', W - 90, H - 60, 18, '#ffcf7a', 'center', 900);
  txt(`${v.i + 1}/${v.lines.length}  ·  ATTACCO: AVANTI  ·  START: SALTA`, W - 80, H - 12, 13, '#9fb0c2', 'right', 600);
}

/* ---------------- ending ---------------- */
function drawEnding(t, heroes) {
  coverImage('cine_dawn', 1.0, 0.5, 0.5);
  g.fillStyle = `rgba(255,190,120,${0.1 + Math.sin(t * 0.5) * 0.04})`; g.fillRect(0, 0, W, H);
  const tx = 640;
  const hs = heroes && heroes.length ? [...new Set([...heroes, 0, 1, 2, 3, 4])] : [0, 1, 2, 3, 4];
  hs.slice(0, 6).forEach((h, i) => { drawShadow(160 + i * 110, 650, 34); heroSpr(h, 0, 160 + i * 110, 650, { scale: 1.0 }); });
  const credits = [
    ['PRIMAL SENTINELS', 'IL CUORE DEI TITANI'],
    ['IDEATO E SVILUPPATO DA', 'b3pZ'],
    ['I SENTINELS', 'CIUSKY · BEPS · KATHY · KIKI · DILIK · SIRIO'],
    ['I TITANI', 'TIRANNO · TRICERATOPO · FELINO · PTEROSAURO · MASTODONTE · DRAGO'],
    ['LA CAMERA DEI CUORI', 'ARMV3Z · ASTRO · BORIS · IRENE VALLI'],
    ['I TITANI DORMONO', 'MA SE IL VARCO SI RIAPRIRÀ, I CUORI SAPRANNO CHI CHIAMARE'],
    ['GRAZIE PER AVER GIOCATO', 'LA STORIA CONTINUA...'],
  ];
  const idx = Math.floor(t / 4.2);
  const c = credits[Math.min(idx, credits.length - 1)];
  const k = t - idx * 4.2;
  const ca = idx >= credits.length - 1 ? 1 : clamp(Math.min(k * 2, (4.2 - k) * 2), 0, 1);
  if (idx === 0) { drawLogo(tx, 220, 0.62, t, ca); }
  else {
    g.globalAlpha = ca;
    g.fillStyle = 'rgba(4,8,16,.55)'; g.fillRect(0, 150, W, 130);
    ptxt(c[0], tx, 205, 14, '#ffcf7a', 'center');
    if (c[1].length > 40) txt(c[1], tx, 250, 24, '#fff6e6', 'center', 800); else ptitle(c[1], tx, 255, c[1].length > 30 ? 18 : 28, '#fff6e6', '#ffc070');
    g.globalAlpha = 1;
  }
  if (t > 30 && Math.floor(t * 2) % 2) ptxt('PREMI ATTACCO PER TORNARE AL MENU', W / 2, H - 30, 12, '#fff', 'center');
}

/* ---------------- CONTINUA? · GAME OVER · riepilogo ---------------- */
function drawContinue(v) {
  if (Game.lastDrawn && Game.lastDrawn.m === 'stage') renderStage({ ...Game.lastDrawn, ev: [] });
  else if (Game.lastDrawn && Game.lastDrawn.m === 'giant') renderGiant({ ...Game.lastDrawn, ev: [] });
  g.fillStyle = 'rgba(4,2,8,.8)'; g.fillRect(0, 0, W, H);
  const n = Math.max(0, Math.floor(v.t));
  const k = v.t - n;
  ptitle('CONTINUA?', W / 2, 220, 48, '#ffffff', '#ffb03a');
  g.save(); g.translate(W / 2, 380); const sc = 1 + (k > 0.8 ? (k - 0.8) * 2 : 0); g.scale(sc, sc);
  ptitle(String(n), 0, 50, 130, n <= 3 ? '#ffd0c0' : '#fff6d6', n <= 3 ? '#ff4a3a' : '#ffb03a'); g.restore();
  ptxt(v.cr < 0 ? 'CREDITI INFINITI' : `CREDITI RIMASTI: ${v.cr}`, W / 2, 500, 14, v.cr === 1 ? '#ff8a7a' : '#c8d6e4', 'center');
  if (Math.floor(v.t * 3) % 2) ptxt('PREMI START O ATTACCO', W / 2, 560, 16, '#ffe08a', 'center');
  // a fallen ranger in the dark
  heroSpr((Game.players[0] || { hero: 0 }).hero, 14, W / 2, 680, { scale: 1.1, alpha: 0.9 });
}
function drawFinal(v) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const a = clamp(v.t / 1.2, 0, 1);
  g.globalAlpha = a;
  coverImage('siege', 1.1, 0.5, 0.4, 0.35);
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
  ghost('bosses', 'vespera_4', W / 2, 700, 2.6, -1, 0.35);
  ptitle('GAME OVER', W / 2, 300, 64, '#ffffff', '#ff4a3a');
  ptxt('LA DIMENSIONE OSCURA HA INGHIOTTITO PORTO AURORA', W / 2, 360, 14, '#e0c0ff', 'center');
  if (v.t > 2) ptxt('SI RICOMINCIA DAL PRINCIPIO', W / 2, 420, 12, '#c8d6e4', 'center');
  g.globalAlpha = 1;
}
/* drawSummary: see save.js (1.13 report card) */
