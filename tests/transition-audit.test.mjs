import {test} from "node:test";
import assert from "node:assert/strict";
import {auditTransition as audit} from "../packages/decision/transition-audit.mjs";
const day="2026-11-24", parcel={municipalityCode:"SYNTH",section:null,sheet:"999",parcel:"900"};
const unit=(id,subs,status="observed",p=parcel)=>({id,identifiers:subs.map((subaltern,i)=>({id:id+"-"+i,status,asOf:day,sourceIds:["doc"],value:{...p,subaltern}}))});
function fixture(scenario="fusion"){
  const origins=scenario==="fusion"?[unit("u1",["1","2"]),unit("u2",["3"])]:scenario==="division"?[unit("u1",["1","2"])]:[];
  const derived=scenario==="division"?[unit("d1",["5","6"],"proposed"),unit("d2",["7"],"proposed")]:[unit("d1",["5","6"],"proposed")];
  const other=unit("other",["9"],"observed",scenario==="new_construction"?{...parcel,parcel:"901"}:parcel);
  const names=["ordinaryTerritory","inventoryComplete","ordinaryUnits","singleIntervention","resultAutonomy","titleReviewed",...(scenario==="fusion"?["sameDitta","mapUnchanged"]:scenario==="division"?["mapUnchanged"]:["newBuilding","parcelPreviouslyEmpty","mapPrerequisiteReviewed"])];
  const input={scenario,province:"BO",originIds:origins.map(u=>u.id),derivedIds:derived.map(u=>u.id),facts:Object.fromEntries(names.map(k=>[k,{value:"yes",sourceIds:["doc"]}])),snapshot:{schemaVersion:"0.1.0",snapshotId:"synthetic",asOf:day,sources:[{id:"doc",kind:"document",capturedOn:day},{id:"survey",kind:"survey",capturedOn:day},{id:"doc2",kind:"document",capturedOn:day}],units:[...origins,...derived,other]}};
  const coverage={snapshotId:"synthetic",asOf:day,parcel:{...parcel},sourceId:"doc",observedClaims:input.snapshot.units.flatMap(u=>u.identifiers).filter(c=>c.status==="observed"&&c.value.parcel==="900").map(c=>({claimId:c.id,identifier:{...c.value}}))};
  return {input,coverage};
}
function blocked(change,code,scenario="fusion"){
  const {input,coverage}=fixture(scenario);change(input,coverage);const r=audit(input,coverage);
  assert.equal(r.candidate,null);assert.ok(r.blockers.includes(code),JSON.stringify(r));
  assert.equal(r.canExport,false);assert.equal(r.operative,false);assert.equal(r.availability,"unverified");
}
for(const [scenario,counts] of [["fusion",{S:2,C:1,V:0}],["division",{S:1,C:2,V:0}],["new_construction",{S:0,C:1,V:0}]]){
  test(scenario+" consistent coverage stays non-operative",()=>{const {input,coverage}=fixture(scenario),r=audit(input,coverage);assert.deepEqual(r.candidate.counts,counts);assert.deepEqual(r.candidate.unchangedUnitIds,["other"]);assert.equal(r.coverageState,"declaration_consistent");assert.equal(r.operative,false);assert.equal(r.canExport,false);assert.equal(r.availability,"unverified");assert.ok(r.blockers.includes("coverage_not_authenticated"));assert.ok(r.blockers.includes("reservation_status_unverified"));assert.ok(r.blockers.includes("source_applicability_not_verified"));});
}
test("missing coverage blocks",()=>{const {input}=fixture();assert.ok(audit(input).blockers.includes("invalid_or_missing_coverage"));});
test("wrong snapshot blocks",()=>blocked((i,c)=>c.snapshotId="other","coverage_scope_mismatch"));
test("wrong date blocks",()=>blocked((i,c)=>c.asOf="2026-11-23","coverage_scope_mismatch"));
test("wrong parcel blocks",()=>blocked((i,c)=>c.parcel.parcel="901","coverage_scope_mismatch"));
test("alias of target parcel blocks",()=>blocked((i,c)=>c.parcel.parcel="0900","coverage_scope_mismatch"));
test("selected units with different exact parcel spelling block",()=>blocked(i=>i.snapshot.units[0].identifiers[0].value.parcel="0900","target_parcel_spelling_conflict"));
test("untouched unit parcel spelling conflict blocks",()=>blocked(i=>i.snapshot.units.at(-1).identifiers[0].value.parcel="0900","target_parcel_spelling_conflict"));
test("omitted observed claim blocks",()=>blocked((i,c)=>c.observedClaims.pop(),"coverage_claim_set_mismatch"));
test("omitted graffato claim blocks",()=>blocked((i,c)=>c.observedClaims.splice(1,1),"coverage_claim_set_mismatch"));
test("unknown claim blocks",()=>blocked((i,c)=>c.observedClaims[0].claimId="missing","coverage_claim_set_mismatch"));
test("proposed claim cannot count as observed",()=>blocked((i,c)=>{const p=i.snapshot.units.find(u=>u.id==="d1").identifiers[0];c.observedClaims.push({claimId:p.id,identifier:p.value});},"coverage_claim_set_mismatch"));
test("duplicate coverage claims block",()=>blocked((i,c)=>c.observedClaims.push(c.observedClaims[0]),"invalid_or_missing_coverage"));
test("sparse coverage array blocks",()=>blocked((i,c)=>delete c.observedClaims[0],"invalid_or_missing_coverage"));
test("unknown coverage source blocks",()=>blocked((i,c)=>c.sourceId="missing","coverage_reference_unresolved"));
test("survey is not documentary coverage",()=>blocked((i,c)=>{c.sourceId="survey";i.facts.inventoryComplete.sourceIds.push("survey");},"coverage_reference_unresolved"));
test("source must be linked to inventory assertion",()=>blocked((i,c)=>c.sourceId="doc2","coverage_reference_unresolved"));
test("source must be linked to all covered claims",()=>blocked((i,c)=>i.snapshot.units[0].identifiers[0].sourceIds=["doc2"],"coverage_reference_not_linked_to_claim"));
test("prior-day coverage reference blocks",()=>blocked(i=>i.snapshot.sources[0].capturedOn="2026-11-23","coverage_reference_unresolved"));
test("changed identifier with same claim ID blocks",()=>blocked(i=>i.snapshot.units[0].identifiers[0].value.subaltern="8","coverage_identifier_mismatch"));
test("changed coverage identifier with same ID blocks",()=>blocked((i,c)=>c.observedClaims[0].identifier.subaltern="8","coverage_identifier_mismatch"));
test("malformed coverage identifier blocks",()=>blocked((i,c)=>c.observedClaims[0].identifier.subaltern=1,"invalid_or_missing_coverage"));
test("unrecognized coverage field blocks",()=>blocked((i,c)=>c.available=true,"invalid_or_missing_coverage"));
test("source and scope cannot override inventory collision",()=>blocked(i=>i.snapshot.units.find(u=>u.id==="d1").identifiers[0].value.subaltern="1","inventory_issues"));
test("stale observed claim blocks and retains diagnostics",()=>{const {input,coverage}=fixture();input.snapshot.units[0].identifiers[0].asOf="2026-11-23";const r=audit(input,coverage);assert.equal(r.candidate,null);assert.ok(r.inventoryIssues.some(x=>x.code==="claim_date_mismatch"));});
test("invalid snapshot blocks and retains validation errors",()=>{const {input,coverage}=fixture();input.snapshot.schemaVersion="9";const r=audit(input,coverage);assert.equal(r.candidate,null);assert.ok(r.blockers.includes("inventory_invalid"));assert.ok(r.validationErrors.length);});
test("invalid input never throws on null",()=>assert.equal(audit(null,null).candidate,null));
test("unresolved fact cannot be overridden by coverage",()=>blocked(i=>i.facts.sameDitta.value="unknown","unresolved_fact:sameDitta"));
test("empty target must not include other parcel claims",()=>blocked((i,c)=>{const p=i.snapshot.units.at(-1).identifiers[0];c.observedClaims.push({claimId:p.id,identifier:p.value});},"coverage_claim_set_mismatch","new_construction"));
test("coverage claim order irrelevant",()=>{const {input,coverage}=fixture();coverage.observedClaims.reverse();assert.ok(audit(input,coverage).candidate);});
test("input and coverage unchanged",()=>{const {input,coverage}=fixture(),before=JSON.stringify([input,coverage]);audit(input,coverage);assert.equal(JSON.stringify([input,coverage]),before);});
