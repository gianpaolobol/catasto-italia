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
