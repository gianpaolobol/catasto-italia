// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {guideFields,editGuidedDraft} from '../packages/workbench/guided-draft.mjs';
import {draftFromReviewedVisura,reviewedVisuraExample} from '../packages/workbench/reviewed-visura.mjs';
import {renderDiagnosticDossier} from '../packages/workbench/diagnostic-dossier.mjs';
const fixture=()=>syntheticCase('enlargement');
const unit=(c,id)=>c.input.snapshot.units.find(u=>u.id===id);
function blocked(r){
  assert.equal(r.state,'blocked');assert.equal(r.candidate,null);
  assert.deepEqual(r.operations,[]);assert.equal(r.relation,null);
  assert.equal(r.canExport,false);assert.equal(r.operative,false);
}
test('enlargement: unchanged map research scenario, S/C and preserved third unit',()=>{
 const c=fixture(),before=JSON.stringify(c),r=buildPracticeReport(c);
 assert.equal(r.state,'research_candidate');assert.deepEqual(r.candidate.counts,{S:1,C:1,V:0});
 assert.deepEqual(r.operations.map(o=>[o.operation,o.unitId]),[['S','u1'],['C','d1'],['unchanged','other']]);
 assert.deepEqual(r.operations.map(o=>o.identifiers.map(i=>i.identifier.subaltern)),[['01'],['05'],['09']]);
 assert.equal(r.source.id,'vademecum-docfa-2022');assert.equal(r.source.usableForRule,false);
 assert.equal(r.canExport,false);assert.equal(r.operative,false);assert.equal(r.availability,'unverified');
 assert.match(r.relation,/Sagoma in mappa dichiarata invariata/);assert.match(r.relation,/quadro D/);
 assert.match(renderDiagnosticDossier(r),/NON UFFICIALE/);assert.equal(JSON.stringify(c),before);
});
for(const fact of ['mapUnchanged','useUnchanged','relevantIncrease','noFusionOrDivision','noThirdPartyOrCommonArea']){
 test('unresolved or contradictory '+fact+' blocks whole proposal',()=>{
   for(const value of ['no','unknown']){
     const c=fixture();c.input.facts[fact].value=value;blocked(buildPracticeReport(c));
     const d=fixture();d.assertions.find(a=>a.fact===fact).value=value;blocked(buildPracticeReport(d));
   }
 });
}
test('identifier collision, whole parcel, different parcel and complex origin blocked',()=>{
 for(const n of ['1','01','9','09',null]){const c=fixture();unit(c,'d1').identifiers[0].value.subaltern=n;blocked(buildPracticeReport(c));}
 const d=fixture();unit(d,'d1').identifiers[0].value.parcel='0910';blocked(buildPracticeReport(d));
 const e=fixture();e.input.originIds.push('other');blocked(buildPracticeReport(e));
 const f=fixture(),claim=structuredClone(unit(f,'u1').identifiers[0]);
 claim.id='u1-extra';claim.value.subaltern='77';unit(f,'u1').identifiers.push(claim);
 f.coverage.observedClaims.push({claimId:claim.id,identifier:{...claim.value}});blocked(buildPracticeReport(f));
});
test('reviewed visura stays blocked until independently declared and transcribed',()=>{
 const t=reviewedVisuraExample('enlargement');blocked(buildPracticeReport(draftFromReviewedVisura(t)));
 for(const f of t.factRows){f.declared='yes';f.transcribed='yes';}
 const c=draftFromReviewedVisura(t);assert.deepEqual(buildPracticeReport(c).candidate?.counts,{S:1,C:1,V:0});
 const row=guideFields(c).find(x=>x.path.join('.')==='input.facts.mapUnchanged.value');
 assert.ok(row);const edited=editGuidedDraft(c,row.key,'no');
 blocked(buildPracticeReport(edited));assert.equal(edited.assertions.find(a=>a.fact==='mapUnchanged').value,'yes');
});
