// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syntheticCase} from '../packages/workbench/fixtures.mjs';
import {buildPracticeReport} from '../packages/workbench/index.mjs';
import {lookupSyntheticTariff} from '../packages/workbench/synthetic-tariff-catalog.mjs';
import {syntheticIncomeWorksheet} from '../packages/workbench/synthetic-income.mjs';
import {buildIntegratedDossier,replayPracticeSession} from '../packages/workbench/integrated-dossier.mjs';
const query=()=>({draft:syntheticCase('division'),unitId:'d1',zone:'SYNTH-1',category:'A/2',classNumber:'2'});
test('exact catalog lookup, never fallback',()=>{
 const q=query(),r=lookupSyntheticTariff(q);
 assert.equal(r.ok,true);assert.equal(r.row.tariff,'123.4567');assert.equal(r.officialTariffVerified,false);
 assert.equal(lookupSyntheticTariff({...q,zone:'SYNTH-2'}).row.tariff,'100.0000');
 assert.equal(lookupSyntheticTariff({...q,classNumber:'3'}).row.tariff,'140.0000');
 for(const patch of [{zone:'SYNTH-3'},{classNumber:'1'},{category:'A/3'},{unitId:'other'},{unitId:'u1'},{zone:'BO'},{classNumber:'02'},{approved:true}])assert.equal(lookupSyntheticTariff({...q,...patch}).ok,false);
 q.draft.assertions.pop();assert.equal(lookupSyntheticTariff(q).ok,false);
});
test('catalog provenance is recomputed in worksheet, dossier and restored session',()=>{
 const q=query(),r=buildPracticeReport(q.draft);
 const declared={category:q.category,classNumber:q.classNumber,zone:q.zone,consistency:'4.5',tariff:'123.4567',unit:'vani',sourceId:'synthetic-catalog-v1'};
 const item={unitId:q.unitId,declared};
 const w=syntheticIncomeWorksheet({draft:q.draft,...item});
 assert.equal(w.worksheet.exactProductEur,'555.5551500');assert.equal(w.worksheet.officialTariffVerified,false);
 const request={draft:q.draft,expectedState:r.state,expectedDigest:r.caseDigest,geometry:[],income:[item]};
 const session={version:'0.1.0',kind:'synthetic-practice-session',request};
 assert.match(buildIntegratedDossier(request).html,/Catalogo di prova v1/);
 assert.equal(replayPracticeSession(session).income[0].declared.sourceId,'synthetic-catalog-v1');
 declared.tariff='100';assert.equal(syntheticIncomeWorksheet({draft:q.draft,...item}).blocker,'catalog_tariff_mismatch');
 assert.equal(replayPracticeSession(session).ok,false);
});
