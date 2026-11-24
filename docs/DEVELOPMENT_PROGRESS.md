# Registro sviluppo
- 2026-11-24: piano iniziale e autoverifica documentati. Nessun motore implementato, nessun test ufficiale eseguito.
- Prossimo: ID 01–02, ADR e schema condiviso; revisione e test prima del merge.

## Iterazione 01 — 2026-11-24
- Branch feat/building-core-foundation: ADR-001, contratto Building Core 0.1.0 e validatore; 33/33 controlli unitari sintetici eseguiti in ECMAScript anche da sorgenti rilette dal branch.
- Revisione sequenziale, non indipendente: introdotti limiti di validazione dopo rilievo; evidenze in docs/qa/ITERATION_001.md.
- ID 01 ADR pronto; ID 02 prima tranche, estensioni ancora necessarie. CI PR da verificare prima del merge. Non conta come collaudo di pratiche catastali complete.
- Prossima: verificare CI e diff finale; ID 03 fonti ufficiali versionate, poi estendere modello in funzione delle fonti e degli adattatori. Nessuna firma, trasmissione o test DOCFA reale.

## Iterazione 02 — 2026-11-24
- PR #1 verificata merged (ed982018c85e40037b70ad8824bb4acbf6dd7c08), workflow 45321928862 success.
- ID 03 prima tranche, branch feat/normative-registry-v01: 4 fonti indicizzate, registro versionato e lookup prudenziale; 24 test nuovi, CI richiesta. Nessuna fonte operativa attivata. Evidenze docs/qa/ITERATION_002.md.
- Prossimo: confermare CI e integrare solo se positiva; acquisire corpus consolidato/territoriale e costruire gate di applicabilità. Nessun test ufficiale DOCFA/SISTER.
