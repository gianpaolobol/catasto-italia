// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Versioned geometry extension, separate from canonical ZIP and legacy handoffs.
import {createHash} from 'node:crypto';
import {replayPracticeSession} from './integrated-dossier.mjs';
import {buildSyntheticHandoff} from './synthetic-handoff.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x),'utf8').digest('hex');
const fail=error=>({ok:false,error,handoff:null});
export function buildGeometryHandoff(session,target){
  try{
    const replay=replayPracticeSession(session);
    if(!replay.ok)return fail('session_blocked');
    const legacy=buildSyntheticHandoff(session.request.draft,target);
    if(!legacy.ok||legacy.handoff.caseDigest!==replay.report.caseDigest)return fail('handoff_blocked');
    const {contentDigest,...identity}=legacy.handoff;
    const measured=new Map(replay.geometry.filter(g=>['C','V'].includes(g.operation)).map(g=>[g.unitId,g]));
    const geometry=identity.operations.map(op=>{
      const g=measured.get(op.unitId);
      if(!g)return {unitId:op.unitId,state:'missing'};
      const contours=g.componentCount?g.vertices:[g.vertices];
      return {unitId:op.unitId,state:'measured',coordinateUnit:'mm',
        contours:contours.map(r=>r.map(p=>[...p])),placement:g.placement?{...g.placement}:null,
        calibration:g.calibration??null,areaMm2:g.areaMm2,perimeterMm:g.perimeterMm};
    });
    // No retained units, income, assertions from the draft or inferred common location.
    const payload={...identity,version:'0.2.0',kind:'synthetic-building-core-geometry-handoff',
      geometry,geometrySemantics:{axes:'x-right-y-up',contours:'unclosed-orthogonal-disjoint-no-holes',
      placement:'declared-translation-per-floor-or-null',scaleVerified:false,cadastralArea:false,topologyBetweenUnitsVerified:false}};
    return {ok:true,error:null,handoff:{...payload,contentDigest:hash(payload)}};
  }catch{return fail('geometry_handoff_failed');}
}
