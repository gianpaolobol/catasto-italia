// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Diagnostic intake of precomputed Tesseract TSV for ONE raster image.
// No native process, no PDF coordinate mapping, no cadastral inference.
const HEADER='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
const MAX_CHARS=1024*1024, MAX_DIM=20000, MAX_WORDS=2048, MAX_ROWS=8192;
const integer=s=>/^(0|[1-9]\d{0,5})$/.test(s)?Number(s):NaN;
const dimension=n=>Number.isInteger(n)&&n>0&&n<=MAX_DIM;
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,authenticated:false,requiresHumanReview:true,raster:null,words:[],issues:[{code}]});
export function parseOcrTsv(tsv,raster){
  if(!raster||!dimension(raster.widthPx)||!dimension(raster.heightPx))return blocked('invalid_raster_dimensions');
  const widthPx=raster.widthPx,heightPx=raster.heightPx;
  if(typeof tsv!=='string'||tsv.length>MAX_CHARS||tsv.includes('\ufffd'))return blocked('invalid_ocr_tsv');
  const rows=tsv.split(/\r?\n/);
  if(rows.at(-1)==='')rows.pop();
  if(rows.shift()!==HEADER||!rows.length||rows.length>MAX_ROWS)return blocked('invalid_ocr_header_or_rows');
  const words=[],seen=new Set();
  let current=null;
  for(const row of rows){
    const c=row.split('\t');
    if(c.length!==12)return blocked('invalid_ocr_row');
    const [level,page,block,par,line,word,x,y,w,h]=c.slice(0,10).map(integer);
    if(![level,page,block,par,line,word,x,y,w,h].every(Number.isFinite)||level<1||level>5||page!==1||
      w<1||h<1||x+w>widthPx||y+h>heightPx)return blocked('invalid_ocr_geometry_or_index');
    const path=[page,block,par,line,word];
    if(path.some((v,i)=>i<level?v<1:v!==0))return blocked('invalid_ocr_hierarchy');
    const key=path.join('/');
    if(seen.has(key))return blocked('duplicate_ocr_index');
    seen.add(key);
    if(level===1){
      if(current||x!==0||y!==0||w!==widthPx||h!==heightPx)return blocked('ocr_raster_mismatch');
    }else{
      // Parent must have appeared and still be the active ancestor.
      if(!current||current.level<level-1||
        path.slice(0,level-1).some((v,i)=>v!==current.path[i]))return blocked('invalid_ocr_order');
    }
    current={level,path};
    if(level<5){
      if(c[10]!=='-1'||c[11]!=='')return blocked('invalid_ocr_structure');
      continue;
    }
    const raw=c[10],value=c[11];
    if(!/^(0|[1-9]\d{0,2})(?:\.\d{1,9})?$/.test(raw)||Number(raw)>100)return blocked('invalid_ocr_score');
    if(!value||value.length>512||value.trim()!==value||/[\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u.test(value))return blocked('invalid_ocr_text');
    if(words.length>=MAX_WORDS)return blocked('ocr_word_limit');
    words.push({id:'ocr-'+path.join('-'),boxPx:[x,y,x+w,y+h],text:value,engineScore:raw,requiresHumanReview:true});
  }
  if(!words.length)return blocked('ocr_no_words');
  return {version:'0.1.0',state:'ocr_candidates',operative:false,authenticated:false,requiresHumanReview:true,
    raster:{widthPx,heightPx},words,issues:[{code:'ocr_unverified'}]};
}
