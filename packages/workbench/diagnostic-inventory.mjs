// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Before/after projection of the existing diagnostic operations.
// Not an official subaltern list or a statement of availability.
export function diagnosticInventory(report){
  if(!report||report.state!=='research_candidate'||report.operative!==false||
     report.canExport!==false||report.availability!=='unverified'||
     !Array.isArray(report.operations)||report.operations.length>4096)return null;
  const before=[],after=[],units=new Set(),claims=new Set();
  const fail=()=>null;
  for(const op of report.operations){
    if(!op||!['S','C','V','unchanged'].includes(op.operation)||
       typeof op.unitId!=='string'||units.has(op.unitId)||
       !Array.isArray(op.identifiers)||!op.identifiers.length)return fail();
    units.add(op.unitId);
    for(const claim of op.identifiers){
      const i=claim?.identifier;
      if(!i||i.municipalityCode!=='SYNTH'||claim.unitId!==op.unitId||
         typeof claim.claimId!=='string'||claims.has(claim.claimId)||
         claim.status!==(op.operation==='C'?'proposed':'observed')||
         !Array.isArray(claim.sourceIds)||!claim.sourceIds.length||
         !claim.sourceIds.every(s=>typeof s==='string')||
         !['sheet','parcel'].every(k=>typeof i[k]==='string')||
         !['section','subaltern'].every(k=>i[k]===null||typeof i[k]==='string'))return fail();
      claims.add(claim.claimId);
      if(claims.size>4096)return fail();
      const row={unitId:op.unitId,claimId:claim.claimId,operation:op.operation,
        identifier:{municipalityCode:i.municipalityCode,section:i.section,sheet:i.sheet,parcel:i.parcel,subaltern:i.subaltern},
        sourceIds:[...claim.sourceIds]};
      if(op.operation!=='C')before.push({...row,status:'observed'});
      if(op.operation!=='S')after.push({...row,identifier:{...row.identifier},sourceIds:[...row.sourceIds],
        status:op.operation==='C'?'proposed':'retained'});
    }
  }
  if(!before.length&&!after.length)return null;
  const counts=rows=>({units:new Set(rows.map(r=>r.unitId)).size,identifiers:rows.length});
  return {before,after,counts:{before:counts(before),after:counts(after)}};
}
export const inventoryHeaders=['Unità','Comune','Sezione','Foglio','Particella','Subalterno','Operazione','Stato dichiarato','Fonte'];
export function inventoryCells(row){
  const i=row.identifier;
  return [row.unitId,i.municipalityCode,i.section??'—',i.sheet,i.parcel,i.subaltern??'—',
    {S:'Soppressione',C:'Costituzione',V:'Variazione',unchanged:'Conservata'}[row.operation],
    {observed:'Osservato',proposed:'Proposto',retained:'Mantenuto'}[row.status],row.sourceIds.join(', ')];
}
