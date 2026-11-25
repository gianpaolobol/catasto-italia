// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {validateSnapshot} from "../building-core/index.mjs";
import {inspectSource} from "../normative/index.mjs";

// Narrow research preview: ordinary units, one parcel, no combined changes.
// Evidence references are NOT authentication, nor a finding of legal title.
const common=["ordinaryTerritory","inventoryComplete","ordinaryUnits","singleIntervention","resultAutonomy","titleReviewed"];
const extra={fusion:["sameDitta","mapUnchanged"],division:["mapUnchanged"],new_construction:["newBuilding","parcelPreviouslyEmpty","mapPrerequisiteReviewed"],internal_distribution:["mapUnchanged","boundariesUnchanged","useUnchanged","internalLayoutChanged","identifiersUnchanged"]};
const documentary=new Set(["ordinaryTerritory","inventoryComplete","titleReviewed","sameDitta","parcelPreviouslyEmpty","mapPrerequisiteReviewed","identifiersUnchanged"]);
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const ids=x=>Array.isArray(x)&&x.length<=100&&Array.from(x).every(id)&&new Set(x).size===x.length;
const norm=v=>v===null?null:v.toUpperCase().replace(/^0+(?=[0-9]+$)/,"");
const parcelKey=v=>JSON.stringify([v.municipalityCode,v.section,v.sheet,v.parcel].map(norm));
const identifierKey=v=>JSON.stringify([parcelKey(v),norm(v.subaltern)]);
export function previewUnitTransition(input){
  const out={version:"0.1.0",state:"needs_review",operative:false,canExport:false,candidate:null,blockers:[],source:null};
  const reject=code=>{out.blockers.push(code);return out;};
  if(!shape(input,["snapshot","province","scenario","originIds","derivedIds","facts"])||
    typeof input.scenario!=="string"||!Object.hasOwn(extra,input.scenario)||!ids(input.originIds)||!ids(input.derivedIds)||
    typeof input.province!=="string"||!/^[A-Z]{2}$/.test(input.province))return reject("invalid_input");
  const {snapshot,scenario,originIds,derivedIds,facts}=input;
  if(!validateSnapshot(snapshot).valid)return reject("invalid_snapshot");
  const sourceId=scenario==="internal_distribution"?"circ9-2001":"vademecum-docfa-2022";
  const ref=inspectSource({id:sourceId,revision:1,asOf:snapshot.asOf,province:input.province});
  out.source={id:sourceId,revision:1,state:ref.state};
  if(ref.state!=="pending_review")return reject("source_unavailable");
  out.blockers.push("source_applicability_not_verified","professional_review_required","identifier_availability_not_verified");
  // Exclude autonomous provinces even when asserted otherwise; other special regimes
  // are excluded by the explicit territorial assertion, which still needs review.
  if(["TN","BZ"].includes(input.province))return reject("special_territory");
  if(!shape(facts,[...common,...extra[scenario]]))return reject("missing_or_extra_facts");
  const sources=new Map(snapshot.sources.map(s=>[s.id,s]));
  if(snapshot.sources.some(s=>s.capturedOn>snapshot.asOf))return reject("future_source");
  function evidence(list,allowed){
    return Array.isArray(list)&&list.length>0&&list.length<=256&&Array.from(list).every(id)&&
      new Set(list).size===list.length&&list.every(k=>sources.has(k))&&list.some(k=>allowed.has(sources.get(k).kind));
  }
  for(const key of [...common,...extra[scenario]]){
    const f=facts[key];
    if(!shape(f,["value","sourceIds"])||f.value!=="yes"||
      !evidence(f.sourceIds,new Set(documentary.has(key)?["document","official_receipt"]:["document","survey"])))
      out.blockers.push("unresolved_fact:"+key);
  }
  if(out.blockers.some(x=>x.startsWith("unresolved_fact:")))return out;
  const selected=new Set(originIds),derived=new Set(derivedIds);
  if(originIds.some(x=>derived.has(x)))return reject("overlapping_unit_roles");
  if(!(scenario==="fusion"?originIds.length>=2&&derivedIds.length===1:
    scenario==="division"?originIds.length===1&&derivedIds.length>=2:
    scenario==="internal_distribution"?originIds.length===1&&derivedIds.length===0:
    originIds.length===0&&derivedIds.length>=1))return reject("invalid_unit_counts");
  const units=new Map(snapshot.units.map(u=>[u.id,u]));
  if([...originIds,...derivedIds].some(x=>!units.has(x)))return reject("unknown_unit");
  // Restrict this first research scenario to one ordinary unit with a single explicit subaltern.
  // Complex graffatures, whole parcels and combined changes are outside this prototype.
  if(scenario==="internal_distribution"&&(units.get(originIds[0]).identifiers.length!==1||units.get(originIds[0]).identifiers[0].value?.subaltern==null))return reject("complex_internal_variation_outside_scope");
  const keys=new Set(), whole=new Set(), parcelsWithSubs=new Set(), touched=new Set();
  for(const u of snapshot.units){
    const isDerived=derived.has(u.id);
    for(const c of u.identifiers){
      if(c.status!==(isDerived?"proposed":"observed")||c.value===null||c.asOf!==snapshot.asOf||
        !evidence(c.sourceIds,new Set(isDerived?["document","survey","professional_input"]:["document","official_receipt"])))
        return reject("identifier_evidence_or_status_unresolved");
      const v=c.value,pk=parcelKey(v),ik=identifierKey(v);
      if(keys.has(ik)||(v.subaltern===null?parcelsWithSubs.has(pk):whole.has(pk)))return reject("identifier_collision_or_alias");
      keys.add(ik);
      if(v.subaltern===null)whole.add(pk);else parcelsWithSubs.add(pk);
      if(selected.has(u.id)||isDerived)touched.add(pk);
    }
  }
  if(touched.size!==1)return reject("multi_parcel_outside_scope");
  if(scenario==="new_construction"&&snapshot.units.some(u=>!derived.has(u.id)&&u.identifiers.some(c=>touched.has(parcelKey(c.value)))))
    return reject("existing_units_on_target_parcel");
  const label={fusion:["variation","fusione","p. 57"],division:["variation","divisione","p. 56"],new_construction:["new_registration","nuova costruzione","p. 44"],internal_distribution:["variation","diversa distribuzione degli spazi interni","Circolare 9/2001, §4 e Causali delle denunce di variazione"]}[scenario];
  out.candidate={procedure:label[0],cause:label[1],locator:label[2],
    counts:{S:scenario==="internal_distribution"?0:originIds.length,C:derivedIds.length,V:scenario==="internal_distribution"?1:0},
    suppressUnitIds:scenario==="internal_distribution"?[]:[...originIds],constituteUnitIds:[...derivedIds],
    ...(scenario==="internal_distribution"?{varyUnitIds:[...originIds]}:{}),
    unchangedUnitIds:snapshot.units.filter(u=>!selected.has(u.id)&&!derived.has(u.id)).map(u=>u.id)};
  return out;
}
