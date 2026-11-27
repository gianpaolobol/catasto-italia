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

## Iterazione 03 — 2026-11-24
- PR #2 verificata merged (e35e5828b657f3686be5521bb89be4400bfc3b1d), workflow 45328239379 success.
- ID 03 seconda tranche: 8 fonti totali, 4 nuove pending. Vademecum nazionale finale reperito; verifica vigenza e corpus territoriale aperte.
- ID 07 prototipo di ricerca non operativo: annessione, omissione originaria, omissione autonoma e diversa distribuzione; revisione sequenziale e correzioni, 30 nuovi test predisposti. Branch feat/docfa-research-triage; CI da confermare prima del merge. Evidenze docs/qa/ITERATION_003.md.
- Prossimo: CI/merge, fonti territoriali e collegamento a evidenze Building Core; estendere motore, nessuna compatibilità ufficiale dichiarata.

## Iterazione 04 — 2026-11-24
- PR #3 verificata merged (6eff5e02633b0eb563bb51c1ade79b82c2c77660), workflow 45335369064 success.
- ID 07–12/26 tranche: anteprima non operativa per fusione, divisione e nuova costruzione con Building Core 0.1.0, conteggio unità graffate, controllo collisioni e riferimenti a fonti. 35 test nuovi; revisione sequenziale con correzione del controllo tipo. Vademecum pp. 44, 53, 54, 56–57 consultato e visualizzato; vigenza e territorio restano aperti.
- Branch feat/evidenced-unit-transitions; CI richiesta prima del merge. Evidenze docs/qa/ITERATION_004.md. Nessun test ufficiale DOCFA/SISTER.
- Prossimo: verifica CI e merge; collegare prove ai singoli fatti, consolidare corpus territoriale, integrare le anteprime e progettare inventario subalterni.

## Iterazione 05 — 2026-11-24
- PR #4 integrata (687c41ed2b28318384b338983f2e3a3cf06405a5), CI 45343204759 success sul head esatto. Main poi avanzato per documentazione dei diritti, senza modifiche al codice.
- ID 10–11: inventario diagnostico Building Core, 27 test nuovi predisposti, revisione sequenziale con correzione sul supporto delle proposte; nessuna disponibilità dedotta o assegnazione. Branch feat/identifier-inventory-audit; evidenze docs/qa/ITERATION_005.md. CI da verificare.
- Prossimo: collegare inventario alle transizioni e prove di copertura; fonti territoriali ancora aperte, nessuna verifica DOCFA/SISTER reale.

## Iterazione 06 — 2026-11-24
- PR #5 confermata merged (80cc0bbe6adf5809c85aa8386fbb0c5eac971f09), CI 45350763517 success.
- ID 07/10–11: audit composito delle transizioni e inventario con dichiarazione di copertura per snapshot, particella, data, fonte, claim e valori esatti. Correzione da revisione sequenziale: legame ai valori, non soltanto ID. 33 nuovi test sintetici predisposti; CI richiesta. Branch feat/transition-coverage-audit; evidenze docs/qa/ITERATION_006.md.
- Non operativo, nessuna disponibilità o riserva accertata. Prossimo: CI e merge se verificati; corpus territoriale, prove per fatto, copertura multi-documento, acquisizione visure. Nessun test DOCFA/SISTER reale.

## Iterazione 07 — 2026-11-24
- PR #6 verificata merged a e4b0445795d06d247cd00301f38de93e7090961e; CI 45358631165 success sul head esatto.
- ID 02/04/07/12/26: audit di trascrizioni per fatto/fonte, digest del caso, conflitti e fonti mancanti; correzione sequenziale sul tipo delle fonti. 36 nuovi test predisposti, branch feat/field-evidence-audit, CI richiesta. Riferimenti ufficiali per futura acquisizione visure e competenza territoriale, guida regionale ancora non verificata per applicabilità. Evidenze docs/qa/ITERATION_007.md.
- Non operativo, nessuna autenticazione o disponibilità dimostrata; copertura di particella multi-documento ancora aperta. Prossimo: CI/merge, acquisizione visure e corpus territoriale. Nessun test ufficiale DOCFA/SISTER.

## Iterazione 08 — 2026-11-24
- PR #7 confermata merged (6683fcabcbbc5eeed6f0a56fc3a7b77291f65589), CI 45367946456 success.
- ID04/05/13/14/26: intake di 12 campi già isolati da visura attuale singolo identificativo; provenienza per campo, decimali, date e unità separate, assenze e conflitti. Revisione sequenziale e correzioni, 32/32 controlli ECMAScript su sorgenti rilette; CI Node richiesta. Branch feat/visura-field-intake. Evidenze docs/qa/ITERATION_008.md.
- Non parser PDF/OCR, non autentica fonte o raggruppamento, nessun claim osservato automatico; fonte compatibile Building Core 0.1.0. Prossimo: CI/merge, estrazione con coordinate, graffature e annotazioni, corpus territoriale. Nessun test ufficiale DOCFA/SISTER.

## Iterazione 09 — 2026-11-24
- PR #8 confermata merged (e86484132a13748e2785145be15c97f62e95dc8e), CI 45377259150 success sul head esatto, job core verificato.
- ID04/05: isolatore geometrico prudenziale di campi visura da regioni selezionate e span preestratti; esclusione aggiornamenti/annotazioni/riferimenti terreni, blocco ambiguità e ripetizioni; 34/34 controlli ECMAScript su sorgente riletta e un controllo di integrazione con intakeVisura. Revisione sequenziale, non indipendente. Branch feat/visura-coordinate-intake; CI Node richiesta. Evidenze docs/qa/ITERATION_009.md.
- Prossimo: CI/merge, adattatore PDF effettivo, coordinate e rotazioni, raggruppamento documentato e digest, corpus territoriale. Nessun test ufficiale DOCFA/SISTER o pratica integrale.

## Iterazione 10 — 2026-11-24
- PR #9 verificata merged (65e0918f9f24f5ff975ce90e6a810f719049045b), CI 45386609548 success sul head esatto e job core verificato.
- ID04/05: adattatore PDF testuale locale con Poppler, coordinate normalizzate e digest SHA-256, blocchi per documenti o geometrie non supportati. Revisione sequenziale: corretto errore nativo sulle pagine ruotate con pdfinfo. 33/33 test puri da sorgenti rilette e 5/5 prove native su copia locale dopo correzione; 39 nuovi test predisposti, CI Node/Poppler richiesta. Branch feat/pdf-text-coordinate-adapter. Evidenze docs/qa/ITERATION_010.md.
- Prossimo: CI/merge se verificati; binding digest e regioni, raggruppamento e parole multiple con revisione, worker isolato, OCR e corpus territoriale. Nessun caso catastale integrale o test ufficiale DOCFA/SISTER.

## Iterazione 11 — 2026-11-24
- PR #10 verificata merged (3e05e8b010ebd2c81507034c2d7e97a12e92d982), workflow 45396353407 success sul head esatto; log core 323/323 test.
- ID04/05: percorso locale PDF → regioni selezionate → intake, vincolo a digest PDF e snapshot estratto; unione esplicita delle sole coppie importo/unità supportate, locatori originari preservati. Revisione sequenziale e correzione del fingerprint. 22 nuovi test nativi predisposti; CI richiesta. Branch feat/pdf-review-binding; evidenze docs/qa/ITERATION_011.md.
- Non operativo, nessuna autenticità o raggruppamento verificato. Prossimo: CI e merge se positiva, gruppi di identificativi con evidenze, worker isolato, corpus territoriale. Nessun test ufficiale DOCFA/SISTER o caso catastale integrale.

## Iterazione 12 — 2026-11-24
- PR #11 confermata merged (81677f4b0f7a4905134103d0ed7aa2a5332331ac), CI 45406688456 success sul head esatto, log 345/345 test.
- ID04/05/11: partizione diagnostica di parole PDF in blocchi selezionati, anche multipagina, con esclusioni, copertura e locatori; revisione sequenziale con ricalcolo fingerprint. 25 nuovi test predisposti, CI richiesta. Branch feat/reviewed-visura-blocks; evidenze docs/qa/ITERATION_012.md.
- Nessuna inferenza su unità o graffature, nessuna integrazione semantica ancora. Prossimo: CI/merge, trascrizione per blocco e collegamento alle evidenze Building Core, worker isolato, corpus territoriale. Nessun caso catastale integrale o test ufficiale DOCFA/SISTER.

## Iterazione 13 — 2026-11-24
- PR #12 integrata a 8f84b765696dcfb7511d59c2580f05c16f039a1d; CI 45417618685, job core 138528046939, 370/370 pass, checkout merge su head c59491f8cd06a0b9c53b4cf8ffccebe015845dda verificato.
- ID04/05/11/26: trascrizione prudenziale dei cinque campi identificativi per blocco revisionato, locatori originali, copertura esplicita, ripetizioni segnalate, valori compatibili con Building Core 0.1.0. Revisione sequenziale con correzione locatori ignorati e digest manifest. 27 test sintetici predisposti, inclusi PDF nativo e schema; CI richiesta. Branch feat/reviewed-block-identifiers. Evidenze docs/qa/ITERATION_013.md.
- Nessuna deduzione di graffatura/unità/titolarità o autenticità, nessun claim osservato; nessuna nuova regola normativa o compatibilità ufficiale. Prossimo: verifica CI/merge, relazioni esplicite e audit di sicurezza PDF, OCR e corpus territoriale. Nessun caso integrale o verifica indipendente conteggiati.

## Iterazione 14 — 2026-11-24
- PR #13 integrata (3bb8877c92f6c154228e913833f16ca388666005), CI 45429740730 sul head esatto, log 397/397.
- ID04/05/11/26: gruppi proposti dal revisore, copertura disgiunta dei blocchi e locatori espliciti, vincolo digest, nessuna relazione verificata. Revisione sequenziale con correzione della visibilità dei membri privi di evidenza; 29 test sintetici predisposti, CI richiesta. Branch feat/reviewed-identifier-group-proposals; evidenze docs/qa/ITERATION_014.md.
- Prossimo: CI/merge, fonti ufficiali sulle relazioni, worker isolato, OCR, corpus territoriale e adattatori reali. Nessuna pratica integrale o test DOCFA/SISTER.

## Iterazione 15 — 2026-11-24
- PR #14 integrata a 0531d0eee5dab5bb58abf2b95bab169d1641ad4b; CI 45440243404 sul head/base esatti, job core 138609027505, 426/426 pass.
- ID05/29: ambiente minimo dei subprocessi PDF, blocco PATH non valido, revisione sequenziale e correzioni; 5/5 controlli ECMAScript su sorgente riletta, 22 nuovi test Node predisposti, CI richiesta. Branch fix/pdf-subprocess-environment; evidenze docs/qa/ITERATION_015.md.
- Non sandbox, Windows reale non verificato, nessuna nuova regola catastale. Prossimo: CI/merge, isolamento OS, OCR, corpus territoriale, adattatori e QA 100+100. Nessun caso integrale o test DOCFA/SISTER.

## Iterazione 16 — 2026-11-24
- PR #15 integrata a db5fd656a564f455f83a0fa8d9bc423fbc6e83af; CI 45452501064 sul head/base esatti, job 138653076719, 448/448 pass.
- ID05/29: risoluzione esplicita percorsi assoluti Poppler, preflight entrambi i binari con ambiente unico, revisione sequenziale e correzioni; 24 nuovi test sintetici predisposti, CI richiesta. Branch fix/pdf-explicit-binary-resolution; evidenze docs/qa/ITERATION_016.md.
- Non sandbox né autenticazione dei binari, Windows reale non verificato. Prossimo: CI/merge, isolamento OS, OCR, corpus territoriale, adattatori e QA 100+100. Nessun caso integrale o test DOCFA/SISTER.

## Iterazione 17 — 2026-11-24
- PR #16 integrata a 2728638987488da4d1ad16975e97fe27d9914669; CI 45462522465 job 138688682677 sul head/base esatti, 472/472 pass.
- ID05/29: workspace temporaneo distinto per ogni subprocesso Poppler, temp env esplicite, cleanup fail-closed e controllo sostituzione; revisione sequenziale e correzione root relativo/UNC. 9 nuovi test predisposti, CI richiesta. Branch fix/pdf-private-workspace, evidenze docs/qa/ITERATION_017.md.
- Non sandbox, Windows e isolamento OS non verificati. Prossimo: CI/merge, isolamento OS, OCR, corpus territoriale, adattatori Building Core e QA 100+100. Nessun caso integrale o test ufficiale DOCFA/SISTER.

## Iterazione 18 — 2026-11-24
- PR #17 integrata a 7974cb261522a2c13a48f9749ba17862363e4bd9; CI 45474009226 job core 138729243553 sul head/base esatti, 481/481 pass.
- ID05/29: parser diagnostico TSV Tesseract per raster singolo, score grezzo e coordinate pixel, blocchi di gerarchia/geometria; revisione sequenziale e correzione duplicati geometrici. 24/24 callback sintetici eseguiti in ECMAScript su sorgenti rilette; CI Node richiesta. Branch feat/ocr-tsv-candidates, evidenze docs/qa/ITERATION_018.md.
- Non OCR nativo, non confidenza per campo, non mapping PDF o autenticazione. Prossimo: CI/merge, binding raster e provenienza, isolamento OS, OCR effettivo, corpus territoriale, adattatori Building Core e QA 100+100. Nessun caso integrale o test ufficiale DOCFA/SISTER.

## Iterazione 19 — 2026-11-24
- PR #18 integrata a bed2fe86abe32b22e3b4eb81d28ebe500ba726cb; CI 45483271170 job 138761786303, head/base esatti, 505/505 pass.
- ID05/29: binding PGM canonico e TSV raw con SHA-256 e sistema coordinate esplicito; 21 nuovi test Node predisposti, revisione sequenziale e correzione. Prova esplorativa Tesseract 5.5.0 nativo su raster sintetico TEST 0007 riuscita, non test del nuovo modulo. Branch feat/ocr-raster-evidence; evidenze docs/qa/ITERATION_019.md.
- Nessuna autenticazione della coppia, mapping PDF o OCR integrato; CI richiesta. Prossimo: integrazione nativa isolata, corpus territoriale, adattatori Building Core e QA 100+100. Nessun caso integrale o test DOCFA/SISTER.

## Iterazione 20 — 2026-11-24
- PR #19 ancora aperta: CI 45494236780/job 138800340415 fallita (525/526 pass), aspettativa diagnostica errata nella fixture TSV. Correzione bd753dddfe5ca35ba46c165723bf8fddbb0fb4f0: quattro casi al posto di uno, validatore invariato. Revisione sequenziale, 4/4 regressioni locali Node con sorgenti verificate per hash Git; CI completa da verificare sul head/base finali.
- ID05/29: prima prova locale Tesseract 5.5.0 -> binding evidenze con byte effettivi di PGM e TSV sintetici; parole TEST e 0007 riconosciute, stato non operativo e non autenticato. Evidenze docs/qa/ITERATION_020.md. Non pipeline automatica o sandbox, nessun caso integrale o test DOCFA/SISTER.
- Prossimo: gate PR #19, integrazione PDF-raster-OCR, isolamento OS, corpus territoriale, adattatori Building Core e QA 100+100. Nessun nuovo merge con CI non verificata.

## Iterazione 21 — 2026-11-25
- PR #19 integrata a 7e1967b0f24c64cc898d50dec19cf1c966a62ad0; CI 45504448203, job 138835891020, head/base esatti, 529/529 pass.
- ID05/29: OCR diagnostico nativo Linux per singolo blocco PGM prevalidato, Tesseract ita con stdin/stdout, workspace dedicato e limiti; legame run/evidenza senza autenticazione. Revisione sequenziale, preflight condiviso e smoke con guardia fixture e caso negativo. 33/33 test locali Node su sorgenti verificate per hash (24 regressioni, 9 nuovi), 2/2 casi smoke OCR nativo (TEST 0007 e raster bianco); CI core richiesta, attesi 538 non ancora convalidati. Branch feat/native-ocr-diagnostic; evidenze docs/qa/ITERATION_021.md.
- Non sandbox OS, Windows, OCR pagina intera o mapping PDF; nessun dato cliente, regola catastale nuova, caso integrale o test ufficiale DOCFA/SISTER. Prossimo: CI/merge, PDF-raster con geometria e digest, isolamento OS, fonti territoriali, Building Core e QA 100+100.

## Iterazione 22 — 2026-11-25
- PR #20 integrata a 2c0610045de2e3e472700c47b2c00d17bcda4dbc; CI 45513165590, job 138865793014, head/base esatti, 538/538 pass.
- ID05/29: rasterizzazione diagnostica Linux PDF singola pagina a PGM 144 DPI con geometria limitata, controllo dimensioni e digest PDF/raster, revisione sequenziale e correzione della semantica del flag annotazioni. Prova CLI separata PDF sintetico 320x80 pt -> PGM 640x160 -> Tesseract ita TEST 0007 riuscita; non test del modulo. 13 nuovi test predisposti, CI richiesta. Branch feat/pdf-raster-diagnostic; evidenze docs/qa/ITERATION_022.md.
- Non sandbox, non mapping PDF affidabile, non OCR automatico o Windows/multipagina. Prossimo: gate CI e merge, collegamento raster/OCR, isolamento OS, fonti territoriali, Building Core e QA 100+100. Nessun caso integrale o test ufficiale DOCFA/SISTER.

## Iterazione 23 — 2026-11-25
- PR #21 integrata a b31ea2b40ae54e3f01cd733aea0bcb8651c2e888; CI 45520681145 job 138891429995, head/base esatti, 551/551 pass.
- ID05/29: composizione diagnostica nativa PDF-raster-OCR, digest ricalcolati e blocco senza risultati parziali; revisione sequenziale, 5 test sintetici predisposti e CI aggiornata con modello italiano obbligatorio. Branch feat/pdf-ocr-diagnostic-chain; evidenze docs/qa/ITERATION_023.md. Attesi 556 test, non ancora verificati.
- Non sandbox, non mapping PDF o layout verificato, non Windows/multipagina. Prossimo: CI/merge, isolamento OS, corpus territoriale, adattatori Building Core, UI e QA 100+100. Nessun caso catastale integrale o test ufficiale DOCFA/SISTER.

## Iterazione 24 — 2026-11-25
- PR #22 integrata a 71ff3b7a4867f5e089e780f7186aa5e740d41504; CI 45527687933 job 138914977189, head/base esatti, 556/556 pass; pipeline nativa PDF-raster-OCR ita verificata su fixture sintetica.
- ID05/29: rifiuto memoria condivisa PDF testuale, validazione header sulla copia, controllo contenimento geometrico gerarchico OCR e invalidazione antenati; revisione sequenziale, 9 nuovi test sintetici predisposti, CI richiesta (attesi 565). Branch fix/document-input-and-ocr-geometry; evidenze docs/qa/ITERATION_024.md.
- Non sandbox, non mapping PDF/layout verificato, non Windows/multipagina OCR. Prossimo: CI/merge, isolamento OS, corpus territoriale, Building Core, UI e QA 100+100. Nessuna pratica integrale o test ufficiale DOCFA/SISTER.

## Iterazione 25 — 2026-11-25
- PR #23 integrata a 72236629b88cd647b0002380cdd4c735a7d69bf6; CI 45534682762 job 138938261199, head/base esatti, 565/565 pass.
- ID05/28: overlay diagnostico OCR in coordinate normalizzate raster, vincolo chainSha256, blocco senza risultati parziali, revisione sequenziale e oracolo BigInt. 11/11 nuovi test locali Node su blob verificati, inclusi 100 sottocasi geometrici sintetici; nuova CI completa richiesta, attesi 576. Branch feat/ocr-raster-review-overlay; evidenze docs/qa/ITERATION_025.md.
- Non UI operativa, non mapping PDF, non sandbox OS, nessun caso catastale integrale o verifica incrociata professionale conteggiati. Prossimo: CI/merge, UI con raster esatto, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessun test DOCFA/SISTER reale, nessuna firma o trasmissione.

## Iterazione 26 — 2026-11-25
- PR #24 integrata a cb937d0f11ae9c5a3f11fe6b71f8a30057da4ad1; CI 45542302228 job 138963485147, head/base esatti, 576/576 pass.
- ID05/28/29: raster PGM opt-in dalla stessa invocazione OCR; verifica copia, digest annidati, overlay ricalcolato e blocco senza dati parziali. API metadata-only invariata. Revisione sequenziale e correzione versione; 12 test nuovi predisposti, CI richiesta (attesi 588), clone locale bloccato DNS. Branch feat/ocr-exact-raster-review, evidenze docs/qa/ITERATION_026.md.
- Non UI, non autenticazione, non sandbox OS, non mapping PDF o Windows/multipagina OCR. Prossimo: CI/merge, UI locale, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessun caso integrale, verifica professionale o test DOCFA/SISTER reale, firma o invio.

## Iterazione 27 — 2026-11-25
- PR #25 integrata a f4207f6a88b9d070d3d724fd2a05093904c74187; CI 45548773792 job 138984648909, head/base esatti, 588/588 pass.
- ID05/28/29: generatore vista HTML locale autonoma senza JS/server, PNG lossless, overlay pixel e link reciproci, score grezzo, escaping e CSP, nessuna scrittura automatica; revisione sequenziale con preflight input. 9 test nuovi predisposti (8 unitari + 1 nativo), CI richiesta (attesi 597); clone locale bloccato DNS. Branch feat/local-ocr-review-html, evidenze docs/qa/ITERATION_027.md.
- Non test browser reale o UI integrata, non sandbox OS, mapping PDF, multipagina OCR o Windows. Prossimo: CI/merge, collaudo browser, UI locale, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessun caso integrale, verifica professionale, test DOCFA/SISTER reale, firma o trasmissione.

## Iterazione 28 — 2026-11-25
- PR #26 integrata a 88d5cb6583d85d644e19e9b35fb978619e1d11a3; CI 45555425260 job 139006200829 sul head/base esatti, 597/597 pass.
- ID05/28/29: smoke Chromium reale su HTML sintetico in memoria, 1280 e 360 px entrambi pass, 32000 pixel confrontati per viewport senza differenze, escaping, Tab/Enter e link reciproci funzionanti, zero richieste HTTP(S) della pagina in contesto offline. Revisione sequenziale e correzione test; apertura file:// bloccata da policy locale, non verificata. Script riproducibili con hash Git verificati; CI core richiesta. Branch test/ocr-review-browser, evidenze docs/qa/ITERATION_028.md.
- Non UI approvativa, non Windows/mobile reale o audit accessibilità/sicurezza, non sandbox OS, nessuna pratica integrale o verifica professionale conteggiata, nessun test DOCFA/SISTER reale, firma o trasmissione. Prossimo: CI/merge, workflow revisione tracciata, isolamento OS, corpus territoriale, Building Core e QA 100+100.

## Iterazione 29 — 2026-11-25
- PR #27 integrata a bc6df6f754b8f7243e347cd9de100d89ae1dbb74; CI 45563521436 job 139032677933 sul head/base esatti, 597/597 pass; browser smoke opt-in escluso dalla CI.
- ID05/28/29: proposta locale di revisione OCR vincolata a raster e catena, retain/correct/exclude con copertura completa, originale e coordinate preservati, motivo obbligatorio per modifica/esclusione, digest canonico. Revisione sequenziale e correzioni; 19 test sintetici predisposti, CI richiesta (attesi 616), clone locale bloccato DNS. Branch feat/ocr-review-decisions, evidenze docs/qa/ITERATION_029.md.
- Non approvazione professionale, UI editing, firma o autenticazione, storage sicuro, sandbox OS, pratica integrale o verifica professionale. Prossimo: CI/merge, UI/replay, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessun test DOCFA/SISTER reale, firma o trasmissione.

## Iterazione 30 — 2026-11-25
- PR #28 già integrata a a47e95231d0c3f0fbef588d09c78d96c6743ff1c; CI 45570917039 job 139057052788, head/base esatti, 616/616 pass.
- ID05/28/29: replay JSON contro evidenze OCR e raster originari, ricostruzione canonica e controllo campi derivati; revisione sequenziale e correzione zero con segno. 29 nuovi test predisposti, CI richiesta (attesi 645), clone locale bloccato DNS. Branch feat/ocr-review-replay, evidenze docs/qa/ITERATION_030.md.
- Non autenticazione, firma, approvazione, storage sicuro o sandbox OS. Prossimo: CI/merge, UI editing e replay, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessuna pratica integrale, verifica professionale, prova DOCFA/SISTER reale, firma o invio.

## Iterazione 31 — 2026-11-25
- PR #29 integrata a f128cffb0504eee2a3873341f0c91fa00199eb41; CI 45582584870 job 139096061782, head/base esatti, 645/645 pass.
- ID05/28/29: editor HTML locale opt-in, azione esplicita per parola, download su gesto utente di richiesta JSON non validata, script statico vincolato da hash CSP; API read-only preservata. Revisione sequenziale e correzioni; 12 test sintetici predisposti, CI richiesta (attesi 657), clone locale bloccato DNS. Branch feat/local-ocr-review-editor, evidenze docs/qa/ITERATION_031.md.
- Non collaudo browser reale del nuovo editor, import/replay UI, autenticazione, storage sicuro, sandbox OS o approvazione. Prossimo: CI/merge, browser download reale, integrazione import/replay, isolamento OS, corpus territoriale, Building Core e QA 100+100. Nessuna pratica integrale, verifica professionale, test DOCFA/SISTER reale, firma o invio.

## Iterazione 32 — 2026-11-25 — modalità C
- PR #30 integrata a 0be8e9065e839e620584809fc07bccb26ce71222; CI 45589118452 job 139118316808, 657/657 pass su head esatto e base precedente; drift main esclusivamente documentale disgiunto verificato prima del merge.
- ID02/07–12/20/26/28/29: primo laboratorio verticale locale sintetico, Building Core 0.1.0, audit copertura/inventario/evidenze, operazioni S/C e unità estranee, relazione di ricerca e download diagnostico JSON. Tre scenari editabili, blocco senza proposta in caso di incoerenze, server loopback con CSP e limiti. Revisione sequenziale: indice per unità invece di scansioni ripetute. Test di integrazione e HTTP predisposti, CI richiesta; clone locale ancora bloccato DNS. Branch feat/vertical-practice-workbench, evidenze docs/qa/ITERATION_032.md.
- Non ancora collaudo browser reale, acquisizione visure revisionate, sandbox OS, classamento, geometrie, adattatori esterni o pratica integrale. Nessuna nuova regola catastale, fonte attiva, disponibilità, firma o invio. Gate 100+100 e DOCFA/SISTER reali aperti. Backup intatti.

## Iterazione 33 — 2026-11-25 — modalità C
- PR #31 integrata a 91753210164a66896d0f84799258ebb25c04d918; CI 45598045233 job 139149238647, 671/671 pass, head/base verificati nella precedente esecuzione.
- ID02/10/12/20/28/29: editor guidato sintetico, inventario/copertura/presupposti/trascrizioni separati, tabella operazioni, salvataggio e riapertura esplicita bozza JSON, invalidazione report. Revisione sequenziale con schema ristretto, limiti e blocco input non valido. 6/6 verifiche isolate V8 con clone JSON sostitutivo; 8 nuovi test Node predisposti e smoke HTTP esteso, non ancora eseguiti in CI. Clone locale bloccato DNS. Branch feat/guided-synthetic-practice, evidenze docs/qa/ITERATION_033.md.
- Non collaudo browser, non visura reale revisionata, sandbox OS, ampliamento/classamento/geometrie o integrazioni esterne; nessun caso integrale o verifica professionale conteggiata, nessun test ufficiale DOCFA/SISTER, firma o invio. Backup invariati.

## Iterazione 34 — 2026-11-25 — modalità C
- PR #32 integrata a 5318408a1208f676aadb033a7bb4c641f45cafd6; CI 45607509676 job 139182096624, 679/679 pass su head/base esatti.
- ID04/13/14/26/28/29: pannello confronto trascrizione visura sintetica con identificativo osservato, campi classamento/rendita/superfici e locatori, confronto fonte/data, import JSON e esempio esplicitamente derivato. Nessuna promozione o modifica claim. Revisione sequenziale, 9/9 verifiche V8, 6 nuovi test Node/HTTP predisposti; CI non ancora verificata. Branch feat/synthetic-visura-workbench, evidenze docs/qa/ITERATION_034.md.
- Nessuna visura reale, browser collaudato, regola normativa nuova, compatibilità ufficiale o caso integrale. Backup presenti e intatti, licenza invariata, nessuna firma/invio. Prossimo: CI/merge, browser e blocchi variazioni/classamento/geometria/Building Core; gate 100+100 aperto.

## Iterazione 35 — 2026-11-25 — modalità C
- PR #33 integrata a c3c753b8503df05b448a76ea37fda305d844fc31 dopo verifica CI 45608661449 job 139186109675, 685/685 pass, head/base esatti. PR #34 separata verificata CI 45610015352 job 139190791559, 699/699 pass sul precedente base, non mergeable dopo #33; ripresa su nuovo branch feat/reviewed-visura-integrated dal main aggiornato.
- Percorso da trascrizione sintetica strutturata all'inventario, proposta e rapporto, con esempio unknown, modello JSON scaricabile/reimportabile, fonti distinte, copertura indipendente; mantenuto confronto con intakeVisura della #33. Revisione sequenziale, decoder UTF-8 rigoroso, test di interoperabilità predisposto. 12/12 controlli V8 adapter eseguiti, CI consolidata richiesta. Evidenze docs/qa/ITERATION_035.md.
- Non import PDF/OCR reale, collaudo browser, classamento automatico, geometria, sandbox o integrazioni esterne. Gate 100+100 professionali e prove ufficiali aperti, nessuna firma/invio. Backup invariati.

## Iterazione 036 — modalità C — 2026-11-25
- PR #35 consolidata a 0a1d0502d77de69c732391f7785860dc666f55cf; CI 45610262695, job 139191638868, log checkout f3f5672 (head 48cd64a99553bd832c8b421680e1462115d0dea7, base c3c753b8503df05b448a76ea37fda305d844fc31), 706/706 pass, zero fail/skip/cancel/todo. PR #34 chiusa perché sostituita da #35, branch conservato.
- ID20/28/29: dossier HTML autonomo stampabile dal rapporto diagnostico corrente (relazione, operazioni, evidenze, fonte, blocchi, digest non autenticante), download esplicito, CSP restrittiva, escaping, nessuna risorsa esterna o script, invalidazione su modifica. Import bozza con UTF-8 rigoroso. Nessuna nuova regola catastale.
- Revisione sequenziale: separazione rapporto diagnostico da export operativo, caso bloccato senza operazioni, rifiuto identificativi non SYNTH, testi e URL non attivi, controllo dello stato corrente e limiti. 10/10 controlli logici isolati V8 sul blob 577203945f31110713b159fdd5249bd5b4da4c7c con sostituto TextEncoder (non prova Node/browser); 5 test Node aggiunti, smoke HTTP esteso. Clone locale fallisce DNS github.com. CI completa da verificare.
- Script opt-in scripts/check-workbench-browser.py: avvio server loopback su porta dinamica, caso revisionato bloccato, 3 scenari, download JSON/HTML, rendering in memoria, reimportazione bozza, controllo invalidazione e richieste esterne su due viewport. Non eseguito sul repository completo: non dichiarare collaudo browser. Comando: CHROMIUM_EXECUTABLE=/usr/bin/chromium python scripts/check-workbench-browser.py (Playwright installato).
- Backup non modificati; solo sintetico, licenza invariata. Nessun nuovo caso integrale o verifica indipendente conteggiati; DOCFA/SISTER, isolamento OS, regole territoriali, classamento, geometria e integrazioni esterne ancora aperti. Priorità successiva: eseguire browser smoke e sviluppare ampliamento/variazioni con fonti ufficiali, classamento/geometria e Building Core.

## Iterazione 37 — 2026-11-25 — modalità C
- PR #36 integrata a e364dfddc35e3137c8a02e59d7fd0d9043e44e90; CI 45612216160 job 139198386483, 711/711 pass, head/base verificati.
- ID07/09/10/20/28: scenario interno V end-to-end sintetico, conservazione identificativo, fonte storica ufficiale circ. 9/2001 pending, revisione sequenziale e correzione evidenze documentali. Test Node predisposti, script browser esteso, CI da verificare; DNS locale ancora bloccato. Branch feat/internal-distribution-variation, evidenze docs/qa/ITERATION_037.md.
- Nessuna nuova regola operativa, pratica reale, verifica indipendente o compatibilità DOCFA/SISTER. Backup intatti, licenza invariata, nessuna firma/invio. Prossimo: CI/merge, classamento, geometrie, ulteriori variazioni e integrazioni, browser e gate 100+100.

## Iterazione 038 — modalità C — 2026-11-25
- PR #37 integrata a f96945ef7d47a6779075331f55b0251d41e210b2, CI 45616322957 job 139212538588, 725/725 pass su head/base esatti.
- ID15/16/17/26/28/29: annesso geometrico separato per unità risultante C/V, contorno ortogonale semplice, misura esatta mm²/m² e perimetro, blocchi topologici, download JSON e invalidazione UI. Revisione sequenziale e correzioni. Blob eeb67fe779dbb02054e236f6ffc1085b038464d3 verificato; 210 asserzioni locali Node pass (100 rettangoli, non pratiche integrali). Test integrati e job browser effettivo su 2 viewport predisposti, CI da verificare. Branch feat/synthetic-plan-geometry, evidenze docs/qa/ITERATION_038.md.
- Nessun coefficiente catastale o regola nuova; non scala CAD verificata, planimetria DOCFA, classamento o prova ufficiale. Gate 100+100 aperto, backup intatti, licenza invariata, nessuna firma/invio. Prossimo: gate CI core+browser, ampliamento/cambio d'uso, fonti e classamento, geometria calibrata e integrazioni esterne.

## Iterazione 39 — modalità C — 2026-11-25
- PR #38 integrata squash 5110de484ea9810c668b8545079ee49d3ad7d390. Prima CI 45626271856: core 738/738, browser non avviato (Ubuntu 26.04 incompatibile con Playwright 1.57). Corretto solo runner browser a ubuntu-24.04; CI 45638068128, job 139288796984 e 139288797582, checkout 41eb584 (head 818ec033ad4a0df88f5b6df0afb92e75c5cd7cbb, base f96945ef7d47a6779075331f55b0251d41e210b2), 738/738 pass, browser effettivo PASS 1280 e 360 px, quattro scenari, download e reimportazione. Main identico al base prima del merge.
- Nuovo scenario sintetico variazione di destinazione intera, circ. 9/2001 PDF p. 6 e circ. 1/2006 §4 p. 5 consultate su fonte ufficiale; fonte pending, nessuna regola operativa attiva. Motore, fixture, editor, import, dossier e smoke browser esteso. Revisione sequenziale; 15/15 controlli isolati V8 eseguiti sul codice a 82bd7ccfd9f1de2f3ffc1eda2cb10131b71da6b5, con sostituti espliciti per API native assenti (non equivalgono a Node/Chromium o validazione crittografica). Test Node e browser predisposti; CI da verificare. Branch feat/whole-unit-destination-change; evidenze docs/qa/ITERATION_039.md. Backup intatti, licenza invariata; gate 100+100 e prove ufficiali aperti.

## Iterazione 041 — modalità C — 2026-11-25
- PR #39 integrata a df4d46e95a0626a002b13a3b1abd8854b8ec651a; CI 45638875337 core 749/749 e browser 5 scenari su 1280/360 px, head/base esatti. Recupero modulo iterazione 40 da 383a900ba06d1a68b7c600f9429922a6d624af04 su branch aggiornato feat/integrated-building-core-export.
- ID26/27/28/29: handoff Building Core sintetico per tre destinatari con proiezione unità C/V, provenienza, digest/replay, endpoint loopback e UI download vincolata al caso corrente. Test Node e Chromium predisposti, nuova CI da verificare. Revisione sequenziale. Evidenze docs/qa/ITERATION_041.md.
- Nessun importatore destinatario validato, nessuna nuova regola, pratica integrale o verifica professionale conteggiata. Nessuna firma/invio, backup invariati. Prossimo: CI, classamento, ampliamento, geometrie, importatori e gate 100+100.

## Iterazione 042 — modalità C — 2026-11-25
- PR #40 integrata squash 2ffbe14ca85e096305452caa93b68d62a099d0b1: CI 45657829107, job core 139359197608 (767/767), browser 139359196522 (PASS 1280 e 360 px, cinque scenari, download e reimportazione); entrambi checkout 06d5cf2, head/base esatti, main verificato identico al base.
- ID13/14/28: annesso estimativo sintetico per unità C/V con dichiarazione categoria/classe/zona/consistenza/tariffa, prodotto esatto BigInt, ricalcolo server loopback e download UI invalidato su modifica. Fonte metodologica storica ufficiale 2021 §6 p.29 consultata in testo; screenshot fallito 403. Nessuna tariffa reale, scelta automatica o arrotondamento ufficiale. 17/17 controlli V8 isolati sul blob 4c273ecde4c37c19b30328a790eed182aae4be48 con sostituto esplicito del report, non integrazione. Test Node e browser predisposti, CI non verificata. Branch feat/synthetic-classification-income; evidenze docs/qa/ITERATION_042.md. Revisione sequenziale. Gate 100+100 e prove DOCFA/SISTER ancora aperti; backup non modificati, licenza invariata. Prossimo: CI core/browser, acquisizione tariffari ufficiali e ampliamento.

## Iterazione 043 — modalità C — 2026-11-25
- Main verificato identico a 2ffbe14ca85e096305452caa93b68d62a099d0b1; backup/2026-11-25-main e backup/2026-11-25-iteration-31 presenti e non modificati.
- PR #41: CI 45668934509, checkout 0b4d163 (head 34b44e00c1359d9389a70e6753317a98389369de, base 2ffbe14ca85e096305452caa93b68d62a099d0b1), core job 139398592528: 791/791 pass, zero fail/skip/cancel/todo. Browser job 139398592118 fallito: assert impropria su income-unit dopo modifica geometrica, riga 132.
- Revisione sequenziale di client.js, HTML e smoke: gli annessi sono separati e una modifica geometrica non cambia il digest del caso né i valori estimativi. Corretto test in abc7c34dae321456f1bfda51cf31b1f4b88a769c: recupero dopo tariffa zero, verifica annesso estimativo valido durante modifica geometrica, invalidazione di entrambi dopo reimportazione bozza. Nessuna rimozione dei controlli di sicurezza. Nuova CI da verificare; PR non integrata fino al doppio gate.
- Fonti per ID03/13/14/22: pagina storica ufficiale DOCFA 4.00.3, sezione Archivi provinciali, https://agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/aggiornamento-catasto-fabbricati-docfa/docfa-versioni-precedenti/software-docfa-4003 (archivi provinciali con estimi, prospetti classamento, comuni/sezioni, associazioni foglio-zona; indicazioni storiche, non vigenza 2026); Gazzetta Ufficiale, https://www.gazzettaufficiale.it/catasto/help/normativa (tariffe storiche e rettifiche); servizio ufficiale Comuni e Stati Esteri https://arcom.agenziaentrate.gov.it/CitizenArCom/ (variazioni territoriali e allineamento). Pagina DOCFA 4.00.5 https://www.agenziaentrate.gov.it/portale/web/guest/software-docfa-4005 non accessibile via web in questa esecuzione. Nessun archivio ZIP attuale scaricato o tracciato verificato; nessuna tariffa o regola operativa aggiunta. Prossimo passo: acquisizione legittima archivio/versione e tracciati, verifica hash e decorrenza, parser offline a schema esplicito e controllo chiave comune/sezione/zona/categoria/classe, blocco assenze o duplicati; confronto con DOCFA ufficiale. Non confondere OMI con tariffe di estimo.
- Zero nuovi casi integrali e verifiche professionali ai fini del gate 100+100; nessuna firma/invio o prova DOCFA/SISTER reale. Licenza invariata. Prossimo: chiusura gate browser, ampliamento e corpus tariffario.

## Iterazione 044 — modalità C — 2026-11-25
- PR #41 integrata a 5e46e2e40e8d1e8ed96f0046a2de9c3f06da7974; CI 45678783217 core 791/791 e Chromium PASS 1280/360 px, head/base esatti.
- ID07/09/10/20/28: ampliamento sintetico a sagoma in mappa dichiarata invariata, una unità S e una C, evidenze distinte, conservazione estranee, relazione e UI. Vademecum nazionale 2022 p.57 verificato, stato pending. Revisione sequenziale, test Node e browser predisposti, DNS locale bloccato, nuova CI da verificare. Evidenze docs/qa/ITERATION_044.md. Backup intatti, gate 100+100 e prove ufficiali aperti. Prossimo: CI, ampliamento con Tipo Mappale e fonti tariffarie, integrazione geometrie e dossier.

## Iterazione 045 — modalità C — 2026-11-25
- PR #42 integrata a faa91f31e1e0ffb1f35281805037a22092f29463, CI 45687778388: 803 pass, Chromium PASS 1280/360 px, sei scenari, checkout esatto.
- ID14/16/20/28/29: dossier unitario con annessi correnti ricalcolati lato server; test Node e Chromium predisposti; DNS locale bloccato, CI da verificare. Revisione sequenziale. Evidenze docs/qa/ITERATION_045.md. Gate 100+100 e prove ufficiali aperti, backup non modificati, licenza invariata. Prossimo: CI, fonti tariffarie, Tipo Mappale, corpus integrale.

## Iterazione 046 — modalità C
- PR #43 integrata squash 88bc1f44f2cef86de101679b6606b10de176e5c3. CI 45697266185: core job 139497799372, 820/820 pass; browser 139497799839 PASS 1280/360; entrambi checkout 831e124, head d2962d338f13a28613a0ac089dd92eb3a36fcc07 e base faa91f31e1e0ffb1f35281805037a22092f29463. Main identico al base prima del merge. Dossier integrato con annessi ricalcolati disponibile su main.
- PR #44 CI 45697317840 (core 139497982397: 989/989; browser 139497982861 PASS 1280/360; head 3604ba0abfe688ac6606a44dd38b91e1be04f982 e base faa91f31e1e0ffb1f35281805037a22092f29463). Dopo merge #43, base divergente e conflitto documentale su iterazione 045: matrice identica trasferita su branch aggiornato, senza sovrascrivere registro #43; nuova CI necessaria. Non conteggiare test di mutazione come casi professionali integrali.
- ID28/29: avvio locale Windows tramite doppio clic, Node 22+, porta IPv4 loopback effimera scelta dal sistema, apertura browser dopo listen; nessuna installazione automatica o servizio pubblico. Avvio senza browser e test di due istanze concorrenti con scenario ampliamento. Nuovo job Windows per verificare server e motore; nessun collaudo interattivo Explorer/installer dichiarato. Revisione sequenziale del piano e del codice: nessun URL arbitrario, shell o porta fissa; CSP e controlli server invariati. Test predisposti, DNS locale github.com non risolto; CI non ancora verificata. Nessuna nuova regola catastale. Backup non modificati, licenza invariata, nessun dato reale, firma/invio o prova DOCFA/SISTER. Gate 100+100 aperto.

## Iterazione 047 — modalità C — 2026-11-25
- PR #45 integrata a 71acf96be2a7714109d8fa8b1b1fd78a4e756556. CI 45707595416: core 1007/1007, browser PASS 1280/360; CI Windows 45707595483 PASS 242. Head/base verificati nei log.
- ID14/16/20/28/29: dossier multi-unità con annessi per unità C/V, copertura esplicita, invalidazione selettiva e ricalcolo server atomico; test Node/Chromium predisposti, CI da verificare, DNS locale bloccato. Revisione sequenziale. Evidenze docs/qa/ITERATION_047.md. Backup intatti, licenza invariata, gate 100+100 e prove ufficiali aperti.

## Iterazione 048 — [Codex] — modalità C
- PR #46 integrata a 41becf5a44e39441946a477128d3896e73ed7d6f: CI 45716042861 core 1016/1016, Chromium PASS 1280/360; Windows 45716042995 251/251, head/base esatti. PR #47 base divergente dopo #46, nuova verifica necessaria.
- ID15/16/17/28: conversione dichiarata esatta di coordinate sintetiche in mm, UI per unità, controllo limiti e integrità, misura separata, test Node/Chromium predisposti. Verifiche isolate V8 riuscite (8 m², 12000 mm, blocchi). CI nuova non verificata. Evidenze docs/qa/ITERATION_048.md. Revisione sequenziale; nessuna regola operativa, nessuna prova di scala, DOCFA/SISTER o nuovo caso professionale. Backup non modificati, gate 100+100 aperto. Registro centrale non accessibile (404); protocollo letto sul ramo #47.

## Iterazione 049 — [Codex] — modalità C
- Main identico a 41becf5a44e39441946a477128d3896e73ed7d6f. PR #48 head 73c43557d0d44114e2434cc608bf8c404c40ef7e: CI 45723936196 core 1031/1031, browser fallito per selettore summary ambiguo (annidamento nuovo pannello scala). Windows 45723936199 positivo. Corretto solo il selettore a figlio diretto, commit 6fc38e7abcd8aa65f14351839d99cae0608a5694; nessuna asserzione rimossa. Nuova CI obbligatoria. Revisione sequenziale del diff e degli handler: conversione è esplicitamente applicata, misura indipendente, nessuna attestazione di scala. PR #47 solo documentazione, CI sul vecchio base 71acf96be2a7714109d8fa8b1b1fd78a4e756556; non integrare senza nuova CI sul main attuale. Backup non modificati.
- ID03/13/22: ricontrollata pagina istituzionale storica DOCFA 4.00.3, conferma esistenza ARK_XX.ZIP e tracciati RTF nonché riquadri DXF, aggiornamento Bologna del 12/12/2016 (non prova di vigenza 2026). Nessun nuovo archivio attuale acquisito. ARCOM ufficiale distingue variazioni circoscrizionali in attesa di allineamento, da gestire come blocco nella futura ricerca territoriale. Nessun nuovo dato tariffario, regola o formato operativo. Gate 100+100 e prove ufficiali restano aperti.

## Iterazione 050 — [Codex] — modalità C
- PR #48 integrata a 2ea4d1569d48b650005f738fb25e1a1362daa272; CI 45731120756 1031/1031 e Chromium PASS 1280/360; Windows 45731120752 success, head/base verificati. PR #47 STATO aggiornato, nuovo gate CI richiesto.
- ID16/20/28: anteprima proporzionale e dossier SVG per unità risultante, ingombro, ricalcolo e invalidazione. Verifica V8 isolata 8/8; Node e Chromium predisposti, CI non verificata. Revisione sequenziale; evidenze docs/qa/ITERATION_050.md. Nessuna nuova regola, attestazione di scala, prova ufficiale o nuovo caso integrale/verifica professionale. Backup non modificati, licenza invariata, gate 100+100 aperto.

## Iterazione 051 — [Codex] — modalità C
- PR #49 integrata a 69ddc75c3c99908a0823cdc3024a2f116ddc0680; CI 45738052389 core 1042/1042 e Chromium PASS 1280/360, Windows 45738052346 251/251, head/base esatti. PR #47 aggiornata nel suo ramo, nuova CI necessaria.
- ID15/16/20/28: provenienza della scala dichiarata conservata per unità in annesso e dossier, replay server, invalidazione e ripristino UI; verifica isolata V8 7/7, test Node e browser predisposti. Evidenze docs/qa/ITERATION_051.md. Revisione sequenziale, nuova CI da verificare. Backup intatti, licenza invariata, gate 100+100 e prove ufficiali aperti; nessun nuovo dato tariffario o regola operativa.

## Iterazione 052 — [Codex] — modalità C
- PR #50 integrata a 23ab1dc21145bb7255207b1d726bc17c696e694a, CI 45745088467 1045/1045 e Chromium PASS, Windows 45745088485 success; head/base esatti. PR #47 CI positiva sul base precedente: nuova verifica richiesta.
- ID16/17/20/28: contorni ortogonali disgiunti sullo stesso piano in mm, area/perimetro esatti, preview UI e dossier server; limiti e blocchi topologici, nessuna nuova regola catastale. 13 gruppi di verifiche isolate V8 superati con report e TextEncoder sostitutivi, Node/Chromium predisposti, CI da verificare. Evidenze docs/qa/ITERATION_052.md. Revisione sequenziale. Backup intatti, gate 100+100 e prove ufficiali aperti.

## Iterazione 053 — modalità C
- PR #51 integrata squash afcc73c90c1a088cd96c00fd02a8c2d6444515de. CI 45751309847: core 139679490962 1049/1049 pass, zero fail/skip, browser 139679490552 PASS 1280/360 px; Windows 45751309856 job 139679490610 success. Tutti checkout 2c7c027, head 84ec8236abfc054d6c09159e2a6d90df827074ce e base 23ab1dc21145bb7255207b1d726bc17c696e694a; main identico al base prima del merge. PR #47 CI 45744963458 verde ma checkout sul base precedente 69ddc75c3c99908a0823cdc3024a2f116ddc0680; non integrata.
- ID20/28/29: sessione sintetica locale riapribile, annessi ricalcolati, UI import/export, test Node e Chromium predisposti; nuova CI non verificata. Revisione sequenziale. Evidenze docs/qa/ITERATION_053.md. Backup intatti, gate 100+100 e prove ufficiali aperti.

## Iterazione 054 — [Codex] — modalità C
PR #52 integrata squash 81d09be96c73058c635797266db06958f4d114e7. CI 45756804203 core 139697225091 1059/1059, browser 139697225432 PASS 1280/360, Windows 45756804232 job 139697225096 success; checkout 4ee439c head 1cfe9999663b9938f64d849bdbe64f9b80ea4ef1 base afcc73c90c1a088cd96c00fd02a8c2d6444515de; main identico al base prima del merge. PR #47 riallineata con commit e93a780126da235d265fa7c28e4014d00b4fccf2, diff nove file protocollo; nuova CI richiesta. Mappa/diario registro centrale 404.
ID13/14/28: catalogo interno di quattro righe inventate, chiave esatta per comune fittizio/sezione nulla/zona/categoria/classe; nessun fallback o scelta automatica. Endpoint locale e UI, fonte conservata nel dossier e sessione; il ricalcolo respinge tariffa incongruente. Modifica chiave o tariffa perde provenienza catalogo; modifica consistenza conserva provenienza ma invalida calcolo. Revisione sequenziale; test Node e browser predisposti, CI non verificata. Fonti: pagina storica DOCFA 4.00.3 https://agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/aggiornamento-catasto-fabbricati-docfa/docfa-versioni-precedenti/software-docfa-4003 e ARCOM https://arcom.agenziaentrate.gov.it/CitizenArCom/index.jsp consultate 26/11/2026; archivio BO del 12/12/2016 non prova vigenza. Nessun ZIP/tracciato attuale acquisito, nessuna regola operativa. Prossimo: archivio ufficiale, prova DOCFA, elaborato planimetrico. Gate 100+100 aperto, nessun dato reale, backup non modificati, licenza invariata, nessuna firma/invio.

## Iterazione 055 — modalità C
PR #53 integrata squash 90c42df1b3e87c84fe5b7ee0b609035a3f930896. CI 45763436947, core 139718590948 1061/1061 pass, browser 139718591168 PASS 1280/360; Windows 45763437001 job 139718591126 264/264. Checkout f0a2cae, head 3e6cfe079c1ef477df67fa4e83e8152d29c6c152 e base 81d09be96c73058c635797266db06958f4d114e7, main verificato identico al base prima del merge. PR #47 riallineata a nuovo main con commit 5504d5a4d3284f6220b129a4c1d72fc5ffce7ed6; nuova CI richiesta.
ID10/11/18/19/20/28: prospetto inventario diagnostico ante/post per identificativo, conservazione raggruppamento per unità e fonti, conteggi distinti unità/identificativi, UI e dossier offline con medesima proiezione. Non è DAT, elaborato planimetrico ufficiale o verifica della disponibilità. Non sovrapporre geometrie riferite a origini locali indipendenti. Piano rivisto sequenzialmente: proiezione esclusivamente di operazioni già validate, nessuna nuova regola, nessun output per caso bloccato, testo DOM e HTML escaped; browser smoke e test Node predisposti, CI da verificare. Mappa/diario registro centrale 404. Backup non modificati, nessun dato reale/segretto, licenza invariata. Gate 100+100 e prove ufficiali aperti. Prossimo: acquisizione tracciati ufficiali, geometrie di piano comune con riferimento esplicito, prova DOCFA.

## Iterazione 056 — modalità C
PR #54 integrata squash 1f41a8fd1b745a082852024a6c92e8094f240acc dopo CI 45770546798 core e Chromium PASS 1280/360 e Windows 45770546717 264/264; checkout 97d1a85de93c1de0817fb36b0573e35c53b83a07, head f2a0cd2c5ad862fd7b753a56ac7f1384318f9f64 e base 90c42df1b3e87c84fe5b7ee0b609035a3f930896. PR #47 CI verde sul vecchio base, riallineata al nuovo main 54993abd9ad8bc930e488ae41ae29964ae3c405c, nuovo gate necessario.

ID15/16/18/20/28: collocazione facoltativa dichiarata per unità misurata, piano P0/P1/S1 ecc., traslazioni intere X/Y in mm; schema comune per piano UI e dossier con colori, ingombri, elenco posizioni mancanti e avviso conservativo di possibili sovrapposizioni degli ingombri. Non inferire posizione dai vertici locali o dalla scala. Sessione locale conserva dichiarazioni, server ricalcola misure; vecchie sessioni senza posizione restano ammesse. Unità estranee non disegnate: inventario ante/post rimane distinto, schema parziale, non elaborato ufficiale. Revisione sequenziale del piano e del codice, limiti, escaping, nessuna regola catastale nuova. Test Node predisposti, non eseguiti localmente (DNS github.com non risolto); nuova CI obbligatoria. Nessun test DOCFA/SISTER, firma o invio; backup non toccati, licenza invariata, nessun dato reale. Gate 100+100 aperto. Prossimo: CI integrata, collaudo browser delle posizioni, archivio ufficiale e adattatori.

## Iterazione 057 — [Codex] — modalità C — 2026-11-26
PR #55 integrata squash 883fe2c09a15d5d60d0c254ec02630dcd620edf8 dopo CI 45778335521 (core e browser 1280/360) e Windows 45778335526 (264/264); checkout c4fd6b42fb264b8ee4fd4e3fbbcf1a1fa38a6277, head e0b5fe616346dfd96065b9d70d7c87db4865d6f4, base 1f41a8fd1b745a082852024a6c92e8094f240acc. PR #47 riallineata a tale main, fb8292be15764f30e64c60ff843e0fdb02638671; nuova CI necessaria.
ID16/18/20/28: geometria di contesto per unità conservate con posizione comune obbligatoria, schema per piano e dossier con ruolo distinto, copertura esplicita delle unità post senza geometria. Sessione conserva dichiarazioni; nessuna modifica delle operazioni, classamento o regola normativa. Revisione sequenziale, test Node e Chromium predisposti; CI da verificare. Backup non modificati, licenza invariata, nessun dato reale, firma/invio o prova DOCFA/SISTER. Gate 100+100 ancora aperto. Registro docs/qa/ITERATION_057.md.

## Iterazione 059 — [Codex] — modalità C — 2026-11-26
PR #56 integrata a b94446a9010b75b14a8dff00b9a6c13e6f0f8630 dopo CI 45795202423, 45795202417, 45795202422. #57 riallineata conservando entrambi i blocchi funzionali, aggiunti test browser ZIP → riapertura → dossier identico e test contesto conservato/handoff. Nuova CI obbligatoria. Dettagli docs/qa/ITERATION_059.md. Gate 100+100 e prove ufficiali aperti.

## Iterazione 060 — [Codex] — modalità C — 2026-11-26
PR #57 integrata squash 88b70742329cbc4fdf34a6c0728651f010606868; CI 45804099327 core 1082 pass e Chromium 1280/360, Windows 45804099667 264/264, linee guida 45804099188. Checkout a90bf573c5ece6014dd9234be0b0ca63afda6e04, head 99616c803e12e8e794c4e570e44043c2ba84d740, base b94446a9010b75b14a8dff00b9a6c13e6f0f8630. Riapertura diretta del pacchetto diagnostico ZIP senza estrazione: sessione limitata a 256 KiB, ZIP 8 MiB, rigenerazione server e uguaglianza completa prima di sostituire il lavoro. Test Node e Chromium predisposti, nuova CI obbligatoria. Revisione sequenziale, nessuna autenticità, dato reale o formato DOCFA. Dettagli docs/qa/ITERATION_060.md. Gate 100+100 aperto.

## Iterazione 061 — [Codex] — modalità C — 2026-11-26
PR #58 integrata squash 9bb85cf6ef84d63e4c2045d647e2d520fd851a91; head de73c7cde9d56c299121d3d60b1788afb13e1518, main precedente 88b70742329cbc4fdf34a6c0728651f010606868, confronto ahead 1/behind 0. Workflow 45813023501 core/browser, 45813023846 Windows, 45813023392 linee guida e relativi job success. ID26/27/28: handoff geometrico separato v0.2 per Pianta Libera/MPE/APE Italia, proiezione unità C/V con copertura, contorni, posizione dichiarata o nulla e misure ricalcolate. Nessuna modifica allo ZIP canonico o al contratto precedente. Test Node/browser predisposti, CI da verificare. Revisione sequenziale; nessun agente indipendente disponibile, nessun importatore destinatario validato. Dettagli docs/qa/ITERATION_061.md. Gate 100+100 aperto.

## Iterazione 062 — [Codex] — modalità C — 2026-11-26
PR #59 integrata squash 6a8f4396f7e76dd2a4309fba324e324ace997253; CI 45823039811, 45823039774 Windows 264/264, 45823039660 core e Chromium PASS 1280/360, checkout d60c4bc40179fe82eba964753c1aa52fd1b69041. ID15/16/18/26/28: modello e import multiplo di dichiarazioni geometriche vincolate al digest, atomico e add-only, ricalcolo server, UI e dossier tramite sessione corrente. Test Node/browser predisposti, non eseguiti localmente per DNS; CI nuova obbligatoria. Revisione sequenziale, nessuna regola catastale nuova. Dettagli docs/qa/ITERATION_062.md. Mappa/diario 404; gate 100+100 e prove ufficiali aperti, backup non modificati.

## Iterazione 063 — [Codex] — modalità C — 2026-11-26
PR #60 integrata squash 0c90ac34f7c63dac0e5dc3e25c7832fc2c63b9fe dopo CI 45832231983 Windows 275/275, 45832232026 linee guida, 45832232009 core e Chromium 1280/360; checkout 530773d8ff1912098e1e30e98d68f4c5347d28a3 verificato nei quattro log. ID30: predisposto corpus di 108 pratiche sintetiche strutturalmente distinte e 108 verifiche incrociate abbinate, dalla visura revisionata al dossier/ZIP/riapertura e handoff. Test non eseguiti localmente (DNS), CI da verificare. Nessuna attestazione professionale; gate 100+100 e prove ufficiali ancora aperti. Evidenze docs/qa/ITERATION_063.md; nessuna regola nuova, backup non modificati.

## Iterazione 064 — [Codex] — modalità C — 2026-11-26
PR #61 integrata squash d3e39f8b8c7cf87402eb8fad15cee95f1566f1db; CI 45842099534 core 1313/1313, 108 pratiche e 108 cross-check nominativi PASS, Chromium 1280/360; Windows 45842099519 275/275, linee guida 45842099481. ID19/21/22/28: promemoria manuale DOCFA diagnostico JSON, lacune e controlli ufficiali aperti, nuova CI obbligatoria. Revisione sequenziale, nessuna compatibilità attestata. Dettagli docs/qa/ITERATION_064.md. Gate quantitativo sintetico soddisfatto, professionale ancora aperto.

## Iterazione 065 — [Codex] — modalità C — 2026-11-26
PR #62 integrata squash fafade3e634bfe9e5f8f4cfd34d924757bf48fd3 dopo CI 45852812945 core 1316/1316 e Chromium 1280/360, 45852809826 Windows 275/275, 45852810696 linee guida. Checkout 511780bd62ae6c766ae4d581c430a2ae83438664, head 341b07f1b73d6d1182d39f52b958f1c238797574 e base d3e39f8b8c7cf87402eb8fad15cee95f1566f1db verificati nei quattro log. ID15/16/28: import locale ristretto DXF ASCII, coordinate metriche esatte, origine traslata, controllo topologico e inserimento nell'editor senza misura automatica. Test predisposti, CI richiesta. Revisione sequenziale; dettagli docs/qa/ITERATION_065.md. Gate professionale aperto; nessun dato reale o regola ufficiale nuova.

## Iterazione 066 — [Codex] — modalità C — 2026-11-26
PR #63 integrata squash 9fdaeef89089fdf214700351016539b539441668: CI 45861832138 linee guida, 45861832103 Windows 275/275, 45861832175 core e Chromium 1280/360; checkout 93f7cead7dda604711c8bedb8b9c3eafac09175d con head 49211047e11492cb92216f550d344647b7eb209e e base fafade3e634bfe9e5f8f4cfd34d924757bf48fd3 verificati nei quattro log. ID19/21/22/28/30: scheda stampabile di confronto manuale DOCFA dal workbench, ricalcolo locale sessione, dati e lacune per unità, campi vuoti per ambiente, archivio e riscontri. Nessuna attestazione automatica. Test Node/API predisposti, CI obbligatoria. Revisione sequenziale, dettagli docs/qa/ITERATION_066.md. Gate professionale aperto.

## Iterazione 067 — [Codex] — modalità C — 2026-11-26
PR #64 integrata squash 8d15e683be35ab0d3babcbf6ed1f4b524715f40d; CI 45870058161 linee guida, 45870058031 Windows 277/277, 45870058046 core 1322 e Chromium PASS 1280/360. Tutti i quattro log checkout 0f10562299c2db0e9192494bc0afec2e233c7cce, head d45db1ed7e8159f5ccaf45e0293bd0a988f27bc7/base 9fdaeef89089fdf214700351016539b539441668; main verificato prima del merge. ID19/21/22/28/30: modello JSON dei riscontri manuali e controllo locale vincolato a snapshot completo, ambiente, sei controlli e riferimenti; record separato, nessuna verifica ufficiale automatica. Revisione sequenziale; test Node/API/browser predisposti, nuova CI necessaria. Dettagli docs/qa/ITERATION_067.md. Gate professionale aperto.

## Iterazione 068 — [Codex] — modalità C — 2026-11-26
PR #65 integrata squash f333ef0b9583aa6d9973888d836019be8e58f5bf; CI 45879047283 linee guida, 45879047314 Windows 289/289, 45879047292 core e Chromium 1280/360. Checkout 9af80f9ef986b9ee176e75149ed2cf0cd0d6b12e, head c88a4a0bd3fe53c32e97682e0e6757678afb0033 e base 8d15e683be35ab0d3babcbf6ed1f4b524715f40d verificati nei quattro log; main identico al base prima del merge. ID26/27: implementato ricevente di riferimento v0.2 con schema, copertura, digest non autenticante, misure ricalcolate e CLI stdin offline, per tutti e tre i target. Test Node e CLI predisposti, nuova CI obbligatoria. Revisione sequenziale; nessun import effettivo nei repository destinatari, nessuna nuova regola catastale o prova ufficiale. Dettagli docs/qa/ITERATION_068.md. Gate professionale aperto.


## Iterazione 069 — [Codex] — modalità C — 2026-11-26
PR #66 integrata squash 53d102ae0d32d0806446905a007d6278438f4c39 dopo quattro job positivi sul merge esatto; Windows 305/305 e Chromium 1280/360 PASS. ID26/27: PR dedicata nel repository destinatario MPE, comando CLI Python effettivo con ricevente riusato e candidato diagnostico non vincolante; CI Linux/Windows in coda. Nessun aggiornamento automatico al ledger; integrazione non ancora validata. Pianta Libera AGPL: non copiare codice proprietario senza decisione sulla licenza. Dettagli docs/qa/ITERATION_069.md. Gate professionale aperto.


## Iterazione 070 — [Codex] — modalità C — 2026-11-26
PR #67 integrata squash c4e4da06911b5cf4ca55a72d553514ee15d5d377 dopo quattro job positivi sul merge esatto; Windows 305/305, Chromium 1280/360 PASS. Ricevente locale APE Italia proposto nella PR #101, CI dedicata e generale non ancora concluse; nessun calcolo energetico, mutazione o import nella pratica. MPE #2 entrambe le piattaforme failure, log 404 e step assenti: causa non verificata. Dettagli docs/qa/ITERATION_070.md. Revisione sequenziale; gate professionale aperto.

## Iterazione 071 — [Codex] — modalità C — 2026-11-26
PR #68 integrata squash 4e8252d54f828ea78ee022894511bffeb6b160b4; CI 45900706240, 45900706224, 45900706281, quattro job success, Windows 305/305, checkout 2747ee307e38958fdcfc4df44c95c57bc899c0c5 verificato nei log con head a09449fdf97207787092015ece0c2db36acf4387 e base c4e4da06911b5cf4ca55a72d553514ee15d5d377. CI generale APE #101 45900622043 quattro job success, dedicata già superata; PR ancora aperta al controllo. ID15/16/26/28: ponte CAD DXF a unità singola C/V con ricalcolo sessione, UI e API locale, test round-trip e browser predisposti, nuova CI richiesta. Nessuna compatibilità Pianta Libera attestata, nessun codice AGPL trasferito. Revisione sequenziale, dettagli docs/qa/ITERATION_071.md. Gate professionale aperto.

## Iterazione 072 — [Codex] — modalità C — 2026-11-27
PR #69 head 3f6261ce5a0ba324ed80e47a7c08d11b4a969d39 non integrata: workflow 45906290043 core success ma browser failure (job 140203696624, timeout evento download ZIP alla riga 375; causa non ancora identificata). Windows 45906290097 308/308, linee guida 45906290010 success. Checkout 7a7d90e9007e75833d6756037e1a6890f06b11b2 verificato nei log. Corretta la visibilità dello stato durante la preparazione ZIP e rafforzato test con attesa esplicita, verifica HTTP/Content-Type e diagnostica scenario/viewport/stato/errori; download reale e manifest restano obbligatori. Nuova CI necessaria; nessun test locale completo (DNS). APE Italia PR #101 integrata squash 565d0175c430bd6782d1ac68dfd2159e21934428: sei job success su checkout c984c27a88cc197976770e814df60bf27c390dec, base 295fc3f464d10a3a7a184702a99600459b9b4135, head 7f2eaa52151d252df10072135c61a8b575135717; cinque file riusati verificati identici al sorgente Catasto. CLI locale soltanto, nessun import in pratica energetica. MPE #2 ancora failure (45893251429). Revisione sequenziale, mappa/diario centrale 404, nessuna nuova regola catastale, backup non modificati. Gate professionale aperto.

## Iterazione 073 — [Codex] — modalità C — 2026-11-27
PR #69 head 26e9e99125e9671460e591c224ca397716d641ed: CI 45912911574 core success, browser failure (job 140225254258: internal_distribution, 1280px, HTTP 200 application/zip, stato Archivio richiesto, nessun pageError, evento download assente). Windows 45912911531 e linee guida 45912911501 success. Ipotesi: gesto utente perso o politica download browser; non dimostrata. Correzione: preparazione asincrona separata da secondo click sincrono, buffer unico in memoria associato al body esatto, scarto dopo uso, cambio caso/annesso o lock. Test browser preserva verifica HTTP, download reale, manifest, riapertura e corruzione; aggiunta invalidazione dopo import bozza. Parsing JS isolato OK; CI completa necessaria. Revisione sequenziale; nessuna modifica server, nessun nuovo formato o regola catastale. Backup non modificati, licenza invariata. Gate professionale aperto.

## Iterazione 074 — [Codex] — modalità C — 2026-11-27
PR #69 head dc4d0c413d01c305cc8a60ed7a9ac188b28e213a, base main 4e8252d54f828ea78ee022894511bffeb6b160b4. CI 45918902286 linee guida e 45918902219 Windows positive; 45918902202 core positivo, browser 140244623006 failure: HTTP 200, stato Archivio richiesto, zero pageErrors, timeout evento download su internal_distribution 1280. Non dimostra la causa esatta. Revisione sequenziale del piano e diff: link HTML nativo persistente, blob revocato a invalidazione/preparazione, controllo esatto dichiarazioni anche al click, nessun endpoint o permesso nuovo. Test browser effettivo conservato, aggiunto retry byte-identico e verifica href rimosso, diagnostica console. Tentativo locale Chromium bloccato ERR_BLOCKED_BY_ADMINISTRATOR su loopback; clone DNS non risolto. Nuova CI obbligatoria. Registro centrale mappa/diario 404. MPE #2 CI ancora failure senza step/log disponibili; nessun merge. Nessuna regola ufficiale nuova, backup non modificati, licenza invariata, gate professionale aperto.

## Iterazione 075 — [Codex] — modalità C — 2026-11-27
PR #69 integrata squash 42ddae2f09a8da967d71e16b813751da2a5ea3be. Workflow 45923865587 core e Chromium (PASS 1280/360, download ZIP reale, retry e riapertura), 45923865449 Windows 308/308, 45923865461 linee guida; quattro log checkout 52177bb5eb0281856b5478d3651922fc9cb201c5 (head b9b996410bc44290cc596f58dab79bb135dd5f0a, base 4e8252d54f828ea78ee022894511bffeb6b160b4). ID26/28: Pianta Libera #111, head 962ac4ab809aba5028f55a8cd6fd03daea6cc6ed, test reale import DXF neutro in mm e solo ricalco; fixture byte-identica attesa in produttore, guida UI corretta. Nuove CI necessarie. MPE #2 rerun 45893251429 richiesto e ancora failure per entrambi i runner senza step disponibili; nessuna causa attribuita. Mappa/diario centrale 404. Fonte ufficiale storica DOCFA 4.00.3 consultata, esplicitamente sostituita da 4.00.4; nessun archivio vigente acquisito. Revisione sequenziale, backup preservati, licenza invariata, nessuna regola ufficiale nuova. Dettagli docs/qa/ITERATION_075.md. Gate professionale aperto.


## Iterazione 076 — [Codex] — modalità C — 2026-11-27
PR #70 integrata squash 4fa82ee8623ba9d830c4bfddc8dc77f053ca2fce dopo CI 45930328869/45930328843/45930328835, quattro job positivi, Windows 308/308; tutti checkout 72ecf90e8e0f6ee51293b68dee5a22d8714c4a39, head 816fb04e576080dabc4004bd6538b37a1b856672 e base 42ddae2f09a8da967d71e16b813751da2a5ea3be. Pianta Libera #111 integrata squash 0879adcffadc2025b23c82c50e79e4ea9b079850, CI 45930265083/45930265093/45930265191 positive (9 job success, 2 nativi skipped per configurazione; checkout 96bf86539592443a0a984f22ea07c4936cb2d7f3 verificato nei log dei job test, qualità, browser ed Electron). Test editor 62 pass, specifico test Catasto PASS, verifica 8 segmenti e dimensioni 7 × 2 m, senza modifica del modello. Entrambi i main identici ai base testati prima del merge. ID03/13/22/28/30: pannello locale per impronta SHA-256 archivio di riferimento, senza upload, decompressione, persistenza o promozione a fonte ufficiale. Limite 64 MiB, reset, rifiuto file vuoto, nessun nome file nel risultato. Test isolato Node 22 con DOM simulato e WebCrypto reale: 5 casi positivi; browser reale predisposto, nuova CI obbligatoria. MPE #2 ancora failure 45893251429, nessun merge. Registro centrale mappa e diario 404. Backup intatti, licenza invariata, gate professionale aperto. Dettagli docs/qa/ITERATION_076.md.


## Iterazione 077 — [Codex] — modalità C — 2026-11-27
PR #71 integrata squash e12631f4832b0facba082460530a953ed1cd92c1 dopo CI 45936297259 Windows 308/308, 45936297224 core e Chromium PASS 1280/360, 45936297188 linee guida. Quattro job con checkout 01570042f893be919dec3612791baa8ce5c6681a; head c60b5594594ad5175272b80258747b2d0feba844, base 4fa82ee8623ba9d830c4bfddc8dc77f053ca2fce, ahead 7/behind 0. ID22/28/30: compilazione guidata in UI dei sei riscontri DOCFA con ambiente, copia esplicita SHA-256, note e riferimenti, controllo server esistente, export diagnostico separato, invalidazione del modello al cambio degli annessi e reset alla sostituzione caso. Test Chromium predisposto, non eseguito localmente (DNS github.com non risolto), nuova CI necessaria. Revisione sequenziale, nessun agente indipendente disponibile. MPE #2 ancora failure senza step/log utili. Nessuna regola ufficiale nuova, nessuna prova DOCFA/SISTER, firma o invio. Backup verificati f128cffb0504eee2a3873341f0c91fa00199eb41 e 2b45109482e153b83ff58ea7b08b856a99f589b4. Registro centrale mappa/diario 404. Gate professionale aperto. Dettagli docs/qa/ITERATION_077.md.


## Iterazione 078 — [Codex] — modalità C — 2026-11-27
PR #72 integrata squash dca3597ce6fa69a4c22d119351fb2576e2f0010c: CI 45941679630 linee guida, 45941679684 Windows 308/308, 45941679648 core 1353 e Chromium PASS 1280/360; tutti i quattro log checkout f77b09a7338962b8fe724d16d73a21a444580311, head 9c0925bb716c4901f841c887754455df9cf711f3/base e12631f4832b0facba082460530a953ed1cd92c1, ahead 10/behind 0. ID22/28/30: riapertura guidata di un registro salvato, ricalcolo server, confronto canonico integrale e popolamento dei soli dati rigenerati, modifica successiva e nuovo export separato. Test browser predisposto, nuova CI obbligatoria. Revisione sequenziale, nessuna nuova regola, nessuna prova ufficiale o V1.0. Registro centrale mappa/diario 404; MPE #2 ancora aperta, non integrata. Backup intatti. Dettagli docs/qa/ITERATION_078.md.


## Iterazione 079 — [Codex] — modalità C — 2026-11-27
PR #73 integrata squash 59ce16a31ad96556f80d7a8d5d59d65b1f13eca4 dopo quattro job positivi su checkout a7749e791e6330b66c3f2333f00b93dd83d9c916 (45947337656 Windows 308/308, 45947337661 linee guida, 45947337699 core e Chromium 1280/360). ID22/28/30: generatore locale del kit di confronto per sei scenari sintetici, sessioni con geometrie e simulazioni, ZIP, schede e modelli vuoti, manifest ultimo e cartella nuova. Nessuna prova ufficiale o regola nuova; test integrati predisposti, CI obbligatoria. MPE #2 ancora failure senza step; backup intatti, registro centrale 404. Dettagli docs/qa/ITERATION_079.md.


## Iterazione 081 — [Codex] — modalità C — 2026-11-27
PR #74 head a188c94afb0e6641ec7e78d4975ada2e7e5e6b33, main 59ce16a31ad96556f80d7a8d5d59d65b1f13eca4, ahead 1/behind 0 prima della correzione. Run 45953358514, retry: core job 140377154071 success, browser 140377151434 failure: PASS desktop 1280, timeout evento download bozza alla riga 520 nel ciclo mobile. Windows 45953358512 job 140354081737 e linee guida 45953358538 job 140354081716 success. Causa browser non definitivamente dimostrata; stesso modello nativo già collaudato per ZIP, preparazione e download espliciti, un solo blob bozza, revoca su modifica/lock e controllo testo esatto al click. Test browser preserva download reale, aggiunge uguaglianza JSON, retry e invalidazione. Revisione sequenziale, nessun agente indipendente; CI nuova obbligatoria, nessuna prova locale completa attestata. Nessun nuovo endpoint, regola ufficiale, firma o invio. Backup verificati prima delle modifiche: f128cffb0504eee2a3873341f0c91fa00199eb41 e 2b45109482e153b83ff58ea7b08b856a99f589b4. Gate professionale aperto.


## Iterazione 082 — [Codex] — modalità C — 2026-11-27
PR #74 integrata squash 08a8f4d00e4543b75e615c146544e90a3beaa4a9: workflow 45968360609 core 1355 pass e Chromium PASS 1280/360, 45968360652 Windows 310/310, 45968360623 linee guida; quattro log checkout 4cdafde, head 5b131ed7b21cf35acbcc08a19e91616e2b260257/base 59ce16a31ad96556f80d7a8d5d59d65b1f13eca4, ahead 7/behind 0. ID22/30: CLI di riepilogo dei sei registri esportati, ricalcolo integrale su sessioni fisse, conteggio mancanze, invalidi, incompleti e discrepanze, nessuna promozione a verifica ufficiale. Test integrati predisposti, non eseguiti in questa sessione; CI obbligatoria. MPE #2 ancora failure senza step. Revisione sequenziale. Backup verificati, licenza invariata, gate professionale aperto. Dettagli docs/qa/ITERATION_082.md.
