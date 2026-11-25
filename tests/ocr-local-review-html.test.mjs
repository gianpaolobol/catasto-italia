// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {buildRasterReviewOverlay} from '../packages/intake/ocr-raster-review-overlay.mjs';
import {runInNewContext} from 'node:vm';
import {buildOcrReviewDecisions} from '../packages/intake/ocr-review-decisions.mjs';
import {replayOcrReviewProposal} from '../packages/intake/ocr-review-replay.mjs';
import {renderLocalOcrReview as render,renderLocalOcrEditor as renderEditor} from '../packages/intake/ocr-local-review-html.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const digest=x=>hash(JSON.stringify(x));
function fixture(text='0007',engineScore='95.25'){
  const bytes=Buffer.concat([Buffer.from('P5\n3 2\n255\n'),Buffer.from([0,1,2,253,254,255])]);
  const words=[{id:'ocr-1-1-1-1-1',boxPx:[1,0,3,2],text,engineScore,requiresHumanReview:true}];
  const raster={widthPx:3,heightPx:2,rasterSha256:hash(bytes),coordinateSpace:'raster-pixel-top-left'};
  const ocr={...raster,rasterByteLength:bytes.length};
  const run={evidenceSha256:digest({evidence:ocr,words})};
  const chain={version:'0.1.0',relationship:'local_pipeline_unverified',coordinateSpace:raster.coordinateSpace,
    pdfMappingVerified:false,raster:{...raster,evidenceSha256:digest(raster)},
    ocr:{...ocr,evidenceSha256:run.evidenceSha256},nativeRun:{...run,runSha256:digest(run)},
    reviewOverlay:buildRasterReviewOverlay(words,3,2).overlay};
  return {bytes,result:{version:'0.1.0',state:'pdf_ocr_candidates',operative:false,authenticated:false,
    requiresHumanReview:true,words,evidence:{...chain,chainSha256:digest(chain)}}};
}
test('offline HTML shows words and exact pixel coordinates with reciprocal anchors',()=>{
  const {result,bytes}=fixture(), view=render(result,bytes);
  assert.equal(view.state,'local_review_candidate');
  assert.equal(view.requiresHumanReview,true);assert.equal(view.authenticated,false);
  assert.match(view.html,/viewBox="0 0 3 2"/);
  assert.match(view.html,/<rect id="area-1" x="1" y="0" width="2" height="2">/);
  assert.match(view.html,/href="#word-1"/);assert.match(view.html,/href="#area-1"/);
  assert.match(view.html,/<bdi>0007<\/bdi>/);assert.match(view.html,/95\.25 \/ 100/);
  assert.ok(view.html.includes(result.evidence.chainSha256));
});
test('PNG independently decoded: dimensions and all grayscale samples unchanged',()=>{
  const {result,bytes}=fixture(), view=render(result,bytes);
  const png=Buffer.from(/data:image\/png;base64,([A-Za-z0-9+/=]+)/.exec(view.html)[1],'base64');
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  const chunks=[];
  for(let i=8;i<png.length;){
    const len=png.readUInt32BE(i), type=png.toString('ascii',i+4,i+8), data=png.subarray(i+8,i+8+len);
    // Independent bitwise CRC32, rather than the production lookup table.
    let crc=0xffffffff;
    for(const byte of png.subarray(i+4,i+8+len)){
      crc^=byte;for(let b=0;b<8;b++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
    }
    assert.equal(png.readUInt32BE(i+8+len),(crc^0xffffffff)>>>0);
    chunks.push({type,data});i+=len+12;
  }
  assert.deepEqual(chunks.map(x=>x.type),['IHDR','IDAT','IEND']);
  const hdr=chunks[0].data;
  assert.equal(hdr.readUInt32BE(0),3);assert.equal(hdr.readUInt32BE(4),2);
  assert.deepEqual([...hdr.subarray(8)],[8,0,0,0,0]);
  assert.deepEqual([...inflateSync(chunks[1].data)],[0,0,1,2,0,253,254,255]);
});
test('HTML escapes OCR content in text and accessibility labels',()=>{
  const {result,bytes}=fixture('"><script>alert(1)</script>&');
  const view=render(result,bytes);
  assert.equal(view.state,'local_review_candidate');
  assert.ok(!view.html.includes('<script>'));assert.ok(view.html.includes('&lt;script&gt;'));
  assert.ok(view.html.includes('&quot;&gt;'));assert.ok(view.html.includes('&amp;'));
});
test('no scripts, remote links, forms or remote assets and restrictive CSP',()=>{
  const {result,bytes}=fixture(), {html}=render(result,bytes);
  assert.match(html,/default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'/);
  assert.doesNotMatch(html,/<(?:script|form|iframe|link)\b/i);
  for(const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g))assert.match(m[1],/^(?:#(?:word|area)-\d+|data:image\/png;base64,)/);
});
test('tampered raster or text fails without HTML',()=>{
  const {result,bytes}=fixture();bytes[bytes.length-1]=0;
  assert.equal(render(result,bytes).html,null);
  const second=fixture();second.result.words[0].text='0008';
  assert.equal(render(second.result,second.bytes).html,null);
});
test('invalid raw score and bidi control rejected even with consistent hashes',()=>{
  for(const [text,score] of [['0007','101'],['0007','<b>'],['x\u202ey','99']]){
    const {result,bytes}=fixture(text,score);
    assert.deepEqual(render(result,bytes),{state:'blocked',html:null,issues:[{code:'review_invalid_display_word'}]});
  }
});
test('invalid result cannot emit a partial page',()=>{
  assert.equal(render(null,Buffer.alloc(0)).html,null);
  const {result,bytes}=fixture();result.operative=true;
  assert.equal(render(result,bytes).html,null);
});

test('oversized display word list and text fail before rendering',()=>{
  const {result,bytes}=fixture();
  result.words=Array.from({length:2049},()=>result.words[0]);
  assert.equal(render(result,bytes).issues[0].code,'review_invalid_display_word');
  const long=fixture('x'.repeat(513));
  assert.equal(render(long.result,long.bytes).issues[0].code,'review_invalid_display_word');
});

function editorFixture(text='012X'){
  const f=fixture(text),view=renderEditor(f.result,f.bytes);
  assert.equal(view.state,'local_editor_candidate');
  return {...f,html:view.html,script:/<script>([\s\S]*?)<\/script>/.exec(view.html)[1]};
}
// Execute the exact generated script against a minimal DOM contract. This is
// not a browser/download/CSP integration test.
function runEditor(f,action,text='',reason=''){
  let click,blob,downloads=0,focus=0,revoked=0;
  const feedback={textContent:''};
  const select={value:action,focus(){focus++;}};
  const row={dataset:{wordId:f.result.words[0].id},
    closest(){return {querySelector(){return {textContent:f.result.words[0].text};}};},
    querySelector(s){return s==='select'?select:{value:s==='[data-correction]'?text:reason};}};
  const editor={dataset:{chain:f.result.evidence.chainSha256,raster:f.result.evidence.raster.rasterSha256},
    querySelectorAll(){return [row];}};
  const button={addEventListener(event,fn){assert.equal(event,'click');click=fn;}};
  const document={getElementById(id){return {'review-export':button,'review-status':feedback,'review-editor':editor}[id];},
    createElement(tag){assert.equal(tag,'a');return {click(){downloads++;},remove(){}};},body:{append(){}}};
  const URL={createObjectURL(b){blob=b;return 'blob:local-test';},revokeObjectURL(){revoked++;}};
  runInNewContext(f.script,{document,URL,Blob,setTimeout(fn){fn();}});
  assert.equal(downloads,0);
  click();
  return {blob,downloads,focus,revoked,feedback:feedback.textContent};
}
test('editor starts undecided, binds exact source and permits only hashed static script',()=>{
  const f=editorFixture();
  assert.match(f.html,/<option value="">Da decidere<\/option>/);
  assert.ok(f.html.includes('data-chain="'+f.result.evidence.chainSha256+'"'));
  assert.ok(f.html.includes('data-raster="'+f.result.evidence.raster.rasterSha256+'"'));
  const h=createHash('sha256').update(f.script).digest('base64');
  assert.ok(f.html.includes("script-src 'sha256-"+h+"'"));
  assert.match(f.html,/form-action 'none'/);
  assert.doesNotMatch(f.html,/<(?:form|iframe|link)\b/i);
  assert.equal((f.html.match(/<script>/g)||[]).length,1);
});
test('editor escapes injected markup without altering the static script',()=>{
  const f=editorFixture('"><script>alert(1)</script>&');
  assert.ok(f.html.includes('&lt;script&gt;'));
  assert.equal(f.script,editorFixture().script);
  assert.equal((f.html.match(/<script>/g)||[]).length,1);
});
test('editor blocks altered raster',()=>{
  const f=fixture();f.bytes[f.bytes.length-1]=0;
  assert.equal(renderEditor(f.result,f.bytes).html,null);
});
for(const [action,text,reason,expected] of [
  ['retain','','',{action:'retain'}],
  ['correct','0123','Synthetic correction',{action:'correct',text:'0123',reason:'Synthetic correction'}],
  ['exclude','','Synthetic exclusion',{action:'exclude',reason:'Synthetic exclusion'}]
])test('editor exports '+action+' request accepted by the canonical engine',async()=>{
  const f=editorFixture(),out=runEditor(f,action,text,reason);
  assert.equal(out.downloads,1);assert.equal(out.revoked,1);
  const request=JSON.parse(await out.blob.text());
  assert.deepEqual(request.decisions,[{id:f.result.words[0].id,...expected}]);
  const proposal=buildOcrReviewDecisions(f.result,f.bytes,request);
  assert.equal(proposal.state,'review_proposal');
  assert.equal(proposal.manifest.operative,false);
  assert.equal(replayOcrReviewProposal(f.result,f.bytes,JSON.parse(JSON.stringify(proposal.manifest))).state,'replayed_review_proposal');
});
for(const [label,action,text,reason] of [
  ['undecided','','',''],['missing reason','correct','0123',''],
  ['no change','correct','012X','Synthetic'],['control','correct','01\u202e23','Synthetic'],
  ['oversized','correct','x'.repeat(513),'Synthetic'],['empty exclusion','exclude','','']
])test('editor blocks '+label+' without export',()=>{
  const out=runEditor(editorFixture(),action,text,reason);
  assert.equal(out.downloads,0);assert.equal(out.focus,1);
  assert.equal(out.blob,undefined);
});
