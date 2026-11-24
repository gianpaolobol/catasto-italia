// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {preparePdfVisuraReview} from './reviewed-pdf-visura.mjs';
import {partitionReviewedWords} from './reviewed-visura-blocks.mjs';
import {intakeVisura} from './visura-fields.mjs';

const fields=['municipalityCode','section','sheet','parcel','subaltern'];
const shape=(x,k)=>x!==null&&typeof x==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Object.keys(x).length===k.length&&k.every(v=>Object.hasOwn(x,v));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const date=x=>typeof x==='string'&&/^[1-9]\d{3}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const flags=()=>({version:'0.1.0',buildingCoreVersion:'0.1.0',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false});
const blocked=code=>({...flags(),state:'blocked',documentSha256:null,extractionSha256:null,source:null,asOf:null,candidates:[],issues:[{code}]});

// Diagnostic only: re-partition the supplied extraction using the existing verified
// partitioner. No unit, ownership, observed claim or relationship is created.
export function identifyReviewedBlocks(pdf,manifest){
  if(!shape(manifest,['version','kind','partition','sourceId','capturedOn','asOf','selections'])||
    manifest.version!=='0.1.0'||manifest.kind!=='reviewer_selected_block_identifiers'||
    !id(manifest.sourceId)||!date(manifest.capturedOn)||!date(manifest.asOf)||manifest.asOf>manifest.capturedOn||
    !Array.isArray(manifest.selections)||manifest.selections.length<1||manifest.selections.length>32)return blocked('invalid_manifest');
  const partition=partitionReviewedWords(pdf,manifest.partition);
  if(partition.state!=='candidate_blocks')return blocked('partition_blocked');
  if(manifest.selections.length!==partition.blocks.length)return blocked('incomplete_block_review');
  const blocks=new Map(partition.blocks.map(b=>[b.blockId,b])),seen=new Set(),candidates=[],issues=[];
  for(const s of manifest.selections){
    if(!shape(s,['blockId','fieldSpanIds','ignoredSpanIds'])||!id(s.blockId)||!blocks.has(s.blockId)||seen.has(s.blockId)||
       !shape(s.fieldSpanIds,fields)||!Array.isArray(s.ignoredSpanIds)||s.ignoredSpanIds.length>2048)return blocked('invalid_selection');
    seen.add(s.blockId);
    const block=blocks.get(s.blockId),words=new Map(block.spans.map(w=>[w.id,w])),used=new Set(),rows=[],locators=[];
    for(const field of fields){
      const spanId=s.fieldSpanIds[field];
      if(!id(spanId)||!words.has(spanId)||used.has(spanId))return blocked('invalid_field_span');
      const word=words.get(spanId);
      used.add(spanId);
      rows.push({field,section:'identifier',page:word.page,line:rows.length+1,text:word.text});
      locators.push({field,spanId,page:word.page,box:[...word.box],regionId:word.regionId});
    }
    for(const spanId of s.ignoredSpanIds){
      if(!id(spanId)||!words.has(spanId)||used.has(spanId))return blocked('invalid_ignored_span');
      used.add(spanId);
    }
    if(used.size!==words.size)return blocked('unreviewed_block_words');
    const parsed=intakeVisura({kind:'current_building_single_identifier',sourceId:manifest.sourceId,capturedOn:manifest.capturedOn,asOf:manifest.asOf,rows});
    if(parsed.state==='blocked')return blocked('field_intake_blocked');
    if(fields.some(f=>!['transcribed','explicit_absence'].includes(parsed.fields[f]?.status)))return blocked('identifier_transcription_incomplete');
    const identifier=Object.fromEntries(fields.map(f=>[f,parsed.fields[f].value]));
    candidates.push({blockId:s.blockId,relationship:'unresolved',identifier,locators});
  }
  const exact=new Map();
  for(const c of candidates){
    const key=JSON.stringify(fields.map(f=>c.identifier[f]));
    const group=exact.get(key)||[];group.push(c.blockId);exact.set(key,group);
  }
  for(const group of exact.values())if(group.length>1)issues.push({code:'repeated_exact_identifier',blockIds:group});
  return {...flags(),state:issues.length?'needs_review':'candidate_identifiers',documentSha256:partition.documentSha256,extractionSha256:partition.extractionSha256,source:{id:manifest.sourceId,kind:'document',capturedOn:manifest.capturedOn},asOf:manifest.asOf,candidates,issues};
}

// Byte-bound public entry. No trust in externally supplied block snapshots.
export function reviewPdfBlockIdentifiers(bytes,manifest){
  const pdf=preparePdfVisuraReview(bytes);
  if(pdf.state!=='candidate_words')return blocked('pdf_extraction_blocked');
  return identifyReviewedBlocks(pdf,manifest);
}
