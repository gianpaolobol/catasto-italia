// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Actual temporary synthetic files; no DOCFA execution or real evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {scenarios} from '../packages/workbench/fixtures.mjs';
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';
import {buildOfflineComparisonKit} from '../scripts/generate-docfa-comparison-kit.mjs';
import {captureEvidenceManifest,verifyEvidenceManifest} from '../scripts/verify-docfa-review-evidence.mjs';

test('six validated declarations, 36 files, shared archive and tamper detection',async t=>{
  const root=await mkdtemp(join(tmpdir(),'synthetic-docfa-integrity-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const kit=buildOfflineComparisonKit(), archive=Buffer.from('synthetic archive only');
  const digest=createHash('sha256').update(archive).digest('hex');
  const archivePath=join(root,'archive-'+digest+'.bin');
  await writeFile(archivePath,archive);
  let firstFile,firstRecord,firstRecordPath;
  for(const scenario of scenarios){
    const session=JSON.parse(kit.get(scenario+'/sessione.json'));
    const {template}=manualReviewRegister(session);
    const input={...template,environment:{date:'2026-11-28',docfaVersion:'SYNTHETIC',province:'SYNTH',
      archiveSha256:digest,specificationReference:'Synthetic only',localRunReference:'Synthetic only'},
      observations:template.observations.map((o,i)=>({...o,
        state:i===0?'difference_declared':'match_declared',
        evidenceReference:scenario+'--'+o.id+'.bin',note:'Synthetic only'}))};
    const validated=manualReviewRegister(session,input);
    assert.equal(validated.ok,true);
    const record=validated.record,recordPath=join(root,scenario+'.json');
    await writeFile(recordPath,JSON.stringify(record));
    for(const o of record.observations){
      const path=join(root,o.evidenceReference);
      await writeFile(path,'Synthetic evidence only');
      firstFile??=path;
    }
    firstRecord??=record;
    firstRecordPath??=recordPath;
  }
  const manifest=await captureEvidenceManifest(root);
  assert.equal(manifest.checks.length,36);
  assert.equal(manifest.archives.length,1);
  assert.equal(manifest.differenceDeclared,6);
  assert.equal(manifest.officialValidation,false);
  const manifestPath=join(root,'evidence-manifest.json');
  await writeFile(manifestPath,JSON.stringify(manifest));
  const verified=await verifyEvidenceManifest(root);
  assert.equal(verified.integrityVerified,true);
  assert.equal(verified.officialValidation,false);
  assert.equal(verified.differenceDeclared,6);
  const original=await readFile(firstFile);
  await writeFile(firstFile,Buffer.alloc(original.length,65));
  assert.equal((await verifyEvidenceManifest(root)).integrityVerified,false);
  await writeFile(firstFile,original);
  await writeFile(archivePath,'wrong archive');
  await assert.rejects(captureEvidenceManifest(root),/archive_hash_mismatch/);
  await writeFile(archivePath,archive);
  const changed=structuredClone(firstRecord);
  changed.observations[0].note='Another synthetic note';
  await writeFile(firstRecordPath,JSON.stringify(changed));
  assert.equal((await verifyEvidenceManifest(root)).integrityVerified,false);
  changed.observations[0].evidenceReference='../outside.bin';
  await writeFile(firstRecordPath,JSON.stringify(changed));
  await assert.rejects(captureEvidenceManifest(root),/fixed_evidence_reference_required/);
  await writeFile(firstRecordPath,JSON.stringify(firstRecord));
  await rm(firstFile);
  await assert.rejects(captureEvidenceManifest(root));
  if(process.platform!=='win32'){
    await symlink(archivePath,firstFile);
    await assert.rejects(captureEvidenceManifest(root),/invalid_evidence_file/);
    await rm(firstFile);
  }
  await writeFile(firstFile,'');
  await assert.rejects(captureEvidenceManifest(root),/invalid_evidence_file/);
  await writeFile(firstFile,original);
  await writeFile(manifestPath,JSON.stringify({...manifest,officialValidation:true}));
  assert.equal((await verifyEvidenceManifest(root)).integrityVerified,false);
  await writeFile(manifestPath,JSON.stringify(manifest));
  assert.equal((await verifyEvidenceManifest(root)).integrityVerified,true);
});
