// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Local diagnostic review only: consistency of bytes, not source authenticity.
import {createHash} from 'node:crypto';
import {snapshotCanonicalPgm} from './ocr-raster-evidence.mjs';
import {buildRasterReviewOverlay} from './ocr-raster-review-overlay.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const digest=value=>hash(JSON.stringify(value));
const blocked=code=>({state:'blocked',raster:null,overlay:null,issues:[{code}]});

// Call immediately before displaying a local review result. Return an owned
// copy of the exact PGM, not a re-render or a PDF-coordinate transform.
// Digests are unkeyed; an actor able to rewrite all evidence can forge them.
export function prepareExactRasterReview(result,bytes){
  if(result?.version!=='0.1.0'||result.state!=='pdf_ocr_candidates'||result.operative!==false||
    result.authenticated!==false||result.requiresHumanReview!==true)
    return blocked('review_result_not_candidate');
  const snapshot=snapshotCanonicalPgm(bytes);
  if(snapshot.code)return blocked(snapshot.code);
  const {raster,widthPx,heightPx}=snapshot;
  try{
    const projection=buildRasterReviewOverlay(result.words,widthPx,heightPx);
    if(projection.state!=='raster_overlay_candidate')return blocked(projection.issues[0].code);
    const e=result.evidence;
    if(e?.version!=='0.1.0'||e.relationship!=='local_pipeline_unverified'||
      e.pdfMappingVerified!==false||e.coordinateSpace!=='raster-pixel-top-left')
      return blocked('review_invalid_chain');
    const {chainSha256,...chain}=e;
    const {evidenceSha256:rasterDigest,...render}=chain.raster;
    const {evidenceSha256:ocrDigest,...ocr}=chain.ocr;
    const {runSha256,...run}=chain.nativeRun;
    const rasterSha=hash(raster);
    if(render.rasterSha256!==rasterSha||ocr.rasterSha256!==rasterSha||
      render.widthPx!==widthPx||render.heightPx!==heightPx||
      ocr.widthPx!==widthPx||ocr.heightPx!==heightPx||
      ocr.rasterByteLength!==raster.length||
      render.coordinateSpace!==e.coordinateSpace||ocr.coordinateSpace!==e.coordinateSpace)
      return blocked('review_raster_mismatch');
    if(digest(render)!==rasterDigest||digest({evidence:ocr,words:result.words})!==ocrDigest||
      digest(run)!==runSha256||run.evidenceSha256!==ocrDigest||digest(chain)!==chainSha256)
      return blocked('review_chain_digest_mismatch');
    if(JSON.stringify(chain.reviewOverlay)!==JSON.stringify(projection.overlay))
      return blocked('review_overlay_mismatch');
    return {state:'raster_review_candidate',raster,overlay:projection.overlay,
      chainSha256,rasterSha256:rasterSha,authenticated:false,requiresHumanReview:true,issues:[]};
  }catch{return blocked('review_invalid_chain');}
}
