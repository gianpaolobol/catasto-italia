// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Explicit native smoke test, not part of dependency-free core CI.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {recognizeRasterBlock} from '../../packages/intake/native-ocr-diagnostic.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(process.argv.length,3,'Supply the documented synthetic PGM fixture');
const input=readFileSync(process.argv[2]);
assert.equal(sha256(input),'457e3371bf3f037324e323e76273c8e5f340a0fcba7f215ae658ed6d9ffc2425','Only the known synthetic fixture is accepted');
const result=recognizeRasterBlock(input);
assert.equal(result.state,'ocr_evidence_candidates');
assert.deepEqual(result.words.map(w=>w.text),['TEST','0007']);
assert.equal(result.operative,false);assert.equal(result.authenticated,false);assert.equal(result.requiresHumanReview,true);
assert.equal(result.evidence.rasterSha256,sha256(input));
const {runSha256,...run}=result.nativeRun;
assert.equal(run.evidenceSha256,result.evidence.evidenceSha256);
assert.equal(runSha256,sha256(JSON.stringify(run)));
console.log('PASS: synthetic positive native OCR');
const blank=Buffer.concat([Buffer.from('P5\n640 160\n255\n'),Buffer.alloc(640*160,255)]);
const rejected=recognizeRasterBlock(blank);
assert.equal(rejected.state,'blocked');assert.equal(rejected.nativeRun,null);
assert.equal(rejected.evidence,null);assert.deepEqual(rejected.words,[]);
assert.equal(rejected.operative,false);assert.equal(rejected.authenticated,false);
assert.equal(rejected.requiresHumanReview,true);
assert.equal(rejected.issues[0].code,'ocr_no_words');
console.log('PASS: blank raster is fail-closed');
