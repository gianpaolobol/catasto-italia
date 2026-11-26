// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Diagnostic plan preview, no official drawing/scale claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import {measureSyntheticPolygon,syntheticPlanPreview} from '../packages/workbench/synthetic-geometry.mjs';
const report={kind:'synthetic-diagnostic-report',state:'research_candidate',operative:false,canExport:false,caseDigest:'a'.repeat(64),operations:[{unitId:'d1',operation:'C'},{unitId:'other',operation:'unchanged'}]};
const rectangle=[[100,200],[4100,200],[4100,2200],[100,2200]];
test('preview preserves aspect and translates drawing coordinates',()=>{
 const a=measureSyntheticPolygon(report,'d1',rectangle);
 assert.deepEqual(syntheticPlanPreview(report,a),{widthMm:4000,heightMm:2000,viewBox:'-200 -200 4400 2400',points:'0,2000 4000,2000 4000,0 0,0'});
});
for(const [name,change] of [
 ['stale digest',a=>a.caseDigest='b'.repeat(64)],
 ['forged area',a=>a.areaMm2='1'],
 ['forged area text',a=>a.areaM2='<script>'],
 ['forged perimeter',a=>a.perimeterMm='1'],
 ['wrong operation',a=>a.operation='V'],
 ['wrong unit',a=>a.unitId='other'],
 ['malformed coordinate',a=>a.vertices[0][0]='0" onload="alert(1)'],
 ['invalid topology',a=>a.vertices[2]=a.vertices[0]],
 ['blocked annex',a=>a.state='blocked']
])test('preview rejects '+name,()=>{
 const a=measureSyntheticPolygon(report,'d1',rectangle);change(a);
 assert.equal(syntheticPlanPreview(report,a),null);
});
test('preview rejects blocked case and missing annex',()=>{
 const a=measureSyntheticPolygon(report,'d1',rectangle);
 assert.equal(syntheticPlanPreview({...report,state:'blocked'},a),null);
 assert.equal(syntheticPlanPreview(report,null),null);
});
