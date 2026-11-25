// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRasterReviewOverlay as build} from '../packages/intake/ocr-raster-review-overlay.mjs';
const word=(boxPx=[1,2,2,3],id='ocr-1-1-1-1-1')=>({id,boxPx,requiresHumanReview:true});
const reject=(words,w,h,code)=>assert.deepEqual(build(words,w,h),{state:'blocked',overlay:null,issues:[{code}]});
test('overlay rounds outwards independently on both axes',()=>{
  const r=build([word()],3,7);
  assert.equal(r.state,'raster_overlay_candidate');
  assert.deepEqual(r.overlay,{version:'0.1.0',coordinateSpace:'raster-normalized-top-left',
    scale:1000000,widthPx:3,heightPx:7,pdfMappingVerified:false,requiresHumanReview:true,
    spans:[{id:'ocr-1-1-1-1-1',box:[333333,285714,666667,428572]}]});
});
test('full raster maps exactly to inclusive outer bounds',()=>{
  assert.deepEqual(build([word([0,0,20000,20000])],20000,20000).overlay.spans[0].box,[0,0,1000000,1000000]);
});
test('a one pixel raster is representable',()=>{
  assert.deepEqual(build([word([0,0,1,1])],1,1).overlay.spans[0].box,[0,0,1000000,1000000]);
});
test('invalid dimension rejected',()=>{
  for(const w of [0,-1,20001,NaN,Infinity,1.5,'3'])reject([word()],w,7,'overlay_invalid_dimensions');
});
test('empty or oversized word arrays rejected',()=>{
  for(const words of [null,[],Array(2049).fill(word())])reject(words,3,7,'overlay_invalid_words');
});
test('invalid or repeated word id rejected without partial overlay',()=>{
  for(const second of [word([0,0,1,1]),word([0,0,1,1],'ocr-2-1-1-1-2'),word([0,0,1,1],'ocr-1-01-1-1-2')])
    reject([word(),second],3,7,'overlay_invalid_word');
});
test('unreviewable or missing word rejected',()=>{
  reject([{...word(),requiresHumanReview:false}],3,7,'overlay_invalid_word');
  reject(Array(1),3,7,'overlay_invalid_word');
});
test('non-integer and sparse boxes rejected',()=>{
  for(const b of [[0,0,1.5,1],[0,0,,1],[0,0,NaN,1],[0,0,'1',1],[0,0,1]])
    reject([word(b)],3,7,'overlay_invalid_box');
});
test('out of raster or collapsed boxes rejected',()=>{
  for(const b of [[-1,0,1,1],[0,-1,1,1],[0,0,4,1],[0,0,1,8],[1,1,1,2],[1,2,2,1]])
    reject([word(b)],3,7,'overlay_invalid_box');
});
test('projection preserves order and does not copy text or score',()=>{
  const a={...word(),text:'TEST',engineScore:'99'},b=word([0,0,1,1],'ocr-1-1-1-1-2');
  const result=build([a,b],3,7);
  assert.deepEqual(result.overlay.spans.map(s=>s.id),[a.id,b.id]);
  assert.ok(result.overlay.spans.every(s=>Object.keys(s).length===2));
  a.boxPx[0]=0;
  assert.equal(result.overlay.spans[0].box[0],333333);
});
