// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Binds supplied bytes only; does not establish that OCR was run on this raster.
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {parseOcrTsv} from './ocr-tsv-candidates.mjs';

const MAX_PIXELS=16_000_000, MAX_TSV_BYTES=4*1024*1024;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const ownedBuffer=value=>Buffer.isBuffer(value)&&value.buffer instanceof ArrayBuffer;
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,authenticated:false,requiresHumanReview:true,evidence:null,words:[],issues:[{code}]});

// Deliberately restricted canonical P5: one 8-bit grayscale image, LF header,
// no comments or padding, no trailing data. Other legal PGM variants are unsupported.
export function bindOcrRasterEvidence(rasterBytes,tsvBytes){
  if(!ownedBuffer(rasterBytes)||rasterBytes.length>MAX_PIXELS+64)return blocked('invalid_raster_bytes');
  if(!ownedBuffer(tsvBytes)||tsvBytes.length>MAX_TSV_BYTES)return blocked('invalid_tsv_bytes');
  const raster=Buffer.from(rasterBytes),tsv=Buffer.from(tsvBytes);
  const header=/^P5\n([1-9]\d{0,4}) ([1-9]\d{0,4})\n255\n/.exec(raster.subarray(0,64).toString('latin1'));
  if(!header)return blocked('unsupported_pgm_header');
  const widthPx=Number(header[1]),heightPx=Number(header[2]),pixels=widthPx*heightPx;
  if(widthPx>20000||heightPx>20000||pixels>MAX_PIXELS||raster.length!==header[0].length+pixels)
    return blocked('invalid_pgm_size');
  let decoded;
  try{
    // Retain BOM so the strict TSV header rejects it; never replace invalid UTF-8.
    decoded=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(tsv);
  }catch{return blocked('invalid_tsv_utf8');}
  const parsed=parseOcrTsv(decoded,{widthPx,heightPx});
  if(parsed.state!=='ocr_candidates')return blocked(parsed.issues[0].code);
  const evidence={version:'0.1.0',relationship:'supplied_pair_unverified',format:'pgm-p5-canonical-8bit',
    widthPx,heightPx,rasterByteLength:raster.length,tsvByteLength:tsv.length,
    rasterSha256:sha256(raster),tsvSha256:sha256(tsv),parserVersion:parsed.version};
  const evidenceSha256=sha256(JSON.stringify({evidence,words:parsed.words}));
  return {version:'0.1.0',state:'ocr_evidence_candidates',operative:false,authenticated:false,requiresHumanReview:true,
    evidence:{...evidence,evidenceSha256},words:parsed.words,issues:[{code:'ocr_pair_unverified'}]};
}
