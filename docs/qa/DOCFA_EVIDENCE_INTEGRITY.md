# [Codex] Integrità delle evidenze del confronto DOCFA — 2026-11-28

Strumento locale, non ufficiale, per collegare le 36 osservazioni dei sei casi sintetici a file effettivi e all'archivio provinciale dichiarato. Non aggiunge regole catastali e non dimostra autenticità, vigenza, compatibilità DOCFA/SISTER o qualità delle prove.

## Uso (Node 22+)
1. Fuori dal repository e senza dati di clienti, salvare i sei registri diagnostici esportati come `<scenario>.json`. Compilare ogni osservazione, incluse differenze e non applicabilità, con nota e riferimento esatto `<scenario>--<id-controllo>.bin`. Gli ID sono quelli riportati nelle schede già generate.
2. Nella stessa cartella locale copiare il file probatorio corrispondente con quel nome (i byte non devono essere modificati; .bin è un contenitore opaco, non un formato DOCFA). Ogni osservazione deve avere un file non vuoto; anche un esito non applicabile richiede motivazione documentata. Copiare l'archivio provinciale come `archive-<SHA256 dichiarato>.bin`; se tutti usano lo stesso archivio basta una copia. Non usare archivi o prove inventate in un collaudo professionale.
3. Eseguire `node scripts/summarize-docfa-reviews.mjs <cartella>` per completezza dichiarata.
4. Creare una sola volta il manifest con `node scripts/verify-docfa-review-evidence.mjs --capture <cartella>` e salvare lo stdout JSON UTF-8 come `evidence-manifest.json` nella cartella. Conservare una copia indipendente del manifest; non rigenerarlo per nascondere discrepanze. In PowerShell 7 si può usare `| Set-Content -Encoding utf8NoBOM <cartella>/evidence-manifest.json` dopo aver verificato l'esito del comando (non sovrascrivere un manifest esistente).
5. Eseguire `node scripts/verify-docfa-review-evidence.mjs --verify <cartella>`. Exit 0 solo con manifest identico al ricalcolo. Le differenze dichiarate restano esplicitamente nel risultato; exit 0 non chiude il gate professionale.

Limiti: archivio <=256 MiB; singola prova <=64 MiB; manifest <=256 KiB. Cartella piatta, locale e non modificata durante il controllo; nessun upload, apertura di contenuti eseguibili, firma, invio o salvataggio automatico. Si leggono solo nomi generati dal programma; i riferimenti arbitrari non sono risolti. Nessuna autenticazione del manifest: se un soggetto può alterare insieme file e manifest, serve una copia indipendente fidata. Il controllo non valuta contenuto, provenienza o attualità dell'archivio, software, specifiche o modelli. Non pubblicare registri, archivi, manifest o prove reali.

## Accettazione e revisione
- Ricalcolare i sei registri dal kit fisso; bloccare dichiarazioni mancanti/invalide.
- Collegare 36 file e archivio SHA-256 dichiarato; deduplicare archivi uguali.
- Rilevare mutazioni di byte, note, manifest, riferimenti non canonici, file mancanti/vuoti/link.
- Non equiparare integrità a validità; mantenere tutti i flag ufficiali false anche con integrità positiva.
- Revisione sequenziale del piano e del codice; nessun agente indipendente disponibile. CI Linux e Windows richiesta; prova DOCFA reale non eseguita. Accesso al registro centrale mappa/diario 404. Clone locale DNS non disponibile.
