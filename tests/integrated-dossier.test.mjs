// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {syntheticCase,scenarios} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {buildIntegratedDossier,replayPracticeSession} from '../packages/workbench/integrated-dossier.mjs';
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

// [Codex] Declared conversion provenance is replayed, never treated as scale certification.
test('dossier distinguishes replayed calibration from manual coordinates per unit',()=>{
 const q=multi();q.geometry[0].vertices=[[0,0],[4000,0],[4000,2000],[0,2000]];
 q.geometry[0].calibration={vertices:[[-20,-10],[20,-10],[20,10],[-20,10]],drawingLength:40,actualLengthMm:4000};
 const r=buildIntegratedDossier(q);assert.equal(r.ok,true);assert.match(r.html,/Provenienza della scala/);assert.match(r.html,/Conversione dichiarata, scala non verificata/);assert.match(r.html,/Millimetri dichiarati manualmente/);assert.match(r.html,/<td>40<\/td><td>4000<\/td>/);
 q.geometry[0].calibration.actualLengthMm=8000;assert.equal(buildIntegratedDossier(q).ok,false);
});
test('dossier rejects forged calibration fields',()=>{
 const q=make();q.geometry.calibration={vertices:q.geometry.vertices,drawingLength:1,actualLengthMm:1,verified:true};
 assert.equal(buildIntegratedDossier(q).ok,false);
});

test('one resulting unit may contain multiple disjoint contours; dossier replays all or rejects',()=>{
 const q=make();
 q.geometry.vertices=[[[0,0],[4000,0],[4000,2000],[0,2000]],[[5000,0],[7000,0],[7000,1000],[5000,1000]]];
 const r=buildIntegratedDossier(q);assert.equal(r.ok,true);assert.match(r.html,/10\.000000/);
 assert.match(r.html,/18000/);assert.equal((r.html.match(/<polygon points=/g)||[]).length,2);
 assert.match(r.html,/7000 × 2000 mm/);
 q.geometry.vertices[1]=[[4000,0],[5000,0],[5000,1000],[4000,1000]];
 assert.equal(buildIntegratedDossier(q).html,null);
});

const session=()=>({version:'0.1.0',kind:'synthetic-practice-session',request:multi()});
test('portable session replays both units and produces identical dossier',()=>{
 const s=session(),before=JSON.stringify(s),r=replayPracticeSession(s);
 assert.equal(r.ok,true);assert.equal(r.report.caseDigest,s.request.expectedDigest);
 assert.deepEqual(r.geometry.map(a=>a.areaM2),['8.000000','2.000000']);
 assert.deepEqual(r.income.map(a=>a.exactProductEur),['555.5551500','200.0000000']);
 assert.equal(r.report.operative,false);assert.equal(JSON.stringify(s),before);
 assert.equal(buildIntegratedDossier(s.request).ok,true);
});
for(const [label,change] of [
 ['version',s=>s.version='9'],['injected result',s=>s.report={}],
 ['stale digest',s=>s.request.expectedDigest='0'.repeat(64)],
 ['non-array annex',s=>s.request.geometry=s.request.geometry[0]],
 ['fake area',s=>s.request.geometry[0].areaMm2='1'],
 ['invalid unit',s=>s.request.income[1].unitId='other'],
 ['blocked state',s=>s.request.expectedState='blocked'],
 ['invalid evidence',s=>s.request.draft.assertions.pop()]
])test('session rejects '+label,()=>{
 const s=session();change(s);const r=replayPracticeSession(s);
 assert.equal(r.ok,false);assert.deepEqual(Object.keys(r).sort(),['error','ok']);
});
test('local session API rejects wrong origin and recomputes on reopen',async t=>{
 const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port,s=session();
 const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(s)};
 const r=await fetch(base+'/api/session',opts);assert.equal(r.status,200);
 assert.equal((await r.json()).geometry.length,2);
 assert.equal((await fetch(base+'/api/session',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
 s.request.geometry[0].vertices=[];assert.equal((await fetch(base+'/api/session',{...opts,body:JSON.stringify(s)})).status,400);
});

 // [Codex] Batch declarations exercise the same end-to-end replay as the workbench.
import {importGeometryBatch} from '../packages/workbench/geometry-batch.mjs';
const batchSetup=()=>{
 const q=multi();q.geometry=q.geometry.slice(0,1);
 const session={version:'0.1.0',kind:'synthetic-practice-session',request:q};
 const batch={version:'0.1.0',kind:'synthetic-geometry-declarations',caseDigest:q.expectedDigest,geometry:[
  {unitId:'d2',vertices:[[0,0],[2000,0],[2000,1000],[0,1000]],placement:{floor:'P0',xMm:4000,yMm:0}},
  {unitId:'other',vertices:[[0,0],[1000,0],[1000,1000],[0,1000]],placement:{floor:'P0',xMm:6000,yMm:0}}
 ]};return {session,batch};
};
test('batch geometry adds result and retained context, preserves income and existing measures',()=>{
 const q=batchSetup(),before=JSON.stringify(q),r=importGeometryBatch(q);
 assert.equal(r.ok,true);assert.equal(r.added,2);assert.equal(r.geometry.length,3);
 assert.equal(r.geometry[0].areaMm2,'8000000');assert.equal(r.geometry[1].areaMm2,'2000000');
 assert.equal(r.geometry[2].operation,'unchanged');assert.equal(r.income.length,2);
 assert.equal(JSON.stringify(q),before);
 const next=structuredClone(q.session);next.request.geometry.push(...q.batch.geometry);
 assert.deepEqual(r.geometry,replayPracticeSession(next).geometry);
 assert.match(buildIntegratedDossier(next.request).html,/Conservata/);
});
for(const [name,edit] of [
 ['stale digest',q=>q.batch.caseDigest='0'.repeat(64)],
 ['existing measure',q=>q.batch.geometry[0].unitId=q.session.request.geometry[0].unitId],
 ['duplicate',q=>q.batch.geometry.push(q.batch.geometry[0])],
 ['unknown unit',q=>q.batch.geometry[0].unitId='invented'],
 ['invalid second contour',q=>q.batch.geometry[1].vertices=[]],
 ['missing retained position',q=>delete q.batch.geometry[1].placement],
 ['forged area',q=>q.batch.geometry[0].areaMm2='1'],
 ['empty batch',q=>q.batch.geometry=[]],
 ['extra key',q=>q.batch.official=true]
])test('batch geometry rejects atomically: '+name,()=>{
 const q=batchSetup();edit(q);const before=JSON.stringify(q);
 const r=importGeometryBatch(q);assert.equal(r.ok,false);assert.equal(r.geometry,undefined);
 assert.equal(JSON.stringify(q),before);
});
test('batch geometry API rejects foreign origin and invalid batch',async t=>{
 const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port,q=batchSetup();
 const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(q)};
 const response=await fetch(base+'/api/geometry-batch',opts);assert.equal(response.status,200);assert.equal((await response.json()).added,2);
 assert.equal((await fetch(base+'/api/geometry-batch',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
 q.batch.geometry[1].vertices=[];assert.equal((await fetch(base+'/api/geometry-batch',{...opts,body:JSON.stringify(q)})).status,400);
});

// [Codex] Printable manual comparison remains a non-official blank worksheet.
import {buildManualDocfaWorksheet} from '../packages/workbench/manual-docfa-worklist.mjs';
test('printable comparison replays current session and keeps every official check open',()=>{
 const s=session(),before=JSON.stringify(s),r=buildManualDocfaWorksheet(s);
 assert.equal(r.ok,true);assert.equal(r.worklist.officialValidation,false);
 assert.equal(r.worklist.checks.length,6);assert.ok(r.worklist.checks.every(c=>c.state==='unverified'));
 assert.equal((r.worksheetHtml.match(/NON VERIFICATO/g)||[]).length,6);
 for(const value of [s.request.expectedDigest,'8.000000','2.000000','555.5551500','200.0000000','Versione DOCFA','Riferimento tracciato ufficiale','NON UFFICIALE'])assert.ok(r.worksheetHtml.includes(value),value);
 assert.doesNotMatch(r.worksheetHtml,/<(?:script|iframe|form|input)\b/i);
 assert.match(r.worksheetHtml,/default-src 'none'/);
 assert.equal(JSON.stringify(s),before);
 assert.equal(buildManualDocfaWorksheet(s).worksheetHtml,r.worksheetHtml);
 s.request.expectedDigest='0'.repeat(64);assert.equal(buildManualDocfaWorksheet(s).worksheetHtml,null);
});
test('printable worksheet loopback API fails closed for foreign origin and tampering',async t=>{
 const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port,s=session();
 const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(s)};
 const response=await fetch(base+'/api/manual-docfa-worksheet',opts);assert.equal(response.status,200);
 assert.equal((await response.json()).worksheetHtml,buildManualDocfaWorksheet(s).worksheetHtml);
 assert.equal((await fetch(base+'/api/manual-docfa-worksheet',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
 s.request.geometry[0].vertices=[];assert.equal((await fetch(base+'/api/manual-docfa-worksheet',{...opts,body:JSON.stringify(s)})).status,400);
});
