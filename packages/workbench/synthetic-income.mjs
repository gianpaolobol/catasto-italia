// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Arithmetic laboratory only; no official tariff, rounding or classification decision.
import {buildPracticeReport} from './index.mjs';
const reference=Object.freeze({title:'Agenzia delle Entrate — Il Sistema Catastale, edizione 2021, §6, p. 29',url:'https://agenziaentrate.gov.it/portale/documents/20143/233848/Il%20Sistema%20Catastale%202021%20-%20pubblicato%20set2021.pdf/b4e3de16-ad6d-2814-d77d-b0c846e7ee70',status:'historical_method_reference_not_current_tariff'});
const shape=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const units={A:'vani',B:'m3',C:'m2'};
const decimal=(v,scale)=>{
  if(typeof v!=='string'||v.length>16||!new RegExp('^(?:0|[1-9][0-9]{0,6})(?:\\.[0-9]{1,'+scale+'})?$').test(v))return null;
  const [whole,frac='']=v.split('.');
  const n=BigInt(whole)*10n**BigInt(scale)+BigInt(frac.padEnd(scale,'0'));
  return n>0n?n:null;
};
function format(n,scale){
  const s=n.toString().padStart(scale+1,'0');
  return s.slice(0,-scale)+'.'+s.slice(-scale);
}
export function syntheticIncomeWorksheet(request){
  const block=code=>({ok:false,blocker:code,worksheet:null});
  try{
    if(!shape(request,['draft','unitId','declared'])||typeof request.unitId!=='string')return block('invalid_request');
    const report=buildPracticeReport(request.draft);
    if(report.state!=='research_candidate'||!report.caseDigest)return block('case_blocked');
    if(!report.operations.some(op=>op.unitId===request.unitId&&['C','V'].includes(op.operation)))return block('not_resulting_unit');
    const d=request.declared;
    if(!shape(d,['category','classNumber','zone','consistency','tariff','unit','sourceId'])||
      typeof d.category!=='string'||!/^(?:A\/(?:[1-9]|10|11)|B\/[1-8]|C\/[1-7])$/.test(d.category)||
      typeof d.classNumber!=='string'||!/^[1-9][0-9]?$/.test(d.classNumber)||
      typeof d.zone!=='string'||!/^SYNTH-[1-9][0-9]{0,2}$/.test(d.zone)||
      d.sourceId!=='synthetic-tariff'||d.unit!==units[d.category[0]])return block('invalid_declared_classification');
    const c=decimal(d.consistency,3),t=decimal(d.tariff,4);
    if(c===null||t===null)return block('invalid_decimal');
    return {ok:true,blocker:null,worksheet:{version:'0.1.0',kind:'synthetic-income-worksheet',caseDigest:report.caseDigest,
      unitId:request.unitId,declared:{...d},exactProductEur:format(c*t,7),currency:'EUR',
      operative:false,officialTariffVerified:false,classificationVerified:false,officialRoundingApplied:false,
      source:{...reference},warning:'SIMULAZIONE NON UFFICIALE. Dati e tariffa inventati; nessuna rendita proposta o attribuita. Prodotto decimale esatto, non arrotondato secondo regole catastali.'}};
  }catch{return block('worksheet_processing_failed');}
}
