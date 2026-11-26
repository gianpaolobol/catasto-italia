// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Fictional catalog, not an official archive or tariff.
import {buildPracticeReport} from './index.mjs';
export const catalogId='synthetic-catalog-v1';
const rows=[
 ['SYNTH-1','A/2','2','vani','123.4567'],
 ['SYNTH-1','A/2','3','vani','140.0000'],
 ['SYNTH-2','A/2','2','vani','100.0000'],
 ['SYNTH-1','C/2','1','m2','2.5000']
];
export function lookupSyntheticTariff(q){
 const fail=error=>({ok:false,error,row:null});
 try{
  const keys=['draft','unitId','zone','category','classNumber'];
  if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).length!==keys.length||!keys.every(k=>Object.hasOwn(q,k))||
    !keys.slice(1).every(k=>typeof q[k]==='string'&&q[k].length<=64))return fail('invalid_lookup');
  const r=buildPracticeReport(q.draft);
  if(r.state!=='research_candidate')return fail('case_blocked');
  const op=r.operations.find(o=>o.unitId===q.unitId&&['C','V'].includes(o.operation));
  if(!op||!op.identifiers.length)return fail('not_resulting_unit');
  if(op.identifiers.some(i=>i.identifier.municipalityCode!=='SYNTH'||i.identifier.section!==null))return fail('territory_not_covered');
  const matches=rows.filter(x=>x[0]===q.zone&&x[1]===q.category&&x[2]===q.classNumber);
  if(matches.length!==1)return fail(matches.length?'ambiguous_tariff':'tariff_not_found');
  const [zone,category,classNumber,unit,tariff]=matches[0];
  return {ok:true,error:null,row:{zone,category,classNumber,unit,tariff,sourceId:catalogId,municipalityCode:'SYNTH',section:null},caseDigest:r.caseDigest,unitId:q.unitId,officialTariffVerified:false};
 }catch{return fail('lookup_failed');}
}
