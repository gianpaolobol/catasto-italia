// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {readFileSync} from "node:fs";
const schema=JSON.parse(readFileSync(new URL("./snapshot.schema.json",import.meta.url),"utf8"));
export function validateSnapshot(snapshot) {
  const errors=[];
  let remaining=200000;
  let budgetExceeded=false;
  function add(path,code){errors.push({path,code});}
  // This is intentionally a validator for the keywords used by our bundled schema,
  // not a general-purpose JSON Schema implementation.
  function check(s,v,p,out){
    const fail=code=>out.push({path:p,code});
    if(--remaining<0){if(!budgetExceeded){errors.push({path:"",code:"validation_budget_exceeded"});budgetExceeded=true;}return;}
    if(s.$ref){check(schema.$defs[s.$ref.slice("#/$defs/".length)],v,p,out);return;}
    if(s.anyOf){if(!s.anyOf.some(a=>{const e=[];check(a,v,p,e);return e.length===0;}))fail("invalid_union");return;}
    if(Object.hasOwn(s,"const")&&v!==s.const){fail("unsupported_version");return;}
    if(s.enum&&!s.enum.includes(v)){fail("invalid_enum");return;}
    if(s.type==="null"&&v!==null){fail("expected_null");return;}
    if(s.type==="string"){
      if(typeof v!=="string"){fail("expected_string");return;}
      if(s.minLength!==undefined&&v.length<s.minLength)fail("too_short");
      if(s.maxLength!==undefined&&v.length>s.maxLength)fail("too_long");
      if(s.pattern&&!new RegExp(s.pattern).test(v))fail("invalid_pattern");
    }
    if(s.type==="object"){
      if(!v||typeof v!=="object"||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v))){fail("expected_object");return;}
      for(const k of s.required)if(!Object.hasOwn(v,k))out.push({path:p+"/"+k,code:"missing_field"});
      for(const k of Object.keys(v)){
        if(budgetExceeded)return;
        if(!Object.hasOwn(s.properties,k)){if(!out.some(e=>e.path===p&&e.code==="unknown_field"))out.push({path:p,code:"unknown_field"});continue;}
        check(s.properties[k],v[k],p+"/"+k,out);
      }
    }
    if(s.type==="array"){
      if(!Array.isArray(v)){fail("expected_array");return;}
      if(s.minItems!==undefined&&v.length<s.minItems)fail("too_few_items");
      if(s.maxItems!==undefined&&v.length>s.maxItems){fail("too_many_items");return;}
      if(s.uniqueItems&&new Set(v).size!==v.length)fail("duplicate_item");
      for(let i=0;i<v.length&&!budgetExceeded;i++)check(s.items,v[i],p+"/"+i,out);
    }
  }
  check(schema,snapshot,"",errors);
  if(errors.length)return {valid:false,errors};
  const calendarDate=(v,p)=>{
    const d=new Date(v+"T00:00:00.000Z");
    if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)add(p,"invalid_calendar_date");
  };
  calendarDate(snapshot.asOf,"/asOf");
  const sources=new Set(), units=new Set(), claims=new Set(), observed=new Set();
  const unique=(set,id,path)=>{if(set.has(id))add(path,"duplicate_id");set.add(id);};
  snapshot.sources.forEach((s,i)=>{unique(sources,s.id,"/sources/"+i+"/id");calendarDate(s.capturedOn,"/sources/"+i+"/capturedOn");});
  snapshot.units.forEach((u,i)=>{
    const up="/units/"+i;unique(units,u.id,up+"/id");
    u.identifiers.forEach((c,j)=>{
      const p=up+"/identifiers/"+j;
      unique(claims,c.id,p+"/id");
      calendarDate(c.asOf,p+"/asOf");
      for(const [k,id] of c.sourceIds.entries())if(!sources.has(id))add(p+"/sourceIds/"+k,"unknown_source");
      if(c.status==="unknown"){
        if(c.value!==null)add(p+"/value","unknown_must_be_null");
      }else{
        if(c.value===null)add(p+"/value","known_requires_value");
        if(c.sourceIds.length===0)add(p+"/sourceIds","evidence_required");
      }
      if(c.status==="observed"&&c.value!==null){
        const v=c.value;
        // Exact string comparison, no cadastral normalization or legal inference.
        const key=JSON.stringify([v.municipalityCode,v.section,v.sheet,v.parcel,v.subaltern]);
        if(observed.has(key))add(p+"/value","duplicate_observed_identifier");
        observed.add(key);
      }
    });
  });
  return {valid:errors.length===0,errors};
}
