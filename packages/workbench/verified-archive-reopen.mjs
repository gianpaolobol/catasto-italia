// Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
// [Codex] Only the canonical STORE archive from this version, never arbitrary ZIP extraction.
const LIMIT=8*1024*1024, SESSION_LIMIT=256*1024;
const invalid=()=>{throw Error('invalid_diagnostic_archive');};
export async function reopenVerifiedArchive(bytes,regenerate){
  if(!(bytes instanceof Uint8Array)||bytes.length<60||bytes.length>LIMIT||typeof regenerate!=='function')invalid();
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let p=0;
  function member(expected,max){
    if(p+30>bytes.length||view.getUint32(p,true)!==0x04034b50||
       view.getUint16(p+6,true)!==0||view.getUint16(p+8,true)!==0||view.getUint16(p+28,true)!==0)invalid();
    const size=view.getUint32(p+18,true),len=view.getUint16(p+26,true),start=p+30+len,end=start+size;
    if(size!==view.getUint32(p+22,true)||size>max||len!==expected.length||end>bytes.length||
       decoder.decode(bytes.subarray(p+30,start))!==expected)invalid();
    p=end;return bytes.subarray(start,end);
  }
  // Never execute HTML or open/write members. Read just the bounded JSON session.
  member('LEGGIMI.txt',4096);
  const raw=member('sessione-sintetica.json',SESSION_LIMIT);
  const session=JSON.parse(decoder.decode(raw));
  // Rebuild all members and headers from validated declarations via local server.
  // Exact byte comparison covers central directory, manifest, CRC, paths and all content.
  const rebuilt=await regenerate(session);
  if(!(rebuilt instanceof Uint8Array)||rebuilt.length!==bytes.length)invalid();
  for(let i=0;i<bytes.length;i++)if(bytes[i]!==rebuilt[i])invalid();
  return session;
}
