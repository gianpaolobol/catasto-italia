# Iterazione 031 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS su main, metadati repo pubblico, branch main e PR aperte. Licenza proprietaria verificata. PR #29 unico risultato aperto; head 59ed0bbb47d34cd66aadfc3713ff7fb251842903, base a47e95231d0c3f0fbef588d09c78d96c6743ff1c.
- CI [45582584870](https://github.com/gianpaolobol/catasto-italia/actions/runs/45582584870), job 139096061782, checkout 5e439e3ded1dff42c9655832f9ba31820cdfb2ab sul merge head/base esatti. Log: 645/645 pass, zero fail/cancel/skip/todo. Riletto diff e metadati PR prima dello squash f128cffb0504eee2a3873341f0c91fa00199eb41.
## Piano e revisione sequenziale
- ID05/28/29: editor HTML locale distinto dalla vista read-only; nessuna decisione preimpostata, tre azioni esplicite per parola; export solo su gesto utente di una richiesta non validata, vincolata alle impronte della fonte. Il motore Node già esistente valida richiesta e replay; nessun campo approvativo.
- Revisione piano: preservare API precedente e raster esatto; niente server, invii o risorse esterne. Script statico autorizzato da hash CSP, dati OCR solo in markup escaped; nessuna interpolazione di dati in JS. Nessuna persistenza automatica. Download può produrre file sensibile: avviso e nessuna pubblicazione.
## Implementazione e revisione critica
- fa66625fc9682a8481a2a2dc34b409d5c3b745ee: editor locale con controlli accessibili e richiesta JSON.
- 773fab26c9471f40a8c6298b6be535f61e296f4e: allineamento limiti e controllo caratteri al motore, rifiuto correzione identica, campo motivo a riga singola, nome variabile feedback e limite numero decisioni. Lo script non dichiara il successo del salvataggio, solo l'avvio del download.
- 1b83b6bde9a7f8bfef661c12c2ba6f3885589665: 12 test sintetici aggiuntivi; hash CSP, escaping, raster alterato, tre percorsi export -> motore -> replay, sei blocchi negativi. Esecuzione script in Node VM con contratto DOM simulato, non Chromium reale.
## Evidenze e limiti
- Node locale v22.16.0; git ls-remote fallisce DNS. Test predisposti, CI richiesta (attesi 657 complessivi, non ancora verificati). Nessuna pretesa di isolamento OS o download/browser/CSP effettivamente collaudati. Il file esportato è input non fidato; parsing/import in app, UI del replay e storage sicuro ancora da implementare. Nessuna approvazione autenticata o firma.
- Revisione sequenziale, non indipendente. Nessuna nuova regola catastale, nessun dato reale, nessun caso integrale o verifica professionale conteggiata. Nessun test DOCFA/SISTER reale, firma o invio.
- Prossimo: gate CI, browser reale con download e validazione Node, import/replay, isolamento OS, corpus territoriale, Building Core e QA 100+100. V1.0 non validata.
