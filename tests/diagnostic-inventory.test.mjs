// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Synthetic identifier projection; no official format or validation.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {diagnosticInventory} from '../packages/workbench/diagnostic-inventory.mjs';
import {renderDiagnosticDossier} from '../packages/workbench/diagnostic-dossier.mjs';
const cases=[
 ['fusion',3,4,2,3],['division',2,3,3,4],['new_construction',1,1,2,3],
 ['internal_distribution',2,2,2,2],['destination_change',2,2,2,2],['enlargement',2,2,2,2]
];
for(const [scenario,bu,bi,au,ai] of cases)test('ante/post inventory '+scenario,()=>{
 const r=buildPracticeReport(syntheticCase(scenario)),snapshot=JSON.stringify(r),p=diagnosticInventory(r);
 assert.deepEqual(p.counts,{before:{units:bu,identifiers:bi},after:{units:au,identifiers:ai}});
 for(const rows of [p.before,p.after])assert.ok(rows.some(x=>x.unitId==='other'&&x.identifier.subaltern==='09'));
 assert.ok(p.before.every(x=>x.operation!=='C'&&x.status==='observed'));
 assert.ok(p.after.every(x=>x.operation!=='S'));
 assert.ok(p.after.filter(x=>x.operation==='C').every(x=>x.status==='proposed'));
 assert.equal(JSON.stringify(r),snapshot);
 assert.match(renderDiagnosticDossier(r),/Inventario diagnostico ante e post/);
});
test('multiple identifiers retain grouping, leading zeroes and source',()=>{
 const p=diagnosticInventory(buildPracticeReport(syntheticCase('fusion')));
 assert.deepEqual(p.before.filter(x=>x.unitId==='u1').map(x=>x.identifier.subaltern),['01','02']);
 assert.deepEqual(p.before.find(x=>x.unitId==='u1').sourceIds,['synthetic-doc']);
});
test('blocked or malformed report cannot project an inventory',()=>{
 const d=syntheticCase('fusion');d.assertions.pop();
 assert.equal(diagnosticInventory(buildPracticeReport(d)),null);
 const r=buildPracticeReport(syntheticCase('fusion'));r.operations[0].identifiers[0].status='proposed';
 assert.equal(diagnosticInventory(r),null);assert.throws(()=>renderDiagnosticDossier(r));
});
