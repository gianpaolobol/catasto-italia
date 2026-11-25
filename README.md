# catasto-italia

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
