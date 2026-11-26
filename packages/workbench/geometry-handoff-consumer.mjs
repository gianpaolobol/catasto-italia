// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Reference recipient: no network, filesystem, official approval or external app mutation.
import {createHash} from 'node:crypto';
import {validateSnapshot} from '../building-core/index.mjs';
import {measureSyntheticPolygon} from './synthetic-geometry.mjs';
import {validPlacement} from './synthetic-floor-plan.mjs';
const targets=new Set(['pianta-libera','mpe','ape-italia']);
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const fail=error=>({ok:false,error,preview:null});
const assertions={official:false,cadastralApproval:false,buildingCompliance:false,energyCertification:false};
const semantics={axes:'x-right-y-up',contours:'unclosed-orthogonal-disjoint-no-holes',placement:'declared-translation-per-floor-or-null',scaleVerified:false,cadastralArea:false,topologyBetweenUnitsVerified:false};
const exact=(x,expected)=>shape(x,Object.keys(expected))&&Object.keys(expected).every(k=>x[k]===expected[k]);
// v0.2 producer hashes JSON.stringify(payload) in producer key order. Formatting may change,
// but reordering payload keys is intentionally not supported. A digest is not authentication.
export function inspectGeometryHandoff(json,target){
  try{
    if(!targets.has(target))return fail('unsupported_target');
    if(typeof json!=='string'||Buffer.byteLength(json,'utf8')>512*1024)return fail('invalid_document_size');
    const x=JSON.parse(json);
    if(!shape(x,['version','kind','producer','target','scope','caseDigest','snapshot','operations','assertions','geometry','geometrySemantics','contentDigest'])||
      x.version!=='0.2.0'||x.kind!=='synthetic-building-core-geometry-handoff'||x.producer!=='catasto-italia'||
      x.scope!=='result-units-only'||x.target!==target||!hex(x.caseDigest)||!hex(x.contentDigest)||
      !exact(x.assertions,assertions)||!exact(x.geometrySemantics,semantics))return fail('invalid_contract');
    const {contentDigest,...payload}=x;
    if(createHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex')!==contentDigest)return fail('digest_mismatch');
    if(!Array.isArray(x.snapshot?.units)||x.snapshot.units.length===0||x.snapshot.units.length>256||
      !x.snapshot.units.every(u=>Array.isArray(u?.identifiers))||
      x.snapshot.units.reduce((n,u)=>n+u.identifiers.length,0)>2048||
      !validateSnapshot(x.snapshot).valid)return fail('invalid_snapshot');
    const units=new Map(x.snapshot.units.map(u=>[u.id,u]));
    if(!Array.isArray(x.operations)||!Array.isArray(x.geometry)||x.operations.length!==units.size||x.geometry.length!==units.size)return fail('invalid_coverage');
    const ops=new Map();
    for(const o of x.operations){
      if(!shape(o,['unitId','operation'])||!units.has(o.unitId)||ops.has(o.unitId)||!['C','V'].includes(o.operation))return fail('invalid_operation');
      ops.set(o.unitId,o.operation);
    }
    const seen=new Set(),preview=[];
    // This report is a geometry-calculator context only, not a revalidated cadastral case.
    const context={kind:'synthetic-diagnostic-report',state:'research_candidate',operative:false,canExport:false,caseDigest:x.caseDigest,operations:x.operations};
    for(const g of x.geometry){
      if(!g||!ops.has(g.unitId)||seen.has(g.unitId))return fail('invalid_geometry_coverage');
      seen.add(g.unitId);
      const unit=units.get(g.unitId),identity={unitId:unit.id,operation:ops.get(unit.id),identifiers:unit.identifiers};
      if(g.state==='missing'){
        if(!shape(g,['unitId','state']))return fail('invalid_missing_geometry');
        preview.push({...identity,state:'missing'});continue;
      }
      if(!shape(g,['unitId','state','coordinateUnit','contours','placement','calibration','areaMm2','perimeterMm'])||
        g.state!=='measured'||g.coordinateUnit!=='mm'||!Array.isArray(g.contours)||!g.contours.length||
        (g.placement!==null&&!validPlacement(g.placement)))return fail('invalid_geometry');
      const vertices=g.contours.length===1?g.contours[0]:g.contours;
      const m=measureSyntheticPolygon(context,g.unitId,vertices,g.calibration);
      if(m.state!=='measured'||m.areaMm2!==g.areaMm2||m.perimeterMm!==g.perimeterMm)return fail('geometry_mismatch');
      // Reject malformed nesting that could otherwise be interpreted as a different number of rings.
      const contours=m.componentCount?m.vertices:[m.vertices];
      if(JSON.stringify(contours)!==JSON.stringify(g.contours))return fail('geometry_mismatch');
      preview.push({...identity,state:'measured',coordinateUnit:'mm',contours,placement:g.placement,
        calibration:m.calibration??null,areaMm2:m.areaMm2,perimeterMm:m.perimeterMm});
    }
    return {ok:true,error:null,preview:{version:'0.1.0',kind:'synthetic-recipient-preview',target,caseDigest:x.caseDigest,
      sourceDigest:contentDigest,units:preview,measuredCount:preview.filter(u=>u.state==='measured').length,
      missingCount:preview.filter(u=>u.state==='missing').length,authenticated:false,sourceCaseReplayed:false,
      official:false,buildingCompliance:false,energyCertification:false,scaleVerified:false,cadastralArea:false}};
  }catch{return fail('recipient_processing_failed');}
}
