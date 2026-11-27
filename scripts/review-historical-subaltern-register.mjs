// [Codex] Local, read-only historical layout review; synthetic data only.
import { openSync, fstatSync, readSync, closeSync, lstatSync, constants } from 'node:fs';
import { MAX_BYTES, parseHistoricalSubalternRegister, compareHistoricalSubalternRegisters } from '../packages/workbench/historical-subaltern-register.mjs';
function readBounded(path) {
  if (!lstatSync(path).isFile()) throw new Error('Expected bounded regular file');
  const fd=openSync(path,constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat=fstatSync(fd);
    if (!stat.isFile() || stat.size<1 || stat.size>MAX_BYTES) throw new Error('Expected bounded regular file');
    const buffer=Buffer.alloc(MAX_BYTES+1);
    let count=0;
    while (count<buffer.length) {
      const n=readSync(fd,buffer,count,buffer.length-count,null);
      if (!n) break;
      count+=n;
    }
    if (count!==stat.size || count>MAX_BYTES) throw new Error('File size changed or exceeded limit');
    return buffer.subarray(0,count);
  } finally { closeSync(fd); }
}
const args=process.argv.slice(2);
try {
  if (args[0]!=='--synthetic' || ![2,3].includes(args.length))
    throw new Error('Usage: node scripts/review-historical-subaltern-register.mjs --synthetic BEFORE [AFTER]');
  const before=readBounded(args[1]);
  // With one file, emit only summary and hashes, not full address/description fields.
  const result=args.length===3?compareHistoricalSubalternRegisters(before,readBounded(args[2])):
    (()=>{const {rows,...metadata}=parseHistoricalSubalternRegister(before);return {...metadata,count:rows.length,
      records:rows.map(({line,key,recordSha256})=>({line,key,recordSha256}))};})();
  console.log(JSON.stringify(result,null,2));
} catch (error) {
  // Do not echo OS paths or arbitrary input content.
  console.error(error?.code?'Local file read failed':error.message);
  process.exitCode=1;
}
