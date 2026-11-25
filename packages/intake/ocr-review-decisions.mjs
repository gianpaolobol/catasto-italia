// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Local diagnostic decisions, not approval, signature or authenticated audit.
import {createHash} from 'node:crypto';
import {prepareExactRasterReview} from './ocr-exact-raster-review.mjs';
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const blocked=code=>({state:'blocked',manifest:null,issues:[{code}]});
const validText=s=>typeof s==='string'&&s.length>0&&s.length<=512&&s.trim()===s&&
  !/[\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u.test(s);
const validScore=s=>typeof s==='string'&&/^(0|[1-9]\d{0,2})(?:\.\d{1,9})?$/.test(s)&&Number(s)<=100;

// Inputs must be local JSON-like data, not executable objects or network payloads.
// One explicit decision per OCR word. No inference of cadastral fields.
export function buildOcrReviewDecisions(result,bytes,request){
  try{
    if(request?.version!=='0.1.0'||!Array.isArray(request.decisions)||
      !Array.isArray(result?.words)||result.words.length===0||result.words.length>2048||
      request.decisions.length!==result.words.length)
      return blocked('decision_invalid_request');
    if(!result.words.every(w=>w&&validText(w.text)&&validScore(w.engineScore)))
      return blocked('decision_invalid_source_word');
    const source=structuredClone(result);
    const checked=prepareExactRasterReview(source,bytes);
    if(checked.state!=='raster_review_candidate')return blocked(checked.issues[0].code);
    if(request.chainSha256!==checked.chainSha256||request.rasterSha256!==checked.rasterSha256)
      return blocked('decision_source_mismatch');
    const byId=new Map();
    for(const d of request.decisions){
      if(!d||typeof d.id!=='string'||byId.has(d.id))return blocked('decision_invalid_id');
      const keys=Object.keys(d).sort().join(',');
      if(d.action==='retain'&&keys==='action,id')byId.set(d.id,{action:d.action});
      else if(d.action==='correct'&&keys==='action,id,reason,text'&&validText(d.text)&&validText(d.reason))
        byId.set(d.id,{action:d.action,text:d.text,reason:d.reason});
      else if(d.action==='exclude'&&keys==='action,id,reason'&&validText(d.reason))
        byId.set(d.id,{action:d.action,reason:d.reason});
      else return blocked('decision_invalid_action');
    }
    const decisions=[];
    for(const w of source.words){
      const d=byId.get(w.id);
      if(!d)return blocked('decision_missing_word');
      if(d.action==='correct'&&d.text===w.text)return blocked('decision_no_change');
      decisions.push({id:w.id,boxPx:[...w.boxPx],originalText:w.text,engineScore:w.engineScore,
        action:d.action,proposedText:d.action==='retain'?w.text:d.action==='correct'?d.text:null,
        reason:d.reason??null});
    }
    const manifest={version:'0.1.0',kind:'ocr_review_proposal',operative:false,authenticated:false,
      requiresHumanReview:true,chainSha256:checked.chainSha256,rasterSha256:checked.rasterSha256,decisions};
    return {state:'review_proposal',manifest:{...manifest,manifestSha256:digest(manifest)},issues:[]};
  }catch{return blocked('decision_invalid_input');}
}
