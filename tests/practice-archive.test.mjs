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
