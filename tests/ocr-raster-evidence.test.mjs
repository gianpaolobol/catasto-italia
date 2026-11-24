// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {bindOcrRasterEvidence as bind} from '../packages/intake/ocr-raster-evidence.mjs';

// Deliberately artificial pair: no claim that this TSV was extracted from these pixels.
const pgm=(w=64,h=50,fill=255)=>Buffer.concat([Buffer.from('P5\n'+w+' '+h+'\n255\n'),Buffer.alloc(w*h,fill)]);
const row=(...c)=>c.join('\t');
const tsv=(value='0007',w=64,h=50)=>Buffer.from([
'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
row(1,1,0,0,0,0,0,0,w,h,-1,''),
row(2,1,1,0,0,0,1,1,40,30,-1,''),
row(3,1,1,1,0,0,1,1,40,30,-1,''),
row(4,1,1,1,1,0,1,1,40,30,-1,''),
row(5,1,1,1,1,1,2,2,20,10,'99.5',value)
].join('\n')+'\n');
const digest=b=>createHash('sha256').update(b).digest('hex');
const reject=(r,t,code)=>{
  const x=bind(r,t);assert.equal(x.state,'blocked');assert.equal(x.issues[0].code,code);
  assert.equal(x.evidence,null);assert.deepEqual(x.words,[]);assert.equal(x.operative,false);
};
test('valid supplied pair is unverified, with actual byte digests',()=>{
  const r=pgm(),t=tsv(),x=bind(r,t);
  assert.equal(x.state,'ocr_evidence_candidates');assert.equal(x.evidence.relationship,'supplied_pair_unverified');
  assert.equal(x.evidence.rasterSha256,digest(r));assert.equal(x.evidence.tsvSha256,digest(t));
  assert.equal(x.evidence.widthPx,64);assert.equal(x.evidence.heightPx,50);
  assert.equal(x.evidence.rasterByteLength,r.length);assert.equal(x.evidence.tsvByteLength,t.length);
  assert.equal(x.words[0].text,'0007');assert.equal(x.authenticated,false);
  assert.equal(x.operative,false);assert.equal(x.requiresHumanReview,true);
  const {evidenceSha256,...evidence}=x.evidence;
  assert.equal(evidenceSha256,digest(JSON.stringify({evidence,words:x.words})));
});
test('same pair is deterministic',()=>assert.deepEqual(bind(pgm(),tsv()),bind(pgm(),tsv())));
test('pixel change affects raster and evidence digests, not TSV digest',()=>{
  const a=bind(pgm(),tsv()),r=pgm();r[r.length-1]=0;const b=bind(r,tsv());
  assert.notEqual(a.evidence.rasterSha256,b.evidence.rasterSha256);
  assert.notEqual(a.evidence.evidenceSha256,b.evidence.evidenceSha256);
  assert.equal(a.evidence.tsvSha256,b.evidence.tsvSha256);
});
test('TSV byte-only newline change affects evidence',()=>{
  const a=bind(pgm(),tsv()),b=bind(pgm(),Buffer.from(tsv().toString().replace(/\n/g,'\r\n')));
  assert.deepEqual(a.words,b.words);assert.notEqual(a.evidence.evidenceSha256,b.evidence.evidenceSha256);
});
test('pixel first byte may be LF without changing header parsing',()=>assert.equal(bind(pgm(64,50,10),tsv()).state,'ocr_evidence_candidates'));
test('no trailing raster data',()=>reject(Buffer.concat([pgm(),Buffer.from([0])]),tsv(),'invalid_pgm_size'));
test('truncated raster rejected',()=>reject(pgm().subarray(0,-1),tsv(),'invalid_pgm_size'));
test('noncanonical legal PGM comment unsupported',()=>reject(Buffer.from('P5\n# comment\n64 50\n255\n'),tsv(),'unsupported_pgm_header'));
test('16-bit PGM unsupported',()=>reject(Buffer.from('P5\n64 50\n65535\n'),tsv(),'unsupported_pgm_header'));
test('P2 unsupported',()=>reject(Buffer.from('P2\n64 50\n255\n'),tsv(),'unsupported_pgm_header'));
test('leading zero dimension unsupported',()=>reject(Buffer.from('P5\n064 50\n255\n'),tsv(),'unsupported_pgm_header'));
test('pixel bound enforced before length comparison',()=>reject(Buffer.from('P5\n5000 5000\n255\n'),tsv(),'invalid_pgm_size'));
test('dimension bound enforced',()=>reject(Buffer.from('P5\n20001 1\n255\n'),tsv(),'invalid_pgm_size'));
test('TSV page mismatch rejected',()=>reject(pgm(),tsv('0007',65,50),'ocr_raster_mismatch'));
test('invalid UTF8 rejected',()=>reject(pgm(),Buffer.concat([tsv(),Buffer.from([0xff])]),'invalid_tsv_utf8'));
test('BOM not silently removed',()=>reject(pgm(),Buffer.concat([Buffer.from([239,187,191]),tsv()]),'invalid_ocr_header_or_rows'));
test('TSV parse failure produces no evidence',()=>reject(pgm(),tsv(''),'invalid_ocr_text'));
test('non-Buffer rejected',()=>{reject(new Uint8Array(pgm()),tsv(),'invalid_raster_bytes');reject(pgm(),tsv().toString(),'invalid_tsv_bytes');});
test('shared backing memory rejected',()=>reject(Buffer.from(new SharedArrayBuffer(10)),tsv(),'invalid_raster_bytes'));
test('oversized TSV rejected before decode',()=>reject(pgm(),Buffer.alloc(4*1024*1024+1),'invalid_tsv_bytes'));
test('no external engine or page provenance inferred',()=>{
 const x=bind(pgm(),tsv());assert.equal(x.evidence.page,undefined);assert.equal(x.evidence.engineVersion,undefined);
 assert.equal(x.evidence.documentSha256,undefined);assert.equal(x.words[0].requiresHumanReview,true);
});
