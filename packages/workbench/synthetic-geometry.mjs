// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Pure Euclidean diagnostic; not cadastral area, no classification or official coefficients.
export function measureSyntheticPolygon(report, unitId, vertices) {
  const out={version:'0.1.0',kind:'synthetic-geometry-annex',warning:'SIMULAZIONE SINTETICA — NON UFFICIALE. Misura geometrica non catastale; nessun coefficiente, superficie catastale o conformità attestata.',state:'blocked',caseDigest:null,unitId:null,operation:null,coordinateUnit:'mm',areaMm2:null,areaM2:null,perimeterMm:null,vertices:null,blocker:null};
  const stop=code=>({...out,blocker:code});
  if(!report||report.kind!=='synthetic-diagnostic-report'||report.state!=='research_candidate'||report.operative!==false||report.canExport!==false||typeof report.caseDigest!=='string'||!/^[a-f0-9]{64}$/.test(report.caseDigest)||!Array.isArray(report.operations)||typeof unitId!=='string')return stop('current_research_report_required');
  const matching=report.operations.filter(o=>o&&o.unitId===unitId);
  if(matching.length!==1||!['C','V'].includes(matching[0].operation))return stop('result_unit_required');
  if(!Array.isArray(vertices)||vertices.length<4||vertices.length>128||!vertices.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000)))return stop('invalid_vertices');
  const n=vertices.length,keys=new Set(vertices.map(p=>p.join(',')));
  if(keys.size!==n)return stop('repeated_vertex');
  const edges=vertices.map((a,i)=>({a,b:vertices[(i+1)%n]}));
  for(const {a,b} of edges)if((a[0]===b[0])===(a[1]===b[1]))return stop('non_orthogonal_edge');
  const vertical=e=>e.a[0]===e.b[0];
  for(let i=0;i<n;i++)if(vertical(edges[i])===vertical(edges[(i+1)%n]))return stop('redundant_or_reversing_vertex');
  const overlap=(a,b,c,d)=>Math.max(Math.min(a,b),Math.min(c,d))<=Math.min(Math.max(a,b),Math.max(c,d));
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    if(j===i+1||(i===0&&j===n-1))continue;
    const e=edges[i],f=edges[j];
    if(overlap(e.a[0],e.b[0],f.a[0],f.b[0])&&overlap(e.a[1],e.b[1],f.a[1],f.b[1]))return stop('non_simple_polygon');
  }
  let twice=0n,perimeter=0n;
  for(const {a,b} of edges){
    twice+=BigInt(a[0])*BigInt(b[1])-BigInt(b[0])*BigInt(a[1]);
    perimeter+=BigInt(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]));
  }
  if(twice<0n)twice=-twice;
  if(twice===0n||twice%2n!==0n)return stop('invalid_area');
  const area=twice/2n;
  return {...out,state:'measured',caseDigest:report.caseDigest,unitId,operation:matching[0].operation,areaMm2:area.toString(),areaM2:(area/1000000n).toString()+'.'+(area%1000000n).toString().padStart(6,'0'),perimeterMm:perimeter.toString(),vertices:vertices.map(p=>[...p])};
}
