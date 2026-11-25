// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {createHash} from "node:crypto";
import {auditTransition} from "./transition-audit.mjs";

const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const documentary=new Set(["ordinaryTerritory","inventoryComplete","titleReviewed","sameDitta","parcelPreviouslyEmpty","mapPrerequisiteReviewed","identifiersUnchanged"]);
const locator=x=>shape(x,["kind","index"])&&["page","record"].includes(x.kind)&&Number.isSafeInteger(x.index)&&x.index>=1&&x.index<=1000000;

// Local binding to the exact JSON serialization of a previously validated case.
// Not a document fingerprint, signature, authentication or proof of title.
export function researchCaseDigest(input,coverage){
  return createHash("sha256").update(JSON.stringify([input,coverage]),"utf8").digest("hex");
}

// An evidence assertion is a transcription, not independently verified fact.
// Each referenced source must explicitly support its fact; contradictory or
// incomplete transcriptions are not reconciled by majority voting.
export function auditFieldEvidence(input,coverage,evidence){
  const previous=auditTransition(input,coverage);
  const out={...previous,version:"0.2.0",candidate:null,fieldEvidenceState:"unverified",fieldIssues:[]};
  if(!previous.candidate)return out;
  const stop=code=>{out.blockers.push(code);return out;};
  if(!shape(evidence,["caseDigest","assertions"])||typeof evidence.caseDigest!=="string"||
    !/^[a-f0-9]{64}$/.test(evidence.caseDigest)||!Array.isArray(evidence.assertions)||
    evidence.assertions.length>4096)return stop("invalid_field_evidence");
  if(evidence.caseDigest!==researchCaseDigest(input,coverage))return stop("field_evidence_scope_mismatch");
  const sources=new Map(input.snapshot.sources.map(s=>[s.id,s]));
  const seen=new Map();
  for(const a of evidence.assertions){
    if(!shape(a,["fact","sourceId","value","locator"])||!id(a.fact)||!id(a.sourceId)||
      !["yes","no","unknown"].includes(a.value)||!locator(a.locator))return stop("invalid_field_assertion");
    if(!Object.hasOwn(input.facts,a.fact))return stop("unknown_evidence_fact");
    if(!sources.has(a.sourceId))return stop("unknown_evidence_source");
    const key=JSON.stringify([a.fact,a.sourceId]);
    if(seen.has(key))return stop("duplicate_field_assertion");
    seen.set(key,a.value);
    const f=input.facts[a.fact];
    if(!f.sourceIds.includes(a.sourceId))out.fieldIssues.push({fact:a.fact,code:"unlinked_source"});
    const allowed=documentary.has(a.fact)?["document","official_receipt"]:["document","survey"];
    if(!allowed.includes(sources.get(a.sourceId).kind))out.fieldIssues.push({fact:a.fact,code:"unsupported_source_kind"});
    if(a.value!==f.value)out.fieldIssues.push({fact:a.fact,code:a.value==="unknown"?"unresolved_transcription":"contradictory_transcription"});
  }
  for(const [fact,f] of Object.entries(input.facts)){
    for(const sourceId of f.sourceIds){
      if(!seen.has(JSON.stringify([fact,sourceId])))out.fieldIssues.push({fact,code:"missing_source_transcription"});
    }
  }
  if(out.fieldIssues.length)return stop("field_evidence_inconsistent");
  out.fieldEvidenceState="transcriptions_consistent";
  out.blockers.push("field_transcriptions_not_authenticated","field_meaning_not_verified");
  out.candidate=previous.candidate;
  return out;
}
