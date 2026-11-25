// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {parsePdfInfo} from './pdf-word-extractor.mjs';
import {snapshotCanonicalPgm} from './ocr-raster-evidence.mjs';
import {withPdfWorkspace} from './pdf-workspace.mjs';

const MAX_PDF=10*1024*1024, MAX_PIXELS=16_000_000;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,authenticated:false,
  requiresHumanReview:true,raster:null,evidence:null,issues:[{code}]});

// Only a single, unrotated, integral-size page with matching zero-origin boxes.
// The dimensions are reported by Poppler, not an authenticated PDF transform.
export function planDiagnosticRaster(info){
  const pages=parsePdfInfo(info);
  if(!pages||pages.length!==1)return {code:'raster_unsupported_page_geometry'};
  const rotations=info.split(/\r?\n/).filter(l=>/^Page\s+\d+\s+rot:/.test(l));
  if(rotations.length!==1||!/^Page\s+1\s+rot:\s+0\s*$/.test(rotations[0]))
    return {code:'raster_unsupported_rotation'};
  const {width,height}=pages[0];
  const widthPx=width*2,heightPx=height*2;
  if(!Number.isInteger(width)||!Number.isInteger(height)||widthPx>4000||heightPx>4000||
    widthPx*heightPx>MAX_PIXELS)return {code:'raster_page_limit'};
  return {page:1,dpi:144,widthPx,heightPx,reportedWidthPt:width,reportedHeightPt:height};
}

function run(executable,args,input,maxBuffer){
  return withPdfWorkspace({PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'},options=>{
    const result=spawnSync(executable,args,{input,timeout:10000,maxBuffer,killSignal:'SIGKILL',shell:false,...options});
    if(result.error)return {code:result.error.code==='ENOENT'?'raster_engine_unavailable':'raster_engine_failed'};
    if(result.status!==0||result.signal||!Buffer.isBuffer(result.stdout)||
      !Buffer.isBuffer(result.stderr)||result.stderr.length)return {code:'raster_engine_failed'};
    return {bytes:result.stdout};
  });
}

// Linux local diagnostic, trusted OS Poppler installation required. Not a sandbox.
// No caller-controlled flags or paths; no automatic interpretation of the page.
export function rasterizeDiagnosticPdf(bytes){
  if(!Buffer.isBuffer(bytes)||!(bytes.buffer instanceof ArrayBuffer)||bytes.length<8||bytes.length>MAX_PDF)
    return blocked('invalid_raster_pdf_input');
  const input=Buffer.from(bytes);
  if(!input.subarray(0,5).equals(Buffer.from('%PDF-')))return blocked('invalid_raster_pdf_input');
  if(process.platform!=='linux')return blocked('raster_platform_unsupported');
  const info=run('/usr/bin/pdfinfo',['-box','-f','1','-l','1','-'],input,4*1024*1024);
  if(info.code)return blocked(info.code);
  const plan=planDiagnosticRaster(info.bytes.toString('utf8'));
  if(plan.code)return blocked(plan.code);
  const out=run('/usr/bin/pdftoppm',['-f','1','-l','1','-singlefile','-r','144','-gray',
    '-cropbox','-hide-annotations','-'],input,MAX_PIXELS+64);
  if(out.code)return blocked(out.code);
  const snapshot=snapshotCanonicalPgm(out.bytes);
  if(snapshot.code)return blocked(snapshot.code);
  if(snapshot.widthPx!==plan.widthPx||snapshot.heightPx!==plan.heightPx)
    return blocked('raster_dimensions_mismatch');
  const evidence={version:'0.1.0',relationship:'local_render_unverified',coordinateSpace:'raster-pixel-top-left',
    ...plan,hideAnnotationsRequested:true,documentSha256:sha256(input),rasterSha256:sha256(snapshot.raster)};
  return {version:'0.1.0',state:'raster_candidate',operative:false,authenticated:false,requiresHumanReview:true,
    raster:snapshot.raster,evidence:{...evidence,evidenceSha256:sha256(JSON.stringify(evidence))},
    issues:[{code:'raster_mapping_unverified'}]};
}
