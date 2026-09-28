'use strict';
/* ============================================================
   CORE — canvas, immagini, sprite, audio, input
   ============================================================ */
const W = 1280, H = 720;
const canvas = document.querySelector('#game');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const IMG = {};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loadImages(list) {
  return Promise.all(list.map(([name, src]) => new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => { IMG[name] = i; ok(); };
    i.onerror = () => ko(src);
    i.src = src;
  })));
}

/* ---------- sprites ---------- */
function frameOf(sheet, key) {
  const s = ATLAS[sheet];
  return s && s[key];
}

/* draw a frame so that its anchor (feet) lands on (x, y) */
function spr(sheet, key, x, y, opt = {}) {
  const f = frameOf(sheet, key);
  if (!f) return;
  const img = opt.img || (opt.tint ? tinted(sheet, key, opt.tint) : IMG[sheet]);
  if (!img) return;
  const s = opt.scale || 1, face = opt.face || 1;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  if (opt.rot) g.rotate(opt.rot);
  g.scale(face * s * (opt.sx || 1), s * (opt.sy || 1));
  if (opt.alpha !== undefined) g.globalAlpha *= opt.alpha;
  const own = !!(opt.img || opt.tint);   // tinted copies are cut to the frame
  const sx = own ? 0 : f[0], sy = own ? 0 : f[1];
  g.drawImage(img, sx, sy, f[2], f[3], -f[4], -f[5], f[2], f[3]);
  if (opt.flash) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha *= opt.flash;
    g.drawImage(flashImg(sheet, key), 0, 0, f[2], f[3], -f[4], -f[5], f[2], f[3]);
  }
  g.restore();
}

/* tinted/silhouette versions made with compositing (no getImageData → works from file://) */
const tintCache = new Map();
function tinted(sheet, key, color, mode = 'source-atop', strength = 0.62) {
  const id = sheet + key + color + mode + strength;
  let c = tintCache.get(id);
  if (c) return c;
  const f = frameOf(sheet, key);
  c = document.createElement('canvas');
  c.width = f[2]; c.height = f[3];
  const x = c.getContext('2d');
  x.drawImage(IMG[sheet], f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  x.globalCompositeOperation = mode;
  x.globalAlpha = strength;
  x.fillStyle = color;
  x.fillRect(0, 0, f[2], f[3]);
  tintCache.set(id, c);
  return c;
}
function flashImg(sheet, key) { return tinted(sheet, key, '#ffffff', 'source-atop', 1); }

/* costumi alternativi: copia ricolorata del fotogramma (filtri canvas, niente getImageData → va anche da file://) */
const skinCache = new Map();
let CANVAS_FILTER = null;
function skinned(sheet, key, skin) {
  const id = sheet + key + skin;
  let c = skinCache.get(id);
  if (c) return c;
  const f = frameOf(sheet, key), S = SKINS[skin];
  if (!f || !S) return null;
  if (CANVAS_FILTER === null) { const t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(1px)'; CANVAS_FILTER = t.filter === 'blur(1px)'; }
  if (!CANVAS_FILTER) c = tinted(sheet, key, S.tint, 'source-atop', 0.5);
  else {
    c = document.createElement('canvas'); c.width = f[2]; c.height = f[3];
    const x = c.getContext('2d');
    x.filter = S.filter;
    x.drawImage(IMG[sheet], f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  }
  skinCache.set(id, c);
  return c;
}

/* Kharon giocabile: finché non arriva la sua tavola usa le pose del boss.
   Mappa i 16 fotogrammi degli eroi sulle 6 pose del boss (0 guardia · 1-2 passo · 3 carica · 4 attacco · 5 colpito) */
const KH_MAP = [0, 1, 2, 1, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 5, 0];
const KH_MAP2 = [0, 1, 0, 1, 2, 3, 3, 5, 2, 3, 4, 3, 2, 5, 6, 0];   // same, on the 8-pose sheet
/* the titans live in 'giants'; the green dragon (1.8) in 'extra2' */
/* 8-pose boss sheets (…P_0..7) can live on several atlases (II: Rigel, the general) */
function bossPSheet(s) { for (const sh of ['bosses2', 'rigel', 'ferrea']) if (frameOf(sh, `${s}P_0`)) return sh; return null; }
function beastSheet(key) { return frameOf('giants', key) ? 'giants' : 'extra2'; }
function heroSprite(h, f) {
  const H = HEROES[h] || HEROES[0];
  if (H.sheet && frameOf('heroes2', H.id + '_0')) return ['heroes2', `${H.id}_${f}`, 1.2, 0];   // his sheet stands in a low guard: bring him to the others' height   // his own 16-pose sheet
  if (H.sheet === 'bosses' && !frameOf('fighters', H.id + '_0') && frameOf('bosses2', H.id + 'P_0')) return ['bosses2', H.id + 'P_' + (KH_MAP2[f] ?? 0), 0.93, 0];
  if (H.sheet === 'bosses' && !frameOf('fighters', H.id + '_0')) return ['bosses', H.id + '_' + (KH_MAP[f] ?? 0), 0.93, f === 14 ? -1.45 : f === 13 ? -0.9 : 0];
  return ['fighters', `${H.id}_${f}`, 1, 0];
}
/* presentation poses (1.9.2): 0 attesa · 1 presentazione (arma al cielo) · 2 scelto (indica) */
const POSE_FALLBACK = [10, 8, 8];
function poseSpr(h, i, x, y, opt = {}) {
  const key = `${(HEROES[h] || HEROES[0]).id}_p${i}`;
  if (!frameOf('poses', key)) { heroSpr(h, POSE_FALLBACK[i] ?? 0, x, y, opt); return; }
  const o = { ...opt };
  if (HEROES[h] && HEROES[h].sheet) o.scale = (opt.scale || 1) * 1.15;
  if (opt.skin) o.img = skinned('poses', key, opt.skin);
  spr('poses', key, x, y, o);
}
function heroSpr(h, f, x, y, opt = {}) {
  const [sh, key, m, r] = heroSprite(h, f);
  const o = { ...opt, scale: (opt.scale || 1) * m, rot: (opt.rot || 0) + r };
  if (opt.skin) o.img = skinned(sh, key, opt.skin);
  spr(sh, key, x, y, o);
}

/* ---------- text helpers ---------- */
const FONT = 'Exo2, "Trebuchet MS", system-ui, sans-serif';   // 1.10: readable text (dialogues, captions); pixel fonts stay for titles
const PXFONT = 'PressStart, Pixelify, monospace';
/* arcade text: dark outline + drop shadow, pixel font */
const noLig = (t) => String(t).replace(/f(?=[filt])/g, 'f\u200c');   // the pixel font has broken fi/fl ligatures
function txt(t, x, y, size = 18, color = '#eef6ff', align = 'left', weight = 800) {
  t = noLig(t);
  g.font = `${weight >= 700 ? 800 : 600} ${Math.round(size * 1.08)}px ${FONT}`;
  g.textAlign = align;
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, size / 5);
  g.strokeStyle = '#05070c';
  g.fillStyle = '#05070c';
  g.fillText(t, x + 2, y + 3);
  g.strokeText(t, x, y);
  g.fillStyle = color;
  g.fillText(t, x, y);
}
/* Press Start 2P: numbers, labels, titles */
const PS_GLYPHS = '✕○□△';
function ptxt(t, x, y, size = 12, color = '#eef6ff', align = 'left', shadow = true) {
  t = String(t);
  if (/[✕○□△]/.test(t) && typeof padGlyph === 'function') {
    // PlayStation symbols: drawn as coloured shapes between the text pieces
    g.font = `400 ${size}px ${PXFONT}`;
    const parts = t.split(/([✕○□△])/).filter((q) => q !== '');
    const gw = size * 1.25, wOf = (q) => (PS_GLYPHS.includes(q) ? gw : g.measureText(q).width);
    const total = parts.reduce((a, q) => a + wOf(q), 0);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    for (const q of parts) {
      const i = PS_GLYPHS.indexOf(q);
      if (i >= 0) {
        if (shadow) padGlyph(i, cx + gw / 2 + 2, y - size * 0.4 + 2, size * 0.42, '#05070c');
        padGlyph(i, cx + gw / 2, y - size * 0.4, size * 0.42, PS_COL[i]);
      } else ptxt(q, cx, y, size, color, 'left', shadow);
      cx += wOf(q);
    }
    return;
  }
  g.font = `400 ${size}px ${PXFONT}`;
  g.textAlign = align;
  g.lineJoin = 'miter';
  if (shadow) {
    g.fillStyle = '#05070c';
    g.fillText(t, x + Math.max(2, size / 6), y + Math.max(2, size / 6));
    g.lineWidth = Math.max(2, size / 4);
    g.strokeStyle = '#05070c';
    g.strokeText(t, x, y);
  }
  g.fillStyle = color;
  g.fillText(t, x, y);
}
/* vertical-gradient Press Start title (metallic) */
function ptitle(t, x, y, size, c1 = '#fff6d6', c2 = '#ffb03a', align = 'center') {
  g.font = `400 ${size}px ${PXFONT}`;
  g.textAlign = align;
  g.lineJoin = 'miter';
  g.fillStyle = '#05070c';
  g.fillText(t, x + size / 7, y + size / 7);
  g.lineWidth = size / 3.2; g.strokeStyle = '#05070c'; g.strokeText(t, x, y);
  const grd = g.createLinearGradient(0, y - size, 0, y);
  grd.addColorStop(0, c1); grd.addColorStop(0.55, c1); grd.addColorStop(0.56, c2); grd.addColorStop(1, c2);
  g.fillStyle = grd; g.fillText(t, x, y);
}
function wrapText(t, maxW, size) {
  g.font = `800 ${Math.round(size * 1.08)}px ${FONT}`;
  const words = noLig(t).split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* the logo with a moving shine and pulsing Hearts */
const logoFx = { c: null, x: null };
function drawLogo(cx, cy, scale, t, alpha = 1) {
  const img = IMG.logo;
  if (!img) return;
  if (!logoFx.c) { logoFx.c = document.createElement('canvas'); logoFx.c.width = img.width; logoFx.c.height = img.height; logoFx.x = logoFx.c.getContext('2d'); }
  const x = logoFx.x;
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, img.width, img.height);
  x.drawImage(img, 0, 0);
  // shine sweep every 4 seconds
  const k = (t % 4) / 1.1;
  if (k < 1) {
    x.globalCompositeOperation = 'source-atop';
    const sx = -300 + k * (img.width + 600);
    const grd = x.createLinearGradient(sx - 90, 0, sx + 90, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.5, 'rgba(255,255,255,.75)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    x.save(); x.transform(1, 0, -0.45, 1, 0, 0); x.fillStyle = grd; x.fillRect(sx - 120 + img.height * 0.45 * 0, 0, 240 + img.height, img.height); x.restore();
  }
  const w = img.width * scale, h = img.height * scale;
  g.save();
  g.globalAlpha *= alpha;
  g.drawImage(logoFx.c, cx - w / 2, cy - h / 2, w, h);
  // Hearts pulse one after another
  g.globalCompositeOperation = 'lighter';
  for (const [i, c] of LOGO.cores.entries()) {
    const p = 0.5 + 0.5 * Math.sin(t * 3 - i * 0.9);
    const gx = cx - w / 2 + c[0] * scale, gy = cy - h / 2 + c[1] * scale, r = c[2] * scale * (1.6 + p * 0.9);
    const grd = g.createRadialGradient(gx, gy, 1, gx, gy, r);
    grd.addColorStop(0, c[3]); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha * (0.35 + p * 0.45);
    g.fillStyle = grd; g.fillRect(gx - r, gy - r, r * 2, r * 2);
  }
  g.restore();
}

function bar(x, y, w, h, v, color, back = '#0d1a26') {
  g.fillStyle = '#02060c';
  g.fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle = back;
  g.fillRect(x, y, w, h);
  g.fillStyle = color;
  g.fillRect(x, y, w * clamp(v, 0, 1), h);
  g.fillStyle = 'rgba(255,255,255,.28)';
  g.fillRect(x, y, w * clamp(v, 0, 1), Math.max(1, h / 4));
}
/* arcade life bar: segments + delayed "damage" trail */
function segBar(x, y, w, h, v, trail, color, seg = 12) {
  g.fillStyle = '#02060c'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = '#16222e'; g.fillRect(x, y, w, h);
  if (trail > v) { g.fillStyle = '#ff3a2e'; g.fillRect(x + w * clamp(v, 0, 1), y, w * (clamp(trail, 0, 1) - clamp(v, 0, 1)), h); }
  const grd = g.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.25, color); grd.addColorStop(1, color);
  g.fillStyle = grd; g.fillRect(x, y, w * clamp(v, 0, 1), h);
  g.fillStyle = 'rgba(0,0,0,.45)';
  for (let i = 1; i < seg; i++) g.fillRect(x + Math.round(w * i / seg) - 1, y, 2, h);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
/* bevelled metal panel */
function panel(x, y, w, h, accent = '#6fd8d3', alpha = 0.86) {
  g.save();
  g.globalAlpha *= alpha;
  const grd = g.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, '#1b2a3c'); grd.addColorStop(1, '#070d16');
  g.fillStyle = '#02050a'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x, y, w, 2);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, y + h - 2, w, 2);
  g.fillStyle = accent; g.fillRect(x, y, 6, h); g.fillRect(x, y, w, 3);
  // corner rivets
  g.fillStyle = '#8fa3b8';
  for (const [rx, ry] of [[x + w - 7, y + 7], [x + w - 7, y + h - 7]]) g.fillRect(rx - 2, ry - 2, 4, 4);
  g.restore();
}

/* ---------- background tiling with mirrored repeats ---------- */
function drawBackdrop(name, offset, opt = {}) {
  const img = IMG[name];
  if (!img) return;
  const s = H / img.height, tw = img.width * s;
  let start = Math.floor(offset / tw);
  for (let i = start; i * tw - offset < W; i++) {
    const x = i * tw - offset;
    g.save();
    if (i % 2 && !opt.noMirror) {
      g.translate(x + tw, 0); g.scale(-1, 1);
      g.drawImage(img, 0, 0, tw, H);
    } else g.drawImage(img, x, 0, tw, H);
    g.restore();
  }
}

/* ============================================================
   AUDIO — effetti sintetizzati + piccolo sequencer musicale
   ============================================================ */
const Audio = {
  ctx: null, master: null, muted: false, music: null, step: 0, next: 0, song: 0, musicOn: false,
  musicVol: 0.8, sfxVol: 0.9, out: null, track: null, trackName: '', fileOK: {},
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
        this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
        this.out = this.sfxBus;
        this.setVolumes(this.musicVol, this.sfxVol);
      } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.track && this.track.paused && this.musicOn && !this.muted) this.track.play().catch(() => {});
  },
  /* volume separato per musica ed effetti (0..1), salvato nel browser */
  setVolumes(m, s) {
    this.musicVol = clamp(m, 0, 1); this.sfxVol = clamp(s, 0, 1);
    if (this.musicBus) this.musicBus.gain.value = this.musicVol;
    if (this.sfxBus) this.sfxBus.gain.value = this.sfxVol;
    if (this.track) this.track.volume = this.musicVol * 0.8;
    try { localStorage.setItem('primal-vol', JSON.stringify([this.musicVol, this.sfxVol])); } catch (e) {}
  },
  loadVolumes() { try { const v = JSON.parse(localStorage.getItem('primal-vol') || 'null'); if (v) { this.musicVol = v[0]; this.sfxVol = v[1]; } } catch (e) {} },
  setMuted(m) { this.muted = m; if (this.track) { if (m) this.track.pause(); else if (this.musicOn) this.track.play().catch(() => {}); } },
  tone(f = 160, d = 0.08, type = 'square', vol = 0.035, slide = 0.45, when = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), a = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(25, f * slide), t + d);
    a.gain.setValueAtTime(vol, t);
    a.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(a); a.connect(this.out || this.master);
    o.start(t); o.stop(t + d + 0.02);
  },
  noise(d = 0.15, vol = 0.05, hp = 800, when = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * d);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const a = this.ctx.createGain(); a.gain.value = vol;
    s.connect(f); f.connect(a); a.connect(this.out || this.master);
    s.start(t);
  },
  /* 1.12: synthetic "voices" — a talking blip in each character's register (like old console RPGs) */
  voice(who, i = 0) {
    const V = VOICES[who]; if (!V || this.muted || !this.ctx) return;
    const [base, type, vol, jit] = V;
    const f = base * (1 + jit * Math.sin(i * 2.7 + who.length));
    this.tone(f, 0.055, type, vol, 0.92);
    if (who === 'BORIS' || who === 'TRIVOR') this.tone(f * 0.5, 0.06, 'square', vol * 0.6, 0.9);
  },
  shout(hero) {
    // a Sentinel's battle cry on the special: breath + rising vowel
    if (this.muted || !this.ctx) return;
    const b = [300, 250, 380, 420, 190, 230][hero] || 300;
    this.noise(0.12, 0.05, 1400); this.tone(b, 0.1, 'sawtooth', 0.04, 1.25); this.tone(b * 1.25, 0.18, 'square', 0.03, 0.7, 0.08);
  },
  sfx(name) {
    switch (name) {
      case 'shout0': case 'shout1': case 'shout2': case 'shout3': case 'shout4': case 'shout5': this.shout(+name.slice(5)); break;
      case 'roar': this.tone(90, 0.7, 'sawtooth', 0.07, 0.5); this.tone(60, 0.8, 'square', 0.05, 0.6, 0.05); this.noise(0.6, 0.08, 150); break;
      case 'punch': this.tone(230, 0.06, 'square', 0.03); this.noise(0.05, 0.03, 1800); break;
      case 'kick': this.tone(160, 0.09, 'square', 0.035); this.noise(0.07, 0.03, 1200); break;
      case 'hit': this.tone(95, 0.11, 'sawtooth', 0.05, 0.4); this.noise(0.08, 0.06, 600); break;
      case 'heavy': this.tone(70, 0.22, 'sawtooth', 0.06, 0.3); this.noise(0.2, 0.08, 200); break;
      case 'jump': this.tone(300, 0.12, 'triangle', 0.035, 1.8); break;
      case 'dodge': this.tone(500, 0.08, 'triangle', 0.025, 0.5); break;
      case 'pickup': this.tone(660, 0.08, 'sine', 0.05, 1.5); this.tone(990, 0.12, 'sine', 0.04, 1.2, 0.07); break;
      case 'weapon': this.tone(400, 0.05, 'square', 0.03, 1); this.tone(800, 0.1, 'square', 0.03, 1, 0.05); break;
      case 'break': this.noise(0.18, 0.08, 400); this.tone(120, 0.12, 'square', 0.03, 0.5); break;
      case 'boom': this.noise(0.6, 0.14, 60); this.tone(60, 0.5, 'sawtooth', 0.07, 0.3); break;
      case 'special': this.tone(330, 0.4, 'sawtooth', 0.05, 2.2); this.tone(495, 0.4, 'square', 0.03, 2.2, 0.05); break;
      case 'team': [262, 330, 392, 523, 659].forEach((f, i) => this.tone(f, 0.35, 'square', 0.04, 1, i * 0.09)); break;
      case 'wind': this.tone(140, 0.2, 'triangle', 0.04, 1.6); break;
      case 'bosswind': this.tone(90, 0.35, 'sawtooth', 0.05, 1.8); break;
      case 'hurt': this.tone(160, 0.2, 'sawtooth', 0.05, 0.4); break;
      case 'ko': this.tone(200, 0.6, 'square', 0.05, 0.2); break;
      case 'siren': this.tone(620, 0.5, 'triangle', 0.03, 1.4); this.tone(870, 0.5, 'triangle', 0.03, 0.7, 0.5); break;
      case 'morph': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.045, 1, i * 0.07)); this.noise(0.8, 0.05, 2500, 0.3); break;
      case 'select': this.tone(520, 0.05, 'square', 0.03, 1); break;
      case 'confirm': this.tone(520, 0.06, 'square', 0.03, 1); this.tone(780, 0.1, 'square', 0.03, 1, 0.06); break;
      case 'crowd': for (let i = 0; i < 4; i++) this.tone(rand(300, 700), 0.25, 'triangle', 0.012, rand(0.7, 1.3), i * 0.06); break;
      case 'stomp': this.noise(0.3, 0.12, 40); this.tone(45, 0.35, 'sine', 0.12, 0.6); break;
      case 'laser': this.tone(900, 0.3, 'sawtooth', 0.04, 0.2); break;
      case 'shot': this.tone(1300, 0.09, 'square', 0.03, 0.35); this.noise(0.05, 0.03, 3000); break;
      case 'empty': this.tone(180, 0.05, 'square', 0.02, 1); this.tone(140, 0.05, 'square', 0.02, 1, 0.06); break;
      case 'reload': this.tone(500, 0.04, 'square', 0.03, 1); this.tone(760, 0.06, 'square', 0.03, 1, 0.06); break;
    }
  },
  /* songs: [bass line, lead line] in semitones from A1; null = rest */
  SONGS: [
    { bpm: 138, bass: [0, 0, 12, 0, 3, 3, 15, 3, 5, 5, 17, 5, 3, 3, 15, 2], lead: [12, null, 15, null, 17, 15, null, 12, 10, null, 12, null, 15, null, null, null] },
    { bpm: 150, bass: [0, 12, 0, 12, 0, 12, 3, 15, 5, 17, 5, 17, 3, 15, 2, 14], lead: [24, null, 22, 24, null, 27, null, 24, 22, null, 19, null, 22, null, 24, null] },
    { bpm: 128, bass: [0, 0, 7, 0, 10, 10, 7, 5, 0, 0, 7, 0, 12, 10, 7, 3], lead: [12, null, null, 15, null, null, 19, null, 17, null, 15, null, 12, null, null, null] },
    { bpm: 118, bass: [0, null, 1, null, 0, null, 6, null, 0, null, 1, null, 7, 6, 1, null], lead: [18, null, 17, null, 13, null, 12, null, 18, null, 19, null, 18, 17, 13, null] },
    { bpm: 156, bass: [0, 0, 12, 0, 0, 12, 10, 12, 5, 5, 17, 5, 7, 7, 19, 7], lead: [24, 24, null, 22, 24, null, 27, 29, 29, null, 27, null, 24, null, 22, null] },
    { bpm: 110, bass: [0, null, null, 0, 3, null, null, 3, 1, null, null, 1, 0, null, 11, null], lead: [null, 12, null, null, 15, null, 14, null, null, 13, null, null, 12, null, null, null] },
    { bpm: 144, bass: [0, 12, 1, 13, 0, 12, 6, 18, 0, 12, 1, 13, 7, 19, 6, 18], lead: [24, null, 25, null, 24, null, 30, null, 31, null, 30, null, 25, null, 24, null] },
    { bpm: 162, bass: [0, 0, 12, 0, 5, 5, 17, 5, 7, 7, 19, 7, 10, 10, 22, 12], lead: [24, 27, 29, 31, 29, 27, 24, null, 31, 34, 36, 34, 31, 29, 27, null] },
    { bpm: 96, bass: [0, null, 7, null, 5, null, 3, null, 0, null, 7, null, 8, null, 7, null], lead: [12, null, null, null, 15, null, 14, null, 12, null, null, null, 19, null, 17, null] },
  ],
  /* brani MP3 facoltativi in assets/music (sigla, capitolo1..8, boss, titani, finale):
     se il file c'è si sente quello, altrimenti la musica sintetizzata */
  FILES: ['capitolo1', 'capitolo2', 'capitolo3', 'capitolo4', 'capitolo5', 'capitolo6', 'capitolo7', 'capitolo8', 'sigla'],
  playSong(i, name) {
    name = name || this.FILES[i] || '';
    if (this.musicOn && this.song === i && this.trackName === name) return;
    this.song = i; this.musicOn = true; this.step = 0; this.next = 0;
    this.playFile(name);
  },
  playFile(name) {
    if (this.track) { this.track.pause(); this.track = null; }
    this.trackName = name;
    if (!name || this.fileOK[name] === false) return;
    try {
      const a = document.createElement('audio');
      a.src = `assets/music/${name}.mp3`; a.loop = true; a.volume = this.musicVol * 0.8; a.preload = 'auto';
      a.onerror = () => { this.fileOK[name] = false; if (this.track === a) this.track = null; };
      a.onplaying = () => { this.fileOK[name] = true; };
      this.track = a;
      if (!this.muted) a.play().catch(() => {});
    } catch (e) { this.fileOK[name] = false; this.track = null; }
  },
  stopSong() { this.musicOn = false; if (this.track) { this.track.pause(); this.track = null; } this.trackName = ''; },
  update() {
    if (!this.ctx || !this.musicOn || this.muted) return;
    if (this.track && this.fileOK[this.trackName] !== false) return;   // MP3 in riproduzione (o in caricamento)
    this.out = this.musicBus;
    const s = this.SONGS[this.song % this.SONGS.length];
    const stepDur = 60 / s.bpm / 2;
    const now = this.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05;
    while (this.next < now + 0.12) {
      const i = this.step % 16, when = this.next - now;
      const b = s.bass[i];
      const hz = (n) => 55 * Math.pow(2, n / 12);
      if (b !== null && b !== undefined) this.tone(hz(b), stepDur * 0.9, 'triangle', 0.05, 1, when);
      const l = s.lead[i];
      if (l !== null && l !== undefined && (this.step >> 4) % 2 === 1) this.tone(hz(l + 12), stepDur * 1.6, 'square', 0.012, 1, when);
      if (i % 4 === 0) this.noise(0.05, 0.03, 60, when);
      if (i % 4 === 2) this.noise(0.04, 0.018, 5000, when);
      this.step++;
      this.next += stepDur;
    }
    this.out = this.sfxBus;
  },
};

/* ============================================================
   INPUT — dispositivi: tastiera (solo / A / B) e controller
   Ogni giocatore legge un "controllo" astratto:
   l r u d  + punch (attacco) shoot (pistola) jump special dodge team start
   ============================================================ */
const BTN = ['punch', 'shoot', 'jump', 'special', 'dodge', 'team', 'start'];
const KEYMAPS = {
  // una sola persona sulla tastiera: tutti i tasti
  kb: {
    l: ['KeyA', 'ArrowLeft'], r: ['KeyD', 'ArrowRight'], u: ['KeyW', 'ArrowUp'], d: ['KeyS', 'ArrowDown'],
    punch: ['KeyJ', 'KeyF', 'Numpad1'], shoot: ['KeyK', 'KeyG', 'Numpad2'], jump: ['Space', 'Numpad0'],
    special: ['KeyL', 'KeyR', 'Numpad3'], dodge: ['ShiftLeft', 'ShiftRight', 'KeyT'], team: ['KeyI', 'KeyY', 'Numpad4'], start: ['Escape', 'Enter'],
  },
  // due persone sulla stessa tastiera
  kbA: {
    l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'],
    punch: ['KeyF'], shoot: ['KeyG'], jump: ['Space'], special: ['KeyR'], dodge: ['ShiftLeft'], team: ['KeyT'], start: ['Escape'],
  },
  kbB: {
    l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'],
    punch: ['Numpad1', 'KeyK'], shoot: ['Numpad2', 'KeyL'], jump: ['Numpad0', 'KeyI'], special: ['Numpad3', 'KeyO'],
    dodge: ['NumpadDecimal', 'ShiftRight'], team: ['Numpad4', 'KeyP'], start: ['NumpadEnter', 'Enter'],
  },
};
const PADMAP = { jump: [0], special: [1], punch: [2], shoot: [3], team: [4], dodge: [5, 7, 6], start: [9] };
const DEFAULT_KEYS = JSON.stringify({ kb: KEYMAPS.kb, kbA: KEYMAPS.kbA, kbB: KEYMAPS.kbB, pad: PADMAP });
/* tasti personalizzati (OPZIONI → COMANDI), salvati nel browser */
function loadKeymaps() {
  try {
    const k = JSON.parse(localStorage.getItem('primal-keymap') || 'null');
    if (!k) return;
    for (const s of ['kb', 'kbA', 'kbB']) if (k[s]) Object.assign(KEYMAPS[s], k[s]);
    if (k.pad) Object.assign(PADMAP, k.pad);
  } catch (e) {}
}
function saveKeymaps() { try { localStorage.setItem('primal-keymap', JSON.stringify({ kb: KEYMAPS.kb, kbA: KEYMAPS.kbA, kbB: KEYMAPS.kbB, pad: PADMAP })); } catch (e) {} }
function resetKeymaps() {
  const d = JSON.parse(DEFAULT_KEYS);
  for (const s of ['kb', 'kbA', 'kbB']) { for (const a in KEYMAPS[s]) delete KEYMAPS[s][a]; Object.assign(KEYMAPS[s], d[s]); }
  for (const a in PADMAP) delete PADMAP[a]; Object.assign(PADMAP, d.pad);
  try { localStorage.removeItem('primal-keymap'); } catch (e) {}
}
/* controller symbols: PlayStation (✕ ○ □ △, L1 R1…) or Xbox (A B X Y, LB RB…).
   OPZIONI → SIMBOLI CONTROLLER: automatico (riconosce il controller collegato), PlayStation o Xbox */
const VOICES = {   // [base Hz, wave, volume, jitter]
  ASTRO: [760, 'square', 0.018, 0.25], BORIS: [150, 'sawtooth', 0.022, 0.08], ARMV3Z: [180, 'triangle', 0.035, 0.12],
  VESPERA: [300, 'sine', 0.04, 0.2], KHARON: [120, 'sawtooth', 0.022, 0.1], SIRIO: [150, 'triangle', 0.035, 0.12], TRIVOR: [90, 'sawtooth', 0.03, 0.15],
  'DOTT.SSA VALLI': [290, 'triangle', 0.035, 0.18], IGNIS: [220, 'square', 0.016, 0.15], AZUR: [200, 'triangle', 0.035, 0.1], LYRA: [340, 'square', 0.015, 0.2],
  AURA: [320, 'triangle', 0.035, 0.18], ONYX: [140, 'triangle', 0.04, 0.08], RIGEL: [170, 'square', 0.014, 0.35],
};
const PAD_NAMES_PS = ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'SELECT', 'START', 'L3', 'R3', '↑', '↓', '←', '→', 'PS'];
const PAD_NAMES_XB = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'MENU', 'L3', 'R3', '↑', '↓', '←', '→', 'XBOX'];
const PAD_STYLE_NAMES = { auto: 'AUTOMATICO', ps: 'PLAYSTATION', xbox: 'XBOX' };
function padStyleSetting() { try { return localStorage.getItem('primal-padstyle') || 'auto'; } catch (e) { return 'auto'; } }
function setPadStyle(v) { try { localStorage.setItem('primal-padstyle', v); } catch (e) {} }
function detectPadStyle() {
  const ps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  for (const p of ps) {
    const id = (p.id || '').toLowerCase();
    if (/xbox|045e|xinput|microsoft/.test(id)) return 'xbox';
    if (/playstation|dualsense|dualshock|054c|wireless controller|sony/.test(id)) return 'ps';
  }
  return 'ps';   // nothing recognised: PlayStation symbols
}
function padStyle() { const v = padStyleSetting(); return v === 'auto' ? detectPadStyle() : v; }
function padHTML(i) { const n = padName(i); return i < 4 && padStyle() === 'ps' ? `<i class="psg ps${i}">${n}</i>` : n; }
function padName(i) { return ((padStyle() === 'xbox' ? PAD_NAMES_XB : PAD_NAMES_PS)[i]) || String(i); }
const PAD_NAMES = new Proxy([], { get: (t, k) => (/^\d+$/.test(k) ? padName(+k) : t[k]) });
function codeLabel(code) {
  if (!code) return '?';
  const fixed = { Space: 'SPAZIO', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT DX', ControlLeft: 'CTRL', ControlRight: 'CTRL DX', AltLeft: 'ALT', AltRight: 'ALT GR', Enter: 'INVIO', Escape: 'ESC', Backspace: '⌫', Tab: 'TAB',
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', NumpadEnter: 'NUM INVIO', NumpadDecimal: 'NUM ,', CapsLock: 'MAIUSC', Comma: ',', Period: '.', Minus: '-', Semicolon: 'Ò', Quote: 'À', BracketLeft: 'È', BracketRight: '+', Backslash: 'Ù', Slash: '-', Backquote: '\\', IntlBackslash: '<' };
  if (fixed[code]) return fixed[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM' + code.slice(6);
  return code.toUpperCase().slice(0, 6);
}

/* ---------- controller calibration (1.8.1) ----------
   Many PlayStation-style USB pads (and some Bluetooth ones) are not reported with the "standard" layout,
   so the browser numbers their buttons differently. OPZIONI → PROVA E CALIBRA IL CONTROLLER records, for
   each controller model, which real button/axis is ✕, ○, □, △, L1… and everything reads through it. */
let PADCAL = {};
const HAT_SEEN = {};
try { PADCAL = JSON.parse(localStorage.getItem('primal-padcal') || '{}'); } catch (e) { PADCAL = {}; }
function savePadCal() { try { localStorage.setItem('primal-padcal', JSON.stringify(PADCAL)); } catch (e) {} }
function hatDir(v) {   // 8-way hat switch on one axis (common on generic pads): -1 up … 0.71 left, ~1.28 = released
  if (v === undefined || Math.abs(v) > 1.05) return null;
  const dirs = [[-1, 'u'], [-0.714, 'ur'], [-0.428, 'r'], [-0.142, 'dr'], [0.142, 'd'], [0.428, 'dl'], [0.714, 'l'], [1, 'ul']];
  let best = null, bd = 0.15; for (const [x, n] of dirs) if (Math.abs(v - x) < bd) { bd = Math.abs(v - x); best = n; }
  return best;
}
function srcOn(p, s) {
  if (!s) return false;
  if (s.b !== undefined) return !!(p.buttons[s.b] && p.buttons[s.b].pressed);
  if (s.a !== undefined) { const v = p.axes[s.a]; if (v === undefined) return false; return s.h ? (hatDir(v) || '').includes(s.h) : Math.abs(v - s.v) < 0.25; }
  return false;
}
/* the 17 buttons of the standard layout (0 ✕/A · 1 ○/B · 2 □/X · 3 △/Y · 4 L1 · 5 R1 · 6 L2 · 7 R2 · 8 SELECT · 9 START · 12-15 croce) */
/* known controllers the browser does not lay out by itself (used until the player calibrates their own) */
const PAD_PRESETS = [
  // Sony PlayStation Classic controller (SCPH-1000R, USB 054c:0cda): △ ○ ✕ □ · L2 R2 L1 R1 · SELECT START, d-pad on the two axes
  { test: /054c.*0cda/i, name: 'PLAYSTATION CLASSIC', cal: [{ b: 2 }, { b: 1 }, { b: 3 }, { b: 0 }, { b: 6 }, { b: 7 }, { b: 4 }, { b: 5 }, { b: 8 }, { b: 9 }, null, null, { a: 1, v: -1 }, { a: 1, v: 1 }, { a: 0, v: -1 }, { a: 0, v: 1 }, null] },
];
function padPreset(p) { return p.mapping === 'standard' ? null : PAD_PRESETS.find((q) => q.test.test(p.id || '')) || null; }
function padButtons(p) {
  const pre = padPreset(p);
  const cal = PADCAL[p.id] || (pre && pre.cal);
  const out = [];
  if (cal) { for (let i = 0; i < 17; i++) out[i] = srcOn(p, cal[i]); return out; }
  for (let i = 0; i < 17; i++) out[i] = !!(p.buttons[i] && p.buttons[i].pressed);
  if (p.mapping !== 'standard') {
    // no layout from the browser: try a hat switch for the d-pad
    const seen = HAT_SEEN[p.index] || (HAT_SEEN[p.index] = {});
    p.axes.forEach((v, a) => { if (Math.abs(v) > 1.05) seen[a] = true; });   // a hat rests at ~1.28: only those axes count
    for (let a = 9; a >= 2; a--) { const d = seen[a] && hatDir(p.axes[a]); if (d) { if (d.includes('u')) out[12] = true; if (d.includes('d')) out[13] = true; if (d.includes('l')) out[14] = true; if (d.includes('r')) out[15] = true; break; } }
  }
  return out;
}
const Input = {
  keys: {}, keyEdge: {}, padPrev: {}, padEdge: {},
  init() {
    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) && !UI.typing()) e.preventDefault();
      if (!this.keys[e.code]) this.keyEdge[e.code] = true;
      this.keys[e.code] = true;
      Audio.unlock();
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    addEventListener('pointerdown', () => Audio.unlock());
  },
  pads() {
    const out = [];
    const ps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of ps) if (p && p.connected) out.push(p);
    return out;
  },
  /* read device → control snapshot {l,r,u,d, held:{}, pressed:{}} */
  read(device) {
    if (device === 'touch') return Touch.read();
    const c = { l: 0, r: 0, u: 0, d: 0, held: {}, pressed: {} };
    if (device.startsWith('kb')) {
      const map = device === 'kb' ? KEYMAPS.kb : (Game.local.twoKeyboards ? KEYMAPS[device] : KEYMAPS.kb);
      for (const dir of ['l', 'r', 'u', 'd']) c[dir] = map[dir].some((k) => this.keys[k]) ? 1 : 0;
      for (const b of BTN) {
        c.held[b] = map[b].some((k) => this.keys[k]);
        c.pressed[b] = map[b].some((k) => this.keyEdge[k]);
      }
    } else if (device.startsWith('pad')) {
      const idx = +device.slice(3);
      const p = (navigator.getGamepads ? navigator.getGamepads() : [])[idx];
      if (!p) return c;
      const b = padButtons(p);
      const prev = this.padPrev[idx] || [];
      c.l = (p.axes[0] < -0.35 || b[14]) ? 1 : 0;
      c.r = (p.axes[0] > 0.35 || b[15]) ? 1 : 0;
      c.u = (p.axes[1] < -0.35 || b[12]) ? 1 : 0;
      c.d = (p.axes[1] > 0.35 || b[13]) ? 1 : 0;
      for (const k of BTN) {
        c.held[k] = PADMAP[k].some((i) => b[i]);
        c.pressed[k] = PADMAP[k].some((i) => b[i] && !prev[i]);
      }
    }
    return c;
  },
  /* any-device edge detection used by menus/lobby */
  anyPressed(btn) {
    for (const dev of ['kb']) if (this.read(dev).pressed[btn]) return dev;
    for (const p of this.pads()) if (this.read('pad' + p.index).pressed[btn]) return 'pad' + p.index;
    return null;
  },
  endFrame() {
    this.keyEdge = {};
    Touch.endFrame();
    for (const p of this.pads()) this.padPrev[p.index] = padButtons(p);
  },
};

/* control packed into bits for the network */
function packControl(c) {
  let bits = (c.l ? 1 : 0) | (c.r ? 2 : 0) | (c.u ? 4 : 0) | (c.d ? 8 : 0);
  BTN.forEach((b, i) => { if (c.held[b]) bits |= 1 << (4 + i); });
  if (c.dash) bits |= 1 << 12;
  let edge = 0;
  BTN.forEach((b, i) => { if (c.pressed[b]) edge |= 1 << i; });
  return [bits, edge];
}
function unpackControl(bits, edge) {
  const c = { l: bits & 1 ? 1 : 0, r: bits & 2 ? 1 : 0, u: bits & 4 ? 1 : 0, d: bits & 8 ? 1 : 0, held: {}, pressed: {} };
  BTN.forEach((b, i) => { c.held[b] = !!(bits & (1 << (4 + i))); c.pressed[b] = !!(edge & (1 << i)); });
  if (bits & (1 << 12)) c.dash = true;
  return c;
}
