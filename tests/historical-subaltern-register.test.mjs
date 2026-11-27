// [Codex] Independent literal-position synthetic fixtures, never official records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseHistoricalSubalternRegister, compareHistoricalSubalternRegisters, MAX_BYTES } from '../packages/workbench/historical-subaltern-register.mjs';
function row(sub='0001',desc='SYNTH ROOM',type='U',flag='1') {
  return '000'+'Z999 '+'   '+'0001'+'00001'+'0000'+sub+
    'SYNTH STREET'.padEnd(50)+'1'.padEnd(6)+'P0  '+'S1  '+'    '+
    'A '+'1  '+desc.padEnd(300)+'00000000'+'00000000'+flag+type+' '.repeat(81);
}
const data=(...rows)=>Buffer.from(rows.join('\r\n')+'\r\n','ascii');
test('historical exact fields and digest, without compatibility claim',()=>{
  const bytes=data(row());
  const result=parseHistoricalSubalternRegister(bytes);
  assert.equal(result.rows[0].fields.description.trim(),'SYNTH ROOM');
  assert.equal(result.rows[0].fields.street.trim(),'SYNTH STREET');
  assert.equal(result.rows[0].fields.floor2,'S1  ');
  assert.equal(result.rows[0].fields.unitType,'U');
  assert.equal(result.rows[0].fields.subaltern,'0001');
  assert.equal(result.rows[0].fields.filler.length,81);
  assert.equal(result.sourceSha256,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(result.officialCompatibility,false);
});
test('before/after distinguishes preserved, removed, new and changed rows',()=>{
  const a=data(row('0001'),row('0002'),row('0003'),row('0005','SYNTH COMMON','B','2'));
  const b=data(row('0005','SYNTH COMMON','B','2'),row('0003','SYNTH MODIFIED'),row('0004'),row('0001'));
  const result=compareHistoricalSubalternRegisters(a,b);
  assert.deepEqual(result.counts,{removed:1,added:1,changed:1,unchanged:2});
  assert.deepEqual(result.changed[0].changedFields,['description']);
  assert.equal(result.removed[0].key.slice(-4),'0002');
  assert.equal(result.added[0].key.slice(-4),'0004');
  assert.equal(result.caseMutation,false);
});
test('strict subset refuses ambiguity, malformed records and unsupported bytes',()=>{
  for(const bytes of [Buffer.alloc(0),Buffer.alloc(MAX_BYTES+1),data(row(),row()),data(row().slice(1)),
    data(row().replace('Z999','A000')),data(row('0001','X','D')),data(row('0001','X','U','9')),
    data(row().slice(0,20)+'ABCD'+row().slice(24)),data(row('    ')),
    Buffer.from(row().replace('SYNTH ROOM','\u00e8YNTH ROOM'),'utf8'),Buffer.from(row()+'\r'),
    Buffer.from(row()+'\n\n'+row())]) assert.throws(()=>parseHistoricalSubalternRegister(bytes));
  assert.equal(parseHistoricalSubalternRegister(Buffer.from(row()+'\n')).rows.length,1);
  assert.equal(parseHistoricalSubalternRegister(Buffer.from(row())).rows.length,1);
});
test('CLI read-only comparison, explicit synthetic opt-in and no descriptions in output',()=>{
  const dir=mkdtempSync(join(tmpdir(),'catasto-historical-test-'));
  try {
    const a=join(dir,'before.dat'),b=join(dir,'after.dat');
    const raw=data(row());writeFileSync(a,raw);writeFileSync(b,data(row('0001','SYNTH MODIFIED')));
    const script=fileURLToPath(new URL('../scripts/review-historical-subaltern-register.mjs',import.meta.url));
    const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
    const inspected=run('--synthetic',a);
    assert.equal(inspected.status,0,inspected.stderr);
    assert.equal(JSON.parse(inspected.stdout).count,1);
    assert.ok(!inspected.stdout.includes('SYNTH ROOM'));
    const compared=run('--synthetic',a,b);
    assert.equal(compared.status,0,compared.stderr);
    assert.equal(JSON.parse(compared.stdout).counts.changed,1);
    assert.ok(!compared.stdout.includes('SYNTH MODIFIED'));
    assert.equal(run(a).status,1);assert.equal(run('--synthetic',dir).status,1);
    assert.deepEqual(readFileSync(a),raw);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
