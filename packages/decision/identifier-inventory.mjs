// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {validateSnapshot} from "../building-core/index.mjs";

// Diagnostic grouping only, NOT an official cadastral normalization rule.
// Keep the original identifiers and never infer availability from absence.
const token=v=>v===null?null:v.toUpperCase().replace(/^0+(?=[0-9]+$)/,"");
const parcelParts=v=>[v.municipalityCode,v.section,v.sheet,v.parcel];
const key=parts=>JSON.stringify(parts);
const issue=(code,claimIds)=>({code,claimIds});
const add=(map,k,value)=>{const a=map.get(k);if(a)a.push(value);else map.set(k,[value]);};

export function auditIdentifierInventory(snapshot){
  const result={version:"0.1.0",state:"needs_review",availability:"unverified",canExport:false,
    validSnapshot:false,validationErrors:[],rows:[],issues:[]};
  const checked=validateSnapshot(snapshot);
  if(!checked.valid){result.validationErrors=checked.errors;return result;}
  result.validSnapshot=true;
  const sources=new Map(snapshot.sources.map(s=>[s.id,s]));
  const exact=new Map(), aliases=new Map(), parcels=new Map();
  for(const s of snapshot.sources){
    if(s.capturedOn>snapshot.asOf)result.issues.push({code:"future_source",sourceId:s.id,claimIds:[]});
  }
  for(const u of snapshot.units){
    for(const c of u.identifiers){
      const row={unitId:u.id,claimId:c.id,status:c.status,asOf:c.asOf,sourceIds:[...c.sourceIds],
        identifier:c.value===null?null:{...c.value}};
      result.rows.push(row);
      const report=code=>result.issues.push(issue(code,[c.id]));
      if(c.asOf!==snapshot.asOf)report("claim_date_mismatch");
      if(c.sourceIds.some(id=>sources.get(id).capturedOn>c.asOf))report("source_after_claim");
      if(c.status==="unknown"||c.status==="calculated")report("unresolved_identifier");
      if(c.status==="observed"&&!c.sourceIds.some(id=>["document","official_receipt"].includes(sources.get(id).kind)))
        report("observed_without_documentary_reference");
      if(c.value===null)continue;
      const p=parcelParts(c.value), all=[...p,c.value.subaltern], canonical=all.map(token);
      add(exact,key(all),row);
      add(aliases,key(canonical),{row,exactKey:key(all)});
      const pk=key(canonical.slice(0,4));
      if(!parcels.has(pk))parcels.set(pk,{whole:[],subs:[]});
      parcels.get(pk)[c.value.subaltern===null?"whole":"subs"].push(c.id);
    }
  }
  for(const rows of exact.values()){
    if(rows.length>1)result.issues.push(issue("exact_identifier_collision",rows.map(r=>r.claimId)));
  }
  for(const group of aliases.values()){
    if(new Set(group.map(g=>g.exactKey)).size>1)
      result.issues.push(issue("possible_identifier_alias",group.map(g=>g.row.claimId)));
  }
  for(const {whole,subs} of parcels.values()){
    if(whole.length&&subs.length)result.issues.push(issue("possible_whole_parcel_overlap",[...whole,...subs]));
  }
  return result;
}
