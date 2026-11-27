// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Read-only preflight for the initial synthetic comparison kit, not DOCFA validation.
import {lstat,open} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildOfflineComparisonKit} from './generate-docfa-comparison-kit.mjs';

async function fileState(path,expected){
  let info;
  try{info=await lstat(path);}catch(e){return e.code==='ENOENT'?'missing':'unreadable';}
  if(!info.isFile())return 'not_regular';
  if(info.size!==expected.length)return 'different';
  let handle;
  try{
    handle=await open(path,'r');
    const current=await handle.stat();
    if(!current.isFile()||current.dev!==info.dev||current.ino!==info.ino||current.size!==expected.length)return 'different';
    // Never allocate according to an untrusted on-disk length. Read one extra byte for growth.
    const bytes=Buffer.alloc(expected.length+1);
    let used=0;
    while(used<bytes.length){
      const {bytesRead}=await handle.read(bytes,used,bytes.length-used,used);
      if(!bytesRead)break;
      used+=bytesRead;
    }
    return used===expected.length&&bytes.subarray(0,used).equals(expected)?'identical':'different';
  }catch{return 'unreadable';}
  finally{if(handle)await handle.close();}
}

export async function verifyOfflineComparisonKit(directory){
  const root=resolve(directory);
  if(!(await lstat(root)).isDirectory())throw Error('kit_directory_required');
  const expected=buildOfflineComparisonKit(),files=[],parents=new Map();
  // Paths and expected bytes come exclusively from the current generator, never the supplied manifest.
  for(const [name,bytes] of expected){
    const path=join(root,name),parent=dirname(path);
    if(parent!==root&&!parents.has(parent)){
      try{parents.set(parent,(await lstat(parent)).isDirectory()?'directory':'not_regular');}
      catch(e){parents.set(parent,e.code==='ENOENT'?'missing':'unreadable');}
    }
    const parentState=parents.get(parent)??'directory';
    files.push({name,state:parentState==='directory'?await fileState(path,bytes):parentState});
  }
  const identical=files.filter(f=>f.state==='identical').length;
  return {version:'0.1.0',kind:'synthetic-offline-comparison-kit-preflight',
    warning:'NON UFFICIALE — confronto byte per byte con il generatore locale; non prova autenticita, vigenza o conformita.',
    expectedFiles:expected.size,identical,canonical:identical===expected.size,
    files,officialValidation:false,officialExport:false,signature:false,submission:false};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==3){console.error('Uso: node scripts/verify-docfa-comparison-kit.mjs <cartella-kit-locale>');process.exitCode=2;}
  else try{
    const report=await verifyOfflineComparisonKit(process.argv[2]);
    console.log(JSON.stringify(report,null,2));
    process.exitCode=report.canonical?0:1;
  }catch{console.error('Kit non verificabile: controllare la cartella e la versione locale.');process.exitCode=1;}
}
