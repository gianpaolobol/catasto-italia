// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareExactRasterReview as prepare} from '../packages/intake/ocr-exact-raster-review.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const digest=x=>hash(JSON.stringify(x));
const pgm=()=>Buffer.concat([Buffer.from('P5\n3 2\n255\n'),Buffer.from([0,1,2,3,4,5])]);
// Synthetic structural fixture, not a genuine OCR execution or source proof.
function fixture(){
  const bytes=pgm(), rasterSha256=hash(bytes), coordinateSpace='raster-pixel-top-left';
  const words=[{id:'ocr-1-1-1-1-1',boxPx:[1,0,3,2],text:'0007',requiresHumanReview:true}];
  const render={widthPx:3,heightPx:2,rasterSha256,coordinateSpace};
  const ocr={...render,rasterByteLength:bytes.length};
  const run={evidenceSha256:digest({evidence:ocr,words})};
  const chain={version:'0.1.0',relationship:'local_pipeline_unverified',
    coordinateSpace,pdfMappingVerified:false,raster:{...render,evidenceSha256:digest(render)},
    ocr:{...ocr,evidenceSha256:run.evidenceSha256},nativeRun:{...run,runSha256:digest(run)},
    reviewOverlay:{version:'0.1.0',coordinateSpace:'raster-normalized-top-left',scale:1000000,
      widthPx:3,heightPx:2,pdfMappingVerified:false,requiresHumanReview:true,
      spans:[{id:words[0].id,box:[333333,0,1000000,1000000]}]}};
  return {bytes,result:{version:'0.1.0',state:'pdf_ocr_candidates',operative:false,
    authenticated:false,requiresHumanReview:true,words,evidence:{...chain,chainSha256:digest(chain)}}};
}
function reject(result,bytes,code){
  assert.deepEqual(prepare(result,bytes),{state:'blocked',raster:null,overlay:null,issues:[{code}]});
}
test('exact raster returns owned copy and recomputed overlay',()=>{
  const {bytes,result}=fixture(), review=prepare(result,bytes);
  assert.equal(review.state,'raster_review_candidate');
  assert.deepEqual(review.raster,bytes);
  assert.deepEqual(review.overlay,result.evidence.reviewOverlay);
  assert.equal(review.rasterSha256,hash(bytes));
  assert.equal(review.chainSha256,result.evidence.chainSha256);
  assert.equal(review.authenticated,false);assert.equal(review.requiresHumanReview,true);
  bytes[bytes.length-1]=99;result.evidence.reviewOverlay.spans[0].box[0]=0;
  assert.equal(review.raster.at(-1),5);assert.equal(review.overlay.spans[0].box[0],333333);
});
test('different pixel with same dimensions cannot be displayed',()=>{
  const {result,bytes}=fixture();bytes[bytes.length-1]=99;
  reject(result,bytes,'review_raster_mismatch');
});
test('shared memory or noncanonical raster rejected',()=>{
  const {result}=fixture();
  reject(result,Buffer.from(new SharedArrayBuffer(16)),'invalid_raster_bytes');
  reject(result,Buffer.from('not pgm'),'unsupported_pgm_header');
});
test('candidate flags mandatory',()=>{
  const {result,bytes}=fixture();
  for(const patch of [{state:'blocked'},{operative:true},{authenticated:true},{requiresHumanReview:false}])
    reject({...result,...patch},bytes,'review_result_not_candidate');
});
test('changed text invalidates the OCR digest',()=>{
  const {result,bytes}=fixture();result.words[0].text='0008';
  reject(result,bytes,'review_chain_digest_mismatch');
});
test('changed native run invalidates nested digest',()=>{
  const {result,bytes}=fixture();result.evidence.nativeRun.extra=true;
  reject(result,bytes,'review_chain_digest_mismatch');
});
test('wrong dimension metadata rejected',()=>{
  const {result,bytes}=fixture();result.evidence.raster.widthPx=4;
  reject(result,bytes,'review_raster_mismatch');
});
test('overlay modification rejected even if outer digest recomputed',()=>{
  const {result,bytes}=fixture();result.evidence.reviewOverlay.spans[0].box[0]=0;
  const {chainSha256,...chain}=result.evidence;result.evidence.chainSha256=digest(chain);
  reject(result,bytes,'review_overlay_mismatch');
});
test('invalid word box returns no partial raster',()=>{
  const {result,bytes}=fixture();result.words[0].boxPx[2]=4;
  reject(result,bytes,'overlay_invalid_box');
});
test('missing or cyclic nested evidence fails closed',()=>{
  const {result,bytes}=fixture();result.evidence.nativeRun=null;
  reject(result,bytes,'review_invalid_chain');
  const another=fixture();another.result.evidence.nativeRun.loop=another.result.evidence.nativeRun;
  reject(another.result,another.bytes,'review_invalid_chain');
});
