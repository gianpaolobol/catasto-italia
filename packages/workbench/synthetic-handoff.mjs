// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {createHash} from 'node:crypto';
import {buildPracticeReport} from './index.mjs';
import {validateSnapshot} from '../building-core/index.mjs';
const targets=new Set(['pianta-libera','mpe','ape-italia']);
const limits=Object.freeze({units:256,claims:2048});
const fail=code=>({ok:false,error:code,handoff:null});
const hash=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
// Local synthetic contract only. No network calls, no official approvals.
export function buildSyntheticHandoff(envelope,target){
  if(!targets.has(target))return fail('unsupported_target');
  try{
    const report=buildPracticeReport(envelope);
    if(report.state!=='research_candidate'||!report.caseDigest)return fail('blocked_practice');
    const original=envelope.input.snapshot;
    if(original.units.length>limits.units||
      original.units.reduce((n,u)=>n+u.identifiers.length,0)>limits.claims)return fail('scope_too_large');
    const byId=new Map(original.units.map(u=>[u.id,u]));
    const resultOps=report.operations.filter(o=>o.operation==='C'||o.operation==='V');
    if(!resultOps.length)return fail('no_result_units');
    const units=resultOps.map(o=>{
      const u=byId.get(o.unitId);
      return {id:u.id,identifiers:u.identifiers.map(c=>({
        id:c.id,status:c.status,asOf:c.asOf,sourceIds:[...c.sourceIds],
        value:c.value===null?null:{municipalityCode:c.value.municipalityCode,section:c.value.section,
          sheet:c.value.sheet,parcel:c.value.parcel,subaltern:c.value.subaltern}
      }))};
    });
    const referenced=new Set(units.flatMap(u=>u.identifiers.flatMap(c=>c.sourceIds)));
    const snapshot={schemaVersion:'0.1.0',snapshotId:original.snapshotId,asOf:original.asOf,
      sources:original.sources.filter(s=>referenced.has(s.id)).map(s=>({id:s.id,kind:s.kind,capturedOn:s.capturedOn})),units};
    if(!validateSnapshot(snapshot).valid)return fail('invalid_projection');
    const payload={version:'0.1.0',kind:'synthetic-building-core-handoff',producer:'catasto-italia',target,
      scope:'result-units-only',caseDigest:report.caseDigest,snapshot,
      operations:resultOps.map(o=>({unitId:o.unitId,operation:o.operation})),
      assertions:{official:false,cadastralApproval:false,buildingCompliance:false,energyCertification:false}};
    return {ok:true,error:null,handoff:{...payload,contentDigest:hash(payload)}};
  }catch{return fail('handoff_failed');}
}
// Compare against a fresh projection of the original case; never trust imported flags/digests.
export function verifySyntheticHandoff(envelope,target,received){
  try{
    const expected=buildSyntheticHandoff(envelope,target);
    if(!expected.ok)return false;
    // Order-independent objects; array order preserved. No arbitrary extra fields accepted.
    const equal=(a,b)=>{
      if(a===b)return true;
      if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
      const ak=Object.keys(a),bk=Object.keys(b);
      return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
    };
    return equal(expected.handoff,received);
  }catch{return false;}
}
