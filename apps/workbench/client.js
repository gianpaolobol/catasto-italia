// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {renderDiagnosticDossier} from '/diagnostic-dossier.mjs';
import {guideFields,editGuidedDraft} from '/guided-draft.mjs';
import {draftFromReviewedVisura,reviewedVisuraExample} from '/reviewed-visura.mjs';
const byId=id=>document.getElementById(id);
const field=byId('case'),status=byId('status'),download=byId('download'),load=byId('load'),analyze=byId('analyze'),guide=byId('guide');
let report=null,busy=false,draft=null;
const invalid=new Set();
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function clear(){
  byId('visura-result').textContent='Nessun confronto corrente.';
  report=null;download.disabled=true;byId('download-dossier').disabled=true;byId('summary').textContent='Nessun rapporto corrente.';
  byId('relation').textContent='—';byId('details').textContent='—';byId('operations').replaceChildren();
}
function refresh(){byId('download-dossier').disabled=busy||!report||report.diagnosticReportExportable!==true;for(const id of ['visura-check','visura-example','visura-claim','visura-file','visura-text'])byId(id).disabled=busy||invalid.size>0;analyze.disabled=busy||invalid.size>0;byId('save-draft').disabled=busy||invalid.size>0;for(const e of guide.querySelectorAll('input,select'))e.disabled=busy;}
function lock(value){busy=value;byId('import-draft').disabled=value;byId('reviewed-import').disabled=value;byId('reviewed-example').disabled=value;byId('reviewed-template').disabled=value;load.disabled=value;field.readOnly=value;byId('scenario').disabled=value;byId('open-guide').disabled=value;refresh();}
function resetGuide(){draft=null;invalid.clear();guide.replaceChildren();const option=el('option','Carica un caso nell’editor guidato');option.value='';byId('visura-claim').replaceChildren(option);byId('visura-text').value='';clearVisura();refresh();}
function showGuide(input){
  resetGuide();
  const rows=guideFields(input);
  draft=input;
  refreshVisuraClaims();
  let group='',section;
  for(const row of [...new Set(rows.map(r=>r.group))].flatMap(g=>rows.filter(r=>r.group===g))){
    if(group!==row.group){group=row.group;section=el('fieldset');section.append(el('legend',group));guide.append(section);}
    const label=el('label',row.label);
    const control=el(row.kind==='choice'?'select':'input');
    control.id='guide-'+row.key;label.htmlFor=control.id;
    if(row.kind==='choice'){
      for(const [v,t] of [['yes','Sì'],['no','No'],['unknown','Non accertato']]){
        const option=el('option',t);option.value=v;control.append(option);
      }
      control.value=row.value;
    }else{control.type='text';control.maxLength=32;control.autocomplete='off';control.value=row.value??'';}
    control.addEventListener('input',()=>{
      clear();
      try{
        draft=editGuidedDraft(draft,row.key,row.kind==='identifier'&&control.value===''?null:control.value);
        field.value=JSON.stringify(draft,null,2);refreshVisuraClaims();invalid.delete(row.key);control.removeAttribute('aria-invalid');
        status.textContent='Dati modificati: analisi da ripetere.';
      }catch{
        invalid.add(row.key);control.setAttribute('aria-invalid','true');
        status.textContent='Valore non valido: correggere prima dell’analisi.';
      }
      refresh();
    });
    section.append(label,control);
  }
  refresh();
}
async function request(path,options){
  const res=await fetch(path,options);
  if(!res.ok)throw Error('Richiesta non riuscita ('+res.status+').');
  return res.json();
}
load.addEventListener('click',async()=>{
  if(busy)return;clear();resetGuide();lock(true);
  try{const input=await request('/api/fixture/'+byId('scenario').value);field.value=JSON.stringify(input,null,2);showGuide(input);status.textContent='Esempio sintetico caricato. Le trascrizioni sono modificabili separatamente.';}
  catch{field.value='';resetGuide();status.textContent='Caricamento non riuscito.';}finally{lock(false);}
});
function openReviewed(input){
  const next=draftFromReviewedVisura(input);
  showGuide(next);field.value=JSON.stringify(next,null,2);
  status.textContent='Trascrizione sintetica caricata. Verifica separatamente inventario, copertura, presupposti ed evidenze.';
}
byId('reviewed-example').addEventListener('click',()=>{
  if(busy)return;clear();resetGuide();field.value='';
  try{openReviewed(reviewedVisuraExample(byId('scenario').value));}
  catch{resetGuide();status.textContent='Esempio non supportato.';}
});
byId('reviewed-template').addEventListener('click',()=>{
  if(busy)return;
  try{saveJson(reviewedVisuraExample(byId('scenario').value),'catasto-trascrizione-sintetica.json');status.textContent='Download modello sintetico richiesto.';}
  catch{status.textContent='Download non riuscito.';}
});
byId('reviewed-import').addEventListener('change',async event=>{
  if(busy)return;const file=event.target.files?.[0];event.target.value='';
  if(!file)return;clear();resetGuide();lock(true);field.value='';
  try{
    if(file.size>256*1024)throw Error('too_large');
    openReviewed(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())));
  }catch{resetGuide();field.value='';status.textContent='Trascrizione non supportata: nessun dato caricato.';}
  finally{lock(false);}
});
byId('import-draft').addEventListener('change',async event=>{
  if(busy)return;
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  clear();resetGuide();lock(true);field.value='';
  try{
    if(file.size>256*1024)throw Error('too_large');
    const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
    showGuide(input);field.value=JSON.stringify(input,null,2);
    status.textContent='Bozza sintetica importata. Analisi da eseguire.';
  }catch{resetGuide();status.textContent='Bozza non supportata: nessun dato caricato.';}finally{lock(false);}
});
byId('save-draft').addEventListener('click',()=>{
  if(busy||invalid.size)return;
  try{
    if(new TextEncoder().encode(field.value).length>256*1024)throw Error('too_large');
    const input=JSON.parse(field.value);guideFields(input);
    saveJson(input,'catasto-bozza-sintetica.json');
    status.textContent='Download bozza richiesto.';
  }catch{status.textContent='Bozza non supportata: nessun download.';}
});
field.addEventListener('input',()=>{resetGuide();clear();status.textContent='JSON modificato: riaprire l’editor guidato o analizzare.';});
byId('open-guide').addEventListener('click',()=>{
  if(busy)return;clear();
  // Never discard an invalid guided edit by silently loading the last valid JSON.
  if(invalid.size){status.textContent='Correggere i campi non validi oppure caricare un nuovo esempio.';return;}
  try{
    if(new TextEncoder().encode(field.value).length>256*1024)throw Error('too_large');
    showGuide(JSON.parse(field.value));status.textContent='Editor guidato aperto. Il formato non attesta la validità del caso.';
  }catch{resetGuide();status.textContent='JSON non supportato dall’editor guidato.';}
});
byId('scenario').addEventListener('change',()=>{field.value='';resetGuide();clear();status.textContent='Carica il nuovo esempio.';});
function showOperations(operations){
  const table=el('table'),head=el('thead'),tr=el('tr');
  for(const label of ['Operazione','Unità','Identificativi']){const th=el('th',label);th.scope='col';tr.append(th);}
  head.append(tr);table.append(head);
  const body=el('tbody');
  for(const op of operations){
    const line=el('tr');
    const ids=op.identifiers.map(r=>[r.identifier.sheet,r.identifier.parcel,r.identifier.subaltern??'—'].join('/')).join(', ');
    for(const value of [{S:'Soppressione',C:'Costituzione',unchanged:'Conservata'}[op.operation]??op.operation,op.unitId,ids])line.append(el('td',value));
    body.append(line);
  }
  table.append(body);if(operations.length)byId('operations').append(table);
}
analyze.addEventListener('click',async()=>{
  if(busy||invalid.size)return;clear();lock(true);
  try{
    if(new TextEncoder().encode(field.value).length>256*1024)throw Error('Input troppo grande.');
    const input=JSON.parse(field.value);
    report=await request('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    byId('summary').textContent=report.state==='research_candidate'?'Ipotesi di ricerca: '+report.candidate.cause:'Bloccato — nessuna ipotesi disponibile.';
    byId('relation').textContent=report.relation??'Nessuna relazione di proposta.';
    showOperations(report.operations);
    byId('details').textContent=JSON.stringify({warning:report.warning,operations:report.operations,evidence:report.evidence,source:report.source,blockers:report.blockers},null,2);
    status.textContent='Analisi diagnostica completata; nessuna approvazione.';
    download.disabled=report.diagnosticReportExportable!==true;
  }catch{clear();status.textContent='Analisi non riuscita. Controlla i dati e riprova.';}finally{lock(false);}
});
function saveJson(value,filename){saveFile(JSON.stringify(value,null,2),'application/json',filename);}
function saveFile(content,type,filename){
  let url,link;
  try{
    url=URL.createObjectURL(new Blob([content],{type}));
    link=document.createElement('a');link.href=url;link.download=filename;
    document.body.append(link);link.click();
  }finally{if(link)link.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
download.addEventListener('click',()=>{
  if(!report||busy)return;
  try{
    saveJson(report,'catasto-rapporto-sintetico-non-ufficiale.json');
    status.textContent='Download richiesto; verificare il file locale.';
  }catch{status.textContent='Download non riuscito.';}
});

byId('download-dossier').addEventListener('click',()=>{
  if(!report||busy||report.diagnosticReportExportable!==true)return;
  try{saveFile(renderDiagnosticDossier(report),'text/html;charset=utf-8','catasto-dossier-sintetico-non-ufficiale.html');status.textContent='Download dossier richiesto; aprire localmente per stampare.';}
  catch{status.textContent='Dossier non disponibile: ripetere l’analisi.';}
});
const visuraText=byId('visura-text'),visuraClaim=byId('visura-claim'),visuraResult=byId('visura-result');
function refreshVisuraClaims(){
  const previous=visuraClaim.value,option=el('option','Seleziona identificativo osservato');option.value='';
  visuraClaim.replaceChildren(option);
  for(const unit of draft.input.snapshot.units)for(const claim of unit.identifiers)if(claim.status==='observed'){
    const o=el('option',unit.id+' · '+claim.value.sheet+'/'+claim.value.parcel+'/'+(claim.value.subaltern??'—')+' · '+claim.id);
    o.value=claim.id;visuraClaim.append(o);
  }
  visuraClaim.value=[...visuraClaim.options].some(o=>o.value===previous)?previous:'';
}
function clearVisura(){visuraResult.textContent='Nessun confronto corrente.';}
visuraText.addEventListener('input',clearVisura);
visuraClaim.addEventListener('change',()=>{visuraText.value='';clearVisura();});
byId('visura-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';
  if(!file||busy||invalid.size)return;
  clearVisura();visuraText.value='';lock(true);
  try{
    if(file.size>256*1024)throw Error('too_large');
    const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
    visuraText.value=JSON.stringify(value,null,2);
  }catch{visuraResult.textContent='Trascrizione non leggibile.';}finally{lock(false);}
});
async function runVisura(example){
  if(busy||invalid.size)return;
  clearVisura();lock(true);
  if(example)visuraText.value='';
  try{
    if(new TextEncoder().encode(field.value).length>256*1024||new TextEncoder().encode(visuraText.value).length>256*1024)throw Error('too_large');
    if(!visuraClaim.value)throw Error('select_claim');
    const payload={draft:JSON.parse(field.value),claimId:visuraClaim.value};
    if(!example)Object.assign(payload,{version:'0.1.0',kind:'synthetic-visura-check',transcription:JSON.parse(visuraText.value)});
    const value=await request(example?'/api/visura-example':'/api/visura-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(example){visuraText.value=JSON.stringify(value,null,2);visuraResult.textContent='Esempio derivato dal caso, non prova indipendente. Modifica o importa una trascrizione sintetica.';}
    else visuraResult.textContent=JSON.stringify(value,null,2);
  }catch{visuraResult.textContent='Confronto non eseguito: controlla il caso, l’ID e la trascrizione.';}finally{lock(false);}
}
byId('visura-example').addEventListener('click',()=>runVisura(true));
byId('visura-check').addEventListener('click',()=>runVisura(false));
