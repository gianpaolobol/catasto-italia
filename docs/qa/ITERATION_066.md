# Iterazione 066 — [Codex] — 2026-11-26

## Integrazione verificata
PR #63 integrata squash 9fdaeef89089fdf214700351016539b539441668. Workflow 45861832138, 45861832103, 45861832175 success; job 140054540380, 140054540061, 140054540624, 140054540900. Log checkout identico 93f7cead7dda604711c8bedb8b9c3eafac09175d, head 49211047e11492cb92216f550d344647b7eb209e/base fafade3e634bfe9e5f8f4cfd34d924757bf48fd3. Windows 275/275; Chromium PASS 1280/360. Main verificato prima del merge.

## ID19/21/22/28/30 — confronto manuale riproducibile
Criteri: scheda generata solo da sessione sintetica corrente ricalcolata; ogni unità, operazione, identificativo, area geometrica e prodotto estimativo disponibile, lacune e sei verifiche ufficiali sempre aperte. Campi vuoti per ambiente DOCFA, data/hash archivio, tracciato e riferimenti alle prove. HTML offline senza script, form o connessioni, CSP restrittiva, dati escaped, nessuna registrazione automatica dell'esito. Il digest riguarda il caso; conservare sessione e scheda insieme, non scambiare digest per autenticazione degli annessi. Nessuna modifica del formato ZIP o JSON precedente, nessun nuovo mapping ufficiale.
Revisione sequenziale piano/diff: ricalcolare sul server con validatore esistente; non trasformare copertura diagnostica in esito positivo; disabilitare pulsante insieme alla sessione, evitare HTML attivo e mantenere confine loopback same-origin. Nessun agente indipendente. Test Node (node --test tests/integrated-dossier.test.mjs) e smoke scripts/check-workbench-browser.py predisposti, non ancora eseguiti sul nuovo branch. CI obbligatoria.

## Protocollo operativo per prove ufficiali (non ancora eseguite)
1. Ottenere software DOCFA e archivio provinciale corrente dal canale istituzionale; registrare versione, provenienza, data, hash e tracciato. Non usare tariffe DOCTE, OMI o vecchie come sostituti.
2. In ambiente Windows isolato, senza credenziali SISTER, eseguire la stessa pratica sintetica nel workbench e manualmente in DOCFA. Conservare sessione e scheda con versione e log locali; nessuna firma o trasmissione.
3. Confrontare identificativi, operazioni, modelli, planimetrie, consistenza/rendita, controlli ufficiali; classificare differenze e ripetere dopo correzione. Non assumere equivalenza tra superficie geometrica e catastale.
4. Validare separatamente ogni formato di interscambio con strumenti ufficiali: una prova manuale non dimostra interoperabilità. Non introdurre mapping senza specifiche vigenti.
5. Prima di V1.0: risolvere blocchi, validare importatori destinatari, verifiche professionali e sicurezza, oltre al gate sintetico 108+108 già superato in PR #61.

Fonte ufficiale ricontrollata il 26/11/2026: https://agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/aggiornamento-catasto-fabbricati-docfa/docfa-versioni-precedenti/software-docfa-4003 (storica, non prova di vigenza); https://arcom.agenziaentrate.gov.it/CitizenArCom/ (variazioni circoscrizionali e allineamento da verificare). Nessun archivio vigente acquisito, nuova regola, prova DOCFA/SISTER o V1.0 validata. Backup f128cffb0504eee2a3873341f0c91fa00199eb41 e 2b45109482e153b83ff58ea7b08b856a99f589b4 non modificati, licenza invariata, solo fixture sintetiche.
