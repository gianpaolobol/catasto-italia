// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {syntheticCase,scenarios} from '../../packages/workbench/fixtures.mjs';
import {compareSyntheticVisura,syntheticVisuraExample} from '../../packages/workbench/visura-comparison.mjs';
import {buildPracticeReport} from '../../packages/workbench/index.mjs';
import {buildSyntheticHandoff} from '../../packages/workbench/synthetic-handoff.mjs';
const page=readFileSync(new URL('./index.html',import.meta.url));
const script=readFileSync(new URL('./client.js',import.meta.url));
const guideScript=readFileSync(new URL('../../packages/workbench/guided-draft.mjs',import.meta.url));
const reviewedScript=readFileSync(new URL('../../packages/workbench/reviewed-visura.mjs',import.meta.url));
const fixtureScript=readFileSync(new URL('../../packages/workbench/fixtures.mjs',import.meta.url));
const dossierScript=readFileSync(new URL('../../packages/workbench/diagnostic-dossier.mjs',import.meta.url));
const geometryScript=readFileSync(new URL('../../packages/workbench/synthetic-geometry.mjs',import.meta.url));
const maxBytes=256*1024;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Frame-Options':'DENY'};
const send=(res,status,body,type='application/json; charset=utf-8')=>{
  res.writeHead(status,{...headers,'Content-Type':type});res.end(body);
};
const json=(res,status,data)=>send(res,status,JSON.stringify(data));
const reject=(res,status,code)=>json(res,status,{error:code});
export function createWorkbenchServer(){
  const server=createServer(async(req,res)=>{
    try{
      const authority='127.0.0.1:'+server.address().port;
      // Never expose this demo via a reverse proxy or a public interface.
      if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!==authority||
        (req.headers.origin!==undefined&&req.headers.origin!=='http://'+authority))
        return reject(res,403,'local_origin_required');
      if(req.method==='GET'){
        if(req.url==='/')return send(res,200,page,'text/html; charset=utf-8');
        if(req.url==='/client.js')return send(res,200,script,'text/javascript; charset=utf-8');
        if(req.url==='/guided-draft.mjs')return send(res,200,guideScript,'text/javascript; charset=utf-8');
        if(req.url==='/reviewed-visura.mjs')return send(res,200,reviewedScript,'text/javascript; charset=utf-8');
        if(req.url==='/diagnostic-dossier.mjs')return send(res,200,dossierScript,'text/javascript; charset=utf-8');
        if(req.url==='/synthetic-geometry.mjs')return send(res,200,geometryScript,'text/javascript; charset=utf-8');
        if(req.url==='/fixtures.mjs')return send(res,200,fixtureScript,'text/javascript; charset=utf-8');
        const scenario=scenarios.find(s=>req.url==='/api/fixture/'+s);
        if(scenario)return json(res,200,syntheticCase(scenario));
        return reject(res,404,'not_found');
      }
      if(req.method!=='POST'||!['/api/report','/api/visura-check','/api/visura-example','/api/handoff'].includes(req.url))return reject(res,404,'not_found');
      if(req.headers.origin!=='http://'+authority||req.headers['content-type']!=='application/json')
        return reject(res,403,'same_origin_json_required');
      if(req.headers['content-encoding']!==undefined)return reject(res,415,'encoding_not_supported');
      if(req.headers['content-length']!==undefined&&Number(req.headers['content-length'])>maxBytes)
        return reject(res,413,'payload_too_large');
      let size=0;const parts=[];
      // Do not buffer bytes beyond the bound; close an over-limit stream.
      for await(const chunk of req){
        size+=chunk.length;
        if(size>maxBytes){req.destroy();return;}
        parts.push(chunk);
      }
      let envelope;
      try{envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));}
      catch{return reject(res,400,'invalid_json');}
      if(req.url==='/api/visura-check')return json(res,200,compareSyntheticVisura(envelope));
      if(req.url==='/api/visura-example'){
        try{return json(res,200,syntheticVisuraExample(envelope.draft,envelope.claimId));}
        catch{return reject(res,400,'invalid_example');}
      }
      if(req.url==='/api/handoff'){
        if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'target')||!Object.hasOwn(envelope,'draft'))return reject(res,400,'invalid_handoff_request');
        return json(res,200,buildSyntheticHandoff(envelope.draft,envelope.target));
      }
      return json(res,200,buildPracticeReport(envelope));
    }catch{if(!res.headersSent&&!res.destroyed)reject(res,500,'processing_failed');else res.destroy();}
  });
  server.requestTimeout=10000;server.headersTimeout=5000;server.maxHeadersCount=32;
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createWorkbenchServer();
  server.listen(8765,'127.0.0.1',()=>console.log('Catasto Italia — demo sintetica: http://127.0.0.1:8765'));
}
