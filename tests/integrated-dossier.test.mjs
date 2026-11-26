// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {syntheticCase,scenarios} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {buildIntegratedDossier} from '../packages/workbench/integrated-dossier.mjs';
import {createWorkbenchServer} from '../apps/workbench/server.mjs';
const make=(scenario='fusion')=>{
  const draft=syntheticCase(scenario),r=buildPracticeReport(draft);
  const unitId=r.operations.find(o=>['C','V'].includes(o.operation)).unitId;
  return {draft,expectedState:r.state,expectedDigest:r.caseDigest,
    geometry:{unitId,vertices:[[0,0],[4000,0],[4000,1000],[2000,1000],[2000,3000],[0,3000]]},
    income:{unitId,declared:{category:'A/2',classNumber:'2',zone:'SYNTH-1',consistency:'4.5',tariff:'123.4567',unit:'vani',sourceId:'synthetic-tariff'}}};
};
for(const scenario of scenarios)test('integrated dossier '+scenario,()=>{
  const q=make(scenario),before=JSON.stringify(q),r=buildIntegratedDossier(q);
  assert.equal(r.ok,true);assert.match(r.html,/8\.000000/);assert.match(r.html,/14000/);assert.match(r.html,/<svg[^>]+viewBox="-200 -200 4400 3400"/);assert.match(r.html,/points="0,3000 4000,3000 4000,2000 2000,2000 2000,0 0,0"/);assert.match(r.html,/scala di stampa non verificata/i);
  assert.match(r.html,/555\.5551500/);assert.ok(r.html.includes(q.expectedDigest));
  assert.match(r.html,/NON UFFICIALE/);assert.match(r.html,/default-src 'none'/);
  assert.doesNotMatch(r.html,/<(?:script|iframe|form)\b/);assert.equal(JSON.stringify(q),before);
});
test('missing annexes are explicit and independent',()=>{
 const q=make();q.geometry=null;
 const r=buildIntegratedDossier(q);assert.equal(r.ok,true);assert.match(r.html,/Nessuna misura corrente inclusa/);assert.match(r.html,/555\.5551500/);
 q.income=null;assert.match(buildIntegratedDossier(q).html,/Nessun calcolo corrente incluso/);
});
for(const [label,edit] of [
 ['stale case digest',q=>q.expectedDigest='0'.repeat(64)],
 ['state mismatch',q=>q.expectedState='blocked'],
 ['invalid polygon',q=>q.geometry.vertices=[]],
 ['foreign unit',q=>q.geometry.unitId='other'],
 ['fake measurement',q=>q.geometry.areaM2='999'],
 ['fake product',q=>q.income.exactProductEur='999'],
 ['invalid tariff',q=>q.income.declared.tariff='0'],
 ['unreviewed case',q=>q.draft.assertions.pop()]
])test('rejects '+label,()=>{const q=make();edit(q);const r=buildIntegratedDossier(q);assert.equal(r.ok,false);assert.equal(r.html,null);});
test('blocked dossier may describe blockers only',()=>{
 const q=make();q.draft.assertions.pop();const r=buildPracticeReport(q.draft);
 assert.equal(r.state,'blocked');q.expectedState=r.state;q.expectedDigest=r.caseDigest;
 assert.equal(buildIntegratedDossier(q).ok,false);q.geometry=null;q.income=null;
 assert.match(buildIntegratedDossier(q).html,/Nessuna operazione/);
});
test('loopback dossier API validates same origin and recomputes',async t=>{
 const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port,q=make();
 const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(q)};
 const response=await fetch(base+'/api/dossier',opts);assert.equal(response.status,200);
 assert.match((await response.json()).html,/555\.5551500/);
 assert.equal((await fetch(base+'/api/dossier',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
 q.income.declared.tariff='0';assert.equal((await fetch(base+'/api/dossier',{...opts,body:JSON.stringify(q)})).status,400);
});

const multi=()=>{
 const q=make('division');
 const second=buildPracticeReport(q.draft).operations.filter(o=>o.operation==='C')[1].unitId;
 q.geometry=[q.geometry,{unitId:second,vertices:[[0,0],[2000,0],[2000,1000],[0,1000]]}];
 q.income=[q.income,{unitId:second,declared:{...q.income.declared,consistency:'2',tariff:'100'}}];
 return q;
};
test('division dossier includes both units and exact separate measurements',()=>{
 const q=multi(),before=JSON.stringify(q),r=buildIntegratedDossier(q);
 assert.equal(r.ok,true);
 for(const value of ['8.000000','2.000000','555.5551500','200.0000000','Copertura degli annessi'])assert.ok(r.html.includes(value),value);
 assert.equal((r.html.match(/<figure class="plan-preview">/g)||[]).length,2);
 assert.equal(JSON.stringify(q),before);
});
test('partial annex coverage is explicit by unit',()=>{
 const q=multi();q.geometry.pop();q.income.shift();
 const r=buildIntegratedDossier(q);assert.equal(r.ok,true);
 assert.match(r.html,/<td>d1<\/td><td>Sì<\/td><td>Assente<\/td>/);
 assert.match(r.html,/<td>d2<\/td><td>Assente<\/td><td>Sì<\/td>/);
});
for(const [label,edit] of [
 ['duplicate geometry',q=>q.geometry.push(q.geometry[0])],
 ['duplicate income',q=>q.income.push(q.income[0])],
 ['foreign geometry unit',q=>q.geometry[1].unitId='other'],
 ['second invalid tariff',q=>q.income[1].declared.tariff='0'],
 ['second invalid contour',q=>q.geometry[1].vertices=[]],
 ['too many annexes',q=>q.geometry=Array(65).fill(q.geometry[0])],
 ['null array element',q=>q.income.push(null)]
])test('multi annex rejects '+label,()=>{
 const q=multi();edit(q);const r=buildIntegratedDossier(q);assert.equal(r.ok,false);assert.equal(r.html,null);
});
