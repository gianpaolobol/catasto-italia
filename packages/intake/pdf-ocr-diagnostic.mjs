// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {createHash} from 'node:crypto';
import {rasterizeDiagnosticPdf} from './pdf-raster-diagnostic.mjs';
import {recognizeRasterBlock} from './native-ocr-diagnostic.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const digest=value=>sha256(JSON.stringify(value));
const blocked=(stage,code)=>({version:'0.1.0',state:'blocked',operative:false,
  authenticated:false,requiresHumanReview:true,evidence:null,words:[],issues:[{stage,code}]});

// Diagnostic only: caller must select a single page containing one uniform text
// block. No proof of layout, OCR completeness, authenticity or PDF coordinates.
// No arbitrary paths, flags, engine injection or partial results on failure.
export function recognizeDiagnosticPdfBlock(pdf){
  const rendered=rasterizeDiagnosticPdf(pdf);
  if(rendered.state!=='raster_candidate')return blocked('raster',rendered.issues[0].code);
  const raster=rendered.evidence;
  if(sha256(rendered.raster)!==raster.rasterSha256)
    return blocked('binding','pdf_ocr_raster_digest_mismatch');
  const recognized=recognizeRasterBlock(rendered.raster);
  if(recognized.state!=='ocr_evidence_candidates')return blocked('ocr',recognized.issues[0].code);
  const ocr=recognized.evidence,run=recognized.nativeRun;
  if(ocr.rasterSha256!==raster.rasterSha256||ocr.widthPx!==raster.widthPx||
    ocr.heightPx!==raster.heightPx||ocr.coordinateSpace!==raster.coordinateSpace||
    run.evidenceSha256!==ocr.evidenceSha256)
    return blocked('binding','pdf_ocr_evidence_mismatch');
  const evidence={version:'0.1.0',relationship:'local_pipeline_unverified',
    coordinateSpace:'raster-pixel-top-left',pdfMappingVerified:false,
    raster,ocr,nativeRun:run};
  return {version:'0.1.0',state:'pdf_ocr_candidates',operative:false,authenticated:false,
    requiresHumanReview:true,evidence:{...evidence,chainSha256:digest(evidence)},
    words:recognized.words,issues:[{stage:'binding',code:'pdf_ocr_chain_unverified'},
      {stage:'binding',code:'raster_mapping_unverified'},{stage:'ocr',code:'ocr_layout_unverified'}]};
}
