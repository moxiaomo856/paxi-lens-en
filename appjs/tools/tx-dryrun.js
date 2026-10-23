// Paxi Suite — Tool: Tx Dry-run (Transaction Simulation)
// Self-contained module. Simulation only: no signing, no broadcasting.

const DR_DICT = {
  en: {
    title: 'Tx Dry-run',
    desc: 'Simulate a transaction on-chain to estimate gas and check if it would fail.',
    info: 'This tool only simulates on-chain; it does NOT broadcast. Use it to estimate gas and check if a tx would fail.',
    modeA: 'Mode A: Quick Transfer Simulation',
    modeB: 'Mode B: Paste tx_bytes Simulation',
    from: 'Sender (wallet address)',
    to: 'Recipient address',
    amount: 'Amount (PAXI)',
    simTransferBtn: 'Simulate Transfer',
    simBytesBtn: 'Simulate Pasted tx_bytes',
    bytesPh: 'Paste Base64-encoded tx_bytes',
    connectFirst: 'Please connect wallet',
    invalidAddr: 'Invalid recipient address',
    invalidAmt: 'Enter a valid amount',
    gasUsed: 'Estimated Gas Used',
    estFee: 'Estimated Gas Fee',
    wouldFail: 'Simulation note: ',
    success: 'Simulation succeeded',
    failPrefix: 'Simulation failed: ',
    loading: 'Simulating...',
    gasWanted: 'Gas Wanted',
    paxiUnit: 'PAXI',
    notConnected: 'Wallet not connected; sender address is empty.'
  }
};

const drPt = (k, ...a) => {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'zh';
  let v = DR_DICT[lang][k];
  if (v === undefined) v = DR_DICT.en[k];
  return typeof v === 'function' ? v(...a) : v;
};

function parseGasPriceNumber() {
  try {
    const gp = (typeof SHARED_CONFIG !== 'undefined' && SHARED_CONFIG.gasPrice) || '0.25upaxi';
    const m = String(gp).match(/^([0-9]*\.?[0-9]+)/);
    return m ? parseFloat(m[1]) : 0.25;
  } catch (e) {
    return 0.25;
  }
}

function toMicro(paxiStr) {
  const v = parseFloat(paxiStr);
  if (!isFinite(v)) return 0;
  return Math.round(v * 1e6);
}

function renderTxDryRun() {
  const fromVal = (typeof state !== 'undefined' && state.connected && state.wallet) ? (state.wallet.address || '') : '';
  return `
<div class="card">
  <div class="card-title">${escapeHtml(drPt('title'))}</div>
  <div class="tool-desc">${escapeHtml(drPt('desc'))}</div>
  <div class="info-box">${escapeHtml(drPt('info'))}</div>

  <div class="dr-section">
    <div class="dr-mode-title">${escapeHtml(drPt('modeA'))}</div>
    <label class="dr-label">${escapeHtml(drPt('from'))}</label>
    <input id="drFrom" class="input" type="text" disabled value="${escapeHtml(fromVal)}" />
    <label class="dr-label">${escapeHtml(drPt('to'))}</label>
    <input id="drTo" class="input" type="text" placeholder="paxi1..." />
    <label class="dr-label">${escapeHtml(drPt('amount'))}</label>
    <input id="drAmt" class="input" type="text" placeholder="0.0" />
    <button class="btn" onclick="drSimTransfer()">${escapeHtml(drPt('simTransferBtn'))}</button>
  </div>

  <div class="dr-section">
    <div class="dr-mode-title">${escapeHtml(drPt('modeB'))}</div>
    <textarea id="drBytes" class="textarea" rows="4" placeholder="${escapeHtml(drPt('bytesPh'))}"></textarea>
    <button class="btn" onclick="drSimBytes()">${escapeHtml(drPt('simBytesBtn'))}</button>
  </div>

  <div id="drResult"></div>
  <div class="status-msg" id="drStatus"></div>
</div>`;
}

function bindTxDryRun() {
  // Inline onclick handlers are used; just ensure sender field stays synced if connected.
  const fromEl = document.getElementById('drFrom');
  if (fromEl && typeof state !== 'undefined' && state.connected && state.wallet) {
    fromEl.value = state.wallet.address || '';
  }
}

function drSimTransfer() {
  const statusEl = document.getElementById('drStatus');
  const resultEl = document.getElementById('drResult');

  if (typeof state === 'undefined' || !state.connected) {
    showStatus('drStatus', drPt('connectFirst'), 'error');
    showToast(drPt('connectFirst'), 'error');
    return;
  }

  const addr = state.wallet.address || '';
  if (!addr) {
    showStatus('drStatus', drPt('notConnected'), 'error');
    return;
  }

  const to = (document.getElementById('drTo').value || '').trim();
  const amt = document.getElementById('drAmt').value;

  if (!/^paxi1[0-9a-z]{38}$/.test(to)) {
    showStatus('drStatus', drPt('invalidAddr'), 'error');
    return;
  }
  const micro = toMicro(amt);
  if (!(micro > 0)) {
    showStatus('drStatus', drPt('invalidAmt'), 'error');
    return;
  }

  showStatus('drStatus', drPt('loading'), 'info');
  resultEl.innerHTML = '';

  (async () => {
    try {
      const data = await fetchAPI(`/cosmos/auth/v1beta1/accounts/${addr}`);
      const base = (data.account && (data.account.base_account || data.account)) || {};
      const accountNumber = Number(base.account_number || 0);
      const sequence = Number(base.sequence || 0);

      const coin = PaxiCosmJS.coins(String(micro), 'upaxi')[0];
      const msg = PaxiCosmJS.MsgSend.fromPartial({
        fromAddress: addr,
        toAddress: to,
        amount: [coin]
      });
      const anyMsg = PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: PaxiCosmJS.MsgSend.encode(msg).finish()
      });

      const gas = await simulateGas([anyMsg], 'dryrun', accountNumber, sequence, state.wallet.public_key, addr);
      const gpNum = parseGasPriceNumber();
      const feeMicro = gas * gpNum;
      const feePaxi = feeMicro / 1e6;

      showStatus('drStatus', drPt('success'), 'success');
      resultEl.innerHTML = `
<div class="dr-success">
  <div>${escapeHtml(drPt('gasUsed'))}：<b>${gas}</b></div>
  <div>${escapeHtml(drPt('estFee'))}：<b>${feeMicro.toFixed(6)} upaxi</b> ≈ <b>${feePaxi.toFixed(6)} ${escapeHtml(drPt('paxiUnit'))}</b></div>
</div>`;
    } catch (e) {
      const msg = (e && (e.message || e.toString())) || String(e);
      showStatus('drStatus', drPt('failPrefix') + msg, 'error');
      resultEl.innerHTML = `
<div class="dr-fail">
  <div>${escapeHtml(drPt('wouldFail'))}${escapeHtml(msg)}</div>
  <div class="dr-hint">${escapeHtml(drPt('info'))}</div>
</div>`;
    }
  })();
}

function drSimBytes() {
  const statusEl = document.getElementById('drStatus');
  const resultEl = document.getElementById('drResult');
  const raw = (document.getElementById('drBytes').value || '').trim();

  if (!raw) {
    showStatus('drStatus', drPt('bytesPh'), 'error');
    return;
  }

  showStatus('drStatus', drPt('loading'), 'info');
  resultEl.innerHTML = '';

  (async () => {
    try {
      const url = `${getLCD()}/cosmos/tx/v1beta1/simulate`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_bytes: raw })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const errMsg = (data && (data.message || (data.error && data.error.message))) || JSON.stringify(data);
        showStatus('drStatus', drPt('failPrefix') + errMsg, 'error');
        resultEl.innerHTML = `<div class="dr-fail"><div>${escapeHtml(drPt('wouldFail'))}${escapeHtml(errMsg)}</div></div>`;
        return;
      }
      const gasUsed = data && data.gas_info ? Number(data.gas_info.gas_used || 0) : 0;
      const gasWanted = data && data.gas_info ? Number(data.gas_info.gas_wanted || 0) : 0;
      showStatus('drStatus', drPt('success'), 'success');
      resultEl.innerHTML = `
<div class="dr-success">
  <div>${escapeHtml(drPt('gasUsed'))}：<b>${gasUsed}</b></div>
  <div>${escapeHtml(drPt('gasWanted'))}：<b>${gasWanted}</b></div>
</div>`;
    } catch (e) {
      const msg = (e && (e.message || e.toString())) || String(e);
      showStatus('drStatus', drPt('failPrefix') + msg, 'error');
      resultEl.innerHTML = `<div class="dr-fail"><div>${escapeHtml(drPt('wouldFail'))}${escapeHtml(msg)}</div></div>`;
    }
  })();
}

window.TOOL_REGISTRY ||= {};
window.TOOL_REGISTRY['tx-dryrun'] = { render: renderTxDryRun, bind: bindTxDryRun };
