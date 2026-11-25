// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Orchestration only: no new cadastral rules or official export.
import {validateSnapshot} from '../building-core/index.mjs';
import {auditFieldEvidence,researchCaseDigest} from '../decision/field-evidence-audit.mjs';
import {auditIdentifierInventory} from '../decision/identifier-inventory.mjs';
import {inspectSource} from '../normative/index.mjs';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const warning='SIMULAZIONE SINTETICA — NON UFFICIALE. Nessuna pratica, disponibilità subalterni, conformità o approvazione attestata.';
const base=()=>({version:'0.1.0',kind:'synthetic-diagnostic-report',warning,state:'blocked',
  operative:false,canExport:false,diagnosticReportExportable:true,availability:'unverified',
  candidate:null,operations:[],evidence:[],caseDigest:null,source:null,blockers:[],relation:null});
export function buildPracticeReport(envelope){
  const out=base();
  const stop=code=>{out.blockers.push(code);return out;};
  try{
    if(!shape(envelope,['version','kind','input','coverage','assertions'])||
      envelope.version!=='0.1.0'||envelope.kind!=='synthetic-case'||!plain(envelope.input)||
      !Array.isArray(envelope.assertions)||envelope.assertions.length>4096)return stop('invalid_demo_envelope');
    const {input,coverage,assertions}=envelope;
    if(!validateSnapshot(input.snapshot).valid)return stop('invalid_snapshot');
    const snapshot=input.snapshot;
    // This is a restricted demo, not an importer for client documents.
    // The sentinel is an additional guard, not a guarantee of anonymity.
    if(!snapshot.snapshotId.startsWith('synthetic-')||
      snapshot.sources.some(s=>!s.id.startsWith('synthetic-')||s.kind==='official_receipt')||
      snapshot.units.some(u=>u.identifiers.some(c=>c.value!==null&&c.value.municipalityCode!=='SYNTH')))
      return stop('synthetic_only');
    if(!plain(coverage))return stop('invalid_coverage');
    // Assemble the declared case and bind its scope. Assertions remain explicit;
    // this digest is not independent verification or a signature.
    const caseDigest=researchCaseDigest(input,coverage);
    const audit=auditFieldEvidence(input,coverage,{caseDigest,assertions});
    out.blockers=[...new Set(audit.blockers)];
    if(audit.source){
      const ref=inspectSource({id:audit.source.id,revision:audit.source.revision,asOf:snapshot.asOf,province:input.province});
      out.source={...audit.source,usableForRule:ref.usableForRule===true,
        title:ref.source?.title??null,url:ref.source?.url??null};
    }
    if(!audit.candidate)return out;
    const inventory=auditIdentifierInventory(snapshot);
    if(!inventory.validSnapshot||inventory.issues.length)return stop('inventory_inconsistent');
    const c=audit.candidate;
    const rows=inventory.rows.map(r=>({unitId:r.unitId,claimId:r.claimId,status:r.status,identifier:r.identifier,sourceIds:r.sourceIds}));
    const byUnit=new Map();
    for(const row of rows){if(!byUnit.has(row.unitId))byUnit.set(row.unitId,[]);byUnit.get(row.unitId).push(row);}
    const operations=[...c.suppressUnitIds.map(unitId=>({operation:'S',unitId})),
      ...c.constituteUnitIds.map(unitId=>({operation:'C',unitId})),
      ...(c.varyUnitIds??[]).map(unitId=>({operation:'V',unitId})),
      ...c.unchangedUnitIds.map(unitId=>({operation:'unchanged',unitId}))]
      .map(op=>({...op,identifiers:byUnit.get(op.unitId)??[]}));
    const relation='Ipotesi diagnostica sintetica: '+c.cause+'. Unità da sopprimere: '+c.counts.S+
      '; da costituire: '+c.counts.C+'; da variare: '+c.counts.V+
      (c.counts.V?'. Identificativi dichiarati invariati; classamento e planimetria da riesaminare':'')+
      (input.scenario==='enlargement'?'. Sagoma in mappa dichiarata invariata; verificare il presupposto cartografico e la nota per il quadro D':'')+
      '. Unità estranee conservate: '+c.unchangedUnitIds.length+
      '. Riferimento di ricerca: '+c.locator+'. Applicabilità, titolarità, completezza e disponibilità da verificare.';
    return {...out,state:'research_candidate',candidate:c,operations,caseDigest,
      evidence:assertions.map(a=>({fact:a.fact,sourceId:a.sourceId,value:a.value,locator:{...a.locator}})),relation};
  }catch{
    // Do not return a partly assembled proposal, input text or exception details.
    return {...base(),blockers:['demo_processing_failed']};
  }
}
