// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Generate a local, repeatable comparison kit from fixed synthetic fixtures.
// Never reads a customer file, installs DOCFA, invokes it, signs or submits anything.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {syntheticCase,scenarios} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {buildPracticeArchive} from '../packages/workbench/practice-archive.mjs';
import {buildManualDocfaWorksheet} from '../packages/workbench/manual-docfa-worklist.mjs';
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';

const json=x=>Buffer.from(JSON.stringify(x,null,2)+'\n','utf8');
const utf8=x=>Buffer.from(x,'utf8');
const digest=x=>createHash('sha256').update(x).digest('hex');
const required=x=>{if(!x.ok)throw Error('synthetic_kit_generation_blocked');return x;};
const instructions=`KIT DI CONFRONTO LOCALE — NON UFFICIALE
Sei scenari sintetici; nessuna pratica DOCFA pronta per l'importazione.
1. Apri la scheda HTML di ciascun caso e il dossier nello ZIP. Riapri la sessione JSON in Catasto Italia.
2. Acquisisci separatamente software, archivio provinciale, specifiche e modelli ufficiali vigenti.
   Registra versione, data, provincia e SHA-256. Non usare l'archivio Docte2 (terreni).
3. In ambiente DOCFA di prova isolato, costruisci manualmente un caso equivalente con identificativi
   e dati di prova ammessi dal software. SYNTH non e' un comune ufficiale. Registra ogni sostituzione
   e le eventuali differenze di rappresentazione; non usare immobili o titolarita' di clienti.
4. Confronta i sei controlli della scheda; non dichiarare equivalenti valori inventati e tariffe reali.
   Registra il riferimento locale riproducibile, annota le discrepanze e lascia aperto cio' che non provi.
5. Compila riscontri-modello.json o usa la UI guidata sulla sessione identica, esporta il registro
   diagnostico separato. Conserva tutto fuori da Git; nessuna firma, invio o attestazione automatica.
6. manifest.json identifica i file iniziali: hash di integrita', non autenticita'. Non sovrascrivere
   il modello iniziale; salva gli esiti in file separati. Se manca il manifest, il kit e' incompleto.
`;

export function buildOfflineComparisonKit(){
  const entries=new Map([['LEGGIMI.txt',utf8(instructions)]]);
  const cases=[];
  for(const scenario of scenarios){
    if(!/^[a-z_]+$/.test(scenario))throw Error('invalid_fixture_name');
    const draft=syntheticCase(scenario),report=buildPracticeReport(draft);
    if(report.state!=='research_candidate'||report.operative!==false||report.canExport!==false)throw Error('unexpected_fixture_state');
    const resulting=report.operations.filter(o=>['C','V'].includes(o.operation));
    const geometric=report.operations.filter(o=>['C','V','unchanged'].includes(o.operation));
    const session={version:'0.1.0',kind:'synthetic-practice-session',request:{
      draft,expectedState:report.state,expectedDigest:report.caseDigest,
      geometry:geometric.map((o,i)=>({unitId:o.unitId,vertices:[[0,0],[4000,0],[4000,2000],[0,2000]],
        placement:{floor:'P0',xMm:i*6000,yMm:0}})),
      income:resulting.map(o=>({unitId:o.unitId,declared:{category:'A/2',classNumber:'2',zone:'SYNTH-1',
        consistency:'4.5',tariff:'123.4567',unit:'vani',sourceId:'synthetic-tariff'}}))
    }};
    const archive=required(buildPracticeArchive(session));
    const worksheet=required(buildManualDocfaWorksheet(session));
    const register=required(manualReviewRegister(session));
    if(!worksheet.worklist.diagnosticCoverageComplete||worksheet.worklist.checks.some(c=>c.state!=='unverified')||
      register.template.observations.some(o=>o.state!=='unrecorded'))throw Error('unexpected_review_state');
    const prefix=scenario+'/';
    entries.set(prefix+'sessione.json',json(session));
    entries.set(prefix+'pratica-non-ufficiale.zip',archive.bytes);
    entries.set(prefix+'scheda-confronto.html',utf8(worksheet.worksheetHtml));
    entries.set(prefix+'riscontri-modello.json',json(register.template));
    cases.push({scenario,caseDigest:report.caseDigest,snapshotDigest:register.template.snapshotDigest,
      operations:report.candidate.counts,checksPending:worksheet.worklist.checks.length});
  }
  const manifest={version:'0.1.0',kind:'synthetic-offline-comparison-kit',officialValidation:false,
    officialExport:false,signature:false,submission:false,cases,
    files:[...entries].map(([name,bytes])=>({name,bytes:bytes.length,sha256:digest(bytes)}))};
  entries.set('manifest.json',json(manifest));
  return entries;
}

export async function writeOfflineComparisonKit(destination){
  if(typeof destination!=='string'||!destination.trim())throw Error('new_output_directory_required');
  const entries=buildOfflineComparisonKit(); // No writes until every fixture was replayed.
  const root=resolve(destination);
  await mkdir(root,{mode:0o700}); // Existing directories, including symlinks, are rejected.
  for(const scenario of scenarios)await mkdir(join(root,scenario),{mode:0o700});
  // Manifest is last. All paths come from fixed internal fixture names; never overwrite.
  for(const [name,bytes] of entries)await writeFile(join(root,name),bytes,{flag:'wx',mode:0o600});
  return root;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==3){console.error('Uso: node scripts/generate-docfa-comparison-kit.mjs <nuova-cartella-locale>');process.exitCode=2;}
  else try{await writeOfflineComparisonKit(process.argv[2]);console.log('Kit sintetico creato. Aprire LEGGIMI.txt. Nessuna prova ufficiale eseguita.');}
  catch{console.error('Kit non completato: verificare ambiente e nuova cartella. Senza manifest il kit e incompleto.');process.exitCode=1;}
}
