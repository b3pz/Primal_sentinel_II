# Inventario degli asset (build 1.1)

## Sprite in gioco (`assets/sprites`, metadati in `js/atlas.js`)
| Atlante | Contenuto | Origine |
|---|---|---|
| fighters.png | 5 eroi × 8 pose; soldato Senzavolto + varianti "Lama del Velo" e "Bruto di ruggine" | ritaglio per sagoma di `source/fighters.png`; varianti ricolorate |
| bosses.png | Mastice (8 pose); Centipede, Trivor, Mimesi, Kharon, Custode, Vespera, Eclisse (6 pose ciascuno) | ritaglio per sagoma di `source/mastice.png` e `source/campaign-villains.png` |
| titans.png | 5 titani + Concordia, viste di lato/fronte/retro | ritaglio di `source/titans-reference.png` |
| items.png | pizza, pollo arrosto, bibita, cella d'energia, moneta, frammento di Cuore, cassa, fusto esplosivo, bidone, 4 schegge; armi dei ranger (spada, lancia tricorno, pugnali, arco, ascia), pistola, caricatore e Cannone Primordiale (dalla tavola `source/items-hd.png`) | pixel art nuova (`tools/items.py`) |
| ui/logo.png | logo metallico con i cinque Cuori, graffi e nastro | `tools/logo.py` |
| people.png | 9 civili (cameriere, pescatore, signora, anziano, turista, ragazza, impiegato, bambino, scienziata) × fermo/camminata/corsa in preda al panico/riparo/indica; 5 eroi in borghese × fermo/camminata/scatto/posa/braccio alzato/indica | pixel art nuova (`tools/people.py`) |

Ogni fotogramma ha il punto d'appoggio ai piedi: le pose con estensioni (calci, spade, magie)
non vengono più troncate e non "saltano" quando cambiano larghezza.
Correzione: il fotogramma di danno di Onyx aveva la gemma viola del soldato; ora è ridipinto.

## Fondali (`assets/bg`)
port (capitolo 1), rail, park, theater, siege, graveyard, veil, dawn (capitoli 2–8),
più le tavole della storia usate nelle cinematiche. I fondali dei capitoli 2–8 derivano dalle
miniature di `campaign-worlds.png`: sono ingranditi e quindi più morbidi del porto.

## Animazioni ottenute via codice
Salto, caduta a terra, rialzata, presa, lancio, pose del titano nei duelli giganti, colpo di
squadra: realizzati trasformando le pose esistenti (rotazione, spostamento, scie, bagliori).

## Da migliorare in futuro
- Fondali dei capitoli 2–8 disegnati alla risoluzione piena, con livelli di parallasse separati.
- Pose dedicate per salto, a terra e rialzata di eroi e boss (ora sono pose adattate).
- Pose animate dei titani (ora sono viste fisse animate con trasformazioni).
- Voci e colonna sonora registrata (ora c'è musica sintetizzata).

## Tavole generate aggiunte (build 1.3)
| Sorgente | Uso |
|---|---|
| source/rangers-armed.png | pose 8-15 dei ranger: caricamento e colpo con l'arma, speciale, pistola, salto, sbalzato, a terra, presa |
| source/civilians-1.png, civilians-2.png | 9 civili: fermo, camminata, riparo, indica, ringrazia |
| source/heroes-civil.png | i 5 protagonisti in borghese per intro, capitolo 1 e cinematiche |
| source/items-hd.png | armi, pistola, Cannone Primordiale, caricatore, cibo, energia, moneta, frammento |
Ritagliate da `tools/build_hd.py` (bordo scuro di 1 px per eliminare l'alone del generatore).

## 1.6 — in attesa delle nuove tavole
- **Sfondi HD** (7): sostituiranno `assets/bg/*.jpg`; il pavimento deve iniziare intorno a y 465.
- **Pose dei boss** (8 per Centipede, Trivor, Mimesi, Kharon, Custode, Vespera): oggi usano 6 pose.
- **Kharon giocabile** (16 pose come gli eroi): oggi usa le 6 pose del boss (`heroSprite` in `js/core.js`
  passa automaticamente alla tavola nuova quando nell'atlante `fighters` compare `kharon_0`).
- **Musica** (MP3 di Suno): vanno in `assets/music` con i nomi di `assets/music/LEGGIMI.txt`.
- Riutilizzati per le novità: `rexb_0..7` (cavalcata del capitolo 3), `beast_*_run/roar` (evocazione),
  `rock` (frammenti del crollo del capitolo 8); travi e barriere della galleria sono disegnate dal codice.
