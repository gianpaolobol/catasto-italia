// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Input is manually isolated, single-identifier field text, not a PDF parser.
export function intakeVisura(input) {
  const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
  const shape=(x,ks)=>plain(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
  const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
  const date=x=>typeof x==="string"&&/^[1-9]\d{3}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
  const out={version:"0.1.0",state:"blocked",operative:false,canExport:false,source:null,asOf:null,fields:{},issues:[]};
  const fail=code=>{out.issues.push({code});return out;};
  if(!shape(input,["kind","sourceId","capturedOn","asOf","rows"])||input.kind!=="current_building_single_identifier"||
    !id(input.sourceId)||!date(input.capturedOn)||!date(input.asOf)||input.asOf>input.capturedOn||
    !Array.isArray(input.rows)||input.rows.length>128)return fail("invalid_envelope");
  out.source={id:input.sourceId,kind:"document",capturedOn:input.capturedOn};out.asOf=input.asOf;
  const sections={municipalityCode:"identifier",section:"identifier",sheet:"identifier",parcel:"identifier",subaltern:"identifier",category:"classification",class:"classification",zone:"classification",consistency:"classification",rent:"classification",surfaceTotal:"surface",surfaceExcludingOutdoor:"surface"};
  const nullable=new Set(["section","subaltern","class","zone","consistency","rent","surfaceTotal","surfaceExcludingOutdoor"]);
  const decimal=t=>{if(!/^(?:\d{1,9}|\d{1,3}(?:\.\d{3}){1,2})(?:,\d{1,2})?$/.test(t))return null;const [a,b=""]=t.replace(/\./g,"").split(",");return String(Number(a))+"."+b.padEnd(2,"0");};
  const parse=(f,t)=>{
    if(f==="municipalityCode")return /^[A-Z]\d{3}$/.test(t)?t:null;
    if(f==="section")return /^[A-Z0-9]{1,8}$/.test(t)?t:null;
    if(["sheet","parcel","subaltern","zone"].includes(f))return /^\d{1,12}$/.test(t)?t:null;
    if(f==="category")return /^[A-F]\/\d{1,2}$/.test(t)?t:null;
    if(f==="class")return /^(?:\d{1,3}|U)$/.test(t)?t:null;
    if(f==="rent"){const m=/^Euro (.+)$/.exec(t);return m?decimal(m[1]):null;}
    const m=/^(.+) (vani|m²|m³)$/.exec(t);if(!m)return null;
    const value=decimal(m[1]);if(value===null|| (f!=="consistency"&&m[2]!=="m²"))return null;
    return {value,unit:m[2]};
  };
  const seen=new Map();
  for(const row of input.rows){
    if(!shape(row,["field","section","page","line","text"])||typeof row.field!=="string"||!Object.hasOwn(sections,row.field)||
       row.section!==sections[row.field]||!Number.isSafeInteger(row.page)||row.page<1||row.page>10000||
       !Number.isSafeInteger(row.line)||row.line<1||row.line>100000||typeof row.text!=="string"||row.text.length>64||
       /[\x00-\x1f\x7f]/.test(row.text))return fail("invalid_row");
    const locator={page:row.page,line:row.line,section:row.section,sourceId:input.sourceId};
    const absent=row.text==="—"&&nullable.has(row.field);
    const value=absent?null:parse(row.field,row.text);
    if(value===null&&!absent){out.issues.push({code:"unsupported_field_value",field:row.field,locator});continue;}
    const previous=seen.get(row.field)||[];
    previous.push({value,locator});seen.set(row.field,previous);
  }
  for(const f of Object.keys(sections)){
    const observations=seen.get(f)||[];
    if(!observations.length){out.fields[f]={status:"missing",value:null,locators:[]};out.issues.push({code:"missing_field",field:f});continue;}
    if(new Set(observations.map(o=>JSON.stringify(o.value))).size!==1){
      out.fields[f]={status:"conflict",value:null,locators:observations.map(o=>o.locator)};out.issues.push({code:"conflicting_field",field:f});continue;
    }
    out.fields[f]={status:observations[0].value===null?"explicit_absence":"transcribed",value:observations[0].value,locators:observations.map(o=>o.locator)};
  }
  const a=out.fields.surfaceTotal.value,b=out.fields.surfaceExcludingOutdoor.value;
  if(a&&b&&Number(b.value)>Number(a.value))out.issues.push({code:"surface_order_inconsistent",field:"surfaceExcludingOutdoor"});
  // A repeated identifier group cannot be reliably identified from isolated rows.
  // Do not create an observed Building Core claim, even on a complete transcription.
  out.state=out.issues.length?"needs_review":"transcription_consistent";
  return out;
}
