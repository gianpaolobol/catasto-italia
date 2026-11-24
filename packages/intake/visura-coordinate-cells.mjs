// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Coordinates: integers normalized 0..1e6, top-left origin, page-local. Caller selects regions; no template inference.
export function isolateVisuraCells(input) {
  const out={version:"0.1.0",state:"blocked",operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false,rows:[],locators:[],issues:[],excludedCount:0};
  const fail=code=>{out.rows=[];out.locators=[];out.issues.push({code});return out;};
  const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
  const shape=(x,ks)=>plain(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
  const integer=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
  const box=b=>Array.isArray(b)&&b.length===4&&[0,1,2,3].every(i=>integer(b[i],0,1000000))&&b[0]<b[2]&&b[1]<b[3];
  const overlap=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
  const contains=(a,b)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
  const fieldSections={municipalityCode:"identifier",section:"identifier",sheet:"identifier",parcel:"identifier",subaltern:"identifier",category:"classification",class:"classification",zone:"classification",consistency:"classification",rent:"classification",surfaceTotal:"surface",surfaceExcludingOutdoor:"surface"};
  const exclusions=new Set(["update","annotation","land_reference","other"]);
  if(!shape(input,["kind","regions","spans"])||input.kind!=="reviewer_selected_current_building_cells"||
     !Array.isArray(input.regions)||input.regions.length===0||input.regions.length>128||
     !Array.isArray(input.spans)||input.spans.length>2048)return fail("invalid_envelope");
  const regionIds=new Set(),locations=new Set(),fields=new Set(),spanIds=new Set(),spanBoxes=new Set();
  const id=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
  const regions=[];
  for(const r of input.regions){
    if(!plain(r)||!id(r.id)||regionIds.has(r.id)||!integer(r.page,1,10000)||!box(r.box))return fail("invalid_region");
    if(r.role==="value"){
      if(!shape(r,["id","role","page","box","field","section","line"])||typeof r.field!=="string"||!Object.hasOwn(fieldSections,r.field)||
         r.section!==fieldSections[r.field]||!integer(r.line,1,100000))return fail("invalid_value_region");
      const key=JSON.stringify([r.field,r.page,r.line]);if(locations.has(key))return fail("duplicate_field_locator");locations.add(key);
      // Repeated fields may belong to a second identifier/unit. Do not collapse them here.
      if(fields.has(r.field))return fail("repeated_field_requires_group_review");fields.add(r.field);
    }else if(!shape(r,["id","role","page","box"])||!exclusions.has(r.role))return fail("invalid_exclusion_region");
    if(regions.some(q=>q.page===r.page&&overlap(q.box,r.box)))return fail("overlapping_regions");
    regionIds.add(r.id);regions.push(r);
  }
  if(!regions.some(r=>r.role==="value"))return fail("no_value_regions");
  const assigned=new Map();
  for(const s of input.spans){
    if(!shape(s,["id","page","box","text"])||!id(s.id)||spanIds.has(s.id)||!integer(s.page,1,10000)||!box(s.box)||
       typeof s.text!=="string"||s.text.length===0||s.text.length>512||/[\x00-\x1f\x7f]/.test(s.text))return fail("invalid_span");
    const geometry=JSON.stringify([s.page,s.box]);if(spanBoxes.has(geometry))return fail("duplicate_span_geometry");
    spanIds.add(s.id);spanBoxes.add(geometry);
    const touched=regions.filter(r=>r.page===s.page&&overlap(r.box,s.box));
    if(touched.length===0){out.issues.push({code:"unassigned_span",page:s.page});continue;}
    if(touched.length!==1||!contains(touched[0].box,s.box)){out.issues.push({code:"boundary_crossing",page:s.page});continue;}
    const r=touched[0];
    if(r.role!=="value"){out.excludedCount++;continue;}
    const a=assigned.get(r.id)||[];a.push(s);assigned.set(r.id,a);
  }
  for(const r of regions.filter(r=>r.role==="value")){
    const spans=assigned.get(r.id)||[];
    if(spans.length!==1){out.issues.push({code:spans.length?"fragmented_cell":"empty_cell",regionId:r.id});continue;}
    const s=spans[0];
    if(s.text.length>64||s.text.trim()!==s.text||s.text.trim()===""){out.issues.push({code:"unsupported_value_span",regionId:r.id});continue;}
    out.rows.push({field:r.field,section:r.section,page:r.page,line:r.line,text:s.text});
    out.locators.push({field:r.field,page:r.page,line:r.line,regionId:r.id,spanId:s.id,box:[...s.box]});
  }
  // Never pass partially isolated rows downstream. A reviewer may correct the geometry and rerun.
  if(out.issues.length){out.rows=[];out.locators=[];out.state="needs_review";}
  else out.state="candidate_cells";
  return out;
}
