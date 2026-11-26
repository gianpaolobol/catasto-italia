// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Recompute all requested annexes from declarations; never accept client-calculated results.
import {buildPracticeReport} from './index.mjs';
import {guideFields} from './guided-draft.mjs';
import {measureSyntheticPolygon} from './synthetic-geometry.mjs';
import {syntheticIncomeWorksheet} from './synthetic-income.mjs';
import {renderDiagnosticDossier} from './diagnostic-dossier.mjs';
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
export function buildIntegratedDossier(request,{replay=false}={}){
  const block=error=>({ok:false,error,html:null});
  try{
    if(!shape(request,['draft','expectedState','expectedDigest','geometry','income']))return block('invalid_dossier_request');
    const report=buildPracticeReport(request.draft);
    if(report.state!==request.expectedState||report.caseDigest!==request.expectedDigest)return block('case_changed');
    // Keep the earlier single-annex request compatible; new callers submit arrays.
    const list=value=>value===null?[]:Array.isArray(value)?value:[value];
    const geometries=list(request.geometry),incomes=list(request.income);
    if(geometries.length>64||incomes.length>64)return block('too_many_annexes');
    if(report.state!=='research_candidate'&&(geometries.length||incomes.length))return block('blocked_case_annex');
    const geometry=[],income=[],gIds=new Set(),iIds=new Set();
    for(const item of geometries){
      if(!(shape(item,['unitId','vertices'])||shape(item,['unitId','vertices','calibration']))||typeof item.unitId!=='string'||gIds.has(item.unitId))return block('invalid_geometry_request');
      gIds.add(item.unitId);
      const measured=measureSyntheticPolygon(report,item.unitId,item.vertices,item.calibration??null);
      if(measured.state!=='measured')return block('geometry_blocked');
      geometry.push(measured);
    }
    for(const item of incomes){
      if(!shape(item,['unitId','declared'])||typeof item.unitId!=='string'||iIds.has(item.unitId))return block('invalid_income_request');
      iIds.add(item.unitId);
      const result=syntheticIncomeWorksheet({draft:request.draft,...item});
      if(!result.ok)return block('income_blocked');
      income.push(result.worksheet);
    }
    const html=renderDiagnosticDossier(report,{geometry,income});
    return replay?{ok:true,error:null,report,geometry,income}:{ok:true,error:null,html};
  }catch{return block('dossier_processing_failed');}
}

/** A portable laboratory session contains declarations only, not trusted results. */
export function replayPracticeSession(session){
  const block=error=>({ok:false,error});
  if(!shape(session,['version','kind','request'])||session.version!=='0.1.0'||session.kind!=='synthetic-practice-session')return block('invalid_session');
  if(!shape(session.request,['draft','expectedState','expectedDigest','geometry','income'])||
     session.request.expectedState!=='research_candidate'||!Array.isArray(session.request.geometry)||!Array.isArray(session.request.income))return block('invalid_session_request');
  try{guideFields(session.request.draft);}catch{return block('unsupported_session_draft');}
  const result=buildIntegratedDossier(session.request,{replay:true});
  return result.ok?result:block(result.error);
}
