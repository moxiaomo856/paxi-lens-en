// Temp checker: compare key trees across language packs (ref = ja) and verify
// function-valued keys + placeholder tokens are preserved.
global.window = {};
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'langs');
const langs = ['ja', 'ko', 'id', 'vi', 'zh'];
for (const lc of langs) {
  const code = fs.readFileSync(path.join(dir, lc + '.js'), 'utf8');
  eval(code);
}
const P = global.window.PAXI_LANGS;

function keyTree(obj, prefix, acc) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'function') acc.push(p + ' (fn)');
    else if (v && typeof v === 'object' && !Array.isArray(v)) keyTree(v, p, acc);
    else acc.push(p);
  }
  return acc;
}

const ref = keyTree(P.ja, '', []).sort();
let problems = 0;
for (const lc of langs) {
  if (lc === 'ja') continue;
  const tree = keyTree(P[lc], '', []).sort();
  const missing = ref.filter(x => !tree.includes(x));
  const extra = tree.filter(x => !ref.includes(x));
  if (missing.length || extra.length) {
    problems++;
    console.log(`\n[${lc}] vs ja:`);
    if (missing.length) console.log('  MISSING:', missing.join(', '));
    if (extra.length) console.log('  EXTRA  :', extra.join(', '));
  }
}
// placeholder token check across packs
const phRe = /\{(\d+|count|n|m|amount|deposit|fee|rcv|id)\}/g;
function phSet(obj, acc) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'function') { const s = v.toString(); let m; while ((m = phRe.exec(s))) acc.add(m[0]); }
    else if (v && typeof v === 'object' && !Array.isArray(v)) phSet(v, acc);
    else if (typeof v === 'string') { let m; while ((m = phRe.exec(v))) acc.add(m[0]); }
  }
}
const refPhSet = new Set();
phSet(P.ja, refPhSet);
for (const lc of langs) {
  if (lc === 'ja') continue;
  const ph = new Set();
  phSet(P[lc], ph);
  const miss = [...refPhSet].filter(x => !ph.has(x));
  const extra = [...ph].filter(x => !refPhSet.has(x));
  if (miss.length || extra.length) {
    problems++;
    console.log(`\n[${lc}] placeholder mismatch vs ja:`);
    if (miss.length) console.log('  MISSING:', miss.join(', '));
    if (extra.length) console.log('  EXTRA  :', extra.join(', '));
  }
}
// function-valued keys present in all
function fnKeys(obj, acc) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'function') acc.add(k);
    else if (v && typeof v === 'object' && !Array.isArray(v)) fnKeys(v, acc);
  }
  return acc;
}
const refFn = fnKeys(P.ja, new Set());
for (const lc of langs) {
  if (lc === 'ja') continue;
  const fk = fnKeys(P[lc], new Set());
  const miss = [...refFn].filter(x => !fk.has(x));
  if (miss.length) { problems++; console.log(`\n[${lc}] missing function-valued keys:`, miss.join(', ')); }
}

console.log('\n=== Reference (ja) key count:', ref.length, '| function keys:', refFn.size, '| placeholders:', [...refPhSet].join(' '));
console.log(problems === 0 ? 'ALL PACKS CONSISTENT ✅' : ('PROBLEMS FOUND: ' + problems));
