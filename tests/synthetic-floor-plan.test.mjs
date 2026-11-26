// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {buildIntegratedDossier,replayPracticeSession} from '../packages/workbench/integrated-dossier.mjs';
import {syntheticFloorPlans,validPlacement} from '../packages/workbench/synthetic-floor-plan.mjs';
const make=()=>{
 const draft=syntheticCase('division'),r=buildPracticeReport(draft),ids=r.operations.filter(o=>o.operation==='C').map(o=>o.unitId);
 return {draft,expectedState:r.state,expectedDigest:r.caseDigest,income:[],geometry:ids.map((unitId,i)=>({unitId,vertices:[[0,0],[4000,0],[4000,2000],[0,2000]],placement:{floor:'P0',xMm:i*4000,yMm:0}}))};
};
const replay=q=>replayPracticeSession({version:'0.1.0',kind:'synthetic-practice-session',request:q});
test('explicit common plane retains adjacent unit positions and session replay',()=>{
 const q=make(),r=replay(q);assert.equal(r.ok,true);
 const p=syntheticFloorPlans(r.report,r.geometry);assert.equal(p.floors.length,1);
 assert.equal(p.floors[0].widthMm,8000);assert.equal(p.floors[0].heightMm,2000);
 assert.deepEqual(p.floors[0].potentialOverlaps,[]);
 assert.deepEqual(p.floors[0].units[1].polygons,['4000,2000 8000,2000 8000,0 4000,0']);
 assert.match(buildIntegratedDossier(q).html,/Schema diagnostico per piano/);
});
test('floor separation, independent local units, and conservative overlap warning',()=>{
 const q=make();q.geometry[1].placement.xMm=1000;let r=replay(q);
 assert.equal(syntheticFloorPlans(r.report,r.geometry).floors[0].potentialOverlaps.length,1);
 q.geometry[1].placement.floor='P1';r=replay(q);
 assert.equal(syntheticFloorPlans(r.report,r.geometry).floors.length,2);
 delete q.geometry[1].placement;r=replay(q);
 assert.deepEqual(syntheticFloorPlans(r.report,r.geometry).unplaced,[q.geometry[1].unitId]);
});
test('malformed placement and forged measurements rejected',()=>{
 const q=make();
 for(const p of [null,{floor:'P0',xMm:0,yMm:1.5},{floor:'<svg>',xMm:0,yMm:0},{floor:'P0',xMm:10000001,yMm:0},{floor:'P0',xMm:0,yMm:0,verified:true}]){
  assert.equal(validPlacement(p),false);q.geometry[0].placement=p;assert.equal(replay(q).ok,false);
 }
 q.geometry[0].placement={floor:'S1',xMm:-2000,yMm:0};const r=replay(q);assert.equal(r.ok,true);
 r.geometry[0].areaM2='1';assert.equal(syntheticFloorPlans(r.report,r.geometry),null);
});
