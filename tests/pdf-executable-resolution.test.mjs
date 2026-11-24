// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,delimiter} from 'node:path';
import {spawnSync} from 'node:child_process';
import {popplerCandidates,resolvePopplerExecutable} from '../packages/intake/pdf-executable-resolution.mjs';
import {extractPdfWords} from '../packages/intake/pdf-word-extractor.mjs';

test('POSIX absolute candidates preserve search order',()=>assert.deepEqual(popplerCandidates('pdfinfo',{PATH:'/opt/tools:/usr/bin'},'linux'),['/opt/tools/pdfinfo','/usr/bin/pdfinfo']));
test('Windows explicit exe suffix, spaces and drive root',()=>assert.deepEqual(popplerCandidates('pdftotext',{PATH:'C:\\Program Files\\Poppler;D:\\'},'win32'),['C:\\Program Files\\Poppler\\pdftotext.exe','D:\\pdftotext.exe']));
for(const [name,command,env,platform] of [
  ['unknown executable','other',{PATH:'/bin'},'linux'],
  ['path injection','../pdfinfo',{PATH:'/bin'},'linux'],
  ['missing path','pdfinfo',{},'linux'],
  ['relative later entry','pdfinfo',{PATH:'/bin:tools'},'linux'],
  ['empty later entry','pdfinfo',{PATH:'/bin:'},'linux'],
  ['dot segment','pdfinfo',{PATH:'/opt/./bin'},'linux'],
  ['parent segment','pdfinfo',{PATH:'/opt/link/../bin'},'linux'],
  ['ambiguous double root','pdfinfo',{PATH:'//host/bin'},'linux'],
  ['Windows relative','pdfinfo',{PATH:'C:Tools'},'win32'],
  ['Windows UNC','pdfinfo',{PATH:'\\\\host\\share'},'win32'],
  ['Windows parent segment','pdfinfo',{PATH:'C:\\Tools\\..\\bin'},'win32'],
  ['Windows trailing alias','pdfinfo',{PATH:'C:\\Tools. '},'win32'],
  ['Windows alternate stream','pdfinfo',{PATH:'C:\\Tools:stream'},'win32'],
  ['control character','pdfinfo',{PATH:'/bin\n'},'linux'],
  ['too many entries','pdfinfo',{PATH:Array(257).fill('/bin').join(':')},'linux']
])test(name,()=>assert.equal(popplerCandidates(command,env,platform),null));

function fixture(fn){
  const root=mkdtempSync(join(tmpdir(),'catasto-synthetic-'));
  try{const a=join(root,'first'),b=join(root,'second');mkdirSync(a);mkdirSync(b);fn(a,b);}
  finally{rmSync(root,{recursive:true,force:true});}
}
const name=command=>command+(process.platform==='win32'?'.exe':'');
const file=(dir,command)=>{const p=join(dir,name(command));writeFileSync(p,'synthetic only',{mode:0o755});return p;};
test('missing executable does not use an implicit fallback',()=>fixture(a=>assert.deepEqual(resolvePopplerExecutable('pdfinfo',{PATH:a}),{code:'extractor_unavailable'})));
test('first present file is resolved absolutely',()=>fixture((a,b)=>{const p=file(a,'pdfinfo');file(b,'pdfinfo');assert.deepEqual(resolvePopplerExecutable('pdfinfo',{PATH:a+delimiter+b}),{executable:p});}));
test('missing first candidate can fall through',()=>fixture((a,b)=>{const p=file(b,'pdfinfo');assert.deepEqual(resolvePopplerExecutable('pdfinfo',{PATH:a+delimiter+b}),{executable:p});}));
test('directory candidate blocks rather than falling through',()=>fixture((a,b)=>{mkdirSync(join(a,name('pdfinfo')));file(b,'pdfinfo');assert.deepEqual(resolvePopplerExecutable('pdfinfo',{PATH:a+delimiter+b}),{code:'extractor_failed'});}));
test('nonexecutable POSIX candidate blocks',{skip:process.platform==='win32'},()=>fixture((a,b)=>{const p=file(a,'pdfinfo');chmodSync(p,0o600);file(b,'pdfinfo');assert.deepEqual(resolvePopplerExecutable('pdfinfo',{PATH:a+delimiter+b}),{code:'extractor_failed'});}));
test('actual child resolver ignores matching file in working directory',()=>fixture((a,b)=>{
  file(a,'pdfinfo');
  const moduleUrl=new URL('../packages/intake/pdf-executable-resolution.mjs',import.meta.url).href;
  const script='import {resolvePopplerExecutable} from '+JSON.stringify(moduleUrl)+';process.stdout.write(JSON.stringify(resolvePopplerExecutable("pdfinfo",{PATH:process.argv[1]})));';
  const r=spawnSync(process.execPath,['--input-type=module','-e',script,b],{cwd:a,encoding:'utf8',timeout:5000});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),{code:'extractor_unavailable'});
}));
test('extractor preflights both binaries before starting either',()=>fixture(a=>{
  file(a,'pdfinfo');
  const key=Object.keys(process.env).find(k=>k.toLowerCase()==='path')||'PATH',old=process.env[key];
  try{process.env[key]=a;const r=extractPdfWords(Buffer.from('%PDF-1.4\nsynthetic'));assert.equal(r.state,'blocked');assert.equal(r.issues[0].code,'extractor_unavailable');assert.equal(r.documentSha256,null);}
  finally{if(old===undefined)delete process.env[key];else process.env[key]=old;}
}));
