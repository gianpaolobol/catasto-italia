// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Local human observation register: no official result or approval is inferred.
import {createHash} from 'node:crypto';
import {buildManualDocfaWorklist} from './manual-docfa-worklist.mjs';
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(canonical(x),'utf8').digest('hex');
const bounded=(v,n)=>typeof v==='string'&&v.length<=n&&!/[\x00-\x1f\x7f]/.test(v)&&v===v.trim();
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const hex=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const states=['unrecorded','match_declared','difference_declared','not_applicable_declared'];
const envKeys=['date','docfaVersion','province','archiveSha256','specificationReference','localRunReference'];
const fail=error=>({ok:false,error,template:null,record:null});
export function manualReviewRegister(session,observations=null){
  try{
    const result=buildManualDocfaWorklist(session);
    if(!result.ok)return fail('review_session_blocked');
    const w=result.worklist;
    // Full declarations AND computed worklist, not just caseDigest; object key order is irrelevant.
    const snapshotDigest=hash({session,worklist:w});
    const template={version:'0.1.0',kind:'synthetic-manual-docfa-observations',caseDigest:w.caseDigest,snapshotDigest,
      environment:Object.fromEntries(envKeys.map(k=>[k,''])),
      observations:w.checks.map(c=>({id:c.id,state:'unrecorded',evidenceReference:'',note:''}))};
    if(observations===null)return {ok:true,error:null,template,record:null};
    const x=observations;
    if(!shape(x,Object.keys(template))||x.version!==template.version||x.kind!==template.kind||
      x.caseDigest!==template.caseDigest||x.snapshotDigest!==snapshotDigest)return fail('review_snapshot_mismatch');
    const e=x.environment;
    if(!shape(e,envKeys)||!envKeys.every(k=>bounded(e[k],k==='archiveSha256'?64:240))||
      (e.date!==''&&!date(e.date))||(e.archiveSha256!==''&&!hex(e.archiveSha256)))return fail('invalid_review_environment');
    if(!Array.isArray(x.observations)||x.observations.length!==w.checks.length)return fail('invalid_review_observations');
    const found=new Map();
    for(const o of x.observations){
      if(!shape(o,['id','state','evidenceReference','note'])||!w.checks.some(c=>c.id===o.id)||found.has(o.id)||
        !states.includes(o.state)||!bounded(o.evidenceReference,240)||!bounded(o.note,1000)||
        (o.state==='unrecorded'&&(o.evidenceReference!==''||o.note!==''))||
        (o.state!=='unrecorded'&&(!o.evidenceReference||!o.note)))return fail('invalid_review_observations');
      found.set(o.id,o);
    }
    const ordered=w.checks.map(c=>found.get(c.id));
    const counts=Object.fromEntries(states.map(s=>[s,ordered.filter(o=>o.state===s).length]));
    if(counts.unrecorded!==ordered.length&&envKeys.some(k=>!e[k]))return fail('incomplete_review_environment');
    return {ok:true,error:null,template:null,record:{version:'0.1.0',kind:'synthetic-manual-docfa-observation-record',
      warning:'NON UFFICIALE — osservazioni dichiarate, non verificate; solo prove sintetiche locali.',
      caseDigest:w.caseDigest,snapshotDigest,environment:{...e},observations:ordered.map(o=>({...o})),counts,
      checks:w.checks,officialValidation:false,officialExport:false,signature:false,submission:false}};
  }catch{return fail('review_processing_failed');}
}
