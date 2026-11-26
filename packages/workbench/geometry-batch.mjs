// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Atomic, add-only synthetic geometry intake; never trust derived measurements.
import {replayPracticeSession} from './integrated-dossier.mjs';
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const fail=error=>({ok:false,error});
export function importGeometryBatch(input){
  try{
    if(!shape(input,['session','batch']))return fail('invalid_batch_request');
    const {session,batch}=input;
    const current=replayPracticeSession(session);
    if(!current.ok)return fail('session_blocked');
    if(!shape(batch,['version','kind','caseDigest','geometry'])||batch.version!=='0.1.0'||
       batch.kind!=='synthetic-geometry-declarations'||batch.caseDigest!==current.report.caseDigest||
       !Array.isArray(batch.geometry)||batch.geometry.length<1||batch.geometry.length>64)
      return fail('invalid_batch');
    const allowed=new Set(current.report.operations.filter(o=>['C','V','unchanged'].includes(o.operation)).map(o=>o.unitId));
    const used=new Set(current.geometry.map(g=>g.unitId));
    for(const g of batch.geometry){
      if(!g||typeof g.unitId!=='string'||!allowed.has(g.unitId)||used.has(g.unitId))
        return fail('unknown_or_existing_unit');
      used.add(g.unitId);
    }
    // Replay verifies all keys, shape, topology, calibration and retained-unit placement.
    const next={...session,request:{...session.request,geometry:[...session.request.geometry,...batch.geometry]}};
    const result=replayPracticeSession(next);
    if(!result.ok)return fail('batch_replay_blocked');
    return {...result,added:batch.geometry.length};
  }catch{return fail('geometry_batch_failed');}
}
