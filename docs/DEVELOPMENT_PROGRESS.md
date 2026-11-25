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
