// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Guided editing of synthetic drafts only. No cadastral inference or authentication.
const choices=['yes','no','unknown'];
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const array=(x,limit)=>Array.isArray(x)&&x.length<=limit;
const ident=x=>plain(x)&&x.municipalityCode==='SYNTH'&&['sheet','parcel'].every(k=>typeof x[k]==='string')&&(x.subaltern===null||typeof x.subaltern==='string');
const labels={ordinaryTerritory:'Territorio ordinario',inventoryComplete:'Inventario completo',ordinaryUnits:'Unità ordinarie',singleIntervention:'Intervento singolo',resultAutonomy:'Autonomia delle unità risultanti',titleReviewed:'Titolarità esaminata',sameDitta:'Medesima ditta',mapUnchanged:'Mappa invariata',newBuilding:'Nuovo edificio',parcelPreviouslyEmpty:'Particella prima priva di unità',mapPrerequisiteReviewed:'Presupposto cartografico esaminato'};
export function guideFields(draft){
  if(!plain(draft)||draft.kind!=='synthetic-case'||draft.version!=='0.1.0'||!plain(draft.input))throw Error('unsupported_guided_draft');
  const {input,coverage,assertions}=draft,s=input.snapshot;
  if(!plain(s)||typeof s.snapshotId!=='string'||!s.snapshotId.startsWith('synthetic-')||
    !array(s.units,100)||!array(s.sources,100)||s.sources.some(x=>!plain(x)||typeof x.id!=='string'||!x.id.startsWith('synthetic-')||x.kind==='official_receipt')||
    !plain(coverage)||!ident({...coverage.parcel,subaltern:null})||!array(coverage.observedClaims,200)||
    !plain(input.facts)||Object.keys(input.facts).length>30||!array(assertions,200))throw Error('unsupported_guided_draft');
  const rows=[];
  const add=(group,label,path,value,kind='identifier')=>{
    if(rows.length>=500)throw Error('guided_field_limit');
    rows.push({key:String(rows.length),group,label,path,value,kind});
  };
  for(const [i,u] of s.units.entries()){
    if(!plain(u)||typeof u.id!=='string'||!array(u.identifiers,50))throw Error('unsupported_guided_draft');
    for(const [j,c] of u.identifiers.entries()){
      if(!plain(c)||!ident(c.value)||!['observed','proposed'].includes(c.status))throw Error('unsupported_guided_draft');
      add(c.status==='observed'?'Inventario osservato':'Identificativi proposti',
        u.id+' · '+c.value.sheet+'/'+c.value.parcel+' · subalterno', ['input','snapshot','units',i,'identifiers',j,'value','subaltern'],c.value.subaltern);
    }
  }
  for(const [i,c] of coverage.observedClaims.entries()){
    if(!plain(c)||typeof c.claimId!=='string'||!ident(c.identifier))throw Error('unsupported_guided_draft');
    add('Trascrizione indipendente della copertura',c.claimId+' · '+c.identifier.sheet+'/'+c.identifier.parcel+' · subalterno',['coverage','observedClaims',i,'identifier','subaltern'],c.identifier.subaltern);
  }
  for(const [fact,f] of Object.entries(input.facts)){
    if(!Object.hasOwn(labels,fact)||!plain(f)||!choices.includes(f.value))throw Error('unsupported_guided_draft');
    add('Presupposti dichiarati',labels[fact],['input','facts',fact,'value'],f.value,'choice');
  }
  for(const [i,a] of assertions.entries()){
    if(!plain(a)||!Object.hasOwn(labels,a.fact)||typeof a.sourceId!=='string'||!a.sourceId.startsWith('synthetic-')||
      !plain(a.locator)||!choices.includes(a.value))throw Error('unsupported_guided_draft');
    add('Trascrizioni delle evidenze',labels[a.fact]+' · '+a.sourceId+' · '+a.locator.kind+' '+a.locator.index,['assertions',i,'value'],a.value,'choice');
  }
  return rows;
}
export function editGuidedDraft(draft,key,value){
  const row=guideFields(draft).find(r=>r.key===key);
  if(!row)throw Error('unknown_guided_field');
  if(row.kind==='choice'?!choices.includes(value):!(value===null||(typeof value==='string'&&/^[A-Za-z0-9]{1,32}$/.test(value))))throw Error('invalid_guided_value');
  const next=structuredClone(draft);
  let target=next;
  for(const part of row.path.slice(0,-1)){
    if(!Object.hasOwn(target,part))throw Error('invalid_guided_path');
    target=target[part];
  }
  const last=row.path.at(-1);
  if(!Object.hasOwn(target,last))throw Error('invalid_guided_path');
  target[last]=value;
  // In particular, never synchronize coverage or assertions automatically.
  return next;
}
