# PRIMAL SENTINELS II — CUORI DI STELLA · anteprima 0.6.1

Nella 0.6.1: nuovo sfondo di Reggio Calabria (col lungomare, la statua sul molo e la Fata Morgana).

Nella 0.6: i sette sfondi nuovi dei capitoli 2-8 (la flotta sopra il porto, il faro, Venezia, Roma col Colosseo, Reggio con la Fata Morgana, la forgia di Torino e Genova, Catania con l'Etna e la nave del Sovrano), usati anche nei duelli dei titani.

Nella 0.5: dal capitolo 4 le Sentinelle combattono con l'armatura Cuori di Stella vera: 16 pose nuove per Ciusky, Beps, Kathy, Kiki e Don (camminata, pugno, calcio, arma, mossa speciale con lo spirito del titano, sparo, salto, colpito, a terra e la posa di vittoria del capo squadra).

Nella 0.4: arrivano i titani veri. Leone alato, Grifone, Lupa, Sirena dello Stretto, Toro di ferro, Paladino e Paladino Stellare hanno le loro tavole a 8 pose nei duelli giganti (al posto di Concordia ricolorata). L'evocazione con 3 Sigilli ora chiama il titano del tuo Sentinel (Rigel chiama Astrale) solo dopo che quel titano è nato nella storia; prima arriva l'ultimo titano che la squadra ha. Nella galleria, sezione TITANI, ci sono i sette titani e i mostri giganti di questo gioco.

Nella 0.3: i Sentinels si chiamano solo Ciusky, Beps, Kathy, Kiki e Don (più Rigel); nessun vecchio nome.


**Tutta la storia è giocabile, dal capitolo 1 al finale.** È una prima stesura "da vivere": la trama,
i dialoghi, i boss e i duelli ci sono tutti, ma dal capitolo 2 molte immagini sono ancora quelle del primo
gioco ricolorate, in attesa delle tavole nuove (vedi `PROMPT_IMMAGINI_II.md`, blocco 2).

| Cap. | Titolo | Dove | Boss | Duello dei titani |
|---|---|---|---|---|
| 1 | La stella caduta | Porto Aurora, la festa | Rigel | — (Rigel fugge su Astrale) |
| 2 | La flotta di ferro | Porto Aurora sotto la flotta | Generale di Ferro (scudo e spallaccio da rompere) | Concordia contro Magnar: non si può vincere, i titani vengono catturati |
| 3 | Senza armatura | Le strade del faro | — ondate fino alla fine | — poi la scena dei Cuori di Stella |
| 4 | Il Leone di Venezia | Venezia | Rigel, secondo duello | Leone Alato contro l'Idra della laguna |
| 5 | La Lupa e il ribelle | Roma | Centurione di Ferro | Lupa contro il Colosso di Ferrea |
| 6 | Il canto dello Stretto | Reggio Calabria e la Fata Morgana | Vespera del Vuoto | Sirena contro il Mostro del Vuoto |
| 7 | La forgia di ferro | Torino e Genova | Il Fabbro di Ferrea | Paladino contro il Tiranno Rosso in catene |
| 8 | L'ultimo re | Catania e la nave sopra l'Etna | La Guardia del Re | Paladino Stellare contro il Re del Vuoto |

Novità di gioco:
- **Capitolo 3 senza armatura**: si combatte in borghese, più deboli, senza speciali né pistola né colpo di
  squadra; si usano tubi, remi e assi trovati per strada.
- **Generali con l'armatura a pezzi**: scudo e spallaccio assorbono i colpi finché non li rompi
  ("SCUDO ROTTO!", "NUCLEO SCOPERTO!"); i colpi pesanti li rompono prima.
- **Rigel**: dal capitolo 6 combatte con voi controllato dal computer se c'è un posto libero; finito il
  capitolo 5 si sblocca anche nella scelta dei personaggi (il sesto Sentinel del II al posto di Sirio).
- **Cuori di Stella**: dal capitolo 4 i Sentinels hanno una luce dorata (segnaposto fino alle tavole nuove).
- Gli sfondi nuovi si attivano da soli: basta mettere `bg_flotta.jpg`, `bg_faro.jpg`, `bg_venezia.jpg`,
  `bg_roma.jpg`, `bg_stretto.jpg`, `bg_forgia.jpg`, `bg_etna.jpg` in `assets/bg/`.
- Salvataggi, record, opzioni e stanze online sono separati dal primo gioco.

Da fare con le tavole nuove: armature Cuori di Stella a 16 pose, titani folk veri, Paladino, mostri e boss
nuovi, borghese da combattimento, intervalli in borghese del II, Forma Stellare, colpi in coppia, droni da
riprogrammare, acqua alta a Venezia.

---

# (Dal primo gioco) # PRIMAL SENTINELS — Il cuore dei titani
Ideato e sviluppato da b3pZ. Build 1.7: campagna completa in 8 capitoli, modalità extra, da 1 a 4 giocatori.

## Avvio
Estrai tutto lo ZIP e apri `index.html` con Chrome, Edge o Firefox (Mac o Windows).
Non serve installare nulla. Per GitHub Pages pubblica il contenuto della cartella
`primal-sentinels` così com'è (index.html, js, assets, vendor devono restare insieme).

## Telefono e tablet (novità 1.7)
Il gioco funziona anche su telefono e tablet (Android e iPhone/iPad, in orizzontale).
1. Pubblica la cartella `primal-sentinels` su GitHub Pages (o un qualsiasi sito https).
2. Apri l'indirizzo dal telefono con Chrome (Android) o Safari (iPhone).
3. **Installa come app**: Chrome → menu ⋮ → *Installa app* / *Aggiungi a schermata Home*;
   Safari → Condividi → *Aggiungi alla schermata Home*. Parte a schermo intero, in orizzontale,
   con la sua icona, e dopo la prima apertura funziona anche **senza internet** (tranne l'online).

Comandi touch (compaiono solo sui dispositivi touch):
- **Levetta** a sinistra: appare dove appoggi il pollice. Spinta fino in fondo di lato = **corsa**.
- **Pulsanti** a destra: ATTACCO (grande), SALTO, SPECIALE, PISTOLA, SCHIVA, SQUADRA
  (tenuto premuto = evocazione del titano). In alto al centro **II** = pausa.
- Titolo e demo: **tocca lo schermo**. Menu: tocca le voci. Scelta dei Sentinels:
  **tocca un Sentinel** per sceglierlo, toccalo di nuovo per confermare.
- Se giri il telefono in verticale o esci dall'app, la partita va in pausa da sola.
- Puoi collegare un controller Bluetooth al telefono: funziona come sul PC.
- Online dal telefono (dalla 1.12.1): se il collegamento diretto è bloccato (tipico sul 4G/5G), il gioco
  passa da solo da un **relay gratuito** (Open Relay di metered.ca). Nella stanza vedi "COLLEGAMENTO DIRETTO"
  o "COLLEGAMENTO RELAY" e il ping. Tocca un Sentinel per sceglierlo, toccalo di nuovo: pronto;
  l'host tocca **VIA!**; "◀ INDIETRO" in alto a sinistra per uscire.
- Se il relay gratuito fosse pieno o bloccato: crea un account gratuito su metered.ca e apri una volta
  `index.html?metered=NOME-APP&mkey=CHIAVE` (viene ricordato su quel dispositivo). Oppure un tuo server TURN:
  `?turn=turn:server:3478&tu=utente&tp=password`.

## Modalità
- **Gioca · 1–4 giocatori su questo PC**: cooperativa locale. Ogni giocatore entra
  premendo un tasto sul proprio dispositivo: controller (A o X), tastiera 1 (F, J o Spazio),
  tastiera 2 (K o Num1). Si sceglie l'eroe con ◀ ▶ e si conferma con pugno.
- **Cooperativa online con codice**: uno crea la stanza e comunica il codice di 5 caratteri,
  gli altri lo inseriscono. Fino a 4 giocatori, ciascuno sul proprio PC.
- **Capitoli**: riparti da un capitolo già sbloccato (il salvataggio è locale nel browser).
- **Modalità extra**: Boss Rush (gli 8 boss di fila), Sopravvivenza (ondate infinite, un boss ogni 5),
  Sfida a tempo (un capitolo sbloccato, senza dialoghi, conta il cronometro). Senza continui.
- **Classifiche** con le iniziali (3 lettere, come in sala giochi) per storia, Boss Rush, Sopravvivenza
  e Sfida a tempo (il miglior tempo di ogni capitolo).
- **Galleria**: Sentinels, nemici, boss, titani, cinematiche da rivedere e luoghi, man mano che li sblocchi.
- **Opzioni**: volume della musica e degli effetti separati, audio acceso/spento, schermo intero,
  **tasti personalizzabili** (tastiera per 1 giocatore, le due metà della tastiera per 2 giocatori, controller).
- Se resti sul titolo parte il giro del cabinato: intro, classifica e una **demo giocata dal computer**.

## Comandi
| | Tastiera (1 giocatore) | Tastiera 1P (in due) | Tastiera 2P (in due) | Controller |
|---|---|---|---|---|
| Muovi (doppio tocco = corsa) | WASD / frecce | WASD | frecce | stick / croce |
| Attacco: pugno, calcio, colpo con l'arma | J | F | K / Num1 | X |
| Pistola (pochi colpi) | K | G | L / Num2 | Y |
| Speciale con l'arma (40 energia) | L | R | O / Num3 | B |
| Salto (+ attacco = calcio volante) | Spazio | Spazio | I / Num0 | A |
| Schivata | Shift | Shift sinistro | Shift destro | RB / RT |
| Colpo di squadra | I | T | P / Num4 | LB |
| Pausa | Esc / Invio | Esc | Invio | Start |

Il tutorial animato **COME SI GIOCA** (dal menu, dalla pausa e automaticamente la prima volta
prima del capitolo 1) mostra ogni mossa con i tasti che si illuminano, per tastiera, controller e
due giocatori sulla stessa tastiera. Durante la partita i tasti da premere compaiono sullo schermo
quando servono: colpo di squadra pronto, "SPRIGIONA IL TUO POTERE!", "AFFERRALO!", "SALTA!".

- **Combo**: attacco ×3 = pugno, calcio e colpo finale con l'arma personale; in corsa = carica con l'arma.
- **Pistola**: 8 colpi a inizio capitolo, massimo 12; i caricatori escono dalle casse e dai nemici.
- **Prese**: quando un nemico è stordito compare "PRESA!": attacco lo afferra, attacco = ginocchiate,
  indietro + attacco = lancio alle spalle, salto = lancio in avanti contro gli altri.
- **Speciali in base all'arma**: Kiki (arco) tre frecce da lontano; Ciusky (spada) onda di fuoco e Beps
  (lancia) affondo a media distanza; Don (ascia) e Kathy (pugnali) da vicino.
- **Colpo di squadra**: la squadra si riunisce, le cinque armi diventano il Cannone Primordiale.
- I fusti rossi esplodono. Senza energia lo speciale costa un po' di vita, come nei cabinati.

**In squadra** (cooperativa locale e online):
- **Rianimare**: quando un compagno va K.O. resta a terra con un cerchio che si svuota (8 secondi).
  Avvicinati e **tieni premuto ATTACCO** finché si rialza: non perde la vita.
- **Lancio del compagno**: quando un compagno salta accanto a te premi ATTACCO e lo scagli come un proiettile.
- **Presa doppia**: se un compagno ha afferrato un nemico, premi ATTACCO davanti al nemico: lo sollevate
  insieme e lo schiantate a terra, con un'onda d'urto sugli altri.
- **Cibo condiviso**: chi mangia recupera tutto, i compagni vicini metà.

**Evocazione del titano**: con almeno 3 Sigilli dei Titani trovati (in tutto il gioco) puoi evocare il tuo
titano una volta per capitolo **tenendo premuto COLPO DI SQUADRA** (quando la barra squadra non è piena).
Il titano attraversa lo schermo travolgendo i nemici.

**Duelli giganti** (capitoli 3, 5 e 8): tutti i giocatori pilotano insieme il titano o Concordia.
Attacco = pugno, pistola = colpo pesante, schivata tenuta = parata, salto = passo rapido.
Quando la barra "equilibrio" del mostro si svuota, speciale lancia l'arma finale.



## Novità della 1.14.1 — il salto sul treno
- Capitolo 2: nella scena in cui i Sentinels saltano sul convoglio ora rimpiccioliscono mentre saltano verso
  il treno (che è più lontano del marciapiede), atterrano davvero sul tetto del vagone e viaggiano con lui.
  Prima sembravano giganti che entravano nella carrozza.
- La scena subito dopo ("Tutti a bordo!") non fa più scorrere la locomotiva sotto i piedi dei Sentinels:
  treno e Sentinels restano fermi insieme e corre solo il paesaggio, come quando si è davvero sul treno.

## Novità della 1.14 — intervalli in borghese
Nei quattro momenti chiave della storia i Sentinels si tolgono l'armatura: una scena tranquilla con
Ciusky, Beps, Kathy, Kiki e Don in borghese (chi sono, cosa provano, cosa rischiano) e poi
un'attività **facoltativa** con un premio per il capitolo dopo:
- dopo il cap. 2 · **La mattina dopo** (pizzeria sul lungomare) → *Il forno di Ciusky*: sforna ogni pizza
  al punto giusto; le mance diventano monete per il negozio di Boris.
- dopo il cap. 4 · **Crepe** (Camera dei Cuori) → *L'allenamento di Boris*: ripetete le sequenze di frecce;
  con 4 sequenze su 6 si parte dal capitolo 5 con la barra squadra piena.
- dopo il cap. 6 · **Messaggi a casa** (il molo al tramonto) → *Il cabinato del bar*: 45 secondi di
  Astro Invaders, il punteggio diventa monete.
- dopo il cap. 7 · **L'ultima ora** (i tetti prima dell'alba, con Sirio) → *Il giuramento dei Cuori*:
  premete a tempo con il battito; con il 60% di sintonia tutti hanno una vita in più.
In co-op ognuno ha il suo forno, la sua astronave e la sua fila di battiti; online funziona uguale.
START salta le scene, e l'attività si può sempre saltare con "PROSEGUI LA STORIA".
Sfondi dedicati facoltativi: vedi PROMPT_IMMAGINI.md, sezione 11.
- Online: tolta un'impostazione che ogni tanto bloccava il collegamento; se la stanza non risponde entro
  12 secondi il gioco richiama da solo.

## Novità della 1.13 — salvataggio e pagelle
- **Salvataggio automatico della storia** (Facile e Normale): il gioco salva all'inizio di ogni capitolo e a ogni
  zona raggiunta (compare "SALVATAGGIO" in basso a destra). **GIOCA → CONTINUA LA STORIA** riparte da lì con
  monete, potenziamenti, punteggi e crediti. In **Arcade** niente salvataggi: si parte sempre dal capitolo 1.
  Finita la storia il salvataggio si cancella (i capitoli restano sbloccati).
- **Pagelle vere** a fine capitolo, come Cuphead: Tempo (con obiettivo per capitolo), Danni subiti (a testa),
  Vite perse, Continui, Combo massima, Sigilli e — se c'è — il Duello dei Titani. Totale su 100 e voto
  D · C · C+ · B- · B · B+ · A- · A · A+ · S. La S serve quasi perfetta; in Facile il massimo è A.
  Il tempo e i danni contano anche per le zone rifatte dopo un CONTINUA. Il miglior voto di ogni capitolo
  si vede in CAPITOLI.

## Novità della 1.12.1 — online sui telefoni
- **Relay TURN automatico**: iPhone↔iPhone, iPhone↔Android, telefoni su 4G/5G ora si collegano.
- **Niente più lag che si accumula**: canale veloce non ordinato per immagini e comandi, coda di invio
  ridotta da ~2 secondi a pochi fotogrammi, buffer anti-scatti adattivo sul client, pressioni dei tasti
  ripetute e contate una volta sola, effetti e suoni che non si perdono.
- Stanza online usabile col touch (tocca per scegliere/pronto, VIA! per l'host, INDIETRO) e indicazione
  DIRETTO/RELAY + ping. Host e ospiti devono avere entrambi la 1.12.1.

## Novità della 1.12
- **Boss a tre fasi** (come Cuphead): a 2/3 e a 1/3 della vita il boss ruggisce, respinge tutti e passa a una
  nuova serie di attacchi, più veloce (tacche e "FASE 1/3" sulla barra del boss).
- **Sottomenu disegnati nel gioco** come il menu principale: Modalità extra, Capitoli, Opzioni (volumi con ◀ ▶) e Pausa.
- **Voci**: ogni personaggio "parla" con un suono suo mentre scorre il testo (Astro acuto, Boris cupo, ArMV3z
  profondo…); i Sentinels gridano quando fanno la speciale; i boss ruggiscono al cambio di fase.
- **Sirio in squadra**: se giochi un capitolo con il sesto Sentinel, dice la sua prima della partenza.
  Il Sentinel verde si chiama **Sirio** e ha la stessa altezza degli altri (prima sembrava più piccolo).
- **Dialoghi**: il nome del Sentinel è seguito da quello civile (CIUSKY · CIUSKY…). **Finale aperto** verso il
  prologo e il capitolo successivo: "LA STORIA CONTINUA...".
- **Continua nei duelli giganti**: riparti subito, il mostro resta ferito.
- **Pressa** (capitolo 6): scorre su una rotaia e insegue i giocatori, si ferma sopra il bersaglio (cerchio rosso)
  e schiaccia; attira i soldati sotto di lei per schiacciarli (+400 ciascuno).
- **Oggetti a tema**: niente pensiline e cassonetti nei posti sbagliati — container sul molo del capitolo 5 e
  nella fabbrica del capitolo 6.
- **Treno**: il tetto della locomotiva si attacca al paesaggio senza la cucitura del fumo.
- **Unione dei titani**: al posto dei cinque titani in fila, ognuno entra da solo con il suo nome, stile sigla.

## Novità della 1.11.2
- **Tetto del treno e della locomotiva dipinti** (le tue tavole): il paesaggio scorre veloce, il tetto segue la
  telecamera, dall'ultimo tratto si combatte sul tetto rosso della locomotiva con le ciminiere.

## Novità della 1.11.1
- Il **convoglio disegnato** (la tua tavola `convoglio.png`) in stazione e nella scena della partenza:
  vagoni prigione con le sbarre, un vagone aperto e la locomotiva rossa con il fumo viola.

## Novità della 1.11 — duelli tra giganti
- **Combo**: ATTACCO ×3, il terzo colpo spinge indietro il mostro. Se schiacci sempre lo stesso tasto
  il mostro **si protegge** e contrattacca: la CODATA gli sfonda la guardia.
- **Parata perfetta**: PARATA premuta un attimo prima del colpo = nessun danno, il mostro barcolla e per
  1,2 secondi i vostri colpi fanno di più (CONTRATTACCO). Parata tenuta a lungo = parata normale (35% del danno,
  il raggio passa al 60%).
- **Salto** (sopra l'onda sismica) e **schivata** (◀ + SALTO: invulnerabile, evita artigliate e cariche).
- **Interrompere**: la CODATA durante la carica del mostro lo blocca.
- **SCONTRO**: la nuova PRESA del mostro fa partire un braccio di ferro, tutti i piloti premono ATTACCO.
  Se vincete lo proiettate lontano, se perdete vi respinge.
- **FURIA** sotto metà vita: attacchi più rapidi e più prese. Avvisi più chiari su cosa fare per ogni attacco.

## Novità della 1.10 — la storia
- **Storia riscritta** (sceneggiatura completa nel documento condiviso): i Sentinels hanno un nome e un mestiere
  (Ciusky, Beps, Kathy, Kiki, Don), Kharon è **Sirio**, il primo pilota dei titani; il mentore è **ArMV3z**,
  i robot sono due: **Astro** (radar, allarmi) e **Boris** (riparazioni e bottega). I nemici vengono dalla
  **Dimensione Oscura** e Vespera è la **Regina Oscura**. Nuovi testi per intro, dialoghi, scene animate e titoli di coda.
- **Testi leggibili**: dialoghi, didascalie e descrizioni usano un carattere chiaro (Exo 2) più grande;
  il carattere pixel resta per titoli e nomi.
- **Capitolo 2**: il convoglio è fermo in stazione con i prigionieri alle sbarre; una scena mostra il treno che parte
  e i Sentinels che saltano sul tetto. L'ultimo tratto è davvero la **locomotiva** (corazza rossa, griglie, ciminiere
  che fumano, niente spazi tra i vagoni). **Prigionieri alla Metal Slug**: colpisci la gabbia (3 colpi) e il
  prigioniero liberato ti lascia un regalo (pollo, munizioni, energia, gemma…), +1000 punti e 2 monete.
- **Capitolo 3**: niente più Sentinel in groppa. Il **Tiranno Rosso** è grande quanto un titano (più del doppio
  dei soldati), lo guidate con i Cuori, i nemici lo attaccano al muso o alla coda e raccoglie gli oggetti su cui passa.

## Novità della 1.9.2 (le tue tavole: volti e pose)
- **Volti frontali** dei sei Sentinels: nelle schede della scelta del personaggio e nei ritratti in partita (in alto).
- **Pose di presentazione**: nella scelta del personaggio chi è in fila aspetta con l'arma in mano, quello scelto
  indica, quando è PRONTO alza l'arma al cielo. Le stesse pose nel menu principale e nella schermata VS dei boss.

## Novità della 1.9.1
- **Menu principale disegnato nel gioco** (non più pulsanti da pagina web): logo, raggi colorati, voci in stile
  sala giochi con la barra dorata, descrizione della voce scelta, Sentinels ai lati che alternano guardia,
  arma in pugno e posa. Si usa con frecce/croce + INVIO/✕, col mouse o toccando la voce;
  sulla difficoltà ◀ ▶ la cambia. Se nessuno tocca niente per 40 secondi parte il giro del cabinato.
- **Scelta dei Sentinels**: quelli in fila alternano guardia e posa con l'arma, quello scelto resta nella sua posa.

## Novità della 1.9
- **Menu principale ridisegnato**: logo al centro, GIOCA in evidenza, le altre voci su due colonne,
  i Sentinels ai due lati.
- **Scelta dei Sentinels**: Ciusky (rosso) al centro, gli altri ai lati e più vicini, tutti più grandi;
  ◀ ▶ si muove nell'ordine in cui li vedi. Nelle schede in basso c'è il ritratto del Sentinel scelto.

## Novità della 1.8.1 / 1.8.2
- **Controller della PlayStation Classic** (Sony, USB, 2018) riconosciuto da solo: ✕ ○ □ △, L1/R1/L2/R2,
  SELECT, START e croce funzionano senza calibrare.
- **OPZIONI → PROVA E CALIBRA IL CONTROLLER**: premi i tasti e vedi sul disegno quali riconosce il gioco.
  Se non corrispondono (succede con molti controller USB "tipo PlayStation" e con alcuni browser su Mac),
  premi CALIBRA: il gioco chiede ✕, ○, □, △, L1, R1, L2, R2, SELECT, START e le quattro frecce, e da quel momento
  legge il controller giusto. La calibrazione resta salvata per quel modello di controller.
- Le frecce dei controller che le mandano come "cappello" (un solo asse) ora funzionano anche senza calibrare.
- Nel tutorial un cerchio bianco mostra anche i tasti che stai premendo davvero.

## Novità della 1.8 (le tavole che hai generato)
- **Il Drago Verde**, titano di Kharon: evocazione, tutorial e galleria (pagina Titani, dopo aver sbloccato Kharon).
- **Scooter col pilota del Velo** nel capitolo 1: entra impennando e, se lo colpisci di fronte mentre arriva,
  il pilota vola giù (+500 punti) e lo scooter resta a terra fumante.
- **Prese vere** per tutti e sei i Sentinels: presa, ginocchiata, sollevamento (presa doppia) e lancio,
  con il nemico disegnato a parte (non più dentro la posa dell'eroe).
- **La base dei Sentinels** come fondale della scelta del personaggio, con Argo dentro la colonna centrale,
  e **i sei emblemi dei titani** sui dischi a terra sotto il Sentinel scelto.

## Novità della 1.7.1 / 1.7.2
- **Simboli PlayStation**: il gioco mostra ✕ ○ □ △, L1/R1, OPTIONS ovunque (tutorial, suggerimenti in partita,
  scelta dei Sentinels, opzioni). Con un controller Xbox collegato passa da solo ad A B X Y, LB/RB.
  Si può forzare in OPZIONI → SIMBOLI CONTROLLER (Automatico / PlayStation / Xbox).
- **Mappatura del controller** più facile da trovare: OPZIONI → PULSANTI DEL CONTROLLER. Scegli l'azione,
  premi il pulsante: se era già usato, le due azioni si scambiano. Resta salvata nel browser.
- Il tutorial mostra il controller PlayStation grigio (immagine `assets/ui/pad_ps.png`): i pulsanti da premere
  si illuminano sul disegno e sotto c'è cosa fa ognuno. Pausa = START, SELECT libero.

Comandi predefiniti PlayStation: □ attacco · △ pistola · ✕ salto · ○ speciale · R1/R2/L2 schivata ·
L1 squadra · START pausa · levetta sinistra o croce per muoversi.

## Novità della 1.7
- **Versione mobile**: comandi touch (levetta + pulsanti), app installabile con icona, schermo intero
  in orizzontale, gioco offline, pausa automatica, avviso "ruota il telefono" (vedi sopra).
- **Nuova scelta dei Sentinels** in stile sala giochi: tutti i Sentinels in fila nella Camera dei Cuori,
  Argo dietro nel suo cilindro; quello scelto avanza sul disco con l'emblema del suo titano e le frecce
  1P/2P/3P/4P lo indicano. In basso, per ogni giocatore, la dote del Sentinel con pregio e difetto.
- **Doti dei Sentinels**: Ciusky FIAMMA (i colpi di spada incendiano), Beps PORTATA (la lancia arriva più
  lontano), Kathy DOPPIO SALTO, Kiki PLANATA (tieni salto per scendere piano), Don CORAZZA (i colpi
  leggeri non lo interrompono), Kharon PARATA (schivata da fermo = parata).
- **Presentazione dei boss**: prima di ogni boss lo schermo VS con i suoi **punti di forza** e i suoi
  **punti deboli** (come batterlo). Attacco/salto per saltarla.
- **La bottega di Sette**: tra un capitolo e l'altro si spendono le monete raccolte (monete, gemme,
  sigilli, boss, zone ripulite, civili salvati) in potenziamenti per il resto della partita: più vita,
  energia più veloce, più colpi di pistola, barra squadra carica in partenza, crediti.
- **Argo nell'intro**: il mentore appare nella sala dei cuori durante l'introduzione.
- Correzioni: i nemici aggirano pensiline e auto invece di fermarsi contro; i Sentinels controllati dal
  computer scendono dai tetti delle auto e dalle rocce quando il nemico è in strada.

## Novità della 1.6.9
- **Il Colpo di squadra avviene nell'arena**: i giocatori si mettono in fila dove sono (rivolti verso i nemici),
  i Sentinels che non giocano arrivano in colonne di luce, le armi si alzano e volano nel Cannone Primordiale
  che il capo squadra impugna, e il raggio arcobaleno attraversa il campo di battaglia.
- I nemici non salgono più sopra auto, cassonetti e pensiline (e non ci atterrano quando vengono lanciati):
  prima potevano restare lassù, fuori portata.

## Novità della 1.6.8
- Sul treno i nemici **saltano davvero** tra un vagone e l'altro (rincorsa, salto ad arco e atterraggio),
  invece di galleggiare sopra il buco.

## Novità della 1.6.7
- **Muri invisibili morbidi**: vicino ai bordi dell'arena si viene spinti con dolcezza verso il centro (più forte
  quando si è circondati), così non si resta incastrati contro il bordo dello schermo. Anche i nemici non si
  ammucchiano ai lati.
- Chi viene scaraventato contro il bordo **rimbalza** (eroi e nemici), invece di finire fuori dallo schermo.
- **Lo speciale va sempre dentro l'arena**: l'eroe si gira da solo verso il lato con più nemici (o verso il centro
  se è su un bordo) e fa un passo via dal bordo.

## Novità della 1.6.6
- **ARGO, il Guardiano dei Cuori**: il mentore nella colonna di luce. Dà le missioni all'inizio dei capitoli,
  conosceva Kharon mille anni fa e saluta i Sentinels nel finale.
- **SETTE, il robot assistente**: commenta i capitoli (e va nel panico), presenta COME SI GIOCA e giudica il
  voto nel riepilogo di fine capitolo.
- **Kharon è il sesto Sentinel verde**: da giocabile ha l'armatura verde e il mantello d'oro (il Kharon nemico
  resta scuro). Argo glielo annuncia quando la corazza del Velo si spezza.
- Galleria: nuova sezione ALLEATI (Argo, Sette, Dott.ssa Valli).

## Novità della 1.6.5
- Gli scooter del capitolo 1 ora hanno un soldato del Velo alla guida.

## Novità della 1.6.4
- **Colonna sonora nuova**, originale e generata dal gioco (niente file, niente licenze): 12 brani a 4 canali
  (melodia, basso, arpeggio, batteria) con strofa e ritornello — sigla, un tema per ognuno degli 8 capitoli,
  boss, duelli dei titani e finale (`js/music.js`). Gli MP3 in `assets/music` restano facoltativi e hanno la precedenza.
- **Kharon nell'intro**: dopo aver finito la storia compare accanto ai Sentinels nella scena della trasformazione,
  sul titolo e nel menu.
- **Oggetti in scala**: l'auto è grande come una vera citycar accanto ai personaggi, cassonetti e pensiline
  più grandi; il salto è un po' più alto per salirci sopra.
- **I civili non attraversano più** auto, cassonetti, pensiline e oggetti: li aggirano, e gli ostaggi non
  compaiono più sopra una piattaforma o un oggetto.

## Novità della 1.6.3
- **Kharon giocabile con la sua tavola**: 16 pose come gli altri eroi (pugno, calcio, affondo, fendente viola, colpo
  dalla mano con la pistola, salto, caduta, vittoria). `tools/build_kharon.py` la rigenera.

## Novità della 1.6.2
- **Nuove pose dei boss** (8 ciascuno) per Centipede, Trivor, Mimesi, Kharon, il Custode e Vespera: guardia, passo,
  carica, attacco, mossa speciale, colpito, a terra, in ginocchio (quando la guardia viene sfondata).
- **Kharon giocabile** usa ora le stesse 8 pose (anche la mossa speciale e la caduta a terra).
- Le nuove pose si vedono anche nella Galleria. `tools/build_boss_poses.py` le rigenera.

## Novità della 1.6.1
- **Sfondi HD** per i capitoli 2-8 (scalo merci, parco, teatro, città in fiamme, fabbrica dei titani, Velo, alba),
  allineati al pavimento di gioco (`tools/build_hd_bg.py` li rigenera dalle immagini originali).

## Novità della 1.6
- **Capitolo 2 · la galleria**: il treno entra in un tunnel buio. Travi basse (tieni SCHIVATA per abbassarti)
  e barriere sul tetto (salta). Un avviso con il tasto giusto compare prima di ognuna.
- **Capitolo 3 · in sella al Tiranno rosso**: a metà capitolo il titano si risveglia e la squadra gli sale in
  groppa. Attacco = morso, salto = codata, speciale = ruggito che stordisce tutti, pistola = ognuno spara
  dalla groppa. Il titano ha la sua barra di vita; prima del boss torna nella foresta.
- **Capitolo 8 · il crollo**: prima di Vespera la fortezza si sgretola e lo schermo scorre da solo; frammenti
  che cadono (guarda il cerchio a terra), nemici del Velo e il vuoto che avanza da sinistra.
- **Mosse in coppia, rianimazione, cibo condiviso** (vedi "In squadra") e **evocazione del titano**.
- **Rallentatore e lampo bianco** sull'ultimo colpo a ogni boss e ai mostri giganti.
- **Kharon giocabile** (si sblocca finendo la storia) con la sua Onda del traghettatore; per ora usa le pose del
  boss, quando arriva la sua tavola verrà sostituita.
- **Costumi alternativi**: OMBRA (12 sigilli) e ORO (finisci la storia). Nella scelta dei giocatori: ▲▼.
- **Modalità extra, classifiche con iniziali, demo del cabinato, galleria, opzioni, tasti personalizzabili,
  volume separato** (vedi Modalità).
- **Musica MP3 facoltativa**: metti i brani in `assets/music` con i nomi indicati in `assets/music/LEGGIMI.txt`
  (sigla, capitolo1…capitolo8, boss, titani, finale); se mancano si sente la musica sintetizzata.
- Tutorial con due pagine nuove: IN SQUADRA e TITANO E GALLERIA.

## Novità della 1.5
- **Duelli giganti con pose vere**: Tiranno rosso e Concordia hanno pose per morso/pugno, codata/montante,
  parata, colpo subito, arma finale; Trivor, Mastice risorto e Vespera Eclisse caricano, colpiscono e crollano.
- **Cinematiche dei titani**: il risveglio del Tiranno rosso (capitolo 3), la corsa dei cinque titani e
  l'unione pezzo per pezzo in Concordia con la cabina di pilotaggio (capitolo 5), Concordia Alba (capitolo 8),
  la caverna dei titani nell'intro e l'alba finale.
- **Nuovi nemici**: droni con jetpack, scudati (solo colpi forti o alle spalle), granatieri che lanciano
  granate da lontano, mastini meccanici veloci, ninja del Velo che si teletrasportano alle spalle.
- **Una meccanica per capitolo**: scooter che attraversano la strada (1), treno (2), specchi che generano
  copie oscure finché non li rompi e riflettori che cadono (4), antenna da difendere (5), generatori che
  ricaricano l'energia e pressa idraulica (6), gravità ridotta e rocce fluttuanti (7-8).
- **Livelli bonus** dopo i capitoli 2, 4 e 6: distruggi la capsula del Velo in 30 secondi.
- **Ritratti illustrati** nei dialoghi e nell'HUD.
- **Sfondi fermi** nell'intro, nelle cinematiche, nei dialoghi e nei menu: si muovono solo i personaggi.

## Novità della 1.4
- **Difficoltà** (menu principale): Facile (crediti infiniti), Normale (4 crediti per tutta la partita),
  Arcade (2 crediti, sempre dal capitolo 1, nemici più forti).
- **Crediti e GAME OVER**: quando la squadra è a terra compare CONTINUA? 10…0. Finiti i crediti è
  GAME OVER definitivo e si ricomincia da capo, anche a un passo da Vespera.
- **Combo**: attacco ×4 = pugno, calcio e due colpi con l'arma, con una scia colorata ben visibile.
- **Presa**: cammina contro un nemico per afferrarlo (vale per tutti tranne boss e droni);
  a schermo compaiono i tasti per ginocchiata e lanci.
- **Pistola**: 12 colpi, fino a 20; caricatori frequenti; sotto i 4 colpi si ricarica da sola lentamente.
  Su + sparo = colpo in diagonale verso l'alto, necessario contro i **droni del Velo**.
- **Guardia dei boss**: una barra mostra la guardia; i colpi con l'arma la sfondano e il boss resta stordito.
- **Scenari su più livelli**: auto, cassonetti e pensiline dove salire con il salto (il salto si può dirigere in aria).
- **Nemici dal basso** e, nei capitoli del Velo, da portali che si aprono nel pavimento.
- **Sigilli dei Titani**: 3 per capitolo, nascosti sopra le piattaforme, nelle casse o in angoli; si vedono in CAPITOLI.
- **Riepilogo di fine capitolo** con tempo, danni, civili salvati, continui, sigilli e voto S/A/B/C.

## Cosa contiene questa versione
- 8 capitoli giocabili con la trama del documento di progetto, ognuno con 3 zone,
  ondate di nemici, civili da proteggere e un boss con attacchi propri:
  Mastice, Centipede (si divide), Trivor (trivella e si interra), Mimesi (copie oscure
  degli eroi), Kharon (parata e onde di spada), il Custode (sfere e rinforzi),
  Kharon liberato, Vespera (raggio, teletrasporto, evocazioni).
- Capitolo 2 sul treno in corsa: il paesaggio scorre, passano i pali, tra un vagone e l'altro ci
  sono buchi da saltare (chi cade perde vita; i nemici scaraventati lì volano giù dal treno);
  i prigionieri sono chiusi in gabbie d'energia e il portale del Velo si avvicina durante il boss.
- 3 duelli giganti: Tiranno rosso contro Trivor, Concordia contro Mastice risorto,
  Concordia Alba contro Vespera Eclisse.
- Intro animata di circa un minuto, saltabile (con i ranger che appaiono dentro le cinque capsule): il lungomare con i civili, il terremoto,
  la frattura nel cielo, i soldati che escono dalle vetrine, Vespera oltre il Velo, la camera
  dei Cuori e i cinque protagonisti in borghese che si trasformano.
- Capitolo 1: si comincia in abiti civili e la prima trasformazione si fa premendo speciale.
- Cinematiche animate tra un capitolo e l'altro (e prima dei titoli di coda) che raccontano come
  prosegue la storia; dialoghi all'inizio dei capitoli e prima dei duelli giganti.
- Schermata del titolo con il logo, menu da cabinato, font pixel, HUD con barre a segmenti,
  transizioni a tendina colorata tra le scene.
- Sprite ritagliati di nuovo seguendo la sagoma: calci, pugni, spade e magie non sono più tagliati.
- Nuovi asset: logo, le cinque armi dei ranger e il Cannone Primordiale, pizza, pollo arrosto,
  bibita, cella d'energia, moneta, frammento di Cuore, casse, fusti esplosivi, bidoni, schegge; 9 tipi di civili animati;
  i 5 eroi in borghese (camminata, corsa, posa, trasformazione); due nuove varianti di soldato.
- Musica e suoni sintetizzati, diversi per ogni capitolo.

## Cooperativa online: come funziona
Il dispositivo che crea la stanza esegue la partita; gli altri inviano i comandi e ricevono le immagini
della partita 30 volte al secondo (20 con 3–4 giocatori). Dalla 1.12.1 immagini e comandi viaggiano su un
canale "veloce" che non aspetta i pacchetti persi, e chi si collega mostra le immagini con un piccolo
ritardo regolato da solo (buffer): niente più scatti o ritardi che si accumulano.
Se il collegamento diretto non è possibile passa da un relay TURN gratuito. Il collegamento è diretto tra i browser (WebRTC):
serve Internet solo per l'incontro iniziale tramite il servizio pubblico gratuito di PeerJS.
Non c'è un server vostro da mantenere, quindi funziona anche da GitHub Pages.
Su alcune reti aziendali o scolastiche il collegamento diretto può essere bloccato dal firewall.
In quel caso provate da un'altra rete (ad esempio un hotspot del telefono).
Se un giocatore esce, la partita continua per gli altri.
Server di incontro personale (facoltativo): `index.html?peer=indirizzo:porta`.

## Verifiche eseguite
- Sintassi di tutti gli script e caricamento sia da server locale sia da file (`file://`).
- Partite simulate da giocatori controllati dal computer con 1, 2 e 4 giocatori su tutti gli 8 capitoli
  (galleria, cavalcata del Tiranno e crollo compresi) e sui 3 duelli giganti: tutti completabili, senza errori.
- Boss Rush completo, Sopravvivenza oltre l'ondata 20, Sfida a tempo, inserimento delle iniziali e classifiche.
- Cooperativa locale con due tastiere e con due controller simulati.
- Cooperativa online tra due browser reali: stanza, lobby, scelta degli eroi, intro, dialoghi,
  livello, duello gigante e uscita di un giocatore.
- Online con rete simulata cattiva (30% di pacchetti persi e fino a 120 ms di ritardo variabile):
  movimento fluido sul client, 30/30 effetti sonori arrivati, comandi del client corretti.
- 1.7: telefono simulato (844×390, touch) e tablet (1024×768): tocco sul titolo, menu, scelta del
  Sentinel toccandolo, partita con levetta (camminata e corsa) e pulsanti, pausa, avviso in verticale,
  tutorial con i comandi touch. Schermate VS dei boss, bottega, nuova scelta dei Sentinels.
- Non sono stati provati controller fisici, telefoni reali, Safari su Mac/iPhone né reti con firewall restrittivi.

## File
`index.html`, `style.css` · `js/`: gioco (dati, motore, rendering, cinematiche, rete)
`assets/sprites`: atlanti ritagliati · `assets/bg`: fondali · `assets/source`: tavole originali
`vendor/peerjs.min.js`: libreria di rete · `tools/`: script Python che rigenerano gli asset
`assets/fonts`: font pixel con licenza libera SIL OFL (Press Start 2P, Pixelify Sans, Bungee)
`artbook.html`: catalogo visivo · `ASSET_STATUS.md`: inventario · `assets/music`: brani MP3 facoltativi.
`js/extra.js`: galleria, cavalcata, crollo, mosse in coppia, evocazione, modalità · `js/modes.js`: menu extra,
classifiche, demo, galleria, opzioni · `js/cpu.js`: giocatore controllato dal computer (demo e test).
`js/touch.js`: comandi touch · `manifest.json`, `sw.js`: app installabile e gioco offline (`tools/build_sw.py` rigenera l'elenco)
`PROMPT_IMMAGINI.md`: i prompt usati per le tavole della 1.8 (`tools/build_v18.py` le ritaglia).
