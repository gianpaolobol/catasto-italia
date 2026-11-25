// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {syntheticCase,scenarios} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {buildSyntheticHandoff,verifySyntheticHandoff} from '../packages/workbench/synthetic-handoff.mjs';
import {validateSnapshot} from '../packages/building-core/index.mjs';
import {createWorkbenchServer} from '../apps/workbench/server.mjs';
const targets=['pianta-libera','mpe','ape-italia'];
for(const scenario of scenarios)for(const target of targets){
  test('diagnostic handoff '+scenario+' '+target,()=>{
    const c=syntheticCase(scenario),before=JSON.stringify(c),r=buildPracticeReport(c);
    const {ok,handoff:h}=buildSyntheticHandoff(c,target);
    assert.equal(ok,true);assert.equal(h.target,target);assert.equal(h.caseDigest,r.caseDigest);
    assert.equal(h.scope,'result-units-only');assert.equal(validateSnapshot(h.snapshot).valid,true);
    assert.deepEqual(h.operations,r.operations.filter(o=>['C','V'].includes(o.operation)).map(o=>({unitId:o.unitId,operation:o.operation})));
    assert.deepEqual(h.snapshot.units.map(u=>u.id),h.operations.map(o=>o.unitId));
    assert.equal(h.snapshot.units.some(u=>u.id==='other'),false);
    assert.deepEqual(h.assertions,{official:false,cadastralApproval:false,buildingCompliance:false,energyCertification:false});
    assert.match(h.contentDigest,/^[a-f0-9]{64}$/);
    assert.equal(verifySyntheticHandoff(c,target,JSON.parse(JSON.stringify(h))),true);
    assert.equal(JSON.stringify(c),before);
  });
}
test('blocked cases produce no payload',()=>{
  const c=syntheticCase('fusion');c.coverage.observedClaims.pop();
  assert.equal(buildSyntheticHandoff(c,'mpe').handoff,null);
  assert.equal(buildSyntheticHandoff(null,'mpe').handoff,null);
  assert.equal(buildSyntheticHandoff(syntheticCase('fusion'),'unknown').handoff,null);
});
test('replay rejects altered scope, digest, approval and target',()=>{
  const c=syntheticCase('division'),h=buildSyntheticHandoff(c,'mpe').handoff;
  for(const mutate of [x=>x.snapshot.units.pop(),x=>x.contentDigest='0'.repeat(64),x=>x.assertions.official=true,x=>x.target='ape-italia',x=>x.extra=true]){
    const received=structuredClone(h);mutate(received);
    assert.equal(verifySyntheticHandoff(c,'mpe',received),false);
  }
  assert.equal(verifySyntheticHandoff(c,'ape-italia',h),false);
  assert.equal(verifySyntheticHandoff(syntheticCase('fusion'),'mpe',h),false);
});
test('same-origin local handoff endpoint recomputes the case',async t=>{
  const s=createWorkbenchServer();s.listen(0,'127.0.0.1');await once(s,'listening');
  t.after(()=>new Promise(resolve=>{s.close(resolve);s.closeAllConnections();}));
  const base='http://127.0.0.1:'+s.address().port;
  const c=syntheticCase('internal_distribution');
  const opts={method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({target:'mpe',draft:c})};
  let res=await fetch(base+'/api/handoff',opts);assert.equal(res.status,200);
  assert.deepEqual(await res.json(),buildSyntheticHandoff(c,'mpe'));
  res=await fetch(base+'/api/handoff',{...opts,headers:{...opts.headers,Origin:'https://example.invalid'}});assert.equal(res.status,403);
  res=await fetch(base+'/api/handoff',{...opts,body:JSON.stringify({target:'mpe',draft:c,official:true})});assert.equal(res.status,400);
  c.coverage.observedClaims.pop();
  res=await fetch(base+'/api/handoff',{...opts,body:JSON.stringify({target:'mpe',draft:c})});assert.equal(res.status,200);assert.equal((await res.json()).handoff,null);
});
