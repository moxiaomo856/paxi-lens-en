window.TOOL_REGISTRY ||= {};

function renderTxTracker() {
  return `
    <div class="card">
      <div class="card-title">${t('txTracker.title')}</div>
      <div class="tool-desc">${t('txTracker.desc')}</div>
      <div class="form-group">
        <label class="form-label">Transaction hash</label>
        <input type="text" id="txHash" placeholder="${t('txTracker.placeholder')}">
      </div>
      <button class="btn btn-primary" onclick="trackTransaction()">${t('txTracker.queryBtn')}</button>
      <div class="status-msg" id="txStatus"></div>
      <div id="txResult" style="margin-top:16px"></div>
      <div style="margin-top:14px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;text-align:center;">
        ${t('disclaimer.txTracker')}
      </div>
    </div>
  `;
}
function bindTxTrackerEvents() {
  document.getElementById('txHash').addEventListener('keydown', (e) => { if (e.key === 'Enter') trackTransaction(); });
}
async function trackTransaction() {
  const hash = document.getElementById('txHash').value.trim();
  if (!hash) { showStatus('txStatus', 'Please enter a transaction hash', 'warning'); return; }
  showStatus('txStatus', 'Querying...', 'info');
  try {
    const data = await fetchAPI(`/cosmos/tx/v1beta1/txs/${hash}`);
    const tx = data.tx_response || data;
    const resultDiv = document.getElementById('txResult');
    if (!tx || !tx.txhash) { showStatus('txStatus', 'Transaction not found', 'error'); return; }
    const success = tx.code === 0;
    resultDiv.innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value" style="color:${success ? 'var(--success)' : 'var(--danger)'}">${success ? '✅ Success' : '❌ Failed'}</div><div class="stat-label">Status</div></div>
        <div class="stat-card"><div class="stat-value">${tx.height || '-'}</div><div class="stat-label">Block height</div></div>
        <div class="stat-card"><div class="stat-value">${tx.gas_used || '-'} / ${tx.gas_wanted || '-'}</div><div class="stat-label">Gas Used</div></div>
        <div class="stat-card"><div class="stat-value">${tx.tx?.body?.messages?.length || 0}</div><div class="stat-label">Messages</div></div>
      </div>
      <div class="card" style="background:var(--bg)">
        <div class="card-title" style="font-size:14px">📝 Details</div>
        <pre style="font-size:11px;color:var(--text-muted);overflow-x:auto;white-space:pre-wrap;word-break:break-all">${JSON.stringify(tx, null, 2)}</pre>
      </div>
    `;
    showStatus('txStatus', '', '');
    document.getElementById('txStatus').style.display = 'none';
  } catch (e) {
    showStatus('txStatus', 'Query failed: ' + e.message, 'error');
  }
}

function renderGasCalc() {
  return `
    <div class="card">
      <div class="card-title">${t('gasCalc.title')}</div>
      <div class="tool-desc">${t('gasCalc.desc')}</div>
      <div class="form-group">
        <label class="form-label">${t('gasCalc.type')}</label>
        <select id="gcTxType">
          <option value="send">${t('gasCalc.send')}</option>
          <option value="prc20">${t('gasCalc.prc20')}</option>
          <option value="nft">${t('gasCalc.nft')}</option>
          <option value="swap">${t('gasCalc.swap')}</option>
          <option value="stake">${t('gasCalc.stake')}</option>
          <option value="vote">${t('gasCalc.vote')}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('gasCalc.price')}</label>
        <input type="number" id="gcGasPrice" value="0.25" step="0.01" min="0">
        <div style="margin-top:6px;padding:6px 10px;background:rgba(99,102,241,0.06);border-radius:4px;font-size:11px;color:var(--text-muted);line-height:1.5;">
          ${t('disclaimer.gasCalc')}
        </div>
      </div>
      <button class="btn btn-primary" onclick="calculateGas()">${t('gasCalc.calcBtn')}</button>
      <div class="status-msg" id="gcStatus"></div>
      <div id="gcResult" style="margin-top:16px"></div>
    </div>
  `;
}
function bindGasCalcEvents() {}
function calculateGas() {
  const txType = document.getElementById('gcTxType').value;
  const gasPrice = parseFloat(document.getElementById('gcGasPrice').value);
  const gasEstimates = { send:80000, prc20:200000, nft:250000, swap:350000, stake:200000, vote:150000 };
  const gasUsed = gasEstimates[txType] || 100000;
  const feeUpaxi = gasUsed * gasPrice;
  const feePaxi = feeUpaxi / 1e6;
  document.getElementById('gcResult').innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${gasUsed.toLocaleString()}</div><div class="stat-label">Estimated Gas Usage</div></div>
      <div class="stat-card"><div class="stat-value">${feeUpaxi.toLocaleString()}</div><div class="stat-label">Fee (upaxi)</div></div>
      <div class="stat-card"><div class="stat-value">${feePaxi.toFixed(6)}</div><div class="stat-label">Fee (PAXI)</div></div>
    </div>
    <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">⚠️ Actual gas consumption may vary depending on contract logic complexity. For batch operations, accumulate in the Gas Limit.</p>
  `;
}

window.TOOL_REGISTRY['tx-tracker'] = { render: renderTxTracker, bind: bindTxTrackerEvents };
window.TOOL_REGISTRY['gas-calc'] = { render: renderGasCalc, bind: bindGasCalcEvents };
