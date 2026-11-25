// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Diagnostic comparison of manually isolated synthetic rows. Never promotes a claim.
import {intakeVisura} from '../intake/visura-fields.mjs';
import {guideFields} from './guided-draft.mjs';
const shape=(x,ks)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
const base=()=>({version:'0.1.0',kind:'synthetic-visura-comparison',state:'blocked',operative:false,canExport:false,authenticated:false,identifierGroupingVerified:false,fields:{},comparisons:[],issues:[]});
const blocked=code=>({...base(),issues:[{code}]});
export function compareSyntheticVisura(input){
  try{
    if(!shape(input,['version','kind','draft','claimId','transcription'])||input.version!=='0.1.0'||input.kind!=='synthetic-visura-check')return blocked('unsupported_comparison');
    guideFields(input.draft);
    const {snapshot}=input.draft.input;
    const t=input.transcription;
    if(!shape(t,['kind','sourceId','capturedOn','asOf','rows'])||!Array.isArray(t.rows)||t.rows.length>128||typeof t.sourceId!=='string'||!t.sourceId.startsWith('synthetic-'))return blocked('synthetic_transcription_required');
    // Z999 is an isolated demo placeholder, not a mapping to an official municipality.
    const municipality=t.rows.filter(r=>r?.field==='municipalityCode');
    if(!municipality.length||municipality.some(r=>r.text!=='Z999'))return blocked('synthetic_transcription_required');
    const claims=snapshot.units.flatMap(u=>u.identifiers).filter(c=>c.id===input.claimId);
    if(claims.length!==1||claims[0].status!=='observed')return blocked('observed_claim_required');
    const claim=claims[0];
    const sources=snapshot.sources.filter(s=>s.id===t.sourceId);
    if(sources.length!==1||sources[0].kind!=='document'||!claim.sourceIds.includes(t.sourceId)||sources[0].capturedOn!==t.capturedOn||claim.asOf!==t.asOf||snapshot.asOf!==t.asOf)return blocked('source_or_date_mismatch');
    const parsed=intakeVisura(t);
    if(parsed.state==='blocked')return blocked('transcription_blocked');
    const comparisons=['section','sheet','parcel','subaltern'].map(field=>{
      const f=parsed.fields[field];
      return {field,expected:claim.value[field],transcribed:f.value,status:!['transcribed','explicit_absence'].includes(f.status)?'unresolved':f.value===claim.value[field]?'matches':'differs'};
    });
    const consistent=parsed.state==='transcription_consistent'&&comparisons.every(c=>c.status==='matches');
    return {...base(),state:consistent?'transcription_matches_demo_claim':'needs_review',fields:parsed.fields,comparisons,issues:parsed.issues};
  }catch{return blocked('invalid_comparison');}
}
export function syntheticVisuraExample(draft,claimId){
  guideFields(draft);
  const claims=draft.input.snapshot.units.flatMap(u=>u.identifiers).filter(c=>c.id===claimId&&c.status==='observed');
  if(claims.length!==1)throw Error('observed_claim_required');
  const c=claims[0],s=draft.input.snapshot.sources.find(s=>s.id===c.sourceIds[0]);
  if(!s||s.kind!=='document')throw Error('synthetic_document_required');
  const values=[['municipalityCode','identifier','Z999'],['section','identifier',c.value.section??'—'],['sheet','identifier',c.value.sheet],['parcel','identifier',c.value.parcel],['subaltern','identifier',c.value.subaltern??'—'],['category','classification','A/3'],['class','classification','2'],['zone','classification','—'],['consistency','classification','5,5 vani'],['rent','classification','Euro 123,45'],['surfaceTotal','surface','100 m²'],['surfaceExcludingOutdoor','surface','90 m²']];
  return {kind:'current_building_single_identifier',sourceId:s.id,capturedOn:s.capturedOn,asOf:c.asOf,rows:values.map(([field,section,text],i)=>({field,section,text,page:1,line:i+1}))};
}
