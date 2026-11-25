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
