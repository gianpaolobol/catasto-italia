// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {guideFields,editGuidedDraft} from '../packages/workbench/guided-draft.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
const find=(draft,group,kind)=>guideFields(draft).find(r=>r.group===group&&(!kind||r.kind===kind));
for(const scenario of ['fusion','division','new_construction']){
  test('guided workflow '+scenario,()=>{
    const draft=syntheticCase(scenario),before=JSON.stringify(draft);
    const row=find(draft,'Identificativi proposti');
    const changed=editGuidedDraft(draft,row.key,'00042');
    assert.equal(guideFields(changed).find(r=>r.key===row.key).value,'00042');
    assert.deepEqual(changed.coverage,draft.coverage);
    assert.deepEqual(changed.assertions,draft.assertions);
    assert.equal(JSON.stringify(draft),before);
    const r=buildPracticeReport(changed);
    assert.equal(r.state,'research_candidate');
    assert.ok(r.operations.some(o=>o.operation==='C'&&o.identifiers.some(x=>x.identifier.subaltern==='00042')));
    assert.equal(r.canExport,false);
  });
}
test('independent observed identifier and coverage edits',()=>{
  const draft=syntheticCase('fusion');
  const observed=find(draft,'Inventario osservato');
  const changed=editGuidedDraft(draft,observed.key,'0044');
  assert.deepEqual(changed.coverage,draft.coverage);
  assert.ok(buildPracticeReport(changed).blockers.includes('coverage_identifier_mismatch'));
  const coverage=find(changed,'Trascrizione indipendente della copertura');
  const consistent=editGuidedDraft(changed,coverage.key,'0044');
  assert.equal(buildPracticeReport(consistent).state,'research_candidate');
});
test('fact and source transcription remain independent',()=>{
  const draft=syntheticCase('fusion'),fact=find(draft,'Presupposti dichiarati'),assertion=find(draft,'Trascrizioni delle evidenze');
  const changed=editGuidedDraft(draft,assertion.key,'no');
  assert.deepEqual(changed.input.facts,draft.input.facts);
  assert.ok(buildPracticeReport(changed).blockers.includes('field_evidence_inconsistent'));
  const unknown=editGuidedDraft(draft,fact.key,'unknown');
  assert.deepEqual(unknown.assertions,draft.assertions);
  assert.equal(buildPracticeReport(unknown).candidate,null);
});
test('collision cannot become a proposal through guided editing',()=>{
  const draft=syntheticCase('fusion'),row=find(draft,'Identificativi proposti');
  assert.equal(buildPracticeReport(editGuidedDraft(draft,row.key,'01')).candidate,null);
});
test('invalid or unsupported editor values are rejected',()=>{
  const draft=syntheticCase('fusion'),row=find(draft,'Identificativi proposti');
  for(const value of ['<script>',{},42,'A'.repeat(33),'',undefined])assert.throws(()=>editGuidedDraft(draft,row.key,value));
  assert.throws(()=>editGuidedDraft(draft,'__proto__','42'));
  assert.throws(()=>guideFields(null));
  draft.input.snapshot.units[0].identifiers[0].value.municipalityCode='REAL';
  assert.throws(()=>guideFields(draft));
});
test('editor respects bounded field count',()=>{
  const draft=syntheticCase('fusion');
  draft.input.snapshot.units=Array(101).fill(draft.input.snapshot.units[0]);
  assert.throws(()=>guideFields(draft));
});
