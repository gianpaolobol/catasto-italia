# catasto-italia

<!-- inizio-riquadro-linee-guida -->
> **Linee guida v1.1.0** — Questo progetto segue le linee guida comuni dei progetti di Gian Paolo Franceschini: leggi prima [`LINEE_GUIDA.md`](LINEE_GUIDA.md), poi [`AGENTS.md`](AGENTS.md) e [`STATO.md`](STATO.md).
<!-- fine-riquadro-linee-guida -->


## Diritti / Copyright

**Copyright © 2026 Gian Paolo Franceschini** — Tutti i diritti riservati esclusivamente sui contributi originali di sua legittima titolarità, nei limiti delle licenze applicabili e delle concessioni preesistenti. Restano salvi i diritti di terzi. Vedi [LICENSE](LICENSE) e [RIGHTS_NOTICE.md](RIGHTS_NOTICE.md).

## Laboratorio locale (prototipo non ufficiale)
Solo dati sintetici, Node.js 22 o successivo. Dal clone: `node apps/workbench/server.mjs`; aprire `http://127.0.0.1:8765`. Selezionare un esempio (fusione, divisione, nuova costruzione, diversa distribuzione interna, variazione di destinazione), caricarlo, modificare i campi guidati (inventario, subalterni proposti, copertura e trascrizioni distinte), analizzarlo e scaricare il rapporto diagnostico JSON. La modalità JSON avanzata rimane disponibile; le modifiche invalidano il rapporto e non aggiornano automaticamente le evidenze. È una UI di ricerca con dati modificabili, non un programma DOCFA né una pratica validata. Non usare documenti reali e non esporre il server in rete. Test: `node --test tests/workbench.test.mjs`.

### Confronto visura sintetica
Nell'editor guidato, aprire il pannello di confronto, selezionare un identificativo osservato e generare un esempio derivato o importare una trascrizione JSON sintetica di campi isolati. Il confronto mostra campi trascritti, locatori, divergenze e valori irrisolti; non modifica né valida la pratica. L'esempio non è una prova indipendente; non importare visure reali. Il segnaposto Z999 della fixture non rappresenta un'associazione ufficiale con SYNTH.

### Partenza da trascrizione sintetica
Scegliere uno scenario e usare **Prepara da esempio trascritto**, oppure scaricare il modello JSON e reimportarlo dopo modifiche. Il formato `synthetic-reviewed-visura` separa gruppi osservati/proposti, unità di origine, copertura e coppie dichiarato/trascritto con locatore. L'esempio nasce con presupposti non accertati; esaminarli separatamente nell'editor prima dell'analisi. L'import è locale, non certifica i raggruppamenti o le prove e non accetta documenti ufficiali. Nessun OCR automatico collegato.

### Variazione per distribuzione interna
Scenario di ricerca ristretto: una sola unità ordinaria con un solo subalterno, confini, destinazione, mappa e identificativi dichiarati invariati. L'ipotesi diagnostica V mantiene l'identificativo osservato e non presume invariati classamento o consistenza. Fonte storica ufficiale: circolare 9/2001; applicabilità vigente e territoriale da verificare. Nessun export operativo.

### Annesso geometrico sintetico
Dopo un'analisi diagnostica positiva, selezionare un'unità C/V, inserire un contorno ortogonale semplice in mm (senza vertice iniziale duplicato), misurare e scaricare l'annesso JSON separato vincolato al digest del caso. L'esempio a L misura 8 m² geometrici. Nessun coefficiente catastale, scala CAD verificata, foro, sovrapposizione fra contorni, o classamento. Modificare il caso invalida la misura; modificare i vertici invalida l'annesso. Non usare dati reali.

### Variazione di destinazione dell'intera unità
Scenario diagnostico limitato a una unità originaria e una risultante, entrambe con un solo subalterno, stessa particella, identificativo proposto distinto, confini e mappa dichiarati invariati, senza fusione/divisione. Le dichiarazioni e trascrizioni restano separate; non è proposta di classamento né verifica edilizia. Fonti storiche: circolari 9/2001 e 1/2006 §4; applicabilità attuale da verificare. I casi combinati o complessi restano esclusi. Nessun export operativo.

### Annesso estimativo sintetico
Dopo una proposta diagnostica, selezionare un’unità C/V, dichiarare categoria ordinaria, classe, zona fittizia SYNTH-n, consistenza e tariffa inventata. Il server ricalcola il caso e restituisce il prodotto decimale esatto, con download JSON separato. Non è un classamento, tariffario ufficiale o calcolo arrotondato secondo DOCFA. Non usare valori di clienti. Il riferimento metodologico storico è Agenzia delle Entrate, Il Sistema Catastale, edizione 2021, §6 p. 29; non prova la vigenza o la tariffa locale.

### Dossier diagnostico con annessi correnti
Dopo l’analisi, è possibile misurare un contorno e calcolare un prodotto estimativo per una o due unità risultanti (un annesso per tipo). Il dossier HTML stampabile riunisce relazione, operazioni, evidenze e gli annessi correnti; il server locale ricalcola entrambi dalle dichiarazioni e blocca incoerenze. Se un annesso è stato modificato e non ricalcolato, il dossier dichiara esplicitamente che non è incluso. Nessuna superficie o rendita catastale ufficiale, nessun file DOCFA. Anche lo scenario ampliamento a sagoma in mappa invariata è disponibile.

### Avvio locale su Windows (prototipo sintetico)
Con Node.js 22 o successivo già installato, fare doppio clic su `Avvia-Catasto-Italia.cmd` nella cartella del repository estratto. Il browser apre l'indirizzo locale indicato nella console; se non si apre, copiarlo manualmente. La porta è assegnata dal sistema, non esposta in rete. Lasciare la finestra aperta durante l'uso; Ctrl+C arresta il server. Alternativa: `node apps/workbench/launch-local.mjs --no-browser`. Nessun installer, DOCFA o invio ufficiale. Usare esclusivamente fixture sintetiche; il collaudo Windows è da verificare.

### Archivio completo e riapertura verificata [Codex]
Il pulsante ZIP crea dossier, sessione, rapporto, tre handoff diagnostici e manifest. Selezionare il file ZIP nel campo di riapertura: vengono letti solo i byte della sessione JSON, il server locale rigenera l'intero ZIP e l'app confronta tutti i byte prima di sostituire il lavoro corrente. Solo archivi canonici della versione corrente; non è un lettore ZIP generico e non autentica chi lo ha prodotto. La sessione JSON separata rimane un percorso di recupero. Non inserire dati reali. PR #57: CI Chromium e Windows verificate sul commit integrato; riapertura diretta ZIP in nuova PR, CI da verificare.

### Interscambio geometrico v0.2 [Codex]
Nel pannello Building Core, selezionare il destinatario e scaricare l'interscambio con geometrie correnti. Il server ricalcola la sessione, trasferisce esclusivamente unità C/V, contorni in mm, posizione dichiarata o nulla, provenienza della calibrazione e misure geometriche; unità senza misura esplicite. Nessun dato estimativo o unità conservata, nessuna superficie catastale o scala verificata. Formato diagnostico separato dal precedente JSON e dallo ZIP canonico, importatori destinatari non validati. PR #58 integrata dopo CI positive.

### Importazione geometrica multipla [Codex]
Nel pannello geometrico scaricare il modello JSON delle unità senza misura, compilare i vertici in mm e le eventuali posizioni (obbligatorie per le conservate), eliminare le righe vuote e importare il file. Il digest vincola il modello alla pratica corrente; l'import aggiunge soltanto nuove misure, tutte ricalcolate dal server, e non modifica quelle già presenti. Un errore blocca l'intero gruppo. Solo dichiarazioni sintetiche, non import CAD/IFC/DOCFA. PR #59 integrata dopo CI positive, nuovo import da collaudare.

### Promemoria per verifica manuale DOCFA [Codex]
Dopo l'analisi scaricare il promemoria JSON: operazioni, identificativi, evidenze, relazione, misure e simulazioni ricalcolate, lacune geometriche/estimative e possibili sovrapposizioni degli ingombri. Anche con tutti gli annessi presenti, i controlli ufficiali restano aperti. Non è un tracciato o un modello importabile in DOCFA; non usare dati reali. PR #61: 108 pratiche sintetiche integrali e 108 cross-check superati in CI, non validazione professionale. Nuovo promemoria in attesa di CI.
