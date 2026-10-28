/* Regression test — loading robustness & shared validator loader (2026-10-28).
 *
 * Covered:
 *  A) fetchAPI must survive the LCD rate limiter, which answers with an HTML error page
 *     (status can even be 200) instead of JSON. A bare res.json() throws and takes the whole
 *     tool down with it. -> defensive parsing + backoff retry, and 4xx must fail fast.
 *  B) The three validator tools (redelegate / stake-manage / validator-compare) used to fetch the
 *     same 138-validator list independently (2 pages, ~3.2s each). They now share one cached
 *     loader -> the second tool opens instantly, and the first page renders before the rest.
 *
 * Run: node test/loading-perf.test.js
 */
const fs = require('fs');
const path = require('path');

const SUITE = path.join(__dirname, '..');
const readSrc = (f) => fs.readFileSync(path.join(SUITE, f), 'utf8');

// ---- extract a top-level function (quote-aware brace matching) ----
function extractFn(src, name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
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

// ---- extract a top-level const/let statement ----
function extractDecl(src, name) {
  const re = new RegExp('\\b(?:const|let)\\s+' + name + '\\s*=');
  const m = re.exec(src);
  if (!m) throw new Error('decl not found: ' + name);
  let depth = 0, quote = null;
  for (let i = m.index; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') depth--;
    else if (c === ';' && depth === 0) return src.slice(m.index, i + 1);
  }
  throw new Error('unterminated decl: ' + name);
}

// ---- build one module holding the real shared.js code + test stubs ----
function buildModule() {
  const src = readSrc('shared.js');
  const parts = [
    // stubs (replace the browser globals)
    `const getLCD = () => 'https://lcd.test';`,
    `const localStorage = { _s: {}, getItem(k){ return Object.prototype.hasOwnProperty.call(this._s,k) ? this._s[k] : null; }, setItem(k,v){ this._s[k] = String(v); } };`,
    `const fetchCalls = [];`,
    `let __fetchImpl = null;`,
    `const fetch = async (url, opts) => { fetchCalls.push(String(url)); return __fetchImpl(String(url), opts); };`,
    `function __setFetchImpl(f) { __fetchImpl = f; }`,
  ];
  for (const n of ['_VALIDATORS_CACHE_KEY', '_VALIDATORS_TTL_MS', '_validatorsMem', '_validatorsInflight']) {
    parts.push(extractDecl(src, n));
  }
  for (const n of ['fetchAPI', '_readValidatorsCache', '_writeValidatorsCache', '_fetchValidatorPages',
                   '_loadValidatorsFresh', '_refreshValidators', 'loadValidatorsCached']) {
    parts.push(extractFn(src, n));
  }
  parts.push('export { fetchAPI, loadValidatorsCached, fetchCalls, __setFetchImpl };');
  return 'data:text/javascript;base64,' + Buffer.from(parts.join('\n')).toString('base64');
}

let failed = 0, passed = 0;
const ok = (cond, label, extra) => {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
};

(async () => {
  // ============================================================
  // A) fetchAPI: rate-limit (HTML body) -> retry; 4xx -> fail fast
  // ============================================================
  console.log('\n===== A. fetchAPI hardening =====');
  let attempts = 0;
  const modA = await import(buildModule());
  modA.__setFetchImpl(async () => {
    attempts++;
    if (attempts === 1) {
      // rate limiter: 200 + HTML error page
      return { ok: true, status: 200, headers: { get: () => 'text/html' }, text: async () => '<html>too many requests</html>' };
    }
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => JSON.stringify({ hello: 'world', attempt: attempts }) };
  });
  const r1 = await modA.fetchAPI('/some/path');
  ok(r1 && r1.hello === 'world', 'HTML rate-limit body -> retried, then parsed', JSON.stringify(r1));
  ok(attempts === 2, 'exactly one retry was needed', String(attempts));

  // 404 must fail fast (no retry)
  attempts = 0;
  const modB = await import(buildModule());
  modB.__setFetchImpl(async () => {
    attempts++;
    return { ok: false, status: 404, headers: { get: () => 'text/plain' }, text: async () => 'not found' };
  });
  let thrown = null;
  try { await modB.fetchAPI('/missing'); } catch (e) { thrown = e; }
  ok(thrown && /HTTP 404/.test(thrown.message), '404 fails fast with a clear message', String(thrown && thrown.message));
  ok(attempts === 1, '404 is NOT retried', String(attempts));

  // 500 must be retried
  attempts = 0;
  const modC = await import(buildModule());
  modC.__setFetchImpl(async () => {
    attempts++;
    if (attempts < 3) return { ok: false, status: 503, headers: { get: () => 'text/plain' }, text: async () => 'busy' };
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{"ok":1}' };
  });
  const r3 = await modC.fetchAPI('/flaky');
  ok(r3 && r3.ok === 1, '5xx is retried until it succeeds', JSON.stringify(r3));
  ok(attempts === 3, 'retried up to 3 attempts', String(attempts));

  // ============================================================
  // B) loadValidatorsCached: pagination, onPage, cache reuse, force refresh
  // ============================================================
  console.log('\n===== B. shared validator loader =====');
  const PAGE1 = { validators: Array.from({ length: 100 }, (_, i) => ({ operator_address: 'v' + i, status: 'BOND_STATUS_BONDED' })), pagination: { next_key: 'K1' } };
  const PAGE2 = { validators: Array.from({ length: 38 }, (_, i) => ({ operator_address: 'w' + i, status: 'BOND_STATUS_UNBONDING' })), pagination: {} };
  let valCalls = 0;
  const modD = await import(buildModule());
  modD.__setFetchImpl(async (url) => {
    valCalls++;
    const body = url.includes('pagination.key=') ? PAGE2 : PAGE1;
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => JSON.stringify(body) };
  });

  const pages = [];
  const first = await modD.loadValidatorsCached({ onPage: (list) => pages.push(list.length) });
  ok(first.length === 138, 'both pages collected (100 + 38)', String(first.length));
  ok(pages.length === 2 && pages[0] === 100 && pages[1] === 138, 'onPage fired per page (first page early)', JSON.stringify(pages));
  ok(valCalls === 2, 'exactly 2 network calls for 2 pages', String(valCalls));

  const second = await modD.loadValidatorsCached();
  ok(valCalls === 2, 'second call served from cache (no new request)', String(valCalls));
  ok(second.length === 138, 'cached list is complete', String(second.length));

  await modD.loadValidatorsCached({ force: true });
  ok(valCalls === 4, 'force:true bypasses the cache and refetches', String(valCalls));

  console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
