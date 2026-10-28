// ============================================================================
// Paxi Suite · Delegate / Undelegate / Unbonding-period management tool
// Dependencies: PaxiCosmJS, shared.js (escapeHtml/showStatus/showToast), core.js (state/currentLang)
// Note: i18n and signing logic are all encapsulated in this module; functions are registered globally to TOOL_REGISTRY to avoid naming conflicts.
// ============================================================================

window.TOOL_REGISTRY ||= {};

/* ------------------------------------------------ Dedicated i18n */
const SM_DICT = {
  en: {
    title: 'Delegate / Undelegate',
    desc: 'Delegate PAXI to a validator to earn staking rewards, or undelegate when needed (entering a ~7-day unbonding period). This tool charges no platform fee.',
    info: '💡 Rewards accrue per block after delegation; undelegated funds are locked for ~7 days before they become usable.',
    delegateSection: 'Delegate (stake)',
    undelegateSection: 'Undelegate (unstake)',
    unbondingSection: 'Unbonding (countdown)',
    delegateBtn: 'Delegate',
    undelegateBtn: 'Undelegate',
    connectFirst: 'Please connect wallet',
    confirmDelegate: (val, amt) => `Confirm delegation?\n\nTarget validator: ${val}\nAmount: ${amt} PAXI\n\nClick "OK" to sign in your wallet.`,
    confirmUndelegate: (val, amt) => `Confirm undelegation?\n\nCurrent delegation: ${val}\nAmount: ${amt} PAXI\n\n⚠️ Undelegated funds enter a ~7-day unbonding period and cannot be transferred or used. Click "OK" to sign in your wallet.`,
    success: '✅ Success',
    failPrefix: 'Failed: ',
    sdkErr: 'SDK does not support this message type',
    noDelegations: 'No delegations',
    loading: 'Loading...',
    unbondPeriod: 'Paxi unbonding period ~7 days',
    selectValidator: 'Select validator',
    selectDelegation: 'Select delegation',
    invalidAmt: 'Enter a valid amount',
    selectSource: 'Please select the current delegation to undelegate',
    amountLabel: 'Amount (PAXI)',
    unbondComplete: '✅ Unbonded',
    days: 'd', hours: 'h', mins: 'm', secs: 's'
  }
};
const smPt = (k, ...a) => {
  const lang = (typeof currentLang !== 'undefined' && currentLang) || 'en';
  let v;
  if (window.PAXI_LANGS && PAXI_LANGS[lang] && PAXI_LANGS[lang].stakeManage && PAXI_LANGS[lang].stakeManage[k] != null) {
    v = PAXI_LANGS[lang].stakeManage[k];
  } else {
    v = (SM_DICT[lang] && SM_DICT[lang][k] !== undefined) ? SM_DICT[lang][k] : SM_DICT.en[k];
  }
  return typeof v === 'function' ? v(...a) : v;
};

/* ------------------------------------------------ Module state */
let smUnbondTimer = null; // countdown timer, cleaned up on beforeUnmount
let smDelegationMap = {}; // validator_address -> amount(PAXI)

/* ------------------------------------------------ Render */
function renderStakeManage() {
  return `
    <div class="card">
      <div class="card-title">${smPt('title')}</div>
      <div class="tool-desc">${smPt('desc')}</div>
      <div class="info-box">
        <strong>${smPt('info')}</strong><br>
        <span style="font-size:11px;color:var(--text-muted);">⏳ ${smPt('unbondPeriod')}</span>
      </div>

      <div class="form-group">
        <label class="form-label">${smPt('delegateSection')}</label>
        <select id="smDelVal"></select>
        <input type="number" id="smDelAmt" step="0.000001" min="0" placeholder="${smPt('amountLabel')}" style="margin-top:8px;">
        <button class="btn btn-primary btn-block" style="margin-top:8px;" onclick="doDelegate()">${smPt('delegateBtn')}</button>
      </div>

      <div class="form-group">
        <label class="form-label">${smPt('undelegateSection')}</label>
        <select id="smUndelSrc"></select>
        <input type="number" id="smUndelAmt" step="0.000001" min="0" placeholder="${smPt('amountLabel')}" style="margin-top:8px;">
        <button class="btn btn-outline btn-block" style="margin-top:8px;" onclick="doUndelegate()">${smPt('undelegateBtn')}</button>
      </div>

      <div class="form-group">
        <label class="form-label">${smPt('unbondingSection')}</label>
        <div id="smUnbonding"></div>
      </div>

      <div class="status-msg" id="smStatus"></div>
    </div>
  `;
}

/* ------------------------------------------------ Mount */
async function loadStakeManage() {
  const statusEl = document.getElementById('smStatus');
  if (!statusEl) return;
  if (!state.connected) {
    statusEl.textContent = smPt('connectFirst');
    statusEl.className = 'status-msg warning';
    return;
  }
  statusEl.textContent = '';
  statusEl.className = 'status-msg';

  const addr = state.wallet.address;

  // 1) current delegations -> undelegate sources
  await smLoadDelegations(addr);

  // 2) unbonding delegations -> countdown
  await smLoadUnbonding(addr);

  // 3) validator list (paginated)
  await smLoadValidators();
}

async function smLoadDelegations(addr) {
  const sel = document.getElementById('smUndelSrc');
  if (!sel) return;
  sel.innerHTML = `<option value="">⏳ ${smPt('loading')}</option>`;
  try {
    const data = await fetchAPI(`/cosmos/staking/v1beta1/delegations/${addr}`);
    const delegations = data.delegation_responses || [];
    smDelegationMap = {};
    if (delegations.length === 0) {
      sel.innerHTML = `<option value="">${smPt('noDelegations')}</option>`;
      return;
    }
    sel.innerHTML = `<option value="">${smPt('selectDelegation')}</option>`;
    for (const d of delegations) {
      const vaddr = d.delegation.validator_address;
      const amountPaxi = (parseInt(d.balance.amount) / 1e6).toFixed(2);
      smDelegationMap[vaddr] = (parseInt(d.balance.amount) / 1e6);
      let moniker = vaddr.slice(0, 14);
      try {
        const cached = localStorage.getItem('paxi_validators_cache');
        if (cached) {
          const vals = (JSON.parse(cached).data?.validators || []);
          const v = vals.find(x => x.operator_address === vaddr);
          if (v && v.description?.moniker) moniker = v.description.moniker;
        }
      } catch (_) {}
      const label = `${moniker} (${amountPaxi} PAXI)`;
      sel.innerHTML += `<option value="${vaddr}">${label}</option>`;
    }
  } catch (e) {
    console.error('[StakeManage] delegation load failed:', e);
    sel.innerHTML = `<option value="">❌ ${escapeHtml(e.message)}</option>`;
  }
}

async function smLoadUnbonding(addr) {
  const box = document.getElementById('smUnbonding');
  if (!box) return;
  box.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">⏳ ${smPt('loading')}</div>`;
  try {
    const data = await fetchAPI(`/cosmos/staking/v1beta1/delegators/${addr}/unbonding_delegations`);
    const responses = data.unbonding_responses || [];
    if (responses.length === 0) {
      box.innerHTML = `<div style="font-size:12px;color:var(--text-muted);">${smPt('noDelegations')}</div>`;
      return;
    }
    box.innerHTML = '';
    for (const r of responses) {
      const vaddr = r.validator_address;
      for (const e of (r.entries || [])) {
        const amountPaxi = (parseInt(e.balance) / 1e6).toFixed(2);
        const comp = e.completion_time;
        const row = document.createElement('div');
        row.style.cssText = 'padding:8px 10px;margin-bottom:8px;background:var(--bg);border-radius:8px;font-size:13px;';
        row.innerHTML =
          `<div><span style="color:var(--text-muted);">Validator:</span>${escapeHtml(vaddr.slice(0, 14))}…</div>` +
          `<div><span style="color:var(--text-muted);">Amount:</span>${amountPaxi} PAXI</div>` +
          `<div class="sm-countdown" data-comp="${escapeHtml(comp)}" style="color:var(--primary);font-weight:600;margin-top:4px;"></div>`;
        box.appendChild(row);
      }
    }
    smStartCountdown();
  } catch (e) {
    console.error('[StakeManage] unbonding load failed:', e);
    box.innerHTML = `<div style="font-size:12px;color:var(--danger);">❌ ${escapeHtml(e.message)}</div>`;
  }
}

function smStartCountdown() {
  if (smUnbondTimer) clearInterval(smUnbondTimer);
  const tick = () => {
    const nodes = document.querySelectorAll('.sm-countdown');
    if (nodes.length === 0) { clearInterval(smUnbondTimer); smUnbondTimer = null; return; }
    const now = Date.now();
    nodes.forEach(n => {
      const comp = new Date(n.dataset.comp).getTime();
      let diff = comp - now;
      if (diff <= 0) {
        n.textContent = smPt('unbondComplete');
        n.style.color = 'var(--success)';
        return;
      }
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      n.textContent = `${d} ${smPt('days')} ${h} ${smPt('hours')} ${m} ${smPt('mins')} ${s} ${smPt('secs')} ${smPt('remaining')}`;
    });
  };
  tick();
  smUnbondTimer = setInterval(tick, 1000);
}

// The cached loader lives in shared.js; if a STALE cached shared.js is loaded (without it) we
// fall back to fetching the pages directly, so the tool never breaks.
async function _smValidators(opts) {
  if (typeof loadValidatorsCached === 'function') return loadValidatorsCached(opts);
  const all = []; let nextKey = null;
  for (let page = 0; page < 6; page++) {
    const q = nextKey
      ? `/cosmos/staking/v1beta1/validators?pagination.limit=100&pagination.key=${encodeURIComponent(nextKey)}`
      : '/cosmos/staking/v1beta1/validators?pagination.limit=100';
    const data = await fetchAPI(q);
    const list = data.validators || [];
    all.push(...list);
    if (opts && opts.onPage) { try { opts.onPage(all.slice()); } catch (_) {} }
    nextKey = data.pagination?.next_key || null;
    if (!nextKey || !list.length) break;
  }
  return all;
}

async function smLoadValidators() {
  const sel = document.getElementById('smDelVal');
  if (!sel) return;
  sel.innerHTML = `<option value="">⏳ ${smPt('loading')}</option>`;
  try {
    // shared loader: memory + localStorage cache (second tool opens instantly),
    // and the first page renders right away while the remaining pages fill in behind it
    const all = await _smValidators({
      onPage: (partial) => { if (partial && partial.length) smRenderValidatorOptions(partial); }
    });
    smRenderValidatorOptions(all);
  } catch (e) {
    console.error('[StakeManage] validator load failed:', e);
    sel.innerHTML = `<option value="">❌ ${escapeHtml(e.message)}</option>`;
  }
}

function smRenderValidatorOptions(all) {
  const sel = document.getElementById('smDelVal');
  if (!sel || !all || !all.length) return;
  const cur = sel.value;
  const rank = v => (v.status === 'BOND_STATUS_BONDED' && !v.jailed) ? 0 : 1;
  const sorted = [...all].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return parseInt(b.tokens || 0) - parseInt(a.tokens || 0);
  });
  sel.innerHTML = `<option value="">${smPt('selectValidator')}</option>`;
  for (const v of sorted) {
    const commission = (parseFloat(v.commission?.commission_rates?.rate || 0) * 100).toFixed(1);
    const moniker = v.description?.moniker || v.operator_address.slice(0, 12);
    const active = (v.status === 'BOND_STATUS_BONDED' && !v.jailed);
    const suffix = active ? '' : ' ⚠️Inactive';
    sel.innerHTML += `<option value="${v.operator_address}">${moniker} · ${commission}%${suffix}</option>`;
  }
  if (cur) sel.value = cur;
}

/* ------------------------------------------------ Delegate */
async function doDelegate() {
  if (!state.connected) { showToast(smPt('connectFirst'), 'error'); return; }
  const sel = document.getElementById('smDelVal').value;
  const amt = parseFloat(document.getElementById('smDelAmt').value);
  const statusEl = document.getElementById('smStatus');
  if (!sel) { showStatus('smStatus', smPt('selectValidator'), 'warning'); return; }
  if (!amt || amt <= 0) { showStatus('smStatus', smPt('invalidAmt'), 'warning'); return; }

  if (!confirm(smPt('confirmDelegate', sel, amt.toFixed(6)))) return;

  statusEl.textContent = '⏳ Signing & broadcasting...';
  statusEl.className = 'status-msg';
  try {
    if (typeof PaxiCosmJS.MsgDelegate === 'undefined') throw new Error(smPt('sdkErr'));
    const amountMicro = (amt * 1e6).toFixed(0);
    const m = PaxiCosmJS.MsgDelegate.fromPartial({
      delegator_address: state.wallet.address,
      validator_address: sel,
      amount: { denom: CONFIG.denom, amount: amountMicro }
    });
    const anyMsg = PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: PaxiCosmJS.MsgDelegate.encode(m).finish()
    });
    const res = await buildSignAndBroadcast([anyMsg], 'Paxi Suite Delegate', null, state.wallet);
    const r = checkTxResult(res);
    if (r.ok) {
      showStatus('smStatus', `${smPt('success')} TxHash: ${r.txhash.slice(0, 20)}...`, 'success');
      pollTxStatus(r.txhash);
      showToast(smPt('success'), 'success');
      await smLoadDelegations(state.wallet.address);
    } else {
      showStatus('smStatus', smPt('failPrefix') + mapError(r.code, r.rawLog), 'error');
    }
  } catch (e) {
    showStatus('smStatus', smPt('failPrefix') + e.message, 'error');
  }
}

/* ------------------------------------------------ Undelegate */
async function doUndelegate() {
  if (!state.connected) { showToast(smPt('connectFirst'), 'error'); return; }
  const sel = document.getElementById('smUndelSrc').value;
  const amt = parseFloat(document.getElementById('smUndelAmt').value);
  const statusEl = document.getElementById('smStatus');
  if (!sel) { showStatus('smStatus', smPt('selectSource'), 'warning'); return; }
  if (!amt || amt <= 0) { showStatus('smStatus', smPt('invalidAmt'), 'warning'); return; }

  if (!confirm(smPt('confirmUndelegate', sel, amt.toFixed(6)))) return;

  statusEl.textContent = '⏳ Signing & broadcasting...';
  statusEl.className = 'status-msg';
  try {
    if (typeof PaxiCosmJS.MsgUndelegate === 'undefined') throw new Error(smPt('sdkErr'));
    const amountMicro = (amt * 1e6).toFixed(0);
    const m = PaxiCosmJS.MsgUndelegate.fromPartial({
      delegator_address: state.wallet.address,
      validator_address: sel,
      amount: { denom: CONFIG.denom, amount: amountMicro }
    });
    const anyMsg = PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
      value: PaxiCosmJS.MsgUndelegate.encode(m).finish()
    });
    const res = await buildSignAndBroadcast([anyMsg], 'Paxi Suite Undelegate', null, state.wallet);
    const r = checkTxResult(res);
    if (r.ok) {
      showStatus('smStatus', `${smPt('success')} TxHash: ${r.txhash.slice(0, 20)}...`, 'success');
      pollTxStatus(r.txhash);
      showToast(smPt('success'), 'success');
      await smLoadDelegations(state.wallet.address);
      await smLoadUnbonding(state.wallet.address);
    } else {
      showStatus('smStatus', smPt('failPrefix') + mapError(r.code, r.rawLog), 'error');
    }
  } catch (e) {
    showStatus('smStatus', smPt('failPrefix') + e.message, 'error');
  }
}

/* ------------------------------------------------ Bind / cleanup */
function bindStakeManage() {
  // current interactions are triggered via inline onclick; if the shell provides an unmount hook, the timer can be cleaned up here
}

// if the shell supports beforeUnmount, clean up the countdown timer to avoid memory leaks
if (typeof window.TOOL_REGISTRY !== 'undefined') {
  // beforeUnmount is called by core.js when switching tools (optional)
  const _origRegister = window.TOOL_REGISTRY['stake-manage'];
}

window.TOOL_REGISTRY['stake-manage'] = {
  render: renderStakeManage,
  bind: bindStakeManage,
  onMount: loadStakeManage,
  beforeUnmount: () => { if (smUnbondTimer) { clearInterval(smUnbondTimer); smUnbondTimer = null; } }
};
