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
export function parsePopplerTsv(tsv,geometry=null){
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
      const g=geometry?.[n-1];
      if(geometry&&(!g||!((near(w,g.rawWidth)&&near(h,g.rawHeight))||(near(w,g.width)&&near(h,g.height)))))return blocked('page_geometry_mismatch');
      page={page:n,widthPt:g?.width??w,heightPt:g?.height??h,wordCount:0};pages.push(page);continue;
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
  if(geometry&&pages.length!==geometry.length)return blocked('page_count_mismatch');
  if(pages.some(p=>p.wordCount===0))return blocked('page_without_text');
  return {version:'0.1.0',state:'candidate_words',operative:false,authenticated:false,identifierGroupingVerified:false,documentSha256:null,pages,spans,issues:[]};
}

const near=(a,b)=>Math.abs(a-b)<=0.01;

// Cross-check dimensions against pdfinfo: pdftotext may emit unrotated dimensions
// even when its word coordinates are rotated. For now reject nonzero origins and
// unequal MediaBox/CropBox rather than guessing clipping or offsets.
export function parsePdfInfo(info){
  if(typeof info!=='string'||Buffer.byteLength(info)>MAX_OUTPUT||info.includes('\ufffd'))return null;
  const counts=[],encrypted=[],entries=new Map();
  for(const line of info.split(/\r?\n/)){
    let m;
    if((m=/^Pages:\s+(\d+)\s*$/.exec(line))){counts.push(natural(m[1]));continue;}
    if((m=/^Encrypted:\s+(.+)$/.exec(line))){encrypted.push(m[1].trim());continue;}
    if(!(m=/^Page\s+(\d+)\s+(size|rot|MediaBox|CropBox):\s*(.*?)\s*$/.exec(line)))continue;
    const n=natural(m[1]),key=m[2];
    if(!Number.isInteger(n)||n<1||n>MAX_PAGES)return null;
    const e=entries.get(n)||{};
    if(Object.hasOwn(e,key))return null;
    e[key]=m[3];entries.set(n,e);
  }
  if(counts.length!==1||encrypted.length!==1||encrypted[0]!=='no'||counts[0]<1||counts[0]>MAX_PAGES||entries.size!==counts[0])return null;
  const out=[];
  for(let n=1;n<=counts[0];n++){
    const e=entries.get(n);
    if(!e||Object.keys(e).length!==4)return null;
    const size=/^(\S+) x (\S+) pts(?: \([^\r\n]*\))?$/.exec(e.size);
    if(!size||!['0','90','180','270'].includes(e.rot))return null;
    const w=decimal(size[1]),h=decimal(size[2]);
    const media=e.MediaBox.split(/\s+/).map(decimal),crop=e.CropBox.split(/\s+/).map(decimal);
    if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>100000||h>100000||
       media.length!==4||crop.length!==4||!media.every(Number.isFinite)||!crop.every(Number.isFinite)||
       media[0]!==0||media[1]!==0||!media.every((v,i)=>v===crop[i])||
       !near(media[2],w)||!near(media[3],h))return null;
    const swap=e.rot==='90'||e.rot==='270';
    out.push({rawWidth:w,rawHeight:h,width:swap?h:w,height:swap?w:h});
  }
  return out;
}
function runPoppler(command,args,input){
  const r=spawnSync(command,args,{input,timeout:10000,maxBuffer:MAX_OUTPUT,windowsHide:true,shell:false,killSignal:'SIGKILL',env:{...process.env,LC_ALL:'C',LANG:'C'}});
  if(r.error)return {code:r.error.code==='ENOENT'?'extractor_unavailable':'extractor_failed'};
  if(r.status!==0||r.signal||!Buffer.isBuffer(r.stdout)||!Buffer.isBuffer(r.stderr)||r.stderr.length)return {code:'extractor_failed'};
  return {text:r.stdout.toString('utf8')};
}

// Local diagnostic only. Requires a trusted Poppler installation; production
// must run native PDF processing in a restricted worker. No OCR or layout inference.
export function extractPdfWords(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length<8||bytes.length>MAX_BYTES||!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))return blocked('invalid_pdf_input');
  const input=Buffer.from(bytes);
  const metadata=runPoppler('pdfinfo',['-box','-f','1','-l',String(MAX_PAGES),'-'],input);
  if(metadata.code)return blocked(metadata.code);
  const geometry=parsePdfInfo(metadata.text);
  if(!geometry)return blocked('unsupported_page_geometry');
  const result=runPoppler('pdftotext',['-tsv','-cropbox','-enc','UTF-8','-','-'],input);
  if(result.code)return blocked(result.code);
  const out=parsePopplerTsv(result.text,geometry);
  if(out.state==='candidate_words')out.documentSha256=createHash('sha256').update(input).digest('hex');
  return out;
}
