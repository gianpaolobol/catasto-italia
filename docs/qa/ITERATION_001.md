# Iterazione 01 — Building Core (2026-11-24)
Base main: 9321d587eb58db392112ea837f92a2214216c4ea. Nessuna PR aperta e nessuna CI PR rilevata prima dell'iterazione.
## Pianificazione e revisione sequenziale
ID 01: ADR modularità, confini di fiducia, local-first e minacce. ID 02: primo contratto versionato JSON, validazione strutturale e semantica, fonti e date, identificativi opachi, unità con più riferimenti. R02/R10/R13/R14. Nessuna regola normativa introdotta: fonte ufficiale richiesta prima delle regole.
Rilievi: evitare equivalenza graffatura/unità; distinguere unknown, proposed, calculated, observed; dati privati esclusi; separare schema da attestazione ufficiale. Implementati nel contratto e ADR.
## Revisione del diff e correzione
Confronto main/branch: sette file iniziali, nessuna cancellazione. Prima suite 28/28 passata. Revisione sequenziale del codice: mancavano limiti alla complessità di input. Correzione: limiti array, budget totale delle visite, riduzione degli errori per campi sconosciuti. Aggiunti cinque test negativi. Limite di dimensione pre-parsing rimane requisito di ingestione. Nessun agente indipendente disponibile in questa esecuzione.
## Evidenze riproducibili
33/33 controlli sintetici passati, eseguendo le funzioni del validatore e dei test in un runtime ECMAScript, anche dopo rilettura dei file dal branch. Blob verificati:
- packages/building-core/snapshot.schema.json: 293f320fa5a423b6b488dfeff2f666425d5b823b
- packages/building-core/index.mjs: 0602fd48c048ffba544be29aa0e4196c8df5ed1c
- tests/building-core.test.mjs: 5812a4682ace1d895fb1969b347f9250de08c6f6
Comando CI previsto: node --test tests/building-core.test.mjs. Il wrapper Node e GitHub Actions non sono ancora verificati in questa esecuzione locale; attendere esito workflow sulla PR. I 33 test sono test unitari del contratto, NON 33 pratiche catastali complete e NON 33 revisioni indipendenti.
## Gate residui
ID 01: ADR pronto per revisione/merge; sandbox, cifratura e gestione segreti non implementate. ID 02: prima versione, non modello immobiliare completo; diritti, geometria, classamento e scambio reale da implementare. ID 03: prossima fase, corpus fonti ufficiali nazionali/locali versionato e tracciabile. Nessuna compatibilità DOCFA/SISTER attestata. Non integrare main prima della CI positiva sulla SHA effettiva.
