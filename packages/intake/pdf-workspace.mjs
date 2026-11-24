// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {mkdtempSync,lstatSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {isAbsolute,join} from 'node:path';

// A fresh working directory reduces accidental reads/writes in the caller's
// directory. The operator's OS temp root must be trusted. Not an OS sandbox.
export function withPdfWorkspace(env,run){
  let cwd,identity,result;
  try{
    const root=tmpdir();
    if(!isAbsolute(root))return {code:'extractor_workspace_failed'};
    cwd=mkdtempSync(join(realpathSync(root),'catasto-pdf-'));
    identity=lstatSync(cwd);
    if(!identity.isDirectory()||identity.isSymbolicLink()||
       (process.platform!=='win32'&&(identity.mode&0o077)!==0))result={code:'extractor_workspace_failed'};
    else result=run({cwd,env:{...env,TMPDIR:cwd,TMP:cwd,TEMP:cwd}});
  }catch{
    result={code:'extractor_workspace_failed'};
  }finally{
    if(cwd){
      try{
        const current=lstatSync(cwd);
        // Do not recursively delete a replacement directory.
        if(!identity||!current.isDirectory()||current.isSymbolicLink()||
           current.dev!==identity.dev||current.ino!==identity.ino)throw new Error('workspace replaced');
        rmSync(cwd,{recursive:true,force:false});
      }catch{result={code:'extractor_workspace_cleanup_failed'};}
    }
  }
  return result;
}
