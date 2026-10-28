/**
 * My NFT viewer (my-nfts)
 * Query NFTs held by any address, displaying images, names, attributes and full details
 * Supports: contract selector, grid cards, detail modal, pagination, CSV export, caching, concurrency, timeouts
 */
if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

// ============================================================
// state
// ============================================================
const _NFTV_PAGE_SIZE = 20;
const _NFTV_CONCURRENCY = 5;   // LCD 会限流（并发越高失败越多），靠重试兜底，5 是速度/压力平衡点
const _NFTV_META_TIMEOUT = 5000;
const _NFTV_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _nftvState = {
  owner: '',
  contract: '',
  tokens: [],        // all token ids
  infos: {},         // tokenId -> { token_uri, extension }
  displays: {},      // tokenId -> { name, image, desc, attrs, tokenUri }
  rendered: 0,
  loading: false,
};
const _nftvCache = {}; // key -> { tokens, infos, displays, ts }
const _NFTV_CW721_CODE_ID = 2; // all cw721 NFT contracts are instantiated from this code_id
let _nftvAllChain = []; // all-chain mode: [{ contract, tokenId, display }]
let _nftvLastMode = ''; // last query mode: 'single' | 'allchain'

// refresh current view after a successful transfer
function loadCurrentNftView() {
  if (_nftvLastMode === 'allchain') {
    if (typeof _queryAllChainNfts === 'function') _queryAllChainNfts();
  } else if (_nftvLastMode === 'single') {
    if (typeof queryMyNfts === 'function') queryMyNfts();
  }
}

// ============================================================
// render
// ============================================================
function renderMyNfts() {
  const walletAddr = (state && state.wallet) ? state.wallet.address : '';
  const deployed = JSON.parse(localStorage.getItem('paxi_nft_deployed') || '[]');

  const contractOptions = [
    `<option value="">${t('myNfts.selectContract')}</option>`,
    ...deployed.map(c => `<option value="${escapeHtml(c.contractAddr || '')}">${escapeHtml(c.name || '?')} (${escapeHtml((c.contractAddr || '').slice(0, 10))}...)</option>`),
    `<option value="__manual">${t('myNfts.manualInput')}</option>`,
  ].join('');

  return `
    <div class="card">
      <div class="card-title">${t('myNfts.title')}</div>
      <div class="tool-desc">${t('myNfts.desc')}</div>
      <div class="info-box">${t('myNfts.disclaimer')}</div>

      <div class="form-group">
        <label class="form-label">${t('myNfts.walletAddr')}</label>
        <input type="text" id="nftvOwner" placeholder="paxi1..." value="${escapeHtml(walletAddr)}">
      </div>

      <div class="form-group">
        <label class="form-label">${t('myNfts.contract')}</label>
        <select id="nftvContractSelect" style="font-family:sans-serif;">
          ${contractOptions}
        </select>
        <input type="text" id="nftvContractManual" placeholder="paxi1..." style="display:none;margin-top:8px;">
      </div>

      <button class="btn btn-primary btn-block" id="btnNftvQuery">${t('myNfts.query')}</button>
      <div class="btn-hint">${t('myNfts.queryHint')}</div>
      <button class="btn btn-chain btn-block" id="btnNftvAllChain" ${(state && state.connected) ? '' : 'disabled'} style="margin-top:14px;">${t('myNfts.allChainBtn')}</button>
      <div class="btn-hint">${t('myNfts.allChainHint')}</div>
      <div class="status-msg" id="nftvStatus"></div>
    </div>

    <div class="card">
      <div class="card-title">${t('myNfts.transferTitle')}</div>
      <div class="tool-desc">${t('myNfts.transferDesc')}</div>
      <div class="form-group">
        <label class="form-label">${t('myNfts.transferContract')}</label>
        <input type="text" id="nftvTransferContract" placeholder="paxi1...">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">${t('myNfts.transferTokenId')}</label>
          <input type="text" id="nftvTransferTokenId" placeholder="1786443480877_0">
        </div>
        <div class="form-group">
          <label class="form-label">${t('myNfts.transferRecv')}</label>
          <input type="text" id="nftvTransferRecv" placeholder="paxi1...">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('myNfts.transferMemo')}</label>
        <input type="text" id="nftvTransferMemo" placeholder="memo">
      </div>
      <button class="btn btn-primary btn-block" id="btnNftvTransfer" ${(state && state.connected) ? '' : 'disabled'}>${t('myNfts.transferBtn')}</button>
      <div class="status-msg" id="nftvTransferStatus"></div>
    </div>

    <div class="card" id="nftvResultsCard" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <div id="nftvSummary" style="font-size:13px;font-weight:700;"></div>
        <button class="btn btn-outline btn-sm" id="btnNftvExport" style="display:none;">${t('myNfts.exportCsv')}</button>
      </div>
      <div class="nft-market-grid" id="nftvGrid"></div>
      <div id="nftvLoadMoreWrap" style="text-align:center;margin-top:14px;display:none;">
        <button class="btn btn-outline btn-sm" id="btnNftvLoadMore">${t('myNfts.loadMore')}</button>
      </div>
    </div>
  `;
}

function bindMyNftsEvents() {
  setTimeout(() => {
    const sel = document.getElementById('nftvContractSelect');
    const manual = document.getElementById('nftvContractManual');
    if (sel) sel.addEventListener('change', () => {
      if (manual) manual.style.display = (sel.value === '__manual') ? 'block' : 'none';
    });

    const btnQuery = document.getElementById('btnNftvQuery');
    if (btnQuery) btnQuery.addEventListener('click', queryMyNfts);

    const btnAllChain = document.getElementById('btnNftvAllChain');
    if (btnAllChain) btnAllChain.addEventListener('click', _queryAllChainNfts);

    const btnTransfer = document.getElementById('btnNftvTransfer');
    if (btnTransfer) btnTransfer.addEventListener('click', _transferNft);

    const btnLoadMore = document.getElementById('btnNftvLoadMore');
    if (btnLoadMore) btnLoadMore.addEventListener('click', renderNextPage);

    const btnExport = document.getElementById('btnNftvExport');
    if (btnExport) btnExport.addEventListener('click', exportNftsCsv);

    // card click delegation (detail modal)
    const grid = document.getElementById('nftvGrid');
    if (grid) grid.addEventListener('click', (e) => {
      const card = e.target.closest('.nft-card[data-token-id]');
      if (card) showNftDetail(card.dataset.tokenId, card.dataset.contract);
    });
  }, 100);
}

// ============================================================
// main query flow
// ============================================================
async function queryMyNfts() {
  const owner = (document.getElementById('nftvOwner')?.value || '').trim();
  const sel = document.getElementById('nftvContractSelect');
  let contract = sel ? sel.value : '';
  if (contract === '__manual') {
    contract = (document.getElementById('nftvContractManual')?.value || '').trim();
  }
  if (!owner) { showToast(t('myNfts.walletAddr'), 'warning'); return; }
  if (!contract) { showToast(t('myNfts.noContract'), 'warning'); return; }

  const statusEl = document.getElementById('nftvStatus');
  const resultsCard = document.getElementById('nftvResultsCard');
  _nftvState = { owner, contract, tokens: [], infos: {}, displays: {}, rendered: 0, loading: true };
  _nftvLastMode = 'single';

  // cache hit
  const cacheKey = `${contract}:${owner}`;
  const cached = _nftvCache[cacheKey];
  if (cached && Date.now() - cached.ts < _NFTV_CACHE_TTL) {
    _nftvState.tokens = cached.tokens;
    _nftvState.infos = cached.infos;
    _nftvState.displays = cached.displays;
    _renderResults(t('myNfts.cached'));
    return;
  }

  if (statusEl) { statusEl.className = 'status-msg info'; statusEl.style.display = 'block'; statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.querying')}`; }
  if (resultsCard) resultsCard.style.display = 'none';

  try {
    // 1. query all token ids (paginated)
    const tokens = await _queryAllTokens(contract, owner);
    _nftvState.tokens = tokens;

    if (!tokens.length) {
      if (statusEl) { statusEl.className = 'status-msg info'; statusEl.style.display = 'block'; statusEl.textContent = t('myNfts.noNft'); }
      if (resultsCard) resultsCard.style.display = 'none';
      return;
    }

    // 2. batch-query nft_info
    if (statusEl) statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.loadingMeta')} (${tokens.length})`;
    const infos = await _queryBatch((tokenId) => _queryNftInfo(contract, tokenId), tokens, _NFTV_CONCURRENCY);
    tokens.forEach((tokenId, i) => { _nftvState.infos[tokenId] = infos[i] || {}; });

    // 3. for tokens missing image/name, fetch metadata JSON from token_uri
    // (skip direct-image token_uri — it is the image itself, fetching it as JSON would waste bandwidth)
    const needMeta = tokens.filter(tid => {
      const ext = _nftvState.infos[tid]?.extension || {};
      const tu = _nftvState.infos[tid]?.token_uri;
      return (!ext.image && !ext.name && tu && !isDirectImageUri(tu));
    });
    if (needMeta.length) {
      if (statusEl) statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.loadingMeta')} (${needMeta.length}/${tokens.length})`;
      const metas = await _queryBatch((tid) => fetchTokenUriMetadata(_nftvState.infos[tid]?.token_uri, _NFTV_META_TIMEOUT), needMeta, _NFTV_CONCURRENCY);
      needMeta.forEach((tid, i) => {
        _nftvState.displays[tid] = _resolveDisplay(_nftvState.infos[tid], metas[i]);
      });
    }
    // resolve directly for tokens that already have an extension
    tokens.forEach(tid => {
      if (!_nftvState.displays[tid]) _nftvState.displays[tid] = _resolveDisplay(_nftvState.infos[tid], null);
    });

    // write cache
    _nftvCache[cacheKey] = { tokens, infos: _nftvState.infos, displays: _nftvState.displays, ts: Date.now() };

    _renderResults('');
  } catch (e) {
    if (statusEl) { statusEl.className = 'status-msg error'; statusEl.style.display = 'block'; statusEl.innerHTML = `<strong>❌ ${t('myNfts.queryFail')}</strong><br>${escapeHtml(e.message)}`; }
  } finally {
    _nftvState.loading = false;
  }
}

function _renderResults(suffix) {
  const statusEl = document.getElementById('nftvStatus');
  if (statusEl) statusEl.style.display = 'none';
  const resultsCard = document.getElementById('nftvResultsCard');
  if (resultsCard) resultsCard.style.display = 'block';

  const summary = document.getElementById('nftvSummary');
  if (summary) summary.innerHTML = `${t('myNfts.total')} <strong style="color:var(--primary)">${_nftvState.tokens.length}</strong> ${t('myNfts.nftUnit')} ${suffix || ''}`;

  _nftvState.rendered = 0;
  renderNextPage();

  const btnExport = document.getElementById('btnNftvExport');
  if (btnExport) btnExport.style.display = _nftvState.tokens.length ? 'inline-flex' : 'none';
}

function renderNextPage() {
  const grid = document.getElementById('nftvGrid');
  if (!grid) return;
  const total = _nftvState.tokens.length;
  const next = Math.min(_nftvState.rendered + _NFTV_PAGE_SIZE, total);
  let html = '';
  for (let i = 0; i < next; i++) {
    html += _renderNftCard(_nftvState.tokens[i], _nftvState.displays[_nftvState.tokens[i]]);
  }
  grid.innerHTML = html;
  _nftvState.rendered = next;

  const wrap = document.getElementById('nftvLoadMoreWrap');
  if (wrap) wrap.style.display = (next < total) ? 'block' : 'none';
}

function _renderNftCard(tokenId, display) {
  const d = display || {};
  const imgCands = _nftImgCandidates(d.image).filter(c => /^https?:\/\//i.test(c) || /^data:image\//i.test(c));
  const imgSrc = imgCands[0] || '';
  const attrs = d.attrs || [];
  const name = d.name || tokenId;
  return `
    <div class="nft-card" data-token-id="${escapeHtml(tokenId)}" style="cursor:pointer;">
      <div class="nft-card-img">
        <div class="nft-card-placeholder" style="display:${imgSrc ? 'none' : 'flex'};">🎨</div>
        ${imgSrc ? `<img src="${escapeHtml(imgSrc)}" data-nft-cands='${escapeHtml(JSON.stringify(imgCands.slice(1)))}' loading="lazy" onerror="_nftvImgErr(this)">` : ''}
      </div>
      <div class="nft-card-body">
        <div class="nft-card-name">${escapeHtml(name)}</div>
        <div class="nft-card-meta">Token #${escapeHtml(tokenId)}</div>
        ${attrs.length ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${attrs.slice(0, 3).map(a => `${escapeHtml(a.trait_type || '')}: ${escapeHtml(String(a.value ?? ''))}`).join(' · ')}</div>` : ''}
      </div>
    </div>
  `;
}

// ============================================================
// detail modal
// ============================================================
function showNftDetail(tokenId, contract) {
  let d = _nftvState.displays[tokenId] || {};
  let c = contract || _nftvState.contract;
  if (contract && _nftvAllChain.length) {
    const it = _nftvAllChain.find(x => x.tokenId === tokenId && x.contract === contract);
    if (it) { d = it.display || {}; c = it.contract; }
  }
  const imgCands = _nftImgCandidates(d.image).filter(c => /^https?:\/\//i.test(c) || /^data:image\//i.test(c));
  const imgSrc = imgCands[0] || '';
  const attrs = d.attrs || [];
  const existing = document.getElementById('nftvModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'nftvModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;position:relative;">
      <button onclick="document.getElementById('nftvModal').remove()" style="position:absolute;top:12px;right:12px;background:var(--bg);border:1px solid var(--border);color:var(--text);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1;">✕</button>
      <div style="text-align:center;margin-bottom:14px;">
        <div style="position:relative;width:100%;max-width:240px;aspect-ratio:1;margin:0 auto 12px;background:var(--bg);border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <div class="nft-card-placeholder" style="position:absolute;inset:0;display:${imgSrc ? 'none' : 'flex'};align-items:center;justify-content:center;font-size:48px;">🎨</div>
          ${imgSrc ? `<img id="nftvModalImg" src="${escapeHtml(imgSrc)}" data-nft-cands='${escapeHtml(JSON.stringify(imgCands.slice(1)))}' style="width:100%;height:100%;object-fit:cover;" onerror="_nftvImgErr(this)">` : ''}
        </div>
        <h3 style="font-size:17px;margin-bottom:4px;">${escapeHtml(d.name || tokenId)}</h3>
        <div style="font-size:12px;color:var(--text-muted);">Token #${escapeHtml(tokenId)}</div>
      </div>

      <!-- send / transfer (direct link below image) -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">${t('myNfts.modalSendTitle')}</div>
        <input type="text" id="nftvModalRecipient" placeholder="${t('myNfts.modalSendRecipientPH')}"
          style="width:100%;margin-bottom:8px;font-family:var(--font-mono,monospace);font-size:12px;">
        <button class="btn btn-chain btn-block" id="btnNftvModalTransfer">${t('myNfts.modalSendBtn')}</button>
        <div class="status-msg" id="nftvModalStatus" style="margin-top:8px;"></div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:6px;line-height:1.5;">${t('myNfts.modalSendHint')}</div>
      </div>
      ${d.desc ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">${escapeHtml(d.desc)}</div>` : ''}
      ${attrs.length ? `
        <div style="font-size:12px;font-weight:700;margin-bottom:6px;">${t('myNfts.attributes')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
          ${attrs.map(a => `<div style="background:var(--bg);border-radius:6px;padding:6px 8px;font-size:11px;"><div style="color:var(--text-muted);font-size:10px;">${escapeHtml(a.trait_type || '')}</div><div style="font-weight:600;">${escapeHtml(String(a.value ?? ''))}</div></div>`).join('')}
        </div>` : ''}
      <div style="border-top:1px solid var(--border);padding-top:10px;font-size:11px;color:var(--text-muted);line-height:1.8;word-break:break-all;">
        <div><strong>${t('myNfts.contractAddr')}:</strong><br><code style="word-break:break-all;color:var(--primary)">${escapeHtml(c)}</code></div>
        ${d.tokenUri ? `<div style="margin-top:6px;"><strong>${t('myNfts.tokenUri')}:</strong><br><code style="word-break:break-all;font-size:10px;">${escapeHtml(d.tokenUri)}</code></div>` : ''}
      </div>
    </div>
  `;
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  // single image in the detail view: race all gateway candidates, use whichever decodes first
  const modalImg = document.getElementById('nftvModalImg');
  if (modalImg && imgCands.length > 1) {
    _nftRaceImage(imgCands, (u) => { modalImg.src = u; });
  }

  // bind the send/transfer button inside the modal
  const btnModal = document.getElementById('btnNftvModalTransfer');
  if (btnModal) {
    btnModal.addEventListener('click', async () => {
      const recipient = (document.getElementById('nftvModalRecipient')?.value || '').trim();
      const statusEl = document.getElementById('nftvModalStatus');
      if (!recipient) { showToast(t('myNfts.transferAddrInvalid'), 'warning'); return; }
      await _doTransferNft({
        contract: c,
        tokenId,
        recipient,
        memo: '',
        btn: btnModal,
        statusEl,
      });
    });
  }
}

// ============================================================
// export CSV
// ============================================================
function exportNftsCsv() {
  let rows, items, fileTag;
  if (_nftvAllChain.length) {
    rows = [[t('myNfts.contractAddr'), t('myNfts.tokenId'), t('myNfts.name'), t('myNfts.image'), t('myNfts.attributes')]];
    items = _nftvAllChain;
    fileTag = 'allchain';
    for (const it of items) {
      const d = it.display || {};
      const attrsStr = (d.attrs || []).map(a => `${a.trait_type || ''}=${a.value ?? ''}`).join('; ');
      rows.push([it.contract, it.tokenId, d.name || '', d.image || '', attrsStr]);
    }
  } else {
    rows = [[t('myNfts.tokenId'), t('myNfts.name'), t('myNfts.image'), t('myNfts.attributes')]];
    items = _nftvState.tokens;
    fileTag = _nftvState.contract.slice(0, 10);
    for (const tokenId of items) {
      const d = _nftvState.displays[tokenId] || {};
      const attrsStr = (d.attrs || []).map(a => `${a.trait_type || ''}=${a.value ?? ''}`).join('; ');
      rows.push([tokenId, d.name || '', d.image || '', attrsStr]);
    }
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nfts-${fileTag}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(t('myNfts.exported'), 'success');
}

// ============================================================
// on-chain query helpers
// ============================================================
// parse CosmWasm smart query response (data is a base64 string or an already-parsed object)
function _decodeSmartQuery(data) {
  if (!data) return null;
  if (typeof data.data === 'string') {
    try {
      const bytes = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }
  if (data.data && typeof data.data === 'object') return data.data;
  return data;
}

async function _queryAllTokens(contract, owner) {
  const all = [];
  let startAfter = null;
  while (true) {
    const query = { tokens: { owner, limit: 100, ...(startAfter ? { start_after: startAfter } : {}) } };
    const encoded = btoa(JSON.stringify(query));
    const url = `${CONFIG.lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`;
    let parsed = null;
    for (let attempt = 0; attempt < 3 && !parsed; attempt++) {
      if (attempt) await new Promise(r => setTimeout(r, 300 * attempt * attempt));
      try {
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) continue;
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json') && !text.trim().startsWith('{')) continue; // rate-limit HTML -> retry
        parsed = _decodeSmartQuery(JSON.parse(text));
      } catch (e) {
        if (attempt === 2) throw e; // real error -> surface it
      }
    }
    const tokens = parsed?.tokens || parsed?.ids || [];
    all.push(...tokens);
    if (tokens.length < 100) break;
    startAfter = tokens[tokens.length - 1];
    if (all.length >= 120) break; // safety cap (each token costs one LCD query)
  }
  return all;
}

// Query one token's nft_info. The LCD rate-limits us: once concurrency is too high it answers
// with an HTML error page instead of JSON, and res.json() would THROW — which used to blow up the
// whole Promise.all batch and blank the entire page. So: parse defensively, retry with backoff on
// rate-limit/5xx, and never throw (worst case we return {} and the card stays a placeholder).
async function _queryNftInfo(contract, tokenId) {
  const query = { nft_info: { token_id: tokenId } };
  const encoded = btoa(JSON.stringify(query));
  const url = `${CONFIG.lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 300 * attempt * attempt)); // 300ms, 1200ms
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) continue; // rate limited / server error -> retry
        return {};
      }
      const text = await res.text();
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json') && !text.trim().startsWith('{')) continue; // HTML rate-limit page -> retry
      return _decodeSmartQuery(JSON.parse(text)) || {};
    } catch (_) {
      // network hiccup / non-JSON body -> retry, and on the last attempt give up quietly
    }
  }
  return {};
}

// concurrent batch processing (limits concurrency)
async function _queryBatch(fn, items, limit) {
  const results = new Array(items.length);
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const res = await Promise.all(batch.map((item, j) => fn(item, i + j)));
    res.forEach((r, j) => { results[i + j] = r; });
  }
  return results;
}

// ============ IPFS gateway / image candidate helpers ============
// Measured from a mainland-CN line (2026-10-28):
//   gateway.pinata.cloud  reachable, but 301-redirects /ipfs/<cid> -> /ipfs/<cid>/  (extra round trip:
//                            12.3s -> 7.2s once we add the trailing slash ourselves)
//   ipfs.io / dweb.link / cloudflare-ipfs.com  all time out (10s)
//   nftstorage.link  only redirects to ipfs.io -> useless
// So: build several candidates, skip gateways that recently failed (circuit breaker), and race
// them in parallel instead of waiting for one dead gateway to time out before trying the next.
const _NFT_IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];
const _NFT_GW_BLOCK_MS = 60000;
const _nftGwState = new Map(); // host -> { fails, until }

// a gateway that keeps failing is skipped for the rest of the session (avoid hammering it)
function _nftGwBlocked(url) {
  try {
    const host = new URL(url).host;
    const st = _nftGwState.get(host);
    if (!st) return false;
    if (Date.now() > st.until) { _nftGwState.delete(host); return false; }
    return st.fails >= 2;
  } catch (_) { return false; }
}
function _nftGwFail(url) {
  try {
    const host = new URL(url).host;
    const st = _nftGwState.get(host) || { fails: 0, until: 0 };
    st.fails += 1;
    st.until = Date.now() + _NFT_GW_BLOCK_MS;
    _nftGwState.set(host, st);
  } catch (_) {}
}
function _nftGwOk(url) {
  try { _nftGwState.delete(new URL(url).host); } catch (_) {}
}

// Build the list of URLs that may serve the image behind `uri`.
// IPFS/Arweave get gateway maps; unknown schemes are kept raw so the link can still be shown.
function _nftImgCandidates(uri) {
  if (!uri || typeof uri !== 'string') return [];
  const s = uri.trim();
  if (!s) return [];
  if (s.startsWith('ar://')) {
    const p = s.slice(5);
    const i = p.indexOf('/');
    const id = i < 0 ? p : p.slice(0, i);
    const rest = i < 0 ? '' : p.slice(i);
    return id ? ['https://arweave.net/' + id + rest, 'https://arweave.dev/' + id + rest] : [];
  }
  let cid = '', rest = '';
  if (s.startsWith('ipfs://')) {
    const p = s.slice(7);
    const i = p.indexOf('/');
    cid = i < 0 ? p : p.slice(0, i);
    rest = i < 0 ? '' : p.slice(i);
  } else {
    // http(s) URL that embeds /ipfs/<cid>[/sub/path] — keep the sub-path (e.g. /1.png)
    const m = s.match(/\/ipfs\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{44,})(\/[^?#]*)?/);
    if (m) { cid = m[1]; rest = m[2] || ''; }
  }
  if (cid) {
    const list = [];
    const seen = new Set();
    const push = (u) => { if (u && !seen.has(u)) { seen.add(u); list.push(u); } };
    // an already-resolved gateway URL is tried first (it is a working host)
    if (/^https?:\/\//i.test(s)) {
      // pinata 301-redirects when the path has no trailing slash — add it ourselves
      push(/^https:\/\/gateway\.pinata\.cloud\/ipfs\/[^/]+$/.test(s) ? s + '/' : s);
    }
    for (const g of _NFT_IPFS_GATEWAYS) {
      if (_nftGwBlocked(g)) continue;
      const isPinata = g.indexOf('gateway.pinata.cloud') >= 0;
      // no sub-path -> pinata wants a trailing slash (skips the 301 round trip)
      push(isPinata && !rest ? g + cid + '/' : g + cid + rest);
    }
    return list;
  }
  if (/^(https?:\/\/|data:)/i.test(s)) return [s];
  return [s];
}

// Preload candidates in parallel and hand back the FIRST one that actually decodes.
// Serial onerror-fallback waits for a dead gateway to time out before trying the next one.
function _nftRaceImage(cands, onWin) {
  if (!cands || !cands.length) return;
  let done = false;
  const win = (u) => {
    if (done) return;
    done = true;
    try { onWin(u); } catch (_) {}
  };
  for (const u of cands) {
    try {
      const probe = new Image();
      probe.onload = () => { _nftGwOk(u); win(u); };
      probe.onerror = () => { _nftGwFail(u); };
      probe.src = u;
    } catch (_) {}
  }
}

// <img> fallback chain: try the next candidate, else show the 🎨 placeholder
function _nftvImgErr(img) {
  const ph = img && img.previousElementSibling;
  let next = [];
  try { next = JSON.parse(img.getAttribute('data-nft-cands') || '[]'); } catch (_) { next = []; }
  if (next.length) {
    img.setAttribute('data-nft-cands', JSON.stringify(next.slice(1)));
    img.src = next[0];
    return;
  }
  if (img) img.style.display = 'none';
  if (ph) ph.style.display = 'flex';
}

// ---- local, dependency-free helpers ------------------------------------------------
// These mirror shared.js isDirectImageUri / parseDataUriJson, duplicated ON PURPOSE:
// the browser can still hold a STALE cached shared.js (deployed before those helpers
// existed) while loading a newer tool file. A hard dependency would then throw a
// ReferenceError and blank out every NFT card, so we degrade gracefully to an inline
// implementation with identical behaviour.
function _nftvDirectImageUri(uri) {
  if (typeof isDirectImageUri === 'function') return isDirectImageUri(uri);
  if (!uri || typeof uri !== 'string') return false;
  const s = uri.trim();
  if (/^data:image\//i.test(s)) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?[^#]*)?$/i.test(s);
}

function _nftvParseDataUriJson(uri) {
  if (typeof parseDataUriJson === 'function') return parseDataUriJson(uri);
  if (!uri || typeof uri !== 'string') return null;
  const m = /^data:([^,]*),([\s\S]*)$/i.exec(uri.trim());
  if (!m) return null;
  try {
    if (/base64/i.test(m[1] || '')) return JSON.parse(decodeURIComponent(escape(atob(m[2] || ''))));
    return JSON.parse(decodeURIComponent(m[2] || ''));
  } catch (e) { return null; }
}

// merge extension with external metadata to produce display info
function _resolveDisplay(info, meta) {
  const tokenUri = (info && info.token_uri) || '';
  try {
    const ext = (info && info.extension) || {};
    const m = meta || {};
    // Paxi NFTs frequently store the image directly as token_uri (e.g. https://i.ibb.co/...png),
    // with extension === null and no separate image field. Treat such a direct image URI as the
    // image so it renders, instead of leaving a placeholder and trying to parse it as JSON metadata.
    // NOTE: token_uri may ALSO be JSON metadata (data:application/json;base64,... / ipfs:// / *.json) —
    // those must be parsed as metadata first, never used as an <img src>.
    const isDirectImage = _nftvDirectImageUri(tokenUri);
    return {
      name: ext.name || m.name || '',
      image: ext.image || m.image || (isDirectImage ? tokenUri : ''),
      desc: ext.description || m.description || '',
      attrs: ext.attributes || m.attributes || [],
      tokenUri: tokenUri,
    };
  } catch (e) {
    // one broken token must never break the whole grid
    return { name: '', image: '', desc: '', attrs: [], tokenUri: tokenUri };
  }
}

// ============ TRANSFER NFT ============
const _NFTV_BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const _NFTV_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function _nftvValidAddr(a) {
  if (typeof a !== 'string') return false;
  const m = /^paxi1([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$/.exec(a.trim());
  if (!m) return false;
  const hrp = [];
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) >> 5);
  hrp.push(0);
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) & 31);
  const data = [];
  for (const c of m[1]) data.push(_NFTV_BECH32.indexOf(c));
  let chk = 1;
  for (const v of hrp.concat(data)) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= _NFTV_GEN[i];
  }
  return chk === 1;
}

async function _transferNft() {
  if (!state || !state.connected) { showToast(t('myNfts.transferNeedWallet'), 'error'); return; }
  const contract = (document.getElementById('nftvTransferContract')?.value || '').trim();
  const tokenId = (document.getElementById('nftvTransferTokenId')?.value || '').trim();
  const recipient = (document.getElementById('nftvTransferRecv')?.value || '').trim();
  const memo = (document.getElementById('nftvTransferMemo')?.value || '').trim();
  const btn = document.getElementById('btnNftvTransfer');
  const statusEl = document.getElementById('nftvTransferStatus');
  await _doTransferNft({ contract, tokenId, recipient, memo, btn, statusEl });
}

// shared transfer logic (used by both the standalone card entry and the detail modal entry)
async function _doTransferNft({ contract, tokenId, recipient, memo, btn, statusEl }) {
  if (!state || !state.connected) { showToast(t('myNfts.transferNeedWallet'), 'error'); return; }
  if (!contract || !tokenId || !recipient) { showToast(t('myNfts.noContract'), 'warning'); return; }
  if (!_nftvValidAddr(contract)) { showToast(t('myNfts.transferAddrInvalid'), 'error'); return; }
  if (!_nftvValidAddr(recipient)) { showToast(t('myNfts.transferAddrInvalid'), 'error'); return; }

  if (!confirm(t('myNfts.transferConfirm') + '\n· Token: ' + tokenId + '\n· → ' + recipient)) return;

  const oldBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> ' + t('myNfts.transferring');
  }

  try {
    const msg = PaxiCosmJS.MsgExecuteContract.fromPartial({
      sender: state.wallet.address,
      contract: contract,
      msg: new TextEncoder().encode(JSON.stringify({ transfer_nft: { token_id: tokenId, recipient } })),
      funds: [],
    });
    const messages = [PaxiCosmJS.Any.fromPartial({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: PaxiCosmJS.MsgExecuteContract.encode(msg).finish(),
    })];
    const res = await buildSignAndBroadcast(messages, 'Transfer NFT ' + tokenId, memo || null, state.wallet);
    const txHash = res?.tx_response?.txhash;
    if (!txHash) throw new Error('Failed');
    if (statusEl) {
      statusEl.className = 'status-msg info';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<strong>⏳ ${t('myNfts.transferring')}</strong><br><span style="font-size:11px">Tx: <code>${escapeHtml(txHash)}</code></span>`;
    }
    const txResp = res?.tx_response || res;
    if (txResp.code !== undefined && txResp.code !== 0) throw new Error(txResp.raw_log || 'Failed');
    let pollRes = { success: true, height: null };
    if (typeof pollTxStatus === 'function') {
      if (btn) btn.innerHTML = '<span class="spinner"></span> ' + t('myNfts.transferring');
      pollRes = await pollTxStatus(txHash, 25);
      if (!pollRes || !pollRes.confirmed || !pollRes.success) throw new Error(pollRes?.rawLog || 'Failed');
    }
    if (statusEl) {
      statusEl.className = 'status-msg success';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<strong>${t('myNfts.transferSuccess')}</strong><br><span style="font-size:11px">Tx: <code style="word-break:break-all;font-size:11px">${escapeHtml(txHash)}</code></span>`;
    }
    showToast(t('myNfts.transferSuccess'), 'success');
    // refresh current view after a successful transfer
    setTimeout(() => { if (typeof loadCurrentNftView === 'function') loadCurrentNftView(); }, 2500);
  } catch (e) {
    if (statusEl) {
      statusEl.className = 'status-msg error';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<strong>❌ ${t('myNfts.queryFail')}</strong><br>${escapeHtml(e.message || e)}`;
    }
    showToast(t('myNfts.queryFail'), 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldBtnHtml;
    }
  }
}

// ============ ALL-CHAIN NFT (code_id=2) ============
async function _getAllCw721Contracts() {
  const list = [];
  let key = null;
  while (true) {
    const qs = key ? `?pagination.key=${encodeURIComponent(key)}&pagination.limit=100` : '?pagination.limit=100';
    const data = await fetchAPI(`/cosmwasm/wasm/v1/code/${_NFTV_CW721_CODE_ID}/contracts${qs}`);
    if (data.contracts) list.push(...data.contracts);
    const nk = data.pagination?.next_key;
    if (!nk) break;
    key = nk;
  }
  return list;
}

async function _queryAllChainNfts() {
  if (!state || !state.connected) { showToast(t('myNfts.allChainNeedWallet'), 'error'); return; }
  const owner = state.wallet.address;
  const statusEl = document.getElementById('nftvStatus');
  const resultsCard = document.getElementById('nftvResultsCard');
  if (statusEl) { statusEl.className = 'status-msg info'; statusEl.style.display = 'block'; statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.allChainLoading')}`; }
  if (resultsCard) resultsCard.style.display = 'none';
  _nftvAllChain = [];
  _nftvLastMode = 'allchain';
  try {
    const contracts = await _getAllCw721Contracts();
    if (!contracts.length) {
      if (statusEl) { statusEl.className = 'status-msg info'; statusEl.style.display = 'block'; statusEl.textContent = t('myNfts.allChainEmpty'); }
      if (resultsCard) resultsCard.style.display = 'none';
      return;
    }
    const perContract = await _queryBatch(
      (ct) => _queryAllTokens(ct, owner).then(ids => ({ ct, ids })).catch(() => ({ ct, ids: [] })),
      contracts, 5
    );
    const items = [];
    for (const r of perContract) for (const id of (r.ids || [])) items.push({ contract: r.ct, tokenId: id });
    if (!items.length) {
      if (statusEl) { statusEl.className = 'status-msg info'; statusEl.style.display = 'block'; statusEl.textContent = t('myNfts.allChainEmpty'); }
      if (resultsCard) resultsCard.style.display = 'none';
      return;
    }
    if (statusEl) statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.loadingMeta')} (${items.length})`;
    const infos = await _queryBatch((it) => _queryNftInfo(it.contract, it.tokenId), items, _NFTV_CONCURRENCY);
    items.forEach((it, i) => { it.info = infos[i] || {}; it.display = _resolveDisplay(it.info, null); });

    // for tokens missing image/name, fetch metadata from token_uri (which may contain base64 JSON)
    const needMeta = items.filter(it => {
      const ext = it.info?.extension || {};
      const tokenUri = it.info?.token_uri || '';
      const isDirectImage = _nftvDirectImageUri(tokenUri);
      return (!ext.image && !ext.name && tokenUri && !isDirectImage);
    });
    if (needMeta.length) {
      if (statusEl) statusEl.innerHTML = `<span class="spinner"></span> ${t('myNfts.loadingMeta')} (${needMeta.length}/${items.length})`;
      const metas = await _queryBatch((it) => fetchTokenUriMetadata(it.info.token_uri, _NFTV_META_TIMEOUT), needMeta, _NFTV_CONCURRENCY);
      needMeta.forEach((it, i) => { it.display = _resolveDisplay(it.info, metas[i]); });
    }

    _nftvAllChain = items;
    _renderAllChainResults(items, contracts.length);
  } catch (e) {
    if (statusEl) { statusEl.className = 'status-msg error'; statusEl.style.display = 'block'; statusEl.innerHTML = `<strong>❌ ${t('myNfts.queryFail')}</strong><br>${escapeHtml(e.message || e)}`; }
  }
}

function _renderAllChainResults(items, contractCount) {
  const statusEl = document.getElementById('nftvStatus');
  if (statusEl) statusEl.style.display = 'none';
  const resultsCard = document.getElementById('nftvResultsCard');
  if (resultsCard) resultsCard.style.display = 'block';
  const summary = document.getElementById('nftvSummary');
  if (summary) summary.innerHTML = t('myNfts.allChainCount').replace('{n}', contractCount).replace('{m}', items.length);
  const grid = document.getElementById('nftvGrid');
  if (grid) grid.innerHTML = items.map(_renderAllChainCard).join('');
  const wrap = document.getElementById('nftvLoadMoreWrap');
  if (wrap) wrap.style.display = 'none';
  const btnExport = document.getElementById('btnNftvExport');
  if (btnExport) btnExport.style.display = items.length ? 'inline-flex' : 'none';
}

function _renderAllChainCard(item) {
  const d = item.display || {};
  const imgCands = _nftImgCandidates(d.image).filter(c => /^https?:\/\//i.test(c) || /^data:image\//i.test(c));
  const imgSrc = imgCands[0] || '';
  const attrs = d.attrs || [];
  const name = d.name || item.tokenId;
  const shortC = item.contract.slice(0, 8) + '...' + item.contract.slice(-4);
  return `
    <div class="nft-card" data-token-id="${escapeHtml(item.tokenId)}" data-contract="${escapeHtml(item.contract)}" style="cursor:pointer;">
      <div class="nft-card-img">
        <div class="nft-card-placeholder" style="display:${imgSrc ? 'none' : 'flex'};">🎨</div>
        ${imgSrc ? `<img src="${escapeHtml(imgSrc)}" data-nft-cands='${escapeHtml(JSON.stringify(imgCands.slice(1)))}' loading="lazy" onerror="_nftvImgErr(this)">` : ''}
      </div>
      <div class="nft-card-body">
        <div class="nft-card-name">${escapeHtml(name)}</div>
        <div class="nft-card-meta">Token #${escapeHtml(item.tokenId)}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;word-break:break-all;">${escapeHtml(shortC)}</div>
      </div>
    </div>
  `;
}

window.TOOL_REGISTRY['my-nfts'] = {
  render: renderMyNfts,
  bind: bindMyNftsEvents,
};
