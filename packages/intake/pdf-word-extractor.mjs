// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const MAX_BYTES=10*1024*1024, MAX_OUTPUT=4*1024*1024, MAX_PAGES=128, MAX_WORDS=2048;
const HEADER='level\tpage_num\tpar_num\tblock_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,authenticated:false,identifierGroupingVerified:false,documentSha256:null,pages:[],spans:[],issues:[{code}]});
const decimal=s=>/^-?\d{1,9}(?:\.\d{1,9})?$/.test(s)?Number(s):NaN;
const natural=s=>/^\d{1,6}$/.test(s)?Number(s):NaN;
const control=/[\x00-\x1f\x7f]/;

// Poppler TSV uses rendered page coordinates, top-left origin. Page row left/top
// may contain stale values on later pages; only its width and height are used.
// Word positions are rounded to 0.01 pt: expand bounds conservatively.
export function parsePopplerTsv(tsv){
  if(typeof tsv!=='string'||Buffer.byteLength(tsv)>MAX_OUTPUT||tsv.includes('\ufffd'))return blocked('invalid_tsv');
  const rows=tsv.split(/\r?\n/);
  if(rows.pop()!==''||rows.shift()!==HEADER)return blocked('invalid_tsv_header');
  const pages=[],spans=[],seenGeometry=new Set();
  let page=null;
  for(const row of rows){
    const c=row.split('\t');
    if(c.length!==12)return blocked('invalid_tsv_row');
    const level=natural(c[0]),n=natural(c[1]),w=decimal(c[8]),h=decimal(c[9]);
    if(level===1){
      if(n!==pages.length+1||n>MAX_PAGES||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>100000||h>100000||c[11]!=='###PAGE###')return blocked('invalid_page');
      page={page:n,widthPt:w,heightPt:h,wordCount:0};pages.push(page);continue;
    }
    if(!page||n!==page.page)return blocked('invalid_page_order');
    if(level===3||level===4){
      if(c[11] !== (level===3?'###FLOW###':'###LINE###'))return blocked('invalid_structure');
      continue;
    }
    if(level!==5)return blocked('unsupported_level');
    const x=decimal(c[6]),y=decimal(c[7]),s=c[11];
    if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>page.widthPt||y+h>page.heightPt)return blocked('invalid_word_geometry');
    if(!s||s.length>512||s.trim()!==s||control.test(s))return blocked('invalid_word_text');
    if(spans.length>=MAX_WORDS)return blocked('word_limit');
    const lo=(v,d)=>Math.max(0,Math.floor((v-0.01)/d*1000000));
    const hi=(v,d)=>Math.min(1000000,Math.ceil((v+0.02)/d*1000000));
    const box=[lo(x,page.widthPt),lo(y,page.heightPt),hi(x+w,page.widthPt),hi(y+h,page.heightPt)];
    if(box[0]>=box[2]||box[1]>=box[3])return blocked('collapsed_word');
    const key=JSON.stringify([n,box]);if(seenGeometry.has(key))return blocked('duplicate_word_geometry');seenGeometry.add(key);
    page.wordCount++;spans.push({id:'p'+n+'-w'+page.wordCount,page:n,box,text:s});
  }
  if(!pages.length)return blocked('no_pages');
  if(pages.some(p=>p.wordCount===0))return blocked('page_without_text');
  return {version:'0.1.0',state:'candidate_words',operative:false,authenticated:false,identifierGroupingVerified:false,documentSha256:null,pages,spans,issues:[]};
}

// Local diagnostic only. Requires a trusted Poppler installation; production
// must run native PDF processing in a restricted worker. No OCR or layout inference.
export function extractPdfWords(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length<8||bytes.length>MAX_BYTES||!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))return blocked('invalid_pdf_input');
  const input=Buffer.from(bytes);
  const result=spawnSync('pdftotext',['-tsv','-cropbox','-enc','UTF-8','-','-'],{input,timeout:10000,maxBuffer:MAX_OUTPUT,windowsHide:true,shell:false});
  if(result.error)return blocked(result.error.code==='ENOENT'?'extractor_unavailable':'extractor_failed');
  if(result.status!==0||result.signal||!Buffer.isBuffer(result.stdout)||!Buffer.isBuffer(result.stderr)||result.stderr.length)return blocked('extractor_failed');
  const out=parsePopplerTsv(result.stdout.toString('utf8'));
  if(out.state==='candidate_words')out.documentSha256=createHash('sha256').update(input).digest('hex');
  return out;
}
