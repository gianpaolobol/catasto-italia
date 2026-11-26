// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {validPlacement,syntheticFloorPlans} from '/synthetic-floor-plan.mjs';
import {diagnosticInventory,inventoryHeaders,inventoryCells} from '/diagnostic-inventory.mjs';
import {measureSyntheticPolygon,convertSyntheticPlanScale,syntheticPlanPreview} from '/synthetic-geometry.mjs';
import {guideFields,editGuidedDraft} from '/guided-draft.mjs';
import {draftFromReviewedVisura,reviewedVisuraExample} from '/reviewed-visura.mjs';
const byId=id=>document.getElementById(id);
const field=byId('case'),status=byId('status'),download=byId('download'),load=byId('load'),analyze=byId('analyze'),guide=byId('guide');
let report=null,busy=false,draft=null,geometryReport=null,incomeReport=null,appliedScale=null;
const invalid=new Set();
const geometries=new Map(),incomes=new Map();
const incomeFields=['category','class','zone','consistency','tariff'];
let tariffSource='synthetic-tariff';
function setTariffSource(source='synthetic-tariff'){tariffSource=source;byId('income-source').textContent=source==='synthetic-catalog-v1'?'Catalogo di prova v1 (non ufficiale)':'Tariffa inventata dichiarata manualmente';}
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function clear(){
  byId('visura-result').textContent='Nessun confronto corrente.';
  report=null;byId('handoff-status').textContent='Analizza un caso sintetico.';resetGeometry();resetIncome();download.disabled=true;byId('save-session').disabled=true;byId('download-archive').disabled=true;byId('download-dossier').disabled=true;byId('summary').textContent='Nessun rapporto corrente.';
  byId('relation').textContent='—';byId('details').textContent='—';byId('operations').replaceChildren();byId('inventory').replaceChildren();
}
function refresh(){refreshGeometry();refreshIncome();byId('save-session').disabled=busy||invalid.size>0||report?.state!=='research_candidate';byId('download-archive').disabled=byId('save-session').disabled;const handoffEnabled=!busy&&!invalid.size&&report?.state==='research_candidate';byId('handoff-target').disabled=!handoffEnabled;byId('handoff-download').disabled=!handoffEnabled;byId('download-dossier').disabled=busy||!report||report.diagnosticReportExportable!==true;for(const id of ['visura-check','visura-example','visura-claim','visura-file','visura-text'])byId(id).disabled=busy||invalid.size>0;analyze.disabled=busy||invalid.size>0;byId('save-draft').disabled=busy||invalid.size>0;for(const e of guide.querySelectorAll('input,select'))e.disabled=busy;}
function lock(value){busy=value;byId('import-session').disabled=value;byId('import-draft').disabled=value;byId('reviewed-import').disabled=value;byId('reviewed-example').disabled=value;byId('reviewed-template').disabled=value;load.disabled=value;field.readOnly=value;byId('scenario').disabled=value;byId('open-guide').disabled=value;refresh();}
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
    for(const value of [{S:'Soppressione',C:'Costituzione',V:'Variazione',unchanged:'Conservata'}[op.operation]??op.operation,op.unitId,ids])line.append(el('td',value));
    body.append(line);
  }
  table.append(body);if(operations.length)byId('operations').append(table);
}
// [Codex] The same before/after projection is used by the offline dossier.
function showInventory(){
  const target=byId('inventory');target.replaceChildren();
  const inventory=diagnosticInventory(report);
  if(!inventory){target.append(el('p','Nessun inventario diagnostico disponibile.'));return;}
  for(const [key,label] of [['before','Ante — identificativi osservati'],['after','Post — identificativi ipotizzati']]){
    const c=inventory.counts[key];target.append(el('h4',label),el('p',c.units+' unità / '+c.identifiers+' identificativi'));
    const table=el('table'),head=el('thead'),tr=el('tr');
    for(const label of inventoryHeaders){const th=el('th',label);th.scope='col';tr.append(th);}
    head.append(tr);table.append(head);const body=el('tbody');
    for(const row of inventory[key]){const line=el('tr');for(const value of inventoryCells(row))line.append(el('td',value));body.append(line);}
    table.append(body);table.dataset.phase=key;
    const wrapper=el('div');wrapper.style.overflowX='auto';table.style.minWidth='760px';wrapper.append(table);target.append(wrapper);
  }
}
function showCurrentReport(){
    byId('summary').textContent=report.state==='research_candidate'?'Ipotesi di ricerca: '+report.candidate.cause:'Bloccato — nessuna ipotesi disponibile.';
    byId('relation').textContent=report.relation??'Nessuna relazione di proposta.';
    showOperations(report.operations);showInventory();populateGeometryUnits();populateIncomeUnits();
    byId('details').textContent=JSON.stringify({warning:report.warning,operations:report.operations,evidence:report.evidence,source:report.source,blockers:report.blockers},null,2);
  download.disabled=report.diagnosticReportExportable!==true;
}
analyze.addEventListener('click',async()=>{
  if(busy||invalid.size)return;clear();lock(true);
  try{
    if(new TextEncoder().encode(field.value).length>256*1024)throw Error('Input troppo grande.');
    const input=JSON.parse(field.value);
    report=await request('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    showCurrentReport();
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

byId('download-dossier').addEventListener('click',async()=>{
  if(!report||busy||invalid.size||report.diagnosticReportExportable!==true)return;
  lock(true);
  try{
    const payload=currentDeclarations();
    if(new TextEncoder().encode(JSON.stringify(payload)).length>256*1024)throw Error('too_large');
    const result=await request('/api/dossier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!result.ok||typeof result.html!=='string')throw Error('blocked');
    saveFile(result.html,'text/html;charset=utf-8','catasto-dossier-sintetico-non-ufficiale.html');
    status.textContent='Download dossier richiesto, con gli annessi correnti disponibili; aprire localmente per stampare.';
  }catch{status.textContent='Dossier non disponibile: ripetere l’analisi.';}
  finally{lock(false);}
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

function clearGeometryAnnex(){
  geometries.delete(byId('geometry-unit').value);geometryReport=null;byId('geometry-result').textContent='Nessuna misura corrente.';byId('geometry-download').disabled=true;
}
function resetScale(){
  appliedScale=null;
  for(const id of ['scale-vertices','scale-drawing','scale-mm'])byId(id).value='';
  byId('scale-status').textContent='Nessuna conversione.';
}
function resetGeometry(){
  resetScale();resetPlacement();
  geometries.clear();
  const option=el('option','Analizza il caso');option.value='';
  byId('geometry-unit').replaceChildren(option);byId('geometry-vertices').value='';clearGeometryAnnex();refreshGeometry();
}
function populateGeometryUnits(){
  const option=el('option','Seleziona unità risultante o conservata');option.value='';
  byId('geometry-unit').replaceChildren(option);
  if(report?.state==='research_candidate')for(const op of [...report.operations.filter(o=>['C','V'].includes(o.operation)),...report.operations.filter(o=>o.operation==='unchanged')]){
    const row=el('option',(op.operation==='unchanged'?'Conservata (contesto)':op.operation)+' · '+op.unitId);row.value=op.unitId;byId('geometry-unit').append(row);
  }
  refreshGeometry();
}
function refreshPlanPreview(){
  const box=byId('geometry-preview');box.replaceChildren();
  const p=!invalid.size&&geometryReport?syntheticPlanPreview(report,geometryReport):null;
  if(!p){box.textContent='Nessun contorno misurato da mostrare.';return;}
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  for(const [k,v] of Object.entries({viewBox:p.viewBox,width:'100%',height:'220',preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Contorno geometrico sintetico non in scala di stampa'}))svg.setAttribute(k,v);
  for(const points of p.polygons??[p.points]){
    const polygon=document.createElementNS(ns,'polygon');
    for(const [k,v] of Object.entries({points,fill:'#e2eee9',stroke:'#245e4b','stroke-width':'2','vector-effect':'non-scaling-stroke'}))polygon.setAttribute(k,v);
    svg.append(polygon);
  }
  box.append(svg,el('p','Ingombro: '+p.widthMm+' × '+p.heightMm+' mm. Schema proporzionale; asse Y verso l’alto. Scala di stampa non verificata.'));
}
const placementIds=['placement-floor','placement-x','placement-y'];
function resetPlacement(p=null){
  [p?.floor,p?.xMm,p?.yMm].forEach((v,i)=>byId(placementIds[i]).value=v??'');
}
function readPlacement(){
  const [floor,x,y]=placementIds.map(id=>byId(id).value.trim());
  if(!floor&&!x&&!y)return null;
  if(!/^-?\d{1,8}$/.test(x)||!/^-?\d{1,8}$/.test(y))throw Error('invalid_placement');
  const p={floor,xMm:Number(x),yMm:Number(y)};
  if(!validPlacement(p))throw Error('invalid_placement');
  return p;
}
function refreshFloorPreview(){
  const box=byId('floor-preview');box.replaceChildren();
  const plans=syntheticFloorPlans(report,[...geometries.values()]);
  if(!plans){box.textContent='Nessuno schema corrente.';return;}
  if(!plans.floors.length)box.append(el('p','Nessuna posizione comune dichiarata.'));
  const ns='http://www.w3.org/2000/svg';
  for(const f of plans.floors){
    const svg=document.createElementNS(ns,'svg');
    for(const [k,v] of Object.entries({viewBox:f.viewBox,width:'100%',height:'220',role:'img','aria-label':'Schema sintetico per piano '+f.floor}))svg.setAttribute(k,v);
    box.append(el('h5','Piano '+f.floor+' — '+f.widthMm+' × '+f.heightMm+' mm'),svg);
    for(const u of f.units){
      for(const points of u.polygons){
        const polygon=document.createElementNS(ns,'polygon');
        for(const [k,v] of Object.entries({points,fill:u.color,'fill-opacity':'.65',stroke:'#245e4b','stroke-width':'2','vector-effect':'non-scaling-stroke'}))polygon.setAttribute(k,v);
        svg.append(polygon);
      }
      const legend=el('p',u.unitId+(u.operation==='unchanged'?' (conservata, solo contesto)':'')+' — X '+u.placement.xMm+' mm, Y '+u.placement.yMm+' mm');
      legend.style.borderLeft='12px solid '+u.color;legend.style.paddingLeft='6px';box.append(legend);
    }
    box.append(el('p',f.potentialOverlaps.length?'Possibili sovrapposizioni degli ingombri: '+f.potentialOverlaps.map(p=>p.join(' / ')).join('; '):'Nessuna intersezione positiva degli ingombri rilevata; non è verifica topologica.'));
  }
  box.append(el('p','Unità misurate senza posizione: '+(plans.unplaced.join(', ')||'nessuna')+'. Unità post senza geometria: '+(plans.missing.map(u=>u.unitId+' ('+u.operation+')').join(', ')||'nessuna')+'. Unità soppresse non rappresentate; completezza non attestata.'));
}
for(const id of placementIds)byId(id).addEventListener('input',()=>{clearGeometryAnnex();refreshGeometry();});
function refreshGeometry(){
  refreshPlanPreview();refreshFloorPreview();
  byId('geometry-count').textContent='Unità con misura corrente: '+geometries.size;
  const enabled=!busy&&!invalid.size&&report?.state==='research_candidate';
  byId('geometry-unit').disabled=!enabled;
  for(const id of ['geometry-example','geometry-multi-example','geometry-vertices','geometry-measure','scale-vertices','scale-drawing','scale-mm','scale-example','scale-convert',...placementIds])byId(id).disabled=!enabled||!byId('geometry-unit').value;
  byId('geometry-download').disabled=!enabled||!geometryReport;
}
byId('geometry-unit').addEventListener('change',()=>{
  resetScale();
  geometryReport=geometries.get(byId('geometry-unit').value)??null;
  resetPlacement(geometryReport?.placement);
  if(geometryReport?.calibration){
    appliedScale=geometryReport.calibration;
    byId('scale-vertices').value=JSON.stringify(appliedScale.vertices);
    byId('scale-drawing').value=String(appliedScale.drawingLength);
    byId('scale-mm').value=String(appliedScale.actualLengthMm);
    byId('scale-status').textContent='Conversione dichiarata ripristinata. Scala non verificata.';
  }
  byId('geometry-vertices').value=geometryReport?JSON.stringify(geometryReport.vertices,null,2):'';
  byId('geometry-result').textContent=geometryReport?'Area geometrica: '+geometryReport.areaM2+' m²; perimetro: '+geometryReport.perimeterMm+' mm. Non catastale.':'Nessuna misura corrente.';
  refreshGeometry();
});
byId('geometry-vertices').addEventListener('input',()=>{appliedScale=null;byId('scale-status').textContent='Vertici in mm modificati manualmente.';clearGeometryAnnex();refreshGeometry();});
const canConvertScale=()=>!busy&&!invalid.size&&report?.state==='research_candidate'&&!!byId('geometry-unit').value;
for(const id of ['scale-vertices','scale-drawing','scale-mm'])byId(id).addEventListener('input',()=>{byId('scale-status').textContent='Parametri modificati; nessuna nuova conversione applicata.';});
byId('scale-example').addEventListener('click',()=>{
  if(!canConvertScale())return;
  byId('scale-vertices').value=JSON.stringify([[-20,-10],[20,-10],[20,10],[-20,10]]);
  byId('scale-drawing').value='40';byId('scale-mm').value='4000';
  byId('scale-status').textContent='Esempio caricato; conversione non ancora applicata.';
});
byId('scale-convert').addEventListener('click',()=>{
  if(!canConvertScale())return;
  try{
    const raw=byId('scale-vertices').value,a=byId('scale-drawing').value,b=byId('scale-mm').value;
    if(raw.length>16384||!/^\d{1,8}$/.test(a)||!/^\d{1,8}$/.test(b))throw Error('invalid_input');
    const declaration={vertices:JSON.parse(raw),drawingLength:Number(a),actualLengthMm:Number(b)};
    const converted=convertSyntheticPlanScale(declaration);
    if(!converted.ok){byId('scale-status').textContent='Conversione bloccata: '+converted.blocker;return;}
    appliedScale=declaration;
    byId('geometry-vertices').value=JSON.stringify(converted.vertices,null,2);
    clearGeometryAnnex();refreshGeometry();
    byId('scale-status').textContent='Vertici in mm sostituiti; misura il nuovo contorno. Scala non verificata.';
  }catch{byId('scale-status').textContent='Dati di conversione non validi.';}
});
byId('geometry-example').addEventListener('click',()=>{
  if(busy||invalid.size||!report||!byId('geometry-unit').value)return;
  resetScale();
  byId('geometry-vertices').value=JSON.stringify([[0,0],[4000,0],[4000,1000],[2000,1000],[2000,3000],[0,3000]],null,2);
  clearGeometryAnnex();refreshGeometry();
});
byId('geometry-multi-example').addEventListener('click',()=>{
  if(busy||invalid.size||!report||!byId('geometry-unit').value)return;
  resetScale();
  byId('geometry-vertices').value=JSON.stringify([[[0,0],[4000,0],[4000,2000],[0,2000]],[[5000,0],[7000,0],[7000,1000],[5000,1000]]],null,2);
  clearGeometryAnnex();refreshGeometry();
});
byId('geometry-measure').addEventListener('click',()=>{
  if(busy||invalid.size||!report||!byId('geometry-unit').value)return;
  clearGeometryAnnex();
  try{
    const raw=byId('geometry-vertices').value;
    if(raw.length>16384)throw Error('too_large');
    const placement=readPlacement();
    const measured=measureSyntheticPolygon(report,byId('geometry-unit').value,JSON.parse(raw),appliedScale,placement!==null);
    if(measured.state==='measured'){
      if(placement)measured.placement=placement;
      geometryReport=measured;geometries.set(measured.unitId,measured);
      byId('geometry-result').textContent='Area geometrica: '+measured.areaM2+' m²; perimetro: '+measured.perimeterMm+' mm. Non catastale.';
    }else byId('geometry-result').textContent='Contorno bloccato: '+measured.blocker;
  }catch{byId('geometry-result').textContent='Contorno JSON o posizione comune non validi.';}
  refreshGeometry();
});
byId('geometry-download').addEventListener('click',()=>{
  if(busy||invalid.size||!geometryReport||geometryReport.caseDigest!==report?.caseDigest)return;
  try{saveJson(geometryReport,'catasto-annesso-geometrico-sintetico.json');status.textContent='Download annesso geometrico richiesto.';}
  catch{status.textContent='Download non riuscito.';}
});

byId('handoff-target').addEventListener('change',()=>{byId('handoff-status').textContent='Destinatario selezionato.';});
byId('handoff-download').addEventListener('click',async()=>{
  if(busy||invalid.size||report?.state!=='research_candidate')return;
  const digest=report.caseDigest,target=byId('handoff-target').value;
  lock(true);
  try{
    const payload={target,draft:JSON.parse(field.value)};
    if(new TextEncoder().encode(JSON.stringify(payload)).length>256*1024)throw Error('too_large');
    const result=await request('/api/handoff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!result.ok||result.handoff?.caseDigest!==digest||result.handoff?.target!==target)throw Error('blocked');
    saveJson(result.handoff,'catasto-handoff-'+target+'-sintetico.json');
    byId('handoff-status').textContent='Download richiesto: interscambio non ufficiale, importatore destinatario non validato.';
  }catch{byId('handoff-status').textContent='Interscambio bloccato: nessun file generato.';}
  finally{lock(false);}
});

function clearIncome(){incomes.delete(byId('income-unit').value);incomeReport=null;byId('income-result').textContent='Nessun calcolo corrente.';}
function resetIncome(){
  incomes.clear();setTariffSource();
  const option=el('option','Analizza il caso');option.value='';
  byId('income-unit').replaceChildren(option);
  for(const k of incomeFields)byId('income-'+k).value='';
  clearIncome();refreshIncome();
}
function populateIncomeUnits(){
  const option=el('option','Seleziona unità risultante');option.value='';
  byId('income-unit').replaceChildren(option);
  if(report?.state==='research_candidate')for(const op of report.operations)if(['C','V'].includes(op.operation)){
    const row=el('option',op.operation+' · '+op.unitId);row.value=op.unitId;byId('income-unit').append(row);
  }
  refreshIncome();
}
function refreshIncome(){
  byId('income-count').textContent='Unità con calcolo corrente: '+incomes.size;
  const enabled=!busy&&!invalid.size&&report?.state==='research_candidate';
  byId('income-unit').disabled=!enabled;
  for(const k of [...incomeFields,'example','calculate','lookup'])byId('income-'+k).disabled=!enabled||!byId('income-unit').value;
  byId('income-download').disabled=!enabled||!incomeReport;
}
byId('income-unit').addEventListener('change',()=>{
  incomeReport=incomes.get(byId('income-unit').value)??null;
  const d=incomeReport?.declared;
  setTariffSource(d?.sourceId);
  [d?.category,d?.classNumber,d?.zone,d?.consistency,d?.tariff].forEach((v,i)=>byId('income-'+incomeFields[i]).value=v??'');
  byId('income-result').textContent=incomeReport?'Prodotto esatto: € '+incomeReport.exactProductEur+' (simulazione, non rendita ufficiale).':'Nessun calcolo corrente.';
  refreshIncome();
});
for(const k of incomeFields)byId('income-'+k).addEventListener('input',()=>{
  // A changed lookup key must never silently reuse a catalog-derived price as manual input.
  if(k!=='consistency'){
    if(k!=='tariff'&&tariffSource==='synthetic-catalog-v1')byId('income-tariff').value='';
    setTariffSource();
  }
  clearIncome();refreshIncome();
});
byId('income-lookup').addEventListener('click',async()=>{
  if(busy||invalid.size||report?.state!=='research_candidate'||!byId('income-unit').value)return;
  const unitId=byId('income-unit').value,digest=report.caseDigest;
  const [category,classNumber,zone]=incomeFields.slice(0,3).map(k=>byId('income-'+k).value.trim());
  clearIncome();setTariffSource();byId('income-tariff').value='';
  lock(true);
  try{
    const payload={draft:JSON.parse(field.value),unitId,zone,category,classNumber};
    const result=await request('/api/tariff-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!result.ok||result.caseDigest!==digest||result.unitId!==unitId||result.row?.sourceId!=='synthetic-catalog-v1')throw Error('blocked');
    byId('income-tariff').value=result.row.tariff;setTariffSource(result.row.sourceId);
    byId('income-result').textContent='Tariffa di prova trovata. Dichiara la consistenza e calcola.';
  }catch{byId('income-result').textContent='Nessuna tariffa di prova univoca per la chiave dichiarata.';}
  finally{lock(false);}
});
byId('income-example').addEventListener('click',()=>{
  if(busy||invalid.size||report?.state!=='research_candidate'||!byId('income-unit').value)return;
  setTariffSource();
  ['A/2','2','SYNTH-1','4.5','123.4567'].forEach((v,i)=>byId('income-'+incomeFields[i]).value=v);
  clearIncome();refreshIncome();
});
byId('income-calculate').addEventListener('click',async()=>{
  if(busy||invalid.size||report?.state!=='research_candidate'||!byId('income-unit').value)return;
  clearIncome();
  const unitId=byId('income-unit').value,digest=report.caseDigest;
  const [category,classNumber,zone,consistency,tariff]=incomeFields.map(k=>byId('income-'+k).value.trim());
  const unit={A:'vani',B:'m3',C:'m2'}[category[0]];
  lock(true);
  try{
    const payload={draft:JSON.parse(field.value),unitId,declared:{category,classNumber,zone,consistency,tariff,unit,sourceId:tariffSource}};
    if(new TextEncoder().encode(JSON.stringify(payload)).length>256*1024)throw Error('too_large');
    const result=await request('/api/income',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!result.ok||result.worksheet?.caseDigest!==digest||result.worksheet?.unitId!==unitId)throw Error('blocked');
    incomeReport=result.worksheet;incomes.set(unitId,incomeReport);
    byId('income-result').textContent='Prodotto esatto: € '+incomeReport.exactProductEur+' (simulazione, non rendita ufficiale).';
  }catch{byId('income-result').textContent='Calcolo bloccato: controlla categoria, classe, zona sintetica e valori positivi.';}
  finally{lock(false);}
});
byId('income-download').addEventListener('click',()=>{
  if(busy||invalid.size||!incomeReport||incomeReport.caseDigest!==report?.caseDigest||incomeReport.unitId!==byId('income-unit').value)return;
  saveJson(incomeReport,'catasto-annesso-estimativo-sintetico.json');
});

function currentDeclarations(){
  return {draft:JSON.parse(field.value),expectedState:report.state,expectedDigest:report.caseDigest,
    geometry:[...geometries.values()].map(a=>({unitId:a.unitId,vertices:a.vertices,...(a.calibration?{calibration:a.calibration}:{}),...(a.placement?{placement:a.placement}:{})})),
    income:[...incomes.values()].map(a=>({unitId:a.unitId,declared:a.declared}))};
}
async function replaySession(session){
  const body=JSON.stringify(session);
  if(new TextEncoder().encode(body).length>256*1024)throw Error('too_large');
  const result=await request('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body});
  if(!result.ok||result.report?.state!=='research_candidate'||!Array.isArray(result.geometry)||!Array.isArray(result.income))throw Error('blocked');
  return result;
}
// [Codex] One local download, all members rebuilt from current declarations.
byId('download-archive').addEventListener('click',async()=>{
  if(busy||invalid.size||report?.state!=='research_candidate')return;
  lock(true);
  try{
    const session={version:'0.1.0',kind:'synthetic-practice-session',request:currentDeclarations()};
    guideFields(session.request.draft);
    const body=JSON.stringify(session);
    if(new TextEncoder().encode(body).length>256*1024)throw Error('too_large');
    const response=await fetch('/api/archive',{method:'POST',headers:{'Content-Type':'application/json'},body});
    if(!response.ok||!response.headers.get('content-type')?.startsWith('application/zip'))throw Error('blocked');
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>8*1024*1024)throw Error('too_large');
    saveFile(bytes,'application/zip','catasto-pratica-sintetica-non-ufficiale.zip');
    status.textContent='Archivio richiesto: dossier, sessione, rapporto, interscambi e manifest. Estrarre localmente.';
  }catch{status.textContent='Archivio non disponibile: controlla il caso e gli annessi.';}
  finally{lock(false);}
});
byId('save-session').addEventListener('click',async()=>{
  if(busy||invalid.size||report?.state!=='research_candidate')return;
  lock(true);
  try{
    const session={version:'0.1.0',kind:'synthetic-practice-session',request:currentDeclarations()};
    guideFields(session.request.draft);
    await replaySession(session);
    // Compact representation keeps the saved file within the server byte limit.
    saveFile(JSON.stringify(session),'application/json','catasto-sessione-sintetica.json');
    status.textContent='Download sessione richiesto: caso e annessi correnti, nessun risultato accettato senza ricalcolo.';
  }catch{status.textContent='Sessione non esportabile: controlla il caso e gli annessi.';}
  finally{lock(false);}
});
byId('import-session').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';
  if(!file||busy)return;
  lock(true);
  try{
    if(file.size>256*1024)throw Error('too_large');
    const session=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
    const result=await replaySession(session);
    // Validate editor compatibility before replacing the current work.
    guideFields(session.request.draft);
    clear();showGuide(session.request.draft);
    field.value=JSON.stringify(session.request.draft);
    byId('scenario').value=session.request.draft.input.scenario;
    report=result.report;showCurrentReport();
    for(const a of result.geometry)geometries.set(a.unitId,a);
    for(const a of result.income)incomes.set(a.unitId,a);
    for(const [id,items] of [['geometry-unit',geometries],['income-unit',incomes]]){
      if(items.size){byId(id).value=items.keys().next().value;byId(id).dispatchEvent(new Event('change'));}
    }
    status.textContent='Sessione sintetica ripristinata; caso e annessi ricalcolati. Nessuna approvazione.';
  }catch{status.textContent='Sessione non valida: nessun ripristino eseguito.';}
  finally{lock(false);}
});
