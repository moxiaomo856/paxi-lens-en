/* Regression test — NFT image / metadata URI handling + performance guards.
 *
 * Bugs covered (2026-10-28):
 *  A) After the "direct image token_uri" change, only i.ibb.co style direct image links rendered.
 *     NFTs whose token_uri holds JSON metadata (data:application/json;base64) showed the 🎨
 *     placeholder because the metadata fetcher skipped data: URIs, and because the
 *     data:application/json URI itself was passed to <img src>.
 *  B) The tool files became hard-dependent on new shared.js globals. If the browser held a
 *     STALE cached shared.js while loading the newer tool file, every call threw a
 *     ReferenceError -> the whole NFT list went blank (ibcc AND pinata both dead).
 *     The tools must therefore work with OR without those shared.js helpers.
 *  C) _nftmResolveImgSrcs dropped the sub-path after an IPFS CID
 *     (/ipfs/QmXXX/1.png -> /ipfs/QmXXX), pointing at the wrong object.
 *  D) Performance: LCD rate-limits at concurrency >=3 (answers with an HTML error page), the
 *     tools used concurrency 10 -> ~25% of nft_info queries failed; a failing res.json() threw
 *     and killed the whole batch. Also pinata 301-redirects /ipfs/<cid> -> /ipfs/<cid>/,
 *     which doubled the image latency (12.3s -> 7.2s once we add the slash ourselves).
 *
 * Run: node test/nft-image-uri.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SUITE = path.join(__dirname, '..');

function readSrc(file) {
  return fs.readFileSync(path.join(SUITE, file), 'utf8');
}

// ---- extract a top-level function (brace matching) ----
function extractFn(file, name) {
  const src = readSrc(file);
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name + ' in ' + file);
  if (src.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  let depth = 0, opened = false;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { depth++; opened = true; }
    else if (src[i] === '}') {
      depth--;
      if (opened && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces: ' + name);
}

// ---- extract a top-level `const NAME = ...;` statement (bracket + quote aware) ----
function extractConst(file, name) {
  const src = readSrc(file);
  const idx = src.indexOf('const ' + name + ' =');
  if (idx < 0) throw new Error('const not found: ' + name + ' in ' + file);
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
  throw new Error('unterminated const: ' + name);
}

// ---- sandbox WITHOUT network ----
function makeCtx(opts) {
  const withShared = !!(opts && opts.withShared);
  const withCandidates = !!(opts && opts.withCandidates);
  const ctx = vm.createContext({
    atob, btoa, escape, unescape, decodeURIComponent, encodeURIComponent,
    console, JSON, Math, Date, setTimeout, clearTimeout, AbortController, Map, Set,
    fetch: () => { throw new Error('network disabled in this test'); },
  });
  const loadFn = (file, name) => {
    const fn = vm.runInContext('(' + extractFn(file, name) + ')', ctx);
    ctx[name] = fn;
    return fn;
  };
  const loadConst = (file, name) => {
    vm.runInContext(extractConst(file, name), ctx);
  };
  if (withShared) {
    loadFn('shared.js', 'isDirectImageUri');
    loadFn('shared.js', 'parseDataUriJson');
  }
  // tool-local helpers (must work even when shared.js is stale)
  loadFn('appjs/tools/my-nfts.js', '_nftvDirectImageUri');
  loadFn('appjs/tools/my-nfts.js', '_nftvParseDataUriJson');
  loadFn('appjs/tools/nft-market.js', '_nftmDirectImageUri');
  loadFn('appjs/tools/nft-market.js', '_nftmParseDataUriJson');
  if (withCandidates) {
    // canonical gateway helpers (live in my-nfts.js)
    loadConst('appjs/tools/my-nfts.js', '_NFT_IPFS_GATEWAYS');
    loadConst('appjs/tools/my-nfts.js', '_NFT_GW_BLOCK_MS');
    loadConst('appjs/tools/my-nfts.js', '_nftGwState');
    loadFn('appjs/tools/my-nfts.js', '_nftGwBlocked');
    loadFn('appjs/tools/my-nfts.js', '_nftGwFail');
    loadFn('appjs/tools/my-nfts.js', '_nftGwOk');
    loadFn('appjs/tools/my-nfts.js', '_nftImgCandidates');
  }
  loadFn('appjs/tools/my-nfts.js', '_resolveDisplay');
  loadFn('appjs/tools/nft-market.js', '_nftmResolveImgSrcs');
  loadFn('appjs/tools/nft-market.js', '_nftmImgCands');
  loadFn('appjs/tools/nft-market.js', '_nftmFetchMeta');
  return ctx;
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');

let failed = 0, passed = 0;
function ok(cond, label, extra) {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
}

// ============================================================
// Behaviour that must hold in every sandbox variant
// ============================================================
async function behaviourSuite(label, ctx) {
  const _resolveDisplay = ctx._resolveDisplay;
  const _nftmResolveImgSrcs = ctx._nftmResolveImgSrcs;
  const _nftmImgCands = ctx._nftmImgCands;
  const _nftmFetchMeta = ctx._nftmFetchMeta;
  console.log('\n===== ' + label + ' =====');

  console.log('-- token_uri = data:application/json;base64 (inline JSON metadata) --');
  const metaObj = {
    name: 'Q版小猫',
    image: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    description: 'regression fixture',
  };
  const dataUri = 'data:application/json;base64,' + b64(metaObj);

  const fetched = await _nftmFetchMeta(dataUri);
  ok(fetched && fetched.name === 'Q版小猫', 'metadata JSON decoded from data: URI', JSON.stringify(fetched));

  const disp = _resolveDisplay({ token_uri: dataUri, extension: null }, fetched);
  ok(disp.image === metaObj.image, '_resolveDisplay picks metadata image', disp.image);
  ok(disp.name === 'Q版小猫', '_resolveDisplay picks metadata name');
  ok(disp.image !== dataUri, 'data: JSON URI is NOT used as the image');

  const cands = _nftmImgCands(disp.image);
  ok(cands.length >= 1 && /gateway\.pinata\.cloud/.test(cands[0]), 'first candidate is pinata gateway', JSON.stringify(cands));
  ok(cands.some(u => /ipfs\.io/.test(u)) && cands.some(u => /dweb\.link/.test(u)) && cands.some(u => /cloudflare-ipfs/.test(u)),
     'fallback gateways present (pinata/ipfs.io/dweb/cloudflare)');
  ok(_nftmImgCands(dataUri).length === 0, 'data:application/json NEVER becomes an <img src>');

  console.log('-- pinata trailing slash (skips the 301 round trip) --');
  const pinataBare = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
  ok(/^https:\/\/gateway\.pinata\.cloud\/ipfs\/Qm[A-Za-z0-9]{44}\/$/.test(pinataBare[0]),
     'bare CID -> pinata candidate has trailing slash', pinataBare[0]);
  const pinataUrl = 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
  const pinataFixed = _nftmResolveImgSrcs(pinataUrl);
  ok(pinataFixed[0] === pinataUrl + '/', 'existing pinata URL gets a trailing slash', pinataFixed[0]);

  console.log('-- inline metadata whose image is an https/pinata URL --');
  const pinataFile = 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.png';
  const pinataUri = 'data:application/json;base64,' + b64({ name: 'Pinata One', image: pinataFile });
  const m2 = await _nftmFetchMeta(pinataUri);
  const d2 = _resolveDisplay({ token_uri: pinataUri, extension: null }, m2);
  ok(d2.image && /pinata\.cloud/.test(d2.image), 'pinata image resolved from inline metadata', d2.image);
  const c2 = _nftmImgCands(d2.image);
  ok(c2[0] === pinataFile, 'original pinata URL (with file name) tried first', JSON.stringify(c2));
  ok(c2.every(u => /\/1\.png$/.test(u)), 'sub-path /1.png preserved in every candidate', JSON.stringify(c2));

  console.log('-- direct image token_uri (i.ibb.co / ibcc) --');
  const ibb = 'https://i.ibb.co/4ccdHds/1000068940.png';
  const d3 = _resolveDisplay({ token_uri: ibb, extension: null }, null);
  ok(d3.image === ibb, 'direct image used as image', d3.image);
  const c3 = _nftmImgCands(d3.image);
  ok(c3.length === 1 && c3[0] === ibb, 'direct image -> single <img src>', JSON.stringify(c3));

  console.log('-- direct data:image token_uri --');
  const dataImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const d4 = _resolveDisplay({ token_uri: dataImg, extension: null }, null);
  ok(d4.image === dataImg, 'data:image token_uri used as image', d4.image);
  ok(_nftmImgCands(d4.image).length === 1, 'data:image is a valid <img src>');

  console.log('-- percent-encoded (non-base64) data: JSON --');
  const pctUri = 'data:application/json,' + encodeURIComponent(JSON.stringify({ name: 'Pct', image: ibb }));
  const fetchedPct = await _nftmFetchMeta(pctUri);
  ok(fetchedPct && fetchedPct.name === 'Pct', 'percent-encoded data: JSON parsed', JSON.stringify(fetchedPct));

  console.log('-- ipfs:// CID with / without sub-path --');
  const g2 = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.png');
  ok(g2.length >= 1 && g2.every(u => /\/2\.png$/.test(u)), 'ipfs:// sub-path preserved', JSON.stringify(g2));
  const g3 = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
  ok(g3.length >= 1 && /pinata\.cloud/.test(g3[0]), 'bare ipfs:// CID -> pinata first', JSON.stringify(g3));
  ok(!g3.some(u => u.indexOf('pinata') >= 0 && /\/ipfs\/Qm[A-Za-z0-9]{44}$/.test(u)),
     'pinata candidate is the only one carrying a trailing slash');
  ok(g3.filter(u => u.indexOf('pinata') < 0).every(u => /\/ipfs\/Qm[A-Za-z0-9]{44}$/.test(u)),
     'other gateways keep the bare form (they serve it directly, no 301)');
}

(async () => {
  // 1) fresh shared.js + canonical candidate helpers
  await behaviourSuite('A. fresh shared.js + canonical helpers', makeCtx({ withShared: true, withCandidates: true }));

  // 2) STALE shared.js (helpers missing) — must not break anything
  await behaviourSuite('B. STALE shared.js (helpers missing)', makeCtx({ withShared: false, withCandidates: true }));

  // 3) STALE shared.js AND stale my-nfts.js (nft-market must use its own inline fallback)
  await behaviourSuite('C. STALE shared.js + STALE my-nfts.js (inline fallback)', makeCtx({ withShared: false, withCandidates: false }));

  console.log('\n===== D. robustness =====');
  const ctx = makeCtx({ withShared: false, withCandidates: true });
  let threw = false, res = null;
  try {
    const bad = {};
    Object.defineProperty(bad, 'extension', { get() { throw new Error('boom'); } });
    res = ctx._resolveDisplay(bad, null);
  } catch (e) { threw = true; }
  ok(!threw && res && res.image === '', '_resolveDisplay never throws on malformed token', String(threw));

  const r2 = ctx._resolveDisplay({}, null);
  ok(r2 && r2.image === '' && r2.tokenUri === '', 'empty token -> empty display, no crash', JSON.stringify(r2));
  const r3 = ctx._resolveDisplay(null, null);
  ok(r3 && r3.image === '' && r3.tokenUri === '', 'null info -> empty display, no crash', JSON.stringify(r3));

  console.log('\n===== E. performance guards (source-level) =====');
  const mkt = readSrc('appjs/tools/nft-market.js');
  const mnv = readSrc('appjs/tools/my-nfts.js');
  // LCD rate-limits us: the higher the concurrency, the more requests come back as an HTML error
  // page. Retry is what actually guarantees completeness, concurrency only trades speed vs pressure.
  ok(/_NFTM_CONCURRENCY = 5\b/.test(mkt), 'nft-market concurrency = 5 (balance of speed vs LCD pressure)');
  ok(/_NFTV_CONCURRENCY = 5\b/.test(mnv), 'my-nfts concurrency = 5 (balance of speed vs LCD pressure)');
  // first page must stay small: 100 nft_info queries ≈ 19s (and mostly fail), 24 ≈ 3.5s
  ok(/_NFTM_TOKEN_PAGE = 24\b/.test(mkt), 'nft-market first page = 24 tokens');
  // nft_info must not throw on an HTML rate-limit body
  ok(/content-type[\s\S]{0,80}json/.test(mnv) && /continue;/.test(mnv), 'nft_info retries instead of throwing on rate-limit HTML');
  ok(/attempt < 3/.test(mnv), 'nft_info retries up to 3 times');
  // pinata trailing slash
  ok(/gateway\\?\.pinata\.cloud/.test(mkt) && /\+ '\/'|\+ "\/"|\? s \+ '\/'/.test(mkt + mnv),
     'pinata candidate gets a trailing slash');
  // gateways must be raced in parallel, not sequentially
  ok(/Promise\.all|_nftmRaceImage|for \(const url of cands\)/.test(mkt), 'metadata fetch races gateways');

  console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
