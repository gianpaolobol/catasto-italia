// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {guideFields,editGuidedDraft} from '../packages/workbench/guided-draft.mjs';
import {draftFromReviewedVisura,reviewedVisuraExample} from '../packages/workbench/reviewed-visura.mjs';
import {renderDiagnosticDossier} from '../packages/workbench/diagnostic-dossier.mjs';
import {measureSyntheticPolygon} from '../packages/workbench/synthetic-geometry.mjs';
const scenario='destination_change';
const fixture=()=>syntheticCase(scenario);
const unit=(c,id)=>c.input.snapshot.units.find(u=>u.id===id);
const blocked=r=>{assert.equal(r.state,'blocked');assert.equal(r.candidate,null);assert.deepEqual(r.operations,[]);assert.deepEqual(r.evidence,[]);assert.equal(r.relation,null);assert.equal(r.operative,false);assert.equal(r.canExport,false);};
test('whole unit destination change: diagnostic S/C, unchanged third party, distinct identifiers',()=>{
 const c=fixture(),before=JSON.stringify(c),r=buildPracticeReport(c);
 assert.equal(r.state,'research_candidate');assert.deepEqual(r.candidate.counts,{S:1,C:1,V:0});
 assert.deepEqual(r.operations.map(o=>[o.operation,o.unitId]),[['S','u1'],['C','d1'],['unchanged','other']]);
 assert.deepEqual(r.operations.map(o=>o.identifiers.map(i=>i.identifier.subaltern)),[['01'],['05'],['09']]);
 assert.equal(r.source.id,'circ1-2006');assert.equal(r.source.usableForRule,false);assert.equal(r.canExport,false);
 assert.equal(r.availability,'unverified');assert.match(r.relation,/variazione di destinazione/);assert.equal(JSON.stringify(c),before);
 const html=renderDiagnosticDossier(r);assert.match(html,/NON UFFICIALE/);assert.match(html,/Soppressione/);assert.match(html,/Costituzione/);
 const g=measureSyntheticPolygon(r,'d1',[[0,0],[3000,0],[3000,2000],[0,2000]]);
 assert.equal(g.areaM2,'6.000000');assert.equal(g.caseDigest,r.caseDigest);
});
for(const fact of ['entireUseChanged','noFusionOrDivision','mapUnchanged','boundariesUnchanged']){
 test('unresolved '+fact+' blocks the whole proposal',()=>{const c=fixture();c.input.facts[fact].value='unknown';blocked(buildPracticeReport(c));});
}
test('reusing former or unrelated subaltern including aliases is blocked',()=>{
 for(const n of ['01','1','09','9']){const c=fixture();unit(c,'d1').identifiers[0].value.subaltern=n;blocked(buildPracticeReport(c));}
});
test('multiple identifiers on origin or result excluded',()=>{
 for(const id of ['u1','d1']){const c=fixture(),u=unit(c,id);const claim=structuredClone(u.identifiers[0]);claim.id=id+'-extra';claim.value.subaltern='77';u.identifiers.push(claim);if(id==='u1')c.coverage.observedClaims.push({claimId:claim.id,identifier:{...claim.value}});blocked(buildPracticeReport(c));}
});
test('no implicit whole parcel or mixed intervention',()=>{
 const c=fixture();unit(c,'d1').identifiers[0].value.subaltern=null;blocked(buildPracticeReport(c));
 const d=fixture();d.input.originIds.push('other');blocked(buildPracticeReport(d));
});
test('different parcel, contradictory transcription and incomplete coverage are blocked',()=>{
 const c=fixture();unit(c,'d1').identifiers[0].value.parcel='0910';blocked(buildPracticeReport(c));
 const d=fixture();d.assertions.find(a=>a.fact==='entireUseChanged').value='no';blocked(buildPracticeReport(d));
 const e=fixture();e.coverage.observedClaims.pop();blocked(buildPracticeReport(e));
});
test('reviewed example remains blocked until both declarations and transcriptions explicitly set',()=>{
 const t=reviewedVisuraExample(scenario);const first=draftFromReviewedVisura(t);blocked(buildPracticeReport(first));
 for(const f of t.factRows){f.declared='yes';f.transcribed='yes';}
 const c=draftFromReviewedVisura(t);const r=buildPracticeReport(c);assert.deepEqual(r.candidate?.counts,{S:1,C:1,V:0});
 const row=guideFields(c).find(x=>x.path.join('.')==='input.facts.entireUseChanged.value');
 assert.ok(row);const edited=editGuidedDraft(c,row.key,'no');blocked(buildPracticeReport(edited));
 assert.equal(edited.assertions.find(a=>a.fact==='entireUseChanged').value,'yes');assert.equal(c.input.facts.entireUseChanged.value,'yes');
});
