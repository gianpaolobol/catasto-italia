// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Laboratory identity projection, NOT a DOCFA encoding or a cadastral rule.
import {replayPracticeSession} from './integrated-dossier.mjs';
import {diagnosticInventory} from './diagnostic-inventory.mjs';
import {compareHistoricalSubalternRegisters} from './historical-subaltern-register.mjs';

function laboratoryKey(i){
  // Only the expressly declared SYNTH/Z999 profile: no section or denominator.
  // Width and zero padding are our lab convention, not inferred official semantics.
  if(i.municipalityCode!=='SYNTH'||i.section!==null)throw Error('unsupported_lab_identity');
  const pad=(value,width)=>{
    if(typeof value!=='string'||!/^\d+$/.test(value)||value.length>width)
      throw Error('unsupported_lab_identity');
    return value.padStart(width,'0');
  };
  return 'Z999 '+'   '+pad(i.sheet,4)+pad(i.parcel,5)+'0000'+pad(i.subaltern,4);
}
function project(rows){
  const map=new Map();
  for(const row of rows){
    const key=laboratoryKey(row.identifier);
    // Distinct textual identifiers may collapse under our lab convention: never guess.
    if(map.has(key))throw Error('ambiguous_lab_identity');
    map.set(key,{key,operation:row.operation});
  }
  return map;
}
function phase(expected,actual){
  return {expected:expected.size,actual:actual.size,
    missing:[...expected.values()].filter(r=>!actual.has(r.key)),
    unexpected:[...actual].filter(k=>!expected.has(k))};
}
export function reconcileHistoricalInventory(session,beforeBytes,afterBytes){
  const replay=replayPracticeSession(session);
  if(!replay.ok)return {ok:false,error:'invalid_session'};
  const inventory=diagnosticInventory(replay.report);
  if(!inventory)return {ok:false,error:'invalid_inventory'};
  try{
    const before=project(inventory.before),after=project(inventory.after);
    // A suppression and a constitution cannot be treated as one retained key.
    for(const [key,row] of before){
      if(after.has(key)&&(row.operation==='S'||after.get(key).operation==='C'))
        throw Error('ambiguous_lab_identity');
    }
    const delta=compareHistoricalSubalternRegisters(beforeBytes,afterBytes);
    const a=new Set([...delta.removed,...delta.changed,...delta.unchanged].map(r=>r.key));
    const b=new Set([...delta.added,...delta.changed,...delta.unchanged].map(r=>r.key));
    const phases={before:phase(before,a),after:phase(after,b)};
    const identitySetsMatch=Object.values(phases).every(p=>!p.missing.length&&!p.unexpected.length);
    const retainedChanges=delta.changed.filter(r=>before.get(r.key)?.operation==='unchanged'&&after.get(r.key)?.operation==='unchanged');
    const variedRecords=delta.changed.filter(r=>before.get(r.key)?.operation==='V'&&after.get(r.key)?.operation==='V');
    return {ok:true,kind:'synthetic-historical-inventory-reconciliation',version:'0.1.0',
      profile:'SYNTH-to-Z999-lab-v1',source:delta.source,caseDigest:replay.report.caseDigest,
      beforeSha256:delta.beforeSha256,afterSha256:delta.afterSha256,phases,
      actualChanges:delta.counts,identitySetsMatch,retainedChanges,variedRecords,
      requiresReview:!identitySetsMatch||retainedChanges.length>0,
      syntheticOnly:true,officialCompatibility:false,officialValidation:false,caseMutation:false,
      warning:'Solo confronto delle chiavi sintetiche e dei campi cambiati; non verifica titolarità, graffature, causale o disponibilità.'};
  }catch(error){
    return {ok:false,error:['unsupported_lab_identity','ambiguous_lab_identity'].includes(error?.message)?error.message:'invalid_historical_register'};
  }
}
