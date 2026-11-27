// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Literal independent synthetic fixture rows, not an official serializer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {reconcileHistoricalInventory} from '../packages/workbench/historical-inventory-reconciliation.mjs';

function session(scenario){
  const draft=syntheticCase(scenario),r=buildPracticeReport(draft);
  assert.equal(r.state,'research_candidate');
  return {version:'0.1.0',kind:'synthetic-practice-session',request:{draft,expectedState:r.state,expectedDigest:r.caseDigest,geometry:[],income:[]}};
}
function record(sub,description='SYNTH ROOM',parcel='00900'){
  return '000Z999    0999'+parcel+'0000'+sub+' '.repeat(73)+description.padEnd(300)+'00000000000000001U'+' '.repeat(81);
}
function bytes(rows){return Buffer.from(rows.join('\r\n')+'\r\n','ascii');}
const rows=ids=>bytes(ids.map(id=>record(id)));
const cases=[
  ['fusion',['0001','0002','0003','0009'],['0005','0006','0009']],
  ['division',['0001','0002','0009'],['0005','0006','0007','0009']],
  ['internal_distribution',['0001','0009'],['0001','0009']],
  ['destination_change',['0001','0009'],['0005','0009']],
  ['enlargement',['0001','0009'],['0005','0009']]
];
for(const [scenario,a,b] of cases)test('reconciles synthetic '+scenario,()=>{
  const s=session(scenario),original=JSON.stringify(s);
  const x=reconcileHistoricalInventory(s,rows(a),rows(b));
  assert.equal(x.ok,true,JSON.stringify(x));
  assert.equal(x.identitySetsMatch,true);
  assert.equal(x.requiresReview,false);
  assert.equal(x.caseDigest,s.request.expectedDigest);
  assert.deepEqual(x.phases.before,{expected:a.length,actual:a.length,missing:[],unexpected:[]});
  assert.deepEqual(x.phases.after,{expected:b.length,actual:b.length,missing:[],unexpected:[]});
  assert.equal(x.officialCompatibility,false);assert.equal(x.officialValidation,false);
  assert.equal(x.caseMutation,false);assert.equal(JSON.stringify(s),original);
});
test('new construction retains the other parcel without confusing identical subaltern numbers',()=>{
  const a=bytes([record('0009','SYNTH ROOM','00901')]);
  const b=bytes([record('0009','SYNTH ROOM','00901'),record('0005'),record('0006')]);
  const x=reconcileHistoricalInventory(session('new_construction'),a,b);
  assert.equal(x.ok,true,JSON.stringify(x));
  assert.equal(x.identitySetsMatch,true);
  assert.equal(x.actualChanges.added,2);assert.equal(x.actualChanges.unchanged,1);
});
test('missing and unexpected identities and changes to a retained row require review',()=>{
  const x=reconcileHistoricalInventory(session('fusion'),rows(['0001','0002','0003','0009']),
    bytes([record('0005'),record('0008'),record('0009','SYNTH CHANGED')]));
  assert.equal(x.ok,true);assert.equal(x.identitySetsMatch,false);
  assert.equal(x.requiresReview,true);
  assert.equal(x.phases.after.missing[0].key.slice(-4),'0006');
  assert.equal(x.phases.after.unexpected[0].slice(-4),'0008');
  assert.deepEqual(x.retainedChanges[0].changedFields,['description']);
  assert.doesNotMatch(JSON.stringify(x),/SYNTH CHANGED/);
});
test('identity match alone does not hide retained field changes; V changes shown separately',()=>{
  const a=rows(['0001','0009']);
  const x=reconcileHistoricalInventory(session('internal_distribution'),a,
    bytes([record('0001','SYNTH VARIED'),record('0009','SYNTH CHANGED')]));
  assert.equal(x.identitySetsMatch,true);assert.equal(x.requiresReview,true);
  assert.equal(x.variedRecords.length,1);assert.equal(x.retainedChanges.length,1);
  const y=reconcileHistoricalInventory(session('internal_distribution'),a,
    bytes([record('0001','SYNTH VARIED'),record('0009')]));
  assert.equal(y.requiresReview,false);assert.equal(y.variedRecords.length,1);
});
test('invalid session and malformed or non-synthetic records are rejected',()=>{
  const s=session('fusion'),a=rows(['0001']),b=rows(['0005']);
  assert.equal(reconcileHistoricalInventory(s,Buffer.from('bad'),b).ok,false);
  assert.equal(reconcileHistoricalInventory(s,bytes([record('0001').replace('Z999','A000')]),b).ok,false);
  s.request.expectedDigest='0'.repeat(64);
  assert.deepEqual(reconcileHistoricalInventory(s,a,b),{ok:false,error:'invalid_session'});
});
test('CLI reports discrepancies with exit 2, success with 0, invalid inputs with 1',()=>{
  const dir=mkdtempSync(join(tmpdir(),'catasto-reconcile-'));
  try{
    const a=join(dir,'a.dat'),b=join(dir,'b.dat'),s=join(dir,'session.json');
    const raw=rows(['0001','0009']);writeFileSync(a,raw);writeFileSync(b,raw);
    writeFileSync(s,JSON.stringify(session('internal_distribution')));
    const script=fileURLToPath(new URL('../scripts/review-historical-subaltern-register.mjs',import.meta.url));
    const run=()=>spawnSync(process.execPath,[script,'--synthetic','--session',s,a,b],{encoding:'utf8'});
    const first=run();assert.equal(first.status,0,first.stderr);
    assert.equal(JSON.parse(first.stdout).identitySetsMatch,true);
    writeFileSync(b,rows(['0001','0008']));const next=run();
    assert.equal(next.status,2,next.stderr);assert.equal(JSON.parse(next.stdout).requiresReview,true);
    writeFileSync(s,'{not json');const bad=run();assert.equal(bad.status,1);
    assert.doesNotMatch(bad.stderr,/not json/);assert.deepEqual(readFileSync(a),raw);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
