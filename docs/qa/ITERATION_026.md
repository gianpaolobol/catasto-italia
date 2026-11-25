# Iterazione 026 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS da main, branch e PR aperte; diff #24 e review/thread esaminati (nessuna review esterna).
- CI [45542302228](https://github.com/gianpaolobol/catasto-italia/actions/runs/45542302228), job core 138963485147: log checkout 5d3e542f9d171786dbee66008a07c65cb1b63a60, merge di 66b7e7e386d14b2c1d031532ef1bf73c4da36c9e su 72236629b88cd647b0002380cdd4c735a7d69bf6; 576/576 pass, zero fail/cancel/skip, incluso test nativo PDF-OCR. Head/base ricontrollati; squash merge #24 confermato cb937d0f11ae9c5a3f11fe6b71f8a30057da4ad1.
## Piano e revisione sequenziale
- ID05/28/29: restituire su richiesta il raster PGM esatto usato dall'OCR nella stessa invocazione, preservando il precedente contratto metadata-only e senza ridisegnare il PDF. Prima della visualizzazione, verificare copia canonica, dimensioni, hash raster, evidenze annidate e proiezione ricalcolata; bloccare senza raster o risultati parziali.
- Revisione piano: buffer mutabile e hash non firmati; il chiamante locale deve ricontrollare immediatamente prima di visualizzare, non serializzare/inviare automaticamente; nessuna autenticazione, UI, mapping PDF o decisione catastale implicita. Non accetta input di rete arbitrario, è un confine di consistenza per dati locali.
## Implementazione e revisione critica
- 448a12c376d52ffa9fd8aedd7411e28e858ebaa4: prepareExactRasterReview, copia PGM e verifica di digest e overlay.
- 2ece32f60f3f21508635281f647bc4e21c95cdfe: API opt-in recognizeDiagnosticPdfReview, solo successo espone il raster, fallimento reviewRaster=null; API precedente invariata.
- 3183ae31de92c66dff1d69d2876b084f933ca4bb e 8a3fcda6f7418830b6e19e0832e455f2adc87544: 10 test unitari e 2 test pipeline, modifica pixel a dimensione identica, testo, digest annidati, overlay alterato anche ricalcolando hash esterno, input non valido; asserzione di non regressione API precedente.
- Revisione sequenziale: versione del risultato inizialmente non vincolata, verifica geometrica fuori dalla gestione eccezioni; correzioni b27b444998cda5248ab9a4b3155ce0a199695b92 e 54077bf8da855c7fe17eb33ba603200783b42404. Digest non autenticati, possono essere tutti ricalcolati da un soggetto che altera l'intero insieme.
## Test e limiti
- Nuova suite: comando previsto node --test tests/ocr-exact-raster-review.test.mjs tests/pdf-ocr-diagnostic.test.mjs e CI completa, attesi 588 test. Non dichiarati superati: clone locale fallisce DNS (git ls-remote), nonostante Node 22.16.0 e Poppler/Tesseract con italiano disponibili. CI da verificare sul head/base esatti.
- Nessun agente indipendente, revisione sequenziale. Nessun nuovo caso catastale integrale, verifica professionale, fonte/regola catastale o test DOCFA/SISTER. Nessun dato cliente, modifica licenza, firma o trasmissione.
- Prossimo: gate CI esatto; interfaccia locale con raster verificato e interazione, isolamento OS, corpus territoriale, adattatori Building Core e QA 100+100.
