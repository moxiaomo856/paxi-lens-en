window.TOOL_REGISTRY ||= {};

function renderValidatorCompare() {
  return `
    <div class="card">
      <div class="card-title">${t('validatorCompare.title')}</div>
      <div class="tool-desc">${t('validatorCompare.desc')}</div>
      <button class="btn btn-primary" onclick="loadValidatorData()">${t('validatorCompare.loadBtn')}</button>
      <div class="status-msg" id="vcStatus"></div>
      <div id="vcResults" style="margin-top:16px"></div>
      <div style="margin-top:14px;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;font-size:11px;color:var(--text-muted);line-height:1.7;text-align:center;">
        ${t('disclaimer.validatorCompare')}
      </div>
    </div>
  `;
}
async function loadValidatorData() {
  showStatus('vcStatus', t('validatorCompare.loading'), 'info');
  try {
    let validators = [];
    let nextKey = null;
    do {
      const url = '/cosmos/staking/v1beta1/validators?pagination.limit=100' + (nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : '');
      const data = await fetchAPI(url);
      validators = validators.concat(data.validators || []);
      nextKey = (data.pagination && data.pagination.next_key) ? data.pagination.next_key : null;
    } while (nextKey);
    const poolData = await fetchAPI('/cosmos/staking/v1beta1/pool');
    const bondedTokens = parseInt(poolData.pool?.bonded_tokens || '0') / 1e6;

    /* ---- APR calculation: all read live from chain, not hardcoded ----
     * Paxi inflation halves yearly (Year 1 8% → Year 2 4% → …),
     * must read the mint module's current inflation rate, otherwise from Year 2 APR would be overestimated by 2x.
     * APR = Total Supply × Inflation Rate × (1 − Community Pool Tax) ÷ Total Staked            */
    let inflation = null, totalSupply = 0, communityTax = 0.05, aprSource = '';
    try {
      const infData = await fetchAPI('/cosmos/mint/v1beta1/inflation');
      inflation = parseFloat(infData.inflation);
      aprSource = 'On-chain live';
    } catch (_) {}
    if (inflation === null || !isFinite(inflation)) {
      inflation = 0.04;   // Fallback: estimate at Year 2 4%
      aprSource = 'Fallback value (Year 2 4%)';
    }
    try {
      const supData = await fetchAPI('/cosmos/bank/v1beta1/supply/by_denom?denom=upaxi');
      totalSupply = parseInt(supData.amount?.amount || '0') / 1e6;
    } catch (_) {}
    try {
      const distData = await fetchAPI('/cosmos/distribution/v1beta1/params');
      communityTax = parseFloat(distData.params?.community_tax ?? '0.05');
    } catch (_) {}

    const annualReward = totalSupply > 0 ? totalSupply * inflation * (1 - communityTax) : 0;
    const bondedRatio = totalSupply > 0 ? (bondedTokens / totalSupply) * 100 : 0;
    const estimatedAPR = (bondedTokens > 0 && annualReward > 0)
      ? (annualReward / bondedTokens) * 100 : 0;
    const sorted = validators.map(v => ({
      moniker: v.description?.moniker || 'Unknown',
      address: v.operator_address,
      votingPower: parseInt(v.tokens || '0') / 1e6,
      commission: parseFloat(v.commission?.commission_rates?.rate || '0') * 100,
      status: v.status === 'BOND_STATUS_BONDED' ? '✅ Active' : '⚠️ Pending',
      jailed: v.jailed,
    }))    .sort((a,b) => b.votingPower - a.votingPower);
    /* Note: the wallet App's "total delegation" is the sum of all validators (including candidates + unbonding),
     * only BONDED active validators participate in reward distribution, the APR denominator must use active staked amount */
    const allSum = validators.reduce((acc, v) => acc + BigInt(v.tokens || '0'), 0n);
    /* Before BigInt→Number, reduce unit first (upaxi→PAXI) to prevent Number precision overflow after total grows */
    const allSumPaxi = Number(allSum / 1000000n);
    const bondedCount = sorted.filter(v => v.status === '✅ Active').length;
    document.getElementById('vcResults').innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">${bondedCount}</div><div class="stat-label">Active Validators</div></div>
        <div class="stat-card"><div class="stat-value">${bondedTokens.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div class="stat-label">Active Staked (PAXI)</div></div>
        <div class="stat-card"><div class="stat-value">${allSumPaxi.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div class="stat-label">Total Network Delegation (PAXI)</div></div>
        <div class="stat-card"><div class="stat-value">${(inflation * 100).toFixed(1)}%</div><div class="stat-label">Current Inflation Rate (${aprSource})</div></div>
        <div class="stat-card"><div class="stat-value">${bondedRatio.toFixed(1)}%</div><div class="stat-label">Active Staking Ratio</div></div>
        <div class="stat-card"><div class="stat-value">${estimatedAPR > 0 ? estimatedAPR.toFixed(1) + '%' : '—'}</div><div class="stat-label">Estimated APR</div></div>
      </div>
      <div class="hint" style="font-size:11px;color:var(--text-muted);margin:8px 0;">
        📐 APR = Total Supply × Inflation ${(inflation*100).toFixed(1)}% × (1−Community Tax ${(communityTax*100).toFixed(0)}%) ÷ Active Staking — Paxi inflation halves yearly (Year 1 8% → Year 2 4% → …), this data automatically follows the on-chain current value.
        ℹ️ The "total delegation" shown by the wallet App (about ${(allSumPaxi/1e6).toFixed(2)} million) is the total of all ${validators.length} validators, of which only ${bondedCount} active validators (${bondedTokens.toLocaleString(undefined,{maximumFractionDigits:0})} PAXI) participate in reward distribution; the rest are candidate validators and unbonding funds, which generate no staking rewards.
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Validator</th><th>Status</th><th>Voting Power</th><th>Commission</th><th>Est. Return</th></tr></thead>
          <tbody>
            ${sorted.map((v,i) => {
              const netAPR = estimatedAPR * (1 - v.commission/100);
              return `<tr style="${v.jailed ? 'opacity:0.5' : ''}"><td>${i+1}</td><td style="font-weight:600">${escapeHtml(v.moniker)}${v.jailed ? ' 🔒' : ''}</td><td>${v.status}</td><td>${v.votingPower.toLocaleString()} PAXI</td><td>${v.commission.toFixed(1)}%</td><td style="color:var(--success);font-weight:600">~${netAPR.toFixed(1)}%</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    showStatus('vcStatus', t('validatorCompare.done').replace('{count}', sorted.length), 'success');
  } catch (e) {
    showStatus('vcStatus', 'Failed to load: ' + e.message, 'error');
  }
}

function renderTokenInfo() {
  return `
    <div class="card">
      <div class="card-title">${t('tokenInfo.title')}</div>
      <div class="tool-desc">${t('tokenInfo.desc')}</div>
      <div class="form-group">
        <label class="form-label">PRC-20 Contract Address</label>
        <input type="text" id="tiContract" placeholder="${t('tokenInfo.placeholder')}">
      </div>
      <button class="btn btn-primary" onclick="queryTokenInfo()">${t('tokenInfo.queryBtn')}</button>
      <div class="status-msg" id="tiStatus"></div>
      <div id="tiResult" style="margin-top:16px"></div>
      <div id="tiDisclaimer" style="display:none;margin-top:12px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;text-align:center;">
        ${t('disclaimer.prc20Info')}
      </div>
    </div>
  `;
}
function bindTokenInfoEvents() {
  document.getElementById('tiContract').addEventListener('keydown', (e) => { if (e.key === 'Enter') queryTokenInfo(); });
}
async function queryTokenInfo() {
  const contract = document.getElementById('tiContract').value.trim();
  if (!contract) { showStatus('tiStatus', 'Please enter a contract address', 'warning'); return; }
  showStatus('tiStatus', 'Querying...', 'info');
  try {
    const contractRes = await fetchAPI(`/cosmwasm/wasm/v1/contract/${contract}`);
    const codeId = contractRes.contract_info?.code_id;
    const queryMsg = { token_info: {} };
    const encodedMsg = btoa(JSON.stringify(queryMsg));
    const queryRes = await fetchAPI(`/cosmwasm/wasm/v1/contract/${contract}/smart/${encodedMsg}`).catch(() => null);
    if (queryRes?.data) {
      const info = queryRes.data;
      const decimals = info.decimals || 6;
      let totalSupplyDisplay = '-';
      if (info.total_supply) {
        try {
          const supplyBigInt = BigInt(info.total_supply);
          const divisor = BigInt(10 ** decimals);
          const intPart = supplyBigInt / divisor;
          const decPart = (supplyBigInt % divisor).toString().padStart(decimals, '0');
          totalSupplyDisplay = intPart.toLocaleString() + '.' + decPart.slice(0,4);
        } catch (e) { totalSupplyDisplay = info.total_supply; }
      }
      document.getElementById('tiResult').innerHTML = `
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value" style="font-size:16px">${escapeHtml(info.name || '-')}</div><div class="stat-label">Token Name</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:16px">${escapeHtml(info.symbol || '-')}</div><div class="stat-label">Token Symbol</div></div>
          <div class="stat-card"><div class="stat-value">${decimals}</div><div class="stat-label">Decimals</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:16px">${totalSupplyDisplay}</div><div class="stat-label">Total Supply</div></div>
        </div>
        <div class="card" style="background:var(--bg);margin-top:12px">
          <div class="card-title" style="font-size:14px">📋 Contract Info</div>
          <p style="font-size:13px"><strong>Contract Address: </strong><code>${contract}</code></p>
          <p style="font-size:13px"><strong>Code ID: </strong>${codeId || '-'}</p>
          <p style="font-size:13px"><strong>Creator: </strong><code>${contractRes.contract_info?.creator || '-'}</code></p>
        </div>
      `;
      showStatus('tiStatus', '', '');
      document.getElementById('tiStatus').style.display = 'none';
      const tiDisc = document.getElementById('tiDisclaimer');
      if (tiDisc) tiDisc.style.display = 'block';
    } else {
      showStatus('tiStatus', '⚠️ Unable to query this contract info (may not be a PRC-20 contract)', 'warning');
    }
  } catch (e) {
    showStatus('tiStatus', 'Query failed: ' + e.message, 'error');
  }
}

window.TOOL_REGISTRY['validator-compare'] = { render: renderValidatorCompare, onMount: loadValidatorData };
