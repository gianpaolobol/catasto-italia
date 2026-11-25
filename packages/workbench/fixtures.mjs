// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Synthetic demonstrations only; none of the assertions are real evidence.
export const scenarios=['fusion','division','new_construction','internal_distribution','destination_change','enlargement'];
export function syntheticCase(scenario){
  if(!scenarios.includes(scenario))throw Error('unknown_fixture');
  const day='2026-11-24', parcel={municipalityCode:'SYNTH',section:null,sheet:'0999',parcel:'0900'};
  const unit=(id,subs,status='observed',p=parcel)=>({id,identifiers:subs.map((subaltern,i)=>({
    id:id+'-'+i,status,asOf:day,sourceIds:['synthetic-doc'],value:{...p,subaltern}
  }))});
  const origins=scenario==='fusion'?[unit('u1',['01','02']),unit('u2',['03'])]:
    scenario==='division'?[unit('u1',['01','02'])]:['internal_distribution','destination_change','enlargement'].includes(scenario)?[unit('u1',['01'])]:[];
  const derived=scenario==='division'?[unit('d1',['05','06'],'proposed'),unit('d2',['07'],'proposed')]:
    scenario==='internal_distribution'?[]:['destination_change','enlargement'].includes(scenario)?[unit('d1',['05'],'proposed')]:[unit('d1',['05','06'],'proposed')];
  const other=unit('other',['09'],'observed',scenario==='new_construction'?{...parcel,parcel:'0901'}:parcel);
  const names=['ordinaryTerritory','inventoryComplete','ordinaryUnits','singleIntervention','resultAutonomy','titleReviewed',
    ...(scenario==='fusion'?['sameDitta','mapUnchanged']:scenario==='division'?['mapUnchanged']:
      scenario==='internal_distribution'?['mapUnchanged','boundariesUnchanged','useUnchanged','internalLayoutChanged','identifiersUnchanged']:
      scenario==='destination_change'?['mapUnchanged','boundariesUnchanged','entireUseChanged','noFusionOrDivision']:
      scenario==='enlargement'?['mapUnchanged','useUnchanged','relevantIncrease','noFusionOrDivision','noThirdPartyOrCommonArea']:
      ['newBuilding','parcelPreviouslyEmpty','mapPrerequisiteReviewed'])];
  const input={scenario,province:'BO',originIds:origins.map(u=>u.id),derivedIds:derived.map(u=>u.id),
    facts:Object.fromEntries(names.map(k=>[k,{value:'yes',sourceIds:['synthetic-doc']}])),
    snapshot:{schemaVersion:'0.1.0',snapshotId:'synthetic-'+scenario,asOf:day,
      sources:[{id:'synthetic-doc',kind:'document',capturedOn:day}],units:[...origins,...derived,other]}};
  const coverage={snapshotId:input.snapshot.snapshotId,asOf:day,parcel:{...parcel},sourceId:'synthetic-doc',
    observedClaims:input.snapshot.units.flatMap(u=>u.identifiers).filter(c=>c.status==='observed'&&c.value.parcel===parcel.parcel)
      .map(c=>({claimId:c.id,identifier:{...c.value}}))};
  return {version:'0.1.0',kind:'synthetic-case',input,coverage,assertions:names.map((fact,i)=>({
    fact,sourceId:'synthetic-doc',value:'yes',locator:{kind:'page',index:i+1}
  }))};
}
