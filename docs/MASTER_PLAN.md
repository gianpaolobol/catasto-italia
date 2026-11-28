# Catasto Italia — piano esecutivo V1.0
## Obiettivo
Assistente local-first per pratiche catastali italiane, con decisioni motivate, evidenze e approvazione professionale. DOCFA ufficiale resta il validatore finale; nessuna trasmissione o firma automatica senza approvazione.
## Backlog ordinato
Ogni voce richiede specifica, revisione del piano, implementazione, revisione del diff, correzioni, test e registrazione delle evidenze.
| ID | Deliverable | Accettazione |
|---|---|---|
| 01 | Architettura modulare e threat model | ADR, confini di fiducia e dipendenze documentati |
| 02 | Modello dati immobile versionato | Schema validato; provenienza, data e stato di ogni dato |
| 03 | Corpus normativo nazionale e locale | Fonti ufficiali, versioni, decorrenze, citazioni e conflitti |
| 04 | Import visure e atti | Estrazione verificabile, segnalazione campi mancanti |
| 05 | PDF/scansioni e OCR | Confidenza per campo, controllo umano dei casi dubbi |
| 06 | Input testo e voce | Intento strutturato, nessun dato inventato |
| 07 | Motore decisionale | Regole deterministiche, alternative e motivazioni |
| 08 | Nuovi accatastamenti | Casistiche e test documentati |
| 09 | Variazioni | Ampliamento, fusione, frazionamento, distribuzione, destinazione, demolizione, rettifica |
| 10 | Subalterni | Grafo soppressioni/costituzioni, collisioni, disponibilità non presunta |
| 11 | Graffature e pertinenze | Conservazione diritti e unità, verifiche incrociate |
| 12 | Titolarità e beni comuni | Blocchi su incertezza, superficie, BCC/BCNC |
| 13 | Tariffe e classamento | Fonti ufficiali territoriali; nessuna tariffa inventata |
| 14 | Consistenza e rendita | Aritmetica deterministica, arrotondamenti verificati |
| 15 | Import CAD/raster | Calibrazione scala, geometrie e incertezza |
| 16 | Planimetrie | Layer, piani, testi, confini, confronto prima/dopo |
| 17 | Poligoni e superfici | Coefficienti normativi, topologia, scale, scale interne non duplicate |
| 18 | Elaborato planimetrico | Conservazione porzioni estranee e verifica scala effettiva |
| 19 | Elenco subalterni DAT | Parser/serializer solo dopo verifica specifica, round-trip e import ufficiale |
| 20 | Relazioni tecniche | Limiti verificati, testo coerente con operazioni |
| 21 | D1, 1N, 2N | Mapping e coerenza tra modelli |
| 22 | Adattatore DOCFA Windows | Import ed export ufficiali verificati; niente alterazione PDF telematici |
| 23 | DOCFA Web | Verifica disponibilità e interfacce autorizzate prima di integrare |
| 24 | SISTER | Flusso assistito, firma e invio esplicitamente approvati |
| 25 | Ricevute e rifiuti | Stati distinti, protocollo e registrazione, correzioni tracciate |
| 26 | Building Core e Pianta Libera | Contratto JSON versionato, coordinate, IFC e test |
| 27 | MPE e APE Italia | Scambio minimo dati, separazione conformità edilizia/catastale/energetica |
| 28 | UI desktop/web/mobile | Desktop Windows prioritario; accessibilità e workflow guidato |
| 29 | Privacy e sicurezza | Local-first, segreti esclusi, fixture sintetiche, audit e cancellazione |
| 30 | QA e rilascio | >=100 casi distinti e >=100 verifiche incrociate documentate; zero criticità aperte; test ufficiali reali prima di V1.0 |

## Protocollo di revisione
Ruoli distinti: pianificatore, revisore del piano, sviluppatore, revisore tecnico/normativo, collaudatore. Se non sono disponibili agenti indipendenti, dichiarare esplicitamente revisioni sequenziali e non attribuirle ad agenti reali. Per ogni ID: issue o registro con criterio, branch, diff, osservazioni puntuali, correzioni, test con comando/esito, SHA e stato CI. Nessun merge con CI fallita o ignota quando obbligatoria. Non marcare come verificato un test non eseguito. Riprendere dal registro ad ogni iterazione. Richiedere autorizzazione solo per accessi mancanti, spese, invii ufficiali, segreti, cambio visibilità o decisioni professionali non delegabili.
## Revisione iniziale del piano (autoverifica, non agente indipendente)
Rischi rilevati e incorporati: confondere simulazione con accettazione DOCFA; dati reali in repo pubblico; disponibilità subalterni non accertata; regole territoriali e temporali; dipendenze tra geometria, titolarità e classamento; firma e invio non delegati. Restano da verificare fonti e formati ufficiali prima di implementare le rispettive regole.
## Caso di regressione iniziale
Fixture interamente sintetica: abitazione con corte graffata, cantina comunicante prima non rappresentata, ripostiglio trasformato in bagno. Verificare alternativa nuovo accatastamento/variazione, diritti, scala, poligoni, classamento, elenco e conservazione altre unità. Nessun documento o identificativo reale.

## [Codex] Verifica delle fonti DOCFA e dell’accesso SISTER — 2026-11-28

Riferimento operativo della sessione Work e gate di collaudo [#77](https://github.com/gianpaolobol/catasto-italia/issues/77). Riscontri e stato nel [registro sviluppo](DEVELOPMENT_PROGRESS.md#codex--2026-11-28--fonti-docfa-e-accesso-sister).

- **ID 03/13/22/30 — Fonti DOCFA e archivio Bologna.** Acquisire dal portale pubblico il software DOCFA 4.00.5, l’archivio provinciale, i tracciati e i modelli. Registrare fonte, versione, provincia, data di pubblicazione o decorrenza disponibile, data di acquisizione, SHA-256 e verifica di autenticità. Usare l’[intake locale](qa/DOCFA_LOCAL_SOURCE_INTAKE.md) e svolgere il collaudo offline prima di qualificare il risultato.
- **ID 04/24/29 — Visura XML.** Verificare disponibilità e profilo abilitato nell’area riservata con SPID personale. Per l’importatore acquisire lo schema ufficiale o un esempio ufficiale sintetico, se disponibile, e confermare namespace, versione e varianti ammesse. Nel repository pubblico usare fixture sintetiche. Conservare localmente eventuali visure già disponibili e autorizzate.
- **ID 23/24/29 — Accesso applicativo.** Prima di implementare un’integrazione con dati riservati, acquisire conferma scritta dell’Agenzia sul profilo ammesso, la convenzione, le specifiche, l’autenticazione applicativa e gli ambienti di prova. La cooperazione applicativa descritta dalla guida agli enti riguarda i soggetti ammessi al relativo convenzionamento. La cartografia pubblica WMS/WFS copre la consultazione cartografica.
