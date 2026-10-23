/* ============================================================================
 * Paxi Suite · Claim Staking Rewards module (Claim Rewards)
 *  - Query the current delegator's accumulated staking rewards (distribution /rewards)
 *  - One-click claim: construct MsgWithdrawDelegatorReward for each validator with rewards
 *  - Optional "compound": after claiming, immediately construct MsgDelegate with the same micro amount to re-delegate to the same validator
 *  - No platform fee, only on-chain Gas (handled by buildSignAndBroadcast)
 * Runtime global dependencies: state / CONFIG / fetchAPI / PaxiCosmJS / buildSignAndBroadcast
 *                / checkTxResult / mapError / pollTxStatus / currentLang
 *                / escapeHtml / showToast / showStatus / confirm
 * Note: this module is a self-contained file that does not modify core code; functions are declared at module top level,
 *       triggered in render via inline onclick="claimRewards()" (same pattern as redelegate).
 * ==========================================================================*/

const CR_DICT = {
  en: {
    title: 'Claim Rewards',
    desc: 'Check and claim your PAXI staking rewards in one click. Optionally enable "Compound" to re-delegate the rewards to the same validator right after claiming.',
    info: 'This tool only broadcasts claim/compound transactions and charges no platform fee — only on-chain Gas applies. Rewards are measured in upaxi (1 PAXI = 1,000,000 upaxi).',
    compound: 'Compound to same validator after claiming',
    claimBtn: 'Claim All',
    connectFirst: 'Please connect wallet',
    noRewards: 'No reclaimable staking rewards',
    colValidator: 'Validator',
    colAmount: 'Claimable (PAXI)',
    colAction: 'Action',
    total: 'Total claimable: ',
    loading: '⏳ Loading staking rewards...',
    confirmMsg: (paxi, compound) =>
      `Claim ${paxi} PAXI staking rewards?` +
      (compound ? '\n(Compound enabled: will be re-delegated to the same validator after claiming)' : '') +
      '\n\nClick OK to sign in your wallet.',
    success: '✅ Claimed successfully',
    failPrefix: 'Claim failed: ',
    sdkErr: 'SDK does not support this message type',
    queryFail: 'Failed to query rewards: ',
  }
};

const crPt = (k, ...a) => {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'zh';
  let v = CR_DICT[lang][k];
  if (v === undefined) v = CR_DICT.en[k];
  return typeof v === 'function' ? v(...a) : v;
};

const crEsc = (s) => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s);

/* Build operator_address -> moniker map from localStorage 'paxi_validators_cache' */
function crLoadValidatorMap() {
  const map = {};
  try {
    const cached = localStorage.getItem('paxi_validators_cache');
    if (cached) {
      const validators = (JSON.parse(cached).data && JSON.parse(cached).data.validators) || [];
      validators.forEach(v => {
        if (v.operator_address) map[v.operator_address] = (v.description && v.description.moniker) || v.operator_address;
      });
    }
  } catch (_) { /* If cache missing or parse fails, fall back to address display */ }
  return map;
}

function renderClaimRewards() {
  return `
    <div class="card">
      <div class="card-title">${crEsc(crPt('title'))}</div>
      <div class="tool-desc">${crEsc(crPt('desc'))}</div>
      <div class="info-box">
        <strong>💡 ${crEsc(crPt('info'))}</strong>
      </div>
      <div id="crResult"></div>
      <label style="display:flex;align-items:center;gap:8px;margin:14px 0;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="crCompound"> ${crEsc(crPt('compound'))}
      </label>
      <button class="btn btn-primary btn-block" onclick="claimRewards()">${crEsc(crPt('claimBtn'))}</button>
      <div class="status-msg" id="crStatus"></div>
    </div>`;
}

async function loadClaimRewards() {
  const statusEl = document.getElementById('crStatus');
  const resultEl = document.getElementById('crResult');
  if (!statusEl || !resultEl) return;

  if (!state.connected) {
    showStatus('crStatus', crPt('connectFirst'), 'warning');
    return;
  }

  const addr = state.wallet.address;
  resultEl.innerHTML = `<div style="padding:12px;color:var(--text-muted);">${crEsc(crPt('loading'))}</div>`;
  try {
    const data = await fetchAPI(`/cosmos/distribution/v1beta1/delegators/${addr}/rewards`);
    const valList = data.rewards || [];
    const totalArr = data.total || [];

    const valMap = crLoadValidatorMap();

    let totalMicro = 0;
    totalArr.forEach(t => { if (t.denom === CONFIG.denom) totalMicro += parseFloat(t.amount || 0); });
    const totalPaxi = totalMicro / 1e6;

    // Only show validators with upaxi rewards
    const rows = [];
    valList.forEach(r => {
      let micro = 0;
      (r.reward || []).forEach(c => { if (c.denom === CONFIG.denom) micro += parseFloat(c.amount || 0); });
      if (micro <= 0) return;
      const name = valMap[r.validator_address] || (r.validator_address.slice(0, 16) + '...');
      rows.push(`<tr><td>${crEsc(name)}</td><td>${(micro / 1e6).toFixed(6)}</td><td>-</td></tr>`);
    });

    if (rows.length === 0 || totalPaxi <= 0) {
      resultEl.innerHTML = `<div style="padding:12px;color:var(--text-muted);">${crEsc(crPt('noRewards'))}</div>`;
      return;
    }

    resultEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">
        <thead>
          <tr style="color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">
            <th style="padding:6px 4px;">${crEsc(crPt('colValidator'))}</th>
            <th style="padding:6px 4px;">${crEsc(crPt('colAmount'))}</th>
            <th style="padding:6px 4px;">${crEsc(crPt('colAction'))}</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
      <div style="text-align:right;font-weight:600;color:var(--primary);padding:4px;">
        ${crEsc(crPt('total'))} ${totalPaxi.toFixed(6)} PAXI
      </div>`;
  } catch (e) {
    console.error('[ClaimRewards] query failed:', e);
    showStatus('crStatus', crPt('queryFail') + e.message, 'error');
  }
}

function bindClaimRewards() {
  // Button uses inline onclick="claimRewards()"; no extra binding needed here.
}

async function claimRewards() {
  if (!state.connected) {
    showStatus('crStatus', crPt('connectFirst'), 'warning');
    return;
  }

  const btn = document.querySelector('button[onclick="claimRewards()"]');

  // Re-fetch latest rewards to ensure accurate amounts
  let data;
  try {
    data = await fetchAPI(`/cosmos/distribution/v1beta1/delegators/${state.wallet.address}/rewards`);
  } catch (e) {
    showStatus('crStatus', crPt('queryFail') + e.message, 'error');
    return;
  }

  const valList = data.rewards || [];
  const targets = [];
  valList.forEach(r => {
    let micro = 0;
    (r.reward || []).forEach(c => { if (c.denom === CONFIG.denom) micro += parseFloat(c.amount || 0); });
    if (micro > 0) targets.push({ val: r.validator_address, micro: Math.floor(micro) });
  });

  if (targets.length === 0) {
    showStatus('crStatus', crPt('noRewards'), 'warning');
    return;
  }

  const totalMicro = targets.reduce((s, t) => s + t.micro, 0);
  const totalPaxi = (totalMicro / 1e6).toFixed(6);
  const compound = document.getElementById('crCompound') && document.getElementById('crCompound').checked;

  if (!confirm(crPt('confirmMsg', totalPaxi, compound))) return;

  if (!PaxiCosmJS || !PaxiCosmJS.MsgWithdrawDelegatorReward || !PaxiCosmJS.MsgWithdrawDelegatorReward.encode) {
    showStatus('crStatus', crPt('sdkErr'), 'error');
    return;
  }

  const msgs = [];
  for (const t of targets) {
    const wMsg = PaxiCosmJS.MsgWithdrawDelegatorReward.fromPartial({
      delegator_address: state.wallet.address,
      validator_address: t.val,
    });
    msgs.push(PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: PaxiCosmJS.MsgWithdrawDelegatorReward.encode(wMsg).finish(),
    }));

    if (compound) {
      if (!PaxiCosmJS.MsgDelegate || !PaxiCosmJS.MsgDelegate.encode) {
        showStatus('crStatus', crPt('sdkErr'), 'error');
        return;
      }
      const dMsg = PaxiCosmJS.MsgDelegate.fromPartial({
        delegator_address: state.wallet.address,
        validator_address: t.val,
        amount: { denom: CONFIG.denom, amount: t.micro.toString() },
      });
      msgs.push(PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: PaxiCosmJS.MsgDelegate.encode(dMsg).finish(),
      }));
    }
  }

  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> ...'; }
    const memo = `Paxi Suite Claim Rewards${compound ? ' + Compound' : ''}`;
    const res = await buildSignAndBroadcast(msgs, memo, null, state.wallet);
    const r = checkTxResult(res);
    if (r.ok) {
      showStatus('crStatus', `${crPt('success')} TxHash: ${r.txhash.slice(0, 20)}...`, 'success');
      pollTxStatus(r.txhash);
      showToast(crPt('success'), 'success');
    } else {
      showStatus('crStatus', `${crPt('failPrefix')} ${mapError(r.code, r.rawLog)}`, 'error');
    }
    // Refresh list after claiming
    loadClaimRewards();
  } catch (e) {
    console.error('[ClaimRewards] claim failed:', e);
    showStatus('crStatus', `${crPt('failPrefix')} ${e.message}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = crEsc(crPt('claimBtn')); }
  }
}

window.TOOL_REGISTRY ||= {};
window.TOOL_REGISTRY['claim-rewards'] = { render: renderClaimRewards, bind: bindClaimRewards, onMount: loadClaimRewards };
