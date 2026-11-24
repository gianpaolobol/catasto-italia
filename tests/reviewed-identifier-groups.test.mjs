// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {identifyReviewedBlocks} from '../packages/intake/reviewed-block-identifiers.mjs';
import {proposeReviewedIdentifierGroups,reviewPdfIdentifierGroups} from '../packages/intake/reviewed-identifier-groups.mjs';
import {preparePdfVisuraReview} from '../packages/intake/reviewed-pdf-visura.mjs';
const fields=['municipalityCode','section','sheet','parcel','subaltern'];
const fixture=()=>{
  const spans=[],regions=[],selections=[];
  for(let i=1;i<=3;i++){
    const b='b'+i,y=i*100;
    ['Z000','A','001','00'+i,'007','LABEL'].forEach((text,j)=>spans.push({id:b+'w'+j,page:1,box:[10+j*30,y,30+j*30,y+10],text}));
    regions.push({id:'r'+i,role:'block',page:1,box:[0,y-5,200,y+30],blockId:b});
    selections.push({blockId:b,fieldSpanIds:Object.fromEntries(fields.map((f,j)=>[f,b+'w'+j])),ignoredSpanIds:[b+'w5']});
  }
  const pdf={version:'0.1.0',state:'candidate_words',documentSha256:'a'.repeat(64),pages:[{page:1,widthPt:300,heightPt:500,wordCount:spans.length}],spans};
  pdf.extractionSha256=createHash('sha256').update(JSON.stringify([pdf.version,pdf.pages,pdf.spans])).digest('hex');
  const partition={version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,regions};
  const m={version:'0.1.0',kind:'reviewer_selected_block_identifiers',partition,sourceId:'synthetic',capturedOn:'2026-01-02',asOf:'2026-01-01',selections};
  const base=identifyReviewedBlocks(pdf,m);
  assert.equal(base.state,'candidate_identifiers',JSON.stringify(base.issues));
  const r={version:'0.1.0',kind:'reviewer_proposed_identifier_groups',identifierReviewSha256:base.reviewSha256,groups:[{groupId:'g1',blockIds:['b1','b2'],evidenceSpanIds:['b1w5']}],unresolvedBlockIds:['b3']};
  return {pdf,m,r};
};
const run=f=>proposeReviewedIdentifierGroups(f.pdf,f.m,f.r);
test('explicit grouping is a proposal only; preserve unresolved blocks and coverage',()=>{
  const f=fixture(),before=JSON.stringify(f),out=run(f);
  assert.equal(out.state,'needs_professional_review');assert.equal(out.groups[0].status,'proposed_unverified');
  assert.deepEqual(out.unresolvedBlockIds,['b3']);assert.deepEqual(out.groups[0].blocksWithoutSelectedEvidence,['b2']);
  assert.deepEqual(out.groups[0].evidence[0],{blockId:'b1',spanId:'b1w5',page:1,box:[160,100,180,110],regionId:'r1'});
  assert.match(out.groupReviewSha256,/^[0-9a-f]{64}$/);assert.equal(out.buildingCoreVersion,'0.1.0');
  for(const flag of ['operative','canExport','authenticated','identifierGroupingVerified'])assert.equal(out[flag],false);
  assert.equal(JSON.stringify(f),before);assert.equal(Object.hasOwn(out.groups[0],'unitId'),false);
  out.groups[0].evidence[0].box[0]=0;assert.equal(f.pdf.spans[5].box[0],160);
});
test('all blocks may remain explicitly unresolved',()=>{const f=fixture();f.r.groups=[];f.r.unresolvedBlockIds=['b1','b2','b3'];const o=run(f);assert.equal(o.state,'needs_professional_review');assert.deepEqual(o.groups,[]);});
test('two evidence selections cover both members but do not verify relation',()=>{const f=fixture();f.r.groups[0].evidenceSpanIds.push('b2w5');const o=run(f);assert.deepEqual(o.groups[0].blocksWithoutSelectedEvidence,[]);assert.equal(o.identifierGroupingVerified,false);});
test('digest changes with explicit review selection',()=>{const f=fixture(),a=run(f);f.r.groups[0].evidenceSpanIds=['b2w5'];const b=run(f);assert.notEqual(a.groupReviewSha256,b.groupReviewSha256);assert.equal(a.identifierReviewSha256,b.identifierReviewSha256);});
test('repeatable output',()=>{const f=fixture();assert.deepEqual(run(f),run(f));});
const cases=[
 ['version',f=>f.r.version='1.0.0','invalid_group_review'],
 ['kind',f=>f.r.kind='verified','invalid_group_review'],
 ['additional claim',f=>f.r.verified=true,'invalid_group_review'],
 ['digest format',f=>f.r.identifierReviewSha256='bad','invalid_group_review'],
 ['stale digest',f=>f.r.identifierReviewSha256='b'.repeat(64),'identifier_review_digest_mismatch'],
 ['changed mapping',f=>{const s=f.m.selections[0].fieldSpanIds;[s.sheet,s.parcel]=[s.parcel,s.sheet]},'identifier_review_digest_mismatch'],
 ['tampered word',f=>f.pdf.spans[5].text='OTHER','identifier_review_not_clear'],
 ['group of one',f=>f.r.groups[0].blockIds=['b1'],'invalid_group'],
 ['extra group claim',f=>f.r.groups[0].unitId='u1','invalid_group'],
 ['empty evidence',f=>f.r.groups[0].evidenceSpanIds=[],'invalid_group'],
 ['identifier word as evidence',f=>f.r.groups[0].evidenceSpanIds=['b1w2'],'invalid_or_reused_evidence'],
 ['evidence outside group',f=>f.r.groups[0].evidenceSpanIds=['b3w5'],'invalid_or_reused_evidence'],
 ['duplicate evidence',f=>f.r.groups[0].evidenceSpanIds.push('b1w5'),'invalid_or_reused_evidence'],
 ['unknown evidence',f=>f.r.groups[0].evidenceSpanIds=['unknown'],'invalid_or_reused_evidence'],
 ['duplicate member',f=>f.r.groups[0].blockIds=['b1','b1'],'invalid_or_reused_block'],
 ['unknown member',f=>f.r.groups[0].blockIds=['b1','b9'],'invalid_or_reused_block'],
 ['duplicate unresolved',f=>f.r.unresolvedBlockIds.push('b3'),'invalid_or_reused_block'],
 ['member also unresolved',f=>f.r.unresolvedBlockIds.push('b2'),'invalid_or_reused_block'],
 ['missing coverage',f=>f.r.unresolvedBlockIds=[],'incomplete_group_review'],
 ['overlapping groups',f=>f.r.groups.push({groupId:'g2',blockIds:['b2','b3'],evidenceSpanIds:['b3w5']}),'invalid_or_reused_block'],
 ['duplicate group id',f=>f.r.groups.push({groupId:'g1',blockIds:['b2','b3'],evidenceSpanIds:['b3w5']}),'invalid_group'],
 ['sparse evidence',f=>delete f.r.groups[0].evidenceSpanIds[0],'invalid_or_reused_evidence']
];
for(const [name,mut,code] of cases)test(name,()=>{const f=fixture();mut(f);const out=run(f);assert.equal(out.state,'blocked');assert.equal(out.issues[0].code,code);assert.deepEqual(out.groups,[]);assert.equal(out.groupReviewSha256,null);assert.equal(out.operative,false);});
test('exact duplicate identifiers require separate resolution',()=>{
  const f=fixture();f.pdf.spans[9].text=f.pdf.spans[3].text;
  f.m.partition.extractionSha256=f.pdf.extractionSha256=createHash('sha256').update(JSON.stringify([f.pdf.version,f.pdf.pages,f.pdf.spans])).digest('hex');
  const base=identifyReviewedBlocks(f.pdf,f.m);assert.equal(base.state,'needs_review');f.r.identifierReviewSha256=base.reviewSha256;
  assert.equal(run(f).issues[0].code,'identifier_review_not_clear');
});
function pdfBytes(){
  const stream='BT /F1 12 Tf 30 420 Td (Z000 A 001 002 007 LABEL) Tj ET\nBT /F1 12 Tf 30 220 Td (Z000 A 001 003 007 LABEL) Tj ET\n';
  const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [4 0 R] >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 500] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
  let doc='%PDF-1.4\n';const offsets=[0];objs.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const xref=Buffer.byteLength(doc);
  doc+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return Buffer.from(doc);
}
test('native PDF byte-bound proposal; wrong bytes rejected',()=>{
  const bytes=pdfBytes(),pdf=preparePdfVisuraReview(bytes);assert.equal(pdf.state,'candidate_words',JSON.stringify(pdf.issues));
  const regions=[{id:'r1',role:'block',page:1,box:[0,0,1000000,400000],blockId:'b1'},{id:'r2',role:'block',page:1,box:[0,400000,1000000,1000000],blockId:'b2'}];
  const selections=regions.map(r=>{const words=pdf.spans.filter(w=>w.box[1]>=r.box[1]&&w.box[3]<=r.box[3]).sort((a,b)=>a.box[0]-b.box[0]);assert.equal(words.length,6);return {blockId:r.blockId,fieldSpanIds:Object.fromEntries(fields.map((f,i)=>[f,words[i].id])),ignoredSpanIds:[words[5].id]};});
  const m={version:'0.1.0',kind:'reviewer_selected_block_identifiers',partition:{version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,regions},sourceId:'synthetic',capturedOn:'2026-01-02',asOf:'2026-01-01',selections};
  const base=identifyReviewedBlocks(pdf,m);assert.equal(base.state,'candidate_identifiers');
  const r={version:'0.1.0',kind:'reviewer_proposed_identifier_groups',identifierReviewSha256:base.reviewSha256,groups:[{groupId:'g1',blockIds:['b1','b2'],evidenceSpanIds:[selections[0].ignoredSpanIds[0]]}],unresolvedBlockIds:[]};
  assert.equal(reviewPdfIdentifierGroups(bytes,m,r).state,'needs_professional_review');
  assert.equal(reviewPdfIdentifierGroups(Buffer.from('%PDF-1.4\nbad'),m,r).issues[0].code,'pdf_extraction_blocked');
});
