// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,lstatSync,realpathSync,writeFileSync,renameSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {withPdfWorkspace} from '../packages/intake/pdf-workspace.mjs';
import {pdfProcessEnvironment} from '../packages/intake/pdf-process-environment.mjs';

test('workspace distinct from caller and all temp variables replaced',()=>{
  const env={PATH:'synthetic',TEMP:'old'};
  let dir;
  assert.deepEqual(withPdfWorkspace(env,({cwd,env:child})=>{
    dir=cwd;assert.notEqual(realpathSync(process.cwd()),cwd);
    assert.equal(child.TEMP,cwd);assert.equal(child.TMP,cwd);assert.equal(child.TMPDIR,cwd);
    assert.equal(child.PATH,'synthetic');return {ok:true};
  }),{ok:true});
  assert.equal(env.TEMP,'old');assert.equal(existsSync(dir),false);
});
test('POSIX private permissions',{skip:process.platform==='win32'},()=>{
  assert.deepEqual(withPdfWorkspace({},({cwd})=>({mode:lstatSync(cwd).mode&0o077})),{mode:0});
});
test('fresh directory for each invocation',()=>{
  const dirs=[];for(let i=0;i<2;i++)assert.deepEqual(withPdfWorkspace({},({cwd})=>{dirs.push(cwd);return {ok:true};}),{ok:true});
  assert.notEqual(dirs[0],dirs[1]);assert.ok(dirs.every(d=>!existsSync(d)));
});
test('temporary synthetic output removed after success',()=>{
  let output;assert.deepEqual(withPdfWorkspace({},({cwd})=>{output=join(cwd,'synthetic.txt');writeFileSync(output,'test');return {ok:true};}),{ok:true});
  assert.equal(existsSync(output),false);
});
test('temporary synthetic output removed on parser failure',()=>{
  let output;assert.deepEqual(withPdfWorkspace({},({cwd})=>{output=join(cwd,'synthetic.txt');writeFileSync(output,'test');return {code:'extractor_failed'};}),{code:'extractor_failed'});
  assert.equal(existsSync(output),false);
});
test('exceptions do not leak details and still clean up',()=>{
  let dir;assert.deepEqual(withPdfWorkspace({},({cwd})=>{dir=cwd;throw Error('synthetic detail');}),{code:'extractor_workspace_failed'});
  assert.equal(existsSync(dir),false);
});
test('replacement directory is not recursively deleted and result blocked',()=>{
  let dir,moved;
  try{
    const result=withPdfWorkspace({},({cwd})=>{dir=cwd;moved=cwd+'-moved';renameSync(cwd,moved);mkdirSync(cwd);writeFileSync(join(cwd,'marker'),'synthetic');return {ok:true};});
    assert.deepEqual(result,{code:'extractor_workspace_cleanup_failed'});
    assert.ok(existsSync(join(dir,'marker')));
  }finally{for(const d of [dir,moved])if(d)rmSync(d,{recursive:true,force:true});}
});
test('actual child receives dedicated cwd and temp paths',()=>{
  let dir;
  const result=withPdfWorkspace(pdfProcessEnvironment(),options=>{
    dir=options.cwd;
    const r=spawnSync(process.execPath,['-e','process.stdout.write(JSON.stringify([require("node:fs").realpathSync(process.cwd()),process.env.TMP,process.env.TEMP,process.env.TMPDIR]));'],{...options,encoding:'utf8',timeout:5000});
    assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
  });
  assert.deepEqual(result,[dir,dir,dir,dir]);assert.equal(existsSync(dir),false);
});
test('relative temporary root rejected before invoking callback',()=>{
  const moduleUrl=new URL('../packages/intake/pdf-workspace.mjs',import.meta.url).href;
  const script='import {withPdfWorkspace} from '+JSON.stringify(moduleUrl)+';process.stdout.write(JSON.stringify(withPdfWorkspace({},()=>({unexpected:true}))));';
  const env={...pdfProcessEnvironment(),TMPDIR:'relative',TEMP:'relative',TMP:'relative'};
  const r=spawnSync(process.execPath,['--input-type=module','-e',script],{env,encoding:'utf8',timeout:5000});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),{code:'extractor_workspace_failed'});
});
