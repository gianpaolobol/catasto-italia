# Iterazione 024 — 2026-11-25
## Gate precedente
- MASTER_PLAN e DEVELOPMENT_PROGRESS letti da main; inventario branch e PR, diff #22, review/thread (nessuna revisione esterna) esaminati.
- CI 45527687933/job 138914977189: checkout b3d0f14fbecfd72db388abe6e98fc935f215074b (merge head 24c95626ee45037b3d562196345a98fb9e811c36 su base b31ea2b40ae54e3f01cd733aea0bcb8651c2e888); 556 test, 556 pass, 0 fail, 0 skipped. Inclusa prova nativa PDF sintetico -> OCR ita. Head/base ricontrollati prima dello squash merge confermato 71ff3b7a4867f5e089e780f7186aa5e740d41504.
## Piano e revisione sequenziale
- ID05/29: il percorso PDF testuale non applicava lo stesso rifiuto di memoria condivisa del percorso raster; controllava inoltre il magic header prima della copia. Il TSV OCR controllava geometria nel raster e gerarchia degli ID, ma non la coerenza geometrica con gli antenati. Correggere entrambi senza allargare il perimetro diagnostico.
- Non dedurre coordinate PDF, né interpretare layout o classificazione catastale. La containment policy è prudenziale: eventuali output di motori non conformi vengono rifiutati, non corretti automaticamente.
## Implementazione e revisione critica
- ee5b1195f53a9d3891f6b25ea3e7529cfa4117a5: rifiuto SharedArrayBuffer e controllo header sulla copia effettiva.
- ff647d0aff05062493f1e608d1b2896d09a35a71: stack delle geometrie degli antenati OCR, verifica contenimento e riuso della stessa geometria validata per output.
- c8b11017e45d5dbd5c407e39a65260e7cc1468c6, 1682843a5ad929c5c9f931919aedec0df0955724, e54cad5c5d305e708feffb94a234b27b7566f30a: 9 test sintetici aggiunti. Rilievo di revisione sequenziale: non basta provare un singolo figlio fuori limite; verificare anche confini inclusivi e invalidazione degli antenati ai cambi di ramo, e che il binder non emetta evidenza parziale. 4b8508983e8591fb3f2372ddef32556d1912cd17 chiarisce la policy nel codice.
## Test e limiti
- CI richiesta: node --test tests/*.test.mjs, attesi 565 test, non ancora dichiarati superati. Node locale 22.16.0 disponibile, ma clone GitHub fallito per DNS; nessun test locale del nuovo diff dichiarato.
- Nessun agente indipendente disponibile, revisione sequenziale. Non sandbox OS, non layout verificato, non mapping PDF, non Windows/multipagina OCR. Nessuna nuova regola catastale, modifica licenza, dato cliente, firma o invio. Nessun caso catastale integrale o verifica incrociata indipendente conteggiati.
- Prossimo: gate esatto CI, isolamento OS, corpus territoriale, Building Core, UI e QA 100+100. DOCFA/SISTER non verificati; warning checkout deprecato resta aperto.
