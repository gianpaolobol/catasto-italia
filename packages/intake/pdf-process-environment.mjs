// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Reduce ambient environment passed to native parsers. This is NOT an OS sandbox.
// PATH and installation directories must be trusted by the operator.
export function pdfProcessEnvironment(parent=process.env,platform=process.platform){
  if(!parent||typeof parent!=='object')return null;
  const windows=platform==='win32';
  const result={LC_ALL:'C',LANG:'C'};
  for(const name of windows?['PATH','SystemRoot']:['PATH']){
    const keys=Object.keys(parent).filter(k=>windows?k.toLowerCase()===name.toLowerCase():k===name);
    // Windows keys are case-insensitive; never silently choose between variants.
    if(keys.length!==1)return null;
    const value=parent[keys[0]];
    if(typeof value!=='string'||!value.trim()||value.includes('\0'))return null;
    result[name]=value;
  }
  return result;
}
