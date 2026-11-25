// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
const byId=id=>document.getElementById(id);
const field=byId('case'),status=byId('status'),download=byId('download'),load=byId('load'),analyze=byId('analyze');
let report=null,busy=false;
function clear(){
  report=null;download.disabled=true;byId('summary').textContent='Nessun rapporto corrente.';
  byId('relation').textContent='—';byId('details').textContent='—';
}
function lock(value){busy=value;load.disabled=value;analyze.disabled=value;field.readOnly=value;byId('scenario').disabled=value;}
async function request(path,options){
  const res=await fetch(path,options);
  if(!res.ok)throw Error('Richiesta non riuscita ('+res.status+').');
  return res.json();
}
load.addEventListener('click',async()=>{
  if(busy)return;clear();lock(true);
  try{field.value=JSON.stringify(await request('/api/fixture/'+byId('scenario').value),null,2);status.textContent='Esempio sintetico caricato.';}
  catch{field.value='';status.textContent='Caricamento non riuscito.';}finally{lock(false);}
});
field.addEventListener('input',()=>{clear();status.textContent='Dati modificati: analisi da ripetere.';});
byId('scenario').addEventListener('change',()=>{field.value='';clear();status.textContent='Carica il nuovo esempio.';});
analyze.addEventListener('click',async()=>{
  if(busy)return;clear();lock(true);
  try{
    if(new TextEncoder().encode(field.value).length>256*1024)throw Error('Input troppo grande.');
    const input=JSON.parse(field.value);
    report=await request('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    byId('summary').textContent=report.state==='research_candidate'?'Ipotesi di ricerca: '+report.candidate.cause:'Bloccato — nessuna ipotesi disponibile.';
    byId('relation').textContent=report.relation??'Nessuna relazione di proposta.';
    byId('details').textContent=JSON.stringify({warning:report.warning,operations:report.operations,evidence:report.evidence,source:report.source,blockers:report.blockers},null,2);
    status.textContent='Analisi diagnostica completata; nessuna approvazione.';
    download.disabled=report.diagnosticReportExportable!==true;
  }catch{clear();status.textContent='Analisi non riuscita. Controlla il JSON e riprova.';}finally{lock(false);}
});
download.addEventListener('click',()=>{
  if(!report||busy)return;
  let url,link;
  try{
    url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    link=document.createElement('a');link.href=url;link.download='catasto-rapporto-sintetico-non-ufficiale.json';
    document.body.append(link);link.click();status.textContent='Download richiesto; verificare il file locale.';
  }catch{status.textContent='Download non riuscito.';}
  finally{if(link)link.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
