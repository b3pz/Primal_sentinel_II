# Strumenti per gli asset

Richiedono Python 3 con `pillow`, `numpy` e `scipy`.

- `python3 build_all.py`: ritaglia di nuovo gli sprite delle tavole in `assets/source/`
  seguendo la sagoma reale di ogni posa, così calci, pugni e magie non vengono troncati.
  Disegna poi oggetti, civili ed eroi in borghese e rigenera `assets/sprites/*.png` e `js/atlas.js`.
- `python3 make_backgrounds.py`: prepara i fondali dei capitoli (`assets/bg/`).

Moduli:
- `segment.py`: ritaglio per componenti connesse con punto d'appoggio ai piedi.
- `items.py`: pixel art di cibo, energia, armi e oggetti di scena.
- `people.py`: civili ed eroi in borghese, con uno scheletro animato
  (camminata, corsa in preda al panico, riparo, braccio alzato, trasformazione).
- `pack.py` e `pixel.py`: impaginazione degli atlanti e primitive di disegno.

Per aggiungere una tavola nuova basta metterla in `assets/source/`, aggiungere
una chiamata `segment(...)` in `build_sheets.py` e rilanciare `build_all.py`.
