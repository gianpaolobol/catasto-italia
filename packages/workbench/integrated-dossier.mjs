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
    if(report.state!=='research_candidate'&&(request.geometry!==null||request.income!==null))return block('blocked_case_annex');
    let geometry=null,income=null;
    if(request.geometry!==null){
      if(!shape(request.geometry,['unitId','vertices']))return block('invalid_geometry_request');
      geometry=measureSyntheticPolygon(report,request.geometry.unitId,request.geometry.vertices);
      if(geometry.state!=='measured')return block('geometry_blocked');
    }
    if(request.income!==null){
      if(!shape(request.income,['unitId','declared']))return block('invalid_income_request');
      const result=syntheticIncomeWorksheet({draft:request.draft,...request.income});
      if(!result.ok)return block('income_blocked');
      income=result.worksheet;
    }
    return {ok:true,error:null,html:renderDiagnosticDossier(report,{geometry,income})};
  }catch{return block('dossier_processing_failed');}
}
