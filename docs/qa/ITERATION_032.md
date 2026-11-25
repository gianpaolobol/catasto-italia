# Iterazione 032 — modalità C, 2026-11-25
## Gate precedente
PR #30: CI [45589118452](https://github.com/gianpaolobol/catasto-italia/actions/runs/45589118452), job 139118316808, 657/657, zero fail/cancel/skip/todo. Checkout del merge 7a25fa973dd16170e1c641428fa2202bdc7e7c06 (head 2b45109482e153b83ff58ea7b08b856a99f589b4, base f128cffb0504eee2a3873341f0c91fa00199eb41) verificato. Main avanzato soltanto per il file disgiunto docs/ACCELERATED_DELIVERY.md (f7afaf26); confronto API verificato prima dello squash 0be8e9065e839e620584809fc07bccb26ce71222. Nessun nuovo codice nel base drift. Backup esistenti, non modificati.

## Piano e revisione sequenziale
ID02/07–12/20/26/28/29: primo percorso verticale sintetico in browser locale. Riutilizzare Core, audit inventario, audit transizioni, audit evidenze e registro fonti; non codificare nuove regole catastali. Tre scenari positivi e diagnostica bloccante. Report JSON non ufficiale distinto dal divieto di export operativo. Non usare PDF/OCR reale finché manca isolamento OS.
Revisione del piano: evitare disponibilità presunta, autenticazione implicita e dati cliente. Server loopback senza proxy, controllo Host/Origin, limiti payload, nessuna persistenza automatica o esecuzione subprocessi, CSP, UI textContent, sentinel SYNTH (non anonimizzatore). Ogni modifica invalida il report visibile; esportazione esplicita. Il digest lega una dichiarazione, non verifica l'autenticità.

## Accettazione e test
- Fusione/divisione/nuova costruzione: esempio sintetico editabile → validazione Building Core → audit copertura/evidenze → operazioni S/C e unità estranee → relazione di ricerca e JSON diagnostico.
- Blocchi senza operazioni parziali: collisione, copertura incompleta, titolarità incerta, evidenza contraddittoria, formato o schema non supportato, identificativo non sintetico.
- Smoke HTTP su loopback effettivo previsto nella suite; UI browser reale e download non ancora collaudati.
- Node locale 22.16.0; git ls-remote fallisce DNS. Test predisposti, non dichiarati superati prima della CI. Revisione sequenziale, nessun agente indipendente.
- Avvio: node apps/workbench/server.mjs; aprire http://127.0.0.1:8765. Test: node --test tests/workbench.test.mjs.
- Tre scenari diagnostici non equivalgono a tre pratiche catastali integrali: zero nuovi casi validati ai fini del gate 100+100. Nessuna compatibilità DOCFA/SISTER, firma, invio o dato reale. Restano acquisizione/revisione visure, sandbox, corpus territoriale, classamento, geometrie, integrazioni esterne e collaudi ufficiali.

## Feedback e correzione
Riletto il flusso: operazioni calcolate solo da candidato dell'audit, nessuna rietichettatura di canExport, report annullato su modifica. Rilevato costo quadratico potenziale nell'associazione delle righe alle unità; sostituito con indice Map. Verifica HTTP e CI ancora da eseguire. Nessun esito di browser inventato.
