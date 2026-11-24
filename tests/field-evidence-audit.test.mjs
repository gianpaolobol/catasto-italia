// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from "node:test";
import assert from "node:assert/strict";
import {auditFieldEvidence as audit,researchCaseDigest as digest} from "../packages/decision/field-evidence-audit.mjs";
const day="2026-11-24",parcel={municipalityCode:"SYNTH",section:null,sheet:"999",parcel:"900"};
function fixture(){
  const unit=(id,subaltern,status)=>({id,identifiers:[{id:id+"-claim",status,asOf:day,sourceIds:["doc"],value:{...parcel,subaltern}}]});
  const names=["ordinaryTerritory","inventoryComplete","ordinaryUnits","singleIntervention","resultAutonomy","titleReviewed","sameDitta","mapUnchanged"];
  const input={scenario:"fusion",province:"BO",originIds:["u1","u2"],derivedIds:["d1"],
    facts:Object.fromEntries(names.map(k=>[k,{value:"yes",sourceIds:["doc"]}])),
    snapshot:{schemaVersion:"0.1.0",snapshotId:"synthetic",asOf:day,sources:[{id:"doc",kind:"document",capturedOn:day},{id:"doc2",kind:"document",capturedOn:day},{id:"survey",kind:"survey",capturedOn:day},{id:"calc",kind:"calculation",capturedOn:day}],units:[unit("u1","1","observed"),unit("u2","2","observed"),unit("d1","3","proposed"),unit("other","4","observed")]}};
  const coverage={snapshotId:"synthetic",asOf:day,parcel:{...parcel},sourceId:"doc",observedClaims:input.snapshot.units.flatMap(u=>u.identifiers).filter(c=>c.status==="observed").map(c=>({claimId:c.id,identifier:{...c.value}}))};
  const evidence={caseDigest:digest(input,coverage),assertions:names.map((fact,i)=>({fact,sourceId:"doc",value:"yes",locator:{kind:"page",index:i+1}}))};
  return {input,coverage,evidence};
}
function blocked(change,code,issue){
  const {input,coverage,evidence}=fixture();change(input,coverage,evidence);
  const r=audit(input,coverage,evidence);
  assert.equal(r.candidate,null,JSON.stringify(r));assert.ok(r.blockers.includes(code),JSON.stringify(r));
  if(issue)assert.ok(r.fieldIssues.some(x=>x.code===issue),JSON.stringify(r));
  assert.equal(r.canExport,false);assert.equal(r.operative,false);assert.equal(r.availability,"unverified");
}
const rebind=(i,c,e)=>{e.caseDigest=digest(i,c);};
test("complete transcriptions permit research candidate only",()=>{const {input,coverage,evidence}=fixture(),r=audit(input,coverage,evidence);assert.deepEqual(r.candidate.counts,{S:2,C:1,V:0});assert.equal(r.fieldEvidenceState,"transcriptions_consistent");assert.equal(r.canExport,false);assert.equal(r.operative,false);assert.equal(r.availability,"unverified");assert.ok(r.blockers.includes("field_transcriptions_not_authenticated"));assert.ok(r.blockers.includes("source_applicability_not_verified"));});
test("missing envelope",()=>{const {input,coverage}=fixture();assert.ok(audit(input,coverage).blockers.includes("invalid_field_evidence"));});
test("empty assertions",()=>blocked((i,c,e)=>e.assertions=[],"field_evidence_inconsistent","missing_source_transcription"));
test("wrong digest",()=>blocked((i,c,e)=>e.caseDigest="0".repeat(64),"field_evidence_scope_mismatch"));
test("invalid digest format",()=>blocked((i,c,e)=>e.caseDigest="not-a-hash","invalid_field_evidence"));
test("changed scope with same snapshot ID",()=>blocked(i=>i.snapshot.units[2].identifiers[0].value.subaltern="8","field_evidence_scope_mismatch"));
test("changed coverage ordering requires explicit rebind",()=>blocked((i,c)=>c.observedClaims.reverse(),"field_evidence_scope_mismatch"));
test("missing one fact",()=>blocked((i,c,e)=>e.assertions.pop(),"field_evidence_inconsistent","missing_source_transcription"));
test("contradictory fact",()=>blocked((i,c,e)=>e.assertions[0].value="no","field_evidence_inconsistent","contradictory_transcription"));
test("unknown fact transcription",()=>blocked((i,c,e)=>e.assertions[0].value="unknown","field_evidence_inconsistent","unresolved_transcription"));
test("invalid fact value",()=>blocked((i,c,e)=>e.assertions[0].value=true,"invalid_field_assertion"));
test("unknown fact name",()=>blocked((i,c,e)=>e.assertions[0].fact="missing","unknown_evidence_fact"));
test("unknown source ID",()=>blocked((i,c,e)=>e.assertions[0].sourceId="missing","unknown_evidence_source"));
test("unlinked agreeing source",()=>blocked((i,c,e)=>e.assertions.push({...e.assertions[0],sourceId:"doc2"}),"field_evidence_inconsistent","unlinked_source"));
test("unlinked conflicting source",()=>blocked((i,c,e)=>e.assertions.push({...e.assertions[0],sourceId:"doc2",value:"no"}),"field_evidence_inconsistent","contradictory_transcription"));
test("duplicate assertion",()=>blocked((i,c,e)=>e.assertions.push(e.assertions[0]),"duplicate_field_assertion"));
test("missing locator",()=>blocked((i,c,e)=>delete e.assertions[0].locator,"invalid_field_assertion"));
for(const bad of [0,-1,1.5,1000001,"1",null])test("invalid locator index "+String(bad),()=>blocked((i,c,e)=>e.assertions[0].locator.index=bad,"invalid_field_assertion"));
test("extra locator data rejected",()=>blocked((i,c,e)=>e.assertions[0].locator.text="synthetic text","invalid_field_assertion"));
test("sparse assertion array rejected",()=>blocked((i,c,e)=>delete e.assertions[0],"invalid_field_assertion"));
test("oversized assertion list rejected",()=>blocked((i,c,e)=>e.assertions=Array(4097).fill(e.assertions[0]),"invalid_field_evidence"));
test("every linked source must be transcribed",()=>blocked((i,c,e)=>{i.facts.sameDitta.sourceIds.push("doc2");rebind(i,c,e);},"field_evidence_inconsistent","missing_source_transcription"));
test("two documentary sources may agree",()=>{const {input,coverage,evidence}=fixture();input.facts.sameDitta.sourceIds.push("doc2");evidence.assertions.push({fact:"sameDitta",sourceId:"doc2",value:"yes",locator:{kind:"record",index:1}});rebind(input,coverage,evidence);assert.ok(audit(input,coverage,evidence).candidate);});
test("linked second source conflict blocks",()=>blocked((i,c,e)=>{i.facts.sameDitta.sourceIds.push("doc2");e.assertions.push({fact:"sameDitta",sourceId:"doc2",value:"no",locator:{kind:"record",index:1}});rebind(i,c,e);},"field_evidence_inconsistent","contradictory_transcription"));
test("calculation cannot support documentary assertion",()=>blocked((i,c,e)=>{i.facts.sameDitta.sourceIds.push("calc");e.assertions.push({fact:"sameDitta",sourceId:"calc",value:"yes",locator:{kind:"record",index:1}});rebind(i,c,e);},"field_evidence_inconsistent","unsupported_source_kind"));
test("survey may supplement physical fact",()=>{const {input,coverage,evidence}=fixture();input.facts.mapUnchanged.sourceIds.push("survey");evidence.assertions.push({fact:"mapUnchanged",sourceId:"survey",value:"yes",locator:{kind:"record",index:1}});rebind(input,coverage,evidence);assert.ok(audit(input,coverage,evidence).candidate);});
test("upstream coverage failure not overridden",()=>blocked((i,c,e)=>{c.observedClaims.pop();rebind(i,c,e);},"coverage_claim_set_mismatch"));
test("upstream unresolved fact not overridden",()=>blocked((i,c,e)=>{i.facts.sameDitta.value="unknown";rebind(i,c,e);},"unresolved_fact:sameDitta"));
test("assertion ordering irrelevant",()=>{const {input,coverage,evidence}=fixture();evidence.assertions.reverse();assert.ok(audit(input,coverage,evidence).candidate);});
test("no mutation",()=>{const {input,coverage,evidence}=fixture(),before=JSON.stringify([input,coverage,evidence]);audit(input,coverage,evidence);assert.equal(JSON.stringify([input,coverage,evidence]),before);});
test("invalid upstream input remains blocked",()=>assert.equal(audit(null,null,null).candidate,null));
