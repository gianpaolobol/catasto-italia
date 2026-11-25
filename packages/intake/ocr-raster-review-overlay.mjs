// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Display coordinates for the exact raster, not PDF points or cadastral geometry.
const SCALE=1_000_000,MAX_WORDS=2048,MAX_DIM=20000;
const dimension=n=>Number.isInteger(n)&&n>0&&n<=MAX_DIM;
const blocked=code=>({state:'blocked',overlay:null,issues:[{code}]});
export function buildRasterReviewOverlay(words,widthPx,heightPx){
  if(!dimension(widthPx)||!dimension(heightPx))return blocked('overlay_invalid_dimensions');
  if(!Array.isArray(words)||words.length===0||words.length>MAX_WORDS)return blocked('overlay_invalid_words');
  const spans=[],ids=new Set();
  for(const word of words){
    if(!word||typeof word.id!=='string'||!/^ocr-1(?:-[1-9]\d{0,5}){4}$/.test(word.id)||ids.has(word.id)||
      word.requiresHumanReview!==true)return blocked('overlay_invalid_word');
    const b=word.boxPx;
    if(!Array.isArray(b)||b.length!==4||![b[0],b[1],b[2],b[3]].every(Number.isSafeInteger)||
      b[0]<0||b[1]<0||b[2]>widthPx||b[3]>heightPx||b[0]>=b[2]||b[1]>=b[3])
      return blocked('overlay_invalid_box');
    ids.add(word.id);
    // Integer products are exactly representable within the dimension cap.
    const lower=(v,d)=>Math.floor(v*SCALE/d);
    const upper=(v,d)=>Math.ceil(v*SCALE/d);
    spans.push({id:word.id,box:[lower(b[0],widthPx),lower(b[1],heightPx),
      upper(b[2],widthPx),upper(b[3],heightPx)]});
  }
  return {state:'raster_overlay_candidate',overlay:{version:'0.1.0',
    coordinateSpace:'raster-normalized-top-left',scale:SCALE,widthPx,heightPx,
    pdfMappingVerified:false,requiresHumanReview:true,spans},issues:[]};
}
