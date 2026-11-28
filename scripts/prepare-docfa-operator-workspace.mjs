// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Prepare a local operator workspace; never execute DOCFA or create observations.
import {lstat,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,basename,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareLocalSources} from './prepare-docfa-sources.mjs';
import {writeOfflineComparisonKit,buildOfflineComparisonKit} from './generate-docfa-comparison-kit.mjs';
import {verifyOfflineComparisonKit} from './verify-docfa-comparison-kit.mjs';
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';
import {scenarios} from '../packages/workbench/fixtures.mjs';

const inside=(root,path)=>{
  const r=relative(root,path);
  return r===''||(!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep));
};
const json=x=>JSON.stringify(x,null,2)+'\n';
const write=(root,name,data)=>writeFile(join(root,name),data,{flag:'wx',mode:0o600});
const exclusions={officialValidation:false,officialExport:false,signature:false,submission:false,
  sourceAuthenticityVerified:false,sourceCurrencyVerified:false,softwareExecuted:false};

export async function prepareOperatorWorkspace(inputDirectory,destination){
  const repo=await realpath(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
  const inputPath=resolve(inputDirectory),outPath=resolve(destination);
  if(!(await lstat(inputPath)).isDirectory())throw Error('source_directory_required');
  const input=await realpath(inputPath),parent=await realpath(dirname(outPath)),leaf=basename(outPath);
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(leaf)||/^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i.test(leaf))
    throw Error('invalid_workspace_name');
  const root=join(parent,leaf);
  if(inside(repo,input)||inside(repo,root)||inside(input,root)||inside(root,input))
    throw Error('separate_directories_outside_repository_required');
  const kit=buildOfflineComparisonKit();
  // New root only; never remove a partial workspace or overwrite operator evidence.
  await mkdir(root,{mode:0o700});
  const intake=await prepareLocalSources(input,join(root,'reviews'));
  await writeOfflineComparisonKit(join(root,'kit'));
  const verification=await verifyOfflineComparisonKit(join(root,'kit'));
  if(!verification.canonical)throw Error('comparison_kit_not_canonical');
  const drafts=join(root,'drafts');
  await mkdir(drafts,{mode:0o700});
  for(const scenario of scenarios){
    if(!/^[a-z_]+$/.test(scenario))throw Error('invalid_fixture_name');
    const template=JSON.parse(kit.get(scenario+'/riscontri-modello.json'));
    const session=JSON.parse(kit.get(scenario+'/sessione.json'));
    // Only declared source metadata. Date, run reference and all results stay blank.
    Object.assign(template.environment,intake.environment);
    const result=manualReviewRegister(session,template);
    if(!result.ok||!result.record||result.record.observations.some(o=>o.state!=='unrecorded'))
      throw Error('invalid_empty_review_draft');
    await write(drafts,scenario+'.json',json(template));
  }
  await write(root,'LEGGIMI.txt',[
    'CATasto Italia — laboratorio DOCFA NON UFFICIALE.',
    'Il fascicolo contiene 6 casi sintetici e fonti dichiarate, non verificate.',
    'Aprire kit/LEGGIMI.txt e le schede HTML; conservare intatto il kit.',
    'Riprodurre i casi in DOCFA locale isolato. Compilare drafts/<scenario>.json solo dopo le prove.',
    'Data e riferimento della prova sono vuoti. I 36 riscontri sono tutti non registrati.',
    'Usare ogni sessione identica per validare il modello compilato e salvare il registro esportato',
    'in reviews/<scenario>.json. Non copiare semplicemente la bozza in reviews.',
    'Salvare i file probatori con i nomi fissi <scenario>--<check_id>.bin nella cartella reviews.',
    'Seguire docs/qa/DOCFA_PROFESSIONAL_PREFLIGHT.md per manifest e verifica finale.',
    'Nessuna firma, invio o dato cliente. Non caricare questa cartella su Git.',
    'Se manca workspace-prepared.json la preparazione non e completa; usare una nuova cartella.'
  ].join('\n')+'\n');
  const result={version:'0.1.0',kind:'local-docfa-operator-workspace',
    warning:'NON UFFICIALE — preparazione di un laboratorio; nessuna prova eseguita.',
    prepared:true,canonicalKitFiles:verification.identical,emptyDrafts:scenarios.length,
    unrecordedChecks:scenarios.length*6,environment:intake.environment,...exclusions};
  await write(root,'workspace-prepared.json',json(result));
  return result;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==4){
    console.error('Uso: node scripts/prepare-docfa-operator-workspace.mjs <fonti> <nuova-cartella-locale>');
    process.exitCode=2;
  }else try{
    console.log(json(await prepareOperatorWorkspace(...process.argv.slice(2))));
  }catch{
    console.error('Laboratorio non completato. Non riutilizzare una cartella parziale.');
    process.exitCode=1;
  }
}
