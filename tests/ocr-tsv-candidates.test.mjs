// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseOcrTsv} from '../packages/intake/ocr-tsv-candidates.mjs';

const header='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
const row=(...v)=>v.join('\t');
const page=row(1,1,0,0,0,0,0,0,640,500,-1,'');
const block=row(2,1,1,0,0,0,10,10,600,450,-1,'');
const par=row(3,1,1,1,0,0,10,10,600,450,-1,'');
const line=row(4,1,1,1,1,0,10,10,300,30,-1,'');
const word=(n=1,x=10,score='96.063751',value='0007')=>row(5,1,1,1,1,n,x,10,30,20,score,value);
const make=(...rows)=>[header,...rows].join('\n')+'\n';
const dims={widthPx:640,heightPx:500};
const base=[page,block,par,line];
const valid=make(...base,word());
const expectBlock=(tsv,code,raster=dims)=>{
  const out=parseOcrTsv(tsv,raster);
  assert.equal(out.state,'blocked');assert.equal(out.issues[0].code,code);
  assert.deepEqual(out.words,[]);assert.equal(out.raster,null);assert.equal(out.operative,false);
};
test('valid candidate retains leading zeros, pixel geometry and exact score',()=>{
  const out=parseOcrTsv(valid,dims);
  assert.equal(out.state,'ocr_candidates');assert.equal(out.authenticated,false);
  assert.equal(out.operative,false);assert.equal(out.requiresHumanReview,true);
  assert.deepEqual(out.words,[{id:'ocr-1-1-1-1-1',boxPx:[10,10,40,30],text:'0007',engineScore:'96.063751',requiresHumanReview:true}]);
});
test('score 100 remains unverified',()=>assert.equal(parseOcrTsv(make(...base,word(1,10,'100','A/2')),dims).words[0].requiresHumanReview,true));
test('score zero is retained rather than discarded',()=>assert.equal(parseOcrTsv(make(...base,word(1,10,'0')),dims).words[0].engineScore,'0'));
test('CRLF accepted',()=>assert.equal(parseOcrTsv(valid.replace(/\n/g,'\r\n'),dims).state,'ocr_candidates'));
test('no final newline accepted',()=>assert.equal(parseOcrTsv(valid.trimEnd(),dims).state,'ocr_candidates'));
test('multiple words and lines retain separate IDs',()=>{
  const second=row(4,1,1,1,2,0,10,50,300,30,-1,'');
  const w2=row(5,1,1,1,2,1,10,50,30,20,'95','F');
  const out=parseOcrTsv(make(...base,word(),word(2,45),second,w2),dims);
  assert.equal(out.words.length,3);assert.equal(out.words[2].id,'ocr-1-1-1-2-1');
});
test('missing external dimensions',()=>expectBlock(valid,'invalid_raster_dimensions',{}));
test('oversized external dimensions',()=>expectBlock(valid,'invalid_raster_dimensions',{widthPx:20001,heightPx:500}));
test('dimension mismatch',()=>expectBlock(valid,'ocr_raster_mismatch',{widthPx:641,heightPx:500}));
test('bad header',()=>expectBlock(valid.replace('block_num','wrong'),'invalid_ocr_header_or_rows'));
test('oversized TSV',()=>expectBlock('x'.repeat(1048577),'invalid_ocr_tsv'));
test('truncated row',()=>expectBlock(make(...base,'5\t1'),'invalid_ocr_row'));
test('second page rejected',()=>expectBlock(make(...base,word(),page.replace('1\t1','1\t2')),'invalid_ocr_geometry_or_index'));
test('out of bounds word',()=>expectBlock(make(...base,word(1,620)),'invalid_ocr_geometry_or_index'));
test('no skipped parent level',()=>expectBlock(make(page,word()),'invalid_ocr_order'));
test('wrong active parent',()=>expectBlock(make(...base,word().replace('5\t1\t1\t1','5\t1\t2\t1')),'invalid_ocr_order'));
test('duplicate word index',()=>expectBlock(make(...base,word(),word(1,45)),'duplicate_ocr_index'));
test('different word index same box',()=>expectBlock(make(...base,word(),word(2,10)),'duplicate_ocr_word_geometry'));
test('score beyond 100',()=>expectBlock(make(...base,word(1,10,'100.000001')),'invalid_ocr_score'));
test('negative word score',()=>expectBlock(make(...base,word(1,10,'-1')),'invalid_ocr_score'));
test('control and bidi characters rejected',()=>expectBlock(make(...base,word(1,10,'90','A\u202eB')),'invalid_ocr_text'));
test('structural row cannot claim score',()=>expectBlock(make(page,block.replace('-1','90'),par,line,word()),'invalid_ocr_structure'));
test('empty page has no candidates',()=>expectBlock(make(page),'ocr_no_words'));
test('bad row after valid word never returns partial output',()=>expectBlock(make(...base,word(),'invalid'),'invalid_ocr_row'));

test('word inside raster but outside active line is rejected',()=>expectBlock(make(...base,word(1,300)),'ocr_child_outside_parent'));
test('word starts before active line',()=>expectBlock(make(...base,word(1,9)),'ocr_child_outside_parent'));
test('line outside paragraph is rejected',()=>expectBlock(make(page,block,par,row(4,1,1,1,1,0,10,450,300,30,-1,''),word()),'ocr_child_outside_parent'));
test('paragraph outside block is rejected',()=>expectBlock(make(page,block,row(3,1,1,1,0,0,9,10,600,450,-1,''),line,word()),'ocr_child_outside_parent'));
test('word exactly on line right boundary remains a candidate',()=>assert.equal(parseOcrTsv(make(...base,word(1,280)),dims).state,'ocr_candidates'));
test('sibling line cannot reuse previous line geometry',()=>{
  const second=row(4,1,1,1,2,0,10,50,300,30,-1,'');
  const wrong=row(5,1,1,1,2,1,10,10,30,20,'95','F');
  expectBlock(make(...base,word(),second,wrong),'ocr_child_outside_parent');
});
test('new block replaces all previous ancestors',()=>{
  const next=[row(2,1,2,0,0,0,400,100,100,100,-1,''),row(3,1,2,1,0,0,400,100,100,100,-1,''),row(4,1,2,1,1,0,400,100,100,20,-1,''),row(5,1,2,1,1,1,400,100,100,20,'95','F')];
  const out=parseOcrTsv(make(...base,word(),...next),dims);
  assert.equal(out.state,'ocr_candidates');assert.equal(out.words[1].text,'F');
});
