# Iterazione 029 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS su main; unica PR aperta #27, branch main e diff esaminati; nessuna review o thread esterno.
- CI [45563521436](https://github.com/gianpaolobol/catasto-italia/actions/runs/45563521436), job core 139032677933, checkout cc7a9090500682ee576c2a289de40a1e692d269e (merge head 7de1ec089c7e6b40d87a8048d442f35ce0e4e067 su base 88d5cb6583d85d644e19e9b35fb978619e1d11a3), 597/597 pass, zero fail/cancel/skip/todo. Ricontrollati head/base e mergeability; squash #27 confermato a bc6df6f754b8f7243e347cd9de100d89ae1dbb74. Il browser smoke resta opt-in, non eseguito da questa CI.
## Piano e revisione sequenziale
- ID05/28/29: introdurre proposta locale di revisione OCR, una decisione esplicita per parola (retain/correct/exclude); conservare originale, coordinate, score grezzo e motivo di modifica/esclusione. Nessuna approvazione professionale o inferenza catastale. Vincolare il risultato all'immagine esatta e alla catena di evidenze.
- Revisione piano: rifiutare decisioni incomplete, duplicate, fuori fonte, correzioni senza modifica, azioni non supportate; ordinamento canonico per parole originali; digest non autenticato. Nessuna persistenza o rete. Input locale JSON-like; non interfaccia per oggetti ostili.
## Implementazione e revisione critica
- 4e5c3e34628cf221d97e6c72e28d16a4236bf2f8: modulo packages/intake/ocr-review-decisions.mjs.
- 098261a330ddcb618748d1a28a1ec48dd199dc2e: esclusi campi request non supportati, snapshot limitato ai dati del contratto di revisione.
- efe81e5026b0263bc38a827362bdc01da85543e3: 19 test sintetici (3 positivi e 16 negativi), tra cui integrità pixel, parole, ordine, motivo, stati non operativi e zeri iniziali.
- b5829d6645e49daed2fffcc5669bb8a39a914e09: correzione da revisione critica, confronto esatto delle chiavi proprie anziché concatenazione con delimitatori.
## Evidenze e limiti
- Comando locale effettivo: node --version (v22.16.0); git ls-remote https://github.com/gianpaolobol/catasto-italia.git HEAD fallito (DNS). Nuovi test predisposti, non eseguiti localmente. CI usa node --test tests/*.test.mjs, attesi 616 test complessivi; non ancora verificati. 
- Revisione sequenziale, nessun agente indipendente. Nessuna nuova regola catastale, dato cliente, modifica licenza, firma o invio. Manifest non autentica il revisore né il documento; nessuna approvazione, UI di editing, storage sicuro o replay persistente. Nessuna pratica catastale integrale o verifica professionale conteggiata; nessun test DOCFA/SISTER reale.
- Prossimo: CI e merge se verificati, UI correzione locale, replay del manifest, isolamento OS, corpus territoriale, integrazioni Building Core, QA 100+100. V1.0 non validata.
