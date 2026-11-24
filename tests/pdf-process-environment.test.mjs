// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pdfProcessEnvironment} from '../packages/intake/pdf-process-environment.mjs';
import {extractPdfWords} from '../packages/intake/pdf-word-extractor.mjs';

test('POSIX allowlist drops synthetic credentials, proxy and loader overrides',()=>{
  const env={PATH:'/usr/bin:/bin',HOME:'/synthetic',API_KEY:'synthetic-only',HTTPS_PROXY:'synthetic',LD_PRELOAD:'synthetic',DYLD_INSERT_LIBRARIES:'synthetic',NODE_OPTIONS:'synthetic',NODE_V8_COVERAGE:'/synthetic',LANG:'it_IT'};
  const before={...env};
  assert.deepEqual(pdfProcessEnvironment(env,'linux'),{PATH:'/usr/bin:/bin',LC_ALL:'C',LANG:'C',NODE_V8_COVERAGE:''});
  assert.deepEqual(env,before);
});
test('Windows mixed-case names normalize to one key',()=>{
  assert.deepEqual(pdfProcessEnvironment({Path:'C:\\Tools;D:\\Program Files\\Poppler',SYSTEMROOT:'C:\\Windows',TEMP:'C:\\Temp',TOKEN:'synthetic'},'win32'),{PATH:'C:\\Tools;D:\\Program Files\\Poppler',SystemRoot:'C:\\Windows',LC_ALL:'C',LANG:'C',NODE_V8_COVERAGE:''});
});
const cases=[
  ['null',null,'linux'],
  ['missing path',{},'linux'],
  ['wrong case POSIX',{Path:'/bin'},'linux'],
  ['empty path',{PATH:''},'linux'],
  ['empty entry',{PATH:'/bin:'},'linux'],
  ['relative path',{PATH:'/bin:tools'},'linux'],
  ['current directory',{PATH:'.:/bin'},'linux'],
  ['control char',{PATH:'/bin\n'},'linux'],
  ['embedded NUL',{PATH:'/bin\0'},'linux'],
  ['quoted path',{PATH:'"/bin"'},'linux'],
  ['nonstring',{PATH:17},'linux'],
  ['missing root',{Path:'C:\\Tools'},'win32'],
  ['case collision',{PATH:'C:\\Tools',Path:'D:\\Tools',SystemRoot:'C:\\Windows'},'win32'],
  ['root collision',{Path:'C:\\Tools',SystemRoot:'C:\\Windows',SYSTEMROOT:'D:\\Windows'},'win32'],
  ['relative root',{Path:'C:\\Tools',SystemRoot:'Windows'},'win32'],
  ['drive-relative path',{Path:'C:Tools',SystemRoot:'C:\\Windows'},'win32'],
  ['UNC path',{Path:'\\\\server\\share',SystemRoot:'C:\\Windows'},'win32'],
  ['empty Windows entry',{Path:'C:\\Tools;',SystemRoot:'C:\\Windows'},'win32']
];
for(const [name,env,platform] of cases)test(name,()=>assert.equal(pdfProcessEnvironment(env,platform),null));
test('actual child sees no synthetic unlisted secret',()=>{
  const key='CATASTO_SYNTHETIC_SECRET',old=process.env[key];
  try{
    process.env[key]='not-a-real-secret';
    const env=pdfProcessEnvironment();
    assert.ok(env);
    const probe=['-e','process.stdout.write(JSON.stringify([process.env.CATASTO_SYNTHETIC_SECRET??null,process.env.LC_ALL??null]))'];
    const control=spawnSync(process.execPath,probe,{encoding:'utf8',timeout:5000});
    assert.equal(control.status,0);assert.equal(JSON.parse(control.stdout)[0],'not-a-real-secret');
    const r=spawnSync(process.execPath,probe,{env,encoding:'utf8',timeout:5000});
    assert.equal(r.status,0);assert.deepEqual(JSON.parse(r.stdout),[null,'C']);
  }finally{if(old===undefined)delete process.env[key];else process.env[key]=old;}
});
test('native extractor fails closed when actual search path is invalid',()=>{
  const key=Object.keys(process.env).find(k=>k.toLowerCase()==='path')||'PATH',old=process.env[key];
  try{process.env[key]='.';const r=extractPdfWords(Buffer.from('%PDF-1.4\nsynthetic'));assert.equal(r.state,'blocked');assert.equal(r.issues[0].code,'extractor_environment_invalid');assert.equal(r.documentSha256,null);}
  finally{if(old===undefined)delete process.env[key];else process.env[key]=old;}
});
