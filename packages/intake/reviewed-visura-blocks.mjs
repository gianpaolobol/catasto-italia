// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {preparePdfVisuraReview} from './reviewed-pdf-visura.mjs';
const shape=(x,k)=>x!==null&&typeof x==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Object.keys(x).length===k.length&&k.every(v=>Object.hasOwn(x,v));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const digest=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const box=b=>Array.isArray(b)&&b.length===4&&[0,1,2,3].every(i=>Number.isSafeInteger(b[i])&&b[i]>=0&&b[i]<=1000000)&&b[0]<b[2]&&b[1]<b[3];
const overlap=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
const contains=(a,b)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
const flags=()=>({version:'0.1.0',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false});
const blocked=code=>({...flags(),state:'blocked',documentSha256:null,extractionSha256:null,blocks:[],excludedCount:0,issues:[{code}]});

// Internal diagnostic on an extraction snapshot. The snapshot is not authenticated.
// Regions are explicit review proposals, not units, identifiers or graffature.
export function partitionReviewedWords(pdf,manifest){
  if(!shape(manifest,['version','kind','documentSha256','extractionSha256','regions'])||
     manifest.version!=='0.1.0'||manifest.kind!=='reviewer_selected_visura_blocks'||
     !digest(manifest.documentSha256)||!digest(manifest.extractionSha256)||
     !Array.isArray(manifest.regions)||manifest.regions.length<1||manifest.regions.length>128)return blocked('invalid_manifest');
  if(!pdf||pdf.state!=='candidate_words'||!Array.isArray(pdf.pages)||pdf.pages.length<1||pdf.pages.length>128||
     !Array.isArray(pdf.spans)||pdf.spans.length<1||pdf.spans.length>2048)return blocked('invalid_extraction');
  if(pdf.documentSha256!==manifest.documentSha256)return blocked('document_digest_mismatch');
  if(pdf.extractionSha256!==manifest.extractionSha256)return blocked('extraction_digest_mismatch');
  const pages=new Map();
  for(const p of pdf.pages){
    if(!p||!Number.isSafeInteger(p.page)||p.page!==pages.size+1||!Number.isSafeInteger(p.wordCount)||p.wordCount<1||p.wordCount>2048)return blocked('invalid_page');
    pages.set(p.page,{expected:p.wordCount,actual:0});
  }
  const regions=[],ids=new Set(),groups=new Map();
  for(const r of manifest.regions){
    if(!r||!id(r.id)||ids.has(r.id)||!pages.has(r.page)||!box(r.box))return blocked('invalid_region');
    if(r.role==='block'){
      if(!shape(r,['id','role','page','box','blockId'])||!id(r.blockId))return blocked('invalid_block_region');
      if(!groups.has(r.blockId))groups.set(r.blockId,{blockId:r.blockId,relationship:'unresolved',regions:[],spans:[]});
      const g=groups.get(r.blockId);
      if(groups.size>32)return blocked('block_limit');
      g.regions.push({id:r.id,page:r.page,box:[...r.box]});
    }else if(!shape(r,['id','role','page','box'])||r.role!=='exclude')return blocked('invalid_exclusion');
    if(regions.some(q=>q.page===r.page&&overlap(q.box,r.box)))return blocked('overlapping_regions');
    ids.add(r.id);regions.push(r);
  }
  if(!groups.size)return blocked('no_blocks');
  const spanIds=new Set(),spanGeometry=new Set(),counts=new Map();
  let excludedCount=0;
  for(const s of pdf.spans){
    if(!shape(s,['id','page','box','text'])||!id(s.id)||spanIds.has(s.id)||!pages.has(s.page)||!box(s.box)||
       typeof s.text!=='string'||!s.text||s.text.length>512||s.text.trim()!==s.text||/[\x00-\x1f\x7f]/.test(s.text))return blocked('invalid_span');
    const key=JSON.stringify([s.page,s.box]);
    if(spanGeometry.has(key))return blocked('duplicate_span_geometry');
    spanIds.add(s.id);spanGeometry.add(key);pages.get(s.page).actual++;
    const hits=regions.filter(r=>r.page===s.page&&overlap(r.box,s.box));
    if(!hits.length)return blocked('unassigned_span');
    if(hits.length!==1||!contains(hits[0].box,s.box))return blocked('boundary_crossing');
    const r=hits[0];counts.set(r.id,(counts.get(r.id)||0)+1);
    if(r.role==='exclude'){excludedCount++;continue;}
    groups.get(r.blockId).spans.push({id:s.id,page:s.page,box:[...s.box],text:s.text,regionId:r.id});
  }
  if([...pages.values()].some(p=>p.actual!==p.expected))return blocked('page_word_count_mismatch');
  // Every selected block region must contain evidence; empty exclusions are harmless.
  if(regions.some(r=>r.role==='block'&&!counts.has(r.id)))return blocked('empty_block_region');
  return {...flags(),state:'candidate_blocks',documentSha256:pdf.documentSha256,extractionSha256:pdf.extractionSha256,blocks:[...groups.values()],excludedCount,issues:[]};
}

// Public byte-bound boundary: re-extract before partitioning, never trust a supplied snapshot.
export function reviewPdfVisuraBlocks(bytes,manifest){
  const pdf=preparePdfVisuraReview(bytes);
  if(pdf.state!=='candidate_words')return blocked('pdf_extraction_blocked');
  return partitionReviewedWords(pdf,manifest);
}
