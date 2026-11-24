// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {inspectSource} from "../normative/index.mjs";

// Historical guidance preview only. Inputs are explicit assertions for research,
// not evidence authentication. Never use this output to populate official models.
const fields={
  origin:["existing","unlisted","unknown"],
  event:["annexation","internal","omission","unknown"],
  originalMembership:["yes","no","unknown"],
  titleEvidence:["yes","no","unknown"],
  priorSeparateUnit:["yes","no","unknown"],
  autonomyAfter:["yes","no","unknown"],
  originEvidence:["yes","no","unknown"],
  alreadyListedBuilding:["yes","no","unknown"],
  unitBoundaryChange:["yes","no","unknown"],
  mapChange:["yes","no","unknown"],
  territorialSystem:["ordinary","tavolare","unknown"],
  additionalChanges:["yes","no","unknown"]
};
const base=()=>({version:"0.1.0",state:"needs_review",operative:false,canExport:false,candidates:[],blockers:[],sources:[]});
const candidate=(procedure,cause,operations,locator)=>({procedure,cause,operations,locator});
export function previewProcedure(input){
  const out=base();
  if(!input||typeof input!=="object"||Array.isArray(input)||
    Object.keys(input).length!==Object.keys(fields).length+2||
    !["asOf","province",...Object.keys(fields)].every(k=>Object.hasOwn(input,k))||
    !Object.entries(fields).every(([k,allowed])=>allowed.includes(input[k]))){
    out.state="invalid_input";return out;
  }
  // asOf is the date at which guidance is being consulted, not the date of works.
  const ref=inspectSource({id:"vademecum-docfa-2022",revision:1,asOf:input.asOf,province:input.province});
  out.sources.push({id:"vademecum-docfa-2022",revision:1,state:ref.state});
  if(ref.state==="invalid_query"||ref.state==="invalid_catalog"){
    out.state="invalid_input";return out;
  }
  if(ref.state!=="pending_review"){out.blockers.push("source_unavailable_for_preview");return out;}
  out.blockers.push("source_applicability_not_verified","professional_review_required");
  if(input.territorialSystem!=="ordinary"){out.blockers.push("territorial_system_unresolved_or_special");return out;}
  if(input.province===null){out.blockers.push("province_missing");return out;}
  if(input.originEvidence!=="yes"){out.blockers.push("origin_evidence_missing");return out;}
  if(input.priorSeparateUnit!=="no"){out.blockers.push("prior_separate_unit_unresolved_or_present");return out;}
  if(input.additionalChanges!=="no")out.blockers.push("combined_causes_not_assessed");
  if(input.mapChange==="unknown")out.blockers.push("map_change_unknown");
  if(input.origin==="existing"&&input.event==="annexation"&&input.originalMembership==="no"&&input.autonomyAfter==="no"&&input.unitBoundaryChange==="yes"){
    out.candidates.push(candidate("variation","ampliamento",["S","C"],"p. 57; note 72–73"));
    if(input.mapChange==="yes")out.blockers.push("tipo_mappale_to_verify");
    if(input.titleEvidence!=="yes")out.blockers.push("title_evidence_missing");
  }else if(input.origin==="existing"&&input.event==="internal"&&input.mapChange==="no"&&input.originalMembership==="yes"&&input.unitBoundaryChange==="no"&&input.autonomyAfter==="no"){
    out.candidates.push(candidate("variation","diversa distribuzione degli spazi interni",["V"],"p. 58"));
  }else if(input.event==="omission"&&input.titleEvidence==="yes"&&input.mapChange==="no"){
    if(input.origin==="existing"&&input.originalMembership==="yes"&&input.autonomyAfter==="no"&&input.unitBoundaryChange==="no")
      out.candidates.push(candidate("variation","recupero di situazione pregressa",["V"],"p. 63"));
    else if(input.origin==="unlisted"&&input.originalMembership==="no"&&input.autonomyAfter==="yes"&&input.alreadyListedBuilding==="yes"&&input.unitBoundaryChange==="no")
      out.candidates.push(candidate("new_registration","recupero di situazione pregressa",["C"],"p. 45; unità afferenti, Altro"));
  }
  if(out.candidates.length===0)out.blockers.push("facts_incomplete_or_outside_supported_scenarios");
  return out;
}
