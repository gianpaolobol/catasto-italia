// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {recognizeDiagnosticPdfBlock,recognizeDiagnosticPdfReview} from '../packages/intake/pdf-ocr-diagnostic.mjs';
import {prepareExactRasterReview} from '../packages/intake/ocr-exact-raster-review.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function syntheticPdf(rotation=0,blank=false){
  const stream=blank?'q Q\n':'BT /F1 24 Tf 15 35 Td (TEST 0007) Tj ET\n';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 80] /Rotate '+rotation+
      ' /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
  let pdf='%PDF-1.4\n';const offsets=[];
  for(const [i,obj] of objects.entries()){
    offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';
  }
  const xref=Buffer.byteLength(pdf);
  pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  pdf+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Buffer.from(pdf);
}

test('invalid PDF produces no OCR evidence or partial words',()=>{
  const result=recognizeDiagnosticPdfBlock(Buffer.from('not a pdf'));
  assert.deepEqual(result,{version:'0.1.0',state:'blocked',operative:false,authenticated:false,
    requiresHumanReview:true,evidence:null,words:[],issues:[{stage:'raster',code:'invalid_raster_pdf_input'}]});
});
test('shared memory PDF is rejected before native processing',()=>{
  assert.equal(recognizeDiagnosticPdfBlock(Buffer.from(new SharedArrayBuffer(64))).issues[0].code,'invalid_raster_pdf_input');
});
test('rotation is rejected before OCR and no partial result escapes',()=>{
  const result=recognizeDiagnosticPdfBlock(syntheticPdf(180));
  assert.equal(result.state,'blocked');assert.equal(result.evidence,null);assert.deepEqual(result.words,[]);
  assert.deepEqual(result.issues,[{stage:'raster',code:process.platform==='linux'?'raster_unsupported_rotation':'raster_platform_unsupported'}]);
});
test('native synthetic PDF to OCR preserves words and chain integrity',()=>{
  const pdf=syntheticPdf(), result=recognizeDiagnosticPdfBlock(pdf);
  if(process.platform!=='linux'){
    assert.deepEqual(result.issues,[{stage:'raster',code:'raster_platform_unsupported'}]);return;
  }
  assert.equal(result.state,'pdf_ocr_candidates',JSON.stringify(result.issues));
  assert.deepEqual(result.words.map(w=>w.text),['TEST','0007']);
  assert.ok(result.words.every(w=>w.requiresHumanReview));
  assert.equal(result.operative,false);assert.equal(result.authenticated,false);assert.equal(result.requiresHumanReview,true);
  assert.equal(Object.hasOwn(result,'reviewRaster'),false);
  const {chainSha256,...chain}=result.evidence;
  assert.equal(chainSha256,hash(JSON.stringify(chain)));
  assert.equal(chain.pdfMappingVerified,false);assert.equal(chain.coordinateSpace,'raster-pixel-top-left');
  assert.equal(chain.raster.documentSha256,hash(pdf));assert.equal(chain.raster.rasterSha256,chain.ocr.rasterSha256);
  assert.equal(chain.raster.widthPx,640);assert.equal(chain.raster.heightPx,160);
  assert.equal(chain.nativeRun.evidenceSha256,chain.ocr.evidenceSha256);
  const overlay=chain.reviewOverlay;
  assert.equal(overlay.coordinateSpace,'raster-normalized-top-left');
  assert.equal(overlay.pdfMappingVerified,false);assert.equal(overlay.requiresHumanReview,true);
  assert.deepEqual([overlay.widthPx,overlay.heightPx,overlay.scale],[640,160,1000000]);
  assert.deepEqual(overlay.spans.map(s=>s.id),result.words.map(w=>w.id));
  // Independent rational inequalities: every pixel box is enclosed and the
  // outward expansion is strictly smaller than one normalized unit per edge.
  for(const [i,span] of overlay.spans.entries()){
    for(let j=0;j<4;j++){
      const d=j%2===0?640:160,exact=result.words[i].boxPx[j]*1000000;
      const delta=j<2?exact-span.box[j]*d:span.box[j]*d-exact;
      assert.ok(delta>=0&&delta<d);
    }
  }
  const {evidenceSha256:rasterHash,...rasterFields}=chain.raster;
  assert.equal(rasterHash,hash(JSON.stringify(rasterFields)));
  const {runSha256,...runFields}=chain.nativeRun;
  assert.equal(runSha256,hash(JSON.stringify(runFields)));
  const {evidenceSha256:ocrHash,...ocr}=chain.ocr;
  assert.equal(ocrHash,hash(JSON.stringify({evidence:ocr,words:result.words})));
  assert.ok(result.issues.some(i=>i.code==='ocr_layout_unverified'));
});
test('blank synthetic PDF returns no partial evidence',()=>{
  const result=recognizeDiagnosticPdfBlock(syntheticPdf(0,true));
  assert.equal(result.state,'blocked');assert.equal(result.evidence,null);assert.deepEqual(result.words,[]);
  assert.equal(result.issues[0].stage,process.platform==='linux'?'ocr':'raster');
});

test('native opt-in review returns exact raster for same OCR chain',()=>{
  const result=recognizeDiagnosticPdfReview(syntheticPdf());
  if(process.platform!=='linux'){
    assert.equal(result.state,'blocked');assert.equal(result.reviewRaster,null);return;
  }
  assert.equal(result.state,'pdf_ocr_candidates',JSON.stringify(result.issues));
  assert.deepEqual(result.words.map(w=>w.text),['TEST','0007']);
  assert.ok(Buffer.isBuffer(result.reviewRaster));
  assert.equal(hash(result.reviewRaster),result.evidence.raster.rasterSha256);
  const review=prepareExactRasterReview(result,result.reviewRaster);
  assert.equal(review.state,'raster_review_candidate');
  assert.deepEqual(review.overlay,result.evidence.reviewOverlay);
  assert.equal(review.chainSha256,result.evidence.chainSha256);
  result.reviewRaster[result.reviewRaster.length-1]^=1;
  assert.equal(prepareExactRasterReview(result,result.reviewRaster).state,'blocked');
});
test('opt-in review fails without raster or words on invalid and blank PDF',()=>{
  for(const pdf of [Buffer.from('not a pdf'),syntheticPdf(0,true)]){
    const result=recognizeDiagnosticPdfReview(pdf);
    assert.equal(result.state,'blocked');assert.equal(result.reviewRaster,null);
    assert.equal(result.evidence,null);assert.deepEqual(result.words,[]);
  }
});
