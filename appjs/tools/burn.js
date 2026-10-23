/* ============================================================================
 * Paxi Suite · Token Burner module (burn)
 * Ported from burn/index.html: calls the PRC-20 contract's burn method to permanently destroy tokens
 * Improvement: amount parsing uses shared.js's parseFloatToRawUnits (BigInt, no floating-point error);
 *       displays token symbol and double-confirms before burning; reuses the suite top-bar wallet state
 * ==========================================================================*/

window.TOOL_REGISTRY ||= {};

(function () {
  'use strict';

  /* ------------------------------------------------ i18n (in-tool dictionary, zh/en mirrored) */
  const BURN_DICT = {
  en: {
      connected: '✅ Connected: <span class="mono">{0}…</span>',
      notConnected: 'Not connected (connect your wallet at the top-right first)',
      disconnected: 'Not connected',
      queryFailHttp: 'Contract query failed (HTTP {0}). Please verify it is a PRC-20 contract address',
      notToken: 'This contract returned no token_info — it may not be a standard PRC-20 token and cannot be burned',
      signFail: 'PaxiHub signing failed',
      connectFirst: 'Please connect your wallet first',
      badContract: 'Please enter a valid PRC-20 contract address (full paxi1... address)',
      badAmount: 'Please enter a valid burn amount (positive number)',
      querying: '⏳ Querying token info...',
      tokenLabel: 'Token: ',
      decimalsInfo: ', decimals: {0}',
      zeroAmount: 'Converted burn amount is 0 — please check the decimals',
      burnBtn: '🔥 Burn Now',
      confirmTitle: 'Confirm burn of {0} {1}?',
      confirmConverted: '→ Actual burn amount: {0} {1} (base units: {2})',
      confirmIrreversible: '→ Total supply will be permanently reduced. This cannot be undone!',
      signing: '⏳ Signing burn...',
      preparing: '⏳ Preparing to burn {0} {1}',
      noTxHash: 'Node returned no tx hash — burn result unknown. Do not retry blindly; verify with the on-chain decoder first',
      successHtml: '🔥 Burn successful! Total supply has been permanently reduced.',
      successToast: '🔥 Burn successful! Total supply has been permanently reduced!',
      failPrefix: '❌ Failed: ',
      title: '🔥 Token Burner',
      desc: 'Calls the burn method of a PRC-20 contract to permanently destroy tokens (reduces total supply, irreversible). No platform fee — on-chain gas only.',
      contractLabel: 'Token contract address (PRC-20 / CW20)',
      amountLabel: 'Burn amount (in display units, e.g. 100)',
      amountPlaceholder: 'e.g. 100',
      warn: '⚠️ Burning is irreversible. Only PRC-20 contracts implementing the standard burn method are supported. Please double-check the contract address and amount before burning.',
      unitFull: 'tokens',
      unit: 'tokens'
    }
  };
  const bPt = (k, ...a) => {
    const lang = (typeof currentLang !== 'undefined' && currentLang) || 'zh';
    let s = (BURN_DICT[lang] && BURN_DICT[lang][k]) || BURN_DICT.en[k] || k;
    a.forEach((v, i) => { s = s.split('{' + i + '}').join(String(v)); });
    return s;
  };

  /* ------------------------------------------------ Config (follows shell's main/testnet switch) */
  const LCD = () => (typeof getLCD === 'function'
    ? getLCD() : 'https://mainnet-lcd.paxinet.io');
  const RPC = () => (typeof getNetworkConfig === 'function'
    ? getNetworkConfig().rpc : 'https://mainnet-rpc.paxinet.io');
  const DENOM = 'upaxi';

  let walletAddr = '';
  let tokenInfo = null;      // {symbol, decimals, name}
  let lastContract = '';     // cache for already-queried contract

  const esc = (s) => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s);

  async function syncWallet() {
    if (typeof state !== 'undefined' && state.connected && state.wallet && state.wallet.address) {
      walletAddr = state.wallet.address;
      return true;
    }
    walletAddr = '';
    return false;
  }

  function updateWalletUI() {
    const el = document.getElementById('burnWalletStatus');
    const btn = document.getElementById('burnBtn');
    if (!el || !btn) return;
    if (walletAddr) {
      el.innerHTML = bPt('connected', esc(walletAddr.slice(0, 10)));
      btn.disabled = false;
    } else {
      el.textContent = bPt('notConnected');
      btn.disabled = true;
    }
  }

  /* Query token info (symbol/decimals) */
  async function fetchTokenInfo(contractAddr) {
    const queryObj = JSON.stringify({ token_info: {} });
    const url = `${LCD()}/cosmwasm/wasm/v1/contract/${contractAddr}/smart/` + btoa(queryObj);
    const res = await fetch(url);
    if (!res.ok) throw new Error(bPt('queryFailHttp', res.status));
    const data = await res.json();
    if (data.data && data.data.decimals !== undefined) {
      return { symbol: data.data.symbol || '', decimals: Number(data.data.decimals) || 6, name: data.data.name || '' };
    }
    throw new Error(bPt('notToken'));
  }

  /* Build burn execute message */
  function buildBurnMsg(contractAddr, amountMicro) {
    const msgObj = { burn: { amount: String(amountMicro) } };
    const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({
      sender: walletAddr,
      contract: contractAddr,
      msg: new TextEncoder().encode(JSON.stringify(msgObj)),
      funds: []
    });
    return PaxiCosmJS.Any.fromPartial({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish()
    });
  }

  /* Build, sign and broadcast (PaxiHub) */
  async function buildAndSendTx(messages, memo) {
    const chainId = await fetch(`${RPC()}/status`).then(r => r.json()).then(d => d.result.node_info.network);
    const sender = await window.paxihub.paxi.getAddress();
    const acctRes = await fetch(`${LCD()}/cosmos/auth/v1beta1/accounts/${sender.address}`);
    const { account } = await acctRes.json();
    const ba = account.base_account || account;
    const accountNumber = Number(ba.account_number);
    const sequence = Number(ba.sequence);

    const txBody = PaxiCosmJS.TxBody.fromPartial({ messages, memo });
    const gasLimit = 400000;
    const gp = (typeof SHARED_CONFIG !== 'undefined' && SHARED_CONFIG.gasPrice) ? parseFloat(SHARED_CONFIG.gasPrice) : 0.25;
    const feeAmount = Math.ceil(gasLimit * gp);
    const fee = { amount: [PaxiCosmJS.coins(String(feeAmount), DENOM)[0]], gasLimit };

    const pubkeyBytes = (typeof sender.public_key === 'string') ? fromBase64(sender.public_key) : new Uint8Array(sender.public_key);
    const pubkeyAny = {
      typeUrl: "/cosmos.crypto.secp256k1.PubKey",
      value: PaxiCosmJS.PubKey.encode({ key: pubkeyBytes }).finish()
    };
    const authInfo = PaxiCosmJS.AuthInfo.fromPartial({
      signerInfos: [{ publicKey: pubkeyAny, modeInfo: { single: { mode: 1 } }, sequence: BigInt(sequence) }],
      fee
    });
    const signDoc = PaxiCosmJS.SignDoc.fromPartial({
      bodyBytes: PaxiCosmJS.TxBody.encode(txBody).finish(),
      authInfoBytes: PaxiCosmJS.AuthInfo.encode(authInfo).finish(),
      chainId,
      accountNumber: BigInt(accountNumber)
    });

    const toB64 = (bytes) => (typeof toBase64 === 'function')
      ? toBase64(bytes)
      : btoa(String.fromCharCode(...new Uint8Array(bytes)));

    const txObj = {
      bodyBytes: toB64(signDoc.bodyBytes),
      authInfoBytes: toB64(signDoc.authInfoBytes),
      chainId,
      accountNumber: signDoc.accountNumber.toString()
    };
    const result = await window.paxihub.paxi.signAndSendTransaction(txObj);
    if (!result || !result.success) throw new Error(bPt('signFail'));
    const sigBytes = Uint8Array.from(atob(result.success), c => c.charCodeAt(0));

    const txRaw = PaxiCosmJS.TxRaw.fromPartial({
      bodyBytes: signDoc.bodyBytes,
      authInfoBytes: signDoc.authInfoBytes,
      signatures: [sigBytes]
    });
    const base64Tx = toB64(PaxiCosmJS.TxRaw.encode(txRaw).finish());

    const broadcastResult = await fetch(`${LCD()}/cosmos/tx/v1beta1/txs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_bytes: base64Tx, mode: "BROADCAST_MODE_SYNC" })
    }).then(r => r.json());

    const txResp = broadcastResult.tx_response || broadcastResult;
    if (txResp && txResp.code && txResp.code !== 0) {
      throw new Error(typeof mapError === 'function' ? mapError(txResp.code, txResp.raw_log || '') : ('Transaction failed: ' + (txResp.raw_log || txResp.code)));
    }
    return txResp;
  }

  /* Burn main logic */
  async function burnTokens() {
    const statusEl = document.getElementById('burnStatus');
    const btn = document.getElementById('burnBtn');
    const showToastMsg = (msg, type) => {
      if (typeof showToast === 'function') showToast(msg, type);
      else if (statusEl) statusEl.textContent = msg;
    };

    if (!walletAddr) { showToastMsg(bPt('connectFirst'), 'error'); return; }

    const contractAddr = document.getElementById('burnContract').value.trim().toLowerCase();
    const amountInput = document.getElementById('burnAmount').value.trim();
    if (!/^paxi1[0-9a-z]{38}$/.test(contractAddr)) {
      showToastMsg(bPt('badContract'), 'error'); return;
    }
    if (!amountInput || !/^\d*\.?\d+$/.test(amountInput) || Number(amountInput) <= 0) {
      showToastMsg(bPt('badAmount'), 'error'); return;
    }

    try {
      btn.disabled = true;

      // 1. Query token info (cache)
      if (!tokenInfo || lastContract !== contractAddr) {
        btn.textContent = bPt('querying');
        tokenInfo = await fetchTokenInfo(contractAddr);
        lastContract = contractAddr;
        const infoDiv = document.getElementById('burnTokenInfo');
        if (infoDiv) {
          infoDiv.innerHTML = `${esc(bPt('tokenLabel'))}<b>${esc(tokenInfo.name || tokenInfo.symbol)}</b>` +
            (tokenInfo.symbol ? `（${esc(tokenInfo.symbol)}）` : '') +
            esc(bPt('decimalsInfo', tokenInfo.decimals));
        }
      }

      // 2. Amount conversion (BigInt, no floating-point error)
      const amountMicro = parseFloatToRawUnits(amountInput, tokenInfo.decimals);
      if (!amountMicro || amountMicro === '0') {
        showToastMsg(bPt('zeroAmount'), 'error');
        btn.disabled = false; btn.textContent = bPt('burnBtn');
        return;
      }

      // 3. Double confirmation (show both raw input and actual converted result to eliminate display deviation)
      let displayConverted = amountMicro;
      try {
        if (window.PaxiDecoder && tokenInfo) {
          displayConverted = window.PaxiDecoder.formatUnits(amountMicro, '', tokenInfo.decimals);
        }
      } catch (_) {}
      const confirmMsg = bPt('confirmTitle', amountInput, tokenInfo.symbol || bPt('unitFull')) + '\n\n'
        + bPt('confirmConverted', displayConverted, tokenInfo.symbol || bPt('unit'), amountMicro) + '\n'
        + bPt('confirmIrreversible');
      if (!confirm(confirmMsg)) {
        btn.disabled = false; btn.textContent = bPt('burnBtn');
        return;
      }

      btn.textContent = bPt('signing');
      showToastMsg(bPt('preparing', amountInput, tokenInfo.symbol || bPt('unitFull')), 'info');

      // 4. Build message and send
      const msgs = [buildBurnMsg(contractAddr, amountMicro)];
      const txResp = await buildAndSendTx(msgs, `Burn ${amountInput} tokens`);
      if (!txResp || !txResp.txhash) {
        throw new Error(bPt('noTxHash'));
      }

      // 5. Success notice
      const hash = txResp && txResp.txhash ? txResp.txhash : '';
      statusEl.innerHTML = esc(bPt('successHtml'))
        + (hash ? `<br><span class="mono" style="font-size:.72rem">tx: ${esc(hash)}</span>` : '');
      showToastMsg(bPt('successToast'), 'success');
      if (typeof refreshBalance === 'function') refreshBalance();
    } catch (e) {
      console.error(e);
      showToastMsg(bPt('failPrefix') + (e.message || e), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = bPt('burnBtn');
    }
  }

  /* ------------------------------------------------ Register */
  function render() {
    return `
    <div id="pg-burn">
      <div class="card">
        <div class="card-title">${esc(bPt('title'))}</div>
        <div class="tool-desc">${esc(bPt('desc'))}</div>

        <div style="padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border);margin-bottom:14px;font-size:.85rem;color:var(--text-muted)" id="burnWalletStatus">${esc(bPt('disconnected'))}</div>

        <div class="form-group">
          <label class="form-label">${esc(bPt('contractLabel'))}</label>
          <input type="text" id="burnContract" placeholder="paxi1..." class="mono">
        </div>

        <div class="form-group">
          <label class="form-label">${esc(bPt('amountLabel'))}</label>
          <input type="text" id="burnAmount" placeholder="${esc(bPt('amountPlaceholder'))}">
          <div id="burnTokenInfo" style="margin-top:6px;font-size:.78rem;color:var(--text-muted)"></div>
        </div>

        <button class="btn btn-primary" id="burnBtn" disabled>${esc(bPt('burnBtn'))}</button>
        <div class="status-msg" id="burnStatus"></div>

        <div style="margin-top:14px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;text-align:center;">
          ${esc(bPt('warn'))}
        </div>
      </div>
    </div>`;
  }

  window.TOOL_REGISTRY['burn'] = {
    render,
    async onMount() {
      await syncWallet();
      updateWalletUI();
    },
    bind() {
      document.getElementById('burnBtn').addEventListener('click', burnTokens);
      document.getElementById('burnAmount').addEventListener('keydown', e => {
        if (e.key === 'Enter') burnTokens();
      });
      // Reset token info cache when switching contract
      document.getElementById('burnContract').addEventListener('change', () => {
        tokenInfo = null; lastContract = '';
        document.getElementById('burnTokenInfo').textContent = '';
      });
    },
  };
})();
