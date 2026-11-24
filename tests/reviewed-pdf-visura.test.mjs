// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preparePdfVisuraReview,reviewPdfVisura} from '../packages/intake/reviewed-pdf-visura.mjs';

const fields=[
 ['municipalityCode','identifier','Z999'],['section','identifier','X'],
 ['sheet','identifier','009'],['parcel','identifier','123'],['subaltern','identifier','007'],
 ['category','classification','A/2'],['class','classification','2'],['zone','classification','01'],
 ['consistency','classification','4 vani'],['rent','classification','Euro 123,45'],
 ['surfaceTotal','surface','111 m\\262'],['surfaceExcludingOutdoor','surface','100 m\\262']
];
// Entirely synthetic PDF, with WinAnsi superscript two. No customer data.
function pdf({far=false,extra=false}={}){
 const lines=fields.map(([f,,v],i)=>'BT /F1 12 Tf 30 '+(460-30*i)+' Td ('+(far&&f==='rent'?'Euro             123,45':v)+') Tj ET\n');
 if(extra)lines.push('BT /F1 12 Tf 30 60 Td (EXTRA) Tj ET\n');
 const stream=lines.join('');
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [4 0 R] >>',
 '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
 '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 500] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>',
 '<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream'];
 let doc='%PDF-1.4\n';const offsets=[0];
 objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
 const xref=Buffer.byteLength(doc);
 doc+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return Buffer.from(doc);
}
function fixture(opts={}){
 const bytes=pdf(opts),p=preparePdfVisuraReview(bytes);
 assert.equal(p.state,'candidate_words',JSON.stringify(p.issues));
 const regions=[],joins=[];
 for(let i=0;i<fields.length;i++){
  const [field,section]=fields[i];
  // Known synthetic fixture positions, not a general automatic layout parser.
  const y=(500-(460-30*i))/500*1e6;
  const words=p.spans.filter(s=>s.box[1]>=y-24000&&s.box[3]<=y+14000).sort((a,b)=>a.box[0]-b.box[0]);
  assert.equal(words.length,i>=8?2:1,JSON.stringify({field,words,spans:p.spans}));
  const region={id:field,role:'value',page:1,box:[0,y-24000,1000000,y+14000],field,section,line:i+1};
  regions.push(region);
  if(words.length===2)joins.push({regionId:field,spanIds:words.map(s=>s.id)});
 }
 const manifest={version:'0.1.0',kind:'reviewer_selected_current_building_single_identifier',
 documentSha256:p.documentSha256,extractionSha256:p.extractionSha256,sourceId:'synthetic-doc',capturedOn:'2026-01-01',asOf:'2026-01-01',regions,joins};
 return {bytes,manifest,p};
}
test('complete synthetic PDF transcription, no operative claims',()=>{
 const {bytes,manifest}=fixture(),before=JSON.stringify(manifest),r=reviewPdfVisura(bytes,manifest);
 assert.equal(r.state,'candidate_transcription',JSON.stringify(r.issues));
 assert.equal(r.intake.fields.sheet.value,'009');assert.equal(r.intake.fields.subaltern.value,'007');
 assert.equal(r.intake.fields.rent.value,'123.45');
 assert.deepEqual(r.intake.fields.consistency.value,{value:'4.00',unit:'vani'});
 assert.deepEqual(r.intake.fields.surfaceTotal.value,{value:'111.00',unit:'m²'});
 assert.equal(r.locators.length,12);assert.equal(r.locators.find(l=>l.field==='rent').words.length,2);
 assert.ok(r.locators.every(l=>l.documentSha256===manifest.documentSha256&&l.words.every(w=>w.page===l.page)));
 assert.equal(r.extractionSha256,manifest.extractionSha256);
 for(const flag of ['operative','canExport','authenticated','identifierGroupingVerified'])assert.equal(r[flag],false);
 assert.equal(JSON.stringify(manifest),before);
});
const cases=[
 ['wrong PDF digest',m=>{m.documentSha256='0'.repeat(64)},'document_digest_mismatch'],
 ['wrong extraction snapshot',m=>{m.extractionSha256='0'.repeat(64)},'extraction_digest_mismatch'],
 ['wrong version',m=>{m.version='0.2.0'},'invalid_manifest'],
 ['unexpected metadata',m=>{m.unknown=true},'invalid_manifest'],
 ['missing extraction fingerprint',m=>{delete m.extractionSha256},'invalid_manifest'],
 ['region outside page set',m=>{m.regions[0].page=2},'invalid_manifest_region'],
 ['duplicate region id',m=>{m.regions[1].id=m.regions[0].id},'invalid_manifest_region'],
 ['reversed words',m=>{m.joins[0].spanIds.reverse()},'unsupported_join'],
 ['duplicate joined word',m=>{m.joins[0].spanIds[1]=m.joins[0].spanIds[0]},'invalid_join'],
 ['unknown joined word',m=>{m.joins[0].spanIds[0]='p1-w999'},'unsupported_join'],
 ['join without region',m=>{m.joins[0].regionId='missing'},'unsupported_join'],
 ['duplicate join region',m=>{m.joins.push({...m.joins[0]})},'invalid_join'],
 ['attempt numeric identifier join',m=>{m.joins[0].regionId='sheet'},'unsupported_join'],
 ['missing explicit join',m=>{m.joins.shift()},'cell_isolation_blocked'],
 ['wrong capture chronology',m=>{m.asOf='2027-01-01'},'field_intake_blocked'],
 ['overlapping regions',m=>{m.regions[0].box[3]=m.regions[1].box[3]},'cell_isolation_blocked'],
 ['region excludes selected word',m=>{m.regions.find(r=>r.id==='rent').box[2]=1000},'unsupported_join']
];
for(const [name,mut,code] of cases)test(name,()=>{
 const {bytes,manifest}=fixture();mut(manifest);const r=reviewPdfVisura(bytes,manifest);
 assert.equal(r.state,'blocked',JSON.stringify(r.issues));assert.equal(r.issues[0].code,code);
 assert.deepEqual(r.locators,[]);assert.equal(r.intake,null);assert.equal(r.documentSha256,null);
});
test('same manifest with different PDF bytes',()=>{const {manifest}=fixture();const r=reviewPdfVisura(pdf({extra:true}),manifest);assert.equal(r.issues[0].code,'document_digest_mismatch');});
test('far apart words must not bridge columns',()=>{const {bytes,manifest}=fixture({far:true});assert.equal(reviewPdfVisura(bytes,manifest).issues[0].code,'join_geometry_mismatch');});
test('unassigned content blocks entire isolation',()=>{const {bytes,manifest}=fixture({extra:true});const r=reviewPdfVisura(bytes,manifest);assert.equal(r.issues[0].code,'cell_isolation_blocked');assert.deepEqual(r.locators,[]);});
test('malformed PDF does not disclose words',()=>{const {manifest}=fixture();const r=reviewPdfVisura(Buffer.from('%PDF-1.4\nbad'),manifest);assert.equal(r.issues[0].code,'pdf_extraction_blocked');assert.equal(r.intake,null);});
