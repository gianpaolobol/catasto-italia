// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {snapshotCanonicalPgm,bindOcrRasterEvidence} from './ocr-raster-evidence.mjs';
import {withPdfWorkspace} from './pdf-workspace.mjs';

const EXECUTABLE='/usr/bin/tesseract';
const MAX_OUTPUT=4*1024*1024;
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,authenticated:false,requiresHumanReview:true,evidence:null,nativeRun:null,words:[],issues:[{code}]});

// Linux-only diagnostic for a single, preselected uniform text block, not an
// entire visura. Requires trusted OS-installed Tesseract and Italian model.
// No implicit PATH resolution, arbitrary flags, supplied file paths or shell.
// Workspace separation and process limits are NOT an OS sandbox.
export function recognizeRasterBlock(rasterBytes){
  const snapshot=snapshotCanonicalPgm(rasterBytes);
  if(snapshot.code)return blocked(snapshot.code);
  if(process.platform!=='linux')return blocked('ocr_platform_unsupported');
  const args=['stdin','stdout','-l','ita','--psm','6','tsv'];
  const env={PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C',OMP_THREAD_LIMIT:'1'};
  const output=withPdfWorkspace(env,options=>{
    const result=spawnSync(EXECUTABLE,args,{input:snapshot.raster,timeout:10000,maxBuffer:MAX_OUTPUT,
      killSignal:'SIGKILL',shell:false,...options});
    if(result.error)return {code:result.error.code==='ENOENT'?'ocr_engine_unavailable':'ocr_engine_failed'};
    if(result.status!==0||result.signal||!Buffer.isBuffer(result.stdout)||!Buffer.isBuffer(result.stderr)||result.stderr.length)
      return {code:'ocr_engine_failed'};
    return {tsv:result.stdout};
  });
  if(output.code)return blocked(output.code);
  const bound=bindOcrRasterEvidence(snapshot.raster,output.tsv);
  if(bound.state==='blocked')return blocked(bound.issues[0].code);
  // A local subprocess association is not authentication of the executable,
  // model, document, text or geometry. Retain the binder's unverified status.
  const run={version:'0.1.0',relationship:'local_process_output_unverified',engine:'tesseract',
    language:'ita',pageSegmentationMode:6,evidenceSha256:bound.evidence.evidenceSha256};
  const runSha256=createHash('sha256').update(JSON.stringify(run)).digest('hex');
  return {...bound,nativeRun:{...run,runSha256}};
}
