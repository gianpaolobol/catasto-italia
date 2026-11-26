// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Restricted ASCII DXF contour intake, not a general CAD or DOCFA parser.
const fail=error=>({ok:false,error,vertices:null});
export function readSyntheticDxf(text,unit){
  try{
    if(typeof text!=='string'||text.length>65536||/[^\x09\x0a\x0d\x20-\x7e]/.test(text)||!['mm','m'].includes(unit))return fail('invalid_input');
    const lines=text.replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n');
    if(lines.length%2||lines.length>8192)return fail('invalid_pairs');
    const pairs=[];
    for(let i=0;i<lines.length;i+=2){
      const code=lines[i].trim(),value=lines[i+1].trim();
      if(!/^\d{1,4}$/.test(code)||!value)return fail('invalid_pair');
      pairs.push([Number(code),value]);
    }
    const is=(i,c,v)=>pairs[i]?.[0]===c&&pairs[i]?.[1]===v;
    if(!is(0,0,'SECTION')||!is(1,2,'ENTITIES')||!is(pairs.length-2,0,'ENDSEC')||!is(pairs.length-1,0,'EOF'))return fail('isolated_entities_required');
    const decimal=s=>{
      if(!/^[+-]?\d{1,10}(?:\.\d{1,6})?$/.test(s))throw Error('invalid_number');
      const sign=s.startsWith('-')?-1n:1n,[a,b='']=s.replace(/^[+-]/,'').split('.');
      return sign*(BigInt(a)*1000000n+BigInt(b.padEnd(6,'0')));
    };
    const mm=s=>{
      const v=decimal(s)*(unit==='m'?1000n:1n);
      if(v%1000000n!==0n||v>10000000000000n||v< -10000000000000n)throw Error('non_integral_or_out_of_range');
      return Number(v/1000000n);
    };
    let pos=2,total=0;const rings=[];
    while(pos<pairs.length-2){
      if(!is(pos++,0,'LWPOLYLINE')||rings.length>=16)return fail('unsupported_entity');
      const single=new Map(),points=[];let x=null;
      while(pos<pairs.length-2&&pairs[pos][0]!==0){
        const [c,v]=pairs[pos++];
        if(c===10){if(x!==null)return fail('unpaired_vertex');x=mm(v);continue;}
        if(c===20){if(x===null)return fail('unpaired_vertex');points.push([x,mm(v)]);x=null;if(++total>128)return fail('too_many_vertices');continue;}
        if([40,41,42].includes(c)){if(decimal(v)!==0n)return fail('curves_or_width_unsupported');continue;}
        if(c===100){if(!['AcDbEntity','AcDbPolyline'].includes(v))return fail('unsupported_subclass');continue;}
        if(![5,8,90,70,43,38,39,210,220,230,67,410].includes(c)||single.has(c))return fail('unsupported_or_duplicate_code');
        single.set(c,v);
      }
      if(x!==null||points.length<4||!/^\d{1,3}$/.test(single.get(90)??'')||Number(single.get(90))!==points.length||!['1','129'].includes(single.get(70)))return fail('invalid_closed_polyline');
      if(!/^[A-Za-z0-9_-]{1,64}$/.test(single.get(8)??''))return fail('invalid_layer');
      if(single.has(5)&&!/^[0-9A-Fa-f]{1,16}$/.test(single.get(5)))return fail('invalid_handle');
      for(const c of [43,38,39,210,220,67])if(single.has(c)&&decimal(single.get(c))!==0n)return fail('non_planar_or_paperspace');
      if(single.has(230)&&decimal(single.get(230))!==1000000n)return fail('non_planar_or_paperspace');
      if(single.has(410)&&single.get(410)!=='Model')return fail('non_planar_or_paperspace');
      rings.push(points);
    }
    if(!rings.length)return fail('empty_geometry');
    const minX=Math.min(...rings.flat().map(p=>p[0])),minY=Math.min(...rings.flat().map(p=>p[1]));
    const shifted=rings.map(r=>r.map(([x,y])=>[x-minX,y-minY]));
    if(shifted.flat().some(p=>p.some(v=>v>10000000)))return fail('extent_out_of_range');
    return {ok:true,error:null,vertices:shifted.length===1?shifted[0]:shifted,contourCount:shifted.length,originMm:[minX,minY]};
  }catch{return fail('invalid_numeric_value');}
}
export const syntheticDxfExample=()=>[0,'SECTION',2,'ENTITIES',0,'LWPOLYLINE',8,'SYNTH',90,4,70,1,10,0,20,0,10,4000,20,0,10,4000,20,2000,10,0,20,2000,0,'ENDSEC',0,'EOF'].join('\n')+'\n';
