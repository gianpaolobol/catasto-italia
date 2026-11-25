// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildRasterReviewOverlay} from '../packages/intake/ocr-raster-review-overlay.mjs';
import {buildOcrReviewDecisions} from '../packages/intake/ocr-review-decisions.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const digest=v=>hash(JSON.stringify(v));
function fixture(){
  const widthPx=320,heightPx=100;
  const bytes=Buffer.concat([Buffer.from('P5\n320 100\n255\n'),Buffer.alloc(32000,255)]);
  const words=[{id:'ocr-1-1-1-1-1',boxPx:[20,20,90,50],text:'0007',engineScore:'95.25',requiresHumanReview:true},
    {id:'ocr-1-1-1-1-2',boxPx:[110,20,290,50],text:'012X',engineScore:'72',requiresHumanReview:true}];
  const raster={widthPx,heightPx,rasterSha256:hash(bytes),coordinateSpace:'raster-pixel-top-left'};
  const ocr={...raster,rasterByteLength:bytes.length};
  const run={evidenceSha256:digest({evidence:ocr,words})};
  const chain={version:'0.1.0',relationship:'local_pipeline_unverified',coordinateSpace:raster.coordinateSpace,
    pdfMappingVerified:false,raster:{...raster,evidenceSha256:digest(raster)},
    ocr:{...ocr,evidenceSha256:run.evidenceSha256},nativeRun:{...run,runSha256:digest(run)},
    reviewOverlay:buildRasterReviewOverlay(words,widthPx,heightPx).overlay};
  const result={version:'0.1.0',state:'pdf_ocr_candidates',operative:false,authenticated:false,
    requiresHumanReview:true,words,evidence:{...chain,chainSha256:digest(chain)}};
  const request={version:'0.1.0',chainSha256:result.evidence.chainSha256,rasterSha256:raster.rasterSha256,
    decisions:[{id:words[0].id,action:'retain'},{id:words[1].id,action:'correct',text:'0123',reason:'Synthetic visual correction'}]};
  return {result,bytes,request};
}
const run=f=>buildOcrReviewDecisions(f.result,f.bytes,f.request);
test('review proposal preserves original, zeros, coordinates and correction',()=>{
  const f=fixture(), before=structuredClone(f.result), out=run(f);
  assert.equal(out.state,'review_proposal');
  assert.equal(out.manifest.operative,false);
  assert.equal(out.manifest.authenticated,false);
  assert.equal(out.manifest.requiresHumanReview,true);
  assert.deepEqual(out.manifest.decisions.map(d=>[d.originalText,d.proposedText]),[['0007','0007'],['012X','0123']]);
  assert.deepEqual(out.manifest.decisions[1].boxPx,[110,20,290,50]);
  assert.deepEqual(f.result,before);
  const {manifestSha256,...body}=out.manifest;
  assert.equal(manifestSha256,digest(body));
});
test('review proposal is canonical in source order',()=>{
  const f=fixture(), first=run(f);f.request.decisions.reverse();assert.deepEqual(run(f),first);
});
test('review exclusion retains evidence without proposed value',()=>{
  const f=fixture();f.request.decisions[1]={id:f.result.words[1].id,action:'exclude',reason:'Synthetic exclusion'};
  const d=run(f).manifest.decisions[1];assert.equal(d.originalText,'012X');assert.equal(d.proposedText,null);
});
const cases=[
 ['missing decision',f=>f.request.decisions.pop()],
 ['duplicate decision',f=>f.request.decisions[1].id=f.request.decisions[0].id],
 ['unknown decision ID',f=>f.request.decisions[1].id='ocr-1-1-1-1-9'],
 ['wrong chain',f=>f.request.chainSha256='0'.repeat(64)],
 ['wrong raster',f=>f.request.rasterSha256='0'.repeat(64)],
 ['changed pixel',f=>f.bytes[f.bytes.length-1]=0],
 ['changed original',f=>f.result.words[1].text='0123'],
 ['unknown version',f=>f.request.version='1.0.0'],
 ['empty correction reason',f=>f.request.decisions[1].reason=''],
 ['no-op correction',f=>f.request.decisions[1].text='012X'],
 ['control character',f=>f.request.decisions[1].text='01\u202e23'],
 ['unsupported approval',f=>f.request.decisions[1].action='approve'],
 ['extra decision field',f=>f.request.decisions[0].operative=true],
 ['extra request field',f=>f.request.approved=true],
 ['invalid source score',f=>f.result.words[0].engineScore='101'],
 ['source already operative',f=>f.result.operative=true]
];
for(const [label,mutate] of cases)test('review blocks '+label,()=>{
  const f=fixture();mutate(f);const out=run(f);assert.equal(out.state,'blocked');assert.equal(out.manifest,null);
});
