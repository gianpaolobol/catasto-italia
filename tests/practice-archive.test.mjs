// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Integrated synthetic acceptance, not professional validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {reviewedVisuraExample,draftFromReviewedVisura} from '../packages/workbench/reviewed-visura.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {reopenVerifiedArchive} from '../packages/workbench/verified-archive-reopen.mjs';
import {buildPracticeArchive} from '../packages/workbench/practice-archive.mjs';
import {buildGeometryHandoff} from '../packages/workbench/geometry-handoff.mjs';
import {replayPracticeSession} from '../packages/workbench/integrated-dossier.mjs';
import {verifySyntheticHandoff} from '../packages/workbench/synthetic-handoff.mjs';
import {createWorkbenchServer} from '../apps/workbench/server.mjs';

const scenarios=[
 ['fusion',{S:2,C:1,V:0}],['division',{S:1,C:2,V:0}],['new_construction',{S:0,C:1,V:0}],
 ['internal_distribution',{S:0,C:0,V:1}],['destination_change',{S:1,C:1,V:0}],['enlargement',{S:1,C:1,V:0}]
];
function session(scenario){
  const trans=reviewedVisuraExample(scenario);
  for(const f of trans.factRows){f.declared='yes';f.transcribed='yes';}
  const draft=draftFromReviewedVisura(trans),r=buildPracticeReport(draft);
  const units=r.operations.filter(o=>['C','V'].includes(o.operation));
  return {version:'0.1.0',kind:'synthetic-practice-session',request:{
    draft,expectedState:r.state,expectedDigest:r.caseDigest,
    geometry:units.map((u,i)=>({unitId:u.unitId,vertices:[[0,0],[4000,0],[4000,2000],[0,2000]],placement:{floor:'P0',xMm:4000*i,yMm:0}})),
    income:units.map(u=>({unitId:u.unitId,declared:{category:'A/2',classNumber:'2',zone:'SYNTH-1',consistency:'4.5',tariff:'123.4567',unit:'vani',sourceId:'synthetic-tariff'}}))
  }};
}
// Independent local header/CRC verification; real Python zipfile also exercises browser download.
function files(b){
  const out=new Map();let p=0;
  while(b.readUInt32LE(p)===0x04034b50){
    assert.equal(b.readUInt16LE(p+8),0);
    const size=b.readUInt32LE(p+18),len=b.readUInt16LE(p+26),extra=b.readUInt16LE(p+28);
    const name=b.subarray(p+30,p+30+len).toString('ascii'),start=p+30+len+extra,bytes=b.subarray(start,start+size);
    let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}assert.equal((crc^0xffffffff)>>>0,b.readUInt32LE(p+14));assert.ok(!out.has(name));out.set(name,bytes);p=start+size;
  }
  assert.equal(b.readUInt32LE(p),0x02014b50);
  assert.equal(b.readUInt32LE(b.length-22),0x06054b50);assert.equal(b.readUInt16LE(b.length-12),out.size);
  return out;
}
for(const [scenario,expected] of scenarios)test('complete reviewed diagnostic archive '+scenario,()=>{
  const s=session(scenario),before=JSON.stringify(s),a=buildPracticeArchive(s);assert.equal(a.ok,true,a.error);
  assert.deepEqual(buildPracticeArchive(s).bytes,a.bytes);assert.equal(JSON.stringify(s),before);
  const z=files(a.bytes);assert.equal(z.size,8);const get=name=>JSON.parse(z.get(name).toString('utf8'));
  const m=get('manifest.json'),r=get('rapporto-sintetico.json');assert.deepEqual(r.candidate.counts,expected);
  assert.equal(r.operative,false);assert.equal(m.official,false);assert.equal(m.signature,false);assert.equal(m.submission,false);
  assert.equal(m.caseDigest,r.caseDigest);assert.equal(m.files.length,7);
  for(const row of m.files){const b=z.get(row.name);assert.equal(row.bytes,b.length);assert.equal(row.sha256,createHash('sha256').update(b).digest('hex'));}
  const replay=replayPracticeSession(get('sessione-sintetica.json'));assert.equal(replay.ok,true);
  assert.deepEqual(replay.report,r);assert.ok(replay.geometry.every(g=>g.areaM2==='8.000000'));
  assert.ok(replay.income.every(i=>i.exactProductEur==='555.5551500'));
  assert.match(z.get('dossier-sintetico.html').toString(),/SIMULAZIONE SINTETICA — NON UFFICIALE/);
  for(const target of ['pianta-libera','mpe','ape-italia'])assert.equal(verifySyntheticHandoff(s.request.draft,target,get('interscambio-'+target+'.json')),true);
});
test('archive fails closed on stale digest, invalid annex or unreviewed declaration',()=>{
  for(const mutate of [s=>s.request.expectedDigest='0'.repeat(64),s=>s.request.geometry[0].vertices=[],s=>s.request.draft.assertions.pop(),s=>s.approved=true]){
    const s=session('fusion');mutate(s);const result=buildPracticeArchive(s);assert.equal(result.ok,false);assert.equal(result.bytes,null);
  }
});
test('loopback ZIP download and origin protection',async t=>{
  const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(session('fusion'))};
  const response=await fetch(base+'/api/archive',opts);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/application\/zip/);
  assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(files(Buffer.from(await response.arrayBuffer())).size,8);
  assert.equal((await fetch(base+'/api/archive',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}})).status,403);
});

// [Codex] Combined retained geometry and archive replay: context must not leak into result-only handoffs.
test('retained unit survives ZIP replay without becoming a handoff operation',()=>{
  const s=session('division'),r=buildPracticeReport(s.request.draft),other=r.operations.find(o=>o.operation==='unchanged');
  assert.ok(other);
  s.request.geometry.push({unitId:other.unitId,vertices:[[0,0],[1000,0],[1000,1000],[0,1000]],placement:{floor:'P0',xMm:8000,yMm:0}});
  const a=buildPracticeArchive(s);assert.equal(a.ok,true,a.error);
  const z=files(a.bytes),get=n=>JSON.parse(z.get(n).toString('utf8'));
  const replay=replayPracticeSession(get('sessione-sintetica.json'));assert.equal(replay.ok,true);
  assert.equal(replay.geometry.find(g=>g.unitId===other.unitId).operation,'unchanged');
  assert.match(z.get('dossier-sintetico.html').toString(),/Conservata — contesto/);
  for(const target of ['pianta-libera','mpe','ape-italia']){
    const h=get('interscambio-'+target+'.json');assert.ok(!h.operations.some(o=>o.unitId===other.unitId));assert.equal(verifySyntheticHandoff(s.request.draft,target,h),true);
  }
  delete s.request.geometry.at(-1).placement;assert.equal(buildPracticeArchive(s).ok,false);
});

test('canonical archive reopen across six scenarios and rejection of tampering',async()=>{
  const regenerate=async s=>{const r=buildPracticeArchive(s);if(!r.ok)throw Error('blocked');return r.bytes;};
  for(const [scenario] of scenarios){
    const original=session(scenario),bytes=await regenerate(original);
    assert.deepEqual(await reopenVerifiedArchive(bytes,regenerate),original);
    for(const index of [0,6,8,18,26,30,bytes.length-1,Math.floor(bytes.length/2)]){
      const altered=Buffer.from(bytes);altered[index]^=1;
      await assert.rejects(()=>reopenVerifiedArchive(altered,regenerate));
    }
    await assert.rejects(()=>reopenVerifiedArchive(Buffer.concat([bytes,Buffer.from('extra')]),regenerate));
    await assert.rejects(()=>reopenVerifiedArchive(bytes.subarray(0,bytes.length-1),regenerate));
  }
  await assert.rejects(()=>reopenVerifiedArchive(new Uint8Array(8*1024*1024+1),regenerate));
});

test('geometry handoff projects only replayed result units for all targets and scenarios',()=>{
  for(const [scenario] of scenarios){
    const s=session(scenario),before=JSON.stringify(s),replay=replayPracticeSession(s);
    for(const target of ['pianta-libera','mpe','ape-italia']){
      const result=buildGeometryHandoff(s,target);assert.equal(result.ok,true,result.error);
      const h=result.handoff,{contentDigest,...payload}=h;
      assert.equal(h.version,'0.2.0');assert.equal(h.target,target);
      assert.equal(contentDigest,createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
      assert.deepEqual(h.geometry.map(g=>g.unitId),h.operations.map(o=>o.unitId));
      assert.ok(h.geometry.every(g=>g.state==='measured'&&g.areaMm2==='8000000'&&g.coordinateUnit==='mm'));
      assert.deepEqual(h.geometry.map(g=>g.placement),replay.geometry.map(g=>g.placement));
      assert.ok(Object.values(h.assertions).every(v=>v===false));
      assert.equal(h.geometrySemantics.scaleVerified,false);
      assert.equal(Object.hasOwn(h,'income'),false);
    }
    assert.equal(JSON.stringify(s),before);
  }
});
test('geometry handoff marks missing and unplaced units and omits retained context',()=>{
  const s=session('division');
  s.request.geometry.pop();delete s.request.geometry[0].placement;
  s.request.geometry.push({unitId:'other',vertices:[[0,0],[1000,0],[1000,1000],[0,1000]],placement:{floor:'P0',xMm:8000,yMm:0}});
  const r=buildGeometryHandoff(s,'pianta-libera');assert.equal(r.ok,true,r.error);
  assert.equal(r.handoff.geometry[0].placement,null);
  assert.deepEqual(r.handoff.geometry[1],{unitId:'d2',state:'missing'});
  assert.ok(!r.handoff.geometry.some(g=>g.unitId==='other'));
  s.request.geometry[0].areaMm2='999';assert.equal(buildGeometryHandoff(s,'pianta-libera').ok,false);
  assert.equal(buildGeometryHandoff(session('fusion'),'invalid').ok,false);
});
test('geometry handoff loopback route and origin guard',async t=>{
  const server=createWorkbenchServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const options={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({target:'mpe',session:session('fusion')})};
  const r=await fetch(base+'/api/geometry-handoff',options);assert.equal(r.status,200);assert.equal((await r.json()).handoff.geometry.length,1);
  assert.equal((await fetch(base+'/api/geometry-handoff',{...options,headers:{...options.headers,Origin:'https://example.invalid'}})).status,403);
  assert.equal((await fetch(base+'/api/geometry-handoff',{...options,body:'{}'})).status,400);
});

// [Codex] 108 complete, structurally distinct synthetic cases.
// Acceptance expectations are authored separately from the production report,
// geometry and worksheet calculators. This is not professional/DOCFA validation.
const rect=(w,h)=>[[0,0],[w,0],[w,h],[0,h]];
const geometryProfiles=[
 {name:'rectangle',vertices:rect(4000,2000),area:'8000000',perimeter:'12000',floor:'P0'},
 {name:'concave-L',vertices:[[0,0],[4000,0],[4000,1000],[2000,1000],[2000,3000],[0,3000]],area:'8000000',perimeter:'14000',floor:'P0'},
 {name:'disjoint',vertices:[rect(4000,2000),[[5000,0],[7000,0],[7000,1000],[5000,1000]]],area:'10000000',perimeter:'18000',floor:'P1'},
 {name:'clockwise',vertices:rect(3000,1500).reverse(),area:'4500000',perimeter:'9000',floor:'S1'},
 {name:'calibrated',vertices:rect(4000,2000),area:'8000000',perimeter:'12000',floor:'P0',calibration:{vertices:[[-20,-10],[20,-10],[20,10],[-20,10]],drawingLength:40,actualLengthMm:4000}},
 {name:'separate-floors',vertices:rect(2500,3000),area:'7500000',perimeter:'11000',floor:'P2'}
];
const incomeProfiles=[
 {category:'A/2',classNumber:'2',consistency:'4.5',tariff:'123.4567',unit:'vani',product:'555.5551500'},
 {category:'B/1',classNumber:'1',consistency:'30',tariff:'2.125',unit:'m3',product:'63.7500000'},
 {category:'C/2',classNumber:'3',consistency:'12.5',tariff:'4',unit:'m2',product:'50.0000000'}
];
function acceptanceFixture(scenario,p,k){
 const trans=reviewedVisuraExample(scenario), target={...trans.coverage.parcel};
 for(const f of trans.factRows){f.declared='yes';f.transcribed='yes';}
 // Author inventory and independent coverage rows explicitly; never derive
 // expected operations from buildPracticeReport or measured geometry.
 const expected={S:scenario==='fusion'?['u1','u2']:['division','destination_change','enlargement'].includes(scenario)?['u1']:[],
  C:scenario==='division'?['d1','d2']:scenario==='internal_distribution'?[]:['d1'],
  V:scenario==='internal_distribution'?['u1']:[],unchanged:['other']};
 const add=(group,unitId,subalterns,parcel)=>{
  const claims=subalterns.map((subaltern,i)=>({claimId:unitId+'-'+i,identifier:{...parcel,subaltern}}));
  group.push({unitId,claims});
  if(group===trans.observedUnits&&parcel.parcel===target.parcel){
   for(const c of claims)trans.coverage.observedClaims.push({claimId:c.claimId,identifier:{...c.identifier}});
  }
 };
 // Three inventory structures: base result cardinality, expanded cardinality
 // where supported, and expanded graffature where supported.
 if(p>0&&scenario==='fusion'){
  add(trans.observedUnits,'u3',['20'],target);trans.originIds.push('u3');expected.S.push('u3');
 }
 if(p>0&&['division','new_construction'].includes(scenario)){
  add(trans.proposedUnits,'d3',['21'],target);expected.C.push('d3');
 }
 if(p===2&&['fusion','division','new_construction'].includes(scenario)){
  const d=trans.proposedUnits.find(u=>u.unitId==='d1');
  d.claims.push({claimId:'d1-extra',identifier:{...target,subaltern:'30'}});
 }
 // Each k has a distinct number of retained units. p varies their claim
 // multiplicity and scope; new construction never adds an observed target unit.
 for(let i=0;i<=k;i++){
  const unitId='context-'+i, parcel=scenario==='new_construction'||p===1?{...target,parcel:'0902'}:target;
  const subs=Array.from({length:p+1},(_,j)=>String(100+10*i+j));
  add(trans.observedUnits,unitId,subs,parcel);expected.unchanged.push(unitId);
 }
 const draft=draftFromReviewedVisura(trans),report=buildPracticeReport(draft);
 const shape=geometryProfiles[k],resultIds=[...expected.C,...expected.V], all=[...resultIds,...expected.unchanged];
 const geometry=all.map((unitId,i)=>({unitId,vertices:structuredClone(shape.vertices),
  placement:{floor:k===5?(i%2?'P1':'P2'):shape.floor,xMm:i*10000,yMm:0},
  ...(shape.calibration?{calibration:structuredClone(shape.calibration)}:{})}));
 const income=resultIds.map((unitId,i)=>{
  const {product,...fields}=incomeProfiles[(p+i)%incomeProfiles.length];
  return {unitId,declared:{...fields,zone:'SYNTH-1',sourceId:'synthetic-tariff'}};
 });
 return {trans,expected,shape,resultIds,all,session:{version:'0.1.0',kind:'synthetic-practice-session',request:{
  draft,expectedState:'research_candidate',expectedDigest:report.caseDigest,geometry,income}}};
}
const corpusIds=new Set();
const regenerateCorpus=async s=>{const a=buildPracticeArchive(s);assert.equal(a.ok,true,a.error);return a.bytes;};
for(const [scenario] of scenarios)for(let p=0;p<3;p++)for(let k=0;k<6;k++){
 const name='acceptance '+scenario+' inventory-'+p+' '+geometryProfiles[k].name;
 test(name+' complete reviewed practice',async()=>{
  const f=acceptanceFixture(scenario,p,k),s=f.session,q=s.request,before=JSON.stringify(s);
  const r=buildPracticeReport(q.draft);
  assert.equal(r.state,'research_candidate',JSON.stringify(r.blockers));
  assert.ok(!corpusIds.has(r.caseDigest),'duplicate cadastral draft');corpusIds.add(r.caseDigest);
  assert.deepEqual(r.candidate.counts,{S:f.expected.S.length,C:f.expected.C.length,V:f.expected.V.length});
  for(const op of ['S','C','V','unchanged'])assert.deepEqual(r.operations.filter(o=>o.operation===op).map(o=>o.unitId),f.expected[op]);
  assert.equal(r.evidence.length,f.trans.factRows.length);assert.ok(r.relation);
  assert.equal(r.operative,false);assert.equal(r.canExport,false);assert.equal(r.availability,'unverified');
  const replay=replayPracticeSession(s);assert.equal(replay.ok,true,replay.error);
  assert.deepEqual(replay.geometry.map(g=>g.unitId),f.all);
  for(const g of replay.geometry){assert.equal(g.areaMm2,f.shape.area);assert.equal(g.perimeterMm,f.shape.perimeter);}
  assert.deepEqual(replay.income.map(i=>i.unitId),f.resultIds);
  for(const [i,row] of replay.income.entries()){
   assert.equal(row.exactProductEur,incomeProfiles[(p+i)%incomeProfiles.length].product);
   assert.equal(row.officialTariffVerified,false);
  }
  const a=await regenerateCorpus(s),z=files(a);
  assert.equal(z.size,8);const get=n=>JSON.parse(z.get(n).toString('utf8'));
  const manifest=get('manifest.json');assert.equal(manifest.official,false);assert.equal(manifest.signature,false);assert.equal(manifest.submission,false);
  assert.equal(manifest.caseDigest,r.caseDigest);assert.equal(manifest.files.length,7);
  for(const row of manifest.files){const b=z.get(row.name);assert.equal(row.bytes,b.length);assert.equal(row.sha256,createHash('sha256').update(b).digest('hex'));}
  assert.deepEqual(get('rapporto-sintetico.json'),r);
  assert.match(z.get('dossier-sintetico.html').toString(),/NON UFFICIALE/);
  assert.deepEqual(await reopenVerifiedArchive(a,regenerateCorpus),s);
  for(const target of ['pianta-libera','mpe','ape-italia']){
   const h=get('interscambio-'+target+'.json');
   assert.deepEqual(h.operations.map(o=>o.unitId),f.resultIds);
   const g=buildGeometryHandoff(s,target);assert.equal(g.ok,true,g.error);
   assert.deepEqual(g.handoff.geometry.map(o=>o.unitId),f.resultIds);
   for(const row of g.handoff.geometry){assert.equal(row.areaMm2,f.shape.area);assert.equal(row.perimeterMm,f.shape.perimeter);}
  }
  assert.equal(JSON.stringify(s),before);
 });
 test(name+' cross-check contradiction and archive tamper',async()=>{
  const f=acceptanceFixture(scenario,p,k),s=f.session;
  // Documentary contradiction without changing the case digest: must block
  // proposal, dossier export and all handoffs, not silently reconcile evidence.
  const trans=structuredClone(f.trans);trans.factRows[0].transcribed='no';
  const bad=structuredClone(s);bad.request.draft=draftFromReviewedVisura(trans);
  const r=buildPracticeReport(bad.request.draft);
  assert.equal(r.state,'blocked');assert.equal(r.candidate,null);assert.deepEqual(r.operations,[]);
  assert.equal(buildPracticeArchive(bad).ok,false);
  assert.equal(buildGeometryHandoff(bad,'mpe').ok,false);
  const bytes=await regenerateCorpus(s),altered=Buffer.from(bytes);altered[altered.length-1]^=1;
  await assert.rejects(()=>reopenVerifiedArchive(altered,regenerateCorpus));
 });
}
