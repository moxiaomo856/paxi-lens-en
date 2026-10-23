/* ============================================================================
 * Paxi Lens · On-chain Decoder · Core Engine v2
 * ----------------------------------------------------------------------------
 * Design principles (all verified against real Paxi mainnet on-chain data):
 *
 * 1. Funds are resolved from "events" rather than proto decoding.
 *    In practice the LCD returns tx.body.messages as an anypb-expanded format
 *    (top-level flattened fields, no value/base64 wrapping), so decoding value
 *    with a cosmjs decoder is doomed to fail. But coin_spent / coin_received /
 *    transfer / wasm events are always present regardless of node or client
 *    configuration, so all fund flows are derived from events.
 *
 * 2. Events are parsed one-by-one independently (v2 fix).
 *    The old version aggregated attributes by event type: when two contracts
 *    in one transaction both emitted wasm events, action/_contract_address got
 *    merged into arrays, causing the entire contract transfer to be lost; the
 *    same happened with multiple coin_spent. v2 parses each event independently;
 *    only transfer is still de-duplicated against coin_* (to prevent double counting).
 *
 * 3. Contract capabilities are discovered via "error probing" instead of guessing.
 *    The chain stores no schema, but when cosmwasm deserialization fails it echoes
 *    the full enum. When there is no echo, it falls back to KNOWN_PROBES, trying
 *    each one (read-only queries, no side effects).
 *
 * 4. Read-only, no signing, no private keys touched. Pure front-end that connects
 *    directly to public nodes.
 * ==========================================================================*/

const LCD = 'https://mainnet-lcd.paxinet.io';
const RPC = 'https://mainnet-rpc.paxinet.io';
const DENOM_EXP = 6;                 // 1 PAXI = 10^6 upaxi
const TIMEOUT = 20000;

/* ---------------------------------------------------------------- Basic utils */

/* DOM shortcut function.
 * Deliberately not using a top-level const $ —— that would make it exist only in
 * this file's lexical scope. Once this file is inlined into a try{} or module
 * scope, app.js would throw "ReferenceError: $ is not defined" and the whole
 * page interaction would break. Here we attach it to window, scope-independent
 * and safest. */
if (typeof window !== 'undefined') window.$ = (id) => document.getElementById(id);

function shortAddr(a) {
  if (!a) return '—';
  a = String(a);
  return a.length <= 20 ? a : a.slice(0, 10) + '…' + a.slice(-8);
}

/** Safely convert a number to string (avoids large-number precision loss) */
function toBig(n) {
  try { return BigInt(String(n)); } catch (_) { return 0n; }
}

/** Micro-unit -> readable decimal (pure string math, no precision loss) */
function formatUnits(raw, denom, exp = DENOM_EXP) {
  const s = String(raw ?? '0').trim();
  if (!/^-?\d+$/.test(s)) return s + (denom ? ' ' + denom : '');
  const neg = s.startsWith('-');
  const digits = neg ? s.slice(1) : s;
  const pad = digits.padStart(exp + 1, '0');
  const int = pad.slice(0, pad.length - exp).replace(/^0+(?=\d)/, '');
  const frac = pad.slice(pad.length - exp).replace(/0+$/, '');
  const out = frac ? `${int}.${frac}` : int;
  return (neg ? '-' : '') + out;
}

/**
 * Amount display.
 * - upaxi → converted to PAXI
 * - ibc/... denom is not upper-cased (hash is case-sensitive; upper-casing is wrong)
 * - others show raw value only (caller should use formatToken if token precision is known)
 */
function fmtCoin(amount, denom) {
  const d = String(denom || '');
  if (d === 'upaxi') return formatUnits(amount, 'upaxi') + ' PAXI';
  if (d.startsWith('ibc/')) return String(amount) + ' ' + d;
  return String(amount) + (d ? ' ' + d.toUpperCase() : '');
}

/** Convert PRC-20 amount using token_info's decimals/symbol */
function formatToken(raw, info) {
  if (!info) return String(raw ?? '');
  return formatUnits(raw, '', Number(info.decimals) || 0)
    + ' ' + String(info.symbol || '').toUpperCase();
}

/* ------------------------------------------------------------ Local address book */
/* User-given nickname for an address (persisted to localStorage, written by the UI layer).
 * Story text prefers the nickname so ordinary users can "get it at a glance". */

let NAMEBOOK = {};
function setAddressBook(map) { NAMEBOOK = (map && typeof map === 'object') ? map : {}; }
function nameOf(addr) {
  const a = String(addr || '');
  return NAMEBOOK[a] || shortAddr(a);
}

/** Relative time: turn an RFC3339 timestamp into "3 minutes ago" */
function timeAgo(ts) {
  const t = Date.parse(ts);
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
  return Math.floor(s / 86400 / 30) + 'mo ago';
}

async function getJSON(url, ms = TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch (_) {}
      const err = new Error(`HTTP ${res.status}`);
      err.body = detail;
      throw err;
    }
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out; the node may be unresponsive');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function getB64(str) {
  // UTF-8-safe hand-rolled base64 (avoids btoa throwing on non-ASCII chars)
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------ Event parsing core */

/** Convert an events array into a Map<type, attrs[]> structure (kept for export compatibility, no longer used internally) */
function groupEvents(events) {
  const out = [];
  for (const ev of events || []) {
    const attrs = {};
    for (const a of ev.attributes || []) {
      // Keep all values for a same-named attribute (e.g. multiple amounts)
      if (attrs[a.key] === undefined) attrs[a.key] = a.value;
      else if (Array.isArray(attrs[a.key])) attrs[a.key].push(a.value);
      else attrs[a.key] = [attrs[a.key], a.value];
    }
    out.push({ type: ev.type, attrs });
  }
  return out;
}

const asArr = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Attribute table within a single event (events are NOT merged with each other —— key v2 fix) */
function attrsOf(ev) {
  const o = {};
  for (const a of ev.attributes || []) {
    if (o[a.key] === undefined) o[a.key] = a.value;
    else if (Array.isArray(o[a.key])) o[a.key].push(a.value);
    else o[a.key] = [o[a.key], a.value];
  }
  return o;
}

/**
 * Full extraction of fund flows (v2: per-event parsing)
 * Returns { native, contract, semanticTransfers, feePayer, fee }
 *
 * native   : net change of native coin (upaxi), aggregated by address|denom (BigInt, no precision loss)
 * contract : in-contract asset transfers (PRC-20 / PRC-721 / mint / burn / cw20.send, etc.)
 */
function extractFlows(txr) {
  const nativeMap = new Map();
  const contract = [];
  const semanticTransfers = [];
  let sawCoinEvent = false;
  let feePayer = '';
  let feeFromEvent = '';

  /** Record one native-coin change; sign=+1 incoming, -1 outgoing */
  const addNative = (addr, amountStr, sign) => {
    if (!addr || Array.isArray(addr)) addr = asArr(addr)[0];
    const m = String(amountStr).match(/^(\d+)(.+)$/);
    if (!addr || !m) return;
    const denom = m[2];
    const key = addr + '|' + denom;
    if (!nativeMap.has(key)) nativeMap.set(key, { address: addr, denom, delta: 0n });
    nativeMap.get(key).delta += (sign < 0 ? -1n : 1n) * toBig(m[1]);
  };

  for (const ev of txr.events || []) {
    const a = attrsOf(ev);

    // Native coin: spent (each event handled independently, multiple spends don't pollute each other)
    if (ev.type === 'coin_spent') {
      sawCoinEvent = true;
      for (const amt of asArr(a.amount)) addNative(a.spender, amt, -1);
    }
    // Native coin: received
    if (ev.type === 'coin_received') {
      sawCoinEvent = true;
      for (const amt of asArr(a.amount)) addNative(a.receiver, amt, +1);
    }
    // transfer is the semantic mirror of coin_spent/coin_received; accumulating from the
    // same source would double-count. So it is only used as a fallback when the
    // transaction has no fund events at all.
    if (ev.type === 'transfer' && a.sender && a.recipient) {
      if (!sawCoinEvent) {
        for (const amt of asArr(a.amount)) {
          addNative(a.sender, amt, -1);
          addNative(a.recipient, amt, +1);
        }
      }
      // Regardless of fallback, record the semantics of this transfer (for the story layer)
      semanticTransfers.push({
        from: a.sender, to: a.recipient, amount: asArr(a.amount)
      });
    }
    // Fee
    if (ev.type === 'tx') {
      if (a.fee_payer) feePayer = a.fee_payer;
      if (a.fee) feeFromEvent = a.fee;
    }

    // Contract events: cw20 / cw721 / custom (per-event independent, multi-contract txs no longer pollute each other)
    if (ev.type === 'wasm') {
      const c = a._contract_address || '';
      const action = a.action || '';
      // PRC-20 transfer (cw20 standard transfer: from/to are either normal addresses or contracts)
      if (action === 'transfer' && a.from && a.to) {
        contract.push({
          kind: 'PRC-20', contract: c,
          from: a.from, to: a.to,
          amount: asArr(a.amount).join(', '), tokenId: ''
        });
      }
      // PRC-721 transfer
      if (action === 'transfer_nft' && a.from && a.to) {
        contract.push({
          kind: 'PRC-721', contract: c,
          from: a.from, to: a.to, amount: '', tokenId: a.token_id || ''
        });
      }
      // cw20 send: the recipient is a "contract" and will then trigger that contract's
      // receive hook — not an airdrop. Labeled clearly to avoid confusion (v2 semantic fix)
      if (action === 'send') {
        contract.push({
          kind: 'Inter-contract transfer', contract: c,
          from: a.sender || '', to: a.to || a.recipient || '',
          amount: asArr(a.amount).join(', '), tokenId: '', viaHook: true
        });
      }
      // mint / burn (recipient naming varies by implementation, multi-path compatible)
      if (action === 'mint' || action === 'burn') {
        contract.push({
          kind: action === 'mint' ? 'Mint' : 'Burn', contract: c,
          from: action === 'mint' ? '' : (a.from || a.sender || a.owner || ''),
          to: action === 'mint' ? (a.to || a.recipient || a.owner || '') : '',
          amount: asArr(a.amount).join(', '), tokenId: a.token_id || ''
        });
      }
      // Fallback: any wasm event with amount and with from/to
      if (!['transfer', 'transfer_nft', 'send', 'mint', 'burn'].includes(action)
          && a.amount && (a.from || a.to)) {
        contract.push({
          kind: action ? `Contract:${action}` : 'Contract asset transfer', contract: c,
          from: a.from || '', to: a.to || '',
          amount: asArr(a.amount).join(', '), tokenId: ''
        });
      }
    }
  }

  const native = [...nativeMap.values()]
    .map(x => ({ ...x }))
    .filter(x => x.delta !== 0n);

  return { native, contract, semanticTransfers, feePayer, fee: feeFromEvent };
}

/* ------------------------------------------------------- Message type → semantics */

/**
 * Key: the LCD returns messages in anypb-expanded format, with fields flattened
 * directly at the value layer. So here we do multi-shape compatibility:
 *   m.value.from_address / m.from_address / m.fromAddress
 */
function readMsg(m) {
  const v = (m && (m.value && typeof m.value === 'object')) ? m.value : (m || {});
  const pick = (...keys) => {
    for (const k of keys) if (v[k] !== undefined && v[k] !== null && v[k] !== '') return v[k];
    return '';
  };
  return {
    type: (m && m['@type']) || '',
    from: pick('from_address', 'fromAddress', 'sender', 'voter', 'signer', 'grantee'),
    to: pick('to_address', 'toAddress', 'recipient'),
    amount: pick('amount', 'amounts', 'value'),
    raw: v,
  };
}

const TYPE_LABEL = {
  '/cosmos.bank.v1beta1.MsgSend': 'Native transfer',
  '/cosmos.bank.v1beta1.MsgMultiSend': 'Batch transfer',
  '/cosmwasm.wasm.v1.MsgExecuteContract': 'Contract call',
  '/cosmwasm.wasm.v1.MsgInstantiateContract': 'Deploy contract instance',
  '/cosmwasm.wasm.v1.MsgStoreCode': 'Upload contract code',
  '/cosmwasm.wasm.v1.MsgMigrateContract': 'Contract migration/upgrade',
  '/cosmwasm.wasm.v1.MsgUpdateAdmin': 'Transfer contract admin',
  '/cosmwasm.wasm.v1.MsgClearAdmin': 'Relinquish contract admin',
  '/cosmos.staking.v1beta1.MsgDelegate': 'Stake delegation',
  '/cosmos.staking.v1beta1.MsgUndelegate': 'Undelegate',
  '/cosmos.staking.v1beta1.MsgBeginRedelegate': 'Redelegate stake',
  '/cosmos.staking.v1beta1.MsgEditValidator': 'Edit validator info',
  '/cosmos.staking.v1beta1.MsgCreateValidator': 'Create validator',
  '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': 'Claim staking reward',
  '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission': 'Withdraw validator commission',
  '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress': 'Set reward receiving address',
  '/cosmos.distribution.v1beta1.MsgFundCommunityPool': 'Donate to community pool',
  '/cosmos.gov.v1beta1.MsgVote': 'Governance vote',
  '/cosmos.gov.v1beta1.MsgSubmitProposal': 'Submit proposal',
  '/cosmos.gov.v1beta1.MsgDeposit': 'Proposal deposit',
  '/cosmos.gov.v1.MsgVote': 'Governance vote',
  '/cosmos.gov.v1.MsgVoteWeighted': 'Governance weighted vote',
  '/cosmos.gov.v1.MsgSubmitProposal': 'Submit proposal',
  '/cosmos.gov.v1.MsgDeposit': 'Proposal deposit',
  '/cosmos.gov.v1.MsgCancelProposal': 'Cancel proposal',
  '/cosmos.slashing.v1beta1.MsgUnjail': 'Unjail validator',
  '/ibc.applications.transfer.v1.MsgTransfer': 'Cross-chain transfer',
  '/paxi.swap.v1.MsgSwap': 'Swap',
  '/paxi.swap.v1.MsgProvideLiquidity': 'Provide liquidity',
  '/paxi.swap.v1.MsgWithdrawLiquidity': 'Withdraw liquidity',
  /* Real typeUrl confirmed from official DApp guide §3.8 / paxi-cosmjs.umd.js proto package name (x.swap.types) */
  '/x.swap.types.MsgSwap': 'Swap',
  '/x.swap.types.MsgProvideLiquidity': 'Provide liquidity',
  '/x.swap.types.MsgWithdrawLiquidity': 'Withdraw liquidity',
  '/cosmos.authz.v1beta1.MsgGrant': 'Grant proxy permission',
  '/cosmos.authz.v1beta1.MsgRevoke': 'Revoke proxy permission',
  '/cosmos.authz.v1beta1.MsgExec': 'Proxy execution',
  '/cosmos.feegrant.v1beta1.MsgGrantAllowance': 'Authorize gas subsidy',
  '/cosmos.feegrant.v1beta1.MsgRevokeAllowance': 'Revoke gas subsidy',
  '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade': 'Software upgrade proposal',
  '/cosmos.crisis.v1beta1.MsgVerifyInvariant': 'Verify on-chain invariant',
};

function labelOf(type) {
  if (TYPE_LABEL[type]) return TYPE_LABEL[type];
  const short = String(type).split('.').pop();
  return short || 'Unknown action';
}

/** Vote option → label */
const VOTE_OPT = {
  VOTE_OPTION_YES: 'Yes', VOTE_OPTION_NO: 'No',
  VOTE_OPTION_ABSTAIN: 'Abstain', VOTE_OPTION_NO_WITH_VETO: 'No with veto',
};
function voteText(o) { return VOTE_OPT[o] || o; }

/** base64 -> UTF-8 string (does not rely on atob, works in any runtime) */
function b64ToUtf8(b64) {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (_) {
    try { return Buffer.from(b64, 'base64').toString('utf8'); } catch (__) {}
    try { return decodeURIComponent(escape(b64)); } catch (__) {}
    return '';
  }
}

/** Parse the JSON embedded in a contract call (MsgExecuteContract.msg is base64) */
function decodeContractMsg(m) {
  const v = (m && m.value && typeof m.value === 'object') ? m.value : {};
  const fields = { contract: v.contract || '', sender: v.sender || '', action: '', args: null, raw: null };

  // Compatible with three carrying forms: base64 string / byte array / already-expanded plain object
  let text = '';
  if (typeof v.msg === 'string') text = b64ToUtf8(v.msg);
  else if (Array.isArray(v.msg)) {
    try { text = new TextDecoder().decode(new Uint8Array(v.msg)); } catch (_) {}
  } else if (v.msg && typeof v.msg === 'object') {
    text = JSON.stringify(v.msg);
  }

  if (text) {
    try {
      const j = JSON.parse(text);
      if (j && typeof j === 'object') {
        fields.raw = j;
        fields.action = Object.keys(j)[0] || '';
        fields.args = j[fields.action];
      }
    } catch (_) {}
  }
  return fields;
}

const EXEC_LABEL = {
  transfer: 'Token transfer', transfer_from: 'Token transfer', send: 'Inter-contract transfer',
  transfer_nft: 'NFT transfer', send_nft: 'NFT transfer', mint: 'Mint', burn: 'Burn',
  increase_allowance: 'Increase allowance', decrease_allowance: 'Decrease allowance',
  increase_allowances: 'Batch increase allowance', decrease_allowances: 'Batch decrease allowance',
  swap: 'Swap', swap_native_for_native: 'Swap', provide_liquidity: 'Provide liquidity',
  withdraw_liquidity: 'Withdraw liquidity',
  stake: 'Stake', unstake: 'Undelegate', claim_rewards: 'Claim rewards',
  play: 'Submit game round', upgrade: 'Upgrade card', evolve: 'Ascend star',
  mint_to: 'Mint', burn_from: 'Burn',
};

/** The fund details of these actions are already explained by wasm events (flows.contract), so the story layer doesn't repeat a line */
const COVERED_ACTIONS = ['transfer', 'transfer_nft', 'send', 'mint', 'burn', 'send_nft'];

/* ---------------------------------------------------------- Human-readable story */

/** PRC-20 amount display: if token_info exists, convert to "99 PXT"; otherwise note precision is unknown */
function tokenAmtStr(raw, contract, tokens) {
  const info = tokens && tokens[contract];
  if (info && info.symbol) return esc(formatToken(raw, info));
  return `${esc(raw)} tokens (precision unknown)`;
}

/**
 * Single message → story line. authz.MsgExec recursively expands sub-messages.
 * tokens: Map<contractAddr, {symbol, decimals, name}>, filled in asynchronously by the UI layer before being passed in.
 */
function storyLineFor(m, flows, tokens) {
  const info = readMsg(m);
  const t = info.type;
  const v = info.raw;
  const lines = [];

  if (t === '/cosmos.bank.v1beta1.MsgSend') {
    const amts = Array.isArray(info.amount)
      ? info.amount.map(x => fmtCoin(x.amount, x.denom)).join('、')
      : fmtCoin(info.amount, 'upaxi');
    lines.push(`💸 <b>${esc(nameOf(info.from))}</b> sent <b>${esc(amts)}</b> to <b>${esc(nameOf(info.to))}</b>`);

  } else if (t === '/cosmos.bank.v1beta1.MsgMultiSend') {
    const fmtSide = (arr) => (arr || []).map(x =>
      `${esc(nameOf(x.address))} (${(x.coins || []).map(c => fmtCoin(c.amount, c.denom)).join(', ')}))`).join(' + ');
    lines.push(`💸 Batch transfer: ${fmtSide(v.inputs)} → ${fmtSide(v.outputs)}`);

  } else if (t.includes('ibc.applications.transfer') || t.endsWith('.MsgTransfer')) {
    const tok = v.token || {};
    lines.push(`🌐 <b>${esc(nameOf(info.from))}</b> via channel <b>${esc(v.source_channel || '?')}</b> `
      + `sent cross-chain <b>${esc(fmtCoin(tok.amount, tok.denom))}</b> to destination-chain address <b>${esc(shortAddr(v.receiver || ''))}</b> `
      + `(cross-chain transfer needs confirmation from the other chain, a few seconds to a few minutes)`);

  } else if (t.endsWith('.MsgExecuteContract')) {
    const c = decodeContractMsg(m);
    const covered = COVERED_ACTIONS.includes(c.action) && flows.contract.length > 0;
    if (!covered) {
      const act = EXEC_LABEL[c.action] || c.action || 'Unknown operation';
      lines.push(`📜 <b>${esc(nameOf(c.sender || info.from))}</b> called contract `
        + `<span class="lnk" data-addr="${esc(c.contract)}">${esc(nameOf(c.contract))}</span> `
        + `to execute <b>${esc(act)}</b>`);
    }

  } else if (t.endsWith('.MsgInstantiateContract')) {
    const c = v.contract || '';
    const lbl = v.label || '';
    const adm = v.admin || '';
    lines.push(`🚀 <b>${esc(nameOf(info.from))}</b> created a new contract`
      + (lbl ? ` (label: <b>${esc(lbl)}</b>)` : '')
      + (c ? `: <span class="lnk" data-addr="${esc(c)}">${esc(shortAddr(c))}</span>` : '')
      + (adm ? `, admin ${esc(shortAddr(adm))} (upgradeable)` : ', no admin set (non-upgradeable)'));

  } else if (t.endsWith('.MsgStoreCode')) {
    lines.push(`📦 <b>${esc(nameOf(info.from))}</b> uploaded a new contract code`);

  } else if (t.endsWith('.MsgMigrateContract')) {
    const c = v.contract || '';
    lines.push(`🔄 <b>${esc(nameOf(info.from))}</b> upgraded contract `
      + `<span class="lnk" data-addr="${esc(c)}">${esc(nameOf(c))}</span> `
      + `to a new version (Code ID ${esc(v.code_id || '?')})`);

  } else if (t.endsWith('.MsgDelegate')) {
    const amt = v.amount ? fmtCoin(v.amount.amount, v.amount.denom) : '';
    lines.push(`🏦 <b>${esc(nameOf(info.from))}</b> staked ${esc(amt)} to validator `
      + `${esc(shortAddr(v.validator_addr || ''))}`
      + ` (staking locks the funds; to withdraw you must first undelegate and wait for the unbonding period)`);

  } else if (t.endsWith('.MsgUndelegate')) {
    const amt = v.amount ? fmtCoin(v.amount.amount, v.amount.denom) : '';
    lines.push(`🏦 <b>${esc(nameOf(info.from))}</b> undelegated ${esc(amt)} from validator `
      + `${esc(shortAddr(v.validator_addr || ''))}`
      + ` — the funds arrive automatically after the unbonding period; during this time they cannot be traded or earn rewards`);

  } else if (t.endsWith('.MsgBeginRedelegate')) {
    const amt = v.amount ? fmtCoin(v.amount.amount, v.amount.denom) : '';
    lines.push(`🏦 <b>${esc(nameOf(info.from))}</b> redelegated stake from validator `
      + `${esc(shortAddr(v.validator_src_address || ''))} to `
      + `${esc(shortAddr(v.validator_dst_address || ''))}, amount ${esc(amt)}`
      + ` (principal unchanged, no unbonding wait)`);

  } else if (t.includes('WithdrawDelegatorReward')) {
    lines.push(`💰 <b>${esc(nameOf(info.from))}</b> collected staking rewards from validator `
      + `${esc(shortAddr(v.validator_addr || ''))}`);

  } else if (t.includes('WithdrawValidatorCommission')) {
    lines.push(`💰 Validator ${esc(shortAddr(v.validator_addr || ''))} withdrew its own commission`);

  } else if (t.includes('SetWithdrawAddress')) {
    lines.push(`💰 <b>${esc(nameOf(info.from))}</b> set the future reward receiving address to `
      + `${esc(shortAddr(v.withdraw_address || ''))}`);

  } else if (t.includes('FundCommunityPool')) {
    const amt = v.amount ? asArr(v.amount).map(x => fmtCoin(x.amount, x.denom)).join(', ') : '';
    lines.push(`💜 <b>${esc(nameOf(info.from))}</b> donated ${esc(amt)} to the community pool`);

  } else if (t.endsWith('.MsgUnjail')) {
    lines.push(`🔓 Validator ${esc(shortAddr(v.validator_addr || ''))} applied to be unjailed and regain block-producing eligibility`);

  } else if (t.includes('gov.') && t.endsWith('.MsgVote')) {
    const detail = v.proposal_id ? `Proposal #${esc(v.proposal_id)}` : '';
    const opt = v.option ? voteText(v.option) : '';
    lines.push(`🗳️ Governance vote${detail ? `: ${detail}` : ''}${opt ? `, voted <b>${esc(opt)}</b>` : ''}`
      + (info.from ? ` (voter ${esc(nameOf(info.from))})` : ''));

  } else if (t.includes('gov.') && t.endsWith('.MsgVoteWeighted')) {
    const detail = v.proposal_id ? `Proposal #${esc(v.proposal_id)}` : '';
    const opts = (v.options || []).map(o => `${voteText(o.option)}${o.weight ? '×' + o.weight : ''}`).join(', ');
    lines.push(`🗳️ Governance weighted vote${detail ? `: ${detail}` : ''}${opts ? `, distribution <b>${esc(opts)}</b>` : ''}`
      + (info.from ? ` (voter ${esc(nameOf(info.from))})` : ''));

  } else if (t.includes('gov.') && t.endsWith('.MsgDeposit')) {
    const amt = v.amount ? asArr(v.amount).map(x => fmtCoin(x.amount, x.denom)).join(', ') : '';
    lines.push(`🏦 Proposal deposit: ${esc(nameOf(info.from))} added ${esc(amt)} deposit to proposal #${esc(v.proposal_id || '?')}`
      + ` (once the deposit threshold is met, the proposal enters the voting period)`);

  } else if (t.includes('gov.') && t.endsWith('.MsgSubmitProposal')) {
    lines.push(`🗳️ ${esc(nameOf(info.from))} submitted a new proposal`
      + (v.messages && v.messages.length ? ` (contains ${v.messages.length} execution actions)` : ''));

  } else if (t.includes('gov.') && t.endsWith('.MsgCancelProposal')) {
    lines.push(`🚫 ${esc(nameOf(info.from))} canceled proposal #${esc(v.proposal_id || '?')}`);

  } else if (t.includes('.MsgSwap') || t.includes('.MsgProvideLiquidity') || t.includes('.MsgWithdrawLiquidity')) {
    const label = labelOf(t);
    let extra = '';
    if (v.offer_coin) {
      extra = `, swapping ${esc(fmtCoin(v.offer_coin.amount, v.offer_coin.denom))} for ${esc(String(v.ask_denom || '').toUpperCase())}`;
    } else if (v.offerAmount) {
      /* Official MsgSwap flat fields: offerDenom/offerAmount/minReceive (DApp guide §3.8) */
      const od = String(v.offerDenom || '');
      const inShow = od === 'upaxi' ? fmtCoin(v.offerAmount, 'upaxi') : `${v.offerAmount} (PRC-20 minimal unit)`;
      extra = `, using ${esc(inShow)} to swap for another coin`
        + (v.minReceive ? `, with a protection line of "receive at least ${esc(String(v.minReceive))} minimal units"` : '');
    }
    lines.push(`🔁 ${esc(label)}: <b>${esc(nameOf(info.from))}</b> initiated${extra}`);

  } else if (t.endsWith('.MsgExec')) {
    const subs = v.msgs || [];
    lines.push(`👤 <b>${esc(nameOf(info.from))}</b> used permissions granted by someone else to execute ${subs.length} operations on their behalf:`);
    for (const sm of subs) {
      for (const l of storyLineFor(sm, flows, tokens)) lines.push('　　· ' + l);
    }

  } else if (t.endsWith('.MsgGrant')) {
    lines.push(`🔑 ${esc(nameOf(v.granter || info.from))} authorized ${esc(nameOf(v.grantee || ''))} to execute certain operations on their behalf`);

  } else if (t.endsWith('.MsgRevoke')) {
    lines.push(`🔑 ${esc(nameOf(v.granter || info.from))} revoked the authorization granted to ${esc(nameOf(v.grantee || ''))}`);

  } else if (t.includes('feegrant') && t.endsWith('.MsgGrantAllowance')) {
    lines.push(`⛽ ${esc(nameOf(v.granter || info.from))} agreed to pay gas fees on behalf of ${esc(nameOf(v.grantee || ''))} (gas subsidy)`);

  } else if (t.includes('feegrant') && t.endsWith('.MsgRevokeAllowance')) {
    lines.push(`⛽ ${esc(nameOf(v.granter || info.from))} revoked the gas fee subsidy for ${esc(nameOf(v.grantee || ''))}`);

  } else if (t) {
    lines.push(`• ${esc(labelOf(t))}${info.from ? `: ${esc(nameOf(info.from))}` : ''}`);
  }

  return lines;
}

/**
 * One-sentence summary of this transaction (lead sentence) —— give the conclusion first, then expand details.
 */
function summarizeTx(msgs, flows) {
  let send = 0, multi = 0, game = 0, swap = 0, ibc = 0, stake = 0,
      gov = 0, deploy = 0, claim = 0, other = 0;
  for (const m of msgs) {
    const t = (m && m['@type']) || '';
    if (t.endsWith('.MsgSend')) send++;
    else if (t.endsWith('.MsgMultiSend')) multi++;
    else if (t.endsWith('.MsgExecuteContract')) {
      const c = decodeContractMsg(m);
      const a = (c.action || '').toLowerCase();
      if (['play', 'upgrade', 'evolve', 'battle', 'attack', 'forge', 'claim_game', 'draw', 'summon'].includes(a)) game++;
      else if (a.includes('swap')) swap++;
      else other++;
    }
    else if (t.includes('.MsgSwap')) swap++;
    else if (t.includes('.MsgProvideLiquidity') || t.includes('.MsgWithdrawLiquidity')) swap++;
    else if (t.includes('ibc.applications.transfer') || t.endsWith('.MsgTransfer')) ibc++;
    else if (t.includes('staking.')) stake++;
    else if (t.includes('gov.')) gov++;
    else if (t.includes('Instantiate') || t.includes('StoreCode') || t.includes('Migrate')) deploy++;
    else if (t.includes('Withdraw') || t.includes('Commission')) claim++;
    else other++;
  }
  const flags = [send, multi, game, swap, ibc, stake, gov, deploy, claim, other].filter(x => x > 0).length;
  const n = msgs.length;

  if (flags > 1) return { head: `This is a composite operation with ${n} actions:`, plain: `This transaction did ${n} things at once, like running multiple errands in a single trip` };
  if (send === 1 && n === 1) return { head: 'This is a normal transfer:', plain: 'Like sending a red packet — moving coins from one address into another address pocket' };
  if (multi) return { head: 'This is a one-to-many batch transfer:', plain: 'One person sends coins to many addresses at once, like handing out candy to the whole class' };
  if (game) return { head: 'This is a game action:', plain: 'An action in an on-chain mini-game (upgrade, battle, gacha draw, etc.)' };
  if (swap) return { head: 'This is a token swap:', plain: 'Swapped one coin for another, like changing money at a currency exchange' };
  if (ibc) return { head: 'This is a cross-chain transfer:', plain: 'Via the official "cross-chain bridge", sending coins from the Paxi chain to another blockchain' };
  if (stake) return { head: 'This is a staking operation:', plain: 'Handing coins to a "bookkeeping node" (validator) to help secure the chain and earn rewards' };
  if (gov) return { head: 'This is on-chain governance participation:', plain: 'Major chain decisions are voted on by everyone; this transaction is a vote or proposal submission' };
  if (deploy) return { head: 'This is a contract deploy/upgrade:', plain: 'Installing an auto-running program onto the chain (or upgrading it)' };
  if (claim) return { head: 'This is a reward claim:', plain: 'Taking interest/rewards earned earlier from the system back into your own pocket' };
  if (other) return { head: 'This is a contract/system operation:', plain: 'Letting an on-chain auto-program (smart contract) do something on your behalf' };
  return '';
}

/**
 * Generate the full transaction story.
 * tokens (optional): Map<contractAddr, {symbol, decimals}>, used for PRC-20 precision conversion.
 */
function buildStory(txr, msgs, flows, tokens) {
  const lines = [];
  const ok = txr.code === 0 || txr.code === '0';

  if (!ok) {
    lines.push(`💡 <b>In short</b>: this transaction <b>did not succeed</b> — your coins were not moved, usually only a small fee was lost. Below is what it "intended to do" (none of it <b>happened</b>).`);
    lines.push(`❌ This transaction failed (error code ${esc(txr.code)}) — funds were not transferred, usually only a fee was charged. Below are the actions it <b>intended</b> to execute (none took effect):`);
  } else {
    const s = summarizeTx(msgs, flows);
    if (s) {
      /* Plain-language first: a one-line summary even a child can grasp */
      lines.push(`💡 <b>In short</b>: ${esc(s.plain)}.`);
      lines.push(esc(s.head));
    }
  }

  for (const m of msgs) lines.push(...storyLineFor(m, flows, tokens));

  // In-contract asset transfers (PRC-20/721); wasm events already gave details, here we show the result view
  for (const c of flows.contract) {
    if (c.kind === 'PRC-20') {
      lines.push(`🪙 <b>${esc(nameOf(c.from))}</b> transferred ${tokenAmtStr(c.amount, c.contract, tokens)} to `
        + `<b>${esc(nameOf(c.to))}</b> (token transfer, via contract `
        + `<span class="lnk" data-addr="${esc(c.contract)}">${esc(shortAddr(c.contract))}</span>)`);
    } else if (c.kind === 'PRC-721') {
      lines.push(`🖼️ <b>${esc(nameOf(c.from))}</b> transferred NFT <b>#${esc(c.tokenId)}</b> to `
        + `<b>${esc(nameOf(c.to))}</b> (via contract `
        + `<span class="lnk" data-addr="${esc(c.contract)}">${esc(shortAddr(c.contract))}</span>)`);
    } else if (c.kind === 'Mint') {
      lines.push(`✨ Contract minted asset <b>${esc(c.amount || '#' + c.tokenId)}</b> → ${esc(nameOf(c.to))}`);
    } else if (c.kind === 'Burn') {
      lines.push(`🔥 Contract burned asset <b>${esc(c.amount || '#' + c.tokenId)}</b> (permanently reduced)`);
    } else if (c.kind === 'Inter-contract transfer') {
      lines.push(`🔗 Token contract transferred <b>${tokenAmtStr(c.amount, c.contract, tokens)}</b> into contract `
        + `<b>${esc(nameOf(c.to))}</b> (triggers its internal logic, not a normal transfer)`);
    } else if (c.amount) {
      lines.push(`📦 In-contract asset change: ${esc(c.kind)}`
        + (c.from ? ` ${esc(nameOf(c.from))}` : '')
        + (c.to ? ` → ${esc(nameOf(c.to))}` : '')
        + `, amount <b>${tokenAmtStr(c.amount, c.contract, tokens)}</b>`);
    }
  }

  /* Mini-glossary: based on the concepts actually present in this transaction, give child-level explanations */
  const tips = [];
  const cats = msgs.map(m => (m && m['@type']) || '').join(' ');
  if (cats.endsWith('.MsgSend') || cats.includes('.MsgSend') || flows.native.length) {
    tips.push('Address = the "door number" of an on-chain account, starting with paxi1, unique worldwide; send to the wrong person and it is gone');
  }
  if (cats.includes('staking.')) tips.push('Staking = entrusting coins to a "bookkeeping node" (validator) to earn rewards, like earning interest on a deposit');
  if (cats.includes('gov.')) tips.push('Proposal/vote = major on-chain decisions are voted on by all coin holders together');
  if (cats.includes('ibc') || cats.includes('MsgTransfer')) tips.push('Cross-chain = via the official "cross-chain bridge", sending coins to another blockchain');
  if (cats.includes('Instantiate') || cats.includes('StoreCode') || cats.includes('Migrate')) {
    tips.push('Contract = a program installed on-chain that runs automatically by its rules, like an unmanned vending machine');
  }
  if (flows.contract.length) tips.push('Token/NFT = digital assets on-chain; once sent out they belong to the other party');
  if (cats.includes('MsgSwap')) tips.push('Swap = inside the on-chain "auto-exchange", swapping for another coin at the pool price at that moment');
  if (tips.length) {
    lines.push(`📚 <b>Mini-glossary (this is all you need to understand the above)</b>: ${tips.map(t => esc(t)).join('; ')}.`);
  }

  return lines.join('\n');
}

/* ------------------------------------------------------------ Contract schema probing */

/** Candidate queries for known standard contracts (tried one-by-one when no echo; read-only, no side effects) */
const KNOWN_PROBES = {
  prc20: ['token_info', 'balance', 'minter', 'marketing_info'],
  prc721: ['nft_info', 'num_tokens', 'contract_info', 'tokens'],
  generic: ['config', 'get_config', 'info', 'state'],
};

/**
 * Core trick: hit the contract with a variant name that is guaranteed not to exist;
 * when cosmwasm deserialization fails it echoes the contract's real, full query enum.
 * When there is no echo (untagged enum / custom parsing / unknown error format),
 * fall back to KNOWN_PROBES and try each one.
 */
async function probeSchema(contract) {
  const sentinel = '{"__paxi_probe__":{}}';
  const fetchText = async (b64, ms = 8000) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(`${LCD}/cosmwasm/wasm/v1/contract/${contract}/smart/${b64}`, { signal: ctrl.signal });
      return await res.text();
    } catch (_) {
      return '';
    } finally {
      clearTimeout(timer);
    }
  };

  const text = await fetchText(getB64(sentinel));

  // Echo hit: unknown variant `x`, expected one of `a`, `b`, ...
  // (search the whole response, not just the message field —— guards against node error-wrapping format differences)
  const m = text.match(/unknown variant[\s\S]{0,60}?expected one of\s*:?\s*([\s\S]{0,2400})/);
  if (m) {
    const list = [...new Set(
      [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1].slice(0, 64))
    )];
    if (list.length) return { methods: list, source: 'schema-echo' };
  }

  // A few contracts echo the type but not the enum (includes untagged enum cases)
  if (/data did not match any variant of untagged enum|Error parsing into type/i.test(text)) {
    return { methods: [], source: 'type-only', typeName: (text.match(/Error parsing into type\s+([^:<\n]+)/i) || [])[1] || '' };
  }

  // Fallback: try known standard methods one-by-one (getting data means the method really exists)
  const cands = [...KNOWN_PROBES.generic, ...KNOWN_PROBES.prc20, ...KNOWN_PROBES.prc721];
  const known = [];
  for (const q of cands) {
    if (known.length >= 4) break;
    const t2 = await fetchText(getB64(`{"${q}":{}}`));
    if (t2 && t2.includes('"data"')) known.push(q);
  }
  if (known.length) return { methods: known, source: 'known-probe' };

  return { methods: [], source: 'no-echo', raw: String(text || '').slice(0, 200) };
}

/** Determine the contract category */
function classify(contractInfo, schema) {
  const label = String(contractInfo.label || '').toLowerCase();
  const methods = (schema.methods || []).map(m => m.toLowerCase());
  const has = (k) => methods.includes(k);

  if (has('nft_info') || has('all_nft_info') || has('owner_of')) return 'PRC-721 NFT';
  if (has('token_info') && has('balance')) return 'PRC-20 token';
  if (label.includes('nft')) return 'PRC-721 NFT';
  if (label.includes('prc20') || label.includes('token')) return 'PRC-20 token';

  // Inferred from code id (only valid for Paxi genesis contracts, not new ones)
  const codeId = String(contractInfo.code_id || '');
  if (codeId === '1') return 'PRC-20 token (by Code ID)';
  if (codeId === '2') return 'PRC-721 NFT (by Code ID)';
  return 'Custom contract';
}

/** Generate a parameter template for a query method */
function templateFor(method) {
  const m = method.toLowerCase();
  if (m === 'balance') return { balance: { address: 'enter the address to query here' } };
  if (m === 'allowance') return { allowance: { owner: 'paxi1...', spender: 'paxi1...' } };
  if (m === 'owner_of') return { owner_of: { token_id: '1', include_expired: false } };
  if (m === 'nft_info') return { nft_info: { token_id: '1' } };
  if (m === 'all_nft_info') return { all_nft_info: { owner: 'paxi1...' } };
  if (m === 'tokens') return { tokens: { owner: 'paxi1...', start_after: '', limit: 30 } };
  if (m === 'all_tokens') return { all_tokens: { start_after: '', limit: 30 } };
  if (m === 'minter') return { minter: {} };
  if (m === 'marketing_info') return { marketing_info: {} };
  if (m === 'contract_info') return { contract_info: {} };
  if (m === 'num_tokens') return { num_tokens: {} };
  if (m === 'token_info') return { token_info: {} };
  return { [method]: {} };
}

/* ============================================================ Public interface */

window.PaxiDecoder = {
  LCD, RPC,
  shortAddr, nameOf, setAddressBook, timeAgo,
  fmtCoin, formatUnits, formatToken, getJSON, getB64,
  extractFlows, buildStory, readMsg, labelOf, decodeContractMsg,
  probeSchema, classify, templateFor, esc,
  groupEvents, asArr, toBig, b64ToUtf8, EXEC_LABEL, VOTE_OPT,
};
