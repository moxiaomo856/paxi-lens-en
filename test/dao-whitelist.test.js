/* DAO proposer whitelist regression test (2026-10-28)
 *
 * Background: commit 68a1fc2 ("unify fee collector address") did a global address
 * replacement that ALSO overwrote the 2nd whitelist entry
 *   paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd
 * with the collector address
 *   paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg
 * That account was then permanently locked out of submitting DAO proposals
 * (the whole proposal card is not rendered for non-whitelisted wallets).
 *
 * This test locks down:
 *  1) the originally-designated accounts are all present again
 *  2) the collector address is an ADDITIONAL entry, not a replacement
 *  3) the comparison is case-insensitive (bech32 allows an all-uppercase form)
 *  4) the whitelist in both paxi-suite and paxi-suite-en stays in sync
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');   // workspace root (contains both suites)
let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (detail !== undefined ? '  → ' + detail : '')); }
}
function section(t) { console.log('\n=== ' + t + ' ==='); }

const ORIGINALLY_DESIGNATED = [
  'paxi1gzrza9s6frtwenz0p4dpjftjpvjaznn6f2lvh3',
  'paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd',
  'paxi1qvrmsftn402cumn0axqjc4dgvmkge6lhp0y39j',
  'paxi1fl8j6gewhs2yz3tztr5dlvsmpp0d7gaxka73e5',
];
const COLLECTOR = 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg';

// ---- extract the whitelist array literal from shared.js ----
function extractWhitelist(file) {
  const src = fs.readFileSync(file, 'utf8');
  const idx = src.indexOf('daoProposerWhitelist:');
  if (idx < 0) throw new Error('daoProposerWhitelist not found in ' + file);
  const open = src.indexOf('[', idx);
  const close = src.indexOf(']', open);
  const body = src.slice(open + 1, close);
  const list = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(body)) !== null) list.push(m[1]);
  return list;
}

// ---- bech32 (BIP-173) checksum validation ----
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
function hrpExpand(hrp) {
  const ret = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}
function bech32Verify(str) {
  const pos = str.lastIndexOf('1');
  if (pos < 1 || pos + 7 > str.length) return false;
  const hrp = str.slice(0, pos);
  const data = [];
  for (let i = pos + 1; i < str.length; i++) {
    const d = CHARSET.indexOf(str[i]);
    if (d < 0) return false;
    data.push(d);
  }
  return polymod(hrpExpand(hrp).concat(data)) === 1;
}

const SUITES = [
  { name: 'paxi-suite-en', file: path.join(ROOT, 'paxi-suite-en', 'shared.js'), prop: path.join(ROOT, 'paxi-suite-en', 'appjs', 'tools', 'proposal.js') },
  { name: 'paxi-suite',    file: path.join(ROOT, 'paxi-suite',    'shared.js'), prop: path.join(ROOT, 'paxi-suite',    'appjs', 'tools', 'proposal.js') },
];

const lists = {};

for (const s of SUITES) {
  section(s.name + ' — whitelist contents');
  const list = extractWhitelist(s.file);
  lists[s.name] = list;

  for (const a of ORIGINALLY_DESIGNATED) {
    ok(list.includes(a), 'originally-designated account present: ' + a);
  }
  ok(list.includes(COLLECTOR), 'collector address present as an additional entry');

  // The critical regression: the designated account must NOT be missing.
  ok(list.length >= 5, 'whitelist has at least 5 entries', String(list.length));

  // No duplicates.
  ok(new Set(list).size === list.length, 'no duplicate entries');

  // Every entry must be a valid bech32 address with the paxi HRP.
  for (const a of list) {
    ok(bech32Verify(a) && a.startsWith('paxi1'), 'valid bech32 paxi address: ' + a);
  }

  section(s.name + ' — case-insensitive comparison');
  const propSrc = fs.readFileSync(s.prop, 'utf8');
  ok(/toLowerCase\(\)/.test(propSrc),
     'whitelist comparison lowercases the address (bech32 uppercase form tolerated)');
  ok(!/daoWhitelist\(\)\.includes\(state\.wallet\.address\)/.test(propSrc),
     'the old case-sensitive .includes(state.wallet.address) is gone');
}

section('the two suites stay in sync');
{
  const en = lists['paxi-suite-en'].slice().sort();
  const cn = lists['paxi-suite'].slice().sort();
  ok(JSON.stringify(en) === JSON.stringify(cn),
     'paxi-suite-en and paxi-suite have identical whitelists',
     JSON.stringify({ en, cn }));
}

console.log('\n' + '='.repeat(60));
console.log(fail === 0 ? `ALL PASS — ${pass} assertions` : `FAILURES — ${pass} passed, ${fail} failed`);
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
