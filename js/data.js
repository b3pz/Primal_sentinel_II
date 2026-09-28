'use strict';
/* ============================================================
   PRIMAL SENTINELS — dati di gioco
   Eroi, nemici, boss, oggetti, capitoli e testi della storia.
   ============================================================ */

const HEROES = [
  { id: 'ignis', name: 'IGNIS', civil: 'Ciusky', role: 'Equilibrato', color: '#ff5b4f', glow: '#ff8a5a', power: 1.0, speed: 250, hp: 120,
    special: 'LAMA DI FUOCO', weapon: 'SPADA ZANNA', specialText: 'Onda di fuoco in avanti (media distanza)', titan: 'Tiranno rosso',
    trait: 'FIAMMA: i colpi di spada incendiano i nemici', pro: 'Equilibrato, danni nel tempo', con: 'Nessun vantaggio in difesa' },
  { id: 'azur', name: 'AZUR', civil: 'Beps', role: 'Tecnico', color: '#5d9bff', glow: '#8cc4ff', power: 0.95, speed: 262, hp: 115,
    special: 'CARICA DEL TRICORNO', weapon: 'LANCIA TRICORNO', specialText: 'Affondo in carica (media distanza)', titan: 'Triceratopo blu',
    trait: 'PORTATA: la lancia colpisce più lontano', pro: 'Tiene i nemici a distanza', con: 'Meno vita di Ignis' },
  { id: 'lyra', name: 'LYRA', civil: 'Kathy', role: 'Veloce', color: '#f7d046', glow: '#ffe98a', power: 0.85, speed: 300, hp: 105,
    special: 'DANZA DEI PUGNALI', weapon: 'PUGNALI FELINI', specialText: 'Raffica di fendenti (da vicino)', titan: 'Felino giallo',
    trait: 'DOPPIO SALTO: salta di nuovo in aria', pro: 'La più veloce, agilissima', con: 'Poca vita, colpi leggeri' },
  { id: 'aura', name: 'AURA', civil: 'Kiki', role: 'Distanza', color: '#ff78bb', glow: '#ffb2da', power: 0.9, speed: 268, hp: 110,
    special: 'PIOGGIA D\'ALA', weapon: 'ARCO D\'ALA', specialText: 'Tre frecce alate (da lontano)', titan: 'Pterosauro rosa',
    trait: 'PLANATA: tieni SALTO in aria per planare', pro: 'Colpisce da lontano, ottima contro i droni', con: 'Debole nel corpo a corpo' },
  { id: 'onyx', name: 'ONYX', civil: 'Dilik', role: 'Potente', color: '#b9c6d4', glow: '#e3ecf5', power: 1.25, speed: 222, hp: 140,
    special: 'SCURE TELLURICA', weapon: 'ASCIA ZANNA', specialText: 'Colpo d\'ascia che spacca il suolo (da vicino)', titan: 'Mastodonte nero',
    trait: 'CORAZZA: i colpi leggeri non lo fermano', pro: 'Il più forte e resistente', con: 'Il più lento' },
  // sbloccabile: finisci la storia una volta
  // il sesto Sentinel: liberato dalla corazza di Vespera, Kharon indossa l'armatura verde del primo pilota
  { id: 'kharon', name: 'SIRIO', civil: 'Sirio', role: 'Sesto Sentinel', color: '#3fd06a', glow: '#9dffbf', power: 1.1, speed: 245, hp: 130,
    special: 'ONDA DEL TRAGHETTATORE', weapon: 'SPADA DEL PRIMO PILOTA', specialText: 'Due onde di spada rasoterra (lunga distanza)', titan: 'Tiranno rosso', sheet: 'bosses', unlock: true,
    trait: 'PARATA: SCHIVATA da fermo per parare', pro: 'Forte e completo, onde a lunga distanza', con: 'Parare richiede tempismo' },
];
/* i cinque Sentinels "di base" (Kharon è un personaggio extra) */
const CORE_HEROES = 5;
/* titano evocabile da ogni eroe (fotogrammi beast_<nome>_run/roar dell'atlante giants) */
const BEAST_OF = ['rex', 'tri', 'cat', 'ptero', 'mammoth', 'dragon'];
const BEAST_NAME = { rex: 'TIRANNO ROSSO', tri: 'TRICERATOPO BLU', cat: 'FELINO GIALLO', ptero: 'PTEROSAURO ROSA', mammoth: 'MASTODONTE NERO', dragon: 'DRAGO VERDE' };
/* costumi alternativi (ricolorazioni) */
const SKINS = [
  { name: 'ORIGINALE' },
  { name: 'OMBRA', filter: 'brightness(0.62) saturate(0.55) contrast(1.35) hue-rotate(200deg)', tint: '#241040', need: 'Trova 12 Sigilli dei Titani' },
  { name: 'ORO', filter: 'sepia(1) saturate(2.4) brightness(1.12) hue-rotate(-8deg) contrast(1.08)', tint: '#ffc23a', need: 'Completa la storia' },
];
/* Boris, the second robot: the same model as Astro, painted steel blue and a bit bigger */
SKINS.boris = { name: 'BORIS', filter: 'hue-rotate(175deg) saturate(0.85) brightness(0.82) contrast(1.2)', tint: '#4a78b8' };

/* Frame convention of the fighters atlas (per character):
   0 guardia · 1-3 camminata · 4 caricamento · 5 pugno · 6 calcio · 7 colpito */

const ENEMIES = {
  soldier: { sheet: 'fighters', pre: 'soldier', name: 'Senzavolto', hp: 55, speed: 110, dmg: 9, reach: 88, scale: 0.86, score: 200, wind: 0.5, aggro: 1 },
  lancer: { sheet: 'fighters', pre: 'lancer', name: 'Lama Oscura', hp: 48, speed: 165, dmg: 11, reach: 96, scale: 0.86, score: 260, wind: 0.36, aggro: 1.35, lunge: true },
  brute: { sheet: 'fighters', pre: 'brute', name: 'Bruto di ruggine', hp: 120, speed: 80, dmg: 17, reach: 104, scale: 1.02, score: 450, wind: 0.75, aggro: 0.8, heavy: true },
  segment: { sheet: 'bosses', pre: 'centipede', name: 'Segmento', hp: 60, speed: 150, dmg: 10, reach: 105, scale: 0.62, score: 350, wind: 0.45, aggro: 1.2, villain: true, lunge: true },
  drone: { sheet: 'extra', pre: 'drone', name: 'Drone Oscuro', hp: 30, speed: 170, dmg: 8, reach: 420, scale: 0.8, score: 350, wind: 0.55, aggro: 1, flying: true },
  shield: { sheet: 'extra', pre: 'shield', name: 'Scudato', hp: 80, speed: 85, dmg: 12, reach: 100, scale: 0.86, score: 450, wind: 0.6, aggro: 0.9, shield: true },
  grenadier: { sheet: 'extra', pre: 'grenadier', name: 'Granatiere', hp: 50, speed: 100, dmg: 14, reach: 90, scale: 0.86, score: 400, wind: 0.7, aggro: 0.8, ranged: true },
  dog: { sheet: 'extra', pre: 'dog', name: 'Mastino meccanico', hp: 34, speed: 230, dmg: 8, reach: 96, scale: 0.86, score: 250, wind: 0.3, aggro: 1.6, lunge: true },
  ninja: { sheet: 'extra', pre: 'ninja', name: 'Ninja Oscuro', hp: 60, speed: 175, dmg: 12, reach: 104, scale: 0.86, score: 500, wind: 0.38, aggro: 1.3, blink: true },
  // Primal Sentinels II: i soldati di Ferrea
  fante: { sheet: 'ferrea', pre: 'fante', name: 'Fante di Ferrea', hp: 58, speed: 115, dmg: 10, reach: 110, scale: 0.86, score: 220, wind: 0.5, aggro: 1.05, lunge: true },
  bruto: { sheet: 'ferrea', pre: 'bruto', name: 'Bruto di Ferrea', hp: 140, speed: 78, dmg: 18, reach: 112, scale: 0.86, score: 480, wind: 0.8, aggro: 0.8, heavy: true },
  shade: { sheet: 'fighters', pre: 'HERO', name: 'Copia oscura', hp: 70, speed: 150, dmg: 12, reach: 96, scale: 0.86, score: 500, wind: 0.42, aggro: 1.3, shade: true },
};

/* Boss frames: villains 0 guardia · 1-2 passo · 3 carica · 4 attacco · 5 colpito.
   Mastice has 8 frames: 0-2 passo · 3 carica · 4 pugno · 5 schianto · 6 colpito · 7 a terra */
/* punti di forza e deboli mostrati nella presentazione "CONTRO" prima di ogni boss */
const BOSS_INFO = {
  mastice: { str: ['Pugni devastanti', 'Schianto ad area (guarda il cerchio)', 'Carica a testa bassa'], weak: ['Lentissimo', 'Scoperto dopo lo schianto', 'Colpiscilo alle spalle'] },
  centipede: { str: ['Si divide in segmenti', 'Affondi rapidi', 'Artigli a lunga portata'], weak: ['I segmenti hanno poca vita', 'Fermo dopo l\'affondo', 'Pistola da lontano'] },
  trivor: { str: ['Trivella in carica', 'Si interra e riemerge sotto di te', 'Colpi pesanti'], weak: ['Il cerchio a terra lo tradisce', 'Lento a girarsi', 'Scoperto dopo la trivella'] },
  mimesi: { str: ['Crea copie oscure', 'Fendenti velocissimi', 'Copia le vostre mosse'], weak: ['Poca resistenza', 'Distruggi prima le copie', 'Speciale ad area'] },
  rigel: { str: ['Lama di luce veloce', 'Raggio dal palmo a distanza', 'Para i colpi frontali'], weak: ['Dopo il raggio resta scoperto', 'Ferito: combatte da solo da troppo', 'Colpiscilo alle spalle'] },
  kharon: { str: ['Para i colpi frontali', 'Onde di spada', 'Affondi rapidi'], weak: ['Si gira lentamente in guardia', 'Le armi sfondano la guardia', 'Colpiscilo alle spalle'] },
  custode: { str: ['Sfere che inseguono', 'Rinforzi continui', 'Spazzate ampie'], weak: ['Lento', 'Le sfere si schivano in verticale', 'Colpi pesanti da vicino'] },
  kharon2: { str: ['Più veloce e aggressivo', 'Doppia onda di spada', 'Para i colpi frontali'], weak: ['Guardia sfondabile con le armi', 'Scoperto dopo le onde', 'Colpo di squadra'] },
  vespera: { str: ['Raggio oscuro', 'Teletrasporto', 'Evoca i suoi soldati', 'Sfere che inseguono'], weak: ['Poca difesa da vicino', 'Ferma quando carica il raggio', 'Colpo di squadra e titani'] },
};
/* 1.12: bosses in three phases (like Cuphead): at 2/3 and 1/3 of their life they roar, push everyone back
   and switch to a new, faster pattern. p2/p3 = the patterns of phase 2 and 3, ph = the names shown. */
const BOSS_PHASES = {
  rigel: { p2: ['wave', 'slash', 'lunge', 'wave'], p3: ['lunge', 'wave', 'lunge', 'slash', 'guard'], ph: ['LA LAMA SI ALLUNGA', 'NUCLEO INCRINATO'] },
  mastice: { p2: ['slam', 'charge', 'punch', 'slam'], p3: ['charge', 'slam', 'charge', 'punch'], ph: ['ASFALTO ROVENTE', 'FRANA'] },
  centipede: { p2: ['split', 'lunge', 'claw', 'split'], p3: ['lunge', 'split', 'lunge', 'claw'], ph: ['LO SCIAME', 'LA MUTA'] },
  trivor: { p2: ['burrow', 'drill', 'burrow', 'claw'], p3: ['drill', 'burrow', 'drill', 'drill'], ph: ['SOTTOTERRA', 'TRIVELLA IMPAZZITA'] },
  mimesi: { p2: ['mirror', 'slash', 'lunge', 'mirror'], p3: ['lunge', 'mirror', 'slash', 'lunge'], ph: ['SPECCHI ROTTI', 'MILLE RIFLESSI'] },
  kharon: { p2: ['wave', 'slash', 'lunge', 'wave'], p3: ['wave', 'lunge', 'wave', 'slash', 'guard'], ph: ['LA CORAZZA SI RISVEGLIA', 'ORDINI DI VESPERA'] },
  custode: { p2: ['orbs', 'summon', 'sweep', 'orbs'], p3: ['summon', 'orbs', 'sweep', 'orbs'], ph: ['LA FLOTTA SI SVEGLIA', 'ULTIMA DIFESA'] },
  kharon2: { p2: ['wave', 'lunge', 'wave', 'guard'], p3: ['wave', 'wave', 'lunge', 'slash'], ph: ['LA CORAZZA SI INCRINA', 'L\'ULTIMO COMANDO'] },
  vespera: { p2: ['teleport', 'blast', 'orbs', 'summon'], p3: ['orbs', 'teleport', 'blast', 'orbs', 'blast'], ph: ['LA CORONA OSCURA', 'LA REGINA SENZA TRONO'] },
};
const BOSSES = {
  mastice: { name: 'MASTICE', title: 'COLOSSO DI ASFALTO', hp: 620, scale: 0.78, speed: 95, reach: 175, dmg: 22, frames: 8, pattern: ['punch', 'slam', 'punch', 'charge'] },
  centipede: { name: 'CENTIPEDE', title: 'IL MOSTRO CHE SI DIVIDE', hp: 680, scale: 1.35, speed: 130, reach: 215, dmg: 20, frames: 6, pattern: ['lunge', 'claw', 'split', 'lunge'] },
  trivor: { name: 'TRIVOR', title: 'LA BESTIA TRIVELLA', hp: 760, scale: 1.4, speed: 110, reach: 190, dmg: 24, frames: 6, pattern: ['drill', 'burrow', 'claw', 'drill'] },
  mimesi: { name: 'MIMESI', title: 'LADRA DI MOSSE', hp: 700, scale: 1.3, speed: 150, reach: 200, dmg: 20, frames: 6, pattern: ['slash', 'mirror', 'lunge', 'slash'] },
  kharon: { name: 'KHARON', title: 'IL CAVALIERE PRIGIONIERO', hp: 820, scale: 1.25, speed: 145, reach: 205, dmg: 23, frames: 6, pattern: ['slash', 'lunge', 'guard', 'slash', 'wave'] },
  custode: { name: 'IL CUSTODE', title: 'DIFESA DELL\'ANTICA FLOTTA', hp: 900, scale: 1.35, speed: 90, reach: 230, dmg: 24, frames: 6, pattern: ['sweep', 'orbs', 'sweep', 'summon'] },
  kharon2: { sprite: 'kharon', name: 'KHARON', title: 'PRIGIONIERO DELLA CORAZZA', hp: 950, scale: 1.25, speed: 165, reach: 205, dmg: 25, frames: 6, pattern: ['slash', 'wave', 'lunge', 'guard', 'wave'] },
  rigel: { name: 'RIGEL', title: 'IL GUERRIERO D\'ARGENTO', hp: 760, scale: 1.1, speed: 170, reach: 200, dmg: 21, frames: 6, pattern: ['slash', 'lunge', 'wave', 'slash', 'guard'] },
  vespera: { name: 'VESPERA', title: 'LA REGINA OSCURA', hp: 1100, scale: 1.3, speed: 120, reach: 520, dmg: 24, frames: 6, pattern: ['blast', 'teleport', 'orbs', 'summon', 'blast'] },
};

/* Giant duels (titan vs giant monster) */
const GIANTS = {
  trivor: { sprite: 'trivor', name: 'TRIVOR GIGANTE', hp: 900, scale: 2.7, dmg: 16 },
  mastice: { sprite: 'mastice', name: 'MASTICE RISORTO', hp: 1100, scale: 1.45, dmg: 18, frames: 8 },
  eclipse: { sprite: 'eclipse', name: 'VESPERA ECLISSE', hp: 1300, scale: 2.05, dmg: 21 },
};

const ITEMS = {
  pizza: { heal: 30, label: 'PIZZA' },
  chicken: { heal: 65, label: 'POLLO ARROSTO' },
  can: { heal: 14, label: 'BIBITA' },
  energy: { energy: 35, label: 'CELLA D\'ENERGIA' },
  coin: { score: 500, label: 'MONETA' },
  gem: { score: 1500, team: 25, label: 'FRAMMENTO DI CUORE' },
  ammo: { ammo: 6, label: 'CARICATORE' },
  sigil: { sigil: true, label: 'SIGILLO DEI TITANI' },
  pipe: { weapon: true, dmg: 1.7, reach: 42, uses: 14, label: 'TUBO D\'ACCIAIO' },
  oar: { weapon: true, dmg: 1.5, reach: 74, uses: 11, label: 'REMO' },
};

const PROPS = {
  crate: { hp: 2, drops: ['pizza', 'can', 'coin', 'energy', 'chicken', 'ammo'] },
  bin: { hp: 1, drops: ['can', 'coin', 'pizza'] },
  barrel: { hp: 1, explode: true, drops: [] },
  mirror: { hp: 6, drops: ['energy'], sheet: 'extra', sc: 0.9 },
  capsula: { hp: 9999, drops: [], sheet: 'ferrea', sc: 1, deco: true },
  generator: { hp: 999, drops: [], sheet: 'extra', sc: 0.8 },
  antenna: { hp: 100, drops: [], sheet: 'extra', sc: 0.9 },
  capsule: { hp: 60, drops: [], sheet: 'extra', sc: 1.1 },
};

/* Walkable band (feet y). Backgrounds have been normalised so the floor starts at 465. */
const FLOOR_TOP = 492, FLOOR_BOTTOM = 700;

/* civ types available for background civilians */
const CIVS = ['waiter', 'fisher', 'lady', 'elder', 'tourist', 'girl', 'suit', 'kid'];

/* ------------------------------------------------------------
   CAPITOLI
   zones: arena che si blocca finché non sono sconfitte le ondate.
   w: ondate [tipo, quantità]; c: civili da proteggere; p: oggetti di scena
   ------------------------------------------------------------ */
/* Primal Sentinels II — Cuori di Stella. I capitoli del primo gioco restano in LEVELS_I. */
const LEVELS_I = [
  {
    n: 1, id: 'porto', title: 'LA NOTTE DELLE SIRENE', place: 'PORTO AURORA', bg: 'port', length: 4700, music: 0,
    zones: [
      { x: 700, name: 'IL LUNGOMARE', w: [['soldier', 3], ['soldier', 2]], c: ['waiter', 'lady'], p: [['crate', 520, 560], ['bin', 980, 640]] },
      { x: 1700, name: 'LA STRADA DEI NEGOZI', w: [['soldier', 3], ['lancer', 2], ['soldier', 2]], c: ['elder', 'kid'], p: [['barrel', 1560, 540], ['crate', 1850, 650], ['crate', 2100, 530]] },
      { x: 2750, name: 'IL CANCELLO DEL PORTO', w: [['soldier', 3], ['brute', 1], ['lancer', 3]], c: ['fisher'], p: [['bin', 2600, 600], ['barrel', 2950, 670], ['crate', 3150, 560]] },
      { x: 3780, name: 'MASTICE', boss: 'mastice', p: [['crate', 3700, 520]] },
    ],
    weapons: [['pipe', 1300, 600]],
    intro: [
      ["NARRATORE", "Porto Aurora, 23:47. Le sirene suonano da dieci minuti e nessuno sa perché."],
      ["ARMV3Z", "Mi sentite? Non abbiate paura della voce nella vostra testa. Sono ArMV3z, il custode dei Cuori che adesso portate addosso."],
      ["IGNIS", "Un minuto fa sfornavo pizze. Adesso ho un'armatura addosso. Qualcuno mi spiega?"],
      ["ARMV3Z", "Non c'è tempo. Si è aperto un varco verso la Dimensione Oscura: i Senzavolto cercano i Cuori, e voi li avete. Proteggete la gente, poi vi racconterò tutto."],
      ["ASTRO", "Io sono Astro, lui è Boris, piacere piacere! Radar acceso: civili intrappolati sul lungomare. E tanti, tanti soldati."],
      ["BORIS", "Le armature sono cariche. Non rompetele il primo giorno."],
      ["IGNIS", "Allora niente spiegazioni. Prima la gente. Andiamo!"],
    ],
    outro: [
      ["NARRATORE", "Mastice crolla nel fango che lui stesso ha sollevato. Sotto il molo resta un tunnel profondo."],
      ["AZUR", "Non stava attaccando la città. Scavava. Cercava qualcosa sotto di noi."],
      ["ARMV3Z", "Cercava la Camera dei Cuori, e i titani che dormono qui sotto. È ora che sappiate la verità."],
      ["ARMV3Z", "Mille anni fa, nella Dimensione Oscura, una regina di nome Vespera costruì cinque titani per conquistare i mondi. Io li ho portati via da lei e li ho addormentati qui."],
      ["AURA", "E adesso lei li rivuole."],
      ["ASTRO", "Nuovo allarme! Un treno blindato è partito dalla stazione merci. A bordo ci sono dei prigionieri!"],
    ],
  },
  {
    n: 2, id: 'convoglio', title: 'IL CONVOGLIO DEI PRIGIONIERI', place: 'STAZIONE MERCI', bg: 'rail', length: 5600, music: 1, train: 1650, loco: 3450,
    zones: [
      { x: 650, name: 'LO SCALO MERCI', w: [['soldier', 3], ['lancer', 2]], c: ['suit'], p: [['crate', 500, 600], ['barrel', 900, 560]] },
      { x: 1650, name: 'I VAGONI DEI PRIGIONIERI', board: 1, w: [['lancer', 3], ['soldier', 3], ['brute', 1]], c: ['girl', 'scientist', 'suit'], p: [['crate', 1900, 650], ['crate', 2100, 540]] },
      { x: 2700, name: 'LA GALLERIA', tunnel: 18, w: [['lancer', 2], ['dog', 2], ['soldier', 3], ['lancer', 2]], c: ['tourist'], p: [['crate', 3050, 600]] },
      { x: 3700, name: 'LA LOCOMOTIVA', w: [['brute', 2], ['lancer', 3], ['soldier', 2]], c: ['elder', 'kid'], p: [['barrel', 3600, 620], ['crate', 4000, 540]] },
      { x: 4700, name: 'CENTIPEDE', boss: 'centipede', p: [] },
    ],
    weapons: [['pipe', 1200, 640], ['oar', 2400, 560]],
    intro: [
      ["ASTRO", "Dieci minuti prima che il treno attraversi il portale. Nove e cinquantanove... nove e cinquantotto..."],
      ["BORIS", "Astro. Smetti di contare."],
      ["AZUR", "Perché proprio quei prigionieri? Vespera non rapisce a caso."],
      ["ARMV3Z", "Tra loro c'è Irene Valli. Vent'anni fa fu lei a scoprire la Camera dei Cuori. Sa dove dormono i titani."],
      ["LYRA", "Allora la riportiamo a casa. Io salto sul tetto del treno, voi pensate ai vagoni."],
      ["ONYX", "Occhio alla galleria. Là sotto non si vedrà niente."],
    ],
    outro: [
      ["DOTT.SSA VALLI", "Grazie. Credevo di non rivedere più il mare."],
      ["DOTT.SSA VALLI", "Vent'anni fa, scavando sotto il porto, trovai una sala piena di cristalli. Li ho studiati per tutta la vita, senza capire cosa fossero."],
      ["ARMV3Z", "Erano i Cuori, Irene. E adesso hanno scelto."],
      ["DOTT.SSA VALLI", "Allora sappiate questo: i Senzavolto volevano da me una cosa sola. Dove dorme il primo titano."],
      ["DOTT.SSA VALLI", "Sotto il vecchio parco preistorico. E gliel'ho detto. Mi dispiace."],
      ["LYRA", "Non scusarti. Adesso lo sappiamo anche noi. Ci arriviamo prima di loro."],
    ],
  },
  {
    n: 3, id: 'foresta', title: 'LA FORESTA DI ACCIAIO', place: 'PARCO PREISTORICO', bg: 'park', length: 5600, music: 2,
    zones: [
      { x: 650, name: 'L\'INGRESSO DEL PARCO', w: [['soldier', 4], ['lancer', 2]], c: [], p: [['crate', 520, 600], ['bin', 950, 540]] },
      { x: 1650, name: 'LE MONTAGNE RUSSE', w: [['brute', 2], ['lancer', 3], ['soldier', 2]], c: ['tourist'], p: [['barrel', 1500, 560], ['crate', 1900, 650]] },
      { x: 2700, name: 'IL RECINTO DEL TIRANNO', ride: 'start', w: [['soldier', 5], ['lancer', 4], ['brute', 3], ['dog', 4]], c: [], p: [['crate', 2600, 540], ['barrel', 3000, 650]] },
      { x: 3700, name: 'LA SERRA ABBANDONATA', ride: 'end', w: [['lancer', 5], ['brute', 3], ['soldier', 5], ['shield', 2]], c: ['tourist'], p: [['barrel', 3650, 560], ['crate', 4000, 650]] },
      { x: 4700, name: 'TRIVOR', boss: 'trivor', p: [] },
    ],
    weapons: [['oar', 1150, 600]],
    giant: { player: 'rex', enemy: 'trivor', bg: 'park' },
    intro: [
      ["DOTT.SSA VALLI", "Il segnale viene da sotto il recinto del tirannosauro. È lui: il Tiranno Rosso."],
      ["ONYX", "Lo sento anch'io, nel petto. Come se l'armatura riconoscesse casa."],
      ["ARMV3Z", "Se si sveglia, parlategli. Non è una macchina da comandare: è un compagno che deve fidarsi di voi."],
      ["IGNIS", "E se invece si fida di loro?"],
      ["ARMV3Z", "Allora avremo perso il primo dei cinque. Correte."],
    ],
    mid: [
      ["TRIVOR", "La Dimensione Oscura mi dona la sua forza! Schiaccerò i vostri Cuori come gusci d'uovo!"],
      ["NARRATORE", "Trivor cresce fino a sovrastare gli alberi. Dal recinto, il Tiranno Rosso risponde con un ruggito."],
      ["IGNIS", "Tiranno Rosso... se mi senti, combatti con me!"],
    ],
    outro: [
      ["VESPERA", "Inginocchiati, mio guardiano."],
      ["NARRATORE", "Per un istante il Tiranno Rosso abbassa la testa davanti alla voce di Vespera. Poi si scuote e ruggisce contro il cielo."],
      ["AURA", "L'ha riconosciuta. E lei conosce lui."],
      ["ARMV3Z", "I titani ricordano ancora la sua voce. Io ho cancellato gli ordini, non le cicatrici."],
      ["IGNIS", "Allora dobbiamo trovare gli altri quattro prima che li chiami lei."],
    ],
  },
  {
    n: 4, id: 'teatro', title: 'IL TEATRO DEGLI SPECCHI', place: 'QUARTIERE DEI TEATRI', bg: 'theater', length: 4500, music: 3,
    zones: [
      { x: 650, name: 'IL FOYER', w: [['lancer', 3], ['soldier', 3]], c: ['lady'], p: [['crate', 520, 600]] },
      { x: 1650, name: 'LA GALLERIA DEGLI SPECCHI', w: [['shade', 2], ['soldier', 3], ['lancer', 2]], c: [], p: [['barrel', 1500, 640], ['crate', 1900, 540]] },
      { x: 2700, name: 'IL PALCOSCENICO', w: [['shade', 3], ['brute', 2], ['lancer', 2]], c: ['suit'], p: [['crate', 2600, 560], ['crate', 3050, 660]] },
      { x: 3650, name: 'MIMESI', boss: 'mimesi', p: [] },
    ],
    weapons: [['pipe', 1300, 560]],
    intro: [
      ["AZUR", "Quelle copie si muovono come noi. Qualcuno ci ha studiati, colpo per colpo."],
      ["ASTRO", "I miei sensori vedono cinque di voi... e poi altri cinque. Non mi piace. Non mi piace per niente!"],
      ["BORIS", "Contali due volte. Quelli veri hanno i Cuori."],
      ["ARMV3Z", "È Mimesi, la ladra di mosse di Vespera. Rompete gli specchi: senza riflessi non può copiarvi."],
      ["AURA", "E se negli specchi ci fosse qualcosa che dobbiamo vedere?"],
      ["ARMV3Z", "...Allora guardate. Ma non dimenticate chi siete."],
    ],
    outro: [
      ["VESPERA", "Guardate, piccoli custodi. Guardate cosa facevano i vostri titani quando erano miei."],
      ["NARRATORE", "Negli specchi infranti scorrono immagini vere: i cinque titani che radono al suolo le città di un altro mondo."],
      ["LYRA", "Non può essere vero..."],
      ["ARMV3Z", "È vero. Li guidavano piloti obbedienti, e Vespera dava gli ordini. Per questo li ho portati via."],
      ["ONYX", "Allora quello che portiamo addosso non è un'arma. È una promessa: non torneranno mai più a essere quello."],
      ["AZUR", "ArMV3z. Cos'altro non ci hai detto?"],
      ["ARMV3Z", "Il nome del loro primo pilota. Kharon. È lui che guida l'assedio di stanotte."],
    ],
  },
  {
    n: 5, id: 'assedio', title: 'ASSEDIO A PORTO AURORA', place: 'CITTÀ SOTTO ASSEDIO', bg: 'siege', length: 4700, music: 4,
    zones: [
      { x: 650, name: 'IL LUNGOMARE IN FIAMME', w: [['soldier', 4], ['lancer', 3]], c: ['waiter', 'kid'], p: [['barrel', 560, 650], ['crate', 950, 540]] },
      { x: 1700, name: 'IL MOLO', w: [['brute', 2], ['lancer', 4]], c: ['elder'], p: [['crate', 1550, 600], ['barrel', 2400, 660]] },
      { x: 2750, name: 'IL CENTRO COMUNICAZIONI', w: [['brute', 2], ['lancer', 3], ['soldier', 3]], c: ['girl', 'fisher'], p: [['barrel', 2650, 560], ['crate', 3050, 640]] },
      { x: 3750, name: 'KHARON', boss: 'kharon', p: [] },
    ],
    weapons: [['pipe', 1250, 620], ['oar', 2350, 560]],
    giant: { player: 'concordia', enemy: 'mastice', bg: 'siege' },
    intro: [
      ["KHARON", "Consegnatemi i Cuori e la città vivrà. Rifiutate, e la guarderete bruciare."],
      ["IGNIS", "Questa è casa nostra. Non trattiamo con chi la incendia!"],
      ["KHARON", "Coraggio. Anch'io ne avevo, mille anni fa."],
      ["ARMV3Z", "Kharon... sei davvero tu. Sentinels, fermatelo, ma non odiatelo: non è lui a scegliere."],
      ["ASTRO", "L'antenna del porto regge gli scudi della città. Se cade lei, cade tutto!"],
      ["BORIS", "Allora non fatela cadere."],
    ],
    mid: [
      ["KHARON", "Siete più forti di quanto credessi. Ma stanotte non è mia: è sua."],
      ["NARRATORE", "Kharon spezza un cristallo oscuro sui resti di Mastice. Il colosso si rialza dal mare, alto come un palazzo."],
      ["AURA", "Da soli non basta. Tutti e cinque, insieme!"],
      ["ARMV3Z", "I cinque Cuori battono all'unisono. Titani, unitevi: CONCORDIA!"],
    ],
    outro: [
      ["NARRATORE", "Il colosso crolla in mare. Nella luce dell'esplosione Kharon abbassa la spada. Poi sparisce nel varco."],
      ["LYRA", "Avete visto? Ha esitato. Non voleva colpirci."],
      ["DOTT.SSA VALLI", "Ho decifrato le incisioni sui resti di Mastice. Portano sotto il porto, a una fabbrica sepolta."],
      ["DOTT.SSA VALLI", "I Senzavolto la chiamano il Cimitero dei Titani."],
      ["ONYX", "Allora andiamo a vedere cosa ci seppelliscono."],
    ],
  },
  {
    n: 6, id: 'cimitero', title: 'IL CIMITERO DEI TITANI', place: 'FABBRICA SOTTERRANEA', bg: 'graveyard', length: 4600, music: 5, noRegen: true,
    zones: [
      { x: 650, name: 'LE GALLERIE', w: [['soldier', 3], ['brute', 2]], c: [], p: [['crate', 520, 600], ['crate', 930, 660]] },
      { x: 1650, name: 'LA CATENA DI MONTAGGIO', w: [['lancer', 4], ['brute', 2]], c: [], p: [['barrel', 1500, 560], ['barrel', 1950, 650]] },
      { x: 2700, name: 'LA SALA DEI CUORI SPENTI', w: [['shade', 2], ['brute', 2], ['lancer', 3]], c: ['scientist'], p: [['crate', 2600, 640], ['barrel', 3000, 540]] },
      { x: 3700, name: 'IL CUSTODE', boss: 'custode', p: [] },
    ],
    weapons: [['pipe', 1200, 600], ['pipe', 2300, 640]],
    intro: [
      ["NARRATORE", "Sotto il porto, scheletri di macchine giganti riempiono una caverna senza fine."],
      ["ONYX", "Sono titani. Decine. Non i nostri... di altri mondi."],
      ["ASTRO", "Energia dei Cuori al 40%... al 38%... Questo posto vi succhia via tutto!"],
      ["BORIS", "Qui sotto non posso ricaricarvi. Quello che avete, vi deve bastare."],
      ["ARMV3Z", "La Dimensione Oscura qui è troppo vicina... non riesco a... restare con voi..."],
      ["AZUR", "ArMV3z? ArMV3z!"],
      ["AURA", "È sparito. Siamo soli. Allora niente sprechi: ogni colpo conta."],
    ],
    outro: [
      ["KHARON", "Fermi. Non sono qui per combattere."],
      ["KHARON", "Il Custode ricostruiva per Vespera i titani caduti nelle sue guerre. Grazie a voi, adesso è solo ferro."],
      ["KHARON", "Mille anni fa mi chiamavo Sirio. Ero il primo pilota di Vespera. Aiutai ArMV3z a portare via i titani, poi tornai indietro per chiudere il varco."],
      ["KHARON", "Vespera mi prese. Mi tolse il nome e mi chiuse in questa corazza: finché la porto, devo obbedirle."],
      ["IGNIS", "Allora te la togliamo."],
      ["KHARON", "Si può spezzare solo nella Dimensione Oscura. Vi apro il passaggio. Ma quando arriverete lassù, non avrò scelta: dovrò combattervi."],
      ["ARMV3Z", "Sirio, vecchio amico... il Cuore verde ti aspetta da mille anni."],
    ],
  },
  {
    n: 7, id: 'velo', title: 'LA DIMENSIONE OSCURA', place: 'PALAZZO CAPOVOLTO', bg: 'veil', length: 4600, music: 6,
    zones: [
      { x: 650, name: 'IL PONTE SOSPESO', w: [['shade', 2], ['lancer', 3], ['soldier', 2]], c: [], p: [['crate', 520, 600]] },
      { x: 1650, name: 'LE TORRI CAPOVOLTE', w: [['brute', 3], ['lancer', 3], ['segment', 2]], c: [], p: [['barrel', 1500, 640], ['crate', 1950, 540]] },
      { x: 2700, name: 'LA SCALINATA', w: [['shade', 3], ['brute', 2], ['segment', 2]], c: [], p: [['crate', 2650, 560], ['barrel', 3050, 650]] },
      { x: 3700, name: 'KHARON', boss: 'kharon2', p: [] },
    ],
    weapons: [['oar', 1200, 620]],
    intro: [
      ["NARRATORE", "Nella Dimensione Oscura il cielo è sotto i piedi. Le torri sono capovolte e il tempo scorre a scatti."],
      ["ASTRO", "Gravità ridotta! Voi saltate più in alto, io galleggio. Boris, tienimi!"],
      ["BORIS", "Ti tengo. Come sempre."],
      ["AZUR", "I nemici delle prime notti sono tornati, più forti. Li ricostruisce la Dimensione Oscura."],
      ["LYRA", "Kharon ci aspetta in cima alla scalinata. Dobbiamo spezzare la corazza, non lui."],
      ["ARMV3Z", "Mirate alla corazza, non all'uomo. Sotto c'è un amico."],
    ],
    outro: [
      ["SIRIO", "La corazza... si è spezzata. Dopo mille anni, sono libero."],
      ["ARMV3Z", "Bentornato, Sirio. Il Cuore verde è di nuovo tuo, e il Drago Verde ti riconosce. Sei il sesto Sentinel."],
      ["VESPERA", "Che scena commovente. Ma io non ho bisogno di un traditore."],
      ["VESPERA", "Titani... ascoltate la mia voce. Tornate da me."],
      ["NARRATORE", "Uno dopo l'altro, i cinque titani si voltano verso la fortezza di Vespera. E si incamminano."],
      ["AURA", "No... Non possiamo comandarli. Possiamo solo raggiungerli, e chiedergli di scegliere."],
    ],
  },
  {
    n: 8, id: 'alba', title: 'L\'ULTIMA ALBA', place: 'LA FORTEZZA OSCURA', bg: 'dawn', length: 7300, music: 7,
    zones: [
      { x: 650, name: 'LE ROVINE DELL\'ALBA', w: [['shade', 3], ['brute', 2], ['lancer', 2]], c: [], p: [['crate', 520, 600], ['barrel', 950, 650]] },
      { x: 1650, name: 'I FRAMMENTI DELLA CITTÀ', w: [['segment', 3], ['lancer', 3], ['brute', 2]], c: ['kid', 'elder'], p: [['crate', 1500, 540], ['crate', 1950, 660]] },
      { x: 2700, name: 'IL CUORE DELLA FORTEZZA', w: [['shade', 4], ['brute', 3]], c: [], p: [['barrel', 2600, 560], ['barrel', 3050, 650]] },
      { x: 3700, name: 'IL CROLLO DELLA CITTÀ', escape: 2600, p: [] },
      { x: 6300, name: 'VESPERA', boss: 'vespera', p: [] },
    ],
    weapons: [['pipe', 1150, 600], ['oar', 2350, 560]],
    giant: { player: 'concordia', enemy: 'eclipse', bg: 'dawn', final: true },
    intro: [
      ["NARRATORE", "La fortezza oscura sta divorando Porto Aurora pezzo dopo pezzo. Manca un'ora all'alba."],
      ["SIRIO", "Vi apro la strada. Il resto è vostro. È sempre stato vostro."],
      ["ARMV3Z", "Dentro la fortezza non posso seguirvi. Ma ogni Cuore porta un pezzo di me."],
      ["BORIS", "Armature riparate. Tutte. Riportatele intere."],
      ["DOTT.SSA VALLI", "Noi evacuiamo la città finché resistete. Non fatevi aspettare."],
      ["IGNIS", "Sentinels... questa è l'ultima notte della Dimensione Oscura. Facciamola finire."],
    ],
    mid: [
      ["VESPERA", "Se non posso riavere i miei titani, mi prenderò questo mondo intero!"],
      ["NARRATORE", "Vespera si fonde con il cuore della fortezza. Il cielo diventa nero. Nasce Eclisse."],
      ["AZUR", "I Cuori rispondono ancora... ma non come prima. Non obbediscono più a nessuno."],
      ["ONYX", "Allora non diamo ordini. Chiediamo. Titani... volete combattere con noi?"],
      ["NARRATORE", "Per un lungo istante non succede niente. Poi cinque ruggiti rispondono insieme."],
    ],
    outro: [
      ["NARRATORE", "Eclisse si spezza in mille schegge di luce. Il varco si richiude, per sempre."],
      ["VESPERA", "I titani... mi hanno... abbandonata..."],
      ["SIRIO", "No, Vespera. Hanno scelto. È la sola cosa che non hai mai capito."],
      ["IGNIS", "Non abbiamo vinto perché li comandavamo. Abbiamo vinto perché si sono fidati di noi."],
      ["ASTRO", "Ce l'abbiamo fatta! Ce l'abbiamo fatta! Posso ballare? Sto già ballando!"],
      ["BORIS", "...Va bene. Oggi balla."],
      ["ARMV3Z", "I titani tornano a dormire sotto la città. Questa volta come custodi, non come armi. E voi con loro."],
      ["ARMV3Z", "Però non vi ho raccontato tutto di quella notte, mille anni fa. Come io e Sirio portammo via i Cuori da sotto il trono di Vespera."],
      ["SIRIO", "E non eravamo soli, quella notte. Qualcuno ci aiutò a fuggire... e non ha mai chiesto niente in cambio. Finora."],
      ["NARRATORE", "Lontano, oltre il mare di Porto Aurora, un nuovo varco si apre. Senza luce, senza rumore. Qualcuno ha sentito i Cuori svegliarsi."],
      ["ASTRO", "Ehm... ArMV3z? Il radar segna qualcosa. E non è viola."],
      ["NARRATORE", "LA STORIA CONTINUA..."],
    ],
  },
];
const II_PREVIEW = true;
const II_PREVIEW_END = [
  ['NARRATORE', 'Fine del capitolo 1. Il capitolo 2, LA FLOTTA DI FERRO, è in lavorazione.'],
  ['ASTRO', 'Tornate presto! Il radar non smette di suonare!']];
const LEVELS = [
  {
    n: 1, id: 'stella', title: 'LA STELLA CADUTA', place: 'PORTO AURORA · LA FESTA DEL PATRONO', bg: 'festa', length: 4700, music: 0,
    zones: [
      { x: 700, name: 'LE LUMINARIE', w: [['fante', 3], ['fante', 2]], c: ['kid', 'lady'], p: [['crate', 520, 560], ['bin', 980, 640]] },
      { x: 1700, name: 'LE BANCARELLE', w: [['fante', 3], ['bruto', 1], ['fante', 2]], c: ['elder', 'waiter'], p: [['barrel', 1560, 540], ['crate', 1850, 650], ['crate', 2100, 530]] },
      { x: 2750, name: 'IL MOLO', w: [['fante', 4], ['bruto', 1], ['fante', 3]], c: ['fisher'], p: [['capsula', 2980, 520], ['bin', 2600, 600], ['crate', 3250, 640]] },
      { x: 3780, name: 'IL GUERRIERO D\'ARGENTO', boss: 'rigel', p: [['crate', 3700, 520]] },
    ],
    weapons: [['pipe', 1300, 600]],
    intro: [
      ['NARRATORE', 'Porto Aurora, un anno dopo la caduta di Vespera. È la notte della festa del patrono: luminarie, bancarelle, la banda sul molo.'],
      ['IGNIS', 'Un anno senza mostri. Stasera l\'unica battaglia è con la fila per i torroni.'],
      ['LYRA', 'Guardate il cielo! Una stella cadente... ma scende troppo piano.'],
      ['ASTRO', 'Radar acceso! Energia sconosciuta, colore... bianco argento. Non è viola. Non è niente che conosco!'],
      ['BORIS', 'Qualcosa è caduto nel porto. E sta arrivando gente di ferro dalle bancarelle.'],
      ['ARMV3Z', 'Sentinels, i Cuori sono ancora con voi. Proteggete la festa. Poi scopriremo chi è sceso dal cielo.'],
      ['ONYX', 'Pensavo che il ferro lo battessi solo in officina. Andiamo.'],
    ],
    outro: [
      ['AURA', 'Strega? Ci ha chiamati streghe?'],
      ['AZUR', 'Era di ferro come i soldati. Ma li combatteva anche lui. Non torna.'],
      ['ASTRO', 'Il radar segna ancora bianco argento. E adesso... tante luci. Tantissime. Oltre le nuvole.'],
      ['ARMV3Z', 'Non è la Dimensione Oscura. È qualcosa che non ho mai visto in mille anni. Preparatevi, ragazzi.'],
    ],
  },
];

/* 1.12: when Sirio (Kharon, the sixth Sentinel) is in the team replaying an earlier chapter, he adds his line */
const SIRIO_LINES = [
  [['SIRIO', 'Mastice... lo costruì Vespera con il fango dei porti che conquistava. Colpitelo quando si rialza: è lento a ricomporsi.']],
  [['SIRIO', 'Quel convoglio l\'ho scortato io, una volta. Mi vergogno ancora. Stavolta lo fermiamo.']],
  [['SIRIO', 'Il Tiranno Rosso fu il mio primo titano. Parlagli piano, Ciusky: ricorda chi lo tratta bene.']],
  [['SIRIO', 'Mimesi copiava anche me. Cambiate ritmo spesso: non riesce a star dietro a chi improvvisa.']],
  [['SIRIO', 'Ricordo questa notte dall\'altra parte della spada. Adesso so da che parte stare.']],
  [['SIRIO', 'Il Custode ricostruiva i titani che io stesso avevo guidato. Facciamolo tacere per sempre.']],
  [['SIRIO', 'Tornare lassù libero... è una sensazione strana. Andiamo a chiudere i conti.']],
  [['SIRIO', 'Vespera, ti ho servita per mille anni. Stanotte ti restituisco il favore.']],
];
/* Speaker → portrait sprite for dialogue boxes */
const SPEAKERS = {
  'IGNIS': ['fighters', 'ignis_0', '#ff5b4f'], 'AZUR': ['fighters', 'azur_0', '#5d9bff'], 'LYRA': ['fighters', 'lyra_0', '#f7d046'],
  'AURA': ['fighters', 'aura_0', '#ff78bb'], 'ONYX': ['fighters', 'onyx_0', '#b9c6d4'],
  'KHARON': ['bosses', 'kharon_0', '#d24a5a'], 'VESPERA': ['bosses', 'vespera_0', '#b77dff'], 'TRIVOR': ['bosses', 'trivor_0', '#4fc3a8'],
  'DOTT.SSA VALLI': ['people', 'scientist_idle0', '#9fd6ff'], 'NARRATORE': null,
  'ARMV3Z': ['mentors', 'argo_0', '#6fc8ff'], 'ASTRO': ['mentors', 'sette_2', '#ffd35a'], 'BORIS': ['mentors', 'sette_2', '#8fc4ff'],
  'SIRIO': ['heroes2', 'kharon_0', '#3fd06a'],
  'RIGEL': ['rigel', 'rigel_0', '#9fdcff'],
};
/* illustrated dialogue portraits */
const PORTRAIT = { RIGEL: 'rigel:rigel_0', ARMV3Z: 'mentors:argo_7', ASTRO: 'mentors:sette_2', BORIS: 'mentors:sette_2', SIRIO: 'faces:face_5', IGNIS: 'pt_ignis', AZUR: 'pt_azur', LYRA: 'pt_lyra', AURA: 'pt_aura', ONYX: 'pt_onyx', VESPERA: 'pt_vespera', KHARON: 'pt_kharon', 'DOTT.SSA VALLI': 'pt_valli', MASTICE: 'pt_mastice' };

/* ------------------------------------------------------------
   DIFFICOLTÀ · crediti = quante volte la squadra può continuare
   in tutta la partita. Finiti i crediti: GAME OVER definitivo.
   ------------------------------------------------------------ */
const DIFFS = {
  easy: { name: 'FACILE', dmg: 0.65, hp: 0.85, aggro: 0.8, credits: Infinity, desc: 'Crediti infiniti, nemici più deboli' },
  normal: { name: 'NORMALE', dmg: 1, hp: 1, aggro: 1, credits: 4, desc: '4 crediti per tutta la partita' },
  arcade: { name: 'ARCADE', dmg: 1.3, hp: 1.15, aggro: 1.2, credits: 2, desc: '2 crediti, si parte sempre dal capitolo 1' },
};
let DIFF = DIFFS.normal;
/* upgrades bought at Boris's shop during a story run (see modes.js) */
let UPGRADES = null;

/* ------------------------------------------------------------
   EXTRA DEI CAPITOLI
   plats: piattaforme su cui salire [tipo, x, y del bordo anteriore]
   sigils: 3 Sigilli dei Titani nascosti [x, y, dove] (top = sopra una piattaforma, crate = dentro l'oggetto più vicino, floor = a terra)
   drones: ondate extra di droni per zona {zona: numero}
   ------------------------------------------------------------ */
const PLATS = {
  // real proportions next to a 142 px adult: a small car ≈ 1.55 m, a dumpster ≈ 1.3 m, a bus shelter ≈ 2.4 m
  car: { w: 212, d: 40, h: 108 },
  dumpster: { w: 150, d: 50, h: 92 },
  shelter: { w: 300, d: 48, h: 180 },
  rock: { w: 180, d: 44, h: 110 },
  hvac: { w: 220, d: 50, h: 100 },    // rooftop air-conditioning unit (chapter 5, on the roofs)
  cargo: { w: 190, d: 50, h: 104 },   // stacked steel cargo crates (chapter 6, the factory)
};
const LEVEL_EXTRAS = [
  // II cap. 1: la festa sul lungomare (auto parcheggiate su cui salire, niente pensilina)
  { plats: [['car', 1080, 548], ['car', 2250, 600], ['car', 3330, 660]], sigils: [[1080, 525, 'top'], [2250, 577, 'top'], [3150, 560, 'crate']], drones: {}, more: { 1: [['fante', 2]], 2: [['bruto', 1]] } },
  { plats: [], sigils: [[500, 600, 'crate'], [2100, 540, 'crate'], [4300, 505, 'floor']], drones: {}, more: { 0: [['dog', 2]], 3: [['grenadier', 2]] } },
  { plats: [['dumpster', 1300, 560], ['car', 4350, 650]], sigils: [[1300, 540, 'top'], [2600, 540, 'crate'], [4350, 628, 'top']], drones: { 1: 2, 2: 2 }, more: { 0: [['dog', 3]], 1: [['grenadier', 2]], 2: [['shield', 2]], 3: [['dog', 3]] } },
  { plats: [], sigils: [[520, 600, 'crate'], [1900, 540, 'crate'], [3050, 660, 'crate']], drones: {}, more: { 1: [['ninja', 2]], 2: [['ninja', 3]] } },
  { plats: [['car', 1100, 650], ['cargo', 1950, 600], ['cargo', 2180, 540]], sigils: [[1100, 628, 'top'], [2180, 520, 'top'], [3050, 640, 'crate']], drones: { 0: 1, 1: 2, 2: 2 }, more: { 0: [['shield', 2]], 1: [['grenadier', 2]], 2: [['ninja', 2], ['shield', 2]] } },
  { plats: [['cargo', 1250, 600]], sigils: [[1250, 580, 'top'], [930, 660, 'crate'], [3000, 540, 'crate']], drones: { 2: 2 }, more: { 0: [['dog', 3]], 1: [['shield', 2]], 2: [['grenadier', 2], ['ninja', 2]] } },
  { plats: [['rock', 1250, 600], ['rock', 2350, 560]], sigils: [[520, 600, 'crate'], [1950, 540, 'crate'], [2650, 560, 'crate']], drones: { 0: 2, 2: 2 }, more: { 0: [['ninja', 3]], 1: [['grenadier', 2], ['dog', 3]], 2: [['shield', 3]] } },
  { plats: [['rock', 1300, 600], ['rock', 2400, 620], ['rock', 4500, 580], ['rock', 5400, 640]], sigils: [[1300, 578, 'top'], [1500, 540, 'crate'], [4500, 558, 'top']], drones: { 1: 2, 2: 2 }, more: { 0: [['ninja', 3], ['dog', 3]], 1: [['shield', 2], ['grenadier', 2]], 2: [['ninja', 3], ['shield', 2]] } },
];
