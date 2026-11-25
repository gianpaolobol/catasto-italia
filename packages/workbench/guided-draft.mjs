// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Guided editing of synthetic drafts only. No cadastral inference or authentication.
const choices=['yes','no','unknown'];
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const array=(x,limit)=>Array.isArray(x)&&x.length<=limit;
const shape=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(x);
const sourceId=x=>id(x)&&x.startsWith('synthetic-');
const token=x=>typeof x==='string'&&/^[A-Za-z0-9]{1,32}$/.test(x);
const nullable=x=>x===null||token(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
const refs=x=>array(x,100)&&x.every(sourceId);
const roles=x=>array(x,100)&&x.every(id);
const parcel=x=>shape(x,['municipalityCode','section','sheet','parcel'])&&x.municipalityCode==='SYNTH'&&nullable(x.section)&&token(x.sheet)&&token(x.parcel);
const ident=x=>shape(x,['municipalityCode','section','sheet','parcel','subaltern'])&&parcel({municipalityCode:x.municipalityCode,section:x.section,sheet:x.sheet,parcel:x.parcel})&&nullable(x.subaltern);
const labels={ordinaryTerritory:'Territorio ordinario',inventoryComplete:'Inventario completo',ordinaryUnits:'Unità ordinarie',singleIntervention:'Intervento singolo',resultAutonomy:'Autonomia delle unità risultanti',titleReviewed:'Titolarità esaminata',sameDitta:'Medesima ditta',mapUnchanged:'Mappa invariata',newBuilding:'Nuovo edificio',parcelPreviouslyEmpty:'Particella prima priva di unità',mapPrerequisiteReviewed:'Presupposto cartografico esaminato',boundariesUnchanged:'Confini dell’unità invariati',useUnchanged:'Destinazione invariata',internalLayoutChanged:'Distribuzione interna modificata',identifiersUnchanged:'Identificativi dichiarati invariati',entireUseChanged:'Intera unità trasformata nella destinazione',noFusionOrDivision:'Nessuna fusione o divisione contestuale',relevantIncrease:'Aumento di volume o superficie catastalmente rilevante dichiarato',noThirdPartyOrCommonArea:'Nessuna acquisizione di porzioni comuni o di terzi dichiarata'};
export function guideFields(draft){
  if(!shape(draft,['version','kind','input','coverage','assertions'])||draft.kind!=='synthetic-case'||draft.version!=='0.1.0'||!shape(draft.input,['snapshot','province','scenario','originIds','derivedIds','facts']))throw Error('unsupported_guided_draft');
  const {input,coverage,assertions}=draft,s=input.snapshot;
  if(!shape(s,['schemaVersion','snapshotId','asOf','sources','units'])||s.schemaVersion!=='0.1.0'||!sourceId(s.snapshotId)||!date(s.asOf)||
    !['fusion','division','new_construction','internal_distribution','destination_change','enlargement'].includes(input.scenario)||typeof input.province!=='string'||!/^[A-Z]{2}$/.test(input.province)||!roles(input.originIds)||!roles(input.derivedIds)||
    !array(s.units,100)||!array(s.sources,100)||s.sources.some(x=>!shape(x,['id','kind','capturedOn'])||!sourceId(x.id)||!['document','survey','calculation','professional_input'].includes(x.kind)||!date(x.capturedOn))||
    !shape(coverage,['snapshotId','asOf','parcel','sourceId','observedClaims'])||!sourceId(coverage.snapshotId)||!date(coverage.asOf)||!sourceId(coverage.sourceId)||!parcel(coverage.parcel)||!array(coverage.observedClaims,200)||
    !plain(input.facts)||Object.keys(input.facts).length>30||!array(assertions,200))throw Error('unsupported_guided_draft');
  const rows=[];
  const add=(group,label,path,value,kind='identifier')=>{
    if(rows.length>=500)throw Error('guided_field_limit');
    rows.push({key:String(rows.length),group,label,path,value,kind});
  };
  for(const [i,u] of s.units.entries()){
    if(!shape(u,['id','identifiers'])||!id(u.id)||!array(u.identifiers,50))throw Error('unsupported_guided_draft');
    for(const [j,c] of u.identifiers.entries()){
      if(!shape(c,['id','status','asOf','sourceIds','value'])||!id(c.id)||!date(c.asOf)||!refs(c.sourceIds)||!ident(c.value)||!['observed','proposed'].includes(c.status))throw Error('unsupported_guided_draft');
      add(c.status==='observed'?'Inventario osservato':'Identificativi proposti',
        u.id+' · '+c.value.sheet+'/'+c.value.parcel+' · subalterno', ['input','snapshot','units',i,'identifiers',j,'value','subaltern'],c.value.subaltern);
    }
  }
  for(const [i,c] of coverage.observedClaims.entries()){
    if(!shape(c,['claimId','identifier'])||!id(c.claimId)||!ident(c.identifier))throw Error('unsupported_guided_draft');
    add('Trascrizione indipendente della copertura',c.claimId+' · '+c.identifier.sheet+'/'+c.identifier.parcel+' · subalterno',['coverage','observedClaims',i,'identifier','subaltern'],c.identifier.subaltern);
  }
  for(const [fact,f] of Object.entries(input.facts)){
    if(!Object.hasOwn(labels,fact)||!shape(f,['value','sourceIds'])||!refs(f.sourceIds)||!choices.includes(f.value))throw Error('unsupported_guided_draft');
    add('Presupposti dichiarati',labels[fact],['input','facts',fact,'value'],f.value,'choice');
  }
  for(const [i,a] of assertions.entries()){
    if(!shape(a,['fact','sourceId','value','locator'])||!Object.hasOwn(labels,a.fact)||!sourceId(a.sourceId)||
      !shape(a.locator,['kind','index'])||!['page','record'].includes(a.locator.kind)||!Number.isSafeInteger(a.locator.index)||a.locator.index<1||a.locator.index>1000000||!choices.includes(a.value))throw Error('unsupported_guided_draft');
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
