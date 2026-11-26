// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Offline diagnostic recipient CLI. Input from stdin only, output to stdout.
import {inspectGeometryHandoff} from '../packages/workbench/geometry-handoff-consumer.mjs';
const target=process.argv[2];
if(process.argv.length!==3||!['pianta-libera','mpe','ape-italia'].includes(target)){
  console.error('Uso: node scripts/inspect-geometry-handoff.mjs <pianta-libera|mpe|ape-italia> < handoff.json');
  process.exitCode=2;
}else{
  let total=0;const chunks=[];
  try{
    for await(const chunk of process.stdin){
      total+=chunk.length;
      if(total>512*1024)throw Error('too_large');
      chunks.push(chunk);
    }
    const result=inspectGeometryHandoff(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)),target);
    if(result.ok)console.log(JSON.stringify(result.preview,null,2));
    else{console.error(result.error);process.exitCode=1;}
  }catch{console.error('invalid_or_oversize_input');process.exitCode=1;}
}
