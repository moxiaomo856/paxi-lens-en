// anti-duplicate-submit: record the signature of the last submitted "source->target, amount" and its result, blocking identical failed re-submissions (to avoid charging the service fee twice)
let rdLastSig = '';
let rdLastFailed = false;

TOOL_REGISTRY['redelegate'] = { render: renderRedelegate, onMount: loadRedelegateData };

function renderRedelegate() {
  return `
    <div class="card">
      <div class="card-title">${t('redelegate.title')}</div>
      <div class="tool-desc">${t('redelegate.desc')}</div>
      <div class="info-box">
        <strong>💡 ${t('redelegate.hint')}</strong><br>
        <span style="font-size:11px;color:var(--text-muted);">📊 Service fee: flat 0.15% (1.5 per mille)</span>
      </div>
      <div class="form-group">
        <label class="form-label">Validator data <span style="font-size:11px;color:var(--text-muted);">(auto-loaded; use the button to refresh)</span></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-outline" id="rdLoadValidatorsBtn" onclick="loadValidatorsManually()" style="min-height:42px;flex:1;">🔄 Refresh validator data</button>
        </div>
        <div style="margin-top:6px;">
          <span id="rdToStatus" style="font-size:11px;color:var(--text-muted);">⏳ Loading validators…</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('redelegate.from')} <span id="rdFromLoading" style="font-size:11px;color:var(--primary);"></span></label>
        <select id="rdFrom" onchange="updateRdPreview()" ${!state.connected ? 'disabled' : ''}>
          <option value="">${state.connected ? '⏳ Loading...' : t('redelegate.selectFrom')}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('redelegate.to')} <span id="rdToLoading" style="font-size:11px;color:var(--primary);"></span></label>
        <select id="rdTo" onchange="updateRdPreview()" disabled>
          <option value="">⏳ Loading validator data…</option>
        </select>
        <div id="rdTargetWarn" style="display:none;margin-top:6px;font-size:11px;color:#ffd700;line-height:1.5;"></div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('redelegate.amount')}</label>
        <div style="display:flex;gap:8px;">
          <input type="number" id="rdAmount" placeholder="0" step="0.000001" min="0" oninput="updateRdPreview()">
          <button class="btn btn-outline btn-sm" onclick="setMaxRedelegate()" style="min-height:44px;">${t('redelegate.max')}</button>
        </div>
      </div>
      <div id="rdPreview" style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:16px;display:none;">
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>${t('redelegate.feeRate')}</span>
          <span id="rdFeeRateDisplay" style="color:var(--primary);font-weight:600;">-</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:4px;">
          <span>${t('redelegate.fee')}</span>
          <span id="rdFeeDisplay" style="color:var(--primary);font-weight:600;">-</span>
        </div>
      </div>
      <div style="margin:0 0 12px;padding:8px 12px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;font-size:12px;color:#ffd700;line-height:1.6;">
        ${t('disclaimer.redelegate')}
      </div>
      <button class="btn btn-success btn-block" id="btnRedelegate" onclick="executeRedelegate()">
        ${t('redelegate.execute')}
      </button>
      <div class="status-msg" id="rdStatus"></div>
    </div>
  `;
}

async function withTimeout(promise, ms, name) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(`${name || 'Request'} timed out (${(ms/1000).toFixed(0)}s), click retry`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function loadRedelegateData() {
  // The validator list does not depend on the wallet -> auto-load it (cache hit = instant, no waiting).
  // The "from" (current staking validator) needs a connected wallet, so it only loads when connected.
  loadValidatorsAuto();
  if (!state.connected) return;
  const address = state.wallet.address;
  loadDelegationsOnly(address);
}

async function loadDelegationsOnly(address) {
  if (!address && state.wallet) address = state.wallet.address;
  if (!address) return;
  const fromSel = document.getElementById('rdFrom');
  const fromLoading = document.getElementById('rdFromLoading');
  try {
    const cacheKey = 'paxi_my_delegations_cache';
    const delData = await withTimeout(
      fetchAPI(`/cosmos/staking/v1beta1/delegations/${address}`),
      8000,
      'Querying your delegations'
    );
    const delegations = delData.delegation_responses || [];
    // write cache (30s TTL)
    try { localStorage.setItem(cacheKey, JSON.stringify({ data: delData, ts: Date.now() })); } catch (_) {}

    // read validator cache in parallel (for moniker display)
    let valMap = {};
    try {
      const cachedVal = localStorage.getItem('paxi_validators_cache');
      if (cachedVal) {
        const validators = (JSON.parse(cachedVal).data?.validators || []);
        validators.forEach(v => { valMap[v.operator_address] = v; });
      }
    } catch (_) {}

    populateFromSelect(delegations, valMap, '');
    if (fromLoading) fromLoading.textContent = '';
  } catch (e) {
    console.error('[Redelegate] delegation load failed:', e);
    if (fromSel && fromSel.options.length <= 1 && fromSel.options[0]?.textContent?.includes('Loading')) {
      fromSel.innerHTML = `<option value="">❌ Load failed: ${e.message}, please retry</option>`;
    }
    if (fromLoading) fromLoading.innerHTML = `<span style="color:var(--danger);">❌ ${e.message}</span>`;
  }
}

// Load the validator list. The cached loader lives in shared.js; if a STALE cached shared.js is
// loaded (without it) we fall back to fetching the pages directly, so the tool never breaks.
async function _rdValidators(opts) {
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

// Manual refresh — also the retry entry when auto-loading failed
async function loadValidatorsManually() {
  return loadValidatorsAuto(true);
}

// Auto-load the validator list (wallet-independent).
// Cache hit -> instant; otherwise the first page renders right away and the rest fills in behind it.
async function loadValidatorsAuto(force) {
  const btn = document.getElementById('rdLoadValidatorsBtn');
  const status = document.getElementById('rdToStatus');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Loading...'; }
  if (status) { status.textContent = '⏳ Loading validators...'; status.style.color = 'var(--text-muted)'; }
  try {
    const all = await _rdValidators({
      force: !!force,
      onPage: (partial) => { if (partial && partial.length) applyRdValidators(partial, false); }
    });
    applyRdValidators(all, true);
    if (force) {
      const bonded = all.filter(v => v.status === 'BOND_STATUS_BONDED' && !v.jailed).length;
      showToast(`✅ Loaded ${all.length} validators (active ${bonded})`, 'success');
    }
  } catch (e) {
    console.error('[Redelegate] validator load failed:', e);
    if (status) { status.textContent = '❌ Load failed, please retry'; status.style.color = 'var(--danger)'; }
    showToast('❌ Failed to load validators: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🔄 Refresh validator data'; }
  }
}

// Populate the target-validator dropdown. complete=false means "more pages are still loading".
function applyRdValidators(all, complete) {
  if (!all || !all.length) return;
  const toSel = document.getElementById('rdTo');
  const status = document.getElementById('rdToStatus');
  const cur = toSel ? toSel.value : '';
  populateToSelect(all);
  if (toSel) {
    // unlock target validator selection as soon as we have any data
    toSel.disabled = false;
    if (cur) toSel.value = cur;
  }
  // backfill the "from" moniker (if a local delegation cache exists)
  try {
    const cachedDel = localStorage.getItem('paxi_my_delegations_cache');
    if (cachedDel) {
      const delegations = (JSON.parse(cachedDel).data?.delegation_responses || []);
      if (delegations.length > 0) {
        const valMap = {};
        all.forEach(v => { valMap[v.operator_address] = v; });
        const currentFrom = document.getElementById('rdFrom')?.value;
        populateFromSelect(delegations, valMap, '');
        if (currentFrom) document.getElementById('rdFrom').value = currentFrom;
      }
    }
  } catch (_) {}
  const bonded = all.filter(v => v.status === 'BOND_STATUS_BONDED' && !v.jailed).length;
  if (status) {
    if (complete) {
      status.innerHTML = `✅ Loaded ${all.length} validators (active ${bonded} / inactive ${all.length - bonded})`;
      status.style.color = 'var(--success)';
    } else {
      status.textContent = `⏳ Loaded ${all.length} validators, loading more…`;
      status.style.color = 'var(--text-muted)';
    }
  }
}

function populateFromSelect(delegations, valMap, suffix) {
  const fromSel = document.getElementById('rdFrom');
  if (!fromSel) return;
  if (delegations.length === 0) {
    fromSel.innerHTML = `<option value="">${t('redelegate.noDelegations')}</option>`;
    return;
  }
  fromSel.innerHTML = `<option value="">${t('redelegate.selectFrom')}${suffix}</option>`;
  for (const d of delegations) {
    const val = valMap ? valMap[d.delegation.validator_address] : null;
    const amountPaxi = (parseInt(d.balance.amount) / 1e6).toFixed(2);
    const label = val
      ? `${val.description?.moniker || val.operator_address?.slice(0, 12)} (${amountPaxi} PAXI)`
      : `${d.delegation.validator_address.slice(0, 14)}... (${amountPaxi} PAXI)`;
    fromSel.innerHTML += `<option value="${d.delegation.validator_address}" data-amount="${(parseInt(d.balance.amount)/1e6).toFixed(6)}">${label}</option>`;
  }
}

function populateToSelect(validators) {
  const toSel = document.getElementById('rdTo');
  if (!toSel) return;
  toSel.innerHTML = `<option value="">${t('redelegate.selectTo')}</option>`;
  // sort: active validators first (within group by stake descending), then unbonding, then candidates;
  // all validators (including inactive) are loaded and labeled by status, keeping the count consistent with the "Validator Compare" page
  const rank = v => (v.status === 'BOND_STATUS_BONDED' && !v.jailed) ? 0 : (v.status === 'BOND_STATUS_UNBONDING' ? 1 : 2);
  const sorted = [...validators].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return parseInt(b.tokens || 0) - parseInt(a.tokens || 0);
  });
  for (const v of sorted) {
    const commission = parseFloat(v.commission?.commission_rates?.rate || 0) * 100;
    const moniker = v.description?.moniker || v.operator_address.slice(0, 12);
    const tokens = (parseInt(v.tokens || 0) / 1e6).toFixed(0);
    let badge;
    if (v.status === 'BOND_STATUS_BONDED') badge = v.jailed ? '🚫 Active but jailed' : '✅ Active';
    else if (v.status === 'BOND_STATUS_UNBONDING') badge = '⏳ Unbonding';
    else badge = v.jailed ? '🚫 Candidate (jailed)' : '⚠️ Candidate';
    toSel.innerHTML += `<option value="${v.operator_address}" data-status="${badge}">${badge} ${moniker} · ${commission.toFixed(1)}% · ${tokens.toLocaleString()} PAXI staked</option>`;
  }
}

function updateRdPreview() {
  const from = document.getElementById('rdFrom').value;
  const to = document.getElementById('rdTo').value;
  const amount = parseFloat(document.getElementById('rdAmount').value) || 0;
  const preview = document.getElementById('rdPreview');
  if (from && to && amount > 0) {
    preview.style.display = 'block';
    let feeRate, fee;
    feeRate = 0.0015;
    fee = amount * feeRate;
    document.getElementById('rdFeeRateDisplay').textContent = (feeRate * 100).toFixed(2) + '%';
    document.getElementById('rdFeeDisplay').textContent = fee.toFixed(4) + ' PAXI';
  } else {
    preview.style.display = 'none';
  }
  // target validator status hint: inactive validators don't participate in block production or reward distribution; rewards pause after migration
  const warn = document.getElementById('rdTargetWarn');
  if (warn) {
    const opt = document.getElementById('rdTo').selectedOptions[0];
    const st = opt?.dataset?.status || '';
    if (from && to && amount > 0 && st && !st.startsWith('✅')) {
      warn.style.display = 'block';
      warn.textContent = `⚠️ The target validator is currently "${st}": inactive validators don't participate in block production or reward distribution, so rewards pause after migration until the validator is reactivated. For stable rewards, choose a "✅ Active" validator.`;
    } else {
      warn.style.display = 'none';
    }
  }
}

function setMaxRedelegate() {
  const from = document.getElementById('rdFrom').value;
  if (!from) return;
  const option = document.querySelector(`#rdFrom option[value="${from}"]`);
  if (option) {
    const max = parseFloat(option.dataset.amount) || 0;
    document.getElementById('rdAmount').value = max;
    updateRdPreview();
  }
}

async function executeRedelegate() {
  if (!state.connected) {
    showToast(t('common.connectFirst'), 'error');
    return;
  }
  const from = document.getElementById('rdFrom').value;
  const to = document.getElementById('rdTo').value;
  const amount = parseFloat(document.getElementById('rdAmount').value);
  const toSel = document.getElementById('rdTo');
  if (toSel && toSel.disabled) {
    showStatus('rdStatus', 'Please click the "📋 Load validator data" button first, then select a target validator after loading completes.', 'warning');
    return;
  }
  if (!from || !to || !amount || amount <= 0) {
    showStatus('rdStatus', t('redelegate.invalidInput'), 'warning');
    return;
  }

  // anti-duplicate-submit: if the same (source->target, amount) already failed, block it directly to avoid re-charging the service fee
  const rdSig = `${from}->${to}:${amount}`;
  if (rdLastSig === rdSig && rdLastFailed) {
    showStatus('rdStatus', '⚠️ An identical transaction was already submitted and failed; duplicate submission has been automatically blocked. Errors like this ("redelegation in progress") won\'t succeed on retry and only re-charge the service fee. Please change the validator or amount and try again.', 'warning');
    showToast('⚠️ Identical transaction already failed; duplicate submission blocked', 'error');
    return;
  }

  let feeRate, fee;
  feeRate = 0.0015;
  fee = amount * feeRate;
  if (fee < 0.000001) fee = 0.000001;

  const toSelRd = document.getElementById('rdTo');
  const toLabel = (toSelRd && toSelRd.options[toSelRd.selectedIndex]) ? toSelRd.options[toSelRd.selectedIndex].text : to;
  const okRd = confirm(
    `Confirm staking redelegation?\n\n` +
    `From (current validator): ${from}\n` +
    `To (target validator): ${toLabel}\n` +
    `Amount: ${amount} PAXI\n` +
    `Service fee (0.15%): ${fee.toFixed(6)} PAXI\n` +
    `Fee recipient: ${CONFIG.feeCollector}\n\n` +
    `Click "OK" to sign in your wallet.`
  );
  if (!okRd) return;

  const btn = document.getElementById('btnRedelegate');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${t('common.sending')}`;
  try {
    const denom = CONFIG.denom;
    const amountMicro = (amount * 1e6).toFixed(0);
    const feeMicro = (fee * 1e6).toFixed(0);

    // The chain's CosmJS bundle does NOT export MsgBeginRedelegate, so we encode it ourselves
    // (appjs/msg-codec.js — bytes verified against the chain's own decoder).
    if (typeof PaxiMsgCodec === 'undefined' || !PaxiMsgCodec.encodeMsgBeginRedelegate) {
      showStatus('rdStatus', '❌ Message codec not loaded (appjs/msg-codec.js)', 'error');
      return;
    }
    const msgAny = PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
      value: PaxiMsgCodec.encodeMsgBeginRedelegate(
        state.wallet.address, from, to, denom, amountMicro
      ),
    });

    const feeMsg = PaxiCosmJS.MsgSend.fromPartial({
      fromAddress: state.wallet.address,
      toAddress: CONFIG.feeCollector,
      amount: [{ denom, amount: feeMicro }]
    });
    const feeAny = PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: PaxiCosmJS.MsgSend.encode(feeMsg).finish(),
    });

    const messages = [msgAny, feeAny];
    const memo = `Paxi Toolbox Redelegate (${amount} PAXI) Fee: ${fee.toFixed(4)} PAXI`;
    const broadcastRes = await buildSignAndBroadcast(messages, memo, null, state.wallet);
    const result = checkTxResult(broadcastRes);
    if (result.ok) {
      rdLastSig = rdSig; rdLastFailed = false;
      showStatus('rdStatus', `${t('redelegate.success')} TxHash: ${result.txhash.slice(0,20)}...`, 'success');
      pollTxStatus(result.txhash);
      showToast(`✅ Redelegation successful! Service fee ${fee.toFixed(4)} PAXI`, 'success');
    } else {
      rdLastSig = rdSig; rdLastFailed = true;
      // deterministic business error (e.g. code 32 redelegation in progress) won't succeed on retry; show a prominent hint
      const detail = mapError(result.code, result.rawLog);
      const hint = (result.code === 32)
        ? ' (Chain rule: a redelegation on the same path is already being processed; wait for it to finish before retrying. Re-submitting only re-charges the service fee and will not succeed)'
        : '';
      showStatus('rdStatus', `${t('redelegate.fail')} ${detail}${hint}`, 'error');
    }
  } catch (e) {
    rdLastSig = rdSig; rdLastFailed = true;
    showStatus('rdStatus', `${t('redelegate.fail')} ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = t('redelegate.execute');
  }
}
