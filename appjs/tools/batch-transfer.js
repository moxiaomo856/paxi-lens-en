if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

function renderBatchTransfer() {
  return `
    <div class="card">
      <div class="card-title">${t('batchTransfer.title')}</div>
      <div class="info-box">
        <strong>⚡ ${t('batchTransfer.modePack')}</strong><br>
        <span style="font-size:11px;color:var(--text-muted);">${t('batchTransfer.note')}</span>
        <div style="margin-top:8px;padding:8px 10px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:6px;font-size:12px;color:var(--primary);line-height:1.6;">
          📌 <strong>Address limit:</strong> up to <strong>1000</strong> addresses per operation; the system auto-batches every <strong>100</strong> addresses on-chain. If you have more than 1000, please split into multiple operations.
        </div>
      </div>
      <div class="tool-desc">${t('batchTransfer.desc')}</div>
      <div class="tabs">
        <div class="tab active" data-bt-type="native">${t('batchTransfer.native')}</div>
        <div class="tab" data-bt-type="prc20">${t('batchTransfer.prc20')}</div>
        <div class="tab" data-bt-type="nft">${t('batchTransfer.nft')}</div>
      </div>
      <div class="tabs" style="margin-top:8px">
        <div class="tab active" data-bt-mode="csv">${t('batchTransfer.csvMode')}</div>
        <div class="tab" data-bt-mode="uniform">${t('batchTransfer.uniformMode')}</div>
      </div>
      <div class="form-group" id="bt-prc20-group" style="display:none">
        <label class="form-label">PRC-20 contract address</label>
        <input type="text" id="btPrc20Contract" placeholder="paxi1...">
      </div>
      <div class="form-group" id="bt-nft-group" style="display:none">
        <label class="form-label">NFT contract address</label>
        <input type="text" id="btNftContract" placeholder="paxi1...">
      </div>
      <div id="bt-csv-area">
        <div class="form-group">
          <label class="form-label">Upload CSV file or paste data</label>
          <div class="upload-area" id="btCsvUpload">
            <div style="font-size:28px;margin-bottom:8px">📁</div>
            <div>${t('batchTransfer.upload')}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${t('batchTransfer.format')}</div>
          </div>
          <input type="file" id="btCsvFile" accept=".csv,.txt" style="display:none">
        </div>
        <div class="form-group">
          <label class="form-label">Or paste manually (each line: address,amount)</label>
          <textarea id="btCsvText" placeholder="${t('batchTransfer.pastePlaceholder')}"></textarea>
        </div>
      </div>
      <div id="btLiveCounter" style="margin:8px 0 4px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
        <div style="font-size:12px;color:var(--text-muted);">📝 Once addresses are entered, recognition progress shows here in real time</div>
      </div>
      <div id="bt-uniform-area" style="display:none">
        <div class="form-group">
          <label class="form-label">Recipient address list (one address per line)</label>
          <textarea id="btUniformAddrs" placeholder="${t('batchTransfer.uniformPlaceholder')}"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Amount per address</label>
          <input type="number" id="btUniformAmount" placeholder="e.g. 100" step="0.000001" min="0">
        </div>
      </div>
      <div id="btPreview" style="display:none">
        <div class="card-title" style="font-size:14px">${t('batchTransfer.preview')}</div>
        <div class="stats-row" id="btStats"></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Recipient</th><th>Amount</th><th>Token</th></tr></thead>
            <tbody id="btPreviewBody"></tbody>
          </table>
        </div>
      </div>
      <div style="margin:14px 0 4px;padding:10px 12px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;font-size:12px;color:#ffd700;line-height:1.6;">
        ${t('disclaimer.batchTransfer')}
      </div>
      <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" id="btParseBtn" onclick="parseBatchTransfer()">${t('batchTransfer.parseBtn')}</button>
        <button class="btn btn-success" id="btSendBtn" style="display:none" onclick="executeBatchTransfer()">${t('batchTransfer.sendBtn')}</button>
        <button class="btn btn-outline btn-sm" id="btClearBtn" style="display:none" onclick="clearBatchTransfer()">${t('batchTransfer.clearBtn')}</button>
      </div>
      <div class="status-msg" id="btStatus"></div>
    </div>
    <div class="card">
      <div class="card-title">${t('batchTransfer.history')}</div>
      <div id="btHistory"><p style="color:var(--text-muted);font-size:13px">Connect wallet to view history</p></div>
    </div>
  `;
}

function bindBatchTransferEvents() {
  document.querySelectorAll('[data-bt-type]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-bt-type]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.batchTokenType = tab.dataset.btType;
      document.getElementById('bt-prc20-group').style.display = tab.dataset.btType === 'prc20' ? 'block' : 'none';
      document.getElementById('bt-nft-group').style.display = tab.dataset.btType === 'nft' ? 'block' : 'none';
      clearBatchTransfer();
    });
  });
  document.querySelectorAll('[data-bt-mode]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-bt-mode]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.batchMode = tab.dataset.btMode;
      document.getElementById('bt-csv-area').style.display = tab.dataset.btMode === 'csv' ? 'block' : 'none';
      document.getElementById('bt-uniform-area').style.display = tab.dataset.btMode === 'uniform' ? 'block' : 'none';
      clearBatchTransfer();
    });
  });
  const uploadArea = document.getElementById('btCsvUpload');
  const fileInput = document.getElementById('btCsvFile');
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) parseCSVFile(file);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) parseCSVFile(e.target.files[0]);
  });
  // live counter: listen to input fields
  const btCsvText = document.getElementById('btCsvText');
  const btUniformAddrs = document.getElementById('btUniformAddrs');
  const btUniformAmount = document.getElementById('btUniformAmount');
  const updateLiveCounter = () => {
    const mode = state.batchMode;
    const maxTotal = CONFIG.batchTransfer.maxTotalAddresses;
    let count = 0;
    let totalRaw = 0;
    if (mode === 'csv') {
      const text = btCsvText?.value.trim() || '';
      if (text) {
        const lines = text.split('\n').filter(l => l.trim());
        const seen = new Set();
        totalRaw = lines.length;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 2) continue;
          const addr = parts[0], amount = parts[1];
          if (i === 0 && /^address|地址/i.test(addr)) continue; // keep: also skips Chinese-pasted headers
          if (!addr.startsWith('paxi1') || addr.length < 38) continue;
          const amtNum = parseFloat(amount);
          if (isNaN(amtNum) || amtNum <= 0) continue;
          if (seen.has(addr)) continue;
          seen.add(addr);
          count++;
        }
      }
    } else {
      const addrsText = btUniformAddrs?.value.trim() || '';
      const amount = btUniformAmount?.value;
      if (addrsText) {
        const addrs = addrsText.split('\n').map(a => a.trim()).filter(a => a);
        const seen = new Set();
        totalRaw = addrs.length;
        for (const a of addrs) {
          if (!a.startsWith('paxi1') || a.length < 38) continue;
          if (seen.has(a)) continue;
          seen.add(a);
          count++;
        }
        const amtNum = parseFloat(amount || '0');
        if (isNaN(amtNum) || amtNum <= 0) count = 0;
      }
    }
    const counterEl = document.getElementById('btLiveCounter');
    if (!counterEl) return;
    const pct = Math.min((count / maxTotal) * 100, 100);
    const over = count > maxTotal;
    const barColor = over ? '#ef4444' : pct > 90 ? '#f59e0b' : '#6366f1';
    counterEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span style="color:${over ? '#ef4444' : 'var(--text-muted)'};font-weight:600;">
          ${over ? '⚠️ Limit exceeded!' : `📍 Recognized ${count}/${maxTotal} valid addresses`}
        </span>
        <span style="color:var(--text-muted);">
          ${totalRaw > 0 ? `Raw ${totalRaw} rows, ${maxTotal - count < 0 ? 0 : maxTotal - count} remaining` : ''}
        </span>
      </div>
      <div style="width:100%;height:6px;background:var(--bg);border-radius:4px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${barColor};transition:width .2s ease;border-radius:4px;"></div>
      </div>
      ${over ? `<div style="font-size:11px;color:#ef4444;margin-top:4px;">${count - maxTotal} addresses over the limit, please remove the excess before clicking "Parse"</div>` : ''}
    `;
  };
  if (btCsvText) btCsvText.addEventListener('input', updateLiveCounter);
  if (btUniformAddrs) btUniformAddrs.addEventListener('input', updateLiveCounter);
  if (btUniformAmount) btUniformAmount.addEventListener('input', updateLiveCounter);
}

function parseCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('btCsvText').value = e.target.result;
    // trigger an input event to update the live counter
    document.getElementById('btCsvText').dispatchEvent(new Event('input'));
    parseBatchTransfer();
  };
  reader.readAsText(file);
}

function parseBatchTransfer() {
  const tokenType = state.batchTokenType;
  const mode = state.batchMode;
  let recipients = [];
  const seenAddresses = new Set();
  const invalidLines = [];
  if (mode === 'csv') {
    const text = document.getElementById('btCsvText').value.trim();
    if (!text) { showStatus('btStatus', 'Please enter CSV data', 'warning'); return; }
    const lines = text.split('\n').filter(l => l.trim());
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx].trim();
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) { invalidLines.push({ line: lineIdx + 1, reason: 'Invalid format' }); continue; }
      const addr = parts[0], amount = parts[1];
      if (lineIdx === 0 && /^address|地址/i.test(addr)) continue; // keep: also skips Chinese-pasted headers
      if (!addr.startsWith('paxi1') || addr.length < 38) { invalidLines.push({ line: lineIdx + 1, reason: 'Invalid address' }); continue; }
      const amtNum = parseFloat(amount);
      if (isNaN(amtNum) || amtNum <= 0) { invalidLines.push({ line: lineIdx + 1, reason: 'Invalid amount' }); continue; }
      if (seenAddresses.has(addr)) { invalidLines.push({ line: lineIdx + 1, reason: 'Duplicate address' }); continue; }
      seenAddresses.add(addr);
      recipients.push({ address: addr, amount: amount });
    }
  } else {
    const addrsText = document.getElementById('btUniformAddrs').value.trim();
    const amount = document.getElementById('btUniformAmount').value;
    if (!addrsText || !amount) { showStatus('btStatus', 'Please enter the address list and amount', 'warning'); return; }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) { showStatus('btStatus', 'Amount must be greater than 0', 'warning'); return; }
    const addrs = addrsText.split('\n').map(a => a.trim()).filter(a => a);
    for (let i = 0; i < addrs.length; i++) {
      const addr = addrs[i];
      if (!addr.startsWith('paxi1') || addr.length < 38) { invalidLines.push({ line: i + 1, reason: 'Invalid address' }); continue; }
      if (seenAddresses.has(addr)) { invalidLines.push({ line: i + 1, reason: 'Duplicate address' }); continue; }
      seenAddresses.add(addr);
      recipients.push({ address: addr, amount: amount });
    }
  }
  if (recipients.length === 0) { showStatus('btStatus', 'Could not parse any valid recipient address', 'warning'); return; }
  const validRecipients = recipients.filter(r => { try { bech32Decode(r.address); return true; } catch { return false; } });
  if (validRecipients.length === 0) { showStatus('btStatus', 'No valid Paxi address (bech32 validation failed)', 'error'); return; }
  const maxTotal = CONFIG.batchTransfer.maxTotalAddresses;
  if (validRecipients.length > maxTotal) {
    showStatus('btStatus', `Maximum ${maxTotal} recipient addresses supported; current ${validRecipients.length} exceeds the limit`, 'warning');
    return;
  }
  state.batchRecipients = validRecipients;
  renderBatchPreview(validRecipients, tokenType);
  document.getElementById('btPreview').style.display = 'block';
  document.getElementById('btSendBtn').style.display = 'inline-flex';
  document.getElementById('btClearBtn').style.display = 'inline-flex';
  document.getElementById('btStatus').style.display = 'none';
  if (invalidLines.length > 0) {
    setTimeout(() => {
      showStatus('btStatus', `⚠️ Skipped ${invalidLines.length} invalid rows: ${invalidLines.slice(0,5).map(l => `row ${l.line} (${l.reason})`).join(', ')}${invalidLines.length>5?'...':''}`, 'warning');
    }, 100);
  }
}

function renderBatchPreview(recipients, tokenType) {
  const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const tokenLabel = tokenType === 'native' ? 'PAXI' : tokenType === 'prc20' ? 'PRC-20' : 'NFT';
  const feePerAddr = tokenType === 'nft'
    ? CONFIG.batchTransfer.nftFeePerAddress
    : CONFIG.batchTransfer.feePerAddress;
  const feeAmount = recipients.length * feePerAddr;
  const feeNote = `${feePerAddr} PAXI/address`;
  const batchCount = Math.ceil(recipients.length / CONFIG.batchTransfer.maxAddressesPerTx);
  const maxTotal = CONFIG.batchTransfer.maxTotalAddresses;
  const pct = Math.min((recipients.length / maxTotal) * 100, 100);
  const batchPct = Math.min(100, 100);
  const batches = [];
  for (let i = 0; i < recipients.length; i += CONFIG.batchTransfer.maxAddressesPerTx) {
    batches.push(recipients.slice(i, i + CONFIG.batchTransfer.maxAddressesPerTx).length);
  }
  document.getElementById('btStats').innerHTML = `
    <div style="grid-column:1/-1;margin-bottom:8px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
        <span style="font-weight:700;color:#10b981;">✅ Parsed ${recipients.length}/${maxTotal} addresses (verified)</span>
        <span style="color:var(--text-muted);">Used ${pct.toFixed(1)}%</span>
      </div>
      <div style="width:100%;height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:#10b981;transition:width .3s ease;border-radius:4px;"></div>
      </div>
      <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
        ${batches.map((len, i) => {
          const bpct = (len / CONFIG.batchTransfer.maxAddressesPerTx) * 100;
          return `<div style="min-width:60px;padding:4px 8px;background:var(--bg);border-radius:6px;font-size:11px;">
            <div style="font-weight:600;color:#6366f1;">Batch ${i+1}</div>
            <div style="color:var(--text-muted);">${len} addresses · ${bpct.toFixed(0)}% used</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="stat-card"><div class="stat-value">${recipients.length}</div><div class="stat-label">Recipient count</div></div>
    <div class="stat-card"><div class="stat-value">${tokenType === 'nft' ? recipients.length : totalAmount.toLocaleString()}</div><div class="stat-label">${tokenType === 'nft' ? 'NFT count' : 'Total amount (' + tokenLabel + ')'}</div></div>
    <div class="stat-card"><div class="stat-value">${feeAmount.toFixed(5)}</div><div class="stat-label">Service fee ${feeNote}</div></div>
    <div class="stat-card"><div class="stat-value">${batchCount}</div><div class="stat-label">Sent in ${batchCount} batches</div></div>
  `;
  const tbody = document.getElementById('btPreviewBody');
  tbody.innerHTML = recipients.map((r, i) => `
    <tr><td>${i+1}</td><td><code>${escapeHtml(r.address.slice(0,14))}...${escapeHtml(r.address.slice(-8))}</code></td><td>${escapeHtml(parseFloat(r.amount).toLocaleString())}</td><td>${tokenLabel}</td></tr>
  `).join('');
}

function clearBatchTransfer() {
  state.batchRecipients = [];
  document.getElementById('btPreview').style.display = 'none';
  document.getElementById('btSendBtn').style.display = 'none';
  document.getElementById('btClearBtn').style.display = 'none';
  document.getElementById('btStatus').style.display = 'none';
}

async function executeBatchTransfer() {
  if (!state.connected) { showStatus('btStatus', 'Please connect your wallet first', 'warning'); return; }
  if (state.batchRecipients.length === 0) { showStatus('btStatus', 'No transfers to send', 'warning'); return; }
  const btn = document.getElementById('btSendBtn');
  btn.disabled = true;
  const statusEl = document.getElementById('btStatus');
  const totalRecipients = state.batchRecipients.length;
  const tokenType = state.batchTokenType;
  const maxPerTx = CONFIG.batchTransfer.maxAddressesPerTx;
  const batches = [];
  for (let i = 0; i < totalRecipients; i += maxPerTx) {
    batches.push(state.batchRecipients.slice(i, i + maxPerTx));
  }
  const feePerAddr = tokenType === 'nft'
    ? CONFIG.batchTransfer.nftFeePerAddress
    : CONFIG.batchTransfer.feePerAddress;
  const totalFeePaxi = totalRecipients * feePerAddr;

  const totalAmount = state.batchRecipients.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const tokenLabel = tokenType === 'native' ? 'PAXI' : tokenType === 'prc20' ? 'PRC-20' : 'NFT';
  const okBatch = confirm(
    `Confirm batch transfer?\n\n` +
    `Recipient count: ${totalRecipients} (in ${batches.length} batches)\n` +
    `Total transfer amount: ${totalAmount} ${tokenLabel}\n` +
    `Service fee: ${totalFeePaxi.toFixed(5)} PAXI (${feePerAddr} PAXI/address, included)\n` +
    `Fee recipient: ${CONFIG.feeCollector}\n\n` +
    `Click "OK" to sign in your wallet; please verify the above in your wallet.`
  );
  if (!okBatch) { btn.disabled = false; return; }

  statusEl.className = 'status-msg info';
  statusEl.style.display = 'block';
  statusEl.innerHTML = `<div style="font-weight:600;font-size:14px;margin-bottom:8px;">⏳ Preparing to send (${totalRecipients} addresses in ${batches.length} batches)...</div>`;

  const txHashes = [];
  let successCount = 0;
  let failCount = 0;

  try {
    const sender = state.wallet;
    const denom = CONFIG.denom;
    const chainId = CONFIG.chainId;

    // PRC-20 pre-query decimals (reused per batch)
    let prc20Decimals = 6;
    if (tokenType === 'prc20') {
      const contractAddr = document.getElementById('btPrc20Contract')?.value.trim();
      if (!contractAddr) throw new Error('Missing PRC-20 contract address');
      try {
        const queryMsg = btoa(JSON.stringify({ token_info: {} }));
        const queryRes = await fetchAPI(`/cosmwasm/wasm/v1/contract/${contractAddr}/smart/${queryMsg}`);
        if (queryRes?.data?.decimals !== undefined) prc20Decimals = queryRes.data.decimals;
      } catch (e) {}
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchNum = batchIdx + 1;
      const batchFeePaxi = batch.length * feePerAddr;
      const batchFeeMicro = paxiToUpaxi(batchFeePaxi.toFixed(8));

      btn.innerHTML = `<span class="spinner"></span> Batch ${batchNum}/${batches.length} signing...`;
      statusEl.innerHTML = `<div style="font-weight:600;font-size:14px;margin-bottom:8px;">⏳ Sending batch ${batchNum}/${batches.length} (${batch.length} addresses)</div><div style="font-size:13px;">💰 Batch service fee: ${batchFeePaxi.toFixed(5)} PAXI</div>`;

      // build this batch's messages
      const allMessages = [];
      for (const r of batch) {
        if (tokenType === 'native') {
          const amountMicro = paxiToUpaxi(r.amount);
          const msg = PaxiCosmJS.MsgSend.fromPartial({ fromAddress: sender.address, toAddress: r.address, amount: [PaxiCosmJS.coins(amountMicro, denom)[0]] });
          allMessages.push(PaxiCosmJS.Any.fromPartial({ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: PaxiCosmJS.MsgSend.encode(msg).finish() }));
        } else if (tokenType === 'prc20') {
          const contractAddr = document.getElementById('btPrc20Contract')?.value.trim();
          const rawAmount = parseFloatToRawUnits(r.amount, prc20Decimals);
          const msgObj = { transfer: { recipient: r.address, amount: rawAmount } };
          const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({ sender: sender.address, contract: contractAddr, msg: new TextEncoder().encode(JSON.stringify(msgObj)) });
          allMessages.push(PaxiCosmJS.Any.fromPartial({ typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract', value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish() }));
        } else if (tokenType === 'nft') {
          const nftContract = document.getElementById('btNftContract')?.value.trim();
          const msgObj = { transfer_nft: { recipient: r.address, token_id: String(r.amount) } };
          const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({ sender: sender.address, contract: nftContract, msg: new TextEncoder().encode(JSON.stringify(msgObj)) });
          allMessages.push(PaxiCosmJS.Any.fromPartial({ typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract', value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish() }));
        }
      }
      // service-fee message (same MsgSend to feeCollector as before)
      if (batchFeeMicro !== '0') {
        const feeMsg = PaxiCosmJS.MsgSend.fromPartial({ fromAddress: sender.address, toAddress: CONFIG.feeCollector, amount: [PaxiCosmJS.coins(batchFeeMicro, denom)[0]] });
        allMessages.push(PaxiCosmJS.Any.fromPartial({ typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: PaxiCosmJS.MsgSend.encode(feeMsg).finish() }));
      }

      // fetch account info (sequence must be refreshed each batch)
      const accountData = await fetchAPI(`/cosmos/auth/v1beta1/accounts/${sender.address}`);
      const account = accountData.account?.base_account || accountData.account;
      const accountNumber = Number(account.account_number);
      const sequence = Number(account.sequence);

      const txBody = PaxiCosmJS.TxBody.fromPartial({ messages: allMessages, memo: `Paxi Toolbox Batch ${batchNum}/${batches.length} (${batch.length} recipients) | Fee: ${batchFeePaxi.toFixed(5)} PAXI` });
      const memo = `Paxi Toolbox Batch ${batchNum}/${batches.length} (${batch.length} recipients) | Fee: ${batchFeePaxi.toFixed(5)} PAXI`;
      const pubkeyBytes = typeof sender.public_key === 'string' ? fromBase64(sender.public_key) : new Uint8Array(sender.public_key);

      // ⭐ 1. first do on-chain Gas simulation (core change requested by user)
      let totalGas = 0;
      let simulatedGas = null;
      const fallbackGas = allMessages.length * 90000 + 200000;
      const simBtnText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Batch ${batchNum}/${batches.length} simulating...`;
      statusEl.innerHTML = `<div style="font-weight:600;font-size:14px;margin-bottom:8px;">⏳ Batch ${batchNum}/${batches.length} (${batch.length} addresses) on-chain Gas simulation...</div><div style="font-size:13px;">📊 Computing actual gas_used × safety factor = final gas_wanted</div>`;
      try {
        simulatedGas = await simulateGas(allMessages, memo, accountNumber, sequence, sender.public_key, sender.address);
      } catch (e) {
        console.warn('[BatchTx] simulateGas failed, fallback to estimate:', e.message);
      }
      if (simulatedGas && simulatedGas > 0) {
        // pick a safety factor by message count: more messages → more uncertainty → higher factor
        // 1~30 msg: 1.10x  |  31~70 msg: 1.20x  |  71~100+ msg: 1.30x
        const msgCount = allMessages.length;
        const safetyRatio = msgCount <= 30 ? 1.10 : msgCount <= 70 ? 1.20 : 1.30;
        totalGas = Math.ceil(simulatedGas * safetyRatio);
        showToast(`📊 Gas simulation: actual ${simulatedGas.toLocaleString()} × ${safetyRatio} safety factor = ${totalGas.toLocaleString()}`, 'info');
      } else {
        totalGas = fallbackGas;
        showToast(`⚠️ Gas simulation failed, using estimate ${totalGas.toLocaleString()}`, 'warning');
      }
      const gasPriceMatch = /^([\d.]+)\s*upaxi$/i.exec((window.SHARED_CONFIG || {}).gasPrice || '0.25upaxi');
      const gasPricePerUnit = gasPriceMatch ? parseFloat(gasPriceMatch[1]) : 0.25;
      const fee = { amount: [PaxiCosmJS.coins(Math.floor(totalGas * gasPricePerUnit).toString(), denom)[0]], gasLimit: totalGas };
      const pubkeyAny = { typeUrl: '/cosmos.crypto.secp256k1.PubKey', value: PaxiCosmJS.PubKey.encode({ key: pubkeyBytes }).finish() };
      const authInfo = PaxiCosmJS.AuthInfo.fromPartial({ signerInfos: [{ publicKey: pubkeyAny, modeInfo: { single: { mode: 1 } }, sequence: BigInt(sequence) }], fee });
      const signDoc = PaxiCosmJS.SignDoc.fromPartial({ bodyBytes: PaxiCosmJS.TxBody.encode(txBody).finish(), authInfoBytes: PaxiCosmJS.AuthInfo.encode(authInfo).finish(), chainId, accountNumber: BigInt(accountNumber) });
      const txObj = { bodyBytes: toBase64(signDoc.bodyBytes), authInfoBytes: toBase64(signDoc.authInfoBytes), chainId, accountNumber: signDoc.accountNumber.toString() };

      btn.innerHTML = `<span class="spinner"></span> Batch ${batchNum}/${batches.length} waiting for signature...`;
      const result = await window.paxihub.paxi.signAndSendTransaction(txObj);
      if (!result || !result.success) throw new Error(result?.message || 'Signature failed or was rejected');
      const sigBytes = fromBase64(result.success);
      const txRaw = PaxiCosmJS.TxRaw.fromPartial({ bodyBytes: signDoc.bodyBytes, authInfoBytes: signDoc.authInfoBytes, signatures: [sigBytes] });
      const txBytes = PaxiCosmJS.TxRaw.encode(txRaw).finish();
      const base64Tx = toBase64(txBytes);

      btn.innerHTML = `<span class="spinner"></span> Batch ${batchNum}/${batches.length} broadcasting...`;
      const broadcastRes = await fetch(`${CONFIG.lcd}/cosmos/tx/v1beta1/txs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_bytes: base64Tx, mode: 'BROADCAST_MODE_SYNC' })
      }).then(r => r.json());
      const txResult = checkTxResult(broadcastRes);
      if (txResult.ok) {
        successCount += batch.length;
        txHashes.push(txResult.txhash);
        const actualGasUsed = broadcastRes.tx_response?.gas_used || '';
        showToast(`✅ Batch ${batchNum} succeeded (${batch.length} addresses)${actualGasUsed ? `, actual gas_used: ${actualGasUsed}` : ''}`, 'success');
      } else {
        failCount += batch.length;
        console.error(`Batch ${batchNum} failed:`, txResult.rawLog);
        showToast(`❌ Batch ${batchNum} failed: ${mapError(txResult.code, txResult.rawLog)}`, 'error');
      }
      // wait 2s between batches to let sequence update
      if (batchIdx < batches.length - 1) {
        statusEl.innerHTML = `<div style="font-weight:600;font-size:14px;margin-bottom:8px;">⏳ Batch ${batchNum} done, waiting for on-chain confirmation...</div><div style="font-size:13px;">Completed ${successCount}/${totalRecipients} addresses</div>`;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // summarize results
    if (failCount === 0) {
      statusEl.className = 'status-msg success';
      statusEl.innerHTML = `
        <div style="font-weight:600;font-size:16px;margin-bottom:10px;color:var(--success)">✅ All done!</div>
        <div style="font-size:13px;line-height:1.8;">📤 Transfers: ${successCount} (${batches.length} batches)<br>💰 Service fee: ${totalFeePaxi.toFixed(5)} PAXI (included)<br>🔗 <a href="https://explorer.paxinet.io/tx/${txHashes[0]}" target="_blank" style="color:var(--primary)">View first transaction details</a>${txHashes.length > 1 ? ` (total ${txHashes.length} transactions)` : ''}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;background:rgba(99,102,241,0.1);padding:8px 12px;border-radius:6px;">💡 If the recipient's wallet doesn't show the record, open "Balance Check" and click "📜 Incoming records" to see the full on-chain history</div>
      `;
      txHashes.forEach(h => pollTxStatus(h));
      showToast(`✅ All done! ${successCount} transfers`, 'success');
    } else {
      statusEl.className = 'status-msg warning';
      statusEl.innerHTML = `
        <div style="font-weight:600;font-size:16px;margin-bottom:10px;color:#ffd700;">⚠️ Partially completed</div>
        <div style="font-size:13px;line-height:1.8;">✅ Success: ${successCount}<br>❌ Failed: ${failCount}<br>💰 Service fee: ${(successCount * feePerAddr).toFixed(5)} PAXI (charged only on successful transfers)</div>
      `;
    }
    refreshBalance();
    clearBatchTransfer();
  } catch (e) {
    console.error('Batch transfer error:', e);
    statusEl.className = 'status-msg error';
    statusEl.innerHTML = `❌ Execution failed: ${mapError(undefined, e.message)}${successCount > 0 ? `<br><br>✅ ${successCount} succeeded, service fee ${(successCount * feePerAddr).toFixed(5)} PAXI` : ''}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 Execute Batch Transfer';
  }
}

window.TOOL_REGISTRY['batch-transfer'] = { render: renderBatchTransfer, bind: bindBatchTransferEvents };
