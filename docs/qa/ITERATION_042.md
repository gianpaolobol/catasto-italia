# Iterazione 042 — modalità C — 2026-11-25

## Gate precedente
PR #40: CI 45657829107. Job core 139359197608: 767 test, 767 pass, zero fail/cancel/skip/todo. Job browser 139359196522: PASS 1280 e 360 px, cinque scenari, download JSON/HTML e reimportazione bozza. Entrambi checkout 06d5cf2, head 7fa4f5fe798f47a538e16d3dcdcca0b7d1230e8f, base df4d46e95a0626a002b13a3b1abd8854b8ec651a. Main confrontato e identico al base prima del merge. Squash confermato 2ffbe14ca85e096305452caa93b68d62a099d0b1.

## ID13/14/28/29 — accettazione
- Proposta diagnostica valida, unità C/V selezionata; categoria, classe, zona inventata, consistenza e tariffa dichiarate. Gruppi A/B/C e unità coerenti. Nessuna fonte tariffaria reale né validazione di classamento.
- Prodotto decimale esatto (BigInt, stringhe decimali limitate), senza arrotondamento catastale. Caso, unità e dichiarazioni riportati nell'annesso JSON non ufficiale; nessuna mutazione della pratica o del dossier.
- Server ricalcola il report, blocca unità estranee e caso bloccato, mantiene origine loopback, JSON e limite dimensionale. UI invalida su modifica, importazione, cambio unità e variazione dati. Nessuna persistenza automatica o rete esterna.
- Fonte metodologica consultata in testo: Agenzia delle Entrate, Il Sistema Catastale, edizione 2021, §6, p.29, https://agenziaentrate.gov.it/portale/documents/20143/233848/Il%20Sistema%20Catastale%202021%20-%20pubblicato%20set2021.pdf/b4e3de16-ad6d-2814-d77d-b0c846e7ee70 ; screenshot PDF tentato ma 403. Non verifica vigenza o tariffe territoriali; non abilitare regole operative.

## Revisione sequenziale e prove
Rischi individuati: conversioni float, falsa tariffa ufficiale, incoerenza unità, dati obsoleti e report client manipolato. Correzione dopo rilettura: rifiutati spazi e newline terminali nelle richieste API. 17/17 verifiche isolate V8 sul modulo aggiornato (blob 4c273ecde4c37c19b30328a790eed182aae4be48) con sostituto esplicito di buildPracticeReport: quattro prodotti, dodici blocchi dichiarazioni, un blocco unità. Non equivalgono alla prova integrata. Node locale 22.16.0; git ls-remote fallisce DNS. Test Node in tests/workbench.test.mjs e smoke Chromium estesi ai cinque scenari, download e invalidazione, da eseguire nella CI. Nessun agente indipendente disponibile.

## Limiti e prossimi blocchi
Nessuna tariffa vera o classamento automatico, nessuna consistenza calcolata da rilievo, nessun arrotondamento ufficiale, nessuna compatibilità DOCFA/SISTER. Zero nuovi casi integrali o verifiche professionali ai fini del gate 100+100. Backup non modificati, licenza invariata. Nessuna firma o invio. Prossimi: gate CI, fonti tariffarie territoriali verificate, ampliamento e altre variazioni, importatori destinatari, geometria calibrata e isolamento documenti reali.
