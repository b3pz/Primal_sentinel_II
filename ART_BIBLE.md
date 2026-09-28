# Identità visiva — versione 1.0

## Fonte dei personaggi
`assets/fighters.png` è la fonte effettiva dei cinque eroi del livello 1.
La scelta personaggio e il ritratto HUD mostrano il medesimo sprite usato nel gioco.
Le vecchie tavole dei Power Rangers e la prima tavola del rosso non sono incluse.
Non generare nuovi ritratti autonomamente senza un confronto con questo atlante.

| Eroe | Colore | Casco | Ruolo |
|---|---|---|---|
| Ignis | Rosso | Cresta arretrata | Equilibrato |
| Azur | Blu | Due corna corte | Tecnico |
| Lyra | Giallo | Orecchie feline | Veloce |
| Aura | Rosa | Pinne arretrate | Energia |
| Onyx | Carbone | Calotta squadrata | Potente |

Elementi condivisi: visiera nera, corazza a V argento, cintura con fibbia circolare,
guanti/stivali argento, sottotuta scura. La visuale opposta nel gioco è specchiata.
Le differenze estetiche minori dell'atlante generato richiedono ancora una passata
manuale: questa è una baseline, non una certificazione pixel per pixel.
Il fotogramma 8 della riga di Onyx è escluso perché contiene un dettaglio errato.

## Ritaglio degli sprite
Le tavole sorgente restano in `assets/source`. Gli sprite si ritagliano con `tools/build_all.py`
seguendo la sagoma reale (componenti connesse), mai con una griglia fissa: una griglia
tronca calci, pugni, armi e magie che escono dalla cella.

## Civili ed eroi in borghese
Pixel art a pixel doppio (`tools/people.py`), contorno scuro, luce dall'alto a sinistra.
Colori in borghese coerenti con l'armatura: Ignis giacca rossa, Azur felpa blu,
Lyra giacca gialla, Aura cardigan rosa, Onyx giacca nera.

## Cinematiche
Usare composizioni dei fondali con gli stessi sprite ritagliati dagli atlanti. Evitare il ritratto pittorico dei cinque eroi nel quadrante inferiore destro
di story.png: è una prova precedente e non viene mostrato nel gioco.
Per Vespera l'intro usa il primo fotogramma della sua riga in campaign-villains.png,
non la sua illustrazione precedente in story.png. Menu e camera dei Cuori usano
soltanto i quadranti senza protagonisti di story.png.
Questo metodo mantiene gli stessi abiti durante gioco, selezione e narrazione.

## Scala e composizione
Canvas logico 1280×720, ridimensionamento proporzionale. Eroi 150 px inclusi margini;
Mastice 270 px. Area dei piedi: y 480–668. Nemici ordinati per coordinata y.
Palette ambiente: blu notte, verde acqua, ambra; energia nemica viola.
HUD e testo sono codice, non incorporati nelle immagini: rimangono modificabili.

## Titani: progetto di assemblaggio
Tiranno rosso: torso e testa; triceratopo blu: gamba destra; felino giallo: gamba
sinistra; pterosauro rosa: scudo del petto e ali; mastodonte nero: braccia.
Le viste dei titani sono ritagliate in `assets/sprites/titans.png` e usate nei duelli giganti.

## Produzione
Non confondere una tavola generata con animazioni già allineate e testate.
Prima di accettare nuove pose controllare casco, simbolo, cintura, numero delle dita,
colore degli arti, altezza e punto d'appoggio. Fondali successivi sono moodboard,
non livelli pronti con collisioni. Conservare sempre la fonte precedente.
