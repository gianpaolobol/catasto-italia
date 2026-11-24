// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Reduce ambient environment passed to native parsers. This is NOT an OS sandbox.
// PATH and installation directories must be trusted by the operator.
export function pdfProcessEnvironment(parent=process.env,platform=process.platform){
  if(!parent||typeof parent!=='object')return null;
  const windows=platform==='win32';
  const absolute=p=>windows?/^[A-Za-z]:[\\/]/.test(p):p.startsWith('/');
  const result={LC_ALL:'C',LANG:'C',NODE_V8_COVERAGE:''};
  for(const name of windows?['PATH','SystemRoot']:['PATH']){
    const keys=Object.keys(parent).filter(k=>windows?k.toLowerCase()===name.toLowerCase():k===name);
    // Windows keys are case-insensitive; never silently choose between variants.
    if(keys.length!==1)return null;
    const value=parent[keys[0]];
    if(typeof value!=='string'||!value.trim()||/[\x00-\x1f\x7f"]/.test(value))return null;
    // Empty/relative PATH entries can cause accidental lookup in the working directory.
    const entries=name==='PATH'?value.split(windows?';':':'):[value];
    if(!entries.every(absolute))return null;
    result[name]=value;
  }
  return result;
}
