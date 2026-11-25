# Iterazione 039 — modalità C — 2026-11-25

## Gate precedente e consolidamento
- PR #38: run 45626271856 su head e8bb4c3b542f7b38c6c7631b8f9372d8b1b6c36c, base f96945ef7d47a6779075331f55b0251d41e210b2: core 738/738, browser fallito durante installazione perché ubuntu-latest = Ubuntu 26.04, non supportato da Playwright 1.57.0. Nessun test browser disabilitato.
- Correzione runner browser a ubuntu-24.04 (15b972fd48bb7f8ba13f179caa940fb36669da54). Run 45638068128, job core 139288796984, browser 139288797582: checkout merge 41eb584 su head 818ec033ad4a0df88f5b6df0afb92e75c5cd7cbb e base f96945ef7d47a6779075331f55b0251d41e210b2; 738/738, zero fail/skip/cancel/todo; Chromium PASS a 1280 e 360 px per caso bloccato, 4 scenari, download JSON/HTML e geometria, reimportazione bozza.
- Main verificato identico al base prima del merge; squash 5110de484ea9810c668b8545079ee49d3ad7d390. Backup entrambi presenti e non modificati.

## Piano e revisione del piano
ID07/09/10/20/26/28/29: aggiungere variazione di destinazione dell'intera unità, come quinto scenario sintetico verticale, riusando inventario, verifica copertura, evidenze, relazione, dossier e annesso geometrico. Solo una unità originaria e una risultante, un subalterno ciascuna, stessa particella, nessuna fusione/divisione, confini e mappa dichiarati invariati. Esigere fatti ed evidenze distinte. Non inferire categoria, rendita, conformità edilizia, disponibilità o titolo. Nessun caso combinato.
Fonti ufficiali consultate il 25/11/2026, inclusa pagina originale visualizzata:
- Circolare 9/2001, 26/11/2001, PDF p. 6, sezione causali: https://www1.agenziaentrate.gov.it/mt/circolari/circolari_2001/circolare_9_2001.pdf
- Circolare 1/2006, 03/01/2006, §4 p. 5, distinzione fra cambio dell'intera destinazione e interventi combinati: https://www1.agenziaentrate.gov.it/mt/circolari/Circolari_2006/circolare1_2006_docfa_comma336.pdf
Sono fonti storiche consultate, non prova di applicabilità vigente e territoriale. Registro circ1-2006 pending; nessuna regola operativa abilitata. Il nuovo subalterno è soltanto proposto; l'ipotesi diagnostica non è approvazione o prenotazione.

## Implementazione e revisione critica sequenziale
- Motore: scenario separato, S=1/C=1/V=0, conservazione unità estranee, vincolo di un subalterno per unità; riuso controllo collisioni normalizzate e particella unica.
- Editor guidato e trascrizione revisionata: fatti espliciti; modello di esempio non autocertifica evidenze, sconosciuto blocca. UI selezionabile; dossier esistente e geometria riusati.
- Nuovi test Node in tests/destination-change.test.mjs; browser smoke esteso a cinque scenari su due viewport.
- Revisione sequenziale (nessun agente indipendente): controllato che la fonte pending non promuova export, che graffature/particelle intere e riutilizzo di subalterni restino bloccati, che la modifica di un fatto non aggiorni la trascrizione, che la destinazione di un'intera unità sia distinta da fusione/divisione. Nessun nuovo calcolo classamento.
- Primo harness V8 non valido per assenza della API URL nativa: esito scartato, non contato come test di prodotto. Ripetuto con parser URL limitato ai dati di test; catalogo privo di errori e 15/15 controlli logici riusciti sul codice a 82bd7ccfd9f1de2f3ffc1eda2cb10131b71da6b5. Sostituti di caricamento JSON, URL, clone, TextEncoder e digest non crittografico. Verifica soltanto logica, non collaudo Node, browser, sicurezza o SHA-256. Clone GitHub locale non disponibile (DNS).
- Test Node predisposti: node --test tests/*.test.mjs. Browser: python scripts/check-workbench-browser.py. CI effettiva richiesta, merge soltanto dopo successo di entrambi i job sul head/base esatti.

## Gate V1.0
Nessun dato reale, segreto, modifica licenza o backup; nessuna firma o trasmissione. Non compatibilità DOCFA/SISTER. Nessun nuovo caso integrale ufficiale o verifica professionale indipendente conteggiato. Rimangono ampliamento, cambi combinati, fonti territoriali, classamento/rendita, geometria calibrata, integrazioni esterne, isolamento OS, 100+100 verifiche e prove ufficiali.
