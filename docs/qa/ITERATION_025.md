# Iterazione 025 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS da main, branch e PR aperte; diff #23, review e thread esaminati (nessuna review esterna).
- CI [45534682762](https://github.com/gianpaolobol/catasto-italia/actions/runs/45534682762), job core 138938261199: checkout 8736ebfdbe1c114ad1d005d00a25eb3d3ff9bb6e, merge di d996bda4e9ca1efe5f32fc74f4478190d4917f4e su 71ff3b7a4867f5e089e780f7186aa5e740d41504; 565/565 pass, inclusi test PDF-OCR nativi. Head/base ricontrollati; squash merge confermato 72236629b88cd647b0002380cdd4c735a7d69bf6.
## Piano e revisione sequenziale
- ID05/28: predisporre rettangoli per evidenziare le parole OCR sull'esatta immagine raster in futura UI, indipendentemente dalla risoluzione di visualizzazione. Coordinate normalizzate intere in [0,1000000], origine in alto a sinistra, estremi arrotondati verso l'esterno; nessun mapping PDF, nessuna inferenza catastale.
- Conservare ID e ordine originali e legare l'overlay al digest della catena; blocco senza output parziale su dati invalidi. L'overlay non autentica la rasterizzazione o il layout, non è una prova di scala PDF. UI futura deve usare l'immagine esatta, controllare il suo digest raster e non sovrapporre direttamente al PDF o a un ritaglio diverso. Non esportare testo o score nell'overlay; rimangono nelle parole OCR da revisionare.
## Implementazione e revisione critica
- 1a647688be4583e73c42e8d1c80a116618131a52: funzione pura buildRasterReviewOverlay.
- 552433c4edaa62f86d3492b7f151b712d114e155: overlay inserito nell'evidenza della pipeline prima del calcolo chainSha256. Il digest della catena cambia, come previsto, per le nuove evidenze; nessun contratto operativo esterno certificato.
- 74f1ecb9793590ec8decaa5a37cf0fbfc59a669d e 776dce4283f83a3c2ed8b3de3d0347b1068003bd: test sintetici e asserzioni nel test nativo. Rilievo sequenziale: esempi con numeri divisibili non sono sufficienti per validare gli arrotondamenti; introdotto confronto con oracolo BigInt su 100 geometrie distinte (b96478712babcdb3e3fda76488fc1be874224e55). Validazione esplicita delle quattro coordinate anche su array sparsi, assenza di risultati parziali e nessun score duplicato.
## Test e limiti
- Node 22.16.0: node --test tests/ocr-raster-review-overlay.test.mjs, 11/11 pass, zero fail o skip; entrambe le copie locali ricostruite da sorgenti rilette da GitHub hanno blob SHA identici (modulo a85f54bc1b98849751e42dc70d69ea78a5e057df, test bfc130159722308d6ac88c07cbdb70db2f4ae4a2). Clone completo non disponibile per DNS; integrazione nativa nuova e CI completa ancora da verificare, attesi 576 test.
- I 100 esempi geometrici sono sottocasi tecnici automatici, NON 100 pratiche catastali né 100 verifiche incrociate professionali. Revisione sequenziale, nessun agente indipendente disponibile.
- Non sandbox OS, non UI effettiva, non layout o mapping PDF certificato, non Windows/multipagina OCR. Nessuna nuova regola catastale, modifica licenza, dato cliente, firma o invio. DOCFA/SISTER non verificati.
- Prossimo: gate CI esatto; UI di revisione con raster vincolato, isolamento OS, corpus territoriale, adattatori Building Core e QA integrale 100+100.
