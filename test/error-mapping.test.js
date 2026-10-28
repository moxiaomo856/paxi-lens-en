/* Regression test — error mapping (mapError).
 *
 * Bug (2026-10-28): mapError mapped by ERROR CODE first and THREW THE RAW LOG AWAY. A failing
 * delegate tx therefore showed "Generic on-chain error (possibly empty address or encoding
 * issue) (code 1)" while the chain's actual message (e.g. "delegation amount must be more than
 * zero", "account sequence mismatch") was discarded — the user had no way to tell what went wrong.
 *
 * Now: the keyword map is consulted FIRST, and the raw log is ALWAYS appended.
 *
 * Run: node test/error-mapping.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SUITE = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(SUITE, 'shared.js'), 'utf8');

function extractFn(name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('not found: ' + name);
  if (src.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  let depth = 0, opened = false, quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') { depth++; opened = true; }
    else if (c === '}') {
      depth--;
      if (opened && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces: ' + name);
}

// pull the real maps out of shared.js so the test uses the shipped definitions
function extractMap(name) {
  const idx = src.indexOf('const ' + name + ' =');
  if (idx < 0) throw new Error('map not found: ' + name);
  let depth = 0, quote = null;
  for (let i = idx; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') depth--;
    else if (c === ';' && depth === 0) return src.slice(idx, i + 1);
  }
  throw new Error('unterminated: ' + name);
}

const ctx = vm.createContext({});
vm.runInContext(extractMap('ERROR_CODE_MAP') + '\n' + extractMap('ERROR_KEYWORD_MAP') + '\n' +
  extractFn('mapError'), ctx);
// a top-level function declaration becomes a property of the VM context
const mapError = ctx.mapError;

let failed = 0, passed = 0;
const ok = (cond, label, extra) => {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
};

console.log('\n== A. 原始 raw_log 必须始终可见 ==');
const withLog = mapError(1, 'failed to execute message; delegation amount must be more than zero');
ok(/delegation amount must be more than zero/.test(withLog), 'code 1 也带出链上原文', withLog);
ok(/code 1/.test(withLog), '同时保留错误码', withLog);

console.log('\n== B. 关键词表优先（更可读的提示）==');
const seq = mapError(1, 'account sequence mismatch, expected 5, got 4');
ok(/sequence mismatch/i.test(seq) && !/Generic on-chain error/.test(seq),
   'sequence mismatch 走精准提示，而不是笼统的 code 1', seq);
const fund = mapError(1, 'insufficient funds: spendable balance 0upaxi is smaller than 100000upaxi');
ok(/balance|insufficient/i.test(fund), '余额不足走精准提示', fund);

console.log('\n== C. 兜底 ==');
ok(/Unknown error/.test(mapError(1, '')) || mapError(1, '').length > 0, '无 raw_log 时仍给出可读信息', mapError(1, ''));
ok(mapError(0, '').length > 0, 'code 0 不抛异常', mapError(0, ''));
const longLog = 'x'.repeat(500);
ok(mapError(1, longLog).length < 400, '超长原文会被截断', String(mapError(1, longLog).length));

console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed === 0 ? 0 : 1);
