'use strict';
/* ============================================================
   TOUCH (1.7) — comandi per telefono e tablet: levetta virtuale
   a sinistra (spinta fino in fondo = corsa), pulsanti a destra,
   pausa in alto. Il tocco è un "dispositivo" come la tastiera o
   un controller ('touch'), quindi funziona ovunque: menu del
   cabinato, scelta dei Sentinels, partita, cooperativa online.
   ============================================================ */
const Touch = {
  on: false, held: {}, hit: {}, prev: {}, stick: null, dirs: { l: 0, r: 0, u: 0, d: 0 }, dash: false, tapped: false,
  // [action, label, centre distance from the right edge, from the bottom edge, diameter] in vmin
  BUTTONS: [
    ['punch', 'ATTACCO', 18, 20, 22], ['jump', 'SALTO', 41, 10, 16], ['special', 'SPECIALE', 40, 31, 15],
    ['shoot', 'PISTOLA', 10, 42, 14], ['dodge', 'SCHIVA', 29, 47, 12.5], ['team', 'SQUADRA', 9, 62, 12],
  ],
  init() {
    const coarse = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (!coarse) return;
    this.on = true;
    document.body.classList.add('touch');
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `<div class="tzone" id="tstick"><div class="tbase"><div class="tknob"></div></div></div>
      ${this.BUTTONS.map(([k, label, x, y, s]) => `<div class="tbtn t-${k}" data-k="${k}" style="right:${x}vmin;bottom:${y}vmin;width:${s}vmin;"><span>${label}</span></div>`).join('')}
      <div class="tbtn tpause" data-k="start" style="right:50vw;bottom:calc(100vh - 7vmin);width:9vmin;"><span>II</span></div>`;
    document.body.appendChild(root);
    this.root = root;
    const zone = root.querySelector('#tstick'), base = root.querySelector('.tbase'), knob = root.querySelector('.tknob');
    const rectOf = () => root.getBoundingClientRect();
    // joystick: appears where the thumb lands
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault(); zone.setPointerCapture(e.pointerId);
      const r = rectOf();
      this.stick = { id: e.pointerId, x: e.clientX, y: e.clientY, R: Math.min(r.height * 0.14, r.width * 0.09) };
      base.style.left = `${e.clientX - r.left}px`; base.style.top = `${e.clientY - r.top}px`; base.classList.add('active');
      knob.style.transform = 'translate(-50%,-50%)';
      this.touched();
    });
    const move = (e) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      e.preventDefault();
      let dx = e.clientX - this.stick.x, dy = e.clientY - this.stick.y;
      const R = this.stick.R, m = Math.hypot(dx, dy);
      if (m > R) { dx *= R / m; dy *= R / m; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const k = Math.min(1, m / R), dead = 0.32;
      this.dirs = { l: dx < -R * dead ? 1 : 0, r: dx > R * dead ? 1 : 0, u: dy < -R * dead * 1.1 ? 1 : 0, d: dy > R * dead * 1.1 ? 1 : 0 };
      this.dash = k > 0.93 && Math.abs(dx) > Math.abs(dy) * 1.6;
    };
    const up = (e) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      this.stick = null; this.dirs = { l: 0, r: 0, u: 0, d: 0 }; this.dash = false;
      base.classList.remove('active');
    };
    zone.addEventListener('pointermove', move); zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up);
    // buttons (several at once)
    root.querySelectorAll('.tbtn').forEach((b) => {
      const k = b.dataset.k;
      const down = (e) => { e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); this.held[k] = (this.held[k] || 0) + 1; this.hit[k] = true; b.classList.add('down'); this.touched(); };
      const release = (e) => { if (!this.held[k]) return; this.held[k] = 0; b.classList.remove('down'); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('lostpointercapture', release);
    });
    // a tap anywhere on the canvas (title screen, attract mode) counts as START
    document.querySelector('#game').addEventListener('pointerdown', () => { this.tapped = true; this.touched(); });
    // where the finger landed, in game coordinates (lets you pick a Sentinel by tapping it)
    addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.tbtn, #screen')) return;
      const r = document.querySelector('#game').getBoundingClientRect();
      this.tap = { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }, true);
    // no pinch/double-tap zoom, no scrolling
    document.addEventListener('touchmove', (e) => { if (!e.target.closest || !e.target.closest('#screen')) e.preventDefault(); }, { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
    const rot = document.createElement('div'); rot.id = 'rotate'; rot.innerHTML = '<div class="phone"></div><b>RUOTA IL TELEFONO</b><span>Primal Sentinels si gioca in orizzontale</span>';
    document.body.appendChild(rot);
    // phone turned to portrait or app sent to the background: pause the fight (local games)
    const autoPause = () => { if (typeof Game !== 'undefined' && ['stage', 'giant'].includes(Game.mode) && !Game.online) Game.pause(); };
    addEventListener('resize', () => { if (innerHeight > innerWidth) autoPause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
    addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#touch')) e.preventDefault(); });
  },
  touched() {
    Audio.unlock();
    if (typeof Game !== 'undefined') Game.lastDevice = 'touch';
    // phones: go full screen and landscape on the first touch
    if (!this.fs && document.documentElement.requestFullscreen) {
      this.fs = true;
      document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    }
  },
  read() {
    const c = { l: this.dirs.l, r: this.dirs.r, u: this.dirs.u, d: this.dirs.d, held: {}, pressed: {}, dash: this.dash };
    for (const b of BTN) { c.held[b] = !!(this.held[b] || this.hit[b]); c.pressed[b] = !!this.hit[b]; }
    return c;
  },
  /* start of frame: menus drawn on the canvas understand arrows/Enter/Esc, so translate the touch edges.
     Returns true when it injected keys (so the frame doesn't think the keyboard was used) */
  inject() {
    if (!this.on) return false;
    const m = typeof Game !== 'undefined' ? Game.mode : '';
    if (['stage', 'giant', 'client', 'lobby', 'netlobby', 'shop', 'inter'].includes(m)) return false;
    const pd = this.prevDirs || {}, K = Input.keyEdge, e = (b) => !!this.hit[b];
    let any = false; const set = (k) => { if (!K[k]) { K[k] = true; any = true; } };
    if (this.dirs.l && !pd.l) set('ArrowLeft'); if (this.dirs.r && !pd.r) set('ArrowRight');
    if (this.dirs.u && !pd.u) set('ArrowUp'); if (this.dirs.d && !pd.d) set('ArrowDown');
    if (e('punch') || e('jump') || e('start')) set('Enter');
    if (e('shoot') || e('dodge')) set('Escape');
    if (this.tapped && ['title', 'demo', 'intro', 'cine', 'scores', 'ending'].includes(m)) set('Enter');
    this.tapped = false;
    return any;
  },
  endFrame() {
    if (!this.on) return;
    this.prevDirs = { ...this.dirs };
    this.prev = {}; for (const b of BTN) this.prev[b] = !!(this.held[b] || this.hit[b]);
    this.hit = {}; this.tap = null;
  },
  /* the overlay only shows when it is useful (not over the DOM menus) */
  update() {
    if (!this.on) return;
    const menu = !document.querySelector('#screen').classList.contains('hidden');
    const m = Game.mode;
    const show = !menu && !['title', 'loading', 'menu', 'mmenu', 'cmenu'].includes(m);
    this.root.classList.toggle('hide', !show);
    this.root.classList.toggle('game', ['stage', 'giant', 'client', 'inter'].includes(m));
    this.root.classList.toggle('lobby', m === 'lobby' || m === 'netlobby');
  },
};
