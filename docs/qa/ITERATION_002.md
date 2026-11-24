# Iterazione 02 — registro fonti 0.1.0 (2026-11-24)
Base main ed982018c85e40037b70ad8824bb4acbf6dd7c08; PR #1 confermata integrata, workflow 45321928862 success. Nessun'altra PR aperta rilevata prima dell'iterazione.
## Pianificazione e revisione sequenziale
ID 03 prima tranche: registro JSON versionato con fonte, revisione, localizzatore, intervallo, ambito, data consultazione e stato; lookup fail-closed. Revisione del piano: non confondere data originaria/decorrenza o presenza sul dominio ufficiale con vigenza attuale, non inferire che la norma sia attiva perché manca data finale. Per questa ragione tutti i record sono historical/pending e nessuna fonte abilita regole operative. Non è un corpus esaustivo.
## Consultazione
D.M. 701/1994: Gazzetta Ufficiale, scheda originale e riferimento art. 1; circolari 1/2004 (p. 3) e 4/2009 (pp. 1–2), archivio ufficiale Agenzia, testo e immagini delle pagine controllati. RDL 652/1939: indice consolidato 01/11/2026 trovato, accesso diretto artt. 20/28 non riuscito; pending. Fonti e URL in packages/normative/sources.json. Vademecum nazionale/istruzioni territoriali e verifica sopravvenienze rimangono da acquisire.
## Revisione del codice e correzioni
Revisione sequenziale, non agenti indipendenti. Rilievi: query null poteva generare eccezione; scope e URL non stringa potevano essere coerciti; identificatore invalido bigint poteva causare errore di serializzazione. Correzioni e quattro test aggiuntivi. Nessuna regola catastale operativa introdotta.
## Test
Suite 24 casi sintetici del registro; riletti i blob c43a63be2ef9bb5a75f97d5a5e5ce21013dac1bc (motore), 93f79ee41d7f2508039a59b30348b8ea66099c23 (fonti), 278d1259628faf91f071b97ec95b40c1e8089163 (test). Tentativo in runtime ECMAScript limitato: 1/24 pass, 23 non eseguibili per assenza di structuredClone; non è un test Node e non si dichiara superato. CI Node obbligatoria con node --test tests/*.test.mjs (include 33 precedenti). Attendere esito prima del merge. Non sono pratiche complete né revisioni indipendenti.
## Prossimo
Confermare CI; acquisire fonti consolidate e territoriali; progettare motore di decisione con evidenze e gate sulle fonti. Nessuna firma, trasmissione o test DOCFA ufficiale.
