// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase,scenarios} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {renderDiagnosticDossier} from '../packages/workbench/diagnostic-dossier.mjs';
for(const scenario of scenarios)test('printable diagnostic dossier '+scenario,()=>{
  const r=buildPracticeReport(syntheticCase(scenario)),before=JSON.stringify(r);
  assert.equal(r.state,'research_candidate');const h=renderDiagnosticDossier(r);
  assert.match(h,/SIMULAZIONE SINTETICA — NON UFFICIALE/);
  assert.match(h,/Non importabile in DOCFA/);assert.ok(h.includes('SYNTH/—/0999/0900'));
  assert.ok(h.includes(r.caseDigest));assert.ok(h.includes('Evidenze dichiarate'));
  assert.match(h,/default-src 'none'/);assert.ok(!h.includes('<script'));assert.equal(JSON.stringify(r),before);
});
test('blocked dossier never suggests operations',()=>{
  const c=syntheticCase('fusion');c.input.facts.titleReviewed.value='unknown';
  const r=buildPracticeReport(c);assert.equal(r.state,'blocked');
  const h=renderDiagnosticDossier(r);assert.match(h,/Bloccato/);assert.match(h,/Nessuna operazione/);
  assert.match(h,/unresolved_fact:titleReviewed/);
  assert.throws(()=>renderDiagnosticDossier({...r,operations:[{}]}));
});
test('escaping and fail closed for unsupported reports',()=>{
  const r=buildPracticeReport(syntheticCase('fusion'));
  const h=renderDiagnosticDossier({...r,relation:'<img src=x onerror=alert(1)>',source:{title:'<script>bad</script>',url:'javascript:bad'}});
  assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('<img'));assert.ok(!h.includes('<script'));assert.ok(!h.includes('href='));
  assert.throws(()=>renderDiagnosticDossier({...r,canExport:true}));
  assert.throws(()=>renderDiagnosticDossier({...r,operative:true}));
  assert.throws(()=>renderDiagnosticDossier({...r,availability:'verified'}));
  assert.throws(()=>renderDiagnosticDossier({...r,version:'9'}));
});
