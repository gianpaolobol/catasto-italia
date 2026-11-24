// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("./sources.json",import.meta.url),"utf8"));
const date=v=>typeof v==="string"&&/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T00:00:00Z"))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const id=v=>typeof v==="string"&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(v);
const str=v=>typeof v==="string"&&v.trim().length>0&&v.length<=2048;
const hostAllowed=new Set(["www.gazzettaufficiale.it","www.normattiva.it","www.agenziaentrate.gov.it","www1.agenziaentrate.gov.it","def.giustiziatributaria.gov.it","def.finanze.it"]);
function officialUrl(v){if(typeof v!=="string"||v.length>2048)return false;try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&hostAllowed.has(u.hostname);}catch{return false;}}
export function validateCatalog(c){
  const errors=[];
  if(!c||c.version!=="0.1.0"||!Array.isArray(c.sources)||c.sources.length>10000)return ["invalid_catalog"];
  const seen=new Set();
  for(const s of c.sources){
    if(!s||typeof s!=="object"||Array.isArray(s)){errors.push("invalid_source");continue;}
    if(!id(s.id)||!Number.isSafeInteger(s.revision)||s.revision<1)errors.push("invalid_id_revision");
    if(id(s.id)&&Number.isSafeInteger(s.revision)&&s.revision>=1){const k=s.id+":"+s.revision;if(seen.has(k))errors.push("duplicate_revision");seen.add(k);}
    if(!str(s.title)||!str(s.locator)||!str(s.note)||!["law","regulation","guidance"].includes(s.kind))errors.push("invalid_metadata");
    if(!(s.scope==="national"||(typeof s.scope==="string"&&/^province:[A-Z]{2}$/.test(s.scope))))errors.push("invalid_scope");
    if(!officialUrl(s.url))errors.push("untrusted_url");
    if(!date(s.publishedOn)||!date(s.effectiveFrom)||!date(s.reviewedOn)||(s.effectiveUntil!==null&&!date(s.effectiveUntil)))errors.push("invalid_date");
    else if(s.reviewedOn<s.publishedOn||(s.effectiveUntil!==null&&s.effectiveUntil<=s.effectiveFrom))errors.push("invalid_interval");
    if(!["historical","pending"].includes(s.status))errors.push("unsupported_status");
  }
  return errors;
}
export function getCatalog(){return structuredClone(catalog);}
// This version is a research registry, not a legal applicability engine.
// A date match never implies current legal applicability.
export function inspectSource(query,c=getCatalog()){
  if(!query||typeof query!=="object"||Array.isArray(query))return {state:"invalid_query",usableForRule:false};
  const {id:sourceId,revision,asOf,province=null}=query;
  if(!id(sourceId)||!Number.isSafeInteger(revision)||revision<1||!date(asOf)||(province!==null&&(typeof province!=="string"||!/^[A-Z]{2}$/.test(province))))return {state:"invalid_query",usableForRule:false};
  if(validateCatalog(c).length)return {state:"invalid_catalog",usableForRule:false};
  const s=c.sources.find(x=>x.id===sourceId&&x.revision===revision);
  if(!s)return {state:"not_found",usableForRule:false};
  const state=s.scope!=="national"&&s.scope!=="province:"+province?"outside_scope":asOf<s.effectiveFrom||(s.effectiveUntil!==null&&asOf>=s.effectiveUntil)?"outside_interval":s.status==="pending"?"pending_review":"historical_review_required";
  return {state,usableForRule:false,source:structuredClone(s)};
}
