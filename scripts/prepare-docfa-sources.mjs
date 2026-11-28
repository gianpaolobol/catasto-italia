// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Local source intake. No download, executable launch or official claim.
import {lstat,realpath,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,dirname,basename,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {fingerprint} from './verify-docfa-review-evidence.mjs';
import {validateSourceDeclarations} from './verify-docfa-professional-preflight.mjs';

const roles=['installer','archive','specifications','models'];
const limit=256*1024*1024;
const repository=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const shape=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const inside=(root,path)=>{
  const r=relative(root,path);
  return r===''||(!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep));
};
const parse=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
const fail=code=>{throw Error(code);};
const exclusions={officialValidation:false,sourceAuthenticityVerified:false,sourceCurrencyVerified:false,
  softwareExecuted:false,officialExport:false,signature:false,submission:false};
export function sourceIntakeTemplate(){
  return {version:'0.1.0',kind:'local-docfa-source-intake',docfaVersion:'',province:'',
    sources:roles.map(role=>({role,url:'',acquiredOn:'',verificationMethod:''}))};
}
export async function prepareLocalSources(inputDirectory,outputDirectory){
  const repo=await realpath(repository);
  const inputPath=resolve(inputDirectory),outputPath=resolve(outputDirectory);
  if(!(await lstat(inputPath)).isDirectory())fail('source_directory_required');
  const input=await realpath(inputPath);
  const parent=await realpath(dirname(outputPath));
  const leaf=basename(outputPath);
  // Flat, portable new directory name; never an alternate data stream or device name.
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(leaf)||
    /^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i.test(leaf))fail('invalid_output_directory_name');
  const output=join(parent,leaf);
  if(inside(repo,input)||inside(repo,output)||inside(input,output)||inside(output,input))
    fail('separate_directories_outside_repository_required');
  const meta=await fingerprint(input,'source-intake.json',32*1024,true);
  const config=parse(meta.content);
  if(!shape(config,['version','kind','docfaVersion','province','sources'])||
    config.version!=='0.1.0'||config.kind!=='local-docfa-source-intake'||
    !Array.isArray(config.sources)||config.sources.length!==roles.length)
    fail('invalid_source_intake');
  const seen=new Set();
  for(const s of config.sources){
    if(!shape(s,['role','url','acquiredOn','verificationMethod'])||
      !roles.includes(s.role)||seen.has(s.role))fail('invalid_source_intake');
    seen.add(s.role);
  }
  // Validate metadata before reading potentially large files. These temporary distinct
  // values are never emitted; actual declarations are validated again with real hashes.
  const envelope={version:'0.1.0',kind:'local-docfa-source-declarations',
    docfaVersion:config.docfaVersion,province:config.province};
  validateSourceDeclarations({...envelope,sources:config.sources.map((s,i)=>({...s,sha256:String(i).repeat(64)}))});
  const files=[],sources=[];
  for(const role of roles){
    const sourceName=role+'.bin';
    const f=await fingerprint(input,sourceName,limit);
    const s=config.sources.find(x=>x.role===role);
    const name=role==='archive'?'archive-'+f.sha256+'.bin':'docfa-'+role+'.bin';
    files.push({role,sourceName,name,...f});
    sources.push({...s,sha256:f.sha256});
  }
  const declarations={...envelope,sources};
  const byRole=validateSourceDeclarations(declarations);
  // mkdir without recursive: never reuse or overwrite an existing review directory.
  await mkdir(output,{mode:0o700});
  for(const f of files){
    await copyFile(join(input,f.sourceName),join(output,f.name),constants.COPYFILE_EXCL);
    const copied=await fingerprint(output,f.name,limit);
    const original=await fingerprint(input,f.sourceName,limit);
    if(copied.sha256!==f.sha256||copied.bytes!==f.bytes||
      original.sha256!==f.sha256||original.bytes!==f.bytes)fail('source_changed_during_copy');
  }
  if((await fingerprint(input,'source-intake.json',32*1024)).sha256!==meta.sha256)
    fail('source_metadata_changed');
  // Completion marker is written last. An interrupted copy is not a complete bundle.
  await writeFile(join(output,'docfa-source-declarations.json'),JSON.stringify(declarations,null,2)+'\n',
    {flag:'wx',mode:0o600});
  return {version:'0.1.0',kind:'local-docfa-source-intake-report',
    warning:'NON UFFICIALE — file copiati e impronte; provenienza, vigenza e verifica professionale non attestate.',
    sourceBundlePrepared:true,
    environment:{docfaVersion:config.docfaVersion,province:config.province,
      archiveSha256:byRole.get('archive').sha256,
      specificationReference:'sha256:'+byRole.get('specifications').sha256},
    sources:files.map(({role,name,bytes,sha256})=>({role,name,bytes,sha256})),...exclusions};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const args=process.argv.slice(2);
  if(args.length===1&&args[0]==='--template')console.log(JSON.stringify(sourceIntakeTemplate(),null,2));
  else if(args.length===2)try{
    console.log(JSON.stringify(await prepareLocalSources(...args),null,2));
  }catch(e){
    const code=typeof e?.message==='string'&&/^[a-z_]+$/.test(e.message)?e.message:'source_intake_failed';
    console.error('Preparazione fonti non completata: '+code+
      '. Se creata, la nuova cartella potrebbe essere incompleta: non usarla.');
    process.exitCode=1;
  }else{
    console.error('Uso: node scripts/prepare-docfa-sources.mjs --template | <cartella-fonti> <nuova-cartella-riscontri>');
    process.exitCode=2;
  }
}
