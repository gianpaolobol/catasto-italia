// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Synthetic structured transcription adapter only; no PDF, cadastral inference or certification.
import {guideFields} from './guided-draft.mjs';
import {syntheticCase} from './fixtures.mjs';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const arr=(x,n)=>Array.isArray(x)&&x.length<=n;
const unique=x=>new Set(x).size===x.length;
const day=x=>typeof x==='string'&&/^[1-9]\d{3}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9]{1,32}$/.test(x);
const nullable=x=>x===null||token(x);
const parcel=x=>shape(x,['municipalityCode','section','sheet','parcel'])&&x.municipalityCode==='SYNTH'&&nullable(x.section)&&token(x.sheet)&&token(x.parcel);
const identifier=x=>shape(x,['municipalityCode','section','sheet','parcel','subaltern'])&&parcel({municipalityCode:x.municipalityCode,section:x.section,sheet:x.sheet,parcel:x.parcel})&&nullable(x.subaltern);
const locator=x=>shape(x,['kind','index'])&&['page','record'].includes(x.kind)&&Number.isSafeInteger(x.index)&&x.index>=1&&x.index<=1000000;
const fail=()=>{throw Error('invalid_synthetic_reviewed_visura');};
const visura='synthetic-visura',coverageSource='synthetic-coverage',plan='synthetic-plan',evidence='synthetic-evidence';
const ref=fact=>fact==='inventoryComplete'?coverageSource:evidence;
const values=['yes','no','unknown'];
// Explicitly transcribed unit groups are declarations, not inferred graffatures.
// The coverage list is independent; never reconstruct it from the inventory.
export function draftFromReviewedVisura(input){
  if(!shape(input,['version','kind','scenario','province','asOf','observedUnits','proposedUnits','originIds','coverage','factRows'])||
    input.version!=='0.1.0'||input.kind!=='synthetic-reviewed-visura'||!day(input.asOf)||
    !['fusion','division','new_construction','internal_distribution','destination_change','enlargement'].includes(input.scenario)||typeof input.province!=='string'||!/^[A-Z]{2}$/.test(input.province)||
    !arr(input.observedUnits,100)||!arr(input.proposedUnits,100)||input.observedUnits.length+input.proposedUnits.length>100||
    !arr(input.originIds,100)||!input.originIds.every(id)||!unique(input.originIds)||
    !shape(input.coverage,['parcel','observedClaims'])||!parcel(input.coverage.parcel)||
    !arr(input.coverage.observedClaims,200)||!input.coverage.observedClaims.every(c=>shape(c,['claimId','identifier'])&&id(c.claimId)&&identifier(c.identifier))||
    !unique(input.coverage.observedClaims.map(c=>c.claimId))||!arr(input.factRows,30))fail();
  const template=syntheticCase(input.scenario), names=Object.keys(template.input.facts);
  if(input.factRows.length!==names.length||!input.factRows.every(f=>shape(f,['fact','declared','transcribed','locator'])&&names.includes(f.fact)&&values.includes(f.declared)&&values.includes(f.transcribed)&&locator(f.locator))||
    !unique(input.factRows.map(f=>f.fact)))fail();
  const coverageIds=new Set(input.coverage.observedClaims.map(c=>c.claimId)),seenUnits=new Set(),seenClaims=new Set(),observedIds=new Set(),observedClaimIds=new Set();
  const units=[];
  for(const [status,group] of [['observed',input.observedUnits],['proposed',input.proposedUnits]]){
    for(const u of group){
      if(!shape(u,['unitId','claims'])||!id(u.unitId)||seenUnits.has(u.unitId)||!arr(u.claims,50)||!u.claims.length)fail();
      seenUnits.add(u.unitId);if(status==='observed')observedIds.add(u.unitId);
      const claims=[];
      for(const c of u.claims){
        if(!shape(c,['claimId','identifier'])||!id(c.claimId)||seenClaims.has(c.claimId)||!identifier(c.identifier))fail();
        seenClaims.add(c.claimId);if(status==='observed')observedClaimIds.add(c.claimId);
        claims.push({id:c.claimId,status,asOf:input.asOf,sourceIds:status==='proposed'?[plan]:[visura,...(coverageIds.has(c.claimId)?[coverageSource]:[])],value:{...c.identifier}});
      }
      units.push({id:u.unitId,identifiers:claims});
    }
  }
  if(input.originIds.some(x=>!observedIds.has(x))||[...coverageIds].some(x=>!observedClaimIds.has(x)))fail();
  const snapshotId='synthetic-reviewed-'+input.scenario;
  const draft={version:'0.1.0',kind:'synthetic-case',input:{
    scenario:input.scenario,province:input.province,originIds:[...input.originIds],derivedIds:input.proposedUnits.map(u=>u.unitId),
    facts:Object.fromEntries(input.factRows.map(f=>[f.fact,{value:f.declared,sourceIds:[ref(f.fact)]}])),
    snapshot:{schemaVersion:'0.1.0',snapshotId,asOf:input.asOf,sources:[visura,coverageSource,plan,evidence].map(sourceId=>({id:sourceId,kind:sourceId===plan?'professional_input':'document',capturedOn:input.asOf})),units}
  },coverage:{snapshotId,asOf:input.asOf,sourceId:coverageSource,parcel:{...input.coverage.parcel},observedClaims:input.coverage.observedClaims.map(c=>({claimId:c.claimId,identifier:{...c.identifier}}))},
    assertions:input.factRows.map(f=>({fact:f.fact,sourceId:ref(f.fact),value:f.transcribed,locator:{...f.locator}}))};
  // Reuse the same bounded editor schema. A successful import does not mean a
  // successful practice audit; mismatch, collisions and unknown facts stay visible.
  guideFields(draft);
  return draft;
}
// An editable example of a separately declared synthetic transcription.
// The placeholders are explicitly unknown and must never be auto-confirmed.
export function reviewedVisuraExample(scenario){
  const c=syntheticCase(scenario),s=c.input.snapshot;
  const group=status=>s.units.filter(u=>u.identifiers.every(i=>i.status===status)).map(u=>({unitId:u.id,claims:u.identifiers.map(i=>({claimId:i.id,identifier:{...i.value}}))}));
  return {version:'0.1.0',kind:'synthetic-reviewed-visura',scenario,province:c.input.province,asOf:s.asOf,
    observedUnits:group('observed'),proposedUnits:group('proposed'),originIds:[...c.input.originIds],
    coverage:{parcel:{...c.coverage.parcel},observedClaims:c.coverage.observedClaims.map(x=>({claimId:x.claimId,identifier:{...x.identifier}}))},
    factRows:c.assertions.map(a=>({fact:a.fact,declared:'unknown',transcribed:'unknown',locator:{...a.locator}}))};
}
