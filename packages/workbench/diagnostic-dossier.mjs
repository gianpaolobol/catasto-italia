// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Presentation only. Input is the current server-generated diagnostic report.
import {diagnosticInventory,inventoryHeaders,inventoryCells} from './diagnostic-inventory.mjs';
import {syntheticPlanPreview} from './synthetic-geometry.mjs';
import {syntheticFloorPlans} from './synthetic-floor-plan.mjs';
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table=(headers,rows)=>'<table><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
export function renderDiagnosticDossier(r,{geometry=null,income=null}={}){
  if(!r||r.version!=='0.1.0'||r.kind!=='synthetic-diagnostic-report'||
    !['blocked','research_candidate'].includes(r.state)||r.operative!==false||
    r.canExport!==false||r.availability!=='unverified'||r.diagnosticReportExportable!==true||
    ![r.operations,r.evidence,r.blockers].every(a=>Array.isArray(a)&&a.length<=4096)||
    (r.state==='blocked'&&(r.operations.length||r.evidence.length||r.candidate!==null||r.relation!==null)))
    throw Error('unsupported_diagnostic_report');
  const labels={S:'Soppressione',C:'Costituzione',unchanged:'Conservata',V:'Variazione'};
  const ops=r.operations.map(op=>{
    if(!Object.hasOwn(labels,op.operation)||!Array.isArray(op.identifiers)||
      op.identifiers.some(row=>row.identifier?.municipalityCode!=='SYNTH'))throw Error('unsupported_operation');
    return [labels[op.operation],op.unitId,op.identifiers.map(row=>[row.identifier.municipalityCode,row.identifier.section??'—',row.identifier.sheet,row.identifier.parcel,row.identifier.subaltern??'—'].join('/')).join('; ')];
  });
  const inventory=diagnosticInventory(r);
  if(r.state==='research_candidate'&&!inventory)throw Error('invalid_diagnostic_inventory');
  const inventoryHtml='<h2>Inventario diagnostico ante e post</h2>'+
    (inventory?['before','after'].map(key=>'<h3>'+(key==='before'?'Ante — identificativi osservati':'Post — identificativi ipotizzati')+'</h3><p>'+
      esc(inventory.counts[key].units)+' unità / '+esc(inventory.counts[key].identifiers)+' identificativi</p>'+
      table(inventoryHeaders,inventory[key].map(inventoryCells))).join(''):'<p>Nessun inventario diagnostico disponibile.</p>')+
    '<p>Proiezione delle operazioni dichiarate; non è un elenco subalterni ufficiale né un file DAT. Non attesta disponibilità.</p>';
  const resulting=a=>r.state==='research_candidate'&&a.caseDigest===r.caseDigest&&r.operations.some(o=>o.unitId===a.unitId&&['C','V'].includes(o.operation));
  const gs=geometry===null?[]:Array.isArray(geometry)?geometry:[geometry];
  const ins=income===null?[]:Array.isArray(income)?income:[income];
  if(gs.length>64||new Set(gs.map(a=>a?.unitId)).size!==gs.length||
    gs.some(a=>!a||!(resulting(a)||(r.state==='research_candidate'&&a.caseDigest===r.caseDigest&&a.operation==='unchanged'&&a.placement&&r.operations.some(o=>o.unitId===a.unitId&&o.operation==='unchanged')))||a.kind!=='synthetic-geometry-annex'||a.state!=='measured'||a.coordinateUnit!=='mm'||!Array.isArray(a.vertices)||a.vertices.length>128))throw Error('invalid_geometry_annex');
  if(ins.length>64||new Set(ins.map(a=>a?.unitId)).size!==ins.length||
    ins.some(a=>!a||!resulting(a)||a.kind!=='synthetic-income-worksheet'||a.operative!==false||a.officialTariffVerified!==false||a.classificationVerified!==false||a.officialRoundingApplied!==false))throw Error('invalid_income_annex');
  const drawings=gs.map(a=>{
    const p=syntheticPlanPreview(r,a);if(!p)throw Error('invalid_geometry_preview');
    return '<figure class="plan-preview"><figcaption>Unità '+esc(a.unitId)+(a.operation==='unchanged'?' (conservata, solo contesto)':'')+' — ingombro '+p.widthMm+' × '+p.heightMm+' mm</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="'+p.viewBox+'" width="100%" height="220" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Contorno geometrico sintetico non in scala di stampa">'+(p.polygons??[p.points]).map(points=>'<polygon points="'+points+'" fill="#e2eee9" stroke="#245e4b" stroke-width="2" vector-effect="non-scaling-stroke"/>').join('')+'</svg><p>Schema proporzionale, asse Y verso l’alto; scala di stampa non verificata. Contorni disgiunti sullo stesso piano; non rappresenta fori o piani sovrapposti.</p></figure>';
  }).join('');
  // [Codex] Explicit provenance distinguishes manual mm from a replayed declared conversion.
  const calibrationRows=gs.map(a=>[a.unitId,a.calibration?'Conversione dichiarata, scala non verificata':'Millimetri dichiarati manualmente',a.calibration?.drawingLength??'—',a.calibration?.actualLengthMm??'—',a.calibration?JSON.stringify(a.calibration.vertices):'—']);
  const calibrationTable=gs.length?'<h3>Provenienza della scala</h3>'+table(['Unità','Origine delle coordinate','Lunghezza disegno','Lunghezza dichiarata mm','Vertici originali'],calibrationRows):'';
  const plans=syntheticFloorPlans(r,gs);
  if(!plans)throw Error('invalid_floor_plan');
  const planHtml='<h2>Schema diagnostico per piano</h2><p>Posizioni e piano dichiarati; origine comune sintetica, traslazione in mm, assi paralleli. Nessuna verifica di scala, topologia tra unità o elaborato ufficiale.</p>'+
    (plans.floors.length?plans.floors.map(f=>'<h3>Piano '+esc(f.floor)+'</h3><figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="'+f.viewBox+'" width="100%" height="240" role="img" aria-label="Schema sintetico per piano">'+
    f.units.map(u=>u.polygons.map(points=>'<polygon points="'+points+'" fill="'+u.color+'" fill-opacity=".65" stroke="#245e4b" stroke-width="2" vector-effect="non-scaling-stroke"/>').join('')).join('')+
    '</svg></figure>'+table(['Unità','Ruolo','Traslazione X mm','Traslazione Y mm','Colore'],f.units.map(u=>[u.unitId,u.operation==='unchanged'?'Conservata — contesto':'Risultante',u.placement.xMm,u.placement.yMm,u.color]))+
    '<p>Ingombro '+f.widthMm+' × '+f.heightMm+' mm. '+(f.potentialOverlaps.length?'Possibili sovrapposizioni degli ingombri: '+esc(f.potentialOverlaps.map(pair=>pair.join(' / ')).join('; ')):'Nessuna intersezione positiva degli ingombri rilevata; non è verifica topologica.')+'</p>').join(''):'<p>Nessuna posizione comune dichiarata.</p>')+
    '<p>Unità misurate senza posizione: '+esc(plans.unplaced.join(', ')||'nessuna')+'. Unità post senza geometria: '+esc(plans.missing.map(u=>u.unitId+' ('+u.operation+')').join(', ')||'nessuna')+'. Le unità soppresse non sono rappresentate; le conservate sono solo contesto dichiarato. Non attesta completezza dell’elaborato.</p>';
  const annexes='<h2>Annesso geometrico sintetico</h2>'+ (gs.length?table(['Unità','Area geometrica m²','Perimetro mm','Vertici in mm'],gs.map(a=>[a.unitId,a.areaM2,a.perimeterMm,JSON.stringify(a.vertices)]))  +drawings+calibrationTable+'<p>Misura geometrica non catastale. Scala e coefficienti ufficiali non verificati.</p>':'<p>Nessuna misura corrente inclusa.</p>')+
    planHtml+'<h2>Annesso estimativo sintetico</h2>'+ (ins.length?table(['Unità','Categoria / classe / zona inventata','Consistenza dichiarata','Tariffa inventata EUR/unità','Provenienza tariffa','Prodotto esatto EUR'],ins.map(a=>[a.unitId,[a.declared.category,a.declared.classNumber,a.declared.zone].join(' / '),a.declared.consistency+' '+a.declared.unit,a.declared.tariff,a.declared.sourceId==='synthetic-catalog-v1'?'Catalogo di prova v1 (non ufficiale)':'Dichiarazione manuale sintetica',a.exactProductEur]))+'<p>Prodotto dimostrativo non arrotondato; non rendita catastale attribuita.</p>'+[...new Set(ins.map(a=>a.source.title))].map(t=>'<p>'+esc(t)+'</p>').join(''):'<p>Nessun calcolo corrente incluso.</p>')+
    '<h2>Copertura degli annessi per unità risultante</h2>'+table(['Unità','Misura inclusa','Calcolo incluso'],r.operations.filter(o=>['C','V'].includes(o.operation)).map(o=>[o.unitId,gs.some(a=>a.unitId===o.unitId)?'Sì':'Assente',ins.some(a=>a.unitId===o.unitId)?'Sì':'Assente']))+
    '<p>Gli annessi si riferiscono esclusivamente alle unità indicate; assenza di annessi non equivale a verifica.</p>';
  const h='<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><meta name="referrer" content="no-referrer">'+
    '<title>Catasto Italia — dossier diagnostico sintetico</title><style>'+
    'body{font:15px/1.5 system-ui,sans-serif;color:#18332e;margin:32px auto;padding:0 16px;max-width:1000px}h1,h2{line-height:1.2}p,td,th{overflow-wrap:anywhere}.warning{border:2px solid #80541d;padding:12px}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #77857d;padding:6px;text-align:left;vertical-align:top}th{background:#eef2ef}code{overflow-wrap:anywhere}.plan-preview{margin:12px 0;max-width:420px;break-inside:avoid}.plan-preview svg{display:block;border:1px solid #77857d}@media print{body{margin:0;color:#000}thead{display:table-header-group}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body>'+
    '<h1>Catasto Italia — dossier diagnostico</h1><p class="warning"><strong>SIMULAZIONE SINTETICA — NON UFFICIALE</strong><br>Nessuna pratica, approvazione, disponibilità di subalterni, firma o invio attestati. Non importabile in DOCFA.</p>'+
    '<h2>Esito</h2><p>'+(r.state==='research_candidate'?'Ipotesi di ricerca non operativa':'Bloccato — nessuna ipotesi disponibile')+'</p>'+
    '<p>Impronta del caso dichiarato: <code>'+esc(r.caseDigest)+'</code>. Non costituisce firma o prova di autenticità.</p>'+
    '<h2>Relazione di ricerca</h2><p>'+esc(r.relation??'Nessuna relazione di proposta.')+'</p>'+
    '<h2>Operazioni diagnostiche</h2>'+(ops.length?table(['Operazione','Unità','Identificativi dichiarati'],ops):'<p>Nessuna operazione.</p>')+
    inventoryHtml+'<h2>Evidenze dichiarate</h2>'+(r.evidence.length?table(['Fatto','Fonte','Valore','Locatore'],r.evidence.map(e=>[e.fact,e.sourceId,e.value,JSON.stringify(e.locator??null)])):'<p>Nessuna evidenza restituita.</p>')+
    '<h2>Riferimento di ricerca</h2><p>'+esc(r.source?.title)+' — '+esc(r.source?.id)+' — revisione '+esc(r.source?.revision)+'</p><p>'+esc(r.source?.url)+'</p><p>Applicabilità operativa non attestata dal dossier.</p>'+
    '<h2>Blocchi e verifiche ancora necessarie</h2>'+(r.blockers.length?'<ul>'+r.blockers.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>':'<p>Nessun blocco diagnostico restituito; ciò non equivale a validazione.</p>')+
    annexes+'<p>Verifica professionale, fonti vigenti e controllo con strumenti ufficiali ancora necessari.</p></body></html>';
  if(new TextEncoder().encode(h).length>4*1024*1024)throw Error('dossier_too_large');
  return h;
}
