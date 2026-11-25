// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Recompute all requested annexes from declarations; never accept client-calculated results.
import {buildPracticeReport} from './index.mjs';
import {measureSyntheticPolygon} from './synthetic-geometry.mjs';
import {syntheticIncomeWorksheet} from './synthetic-income.mjs';
import {renderDiagnosticDossier} from './diagnostic-dossier.mjs';
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
export function buildIntegratedDossier(request){
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
      if(!shape(item,['unitId','vertices'])||typeof item.unitId!=='string'||gIds.has(item.unitId))return block('invalid_geometry_request');
      gIds.add(item.unitId);
      const measured=measureSyntheticPolygon(report,item.unitId,item.vertices);
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
    return {ok:true,error:null,html:renderDiagnosticDossier(report,{geometry,income})};
  }catch{return block('dossier_processing_failed');}
}
