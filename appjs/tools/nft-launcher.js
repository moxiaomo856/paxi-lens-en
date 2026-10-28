/**
 * NFT Launcher (Inline Version - FULL)
 * Inline NFT launch tool - restores the original full feature set
 * Supports: step-wizard deployment, cover image upload, batch minting, metadata generation, contract history
 */
if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

const _NFT_LANG = {
  en: {
    title: '🎨 NFT Launcher',
    desc: 'Deploy PRC-721 NFT contracts to Paxi Network with one click. Batch mint after deployment.',
    step1: 'Collection Info',
    step2: 'Upload Assets',
    step3: 'Preview & Deploy',
    next: 'Next: Upload →',
    prev: '← Back',
    nextDeploy: 'Next: Preview & Deploy →',
    deploy: 'Deploy NFT Contract',
    collectionName: 'Collection Name',
    symbol: 'Symbol',
    description: 'Description',
    maxSupply: 'Max Supply',
    royalty: 'Royalty (%)',
    mintPrice: 'Mint Price (PAXI)',
    maxPerWallet: 'Max Mint per Wallet',
    deployBtn: '🚀 Deploy NFT Contract',
    uploadCover: 'NFT Cover Image',
    uploadCoverHint: 'Click to upload cover image',
    uploadSupport: 'JPG/PNG/GIF/SVG supported',
    imageUri: 'Image URI (recommended: direct link like i.ibb.co/...)',
    preview: 'Preview',
    previewPlaceholder: '🖼️',
    batchMint: 'Batch Mint NFT',
    batchMintDesc: 'Batch mint NFTs to a deployed PRC-721 contract. Max 10 per tx. Each NFT gets a unique Token ID.',
    contractAddr: 'NFT Contract Address',
    contractAddrHint: 'Auto-filled after deployment',
    mint: 'Mint Count',
    mintFeeTitle: '💰 Estimate Fee',
    mintCountLabel: 'Mint Count',
    estimatedFee: 'Estimated Fee',
    mintBtn: '🏭 Execute Batch Mint',
    mintTokenIds: 'Token IDs',
    blockHeight: 'Block Height',
    metadataTitle: '📝 Custom Metadata',
    metadataDesc: 'Add custom name & image for minted NFTs. Generates CW721-compliant metadata JSON.',
    tokenId: 'Token ID',
    nftName: 'NFT Name',
    imageUriLabel: 'Image URI',
    saveMetadataBtn: '📝 Generate Metadata JSON',
    metadataExplain: 'PRC-721 manages metadata via token_uri pointing to external JSON. Upload the JSON below to your server/IPFS and use its URL as token_uri when minting.',
    copyJson: '📋 Copy JSON',
    contractHistory: 'Deployed Contracts',
    contractHistoryDesc: 'Successfully deployed NFT contracts on Paxi chain.',
    noHistory: 'No deployed contracts',
    toContract: '→ Fill Address',
    needWallet: 'Please connect wallet first',
    fillAll: 'Please fill in all required fields',
    deploying: 'Building deploy tx...',
    waiting: 'Waiting for wallet signature...',
    broadcasting: 'Tx broadcasted. Waiting for confirmation...',
    confirmWait: 'Waiting for on-chain confirmation...',
    success: '✅ Success',
    failed: '❌ Failed',
    deploySuccess: '✅ NFT Contract Deployed!',
    nextStep: '👇 Next: Copy the address above into the Batch Mint field below',
    mintSuccess: 'Successfully minted',
    nftMintCount: 'NFTs',
    connected: 'Connected',
    warning: '⚠️ This tool only provides technical services for NFT minting. No trading, pricing, or exchange functions are offered. Users bear all consequences.',
    warningEn: '⚠️ This tool only provides technical services for NFT minting. No trading, pricing, or exchange functions are offered. Users bear all consequences.',
    max10Hint: 'Max 10 NFTs per transaction',
    mintConfirm: 'Confirm batch mint?\n\n· Service fee: 5 PAXI\n· Receiver: ',
    buildTx: 'Building mint tx...',
    // IPFS
    ipfsHint: '💡 Direct image links (e.g. i.ibb.co/...) are recommended for stable display. IPFS is optional — only for decentralized, self-hosted storage (requires Pinata JWT).',
    ipfsToggle: 'Use IPFS storage (optional · decentralized)',
    ipfsConfig: '⚙️ IPFS Config (Pinata)',
    ipfsJwtLabel: 'Pinata JWT',
    ipfsJwtPlaceholder: 'Paste your Pinata JWT...',
    ipfsSave: '💾 Save',
    ipfsConfigured: '✓ Configured',
    ipfsNotConfigured: '⚠ Not configured',
    ipfsGetKey: '🔗 Get Pinata JWT',
    ipfsUploading: 'Uploading',
    ipfsImageOk: '✅ Image uploaded to IPFS',
    ipfsMetaGen: 'Generating & uploading metadata...',
    ipfsUploadFail: '❌ IPFS upload failed',
    ipfsNoJwt: 'Please enter your Pinata JWT in IPFS config first',
    ipfsGateway: 'Gateway',
    ipfsFallback: 'IPFS unavailable, fell back to basic mode',
    ipfsNeedImage: 'Please upload a cover image or enter an image URI',
    ipfsLargeImg: 'Image exceeds 100KB, enable IPFS to reduce gas fees',
    // Update on-chain metadata
    updTitle: '🔄 Update On-chain Metadata',
    updDescInfo: 'Minted NFTs can have their on-chain metadata (name/image/description/attributes) rewritten directly — no re-mint needed. Sign with the minter or token owner wallet; gas only, no service fee.',
    updDescLabel: 'NFT Description',
    updAttrsLabel: 'Attributes JSON (optional)',
    updAttrsPlaceholder: '[{"trait_type":"Series","value":"Genesis"}]',
    updBtn: '🔄 Send On-chain Update',
    updSuccess: '✅ Metadata updated',
    updAttrsInvalid: 'Invalid attributes JSON — expected an array like [{"trait_type":"...","value":"..."}]',
    updAddrInvalid: 'Invalid contract address format (paxi1..., 43 chars for account / 63 for contract). Copy it in full from the deploy history.',
    updConfirm: 'Write this metadata on-chain? This directly modifies the NFT name/image/attributes. Gas only.\n\n',
    buildUpdTx: 'Building update tx...',
    updUriTooLarge: 'Metadata token_uri exceeds 64KB and the on-chain tx may fail. Use an IPFS link or compress the image before updating.',
  }
};

function _nftL(k) {
  const lang = (typeof currentLang !== 'undefined' && currentLang) || 'en';
  if (window.PAXI_LANGS && PAXI_LANGS[lang] && PAXI_LANGS[lang].nftLauncher && PAXI_LANGS[lang].nftLauncher[k] != null) {
    return PAXI_LANGS[lang].nftLauncher[k];
  }
  return (_NFT_LANG[lang] && _NFT_LANG[lang][k]) || (_NFT_LANG.en[k] || k);
}

// Internal state
let _nftStep = 1;
let _nftCoverBase64 = null;
let _nftCoverFile = null;
let _nftIpfsImageCid = '';
let _nftDeployed = JSON.parse(localStorage.getItem('paxi_nft_deployed') || '[]');

// ========== RENDER ==========
function renderNftLauncher() {
  const walletAddr = (state && state.wallet) ? state.wallet.address : '';
  const connected = (state && state.connected);
  const l = _nftL;

  return `
    <div class="card">
      <div class="card-title">${l('title')}</div>
      <div class="tool-desc">${l('desc')}</div>
      <div style="margin:0 0 12px;padding:10px 12px;background:rgba(255,255,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;">
        ${l('warning')}<br>
        <span style="font-size:10px;opacity:0.85;">${l('warningEn')}</span>
      </div>
      ${connected ? `<div style="font-size:11px;color:var(--success);margin-bottom:10px;">✓ ${l('connected')}: <code>${walletAddr.slice(0,12)}...</code></div>` : `<div style="font-size:11px;color:var(--warning);margin-bottom:10px;">⚠ ${l('needWallet')}</div>`}

      <!-- STEPS INDICATOR -->
      <div style="display:flex;gap:6px;margin-bottom:20px;align-items:center;justify-content:center;flex-wrap:wrap;">
        <div id="nft-step-1" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--primary);">
          <span style="width:28px;height:28px;border-radius:50%;background:rgba(168,85,247,0.15);border:2px solid var(--primary);color:var(--primary);display:flex;align-items:center;justify-content:center;">1</span>
          ${l('step1')}
        </div>
        <span style="color:var(--text-muted);">→</span>
        <div id="nft-step-2" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-muted);">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--bg);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;">2</span>
          ${l('step2')}
        </div>
        <span style="color:var(--text-muted);">→</span>
        <div id="nft-step-3" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-muted);">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--bg);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;">3</span>
          ${l('step3')}
        </div>
      </div>

      <!-- STEP 1: Collection Info -->
      <div id="nft-panel-1" style="background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;">📦 ${l('step1')}</div>
        <div class="form-group">
          <label class="form-label">${l('collectionName')} *</label>
          <input type="text" id="nftName" placeholder="Paxi Punks" maxlength="50">
        </div>
        <div class="form-group">
          <label class="form-label">${l('symbol')} *</label>
          <input type="text" id="nftSymbol" placeholder="PUNK" maxlength="20" style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label class="form-label">${l('description')}</label>
          <textarea id="nftDescription" placeholder="" maxlength="500" style="min-height:64px;"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">${l('maxSupply')}</label>
            <input type="number" id="nftMaxSupply" placeholder="2026" min="1" value="2026">
          </div>
          <div class="form-group">
            <label class="form-label">${l('royalty')}</label>
            <input type="number" id="nftRoyalty" placeholder="7.5" min="0" max="20" step="0.1" value="7.5">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">${l('mintPrice')}</label>
            <input type="number" id="nftMintPrice" placeholder="10" min="0" step="0.01" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">${l('maxPerWallet')}</label>
            <input type="number" id="nftMaxPerWallet" placeholder="10" min="1" value="10">
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="btnGoStep2" ${connected ? '' : 'disabled'}>${l('next')}</button>
      </div>

      <!-- STEP 2: Upload -->
      <div id="nft-panel-2" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;">🖼️ ${l('step2')}</div>
        <div class="info-box">${l('ipfsHint')}</div>
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;cursor:pointer;">
            <input type="checkbox" id="nftUseIpfs" style="width:18px;height:18px;accent-color:var(--primary);">
            ${l('ipfsToggle')}
          </label>
        </div>
        <div id="nftIpfsConfigWrap" style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;">${l('ipfsConfig')}</div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label">${l('ipfsJwtLabel')}</label>
            <div style="display:flex;gap:6px;">
              <input type="password" id="nftPinataJwt" placeholder="${l('ipfsJwtPlaceholder')}" style="flex:1;">
              <button class="btn btn-primary btn-sm" id="btnSaveJwt">${l('ipfsSave')}</button>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;">
            <span id="ipfsConfigStatus">${hasPinataJwt() ? l('ipfsConfigured') : l('ipfsNotConfigured')}</span>
            <a href="https://app.pinata.cloud/keys" target="_blank" rel="noopener" style="color:var(--primary);font-size:11px;">${l('ipfsGetKey')}</a>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${l('uploadCover')}</label>
          <div id="uploadCoverArea" style="border:2px dashed var(--border);border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:all 0.15s;" onclick="document.getElementById('fileCover').click()">
            <div style="font-size:32px;margin-bottom:8px">🖼️</div>
            <div>${l('uploadCoverHint')}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${l('uploadSupport')}</div>
            <img id="coverPreview" style="width:100px;height:100px;border-radius:12px;object-fit:cover;border:2px solid var(--border);margin:10px auto 0;display:none;">
          </div>
          <input type="file" id="fileCover" accept="image/*" style="display:none">
          <div id="ipfsUploadStatus" style="margin-top:10px;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">${l('imageUri')}</label>
          <input type="text" id="nftImageUri" placeholder="https://...">
        </div>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-outline" style="flex:1;" id="btnGoStep1">${l('prev')}</button>
          <button class="btn btn-primary" style="flex:1;" id="btnGoStep3">${l('nextDeploy')}</button>
        </div>
      </div>

      <!-- STEP 3: Preview & Deploy -->
      <div id="nft-panel-3" style="display:none;background:var(--bg);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;">👀 ${l('step3')}</div>
        <div id="previewCard" style="background:var(--bg-card);border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border);">
          <img id="previewImage" src="" alt="NFT Preview" style="width:160px;height:160px;border-radius:12px;object-fit:cover;margin:0 auto 10px;display:none;">
          <div id="previewPlaceholder" style="width:160px;height:160px;background:var(--bg);border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:40px;">🖼️</div>
          <h3 id="previewName" style="font-size:15px;margin-bottom:4px;">-</h3>
          <p id="previewSymbol" style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">-</p>
          <p id="previewDesc" style="font-size:12px;color:var(--text-muted);margin-top:4px;">-</p>
        </div>
        <div style="margin-top:20px;display:flex;gap:12px;">
          <button class="btn btn-outline" style="flex:1;" id="btnStep3Prev">${l('prev')}</button>
          <button class="btn btn-success" id="btnDeploy" style="flex:1.5;" ${connected ? '' : 'disabled'}>${l('deployBtn')}</button>
        </div>
        <div class="status-msg" id="nftDeployStatus"></div>
      </div>
    </div>

    <!-- Batch Mint -->
    <div class="card">
      <div class="card-title">🏭 ${l('batchMint')}</div>
      <div class="tool-desc">${l('batchMintDesc')}</div>
      <div class="form-group">
        <label class="form-label">${l('contractAddr')} * (${l('contractAddrHint')})</label>
        <input type="text" id="mintContractAddr" placeholder="paxi1...">
      </div>
      <div class="form-group">
        <label class="form-label">${l('mint')} *</label>
        <input type="number" id="mintCount" placeholder="5" min="1" max="10" value="5">
      </div>
      <div id="mintFeePreview" style="display:none;margin-bottom:16px;">
        <div style="background:var(--bg);border-radius:8px;padding:14px 18px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:var(--text-muted)">${l('mintCountLabel')}</span>
            <span id="mfCount">-</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);font-weight:700;">
            <span>${l('estimatedFee')}</span>
            <span id="mfTotal" style="color:var(--success)">-</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" id="btnCalcFee" ${connected ? '' : 'disabled'}>${l('mintFeeTitle')}</button>
        <button class="btn btn-success btn-sm" id="btnBatchMint" ${connected ? '' : 'disabled'}>${l('mintBtn')}</button>
      </div>
      <div class="status-msg" id="nftMintStatus"></div>
    </div>

    <!-- Metadata + Update On-chain (merged) -->
    <div class="card">
      <div class="card-title">🖼️ ${l('updTitle')}</div>
      <div class="tool-desc">${l('updDescInfo')}</div>
      <div class="form-group">
        <label class="form-label">${l('contractAddr')} *</label>
        <input type="text" id="updContractAddr" placeholder="paxi1...">
      </div>
      <div class="form-group">
        <label class="form-label">${l('tokenId')} *</label>
        <input type="text" id="updTokenId" placeholder="1786443480877_0">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">${l('nftName')}</label>
          <input type="text" id="updName" placeholder="COBRA Genesis #0001 · Viper">
        </div>
        <div class="form-group">
          <label class="form-label">${l('imageUriLabel')}</label>
          <input type="text" id="updImage" placeholder="https://... or ipfs://... or data:image/...">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${l('updDescLabel')}</label>
        <textarea id="updDesc" maxlength="1000" style="min-height:56px;"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${l('updAttrsLabel')}</label>
        <textarea id="updAttrs" placeholder='${l('updAttrsPlaceholder')}' style="min-height:56px;font-family:monospace;font-size:11px;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-block" id="btnMetadata">${l('saveMetadataBtn')}</button>
        <button class="btn btn-primary btn-block" id="btnUpdateMeta" ${connected ? '' : 'disabled'}>${l('updBtn')}</button>
      </div>
      <div class="status-msg" id="nftUpdStatus"></div>
    </div>

    <!-- Deployed Contracts -->
    <div class="card">
      <div class="card-title">📜 ${l('contractHistory')}</div>
      <div class="tool-desc">${l('contractHistoryDesc')}</div>
      <div id="nftDeployedList">
        ${_nftDeployed.length === 0 ? `<p style="color:var(--text-muted);font-size:12px">${l('noHistory')}</p>` : _renderDeployedItems()}
      </div>
    </div>
  `;
}

function _renderDeployedItems() {
  const l = _nftL;
  return _nftDeployed.map(c => `
    <div style="background:var(--bg);border-radius:6px;padding:10px;margin-bottom:6px;font-size:12px;border:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="min-width:0;flex:1;">
          <strong style="font-size:13px;">${escapeHtml(c.name || '?')}</strong>
          <span style="color:var(--text-muted);"> (${escapeHtml(c.symbol || '?')})</span>
          <div style="color:var(--text-muted);font-size:10px;margin-top:3px;word-break:break-all;">
            ${l('contractAddr')}: <code style="color:var(--primary)">${c.contractAddr || '-'}</code>
          </div>
          ${c.maxSupply ? `<div style="color:var(--text-muted);font-size:10px;">Max: ${c.maxSupply}${c.royalty ? ` · Royalty: ${c.royalty}%` : ''}${c.mintPrice ? ` · Mint price: ${c.mintPrice}` : ''}</div>` : ''}
        </div>
      </div>
      <button class="btn btn-outline btn-sm" style="margin-top:6px;padding:2px 8px;font-size:10px;" onclick="document.getElementById('mintContractAddr').value='${c.contractAddr || ''}'">→ ${l('contractAddr')}</button>
    </div>
  `).join('');
}

// ========== NAVIGATION STEPS ==========
function _nftGoStep(step) {
  const l = _nftL;
  if (step === 2 && _nftStep === 1) {
    const name = document.getElementById('nftName').value.trim();
    const symbol = document.getElementById('nftSymbol').value.trim();
    if (!name || !symbol) { showToast(l('fillAll'), 'warning'); return; }
  }
  _nftStep = step;
  for (let i = 1; i <= 3; i++) {
    const p = document.getElementById('nft-panel-' + i);
    if (p) p.style.display = (i === step) ? '' : 'none';
    const sEl = document.getElementById('nft-step-' + i);
    if (!sEl) continue;
    // reset
    sEl.style.color = i === step ? 'var(--primary)' : (i < step ? 'var(--success)' : 'var(--text-muted)');
    const badge = sEl.querySelector('span');
    if (badge) {
      badge.style.background = i === step ? 'rgba(168,85,247,0.15)' : (i < step ? 'rgba(34,197,94,0.15)' : 'var(--bg)');
      badge.style.borderColor = i === step ? 'var(--primary)' : (i < step ? 'var(--success)' : 'var(--border)');
      badge.style.color = i === step ? 'var(--primary)' : (i < step ? 'var(--success)' : '');
    }
  }
  if (step === 3) _nftUpdatePreview();
}

function _nftUpdatePreview() {
  document.getElementById('previewName').textContent = document.getElementById('nftName').value || '-';
  document.getElementById('previewSymbol').textContent = document.getElementById('nftSymbol').value || '-';
  document.getElementById('previewDesc').textContent = document.getElementById('nftDescription').value || '-';
  const img = document.getElementById('previewImage');
  const ph = document.getElementById('previewPlaceholder');
  if (_nftCoverBase64) {
    img.src = _nftCoverBase64;
    img.style.display = 'block';
    ph.style.display = 'none';
  } else {
    img.style.display = 'none';
    ph.style.display = 'flex';
  }
}

// ========== BIND EVENTS ==========
function bindNftLauncherEvents() {
  setTimeout(() => {
    // Step nav
    const btnG2 = document.getElementById('btnGoStep2');
    const btnG1 = document.getElementById('btnGoStep1');
    const btnG3 = document.getElementById('btnGoStep3');
    const btnS3P = document.getElementById('btnStep3Prev');
    if (btnG2) btnG2.addEventListener('click', () => _nftGoStep(2));
    if (btnG1) btnG1.addEventListener('click', () => _nftGoStep(1));
    if (btnG3) btnG3.addEventListener('click', () => _nftGoStep(3));
    if (btnS3P) btnS3P.addEventListener('click', () => _nftGoStep(2));

    // Upload
    const fileEl = document.getElementById('fileCover');
    if (fileEl) fileEl.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        _nftCoverFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          _nftCoverBase64 = ev.target.result;
          const prev = document.getElementById('coverPreview');
          if (prev) { prev.src = _nftCoverBase64; prev.style.display = 'block'; }
        };
        reader.readAsDataURL(file);
        // auto-upload to IPFS if enabled
        _maybeUploadCoverToIpfs(file);
      }
    });

    // IPFS toggle
    const ipfsChk = document.getElementById('nftUseIpfs');
    if (ipfsChk) ipfsChk.addEventListener('change', () => {
      const cfg = document.getElementById('nftIpfsConfigWrap');
      if (cfg) cfg.style.opacity = ipfsChk.checked ? '1' : '0.5';
      if (ipfsChk.checked && _nftCoverFile && !_nftIpfsImageCid) _maybeUploadCoverToIpfs(_nftCoverFile);
    });
    // initial state
    const ipfsChk0 = document.getElementById('nftUseIpfs');
    const cfgWrap = document.getElementById('nftIpfsConfigWrap');
    if (ipfsChk0 && cfgWrap) cfgWrap.style.opacity = ipfsChk0.checked ? '1' : '0.5';

    // Save JWT
    const btnSaveJwt = document.getElementById('btnSaveJwt');
    if (btnSaveJwt) btnSaveJwt.addEventListener('click', () => {
      const val = document.getElementById('nftPinataJwt').value;
      setPinataJwt(val);
      const st = document.getElementById('ipfsConfigStatus');
      if (st) st.textContent = hasPinataJwt() ? _nftL('ipfsConfigured') : _nftL('ipfsNotConfigured');
      showToast(hasPinataJwt() ? _nftL('ipfsConfigured') : _nftL('ipfsNotConfigured'), hasPinataJwt() ? 'success' : 'warning');
      if (hasPinataJwt() && _nftCoverFile && !_nftIpfsImageCid) {
        const chk = document.getElementById('nftUseIpfs');
        if (chk && chk.checked) _maybeUploadCoverToIpfs(_nftCoverFile);
      }
    });

    // Deploy
    const btnDeploy = document.getElementById('btnDeploy');
    if (btnDeploy) btnDeploy.addEventListener('click', () => _deployNft());

    // Mint
    const btnMint = document.getElementById('btnBatchMint');
    const btnCalc = document.getElementById('btnCalcFee');
    if (btnMint) btnMint.addEventListener('click', () => _mintNft());
    if (btnCalc) btnCalc.addEventListener('click', () => _calcMintFee());

    // Metadata
    const btnMeta = document.getElementById('btnMetadata');
    if (btnMeta) btnMeta.addEventListener('click', () => _genMetadata());

    // Update on-chain metadata
    const btnUpd = document.getElementById('btnUpdateMeta');
    if (btnUpd) btnUpd.addEventListener('click', () => _updateNftMeta());
  }, 100);
}

// ========== IPFS cover upload ==========
async function _maybeUploadCoverToIpfs(file) {
  const chk = document.getElementById('nftUseIpfs');
  if (!chk || !chk.checked) return;
  if (!hasPinataJwt()) {
    _setIpfsStatus('warning', _nftL('ipfsNoJwt'));
    return;
  }
  const st = document.getElementById('ipfsUploadStatus');
  try {
    if (st) { st.innerHTML = `<span style="font-size:12px;color:var(--primary)"><span class="spinner"></span> ${_nftL('ipfsUploading')}... 0%</span>`; }
    const res = await uploadFileToIpfs(file, (pct) => {
      if (st) st.innerHTML = `<span style="font-size:12px;color:var(--primary)"><span class="spinner"></span> ${_nftL('ipfsUploading')}... ${pct}%</span>`;
    });
    _nftIpfsImageCid = res.cid;
    const gw = escapeHtml(res.url);
    const cidShort = escapeHtml(res.cid.slice(0, 12) + '...' + res.cid.slice(-6));
    if (st) {
      st.innerHTML = `
        <div style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:10px 12px;font-size:12px;">
          <div style="color:var(--success);font-weight:700;">${_nftL('ipfsImageOk')}</div>
          <div style="margin-top:4px;word-break:break-all;color:var(--text-muted);">CID: <code style="color:var(--primary)">${cidShort}</code></div>
          <a href="${gw}" target="_blank" rel="noopener" style="color:var(--primary);font-size:11px;">${_nftL('ipfsGateway')} →</a>
        </div>`;
    }
  } catch (e) {
    if (st) {
      st.innerHTML = `<div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--danger);">${_nftL('ipfsUploadFail')}: ${escapeHtml(e.message)}</div>`;
    }
    _nftIpfsImageCid = '';
  }
}

function _setIpfsStatus(type, msg) {
  const st = document.getElementById('ipfsUploadStatus');
  if (!st) return;
  const colors = { warning: 'var(--warning)', error: 'var(--danger)', info: 'var(--primary)' };
  st.innerHTML = `<div style="font-size:12px;color:${colors[type] || colors.info};">${escapeHtml(msg)}</div>`;
}

// build the token_uri used for minting (IPFS preferred, otherwise fall back to data URI / manual URI)
async function _resolveMintTokenUri() {
  const l = _nftL;
  const useIpfs = document.getElementById('nftUseIpfs')?.checked;
  const name = document.getElementById('nftName')?.value.trim() || 'NFT';
  const desc = document.getElementById('nftDescription')?.value.trim() || '';
  const manualUri = document.getElementById('nftImageUri')?.value.trim() || '';

  if (useIpfs) {
    const imgUri = _nftIpfsImageCid ? `ipfs://${_nftIpfsImageCid}` : (manualUri || '');
    const meta = buildCw721Metadata(name, desc, imgUri, []);
    try {
      const { cid } = await uploadJsonToIpfs(meta, `metadata-${Date.now()}.json`);
      return { tokenUri: `ipfs://${cid}`, meta, mode: 'ipfs' };
    } catch (e) {
      return { tokenUri: jsonToDataUri(meta), meta, mode: 'fallback', warn: l('ipfsFallback') + ': ' + e.message };
    }
  } else {
    // IPFS off: embed image as base64 data URI in metadata (warn if over 100KB)
    const imgUri = manualUri || _nftCoverBase64 || '';
    const meta = buildCw721Metadata(name, desc, imgUri, []);
    if (_nftCoverBase64 && _nftCoverBase64.length > 100 * 1024) {
      return { tokenUri: jsonToDataUri(meta), meta, mode: 'data', warn: l('ipfsLargeImg') };
    }
    return { tokenUri: jsonToDataUri(meta), meta, mode: 'data' };
  }
}

// ========== DEPLOY ==========
async function _deployNft() {
  if (!state || !state.connected) { showToast(_nftL('needWallet'), 'error'); return; }
  const name = document.getElementById('nftName').value.trim();
  const symbol = document.getElementById('nftSymbol').value.trim();
  if (!name || !symbol) { showToast(_nftL('fillAll'), 'warning'); return; }

  const btn = document.getElementById('btnDeploy');
  const statusEl = document.getElementById('nftDeployStatus');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> ' + _nftL('deploying');

  try {
    const addr = state.wallet.address;
    const initMsg = JSON.stringify({ name, symbol, minter: addr });
    // The chain's CosmJS bundle does not export MsgInstantiateContract, so it is encoded by hand
    // (appjs/msg-codec.js — verified against the chain's decoder).
    if (typeof PaxiMsgCodec === 'undefined' || !PaxiMsgCodec.encodeMsgInstantiateContract) {
      throw new Error('Message codec not loaded (appjs/msg-codec.js)');
    }
    const messages = [PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
      value: PaxiMsgCodec.encodeMsgInstantiateContract(
        addr, '', 2, `Paxi NFT - ${name} (${Date.now()})`, new TextEncoder().encode(initMsg), []
      ),
    })];

    btn.innerHTML = '<span class="spinner"></span> ' + _nftL('waiting');
    const memo = `Deploy PRC-721: ${name} (${symbol})`;
    const res = await buildSignAndBroadcast(messages, memo, null, state.wallet);

    const txHash = res?.tx_response?.txhash;
    if (!txHash) throw new Error('Failed to get tx hash');

    statusEl.className = 'status-msg info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>⏳ ${_nftL('broadcasting')}</strong><br><span style="font-size:11px">Tx: <code>${escapeHtml(txHash)}</code></span>`;

    const txResp = res?.tx_response || res;
    if (txResp.code !== undefined && txResp.code !== 0) throw new Error(txResp.raw_log || 'Failed');

    let pollRes = { success: true };
    if (typeof pollTxStatus === 'function') {
      btn.innerHTML = '<span class="spinner"></span> ' + _nftL('confirmWait');
      pollRes = await pollTxStatus(txHash, 25);
      if (!pollRes || !pollRes.confirmed || !pollRes.success) throw new Error(pollRes?.rawLog || 'Failed');
    }

    let contractAddr = null;
    const evs = (res?.tx_response || res)?.events || [];
    for (const ev of evs) {
      if (ev.type === 'instantiate') {
        for (const attr of ev.attributes || []) {
          if (attr.key === '_contract_address') { contractAddr = attr.value; break; }
        }
      }
      if (contractAddr) break;
    }

    const l = _nftL;
    const maxSupply = parseInt(document.getElementById('nftMaxSupply').value) || 2026;
    const royalty = parseFloat(document.getElementById('nftRoyalty').value) || 7.5;
    const mintPrice = parseFloat(document.getElementById('nftMintPrice').value) || 0;
    const maxPerWallet = parseInt(document.getElementById('nftMaxPerWallet').value) || 10;

    statusEl.className = 'status-msg success';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `
      <strong>${l('deploySuccess')}</strong><br><br>
      <strong>${l('collectionName')}:</strong> ${escapeHtml(name)}<br>
      <strong>${l('contractAddr')}:</strong> <code style="word-break:break-all;color:var(--primary)">${contractAddr || txHash}</code><br>
      <span style="font-size:11px">Tx: <code style="font-size:11px">${escapeHtml(txHash)}</code></span>${pollRes && pollRes.height ? `<br><span style="font-size:11px">${l('blockHeight')}: <code>${pollRes.height}</code></span>` : ''}<br><br>
      <span style="font-size:11px;color:var(--text-muted)">${l('nextStep')}</span>
    `;

    if (contractAddr) {
      _nftDeployed.unshift({
        name, symbol, maxSupply, royalty, mintPrice, maxPerWallet,
        contractAddr, timestamp: Date.now()
      });
      localStorage.setItem('paxi_nft_deployed', JSON.stringify(_nftDeployed));
      _refreshDeployedList();
      document.getElementById('mintContractAddr').value = contractAddr;
    }

    showToast(l('success'), 'success');
  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>❌ ${_nftL('failed')}</strong><br>${escapeHtml(e.message || e)}`;
    showToast(_nftL('failed'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = _nftL('deployBtn');
  }
}

// ========== BATCH MINT ==========
async function _mintNft() {
  if (!state || !state.connected) { showToast(_nftL('needWallet'), 'error'); return; }
  const contractAddr = document.getElementById('mintContractAddr').value.trim();
  const count = parseInt(document.getElementById('mintCount').value) || 0;
  if (!contractAddr || count < 1) { showToast(_nftL('fillAll'), 'warning'); return; }
  if (count > 10) { showToast(_nftL('max10Hint'), 'warning'); return; }
  if (!confirm(_nftL('mintConfirm') + (CONFIG.feeCollector || 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg'))) return;

  const btn = document.getElementById('btnBatchMint');
  const statusEl = document.getElementById('nftMintStatus');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> ' + _nftL('buildTx');

  try {
    const addr = state.wallet.address;
    const timestamp = Date.now();

    // resolve token_uri (upload metadata to IPFS, or fall back to data URI)
    btn.innerHTML = '<span class="spinner"></span> ' + _nftL('ipfsMetaGen');
    const uriResult = await _resolveMintTokenUri();
    const tokenUri = uriResult.tokenUri;
    if (uriResult.warn) showToast(uriResult.warn, 'warning');

    const messages = [];

    for (let i = 0; i < count; i++) {
      const tokenId = `${timestamp}_${i}`;
      const mintMsg = { mint: { token_id: tokenId, owner: addr, token_uri: tokenUri } };
      const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({
        sender: addr,
        contract: contractAddr,
        msg: new TextEncoder().encode(JSON.stringify(mintMsg)),
        funds: [],
      });
      messages.push(PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish(),
      }));
    }

    // Platform fee (5 PAXI fixed per batch)
    const feeAmount = paxiToUpaxi('5');
    const feeMsg = PaxiCosmJS.MsgSend.fromPartial({
      fromAddress: addr,
      toAddress: (CONFIG.feeCollector || 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg'),
      amount: [PaxiCosmJS.coins(feeAmount, CONFIG.denom)[0]],
    });
    messages.push(PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: PaxiCosmJS.MsgSend.encode(feeMsg).finish(),
    }));

    btn.innerHTML = '<span class="spinner"></span> ' + _nftL('waiting');
    const res = await buildSignAndBroadcast(messages, `Mint ${count} NFTs`, null, state.wallet);
    const txHash = res?.tx_response?.txhash;
    if (!txHash) throw new Error('Failed');

    statusEl.className = 'status-msg info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>⏳ ${_nftL('broadcasting')}</strong><br><span style="font-size:11px">Tx: <code>${escapeHtml(txHash)}</code></span>`;

    const txResp = res?.tx_response || res;
    if (txResp.code !== undefined && txResp.code !== 0) throw new Error(txResp.raw_log || 'Failed');

    let pollRes = { success: true, height: null };
    if (typeof pollTxStatus === 'function') {
      btn.innerHTML = '<span class="spinner"></span> ' + _nftL('confirmWait');
      pollRes = await pollTxStatus(txHash, 25);
      if (!pollRes || !pollRes.confirmed || !pollRes.success) throw new Error(pollRes?.rawLog || 'Failed');
    }

    const l = _nftL;
    const uriDisplay = tokenUri.length > 60 ? tokenUri.slice(0, 30) + '...' + tokenUri.slice(-24) : tokenUri;
    statusEl.className = 'status-msg success';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `
      <strong>✅ ${l('mintSuccess')} ${count} ${l('nftMintCount')}</strong><br>
      <strong>${l('mintTokenIds')}:</strong><br>
      <code style="word-break:break-all;font-size:11px;">${Array.from({ length: count }, (_, i) => `${timestamp}_${i}`).join(', ')}</code><br>
      <span style="font-size:11px">token_uri: <code style="word-break:break-all;font-size:11px">${escapeHtml(uriDisplay)}</code> ${uriResult.mode === 'ipfs' ? '<span style="color:var(--success)">IPFS</span>' : '<span style="color:var(--warning)">local</span>'}</span><br>
      <span style="font-size:11px">Tx: <code style="font-size:11px">${escapeHtml(txHash)}</code></span>
      ${pollRes && pollRes.height ? `<br><span style="font-size:11px">${l('blockHeight')}: <code>${pollRes.height}</code></span>` : ''}
    `;
    showToast(`${l('mintSuccess')} ${count} ${l('nftMintCount')}`, 'success');
  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>❌ ${_nftL('failed')}</strong><br>${escapeHtml(e.message || e)}`;
    showToast(_nftL('failed'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = _nftL('mintBtn');
  }
}

function _calcMintFee() {
  const l = _nftL;
  const count = parseInt(document.getElementById('mintCount').value) || 0;
  if (count < 1) return;
  // Fixed 5 PAXI per batch (not multiplied by count)
  const totalFee = '5.00';
  document.getElementById('mfCount').textContent = count + ' ' + l('nftMintCount');
  document.getElementById('mfTotal').textContent = `${totalFee} PAXI (platform fee) + a small amount of Gas`;
  document.getElementById('mintFeePreview').style.display = 'block';
}

// ========== METADATA ==========
function _genMetadata() {
  const l = _nftL;
  const contractAddr = (document.getElementById('updContractAddr')?.value || '').trim();
  const tokenId = (document.getElementById('updTokenId')?.value || '').trim();
  if (!contractAddr || !tokenId) { showToast(l('fillAll'), 'warning'); return; }

  const name = (document.getElementById('updName')?.value || '').trim();
  const image = (document.getElementById('updImage')?.value || '').trim();
  const desc = (document.getElementById('updDesc')?.value || '').trim();
  let attributes = [];
  const attrsRaw = (document.getElementById('updAttrs')?.value || '').trim();
  if (attrsRaw) {
    try {
      attributes = JSON.parse(attrsRaw);
      if (!Array.isArray(attributes)) throw new Error('not array');
    } catch (e) { showToast(l('updAttrsInvalid'), 'error'); return; }
  }

  const metadata = {
    name: name || `NFT #${tokenId}`,
    description: desc,
    image: image || '',
    external_url: '',
    attributes: attributes
  };
  const jsonStr = JSON.stringify(metadata, null, 2);

  const statusEl = document.getElementById('nftUpdStatus');
  statusEl.className = 'status-msg success';
  statusEl.style.display = 'block';
  statusEl.innerHTML = `
    <strong>${l('success')}</strong><br><br>
    <span style="font-size:12px;color:var(--text-muted);line-height:1.6;">${l('metadataExplain')}</span><br><br>
    <pre style="background:var(--bg);padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;white-space:pre-wrap;">${escapeHtml(jsonStr)}</pre>
    <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>typeof showToast==='function'?showToast('Copied','success'):null)">${l('copyJson')}</button>
  `;
  showToast(l('success'), 'success');
}

// ========== UPDATE ON-CHAIN METADATA (update_nft_info) ==========
// bech32 validation (charset + 38 chars + checksum): reject corrupted addresses pasted in before signing
const _NFTUPD_BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const _NFTUPD_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function _nftUpdValidAddr(a) {
  if (typeof a !== 'string') return false;
  const m = /^paxi1([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$/.exec(a.trim());
  if (!m) return false;
  const hrp = [];
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) >> 5);
  hrp.push(0);
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) & 31);
  const data = [];
  for (const c of m[1]) data.push(_NFTUPD_BECH32.indexOf(c));
  let chk = 1;
  for (const v of hrp.concat(data)) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= _NFTUPD_GEN[i];
  }
  return chk === 1;
}

async function _updateNftMeta() {
  const l = _nftL;
  if (!state || !state.connected) { showToast(l('needWallet'), 'error'); return; }
  const contractAddr = (document.getElementById('updContractAddr')?.value || '').trim();
  const tokenId = (document.getElementById('updTokenId')?.value || '').trim();
  const name = (document.getElementById('updName')?.value || '').trim();
  const image = (document.getElementById('updImage')?.value || '').trim();
  const desc = (document.getElementById('updDesc')?.value || '').trim();
  const attrsRaw = (document.getElementById('updAttrs')?.value || '').trim();
  if (!contractAddr || !tokenId) { showToast(l('fillAll'), 'warning'); return; }
  if (!_nftUpdValidAddr(contractAddr)) { showToast(l('updAddrInvalid'), 'error'); return; }

  let attributes = [];
  if (attrsRaw) {
    try {
      attributes = JSON.parse(attrsRaw);
      if (!Array.isArray(attributes)) throw new Error('not array');
    } catch (e) { showToast(l('updAttrsInvalid'), 'error'); return; }
  }

  // only use the on-chain-verified supported extension fields (name/description/image/attributes)
  const extension = { name: name || ('NFT #' + tokenId), description: desc, image, attributes };
  const metaJson = { name: extension.name, description: desc, image, attributes };
  const tokenUri = jsonToDataUri(metaJson);
  if (tokenUri.length > 64 * 1024) { showToast(l('updUriTooLarge'), 'error'); return; }

  const preview = `· Token: ${tokenId}\n· ${l('nftName')}: ${extension.name}\n· ${l('imageUriLabel')}: ${image || '-'}\n· ${l('updAttrsLabel')}: ${attributes.length}`;
  if (!confirm(l('updConfirm') + '\n' + preview)) return;

  const btn = document.getElementById('btnUpdateMeta');
  const statusEl = document.getElementById('nftUpdStatus');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> ' + l('buildUpdTx');

  try {
    const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({
      sender: state.wallet.address,
      contract: contractAddr,
      msg: new TextEncoder().encode(JSON.stringify({ update_nft_info: { token_id: tokenId, token_uri: tokenUri, extension } })),
      funds: [],
    });
    const messages = [PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish(),
    })];

    btn.innerHTML = '<span class="spinner"></span> ' + l('waiting');
    const res = await buildSignAndBroadcast(messages, 'Update NFT ' + tokenId, null, state.wallet);
    const txHash = res?.tx_response?.txhash;
    if (!txHash) throw new Error('Failed');

    statusEl.className = 'status-msg info';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>⏳ ${l('broadcasting')}</strong><br><span style="font-size:11px">Tx: <code>${escapeHtml(txHash)}</code></span>`;

    const txResp = res?.tx_response || res;
    if (txResp.code !== undefined && txResp.code !== 0) throw new Error(txResp.raw_log || 'Failed');

    let pollRes = { success: true, height: null };
    if (typeof pollTxStatus === 'function') {
      btn.innerHTML = '<span class="spinner"></span> ' + l('confirmWait');
      pollRes = await pollTxStatus(txHash, 25);
      if (!pollRes || !pollRes.confirmed || !pollRes.success) throw new Error(pollRes?.rawLog || 'Failed');
    }

    statusEl.className = 'status-msg success';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `
      <strong>${l('updSuccess')}</strong><br>
      <span style="font-size:11px">${l('tokenId')}: <code>${escapeHtml(tokenId)}</code></span><br>
      <span style="font-size:11px">Tx: <code style="word-break:break-all;font-size:11px">${escapeHtml(txHash)}</code></span>
      ${pollRes && pollRes.height ? `<br><span style="font-size:11px">${l('blockHeight')}: <code>${pollRes.height}</code></span>` : ''}
    `;
    showToast(l('updSuccess'), 'success');
  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<strong>❌ ${l('failed')}</strong><br>${escapeHtml(e.message || e)}`;
    showToast(l('failed'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = l('updBtn');
  }
}

// ========== HISTORY ==========
function _refreshDeployedList() {
  const container = document.getElementById('nftDeployedList');
  if (!container) return;
  container.innerHTML = _nftDeployed.length === 0
    ? `<p style="color:var(--text-muted);font-size:12px">${_nftL('noHistory')}</p>`
    : _renderDeployedItems();
}

window.TOOL_REGISTRY['nft-launcher'] = {
  render: renderNftLauncher,
  bind: bindNftLauncherEvents,
};
