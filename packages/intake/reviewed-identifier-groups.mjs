// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {createHash} from 'node:crypto';
import {identifyReviewedBlocks} from './reviewed-block-identifiers.mjs';
import {preparePdfVisuraReview} from './reviewed-pdf-visura.mjs';

const shape=(x,k)=>x!==null&&typeof x==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Object.keys(x).length===k.length&&k.every(v=>Object.hasOwn(x,v));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const digest=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const flags=()=>({version:'0.1.0',buildingCoreVersion:'0.1.0',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false});
const blocked=code=>({...flags(),state:'blocked',documentSha256:null,extractionSha256:null,identifierReviewSha256:null,groupReviewSha256:null,groups:[],unresolvedBlockIds:[],issues:[{code}]});

// Records a reviewer's proposal only. No cadastral rule, legal relationship,
// ownership, observed claim or Building Core unit is inferred or certified.
export function proposeReviewedIdentifierGroups(pdf,identifierManifest,review){
  if(!shape(review,['version','kind','identifierReviewSha256','groups','unresolvedBlockIds'])||
     review.version!=='0.1.0'||review.kind!=='reviewer_proposed_identifier_groups'||
     !digest(review.identifierReviewSha256)||!Array.isArray(review.groups)||review.groups.length>16||
     !Array.isArray(review.unresolvedBlockIds)||review.unresolvedBlockIds.length>32)return blocked('invalid_group_review');
  const base=identifyReviewedBlocks(pdf,identifierManifest);
  if(base.state!=='candidate_identifiers')return blocked('identifier_review_not_clear');
  if(base.reviewSha256!==review.identifierReviewSha256)return blocked('identifier_review_digest_mismatch');
  const candidates=new Map(base.candidates.map(c=>[c.blockId,c]));
  const assigned=new Set(),groupIds=new Set(),usedEvidence=new Set(),groups=[];
  for(const g of review.groups){
    if(!shape(g,['groupId','blockIds','evidenceSpanIds'])||!id(g.groupId)||groupIds.has(g.groupId)||
       !Array.isArray(g.blockIds)||g.blockIds.length<2||g.blockIds.length>32||
       !Array.isArray(g.evidenceSpanIds)||g.evidenceSpanIds.length<1||g.evidenceSpanIds.length>2048)return blocked('invalid_group');
    groupIds.add(g.groupId);
    const allowed=new Map();
    for(const b of g.blockIds){
      if(!id(b)||!candidates.has(b)||assigned.has(b))return blocked('invalid_or_reused_block');
      assigned.add(b);
      for(const l of candidates.get(b).ignoredLocators)allowed.set(l.spanId,{blockId:b,...l});
    }
    const evidence=[];
    for(const s of g.evidenceSpanIds){
      if(!id(s)||!allowed.has(s)||usedEvidence.has(s))return blocked('invalid_or_reused_evidence');
      usedEvidence.add(s);
      const l=allowed.get(s);
      evidence.push({...l,box:[...l.box]});
    }
    groups.push({groupId:g.groupId,blockIds:[...g.blockIds],status:'proposed_unverified',evidence});
  }
  for(const b of review.unresolvedBlockIds){
    if(!id(b)||!candidates.has(b)||assigned.has(b))return blocked('invalid_or_reused_block');
    assigned.add(b);
  }
  if(assigned.size!==candidates.size)return blocked('incomplete_group_review');
  // Hash the exact serialized review, bound to the original extraction and identifier selection.
  const groupReviewSha256=createHash('sha256').update(JSON.stringify([base.documentSha256,base.extractionSha256,review])).digest('hex');
  return {...flags(),state:'needs_professional_review',documentSha256:base.documentSha256,extractionSha256:base.extractionSha256,
    identifierReviewSha256:base.reviewSha256,groupReviewSha256,groups,unresolvedBlockIds:[...review.unresolvedBlockIds],
    issues:[{code:'relationship_not_verified'}]};
}

// Public byte-bound entry; does not trust a caller's candidate snapshot.
export function reviewPdfIdentifierGroups(bytes,identifierManifest,review){
  const pdf=preparePdfVisuraReview(bytes);
  if(pdf.state!=='candidate_words')return blocked('pdf_extraction_blocked');
  return proposeReviewedIdentifierGroups(pdf,identifierManifest,review);
}
