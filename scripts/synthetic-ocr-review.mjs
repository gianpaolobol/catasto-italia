// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Fixed synthetic fixture only; no arguments, document input or client data.
import {createHash} from 'node:crypto';
import {buildRasterReviewOverlay} from '../packages/intake/ocr-raster-review-overlay.mjs';
import {renderLocalOcrReview} from '../packages/intake/ocr-local-review-html.mjs';
if(process.argv.length!==2)throw new Error('Synthetic fixture accepts no arguments');
const hash=b=>createHash('sha256').update(b).digest('hex');
const digest=v=>hash(JSON.stringify(v));
const widthPx=320,heightPx=100;
const bytes=Buffer.concat([Buffer.from('P5\n320 100\n255\n'),Buffer.from(Array.from({length:32000},(_,i)=>i%256))]);
const words=[{id:'ocr-1-1-1-1-1',boxPx:[20,20,90,50],text:'0007',engineScore:'95.25',requiresHumanReview:true},
  {id:'ocr-1-1-1-1-2',boxPx:[110,20,290,50],text:'<script>alert(1)</script>',engineScore:'99',requiresHumanReview:true}];
const raster={widthPx,heightPx,rasterSha256:hash(bytes),coordinateSpace:'raster-pixel-top-left'};
const ocr={...raster,rasterByteLength:bytes.length};
const run={evidenceSha256:digest({evidence:ocr,words})};
const chain={version:'0.1.0',relationship:'local_pipeline_unverified',coordinateSpace:raster.coordinateSpace,
  pdfMappingVerified:false,raster:{...raster,evidenceSha256:digest(raster)},
  ocr:{...ocr,evidenceSha256:run.evidenceSha256},nativeRun:{...run,runSha256:digest(run)},
  reviewOverlay:buildRasterReviewOverlay(words,widthPx,heightPx).overlay};
const result={version:'0.1.0',state:'pdf_ocr_candidates',operative:false,authenticated:false,
  requiresHumanReview:true,words,evidence:{...chain,chainSha256:digest(chain)}};
const view=renderLocalOcrReview(result,bytes);
if(view.state!=='local_review_candidate')throw new Error('Synthetic render blocked');
process.stdout.write(view.html);
