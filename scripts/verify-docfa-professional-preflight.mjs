// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Documentary preflight only; no official download, execution, approval or transmission.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fingerprint,captureEvidenceManifest} from './verify-docfa-review-evidence.mjs';
import {verifyOfflineComparisonKit} from './verify-docfa-comparison-kit.mjs';
import {readOfflineReviewRecords} from './summarize-docfa-reviews.mjs';

const roles=['installer','archive','specifications','models'];
const shape=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const hex=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const note=v=>typeof v==='string'&&v.length>0&&v.length<=240&&v===v.trim()&&!/[\x00-\x1f\x7f]/.test(v);
const officialURL=v=>{
  if(typeof v!=='string'||v.length>2048||v!==v.trim()||/[\x00-\x20\x7f]/.test(v))return false;
  try{
    const u=new URL(v),h=u.hostname;
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&
      (h==='agenziaentrate.gov.it'||h.endsWith('.agenziaentrate.gov.it'));
  }catch{return false;}
};
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const digest=x=>createHash('sha256').update(canonical(x)).digest('hex');
const fail=code=>{throw Error(code);};
const exclusions={officialValidation:false,officialExport:false,signature:false,submission:false,sourceAuthenticityVerified:false,sourceCurrencyVerified:false,softwareExecuted:false};
const parse=x=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(x));

// The declared URL and verification method describe human acquisition only.
// Never resolve URLs or open a file based on a supplied path.
export function validateSourceDeclarations(x){
  if(!shape(x,['version','kind','docfaVersion','province','sources'])||x.version!=='0.1.0'||
    x.kind!=='local-docfa-source-declarations'||typeof x.docfaVersion!=='string'||!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(x.docfaVersion)||
    typeof x.province!=='string'||!/^[A-Z]{2}$/.test(x.province)||!Array.isArray(x.sources)||x.sources.length!==roles.length)
    fail('invalid_source_declarations');
  const found=new Map();
  for(const s of x.sources){
    if(!shape(s,['role','url','acquiredOn','sha256','verificationMethod'])||!roles.includes(s.role)||found.has(s.role)||
      !officialURL(s.url)||!date(s.acquiredOn)||!hex(s.sha256)||!note(s.verificationMethod))fail('invalid_source_declarations');
    found.set(s.role,s);
  }
  if(new Set(x.sources.map(s=>s.sha256)).size!==roles.length)fail('duplicate_source_content');
  return found;
}

export async function verifyProfessionalPreflight(kitDirectory,reviewDirectory){
  const kitRoot=resolve(kitDirectory),root=resolve(reviewDirectory);
  if(kitRoot===root)fail('separate_kit_and_review_directories_required');
  const kit=await verifyOfflineComparisonKit(kitRoot);
  if(!kit.canonical)fail('comparison_kit_not_canonical');
  // The evidence capture verifies bounded regular files, complete records and archive bytes.
  const actual=await captureEvidenceManifest(root);
  const saved=await fingerprint(root,'evidence-manifest.json',256*1024,true);
  if(!isDeepStrictEqual(parse(saved.content),actual))fail('review_evidence_manifest_mismatch');
  const sourceFile=await fingerprint(root,'docfa-source-declarations.json',32*1024,true);
  const declared=parse(sourceFile.content),sources=validateSourceDeclarations(declared);
  const archive=sources.get('archive'),spec=sources.get('specifications');
  if(actual.archives.length!==1||actual.archives[0].sha256!==archive.sha256)fail('archive_source_mismatch');
  const verifiedSources=[];
  for(const role of roles){
    const s=sources.get(role);
    const name=role==='archive'?'archive-'+s.sha256+'.bin':'docfa-'+role+'.bin';
    const file=role==='archive'?actual.archives[0]:await fingerprint(root,name,256*1024*1024);
    if(file.sha256!==s.sha256)fail('source_hash_mismatch');
    verifiedSources.push({role,bytes:file.bytes,sha256:file.sha256});
  }
  // Bind the source set to the exact records already used for the evidence capture.
  const records=await readOfflineReviewRecords(root);
  for(const c of actual.cases){
    const record=records.get(c.scenario);
    if(!record||digest(record)!==c.recordDigest)fail('review_record_changed');
    const e=record.environment;
    if(e.docfaVersion!==declared.docfaVersion||e.province!==declared.province||
      e.archiveSha256!==archive.sha256||e.specificationReference!=='sha256:'+spec.sha256||
      declared.sources.some(s=>s.acquiredOn>e.date))fail('review_source_binding_mismatch');
  }
  return {version:'0.1.0',kind:'local-docfa-documentary-preflight',
    warning:'NON UFFICIALE — completezza documentale e impronte; non autenticita, vigenza, compatibilita o collaudo professionale.',
    documentaryComplete:true,comparisonKitFiles:kit.identical,reviewChecks:actual.expectedChecks,
    reviewManifestSha256:saved.sha256,sourceDeclarationsSha256:sourceFile.sha256,
    docfaVersionDeclared:declared.docfaVersion,provinceDeclared:declared.province,verifiedSources,
    differencesDeclared:actual.differenceDeclared,notApplicableDeclared:actual.notApplicableDeclared,
    requiresDifferenceResolution:actual.differenceDeclared>0,...exclusions};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==4){
    console.error('Uso: node scripts/verify-docfa-professional-preflight.mjs <cartella-kit> <cartella-riscontri>');
    process.exitCode=1;
  }else try{
    const result=await verifyProfessionalPreflight(...process.argv.slice(2));
    console.log(JSON.stringify(result,null,2));
    process.exitCode=result.requiresDifferenceResolution?2:0;
  }catch(e){
    const code=typeof e?.message==='string'&&/^[a-z_]+$/.test(e.message)?e.message:'documentary_preflight_failed';
    console.error('Preflight documentale non completato: '+code);
    process.exitCode=1;
  }
}
