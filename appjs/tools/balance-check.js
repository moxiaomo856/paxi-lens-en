if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

function renderBalanceCheck() {
  return `
    <div class="card">
      <div class="card-title">${t('balanceCheck.title')}</div>
      <div class="tool-desc">${t('balanceCheck.desc')}</div>
      <div class="form-group">
        <label class="form-label">Address list (one per line)</label>
        <textarea id="bcAddrs" placeholder="${t('balanceCheck.placeholder')}"></textarea>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="queryBalances()">${t('balanceCheck.queryBtn')}</button>
        <button class="btn btn-outline btn-sm" onclick="exportBalances()" id="bcExportBtn" style="display:none">${t('balanceCheck.exportBtn')}</button>
      </div>
      <div class="status-msg" id="bcStatus"></div>
      <div id="bcResults" style="margin-top:16px"></div>
    </div>
    <div class="card" id="txHistoryCard" style="display:none">
      <div class="card-title">${t('balanceCheck.records')}</div>
      <div id="txHistoryContainer"></div>
    </div>
    <div style="margin:16px 0 0;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;font-size:11px;color:var(--text-muted);line-height:1.7;text-align:center;">
      ${t('disclaimer.balanceCheck')}
    </div>
  `;
}

function bindBalanceCheckEvents() {}

let balanceResults = [];

async function queryBalances() {
  const text = document.getElementById('bcAddrs').value.trim();
  if (!text) { showStatus('bcStatus', 'Please enter an address list', 'warning'); return; }
  const addrs = [...new Set(text.split('\n').map(a => a.trim()).filter(a => a.startsWith('paxi1')))];
  if (addrs.length === 0) { showStatus('bcStatus', t('balanceCheck.noAddr'), 'error'); return; }
  showStatus('bcStatus', t('balanceCheck.querying').replace('{count}', addrs.length), 'info');
  balanceResults = [];
  const batchSize = 10;
  for (let i = 0; i < addrs.length; i += batchSize) {
    const batch = addrs.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(addr => fetch(`${CONFIG.lcd}/cosmos/bank/v1beta1/balances/${addr}`).then(r => r.json())));
    for (let j = 0; j < batch.length; j++) {
      const addr = batch[j];
      const result = results[j];
      let paxiAmount = 0, otherTokens = [];
      if (result.status === 'fulfilled' && result.value.balances) {
        for (const b of result.value.balances) {
          if (b.denom === CONFIG.denom) paxiAmount = parseFloat(upaxiToPaxi(b.amount));
          else otherTokens.push(b);
        }
      }
      balanceResults.push({ address: addr, paxi: paxiAmount, tokens: otherTokens });
    }
  }
  const totalPaxi = balanceResults.reduce((s, r) => s + r.paxi, 0);
  document.getElementById('bcResults').innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">${balanceResults.length}</div><div class="stat-label">Addresses queried</div></div>
      <div class="stat-card"><div class="stat-value">${totalPaxi.toLocaleString()}</div><div class="stat-label">Total PAXI Balance</div></div>
      <div class="stat-card"><div class="stat-value">${balanceResults.filter(r => r.paxi > 0).length}</div><div class="stat-label">Non-zero Balance Addresses</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Address</th><th>PAXI Balance</th><th>Other Tokens</th><th>Action</th></tr></thead>
        <tbody>
          ${balanceResults.map((r, i) => `
            <tr>
              <td>${i+1}</td>
              <td><code>${escapeHtml(r.address.slice(0,14))}...${escapeHtml(r.address.slice(-8))}</code></td>
              <td style="font-weight:600;color:${r.paxi > 0 ? 'var(--success)' : 'var(--text-muted)'}">${r.paxi.toLocaleString()}</td>
              <td>${r.tokens.length > 0 ? r.tokens.map(t => escapeHtml(t.denom)).join(', ') : '-'}</td>
              <td><button class="btn btn-outline btn-sm" onclick="showAddressTxHistory('${r.address}')">📜 ${t('balanceCheck.records')}</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('bcExportBtn').style.display = 'inline-flex';
  showStatus('bcStatus', t('balanceCheck.done').replace('{count}', balanceResults.length), 'success');
}

function exportBalances() {
  if (!balanceResults.length) return;
  const csv = 'Address,PAXI Balance,Other Tokens\n' + balanceResults.map(r => `${r.address},${r.paxi},${r.tokens.map(t => t.denom + ':' + t.amount).join(';')}`).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'paxi_balances.csv'; a.click();
  URL.revokeObjectURL(url);
}

async function showAddressTxHistory(address) {
  const card = document.getElementById('txHistoryCard');
  const container = document.getElementById('txHistoryContainer');
  if (!card || !container) return;
  card.style.display = 'block';
  container.innerHTML = '<p style="color:var(--text-muted)">⏳ Loading...</p>';
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    let txs = [], found = false;
    const queryMethods = [
      `events=transfer.recipient='${address}'`,
      `events=message.recipient='${address}'`,
      `events=coin_received.receiver='${address}'`
    ];
    for (const query of queryMethods) {
      try {
        const url = `${CONFIG.lcd}/cosmos/tx/v1beta1/txs?${query}&pagination.limit=30&order_by=DESC`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.tx_responses && data.tx_responses.length > 0) {
            txs = data.tx_responses;
            found = true;
            break;
          }
        }
      } catch (e) {}
    }
    if (!found || txs.length === 0) {
      try {
        const url = `${CONFIG.lcd}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=10&order_by=DESC`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.tx_responses && data.tx_responses.length > 0) {
            const sentTxs = data.tx_responses || [];
            const allTxMap = {};
            for (const tx of [...txs, ...sentTxs]) if (tx.txhash) allTxMap[tx.txhash] = tx;
            txs = Object.values(allTxMap);
            found = true;
          }
        }
      } catch (e) {}
    }
    if (!found || txs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:40px;margin-bottom:12px;">🔍</div>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:12px;">No transaction records found for this address</p>
          <p style="font-size:13px;margin-bottom:16px;">Please view the full transaction history directly in the block explorer:</p>
          <a href="https://explorer.paxinet.io/address/${address}" target="_blank" style="display:inline-block;padding:10px 24px;background:var(--primary);color:white;border-radius:8px;text-decoration:none;font-weight:600;">🔗 Open Block Explorer</a>
          <div style="font-size:12px;color:var(--text-muted);margin-top:12px;">💡 Search your address in the block explorer to see all incoming/outgoing records</div>
        </div>
      `;
      return;
    }
    let html = `<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">📌 Address: <code style="word-break:break-all;font-size:11px;">${escapeHtml(address)}</code><span style="margin-left:12px;font-size:11px;color:var(--success);">✅ Found ${txs.length} transactions</span></div><div style="max-height:500px;overflow-y:auto;">`;
    let hasTransfer = false;
    for (const tx of txs.slice(0,30)) {
      const msgs = tx.tx?.body?.messages || [];
      const success = tx.code === 0;
      const time = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '--';
      for (const m of msgs) {
        const typeUrl = m['@type'] || m.typeUrl || '';
        let from='', to='', amount='0', denom='upaxi';
        if (typeUrl.includes('MsgSend')) {
          const msgData = m.value || m;
          from = msgData.from_address || '--';
          to = msgData.to_address || '--';
          if (msgData.amount && msgData.amount.length > 0) {
            amount = msgData.amount[0].amount || '0';
            denom = msgData.amount[0].denom || 'upaxi';
          }
        }
        if (from === address || to === address) {
          hasTransfer = true;
          const isReceived = to === address;
          const displayAmount = denom === 'upaxi' ? upaxiToPaxi(amount) : amount;
          const isBatch = msgs.length > 1;
          html += `
            <div style="background:var(--bg);border-radius:6px;padding:8px 12px;margin-bottom:4px;border-left:3px solid ${success ? (isReceived ? 'var(--success)' : 'var(--warning)') : 'var(--danger)'};">
              <div style="display:flex;justify-content:space-between;font-size:11px;">
                <span>
                  ${success ? '✅' : '❌'}
                  ${isReceived ? `<span style="color:var(--success);font-weight:600;">⬇️ +${displayAmount} ${denom === 'upaxi' ? 'PAXI' : denom}</span>` : `<span style="color:var(--warning);font-weight:600;">⬆️ -${displayAmount} ${denom === 'upaxi' ? 'PAXI' : denom}</span>`}
                  <span style="color:var(--text-muted);font-size:10px;">${isReceived ? 'From' : 'To'} ${isReceived ? from.slice(0,10) : to.slice(0,10)}...${isReceived ? from.slice(-4) : to.slice(-4)}</span>
                  ${isBatch ? `<span style="color:var(--warning);font-size:9px;background:rgba(245,158,11,0.15);padding:1px 6px;border-radius:4px;">📦 Batch</span>` : ''}
                </span>
                <span style="color:var(--text-muted);font-size:10px;">${time}</span>
              </div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">
                Tx: <code>${tx.txhash.slice(0,16)}...</code>
                <a href="https://explorer.paxinet.io/tx/${tx.txhash}" target="_blank" style="color:var(--primary);">🔗</a>
                ${isBatch ? `<span style="color:var(--text-muted);font-size:10px;">(total ${msgs.length} messages)</span>` : ''}
              </div>
            </div>
          `;
        }
      }
    }
    if (!hasTransfer) html += `<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No transfer records related to this address found</p>`;
    html += `</div><div style="text-align:center;margin-top:10px;font-size:12px;"><a href="https://explorer.paxinet.io/address/${address}" target="_blank" style="color:var(--primary);">🔗 View all transactions in block explorer →</a><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">💡 Batch airdrop transfers are all in the "incoming records". If your wallet doesn't show them, trust the block explorer.</div></div>`;
    container.innerHTML = html;
  } catch (e) {
    console.error('Failed to query transaction records:', e);
    container.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:40px;margin-bottom:12px;">🔍</div>
        <p style="color:var(--danger);font-size:14px;margin-bottom:12px;">❌ Query failed: ${e.message}</p>
        <p style="font-size:13px;margin-bottom:16px;">Please view the full transaction history directly in the block explorer:</p>
          <a href="https://explorer.paxinet.io/address/${address}" target="_blank" style="display:inline-block;padding:10px 24px;background:var(--primary);color:white;border-radius:8px;text-decoration:none;font-weight:600;">🔗 Open Block Explorer</a>
          <div style="font-size:12px;color:var(--text-muted);margin-top:12px;">💡 Search your address in the block explorer to see all incoming/outgoing records</div>
      </div>
    `;
  }
}

window.TOOL_REGISTRY['balance-check'] = { render: renderBalanceCheck, bind: bindBalanceCheckEvents };
