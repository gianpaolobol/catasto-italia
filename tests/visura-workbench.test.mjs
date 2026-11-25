// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {compareSyntheticVisura,syntheticVisuraExample} from '../packages/workbench/visura-comparison.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {createWorkbenchServer} from '../apps/workbench/server.mjs';
const fixture=()=>{
  const draft=syntheticCase('fusion'),claimId='u1-0';
  return {version:'0.1.0',kind:'synthetic-visura-check',draft,claimId,transcription:syntheticVisuraExample(draft,claimId)};
};
test('synthetic transcription compares but never promotes a claim',()=>{
  const input=fixture(),before=JSON.stringify(input),report=buildPracticeReport(input.draft);
  const result=compareSyntheticVisura(input);
  assert.equal(result.state,'transcription_matches_demo_claim');
  assert.equal(result.fields.rent.value,'123.45');
  assert.equal(result.fields.sheet.value,'0999');
  assert.equal(result.comparisons.length,4);
  assert.ok(result.comparisons.every(c=>c.status==='matches'));
  for(const key of ['operative','canExport','authenticated','identifierGroupingVerified'])assert.equal(result[key],false);
  assert.equal(JSON.stringify(input),before);
  assert.deepEqual(buildPracticeReport(input.draft),report);
});
test('different subaltern remains visible and blocks matching',()=>{
  const input=fixture();input.transcription.rows.find(r=>r.field==='subaltern').text='0001';
  const result=compareSyntheticVisura(input);
  assert.equal(result.state,'needs_review');
  assert.equal(result.comparisons.find(c=>c.field==='subaltern').status,'differs');
});
test('contradictory field is unresolved',()=>{
  const input=fixture();input.transcription.rows.push({field:'sheet',section:'identifier',page:1,line:99,text:'0998'});
  assert.equal(compareSyntheticVisura(input).comparisons.find(c=>c.field==='sheet').status,'unresolved');
});
test('missing classification is not silently accepted',()=>{
  const input=fixture();input.transcription.rows=input.transcription.rows.filter(r=>r.field!=='rent');
  assert.equal(compareSyntheticVisura(input).state,'needs_review');
});
test('reject proposed claim, source drift, date drift, non-demo municipality and malformed envelope',()=>{
  for(const modify of [x=>x.claimId='d1-0',x=>x.transcription.sourceId='synthetic-other',x=>x.transcription.asOf='2026-11-23',x=>x.transcription.rows[0].text='A001',x=>x.extra=true]){
    const input=fixture();modify(input);const result=compareSyntheticVisura(input);
    assert.equal(result.state,'blocked');assert.deepEqual(result.comparisons,[]);
  }
});
test('HTTP comparison and example are local with origin guard',async()=>{
  const server=createWorkbenchServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{
    const origin='http://127.0.0.1:'+server.address().port,input=fixture();
    const post=(path,body,source=origin)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:source},body:JSON.stringify(body)});
    const example=await post('/api/visura-example',{draft:input.draft,claimId:input.claimId});
    assert.equal(example.status,200);assert.deepEqual(await example.json(),input.transcription);
    const result=await post('/api/visura-check',input);
    assert.equal(result.status,200);assert.equal((await result.json()).state,'transcription_matches_demo_claim');
    assert.equal((await post('/api/visura-check',input,'http://example.invalid')).status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
