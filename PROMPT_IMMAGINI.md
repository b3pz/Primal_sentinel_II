# Prompt per le immagini da generare (punto 6)

Come usarli:
- Un prompt = una tavola. Allega sempre l'immagine di riferimento indicata, così lo stile resta uguale a quello del gioco.
- Formato: **PNG con sfondo trasparente** (tranne il fondale della base, che è un JPG pieno).
- Poi carica le tavole in chat **con il nome del file indicato**: le taglio, le metto nell'atlante e nello ZIP.
- Se una posa esce male, rigenera solo quella tavola: non serve rifare le altre.

Stile comune (è già dentro ogni prompt): pixel art HD a 16 bit da picchiaduro arcade anni '90, contorno scuro,
luce da sinistra in alto, vista laterale, nessun testo, nessuna ombra per terra, figure separate da spazio vuoto.

---

## 1. Il titano di Kharon: il Drago Verde → `titano_drago.png`
Allega: la tavola dei titani (Tirannosauro rosso, Triceratopo blu, Felino giallo, Pterosauro rosa, Mastodonte nero).

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: il sesto titano, un DRAGO MECCANICO VERDE smeraldo, cugino dei titani dell'immagine allegata:
stessa costruzione a piastre corazzate, stesse proporzioni massicce, giunture dorate, un cuore di cristallo
verde luminoso al centro del petto, occhi verdi brillanti, corna all'indietro, ali corte ripiegate sul dorso,
coda lunga con punte. Vista laterale, rivolto verso DESTRA.
Griglia 2 righe x 2 colonne, pose ben separate, stessa scala in tutte:
1) addormentato, accucciato con la testa appoggiata a terra, luce del cuore fioca;
2) si risveglia, alza testa e petto, occhi che si accendono;
3) corsa in avanti a quattro zampe, zampe anteriori distese, coda tesa;
4) ruggito verso l'alto a bocca spalancata, ali aperte, cuore verde acceso al massimo.
Contorno scuro, luce da sinistra in alto, niente testo, niente ombra per terra, niente sfondo.
```

## 2. Lo scooter con il pilota del Velo → `scooter.png`
Allega: `fighters.png` (per il soldato Senzavolto) e, se l'hai, la tavola del capitolo 1 (il porto).

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: uno scooter italiano da città (tipo Vespa), rosso scuro e crema, guidato da un soldato
Senzavolto del Velo come quello dell'immagine allegata: tuta grigio-nera aderente, maschera liscia
senza volto, gemma viola sulla fronte. Vista laterale, rivolto verso SINISTRA, il pilota è seduto
e tiene il manubrio, piegato in avanti per la velocità.
Griglia 2 righe x 2 colonne, stessa scala in tutte:
1) in corsa, pilota piegato in avanti;
2) in corsa, secondo fotogramma (ruote e sciarpa in un'altra posizione, pilota leggermente più basso);
3) impennata: ruota anteriore sollevata, pilota sbilanciato all'indietro;
4) lo scooter vuoto rovesciato a terra su un fianco, con un filo di fumo.
Scala: lo scooter è lungo circa quanto un uomo e mezzo in altezza. Contorno scuro, luce da sinistra
in alto, niente testo, niente ombra per terra.
```

## 3. Le prese dei Sentinels (senza il nemico) → `presa_ignis.png`, `presa_azur.png`, `presa_lyra.png`, `presa_aura.png`, `presa_onyx.png`, `presa_kharon.png`
Sei tavole, una per Sentinel. Allega: `fighters.png` (per Kharon allega la sua tavola a 16 pose verde).
Nel prompt cambia solo la riga **[EROE]** con la descrizione qui sotto:
- ignis: *ranger ROSSO con elmo a visiera nera e spada fiammeggiante*
- azur: *ranger BLU con elmo a corna e lancia a tre punte*
- lyra: *ranger GIALLO con elmo felino e due pugnali ricurvi*
- aura: *ranger ROSA con elmo alato e arco*
- onyx: *ranger NERO-ARGENTO massiccio con elmo a zanne e ascia*
- kharon: *ranger VERDE smeraldo, il sesto Sentinel, identico alla sua tavola allegata (stessa armatura e stessa arma)*

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: [EROE], identico al personaggio dell'immagine allegata (stessi colori, stesse proporzioni,
stessa scala). Vista laterale, rivolto verso DESTRA. IMPORTANTE: il nemico NON è disegnato, le mani
stringono il vuoto come se tenessero una persona invisibile.
Griglia 2 righe x 2 colonne, stessa scala in tutte, piedi alla stessa altezza:
1) presa: gambe larghe, entrambe le mani avanti all'altezza del petto a stringere il bavero di un nemico;
2) ginocchiata: tiene il nemico con le mani e alza il ginocchio con forza;
3) sollevamento: braccia tese sopra la testa, come se sollevasse un uomo, schiena inarcata;
4) lancio: busto ruotato in avanti, braccia distese a fine movimento, gamba posteriore sollevata.
L'arma resta agganciata alla cintura o sulla schiena. Contorno scuro, luce da sinistra in alto,
niente testo, niente ombra per terra.
```

## 4. La base dei Sentinels per la scelta del personaggio → `base.jpg`
Allega: le due immagini della schermata "Choose your ranger" che mi hai mandato (solo come riferimento
di composizione) e lo sfondo della Camera dei Cuori del gioco.

```
Fondale di pixel art HD a 16 bit, formato orizzontale 16:9 (1920x1080), per la schermata di scelta
del personaggio di un picchiaduro arcade anni '90. Luogo: il centro di comando segreto dei Sentinels,
scavato nella roccia sotto un porto mediterraneo: pareti di pietra antica con colonne e archi,
mescolate a tecnologia: console con schermi verdi e ambra, cavi, luci che lampeggiano.
Al CENTRO, in fondo, un grande cilindro di energia verticale azzurro VUOTO (ci metterò io il mentore),
con base e cima dorate e rune luminose. Ai lati, sei nicchie con cristalli colorati (rosso, blu,
giallo, rosa, argento, verde). La metà inferiore è un pavimento lucido e riflettente, scuro, con cerchi
concentrici luminosi azzurri tenui: deve restare libero, perché i personaggi stanno in fila lì sopra
(la linea dei piedi è a circa il 70% dell'altezza). Atmosfera notturna, luce blu e dorata.
Nessun personaggio, nessun testo, nessuna scritta, nessun logo.
```

## 5. I sei emblemi dei titani per i dischi a terra → `emblemi.png`
Allega: la tavola dei titani e, se vuoi, il logo del gioco.

```
Sei medaglioni rotondi in pixel art HD a 16 bit, sfondo trasparente, disposti in una griglia
2 righe x 3 colonne, ben separati, tutti della stessa dimensione. Vista frontale, perfettamente circolari.
Ogni medaglione ha un bordo in metallo dorato con piccole rune e al centro la testa stilizzata di un titano
in rilievo, dentro un disco smaltato del suo colore:
1) Tirannosauro, disco ROSSO;
2) Triceratopo, disco BLU;
3) Felino dai denti a sciabola, disco GIALLO;
4) Pterosauro, disco ROSA;
5) Mastodonte, disco NERO e ARGENTO;
6) Drago, disco VERDE smeraldo.
Stile emblema da serie tokusatsu, luce da sinistra in alto, niente testo.
```

---
Quando me le carichi faccio io: ritaglio, scala, ancoraggio ai piedi, ricolore dove serve, inserimento
nell'atlante e in gioco (titano verde nell'evocazione e nella cavalcata di Kharon, pilota sugli scooter,
prese vere senza il soldato disegnato, nuovo fondale ed emblemi nella scelta dei Sentinels).

---

# Seconda serie (1.9): volti frontali e pose di presentazione

## 6. I volti frontali dei sei Sentinels → `volti.png`
Allega: `fighters.png` e la tavola a 16 pose di Kharon (per colori e caschi).

```
Sei ritratti in pixel art HD a 16 bit per la schermata di scelta del personaggio di un picchiaduro arcade
anni '90, sfondo trasparente, griglia 2 righe x 3 colonne, tutti della stessa dimensione e alla stessa
altezza. Ogni ritratto: busto e casco di un ranger visto perfettamente DI FRONTE, spalle comprese,
sguardo dritto verso chi guarda, luce da sinistra in alto, contorno scuro, riflesso lucido sulla visiera,
identici ai personaggi dell'immagine allegata:
1) ROSSO: casco rosso con visiera nera a punta verso il basso, cresta argento;
2) BLU: casco blu con due corna argentate ai lati;
3) GIALLO: casco giallo con orecchie da felino;
4) ROSA: casco rosa con alette appuntite all'indietro;
5) NERO: casco nero massiccio con bordo argento a forma di zanne;
6) VERDE (Kharon): elmo verde smeraldo da guerriero, spallaccio bianco a mezzaluna e mantello dorato.
Tuta con il motivo a V bianco sul petto, cintura non visibile. Niente testo, niente numeri, niente sfondo.
```

## 7. Le pose di presentazione (facoltative) → `posa_ignis.png` … `posa_kharon.png`
Per la scelta del personaggio "da sala giochi": ognuno fa la sua posa quando lo scegli.
Allega `fighters.png` (per Kharon la sua tavola). Nel prompt cambia solo **[EROE]** come per le prese.

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: [EROE], identico al personaggio dell'immagine allegata (stessi colori, proporzioni e scala).
Griglia 1 riga x 3 colonne, stessa scala, piedi alla stessa altezza, rivolto verso chi guarda (tre quarti):
1) in attesa: guardia rilassata, arma in mano abbassata;
2) presentazione: posa eroica da serie tokusatsu, arma alzata al cielo, gambe larghe;
3) scelto: posa di battaglia, un braccio teso in avanti che indica, l'altro con l'arma dietro.
Contorno scuro, luce da sinistra in alto, niente testo, niente ombra per terra.
```

---

# Terza serie (1.11): il convoglio del capitolo 2

Allega a ogni prompt lo sfondo della stazione merci del gioco (`assets/bg/rail.jpg`) e, per lo stile dei nemici,
`fighters.png`. Il treno appartiene alla Dimensione Oscura: metallo nero-grafite, corazze rosso scuro sulla
locomotiva, bande e luci viola, sbarre alle finestre.

## 8. Il convoglio fermo in stazione → `convoglio.png`
```
Sprite sheet di pixel art HD a 16 bit da picchiaduro arcade anni '90, sfondo trasparente, vista laterale
perfetta (nessuna prospettiva), luce da sinistra in alto, contorno scuro. Soggetto: un treno blindato
della Dimensione Oscura, stesso stile e stessi colori notturni dell'immagine allegata.
Tre pezzi separati in una sola riga, stessa scala, stessa altezza delle ruote:
1) un VAGONE PRIGIONE: metallo nero-grafite con rivetti, una banda viola luminosa lungo il fianco,
   tre finestre con sbarre spesse illuminate da una luce arancione, dietro le sbarre sagome di persone
   con le mani aggrappate, ruote e carrelli scuri;
2) lo stesso vagone con la porta laterale scorrevole aperta e l'interno vuoto illuminato;
3) la LOCOMOTIVA: più alta e lunga del vagone, corazza rosso scuro a piastre, muso inclinato con un
   grande faro giallo, cabina con vetro viola luminoso, due ciminiere che fumano, strisce gialle e nere di
   pericolo in basso, sei ruote grandi.
Proporzioni: il vagone è lungo circa due volte e mezza la sua altezza. Niente testo, niente ombra per terra.
```

## 9. Il tetto del treno in corsa → `treno_tetto.jpg`
```
Fondale di pixel art HD a 16 bit, formato 16:9 (1920x1080), per un picchiaduro a scorrimento anni '90,
stesso stile e stessa palette notturna dell'immagine allegata. Inquadratura: di lato e leggermente
dall'alto, sul TETTO di un treno blindato in corsa di notte. La metà inferiore dell'immagine (dal 64%
dell'altezza in giù) è il tetto su cui si combatte: lamiere grigio-blu con rivetti, nervature per il
lungo, bordo con luci arancioni; deve essere uniforme e ripetibile in orizzontale (il bordo sinistro
continua nel destro). Nella metà superiore: campagna e periferia industriale che scorrono veloci con
scie di movimento, tralicci, capannoni con finestre accese, e in lontananza sopra il mare uno squarcio
viola nel cielo (il varco verso la Dimensione Oscura). Nessun personaggio, nessun testo.
```

## 10. Il tetto della locomotiva → `locomotiva_tetto.jpg`
```
Stesso fondale del prompt precedente (stessa inquadratura, stesso cielo e paesaggio in corsa, stessa
altezza del pavimento al 64%), ma il pavimento è il tetto della LOCOMOTIVA: piastre di corazza rosso
scuro, griglie di raffreddamento incandescenti arancioni, due ciminiere che escono dal tetto e fumano
all'indietro, strisce gialle e nere sui bordi. Ripetibile in orizzontale. Nessun personaggio, nessun testo.
```

## 11. Gli sfondi degli intervalli in borghese (facoltativi) → `assets/bg/intervallo_*.jpg`
Basta salvarli con questi nomi nella cartella `assets/bg/`: il gioco li usa da solo al posto degli
sfondi dei capitoli. Formato 16:9 (1920x1080). Per tutti vale la stessa base:
```
Fondale di pixel art HD a 16 bit per un picchiaduro a scorrimento anni '90, stesso stile e palette
dell'immagine allegata, inquadratura laterale ad altezza d'uomo. Il pavimento occupa la fascia in basso
(dal 62% dell'altezza in giù) ed è libero: lì staranno i personaggi. Nessun personaggio, nessun testo.
```
Poi aggiungi il luogo:

**`intervallo_pizzeria.jpg` — La mattina dopo (dopo il capitolo 2)**
```
Interno di una piccola pizzeria sul lungomare di una città di mare del sud Italia, alba (6:40):
forno a legna a cupola acceso a sinistra con la bocca arancione, bancone di marmo con farina e basilico,
tavolini con tovaglie a quadri, grandi vetrate sul mare con la luce rosa e dorata dell'alba, pesca
del giorno appesa, calendario e foto di famiglia alle pareti. Atmosfera calda e tranquilla.
```

**`intervallo_camera.jpg` — Crepe (dopo il capitolo 4)**
```
La Camera dei Cuori sotto un faro: grotta di pietra antica con colonne, al centro una vasca di luce
azzurra; lungo le pareti sei nicchie con cristalli dei colori rosso, blu, giallo, rosa, nero-argento
e verde; banchi di lavoro con attrezzi e schermi di un'officina robotica sul lato destro; notte,
luce fredda e riflessi sul pavimento bagnato. Atmosfera silenziosa, un po' malinconica.
```

**`intervallo_molo.jpg` — Messaggi a casa (dopo il capitolo 6)**
```
Il molo di una città portuale del sud Italia al tramonto: cielo arancione e viola, barche da pesca
ormeggiate, lampioni che si accendono, a destra l'ingresso di un vecchio bar del porto con l'insegna
e un cabinato arcade illuminato visibile dalla porta; in lontananza sul mare uno squarcio viola nel
cielo (il varco). Atmosfera sospesa, la calma prima della tempesta.
```

**`intervallo_tetti.jpg` — L'ultima ora (dopo il capitolo 7)**
```
I tetti di una città di mare del sud Italia un'ora prima dell'alba: terrazze con panni stesi, antenne,
cupole di chiese; in lontananza la città in fiamme e una fortezza oscura capovolta che galleggia sopra
il porto; cielo blu profondo con un filo di luce all'orizzonte. Atmosfera solenne.
```

## 12. Pose tranquille in borghese (facoltative) → `borghese_calmi.png`
Nelle scene degli intervalli i Sentinels in borghese usano la posa "pronti a combattere". Per scene più
naturali serve un foglio con pose calme:
```
Sprite sheet di pixel art HD a 16 bit, sfondo trasparente, vista laterale di tre quarti, stessi cinque
ragazzi in abiti civili dell'immagine allegata (giacca rossa, felpa blu con occhiali, top e giacca gialla,
giacca rosa e gonna bianca, giubbotto di pelle nero). Per ognuno, in una riga: 1) in piedi rilassato con
le braccia lungo i fianchi, 2) braccia conserte, 3) mano sul cuore, 4) seduto su uno sgabello.
Stessa altezza e stessa scala per tutti, niente ombra, niente testo.
```
