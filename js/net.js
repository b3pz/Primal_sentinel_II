'use strict';
/* ============================================================
   RETE — cooperativa online con codice stanza.
   WebRTC peer-to-peer tramite PeerJS (vendor/peerjs.min.js).
   L'host esegue la simulazione e invia le "view"; i client
   inviano solo i propri comandi. Nessun server di gioco:
   serve solo il servizio pubblico di "incontro" di PeerJS.
   Per usare un proprio server: index.html?peer=host:porta
   ============================================================ */
const NET_PREFIX = 'primal-sentinels-ii-';
const NET_VERSION = 3;

const Net = {
  role: null, peer: null, conns: new Map(), hostConn: null, code: '', status: '', error: '',
  myId: 0, remote: {}, lobby: [], lastView: null, prevView: null, viewAt: 0, prevAt: 0, onLobby: null, onStart: null,
  sendT: 0, lastBits: -1, rtt: 0, pingT: 0,

  /* ICE: STUN + a free TURN relay. Phones on 4G/5G (and many home routers)
     sit behind a carrier NAT where a direct link is impossible: without a
     relay the connection never opens, that's why only PC↔PC worked. */
  iceServers() {
    const q = new URLSearchParams(location.search);
    const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
    // Open Relay (metered.ca) static-auth: time-limited credentials computed here
    const user = `${Math.floor(Date.now() / 1000) + 12 * 3600}:primal`;
    const cred = hmacSha1B64('openrelayprojectsecret', user);
    const h = 'staticauth.openrelay.metered.ca';
    ice.push({ urls: [`turn:${h}:80`, `turn:${h}:80?transport=tcp`, `turn:${h}:443`, `turns:${h}:443?transport=tcp`], username: user, credential: cred });
    // your own relay: ?turn=turn:host:3478&tu=user&tp=password  (remembered on this device)
    try {
      if (q.get('turn')) localStorage.setItem('primal-turn', JSON.stringify({ urls: q.get('turn'), username: q.get('tu') || '', credential: q.get('tp') || '' }));
      const t = JSON.parse(localStorage.getItem('primal-turn') || 'null');
      if (t && t.urls) ice.push(t);
    } catch (e) {}
    if (this.extraIce) ice.push(...this.extraIce);
    return ice;
  },
  /* optional: a free Metered.ca key (?metered=app-name&mkey=KEY, remembered) */
  async prepare() {
    this.extraIce = null;
    const q = new URLSearchParams(location.search);
    let m = null;
    try {
      if (q.get('metered') && q.get('mkey')) localStorage.setItem('primal-metered', JSON.stringify({ app: q.get('metered'), key: q.get('mkey') }));
      m = JSON.parse(localStorage.getItem('primal-metered') || 'null');
    } catch (e) {}
    if (!m || !m.app || !m.key || typeof fetch === 'undefined') return;
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = setTimeout(() => ctl && ctl.abort(), 3500);
      const r = await fetch(`https://${m.app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(m.key)}`, ctl ? { signal: ctl.signal } : {});
      clearTimeout(tm);
      const list = await r.json();
      if (Array.isArray(list)) this.extraIce = list;
    } catch (e) {}
  },
  options() {
    const q = new URLSearchParams(location.search);
    const custom = q.get('peer');
    const base = { debug: 1, config: { iceServers: this.iceServers() } };
    if (custom) {
      const [host, port] = custom.split(':');
      return { ...base, host, port: +(port || 9000), path: q.get('peerpath') || '/', secure: q.get('peersecure') === '1' };
    }
    // default public broker; force TLS so it also works when index.html is opened from disk (file://)
    return { ...base, host: '0.peerjs.com', port: 443, path: '/', secure: true };
  },
  available() { return typeof Peer !== 'undefined'; },

  makeCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s;
  },

  /* ---------- fast lane ----------
     Besides PeerJS's reliable channel (lobby, start, bye) every link opens a
     second, UNORDERED and UNRELIABLE data channel: snapshots and controls go
     there, so a lost packet never freezes the next ones (that freeze, plus a
     2-second send queue, was the "lag potentissimo"). */
  openFast(conn, onMsg) {
    const pc = conn.peerConnection;
    if (!pc || conn._fast) return;
    try {
      const ch = pc.createDataChannel('fast', { negotiated: true, id: 3, ordered: false, maxRetransmits: 0 });
      ch.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch (x) {} };
      ch.onclose = () => { if (conn._fast === ch) conn._fast = null; };
      conn._fast = ch;
    } catch (e) {}
    this.probeRoute(conn);
  },
  fastSend(conn, m, dropIfBusy) {
    const ch = conn._fast;
    if (ch && ch.readyState === 'open') {
      if (dropIfBusy && ch.bufferedAmount > 6000) return;
      try { ch.send(JSON.stringify(m)); } catch (e) {}
      return;
    }
    if (!conn.open) return;
    if (dropIfBusy && conn.dataChannel && conn.dataChannel.bufferedAmount > 6000) return;
    try { conn.send(m); } catch (e) {}
  },
  /* direct link or relay? (shown in the lobby, useful to understand the lag) */
  probeRoute(conn) {
    const pc = conn.peerConnection;
    if (!pc || !pc.getStats) return;
    const look = (n) => setTimeout(async () => {
      try {
        const st = await pc.getStats(); let pair = null; const cand = {};
        st.forEach((r) => { if (r.type === 'candidate-pair' && (r.selected || r.nominated) && r.state === 'succeeded') pair = pair && pair.selected ? pair : r; if (r.type === 'local-candidate' || r.type === 'remote-candidate') cand[r.id] = r; });
        if (!pair) { if (n < 6) look(n + 1); return; }
        const relay = [cand[pair.localCandidateId], cand[pair.remoteCandidateId]].some((c) => c && c.candidateType === 'relay');
        this.route = relay ? 'RELAY' : 'DIRETTO';
        if (pair.currentRoundTripTime) this.rtt = pair.currentRoundTripTime * 1000;
      } catch (e) {}
    }, 800 + n * 700);
    look(0);
  },

  /* ---------- host ---------- */
  async host(name, hero) {
    this.reset();
    this.role = 'host';
    this.code = this.makeCode();
    this.status = 'Creazione della stanza…';
    this.myId = 1;
    this.lobby = [{ id: 1, name: name || 'HOST', hero, ready: false, host: true }];
    const tok = this.tok = (this.tok || 0) + 1;
    await this.prepare();
    if (tok !== this.tok || this.role !== 'host') return;
    this.peer = new Peer(NET_PREFIX + this.code, this.options());
    this.peer.on('open', () => { this.status = 'Stanza pronta. Condividi il codice.'; this.pushLobby(); });
    this.peer.on('error', (e) => {
      if (e.type === 'unavailable-id') { this.peer.destroy(); this.host(name, hero); return; }
      if (e.type === 'peer-unavailable' || e.type === 'webrtc') return;   // a guest that failed: not fatal for the room
      this.error = netErrorText(e); this.status = '';
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) {} });
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (this.lobby.length >= 4 || Game.mode !== 'netlobby') { conn.send({ k: 'full', why: Game.mode !== 'netlobby' ? 'La partita è già iniziata.' : 'La stanza è piena (4 giocatori).' }); setTimeout(() => conn.close(), 300); return; }
        const id = Math.max(...this.lobby.map((p) => p.id)) + 1;
        conn._pid = id;
        conn._seen = performance.now();
        this.conns.set(id, conn);
        this.remote[id] = { bits: 0, edge: 0, s: 0 };
        conn.on('data', (m) => this.onHostData(conn, m));
        conn.on('close', () => this.dropClient(id));
        this.openFast(conn, (m) => this.onHostData(conn, m));
      });
    });
  },
  onHostData(conn, m) {
    const id = conn._pid;
    conn._seen = performance.now();
    switch (m.k) {
      case 'hello': {
        if (m.ver !== NET_VERSION) { conn.send({ k: 'full', why: 'Versioni del gioco diverse: aggiornate entrambi.' }); return; }
        if (this.lobby.some((p) => p.id === id)) return;
        const used = this.lobby.map((p) => p.hero);
        let hero = m.hero ?? 0;
        if (used.includes(hero)) hero = [0, 1, 2, 3, 4].find((h) => !used.includes(h));
        this.lobby.push({ id, name: (m.name || 'OSPITE').slice(0, 12), hero, ready: false });
        conn.send({ k: 'welcome', id, code: this.code });
        Audio.sfx('confirm');
        this.pushLobby();
        break;
      }
      case 'pick': {
        const p = this.lobby.find((q) => q.id === id);
        if (p && HEROES[m.hero] && !this.lobby.some((q) => q.id !== id && q.hero === m.hero)) p.hero = m.hero;
        if (p) p.ready = !!m.ready;
        this.pushLobby();
        break;
      }
      case 'in': {
        const r = this.remote[id];
        if (!r) break;
        r.bits = m.b;
        // presses travel on a lossy lane and are repeated a few times: count each one once
        if (m.e && (m.s === undefined || m.s > r.s)) { r.edge |= m.e; if (m.s !== undefined) r.s = m.s; }
        break;
      }
      case 'ping': this.fastSend(conn, { k: 'pong', t: m.t }); break;
    }
  },
  /* WebRTC can take a long time to report a closed tab: use a heartbeat */
  watchdog() {
    const now = performance.now();
    if (this.role === 'host') {
      for (const [id, c] of this.conns) if (c._seen && now - c._seen > 8000) { try { c.close(); } catch (e) {} this.dropClient(id); }
    } else if (this.role === 'client' && Game.online === 'client' && this.viewAt && now - this.viewAt > 9000) {
      Game.connectionLost('Nessun segnale dall\'host da alcuni secondi.');
    }
  },
  dropClient(id) {
    if (!this.conns.has(id)) return;
    const c = this.conns.get(id);
    try { if (c._fast) c._fast.close(); } catch (e) {}
    this.conns.delete(id);
    delete this.remote[id];
    this.lobby = this.lobby.filter((p) => p.id !== id);
    if (Game.mode === 'netlobby') this.pushLobby();
    else Game.playerLeft(id);
  },
  pushLobby() {
    this.broadcast({ k: 'lobby', players: this.lobby, code: this.code });
    if (this.onLobby) this.onLobby();
  },
  broadcast(m) {
    if (m.k === 'v') { this.sendView(m.v, m.v.ev); return; }
    for (const c of this.conns.values()) {
      if (!c.open) continue;
      try { c.send(m); } catch (e) {}
    }
  },
  /* snapshot + the last few event batches (a lost packet doesn't lose sounds/effects) */
  sendView(v, ev) {
    this.seq = (this.seq || 0) + 1;
    if (ev && ev.length) { this.evId = (this.evId || 0) + 1; (this.evHist = this.evHist || []).push([this.evId, ev]); if (this.evHist.length > 4) this.evHist.shift(); }
    const out = { ...v }; delete out.ev;
    const msg = { k: 'v', n: this.seq, t: Math.round(performance.now()), v: out, eb: this.evHist && this.evHist.length ? this.evHist : undefined };
    for (const c of this.conns.values()) this.fastSend(c, msg, true);
  },
  /* control for a remote player (consumes the edges) */
  controlFor(id) {
    const r = this.remote[id];
    if (!r) return EMPTY_CTRL;
    const c = unpackControl(r.bits, r.edge);
    r.edge = 0;
    return c;
  },

  /* ---------- client ---------- */
  async join(code, name, hero) {
    this.reset();
    this.role = 'client';
    this.code = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.status = 'Connessione alla stanza ' + this.code + '…';
    const tok = this.tok = (this.tok || 0) + 1;
    await this.prepare();
    if (tok !== this.tok || this.role !== 'client') return;
    this.peer = new Peer(undefined, this.options());
    const slow = setTimeout(() => { if (!this.myId && !this.error) this.status = 'Collegamento in corso (su rete mobile può servire il relay, attendi)…'; }, 7000);
    const timeout = setTimeout(() => { if (!this.myId && !this.error) { this.error = 'Nessuna risposta. Controlla il codice, che l\'host abbia la stanza aperta e riprova (magari con il Wi-Fi).'; this.status = ''; } }, 30000);
    let tries = 0;
    const dial = () => {
      tries++;
      const conn = this.peer.connect(NET_PREFIX + this.code, { reliable: true, serialization: 'json' });
      // a link that doesn't open in 12 s is dialled again once (ICE sometimes gets stuck)
      setTimeout(() => { if (this.hostConn === conn && !conn.open && !this.myId && !this.error && tries < 2 && this.peer && !this.peer.destroyed) { dial(); try { conn.close(); } catch (e) {} } }, 12000);
      this.hostConn = conn;
      conn.on('open', () => {
        clearTimeout(slow);
        this.openFast(conn, (m) => this.onClientData(m));
        conn.send({ k: 'hello', name, hero, ver: NET_VERSION }); this.status = 'Connesso. In attesa dell\'host…';
      });
      conn.on('data', (m) => this.onClientData(m));
      conn.on('close', () => { if (this.hostConn !== conn) return; clearTimeout(timeout); clearTimeout(slow); if (Game.online === 'client') Game.connectionLost('L\'host ha chiuso la partita.'); else if (this.role === 'client' && !this.error) { this.error = 'Collegamento chiuso dall\'host.'; this.status = ''; } });
      conn.on('error', () => {});
    };
    this.peer.on('open', () => { if (!this.hostConn) dial(); });
    this.peer.on('error', (e) => { clearTimeout(timeout); clearTimeout(slow); this.error = netErrorText(e); this.status = ''; });
    this.peer.on('disconnected', () => { try { if (!this.myId) this.peer.reconnect(); } catch (e) {} });
  },
  onClientData(m) {
    switch (m.k) {
      case 'welcome': this.myId = m.id; Audio.sfx('confirm'); break;
      case 'lobby': this.lobby = m.players; if (this.onLobby) this.onLobby(); break;
      case 'full': this.error = m.why; this.status = ''; break;
      case 'start': if (this.onStart) this.onStart(m); break;
      case 'v': this.onView(m); break;
      case 'pong': { const r = performance.now() - m.t; this.rtt = this.rtt ? this.rtt * 0.7 + r * 0.3 : r; break; }
      case 'bye': Game.connectionLost(m.why || 'Partita terminata dall\'host.'); break;
    }
  },
  /* jitter buffer: snapshots are drawn ~a few frames late but at a steady pace */
  onView(m) {
    const now = performance.now();
    if (m.n !== undefined) {
      if (m.n <= (this.lastN || 0)) return;   // late / duplicated (unordered lane)
      this.lastN = m.n;
    }
    // events: apply each batch once, in order
    const stage = m.v.m === 'stage';
    if (m.eb) for (const [id, ev] of m.eb) if (id > (this.evSeen || 0)) { this.evSeen = id; applyEvents(ev, stage); }
    if (m.v.ev) applyEvents(m.v.ev, stage);   // old hosts
    const t = m.t ?? now;
    const off = now - t;
    const S = this.sync || (this.sync = { offs: [], min: off, D: 90 });
    S.offs.push(off); if (S.offs.length > 90) S.offs.shift();
    S.min = Math.min(...S.offs);
    // delay = typical lateness above the fastest packet (90th percentile) + one send interval
    const late = S.offs.map((o) => o - S.min).sort((a, b) => a - b);
    const want = clamp(late[Math.floor(late.length * 0.9)] + 45, 45, 260);
    S.D += (want - S.D) * (want > S.D ? 0.25 : 0.03);
    this.buf.push({ t, v: m.v });
    if (this.buf.length > 40) this.buf.shift();
    this.prevView = this.lastView; this.lastView = m.v; this.viewAt = now;
  },
  sendInput(c, dt) {
    if (this.role !== 'client' || !this.hostConn || !this.hostConn.open) return;
    const [bits, edge] = packControl(c);
    this.sendT -= dt;
    if (edge) { this.inS = (this.inS || 0) + 1; this.inE = edge; this.inRep = 4; }
    if (this.inRep > 0 || bits !== this.lastBits || this.sendT <= 0) {
      const m = { k: 'in', b: bits, e: 0 };
      if (this.inRep > 0) { m.e = this.inE; m.s = this.inS; this.inRep--; }
      this.fastSend(this.hostConn, m);
      this.lastBits = bits; this.sendT = 0.05;
    }
    this.pingT -= dt;
    if (this.pingT <= 0) { this.pingT = 1; this.fastSend(this.hostConn, { k: 'ping', t: performance.now() }); }
  },
  sendPick(hero, ready) { if (this.hostConn && this.hostConn.open) this.hostConn.send({ k: 'pick', hero, ready }); },

  /* interpolated view for smooth motion between snapshots */
  view() {
    const B = this.buf, v = this.lastView;
    if (!v || !this.sync || B.length < 2) return v;
    if (v.m !== 'stage' && v.m !== 'giant') return v;   // menus / dialogues: newest is best
    const rt = performance.now() - this.sync.min - this.sync.D;   // host time we want to show
    let i = B.length - 1;
    while (i > 0 && B[i - 1].t > rt) i--;
    if (i === 0) return B[0].v;
    const a = B[i - 1], b = B[i];
    // buffer ran dry (lost packets): keep things moving for a moment instead of freezing
    const kMax = rt > b.t ? 1 + Math.min(90, rt - b.t) / (b.t - a.t || 33) : 1;
    if (a.v.m !== b.v.m || (b.v.m !== 'stage' && b.v.m !== 'giant')) return rt >= b.t ? b.v : a.v;
    const k = clamp((rt - a.t) / (b.t - a.t || 1), 0, Math.min(kMax, 2));
    if (b.v.m === 'giant') {
      const L = (p, q) => (p && q ? { ...q, x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) } : q);
      return { ...b.v, pl: L(a.v.pl, b.v.pl), en: L(a.v.en, b.v.en) };
    }
    if (!a.v.d || !b.v.d) return b.v;
    const prev = new Map(a.v.d.map((o) => [o.i, o]));
    const d = b.v.d.map((o) => {
      const p = prev.get(o.i);
      if (!p || Math.abs(p.x - o.x) > 300) return o;   // teleports are not smoothed
      return { ...o, x: lerp(p.x, o.x, k), y: lerp(p.y, o.y, k), z: lerp(p.z || 0, o.z || 0, k) };
    });
    return { ...b.v, d, cam: lerp(a.v.cam, b.v.cam, k) };
  },
  linkText() {
    if (!this.route && !this.rtt) return '';
    return (this.route ? 'COLLEGAMENTO ' + this.route : '') + (this.rtt ? ` · PING ${Math.round(this.rtt)} MS` : '');
  },

  reset() {
    this.tok = (this.tok || 0) + 1;
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.peer = null; this.conns = new Map(); this.hostConn = null; this.role = null; this.myId = 0;
    this.remote = {}; this.lobby = []; this.error = ''; this.status = ''; this.lastView = null; this.prevView = null;
    this.buf = []; this.sync = null; this.lastN = 0; this.evSeen = 0; this.evHist = []; this.seq = 0; this.evId = 0;
    this.route = ''; this.rtt = 0; this.inS = 0; this.inRep = 0; this.viewAt = 0;
  },
  leave() {
    if (this.role === 'host') this.broadcast({ k: 'bye', why: 'L\'host ha lasciato la partita.' });
    setTimeout(() => this.reset(), 150);
  },
};

/* HMAC-SHA1 → base64 (TURN REST credentials), plain JS: works also on http:// and file:// */
function hmacSha1B64(key, msg) {
  const enc = (s) => Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));
  const sha1 = (bytes) => {
    const l = bytes.length, w = [], m = bytes.slice();
    m.push(0x80); while (m.length % 64 !== 56) m.push(0);
    const bl = l * 8; for (let i = 7; i >= 0; i--) m.push(i > 3 ? 0 : (bl >>> (i * 8)) & 255);
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    for (let o = 0; o < m.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (let i = 16; i < 80; i++) { const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]; w[i] = (x << 1) | (x >>> 31); }
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let i = 0; i < 80; i++) {
        const f = i < 20 ? (b & c) | (~b & d) : i < 40 ? b ^ c ^ d : i < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
        const k = i < 20 ? 0x5a827999 : i < 40 ? 0x6ed9eba1 : i < 60 ? 0x8f1bbcdc : 0xca62c1d6;
        const t = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) | 0;
        e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
    }
    const out = []; for (const h of [h0, h1, h2, h3, h4]) out.push((h >>> 24) & 255, (h >>> 16) & 255, (h >>> 8) & 255, h & 255);
    return out;
  };
  let k = enc(key); if (k.length > 64) k = sha1(k);
  while (k.length < 64) k.push(0);
  const inner = sha1(k.map((b) => b ^ 0x36).concat(enc(msg)));
  const mac = sha1(k.map((b) => b ^ 0x5c).concat(inner));
  return btoa(String.fromCharCode(...mac));
}

function netErrorText(e) {
  const t = e && e.type;
  if (t === 'peer-unavailable') return 'Stanza non trovata. Controlla il codice (5 caratteri).';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'Impossibile raggiungere il servizio di collegamento. Serve una connessione a Internet.';
  if (t === 'browser-incompatible') return 'Questo browser non supporta WebRTC.';
  if (t === 'webrtc') return 'La rete ha bloccato il collegamento anche tramite relay. Prova con il Wi-Fi o un\'altra rete.';
  return 'Errore di rete: ' + (t || e);
}
