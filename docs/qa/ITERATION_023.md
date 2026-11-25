# Iterazione 023 — 2026-11-25
## Gate precedente
- MASTER_PLAN e DEVELOPMENT_PROGRESS letti su main; inventario branch e PR aperte, diff #21, review e thread (nessun rilievo esterno) esaminati.
- CI 45520681145/job 138891429995: checkout 344b8002f43c86fcf7a9794fdc938d47d3af3101, merge di head b7edff91c7bd8dd3570df0d2b2084d09f4234b77 su base 2c0610045de2e3e472700c47b2c00d17bcda4dbc, 551 test, 551 pass, 0 fail, 0 skipped. Head/base ricontrollati prima dello squash merge confermato b31ea2b40ae54e3f01cd733aea0bcb8651c2e888.
## Piano e revisione sequenziale
- ID05/29: comporre gli adattatori nativi già esistenti senza duplicare subprocessi; conservare coordinate raster e provenienza, non dedurre una trasformazione PDF. Bloccare errori senza restituire parole parziali. Limitare a pagina singola con blocco uniforme selezionato dall'operatore; layout non verificato.
- Rendere il modello italiano un prerequisito effettivo della CI Linux, non saltare il test quando manca. Nessuna nuova regola catastale.
## Implementazione e revisione critica
- 7f89e3800bac0e947cb445e2a8cf9f0b5c888d62: composizione PDF -> raster -> OCR.
- 2d81325f45d04d5a37061eb6a86cb61d1fd93f77: CI installa tesseract-ocr e tesseract-ocr-ita e verifica lingua.
- 25d83852259169aad8ca53b468f481145a60e430: 5 test sintetici, incluso riconoscimento TEST 0007 e blocco PDF bianco, invalido, ruotato, shared buffer.
- Rilievo sequenziale: confrontare soltanto digest riportati dai due adattatori non verifica l'integrità dei componenti. 40c7f962f5534f9975ac2df7f7fa496bf062217d ricalcola i digest di raster, evidenza OCR (incluse parole) e run; 8a45e866e72826a797f846875169fcb3802439ea estende le asserzioni. Nessun agente indipendente disponibile.
## Test e limiti
- Nuovi test predisposti, non ancora dichiarati superati: node --test tests/*.test.mjs (attesi 556). Clone locale non disponibile per DNS GitHub; CI richiesta. Nessun caso catastale integrale né verifica incrociata conteggiati.
- Non sandbox OS, non layout verificato, mapping PDF, OCR multipagina, Windows, autenticazione o compatibilità DOCFA/SISTER. Nessuna pratica reale, firma, trasmissione, dato cliente o modifica licenza.
- Prossimo: gate CI esatto e merge se positivo; isolamento OS, mapping prudenziale, corpus territoriale, adattatori Building Core, UI e QA 100+100. Avviso checkout Node 20 deprecato resta aperto.
