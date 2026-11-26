// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// Pure Euclidean diagnostic; not cadastral area, no classification or official coefficients.
function measureSingleContour(report, unitId, vertices, calibration = null, allowRetained = false) {
  const out={version:'0.1.0',kind:'synthetic-geometry-annex',warning:'SIMULAZIONE SINTETICA — NON UFFICIALE. Misura geometrica non catastale; nessun coefficiente, superficie catastale o conformità attestata.',state:'blocked',caseDigest:null,unitId:null,operation:null,coordinateUnit:'mm',areaMm2:null,areaM2:null,perimeterMm:null,vertices:null,blocker:null};
  const stop=code=>({...out,blocker:code});
  if(!report||report.kind!=='synthetic-diagnostic-report'||report.state!=='research_candidate'||report.operative!==false||report.canExport!==false||typeof report.caseDigest!=='string'||!/^[a-f0-9]{64}$/.test(report.caseDigest)||!Array.isArray(report.operations)||typeof unitId!=='string')return stop('current_research_report_required');
  const matching=report.operations.filter(o=>o&&o.unitId===unitId);
  if(matching.length!==1||!(['C','V'].includes(matching[0].operation)||(allowRetained===true&&matching[0].operation==='unchanged')))return stop('result_unit_required');
  if(!Array.isArray(vertices)||vertices.length<4||vertices.length>128||!Array.from(vertices).every(p=>Array.isArray(p)&&p.length===2&&Array.from(p).every(n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000)))return stop('invalid_vertices');
  // [Codex] Preserve only replayable declared conversions; never attest actual drawing scale.
  let provenance=null;
  if(calibration!==null){
    const converted=convertSyntheticPlanScale(calibration);
    if(!converted.ok)return stop('invalid_calibration');
    if(converted.vertices.length!==vertices.length||converted.vertices.some((p,i)=>p[0]!==vertices[i][0]||p[1]!==vertices[i][1]))return stop('calibration_vertices_mismatch');
    provenance={vertices:calibration.vertices.map(p=>[...p]),drawingLength:calibration.drawingLength,actualLengthMm:calibration.actualLengthMm};
  }
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
  return {...out,state:'measured',caseDigest:report.caseDigest,unitId,operation:matching[0].operation,areaMm2:area.toString(),areaM2:(area/1000000n).toString()+'.'+(area%1000000n).toString().padStart(6,'0'),perimeterMm:perimeter.toString(),vertices:vertices.map(p=>[...p]),...(provenance?{calibration:provenance}:{})};
}


// [Codex] Multiple disjoint orthogonal contours on ONE common plane, in mm.
// No holes, touching edges, nesting, overlaps, floor aggregation or cadastral weights.
// Keep the single-contour wire format; a nested vertices array is explicit multi-contour input.
export function measureSyntheticPolygon(report,unitId,vertices,calibration=null,allowRetained=false){
  if(!Array.isArray(vertices)||!Array.isArray(vertices[0]?.[0]))
    return measureSingleContour(report,unitId,vertices,calibration,allowRetained);
  const blocked=blocker=>({...measureSingleContour(report,unitId,[],null,allowRetained),blocker});
  if(calibration!==null)return blocked('multi_contour_calibration_unsupported');
  if(vertices.length<2||vertices.length>16||!Array.from(vertices).every(r=>Array.isArray(r))||
     vertices.reduce((n,r)=>n+r.length,0)>128)return blocked('invalid_contour_collection');
  const measured=vertices.map(r=>measureSingleContour(report,unitId,r,null,allowRetained));
  const bad=measured.find(m=>m.state!=='measured');
  if(bad)return bad;
  const rings=measured.map(m=>m.vertices);
  const edges=r=>r.map((a,i)=>[a,r[(i+1)%r.length]]);
  const overlap=(a,b,c,d)=>Math.max(Math.min(a,b),Math.min(c,d))<=Math.min(Math.max(a,b),Math.max(c,d));
  // Boundary intersection includes endpoint and edge contact. With no boundary
  // intersection, a single interior test in both directions detects containment.
  const meets=(r,s)=>edges(r).some(([a,b])=>edges(s).some(([c,d])=>
    overlap(a[0],b[0],c[0],d[0])&&overlap(a[1],b[1],c[1],d[1])));
  const inside=([x,y],r)=>edges(r).reduce((hit,[a,b])=>
    a[0]===b[0]&&a[0]>x&&((a[1]>y)!==(b[1]>y))?!hit:hit,false);
  for(let i=0;i<rings.length;i++)for(let j=i+1;j<rings.length;j++){
    if(meets(rings[i],rings[j])||inside(rings[i][0],rings[j])||inside(rings[j][0],rings[i]))
      return blocked('contours_not_disjoint');
  }
  const area=measured.reduce((n,m)=>n+BigInt(m.areaMm2),0n);
  const perimeter=measured.reduce((n,m)=>n+BigInt(m.perimeterMm),0n);
  return {...measured[0],vertices:rings,componentCount:rings.length,
    areaMm2:area.toString(),areaM2:(area/1000000n).toString()+'.'+(area%1000000n).toString().padStart(6,'0'),
    perimeterMm:perimeter.toString()};
}

// [Codex] Declared uniform conversion of synthetic drawing coordinates.
// No image calibration, affine transform, CAD parser or official scale verification.
export function convertSyntheticPlanScale(input){
  const blocked=blocker=>({ok:false,blocker,vertices:null});
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).length!==3||!['vertices','drawingLength','actualLengthMm'].every(k=>Object.hasOwn(input,k)))return blocked('invalid_scale_input');
  const {vertices,drawingLength,actualLengthMm}=input;
  const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=10000000;
  if(!positive(drawingLength)||!positive(actualLengthMm))return blocked('invalid_reference_length');
  if(!Array.isArray(vertices)||vertices.length<4||vertices.length>128||
    !Array.from(vertices).every(p=>Array.isArray(p)&&p.length===2&&Array.from(p).every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=10000000)))return blocked('invalid_drawing_vertices');
  // Translate the drawing origin before converting. The reference lengths
  // are declared independently; do not assume any actual CAD/raster units.
  const minX=Math.min(...vertices.map(p=>p[0])),minY=Math.min(...vertices.map(p=>p[1]));
  const denominator=BigInt(drawingLength),numerator=BigInt(actualLengthMm);
  const converted=[];
  for(const [x,y] of vertices){
    const scaled=[BigInt(x-minX)*numerator,BigInt(y-minY)*numerator];
    if(scaled.some(n=>n%denominator!==0n))return blocked('non_integral_millimetres');
    const point=scaled.map(n=>n/denominator);
    if(point.some(n=>n>10000000n))return blocked('converted_coordinate_out_of_range');
    converted.push(point.map(Number));
  }
  return {ok:true,blocker:null,vertices:converted};
}

// [Codex] A proportional diagnostic drawing, not a plan at a certified print scale.
// Recompute from the current report so stale or forged measurement fields cannot
// determine the displayed area or the drawing. All SVG attributes are numeric.
export function syntheticPlanPreview(report,annex){
  if(!annex||annex.caseDigest!==report?.caseDigest||annex.state!=='measured')return null;
  const m=measureSyntheticPolygon(report,annex.unitId,annex.vertices,annex.calibration??null,annex.operation==='unchanged'&&!!annex.placement);
  if(m.state!=='measured'||m.areaMm2!==annex.areaMm2||m.areaM2!==annex.areaM2||
     m.perimeterMm!==annex.perimeterMm||m.operation!==annex.operation)return null;
  if(m.componentCount!==annex.componentCount)return null;
  const rings=m.componentCount?m.vertices:[m.vertices],all=rings.flat();
  const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
  const widthMm=maxX-minX,heightMm=maxY-minY,pad=Math.max(1,Math.ceil(Math.max(widthMm,heightMm)/20));
  return {widthMm,heightMm,viewBox:[-pad,-pad,widthMm+2*pad,heightMm+2*pad].join(' '),
    ...(m.componentCount?{polygons:rings.map(r=>r.map(([x,y])=>[x-minX,maxY-y].join(',')).join(' '))}:
      {points:m.vertices.map(([x,y])=>[x-minX,maxY-y].join(',')).join(' ')})};
}
