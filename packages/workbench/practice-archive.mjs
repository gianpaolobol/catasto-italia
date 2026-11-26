// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Local diagnostic archive; never a DOCFA export, signature or submission.
import {createHash} from 'node:crypto';
import {replayPracticeSession} from './integrated-dossier.mjs';
import {renderDiagnosticDossier} from './diagnostic-dossier.mjs';
import {buildSyntheticHandoff} from './synthetic-handoff.mjs';

const LIMIT=8*1024*1024;
const targets=['pianta-libera','mpe','ape-italia'];
const json=x=>JSON.stringify(x);
const sha=b=>createHash('sha256').update(b).digest('hex');
const table=Uint32Array.from({length:256},(_,i)=>{
  let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
  return c>>>0;
});
function crc32(b){
  let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
// ZIP STORE only, fixed ASCII names; no external file paths, decompression or ZIP64.
function zip(entries){
  let offset=0,centralSize=0;const local=[],central=[];
  for(const [name,bytes] of entries){
    const n=Buffer.from(name,'ascii'),c=crc32(bytes),a=Buffer.alloc(30),d=Buffer.alloc(46);
    a.writeUInt32LE(0x04034b50,0);a.writeUInt16LE(20,4);a.writeUInt16LE(33,12);
    a.writeUInt32LE(c,14);a.writeUInt32LE(bytes.length,18);a.writeUInt32LE(bytes.length,22);a.writeUInt16LE(n.length,26);
    d.writeUInt32LE(0x02014b50,0);d.writeUInt16LE(20,4);d.writeUInt16LE(20,6);d.writeUInt16LE(33,14);
    d.writeUInt32LE(c,16);d.writeUInt32LE(bytes.length,20);d.writeUInt32LE(bytes.length,24);d.writeUInt16LE(n.length,28);d.writeUInt32LE(offset,42);
    local.push(a,n,bytes);central.push(d,n);offset+=a.length+n.length+bytes.length;centralSize+=d.length+n.length;
    if(offset+centralSize+22>LIMIT)throw Error('archive_too_large');
  }
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
  end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
  end.writeUInt32LE(centralSize,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,...central,end]);
}
export function buildPracticeArchive(session){
  const fail=error=>({ok:false,error,bytes:null});
  try{
    const current=replayPracticeSession(session);
    if(!current.ok)return fail('archive_session_blocked');
    const {report,geometry,income}=current;
    const entries=[
      ['LEGGIMI.txt','CATasto Italia — SIMULAZIONE SINTETICA NON UFFICIALE\nAprire dossier-sintetico.html localmente; per riaprire il lavoro importare sessione-sintetica.json nel laboratorio.\nI tre interscambi non sono validati nelle applicazioni destinatarie.\nNessuna firma, invio, disponibilità, autenticità o compatibilità DOCFA/SISTER attestata.\nIl manifest registra SHA-256 dei file, non una firma.\n'],
      ['sessione-sintetica.json',json(session)],
      ['rapporto-sintetico.json',json(report)],
      ['dossier-sintetico.html',renderDiagnosticDossier(report,{geometry,income})]
    ];
    for(const target of targets){
      const result=buildSyntheticHandoff(session.request.draft,target);
      if(!result.ok||result.handoff.caseDigest!==report.caseDigest)return fail('archive_handoff_blocked');
      entries.push(['interscambio-'+target+'.json',json(result.handoff)]);
    }
    const buffers=entries.map(([name,content])=>[name,Buffer.from(content,'utf8')]);
    const manifest={version:'0.1.0',kind:'synthetic-diagnostic-archive-manifest',caseDigest:report.caseDigest,
      official:false,signature:false,submission:false,files:buffers.map(([name,b])=>({name,bytes:b.length,sha256:sha(b)}))};
    buffers.push(['manifest.json',Buffer.from(json(manifest),'utf8')]);
    return {ok:true,error:null,bytes:zip(buffers)};
  }catch{return fail('archive_processing_failed');}
}
