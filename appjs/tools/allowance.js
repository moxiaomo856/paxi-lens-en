/* ============================================================================
 * Paxi Suite · Allowance Management module
 * Official reference: PAXI CLI command §1.13 (increase_allowance → swap module example)
 *   - Query: GET /cosmwasm/wasm/v1/contract/{c}/smart/{b64({"allowance":{owner,spender}})}
 *   - Execute: MsgExecuteContract { increase_allowance | decrease_allowance: {spender, amount} }
 * Positioning: security tool. View/tighten any PRC-20 allowance; revoke = decrease to 0. Free, on-chain gas only.
 * ==========================================================================*/

window.TOOL_REGISTRY ||= {};

(function () {
  'use strict';

  /* ---------------------------------------------- i18n (in-tool dictionary, zh/en mirrored) */
  const AL_DICT = {
  en: {
      title: '🔑 Allowance Manager',
      desc: 'View and manage token allowances you granted to other addresses (e.g. the Swap module). An allowance is like a "direct-debit limit": the larger it is, the bigger the risk — tighten it when done. Free tool, on-chain gas only.',
      contractLabel: 'PRC-20 contract address',
      ownerLabel: 'Owner (whose allowance)',
      spenderLabel: 'Spender (who can spend)',
      spenderHint: 'Common: Swap module (official swap module address)',
      spenderCustom: 'Custom address',
      queryBtn: '🔍 Query allowance',
      amountLabel: 'Amount (in display units, e.g. 100)',
      increaseBtn: '➕ Increase',
      decreaseBtn: '➖ Decrease',
      revokeBtn: '🚫 Revoke all',
      querying: 'Querying...',
      noAllowance: 'No allowance found (current limit is 0)',
      allowanceResult: 'Current allowance',
      balanceLabel: 'Owner balance',
      confirmIncrease: 'Confirm increase?\n\n· Contract: {0}\n· Spender: {1}\n· Increase by: {2}\n· Fee: none (on-chain gas only)',
      confirmDecrease: 'Confirm decrease?\n\n· Contract: {0}\n· Spender: {1}\n· Decrease by: {2}\n· Fee: none (on-chain gas only)',
      confirmRevoke: 'Confirm revoke ALL?\n\n· Contract: {0}\n· Spender: {1}\n· Revoked: {2} (set to zero — they can no longer move your tokens)\n· Fee: none (on-chain gas only)',
      success: '✅ Done — allowance updated!',
      failPrefix: '❌ Failed: ',
      connectFirst: 'Please connect your wallet first (top-right)',
      badContract: 'Please enter a valid PRC-20 contract address (paxi1...)',
      badAddr: 'Invalid address (full paxi1... address required)',
      badAmount: 'Please enter an amount greater than 0',
      noQueryYet: 'Query the current allowance first',
      queryingTx: '⏳ Signing & broadcasting...',
      done: 'Done',
      viewTx: '🧭 Inspect this tx in the Decoder',
      tokenFail: 'Failed to read token info (is this a PRC-20 contract?)',
      unlimitedNote: '⚠️ Note: revoke = reduce to 0 in one shot; the spender cannot touch your tokens again unless you re-approve.'
    }
  };
  const alPt = (k, ...a) => {
    const lang = (typeof currentLang !== 'undefined' && currentLang) || 'zh';
    let s = (AL_DICT[lang] && AL_DICT[lang][k]) || AL_DICT.en[k] || k;
    a.forEach((v, i) => { s = s.split('{' + i + '}').join(String(v)); });
    return s;
  };

  const esc = (s) => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s);
  const LCD = () => (typeof getLCD === 'function' ? getLCD() : 'https://mainnet-lcd.paxinet.io');
  const ADDR_RE = /^paxi1[0-9a-z]{38}$/;

  /* Official Swap module address (PAXI CLI command §1.13/§1.16, DApp guide §3.8) */
  const SWAP_MODULE = 'paxi1mfru9azs5nua2wxcd4sq64g5nt7nn4n80r745t';

  let tokenInfo = null;   // {symbol, decimals, name}
  let lastContract = '';
  let curAllowance = '';  // raw unit string
  let tokenSymbol = '';

  const b64q = (obj) => btoa(JSON.stringify(obj));

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function loadTokenInfo(contract) {
    if (tokenInfo && lastContract === contract) return tokenInfo;
    const data = await fetchJSON(`${LCD()}/cosmwasm/wasm/v1/contract/${contract}/smart/${b64q({ token_info: {} })}`);
    if (!data.data || data.data.decimals === undefined) throw new Error(alPt('tokenFail'));
    tokenInfo = { symbol: data.data.symbol || '', decimals: Number(data.data.decimals) || 6, name: data.data.name || '' };
    tokenSymbol = tokenInfo.symbol;
    lastContract = contract;
    return tokenInfo;
  }

  /* Display unit → raw unit (BigInt, no floating-point error) */
  function toRaw(input, decimals) {
    const v = (typeof parseFloatToRawUnits === 'function')
      ? parseFloatToRawUnits(String(input).trim(), decimals)
      : null;
    if (!v || v === '0') return '';
    return v;
  }

  /* Raw unit → display unit (for display) */
  function fmtRaw(raw, decimals) {
    try {
      if (window.PaxiDecoder && window.PaxiDecoder.formatUnits) {
        return window.PaxiDecoder.formatUnits(String(raw), '', decimals);
      }
    } catch (_) {}
    const neg = String(raw).startsWith('-');
    const s = String(raw).replace('-', '');
    const p = s.length > decimals ? [s.slice(0, s.length - decimals), s.slice(s.length - decimals)] : ['0', s.padStart(decimals, '0')];
    return (neg ? '-' : '') + p[0] + '.' + p[1].replace(/0+$/, '').replace(/\.$/, '');
  }

  /* ---------------------------------------------- Query */
  async function doQuery() {
    const out = document.getElementById('alResult');
    const contract = (document.getElementById('alContract').value || '').trim().toLowerCase();
    const owner = (document.getElementById('alOwner').value || '').trim().toLowerCase();
    const spender = getSpender();
    if (!ADDR_RE.test(contract)) { showStatus('alStatus', alPt('badContract'), 'warning'); return; }
    if (!ADDR_RE.test(owner)) { showStatus('alStatus', alPt('badAddr'), 'warning'); return; }
    if (!ADDR_RE.test(spender)) { showStatus('alStatus', alPt('badAddr'), 'warning'); return; }

    out.innerHTML = `<div class="status-msg">${esc(alPt('querying'))}</div>`;
    try {
      const ti = await loadTokenInfo(contract);
      const [al, bal] = await Promise.all([
        fetchJSON(`${LCD()}/cosmwasm/wasm/v1/contract/${contract}/smart/${b64q({ allowance: { owner, spender } })}`),
        fetchJSON(`${LCD()}/cosmwasm/wasm/v1/contract/${contract}/smart/${b64q({ balance: { address: owner } })}`).catch(() => null),
      ]);
      curAllowance = String((al.data && al.data.allowance) || '0');
      const balStr = bal && bal.data && bal.data.balance ? String(bal.data.balance) : null;
      const zero = /^0+$/.test(curAllowance) || curAllowance === '';
      out.innerHTML = `
        <div class="card" style="margin-top:10px">
          <div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:.88rem"><span>${esc(alPt('allowanceResult'))}</span><b>${zero ? esc(alPt('noAllowance')) : esc(fmtRaw(curAllowance, ti.decimals)) + ' ' + esc(ti.symbol)}</b></div>
          <div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;font-size:.72rem;color:var(--text-muted)"><span>raw</span><span class="mono">${esc(curAllowance)}</span></div>
          ${balStr ? `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:.88rem"><span>${esc(alPt('balanceLabel'))}</span><b>${esc(fmtRaw(balStr, ti.decimals))} ${esc(ti.symbol)}</b></div>` : ''}
        </div>
        <div style="margin-top:8px;font-size:.82rem;color:var(--text-muted);line-height:1.6">${esc(alPt('unlimitedNote'))}</div>`;
      showStatus('alStatus', alPt('done'), 'success');
    } catch (e) {
      out.innerHTML = '';
      showStatus('alStatus', alPt('failPrefix') + (e.message || e), 'error');
    }
  }

  function getSpender() {
    const sel = document.getElementById('alSpenderSel').value;
    if (sel === 'swap') return SWAP_MODULE;
    return (document.getElementById('alSpender').value || '').trim().toLowerCase();
  }

  /* ---------------------------------------------- Execute (increase/decrease/revoke) */
  async function doAction(kind) {
    if (typeof state === 'undefined' || !state.connected) { showToast(alPt('connectFirst'), 'error'); return; }
    const contract = (document.getElementById('alContract').value || '').trim().toLowerCase();
    const owner = (document.getElementById('alOwner').value || '').trim().toLowerCase();
    const spender = getSpender();
    if (!ADDR_RE.test(contract)) { showStatus('alStatus', alPt('badContract'), 'warning'); return; }
    if (!ADDR_RE.test(spender)) { showStatus('alStatus', alPt('badAddr'), 'warning'); return; }
    if (owner && owner !== state.wallet.address) { /* Allowed: executor must be self, owner is only for display/validation */ }

    const decimals = tokenInfo ? tokenInfo.decimals : 6;
    let raw = '';
    if (kind !== 'revoke') {
      const input = (document.getElementById('alAmount').value || '').trim();
      raw = toRaw(input, decimals);
      if (!raw) { showStatus('alStatus', alPt('badAmount'), 'warning'); return; }
    } else {
      if (!curAllowance || /^0+$/.test(curAllowance)) { showStatus('alStatus', alPt('noQueryYet'), 'warning'); return; }
      raw = curAllowance.replace(/^0+(?=\d)/, '');
    }
    const shown = fmtRaw(raw, decimals);

    const msgKey = 'confirm' + (kind === 'increase' ? 'Increase' : kind === 'decrease' ? 'Decrease' : 'Revoke');
    if (!confirm(alPt(msgKey, contract, spender, shown + ' ' + (tokenSymbol || '')))) return;

    const btns = ['alInc', 'alDec', 'alRev'].map(id => document.getElementById(id));
    btns.forEach(b => { if (b) b.disabled = true; });
    showStatus('alStatus', alPt('queryingTx'), 'info');
    try {
      const action = kind === 'revoke' ? 'decrease_allowance' : (kind + '_allowance');
      const msgObj = { [action]: { spender, amount: String(raw) } };
      const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({
        sender: state.wallet.address,
        contract,
        msg: new TextEncoder().encode(JSON.stringify(msgObj)),
        funds: [],
      });
      const any = PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish(),
      });
      const res = await buildSignAndBroadcast([any], 'Paxi Suite Allowance ' + kind, null, state.wallet);
      const r = checkTxResult(res);
      if (!r.ok) throw new Error(mapError(r.code, r.rawLog));
      const final = (typeof pollTxStatus === 'function') ? await pollTxStatus(r.txhash) : null;
      if (final && final.confirmed && !final.success) throw new Error(mapError(final.code, final.rawLog));
      showStatus('alStatus', `${alPt('success')} TxHash: ${r.txhash.slice(0, 20)}…`, 'success');
      showToast(alPt('success'), 'success');
      const out = document.getElementById('alResult');
      if (out) out.insertAdjacentHTML('beforeend',
        `<div style="margin-top:8px"><a href="${location.pathname}?tool=decoder&hash=${esc(r.txhash)}" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px">${esc(alPt('viewTx'))}</a></div>`);
      if (kind !== 'increase') { curAllowance = '0'; }
    } catch (e) {
      showStatus('alStatus', alPt('failPrefix') + (e.message || e), 'error');
    } finally {
      btns.forEach(b => { if (b) b.disabled = false; });
    }
  }

  /* ---------------------------------------------- Render & bind */
  function render() {
    const me = (typeof state !== 'undefined' && state.wallet && state.wallet.address) ? state.wallet.address : '';
    return `
    <div id="pg-allowance">
      <div class="card">
        <div class="card-title">${esc(alPt('title'))}</div>
        <div class="tool-desc">${esc(alPt('desc'))}</div>

        <div class="form-group">
          <label class="form-label">${esc(alPt('contractLabel'))}</label>
          <input type="text" id="alContract" placeholder="paxi1..." class="mono">
        </div>
        <div class="form-group">
          <label class="form-label">${esc(alPt('ownerLabel'))}</label>
          <input type="text" id="alOwner" placeholder="paxi1..." class="mono" value="${esc(me)}">
        </div>
        <div class="form-group">
          <label class="form-label">${esc(alPt('spenderLabel'))}</label>
          <select id="alSpenderSel">
            <option value="swap">${esc(alPt('spenderHint'))}</option>
            <option value="custom">${esc(alPt('spenderCustom'))}</option>
          </select>
          <input type="text" id="alSpender" placeholder="paxi1..." class="mono" style="margin-top:6px;display:none">
        </div>

        <button class="btn btn-outline btn-block" id="alQuery">${esc(alPt('queryBtn'))}</button>
        <div class="status-msg" id="alStatus"></div>
        <div id="alResult"></div>

        <div class="form-group" style="margin-top:14px">
          <label class="form-label">${esc(alPt('amountLabel'))}</label>
          <input type="text" id="alAmount" placeholder="100">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="alInc">${esc(alPt('increaseBtn'))}</button>
          <button class="btn btn-outline" id="alDec">${esc(alPt('decreaseBtn'))}</button>
          <button class="btn btn-outline" id="alRev" style="border-color:var(--danger);color:var(--danger)">${esc(alPt('revokeBtn'))}</button>
        </div>
      </div>
    </div>`;
  }

  window.TOOL_REGISTRY['allowance'] = {
    render,
    onMount() {
      /* owner pre-filled with connected address */
      const me = (typeof state !== 'undefined' && state.wallet && state.wallet.address) || '';
      const ownerEl = document.getElementById('alOwner');
      if (ownerEl && me && !ownerEl.value) ownerEl.value = me;
    },
    bind() {
      document.getElementById('alQuery').addEventListener('click', doQuery);
      document.getElementById('alContract').addEventListener('change', () => { tokenInfo = null; lastContract = ''; curAllowance = ''; document.getElementById('alResult').innerHTML = ''; });
      document.getElementById('alSpenderSel').addEventListener('change', (e) => {
        document.getElementById('alSpender').style.display = e.target.value === 'custom' ? '' : 'none';
      });
      document.getElementById('alInc').addEventListener('click', () => doAction('increase'));
      document.getElementById('alDec').addEventListener('click', () => doAction('decrease'));
      document.getElementById('alRev').addEventListener('click', () => doAction('revoke'));
    },
  };
})();
