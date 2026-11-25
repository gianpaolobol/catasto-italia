// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {request as httpRequest} from 'node:http';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {createWorkbenchServer} from '../apps/workbench/server.mjs';
const blocked=r=>{
  assert.equal(r.state,'blocked');assert.equal(r.candidate,null);assert.deepEqual(r.operations,[]);
  assert.deepEqual(r.evidence,[]);assert.equal(r.relation,null);assert.equal(r.operative,false);
  assert.equal(r.canExport,false);assert.equal(r.availability,'unverified');
};
for(const [scenario,counts] of [['fusion',{S:2,C:1,V:0}],['division',{S:1,C:2,V:0}],['new_construction',{S:0,C:1,V:0}]]){
  test('vertical diagnostic '+scenario,()=>{
    const input=syntheticCase(scenario),before=JSON.stringify(input),r=buildPracticeReport(input);
    assert.equal(r.state,'research_candidate');assert.deepEqual(r.candidate.counts,counts);
    assert.equal(r.operations.filter(x=>x.operation==='S').length,counts.S);
    assert.equal(r.operations.filter(x=>x.operation==='C').length,counts.C);
    assert.equal(r.operations.filter(x=>x.operation==='unchanged').length,1);
    assert.equal(r.evidence.length,input.assertions.length);assert.match(r.caseDigest,/^[a-f0-9]{64}$/);
    assert.equal(r.source.usableForRule,false);assert.equal(r.operative,false);assert.equal(r.canExport,false);
    assert.equal(r.diagnosticReportExportable,true);assert.equal(r.availability,'unverified');
    assert.match(r.warning,/NON UFFICIALE/);assert.match(r.relation,/da verificare/);
    assert.equal(JSON.stringify(input),before);
  });
}
test('graffato remains one unit with two identifiers and initial zeroes',()=>{
  const r=buildPracticeReport(syntheticCase('fusion')),u=r.operations.find(x=>x.unitId==='u1');
  assert.equal(u.operation,'S');assert.deepEqual(u.identifiers.map(x=>x.identifier.subaltern),['01','02']);
});
for(const [name,mutate,code] of [
  ['missing coverage',c=>c.coverage.observedClaims.pop(),'coverage_claim_set_mismatch'],
  ['uncertain title',c=>c.input.facts.titleReviewed.value='unknown','unresolved_fact:titleReviewed'],
  ['contradictory evidence',c=>c.assertions[0].value='no','field_evidence_inconsistent'],
  ['collision',c=>c.input.snapshot.units.find(u=>u.id==='d1').identifiers[0].value.subaltern='01','inventory_issues'],
  ['non-synthetic identifier',c=>c.input.snapshot.units[0].identifiers[0].value.municipalityCode='REAL','synthetic_only'],
  ['unknown envelope field',c=>c.approved=true,'invalid_demo_envelope'],
  ['unknown model version',c=>c.input.snapshot.schemaVersion='9','invalid_snapshot'],
  ['missing assertion',c=>c.assertions.pop(),'field_evidence_inconsistent']
]){
  test(name,()=>{const c=syntheticCase('fusion');mutate(c);const r=buildPracticeReport(c);blocked(r);assert.ok(r.blockers.includes(code),JSON.stringify(r));});
}
test('invalid input fails closed',()=>blocked(buildPracticeReport(null)));
test('actual loopback HTTP workflow and security boundaries',async t=>{
  const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const page=await fetch(base);assert.equal(page.status,200);const markup=await page.text();assert.match(markup,/Solo dati sintetici/);assert.match(markup,/type="module" src="\/client\.js"/);assert.match(markup,/id="import-draft"/);assert.match(markup,/id="reviewed-import"/);assert.match(markup,/id="operations"/);assert.match(markup,/id="download-dossier"/);
  assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal(page.headers.get('cache-control'),'no-store');
  const js=await fetch(base+'/client.js');assert.equal(js.status,200);assert.match(await js.text(),/textContent/);
  const guide=await fetch(base+'/guided-draft.mjs');assert.equal(guide.status,200);assert.match(guide.headers.get('content-type'),/javascript/);assert.match(await guide.text(),/export function editGuidedDraft/);
  for(const asset of ['/reviewed-visura.mjs','/fixtures.mjs','/diagnostic-dossier.mjs']){const response=await fetch(base+asset);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/javascript/);}
  const fixture=await (await fetch(base+'/api/fixture/division')).json();
  const options={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(fixture)};
  const response=await fetch(base+'/api/report',options);assert.equal(response.status,200);
  assert.deepEqual((await response.json()).candidate.counts,{S:1,C:2,V:0});
  assert.equal((await fetch(base+'/api/report',{...options,headers:{...options.headers,Origin:'https://example.invalid'}})).status,403);
  assert.equal((await fetch(base+'/api/report',{...options,headers:{'Content-Type':'application/json'}})).status,403);
  assert.equal((await fetch(base+'/api/report',{...options,body:'{'})).status,400);
  assert.equal((await fetch(base+'/api/report',{...options,body:'x'.repeat(262145)})).status,413);
  assert.equal((await fetch(base+'/LICENSE')).status,404);
  const invalidHost=await new Promise((resolve,reject)=>{
    const r=httpRequest(base,{headers:{Host:'example.invalid'}},res=>{res.resume();resolve(res.statusCode);});r.on('error',reject);r.end();
  });assert.equal(invalidHost,403);
});

import {syntheticIncomeWorksheet} from '../packages/workbench/synthetic-income.mjs';
const incomeRequest=(scenario='fusion')=>{
  const draft=syntheticCase(scenario);
  const unitId=buildPracticeReport(draft).operations.find(o=>['C','V'].includes(o.operation)).unitId;
  return {draft,unitId,declared:{category:'A/2',classNumber:'2',zone:'SYNTH-1',consistency:'4.5',tariff:'123.4567',unit:'vani',sourceId:'synthetic-tariff'}};
};
for(const scenario of ['fusion','division','new_construction','internal_distribution','destination_change']){
  test('synthetic income linked to '+scenario,()=>{
    const input=incomeRequest(scenario),before=JSON.stringify(input);
    const result=syntheticIncomeWorksheet(input);
    assert.equal(result.ok,true);const w=result.worksheet;
    assert.equal(w.caseDigest,buildPracticeReport(input.draft).caseDigest);
    assert.equal(w.exactProductEur,'555.5551500');
    for(const key of ['operative','officialTariffVerified','classificationVerified','officialRoundingApplied'])assert.equal(w[key],false);
    assert.equal(JSON.stringify(input),before);
  });
}
for(const [category,unit,consistency,tariff,expected] of [['B/1','m3','12','2.5','30.0000000'],['C/2','m2','0.001','0.0001','0.0000001'],['A/11','vani','9999999.999','9999999.9999','99999999989000.0000001']]){
  test('exact arithmetic '+category,()=>{
    const q=incomeRequest();Object.assign(q.declared,{category,unit,consistency,tariff});
    assert.equal(syntheticIncomeWorksheet(q).worksheet?.exactProductEur,expected);
  });
}
for(const [label,mutate] of [
  ['real zone',q=>q.declared.zone='BO'],['unknown group',q=>q.declared.category='D/1'],['unit mismatch',q=>q.declared.unit='m2'],
  ['zero',q=>q.declared.tariff='0'],['exponent',q=>q.declared.tariff='1e3'],['negative',q=>q.declared.consistency='-1'],
  ['comma',q=>q.declared.consistency='4,5'],['overprecision',q=>q.declared.consistency='1.0001'],
  ['numeric JSON',q=>q.declared.consistency=1],['not resulting',q=>q.unitId='other'],
  ['blocked case',q=>q.draft.assertions.pop()],['unexpected approval',q=>q.declared.approved=true],
  ['non-synthetic source',q=>q.declared.sourceId='official']
]){
  test('income blocks '+label,()=>{const q=incomeRequest();mutate(q);const r=syntheticIncomeWorksheet(q);assert.equal(r.ok,false);assert.equal(r.worksheet,null);});
}
test('income endpoint recomputes case and rejects external origin',async t=>{
  const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(incomeRequest())};
  const response=await fetch(base+'/api/income',opts);
  assert.equal(response.status,200);assert.equal((await response.json()).worksheet.exactProductEur,'555.5551500');
  assert.equal((await fetch(base+'/api/income',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
});
