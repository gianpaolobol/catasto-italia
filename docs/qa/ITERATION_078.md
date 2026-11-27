# Iterazione 078 — [Codex] — 2026-11-27

PR #72 integrata a dca3597ce6fa69a4c22d119351fb2576e2f0010c dopo verifica di quattro job: 140317176491 linee guida, 140317176552 Windows (308 pass, 0 fail), 140317176461 core (1353 pass), 140317176710 Chromium PASS a 1280 e 360 px. Log di checkout f77b09a7338962b8fe724d16d73a21a444580311 con head 9c0925bb716c4901f841c887754455df9cf711f3/base e12631f4832b0facba082460530a953ed1cd92c1. Compare ahead 10/behind 0 prima del merge.

## Criteri di accettazione
- Riaprire il registro diagnostico salvato nella stessa sessione, senza modificare la pratica o gli annessi. Proiettare i soli campi dichiarativi e usare il validatore server esistente; confrontare l'intero record canonico rigenerato (inclusi conteggi, check e flag). Rifiutare record alterati o stale; preservare modello precedente.
- Ripopolare ambiente e sei osservazioni dai dati rigenerati, consentire correzione ed esportazione, mantenendo false tutte le asserzioni ufficiali. File limitato a 128 KiB, richiesta a 256 KiB, nessuna persistenza o upload esterno.
- Test Chromium predisposto: record con flag ufficiale alterato rifiutato, riapertura originale e nuovo export identico, modifica esito e nuovo export, rifiuto dopo modifica degli annessi, reset dopo riapertura sessione. CI non ancora verificata. Revisione sequenziale del piano e codice, non indipendente; nessuna nuova API, dipendenza o regola normativa.

## Blocchi e fonti
Consultazione 27/11/2026: https://arcom.agenziaentrate.gov.it/CitizenArCom/ documenta competenze e allineamento amministrativo; la pagina DOCFA 4.00.3 (https://agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/aggiornamento-catasto-fabbricati-docfa/docfa-versioni-precedenti/software-docfa-4003) è storica e sostituita. Nessuna tariffa vigente acquisita, nessuna regola codificata. Non usare archivi Docte2 per il Catasto fabbricati. MPE #2 ancora aperta, CI precedentemente fallita. Registro centrale mappa/diario 404. Backup verificati f128cffb0504eee2a3873341f0c91fa00199eb41 e 2b45109482e153b83ff58ea7b08b856a99f589b4; licenza non modificata. Solo fixture sintetiche. Gate professionale aperto: servono ambiente DOCFA ufficiale, tariffe attuali, prove locali documentate; nessuna firma o invio.

## Verifica isolata effettiva
Callback di riapertura riletto dal blob Git 1e2ebed6fcd3701c030a089da9f093cb7c32f219 ed eseguito in ECMAScript con DOM, trasporto e codificatori ASCII simulati: 5/5 casi (record coerente, flag ufficiale alterato, conteggio alterato, campo extra, snapshot diverso). Non è un test del server, del browser o del decoder UTF-8 reale. CI integrale obbligatoria.
