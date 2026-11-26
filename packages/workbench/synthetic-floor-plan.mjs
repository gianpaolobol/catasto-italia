// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Declared translation in one synthetic common frame per floor.
// No inferred position, scale certification, adjacency or official elaborato.
import {syntheticPlanPreview} from './synthetic-geometry.mjs';
const offset=n=>Number.isSafeInteger(n)&&Math.abs(n)<=10000000;
export function validPlacement(p){
  return p!==null&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===3&&
    ['floor','xMm','yMm'].every(k=>Object.hasOwn(p,k))&&typeof p.floor==='string'&&
    /^(?:P(?:0|[1-9][0-9]?)|S[1-9][0-9]?)$/.test(p.floor)&&offset(p.xMm)&&offset(p.yMm);
}
const bounds=points=>({minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),
  minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))});
const colors=['#c7e5d7','#f4d6a0','#c9d9f3','#e6cce8','#d5e5b6','#f2c7c7'];
export function syntheticFloorPlans(report,annexes){
  if(!Array.isArray(annexes)||annexes.length>64)return null;
  const byFloor=new Map(),seen=new Set();
  for(const a of annexes){
    if(!a||seen.has(a.unitId)||!syntheticPlanPreview(report,a))return null;
    seen.add(a.unitId);
    if(!Object.hasOwn(a,'placement')){if(a.operation==='unchanged')return null;continue;}
    const p=a.placement;
    if(!validPlacement(p))return null;
    const rings=(a.componentCount?a.vertices:[a.vertices]).map(r=>r.map(([x,y])=>[x+p.xMm,y+p.yMm]));
    const group=byFloor.get(p.floor)??[];
    group.push({unitId:a.unitId,placement:{...p},operation:a.operation,rings,bounds:rings.map(bounds)});
    byFloor.set(p.floor,group);
  }
  const floors=[];
  for(const [floor,group] of [...byFloor].sort(([a],[b])=>a.localeCompare(b,'en'))){
    const all=group.flatMap(u=>u.rings.flat()),b=bounds(all),w=b.maxX-b.minX,h=b.maxY-b.minY;
    const pad=Math.max(1,Math.ceil(Math.max(w,h)/20));
    const potentialOverlaps=[];
    // Conservative bounding-box warning only: touching edges are allowed,
    // positive bbox intersection is not proof of polygon overlap.
    const overlaps=(a,b)=>Math.min(a.maxX,b.maxX)>Math.max(a.minX,b.minX)&&Math.min(a.maxY,b.maxY)>Math.max(a.minY,b.minY);
    for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++)
      if(group[i].bounds.some(a=>group[j].bounds.some(b=>overlaps(a,b))))
        potentialOverlaps.push([group[i].unitId,group[j].unitId]);
    floors.push({floor,widthMm:w,heightMm:h,viewBox:[-pad,-pad,w+2*pad,h+2*pad].join(' '),potentialOverlaps,
      units:group.map((u,i)=>({unitId:u.unitId,placement:u.placement,operation:u.operation,color:u.operation==='unchanged'?'#cbd5e1':colors[i%colors.length],
        polygons:u.rings.map(r=>r.map(([x,y])=>[x-b.minX,b.maxY-y].join(',')).join(' ')),
        labelPoint:[u.rings[0][0][0]-b.minX,b.maxY-u.rings[0][0][1]]}))});
  }
  const missing=report?.state==='research_candidate'?report.operations.filter(o=>['C','V','unchanged'].includes(o.operation)&&!seen.has(o.unitId)).map(o=>({unitId:o.unitId,operation:o.operation})):[];
  return {floors,unplaced:annexes.filter(a=>!Object.hasOwn(a,'placement')).map(a=>a.unitId),missing};
}
