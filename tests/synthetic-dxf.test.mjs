// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Synthetic fixtures only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSyntheticDxf,syntheticDxfExample} from '../packages/workbench/synthetic-dxf.mjs';
import {measureSyntheticPolygon} from '../packages/workbench/synthetic-geometry.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeArchive} from '../packages/workbench/practice-archive.mjs';
const poly=(points,extra=[])=>[[0,'LWPOLYLINE'],[8,'SYNTH'],[90,points.length],[70,1],...extra,...points.flatMap(([x,y])=>[[10,x],[20,y]])];
const file=(...p)=>[[0,'SECTION'],[2,'ENTITIES'],...p.flat(),[0,'ENDSEC'],[0,'EOF']].flat().join('\n')+'\n';
const rect=[[-1,-2],[3,-2],[3,0],[-1,0]];
test('metres convert exactly, preserve relative placement and rebase common local origin',()=>{
 const r=readSyntheticDxf(file(poly(rect),poly([[4,-2],[5,-2],[5,0],[4,0]])),'m');
 assert.equal(r.ok,true);assert.deepEqual(r.originMm,[-1000,-2000]);assert.deepEqual(r.vertices,[[[0,0],[4000,0],[4000,2000],[0,2000]],[[5000,0],[6000,0],[6000,2000],[5000,2000]]]);
 const draft=syntheticCase('fusion'),report=buildPracticeReport(draft),id=report.operations.find(o=>o.operation==='C').unitId;
 const m=measureSyntheticPolygon(report,id,r.vertices);assert.equal(m.state,'measured');assert.equal(m.areaM2,'10.000000');assert.equal(m.perimeterMm,'18000');
 const session={version:'0.1.0',kind:'synthetic-practice-session',request:{draft,expectedState:report.state,expectedDigest:report.caseDigest,geometry:[{unitId:id,vertices:r.vertices}],income:[]}};
 assert.equal(buildPracticeArchive(session).ok,true);
});
test('CRLF, exact decimal millimetres and downloadable example',()=>{
 const r=readSyntheticDxf(file(poly([[0.001,0],[4.001,0],[4.001,2],[0.001,2]])).replace(/\n/g,'\r\n'),'m');
 assert.equal(r.ok,true);assert.deepEqual(r.vertices,[[0,0],[4000,0],[4000,2000],[0,2000]]);
 assert.deepEqual(readSyntheticDxf(syntheticDxfExample(),'mm').vertices,r.vertices);
});
test('unsupported entities, sections, flags, coordinates and transformations fail closed',()=>{
 const good=file(poly(rect));
 for(const bad of [good.replace('LWPOLYLINE','LINE'),good.replace('ENTITIES','BLOCKS'),good.replace('\n70\n1\n','\n70\n0\n'),good.replace('\n90\n4\n','\n90\n5\n'),file(poly(rect,[[42,1]])),file(poly(rect,[[43,1]])),file(poly(rect,[[230,-1]])),file(poly(rect,[[67,1]])),file(poly(rect,[[410,'Layout1']])),file(poly(rect,[[999,'unknown']])),good+'0\nEOF\n',good.replace('\n10\n-1\n','\n10\n0.0001\n'),'\0'+good,'a'.repeat(65537)])assert.equal(readSyntheticDxf(bad,'m').ok,false,bad.slice(0,100));
 assert.equal(readSyntheticDxf(good,'cm').ok,false);
});
test('parsed contours still require topology validation; diagonal and touching rejected',()=>{
 const report=buildPracticeReport(syntheticCase('fusion')),id=report.operations.find(o=>o.operation==='C').unitId;
 for(const p of [file(poly([[0,0],[4,0],[3,2],[0,2]])),file(poly(rect),poly([[3,-2],[5,-2],[5,0],[3,0]]))]){
  const r=readSyntheticDxf(p,'m');assert.equal(r.ok,true);assert.equal(measureSyntheticPolygon(report,id,r.vertices).state,'blocked');
 }
});
