// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Local diagnostic worklist for human review, not a DOCFA record mapping.
import {replayPracticeSession} from './integrated-dossier.mjs';
import {syntheticFloorPlans} from './synthetic-floor-plan.mjs';

export function buildManualDocfaWorklist(session){
  const block=error=>({ok:false,error,worklist:null});
  try{
    const replay=replayPracticeSession(session);
    if(!replay.ok)return block(replay.error);
    const {report,geometry,income}=replay;
    const g=new Map(geometry.map(a=>[a.unitId,a])),i=new Map(income.map(a=>[a.unitId,a]));
    const plan=syntheticFloorPlans(report,geometry);
    if(!plan)return block('invalid_floor_plan');
    const rows=report.operations.map(op=>{
      const result=['C','V'].includes(op.operation),context=op.operation==='unchanged';
      const measured=g.get(op.unitId),estimate=i.get(op.unitId);
      return {unitId:op.unitId,operation:op.operation,identifiers:op.identifiers,
        geometry:result||context?{state:!measured?'missing':measured.placement?'declared_position':'local_only',
          areaM2:measured?.areaM2??null,placement:measured?.placement??null}:null,
        income:result?{state:estimate?'synthetic_only':'missing',declared:estimate?.declared??null,
          exactProductEur:estimate?.exactProductEur??null}:null};
    });
    const overlapWarnings=plan.floors.flatMap(f=>f.potentialOverlaps.map(unitIds=>({floor:f.floor,unitIds})));
    const gaps={geometry:rows.filter(r=>r.geometry?.state==='missing').map(r=>r.unitId),
      placement:rows.filter(r=>r.geometry?.state==='local_only').map(r=>r.unitId),
      income:rows.filter(r=>r.income?.state==='missing').map(r=>r.unitId),potentialOverlaps:overlapWarnings};
    const checks=[
      ['territory_and_identifiers','Verificare territorio, identificativi, disponibilità e titolarità con fonti ufficiali.'],
      ['cause_and_documents','Verificare causale, presupposti, atti ed evidenze indipendenti.'],
      ['drawings','Verificare scala, planimetrie, poligoni ed elaborato con specifiche vigenti.'],
      ['classification','Verificare classamento, consistenza, tariffario territoriale vigente e rendita.'],
      ['official_forms','Compilare e verificare i modelli nella versione ufficiale DOCFA, senza importare questo JSON.'],
      ['official_validation','Eseguire collaudo locale con strumenti ufficiali; firma e trasmissione escluse.']
    ].map(([id,label])=>({id,label,state:'unverified'}));
    return {ok:true,error:null,worklist:{version:'0.1.0',kind:'synthetic-manual-docfa-review-worklist',
      warning:'SIMULAZIONE SINTETICA — NON UFFICIALE. Promemoria per verifica umana, non tracciato DOCFA.',
      caseDigest:report.caseDigest,relation:report.relation,source:report.source,evidence:report.evidence,
      rows,gaps,checks,diagnosticCoverageComplete:Object.values(gaps).every(a=>a.length===0),
      officialValidation:false,officialExport:false,signature:false,submission:false}};
  }catch{return block('manual_review_processing_failed');}
}

 // [Codex] Offline printable comparison sheet: all manual observations remain blank.
export function buildManualDocfaWorksheet(session){
  const result=buildManualDocfaWorklist(session);
  if(!result.ok)return {...result,worksheetHtml:null};
  const w=result.worklist;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=v=>esc(JSON.stringify(v,null,2));
  const labels={S:'Soppressa',C:'Costituita',V:'Variata',unchanged:'Conservata'};
  const rows=w.rows.map(r=>`<tr><th scope="row">${esc(r.unitId)} — ${esc(labels[r.operation]??r.operation)}</th><td><pre>${data(r.identifiers)}</pre></td><td><pre>${data(r.geometry)}</pre></td><td><pre>${data(r.income)}</pre></td><td class="blank">Da confrontare</td></tr>`).join('');
  const checks=w.checks.map(c=>`<tr><th scope="row">${esc(c.id)}</th><td>${esc(c.label)}</td><td>NON VERIFICATO</td><td class="blank">Esito / riferimento:</td></tr>`).join('');
  const gaps=[['Geometrie mancanti',w.gaps.geometry],['Posizioni mancanti',w.gaps.placement],['Simulazioni mancanti',w.gaps.income],['Possibili sovrapposizioni degli ingombri',w.gaps.potentialOverlaps]].map(([label,items])=>`<li>${esc(label)}: ${items.length?data(items):'nessuna rilevata nella simulazione'}</li>`).join('');
  const worksheetHtml=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Scheda confronto DOCFA — non ufficiale</title><style>body{font:14px system-ui,sans-serif;color:#172421;margin:24px;line-height:1.4}h1{font-size:24px}h2{font-size:18px;margin-top:24px}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #aaa;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;margin:0}.blank{min-height:40px;color:#444}.warning{border:2px solid #444;padding:10px;font-weight:bold}code{overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid} @media print{body{margin:0;font-size:11px}h2{break-after:avoid}pre{font-size:9px}}</style></head><body>
<h1>Scheda di confronto manuale DOCFA</h1><p class="warning">${esc(w.warning)} Nessuna verifica ufficiale, firma, trasmissione o compatibilità attestata.</p>
<p>Digest del caso: <code>${esc(w.caseDigest)}</code>. Identifica il caso diagnostico, non autentica i documenti o gli annessi. Conservare anche la sessione JSON corrente per riprodurre la scheda.</p>
<h2>Ambiente della prova — da compilare a mano</h2><p>Data: ____________________ &nbsp; Versione DOCFA: ____________________</p><p>Provincia / archivio tariffario / data e hash: ______________________________________________</p><p>Riferimento tracciato ufficiale / versione: ______________________________________________</p><p>Identificativo prova sintetica e riferimento ai log locali: _________________________________</p>
<h2>Relazione diagnostica</h2><p>${esc(w.relation)}</p><h2>Operazioni e valori da confrontare</h2><table><thead><tr><th>Unità / operazione</th><th>Identificativi</th><th>Geometria dichiarata</th><th>Simulazione estimativa</th><th>Riscontro DOCFA / differenze</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Lacune diagnostiche</h2><ul>${gaps}</ul><p>La copertura degli annessi non implica conformità.</p>
<h2>Controlli ufficiali ancora aperti</h2><table><thead><tr><th>Controllo</th><th>Azione manuale</th><th>Stato iniziale</th><th>Esito e prova da registrare</th></tr></thead><tbody>${checks}</tbody></table>
<h2>Fonti ed evidenze diagnostiche, non indipendenti</h2><pre>${data(w.source)}</pre><pre>${data(w.evidence)}</pre>
<h2>Risultato del confronto — da compilare</h2><p>Difformità rilevate: ____________________________________________________________________</p><p>Riferimenti delle prove riproducibili: _____________________________________________________</p><p>Azioni correttive: ______________________________________________________________________</p><p>Esito non acquisito. Non eseguire firma o invio; la scheda non modifica lo stato dell'app.</p></body></html>`;
  return {...result,worksheetHtml};
}
