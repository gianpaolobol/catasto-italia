// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parsePopplerTsv,extractPdfWords,parsePdfInfo} from '../packages/intake/pdf-word-extractor.mjs';
import {isolateVisuraCells} from '../packages/intake/visura-coordinate-cells.mjs';

const H='level\tpage_num\tpar_num\tblock_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
const page=(n=1,w=200,h=300)=>[1,n,0,0,0,0,0,0,w,h,-1,'###PAGE###'].join('\t');
const word=(n=1,x=20,y=40,w=20,h=12,s='009')=>[5,n,0,0,0,0,x,y,w,h,100,s].join('\t');
const tsv=(...rows)=>[H,...rows,''].join('\n');
const good=()=>tsv(page(),word());
const cases=[
['normal',good,r=>r.state==='candidate_words'&&r.spans[0].text==='009'&&r.spans[0].box[0]===99950],
['not authenticated',good,r=>!r.authenticated&&!r.operative&&!r.identifierGroupingVerified&&r.documentSha256===null],
['CRLF',()=>good().replaceAll('\n','\r\n'),r=>r.state==='candidate_words'],
['two pages',()=>tsv(page(),word(),page(2,300,200),word(2)),r=>r.pages.length===2&&r.spans[1].id==='p2-w1'],
['stale page origin ignored',()=>tsv(page(),word(),page(2).replace('\t0\t0\t200','\t90\t40\t200'),word(2)),r=>r.state==='candidate_words'],
['no header',()=>good().replace(H,'bad'),r=>r.state==='blocked'],
['truncated row',()=>good().trimEnd(),r=>r.state==='blocked'],
['invalid columns',()=>tsv(page(),word()+'\textra'),r=>r.state==='blocked'],
['page skip',()=>tsv(page(2),word(2)),r=>r.state==='blocked'],
['word before page',()=>tsv(word(),page()),r=>r.state==='blocked'],
['other page word',()=>tsv(page(),word(2)),r=>r.state==='blocked'],
['blank page',()=>tsv(page(),word(),page(2)),r=>r.issues[0].code==='page_without_text'],
['no pages',()=>tsv(),r=>r.issues[0].code==='no_pages'],
['negative x',()=>tsv(page(),word(1,-1)),r=>r.state==='blocked'],
['off page',()=>tsv(page(),word(1,190)),r=>r.state==='blocked'],
['zero width',()=>tsv(page(),word(1,20,40,0)),r=>r.state==='blocked'],
['nonfinite',()=>tsv(page(),word(1,'NaN')),r=>r.state==='blocked'],
['invalid page size',()=>tsv(page(1,0),word()),r=>r.state==='blocked'],
['leading whitespace',()=>tsv(page(),word(1,20,40,20,12,' 009')),r=>r.state==='blocked'],
['replacement character',()=>tsv(page(),word(1,20,40,20,12,'\ufffd')),r=>r.state==='blocked'],
['duplicate geometry',()=>tsv(page(),word(),word()),r=>r.issues[0].code==='duplicate_word_geometry'],
['unknown row',()=>tsv(page(),word().replace(/^5/,'9')),r=>r.state==='blocked'],
['page boundary',()=>tsv(page(),word(1,0,0,200,300)),r=>r.spans[0].box.join(',')==='0,0,1000000,1000000'],
['word count cap',()=>tsv(page(1,10000,10000),...Array.from({length:2049},(_,i)=>word(1,i*3,0,1,1))),r=>r.issues[0].code==='word_limit']
];
for(const [name,input,check] of cases)test(name,()=>{const r=parsePopplerTsv(input());assert.ok(check(r),JSON.stringify(r).slice(0,500));if(r.state==='blocked'){assert.deepEqual(r.spans,[]);assert.deepEqual(r.pages,[]);}});

// Minimal, entirely synthetic PDF; correct xref and byte lengths.
function pdf(rotations=[0],blank=false){
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids=[];
  for(const rotation of rotations){
    const p=objects.length+1,c=p+1;kids.push(p+' 0 R');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 300] /Rotate '+rotation+' /Resources << /Font << /F1 3 0 R >> >> /Contents '+c+' 0 R >>');
    const stream=blank?'q Q\n':'BT /F1 12 Tf 20 250 Td (009) Tj ET\n';
    objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream');
  }
  objects[1]='<< /Type /Pages /Count '+kids.length+' /Kids ['+kids.join(' ')+'] >>';
  let doc='%PDF-1.4\n';const offsets=[0];
  objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
  const xref=Buffer.byteLength(doc);
  doc+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Buffer.from(doc);
}
test('native PDF extraction and digest',()=>{const bytes=pdf(),r=extractPdfWords(bytes);assert.equal(r.state,'candidate_words',JSON.stringify(r.issues));assert.equal(r.documentSha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(r.spans[0].text,'009');assert.equal(r.pages[0].widthPt,200);assert.ok(r.spans[0].box[0]>90000&&r.spans[0].box[0]<110000);});
test('native PDF rotated pages',()=>{const r=extractPdfWords(pdf([0,90,180,270]));assert.equal(r.state,'candidate_words',JSON.stringify(r.issues));assert.deepEqual(r.pages.map(p=>[p.widthPt,p.heightPt]),[[200,300],[300,200],[200,300],[300,200]]);assert.equal(r.spans.length,4);assert.ok(r.spans[1].box[0]>700000);assert.ok(r.spans[2].box[1]>700000);assert.ok(r.spans[3].box[0]<200000);});
test('native blank PDF not OCR',()=>{const r=extractPdfWords(pdf([0],true));assert.equal(r.state,'blocked');assert.equal(r.documentSha256,null);});
test('invalid PDF input',()=>{for(const x of [null,'fake',Buffer.from('not PDF'),Buffer.alloc(10*1024*1024+1)])assert.equal(extractPdfWords(x).issues[0].code,'invalid_pdf_input');});
test('malformed PDF',()=>{assert.equal(extractPdfWords(Buffer.from('%PDF-1.4\nbad')).state,'blocked');});
test('native bridge to reviewed region isolation',()=>{const r=extractPdfWords(pdf());assert.equal(r.state,'candidate_words');const result=isolateVisuraCells({kind:'reviewer_selected_current_building_cells',regions:[{id:'synthetic-sheet',role:'value',page:1,box:[80000,100000,230000,220000],field:'sheet',section:'identifier',line:1}],spans:r.spans});assert.equal(result.state,'candidate_cells');assert.equal(result.rows[0].text,'009');assert.equal(result.identifierGroupingVerified,false);});

const info=(rot=90,crop='0.00 0.00 200.00 300.00')=>['Pages: 1','Encrypted: no','Page 1 size: 200 x 300 pts','Page 1 rot: '+rot,'Page 1 MediaBox: 0.00 0.00 200.00 300.00','Page 1 CropBox: '+crop].join('\n');
test('metadata rotation independent of TSV dimensions',()=>{const g=parsePdfInfo(info());assert.deepEqual(g,[{rawWidth:200,rawHeight:300,width:300,height:200}]);const r=parsePopplerTsv(tsv(page(),word(1,247,20,11,20)),g);assert.equal(r.state,'candidate_words');assert.equal(r.pages[0].widthPt,300);assert.ok(r.spans[0].box[0]>800000);});
test('metadata also accepts already rotated TSV dimensions',()=>{const r=parsePopplerTsv(tsv(page(1,300,200),word(1,247,20,11,20)),parsePdfInfo(info()));assert.equal(r.state,'candidate_words');});
test('metadata unsupported crop',()=>{assert.equal(parsePdfInfo(info(0,'10.00 0.00 200.00 300.00')),null);});
test('metadata duplicate rotation',()=>{assert.equal(parsePdfInfo(info()+'\nPage 1 rot: 0'),null);});
test('metadata invalid rotation',()=>{assert.equal(parsePdfInfo(info(45)),null);});
test('metadata encrypted',()=>{assert.equal(parsePdfInfo(info().replace('Encrypted: no','Encrypted: yes')),null);});
test('metadata inconsistent page count',()=>{assert.equal(parsePdfInfo(info().replace('Pages: 1','Pages: 2')),null);});
test('TSV dimensions mismatch metadata',()=>{const r=parsePopplerTsv(tsv(page(1,400,300),word()),parsePdfInfo(info()));assert.equal(r.issues[0].code,'page_geometry_mismatch');});
test('TSV missing page versus metadata',()=>{const g=parsePdfInfo(info());const r=parsePopplerTsv(tsv(page(),word()),[...g,...g]);assert.equal(r.issues[0].code,'page_count_mismatch');});

test('text PDF extraction rejects shared storage even with a valid PDF header',()=>{
  const source=pdf(), shared=Buffer.from(new SharedArrayBuffer(source.length));
  source.copy(shared);
  const result=extractPdfWords(shared);
  assert.equal(result.issues[0].code,'invalid_pdf_input');
  assert.equal(result.documentSha256,null);assert.deepEqual(result.spans,[]);
});
