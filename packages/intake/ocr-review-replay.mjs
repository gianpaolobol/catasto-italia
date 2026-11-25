// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Replay a local, parsed JSON review proposal against the original evidence.
// No authenticity, professional approval, file IO or cadastral inference.
import {buildOcrReviewDecisions} from './ocr-review-decisions.mjs';

const blocked=code=>({state:'blocked',manifest:null,issues:[{code}]});
const headerKeys=['version','kind','operative','authenticated','requiresHumanReview',
  'chainSha256','rasterSha256','decisions','manifestSha256'];
const decisionKeys=['id','boxPx','originalText','engineScore','action','proposedText','reason'];
const exactKeys=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const dense=(a,n)=>Array.isArray(a)&&a.length===n&&Object.keys(a).length===n&&
  Array.from({length:n},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const text=s=>typeof s==='string'&&s.length<=512;

// Contract: already parsed, local JSON data; the caller owns storage and parsing.
// Never accept a digest alone. Reconstruct using the validated original raster
// and OCR result, then compare every original and derived field to the manifest.
export function replayOcrReviewProposal(result,bytes,manifest){
  try{
    if(!exactKeys(manifest,headerKeys)||manifest.version!=='0.1.0'||
      manifest.kind!=='ocr_review_proposal'||manifest.operative!==false||
      manifest.authenticated!==false||manifest.requiresHumanReview!==true||
      !sha(manifest.chainSha256)||!sha(manifest.rasterSha256)||!sha(manifest.manifestSha256)||
      !Array.isArray(manifest.decisions)||manifest.decisions.length<1||manifest.decisions.length>2048||
      !dense(manifest.decisions,manifest.decisions.length))
      return blocked('replay_invalid_manifest');
    const decisions=[];
    for(const d of manifest.decisions){
      if(!exactKeys(d,decisionKeys)||!text(d.id)||!text(d.originalText)||!text(d.engineScore)||
        !dense(d.boxPx,4)||!d.boxPx.every(Number.isSafeInteger))
        return blocked('replay_invalid_decision');
      if(d.action==='retain'&&d.reason===null&&text(d.proposedText))
        decisions.push({id:d.id,action:d.action});
      else if(d.action==='correct'&&text(d.proposedText)&&text(d.reason))
        decisions.push({id:d.id,action:d.action,text:d.proposedText,reason:d.reason});
      else if(d.action==='exclude'&&d.proposedText===null&&text(d.reason))
        decisions.push({id:d.id,action:d.action,reason:d.reason});
      else return blocked('replay_invalid_decision');
    }
    const rebuilt=buildOcrReviewDecisions(result,bytes,{version:'0.1.0',
      chainSha256:manifest.chainSha256,rasterSha256:manifest.rasterSha256,decisions});
    if(rebuilt.state!=='review_proposal')return blocked('replay_source_or_request_invalid');
    const expected=rebuilt.manifest;
    if(headerKeys.some(k=>k!=='decisions'&&manifest[k]!==expected[k])||
      manifest.decisions.length!==expected.decisions.length)
      return blocked('replay_manifest_mismatch');
    for(let i=0;i<expected.decisions.length;i++){
      const a=manifest.decisions[i],b=expected.decisions[i];
      if(decisionKeys.some(k=>k!=='boxPx'&&a[k]!==b[k])||a.boxPx.some((v,j)=>!Object.is(v,b.boxPx[j])))
        return blocked('replay_manifest_mismatch');
    }
    // Return the fresh canonical proposal, never the caller's object.
    return {state:'replayed_review_proposal',manifest:expected,issues:[]};
  }catch{return blocked('replay_invalid_input');}
}
