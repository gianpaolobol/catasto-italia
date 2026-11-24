// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {partitionReviewedWords,reviewPdfVisuraBlocks} from '../packages/intake/reviewed-visura-blocks.mjs';
import {preparePdfVisuraReview} from '../packages/intake/reviewed-pdf-visura.mjs';
const fingerprint=p=>createHash('sha256').update(JSON.stringify([p.version,p.pages,p.spans])).digest('hex');
const fixture=()=>{
 const pdf={version:'0.1.0',state:'candidate_words',documentSha256:'a'.repeat(64),pages:[{page:1,widthPt:300,heightPt:500,wordCount:3},{page:2,widthPt:300,heightPt:500,wordCount:1}],spans:[
 {id:'p1-w1',page:1,box:[10,10,20,20],text:'007'},
 {id:'p1-w2',page:1,box:[10,110,20,120],text:'008'},
 {id:'p1-w3',page:1,box:[10,210,20,220],text:'ANNOTATION'},
 {id:'p2-w1',page:2,box:[10,10,20,20],text:'009'}]};
 pdf.extractionSha256=fingerprint(pdf);
 const manifest={version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,regions:[
 {id:'r1',role:'block',page:1,box:[0,0,100,100],blockId:'b1'},
 {id:'r2',role:'block',page:1,box:[0,100,100,200],blockId:'b2'},
 {id:'r3',role:'exclude',page:1,box:[0,200,100,300]},
 {id:'r4',role:'block',page:2,box:[0,0,100,100],blockId:'b1'}]};
 return {pdf,manifest};
};
test('review-selected blocks retain original page locators without cadastral inference',()=>{
 const {pdf,manifest}=fixture(),before=JSON.stringify({pdf,manifest}),r=partitionReviewedWords(pdf,manifest);
 assert.equal(r.state,'candidate_blocks');assert.equal(r.blocks.length,2);assert.equal(r.excludedCount,1);
 assert.deepEqual(r.blocks.map(b=>b.spans.map(s=>s.id)),[['p1-w1','p2-w1'],['p1-w2']]);
 assert.ok(r.blocks.every(b=>b.relationship==='unresolved'));assert.equal(r.blocks[0].spans[0].text,'007');
 for(const flag of ['operative','canExport','authenticated','identifierGroupingVerified'])assert.equal(r[flag],false);
 assert.equal(JSON.stringify({pdf,manifest}),before);
 r.blocks[0].spans[0].box[0]=0;assert.equal(pdf.spans[0].box[0],10);
});
const cases=[
 ['incorrect version',({manifest:m})=>m.version='0.2.0','invalid_manifest'],
 ['extra metadata',({manifest:m})=>m.relationship='graffata','invalid_manifest'],
 ['wrong document',({manifest:m})=>m.documentSha256='b'.repeat(64),'document_digest_mismatch'],
 ['wrong extraction',({manifest:m})=>m.extractionSha256='b'.repeat(64),'extraction_digest_mismatch'],
 ['tampered word',({pdf:p})=>p.spans[0].text='001','extraction_content_mismatch'],
 ['tampered page dimensions',({pdf:p})=>p.pages[0].widthPt=400,'extraction_content_mismatch'],
 ['invalid page dimensions',({pdf:p})=>p.pages[0].widthPt=0,'invalid_page'],
 ['wrong page order',({pdf:p})=>p.pages.reverse(),'invalid_page'],
 ['page count disagrees',({pdf:p})=>p.pages[0].wordCount=4,'page_word_count_mismatch'],
 ['bad span page',({pdf:p})=>p.spans[0].page=3,'invalid_span'],
 ['duplicate span id',({pdf:p})=>p.spans[1].id=p.spans[0].id,'invalid_span'],
 ['duplicate geometry',({pdf:p})=>p.spans[1].box=p.spans[0].box,'duplicate_span_geometry'],
 ['duplicate region id',({manifest:m})=>m.regions[1].id=m.regions[0].id,'invalid_region'],
 ['unknown page',({manifest:m})=>m.regions[0].page=3,'invalid_region'],
 ['invalid bounds',({manifest:m})=>m.regions[0].box=[0,0,0,100],'invalid_region'],
 ['overlap same group too',({manifest:m})=>{m.regions[1].blockId='b1';m.regions[0].box[3]=101},'overlapping_regions'],
 ['word outside all regions',({manifest:m})=>m.regions.pop(),'unassigned_span'],
 ['partial containment',({manifest:m})=>m.regions[0].box[2]=15,'boundary_crossing'],
 ['extra empty region',({manifest:m})=>m.regions.push({id:'r5',role:'block',page:1,box:[0,300,100,400],blockId:'b1'}),'empty_block_region'],
 ['excluded region claims group',({manifest:m})=>m.regions[2].blockId='b1','invalid_exclusion'],
 ['all excluded',({manifest:m})=>{m.regions=m.regions.map(({blockId,...r})=>({...r,role:'exclude'}))},'no_blocks'],
 ['group label invalid',({manifest:m})=>m.regions[0].blockId=' ','invalid_block_region']
];
for(const [name,mut,code] of cases)test(name,()=>{const f=fixture();mut(f);const r=partitionReviewedWords(f.pdf,f.manifest);assert.equal(r.state,'blocked');assert.equal(r.issues[0].code,code);assert.deepEqual(r.blocks,[]);assert.equal(r.documentSha256,null);assert.equal(r.operative,false);});
test('optional empty exclusion does not supply evidence',()=>{const {pdf,manifest}=fixture();manifest.regions.push({id:'r5',role:'exclude',page:1,box:[0,300,100,400]});assert.equal(partitionReviewedWords(pdf,manifest).state,'candidate_blocks');});
// Real Poppler invocation against a generated PDF containing two synthetic labels.
function pdfBytes(extra=''){
 const stream='BT /F1 12 Tf 30 420 Td (007) Tj ET\nBT /F1 12 Tf 30 320 Td (008) Tj ET\n'+extra;
 const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [4 0 R] >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 500] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
 let doc='%PDF-1.4\n';const offsets=[0];objs.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const xref=Buffer.byteLength(doc);
 doc+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return Buffer.from(doc);
}
test('native extraction and exact byte binding',()=>{
 const bytes=pdfBytes(),p=preparePdfVisuraReview(bytes);assert.equal(p.state,'candidate_words',JSON.stringify(p.issues));
 const m={version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:p.documentSha256,extractionSha256:p.extractionSha256,regions:[
 {id:'r1',role:'block',page:1,box:[0,0,1000000,250000],blockId:'b1'},
 {id:'r2',role:'block',page:1,box:[0,250000,1000000,1000000],blockId:'b2'}]};
 const r=reviewPdfVisuraBlocks(bytes,m);assert.equal(r.state,'candidate_blocks',JSON.stringify(r.issues));assert.deepEqual(r.blocks.map(b=>b.spans[0].text),['007','008']);
 assert.equal(reviewPdfVisuraBlocks(pdfBytes('BT /F1 12 Tf 30 220 Td (009) Tj ET\n'),m).issues[0].code,'document_digest_mismatch');
 assert.equal(reviewPdfVisuraBlocks(Buffer.from('%PDF-1.4\nbad'),m).issues[0].code,'pdf_extraction_blocked');
});
