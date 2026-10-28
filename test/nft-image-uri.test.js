/* Regression test — NFT image / metadata URI handling.
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
 *
 * Run: node test/nft-image-uri.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SUITE = path.join(__dirname, '..');

// ---- extract a top-level function from a source file (brace matching) ----
function extractFn(file, name) {
  const src = fs.readFileSync(path.join(SUITE, file), 'utf8');
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name + ' in ' + file);
  // keep a preceding `async` keyword (async function ... { await ... })
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

// ---- sandbox WITHOUT network ----
function makeCtx(withSharedHelpers) {
  const ctx = vm.createContext({
    atob, btoa, escape, unescape, decodeURIComponent, encodeURIComponent,
    console, JSON, Math, Date, setTimeout, clearTimeout, AbortController,
    fetch: () => { throw new Error('network disabled in this test'); },
  });
  const load = (file, name) => {
    const fn = vm.runInContext('(' + extractFn(file, name) + ')', ctx);
    ctx[name] = fn;
    return fn;
  };
  if (withSharedHelpers) {
    load('shared.js', 'isDirectImageUri');
    load('shared.js', 'parseDataUriJson');
  }
  // tool-local helpers (must work even when shared.js is stale)
  load('appjs/tools/my-nfts.js', '_nftvDirectImageUri');
  load('appjs/tools/my-nfts.js', '_nftvParseDataUriJson');
  load('appjs/tools/nft-market.js', '_nftmDirectImageUri');
  load('appjs/tools/nft-market.js', '_nftmParseDataUriJson');
  load('appjs/tools/my-nfts.js', '_resolveDisplay');
  load('appjs/tools/nft-market.js', '_nftmResolveImgSrcs');
  load('appjs/tools/nft-market.js', '_nftmImgCands');
  load('appjs/tools/nft-market.js', '_nftmFetchMeta');
  return ctx;
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');

let failed = 0, passed = 0;
function ok(cond, label, extra) {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
}

// ============================================================
// Behaviour that must hold in BOTH sandboxes (fresh / stale shared.js)
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
  ok(cands.length === 4, 'ipfs image -> 4 gateway candidates', String(cands.length));
  ok(/gateway\.pinata\.cloud/.test(cands[0]), 'first candidate is pinata gateway', cands[0]);
  ok(/ipfs\.io/.test(cands[1]) && /dweb\.link/.test(cands[2]) && /cloudflare-ipfs/.test(cands[3]),
     'fallback gateways ordered pinata->ipfs.io->dweb->cloudflare');
  ok(_nftmImgCands(dataUri).length === 0, 'data:application/json NEVER becomes an <img src>');

  console.log('-- inline metadata whose image is an https/pinata URL --');
  const pinataUrl = 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.png';
  const pinataUri = 'data:application/json;base64,' + b64({ name: 'Pinata One', image: pinataUrl });
  const m2 = await _nftmFetchMeta(pinataUri);
  const d2 = _resolveDisplay({ token_uri: pinataUri, extension: null }, m2);
  ok(d2.image && /pinata\.cloud/.test(d2.image), 'pinata image resolved from inline metadata', d2.image);
  const c2 = _nftmImgCands(d2.image);
  ok(c2[0] === pinataUrl, 'original pinata URL tried first', JSON.stringify(c2));
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
  ok(g2.length === 4 && g2.every(u => /\/2\.png$/.test(u)), 'ipfs:// sub-path preserved', JSON.stringify(g2));
  const g3 = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
  ok(g3.length === 4 && /pinata\.cloud/.test(g3[0]), 'bare ipfs:// CID -> 4 gateways, pinata first', JSON.stringify(g3));
}

(async () => {
  // 1) fresh shared.js (helpers present)
  await behaviourSuite('A. fresh shared.js (helpers present)', makeCtx(true));

  // 2) STALE shared.js (helpers missing) — must not break anything
  await behaviourSuite('B. STALE shared.js (helpers missing) — must still work', makeCtx(false));

  console.log('\n===== C. robustness =====');
  const ctx = makeCtx(false);
  // a malformed token must not throw out of _resolveDisplay
  let threw = false;
  let res = null;
  try {
    const bad = {};
    Object.defineProperty(bad, 'extension', { get() { throw new Error('boom'); } });
    res = ctx._resolveDisplay(bad, null);
  } catch (e) { threw = true; }
  ok(!threw && res && res.image === '', '_resolveDisplay never throws on malformed token', String(threw));

  // a token with no token_uri at all
  const r2 = ctx._resolveDisplay({}, null);
  ok(r2 && r2.image === '' && r2.tokenUri === '', 'empty token -> empty display, no crash', JSON.stringify(r2));

  // null / undefined info
  const r3 = ctx._resolveDisplay(null, null);
  ok(r3 && r3.image === '' && r3.tokenUri === '', 'null info -> empty display, no crash', JSON.stringify(r3));

  console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
