'use strict';
/* ============================================================
   COLONNA SONORA (1.6.4) — musica originale sintetizzata dal gioco,
   in stile arcade anni '90: 4 canali (melodia, basso, arpeggio,
   batteria), sezioni A/B, un tema per capitolo + sigla, boss,
   titani e finale. Nessun file, nessuna licenza da pagare.
   Se in assets/music c'è un MP3 con lo stesso nome, suona quello.

   Notazione della melodia: 8 note per battuta (crome),
   "-" = tieni la nota precedente, "." = pausa, "|" = separatore.
   ============================================================ */
const MUSIC = [
  { name: 'capitolo1', title: 'Porto Aurora', bpm: 150, drums: 'rock', bass: 'drive', arp: 'up',
    chords: 'Am F G Em Am F G E Dm G C E Dm G E E',
    lead: `A4 - C5 - E5 - D5 C5 | F5 - E5 - C5 - A4 - | G4 - B4 - D5 - G5 - | E5 - - - B4 - - - |
           A4 - C5 - E5 - A5 G5 | F5 - E5 D5 C5 - A4 - | B4 - D5 - G5 - F5 - | E5 - - - G#4 - - - |
           D5 - F5 - A5 - G5 F5 | G5 - F5 - D5 - B4 - | C5 - E5 - G5 - C6 - | B5 - - - G#5 - E5 - |
           D5 - F5 A5 - G5 F5 - | D5 - G5 - B5 - D6 - | C6 - B5 - G#5 - E5 - | E5 - - - . . E4 G#4` },
  { name: 'capitolo2', title: 'Il convoglio', bpm: 168, drums: 'train', bass: 'gallop', arp: 'pulse',
    chords: 'Em C D B Em C Am B C D Em Em C D B B',
    lead: `E5 . E5 G5 - F#5 E5 D5 | E5 - - - C5 - D5 - | F#5 . F#5 A5 - G5 F#5 E5 | D#5 - - - B4 - - - |
           E5 . E5 G5 - B5 A5 G5 | A5 - G5 - E5 - C5 - | C5 - E5 - A5 - G5 - | F#5 - - - D#5 - B4 - |
           G5 - - E5 - - G5 - | A5 - - F#5 - - D5 - | B5 - A5 - G5 - F#5 - | E5 - - - - - . . |
           G5 A5 B5 - A5 G5 E5 - | F#5 G5 A5 - G5 F#5 D5 - | D#5 - F#5 - B5 - A5 - | B5 - - - D#5 - F#5 -` },
  { name: 'capitolo3', title: 'La foresta di acciaio', bpm: 138, drums: 'tribal', bass: 'bounce', arp: 'wide',
    chords: 'Dm Bb C Am Dm Bb C A Gm Dm Bb A Gm Bb C A',
    lead: `D5 - - A4 D5 - F5 - | F5 - E5 D5 - - Bb4 - | C5 - - G4 C5 - E5 - | E5 - D5 C5 A4 - - - |
           D5 - - A4 D5 - F5 A5 | Bb5 - A5 G5 F5 - D5 - | E5 - G5 - C6 - Bb5 A5 | A5 - - - C#5 - E5 - |
           G5 - - - Bb5 - A5 G5 | F5 - - - A5 - F5 - | D5 - F5 - Bb5 - A5 G5 | A5 - - - E5 - C#5 - |
           G5 - Bb5 - D6 - C6 Bb5 | D6 - - - Bb5 - F5 - | E5 - G5 - C6 - E5 - | A5 - - - - - . .` },
  { name: 'capitolo4', title: 'Il teatro degli specchi', bpm: 116, drums: 'waltz', bass: 'walk', arp: 'bell',
    chords: 'Bm G Em F# Bm G C F# Em Bm C F# Em Bm G F#',
    lead: `B4 - D5 - F#5 - - - | G5 - F#5 - D5 - B4 - | E5 - G5 - B5 - A#5 - | F#5 - - - . . . . |
           B4 - D5 - F#5 - B5 - | G5 - - F#5 E5 - D5 - | E5 - G5 - C6 - B5 - | A#5 - - - F#5 - - - |
           G5 - F#5 - E5 - - - | F#5 - D5 - B4 - - - | E5 - G5 - C6 - - - | C#6 - A#5 - F#5 - - - |
           G5 - B5 - E6 - D6 - | D6 - C#6 - B5 - F#5 - | G5 - F#5 - E5 - D5 - | C#5 - - - A#4 - - -` },
  { name: 'capitolo5', title: 'Assedio', bpm: 160, drums: 'march', bass: 'drive', arp: 'up',
    chords: 'Cm Ab Bb G Cm Ab Bb G Fm Cm Ab G Fm Ab Bb G',
    lead: `C5 - C5 - Eb5 - G5 - | Ab5 - G5 - Eb5 - C5 - | D5 - D5 - F5 - Bb5 - | B4 - - - D5 - G5 - |
           C6 - Bb5 - G5 - Eb5 - | Ab5 - - - C6 - Ab5 - | Bb5 - F5 - D5 - Bb4 - | B4 - D5 - F5 - G5 - |
           Ab5 - - - F5 - C5 - | G5 - - - Eb5 - C5 - | C6 - Ab5 - Eb5 - C5 - | D5 - - - B4 - G4 - |
           F5 - Ab5 - C6 - - - | Eb6 - - - C6 - Ab5 - | Bb5 - D6 - F6 - D6 - | G5 - - - B5 - D6 -` },
  { name: 'capitolo6', title: 'Il cimitero dei titani', bpm: 112, drums: 'heavy', bass: 'doom', arp: 'low',
    chords: 'Fm Fm Db C Fm Fm Db C Bbm Fm Db C Bbm Db Eb C',
    lead: `F4 - - - Ab4 - C5 - | Db5 - C5 - Ab4 - F4 - | Db5 - - - F5 - Ab5 - | G5 - - - E5 - C5 - |
           F5 - - - Eb5 - C5 - | Ab5 - G5 - F5 - C5 - | Db5 - F5 - Ab5 - Bb5 - | C6 - - - . . . . |
           Bb4 - Db5 - F5 - - - | Ab5 - - - F5 - C5 - | Db5 - - - Ab5 - F5 - | E5 - - - G5 - - - |
           F5 - Ab5 - Db6 - - - | C6 - Ab5 - F5 - Db5 - | Eb5 - G5 - Bb5 - - - | C6 - - - E5 - - -` },
  { name: 'capitolo7', title: 'La Dimensione Oscura', bpm: 144, drums: 'rock', bass: 'octave', arp: 'bell',
    chords: 'F#m G F#m E F#m G A G#m F#m D E C# F#m G F#m F#m',
    lead: `F#5 - G5 - A5 - F#5 - | G5 - - - B5 - A5 G5 | F#5 - C#5 - A4 - C#5 - | E5 - - - G#5 - B5 - |
           A5 - G5 - F#5 - C#6 - | B5 - - - D6 - B5 - | C#6 - E6 - A5 - C#6 - | B5 - - - G#5 - - - |
           A5 - - - F#5 - C#5 - | D5 - F#5 - A5 - D6 - | B5 - - - G#5 - E5 - | F5 - - - G#5 - C#6 - |
           A5 - C#6 - F#6 - E6 - | D6 - B5 - G5 - D5 - | C#5 - F#5 - A5 - G5 - | F#5 - - - - - . .` },
  { name: 'capitolo8', title: "L'ultima alba", bpm: 156, drums: 'epic', bass: 'drive', arp: 'up',
    chords: 'Am F G Em Am F G E F G Em Am F G C E',
    lead: `E5 - A5 - B5 - C6 - | C6 - B5 - A5 - F5 - | G5 - D5 - G5 - B5 - | B5 - - - G5 - E5 - |
           E5 - A5 - C6 - E6 - | D6 - C6 - A5 - F5 - | B5 - D6 - G6 - F6 - | E6 - - - G#5 - B5 - |
           A5 - - - F5 - C6 - | B5 - - - G5 - D6 - | C6 - B5 - G5 - E5 - | A5 - - - C6 - E6 - |
           F6 - E6 - C6 - A5 - | G5 - B5 - D6 - G6 - | E6 - - - C6 - E6 - | G#6 - - - E6 - B5 -` },
  { name: 'sigla', title: 'Primal Sentinels (sigla)', bpm: 140, drums: 'rock', bass: 'drive', arp: 'up',
    chords: 'Am Am F G Am Am F E F G C Am F G E E',
    lead: `A4 - A4 - C5 - D5 - | E5 - - - D5 C5 A4 - | F5 - E5 - D5 - C5 - | D5 - - - B4 - G4 - |
           A4 - A4 - C5 - D5 - | E5 - - - G5 - A5 - | F5 - E5 - D5 - C5 - | B4 - - - G#4 - E4 - |
           C5 - - - F5 - A5 - | B5 - - - G5 - D5 - | E5 - G5 - C6 - B5 - | A5 - - - E5 - C5 - |
           C6 - - - A5 - F5 - | D6 - - - B5 - G5 - | G#5 - B5 - E6 - D6 - | E6 - - - . . E5 G#5` },
  { name: 'boss', title: 'Boss', bpm: 172, drums: 'boss', bass: 'chug', arp: 'tense',
    chords: 'Em F Em F Em F D# B Em F Em F C B C B',
    lead: `E5 - - B4 E5 - F5 - | F5 - E5 - C5 - - - | E5 - - B4 E5 - G5 - | A5 - G5 - F5 - C5 - |
           B4 - E5 - G5 - B5 - | C6 - B5 - A5 - F5 - | D#5 - F#5 - A5 - C6 - | B5 - - - D#5 - F#5 - |
           E6 - - - B5 - - - | C6 - - - A5 - - - | G5 - E5 - B4 - E5 - | F5 - A5 - C6 - F6 - |
           E6 - D6 - C6 - G5 - | F#5 - - - D#5 - B4 - | C6 - B5 - A5 - G5 - | F#5 - - - D#5 - B4 -` },
  { name: 'titani', title: 'I titani', bpm: 128, drums: 'epic', bass: 'octave', arp: 'wide',
    chords: 'D Bb C D D Bb C A Gm D Bb A Gm Bb C D',
    lead: `D5 - - - A5 - - - | Bb5 - A5 - F5 - D5 - | E5 - - - G5 - C6 - | A5 - - - F#5 - D5 - |
           D5 - F#5 - A5 - D6 - | D6 - C6 - Bb5 - F5 - | G5 - C6 - E6 - D6 - | C#6 - - - A5 - E5 - |
           G5 - Bb5 - D6 - - - | A5 - F#5 - D5 - - - | F5 - Bb5 - D6 - F6 - | E6 - - - C#6 - A5 - |
           D6 - - - Bb5 - G5 - | F6 - - - D6 - Bb5 - | E6 - - - G6 - E6 - | F#6 - - - - - . .` },
  { name: 'finale', title: 'Finale', bpm: 100, drums: 'soft', bass: 'half', arp: 'bell',
    chords: 'C G Am F C G F C Am Em F G C G F G',
    lead: `E5 - - - G5 - C6 - | B5 - - - D5 - G5 - | A5 - - - C6 - E5 - | F5 - - - A5 - - - |
           G5 - - - E5 - C5 - | D5 - - - B4 - G5 - | A5 - G5 - F5 - A5 - | G5 - - - - - . . |
           C6 - - - B5 - A5 - | G5 - - - E5 - - - | F5 - A5 - C6 - F6 - | D6 - - - B5 - G5 - |
           C6 - - - E6 - G6 - | D6 - - - B5 - G5 - | A5 - C6 - F6 - E6 - | D6 - - - B5 - - -` },
];
const MUSIC_INDEX = Object.fromEntries(MUSIC.map((s, i) => [s.name, i]));

/* ---------- parsing ---------- */
const NOTE_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteHz(n) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n);
  if (!m) return 0;
  const semi = NOTE_SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  return 440 * Math.pow(2, (semi - 69) / 12);
}
function chordNotes(name) {
  // root in octave 2 (bass) + triad semitones
  const m = /^([A-G])([#b]?)(m?)/.exec(name);
  const root = NOTE_SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const minor = m[3] === 'm';
  return { root, tri: [0, minor ? 3 : 4, 7] };
}
const semiHz = (s) => 440 * Math.pow(2, (s - 69) / 12);
function compile(song) {
  const toks = song.lead.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
  const bars = Math.ceil(toks.length / 8);
  // melody events on a 16th grid: [step, hz, lengthInSteps]
  const ev = [];
  let last = null;
  toks.forEach((t, i) => {
    if (t === '-') { if (last) last[2] += 2; return; }
    if (t === '.') { last = null; return; }
    last = [i * 2, noteHz(t), 2]; ev.push(last);
  });
  const chords = song.chords.split(/\s+/).map(chordNotes);
  song._c = { bars, lead: ev, chords, len: bars * 16 };
}
MUSIC.forEach(compile);

/* ---------- drum patterns (16 steps): K kick · S snare · H hat · O open hat · T tom ---------- */
const DRUMS = {
  rock: ['K.H.S.H.K.KHS.H.', 'K.H.S.H.K.H.S.HO'],
  train: ['KHHHSHHHKHHHSHKH', 'KHHHSHHHKHKHSSSS'],
  tribal: ['K.T.S.T.K.TTS.T.', 'K.T.S.TKK.T.STTT'],
  waltz: ['K...H...S...H...', 'K...H...S...H.S.'],
  march: ['K.H.S.HSK.H.S.HS', 'K.H.S.HSKKH.SSSS'],
  heavy: ['K...S..KK...S...', 'K...S..KK.K.S.SS'],
  epic: ['K.HKS.H.K.HKS.HO', 'K.HKS.H.KKHKSSSS'],
  boss: ['KHKHSHKHKHKHSHKH', 'KHKHSHKHKHKHSSSS'],
  soft: ['K.......S.......', 'K...H...S...H...'],
};

/* ---------- the 4-channel player, replaces the old 2-voice loop ---------- */
Object.assign(Audio, {
  playSong(i, name) {
    name = name || this.FILES[i] || '';
    const idx = MUSIC_INDEX[name] ?? (i % MUSIC.length);
    if (this.musicOn && this.song === idx && this.trackName === name) return;
    this.song = idx; this.musicOn = true; this.step = 0; this.next = 0;
    this.playFile(name);
  },
  mtone(f, d, type, vol, slide, when) { this.tone(f, d, type, vol * 1.8, slide, when); },
  mnoise(d, vol, hp, when) { this.noise(d, vol * 1.8, hp, when); },
  update() {
    if (!this.ctx || !this.musicOn || this.muted) return;
    if (this.track && this.fileOK[this.trackName] !== false) return;   // MP3 playing (or loading)
    const S = MUSIC[this.song % MUSIC.length], C = S._c;
    const sd = 60 / S.bpm / 4;   // one 16th
    const now = this.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05;
    this.out = this.musicBus;
    while (this.next < now + 0.15) {
      const st = this.step % C.len, bar = Math.floor(st / 16), s = st % 16, when = this.next - now;
      const ch = C.chords[bar % C.chords.length];
      const bassSemi = 36 + ch.root + (ch.root > 6 ? -12 : 0) + 12;   // around A1-G2
      // --- lead
      for (const [at, hz, len] of C.lead) if (at === st && hz) {
        const d = Math.min(len * sd * 0.95, 1.4);
        this.mtone(hz, d, 'square', 0.03, 1, when);
        this.mtone(hz * 1.004, d, 'triangle', 0.018, 1, when);   // slight chorus
        if (len >= 6) this.mtone(hz * 2, d * 0.5, 'sine', 0.006, 1, when + 0.02);
      }
      // --- bass
      const bassPat = {
        drive: [1, 0, 12, 0, 1, 0, 12, 0, 1, 0, 12, 0, 1, 0, 12, 0], gallop: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 12, 7],
        bounce: [1, 0, 0, 7, 0, 0, 12, 0, 1, 0, 0, 7, 0, 12, 0, 7], walk: [1, 0, 0, 0, 3, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0],
        doom: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 7, 0, 6, 0], octave: [1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 7, 12],
        chug: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 12, 13], half: [1, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0],
      }[S.bass];
      const b = bassPat[s];
      if (b) {
        const semi = bassSemi + (b === 1 ? 0 : b);
        const long = S.bass === 'half' || S.bass === 'doom' || S.bass === 'walk';
        this.mtone(semiHz(semi), sd * (long ? 3.5 : 0.9), 'triangle', 0.075, 1, when);
        this.mtone(semiHz(semi), sd * (long ? 2 : 0.6), 'square', 0.012, 1, when);
      }
      // --- arpeggio (chord tones, soft pulse)
      const arpOn = { up: s % 2 === 0, pulse: s % 2 === 1, wide: s % 4 !== 3, bell: s % 4 === 0, low: s % 8 === 0, tense: true }[S.arp];
      if (arpOn) {
        const seq = S.arp === 'wide' ? [0, 1, 2, 1] : S.arp === 'tense' ? [0, 2, 1, 2] : [0, 1, 2];
        const k = Math.floor(s / (S.arp === 'bell' ? 4 : S.arp === 'low' ? 8 : 2));
        const semi = 60 + ch.root + ch.tri[seq[k % seq.length]] + (S.arp === 'low' ? -12 : S.arp === 'bell' ? 12 : 0);
        this.mtone(semiHz(semi), sd * (S.arp === 'bell' ? 3 : 0.8), S.arp === 'bell' ? 'sine' : 'square', S.arp === 'bell' ? 0.02 : 0.008, 1, when);
      }
      // --- drums
      const pats = DRUMS[S.drums];
      const d = pats[bar % 4 === 3 ? 1 : 0][s];
      if (d === 'K') { this.mtone(120, 0.14, 'sine', 0.16, 0.35, when); this.mnoise(0.03, 0.03, 900, when); }
      else if (d === 'S') { this.mnoise(0.13, 0.08, 1400, when); this.mtone(200, 0.07, 'triangle', 0.05, 0.6, when); }
      else if (d === 'H') this.mnoise(0.025, 0.022, 7000, when);
      else if (d === 'O') this.mnoise(0.12, 0.022, 6000, when);
      else if (d === 'T') this.mtone(150, 0.16, 'sine', 0.1, 0.55, when);
      if (s === 0 && bar % 8 === 0) this.mnoise(0.6, 0.03, 4500, when);   // crash at each section
      this.step++;
      this.next += sd;
    }
    this.out = this.sfxBus;
  },
});
