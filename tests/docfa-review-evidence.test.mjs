// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Actual temporary synthetic files; no DOCFA execution or real evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {scenarios} from '../packages/workbench/fixtures.mjs';
import {manualReviewRegister} from '../packages/workbench/manual-review-register.mjs';
import {buildOfflineComparisonKit,writeOfflineComparisonKit} from '../scripts/generate-docfa-comparison-kit.mjs';
import {captureEvidenceManifest,verifyEvidenceManifest} from '../scripts/verify-docfa-review-evidence.mjs';
import {verifyProfessionalPreflight} from '../scripts/verify-docfa-professional-preflight.mjs';

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


test('source-set documentary preflight binds real local bytes to six synthetic records, never official approval',async t=>{
  const root=await mkdtemp(join(tmpdir(),'synthetic-source-preflight-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const kitDir=join(root,'kit'),reviewDir=join(root,'reviews');
  await writeOfflineComparisonKit(kitDir);
  await mkdir(reviewDir);
  const roles=['installer','archive','specifications','models'];
  const declarations={version:'0.1.0',kind:'local-docfa-source-declarations',docfaVersion:'0.0.0',province:'ZZ',sources:[]};
  for(const role of roles){
    const bytes=Buffer.from('SYNTHETIC ONLY: '+role),sha256=createHash('sha256').update(bytes).digest('hex');
    declarations.sources.push({role,sha256,url:'https://www.agenziaentrate.gov.it/synthetic-only/'+role,
      acquiredOn:'2026-11-27',verificationMethod:'Synthetic fixture; not a real download'});
    await writeFile(join(reviewDir,role==='archive'?'archive-'+sha256+'.bin':'docfa-'+role+'.bin'),bytes);
  }
  const spec=declarations.sources.find(s=>s.role==='specifications'),archive=declarations.sources.find(s=>s.role==='archive');
  const declarationsPath=join(reviewDir,'docfa-source-declarations.json');
  const writeDeclarations=x=>writeFile(declarationsPath,JSON.stringify(x));
  await writeDeclarations(declarations);
  const kit=buildOfflineComparisonKit();
  const records=[];
  for(const scenario of scenarios){
    const session=JSON.parse(kit.get(scenario+'/sessione.json'));
    const {template}=manualReviewRegister(session);
    const result=manualReviewRegister(session,{...template,environment:{date:'2026-11-28',docfaVersion:'0.0.0',province:'ZZ',
      archiveSha256:archive.sha256,specificationReference:'sha256:'+spec.sha256,localRunReference:'Synthetic only'},
      observations:template.observations.map((o,i)=>({...o,state:i===0?'difference_declared':'match_declared',
        evidenceReference:scenario+'--'+o.id+'.bin',note:'Synthetic only'}))});
    assert.equal(result.ok,true);
    records.push({scenario,session,template,record:result.record});
    await writeFile(join(reviewDir,scenario+'.json'),JSON.stringify(result.record));
    for(const o of result.record.observations)await writeFile(join(reviewDir,o.evidenceReference),'Synthetic evidence only');
  }
  const writeManifest=async()=>writeFile(join(reviewDir,'evidence-manifest.json'),JSON.stringify(await captureEvidenceManifest(reviewDir)));
  await writeManifest();
  const verified=await verifyProfessionalPreflight(kitDir,reviewDir);
  assert.equal(verified.documentaryComplete,true);
  assert.equal(verified.comparisonKitFiles,26);
  assert.equal(verified.reviewChecks,36);
  assert.equal(verified.verifiedSources.length,4);
  assert.equal(verified.differencesDeclared,6);
  assert.equal(verified.requiresDifferenceResolution,true);
  for(const key of ['officialValidation','officialExport','signature','submission','sourceAuthenticityVerified','sourceCurrencyVerified','softwareExecuted'])assert.equal(verified[key],false);
  const bad=structuredClone(declarations);
  bad.sources[0].url='https://agenziaentrate.gov.it.example.org/fake';
  await writeDeclarations(bad);
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/invalid_source_declarations/);
  bad.sources[0].url=declarations.sources[0].url;
  bad.sources[0].acquiredOn='2026-11-29';
  await writeDeclarations(bad);
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/review_source_binding_mismatch/);
  await writeDeclarations(declarations);
  const installer=join(reviewDir,'docfa-installer.bin'),original=await readFile(installer);
  await writeFile(installer,'wrong installer');
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/source_hash_mismatch/);
  await writeFile(installer,original);
  const wrong=structuredClone(declarations);
  wrong.province='YY';
  await writeDeclarations(wrong);
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/review_source_binding_mismatch/);
  await writeDeclarations(declarations);
  const {scenario,session,template,record}=records[0];
  const changed=manualReviewRegister(session,{...template,environment:{...record.environment,specificationReference:'wrong specification'},
    observations:record.observations});
  assert.equal(changed.ok,true);
  await writeFile(join(reviewDir,scenario+'.json'),JSON.stringify(changed.record));
  await writeManifest();
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/review_source_binding_mismatch/);
  await writeFile(join(reviewDir,scenario+'.json'),JSON.stringify(record));
  await writeManifest();
  await writeFile(join(kitDir,'LEGGIMI.txt'),'altered');
  await assert.rejects(verifyProfessionalPreflight(kitDir,reviewDir),/comparison_kit_not_canonical/);
});
