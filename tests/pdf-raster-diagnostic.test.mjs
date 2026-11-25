// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planDiagnosticRaster,rasterizeDiagnosticPdf} from '../packages/intake/pdf-raster-diagnostic.mjs';
import {snapshotCanonicalPgm} from '../packages/intake/ocr-raster-evidence.mjs';

const info=(w=320,h=80,rot=0)=>['Pages: 1','Encrypted: no',
  'Page 1 size: '+w+' x '+h+' pts','Page 1 rot: '+rot,
  'Page 1 MediaBox: 0 0 '+w+' '+h,'Page 1 CropBox: 0 0 '+w+' '+h].join('\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
function syntheticPdf(rotation=0){
  const stream='BT /F1 24 Tf 15 35 Td (TEST 0007) Tj ET\n';
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
test('plan requires a single integral unrotated page',()=>assert.deepEqual(planDiagnosticRaster(info()),{
  page:1,dpi:144,widthPx:640,heightPx:160,reportedWidthPt:320,reportedHeightPt:80}));
for(const rotation of [90,180,270])test('plan rejects rotation '+rotation,()=>
  assert.equal(planDiagnosticRaster(info(320,80,rotation)).code,'raster_unsupported_rotation'));
test('plan rejects fractional dimensions',()=>assert.equal(planDiagnosticRaster(info(320.5,80)).code,'raster_page_limit'));
test('plan rejects oversized dimensions',()=>assert.equal(planDiagnosticRaster(info(2001,80)).code,'raster_page_limit'));
test('plan rejects encrypted PDF',()=>assert.equal(planDiagnosticRaster(info().replace('Encrypted: no','Encrypted: yes')).code,'raster_unsupported_page_geometry'));
test('plan rejects unequal crop box',()=>assert.equal(planDiagnosticRaster(info().replace('CropBox: 0 0 320 80','CropBox: 1 0 320 80')).code,'raster_unsupported_page_geometry'));
test('plan rejects multi-page PDF',()=>assert.equal(planDiagnosticRaster(info().replace('Pages: 1','Pages: 2')).code,'raster_unsupported_page_geometry'));
test('invalid input is fail closed',()=>assert.deepEqual(rasterizeDiagnosticPdf(Buffer.from('not a pdf')),{
  version:'0.1.0',state:'blocked',operative:false,authenticated:false,requiresHumanReview:true,
  raster:null,evidence:null,issues:[{code:'invalid_raster_pdf_input'}]}));
test('rejects shared memory input',()=>assert.equal(rasterizeDiagnosticPdf(Buffer.from(new SharedArrayBuffer(32))).issues[0].code,'invalid_raster_pdf_input'));
test('synthetic native raster retains exact evidence and dimensions on Linux',()=>{
  const pdf=syntheticPdf(),out=rasterizeDiagnosticPdf(pdf);
  if(process.platform!=='linux'){assert.equal(out.issues[0].code,'raster_platform_unsupported');return;}
  assert.equal(out.state,'raster_candidate',JSON.stringify(out.issues));
  assert.equal(out.operative,false);assert.equal(out.authenticated,false);assert.equal(out.requiresHumanReview,true);
  const s=snapshotCanonicalPgm(out.raster);assert.equal(s.widthPx,640);assert.equal(s.heightPx,160);
  assert.equal(out.evidence.documentSha256,hash(pdf));assert.equal(out.evidence.rasterSha256,hash(out.raster));
  const {evidenceSha256,...evidence}=out.evidence;assert.equal(evidenceSha256,hash(JSON.stringify(evidence)));
  assert.equal(evidence.hideAnnotationsRequested,true);
  assert.ok(s.raster.subarray(s.raster.length-640*160).some(v=>v<128),'render contains visible marks');
});
test('native rotated PDF never yields partial raster on Linux',()=>{
  const out=rasterizeDiagnosticPdf(syntheticPdf(180));
  assert.equal(out.state,'blocked');assert.equal(out.raster,null);assert.equal(out.evidence,null);
  assert.equal(out.issues[0].code,process.platform==='linux'?'raster_unsupported_rotation':'raster_platform_unsupported');
});
