// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launchLocal} from '../apps/workbench/launch-local.mjs';
test('local launcher binds two distinct ephemeral IPv4 loopback ports',async t=>{
  const a=await launchLocal({openBrowser:false});
  t.after(()=>new Promise(resolve=>{a.server.close(resolve);a.server.closeAllConnections();}));
  const b=await launchLocal({openBrowser:false});
  t.after(()=>new Promise(resolve=>{b.server.close(resolve);b.server.closeAllConnections();}));
  assert.notEqual(a.url,b.url);
  for(const x of [a,b]){
    assert.equal(x.server.address().address,'127.0.0.1');
    assert.match(x.url,/^http:\/\/127\.0\.0\.1:\d+\/$/);
    const page=await fetch(x.url);
    assert.equal(page.status,200);
    assert.match(await page.text(),/Solo dati sintetici/);
    const fixture=await (await fetch(x.url+'api/fixture/enlargement')).json();
    const response=await fetch(x.url+'api/report',{method:'POST',headers:{Origin:new URL(x.url).origin,'Content-Type':'application/json'},body:JSON.stringify(fixture)});
    assert.equal(response.status,200);
    assert.deepEqual((await response.json()).candidate.counts,{S:1,C:1,V:0});
  }
});
