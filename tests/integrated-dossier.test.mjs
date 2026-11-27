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

 // [Codex] Human observations remain declarations even when all six are recorded.
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';
const filledRegister=s=>{
 const t=manualReviewRegister(s).template;
 t.environment={date:'2026-11-26',docfaVersion:'SYNTH-TEST',province:'SYNTH',archiveSha256:'a'.repeat(64),specificationReference:'SYNTH-SPEC',localRunReference:'SYNTH-RUN'};
 t.observations=t.observations.map((o,i)=>({...o,state:i===1?'difference_declared':'match_declared',evidenceReference:'SYNTH-EVIDENCE-'+i,note:'Synthetic test only'}));
 return t;
};
test('manual register is bound to all current declarations, never an official outcome',()=>{
 const s=session(),before=JSON.stringify(s),blank=manualReviewRegister(s).template,t=filledRegister(s);
 assert.equal(blank.observations.length,6);assert.ok(blank.observations.every(o=>o.state==='unrecorded'));
 assert.equal(manualReviewRegister(s,blank).record.counts.unrecorded,6);
 const x=manualReviewRegister(s,t);assert.equal(x.ok,true);assert.equal(x.record.counts.difference_declared,1);
 assert.equal(x.record.counts.match_declared,5);assert.ok(x.record.checks.every(c=>c.state==='unverified'));
 for(const flag of ['officialValidation','officialExport','signature','submission'])assert.equal(x.record[flag],false);
 assert.equal(JSON.stringify(s),before);
 const reordered={request:s.request,kind:s.kind,version:s.version};
 assert.equal(manualReviewRegister(reordered,t).ok,true);
 s.request.geometry[0].vertices=[[0,0],[4000,0],[4000,2000],[0,2000]];
 assert.equal(manualReviewRegister(s,t).error,'review_snapshot_mismatch');
});
for(const [label,edit] of [
 ['missing proof',t=>t.observations[0].evidenceReference=''],
 ['duplicate control',t=>t.observations[1].id=t.observations[0].id],
 ['unknown control',t=>t.observations[0].id='fake'],
 ['injected approval',t=>t.officialValidation=true],
 ['fake state',t=>t.observations[0].state='verified'],
 ['bad hash',t=>t.environment.archiveSha256='bad'],
 ['missing environment',t=>t.environment.docfaVersion=''],
 ['impossible date',t=>t.environment.date='2026-02-30'],
 ['oversize note',t=>t.observations[0].note='x'.repeat(1001)],
 ['hidden note',t=>{t.observations[0].state='unrecorded';}]
])test('manual register rejects '+label,()=>{
 const s=session(),t=filledRegister(s);edit(t);assert.equal(manualReviewRegister(s,t).ok,false);
});
test('manual register API accepts local declarations and rejects null, stale or foreign requests',async t=>{
 const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base='http://127.0.0.1:'+server.address().port,s=session(),obs=filledRegister(s);
 const post=(path,body,origin=base)=>fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const template=await post('/api/manual-docfa-register-template',s);assert.equal(template.status,200);
 assert.equal((await template.json()).template.snapshotDigest,obs.snapshotDigest);
 const checked=await post('/api/manual-docfa-register-check',{session:s,observations:obs});assert.equal(checked.status,200);
 assert.equal((await checked.json()).record.officialValidation,false);
 assert.equal((await post('/api/manual-docfa-register-check',{session:s,observations:null})).status,400);
 assert.equal((await post('/api/manual-docfa-register-check',{session:s,observations:obs},'https://example.invalid')).status,403);
 s.request.income[0].declared.consistency='5';
 assert.equal((await post('/api/manual-docfa-register-check',{session:s,observations:obs})).status,400);
});

 // [Codex] Reference recipient consumes only the v0.2 wire artifact, without the source session.
import {inspectGeometryHandoff} from '../packages/workbench/geometry-handoff-consumer.mjs';
import {buildGeometryHandoff as producerGeometryHandoff} from '../packages/workbench/geometry-handoff.mjs';
import {createHash as recipientHash} from 'node:crypto';
import {spawnSync as recipientSpawn} from 'node:child_process';
import {fileURLToPath as recipientPath} from 'node:url';
const recipientWire=(s,target='pianta-libera')=>producerGeometryHandoff(s,target).handoff;
const reseal=x=>{
  const {contentDigest,...payload}=x;
  return {...payload,contentDigest:recipientHash('sha256').update(JSON.stringify(payload),'utf8').digest('hex')};
};
for(const target of ['pianta-libera','mpe','ape-italia'])test('reference recipient round trip '+target,()=>{
  for(const scenario of scenarios){
    const q=make(scenario);
    const s={version:'0.1.0',kind:'synthetic-practice-session',request:{...q,geometry:[q.geometry],income:[q.income]}};
    const wire=recipientWire(s,target);
    assert.ok(wire);
    const result=inspectGeometryHandoff(JSON.stringify(wire,null,2),target);
    assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.preview.measuredCount,1);
    assert.equal(result.preview.units.length,wire.operations.length);
    assert.equal(result.preview.missingCount,wire.operations.length-1);
    assert.equal(result.preview.units.find(u=>u.state==='measured').areaMm2,'8000000');
    for(const flag of ['authenticated','sourceCaseReplayed','official','buildingCompliance','energyCertification','scaleVerified','cadastralArea'])assert.equal(result.preview[flag],false);
  }
});
test('reference recipient refuses wrong destination, malformed and oversized input',()=>{
  const wire=recipientWire(session());
  assert.equal(inspectGeometryHandoff(JSON.stringify(wire),'mpe').ok,false);
  assert.equal(inspectGeometryHandoff('{','pianta-libera').ok,false);
  assert.equal(inspectGeometryHandoff(' '.repeat(512*1024+1),'pianta-libera').ok,false);
  assert.equal(inspectGeometryHandoff(JSON.stringify(wire),'other').ok,false);
  wire.geometry[0].areaMm2='1';
  assert.equal(inspectGeometryHandoff(JSON.stringify(wire),'pianta-libera').error,'digest_mismatch');
});
for(const [name,edit] of [
 ['forged area',x=>x.geometry[0].areaMm2='1'],
 ['forged perimeter',x=>x.geometry[0].perimeterMm='1'],
 ['invalid contour',x=>x.geometry[0].contours=[[[0,0],[10,10],[20,0],[0,10]]]],
 ['invalid placement',x=>x.geometry[0].placement={floor:'X',xMm:0,yMm:0}],
 ['official assertion',x=>x.assertions.official=true],
 ['verified scale',x=>x.geometrySemantics.scaleVerified=true],
 ['wrong operation',x=>x.operations[0].operation='S'],
 ['missing geometry',x=>x.geometry.pop()],
 ['foreign geometry',x=>x.geometry[0].unitId='unknown'],
 ['duplicate operation',x=>x.operations.push(x.operations[0])],
 ['extra payload',x=>x.income=[]]
])test('reference recipient rejects resealed '+name,()=>{
  const wire=recipientWire(session());edit(wire);
  assert.equal(inspectGeometryHandoff(JSON.stringify(reseal(wire)),'pianta-libera').ok,false);
});
test('reference recipient CLI reads stdin and emits only diagnostic preview',()=>{
  const path=recipientPath(new URL('../scripts/inspect-geometry-handoff.mjs',import.meta.url));
  const input=JSON.stringify(recipientWire(session(),'mpe'));
  const good=recipientSpawn(process.execPath,[path,'mpe'],{input,encoding:'utf8',timeout:10000});
  assert.equal(good.status,0,good.stderr);
  assert.equal(JSON.parse(good.stdout).official,false);
  const bad=recipientSpawn(process.execPath,[path,'ape-italia'],{input,encoding:'utf8',timeout:10000});
  assert.equal(bad.status,1);assert.equal(bad.stdout,'');
});

// [Codex] Diagnostic DXF bridge; round trip through the restricted Catasto reader.
import {exportCadContour} from '../packages/workbench/cad-contour-export.mjs';
import {readSyntheticDxf as readExportedContour} from '../packages/workbench/synthetic-dxf.mjs';
test('CAD contour export round trips measured result geometry without metadata',()=>{
  const s=session(),before=JSON.stringify(s),g=replayPracticeSession(s).geometry[0];
  const out=exportCadContour({session:s,unitId:g.unitId});
  assert.equal(out.ok,true);assert.equal(out.areaMm2,g.areaMm2);assert.equal(out.perimeterMm,g.perimeterMm);
  assert.equal(out.official,false);assert.equal(out.placementIncluded,false);
  assert.equal(out.coordinateUnit,'mm');assert.ok(!out.dxf.includes(s.request.expectedDigest));
  const parsed=readExportedContour(out.dxf,'mm');
  assert.equal(parsed.ok,true);assert.deepEqual(parsed.vertices,g.vertices);
  assert.equal(JSON.stringify(s),before);
});
test('CAD contour export supports disjoint contours and rejects missing or stale data',()=>{
  const s=session(),g=s.request.geometry[0];
  g.vertices=[[[0,0],[4000,0],[4000,2000],[0,2000]],[[5000,0],[7000,0],[7000,1000],[5000,1000]]];
  delete g.calibration;
  const out=exportCadContour({session:s,unitId:g.unitId});
  assert.equal(out.ok,true);assert.equal(out.areaMm2,'10000000');
  // [Codex] Exact neutral exchange fixture used by Pianta Libera PR #111.
  const fixture=[
    '0','SECTION','2','ENTITIES',
    '0','LWPOLYLINE','100','AcDbEntity','8','SYNTH_CONTOUR_MM','100','AcDbPolyline','90','4','70','1',
    '10','0','20','0','10','4000','20','0','10','4000','20','2000','10','0','20','2000',
    '0','LWPOLYLINE','100','AcDbEntity','8','SYNTH_CONTOUR_MM','100','AcDbPolyline','90','4','70','1',
    '10','5000','20','0','10','7000','20','0','10','7000','20','1000','10','5000','20','1000',
    '0','ENDSEC','0','EOF',''
  ].join('\n');
  assert.equal(out.dxf,fixture);
  assert.deepEqual(readExportedContour(out.dxf,'mm').vertices,g.vertices);
  assert.equal(exportCadContour({session:s,unitId:'other'}).ok,false);
  assert.equal(exportCadContour({session:s,unitId:'missing'}).ok,false);
  assert.equal(exportCadContour({session:s,unitId:g.unitId,official:true}).ok,false);
  s.request.expectedDigest='0'.repeat(64);
  assert.equal(exportCadContour({session:s,unitId:g.unitId}).ok,false);
});
test('CAD contour endpoint is local-only and requires a measured result',async t=>{
  const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port,s=session();
  const post=(unitId,origin=base)=>fetch(base+'/api/cad-contour',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({session:s,unitId})});
  const good=await post(s.request.geometry[0].unitId);assert.equal(good.status,200);
  assert.equal((await good.json()).official,false);
  assert.equal((await post('other')).status,400);
  assert.equal((await post(s.request.geometry[0].unitId,'https://example.invalid')).status,403);
});

// [Codex] Offline comparison kit: six fixed scenarios and reproducible initial files.
import {buildOfflineComparisonKit,writeOfflineComparisonKit} from '../scripts/generate-docfa-comparison-kit.mjs';
import {mkdtemp as kitMkdtemp,readFile as kitRead,rm as kitRm} from 'node:fs/promises';
import {tmpdir as kitTmpdir} from 'node:os';
import {join as kitJoin} from 'node:path';
import {createHash as kitHash} from 'node:crypto';
test('offline kit contains six replayable cases, all reviews blank and hash-bound',()=>{
 const entries=buildOfflineComparisonKit(),manifest=JSON.parse(entries.get('manifest.json'));
 assert.equal(entries.size,26);
 assert.equal(manifest.cases.length,6);assert.equal(manifest.files.length,25);
 assert.equal(new Set(manifest.cases.map(c=>c.caseDigest)).size,6);
 for(const flag of ['officialValidation','officialExport','signature','submission'])assert.equal(manifest[flag],false);
 for(const f of manifest.files){const b=entries.get(f.name);assert.equal(b.length,f.bytes);assert.equal(kitHash('sha256').update(b).digest('hex'),f.sha256);}
 for(const c of manifest.cases){
   const get=name=>entries.get(c.scenario+'/'+name);
   const s=JSON.parse(get('sessione.json')),t=JSON.parse(get('riscontri-modello.json'));
   assert.equal(replayPracticeSession(s).ok,true);
   assert.equal(s.request.expectedDigest,c.caseDigest);
   assert.deepEqual(manualReviewRegister(s).template,t);
   assert.equal(t.snapshotDigest,c.snapshotDigest);assert.equal(c.checksPending,6);
   assert.ok(t.observations.every(o=>o.state==='unrecorded'));
   assert.ok(Object.values(t.environment).every(v=>v===''));
   assert.equal(get('pratica-non-ufficiale.zip').readUInt32LE(0),0x04034b50);
   assert.match(get('scheda-confronto.html').toString(),/NON UFFICIALE/);
 }
 assert.deepEqual(buildOfflineComparisonKit(),entries);
});
test('offline kit only creates a new directory, never overwrites an existing kit',async()=>{
 const temp=await kitMkdtemp(kitJoin(kitTmpdir(),'catasto-kit-'));
 try{
   const dest=kitJoin(temp,'new-kit');
   await writeOfflineComparisonKit(dest);
   const before=await kitRead(kitJoin(dest,'manifest.json'));
   await assert.rejects(writeOfflineComparisonKit(dest),{code:'EEXIST'});
   assert.deepEqual(await kitRead(kitJoin(dest,'manifest.json')),before);
   assert.deepEqual(before,buildOfflineComparisonKit().get('manifest.json'));
 }finally{await kitRm(temp,{recursive:true,force:true});}
});


// [Codex] Review reconciliation: actual kit sessions, not a second source of review rules.
import {summarizeOfflineReviews,readOfflineReviews} from '../scripts/summarize-docfa-reviews.mjs';
import {writeFile as reviewWrite} from 'node:fs/promises';
const kitReview=(kit,scenario,state='match_declared',partial=false)=>{
 const session=JSON.parse(kit.get(scenario+'/sessione.json'));
 const template=manualReviewRegister(session).template;
 const environment={date:'2026-01-01',docfaVersion:'SYNTHETIC',province:'SYNTH',
   archiveSha256:'a'.repeat(64),specificationReference:'synthetic-spec',localRunReference:'synthetic-run'};
 const observations=template.observations.map((o,i)=>partial&&i>0?o:{
   ...o,state,evidenceReference:'synthetic-evidence',note:'synthetic note'});
 const result=manualReviewRegister(session,{...template,environment,observations});
 assert.equal(result.ok,true);
 return result.record;
};
test('offline review summary distinguishes missing, partial, mismatch, and declared differences',()=>{
 const kit=buildOfflineComparisonKit();
 const fusion=kitReview(kit,'fusion','difference_declared');
 const partial=kitReview(kit,'division','match_declared',true);
 const wrong=structuredClone(fusion);
 wrong.officialValidation=true;
 const result=summarizeOfflineReviews(new Map([['fusion',fusion],['division',partial],['new_construction',wrong]]));
 assert.equal(result.expectedCases,6);assert.equal(result.expectedChecks,36);
 assert.equal(result.missing,3);assert.equal(result.invalid,1);
 assert.equal(result.partial,1);assert.equal(result.completeDeclared,1);
 assert.equal(result.unassessedChecks,29);
 assert.deepEqual(result.totals,{unrecorded:5,match_declared:1,difference_declared:6,not_applicable_declared:0});
 assert.equal(result.cases.find(c=>c.scenario==='fusion').differenceChecks.length,6);
 assert.equal(result.officialValidation,false);
 assert.doesNotMatch(JSON.stringify(result),/synthetic-evidence|synthetic note|synthetic-run/);
 // Wrong scenario with otherwise valid record and spoofed derived counts are rejected.
 const altered=structuredClone(fusion);altered.counts.difference_declared=0;
 assert.equal(summarizeOfflineReviews(new Map([['fusion',altered],['division',fusion]])).invalid,2);
});
test('all 36 declared comparisons do not establish official validation',()=>{
 const kit=buildOfflineComparisonKit();
 const result=summarizeOfflineReviews(new Map(scenarios.map(s=>[s,kitReview(kit,s)])));
 assert.equal(result.completeDeclared,6);assert.equal(result.unassessedChecks,0);
 assert.equal(result.totals.match_declared,36);
 for(const flag of ['officialValidation','officialExport','signature','submission'])assert.equal(result[flag],false);
});
test('offline review reader uses only fixed filenames and bounded input, without modifying records',async()=>{
 const root=await kitMkdtemp(kitJoin(kitTmpdir(),'catasto-reviews-'));
 try{
   const kit=buildOfflineComparisonKit();
   const bytes=JSON.stringify(kitReview(kit,'fusion'));
   await reviewWrite(kitJoin(root,'fusion.json'),bytes);
   await reviewWrite(kitJoin(root,'division.json'),Buffer.alloc(128*1024+1));
   await reviewWrite(kitJoin(root,'new_construction.json'),'{');
   await reviewWrite(kitJoin(root,'enlargement.json'),'null');
   await reviewWrite(kitJoin(root,'unrelated.json'),'not inspected');
   const result=await readOfflineReviews(root);
   assert.equal(result.completeDeclared,1);assert.equal(result.invalid,3);assert.equal(result.missing,2);
   assert.equal(await kitRead(kitJoin(root,'fusion.json'),'utf8'),bytes);
 }finally{await kitRm(root,{recursive:true,force:true});}
});


// [Codex] Verify the actual kit bytes before comparisons; a self-consistent altered manifest is not sufficient.
import {verifyOfflineComparisonKit} from '../scripts/verify-docfa-comparison-kit.mjs';
import {unlink as kitUnlink,mkdir as kitMkdir,symlink as kitLink} from 'node:fs/promises';
test('offline kit preflight detects missing, changed and non-file entries without rewriting them',async()=>{
 const root=await kitMkdtemp(kitJoin(kitTmpdir(),'catasto-preflight-'));
 try{
   const dest=kitJoin(root,'kit');
   await writeOfflineComparisonKit(dest);
   let result=await verifyOfflineComparisonKit(dest);
   assert.equal(result.canonical,true);assert.equal(result.identical,26);
   for(const flag of ['officialValidation','officialExport','signature','submission'])assert.equal(result[flag],false);
   const changed=kitJoin(dest,'fusion','sessione.json');
   const bytes=await kitRead(changed);
   bytes[0]^=1;await reviewWrite(changed,bytes);
   const manifestPath=kitJoin(dest,'manifest.json');
   const manifest=JSON.parse(await kitRead(manifestPath,'utf8'));
   manifest.files.find(x=>x.name==='fusion/sessione.json').sha256=kitHash('sha256').update(bytes).digest('hex');
   await reviewWrite(manifestPath,JSON.stringify(manifest,null,2)+'\n');
   const missing=kitJoin(dest,'division','scheda-confronto.html');
   await kitUnlink(missing);
   const directory=kitJoin(dest,'new_construction','riscontri-modello.json');
   await kitUnlink(directory);await kitMkdir(directory);
   await reviewWrite(kitJoin(dest,'unrelated.json'),'ignored');
   result=await verifyOfflineComparisonKit(dest);
   const states=Object.fromEntries(result.files.map(f=>[f.name,f.state]));
   assert.equal(result.canonical,false);assert.equal(result.identical,22);
   assert.equal(states['fusion/sessione.json'],'different');
   assert.equal(states['manifest.json'],'different');
   assert.equal(states['division/scheda-confronto.html'],'missing');
   assert.equal(states['new_construction/riscontri-modello.json'],'not_regular');
   assert.deepEqual(await kitRead(changed),bytes);
   assert.equal((await kitRead(kitJoin(dest,'unrelated.json'),'utf8')),'ignored');
 }finally{await kitRm(root,{recursive:true,force:true});}
});
test('offline kit preflight refuses a scenario directory link even if its target is canonical',async()=>{
 const root=await kitMkdtemp(kitJoin(kitTmpdir(),'catasto-preflight-link-'));
 try{
   const dest=kitJoin(root,'kit'),other=kitJoin(root,'other');
   await writeOfflineComparisonKit(dest);await writeOfflineComparisonKit(other);
   await kitRm(kitJoin(dest,'fusion'),{recursive:true});
   await kitLink(kitJoin(other,'fusion'),kitJoin(dest,'fusion'),process.platform==='win32'?'junction':'dir');
   const result=await verifyOfflineComparisonKit(dest);
   assert.equal(result.canonical,false);assert.equal(result.identical,22);
   assert.ok(result.files.filter(f=>f.name.startsWith('fusion/')).every(f=>f.state==='not_regular'));
 }finally{await kitRm(root,{recursive:true,force:true});}
});
