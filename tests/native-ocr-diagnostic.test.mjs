// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshotCanonicalPgm} from '../packages/intake/ocr-raster-evidence.mjs';
import {recognizeRasterBlock} from '../packages/intake/native-ocr-diagnostic.mjs';

const pgm=(w=2,h=3)=>Buffer.concat([Buffer.from('P5\n'+w+' '+h+'\n255\n'),Buffer.alloc(w*h,255)]);
const reject=(bytes,code)=>assert.deepEqual(recognizeRasterBlock(bytes),{
  version:'0.1.0',state:'blocked',operative:false,authenticated:false,requiresHumanReview:true,
  evidence:null,nativeRun:null,words:[],issues:[{code}]});

test('PGM snapshot owns the exact original bytes and dimensions',()=>{
  const input=pgm(),original=Buffer.from(input),result=snapshotCanonicalPgm(input);
  assert.equal(result.widthPx,2);assert.equal(result.heightPx,3);
  input.fill(0);assert.deepEqual(result.raster,original);
});
test('native preflight rejects non-Buffer input',()=>reject(new Uint8Array(pgm()),'invalid_raster_bytes'));
test('native preflight rejects shared backing storage',()=>reject(Buffer.from(new SharedArrayBuffer(32)),'invalid_raster_bytes'));
test('native preflight rejects unsupported format',()=>reject(Buffer.from('P2\n2 3\n255\n'),'unsupported_pgm_header'));
test('native preflight rejects truncated raster',()=>reject(pgm().subarray(0,-1),'invalid_pgm_size'));
test('native preflight rejects trailing raster bytes',()=>reject(Buffer.concat([pgm(),Buffer.from([0])]),'invalid_pgm_size'));
test('native preflight rejects excessive dimensions',()=>reject(Buffer.from('P5\n20001 1\n255\n'),'invalid_pgm_size'));
test('native preflight rejects excessive pixel count',()=>reject(Buffer.from('P5\n5000 5000\n255\n'),'invalid_pgm_size'));
test('native preflight rejects oversized Buffer',()=>reject(Buffer.alloc(16_000_065),'invalid_raster_bytes'));
