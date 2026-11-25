// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarios,syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
const expected={
 fusion:{S:2,C:1,V:0}, division:{S:1,C:2,V:0},
 new_construction:{S:0,C:1,V:0}, internal_distribution:{S:0,C:0,V:1},
 destination_change:{S:1,C:1,V:0}, enlargement:{S:1,C:1,V:0}
};
function verifyBlocked(r){
 assert.equal(r.state,'blocked');
 assert.equal(r.candidate,null);
 assert.deepEqual(r.operations,[]);
 assert.deepEqual(r.evidence,[]);
 assert.equal(r.relation,null);
 assert.equal(r.operative,false);
 assert.equal(r.canExport,false);
 assert.ok(r.blockers.length>0);
}
for(const scenario of scenarios){
 test('matrix baseline '+scenario,()=>{
   const c=syntheticCase(scenario);
   const before=JSON.stringify(c);
   const r=buildPracticeReport(c);
   assert.equal(r.state,'research_candidate');
   assert.deepEqual(r.candidate.counts,expected[scenario]);
   const unchanged=r.operations.filter(x=>x.operation==='unchanged');
   assert.equal(unchanged.length,1);
   assert.equal(unchanged[0].unitId,'other');
   assert.equal(r.operative,false);
   assert.equal(r.canExport,false);
   assert.equal(r.availability,'unverified');
   assert.equal(JSON.stringify(c),before);
 });
 // Every prerequisite is independently exercised. Unknown/no are paired
 // with the corresponding synthetic assertion, not a contradictory source.
 for(const fact of Object.keys(syntheticCase(scenario).input.facts)){
   for(const value of ['unknown','no']){
     test('matrix '+scenario+' '+fact+' '+value,()=>{
       const c=syntheticCase(scenario);
       c.input.facts[fact].value=value;
       c.assertions.find(a=>a.fact===fact).value=value;
       verifyBlocked(buildPracticeReport(c));
     });
   }
   test('matrix '+scenario+' missing evidence '+fact,()=>{
     const c=syntheticCase(scenario);
     c.assertions=c.assertions.filter(a=>a.fact!==fact);
     verifyBlocked(buildPracticeReport(c));
   });
 }
 test('matrix '+scenario+' conflicting evidence',()=>{
   const c=syntheticCase(scenario);
   c.assertions[0].value='no';
   verifyBlocked(buildPracticeReport(c));
 });
 test('matrix '+scenario+' missing observed coverage',()=>{
   const c=syntheticCase(scenario);
   // A previously empty parcel can legitimately have zero observed claims.
   // In that case inject an unsupported claim instead.
   if(c.coverage.observedClaims.length)c.coverage.observedClaims.pop();
   else c.coverage.observedClaims.push({claimId:'invented',identifier:{...c.coverage.parcel,subaltern:'99'}});
   verifyBlocked(buildPracticeReport(c));
 });
}
