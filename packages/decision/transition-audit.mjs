// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {auditIdentifierInventory} from "./identifier-inventory.mjs";
import {previewUnitTransition} from "./unit-transition-preview.mjs";

const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const fields=["municipalityCode","section","sheet","parcel"];
const rawParcel=v=>JSON.stringify(fields.map(k=>v[k]));
const norm=v=>v===null?null:v.toUpperCase().replace(/^0+(?=[0-9]+$)/,"");
const parcelGroup=v=>JSON.stringify(fields.map(k=>norm(v[k])));
const parcelShape=v=>shape(v,fields)&&fields.every(k=>(k==="section"&&v[k]===null)||(typeof v[k]==="string"&&/^[A-Za-z0-9]{1,32}$/.test(v[k])));

// Research-only composition; no new cadastral rules. Coverage is a declaration
// linked to one reference, not proof that a registry is complete or current.
export function auditTransition(input,coverage){
  const out={version:"0.1.0",state:"needs_review",operative:false,canExport:false,
    availability:"unverified",coverageState:"unverified",candidate:null,blockers:[],inventoryIssues:[],validationErrors:[],source:null};
  const stop=code=>{out.blockers.push(code);return out;};
  const preview=previewUnitTransition(input);
  out.source=preview.source;
  out.blockers=[...preview.blockers];
  if(!plain(input)||!Object.hasOwn(input,"snapshot"))return out;
  const inventory=auditIdentifierInventory(input.snapshot);
  out.inventoryIssues=inventory.issues;
  out.validationErrors=inventory.validationErrors;
  if(!inventory.validSnapshot)return stop("inventory_invalid");
  if(inventory.issues.length)return stop("inventory_issues");
  if(!preview.candidate)return out;
  const snapshot=input.snapshot;
  const touched=new Set([...input.originIds,...input.derivedIds]);
  const rows=inventory.rows;
  const selected=rows.filter(r=>touched.has(r.unitId));
  // Require exact parcel spelling across the target group; diagnostic aliases
  // are not authoritative even when distinct subaltern numbers avoid collision.
  const raw=new Set(selected.map(r=>rawParcel(r.identifier)));
  if(raw.size!==1)return stop("target_parcel_spelling_conflict");
  const target=raw.values().next().value;
  const group=parcelGroup(selected[0].identifier);
  const scoped=rows.filter(r=>parcelGroup(r.identifier)===group);
  if(scoped.some(r=>rawParcel(r.identifier)!==target))return stop("target_parcel_spelling_conflict");
  if(!shape(coverage,["snapshotId","asOf","parcel","observedClaimIds","sourceId"])||
    !parcelShape(coverage.parcel)||!id(coverage.sourceId)||!Array.isArray(coverage.observedClaimIds)||
    coverage.observedClaimIds.length>10000||!Array.from(coverage.observedClaimIds).every(id)||
    new Set(coverage.observedClaimIds).size!==coverage.observedClaimIds.length)
    return stop("invalid_or_missing_coverage");
  if(coverage.snapshotId!==snapshot.snapshotId||coverage.asOf!==snapshot.asOf||
    rawParcel(coverage.parcel)!==target)return stop("coverage_scope_mismatch");
  const source=snapshot.sources.find(s=>s.id===coverage.sourceId);
  if(!source||!["document","official_receipt"].includes(source.kind)||source.capturedOn!==snapshot.asOf||
    !input.facts.inventoryComplete.sourceIds.includes(source.id))return stop("coverage_reference_unresolved");
  const observed=scoped.filter(r=>r.status==="observed");
  const declared=new Set(coverage.observedClaimIds);
  if(declared.size!==observed.length||observed.some(r=>!declared.has(r.claimId)))
    return stop("coverage_claim_set_mismatch");
  if(observed.some(r=>!r.sourceIds.includes(source.id)))return stop("coverage_reference_not_linked_to_claim");
  out.coverageState="declaration_consistent";
  out.blockers.push("coverage_not_authenticated","reservation_status_unverified");
  out.candidate=preview.candidate;
  return out;
}
