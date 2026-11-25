# Iterazione 030 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS su main. Ricerca PR aperte: nessuna prima di questa iterazione. Elenco branch consultato. Main identico allo squash a47e95231d0c3f0fbef588d09c78d96c6743ff1c della PR #28 (già integrata al momento della verifica).
- PR #28: head b37c4d8c82bd46ce03ec09ebb3c1a8a8a470d305, base bc6df6f754b8f7243e347cd9de100d89ae1dbb74; CI [45570917039](https://github.com/gianpaolobol/catasto-italia/actions/runs/45570917039), job core 139057052788, checkout merge 4b12c98 sul head/base esatto; log 616/616 pass, zero fail/cancel/skip/todo. Browser smoke non eseguito da questa CI.
## Piano e revisione sequenziale
- ID05/28/29: replay di un manifest JSON già parsato contro il raster e le evidenze originarie. Rigenerare le decisioni con il motore precedente, confrontare tutti i campi derivati e il digest canonico, restituire una nuova proposta non operativa.
- Revisione piano: nessuna fiducia nel solo hash o nei campi derivati forniti dal chiamante; limitare liste e stringhe; rifiutare proprietà estranee, sparse array, versioni ignote, ordine delle decisioni alterato. L'ordine delle proprietà JSON non è significativo. Nessuna approvazione o autenticazione.
## Implementazione e revisione critica
- 473d320d3880cc1c8e941f50fa3b90fca34e9229: modulo replay.
- 2dbd699442a3f0f0783f1cb2cfaf15d7e202c158: test round-trip, esclusione, falsificazione con hash ricalcolato, integrità raster, limiti e stati.
- c112d4762dad70243a4eff73a07224e9870a3fb6: normalizzazione zero con segno nella costruzione proposta; JSON non distingue -0 e 0, il confronto deve restare stabile dopo serializzazione.
- 668ee1ff732968c3289c11c52193bc1bb65b870a: regressione specifica per coordinate zero.
## Evidenze e limiti
- 29 test sintetici nuovi predisposti (5 positivi/limiti, 24 negativi); attesi 645 complessivi. Comandi locali: node --version v22.16.0; git ls-remote https://github.com/gianpaolobol/catasto-italia.git HEAD fallito per DNS. Non eseguiti localmente; CI richiesta. Nessun merge senza conferma.
- Un attore in grado di generare una nuova proposta valida con hash aggiornato non viene autenticato: test esplicito. Il replay non è storage sicuro, parser di input non fidato, firma, approvazione o audit autenticato. Nessuna nuova regola catastale o dato reale; licenza invariata.
- Revisione sequenziale, nessun agente indipendente. Nessun caso catastale integrale o verifica professionale conteggiata. Nessun test DOCFA/SISTER reale, firma o trasmissione.
- Prossimo: CI e merge se verificati; integrare UI editing e replay, isolamento OS, corpus territoriale, Building Core e QA 100+100. V1.0 non validata.
