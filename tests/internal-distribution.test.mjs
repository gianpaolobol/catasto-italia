// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {guideFields} from '../packages/workbench/guided-draft.mjs';
import {draftFromReviewedVisura,reviewedVisuraExample} from '../packages/workbench/reviewed-visura.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {renderDiagnosticDossier} from '../packages/workbench/diagnostic-dossier.mjs';
const fixture=()=>syntheticCase('internal_distribution');
function blocked(c,code){
 const r=buildPracticeReport(c);
 assert.equal(r.state,'blocked');assert.equal(r.candidate,null);assert.deepEqual(r.operations,[]);
 assert.equal(r.canExport,false);assert.equal(r.operative,false);assert.ok(r.blockers.includes(code),JSON.stringify(r));
}
test('internal redistribution V retains observed identifier and unrelated unit',()=>{
 const c=fixture(),before=JSON.stringify(c),r=buildPracticeReport(c);
 assert.equal(r.state,'research_candidate');assert.deepEqual(r.candidate.counts,{S:0,C:0,V:1});
 assert.deepEqual(r.candidate.varyUnitIds,['u1']);assert.deepEqual(r.candidate.suppressUnitIds,[]);
 assert.deepEqual(r.operations.map(x=>[x.operation,x.unitId,x.identifiers[0].identifier.subaltern]),[['V','u1','01'],['unchanged','other','09']]);
 assert.equal(r.operations[0].identifiers[0].status,'observed');assert.equal(r.source.id,'circ9-2001');
 assert.equal(r.source.usableForRule,false);assert.equal(r.operative,false);assert.equal(r.canExport,false);
 assert.match(r.relation,/classamento e planimetria da riesaminare/);
 assert.match(renderDiagnosticDossier(r),/Variazione/);assert.equal(JSON.stringify(c),before);
 assert.ok(guideFields(c).some(row=>row.path.includes('internalLayoutChanged')));
});
test('transcribed example remains blocked until declared and transcribed facts are examined separately',()=>{
 const x=reviewedVisuraExample('internal_distribution');
 blocked(draftFromReviewedVisura(x),'unresolved_fact:internalLayoutChanged');
 for(const fact of x.factRows){fact.declared='yes';fact.transcribed='yes';}
 const c=draftFromReviewedVisura(x),r=buildPracticeReport(c);
 assert.equal(r.state,'research_candidate');assert.deepEqual(r.candidate.counts,{S:0,C:0,V:1});
 assert.equal(r.canExport,false);
});
for(const fact of ['mapUnchanged','boundariesUnchanged','useUnchanged','internalLayoutChanged','identifiersUnchanged','singleIntervention']){
 test('unresolved '+fact+' blocks internal redistribution',()=>{const c=fixture();c.input.facts[fact].value='unknown';blocked(c,'unresolved_fact:'+fact);});
}
test('contradictory transcription cannot establish invariant identifiers',()=>{
 const c=fixture();c.assertions.find(x=>x.fact==='identifiersUnchanged').value='no';blocked(c,'field_evidence_inconsistent');
});
test('identifiers unchanged requires documentary reference',()=>{
 const c=fixture();c.input.snapshot.sources.push({id:'synthetic-survey',kind:'survey',capturedOn:c.input.snapshot.asOf});
 c.input.facts.identifiersUnchanged.sourceIds=['synthetic-survey'];c.assertions.find(x=>x.fact==='identifiersUnchanged').sourceId='synthetic-survey';
 blocked(c,'unresolved_fact:identifiersUnchanged');
});
test('no constitutions are admitted in this narrow case',()=>{
 const c=fixture();c.input.derivedIds=['other'];blocked(c,'invalid_unit_counts');
});
test('multi-identifier unit remains outside scope',()=>{
 const c=fixture(),u=c.input.snapshot.units[0],claim=structuredClone(u.identifiers[0]);claim.id='u1-1';claim.value.subaltern='02';u.identifiers.push(claim);
 c.coverage.observedClaims.push({claimId:claim.id,identifier:{...claim.value}});
 blocked(c,'complex_internal_variation_outside_scope');
});
test('independent coverage still required for V',()=>{
 const c=fixture();c.coverage.observedClaims.pop();blocked(c,'coverage_claim_set_mismatch');
});
