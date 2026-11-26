// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Local diagnostic worklist for human review, not a DOCFA record mapping.
import {replayPracticeSession} from './integrated-dossier.mjs';
import {syntheticFloorPlans} from './synthetic-floor-plan.mjs';

export function buildManualDocfaWorklist(session){
  const block=error=>({ok:false,error,worklist:null});
  try{
    const replay=replayPracticeSession(session);
    if(!replay.ok)return block(replay.error);
    const {report,geometry,income}=replay;
    const g=new Map(geometry.map(a=>[a.unitId,a])),i=new Map(income.map(a=>[a.unitId,a]));
    const plan=syntheticFloorPlans(report,geometry);
    if(!plan)return block('invalid_floor_plan');
    const rows=report.operations.map(op=>{
      const result=['C','V'].includes(op.operation),context=op.operation==='unchanged';
      const measured=g.get(op.unitId),estimate=i.get(op.unitId);
      return {unitId:op.unitId,operation:op.operation,identifiers:op.identifiers,
        geometry:result||context?{state:!measured?'missing':measured.placement?'declared_position':'local_only',
          areaM2:measured?.areaM2??null,placement:measured?.placement??null}:null,
        income:result?{state:estimate?'synthetic_only':'missing',declared:estimate?.declared??null,
          exactProductEur:estimate?.exactProductEur??null}:null};
    });
    const overlapWarnings=plan.floors.flatMap(f=>f.potentialOverlaps.map(unitIds=>({floor:f.floor,unitIds})));
    const gaps={geometry:rows.filter(r=>r.geometry?.state==='missing').map(r=>r.unitId),
      placement:rows.filter(r=>r.geometry?.state==='local_only').map(r=>r.unitId),
      income:rows.filter(r=>r.income?.state==='missing').map(r=>r.unitId),potentialOverlaps:overlapWarnings};
    const checks=[
      ['territory_and_identifiers','Verificare territorio, identificativi, disponibilità e titolarità con fonti ufficiali.'],
      ['cause_and_documents','Verificare causale, presupposti, atti ed evidenze indipendenti.'],
      ['drawings','Verificare scala, planimetrie, poligoni ed elaborato con specifiche vigenti.'],
      ['classification','Verificare classamento, consistenza, tariffario territoriale vigente e rendita.'],
      ['official_forms','Compilare e verificare i modelli nella versione ufficiale DOCFA, senza importare questo JSON.'],
      ['official_validation','Eseguire collaudo locale con strumenti ufficiali; firma e trasmissione escluse.']
    ].map(([id,label])=>({id,label,state:'unverified'}));
    return {ok:true,error:null,worklist:{version:'0.1.0',kind:'synthetic-manual-docfa-review-worklist',
      warning:'SIMULAZIONE SINTETICA — NON UFFICIALE. Promemoria per verifica umana, non tracciato DOCFA.',
      caseDigest:report.caseDigest,relation:report.relation,source:report.source,evidence:report.evidence,
      rows,gaps,checks,diagnosticCoverageComplete:Object.values(gaps).every(a=>a.length===0),
      officialValidation:false,officialExport:false,signature:false,submission:false}};
  }catch{return block('manual_review_processing_failed');}
}
