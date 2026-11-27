// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Diagnostic exchange of ONE measured result unit. No identity or placement in DXF.
import {replayPracticeSession} from './integrated-dossier.mjs';
export function exportCadContour(input){
  const fail=error=>({ok:false,error,dxf:null});
  try{
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==2||
      !Object.hasOwn(input,'session')||!Object.hasOwn(input,'unitId')||typeof input.unitId!=='string')return fail('invalid_request');
    const current=replayPracticeSession(input.session);
    if(!current.ok)return fail('session_blocked');
    const g=current.geometry.find(x=>x.unitId===input.unitId&&['C','V'].includes(x.operation));
    if(!g)return fail('measured_result_unit_required');
    const rings=g.componentCount?g.vertices:[g.vertices];
    const x0=Math.min(...rings.flat().map(p=>p[0])),y0=Math.min(...rings.flat().map(p=>p[1]));
    const pairs=[0,'SECTION',2,'ENTITIES'];
    for(const ring of rings){
      pairs.push(0,'LWPOLYLINE',100,'AcDbEntity',8,'SYNTH_CONTOUR_MM',100,'AcDbPolyline',90,ring.length,70,1);
      for(const [x,y] of ring)pairs.push(10,x-x0,20,y-y0);
    }
    pairs.push(0,'ENDSEC',0,'EOF');
    return {ok:true,error:null,dxf:pairs.join('\n')+'\n',caseDigest:current.report.caseDigest,
      unitId:g.unitId,coordinateUnit:'mm',areaMm2:g.areaMm2,perimeterMm:g.perimeterMm,
      placementIncluded:false,official:false};
  }catch{return fail('cad_export_blocked');}
}
