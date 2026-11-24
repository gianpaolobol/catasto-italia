// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {extractPdfWords} from './pdf-word-extractor.mjs';
import {isolateVisuraCells} from './visura-coordinate-cells.mjs';
import {intakeVisura} from './visura-fields.mjs';

const shape=(x,keys)=>x!==null&&typeof x==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const box=b=>Array.isArray(b)&&b.length===4&&[0,1,2,3].every(i=>Number.isSafeInteger(b[i])&&b[i]>=0&&b[i]<=1000000)&&b[0]<b[2]&&b[1]<b[3];
const contains=(a,b)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
const number=/^(?:\d{1,9}|\d{1,3}(?:\.\d{3}){1,2})(?:,\d{1,2})?$/;
const permittedPair=(field,a,b)=>field==='rent'?a==='Euro'&&number.test(b):
  ['consistency','surfaceTotal','surfaceExcludingOutdoor'].includes(field)&&number.test(a)&&
  (field==='consistency'?['vani','m²','m³'].includes(b):b==='m²');
const blocked=code=>({version:'0.1.0',state:'blocked',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false,documentSha256:null,intake:null,locators:[],issues:[{code}]});

// Only the original bytes enter this boundary. A manifest is a local review
// proposal, not an authenticated signature, official source or verified grouping.
// No automatic template, identifier grouping or numeric fragment concatenation.
export function reviewPdfVisura(bytes,manifest){
  if(!shape(manifest,['version','kind','documentSha256','sourceId','capturedOn','asOf','regions','joins'])||
    manifest.version!=='0.1.0'||manifest.kind!=='reviewer_selected_current_building_single_identifier'||
    typeof manifest.documentSha256!=='string'||!/^[0-9a-f]{64}$/.test(manifest.documentSha256)||
    !Array.isArray(manifest.regions)||manifest.regions.length<1||manifest.regions.length>128||
    !Array.isArray(manifest.joins)||manifest.joins.length>12)return blocked('invalid_manifest');
  const pdf=extractPdfWords(bytes);
  if(pdf.state!=='candidate_words')return blocked('pdf_extraction_blocked');
  if(pdf.documentSha256!==manifest.documentSha256)return blocked('document_digest_mismatch');
  const pages=new Map(pdf.pages.map(p=>[p.page,p]));
  const regions=new Map();
  for(const r of manifest.regions){
    if(!r||!id(r.id)||regions.has(r.id)||!pages.has(r.page)||!box(r.box))return blocked('invalid_manifest_region');
    regions.set(r.id,r);
  }
  const byId=new Map(pdf.spans.map(s=>[s.id,s])),consumed=new Set(),joinedRegions=new Set(),combined=[],originals=new Map();
  for(const j of manifest.joins){
    if(!shape(j,['regionId','spanIds'])||!id(j.regionId)||joinedRegions.has(j.regionId)||
       !Array.isArray(j.spanIds)||j.spanIds.length!==2||!j.spanIds.every(id)||j.spanIds[0]===j.spanIds[1])return blocked('invalid_join');
    const r=regions.get(j.regionId),a=byId.get(j.spanIds[0]),b=byId.get(j.spanIds[1]);
    if(!r||r.role!=='value'||!a||!b||consumed.has(a.id)||consumed.has(b.id)||
       a.page!==r.page||b.page!==r.page||!contains(r.box,a.box)||!contains(r.box,b.box)||
       !permittedPair(r.field,a.text,b.text))return blocked('unsupported_join');
    const p=pages.get(r.page),ha=a.box[3]-a.box[1],hb=b.box[3]-b.box[1];
    const vertical=Math.min(a.box[3],b.box[3])-Math.max(a.box[1],b.box[1]);
    const gap=b.box[0]-a.box[2];
    // Same approximate horizontal line, no overlap or far-apart column stitching.
    if(vertical<Math.max(ha,hb)/2||gap<0||gap*p.widthPt>Math.max(ha,hb)*p.heightPt)return blocked('join_geometry_mismatch');
    const s={id:a.id,page:r.page,box:[a.box[0],Math.min(a.box[1],b.box[1]),b.box[2],Math.max(a.box[3],b.box[3])],text:a.text+' '+b.text};
    combined.push(s);originals.set(s.id,[a,b]);consumed.add(a.id);consumed.add(b.id);joinedRegions.add(r.id);
  }
  const spans=pdf.spans.filter(s=>!consumed.has(s.id)).concat(combined);
  const isolated=isolateVisuraCells({kind:'reviewer_selected_current_building_cells',regions:manifest.regions,spans});
  if(isolated.state!=='candidate_cells')return { ...blocked('cell_isolation_blocked'),issues:[{code:'cell_isolation_blocked'},...isolated.issues]};
  const intake=intakeVisura({kind:'current_building_single_identifier',sourceId:manifest.sourceId,capturedOn:manifest.capturedOn,asOf:manifest.asOf,rows:isolated.rows});
  if(intake.state==='blocked')return blocked('field_intake_blocked');
  const locators=isolated.locators.map(l=>({...l,documentSha256:pdf.documentSha256,words:(originals.get(l.spanId)||[byId.get(l.spanId)]).map(s=>({id:s.id,page:s.page,box:[...s.box]}))}));
  return {version:'0.1.0',state:intake.state==='transcription_consistent'?'candidate_transcription':'needs_review',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false,documentSha256:pdf.documentSha256,intake,locators,issues:intake.issues};
}
