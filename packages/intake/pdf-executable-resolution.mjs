// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {accessSync,constants,statSync} from 'node:fs';
import {posix,win32} from 'node:path';

// Resolve only known Poppler programs from an already trusted installation PATH.
// Absolute invocation removes implicit current-directory / extension search.
// This does not authenticate binaries or protect against mutable directories.
export function popplerCandidates(command,env,platform=process.platform){
  if(command!=='pdfinfo'&&command!=='pdftotext')return null;
  const path=env?.PATH;
  if(typeof path!=='string'||!path||path.length>32768||/[\x00-\x1f\x7f"]/.test(path))return null;
  const windows=platform==='win32',api=windows?win32:posix;
  const entries=path.split(windows?';':':');
  if(entries.length>256)return null;
  for(const entry of entries){
    if(windows?!/^[A-Za-z]:[\\/]/.test(entry):!entry.startsWith('/')||entry.startsWith('//'))return null;
    // Avoid lexical normalization of dot segments across a symlink.
    const parts=(windows?entry.slice(2).split(/[\\/]/):entry.split('/'));
    if(parts.some(p=>p==='.'||p==='..'))return null;
    if(windows&&parts.some(p=>/[:*?<>|]|[. ]$/.test(p)))return null;
  }
  return entries.map(entry=>api.join(entry,command+(windows?'.exe':'')));
}

export function resolvePopplerExecutable(command,env){
  const candidates=popplerCandidates(command,env);
  if(!candidates)return {code:'extractor_environment_invalid'};
  for(const executable of candidates){
    try{
      const st=statSync(executable);
      if(!st.isFile())return {code:'extractor_failed'};
      accessSync(executable,constants.X_OK);
      return {executable};
    }catch(error){
      // A missing candidate may fall through; a present but inaccessible or
      // invalid installation must not silently select a different executable.
      if(error?.code!=='ENOENT'&&error?.code!=='ENOTDIR')return {code:'extractor_failed'};
    }
  }
  return {code:'extractor_unavailable'};
}
