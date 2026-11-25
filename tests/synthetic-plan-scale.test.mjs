// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Synthetic exact scale conversion; not cadastral validation.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {convertSyntheticPlanScale,measureSyntheticPolygon} from '../packages/workbench/synthetic-geometry.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
const sample=()=>({vertices:[[-20,-10],[20,-10],[20,10],[-20,10]],drawingLength:40,actualLengthMm:4000});
test('exact conversion with translated origin and measured resulting unit',()=>{
  const q=sample(),before=JSON.stringify(q),result=convertSyntheticPlanScale(q);
  assert.deepEqual(result,{ok:true,blocker:null,vertices:[[0,0],[4000,0],[4000,2000],[0,2000]]});
  const report=buildPracticeReport(syntheticCase('division'));
  const unit=report.operations.find(x=>x.operation==='C').unitId;
  const measured=measureSyntheticPolygon(report,unit,result.vertices);
  assert.equal(measured.state,'measured');assert.equal(measured.areaM2,'8.000000');
  assert.equal(measured.perimeterMm,'12000');assert.equal(JSON.stringify(q),before);
});
test('fractional scale accepted only when each resulting coordinate is an integer',()=>{
  const q={vertices:[[0,0],[4,0],[4,2],[0,2]],drawingLength:2,actualLengthMm:3};
  assert.deepEqual(convertSyntheticPlanScale(q).vertices,[[0,0],[6,0],[6,3],[0,3]]);
  q.vertices[2][1]=1;assert.equal(convertSyntheticPlanScale(q).blocker,'non_integral_millimetres');
});
for(const [name,change] of [
 ['zero length',q=>q.drawingLength=0],['negative length',q=>q.actualLengthMm=-1],
 ['numeric string',q=>q.drawingLength='40'],['fraction',q=>q.actualLengthMm=1.5],
 ['extra property',q=>q.verified=true],['coordinate bound',q=>q.vertices[0][0]=-10000001],
 ['overflow',q=>{q.drawingLength=1;q.actualLengthMm=10000000;}],
 ['non-integral',q=>{q.drawingLength=3;q.actualLengthMm=1;}],
 ['malformed point',q=>q.vertices[1]=[2]],['empty',q=>q.vertices=[]],
 ['sparse vertices',q=>delete q.vertices[1]],['sparse point',q=>delete q.vertices[1][0]]
]){
 test('reject '+name,()=>{const q=sample();change(q);const r=convertSyntheticPlanScale(q);assert.equal(r.ok,false);assert.equal(r.vertices,null);});
}
test('conversion never bypasses topology validation',()=>{
 const q=sample();q.vertices[2]=[21,10];const r=convertSyntheticPlanScale(q);assert.equal(r.ok,true);
 const report=buildPracticeReport(syntheticCase('division'));
 assert.equal(measureSyntheticPolygon(report,report.operations.find(x=>x.operation==='C').unitId,r.vertices).state,'blocked');
});
