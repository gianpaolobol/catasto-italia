# Iterazione 016 — 2026-11-24
## Piano e revisione
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS, branch e PR. PR #15 head 37ec4f17b2420916b45bf84d9063d2cc8ae0bc45, base 0531d0eee5dab5bb58abf2b95bab169d1641ad4b, compare behind 0, cinque file attesi; CI 45452501064 job core 138653076719, checkout merge esatto, 448 pass / 0 fail / 0 skip. Squash merge confermato db5fd656a564f455f83a0fa8d9bc423fbc6e83af.
- ID05/29: eliminare la ricerca implicita del programma nativo; nomi fissi, percorsi assoluti e nessuna shell. Fonte tecnica ufficiale: https://nodejs.org/api/child_process.html (lookup PATH e spawn); nessuna nuova regola catastale.
- Revisione sequenziale del piano: validare tutto PATH prima di cercare; usare suffisso .exe esplicito su Windows; non considerare questo controllo autenticazione o sandbox.
## Implementazione e revisione critica
- b7b3d72de813025244bde7276a9495199321ad50: resolver con ordine PATH, limite dimensione/numero segmenti, rifiuto segmenti relativi e ambigui, verifica file/accessibilità; nessuna ricerca in CWD implicita. af7a1562e547dc89784387f0e335104a1352230e: invocazione assoluta.
- Rilievo sequenziale: risolvere il secondo programma soltanto dopo aver già elaborato il PDF con il primo è evitabile; db86e5e0983a6e74ff9916772f5aa4d7280db29d preflight entrambi con un unico snapshot env.
- 0409f3df1ffa8ecaf09753f598167b004afb2fd3: 24 test sintetici predisposti, inclusi lookup in child con CWD diversa e preflight del secondo binario. Rilievo: il test POSIX non deve risultare pass su Windows senza asserzioni; correzione 2deedf2a61ee44ef83bc95137ed02c82711bde13 (skip esplicito, import inutilizzati rimossi).
- Riletti i tre file dal branch. Nessun agente indipendente; revisione sequenziale. Test del nuovo branch non ancora eseguiti in questa fase; comando CI richiesto node --test tests/*.test.mjs.
## Limiti e prossimo gate
- PATH e directory devono essere fidati; non verifica firma/hash dei binari, non risolve corse filesystem, symlink o dipendenze native, non isola CWD/rete/filesystem/CPU/memoria. Non verifica Windows reale. Non abilita uso produttivo su PDF non fidati.
- Nessun dato cliente, segreto, firma o invio; licenza invariata. Nessun caso catastale integrale o verifica indipendente conteggiato. Prossimo: CI sul head/base esatti e merge se positiva; worker OS, OCR, avviso checkout deprecato, corpus territoriale, Building Core e adattatori, QA 100+100, DOCFA/SISTER reali.
