// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {draftFromReviewedVisura,reviewedVisuraExample} from '../packages/workbench/reviewed-visura.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {guideFields,editGuidedDraft} from '../packages/workbench/guided-draft.mjs';
const examined=scenario=>{
  const input=reviewedVisuraExample(scenario);
  for(const row of input.factRows){row.declared='yes';row.transcribed='yes';}
  return input;
};
for(const [scenario,counts] of [['fusion',{S:2,C:1,V:0}],['division',{S:1,C:2,V:0}],['new_construction',{S:0,C:1,V:0}]]){
  test('reviewed synthetic transcription through report: '+scenario,()=>{
    const input=reviewedVisuraExample(scenario),original=JSON.stringify(input);
    let draft=draftFromReviewedVisura(input);
    assert.equal(buildPracticeReport(draft).state,'blocked');
    for(const field of guideFields(draft).filter(f=>f.kind==='choice')){
      draft=editGuidedDraft(draft,field.key,'yes');
    }
    const report=buildPracticeReport(draft);
    assert.equal(report.state,'research_candidate',JSON.stringify(report.blockers));
    assert.deepEqual(report.candidate.counts,counts);
    assert.equal(report.operations.filter(r=>r.operation==='unchanged').length,1);
    assert.equal(report.operative,false);assert.equal(report.canExport,false);
    assert.equal(report.availability,'unverified');assert.equal(report.source.usableForRule,false);
    assert.equal(report.diagnosticReportExportable,true);
    assert.equal(JSON.stringify(input),original);
    assert.deepEqual(JSON.parse(JSON.stringify(report)),report);
  });
}
test('separate provenance and leading zeroes survive conversion',()=>{
  const input=examined('fusion'),draft=draftFromReviewedVisura(input);
  const first=draft.input.snapshot.units[0];
  assert.deepEqual(first.identifiers.map(i=>i.value.subaltern),['01','02']);
  assert.deepEqual(first.identifiers[0].sourceIds,['synthetic-visura','synthetic-coverage']);
  assert.deepEqual(draft.input.snapshot.units.find(u=>u.id==='d1').identifiers[0].sourceIds,['synthetic-plan']);
  assert.deepEqual(draft.input.facts.inventoryComplete.sourceIds,['synthetic-coverage']);
  assert.equal(draft.assertions.find(x=>x.fact==='titleReviewed').sourceId,'synthetic-evidence');
  assert.equal(buildPracticeReport(draft).state,'research_candidate');
  input.observedUnits[0].claims[0].identifier.subaltern='99';
  assert.equal(first.identifiers[0].value.subaltern,'01');
});
for(const [name,mutate,code] of [
  ['omitted coverage',i=>i.coverage.observedClaims.pop(),'coverage_claim_set_mismatch'],
  ['different transcription',i=>i.coverage.observedClaims[0].identifier.subaltern='99','coverage_identifier_mismatch'],
  ['independent evidence disagreement',i=>i.factRows[0].transcribed='no','field_evidence_inconsistent'],
  ['unknown declared fact',i=>i.factRows[0].declared='unknown','unresolved_fact:ordinaryTerritory'],
  ['proposed collision',i=>i.proposedUnits[0].claims[0].identifier.subaltern='01','inventory_issues']
]){
  test(name,()=>{
    const i=examined('fusion');mutate(i);const report=buildPracticeReport(draftFromReviewedVisura(i));
    assert.equal(report.state,'blocked');assert.equal(report.candidate,null);
    assert.deepEqual(report.operations,[]);assert.equal(report.relation,null);
    assert.ok(report.blockers.includes(code),JSON.stringify(report.blockers));
  });
}
for(const [name,mutate] of [
  ['unsupported kind',i=>i.kind='official-visura'],
  ['real municipality',i=>i.observedUnits[0].claims[0].identifier.municipalityCode='A944'],
  ['duplicate unit',i=>i.proposedUnits[0].unitId=i.observedUnits[0].unitId],
  ['duplicate claim',i=>i.proposedUnits[0].claims[0].claimId=i.observedUnits[0].claims[0].claimId],
  ['proposed origin',i=>i.originIds[0]=i.proposedUnits[0].unitId],
  ['unmatched coverage claim',i=>i.coverage.observedClaims[0].claimId='missing'],
  ['extra approval flag',i=>i.approved=true],
  ['invalid date',i=>i.asOf='2026-02-30'],
  ['missing independent row',i=>i.factRows.pop()],
  ['duplicate fact',i=>i.factRows[1].fact=i.factRows[0].fact],
  ['invalid locator',i=>i.factRows[0].locator.index=0]
]){
  test('reject '+name,()=>{const i=examined('fusion');mutate(i);assert.throws(()=>draftFromReviewedVisura(i),/invalid_synthetic_reviewed_visura/);});
}
