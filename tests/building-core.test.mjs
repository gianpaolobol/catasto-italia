import {test} from "node:test";
import assert from "node:assert/strict";
import {validateSnapshot} from "../packages/building-core/index.mjs";
function runContractTests(validate) {
  function baseline(){
    return {schemaVersion:"0.1.0",snapshotId:"synthetic-snapshot",asOf:"2026-01-01",sources:[{id:"synthetic-doc",kind:"document",capturedOn:"2026-01-01"}],units:[{id:"synthetic-unit",identifiers:[{id:"claim-a",status:"observed",asOf:"2026-01-01",sourceIds:["synthetic-doc"],value:{municipalityCode:"ZZZZ",section:null,sheet:"0001",parcel:"0099",subaltern:"01"}},{id:"claim-b",status:"observed",asOf:"2026-01-01",sourceIds:["synthetic-doc"],value:{municipalityCode:"ZZZZ",section:null,sheet:"0001",parcel:"0099",subaltern:"02"}}]}]};
  }
  const c=s=>s.units[0].identifiers[0];
  const cases=[
    ["graffatura: two references in one unit",s=>{},null],
    ["unknown explicitly null",s=>{c(s).status="unknown";c(s).value=null;c(s).sourceIds=[];},null],
    ["proposed distinct from observed",s=>{c(s).status="proposed";},null],
    ["empty draft",s=>{s.units=[];s.sources=[];},null],
    ["leading zeros preserved",s=>{c(s).value.sheet="0000001";},null],
    ["version mismatch",s=>{s.schemaVersion="1.0.0";},"unsupported_version"],
    ["missing version",s=>{delete s.schemaVersion;},"missing_field"],
    ["unknown root property",s=>{s.address="synthetic";},"unknown_field"],
    ["unknown nested property",s=>{c(s).value.extra="synthetic";},"invalid_union"],
    ["invalid date",s=>{s.asOf="2026-02-30";},"invalid_calendar_date"],
    ["valid leap date",s=>{s.asOf="2024-02-29";},null],
    ["unknown source",s=>{c(s).sourceIds=["missing"];},"unknown_source"],
    ["observed without evidence",s=>{c(s).sourceIds=[];},"evidence_required"],
    ["unknown with value",s=>{c(s).status="unknown";},"unknown_must_be_null"],
    ["observed with null",s=>{c(s).value=null;},"known_requires_value"],
    ["duplicate claim",s=>{s.units[0].identifiers[1].id=c(s).id;},"duplicate_id"],
    ["duplicate source",s=>{s.sources.push({...s.sources[0]});},"duplicate_id"],
    ["duplicate unit",s=>{s.units.push({...s.units[0],identifiers:[{...c(s),id:"claim-c",status:"proposed"}]});},"duplicate_id"],
    ["duplicate observed reference",s=>{s.units[0].identifiers[1].value={...c(s).value};},"duplicate_observed_identifier"],
    ["duplicate observed across units",s=>{s.units.push({id:"unit-b",identifiers:[{...c(s),id:"claim-c"}]});},"duplicate_observed_identifier"],
    ["duplicate source link",s=>{c(s).sourceIds.push("synthetic-doc");},"duplicate_item"],
    ["numeric identifier rejected",s=>{c(s).value.sheet=1;},"invalid_union"],
    ["empty identifiers",s=>{s.units[0].identifiers=[];},"too_few_items"],
    ["invalid state",s=>{c(s).status="verified";},"invalid_enum"],
    ["bad source date",s=>{s.sources[0].capturedOn="2026-13-01";},"invalid_calendar_date"],
    ["invalid null root",s=>null,"expected_object"],
    ["prototype-shaped JSON rejected",s=>{Object.defineProperty(s,"__proto__",{value:{},enumerable:true});},"unknown_field"],
    ["separate proposed exact reference allowed",s=>{s.units[0].identifiers[1].status="proposed";s.units[0].identifiers[1].value={...c(s).value};},null]
  ];
  return cases.map(([name,edit,expected])=>{
    const s=baseline();const replacement=edit(s);const result=validate(replacement===null?null:s);
    return {name,pass:expected===null?result.valid:!result.valid&&result.errors.some(e=>e.code===expected)};
  });
}
for(const result of runContractTests(validateSnapshot))test(result.name,()=>assert.equal(result.pass,true));
