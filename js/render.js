'use strict';
/* ============================================================
   RENDER — disegna una "view" (livello o duello gigante),
   particelle locali generate dagli eventi, HUD.
   ============================================================ */
const FX = { parts: [], shake: 0, flash: 0, flashC: '#fff', team: null, go: 0 };
const HORIZON = 465;

function applyEvents(evs, world = true) {
  for (const e of evs || []) {
    switch (e.t) {
      case 'snd': Audio.sfx(e.n); break;
      case 'shake': FX.shake = Math.max(FX.shake, e.v); break;
      case 'flash': FX.flash = Math.max(FX.flash, e.v); FX.flashC = e.c || '#fff'; break;
      case 'spark': case 'chip': case 'fire': case 'trail': case 'slash': case 'dust': {
        const n = e.n || 10;
        for (let i = 0; i < n; i++) {
          const big = e.big ? 2.2 : 1;
          FX.parts.push({
            k: e.t, x: e.x, y: e.y, vx: rand(-1, 1) * (e.t === 'trail' ? 20 : e.t === 'fire' ? 160 : 380) * big, vy: (e.t === 'fire' ? rand(-260, -60) : rand(-330, 60)) * big,
            life: rand(0.25, 0.5) * (e.t === 'fire' ? 1.6 : 1), max: 0.5, c: e.c, s: (e.t === 'chip' ? 6 : e.t === 'fire' ? 8 : 5) * big, world: !e.fixed && world,
          });
        }
        if (e.t === 'spark' || e.t === 'slash') FX.parts.push({ k: 'star', x: e.x, y: e.y, life: 0.12, max: 0.12, c: e.c, s: e.big ? 70 : 34, world });
        break;
      }
      case 'ring': FX.parts.push({ k: 'ring', x: e.x, y: e.y, r: e.r, life: e.life, max: e.life, c: e.c, world }); break;
      case 'boom':
        FX.parts.push({ k: 'boom', x: e.x, y: e.y, life: 0.55, max: 0.55, s: e.big ? 2.2 : 1, world });
        for (let i = 0; i < (e.big ? 18 : 12); i++) FX.parts.push({ k: 'fire', x: e.x, y: e.y, vx: rand(-300, 300), vy: rand(-400, -50), life: rand(0.3, 0.7), max: 0.7, c: pick(['#ffd35a', '#ff8a3a', '#ff5a2a']), s: e.big ? 14 : 8, world });
        break;
      case 'beam': FX.parts.push({ k: 'beam', x: e.x, y: e.y, dir: e.dir, len: e.len, c: e.c, life: e.big ? 0.8 : 0.4, max: e.big ? 0.8 : 0.4, big: e.big, world }); break;
      case 'crack': FX.parts.push({ k: 'crack', x: e.x, y: e.y, life: 1.2, max: 1.2, seed: Math.random() * 1000, world }); break;
      case 'txt': FX.parts.push({ k: 'txt', x: e.x, y: e.y, s: e.s, c: e.c, size: e.size || 22, life: e.fixed ? 2 : 1.1, max: e.fixed ? 2 : 1.1, world: !e.fixed && world }); break;
      case 'debris':
        for (let i = 0; i < 4; i++) FX.parts.push({ k: 'plank', x: e.x, y: e.y - 30, vx: rand(-260, 260), vy: rand(-420, -200), life: 0.9, max: 0.9, f: e.k === 'bin' ? 'can' : 'plank' + i, rot: rand(0, 6), vr: rand(-12, 12), world });
        break;
      case 'team': FX.team = { t: 0, heroes: e.heroes, arena: e.arena, f: e.f, slots: e.slots }; break;
      case 'go': FX.go = 5; Audio.sfx('confirm'); break;
      case 'wslash': FX.parts.push({ k: 'wslash', x: e.x, y: e.y, f: e.f, c: e.c, g: e.g, big: e.big, w: e.w, life: e.big ? 0.3 : 0.22, max: e.big ? 0.3 : 0.22, world }); break;
      case 'portal': FX.parts.push({ k: 'ring', x: e.x, y: e.y, r: 130, life: 0.9, max: 0.9, c: '#9a3aff', world }); break;
      case 'pop': FX.parts.push({ k: 'pop', x: e.x, y: e.y, s: e.s, c: e.c, big: e.big, life: e.big ? 1.3 : 0.7, max: e.big ? 1.3 : 0.7, rot: rand(-0.25, 0.25), world: !e.fixed && world }); break;
      case 'shock': break;
      case 'uncage': FX.parts.push({ k: 'ring', x: e.x, y: e.y - 70, r: 140, life: 0.5, max: 0.5, c: '#c07bff', world }); for (let i = 0; i < 16; i++) FX.parts.push({ k: 'fire', x: e.x + rand(-50, 50), y: e.y - rand(0, 150), vx: rand(-60, 60), vy: rand(-160, -40), life: 0.6, max: 0.6, c: '#c07bff', s: 6, world }); break;
      case 'morph': FX.parts.push({ k: 'column', x: e.x, y: e.y, c: e.c, life: 1.1, max: 1.1, world }); break;
    }
  }
}

function stepFX(dt) {
  for (const p of FX.parts) {
    p.life -= dt;
    if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.k !== 'fire' && p.k !== 'trail') p.vy += 900 * dt; else p.vy *= 0.96; }
    if (p.rot !== undefined) p.rot += p.vr * dt;
    if (p.k === 'txt') p.y -= 50 * dt;
  }
  FX.parts = FX.parts.filter((p) => p.life > 0);
  FX.shake = Math.max(0, FX.shake - dt * 40);
  FX.flash = Math.max(0, FX.flash - dt * 2.2);
  FX.go = Math.max(0, FX.go - dt);
  if (FX.team) { FX.team.t += dt; if (FX.team.t > TEAM_LEN) FX.team = null; }
}

function drawParts(cam, layer) {
  for (const p of FX.parts) {
    const x = p.world ? p.x - cam : p.x, y = p.y;
    const k = clamp(p.life / p.max, 0, 1);
    g.save();
    switch (p.k) {
      case 'spark': case 'chip': case 'dust':
        g.globalAlpha = k; g.fillStyle = p.k === 'dust' ? '#a8a0a0' : p.c;
        g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s); break;
      case 'fire': case 'trail':
        g.globalAlpha = k * 0.9; g.globalCompositeOperation = 'lighter'; g.fillStyle = p.c;
        g.beginPath(); g.arc(x, y, p.s * (0.5 + k), 0, 7); g.fill(); break;
      case 'star': {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.fillStyle = '#fffbe8'; g.strokeStyle = p.c; g.lineWidth = 3;
        const r = p.s * (1.2 - k * 0.4);
        g.beginPath();
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
        g.closePath(); g.fill(); g.stroke(); break;
      }
      case 'slash':
        g.globalAlpha = k; g.strokeStyle = p.c; g.lineWidth = 4; g.globalCompositeOperation = 'lighter';
        g.beginPath(); g.arc(x, y, 40, -1.2, 0.8); g.stroke(); break;
      case 'ring':
        g.globalAlpha = k; g.strokeStyle = p.c; g.lineWidth = 7 * k + 2; g.globalCompositeOperation = 'lighter';
        g.beginPath(); g.ellipse(x, y, p.r * (1 - k * 0.85), p.r * 0.36 * (1 - k * 0.85), 0, 0, 7); g.stroke(); break;
      case 'boom': {
        const r = (1 - k) * 90 * p.s + 20;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = k; g.fillStyle = '#ffdb7a'; g.beginPath(); g.arc(x, y, r * 0.6, 0, 7); g.fill();
        g.fillStyle = '#ff7a2a'; g.globalAlpha = k * 0.7; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = (1 - k) * 0.5 * k * 3; g.fillStyle = '#2a2230'; g.beginPath(); g.arc(x, y - r * 0.4, r * 0.8, 0, 7); g.fill();
        break;
      }
      case 'beam': {
        const w = (p.big ? 90 : 40) * k;
        const x2 = x + p.dir * p.len;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.6 * k; g.fillStyle = p.c; g.fillRect(Math.min(x, x2), y - w, Math.abs(x2 - x), w * 2);
        g.globalAlpha = k; g.fillStyle = '#ffffff'; g.fillRect(Math.min(x, x2), y - w * 0.3, Math.abs(x2 - x), w * 0.6);
        break;
      }
      case 'crack': {
        g.globalAlpha = Math.min(1, k * 2); g.strokeStyle = '#1a1010'; g.lineWidth = 3;
        let s = p.seed;
        const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < 7; i++) {
          g.beginPath(); g.moveTo(x, y);
          let cx = x, cy = y; const a = i / 7 * Math.PI * 2;
          for (let j = 0; j < 4; j++) { cx += Math.cos(a + rnd() - 0.5) * 34; cy += Math.sin(a + rnd() - 0.5) * 12; g.lineTo(cx, cy); }
          g.stroke();
        }
        g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffb45a'; g.globalAlpha = k * 0.6; g.lineWidth = 1; g.stroke();
        break;
      }
      case 'plank':
        g.globalAlpha = Math.min(1, k * 2); g.translate(x, y); g.rotate(p.rot); g.scale(1.3, 1.3);
        { const f = frameOf('items', p.f); if (f) g.drawImage(IMG.items, f[0], f[1], f[2], f[3], -f[2] / 2, -f[3] / 2, f[2], f[3]); }
        break;
      case 'column': {
        g.globalCompositeOperation = 'lighter';
        const w = 40 + (1 - k) * 60;
        const grd = g.createLinearGradient(x - w, 0, x + w, 0);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, p.c); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = Math.sin(k * Math.PI) * 0.9; g.fillStyle = grd; g.fillRect(x - w, 0, w * 2, y + 10);
        g.fillStyle = '#fff'; g.globalAlpha = Math.sin(k * Math.PI) * 0.8; g.fillRect(x - 6, 0, 12, y);
        for (let i = 0; i < 6; i++) { const a = (1 - k) * 8 + i; g.fillStyle = p.c; g.beginPath(); g.arc(x + Math.cos(a) * 50, y - 20 - i * 26 - (1 - k) * 60, 5, 0, 7); g.fill(); }
        break;
      }
      case 'wslash': {
        // big coloured arc following the weapon: makes every weapon blow readable
        const k2 = 1 - p.life / p.max;
        const R = (p.big ? 150 : 120), cy = y - 95;
        const a0 = p.w === 'onyx' || p.big ? -2.3 : -1.6, a1 = p.big ? 1.1 : 0.7;
        const a = a0 + (a1 - a0) * Math.min(1, k2 * 1.6);
        g.translate(x, cy); g.scale(p.f, 1);
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          g.globalAlpha = (1 - k2) * (0.9 - i * 0.25);
          g.strokeStyle = i === 0 ? '#ffffff' : i === 1 ? p.g : p.c;
          g.lineWidth = (p.big ? 22 : 15) - i * 5;
          g.beginPath(); g.arc(0, 0, R - i * 8, Math.max(a0, a - 1.6), a); g.stroke();
        }
        break;
      }
      case 'pop': {
        // comic-book burst with a word
        const age = p.max - p.life;
        const sc = age < 0.12 ? age / 0.12 * 1.25 : 1.25 - Math.min(0.25, (age - 0.12) * 2);
        g.translate(x, y - age * 30); g.rotate(p.rot); g.scale(sc, sc);
        g.globalAlpha = Math.min(1, p.life * 4);
        g.font = `400 ${p.big ? 26 : 18}px ${PXFONT}`;
        const w = g.measureText(p.s).width + 34, h = p.big ? 56 : 42;
        g.fillStyle = '#05070c'; burst(0, 0, w / 2 + 10, h / 2 + 10, 14); g.fill();
        g.fillStyle = p.c; burst(0, 0, w / 2 + 4, h / 2 + 4, 14); g.fill();
        g.fillStyle = '#fff8e0'; burst(0, 0, w / 2 - 4, h / 2 - 4, 14); g.fill();
        ptitle(p.s, 0, (p.big ? 26 : 18) / 2, p.big ? 26 : 18, '#ffffff', p.c);
        break;
      }
      case 'txt':
        g.globalAlpha = Math.min(1, k * 2.5); txt(p.s, x, y, p.size, p.c, 'center', 900); break;
    }
    g.restore();
  }
}

/* ---------- stage drawing ---------- */
function drawStageBackdrop(bg, cam) {
  const img = IMG[bg];
  if (!img) return;
  // far layer (above the horizon) scrolls slower: parallax depth
  g.save(); g.beginPath(); g.rect(0, 0, W, HORIZON); g.clip();
  drawBackdrop(bg, cam * 0.62);
  g.restore();
  g.save(); g.beginPath(); g.rect(0, HORIZON, W, H - HORIZON); g.clip();
  drawBackdrop(bg, cam);
  g.restore();
  // horizon blend line
  const grd = g.createLinearGradient(0, HORIZON - 6, 0, HORIZON + 10);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(5,10,20,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, HORIZON - 6, W, 16);
}

function drawShadow(x, y, r, z = 0) {
  const k = clamp(1 - z / 400, 0.4, 1);
  g.fillStyle = `rgba(2,6,14,${0.42 * k})`;
  g.beginPath(); g.ellipse(x, y + 2, r * k, r * 0.28 * k, 0, 0, 7); g.fill();
}

function drawWeaponOn(o, x, y) {
  const fw = frameOf('items', o.wp);
  const fr = frameOf('fighters', o.f);
  if (!fw || !fr) return;
  const sc = o.sc;
  g.save();
  g.translate(x, y);
  g.scale(o.fc, 1);
  let hx, hy, rot;
  if (o.wa) { hx = (fr[2] - fr[4]) * sc - 18; hy = -fr[5] * sc * 0.64; rot = -0.08; }
  else { hx = 22 * sc; hy = -fr[5] * sc * 0.47; rot = -1.05; }
  g.translate(hx, hy); g.rotate(rot);
  const k = 1.15;
  g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -8, -fw[3] * k / 2, fw[2] * k, fw[3] * k);
  g.restore();
}

/* personal weapon held in the hand: grip anchor of the weapon on the fist of the frame */
function handPos(key, sc) {
  const fr = frameOf('fighters', key);
  if (!fr) return [20 * sc, -80 * sc];
  const f = +key.split('_')[1];
  if (f === 5) return [(fr[2] - fr[4]) * sc - 14 * sc, -fr[5] * sc * 0.64];
  if (f === 6) return [12 * sc, -fr[5] * sc * 0.62];
  if (f === 4) return [16 * sc, -fr[5] * sc * 0.78];
  return [20 * sc, -fr[5] * sc * 0.52];
}
function drawSigWeapon(key, frameKey, x, y, face, sc, rot, glow, t) {
  if (+frameKey.split('_')[1] >= 8) return;   // weapon already in the sprite
  const fw = frameOf('items', key);
  if (!fw) return;
  const [hx, hy] = handPos(frameKey, sc);
  g.save();
  g.translate(x, y); g.scale(face, 1); g.translate(hx, hy); g.rotate(rot || 0);
  if (glow) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 + Math.sin(t * 30) * 0.15;
    const grd = g.createLinearGradient(0, 0, fw[2], 0); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, glow);
    g.fillStyle = grd; g.fillRect(-fw[4], -fw[5] - 6, fw[2] + 12, fw[3] + 12); g.restore();
  }
  g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -fw[4], -fw[5], fw[2], fw[3]);
  g.restore();
}

function drawDrawable(o, cam, t) {
  const x = o.x - cam, y = o.y, z = o.z || 0;
  if (o.sh2) { // projectiles
    g.save();
    if (o.sh2 === 'orb') {
      drawShadow(x, y, 16, z);
      g.globalCompositeOperation = 'lighter';
      const r = 16 + Math.sin(t * 20) * 3;
      g.fillStyle = o.c || '#c07bff'; g.globalAlpha = 0.5; g.beginPath(); g.arc(x, y - z, r * 1.8, 0, 7); g.fill();
      g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - z, r * 0.6, 0, 7); g.fill();
    } else if (o.sh2 === 'wave') {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = '#d24a5a'; g.globalAlpha = 0.8;
      g.beginPath(); g.ellipse(x, y - 40, 22, 60, 0, 0, 7); g.fill();
      g.fillStyle = '#ffd0d8'; g.beginPath(); g.ellipse(x + o.fc * 6, y - 40, 8, 50, 0, 0, 7); g.fill();
    } else if (o.sh2 === 'bolt' || o.sh2 === 'dbolt') {
      if (o.sh2 === 'dbolt') drawShadow(x, y, 10, z);
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y - z); g.scale(o.fc, 1);
      g.rotate(o.sh2 === 'dbolt' ? 0.6 : o.am ? -0.7 : 0);
      g.fillStyle = o.c || '#bfe6ff'; g.globalAlpha = 0.55;
      g.fillRect(-60, -6, 60, 12);
      g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(-34, -2, 34, 4);
    } else if (o.sh2 === 'flame') {
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y - z); g.scale(o.fc, 1);
      g.fillStyle = '#ff5a1e'; g.globalAlpha = 0.8;
      g.beginPath(); g.moveTo(-30, -110); g.quadraticCurveTo(80, 0, -30, 110); g.quadraticCurveTo(20, 0, -30, -110); g.fill();
      g.fillStyle = '#ffd06a'; g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(-14, -80); g.quadraticCurveTo(55, 0, -14, 80); g.quadraticCurveTo(14, 0, -14, -80); g.fill();
    } else if (o.sh2 === 'wing') {
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y - z); g.scale(o.fc, 1);
      g.fillStyle = '#ff78bb'; g.globalAlpha = 0.75;
      g.beginPath(); g.moveTo(-40, -90); g.quadraticCurveTo(70, 0, -40, 90); g.quadraticCurveTo(20, 0, -40, -90); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(-20, -60); g.quadraticCurveTo(50, 0, -20, 60); g.quadraticCurveTo(15, 0, -20, -60); g.fill();
    }
    g.restore();
    return;
  }
  if (o.tg) { // boss target telegraph
    g.save(); g.strokeStyle = '#ffb657'; g.lineWidth = 3; g.setLineDash([9, 6]); g.lineDashOffset = -t * 40;
    g.globalAlpha = 0.6 + Math.sin(t * 20) * 0.3;
    g.beginPath(); g.ellipse(o.tg[0] - cam, o.tg[1], o.tg[2], o.tg[2] * 0.3, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,120,40,.16)'; g.fill(); g.restore();
  }
  if (o.bl) {
    g.save(); g.strokeStyle = '#c07bff'; g.globalAlpha = 0.4 + Math.sin(t * 30) * 0.3; g.lineWidth = 2; g.setLineDash([12, 8]);
    g.beginPath(); g.moveTo(x, y - 105); g.lineTo(x + o.fc * 900, y - 105); g.stroke(); g.restore();
  }
  if (o.pf) { drawPlatform(o, x, y, t); return; }
  if (o.pr !== undefined) { drawPressHead(o, x, y, t); return; }
  if (o.bm) { drawBeam(o, x, t); return; }
  const gz = o.gz || 0;
  if (o.sh) drawShadow(x, y - gz, o.sh * (o.sc > 1 ? o.sc * 0.8 : 1), z - gz);
  if (o.sg) glowAt(x, y - z - 20, 60, '#ffd35a', 0.5 + Math.sin(t * 6) * 0.2);
  if (o.au) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(x, y - 70 - z, 10, x, y - 70 - z, 120);
    grd.addColorStop(0, o.au); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55 + Math.sin(t * 30) * 0.15; g.fillStyle = grd; g.fillRect(x - 130, y - 200 - z, 260, 260); g.restore();
  }
  if (o.gh) for (let i = 2; i >= 1; i--) spr(o.s, o.f, x - o.fc * i * 22, y - z, { scale: o.sc, face: o.fc, alpha: 0.18 * (3 - i), rot: o.r });
  const opt = { scale: o.sc, face: o.fc, rot: o.r, alpha: o.a !== undefined ? o.a : 1 };
  if (o.sq) opt.sy = o.sq;
  if (o.ti) opt.img = tinted(o.s, o.f, o.ti, 'source-atop', 0.62);
  if (o.sk) { const im = skinned(o.s, o.f, o.sk); if (im) opt.img = im; }
  if (o.ko !== undefined) drawKoRing(o, x, y, t);
  if (o.fl) { if (o.pl) opt.flash = 0.4; else opt.img = tinted(o.s, o.f, o.ti ? '#ff60ff' : '#ff3a24', 'source-atop', 0.34); }
  // lying bodies: shift so the body rests on the floor line
  let ox = 0;
  if (o.r && Math.abs(o.r) > 1) ox = o.fc * 10;
  if (o.rz) {
    // rising out of a floor portal: the part below the floor stays hidden
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#9a3aff'; g.globalAlpha = 0.6 + Math.sin(t * 20) * 0.2;
    g.beginPath(); g.ellipse(x, y, 60, 16, 0, 0, 7); g.fill(); g.restore();
    g.save(); g.beginPath(); g.rect(x - 200, 0, 400, y + 2); g.clip();
    spr(o.s, o.f, x + ox, y - z, opt); g.restore();
  } else spr(o.s, o.f, x + ox, y - z, opt);
  if (o.cg) {
    // hostages locked in a cage of Veil energy
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = 0.55 + Math.sin(t * 13 + o.i) * 0.2;
    g.fillStyle = `rgba(150,70,255,${0.18 * fl})`; g.fillRect(x - 52, y - 150, 104, 152);
    g.fillStyle = `rgba(200,140,255,${0.85 * fl})`;
    for (let bx = -48; bx <= 48; bx += 16) g.fillRect(x + bx, y - 150, 3, 152);
    g.fillRect(x - 52, y - 154, 104, 5); g.fillRect(x - 52, y - 2, 104, 5);
    g.restore();
    if (Math.floor(t * 2.5 + o.i) % 2) ptitle('AIUTO!', x, y - 172, 13, '#ffffff', '#c07bff');
    ptxt('COLPISCI LA GABBIA', x, y - 158, 7, '#e0c8ff', 'center');
  }
  if (o.wp) drawWeaponOn(o, x, y - z);
  if (o.sw) drawSigWeapon(o.sw, o.f, x + ox, y - z, o.fc, o.sc, o.sr, o.au || o.pc, t);
  if (o.gd) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 16) * 0.15; g.fillStyle = '#bfe6ff';
    g.beginPath(); g.ellipse(x + o.fc * 55, y - 120, 18, 90, 0, 0, 7); g.fill(); g.restore();
  }
  if (o.wn) txt('!', x, y - 175 * (o.sc || 1) - z, 30, '#ff7a6a', 'center', 900);
  if (o.gb && Math.floor(t * 6) % 2) ptxt('PRESA!', x, y - 168 - z, 9, '#ffe08a', 'center');
  if (o.hb !== undefined) bar(x - 26, y - 160 * (o.sc / 0.86) - z, 52, 4, o.hb, '#b39cff');
  if (o.th) { g.save(); g.strokeStyle = '#ffd35a'; g.lineWidth = 6; g.globalAlpha = 0.9; g.beginPath(); g.arc(x, y - z - 200, 22, -Math.PI / 2, -Math.PI / 2 + o.th * Math.PI * 2); g.stroke(); g.restore(); ptxt('TITANO', x, y - z - 232, 8, '#ffd35a', 'center'); }
  if (o.hint) drawHint(o, x, y - z, t);
  if (o.pl && Game.showTags) txt(o.pl + 'P', x, y - (o.s === 'people' ? 150 : 160) - z, 15, o.pc || '#fff', 'center', 900);
}

/* ---------- chapter 2: fighting on the roof of the moving convoy ---------- */
const TRAIN = { clack: 0, lastT: 0 };
function trainAmount(v) {
  const L = LEVELS[v.lv];
  if (!L || !L.train) return 0;
  return clamp((v.cam - (L.train - 700)) / 220, 0, 1);
}
/* 1.11.2: painted roof backgrounds (train_roof / loco_roof): the sky half rushes past, the roof half moves with the camera */
const ROOF_SPLIT = 436, ROOF_OY = 22;
function tileRows(img, off, sy, sh, dy, noFlip = false) {
  const tw = img.width;
  for (let i = Math.floor(off / tw); i * tw - off < W; i++) {
    const x = Math.round(i * tw - off);
    g.save();
    if (i % 2 && !noFlip) { g.translate(x + tw, 0); g.scale(-1, 1); g.drawImage(img, 0, sy, tw, sh, 0, dy, tw, sh); }
    else g.drawImage(img, 0, sy, tw, sh, x, dy, tw, sh);
    g.restore();
  }
}
function drawTrainPainted(cam, t, a, portal) {
  const img = IMG.train_roof, loco = IMG.loco_roof, L = LEVELS[1];
  g.save(); g.globalAlpha = a;
  // sky and landscape
  g.save(); g.beginPath(); g.rect(0, 0, W, ROOF_OY + ROOF_SPLIT); g.clip();
  const soff = cam * 0.35 + t * 620;
  tileRows(img, soff, 0, ROOF_SPLIT, ROOF_OY);
  g.fillStyle = '#0b1336'; g.fillRect(0, 0, W, ROOF_OY + 1);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const y = 260 + (i * 37) % 180, len = 120 + (i * 53) % 260;
    const x = W - ((t * (900 + (i % 5) * 180) + i * 211) % (W + len + 200));
    g.fillStyle = `rgba(255,${190 - (i % 3) * 40},120,${0.06 + (i % 4) * 0.02})`; g.fillRect(x, y, len, 2);
  }
  g.globalCompositeOperation = 'source-over';
  if (portal > 0) { rift(1060, 180, clamp(portal * 2, 0.35, 1), t); glowAt(1060, 180, (40 + portal * 260) * 1.4, '#9a3aff', 0.25 + portal * 0.35); }
  g.restore();
  // the roof: wagons, then the locomotive from L.loco on
  const lx = L.loco ? L.loco - cam - 80 : W + 1;
  g.save(); g.beginPath(); g.rect(0, ROOF_OY + ROOF_SPLIT, Math.max(0, Math.min(W, lx)), H); g.clip();
  tileRows(img, cam, ROOF_SPLIT, img.height - ROOF_SPLIT, ROOF_OY + ROOF_SPLIT); g.restore();
  if (lx < W && loco) {
    // the locomotive: its roof, plus stacks and smoke cut out of the sky (loco_roof.png has a transparent sky)
    g.save(); g.beginPath(); g.rect(Math.max(0, lx), 0, W, H); g.clip();
    tileRows(loco, cam - (L.loco - 80) % loco.width, 0, loco.height, ROOF_OY, true); g.restore();
  }
  // open gaps between the wagons (same geometry as the simulation)
  const top = HORIZON, h = H - HORIZON;
  for (let wx = Math.floor(cam / WAGON) * WAGON - WAGON; wx < cam + W + WAGON; wx += WAGON) {
    if (!trainOn(L, wx + 60) || (L.loco && wx + 60 > L.loco - 80)) continue;
    const x = wx - cam + 40;
    const poly = () => { g.beginPath(); g.moveTo(x, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x - GAP_SLANT, H); g.closePath(); };
    g.save(); poly(); g.clip();
    g.fillStyle = '#0a0806'; g.fillRect(x - 80, top, GAP_W + 120, h);
    for (let yy = top + ((t * 1400) % 26); yy < H; yy += 26) { g.fillStyle = 'rgba(110,80,50,.55)'; g.fillRect(x - 80, yy, GAP_W + 120, 8); }
    g.fillStyle = '#2a2a30'; g.fillRect(x - 60, top + 118, GAP_W + 80, 14);
    g.restore();
    g.fillStyle = '#1a212c'; g.beginPath(); g.moveTo(x, top); g.lineTo(x + 12, top); g.lineTo(x - GAP_SLANT + 12, H); g.lineTo(x - GAP_SLANT, H); g.fill();
    g.fillStyle = '#39465a'; g.beginPath(); g.moveTo(x + GAP_W - 10, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x + GAP_W - GAP_SLANT - 10, H); g.fill();
    g.fillStyle = '#e0b020';
    for (let k = 0; k < 8; k++) { const yy = top + k * 32; const off = (yy - top) / h * GAP_SLANT; g.fillRect(x - 14 - off, yy + 4, 12, 14); g.fillRect(x + GAP_W + 2 - off, yy + 4, 12, 14); }
  }
  g.restore();
  if (a > 0.5 && t - TRAIN.lastT > 0.46) { TRAIN.lastT = t; Audio.noise(0.04, 0.05, 900); Audio.noise(0.04, 0.045, 900, 0.09); }
}
function drawTrain(cam, t, a, portal) {
  if (IMG.train_roof) { drawTrainPainted(cam, t, a, portal); return; }
  g.save();
  g.globalAlpha = a;
  // landscape rushing past (the far layer of the station art, scrolled fast)
  g.save(); g.beginPath(); g.rect(0, 0, W, HORIZON); g.clip();
  // far layer: only the sky and the industrial skyline of the station art (no parked wagons), tiled
  {
    const img = IMG.rail, sh = Math.round(img.height * 0.45), dh = Math.round(sh * 1.15), sc = dh / sh, tw = img.width * sc;   // sky and skyline only
    const off = cam * 0.35 + t * 620;
    for (let i = Math.floor(off / tw); i * tw - off < W; i++) {
      const x = i * tw - off;
      g.save();
      if (i % 2 && !noFlip) { g.translate(x + tw, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, img.width, sh, 0, 0, tw, dh); }
      else g.drawImage(img, 0, 0, img.width, sh, x, 0, tw, dh);
      g.restore();
    }
    const fog = g.createLinearGradient(0, 300, 0, HORIZON);
    fog.addColorStop(0, 'rgba(10,16,34,0)'); fog.addColorStop(1, 'rgba(10,16,34,.9)');
    g.fillStyle = fog; g.fillRect(0, 300, W, HORIZON - 300);
  }
  // mid-distance silhouettes (hills, sheds, trees, pylons) rushing past faster than the far layer
  const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const midOff = cam * 0.7 + t * 1250, step = 90;
  for (let i = Math.floor(midOff / step) - 1; i * step - midOff < W + step; i++) {
    const x = i * step - midOff, r1 = hsh(i), r2 = hsh(i + 91);
    const hgt = 60 + r1 * 140;
    g.fillStyle = '#0c1222';
    if (r2 < 0.35) { g.beginPath(); g.moveTo(x, HORIZON); g.lineTo(x + step / 2, HORIZON - hgt - 30); g.lineTo(x + step, HORIZON); g.fill(); }          // tree / hill
    else if (r2 < 0.7) { g.fillRect(x + 8, HORIZON - hgt, step - 16, hgt); g.fillStyle = 'rgba(255,190,90,.55)'; if (r1 > 0.4) g.fillRect(x + 20, HORIZON - hgt + 16, 8, 6); }   // shed with a lit window
    else { g.fillRect(x + step / 2 - 3, HORIZON - hgt - 60, 6, hgt + 60); g.fillRect(x + step / 2 - 26, HORIZON - hgt - 56, 52, 5); }   // pylon
  }
  g.fillStyle = '#080c16'; g.fillRect(0, HORIZON - 26, W, 26);
  // motion blur streaks
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const y = 250 + (i * 37) % 210, len = 120 + (i * 53) % 260;
    const x = W - ((t * (900 + (i % 5) * 180) + i * 211) % (W + len + 200));
    g.fillStyle = `rgba(255,${190 - (i % 3) * 40},120,${0.08 + (i % 4) * 0.03})`;
    g.fillRect(x, y, len, 2);
  }
  g.globalCompositeOperation = 'source-over';
  // the Veil portal ahead, getting closer during the boss fight
  if (portal > 0) {
    const r = 40 + portal * 260;
    rift(1060, 180, clamp(portal * 2, 0.35, 1), t);
    glowAt(1060, 180, r * 1.4, '#9a3aff', 0.25 + portal * 0.35);
  }
  g.fillStyle = 'rgba(6,8,20,.25)'; g.fillRect(0, 0, W, HORIZON);
  g.restore();
  // the roof of the wagons (walkable floor), moving with the camera
  const top = HORIZON, h = H - HORIZON;
  const grd = g.createLinearGradient(0, top, 0, H);
  grd.addColorStop(0, '#2a3446'); grd.addColorStop(0.08, '#5a6a80'); grd.addColorStop(0.5, '#46546a'); grd.addColorStop(1, '#2c3646');
  g.fillStyle = grd; g.fillRect(0, top, W, h);
  // longitudinal ribs
  for (let i = 0; i < 7; i++) {
    const y = top + 26 + i * 34 + i * i * 1.5;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, W, 3);
    g.fillStyle = 'rgba(190,210,235,.16)'; g.fillRect(0, y - 2, W, 2);
  }
  // transverse panel seams + rivets (perspective: slanted)
  const seam = 96;
  for (let x = -((cam) % seam) - seam; x < W + seam; x += seam) {
    g.strokeStyle = 'rgba(10,14,22,.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 20, top + 6); g.lineTo(x - 30, H); g.stroke();
    g.fillStyle = 'rgba(210,225,240,.35)';
    for (let k = 0; k < 6; k++) { const yy = top + 20 + k * 42, xx = x + 20 - (yy - top) / h * 50 + 6; g.fillRect(xx, yy, 3, 3); }
  }
  // open gaps between the wagons (same geometry as the simulation: gapLeft/GAP_W)
  for (let wx = Math.floor(cam / WAGON) * WAGON - WAGON; wx < cam + W + WAGON; wx += WAGON) {
    if (!trainOn(LEVELS[1], wx + 60) || (LEVELS[1].loco && wx + 60 > LEVELS[1].loco - 80)) continue;
    const x = wx - cam + 40;
    const poly = () => { g.beginPath(); g.moveTo(x, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x - GAP_SLANT, H); g.closePath(); };
    g.save(); poly(); g.clip();
    g.fillStyle = '#0a0806'; g.fillRect(x - 80, top, GAP_W + 120, h);
    // the track rushing below: blurred sleepers and rails
    for (let yy = top + ((t * 1400) % 26); yy < H; yy += 26) { g.fillStyle = 'rgba(110,80,50,.55)'; g.fillRect(x - 80, yy, GAP_W + 120, 8); }
    g.fillStyle = 'rgba(190,200,215,.5)'; g.fillRect(x - 80, top + 60, GAP_W + 120, 3); g.fillRect(x - 80, top + 180, GAP_W + 120, 3);
    // coupling
    g.fillStyle = '#2a2a30'; g.fillRect(x - 60, top + 118, GAP_W + 80, 14);
    g.restore();
    // wagon end walls (depth): dark faces on both sides of the gap
    g.fillStyle = '#1a212c'; g.beginPath(); g.moveTo(x, top); g.lineTo(x + 12, top); g.lineTo(x - GAP_SLANT + 12, H); g.lineTo(x - GAP_SLANT, H); g.fill();
    g.fillStyle = '#39465a'; g.beginPath(); g.moveTo(x + GAP_W - 10, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x + GAP_W - GAP_SLANT - 10, H); g.fill();
    // hazard stripes on the edges
    g.fillStyle = '#e0b020';
    for (let k = 0; k < 8; k++) { const yy = top + k * 32; const off = (yy - top) / h * GAP_SLANT; g.fillRect(x - 14 - off, yy + 4, 12, 14); g.fillRect(x + GAP_W + 2 - off, yy + 4, 12, 14); }
  }
  // roof edge light strip
  g.fillStyle = '#0a0e16'; g.fillRect(0, top - 4, W, 8);
  g.fillStyle = 'rgba(255,190,90,.6)'; for (let x = -((cam * 1) % 60); x < W; x += 60) g.fillRect(x, top - 2, 20, 3);
  g.restore();
  // clack-clack of the rails
  if (a > 0.5 && t - TRAIN.lastT > 0.46) { TRAIN.lastT = t; Audio.noise(0.04, 0.05, 900); Audio.noise(0.04, 0.045, 900, 0.09); }
}
/* chapter 2: the armoured convoy standing at the platform (and leaving, in the boarding scene).
   wx0 = world x of the last wagon; the locomotive is at the front (right). */
const CONVOY = { wagon: 390, gap: 18, n: 4 };
function drawConvoy(cam, t, a = 1, speed = 0) {
  const L = LEVELS[1]; if (!L || !L.train) return;
  const base = HORIZON + 14, x0 = L.train - 1300 - cam;
  if (frameOf('train', 'wagon')) {
    // 1.11: the painted convoy (wagons with the prisoners behind bars, one open, the locomotive at the head)
    g.save(); g.globalAlpha = a;
    const seq = ['wagon', 'wagon', 'wagon_open', 'wagon', 'loco'];
    let x = x0 - 300;
    const jig = speed ? Math.sin(t * 40) * 1.5 : 0;
    for (const k of seq) {
      const f = frameOf('train', k);
      if (x < W + 40 && x + f[2] > -40) spr('train', k, x, base + 6 + jig, { scale: 1 });
      x += f[2] - 6;
    }
    g.restore();
    return;
  }
  g.save(); g.globalAlpha = a;
  const wheel = (x, y) => { g.fillStyle = '#07090e'; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill(); g.strokeStyle = '#4a5260'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 11, t * speed * 0.05, t * speed * 0.05 + 4.5); g.stroke(); };
  for (let i = 0; i < CONVOY.n; i++) {
    const x = x0 + i * (CONVOY.wagon + CONVOY.gap), w = CONVOY.wagon, h = 168, y = base - 26 - h;
    if (x > W + 40 || x + w < -40) continue;
    g.fillStyle = '#10141c'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    const body = g.createLinearGradient(0, y, 0, y + h); body.addColorStop(0, '#46505f'); body.addColorStop(0.5, '#2c3440'); body.addColorStop(1, '#1b212a');
    g.fillStyle = body; g.fillRect(x, y, w, h);
    g.fillStyle = '#58637a'; g.fillRect(x, y, w, 8);                        // roof edge
    for (let k = 1; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + k * w / 6, y + 8, 2, h - 8); }
    g.fillStyle = '#7a2bd0'; g.fillRect(x, y + h - 42, w, 6);                 // purple stripe of the dark convoy
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(160,80,255,${0.25 + Math.sin(t * 4 + i) * 0.1})`; g.fillRect(x, y + h - 44, w, 10); g.globalCompositeOperation = 'source-over';
    // barred windows with the prisoners' hands on the bars
    for (let k = 0; k < 3; k++) {
      const wx = x + 40 + k * 118, wy = y + 34;
      g.fillStyle = '#0a0c12'; g.fillRect(wx, wy, 78, 54);
      g.fillStyle = `rgba(255,190,110,${0.22 + 0.08 * Math.sin(t * 2 + k + i)})`; g.fillRect(wx + 4, wy + 4, 70, 46);
      g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(wx + 39 + Math.sin(t * 1.5 + i * 2 + k) * 8, wy + 50, 16, 22, 0, 0, 7); g.fill();   // a head
      g.fillStyle = '#e8c09a'; if ((i + k) % 2 === 0) { g.fillRect(wx + 18, wy + 18 + Math.sin(t * 6 + k) * 3, 7, 9); g.fillRect(wx + 52, wy + 20 + Math.cos(t * 6 + k) * 3, 7, 9); }
      g.fillStyle = '#8b95a6'; for (let b = 0; b < 5; b++) g.fillRect(wx + 8 + b * 15, wy, 3, 54);
    }
    g.fillStyle = '#20262f'; g.fillRect(x - CONVOY.gap, base - 58, CONVOY.gap, 10);   // coupling
    wheel(x + 50, base - 12); wheel(x + 96, base - 12); wheel(x + w - 96, base - 12); wheel(x + w - 50, base - 12);
  }
  // the locomotive at the head of the convoy
  const lx = x0 + CONVOY.n * (CONVOY.wagon + CONVOY.gap), lw = 560, lh = 210, ly = base - 26 - lh;
  if (lx < W + 60 && lx + lw > -60) {
    g.fillStyle = '#10141c'; g.beginPath(); g.moveTo(lx - 3, ly + 40); g.lineTo(lx + lw - 150, ly - 3); g.lineTo(lx + lw + 4, ly + 90); g.lineTo(lx + lw + 4, ly + lh + 3); g.lineTo(lx - 3, ly + lh + 3); g.fill();
    const lg = g.createLinearGradient(0, ly, 0, ly + lh); lg.addColorStop(0, '#5a2230'); lg.addColorStop(0.5, '#3a1622'); lg.addColorStop(1, '#1e0c12');
    g.fillStyle = lg; g.beginPath(); g.moveTo(lx, ly + 40); g.lineTo(lx + lw - 150, ly); g.lineTo(lx + lw, ly + 90); g.lineTo(lx + lw, ly + lh); g.lineTo(lx, ly + lh); g.fill();
    g.fillStyle = '#0a0c12'; g.fillRect(lx + lw - 250, ly + 30, 120, 60);                   // cab window
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(170,90,255,${0.55 + Math.sin(t * 5) * 0.15})`; g.fillRect(lx + lw - 246, ly + 34, 112, 52);
    glowAt(lx + lw - 10, ly + 140, 120, '#ffe6a0', 0.5); g.globalCompositeOperation = 'source-over';   // headlight
    g.fillStyle = '#e0b020'; for (let k = 0; k < 7; k++) g.fillRect(lx + 20 + k * 60, ly + lh - 30, 30, 10);
    g.fillStyle = '#20262f'; g.fillRect(lx + 60, ly + 4, 34, 40); g.fillRect(lx + 150, ly - 8, 30, 50);   // stacks
    for (let k = 0; k < 6; k++) { const age = (t * 0.9 + k / 6) % 1; g.fillStyle = `rgba(120,110,130,${0.45 * (1 - age)})`; g.beginPath(); g.arc(lx + 165 - age * (80 + speed * 0.3), ly - 20 - age * 120, 16 + age * 40, 0, 7); g.fill(); }
    for (let k = 0; k < 5; k++) wheel(lx + 60 + k * 100, base - 12);
  }
  g.restore();
}
/* chapter 2, on the roof: from L.loco on you are standing on the locomotive */
function drawLocoRoof(cam, t) {
  const L = LEVELS[1]; if (!L || !L.loco) return;
  const x = L.loco - cam;
  if (x > W) return;
  const top = HORIZON, x0 = Math.max(0, x);
  g.save();
  g.fillStyle = 'rgba(110,20,36,.35)'; g.fillRect(x0, top, W - x0, H - top);          // red armour plates
  for (let k = Math.floor((x0 - x) / 140); x + k * 140 < W; k++) {                        // cooling grilles
    const gx = x + 40 + k * 140; if (gx < -140) continue;
    g.fillStyle = 'rgba(10,6,10,.55)'; g.fillRect(gx, top + 40, 90, 34);
    g.fillStyle = 'rgba(255,120,60,.35)'; for (let b = 0; b < 6; b++) g.fillRect(gx + 6 + b * 14, top + 44, 6, 26);
  }
  // exhaust stacks rising from the roof (behind the fighters), smoke streaming back
  for (let k = 0; x + 220 + k * 520 < W + 100; k++) {
    const sx = x + 220 + k * 520; if (sx < -100) continue;
    g.fillStyle = '#1a1016'; g.fillRect(sx, top - 90, 44, 96); g.fillStyle = '#3a2028'; g.fillRect(sx - 6, top - 96, 56, 12);
    for (let j = 0; j < 7; j++) { const age = (t * 1.6 + j / 7) % 1; g.fillStyle = `rgba(110,100,120,${0.5 * (1 - age)})`; g.beginPath(); g.arc(sx + 22 - age * 420, top - 110 - age * 60, 14 + age * 46, 0, 7); g.fill(); }
  }
  if (x > 0) { g.fillStyle = '#e0b020'; for (let k = 0; k < 8; k++) g.fillRect(x - 6 - k * 6, top + 6 + k * 32, 12, 16); }   // where the locomotive begins
  g.restore();
}
function drawTrainForeground(cam, t, a) {
  // catenary poles whizzing past in the foreground, overhead wires
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(20,24,32,.85)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 46 + Math.sin(t * 7) * 2); g.quadraticCurveTo(W / 2, 64, W, 46 + Math.sin(t * 7 + 1) * 2); g.stroke();
  const period = 2.4, k = (t % period) / period;
  const x = W + 200 - k * (W + 800);
  if (x > -200 && x < W + 200) {
    g.fillStyle = 'rgba(8,10,16,.9)';
    g.fillRect(x, 0, 38, H);
    g.fillRect(x - 160, 40, 360, 16);
    g.fillStyle = 'rgba(8,10,16,.35)'; g.fillRect(x + 38, 0, 90, H);   // motion blur
    g.fillStyle = 'rgba(255,200,120,.8)'; g.fillRect(x + 8, 70, 22, 10);
  }
  g.restore();
}

function renderStage(v) {
  const t = v.t;
  const cam = v.cam;
  const tr = trainAmount(v);
  g.save();
  if (FX.shake) g.translate(rand(-1, 1) * FX.shake, rand(-1, 1) * FX.shake);
  if (tr < 1) drawStageBackdrop(v.bg, cam);
  if (tr < 1 && LEVELS[v.lv] && LEVELS[v.lv].train) drawConvoy(cam, t, 1 - tr);
  if (tr > 0) { drawTrain(cam, t, tr, v.hud.portal || 0); if (tr >= 1 && !IMG.train_roof) drawLocoRoof(cam, t); g.translate(Math.sin(t * 23) * tr * 1.2, Math.abs(Math.sin(t * 11)) * tr * 1.5); }
  if (v.hud.tun) drawTunnelBack(t, v.hud.tun);
  if (v.hud.esc !== undefined) drawCollapseBack(cam, t, v.hud.esc);
  if (FX.team && FX.team.arena) { const k = FX.team.t, fade = clamp(Math.min(k * 4, (TEAM_LEN - k) * 4), 0, 1); g.fillStyle = `rgba(4,6,14,${0.5 * fade})`; g.fillRect(-20, -20, W + 40, H + 40); }
  const list = v.d.slice().sort((a, b) => ((a.sy ?? a.y) - (b.sy ?? b.y)) || ((a.z || 0) - (b.z || 0)));
  for (const o of list) drawDrawable(o, cam, t);
  drawParts(cam);
  if (tr > 0 && !v.hud.tun) drawTrainForeground(cam, t, tr);
  if (v.hud.tun) drawTunnelFront(t, v.hud.tun);
  if (v.hud.esc !== undefined) drawCollapseFront(t);
  if (FX.team && FX.team.arena) drawTeamArena(cam);
  g.restore();
  drawHUD(v.hud, t);
  if (v.hud.tw) drawBeamWarning(v.hud.tw, t);
  if (v.hud.vs) drawBossVs(v.hud.vs);
  if (!(FX.team && FX.team.arena)) drawTeamPose();
  else if (FX.team.t < 1.6) ptitle(FX.team.t < 1.5 ? 'COLPO DI SQUADRA!' : 'CANNONE PRIMORDIALE!', W / 2, 170, 30, '#fff6d6', '#ffb03a');
  else ptitle('CANNONE PRIMORDIALE!', W / 2, 170, 34, '#fff6d6', '#ff6a3a');
  if (FX.flash) { g.globalAlpha = Math.min(0.9, FX.flash); g.fillStyle = FX.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}

/* ---------- HUD ---------- */
function drawPortrait(hero, x, y, s = 0.52, dim = false) {
  const hb = 34 * s / 0.52;
  g.save();
  g.beginPath(); g.rect(x - hb, y - hb, hb * 2, hb * 2); g.clip();
  g.fillStyle = dim ? '#1a1f28' : '#0b1824'; g.fillRect(x - hb, y - hb, hb * 2, hb * 2);
  const grd = g.createRadialGradient(x, y, 4, x, y, hb * 1.3);
  grd.addColorStop(0, HEROES[hero].color + '88'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(x - hb, y - hb, hb * 2, hb * 2);
  if (frameOf('faces', 'face_' + hero)) { const f = frameOf('faces', 'face_' + hero); spr('faces', 'face_' + hero, x, y + hb + 2, { scale: (hb * 2.15) / f[3], alpha: dim ? 0.35 : 1 }); }   // 1.9.2 front faces
  else if (HEROES[hero].sheet) heroSpr(hero, 0, x + 2 * s / 0.52, y + hb * 2.3, { scale: 0.62 * (s / 0.52), alpha: dim ? 0.35 : 1 });   // the green sixth Sentinel
  else spr('extra', 'pt_' + HEROES[hero].id, x + 4 * s / 0.52, y + hb, { scale: 0.36 * (s / 0.52), alpha: dim ? 0.35 : 1 });
  g.restore();
  g.strokeStyle = HEROES[hero].color; g.lineWidth = 2; g.strokeRect(x - hb, y - hb, hb * 2, hb * 2);
}

/* key names for the on-screen hints, depending on the device of each local player */
const TOUCH_LABEL = { punch: 'ATTACCO', shoot: 'PISTOLA', jump: 'SALTO', special: 'SPECIALE', dodge: 'SCHIVA', team: 'SQUADRA', start: 'II' };
function keyName(device, action) {
  // labels follow the (possibly customised) key maps
  const kbL = (map) => codeLabel((map[action] || [])[0]);
  const padL = () => PAD_NAMES[(PADMAP[action] || [])[0]] || '?';
  if (!device || device === 'remote') return kbL(KEYMAPS.kb) + '/' + padL();
  if (device.startsWith('pad')) return padL();
  if (device === 'touch') return TOUCH_LABEL[action] || action.toUpperCase();
  if (device === 'kb' || !Game.local.twoKeyboards) return kbL(KEYMAPS.kb);
  return kbL(KEYMAPS[device === 'kbA' ? 'kbA' : 'kbB']);
}
const HUDFX = { trail: [] };
function drawHUD(h, t) {
  const n = h.p.length;
  const pw = n <= 2 ? 380 : 298;
  h.p.forEach((p, i) => {
    const hero = HEROES[p.h];
    const x = n <= 2 ? (i === 0 ? 18 : W - pw - 18) : 14 + i * (pw + 12);
    const y = 14;
    panel(x, y, pw, 92, hero.color);
    drawPortrait(p.h, x + 50, y + 46, 0.52, !!p.out);
    ptxt(`${i + 1}P`, x + 92, y + 24, 12, hero.color);
    ptxt(hero.name, x + 128, y + 24, 12, '#f4f7fa');
    ptxt(String(p.sc).padStart(7, '0'), x + pw - 14, y + 24, 12, '#ffd27a', 'right');
    if (p.out) {
      if (h.cr === 0) { ptxt('NESSUN CREDITO', x + 92, y + 62, 10, '#ff8a7a'); ptxt('RESTA A GUARDARE…', x + 92, y + 80, 9, '#9fb4c8'); return; }
      if (Math.floor(t * 2) % 2) ptxt('PREMI ' + keyName(Game.players[i] && Game.players[i].device, 'punch'), x + 92, y + 62, 10, '#ffe3a0');
      ptxt('PER CONTINUARE (1 CREDITO)', x + 92, y + 80, 9, '#9fb4c8');
      return;
    }
    const v = p.hp / p.mx;
    const tr = HUDFX.trail[i] = Math.max(v, (HUDFX.trail[i] ?? v) - 0.004);
    segBar(x + 92, y + 36, pw - 108, 16, v, tr, v < 0.3 ? (Math.floor(t * 6) % 2 ? '#ff6b5a' : '#ffb35a') : '#58e0a0', 14);
    // energy: marks show how many specials are ready
    segBar(x + 92, y + 62, pw - 170, 8, p.en / 100, 0, p.en >= 40 ? '#5fc2ff' : '#3d6f9a', 5);
    for (let k = 0; k < Math.min(5, p.lv); k++) {
      const lx = x + pw - 64 + k * 13, ly = y + 66;
      g.fillStyle = '#05070c'; g.fillRect(lx - 5, ly - 5, 11, 11);
      g.fillStyle = hero.color; g.fillRect(lx - 4, ly - 4, 9, 9);
      g.fillStyle = '#05070c'; g.fillRect(lx - 3, ly - 1, 7, 3);
    }
    {
      // blaster ammo
      const f = frameOf('items', 'w_gun');
      if (f) g.drawImage(IMG.items, f[0], f[1], f[2], f[3], x + 92, y + 74, f[2] * 0.5, f[3] * 0.5);
      ptxt(`×${p.am ?? 0}`, x + 92 + (f ? f[2] * 0.5 + 4 : 0), y + 86, 9, p.am > 0 ? '#bfe6ff' : '#ff8a7a');
    }
    if (p.cb > 1) ptxt(`${p.cb} COLPI!`, x + pw - 14, y + 88, 11, Math.floor(t * 10) % 2 ? '#fff1c6' : '#ffb03a', 'right');
  });
  if (h.bt !== undefined) { panel(W / 2 - 110, 20, 220, 64, '#c07bff', 0.85); ptitle(String(Math.ceil(h.bt)), W / 2, 72, 40, h.bt < 8 ? '#ffd0c0' : '#fff6d6', h.bt < 8 ? '#ff4a3a' : '#c07bff'); }
  // credits and sigils
  ptxt(h.cr < 0 ? 'CREDITI LIBERI' : `CREDITI ${h.cr}`, 22, H - 14, 9, h.cr === 0 ? '#ff8a7a' : '#9fb4c8');
  if (h.cn !== undefined) { const fc = frameOf('items', 'coin'); if (fc) g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], 200, H - 32, fc[2] * 0.6, fc[3] * 0.6); ptxt(`×${h.cn}`, 226, H - 14, 9, '#ffd35a'); }
  if (h.sg >= 0) ptxt(`SIGILLI ${h.sg || 0}/3`, W - 22, H - 14, 9, '#ffd35a', 'right');
  // team meter
  const full = h.team >= 100;
  const tx = W / 2 - 180, ty = H - 34;
  panel(tx - 14, ty - 26, 388, 44, full ? '#ffd35a' : '#8f7cff', 0.8);
  const grd = g.createLinearGradient(tx, 0, tx + 360, 0);
  HEROES.slice(0, CORE_HEROES).forEach((hh, i) => grd.addColorStop(i / 4, hh.color));
  if (full) drawTeamReady(t);
  if (full) {
    const keys = Game.online === 'client' ? keyName(Game.lastDevice || 'kb', 'team') : [...new Set(Game.players.filter((p) => p.device !== 'gone').map((p) => keyName(p.device, 'team')))].join(' / ') || 'I / LB';
    ptxt(Math.floor(t * 4) % 2 ? `COLPO DI SQUADRA! PREMI ${keys}` : 'COLPO DI SQUADRA PRONTO!', W / 2, ty - 8, 10, Math.floor(t * 4) % 2 ? '#ffffff' : '#ffd35a', 'center');
  } else ptxt('BARRA SQUADRA', W / 2, ty - 8, 9, '#b8c8d7', 'center');
  segBar(tx, ty, 360, 9, h.team / 100, 0, full ? '#ffd35a' : '#9d8cff', 10);
  if (full) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + Math.sin(t * 10) * 0.3; g.fillStyle = grd; g.fillRect(tx, ty, 360, 9); g.restore(); }
  // boss
  if (h.boss) {
    const bx = W / 2 - 280, by = H - 118;
    panel(bx - 14, by - 10, 588, 60, '#ff5a3a', 0.85);
    ptxt(h.boss.n, bx, by + 12, 14, '#ffbe75');
    ptxt(h.boss.t, bx + 560, by + 12, 8, '#e8a0a0', 'right');
    const bv = h.boss.hp / h.boss.mx;
    HUDFX.boss = Math.max(bv, (HUDFX.boss ?? bv) - 0.003);
    segBar(bx, by + 24, 560, 14, bv, HUDFX.boss, '#ff6a3a', 20);
    // phase marks at 2/3 and 1/3
    for (const m of [0.66, 0.33]) { g.fillStyle = bv > m ? '#fff1a6' : '#5a3a3a'; g.fillRect(bx + 560 * m - 2, by + 18, 4, 26); }
    ptxt(`FASE ${bv > 0.66 ? 1 : bv > 0.33 ? 2 : 3}/3`, bx + 280, by + 12, 8, '#ffd35a', 'center');
    if (h.boss.g) {
      ptxt('IN GUARDIA! COLPISCILO ALLE SPALLE O SFONDA LA GUARDIA CON L\'ARMA', W / 2, by - 30, 9, '#bfe6ff', 'center');
      segBar(W / 2 - 120, by - 22, 240, 7, h.boss.gm / 100, 0, '#bfe6ff', 6);
    }
    if (h.boss.br && Math.floor(t * 6) % 2) ptxt('GUARDIA ROTTA! ATTACCA!', W / 2, by - 20, 11, '#ffd35a', 'center');
  } else HUDFX.boss = undefined;
  drawExtraHud(h, t);
  // SCONTRO: tug-of-war bar
  if (h.cl >= 0) {
    const bx = W / 2 - 360, by = 150;
    panel(bx - 20, by - 44, 760, 110, '#ffd35a', 0.92);
    ptitle('SCONTRO! PREMI ATTACCO!', W / 2, by - 12, 22, '#ffffff', Math.floor(t * 8) % 2 ? '#ffd35a' : '#ff6a3a');
    g.fillStyle = '#ff5a3a'; g.fillRect(bx, by + 10, 720, 30);
    g.fillStyle = '#58e0a0'; g.fillRect(bx, by + 10, 720 * h.cl, 30);
    g.fillStyle = '#ffffff'; g.fillRect(bx + 720 * h.cl - 4, by + 4, 8, 42);
    ptxt(h.tn, bx, by + 60, 9, '#58e0a0'); ptxt(h.en, bx + 720, by + 60, 9, '#ff9a7a', 'right');
  }
  if (h.cm >= 2) ptitle(`COMBO ×${h.cm}`, 300, 170, h.cm === 3 ? 30 : 22, '#ffffff', h.cm === 3 ? '#ffb03a' : '#ffd35a');
  if (h.ct && Math.floor(t * 8) % 2) ptitle('CONTRATTACCO!', 300, 210, 20, '#ffffff', '#58e0a0');
  if (h.fu) { ptxt('FURIA', W - 60, 132, 10, Math.floor(t * 6) % 2 ? '#ff5a3a' : '#ffb0a0', 'right'); }
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    const slide = (1 - clamp((h.ban.e || 0) * 5, 0, 1)) * W;
    g.save(); g.globalAlpha = a;
    g.fillStyle = h.ban.b ? 'rgba(40,6,12,.88)' : 'rgba(4,14,26,.86)';
    g.fillRect(-slide, 250, W, h.ban.s ? 112 : 84);
    g.fillStyle = h.ban.b ? '#ff6a4a' : '#ffcf7a'; g.fillRect(-slide, 250, W, 4); g.fillRect(slide, 250 + (h.ban.s ? 108 : 80), W, 4);
    ptitle(h.ban.t, W / 2 - slide, 308, h.ban.t.length > 22 ? 22 : 30, h.ban.b ? '#ffe0d0' : '#fff6d6', h.ban.b ? '#ff6a3a' : '#ffb03a');
    if (h.ban.s) ptxt(h.ban.s, W / 2 + slide, 342, 11, '#e8eef4', 'center');
    g.restore();
  }
  if (h.go) drawGoArrow(t);
}

/* COLPO DI SQUADRA: the whole team gathers, the five weapons fly together
   into the Cannone Primordiale and it fires across the screen (2.6 s) */
const TEAM_LEN = 2.6;
function drawTeamPose() {
  if (!FX.team) return;
  const k = FX.team.t;
  const fade = clamp(Math.min(k * 5, (TEAM_LEN - k) * 5), 0, 1);
  const players = FX.team.heroes.length ? FX.team.heroes : [0];
  const order = [...players, ...[0, 1, 2, 3, 4].filter((h) => !players.includes(h))].slice(0, 5);   // players first, then the others join
  const leader = order[0];
  const slots = [2, 1, 3, 0, 4];            // leader in the middle
  const pos = (i) => [W / 2 + (slots[i] - 2) * 170, 600];
  g.save();
  g.globalAlpha = fade * 0.88; g.fillStyle = '#04060c'; g.fillRect(0, 0, W, H);
  // coloured rays behind (tokusatsu explosion)
  g.globalCompositeOperation = 'lighter';
  order.forEach((hid, i) => {
    const [cx] = pos(i);
    g.fillStyle = HEROES[hid].color; g.globalAlpha = fade * 0.32;
    g.beginPath(); g.moveTo(cx, 620);
    const spread = 0.28;
    g.lineTo(cx + Math.cos(-Math.PI / 2 - spread) * 1200, 620 + Math.sin(-Math.PI / 2 - spread) * 1200);
    g.lineTo(cx + Math.cos(-Math.PI / 2 + spread) * 1200, 620 + Math.sin(-Math.PI / 2 + spread) * 1200);
    g.fill();
  });
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade;
  // rangers slide into the line-up
  order.forEach((hid, i) => {
    const [tx, ty] = pos(i);
    const arrive = clamp((k - i * 0.06) / 0.35, 0, 1);
    const x = lerp(i % 2 ? W + 120 : -120, tx, 1 - Math.pow(1 - arrive, 3));
    const f = k < 0.45 ? 1 : k < 1.1 ? 8 : i === 0 ? 11 : 0;
    drawShadow(x, ty, 40);
    heroSpr(hid, f, x, ty, { scale: 1.2, face: 1, alpha: i < players.length ? 1 : 0.92 });
    // weapons raised over the heads, then flying to the centre
    const fw = frameOf('items', 'w_' + HEROES[hid].id);
    if (k > 0.45 && k < 1.55 && fw) {
      const fly = clamp((k - 1.1) / 0.45, 0, 1);
      const wx = lerp(x + 10, W / 2, fly * fly), wy = lerp(ty - 250, 250, fly * fly);
      g.save(); g.translate(wx, wy); g.rotate(fly * 0.3);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade * 0.6; g.fillStyle = HEROES[hid].color;
      g.beginPath(); g.arc(0, 0, 50, 0, 7); g.fill();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade;
      g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -fw[4] * 0.9, -fw[5] * 0.9, fw[2] * 0.9, fw[3] * 0.9);
      g.restore();
    }
  });
  // the cannon forms, the leader aims it
  if (k > 1.5) {
    const fc = frameOf('items', 'w_cannon');
    const [lx, ly] = pos(0);
    const cx = lx + 40, cy = ly - 118;
    const form = clamp((k - 1.5) / 0.15, 0, 1);
    if (k < 1.65) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - form) * fade; g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, 250, 160 * (1 - form) + 40, 0, 7); g.fill(); g.restore(); }
    const sc = 1.1;
    const recoil = k > 2.0 ? Math.sin(Math.min(1, (k - 2.0) * 6) * Math.PI) * 14 : 0;
    g.save(); g.translate(cx - recoil, cy); g.scale(sc, sc);
    g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], -fc[4], -fc[5], fc[2], fc[3]);
    g.restore();
    const mx = cx + (fc[2] - fc[4]) * sc - 4, my = cy + (fc[3] * 0.55 - fc[5]) * sc;
    if (k < 2.0) {
      // charging: five colours spiral into the muzzle
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = k * 14 + i * 1.256, r = 90 * (2.0 - k) + 10;
        g.fillStyle = HEROES[i].color; g.globalAlpha = fade;
        g.beginPath(); g.arc(mx + Math.cos(a) * r, my + Math.sin(a) * r, 9, 0, 7); g.fill();
      }
      g.globalAlpha = fade * clamp((k - 1.6) * 2.5, 0, 1); g.fillStyle = '#fff'; g.beginPath(); g.arc(mx, my, 10 + (k - 1.6) * 60, 0, 7); g.fill();
      g.restore();
    } else {
      // FIRE
      const f = clamp(1 - (k - 2.0) / 0.6, 0, 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      const bw = 70 * f + 20;
      HEROES.slice(0, CORE_HEROES).forEach((h, i) => { g.globalAlpha = fade * 0.55; g.fillStyle = h.color; g.fillRect(mx, my - bw + i * bw * 0.4, W, bw * 0.4); });
      g.globalAlpha = fade; g.fillStyle = '#ffffff'; g.fillRect(mx, my - bw * 0.35, W, bw * 0.7);
      g.beginPath(); g.arc(mx, my, bw * 1.3, 0, 7); g.fill();
      g.restore();
    }
  }
  const title = k < 1.5 ? 'COLPO DI SQUADRA!' : 'CANNONE PRIMORDIALE!';
  ptitle(title, W / 2, 120, k < 1.5 ? 34 : 40, '#fff6d6', k < 1.5 ? '#ffb03a' : '#ff6a3a');
  if (k < 1.5) ptxt('PRIMAL SENTINELS', W / 2, 160, 14, '#9fe8ff', 'center');
  g.restore();
}

/* ---------- giant duel drawing ---------- */
function renderGiant(v) {
  const t = v.t;
  g.save();
  if (FX.shake) g.translate(rand(-1, 1) * FX.shake, rand(-1, 1) * FX.shake);
  // background pushed back: zoomed out and darker, with the sky tinted
  drawBackdrop(v.bg, 300);
  g.fillStyle = v.pl.fz ? 'rgba(40,10,60,.35)' : 'rgba(6,10,30,.35)'; g.fillRect(0, 0, W, H);
  // ground dust line
  const P = v.pl, E = v.en;
  drawShadow(P.x, 690, 260); drawShadow(E.x, 690, 230);
  // enemy
  if (E.wn) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 25) * 0.25;
    g.fillStyle = E.wn === 'beam' ? '#c07bff' : '#ff6a4a';
    g.beginPath(); g.arc(E.x - 60, 380, 120, 0, 7); g.fill(); g.restore();
    const WARN = { beam: ['RAGGIO!', 'PARATA PERFETTA ALL\'ULTIMO ISTANTE'], charge: ['CARICA!', '◀ + SALTO: SCHIVA · CODATA: INTERROMPI'], stomp: ['ONDA SISMICA!', 'SALTA!'], rain: ['PIOGGIA OSCURA!', 'SPOSTATI!'], grapple: ['PRESA!', 'PREPARATI A PREMERE ATTACCO!'], swipe: ['ARTIGLIATA!', 'PARA AL MOMENTO GIUSTO'] }[E.wn] || ['ATTACCO!', 'PARA'];
    ptitle(WARN[0], E.x - 60, 165, 22, '#ffffff', '#ff6a4a');
    txt(WARN[1], E.x - 60, 196, 16, '#ffe0c0', 'center', 800);
  }
  spr('giants', E.f, E.x, E.y, { scale: E.sc, face: -1, flash: E.fl ? 0.7 : 0, alpha: E.a });
  if (E.bk) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 + Math.sin(t * 16) * 0.15; g.strokeStyle = '#ffd0a0'; g.lineWidth = 10; g.beginPath(); g.ellipse(E.x - 200, 400, 70, 260, 0, Math.PI - 1.3, Math.PI + 1.3); g.stroke(); g.restore(); }
  if (E.st) { g.save(); g.globalAlpha = 0.5 + Math.sin(t * 20) * 0.4; txt('✦ ✦ ✦', E.x, 170, 36, '#fff1a6', 'center', 900); g.restore(); }
  // titan
  const T = TITAN_KINDS[P.k];
  if (P.gl || P.fz) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(P.x, 420, 20, P.x, 420, 340);
    grd.addColorStop(0, P.fz ? '#ffe6a0' : T.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = (P.gl ? 0.6 : 0.28) + Math.sin(t * 12) * 0.1; g.fillStyle = grd; g.fillRect(P.x - 360, 60, 720, 700); g.restore();
  }
  spr('giants', P.f, P.x, P.y, { scale: P.k === 'rex' ? 1.22 : 1, face: 1, flash: P.fl ? 0.6 : 0 });
  if (P.gd) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4 + Math.sin(t * 14) * 0.15;
    g.strokeStyle = '#bfe6ff'; g.lineWidth = 8; g.beginPath(); g.ellipse(P.x + 200, 400, 60, 250, 0, -1.3, 1.3); g.stroke(); g.restore();
  }
  if (P.fin) {
    const k = P.fin;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, k * 2); g.fillStyle = '#fff';
    g.beginPath(); g.arc(P.x + 60, 330, 30 + k * 40, 0, 7); g.fill(); g.restore();
    if (k < 0.9) txt(T.fin, W / 2, 130, 40, '#fff4d0', 'center', 900);
  }
  // shockwave & rain
  if (v.sh) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ff9a5a'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(v.sh, 680, 70, 40, 0, Math.PI, 0); g.fill(); g.restore(); }
  for (const [x, y] of v.rn) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#c07bff'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.restore(); }
  drawParts(0);
  g.restore();
  drawGiantHUD(v.hud, t);
  if (FX.flash) { g.globalAlpha = Math.min(0.9, FX.flash); g.fillStyle = FX.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}

function drawGiantHUD(h, t) {
  panel(16, 14, 530, 100, '#ffd35a'); panel(W - 546, 14, 530, 100, '#ff5a3a');
  ptxt(h.tn, 32, 42, 14, '#ffd35a');
  const tv = h.thp / h.tmx; HUDFX.gt = Math.max(tv, (HUDFX.gt ?? tv) - 0.003);
  segBar(32, 54, 496, 16, tv, HUDFX.gt, '#58e0a0', 16);
  ptxt('ENERGIA', 32, 96, 8, '#9fc8ea');
  segBar(100, 88, 200, 8, h.ten / 100, 0, h.ten >= 50 ? '#5fc2ff' : '#3d6f9a', 2);
  h.p.forEach((p, i) => { g.globalAlpha = p.act ? 1 : 0.5; drawPortrait(p.h, 340 + i * 44, 92, 0.3); g.globalAlpha = 1; });
  ptxt(h.en, W - 32, 42, 14, '#ffbe75', 'right');
  const ev = h.ehp / h.emx; HUDFX.ge = Math.max(ev, (HUDFX.ge ?? ev) - 0.003);
  segBar(W - 528, 54, 496, 16, ev, HUDFX.ge, '#ff6a3a', 16);
  ptxt('EQUILIBRIO', W - 528, 96, 8, '#f0c0a0');
  segBar(W - 430, 88, 250, 8, h.bal / 100, 0, h.stg ? '#fff1a6' : '#f0a05a', 5);
  panel(W / 2 - 590, H - 50, 1180, 36, '#6fd8d3', 0.8);
  const k = (a) => keyName(Game.players[0] && Game.players[0].device, a);
  ptxt(`${k('punch')}×3 ${h.moves[0]} · ${k('shoot')} ${h.moves[1]} · ${k('dodge')} PARATA (AL MOMENTO GIUSTO = PERFETTA) · ${k('jump')} SALTO · ◀+${k('jump')} SCHIVA · ${k('special')} ${h.stg ? h.moves[2] : 'COLPO TITANICO'}`, W / 2, H - 27, 8, h.stg && Math.floor(t * 6) % 2 ? '#fff1a6' : '#c8d6e4', 'center');
  // SCONTRO: tug-of-war bar
  if (h.cl >= 0) {
    const bx = W / 2 - 360, by = 150;
    panel(bx - 20, by - 44, 760, 110, '#ffd35a', 0.92);
    ptitle('SCONTRO! PREMI ATTACCO!', W / 2, by - 12, 22, '#ffffff', Math.floor(t * 8) % 2 ? '#ffd35a' : '#ff6a3a');
    g.fillStyle = '#ff5a3a'; g.fillRect(bx, by + 10, 720, 30);
    g.fillStyle = '#58e0a0'; g.fillRect(bx, by + 10, 720 * h.cl, 30);
    g.fillStyle = '#ffffff'; g.fillRect(bx + 720 * h.cl - 4, by + 4, 8, 42);
    ptxt(h.tn, bx, by + 60, 9, '#58e0a0'); ptxt(h.en, bx + 720, by + 60, 9, '#ff9a7a', 'right');
  }
  if (h.cm >= 2) ptitle(`COMBO ×${h.cm}`, 300, 170, h.cm === 3 ? 30 : 22, '#ffffff', h.cm === 3 ? '#ffb03a' : '#ffd35a');
  if (h.ct && Math.floor(t * 8) % 2) ptitle('CONTRATTACCO!', 300, 210, 20, '#ffffff', '#58e0a0');
  if (h.fu) { ptxt('FURIA', W - 60, 132, 10, Math.floor(t * 6) % 2 ? '#ff5a3a' : '#ffb0a0', 'right'); }
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(30,10,40,.88)'; g.fillRect(0, 250, W, 112);
    g.fillStyle = '#ffd35a'; g.fillRect(0, 250, W, 4); g.fillRect(0, 358, W, 4);
    ptitle(h.ban.t, W / 2, 310, 32, '#fff6d6', '#ffb03a');
    ptxt(h.ban.s, W / 2, 344, 12, '#f0d0ff', 'center');
    g.restore();
  }
}

/* ---------- pop UI: themed GO arrow, button icons and prompts ---------- */
function burst(cx, cy, rx, ry, n) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, k = i % 2 ? 0.78 : 1; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
  g.closePath();
}
/* the silver V of the armours, turned into a chevron with a coloured Heart */
function vChevron(x, y, s, heart, a) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
  g.fillStyle = '#05070c'; g.beginPath(); g.moveTo(-26, -46); g.lineTo(6, -46); g.lineTo(40, 0); g.lineTo(6, 46); g.lineTo(-26, 46); g.lineTo(8, 0); g.closePath(); g.fill();
  const grd = g.createLinearGradient(0, -40, 0, 40); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#9fb0c4'); grd.addColorStop(0.51, '#dfe8f2'); grd.addColorStop(1, '#8a9ab0');
  g.fillStyle = grd; g.beginPath(); g.moveTo(-18, -38); g.lineTo(2, -38); g.lineTo(31, 0); g.lineTo(2, 38); g.lineTo(-18, 38); g.lineTo(11, 0); g.closePath(); g.fill();
  g.fillStyle = '#05070c'; g.beginPath(); g.arc(18, 0, 9, 0, 7); g.fill();
  g.fillStyle = heart; g.beginPath(); g.arc(18, 0, 6.5, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.fillRect(15, -3, 3, 3);
  g.restore();
}
function drawGoArrow(t) {
  const x0 = W - 330, y = 360;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(W - 170, y, 10, W - 170, y, 200); grd.addColorStop(0, 'rgba(255,210,90,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(W - 380, y - 200, 400, 400);
  g.restore();
  HEROES.slice(0, CORE_HEROES).forEach((h, i) => {
    const ph = (t * 2.2 - i * 0.18) % 1;
    const a = Math.max(0, Math.sin(Math.max(0, ph) * Math.PI));
    vChevron(x0 + i * 52 + ph * 20, y, 1.0 + a * 0.12, h.color, 0.35 + a * 0.65);
  });
  ptitle('AVANTI!', W - 190, y - 70, 24, '#fff6d6', '#ffb03a');
}
/* a keyboard key or a gamepad button, with a press animation */
function btnIcon(x, y, device, action, t, scale = 1) {
  const label = keyName(device, action);
  const pad = device && device.startsWith('pad');
  const press = Math.floor(t * 3) % 2 ? 3 : 0;
  g.save(); g.translate(x, y); g.scale(scale, scale);
  if (pad && ['X', 'Y', 'A', 'B'].includes(label)) {
    const col = { X: '#3f86ff', Y: '#f2c230', A: '#58e0a0', B: '#ff4a3d' }[label];
    g.fillStyle = '#05070c'; g.beginPath(); g.arc(0, 3, 21, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(0, press, 18, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(-5, press - 6, 6, 0, 7); g.fill();
    ptxt(label, 0, press + 7, 14, '#10161e', 'center', false);
  } else {
    g.font = `400 12px ${PXFONT}`;
    const w = Math.max(40, g.measureText(label).width + 20), h = 36;
    g.fillStyle = '#05070c'; g.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 9);
    g.fillStyle = '#6a7686'; g.fillRect(-w / 2, -h / 2 + 5, w, h);
    g.fillStyle = '#e8eef4'; g.fillRect(-w / 2, -h / 2 + press, w, h - 5);
    g.fillStyle = '#ffffff'; g.fillRect(-w / 2 + 3, -h / 2 + 3 + press, w - 6, 3);
    ptxt(label, 0, 6 + press, 12, '#10161e', 'center', false);
  }
  g.restore();
}
function localDevice(slot) {
  if (Game.online === 'client') return (Net.lobby.find((p) => p.id === Net.myId) || {}).id === slot + 1 ? (Game.lastDevice || 'kb') : null;
  const p = Game.players[slot];
  return p && p.device !== 'remote' && p.device !== 'gone' ? p.device : null;
}
function drawHint(o, x, y, t) {
  const dev = localDevice(o.pl - 1);
  if (!dev) return;
  const top = y - 190;
  if (o.hint === 'hold') {
    // while holding an enemy: what each button does
    const rows = [['punch', 'GINOCCHIATA'], ['jump', 'LANCIO AVANTI']];
    const back = keyName(dev, 'punch');
    panel(x - 150, top - 76, 300, 118, '#ffe08a', 0.8);
    rows.forEach(([a, label], i) => { btnIcon(x - 100, top - 50 + i * 40, dev, a, 0, 0.62); ptxt(label, x - 56, top - 45 + i * 40, 9, '#ffe08a', 'left'); });
    ptxt(`INDIETRO + ${back}: ALLE SPALLE`, x, top + 30, 8, '#ffe08a', 'center');
    return;
  }
  if (o.hint === 'noammo') { ptitle('SENZA COLPI!', x, top - 20, 12, '#ffffff', '#ff6a5a'); ptxt('RACCOGLI I CARICATORI', x, top, 8, '#ffb0a0', 'center'); return; }
  if (o.hint === 'reviving') { ptitle('RIANIMA…', x, top - 10, 12, '#ffffff', '#7bf0b1'); return; }
  const info = { power: ['special', 'SPRIGIONA IL TUO POTERE!', '#ffd35a'], grab: ['punch', 'AFFERRALO!', '#ffe08a'], jump: ['jump', 'SALTA!', '#9fe8ff'], morph: ['special', 'TRASFORMATI!', o.pc],
    revive: ['punch', 'TIENI PREMUTO: RIANIMA!', '#7bf0b1'], toss: ['punch', 'LANCIA IL COMPAGNO!', '#ffd35a'], pair: ['punch', 'PRESA DOPPIA!', '#ffe08a'] }[o.hint];
  if (!info) return;
  const [act, text, col] = info;
  const bob = Math.sin(t * 6) * 4;
  if (o.hint === 'power') {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(x, y - 80, 10, x, y - 80, 150); grd.addColorStop(0, o.pc + 'aa'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.5 + Math.sin(t * 10) * 0.25; g.fillStyle = grd; g.fillRect(x - 150, y - 230, 300, 300); g.restore();
  }
  ptitle(text, x, top - 26 + bob, o.hint === 'power' ? 16 : 13, '#ffffff', col);
  btnIcon(x, top + bob, dev, act, t, 0.9);
}

function drawTeamReady(t) {
  const y = 176;
  const pulse = 1 + Math.sin(t * 8) * 0.05;
  g.save();
  g.translate(W / 2, y); g.scale(pulse, pulse);
  g.globalCompositeOperation = 'lighter';
  HEROES.slice(0, CORE_HEROES).forEach((h, i) => { const a = t * 2 + i * 1.256; g.fillStyle = h.color; g.globalAlpha = 0.6; g.beginPath(); g.arc(Math.cos(a) * 190, Math.sin(a) * 26, 10, 0, 7); g.fill(); });
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  ptitle('COLPO DI SQUADRA PRONTO!', 0, -8, 20, '#ffffff', '#ffd35a');
  g.restore();
  const devs = Game.online === 'client' ? [Game.lastDevice || 'kb'] : [...new Set(Game.players.filter((p) => p.device !== 'remote' && p.device !== 'gone').map((p) => p.device))];
  devs.slice(0, 4).forEach((d, i) => btnIcon(W / 2 - (devs.length - 1) * 30 + i * 60, y + 28, d, 'team', t, 0.85));
}

/* ---------- platforms drawn as solid boxes: front face + top face ---------- */
/* chapter 6: the hunting press — a steel head hanging from a trolley on an overhead rail */
function drawPressHead(o, x, y, t) {
  const lift = o.pr, bottom = y - 8 - lift, hw = 92, hh = 78;
  g.save();
  // overhead rail across the screen + trolley
  g.fillStyle = '#10141a'; g.fillRect(0, 118, W, 16); g.fillStyle = '#3a4250'; g.fillRect(0, 118, W, 4);
  g.fillStyle = '#e0b020'; for (let k = 0; k < W; k += 60) g.fillRect(k, 128, 30, 6);
  g.fillStyle = '#05070c'; g.fillRect(x - 60, 104, 120, 36); g.fillStyle = '#5a6272'; g.fillRect(x - 56, 108, 112, 26);
  g.fillStyle = '#ff5a3a'; if (o.fl || Math.floor(t * 6) % 2) g.fillRect(x - 6, 112, 12, 8);
  // piston rods
  g.fillStyle = '#05070c'; g.fillRect(x - 38, 134, 20, bottom - hh - 134); g.fillRect(x + 18, 134, 20, bottom - hh - 134);
  g.fillStyle = '#9aa6b6'; g.fillRect(x - 34, 134, 12, bottom - hh - 134); g.fillRect(x + 22, 134, 12, bottom - hh - 134);
  // the head
  g.fillStyle = '#05070c'; g.fillRect(x - hw - 4, bottom - hh - 4, hw * 2 + 8, hh + 8);
  const hg = g.createLinearGradient(0, bottom - hh, 0, bottom); hg.addColorStop(0, '#6a7282'); hg.addColorStop(1, '#2a3038');
  g.fillStyle = hg; g.fillRect(x - hw, bottom - hh, hw * 2, hh);
  g.fillStyle = '#e0b020'; for (let k = 0; k < 7; k++) { g.fillRect(x - hw + 6 + k * 26, bottom - 22, 13, 16); }
  g.fillStyle = '#05070c'; for (let k = 0; k < 7; k++) g.fillRect(x - hw + 19 + k * 26, bottom - 22, 13, 16);
  if (o.fl) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,220,140,.5)'; g.fillRect(x - hw, bottom - hh, hw * 2, hh); }
  g.restore();
}
function drawPlatform(o, x, y, t) {
  const w = o.w, d = o.dp, h = o.h, L = x - w / 2, top = y - h;
  drawShadow(x, y + 4, w * 0.55, 0);
  g.save();
  if (o.pf === 'car' || o.pf === 'rock') {
    // generated sprite, stretched to the platform footprint
    const key = o.pf;
    const f = frameOf('extra', key);
    if (o.pf === 'rock') { glowAt(x, y - h / 2, 120, '#9a3aff', 0.25 + Math.sin(t * 3) * 0.08); }
    spr('extra', key, x, y + (o.pf === 'rock' ? 10 : 6), o.pf === 'car' ? { scale: w / f[2] } : { scale: w / f[2], sy: (h + d * 0.9) / (f[3] * w / f[2]) });
    g.restore();
    return;
  }
  if (false) {
    // top face (roof + bonnet seen from above)
    g.fillStyle = '#05070c'; g.fillRect(L - 3, top - d - 3, w + 6, d + h + 6);
    g.fillStyle = '#8a1e22'; g.fillRect(L, top - d, w, d);
    g.fillStyle = '#b8323a'; g.fillRect(L + 44, top - d + 6, w - 88, d - 12);
    g.fillStyle = '#23303e'; g.fillRect(L + 52, top - d + 10, 40, d - 20); g.fillRect(L + w - 92, top - d + 10, 40, d - 20);
    // front face (side of the car)
    g.fillStyle = '#c93a3a'; g.fillRect(L, top, w, h);
    g.fillStyle = '#e8605a'; g.fillRect(L, top, w, 5);
    g.fillStyle = '#7a1a1e'; g.fillRect(L, y - 14, w, 14);
    g.fillStyle = '#9fd0f0'; g.fillRect(L + 50, top + 6, 44, 16); g.fillRect(L + 102, top + 6, 44, 16);
    g.fillStyle = '#ffd35a'; g.fillRect(L + w - 10, top + 20, 8, 8);
    g.fillStyle = '#ff5a3a'; g.fillRect(L + 2, top + 20, 8, 8);
    for (const wx of [L + 40, L + w - 40]) { g.fillStyle = '#05070c'; g.beginPath(); g.arc(wx, y - 4, 18, 0, 7); g.fill(); g.fillStyle = '#8a96a6'; g.beginPath(); g.arc(wx, y - 4, 8, 0, 7); g.fill(); }
  } else if (o.pf === 'dumpster') {
    g.fillStyle = '#05070c'; g.fillRect(L - 3, top - d - 3, w + 6, d + h + 6);
    g.fillStyle = '#1f4a2a'; g.fillRect(L, top - d, w, d);
    g.fillStyle = '#2f6a3c'; g.fillRect(L + 4, top - d + 4, w - 8, d - 8);
    g.fillStyle = '#3d7a4a'; g.fillRect(L, top, w, h);
    g.fillStyle = '#5c9a66'; g.fillRect(L, top, w, 5);
    g.fillStyle = '#2a5a34'; for (let i = 1; i < 5; i++) g.fillRect(L + i * w / 5, top + 8, 4, h - 18);
    g.fillStyle = '#f2f2f2'; g.fillRect(L + w / 2 - 14, top + h / 2 - 6, 28, 12);
    g.fillStyle = '#05070c'; for (const wx of [L + 16, L + w - 16]) { g.beginPath(); g.arc(wx, y - 2, 7, 0, 7); g.fill(); }
  } else if (o.pf === 'hvac') {
    // rooftop air-conditioning unit: metal box, big fan grille on top, pipes
    g.fillStyle = '#05070c'; g.fillRect(L - 3, top - d - 3, w + 6, d + h + 6);
    g.fillStyle = '#5a6574'; g.fillRect(L, top - d, w, d);
    g.fillStyle = '#2a3038'; g.beginPath(); g.ellipse(L + w * 0.3, top - d / 2, 34, d / 2 - 6, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(L + w * 0.72, top - d / 2, 34, d / 2 - 6, 0, 0, 7); g.fill();
    g.strokeStyle = '#8894a4'; g.lineWidth = 2; for (const cx of [L + w * 0.3, L + w * 0.72]) { const a = t * 18; g.beginPath(); g.moveTo(cx + Math.cos(a) * 28, top - d / 2 + Math.sin(a) * 14); g.lineTo(cx - Math.cos(a) * 28, top - d / 2 - Math.sin(a) * 14); g.stroke(); }
    g.fillStyle = '#788596'; g.fillRect(L, top, w, h);
    g.fillStyle = '#9aa7b8'; g.fillRect(L, top, w, 5);
    g.fillStyle = '#4a5462'; for (let i = 0; i < 9; i++) g.fillRect(L + 14 + i * (w - 28) / 9, top + 18, 10, h - 40);
    g.fillStyle = '#c0392b'; g.fillRect(L + w - 40, top + h - 26, 26, 10);
    g.fillStyle = '#3a4250'; g.fillRect(L - 18, y - 30, 20, 10); g.fillRect(L - 22, y - 34, 8, 34);
  } else if (o.pf === 'cargo') {
    // two stacked steel cargo crates with hazard stripes (the underground factory)
    g.fillStyle = '#05070c'; g.fillRect(L - 3, top - d - 3, w + 6, d + h + 6);
    g.fillStyle = '#2c3a40'; g.fillRect(L, top - d, w, d);
    g.fillStyle = '#3a4c54'; for (let i = 0; i < 8; i++) g.fillRect(L + 6 + i * (w - 12) / 8, top - d + 5, (w - 12) / 8 - 5, d - 10);
    const cg = g.createLinearGradient(0, top, 0, y); cg.addColorStop(0, '#4a6470'); cg.addColorStop(1, '#22323a');
    g.fillStyle = cg; g.fillRect(L, top, w, h);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.07)'; g.fillRect(L + 8 + i * (w - 16) / 14, top + 6, (w - 16) / 14, h - 12); }
    g.fillStyle = '#16202a'; g.fillRect(L, top, 8, h); g.fillRect(L + w - 8, top, 8, h); g.fillRect(L, top, w, 6); g.fillRect(L, y - 8, w, 8);
    g.fillStyle = 'rgba(160,80,40,.45)'; g.fillRect(L + 30, top + h - 30, 40, 18); g.fillRect(L + w - 70, top + 10, 30, 22);   // rust
    g.fillStyle = '#e0b020'; g.fillRect(L + w / 2 - 34, top + 20, 68, 20); g.fillStyle = '#05070c'; g.font = `400 9px ${PXFONT}`; g.textAlign = 'center'; g.fillText('CARGO 07', L + w / 2, top + 34);
  } else if (o.pf === 'shelter') {
    // bus shelter: roof on top, lit advertising panel in front
    g.fillStyle = '#05070c'; g.fillRect(L - 3, top - d - 3, w + 6, d + h + 6);
    g.fillStyle = '#3a4656'; g.fillRect(L, top - d, w, d);
    g.fillStyle = '#56657a'; g.fillRect(L + 4, top - d + 4, w - 8, d - 8);
    g.fillStyle = '#26303c'; g.fillRect(L, top, w, h);
    g.fillStyle = '#8fa3b8'; g.fillRect(L, top, w, 6);
    g.fillStyle = '#9fd6ff'; g.globalAlpha = 0.35; g.fillRect(L + 10, top + 14, w - 110, h - 30); g.globalAlpha = 1;
    const ad = g.createLinearGradient(0, top + 14, 0, y - 16); ad.addColorStop(0, '#ffd35a'); ad.addColorStop(1, '#ff5a3a');
    g.fillStyle = ad; g.fillRect(L + w - 92, top + 14, 80, h - 30);
    g.fillStyle = '#05070c'; g.font = `400 10px ${PXFONT}`; g.textAlign = 'center'; g.fillText('BUS', L + w - 52, top + 40);
    g.fillStyle = '#8fa3b8'; g.fillRect(L + 4, top, 6, h); g.fillRect(L + w - 10, top, 6, h);
  }
  g.restore();
}
/* ---------- the Veil drone (procedural until the sprite sheet arrives) ---------- */
function drawDrone(o, x, y, t) {
  const hurt = o.fl || (o.r && Math.abs(o.r) > 0.5);
  g.save();
  g.translate(x, y - 20); if (o.r) g.rotate(o.r);
  g.globalAlpha = o.a !== undefined ? o.a : 1;
  // rotors
  const sp = Math.sin(t * 60);
  g.fillStyle = 'rgba(200,210,230,.55)'; g.fillRect(-46, -26, 34 * Math.abs(sp) + 4, 3); g.fillRect(12, -26, 34 * Math.abs(sp) + 4, 3);
  g.fillStyle = '#05070c'; g.fillRect(-32, -24, 4, 10); g.fillRect(28, -24, 4, 10);
  // body
  g.fillStyle = '#05070c'; g.beginPath(); g.ellipse(0, 0, 36, 18, 0, 0, 7); g.fill();
  g.fillStyle = hurt ? '#ff6a5a' : '#4a4f62'; g.beginPath(); g.ellipse(0, -1, 32, 14, 0, 0, 7); g.fill();
  g.fillStyle = '#6f768c'; g.fillRect(-26, -10, 52, 4);
  // purple crystal eye
  g.globalCompositeOperation = 'lighter'; g.fillStyle = '#c07bff'; g.beginPath(); g.arc(o.fc * 14, 2, 8 + Math.sin(t * 10) * 2, 0, 7); g.fill();
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ffffff'; g.fillRect(o.fc * 14 - 2, 0, 3, 3);
  // cannon
  g.fillStyle = '#05070c'; g.fillRect(o.fc > 0 ? 10 : -30, 10, 20, 7);
  g.restore();
  if (o.wn) txt('!', x, y - 60, 26, '#ff7a6a', 'center', 900);
  if (o.hb !== undefined) bar(x - 26, y - 56, 52, 4, o.hb, '#b39cff');
}

/* ============================================================
   1.6 — galleria del treno, crollo del capitolo 8, KO, HUD extra
   ============================================================ */
/* a steel beam crossing the whole roof, slanted like the wagon gaps */
function drawBeam(o, x, t) {
  const top = HORIZON, h = H - HORIZON;
  const at = (yy) => x - (yy - top) / h * GAP_SLANT;
  g.save();
  if (o.bm === 'high') {
    // overhead girder at head height: duck under it
    const lift = 150, th = 34;
    // its shadow on the roof shows where it is
    g.fillStyle = 'rgba(0,0,0,.45)';
    g.beginPath(); g.moveTo(at(top) - 30, top); g.lineTo(at(top) + 30, top); g.lineTo(at(H) + 30, H); g.lineTo(at(H) - 30, H); g.fill();
    g.fillStyle = '#05070c';
    g.beginPath(); g.moveTo(at(top) - 26, top - lift - 4); g.lineTo(at(top) + 26, top - lift - 4); g.lineTo(at(H) + 26, H - lift + th + 4); g.lineTo(at(H) - 26, H - lift + th + 4); g.fill();
    const grd = g.createLinearGradient(x - 30, 0, x + 30, 0); grd.addColorStop(0, '#3a2a1a'); grd.addColorStop(0.5, '#c07a2a'); grd.addColorStop(1, '#3a2a1a');
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(at(top) - 22, top - lift); g.lineTo(at(top) + 22, top - lift); g.lineTo(at(H) + 22, H - lift + th); g.lineTo(at(H) - 22, H - lift + th); g.fill();
    g.fillStyle = '#ffd35a';
    for (let k = 0; k < 7; k++) { const yy = top + k * 38; const xx = at(yy); g.fillRect(xx - 20, yy - lift + (yy - top) / h * th + 6, 40, 8); }
    // chains to the ceiling
    g.strokeStyle = 'rgba(20,20,26,.9)'; g.lineWidth = 4;
    for (const yy of [top + 20, top + 200]) { g.beginPath(); g.moveTo(at(yy), 0); g.lineTo(at(yy), yy - lift + 10); g.stroke(); }
  } else {
    // knee-high signal barrier on the roof: jump over it
    const hh = 46;
    g.fillStyle = '#05070c';
    g.beginPath(); g.moveTo(at(top) - 14, top - hh - 4); g.lineTo(at(top) + 14, top - hh - 4); g.lineTo(at(H) + 14, H + 2); g.lineTo(at(H) - 14, H + 2); g.fill();
    for (let yy = top; yy < H; yy += 16) {
      const xx = at(yy);
      g.fillStyle = Math.floor((yy - top) / 16) % 2 ? '#e8e8e8' : '#e03a2a';
      g.fillRect(xx - 11, yy - hh, 22, hh + 2);
    }
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = Math.floor(t * 8) % 2 ? '#ff4a3a' : '#661010';
    g.beginPath(); g.arc(at(top + 40), top + 40 - hh - 8, 9, 0, 7); g.fill();
  }
  g.restore();
}
/* tunnel walls replace the landscape; lamps rushing past */
function drawTunnelBack(t, a) {
  g.save(); g.globalAlpha = a;
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, HORIZON);
  // ribbed vault
  for (let x = -((t * 1500) % 160); x < W; x += 160) {
    g.fillStyle = '#151a22'; g.fillRect(x, 0, 60, HORIZON);
    g.fillStyle = '#07080c'; g.fillRect(x + 60, 0, 8, HORIZON);
  }
  // lamps
  g.globalCompositeOperation = 'lighter';
  for (let x = -((t * 1500) % 480); x < W + 100; x += 480) {
    const grd = g.createRadialGradient(x, 150, 4, x, 150, 150); grd.addColorStop(0, 'rgba(255,200,120,.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - 150, 0, 300, 320);
    g.fillStyle = '#fff4d0'; g.fillRect(x - 18, 146, 36, 6);
  }
  g.restore();
}
function drawTunnelFront(t, a) {
  g.save();
  const flick = 0.5 + 0.06 * Math.sin(t * 37);
  g.globalAlpha = a * flick; g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
  // moving pools of lamp light on the roof
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.5;
  for (let x = -((t * 1500) % 480); x < W + 200; x += 480) {
    const grd = g.createRadialGradient(x, 560, 10, x, 560, 260); grd.addColorStop(0, 'rgba(255,190,110,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - 260, 300, 520, 420);
  }
  g.restore();
}
function drawBeamWarning(kind, t) {
  const x = W - 150, y = 340;
  if (Math.floor(t * 8) % 2) return;
  g.save();
  g.fillStyle = '#05070c'; burst(x, y, 130, 64, 14); g.fill();
  g.fillStyle = '#ff4a3a'; burst(x, y, 122, 58, 14); g.fill();
  g.fillStyle = '#fff8e0'; burst(x, y, 110, 48, 14); g.fill();
  g.restore();
  ptitle(kind === 'high' ? 'ABBASSATI!' : 'SALTA!', x, y - 4, 18, '#ffffff', '#ff4a3a');
  ptxt(kind === 'high' ? 'TIENI SCHIVATA' : 'BARRIERA IN ARRIVO', x, y + 20, 8, '#8a1e10', 'center', false);
  const devs = Game.online === 'client' ? [Game.lastDevice || 'kb'] : [...new Set(Game.players.filter((p) => p.device !== 'remote' && p.device !== 'gone').map((p) => p.device))];
  devs.slice(0, 2).forEach((d, i) => btnIcon(x - (devs.length > 1 ? 34 : 0) + i * 68, y + 70, d, kind === 'high' ? 'dodge' : 'jump', t, 0.8));
}
/* chapter 8: the city falling apart behind the heroes */
function drawCollapseBack(cam, t, k) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const s = (i * 173.3) % 1;
    const x = ((i * 211 - cam * 0.3 - t * 40) % (W + 300) + W + 300) % (W + 300) - 150;
    const y = HORIZON - 60 - ((t * (30 + i * 7) + i * 90) % 420);
    g.globalAlpha = 0.35; spr('extra', 'rock', x, y, { scale: 0.25 + s * 0.3, rot: t * (0.3 + s) + i });
  }
  g.restore();
}
function drawCollapseFront(t) {
  // the void eating the left side of the screen
  g.save();
  const grd = g.createLinearGradient(0, 0, 200, 0);
  grd.addColorStop(0, 'rgba(20,0,40,.95)'); grd.addColorStop(0.5, 'rgba(60,10,110,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 200 + Math.sin(t * 5) * 14, H);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const y = (i * 61 + t * 260 * (1 + (i % 3) * 0.4)) % H;
    g.fillStyle = i % 2 ? '#c07bff' : '#6a2aff'; g.globalAlpha = 0.5;
    g.fillRect(20 + (i * 37) % 120, y, 6 + (i % 3) * 4, 6 + (i % 3) * 4);
  }
  g.restore();
}
/* KO: timer ring, revive progress */
function drawKoRing(o, x, y, t) {
  g.save();
  const cy = y - 130;
  g.strokeStyle = 'rgba(5,7,12,.8)'; g.lineWidth = 9; g.beginPath(); g.arc(x, cy, 26, 0, 7); g.stroke();
  g.strokeStyle = o.ko < 0.3 ? '#ff6a5a' : '#ffd35a'; g.lineWidth = 5; g.beginPath(); g.arc(x, cy, 26, -Math.PI / 2, -Math.PI / 2 + o.ko * Math.PI * 2); g.stroke();
  if (o.rv > 0) { g.strokeStyle = '#7bf0b1'; g.lineWidth = 9; g.beginPath(); g.arc(x, cy, 16, -Math.PI / 2, -Math.PI / 2 + o.rv * Math.PI * 2); g.stroke(); }
  g.restore();
  ptxt('K.O.', x, cy + 5, 10, '#ffffff', 'center');
  if (Math.floor(t * 3) % 2) ptxt('AIUTO!', x, cy - 38, 9, '#ffb0a0', 'center');
}
function fmtTime(s) { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`; }
function drawExtraHud(h, t) {
  if (h.rd) {
    const x = W / 2 - 200, y = 120;
    panel(x - 12, y - 24, 424, 50, '#ff5b4f', 0.85);
    ptxt('TIRANNO ROSSO', x, y - 4, 10, '#ffb0a0');
    ptxt(h.rd[2] ? 'RUGGITO PRONTO' : 'RUGGITO IN CARICA', x + 400, y - 4, 8, h.rd[2] ? '#ffd35a' : '#8a96a6', 'right');
    const v = h.rd[0] / h.rd[1];
    HUDFX.ride = Math.max(v, (HUDFX.ride ?? v) - 0.004);
    segBar(x, y + 6, 400, 10, v, HUDFX.ride, '#ff6a4a', 16);
  } else HUDFX.ride = undefined;
  if (h.sm) {
    const k = keyName(Game.online === 'client' ? Game.lastDevice || 'kb' : Game.players[0] && Game.players[0].device, 'team');
    ptxt(`EVOCAZIONE PRONTA · TIENI ${k}`, 22, H - 32, 8, Math.floor(t * 2) % 2 ? '#ffd35a' : '#ffe9a8');
  }
  if (h.sv !== undefined) { panel(W / 2 - 110, 118, 220, 44, '#ff8a3a', 0.8); ptitle(`ONDATA ${h.sv}`, W / 2, 152, 18, '#fff6d6', '#ff8a3a'); }
  if (h.ta !== undefined) { panel(W / 2 - 100, h.sv !== undefined ? 170 : 118, 200, 40, '#6fd8d3', 0.8); ptxt(fmtTime(h.ta), W / 2, (h.sv !== undefined ? 170 : 118) + 28, 16, '#bff6f2', 'center'); }
  if (h.rush) ptxt(`BOSS RUSH ${h.rush}`, W / 2, 112, 10, '#ffbe75', 'center');
  if (h.esc !== undefined) {
    ptxt('FUGA', W / 2 - 180, 128, 9, '#d0b0ff');
    segBar(W / 2 - 120, 118, 300, 8, h.esc, 0, '#c07bff', 10);
  }
}

/* COLPO DI SQUADRA in the arena (1.6.9): drawn in world space over the real heroes lined up by the simulation */
function drawTeamArena(cam) {
  const T = FX.team, k = T.t, f = T.f || 1;
  const fade = clamp(Math.min(k * 5, (TEAM_LEN - k) * 5), 0, 1);
  const slots = T.slots || [];
  if (!slots.length) return;
  const [lx, ly] = slots[0];
  const X = (x) => x - cam;
  g.save();
  // coloured light columns behind every Sentinel
  g.globalCompositeOperation = 'lighter';
  slots.forEach(([x, y, h], i) => {
    const on = clamp((k - 0.1 - i * 0.07) / 0.3, 0, 1) * fade;
    const w = 46 + Math.sin(k * 20 + i) * 6;
    const grd = g.createLinearGradient(X(x) - w, 0, X(x) + w, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, HEROES[h].color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.45 * on; g.fillStyle = grd; g.fillRect(X(x) - w, 0, w * 2, y);
  });
  g.restore();
  // the Sentinels who are not playing arrive in a flash and join the line
  slots.forEach(([x, y, h, pl], i) => {
    if (pl) return;
    const arrive = 0.15 + i * 0.07;
    if (k < arrive) return;
    const kk = k - arrive;
    const fr = kk < 0.3 ? 4 : k < 1.5 ? 8 : 0;
    drawShadow(X(x), y, 36);
    heroSpr(h, fr, X(x), y, { scale: HERO_SCALE, face: f, alpha: fade });
    if (kk < 0.35) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - kk / 0.35; g.fillStyle = '#fff'; g.fillRect(X(x) - 8, 0, 16, y); g.restore(); }
  });
  // weapons raised over the heads, then flying into the cannon held by the leader
  const cx = X(lx) + f * 34, cy = ly - 112;
  if (k > 0.45 && k < 1.55) {
    const fly = clamp((k - 1.1) / 0.45, 0, 1);
    slots.forEach(([x, y, h]) => {
      const fw = frameOf('items', 'w_' + HEROES[h].id);
      const wx = lerp(X(x), cx, fly * fly), wy = lerp(y - 235, cy, fly * fly);
      g.save(); g.translate(wx, wy); g.rotate(fly * 0.3 * f);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade * 0.55; g.fillStyle = HEROES[h].color;
      g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade;
      if (fw) g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -fw[4] * 0.8, -fw[5] * 0.8, fw[2] * 0.8, fw[3] * 0.8);
      g.restore();
    });
  }
  if (k > 1.5) {
    const fc = frameOf('items', 'w_cannon');
    const form = clamp((k - 1.5) / 0.15, 0, 1);
    if (k < 1.65) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - form) * fade; g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 130 * (1 - form) + 30, 0, 7); g.fill(); g.restore(); }
    const sc = 0.9, recoil = k > 2.0 ? Math.sin(Math.min(1, (k - 2.0) * 6) * Math.PI) * 12 : 0;
    g.save(); g.globalAlpha = fade; g.translate(cx - f * recoil, cy); g.scale(f * sc, sc);
    g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], -fc[4], -fc[5], fc[2], fc[3]);
    g.restore();
    const mx = cx + f * (fc[2] - fc[4]) * sc, my = cy + (fc[3] * 0.55 - fc[5]) * sc;
    g.save(); g.globalCompositeOperation = 'lighter';
    if (k < 2.0) {
      // five colours spiral into the muzzle
      for (let i = 0; i < 5; i++) {
        const a = k * 14 + i * 1.256, rr = 80 * (2.0 - k) + 8;
        g.fillStyle = HEROES[i].color; g.globalAlpha = fade;
        g.beginPath(); g.arc(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, 8, 0, 7); g.fill();
      }
      g.globalAlpha = fade * clamp((k - 1.6) * 2.5, 0, 1); g.fillStyle = '#fff'; g.beginPath(); g.arc(mx, my, 8 + (k - 1.6) * 50, 0, 7); g.fill();
    } else {
      // FIRE: a rainbow beam across the whole arena
      const q = clamp(1 - (k - 2.0) / 0.6, 0, 1), bw = 60 * q + 18;
      const x1 = f > 0 ? W + 40 : -40;
      const L = Math.min(mx, x1), Wd = Math.abs(x1 - mx);
      HEROES.slice(0, CORE_HEROES).forEach((h, i) => { g.globalAlpha = fade * 0.55; g.fillStyle = h.color; g.fillRect(L, my - bw + i * bw * 0.4, Wd, bw * 0.4); });
      g.globalAlpha = fade; g.fillStyle = '#ffffff'; g.fillRect(L, my - bw * 0.35, Wd, bw * 0.7);
      g.beginPath(); g.arc(mx, my, bw * 1.2, 0, 7); g.fill();
    }
    g.restore();
  }
}

/* "CONTRO": presentation of a boss with its strengths and weaknesses (1.7) */
function drawBossVs([key, k, heroes]) {
  const B = BOSSES[key], I = BOSS_INFO[key] || { str: [], weak: [] };
  if (!B) return;
  const s = B.sprite || key;
  const inA = clamp(k / 0.45, 0, 1), out = clamp((k - 4.25) / 0.35, 0, 1);
  const ease = 1 - Math.pow(1 - inA, 3);
  g.save();
  g.globalAlpha = 1 - out;
  g.fillStyle = 'rgba(3,5,12,.82)'; g.fillRect(0, 0, W, H);
  // diagonal split: Sentinels on the left, the boss on the right
  const sl = -W * (1 - ease);
  const grdL = g.createLinearGradient(0, 0, W / 2, 0); grdL.addColorStop(0, '#0b2a4a'); grdL.addColorStop(1, '#10385f');
  g.fillStyle = grdL; g.beginPath(); g.moveTo(sl, 0); g.lineTo(sl + W / 2 + 90, 0); g.lineTo(sl + W / 2 - 90, H); g.lineTo(sl, H); g.fill();
  const sr = W * (1 - ease);
  const grdR = g.createLinearGradient(W / 2, 0, W, 0); grdR.addColorStop(0, '#4a0b12'); grdR.addColorStop(1, '#2a0508');
  g.fillStyle = grdR; g.beginPath(); g.moveTo(sr + W / 2 + 90, 0); g.lineTo(sr + W, 0); g.lineTo(sr + W, H); g.lineTo(sr + W / 2 - 90, H); g.fill();
  // speed lines
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const y = (i * 53 + k * 900) % H; g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, y, W, 3); }
  g.globalCompositeOperation = 'source-over';
  // heroes
  const hs = heroes && heroes.length ? heroes : [0];
  hs.forEach((h, i) => {
    const sp = hs.length <= 2 ? 180 : hs.length === 3 ? 140 : 112, x = sl + 300 + (i - (hs.length - 1) / 2) * sp, y = 520 + (i % 2) * 30;
    glowAt(x, y - 110, 120, HEROES[h].color, 0.35);
    drawShadow(x, y, 40); poseSpr(h, k > 1 ? 1 : 0, x, y, { scale: 1.2, face: 1 });
  });
  // boss
  const p8 = bossPSheet(s);
  const bs = p8 || 'bosses', bk = p8 ? `${s}P_${k > 1.2 && k < 2.4 ? 2 : k >= 2.4 ? 4 : 0}` : `${s}_0`;
  const f = frameOf(bs, bk);
  const bsc = f ? Math.min(2.2, 360 / f[3]) : 1.5;
  glowAt(sr + 960, 380, 220, '#ff5a3a', 0.3);
  drawShadow(sr + 960, 560, 90); spr(bs, bk, sr + 960, 560, { scale: bsc, face: -1 });
  // VS
  if (k > 0.35) {
    const pop = clamp((k - 0.35) / 0.2, 0, 1), sc = 1 + (1 - pop) * 1.5;
    g.save(); g.translate(W / 2, 300); g.scale(sc, sc); g.globalAlpha *= pop;
    ptitle('VS', 0, 30, 90, '#ffffff', '#ffd35a');
    g.restore();
    if (k < 0.7) { g.fillStyle = `rgba(255,255,255,${(0.7 - k) * 2})`; g.fillRect(0, 0, W, H); }
  }
  // name, strengths, weaknesses
  if (k > 0.6) {
    const a = clamp((k - 0.6) * 3, 0, 1);
    g.globalAlpha = (1 - out) * a;
    ptitle(B.name, 960, 90, 34, '#fff6d6', '#ff6a3a');
    ptxt(B.title, 960, 122, 11, '#ffc0b0', 'center');
    panel(730, 590, 520, 116, '#ff5a3a', 0.9);
    ptxt('PUNTI DI FORZA', 750, 614, 10, '#ff9a8a');
    I.str.slice(0, 3).forEach((t2, i) => { if (k > 0.9 + i * 0.25) txt('✚ ' + t2, 750, 640 + i * 22, 14, '#ffd0c8', 'left', 700); });
    panel(30, 590, 560, 116, '#58e0a0', 0.9);
    ptxt('PUNTI DEBOLI · COME BATTERLO', 50, 614, 10, '#7bf0b1');
    I.weak.slice(0, 3).forEach((t2, i) => { if (k > 1.6 + i * 0.25) txt('➜ ' + t2, 50, 640 + i * 22, 14, '#d8ffe8', 'left', 700); });
    ptitle('SENTINELS', sl + 300, 90, 30, '#fff6d6', '#5fc2ff');
  }
  g.globalAlpha = 1 - out;
  if (k > 3.5 && k < 4.1) ptitle('PRONTI…', W / 2, 460, 40, '#ffffff', '#ffb03a');
  else if (k >= 4.1) ptitle('VIA!', W / 2, 470, 64, '#ffffff', '#ff5a3a');
  else if (k > 1 && Math.floor(k * 2) % 2) ptxt('ATTACCO: SALTA', W / 2, 560, 9, '#9fb4c8', 'center');
  g.restore();
}
