// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Local, offline diagnostic review. Never upload or persist the returned HTML automatically.
import {deflateSync} from 'node:zlib';
import {prepareExactRasterReview} from './ocr-exact-raster-review.mjs';
const blocked=code=>({state:'blocked',html:null,issues:[{code}]});
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const crcTable=Uint32Array.from({length:256},(_,n)=>{
  for(let i=0;i<8;i++)n=(n&1)?(0xedb88320^(n>>>1)):(n>>>1);
  return n>>>0;
});
function chunk(type,data){
  const name=Buffer.from(type,'ascii'), out=Buffer.alloc(data.length+12);
  out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);
  let crc=0xffffffff;
  for(const byte of out.subarray(4,-4))crc=crcTable[(crc^byte)&255]^(crc>>>8);
  out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);
  return out;
}
// Lossless 8-bit grayscale PNG; no resampling, metadata, or external dependency.
function png(raster,w,h){
  const pixels=raster.subarray(raster.length-w*h), scan=Buffer.alloc((w+1)*h);
  for(let y=0;y<h;y++)pixels.copy(scan,y*(w+1)+1,y*w,(y+1)*w);
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w,0);hdr.writeUInt32BE(h,4);hdr[8]=8;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),
    chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
function validText(w){
  return typeof w.text==='string'&&w.text.length>0&&w.text.length<=512&&w.text.trim()===w.text&&
    !/[\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u.test(w.text)&&
    typeof w.engineScore==='string'&&/^(0|[1-9]\d{0,2})(?:\.\d{1,9})?$/.test(w.engineScore)&&Number(w.engineScore)<=100;
}
// The input is a local pipeline result, not an untrusted network payload.
// Revalidate exact raster and snapshot metadata before rendering. HTML is
// sensitive even though no persistence or network operation is performed here.
export function renderLocalOcrReview(result,bytes){
  try{
    const {version,state,operative,authenticated,requiresHumanReview,words,evidence}=result;
    // Reject oversized word lists/text before cloning or recomputing digests.
    if(!Array.isArray(words)||words.length===0||words.length>2048||!words.every(w=>w&&validText(w)))
      return blocked('review_invalid_display_word');
    const snapshot=structuredClone({version,state,operative,authenticated,requiresHumanReview,words,evidence});
    const checked=prepareExactRasterReview(snapshot,bytes);
    if(checked.state!=='raster_review_candidate')return blocked(checked.issues[0].code);
    if(!snapshot.words.every(validText))return blocked('review_invalid_display_word');
    const {widthPx:w,heightPx:h}=checked.overlay;
    const data=png(checked.raster,w,h).toString('base64');
    const areas=[],rows=[];
    for(const [i,word] of snapshot.words.entries()){
      const [x,y,r,b]=word.boxPx, n=i+1, label=esc(word.text), score=esc(word.engineScore);
      areas.push('<a href="#word-'+n+'" tabindex="0" aria-label="Parola '+n+': '+label+'"><rect id="area-'+n+'" x="'+x+'" y="'+y+'" width="'+(r-x)+'" height="'+(b-y)+'"><title>'+label+'</title></rect></a>');
      rows.push('<li id="word-'+n+'"><a href="#area-'+n+'">Area '+n+'</a> <bdi>'+label+'</bdi> <small>Score OCR: '+score+' / 100 — da verificare</small></li>');
    }
    const html='<!doctype html><html lang="it"><head><meta charset="utf-8">'+
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'+
      '<meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>Catasto Italia — revisione OCR locale</title><style>'+
      'body{font:1rem system-ui,sans-serif;margin:1rem;color:#17212b;background:#fff}main{max-width:72rem;margin:auto}svg{width:100%;height:auto;display:block;border:1px solid #777}rect{fill:#1754b1;fill-opacity:.15;stroke:#1754b1;stroke-width:1.5;vector-effect:non-scaling-stroke}rect:target,a:focus rect,a:hover rect{fill:#ed9700;fill-opacity:.38;stroke:#9b5000;stroke-width:3}li{padding:.45rem;overflow-wrap:anywhere}li:target{outline:2px solid #9b5000;background:#fff3d4}a{color:#16468d}a:focus-visible{outline:3px solid #9b5000}small{display:block}code{overflow-wrap:anywhere}'+
      '</style></head><body><main><h1>Revisione OCR locale</h1>'+
      '<p>Solo candidati diagnostici: nessun dato approvato. Autenticità, layout e coordinate PDF non verificati. Lo score non è una probabilità di correttezza.</p>'+
      '<p>Seleziona una parola nell’immagine o nell’elenco per trovare la posizione corrispondente. Nessuna modifica o approvazione viene salvata.</p>'+
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-label="Raster OCR con aree selezionabili">'+
      '<image href="data:image/png;base64,'+data+'" x="0" y="0" width="'+w+'" height="'+h+'"/>'+areas.join('')+'</svg>'+
      '<h2>Parole da verificare</h2><ol>'+rows.join('')+'</ol>'+
      '<p>Impronta catena: <code>'+checked.chainSha256+'</code></p><p>Impronta raster: <code>'+checked.rasterSha256+'</code></p>'+
      '<p>Documento locale contenente dati potenzialmente riservati: non condividere né pubblicare.</p></main></body></html>';
    return {state:'local_review_candidate',html,authenticated:false,requiresHumanReview:true,issues:[]};
  }catch{return blocked('review_render_failed');}
}
