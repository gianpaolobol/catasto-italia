# Iterazione 012 — 2026-11-24
## Baseline e piano
- main 81677f4b0f7a4905134103d0ed7aa2a5332331ac; PR #11 merged; head f31193cb2fd2a045f4c1c47ff5177a06b996ecff, CI 45406688456 success, log job core 138489210790: 345 pass, 0 fail/skip. main non protetto: il gate CI viene applicato manualmente.
- ID 04/05/11: partizionare parole PDF in blocchi selezionati esplicitamente, anche su più pagine; conservare coordinate e identità dello span. Nessuna inferenza su unità o graffature.
- Fonte ufficiale consultata e visualizzata: Agenzia delle Entrate, La nuova visura catastale, marzo 2021, pp. 12–13, https://sister.agenziaentrate.gov.it/doc/Guida_Nuova_Visura_Catastale.pdf. Distinzione raggruppamento per titolarità e identificativi/atti; un documento può estendersi su più pagine. Non è specifica di graffatura né fonte di regole operative.
## Revisione piano e implementazione (sequenziale)
- Rischio: interpretare vicinanza geometrica o stessa titolarità come appartenenza alla stessa unità. Decisione: blocchi provvisori, relationship unresolved, nessuna dichiarazione Building Core observed.
- Rischio: parole omesse/assegnate due volte o regioni sovrapposte. Gate: ogni span in una sola regione, contenimento intero, conteggi pagina, nessun output parziale, limite di 32 blocchi e 128 regioni.
- Modulo packages/intake/reviewed-visura-blocks.mjs, re-estrazione locale PDF prima di partizionare; nessuna modifica alle regole normative o al contratto.
## Revisione critica e correzione
- Commit 2a86cab384f25b82e7c4505b22c983e8f11ab73c: prima implementazione.
- Rilievo: chiamata diagnostica su snapshot poteva accettare il digest dichiarato senza ricalcolo. Correzione 24fff78f30bce62ae541188164a67214326fc1d0: ricalcolo SHA-256 e controllo schema/dimensioni pagina. Il digest non prova autenticità; il confine operativo riceve solo byte e ricalcola estrazione.
- Nessun agente indipendente disponibile; revisione sequenziale.
## Test
- 25 nuovi test predisposti in tests/reviewed-visura-blocks.test.mjs (commit a6ba3a7cd748794fb0a1509e68e85330e3af7235), inclusa invocazione nativa Poppler su PDF sintetico, controllo fingerprint, separazione multipagina, esclusioni, mutazioni e blocchi.
- Comando CI: node --test tests/*.test.mjs. Esito nuovo head da confermare; nessuna compatibilità ufficiale o casi integrali conteggiati.
- Avviso CI precedente: checkout usa runtime Node 20 deprecato, runner lo forza a 24. Da verificare aggiornamento pin in iterazione dedicata.
## Limiti e prossimo passo
- Non collega ancora blocchi a singoli identificativi completi o al classamento; nessuna relazione graffata accertata. Non OCR né worker isolato, nessuna firma/invio. Collegare trascrizione per blocco a Building Core con evidenza esplicita e separazione identità/titolarità; proseguire corpus territoriale e collaudi integrali. Licenza invariata, solo fixture sintetiche.
