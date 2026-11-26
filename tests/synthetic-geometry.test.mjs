// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {measureSyntheticPolygon} from '../packages/workbench/synthetic-geometry.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
const rectangle=[[0,0],[4000,0],[4000,3000],[0,3000]];
const concave=[[0,0],[4000,0],[4000,1000],[2000,1000],[2000,3000],[0,3000]];
const result=(scenario='fusion')=>buildPracticeReport(syntheticCase(scenario));
for(const scenario of ['fusion','division','new_construction','internal_distribution'])test('geometry annex follows current '+scenario+' report',()=>{
  const report=result(scenario),op=report.operations.find(o=>['C','V'].includes(o.operation));
  assert.ok(op);
  const measured=measureSyntheticPolygon(report,op.unitId,concave);
  assert.equal(measured.state,'measured');
  assert.equal(measured.areaM2,'8.000000');
  assert.equal(measured.caseDigest,report.caseDigest);
  assert.equal(measured.operation,op.operation);
  assert.equal(report.canExport,false);
  assert.equal(measured.kind,'synthetic-geometry-annex');
});
const fake={kind:'synthetic-diagnostic-report',state:'research_candidate',operative:false,canExport:false,caseDigest:'a'.repeat(64),operations:[{unitId:'d1',operation:'C'},{unitId:'u1',operation:'S'},{unitId:'other',operation:'unchanged'}]};
const measure=points=>measureSyntheticPolygon(fake,'d1',points);
test('exact rectangle area and perimeter',()=>{const r=measure(rectangle);assert.equal(r.areaMm2,'12000000');assert.equal(r.areaM2,'12.000000');assert.equal(r.perimeterMm,'14000');});
test('concavity, winding and translation',()=>{for(const points of [concave,concave.slice().reverse(),concave.map(([x,y])=>[x+1000,y+2000])]){assert.equal(measure(points).areaMm2,'8000000');assert.equal(measure(points).perimeterMm,'14000');}});
test('single square millimetre exact',()=>assert.equal(measure([[0,0],[1,0],[1,1],[0,1]]).areaM2,'0.000001'));
test('large valid coordinates do not lose precision',()=>assert.equal(measure([[0,0],[10000000,0],[10000000,10000000],[0,10000000]]).areaMm2,'100000000000000'));
test('blocked or operative report cannot produce annex',()=>{for(const report of [null,{...fake,state:'blocked'},{...fake,canExport:true},{...fake,caseDigest:'bad'}])assert.equal(measureSyntheticPolygon(report,'d1',rectangle).blocker,'current_research_report_required');});
test('unrelated or ambiguous units cannot produce annex',()=>{for(const id of ['u1','other','missing'])assert.equal(measureSyntheticPolygon(fake,id,rectangle).blocker,'result_unit_required');assert.equal(measureSyntheticPolygon({...fake,operations:[...fake.operations,fake.operations[0]]},'d1',rectangle).blocker,'result_unit_required');});
test('non-simple or diagonal contours fail closed',()=>{
 for(const points of [[[0,0],[4,0],[4,4],[2,4],[2,1],[5,1],[5,5],[0,5]],[[0,0],[4,0],[5,4],[0,4]],[[0,0],[4,0],[2,0],[2,4],[0,4]], [...rectangle,rectangle[0]]]){
   const r=measure(points);assert.equal(r.state,'blocked');assert.equal(r.areaMm2,null);assert.equal(r.vertices,null);
 }
});
test('invalid coordinates and sparse arrays fail closed',()=>{for(const points of [null,[],Array(4),[[0,0],[3,0],[3,3],Array(2)],[[0,0],[3.1,0],[3,3],[0,3]],[[0,0],[10000001,0],[3,3],[0,3]],Array(129).fill([0,0])])assert.equal(measure(points).blocker,'invalid_vertices');});
test('independent rectangle oracle, 100 synthetic dimensions (not whole practices)',()=>{for(let i=1;i<=100;i++){const w=i*137,h=10001-i*53;const r=measure([[0,0],[w,0],[w,h],[0,h]]);assert.equal(r.areaMm2,String(w*h));assert.equal(r.perimeterMm,String(2*(w+h)));}});

// [Codex] A conversion is a declaration, not a verified scale.
test('geometry calibration replays exact vertices and preserves immutable provenance',()=>{
 const input={vertices:[[-20,-10],[20,-10],[20,10],[-20,10]],drawingLength:40,actualLengthMm:4000};
 const points=[[0,0],[4000,0],[4000,2000],[0,2000]];
 const r=measureSyntheticPolygon(fake,'d1',points,input);assert.equal(r.state,'measured');assert.equal(r.areaM2,'8.000000');assert.deepEqual(r.calibration,input);
 input.vertices[0][0]=0;assert.equal(r.calibration.vertices[0][0],-20);
 assert.equal(measureSyntheticPolygon(fake,'d1',points,{...input,actualLengthMm:8000}).state,'blocked');
 assert.equal(measureSyntheticPolygon(fake,'d1',points,{...input,verified:true}).blocker,'invalid_calibration');
 assert.equal(Object.hasOwn(measure(points),'calibration'),false);
});
