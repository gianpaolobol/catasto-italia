// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {identifyReviewedBlocks,reviewPdfBlockIdentifiers} from '../packages/intake/reviewed-block-identifiers.mjs';
import {preparePdfVisuraReview} from '../packages/intake/reviewed-pdf-visura.mjs';
const fields=['municipalityCode','section','sheet','parcel','subaltern'];
const fingerprint=p=>createHash('sha256').update(JSON.stringify([p.version,p.pages,p.spans])).digest('hex');
const fixture=()=>{
 const spans=[];
 for(const [b,values] of [['b1',['Z000','—','001','002','007','LABEL']],['b2',['Z000','A','001','003','008','LABEL']]]){
  values.forEach((text,i)=>{const x=i*30+10,y=b==='b1'?10:110;spans.push({id:b+'w'+i,page:1,box:[x,y,x+20,y+10],text});});
 }
 const pdf={version:'0.1.0',state:'candidate_words',documentSha256:'a'.repeat(64),pages:[{page:1,widthPt:300,heightPt:500,wordCount:spans.length}],spans};
 pdf.extractionSha256=fingerprint(pdf);
 const partition={version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,regions:[
 {id:'r1',role:'block',page:1,box:[0,0,200,100],blockId:'b1'},{id:'r2',role:'block',page:1,box:[0,100,200,200],blockId:'b2'}]};
 const manifest={version:'0.1.0',kind:'reviewer_selected_block_identifiers',partition,sourceId:'synthetic',capturedOn:'2026-01-02',asOf:'2026-01-01',selections:['b1','b2'].map(blockId=>({blockId,fieldSpanIds:Object.fromEntries(fields.map((f,i)=>[f,blockId+'w'+i])),ignoredSpanIds:[blockId+'w5']}))};
 return {pdf,manifest};
};
const refresh=({pdf,manifest})=>manifest.partition.extractionSha256=pdf.extractionSha256=fingerprint(pdf);
test('two isolated candidate identifiers with exact locators and explicit absence',()=>{
 const {pdf,manifest}=fixture(),before=JSON.stringify({pdf,manifest}),r=identifyReviewedBlocks(pdf,manifest);
 assert.equal(r.state,'candidate_identifiers',JSON.stringify(r.issues));assert.equal(r.candidates.length,2);
 assert.deepEqual(r.candidates[0].identifier,{municipalityCode:'Z000',section:null,sheet:'001',parcel:'002',subaltern:'007'});
 assert.equal(r.candidates[1].identifier.subaltern,'008');
 assert.equal(r.candidates[0].locators[0].spanId,'b1w0');
 assert.equal(r.candidates[0].ignoredLocators[0].spanId,'b1w5');assert.equal(Object.hasOwn(r.candidates[0].ignoredLocators[0],'text'),false);
 assert.ok(r.candidates.every(c=>c.relationship==='unresolved'&&!Object.hasOwn(c,'unitId')&&!Object.hasOwn(c,'status')));
 assert.equal(r.buildingCoreVersion,'0.1.0');assert.match(r.reviewSha256,/^[0-9a-f]{64}$/);
 for(const f of ['operative','canExport','authenticated','identifierGroupingVerified'])assert.equal(r[f],false);
 assert.equal(JSON.stringify({pdf,manifest}),before);
 r.candidates[0].locators[0].box[0]=0;assert.equal(pdf.spans[0].box[0],10);
});
const cases=[
 ['wrong version',({manifest:m})=>m.version='0.2.0','invalid_manifest'],
 ['unrequested claim',({manifest:m})=>m.status='observed','invalid_manifest'],
 ['invalid date',({manifest:m})=>m.asOf='2026-02-30','invalid_manifest'],
 ['future asOf',({manifest:m})=>m.asOf='2026-01-03','invalid_manifest'],
 ['invalid source',({manifest:m})=>m.sourceId=' ','invalid_manifest'],
 ['wrong document',({manifest:m})=>m.partition.documentSha256='b'.repeat(64),'partition_blocked'],
 ['tampered word',({pdf:p})=>p.spans[0].text='Z001','partition_blocked'],
 ['missing selection',({manifest:m})=>m.selections.pop(),'incomplete_block_review'],
 ['duplicate block',({manifest:m})=>m.selections[1].blockId='b1','invalid_selection'],
 ['unknown block',({manifest:m})=>m.selections[0].blockId='b3','invalid_selection'],
 ['missing section',({manifest:m})=>delete m.selections[0].fieldSpanIds.section,'invalid_selection'],
 ['extra field',({manifest:m})=>m.selections[0].fieldSpanIds.category='b1w5','invalid_selection'],
 ['cross block',({manifest:m})=>m.selections[0].fieldSpanIds.sheet='b2w2','invalid_field_span'],
 ['reuse field span',({manifest:m})=>m.selections[0].fieldSpanIds.parcel='b1w2','invalid_field_span'],
 ['unknown span',({manifest:m})=>m.selections[0].fieldSpanIds.parcel='missing','invalid_field_span'],
 ['ignored field span',({manifest:m})=>m.selections[0].ignoredSpanIds.push('b1w2'),'invalid_ignored_span'],
 ['duplicate ignored',({manifest:m})=>m.selections[0].ignoredSpanIds.push('b1w5'),'invalid_ignored_span'],
 ['ignored other block',({manifest:m})=>m.selections[0].ignoredSpanIds.push('b2w5'),'invalid_ignored_span'],
 ['unreviewed word',({manifest:m})=>m.selections[0].ignoredSpanIds=[],'unreviewed_block_words'],
 ['unsupported identifier',f=>{f.pdf.spans[3].text='ABC';refresh(f)},'identifier_transcription_incomplete']
];
for(const [name,mut,code] of cases)test(name,()=>{const f=fixture();mut(f);const r=identifyReviewedBlocks(f.pdf,f.manifest);assert.equal(r.state,'blocked');assert.equal(r.issues[0].code,code);assert.deepEqual(r.candidates,[]);assert.equal(r.reviewSha256,null);assert.equal(r.operative,false);});
test('explicit absence is not inferred from missing fields',()=>{const f=fixture();f.pdf.spans[4].text='—';refresh(f);const r=identifyReviewedBlocks(f.pdf,f.manifest);assert.equal(r.state,'candidate_identifiers');assert.equal(r.candidates[0].identifier.subaltern,null);assert.equal(r.candidates[0].locators[4].spanId,'b1w4');});
test('same exact identifier is flagged, not collapsed into a unit',()=>{const f=fixture();for(let i=0;i<5;i++)f.pdf.spans[6+i].text=f.pdf.spans[i].text;refresh(f);const r=identifyReviewedBlocks(f.pdf,f.manifest);assert.equal(r.state,'needs_review');assert.deepEqual(r.issues,[{code:'repeated_exact_identifier',blockIds:['b1','b2']}]);assert.equal(r.candidates.length,2);});
test('changed field mapping changes review digest even with same source PDF',()=>{const f=fixture();const a=identifyReviewedBlocks(f.pdf,f.manifest);const s=f.manifest.selections[0].fieldSpanIds;[s.sheet,s.parcel]=[s.parcel,s.sheet];const b=identifyReviewedBlocks(f.pdf,f.manifest);assert.equal(b.state,'candidate_identifiers');assert.equal(a.documentSha256,b.documentSha256);assert.notEqual(a.reviewSha256,b.reviewSha256);assert.equal(b.candidates[0].identifier.sheet,'002');});
test('deterministic review for exact same manifest',()=>{const f=fixture();assert.deepEqual(identifyReviewedBlocks(f.pdf,f.manifest),identifyReviewedBlocks(f.pdf,f.manifest));});
function pdfBytes(extra=''){
 const stream='BT /F1 12 Tf 30 420 Td (Z000 A 001 002 007 LABEL) Tj ET\n'+extra;
 const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [4 0 R] >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 500] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
 let doc='%PDF-1.4\n';const offsets=[0];objs.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const xref=Buffer.byteLength(doc);
 doc+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return Buffer.from(doc);
}
test('native PDF byte-bound identifier path',()=>{
 const bytes=pdfBytes(),pdf=preparePdfVisuraReview(bytes);assert.equal(pdf.state,'candidate_words',JSON.stringify(pdf.issues));
 const byText=new Map(pdf.spans.map(s=>[s.text,s.id]));
 const partition={version:'0.1.0',kind:'reviewer_selected_visura_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,regions:[{id:'r1',role:'block',page:1,box:[0,0,1000000,1000000],blockId:'b1'}]};
 const m={version:'0.1.0',kind:'reviewer_selected_block_identifiers',partition,sourceId:'synthetic',capturedOn:'2026-01-02',asOf:'2026-01-01',selections:[{blockId:'b1',fieldSpanIds:Object.fromEntries(fields.map((f,i)=>[f,byText.get(['Z000','A','001','002','007'][i])])),ignoredSpanIds:[byText.get('LABEL')]}]};
 const r=reviewPdfBlockIdentifiers(bytes,m);assert.equal(r.state,'candidate_identifiers',JSON.stringify(r.issues));assert.equal(r.candidates[0].identifier.subaltern,'007');
 assert.equal(reviewPdfBlockIdentifiers(pdfBytes('BT /F1 12 Tf 30 220 Td (009) Tj ET\n'),m).state,'blocked');
 assert.equal(reviewPdfBlockIdentifiers(Buffer.from('%PDF-1.4\nbad'),m).issues[0].code,'pdf_extraction_blocked');
});
