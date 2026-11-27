// [Codex] Historical diagnostic only. GU 04/04/2005 SO 58, p. 38, sub allegato 4.
// No current DOCFA compatibility, official export, identity verification or case mutation.
import { createHash } from 'node:crypto';
export const SOURCE = 'https://www.gazzettaufficiale.it/eli/gu/2005/04/04/77/so/58/sg/pdf#page=38';
export const MAX_BYTES = 502 * 2000;
const fields = Object.freeze({
  ownerNumber:[1,3], municipality:[4,8], section:[9,11], sheet:[12,15],
  parcel:[16,20], denominator:[21,24], subaltern:[25,28],
  street:[29,78], streetNumber:[79,84], floor1:[85,88], floor2:[89,92],
  floor3:[93,96], stair:[97,98], interior:[99,101], description:[102,401],
  mapRecordNumber:[402,409], mapRecordDate:[410,417], insertionFlag:[418,418],
  unitType:[419,419], filler:[420,500]
});
function fail(line, reason) { throw new Error('Historical record '+line+': '+reason); }
export function parseHistoricalSubalternRegister(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES)
    throw new Error('Expected bounded nonempty synthetic ASCII Buffer');
  // Restrict research profile to printable ASCII, LF or CRLF separators only.
  if (bytes.some(x => x !== 10 && x !== 13 && (x < 32 || x > 126)))
    throw new Error('Unsupported byte encoding');
  const text = bytes.toString('ascii');
  if (/\r(?!\n)/.test(text)) throw new Error('Unsupported line separator');
  const records = text.split(/\r?\n/);
  if (records.at(-1) === '') records.pop();
  if (!records.length || records.length > 2000) throw new Error('Invalid record count');
  const seen = new Set();
  const rows = records.map((raw, i) => {
    const line = i+1;
    if (raw.length !== 500) fail(line,'expected 500 bytes');
    const f = Object.fromEntries(Object.entries(fields).map(([k,[start,end]]) => [k, raw.slice(start-1,end)]));
    if (f.ownerNumber !== '000') fail(line,'unsupported owner-number field');
    // Explicit synthetic sentinel; this is not a municipality-code validator.
    if (f.municipality.trim() !== 'Z999') fail(line,'only synthetic sentinel Z999 accepted');
    if (![f.sheet,f.parcel,f.subaltern].every(x=>x.trim())) fail(line,'missing identifier in restricted profile');
    if (!/^\d{4}$/.test(f.denominator)) fail(line,'unsupported denominator field');
    if (!/^[012]$/.test(f.insertionFlag) || !/^[UB]$/.test(f.unitType))
      fail(line,'unsupported flags in historical layout');
    // Preserve exact textual identity including padding; do not equate alternate encodings.
    const key = raw.slice(3,28);
    if (seen.has(key)) fail(line,'duplicate exact identity; manual review required');
    seen.add(key);
    return {line, key, fields:f, recordSha256:createHash('sha256').update(raw,'ascii').digest('hex')};
  });
  return {kind:'historical-subaltern-register-diagnostic', source:SOURCE,
    syntheticOnly:true, officialCompatibility:false, sourceSha256:createHash('sha256').update(bytes).digest('hex'), rows};
}
export function compareHistoricalSubalternRegisters(beforeBytes, afterBytes) {
  const before=parseHistoricalSubalternRegister(beforeBytes), after=parseHistoricalSubalternRegister(afterBytes);
  const old=new Map(before.rows.map(r=>[r.key,r])), next=new Map(after.rows.map(r=>[r.key,r]));
  const removed=[], added=[], changed=[], unchanged=[];
  for (const [key,row] of old) {
    const other=next.get(key);
    if (!other) removed.push({key,beforeLine:row.line});
    else if (row.recordSha256===other.recordSha256) unchanged.push({key,beforeLine:row.line,afterLine:other.line});
    else changed.push({key,beforeLine:row.line,afterLine:other.line,
      changedFields:Object.keys(fields).filter(k=>row.fields[k]!==other.fields[k])});
  }
  for (const [key,row] of next) if (!old.has(key)) added.push({key,afterLine:row.line});
  return {kind:'historical-subaltern-register-comparison', source:SOURCE, syntheticOnly:true,
    officialCompatibility:false, caseMutation:false, beforeSha256:before.sourceSha256,afterSha256:after.sourceSha256,
    counts:{removed:removed.length,added:added.length,changed:changed.length,unchanged:unchanged.length},
    removed,added,changed,unchanged};
}
