# [Codex] Preparazione locale delle fonti DOCFA — 2026-11-28

## Obiettivo e limite
Gate #77, ID03/13/22/30: rendere direttamente utilizzabile il preflight documentale già integrato, eliminando la ricopiatura manuale di SHA-256, nomi e riferimenti dei quattro artefatti. Non è un downloader, non estrae archivi, non installa o esegue DOCFA, non verifica firma digitale/vigenza o contenuto tecnico. Nessuna regola catastale aggiunta.

## Procedura Windows (Node 22+)
1. Acquisire manualmente dal portale Agenzia delle Entrate i quattro artefatti ufficiali effettivi: installer DOCFA, archivio provinciale, tracciati e modelli. Verificare provenienza, data, versione e firma/hash pubblicati quando disponibili. Non usare file cliente. Conservare gli originali in una cartella locale protetta, fuori da qualunque repository e sincronizzazione automatica. I download non sono stati acquisiti dal team in questa sessione (DNS indisponibile).
2. In una cartella locale di ingresso separata, mettere copie byte-identiche con i quattro nomi fissi `installer.bin`, `archive.bin`, `specifications.bin`, `models.bin`. I file restano opachi e non eseguibili dal comando.
3. Dalla radice di Catasto Italia, in PowerShell 7, creare il modello:

   ```powershell
   node scripts/prepare-docfa-sources.mjs --template | Set-Content -Encoding utf8NoBOM "$env:USERPROFILE\Catasto-Fonti\source-intake.json"
   ```

   In Windows PowerShell 5.1 usare cmd.exe e redirezione stdout per evitare il BOM UTF-8. Il modello è volutamente vuoto: compilare versione effettiva, provincia a due lettere, URL HTTPS ufficiale effettivo, data acquisizione ISO e metodo realmente effettuato per ogni ruolo. Non aggiungere percorsi, password o token. Se non si è verificata una firma, non dichiararla verificata.
4. Preparare il fascicolo:

   ```powershell
   node scripts/prepare-docfa-sources.mjs "$env:USERPROFILE\Catasto-Fonti" "$env:USERPROFILE\Catasto-Riscontri"
   ```

   La cartella di destinazione deve essere nuova, con padre esistente, distinta dall'ingresso e fuori dal checkout. Usare un nome semplice senza spazi, punti o caratteri speciali. Exit 0: quattro copie byte-identiche con nomi compatibili con il preflight e dichiarazione finale; output JSON con versione/provincia, `archiveSha256`, `specificationReference` da usare nei sei registri. Exit 1: non utilizzare l'eventuale cartella incompleta; ripartire in una nuova cartella dopo correzione. Exit 2: argomenti errati. Nessuna sovrascrittura.
5. Generare e verificare il kit canonico in una terza cartella nuova. Eseguire realmente le sei pratiche sintetiche in DOCFA ufficiale, compilare i registri, conservare i 36 file probatori nella cartella riscontri generata e seguire [DOCFA_PROFESSIONAL_PREFLIGHT.md](DOCFA_PROFESSIONAL_PREFLIGHT.md). La data effettiva della prova e il riferimento alla prova si compilano solo dopo averla eseguita.

## Revisione sequenziale e accettazione
- Riutilizzo di fingerprint e validatore delle dichiarazioni esistenti; nessun URL aperto o percorso preso dalla configurazione, nomi file fissi, lettura limitata, copie esclusive, ricalcolo impronte di originali e copie, dichiarazione scritta per ultima. Directory locali fidate e ferme durante le operazioni; non è un sandbox contro mutazioni concorrenti. Nessuna garanzia ACL su Windows: usare una cartella privata e non sincronizzata.
- Caso positivo: quattro file distinti sintetici, dichiarazioni corrette, nessuna modifica all'ingresso, ambiente coerente e compatibilità con l'intero preflight dei 36 riscontri.
- Casi negativi: origine URL ingannevole, data impossibile, file mancanti/vuoti/duplicati, link simbolici (POSIX), destinazione esistente o annidata, nome dispositivo Windows. Nessun file ufficiale o reale nei test.
- Test predisposti: `node --test tests/docfa-review-evidence.test.mjs` (incluso in CI Linux e Windows); non eseguiti localmente per DNS indisponibile. Nessun esito CI della nuova modifica ancora dichiarato. Revisione sequenziale, nessun agente indipendente disponibile.
- Main iniziale a4681c3f38c0df502cc2605b68a44e5bcac4dc3e: quattro check success verificati per SHA; backup intatti; nessuna PR Catasto aperta all'avvio. Mappa/diario centrale non accessibili (404). Gate #77 resta aperto.
