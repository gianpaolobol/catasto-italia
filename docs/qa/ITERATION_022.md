# Iterazione 022 — 2026-11-25
## Gate precedente
- Letti MASTER_PLAN e DEVELOPMENT_PROGRESS su main; verificati branch, PR aperte, diff, review e thread della PR #20 (nessun rilievo esterno), confronto 6 avanti/0 indietro.
- CI 45513165590, job core 138865793014: checkout 79cf5f7fcbdfbae9717bfc182c0acdc9fffae74b, merge di head 7d3595e2942f433ce9c38244981eda7dcd23b96e su base 7e1967b0f24c64cc898d50dec19cf1c966a62ad0; 538/538 pass. Squash merge con expected head confermato a 2c0610045de2e3e472700c47b2c00d17bcda4dbc. Avviso checkout Node 20 deprecato ancora aperto.
## Piano e revisione sequenziale
- ID05/29: adattatore diagnostico PDF->PGM, riuso parsePdfInfo, snapshotCanonicalPgm, workspace privato. Restringere a Linux, singola pagina, rotazione zero (anche 180 va respinta esplicitamente), dimensioni intere riportate, box coincidenti a origine zero, 144 DPI, massimo 4000x4000 px, 10 MiB PDF, timeout 10 s per processo. Parametri confermati dalla guida locale pdftoppm 25.06.0. Nessuna nuova regola catastale.
- Non dedurre trasformazioni PDF da dimensioni arrotondate, non dichiarare che il raster sia una trascrizione fedele o autenticata. L'output e la relativa impronta sono solo candidati per futura integrazione OCR. Limiti di output non equivalgono a limiti OS di memoria o CPU.
## Implementazione e correzioni
- c0aedb54d6105f91da8eba2df523c308d309d9c2: modulo nativo con stdin/stdout, argomenti fissi, ambiente minimo, workspace privato, fail-closed, confronto dimensioni PGM e legame SHA-256 PDF/raster.
- 76f9f63dec33e844b793f638bd1bab0e2566332e: 13 nuovi test, inclusi generatore di PDF sintetico, controllo digest e blocco PDF ruotato.
- Revisione critica sequenziale: flag -hide-annotations non prova la rimozione di ogni annotazione; sostituito annotationsHidden con hideAnnotationsRequested nel modulo e test (d156416687bb5f842ecb77aa9e8d013c32ed5d5b, db612e9b1874be2f27a33474d7ca70211e54ea92). Riletti sorgenti finali: blob modulo 45daee47e21df9434bc815fb3cff967e93eb46c6; test f588a7d1529c592bc72ce30a8a6c8a528b12d0e6. Nessun agente indipendente.
## Evidenza di esecuzione
- Prova esplorativa locale Linux, Poppler 25.06.0, Tesseract con modello ita. PDF sintetico ReportLab 320x80 pt, Helvetica 24, drawString(15,35,'TEST 0007'). Comandi: pdfinfo -box -f 1 -l 1 - < synthetic.pdf; pdftoppm -f 1 -l 1 -singlefile -r 144 -gray -cropbox -hide-annotations - < synthetic.pdf > synthetic.pgm; tesseract synthetic.pgm stdout -l ita --psm 6.
- Esito: 640x160 pixel P5 canonico, 102415 byte, SHA-256 969848ee8577caa6dda3a577b5c7347efac97d3710da692ef639bad0cc2bc9a1; testo TEST 0007. Dimensioni e formato verificati via Python. Prova CLI separata, NON test del nuovo modulo Node.
- 13 nuovi test predisposti, CI completa richiesta (attesi 551); non dichiarati eseguiti in locale. Nessun caso catastale integrale o verifica incrociata indipendente conteggiato.
## Limiti e prossimi passi
- Nessuna sandbox OS, nessun mapping affidabile alle coordinate PDF, nessun OCR automatico nel modulo, Windows e multipagina non supportati, binari OS fidati non autenticati. Nessuna pratica reale, firma, invio, modifica licenza o compatibilità DOCFA/SISTER.
- Prossimo: gate CI esatto, merge se positivo; collegamento esplicito raster->OCR, mapping prudenziale, isolamento OS, corpus territoriale, adattatori Building Core, QA 100+100.
