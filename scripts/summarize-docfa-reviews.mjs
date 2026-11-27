// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Reconcile six fixed synthetic comparison records locally; never attest DOCFA results.
import {open,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {scenarios} from '../packages/workbench/fixtures.mjs';
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';
import {buildOfflineComparisonKit} from './generate-docfa-comparison-kit.mjs';

const MAX_BYTES=128*1024;
const states=['unrecorded','match_declared','difference_declared','not_applicable_declared'];
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const counts=()=>Object.fromEntries(states.map(s=>[s,0]));

// The supplied records are declarations, not independent evidence. Rebuild all derived fields.
export function summarizeOfflineReviews(records){
  const kit=buildOfflineComparisonKit();
  const totals=counts(), cases=[];
  for(const scenario of scenarios){
    const session=JSON.parse(kit.get(scenario+'/sessione.json'));
    const template=manualReviewRegister(session).template;
    const supplied=records.get(scenario);
    if(supplied===undefined){
      cases.push({scenario,state:'missing',counts:null,differenceChecks:[]});
      continue;
    }
    let regenerated=null;
    try{
      const result=manualReviewRegister(session,{
        ...template,environment:supplied.environment,observations:supplied.observations
      });
      if(result.ok&&result.record&&canonical(result.record)===canonical(supplied))regenerated=result.record;
    }catch{/* Invalid record; do not echo input. */}
    if(!regenerated){
      cases.push({scenario,state:'invalid',counts:null,differenceChecks:[]});
      continue;
    }
    const c=regenerated.counts;
    for(const s of states)totals[s]+=c[s];
    cases.push({scenario,state:c.unrecorded?'partial_declared':'complete_declared',counts:c,
      differenceChecks:regenerated.observations.filter(o=>o.state==='difference_declared').map(o=>o.id)});
  }
  const missing=cases.filter(c=>c.state==='missing').length;
  const invalid=cases.filter(c=>c.state==='invalid').length;
  const partial=cases.filter(c=>c.state==='partial_declared').length;
  return {version:'0.1.0',kind:'synthetic-offline-docfa-review-summary',
    warning:'NON UFFICIALE — dichiarazioni locali, nessuna verifica professionale automatica.',
    expectedCases:scenarios.length,expectedChecks:scenarios.length*6,
    missing,invalid,partial,completeDeclared:cases.length-missing-invalid-partial,
    unassessedChecks:(missing+invalid)*6+totals.unrecorded,totals,cases,
    officialValidation:false,officialExport:false,signature:false,submission:false};
}

// Fixed filenames only; no recursive scan, upload, write, or evidence-reference dereference.
async function readRecord(path){
  let info;
  try{info=await lstat(path);}catch(e){if(e.code==='ENOENT')return undefined;return null;}
  if(!info.isFile()||info.size>MAX_BYTES)return null;
  let handle;
  try{
    handle=await open(path,'r');
    const actual=await handle.stat();
    if(!actual.isFile()||actual.dev!==info.dev||actual.ino!==info.ino||actual.size>MAX_BYTES)return null;
    const buffer=Buffer.alloc(MAX_BYTES+1);
    let used=0;
    while(used<buffer.length){
      const {bytesRead}=await handle.read(buffer,used,buffer.length-used,used);
      if(!bytesRead)break;
      used+=bytesRead;
    }
    if(used>MAX_BYTES)return null;
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,used)));
  }catch{return null;}finally{if(handle)await handle.close();}
}

export async function readOfflineReviews(directory){
  const root=resolve(directory);
  if(!(await lstat(root)).isDirectory())throw Error('review_directory_required');
  const records=new Map();
  for(const scenario of scenarios){
    const value=await readRecord(join(root,scenario+'.json'));
    if(value!==undefined)records.set(scenario,value);
  }
  return summarizeOfflineReviews(records);
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==3){console.error('Uso: node scripts/summarize-docfa-reviews.mjs <cartella-locale-riscontri>');process.exitCode=2;}
  else try{
    const summary=await readOfflineReviews(process.argv[2]);
    console.log(JSON.stringify(summary,null,2));
    process.exitCode=summary.invalid?1:summary.unassessedChecks?2:0;
  }catch{console.error('Riepilogo non disponibile: verificare la cartella locale.');process.exitCode=1;}
}
