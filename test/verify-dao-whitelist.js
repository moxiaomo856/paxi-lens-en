/**
 * Regression test: DAO funding request whitelist show/hide logic
 *
 * Requirement: the DAO funding request (community pool spend) feature is only visible/usable after one of these 4 wallet addresses connects,
 *       other wallets see nothing of this feature after connecting.
 *
 * Verification points:
 *   1. The whitelist addresses themselves are valid paxi bech32 (43-char account address + checksum)
 *   2. isDaoProposerAllowed() returns true for whitelist addresses, false for others
 *   3. Always returns false when no wallet is connected (no DAO entry is rendered)
 *   4. renderDaoProposalCard() returns an empty string when not whitelisted / not connected
 *   5. renderProposal()'s type dropdown no longer shows the pool (community pool spend) option
 *
 * Run: node test/verify-dao-whitelist.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ---- bech32 validation (consistent with the implementation in proposal.js) ----
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function isValidPaxiAddress(a) {
  if (typeof a !== 'string') return false;
  const s = a.trim();
  const m = /^paxi1([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$/.exec(s);
  if (!m) return false;
  const hrp = [];
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) >> 5);
  hrp.push(0);
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) & 31);
  const data = [];
  for (const c of m[1]) data.push(BECH32.indexOf(c));
  let chk = 1;
  for (const v of hrp.concat(data)) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk === 1;
}

// ---- Sandbox: load shared.js + proposal.js ----
const sandbox = {
  console,
  window: {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  fetch: async () => ({ ok: false, status: 0, json: async () => ({}) }),
  setTimeout: () => {},
  clearTimeout: () => {},
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);

// Browser API stubs
sandbox.t = (k) => k;                    // i18n fallback -> return the key itself
sandbox.escapeHtmlSafe = (s) => String(s == null ? '' : s);
sandbox.showStatus = () => {};
sandbox.showToast = () => {};
sandbox.mapError = (e) => (e && e.message) || String(e);
sandbox.paxiToUpaxi = (s) => String(Math.round(parseFloat(s || '0') * 1e6));
sandbox.upaxiToPaxi = (s) => String(parseInt(s || '0', 10) / 1e6);
sandbox.getLCD = () => 'https://example.invalid';
sandbox.CONFIG = { lcd: 'https://example.invalid', denom: 'upaxi', feeCollector: 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg' };
sandbox.SHARED_CONFIG = null;            // overridden by shared.js
sandbox.PaxiCosmJS = new Proxy({}, { get: () => undefined });
sandbox.state = { connected: false, wallet: null, currentTool: 'proposal' };
sandbox.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
sandbox.navigator = { userAgent: 'node', language: 'zh-CN' };
sandbox.location = { href: '', origin: 'https://example.invalid' };

const sharedSrc = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
const proposalSrc = fs.readFileSync(path.join(ROOT, 'appjs/tools/proposal.js'), 'utf8');

try {
  vm.runInContext(sharedSrc, sandbox, { filename: 'shared.js' });
} catch (e) {
  console.error('❌ shared.js failed to load:', e.message);
  process.exit(1);
}
try {
  vm.runInContext(proposalSrc, sandbox, { filename: 'proposal.js' });
} catch (e) {
  console.error('❌ proposal.js failed to load:', e.message);
  process.exit(1);
}

// Note: const/let declarations are not attached to the sandbox object; use runInContext to read them
const wl = vm.runInContext('SHARED_CONFIG.governance.daoProposerWhitelist', sandbox);
const OUTSIDER = 'paxi1gzrza9s6frtwenz0p4dpjftjpvjaznn6f2lvh4'; // a valid address outside the whitelist

let failures = 0;
function check(ok, label) {
  console.log((ok ? '✅' : '❌') + ' ' + label);
  if (!ok) failures++;
}

console.log('\n== Whitelist config ==');
check(Array.isArray(wl) && wl.length === 4, `Whitelist has exactly 4 addresses (actual ${wl ? wl.length : 0})`);
(wl || []).forEach((a, i) => check(isValidPaxiAddress(a), `Whitelist [${i}] bech32 valid: ${a}`));

console.log('\n== isDaoProposerAllowed whitelist check ==');
function withWallet(addr) {
  sandbox.state.connected = !!addr;
  sandbox.state.wallet = addr ? { address: addr } : null;
  return sandbox.isDaoProposerAllowed();
}
check(withWallet(null) === false, 'Wallet not connected -> not usable');
(wl || []).forEach((a) => check(withWallet(a) === true, `Whitelist address usable: ${a}`));
check(withWallet(OUTSIDER) === false, `Non-whitelist address not usable: ${OUTSIDER}`);
check(withWallet('paxi1notavalidaddress000000000000000000000000000') === false, 'Invalid address not usable');

console.log('\n== renderDaoProposalCard show/hide ==');
withWallet(null);
check(sandbox.renderDaoProposalCard() === '', 'Wallet not connected -> DAO card not rendered');
withWallet(OUTSIDER);
check(sandbox.renderDaoProposalCard() === '', 'Non-whitelist wallet -> DAO card not rendered');
withWallet(wl[0]);
const card = sandbox.renderDaoProposalCard();
check(card && card.includes('daoPropSubmitBtn'), 'Whitelist wallet -> DAO card rendered (with submit button)');
check(card && card.includes('daoPropRecipient') && card.includes('daoPropAmount'), 'Whitelist wallet -> card includes recipient address/amount inputs');

console.log('\n== Type dropdown no longer exposes pool option ==');
const sel = sandbox.renderProposal().match(/<select id="proposalType"[\s\S]*?<\/select>/);
check(!!sel && !/value="pool"/.test(sel[0]), 'Proposal type dropdown has no pool option');
check(!!sel && /value="text"/.test(sel[0]) && /value="param"/.test(sel[0]), 'Proposal type dropdown keeps text / param');

console.log('\n---------------- Result ----------------');
if (failures) { console.log(`\nRESULT: FAIL (${failures} items failed)`); process.exit(1); }
console.log('\nRESULT: PASS');
