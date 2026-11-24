// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isolateVisuraCells} from '../packages/intake/visura-coordinate-cells.mjs';
const fixture=()=>({kind:"reviewer_selected_current_building_cells",regions:[
{id:"sheet",role:"value",page:1,box:[10,10,30,20],field:"sheet",section:"identifier",line:1},
{id:"parcel",role:"value",page:1,box:[40,10,60,20],field:"parcel",section:"identifier",line:1},
{id:"act",role:"update",page:1,box:[70,10,100,20]},
{id:"land",role:"land_reference",page:1,box:[10,30,60,40]},
{id:"rent",role:"value",page:2,box:[10,10,60,20],field:"rent",section:"classification",line:1}],
spans:[{id:"s1",page:1,box:[11,11,29,19],text:"009"},{id:"s2",page:1,box:[41,11,59,19],text:"123"},{id:"s3",page:1,box:[71,11,99,19],text:"SYNTHETIC ACT"},{id:"s4",page:1,box:[11,31,59,39],text:"SYNTHETIC LAND"},{id:"s5",page:2,box:[11,11,59,19],text:"Euro 10,20"}]});
const cases=[
["complete",x=>x,r=>r.state==="candidate_cells"&&r.rows.length===3&&r.rows[0].text==="009"&&r.excludedCount===2&&r.locators[0].box[0]===11],
["no excluded text",x=>x,r=>!JSON.stringify(r).includes("SYNTHETIC")],
["no operative claims",x=>x,r=>!r.operative&&!r.canExport&&!r.authenticated&&!r.identifierGroupingVerified],
["page separation",x=>x,r=>r.rows[2].page===2&&r.rows[2].text==="Euro 10,20"],
["shuffled spans",x=>{x.spans.reverse();return x},r=>r.rows[0].text==="009"&&r.state==="candidate_cells"],
["region overlap",x=>{x.regions[1].box=[20,10,60,20];return x},r=>r.state==="blocked"&&r.issues[0].code==="overlapping_regions"],
["touching regions allowed",x=>{x.regions[1].box=[30,10,60,20];return x},r=>r.state==="candidate_cells"],
["crosses value and update",x=>{x.spans[1].box=[50,11,80,19];return x},r=>r.state==="needs_review"&&r.rows.length===0&&r.issues.some(i=>i.code==="boundary_crossing")],
["partially clipped",x=>{x.spans[0].box=[5,11,29,19];return x},r=>r.issues.some(i=>i.code==="boundary_crossing")&&r.rows.length===0],
["unassigned",x=>{x.spans.push({id:"extra",page:1,box:[200,100,220,120],text:"SYNTHETIC EXTRA"});return x},r=>r.state==="needs_review"&&r.issues.some(i=>i.code==="unassigned_span")&&!JSON.stringify(r).includes("EXTRA")],
["empty",x=>{x.spans.shift();return x},r=>r.issues.some(i=>i.code==="empty_cell")&&r.rows.length===0],
["fragmented",x=>{x.spans[0].box=[11,11,18,19];x.spans.push({id:"s6",page:1,box:[19,11,29,19],text:"9"});return x},r=>r.issues.some(i=>i.code==="fragmented_cell")&&r.rows.length===0],
["duplicate span id",x=>{x.spans[1].id="s1";return x},r=>r.state==="blocked"],
["duplicate geometry",x=>{x.spans.push({...x.spans[0],id:"s6"});return x},r=>r.issues.some(i=>i.code==="duplicate_span_geometry")],
["duplicate region id",x=>{x.regions[1].id="sheet";return x},r=>r.state==="blocked"],
["duplicate field locator",x=>{x.regions[1].field="sheet";return x},r=>r.issues.some(i=>i.code==="duplicate_field_locator")],
["wrong section",x=>{x.regions[0].section="surface";return x},r=>r.state==="blocked"],
["unknown field",x=>{x.regions[0].field="owner";return x},r=>r.state==="blocked"],
["unknown exclusion",x=>{x.regions[2].role="valueish";return x},r=>r.state==="blocked"],
["invalid coordinate",x=>{x.spans[0].box[0]=NaN;return x},r=>r.state==="blocked"],
["inverted coordinate",x=>{x.regions[0].box=[30,10,10,20];return x},r=>r.state==="blocked"],
["fractional coordinate",x=>{x.spans[0].box[0]=11.5;return x},r=>r.state==="blocked"],
["invalid page",x=>{x.spans[0].page=0;return x},r=>r.state==="blocked"],
["too long value",x=>{x.spans[0].text="9".repeat(65);return x},r=>r.issues.some(i=>i.code==="unsupported_value_span")&&r.rows.length===0],
["whitespace value",x=>{x.spans[0].text=" 009";return x},r=>r.issues.some(i=>i.code==="unsupported_value_span")],
["control chars",x=>{x.spans[0].text="009\n";return x},r=>r.state==="blocked"],
["unknown envelope",x=>{x.kind="historical";return x},r=>r.state==="blocked"],
["extra metadata",x=>{x.spans[0].owner="synthetic";return x},r=>r.state==="blocked"],
["sparse spans",x=>{delete x.spans[0];return x},r=>r.state==="blocked"],
["bounded spans",x=>{x.spans=Array(2049).fill(x.spans[0]);return x},r=>r.state==="blocked"],
["no value regions",x=>{x.regions=x.regions.filter(r=>r.role!=="value");return x},r=>r.state==="blocked"],
["same line distinct fields",x=>x,r=>r.rows[0].line===r.rows[1].line&&r.rows[0].field!==r.rows[1].field]
];
for(const [name,mut,check] of cases)test(name,()=>{const x=mut(fixture()),before=JSON.stringify(x),r=isolateVisuraCells(x);assert.ok(check(r),JSON.stringify(r));assert.equal(JSON.stringify(x),before);});
