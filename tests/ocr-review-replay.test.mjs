// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildRasterReviewOverlay} from '../packages/intake/ocr-raster-review-overlay.mjs';
import {buildOcrReviewDecisions} from '../packages/intake/ocr-review-decisions.mjs';
import {replayOcrReviewProposal} from '../packages/intake/ocr-review-replay.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const digest=v=>hash(JSON.stringify(v));
function fixture(){
  const widthPx=320,heightPx=100;
  const bytes=Buffer.concat([Buffer.from('P5\n320 100\n255\n'),Buffer.alloc(32000,255)]);
  const words=[{id:'ocr-1-1-1-1-1',boxPx:[0,20,90,50],text:'0007',engineScore:'95.25',requiresHumanReview:true},
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

function saved(){
  const f=fixture(),out=buildOcrReviewDecisions(f.result,f.bytes,f.request);
  assert.equal(out.state,'review_proposal');
  return {...f,manifest:JSON.parse(JSON.stringify(out.manifest))};
}
const replay=f=>replayOcrReviewProposal(f.result,f.bytes,f.manifest);
function rehash(m){const {manifestSha256,...body}=m;m.manifestSha256=digest(body);}
test('replay round trip returns an owned canonical proposal',()=>{
  const f=saved(),out=replay(f);
  assert.equal(out.state,'replayed_review_proposal');
  assert.deepEqual(out.manifest,f.manifest);
  assert.notEqual(out.manifest,f.manifest);
  assert.notEqual(out.manifest.decisions[0].boxPx,f.manifest.decisions[0].boxPx);
  assert.equal(out.manifest.decisions[0].proposedText,'0007');
  assert.equal(out.manifest.operative,false);
  assert.equal(out.manifest.authenticated,false);
  assert.equal(out.manifest.requiresHumanReview,true);
});
test('replay accepts JSON key reordering but returns canonical order',()=>{
  const f=saved(),original=structuredClone(f.manifest);
  f.manifest=Object.fromEntries(Object.entries(f.manifest).reverse());
  f.manifest.decisions=f.manifest.decisions.map(d=>Object.fromEntries(Object.entries(d).reverse()));
  assert.deepEqual(replay(f).manifest,original);
});
test('replay exclusion preserves original with null proposed text',()=>{
  const f=fixture();
  f.request.decisions[1]={id:f.result.words[1].id,action:'exclude',reason:'Synthetic exclusion'};
  const out=buildOcrReviewDecisions(f.result,f.bytes,f.request);
  assert.equal(out.state,'review_proposal');
  f.manifest=out.manifest;
  const restored=replay(f);
  assert.equal(restored.state,'replayed_review_proposal');
  assert.equal(restored.manifest.decisions[1].proposedText,null);
  assert.equal(restored.manifest.decisions[1].originalText,'012X');
});
test('unkeyed digest cannot authenticate a different valid proposal',()=>{
  const f=saved();
  f.request.decisions[1].text='0124';
  f.manifest=buildOcrReviewDecisions(f.result,f.bytes,f.request).manifest;
  const out=replay(f);
  assert.equal(out.state,'replayed_review_proposal');
  assert.equal(out.manifest.authenticated,false);
});
const cases=[
  ['wrong digest',f=>f.manifest.manifestSha256='0'.repeat(64)],
  ['unknown version',f=>f.manifest.version='1.0.0'],
  ['wrong kind',f=>f.manifest.kind='approval'],
  ['operative flag',f=>f.manifest.operative=true],
  ['authenticated flag',f=>f.manifest.authenticated=true],
  ['review bypass',f=>f.manifest.requiresHumanReview=false],
  ['extra header',f=>f.manifest.approved=true],
  ['wrong source chain',f=>{f.manifest.chainSha256='0'.repeat(64);rehash(f.manifest);}],
  ['wrong raster hash',f=>{f.manifest.rasterSha256='0'.repeat(64);rehash(f.manifest);}],
  ['changed pixel',f=>f.bytes[f.bytes.length-1]=0],
  ['changed source text',f=>f.result.words[0].text='0008'],
  ['forged original text with rehash',f=>{f.manifest.decisions[0].originalText='0008';rehash(f.manifest);}],
  ['forged score with rehash',f=>{f.manifest.decisions[0].engineScore='100';rehash(f.manifest);}],
  ['forged coordinate with rehash',f=>{f.manifest.decisions[0].boxPx[0]++;rehash(f.manifest);}],
  ['forged retain value with rehash',f=>{f.manifest.decisions[0].proposedText='0008';rehash(f.manifest);}],
  ['extra decision property',f=>f.manifest.decisions[0].approved=true],
  ['missing decision',f=>f.manifest.decisions.pop()],
  ['duplicate ID',f=>f.manifest.decisions[1].id=f.manifest.decisions[0].id],
  ['reordered decisions with rehash',f=>{f.manifest.decisions.reverse();rehash(f.manifest);}],
  ['empty correction reason',f=>{f.manifest.decisions[1].reason='';rehash(f.manifest);}],
  ['sparse decisions',f=>delete f.manifest.decisions[0]],
  ['sparse coordinates',f=>delete f.manifest.decisions[0].boxPx[0]],
  ['extra coordinate property',f=>f.manifest.decisions[0].boxPx.extra=true],
  ['oversized decision list',f=>f.manifest.decisions=Array(2049).fill(f.manifest.decisions[0])],
];
for(const [label,mutate] of cases)test('replay blocks '+label,()=>{
  const f=saved();mutate(f);const out=replay(f);
  assert.equal(out.state,'blocked');assert.equal(out.manifest,null);
});

test('signed zero source coordinate survives canonical JSON replay',()=>{
  const f=saved();
  // JSON evidence digests do not distinguish -0 from 0.
  f.result.words[0].boxPx[0]=-0;
  const rebuilt=buildOcrReviewDecisions(f.result,f.bytes,f.request);
  assert.equal(rebuilt.state,'review_proposal');
  assert.equal(Object.is(rebuilt.manifest.decisions[0].boxPx[0],0),true);
  assert.deepEqual(replay(f).manifest,f.manifest);
});
