/* ============================================================================
 * Paxi Suite · Custom Token Launcher (Token/NFT one-click deployment)
 * Ported from paxi-pump-main: template-based PRC-20 / PRC-721 contract deployment
 *  - PRC-20: 25 PAXI (mint/freeze admin rights auto-revoked after issuance)
 *  - PRC-721：50 PAXI
 * Depends on: PaxiCosmJS (official SDK), shared.js (toBase64/escapeHtml/showStatus),
 *       core.js (state wallet state, currentLang)
 * Note: the original standalone page's i18n / wallet / signing logic is fully wrapped in this module closure to avoid global namespace conflicts
 * ==========================================================================*/

window.TOOL_REGISTRY ||= {};

(function () {
  'use strict';

  /* ------------------------------------------------ Config (follows the shell's mainnet/testnet switch) */
  const RPC = () => (typeof getNetworkConfig === 'function'
    ? getNetworkConfig().rpc : 'https://mainnet-rpc.paxinet.io');
  const LCD = () => (typeof getLCD === 'function'
    ? getLCD() : 'https://mainnet-lcd.paxinet.io');
  const DENOM = 'upaxi';
  const PREFIX = 'paxi';
  const PRC20_DECIMALS = 6;   // Fixed by the official launch platform, not modifiable

  // ImgBB image host (two keys in rotation; auto-retry when one fails)
  const IMGBB_API_KEYS = [
    '98eb5c71d6b0ee63b1384f05bc4f0a81',
    'ca48b21f1a93e90b85bee090e34b36f2'
  ];
  const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

  // Recipient: unified to the single platform fee address (CONFIG.feeCollector), no random rotation (see getRandomReceiver)

  /* ------------------------------------------------ Pump-specific i18n */
  const PT_DICT = {
  en: {
      templateLabel: 'Select Template', feeLabel: 'Service Fee', feeUnit: ' PAXI',
      deployBtn: '🚀 Deploy', deployingBtn: 'Deploying...', revokingBtn: 'Revoking permissions...',
      walletDisconnected: 'Not connected', walletConnectedPrefix: '✅', connectHint: 'Connect wallet via header first',
      templateLoadFail: 'Failed to load templates',
      alertConnectFirst: 'Please connect a wallet first', alertSelectTemplate: 'Please select a template first',
      alertUploadFail: 'Image upload failed: ', alertDeployFail: 'Deploy failed: ',
      alertImageType: 'Please select an image file (JPG / PNG / GIF, etc.)',
      alertImageSize: 'Image size must not exceed 32MB',
      alertReadFileFail: 'Failed to read the image file',
      alertUploadGeneral: 'Image upload failed',
      fields: { name: 'Token Name', symbol: 'Token Symbol', total_supply: 'Total Supply (units)', project: 'Project URL', description: 'Token Description', logo_url: 'Logo URL (required)', minter: 'Minter Address' },
      placeholders: { name: 'Token Name', symbol: 'Token Symbol (e.g. PAXI)', project: 'Project URL https://…', description: 'Token Description' },
      templates: { prc20: 'PRC-20 Fungible Token', prc721: 'PRC-721 NFT Collection' },
      logoUrlPlaceholder: 'Or paste an image URL (https://…)',
      uploadingBtn: 'Uploading...',
      resultSuccessTitle: '✅ Issued successfully!',
      resultContractAddr: 'Contract Address: ', resultTxHash: 'Tx Hash: ',
      resultTotalSupply: 'Total Supply: ', resultTotalSupplySuffix: ' (all minted to your wallet)',
      resultFee: 'Service Fee: ', resultFeeSuffix: ' PAXI (auto-deducted)',
      resultLogoUrl: 'Logo URL: ', resultNoLogo: 'N/A',
      resultMinter: 'Minter: ', resultMinterSuffix: ' (you can use this address for future minting)',
      resultMinterRevokedSuffix: ' (mint & freeze authority auto-revoked after issuance)',
      resultRevokeLabel: 'Mint/Freeze Authority: ',
      resultRevokeOk: 'Auto-revoked (no further minting, accounts cannot be frozen)',
      resultRevokeFail: 'Auto-revocation failed! Please manually send an update_minter (null) tx to the contract.',
      resultNotReadyTitle: '⚠️ Tx submitted, but contract address not yet available.',
      resultNotReadyTip: 'Check back later with the on-chain decoder.',
      errNameRequired: 'Token name is required', errSymbolRequired: 'Token symbol is required',
      errNftNameRequired: 'NFT name is required', errNftSymbolRequired: 'NFT symbol is required',
      errDecimalsRange: 'Decimals must be between 0 and 36',
      errTotalSupplyPositive: 'Total supply must be a positive integer',
      errTotalSupplyInteger: 'Total supply must be a non-negative integer',
      errLogoRequired: 'Logo URL is required! Please upload an image and paste the public link.',
      errLogoScheme: 'Logo URL must start with http://, https:// or ipfs://',
      errProjectUrl: 'Project URL must start with http:// or https://',
      errMinterInvalid: 'Invalid minter address (should start with paxi1)',
      errReceiverConfig: 'Receiver address configuration error', errPubkeyMissing: 'Public key missing, please reconnect wallet',
      errUnknownTemplate: 'Unknown template', errChainId: 'Failed to fetch chainId', errAccount: 'Failed to fetch account info',
      errSignPaxihub: 'PaxiHub signing failed', errBroadcast: 'Broadcast failed: ',
      errTxFail: (c, l) => `Transaction failed (code=${c}): ${l || ''}`,
      errTxOnchain: 'Transaction failed on-chain: ', errUnknownWallet: 'Unknown wallet type',
    }
  };
  const pt = (key, ...args) => {
    const lang = (typeof currentLang !== 'undefined' && currentLang) || 'en';
    let v;
    if (window.PAXI_LANGS && PAXI_LANGS[lang] && PAXI_LANGS[lang].pump && PAXI_LANGS[lang].pump[key] != null) {
      v = PAXI_LANGS[lang].pump[key];
    } else {
      v = (PT_DICT[lang] && PT_DICT[lang][key] !== undefined) ? PT_DICT[lang][key] : PT_DICT.en[key];
    }
    return typeof v === 'function' ? v(...args) : v;
  };

  /* ------------------------------------------------ Module state */
  let templates = [];
  let currentTemplate = null;
  let walletAddr = '';        // Wallet address used for deployment
  let walletPubkey = null;    // Cached pubkey to avoid repeated prompts
  let walletType = null;      // 'paxihub' | 'keplr'

  const esc = (s) => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const b64 = (bytes) => (typeof toBase64 === 'function') ? toBase64(bytes) : btoa(String.fromCharCode(...bytes));

  function isValidPaxiAddress(addr) {
    return typeof addr === 'string' && /^paxi1[0-9a-z]{38}$/.test(addr);
  }
  // Unified recipient: all token-launch service fees go to the platform's single fee address (consistent with the monitor backend and other tools)
  function getRandomReceiver() {
    return (typeof CONFIG !== 'undefined' && CONFIG.feeCollector) || 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg';
  }

  /* ------------------------------------------------ Wallet (reuses suite state, Keplr fallback) */
  async function syncWallet() {
    // Prefer the PaxiHub wallet already connected in the suite header
    if (typeof state !== 'undefined' && state.connected && state.wallet && state.wallet.address) {
      walletAddr = state.wallet.address;
      walletType = 'paxihub';
      if (state.wallet.public_key && state.wallet.public_key.length) {
        walletPubkey = (typeof state.wallet.public_key === 'string') ? fromBase64(state.wallet.public_key) : new Uint8Array(state.wallet.public_key);
      } else if (typeof window.paxihub !== 'undefined' && window.paxihub.paxi) {
        try {
          const info = await window.paxihub.paxi.getAddress();  // Re-fetch pubkey (may prompt once)
          walletPubkey = (typeof info.public_key === 'string') ? fromBase64(info.public_key) : new Uint8Array(info.public_key);
        } catch (_) { /* keep empty; errors surface at deploy time */ }
      }
      return;
    }
    // Keplr fallback
    if (typeof window.keplr !== 'undefined') {
      try {
        await window.keplr.enable(PREFIX);
        const signer = window.keplr.getOfflineSigner(PREFIX);
        const accounts = await signer.getAccounts();
        walletAddr = accounts[0].address;
        walletPubkey = accounts[0].pubkey;
        walletType = 'keplr';
        return;
      } catch (_) { /* stay disconnected if the user rejects */ }
    }
    walletAddr = ''; walletPubkey = null; walletType = null;
  }

  function updateWalletUI() {
    const statusEl = document.getElementById('pumpStatus');
    const deployBtn = document.getElementById('pumpDeployBtn');
    if (!statusEl || !deployBtn) return;
    if (walletAddr) {
      statusEl.textContent = `${pt('walletConnectedPrefix')} ${walletAddr.slice(0, 10)}...`;
      deployBtn.disabled = !currentTemplate;
    } else {
      statusEl.textContent = pt('walletDisconnected');
      deployBtn.disabled = true;
    }
  }

  /* ------------------------------------------------ ImgBB upload */
  async function uploadToImgbb(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) throw new Error(pt('alertImageType'));
    if (file.size > 32 * 1024 * 1024) throw new Error(pt('alertImageSize'));
    const base64Full = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error(pt('alertReadFileFail')));
      fr.readAsDataURL(file);
    });
    const pureBase64 = base64Full.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    let lastErr = null;
    for (let i = 0; i < IMGBB_API_KEYS.length; i++) {
      const key = IMGBB_API_KEYS[i];
      const formData = new FormData();
      formData.append('key', key);
      formData.append('image', pureBase64);
      formData.append('name', file.name || 'paxi-logo');
      try {
        const resp = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
        const data = await resp.json();
        if (resp.ok && data && data.success && data.data && (data.data.url || data.data.display_url)) {
          return data.data.url || data.data.display_url;
        }
        const errMsg = (data && data.error && data.error.message)
          || (data && data.status_code ? `status=${data.status_code}` : pt('alertUploadGeneral'));
        lastErr = new Error(`Key${i + 1} ${errMsg}`);
      } catch (e) {
        lastErr = new Error(`Key${i + 1}: ${e.message || e}`);
      }
    }
    throw lastErr || new Error(pt('alertUploadGeneral'));
  }

  /* ------------------------------------------------ BigInt supply calculation */
  function calculateAmount(totalSupply, decimals) {
    const totalStr = String(totalSupply).trim();
    if (!/^\d+$/.test(totalStr)) throw new Error(pt('errTotalSupplyInteger'));
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error(pt('errDecimalsRange'));
    return (BigInt(totalStr) * (BigInt(10) ** BigInt(decimals))).toString();
  }

  /* ------------------------------------------------ Hand-rolled protobuf encoding (MsgInstantiateContract) */
  function concatBytes(arrs) {
    const total = arrs.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const a of arrs) { out.set(a, off); off += a.length; }
    return out;
  }
  function encodeVarintBytes(n) {
    let v = BigInt(n);
    const bytes = [];
    if (v === 0n) return Uint8Array.of(0);
    while (v > 0n) {
      let low = Number(v & 0x7fn);
      v >>= 7n;
      if (v > 0n) low |= 0x80;
      bytes.push(low);
    }
    return Uint8Array.from(bytes);
  }
  function encodeTag(fieldNumber, wireType) {
    return encodeVarintBytes((BigInt(fieldNumber) << 3n) | BigInt(wireType));
  }
  function encodeStringField(fieldNumber, str) {
    const body = new TextEncoder().encode(str);
    return concatBytes([encodeTag(fieldNumber, 2), encodeVarintBytes(body.length), body]);
  }
  function encodeBytesField(fieldNumber, bytes) {
    return concatBytes([encodeTag(fieldNumber, 2), encodeVarintBytes(bytes.length), bytes]);
  }
  function encodeVarintField(fieldNumber, value) {
    return concatBytes([encodeTag(fieldNumber, 0), encodeVarintBytes(value)]);
  }
  function encodeMsgInstantiateContract(sender, admin, codeId, label, msgBytes) {
    const parts = [];
    parts.push(encodeStringField(1, sender));
    if (admin) parts.push(encodeStringField(2, admin));
    parts.push(encodeVarintField(3, codeId));
    parts.push(encodeStringField(4, label));
    parts.push(encodeBytesField(5, msgBytes));
    return concatBytes(parts);
  }

  /* ------------------------------------------------ On-chain helpers */
  async function fetchChainId() {
    const res = await fetch(`${RPC()}/status`);
    if (!res.ok) throw new Error(pt('errChainId'));
    const data = await res.json();
    return data.result.node_info.network;
  }
  async function fetchAccountInfo(address) {
    let data;
    try {
      data = await fetchAPI(`/cosmos/auth/v1beta1/accounts/${address}`);
    } catch (e) {
      throw new Error(pt('errAccount'));
    }
    const account = data.account || {};
    const base = account.base_account || account;
    return { accountNumber: Number(base.account_number || 0), sequence: Number(base.sequence || 0) };
  }

  async function signAndBroadcast(messages, memo, fee) {
    const chainId = await fetchChainId();
    const { accountNumber, sequence } = await fetchAccountInfo(walletAddr);

    const txBody = PaxiCosmJS.TxBody.fromPartial({ messages, memo });
    if (!walletPubkey) throw new Error(pt('errPubkeyMissing'));
    const pubkeyAny = {
      typeUrl: "/cosmos.crypto.secp256k1.PubKey",
      value: PaxiCosmJS.PubKey.encode({ key: walletPubkey }).finish()
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

    let bodyBytes = signDoc.bodyBytes;
    let authInfoBytes = signDoc.authInfoBytes;
    let sigBytes;

    if (walletType === 'paxihub') {
      const txObj = {
        bodyBytes: b64(signDoc.bodyBytes),
        authInfoBytes: b64(signDoc.authInfoBytes),
        chainId,
        accountNumber: signDoc.accountNumber.toString()
      };
      const signed = await window.paxihub.paxi.signAndSendTransaction(txObj);
      if (!signed || !signed.success) throw new Error(pt('errSignPaxihub'));
      sigBytes = Uint8Array.from(atob(signed.success), c => c.charCodeAt(0));
    } else if (walletType === 'keplr') {
      const signer = window.keplr.getOfflineSigner(PREFIX);
      const signed = await signer.signDirect(walletAddr, {
        bodyBytes: signDoc.bodyBytes,
        authInfoBytes: signDoc.authInfoBytes,
        chainId,
        accountNumber: signDoc.accountNumber
      });
      bodyBytes = signed.signed.bodyBytes;
      authInfoBytes = signed.signed.authInfoBytes;
      sigBytes = signed.signature;
    } else {
      throw new Error(pt('errUnknownWallet'));
    }

    const txRaw = PaxiCosmJS.TxRaw.fromPartial({
      bodyBytes, authInfoBytes, signatures: [sigBytes]
    });
    const base64Tx = b64(PaxiCosmJS.TxRaw.encode(txRaw).finish());
    const broadcastRes = await fetch(`${LCD()}/cosmos/tx/v1beta1/txs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_bytes: base64Tx, mode: 'BROADCAST_MODE_SYNC' })
    });
    const broadcastData = await broadcastRes.json();
    const txResponse = broadcastData.tx_response;
    if (!txResponse || !txResponse.txhash) throw new Error(pt('errBroadcast') + JSON.stringify(broadcastData));
    if (txResponse.code !== 0) throw new Error(pt('errTxFail', txResponse.code, txResponse.raw_log || txResponse.codespace || ''));
    return txResponse;
  }

  async function waitContractAddress(txHash) {
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      let txData = null;
      try { txData = await fetchAPI(`/cosmos/tx/v1beta1/txs/${txHash}`); }
      catch (_) { continue; }
      if (txData.tx_response && txData.tx_response.code !== 0) {
        throw new Error(pt('errTxOnchain') + (txData.tx_response.raw_log || ''));
      }
      const events = (txData.tx_response && txData.tx_response.events) || [];
      for (const evt of events) {
        if (evt.type === 'instantiate') {
          for (const attr of evt.attributes) {
            if (attr.key === '_contract_address') return attr.value;
          }
        }
      }
    }
    return null;
  }

  // Auto-revoke mint/freeze admin rights after launch (one update_minter=null tx revokes both)
  async function revokeTokenPermissions(contractAddr) {
    const msgObj = { update_minter: { new_minter: null } };
    const execMsg = PaxiCosmJS.MsgExecuteContract.fromPartial({
      sender: walletAddr,
      contract: contractAddr,
      msg: new TextEncoder().encode(JSON.stringify(msgObj))
    });
    const anyExec = PaxiCosmJS.Any.fromPartial({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: PaxiCosmJS.MsgExecuteContract.encode(execMsg).finish()
    });
    const fee = { amount: [PaxiCosmJS.coins("30000", DENOM)[0]], gasLimit: 600000 };
    await signAndBroadcast([anyExec], `revoke minter ${contractAddr}`, fee);
  }

  /* ------------------------------------------------ Templates */
  function getTemplateName(tpl) {
    const translated = pt('templates.' + tpl.id);
    return (translated && translated !== 'templates.' + tpl.id) ? translated : (tpl.name || tpl.id);
  }
  function getParamLabel(p) {
    const translated = pt('fields.' + p.key);
    return (translated && translated !== 'fields.' + p.key) ? translated : (p.label || p.key);
  }

  let tplSeq = 0;   // Template-load race sequence (language switch remounts; prevents duplicate option appends)
  async function loadTemplates() {
    const my = ++tplSeq;
    const paramsArea = document.getElementById('pumpParams');
    try {
      const resp = await fetch('templates.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      templates = await resp.json();
      if (!Array.isArray(templates) || templates.length === 0) throw new Error(pt('templateLoadFail'));
    } catch (e) {
      if (paramsArea) paramsArea.innerHTML = `<div style="color:var(--danger)">❌ ${esc(e.message)}</div>`;
      const btn = document.getElementById('pumpDeployBtn');
      if (btn) btn.disabled = true;
      return;
    }
    if (my !== tplSeq) return;
    const select = document.getElementById('pumpTemplate');
    if (!select) return;
    select.innerHTML = '';
    templates.forEach((tpl, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = getTemplateName(tpl);
      select.appendChild(opt);
    });
    select.onchange = () => loadTemplate(select.value);
    loadTemplate(0);
  }

  const CAMERA_SVG = '<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#8f96a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3.2L9 6.5h6l1.8 2H20a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.4"/><path d="M17.5 2.5v4M15.5 4.5h4"/></svg>';

  function loadTemplate(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= templates.length) return;
    currentTemplate = templates[idx];
    const container = document.getElementById('pumpParams');
    container.innerHTML = '';

    const useOfficialStyle = currentTemplate.id === 'prc20';
    const PLACEHOLDER_KEYS = ['name', 'symbol', 'project', 'description'];
    const COUNTER_MAX = { name: 20, symbol: 6, project: 200, description: 255 };
    let rowWrap = null;

    currentTemplate.params.forEach(p => {
      const div = document.createElement('div');
      div.className = 'pump-fg';

      if (p.key === 'logo_url') {
        const box = document.createElement('div');
        box.className = 'pump-logo-box';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className = 'pump-hidden-file';
        const previewImg = document.createElement('img');
        previewImg.className = 'pump-logo-cover';
        previewImg.alt = '';
        previewImg.style.display = 'none';
        const hint = document.createElement('div');
        hint.className = 'pump-logo-hint';
        hint.innerHTML = CAMERA_SVG;
        box.appendChild(previewImg);
        box.appendChild(hint);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = p.default || '';
        input.id = `param_${p.key}`;
        input.dataset.key = p.key;
        input.className = 'pump-logo-url';
        input.placeholder = pt('logoUrlPlaceholder');

        function setPreview(url) {
          if (/^https?:\/\//.test(url)) {
            previewImg.src = url;
            previewImg.style.display = 'block';
            hint.style.display = 'none';
          } else {
            previewImg.style.display = 'none';
            previewImg.src = '';
            hint.style.display = 'flex';
          }
        }
        setPreview((p.default || '').trim());
        input.addEventListener('input', () => { setPreview(input.value.trim()); checkReady(); });
        box.addEventListener('click', () => { if (!box.dataset.busy) fileInput.click(); });
        fileInput.addEventListener('change', async (ev) => {
          const file = ev.target.files && ev.target.files[0];
          if (!file) return;
          box.dataset.busy = '1';
          hint.innerHTML = `<span style="font-size:13px;color:#5b6472;font-weight:600">${esc(pt('uploadingBtn'))}</span>`;
          try {
            const imgUrl = await uploadToImgbb(file);
            input.value = imgUrl;
            setPreview(imgUrl);
            input.dispatchEvent(new Event('input'));
          } catch (e) {
            alert(pt('alertUploadFail') + e.message);
          } finally {
            box.dataset.busy = '';
            hint.innerHTML = CAMERA_SVG;
            fileInput.value = '';
          }
        });
        div.appendChild(box);
        div.appendChild(fileInput);
        div.appendChild(input);
        container.appendChild(div);
      } else {
        if (p.key === 'decimals') {
          rowWrap = document.createElement('div');
          rowWrap.className = 'pump-row';
          container.appendChild(rowWrap);
        }
        const parent = (p.key === 'total_supply' && rowWrap) ? rowWrap : container;

        let input;
        if (p.type === 'textarea') input = document.createElement('textarea');
        else { input = document.createElement('input'); input.type = p.type || 'text'; }
        input.value = p.default || '';
        input.id = `param_${p.key}`;
        input.dataset.key = p.key;

        if (useOfficialStyle && PLACEHOLDER_KEYS.includes(p.key)) {
          const ph = pt('placeholders.' + p.key);
          input.placeholder = (ph && ph !== 'placeholders.' + p.key) ? ph : (p.label || '');
        } else {
          const label = document.createElement('label');
          label.textContent = getParamLabel(p);
          label.style.cssText = 'display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:var(--text-muted)';
          div.appendChild(label);
        }

        if (useOfficialStyle && COUNTER_MAX[p.key]) {
          input.maxLength = COUNTER_MAX[p.key];
          const counter = document.createElement('div');
          counter.className = 'pump-counter';
          const updateCounter = () => { counter.textContent = `${String(input.value || '').length}/${COUNTER_MAX[p.key]}`; };
          input.addEventListener('input', updateCounter);
          updateCounter();
          div.appendChild(counter);
        }

        input.addEventListener('input', checkReady);
        input.addEventListener('change', checkReady);
        div.appendChild(input);
        parent.appendChild(div);
      }
    });
    document.getElementById('pumpFee').textContent = currentTemplate.fee + pt('feeUnit');
    if (walletAddr) replaceAddressPlaceholder();
    checkReady();
  }

  function replaceAddressPlaceholder() {
    document.querySelectorAll('#pg-pump input, #pg-pump textarea').forEach(el => {
      if (el.value && el.value.includes('__ADDRESS__')) {
        el.value = el.value.replace(/__ADDRESS__/g, walletAddr);
      }
    });
  }

  function checkReady() {
    const btn = document.getElementById('pumpDeployBtn');
    if (btn) btn.disabled = !(walletAddr && currentTemplate);
  }

  /* ------------------------------------------------ Deploy */
  async function deployContract() {
    if (!walletAddr) { alert(pt('alertConnectFirst')); return; }
    if (!currentTemplate) { alert(pt('alertSelectTemplate')); return; }

    const deployBtn = document.getElementById('pumpDeployBtn');
    if (deployBtn.dataset.busy === '1') return;
    deployBtn.dataset.busy = '1';
    deployBtn.disabled = true;
    deployBtn.textContent = pt('deployingBtn');
    const resetBtn = () => {
      deployBtn.dataset.busy = '0';
      deployBtn.disabled = false;
      deployBtn.textContent = pt('deployBtn');
    };

    try {
      const params = {};
      for (const p of currentTemplate.params) {
        const el = document.getElementById(`param_${p.key}`);
        let val = el.value.trim();
        if (p.type === 'number') val = Number(val);
        params[p.key] = val;
      }

      if (currentTemplate.id === 'prc20') {
        if (!params.name) throw new Error(pt('errNameRequired'));
        if (!params.symbol) throw new Error(pt('errSymbolRequired'));
        if (!Number.isFinite(params.total_supply) || params.total_supply <= 0) throw new Error(pt('errTotalSupplyPositive'));
        const logo = params.logo_url;
        if (!logo) throw new Error(pt('errLogoRequired'));
        if (!/^https?:\/\//.test(logo) && !logo.startsWith('ipfs://')) throw new Error(pt('errLogoScheme'));
        if (params.project && !/^https?:\/\//.test(params.project)) throw new Error(pt('errProjectUrl'));
      } else if (currentTemplate.id === 'prc721') {
        if (!params.name) throw new Error(pt('errNftNameRequired'));
        if (!params.symbol) throw new Error(pt('errNftSymbolRequired'));
        if (!isValidPaxiAddress(params.minter)) throw new Error(pt('errMinterInvalid'));
      }

      const receiver = getRandomReceiver();
      if (!isValidPaxiAddress(receiver)) throw new Error(pt('errReceiverConfig'));

      let msg = {};
      if (currentTemplate.id === 'prc20') {
        const amount = calculateAmount(params.total_supply, PRC20_DECIMALS);
        const initial_balances = [{ address: walletAddr, amount: amount }];
        const marketing = {
          project: params.project || '',
          description: params.description || '',
          marketing: walletAddr,
          logo: { url: params.logo_url }
        };
        msg = {
          name: params.name,
          symbol: params.symbol,
          decimals: PRC20_DECIMALS,
          initial_balances,
          mint: { minter: walletAddr },
          marketing
        };
        Object.keys(msg).forEach(k => msg[k] === null && delete msg[k]);
      } else if (currentTemplate.id === 'prc721') {
        msg = { name: params.name, symbol: params.symbol, minter: params.minter };
      } else {
        throw new Error(pt('errUnknownTemplate'));
      }

      // 1. Service fee transfer message (recipient address)
      const feeInPAXI = currentTemplate.fee;
      const feeInUpaxi = feeInPAXI * 1_000_000;
      const sendMsg = PaxiCosmJS.MsgSend.fromPartial({
        fromAddress: walletAddr,
        toAddress: receiver,
        amount: [PaxiCosmJS.coins(feeInUpaxi.toString(), DENOM)[0]]
      });
      const anySend = PaxiCosmJS.Any.fromPartial({
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: PaxiCosmJS.MsgSend.encode(sendMsg).finish()
      });

      // 2. Contract instantiate message (hand-rolled protobuf encoding)
      const label = `${currentTemplate.name}-${Date.now()}`;
      const msgJsonBytes = new TextEncoder().encode(JSON.stringify(msg));
      const instantiateValue = encodeMsgInstantiateContract(walletAddr, '', currentTemplate.codeId, label, msgJsonBytes);
      const anyInstantiate = PaxiCosmJS.Any.fromPartial({
        typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
        value: instantiateValue
      });

      // 3. Sign & broadcast (1 transaction bundles transfer + deploy, 1 signature)
      const messages = [anySend, anyInstantiate];
      const fee = { amount: [PaxiCosmJS.coins("10000000", DENOM)[0]], gasLimit: 150000000 };
      const memo = `${label} | fee ${feeInPAXI} PAXI`;

      // Make the fund destination explicit before signing (expert audit advice: recipient address transparent to users)
      if (!confirm(
        `Confirm deployment of "${currentTemplate.name}"?\n\n`
        + `· Platform service fee: ${feeInPAXI} PAXI\n`
        + `· Recipient address for this tx:\n  ${receiver}\n`
        + `· On-chain gas: ~10 PAXI (charged by the network, separate from the service fee)\n\n`
        + `1 transaction and 1 signature in total.`)) {
        resetBtn();
        return;
      }

      const txResponse = await signAndBroadcast(messages, memo, fee);
      const txHash = txResponse.txhash;

      // 4. Wait for confirmation and parse the contract address
      const contractAddr = await waitContractAddress(txHash);

      // 5. PRC-20: auto-revoke mint/freeze admin rights
      let revokeStatus = 'none';
      if (currentTemplate.id === 'prc20' && contractAddr) {
        deployBtn.textContent = pt('revokingBtn');
        try {
          await revokeTokenPermissions(contractAddr);
          revokeStatus = 'ok';
        } catch (revokeErr) {
          console.error('Auto-revoke of mint/freeze rights failed:', revokeErr);
          revokeStatus = 'fail';
        }
      }

      showDeployResult(contractAddr, txHash, feeInPAXI, params, revokeStatus);
      if (typeof refreshBalance === 'function') refreshBalance();
    } catch (error) {
      console.error(error);
      alert(pt('alertDeployFail') + error.message);
    } finally {
      resetBtn();
    }
  }

  function showDeployResult(contractAddr, txHash, feeInPAXI, params, revokeStatus) {
    const resultDiv = document.getElementById('pumpResult');
    resultDiv.style.display = 'block';
    if (contractAddr) {
      let revokeLine = '';
      if (revokeStatus === 'ok') {
        revokeLine = `<strong>${esc(pt('resultRevokeLabel'))}</strong>✅ ${esc(pt('resultRevokeOk'))}<br>`;
      } else if (revokeStatus === 'fail') {
        revokeLine = `<strong>${esc(pt('resultRevokeLabel'))}</strong>⚠️ ${esc(pt('resultRevokeFail'))}<br>`;
      }
      const minterSuffix = (revokeStatus === 'ok')
        ? esc(pt('resultMinterRevokedSuffix')) : esc(pt('resultMinterSuffix'));
      resultDiv.innerHTML = `
        ${esc(pt('resultSuccessTitle'))}<br>
        <strong>${esc(pt('resultContractAddr'))}</strong><code>${esc(contractAddr)}</code><br>
        <strong>${esc(pt('resultTxHash'))}</strong><code>${esc(txHash)}</code><br>
        <strong>${esc(pt('resultTotalSupply'))}</strong>${esc(params.total_supply || 'N/A')}${esc(pt('resultTotalSupplySuffix'))}<br>
        <strong>${esc(pt('resultFee'))}</strong>${esc(feeInPAXI)}${esc(pt('resultFeeSuffix'))}<br>
        <strong>${esc(pt('resultLogoUrl'))}</strong>${esc(params.logo_url || pt('resultNoLogo'))}<br>
        <strong>${esc(pt('resultMinter'))}</strong><code>${esc(walletAddr)}</code>${minterSuffix}<br>
        ${revokeLine}`;
    } else {
      resultDiv.innerHTML = `
        ${esc(pt('resultNotReadyTitle'))}<br>
        ${esc(pt('resultTxHash'))}<code>${esc(txHash)}</code><br>
        ${esc(pt('resultNotReadyTip'))}`;
    }
  }

  /* ------------------------------------------------ Styles (scoped) */
  const STYLE = `
  #pg-pump .pump-fg{margin-bottom:14px}
  #pg-pump .pump-row{display:flex;gap:12px}
  #pg-pump .pump-row .pump-fg{flex:1;min-width:0}
  #pg-pump .pump-counter{text-align:right;font-size:12px;color:var(--text-muted);margin-top:4px}
  #pg-pump .pump-logo-box{width:148px;height:148px;margin:4px auto 12px;background:#e9eaee;
    border-radius:24px;position:relative;display:flex;align-items:center;justify-content:center;
    cursor:pointer;overflow:hidden;transition:transform .1s}
  #pg-pump .pump-logo-box:active{transform:scale(0.97)}
  #pg-pump .pump-logo-hint{display:flex;align-items:center;justify-content:center;width:100%;height:100%}
  #pg-pump .pump-logo-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}
  #pg-pump .pump-hidden-file{display:none}
  #pg-pump .pump-logo-url{font-size:13px;padding:12px 14px}
  #pg-pump textarea{min-height:70px}
  #pg-pump .pump-result{display:none;margin-top:16px;padding:14px;border-radius:10px;
    background:rgba(74,222,128,.06);border:1px solid #166534;font-size:13px;line-height:2;
    word-break:break-all}
  #pg-pump .pump-result code{background:rgba(0,0,0,.4);padding:2px 6px;border-radius:4px;
    font-size:12px;font-family:ui-monospace,Menlo,monospace}
  #pg-pump .pump-wallet-bar{display:flex;justify-content:space-between;align-items:center;
    padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.03);
    border:1px solid var(--border);margin-bottom:14px;font-size:.85rem;color:var(--text-muted)}
  `;

  /* ------------------------------------------------ Register */
  function render() {
    return `
    <style>${STYLE}</style>
    <div id="pg-pump">
      <div class="card">
        <div class="card-title">🚀 Custom Token Launcher · One-Click Deploy</div>
        <div class="tool-desc">Template-based deployment of PRC-20 token and PRC-721 NFT contracts. The service fee and deployment are bundled into 1 transaction with a single signature.
          After issuance, PRC-20 mint/freeze admin rights are automatically revoked (no further minting, accounts cannot be frozen).</div>

        <div class="pump-wallet-bar">
          <span id="pumpStatus">${pt('walletDisconnected')}</span>
          <span style="font-size:.72rem">${pt('connectHint')}</span>
        </div>

        <div class="form-group">
          <label class="form-label">${pt('templateLabel')}</label>
          <select id="pumpTemplate"></select>
        </div>

        <div class="form-group">
          <label class="form-label">${pt('feeLabel')}</label>
          <span id="pumpFee" style="font-weight:bold;color:var(--danger)">-</span>
        </div>

        <div id="pumpParams"></div>

        <button class="btn btn-primary" id="pumpDeployBtn" disabled>${pt('deployBtn')}</button>
        <div class="pump-result" id="pumpResult"></div>

        <div style="margin-top:14px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;text-align:center;">
          ⚠️ Token issuance is an autonomous on-chain action. Ensure the token name, logo, and description are lawful and compliant. This tool provides deployment technology only — no trading, order matching, pricing, or exchange functionality, and nothing here constitutes investment advice. Tokens may be deemed securities and carry regulatory and compliance risk; token prices may fall to zero with no liquidity guarantee; the smart contracts have not been audited by any third party and may contain unknown vulnerabilities. All token value fluctuation risk is borne by the user.
        </div>
      </div>
    </div>`;
  }

  window.TOOL_REGISTRY['pump'] = {
    render,
    async onMount() {
      await syncWallet();
      updateWalletUI();
      await loadTemplates();
    },
    bind() {
      document.getElementById('pumpDeployBtn').addEventListener('click', deployContract);
    },
  };
})();
