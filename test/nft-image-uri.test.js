/* Regression test — NFT image / metadata URI handling.
 *
 * Bug (2026-10-28): after the "direct image token_uri" change, only i.ibb.co style direct
 * image links rendered. NFTs whose token_uri holds JSON metadata (data:application/json;base64
 * or ipfs:// / *.json) showed the 🎨 placeholder, because:
 *   1) the metadata fetcher skipped data: URIs entirely (so the JSON was never parsed), and
 *   2) the data:application/json URI itself was passed to <img src> (browser cannot render JSON
 *      as an image -> onerror -> placeholder).
 *
 * This test extracts the REAL functions from the source files and asserts the behaviour.
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
  let depth = 0;
  let opened = false;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { depth++; opened = true; }
    else if (src[i] === '}') {
      depth--;
      if (opened && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces: ' + name);
}

// ---- minimal browser-ish sandbox (no network) ----
const ctx = vm.createContext({
  atob, btoa, escape, unescape, decodeURIComponent, encodeURIComponent,
  console, JSON, Math, Date, setTimeout, clearTimeout, AbortController,
  fetch: () => { throw new Error('network disabled in this test'); },
});

function load(file, name) {
  const fn = vm.runInContext('(' + extractFn(file, name) + ')', ctx);
  ctx[name] = fn;
  return fn;
}

// load in dependency order
load('shared.js', 'isDirectImageUri');
load('shared.js', 'parseDataUriJson');
load('appjs/tools/my-nfts.js', '_resolveDisplay');
load('appjs/tools/nft-market.js', '_nftmResolveImgSrcs');
load('appjs/tools/nft-market.js', '_nftmImgCands');
load('appjs/tools/nft-market.js', '_nftmFetchMeta');

const isDirectImageUri = ctx.isDirectImageUri;
const parseDataUriJson = ctx.parseDataUriJson;
const _resolveDisplay = ctx._resolveDisplay;
const _nftmResolveImgSrcs = ctx._nftmResolveImgSrcs;
const _nftmImgCands = ctx._nftmImgCands;
const _nftmFetchMeta = ctx._nftmFetchMeta;

const b64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');

let failed = 0, passed = 0;
function ok(cond, label, extra) {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; console.log('  FAIL  ' + label + (extra ? '  -> ' + extra : '')); }
}

(async () => {
  console.log('\n== 1. token_uri = data:application/json;base64 (inline JSON metadata) ==');
  const metaObj = {
    name: 'Q版小猫',
    image: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    description: 'regression fixture',
  };
  const dataUri = 'data:application/json;base64,' + b64(metaObj);

  const parsed = parseDataUriJson(dataUri);
  ok(parsed && parsed.name === 'Q版小猫', 'parseDataUriJson decodes inline JSON', JSON.stringify(parsed));
  ok(parsed && parsed.image === metaObj.image, 'parsed.image kept intact');

  const fetched = await _nftmFetchMeta(dataUri);
  ok(fetched && fetched.name === 'Q版小猫', '_nftmFetchMeta returns metadata for data: URI (was null -> broken)');

  const disp = _resolveDisplay({ token_uri: dataUri, extension: null }, fetched);
  ok(disp.image === metaObj.image, '_resolveDisplay picks metadata image', disp.image);
  ok(disp.name === 'Q版小猫', '_resolveDisplay picks metadata name');
  ok(disp.image !== dataUri, 'data: JSON URI is NOT used as the image');

  const cands = _nftmImgCands(disp.image);
  ok(cands.length === 4, 'ipfs image -> 4 gateway candidates', String(cands.length));
  ok(/gateway\.pinata\.cloud/.test(cands[0]), 'first candidate is pinata gateway', cands[0]);
  ok(/ipfs\.io/.test(cands[1]) && /dweb\.link/.test(cands[2]) && /cloudflare-ipfs/.test(cands[3]),
     'fallback gateways ordered pinata->ipfs.io->dweb->cloudflare');

  const rawCands = _nftmImgCands(dataUri);
  ok(rawCands.length === 0, 'data:application/json NEVER becomes an <img src>', JSON.stringify(rawCands));

  console.log('\n== 2. inline JSON metadata whose image is an https/pinata URL ==');
  const pinataUrl = 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.png';
  const pinataUri = 'data:application/json;base64,' + b64({
    name: 'Pinata One',
    image: pinataUrl,
  });
  const m2 = await _nftmFetchMeta(pinataUri);
  const d2 = _resolveDisplay({ token_uri: pinataUri, extension: null }, m2);
  ok(d2.image && /pinata\.cloud/.test(d2.image), 'pinata image resolved from inline metadata', d2.image);
  const c2 = _nftmImgCands(d2.image);
  ok(c2[0] === pinataUrl, 'original pinata URL is tried first', JSON.stringify(c2));
  ok(c2.every(u => /\/1\.png$/.test(u)), 'sub-path /1.png preserved in every gateway candidate', JSON.stringify(c2));

  console.log('\n== 2b. ipfs:// CID with a sub-path ==');
  const g2 = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.png');
  ok(g2.length === 4, 'ipfs:// with sub-path -> 4 gateways', String(g2.length));
  ok(g2.every(u => /\/2\.png$/.test(u)), 'ipfs:// sub-path preserved', JSON.stringify(g2));
  ok(!g2.some(u => /\/ipfs\/Qm[A-Za-z0-9]{44}$/.test(u)), 'no candidate lost the file name', JSON.stringify(g2));

  console.log('\n== 3. direct image token_uri (i.ibb.co / ibcc) ==');
  const ibb = 'https://i.ibb.co/4ccdHds/1000068940.png';
  const d3 = _resolveDisplay({ token_uri: ibb, extension: null }, null);
  ok(d3.image === ibb, 'direct image used as image', d3.image);
  ok(isDirectImageUri(ibb), 'isDirectImageUri(i.ibb.co png)');
  const c3 = _nftmImgCands(d3.image);
  ok(c3.length === 1 && c3[0] === ibb, 'direct image -> single <img src>', JSON.stringify(c3));
  ok(isDirectImageUri('https://x.com/a.jpg') && isDirectImageUri('https://x.com/a.png?w=1') && isDirectImageUri('https://x.com/a.webp'),
     'image extensions recognised (jpg/png?query/webp)');
  ok(!isDirectImageUri('https://x.com/meta.json') && !isDirectImageUri('ipfs://QmXyz'), 'json / ipfs URIs are not direct images');

  console.log('\n== 4. direct data:image token_uri ==');
  const dataImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const d4 = _resolveDisplay({ token_uri: dataImg, extension: null }, null);
  ok(d4.image === dataImg, 'data:image token_uri used as image', d4.image);
  const c4 = _nftmImgCands(d4.image);
  ok(c4.length === 1 && c4[0] === dataImg, 'data:image is a valid <img src>', JSON.stringify(c4));

  console.log('\n== 5. percent-encoded (non-base64) data: JSON ==');
  const pctUri = 'data:application/json,' + encodeURIComponent(JSON.stringify({ name: 'Pct', image: ibb }));
  const p5 = parseDataUriJson(pctUri);
  ok(p5 && p5.name === 'Pct', 'percent-encoded data: JSON parsed', JSON.stringify(p5));

  console.log('\n== 6. ipfs:// metadata URI (multi-gateway fetch path) ==');
  const g = _nftmResolveImgSrcs('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
  ok(g.length === 4 && /pinata\.cloud/.test(g[0]), 'ipfs:// -> 4 gateways, pinata first', JSON.stringify(g));

  console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
