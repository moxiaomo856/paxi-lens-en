/**
 * NFT Market (read-only gallery + non-custodial listing board) — A-plan.
 *
 * What this tool IS:
 *   - Read-only gallery of every CW721 collection on Paxi (enumeration via code_id=2).
 *   - A local, non-custodial "sale intent" board: sellers post an NFT they want to
 *     sell, stored only in this browser (localStorage). No on-chain escrow, no settlement.
 *
 * What this tool is NOT (compliance red line — never crossed here):
 *   - NOT a trading venue, NOT a matcher, NOT an escrow, NOT a settlement layer.
 *   - It NEVER calls MsgExecuteContract for any swap/buy, never holds assets, never
 *     charges fees. All actual transfers happen independently in the user's wallet.
 *
 * Reuses my-nfts.js globals: _getAllCw721Contracts, _queryNftInfo, _queryBatch,
 * _resolveDisplay. Reuses shared.js globals: escapeHtml, safeNftImgSrc, showToast,
 * fetchTokenUriMetadata.
 */
if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

// ============================================================
// constants & local state
// ============================================================
const _NFTM_CODE_ID = 2;          // every cw721 on Paxi instantiates from code_id 2
const _NFTM_COLL_PER_PAGE = 60;   // collections shown per page
const _NFTM_TOKEN_PAGE = 100;      // tokens fetched per page inside a collection
const _NFTM_CONCURRENCY = 10;
const _NFTM_INTENT_KEY = 'paxi_nft_intents';   // local sale intents (this device)
const _NFTM_IMPORT_KEY = 'paxi_nft_imported';  // imported intent cards (this device)
const _NFTM_TOKEN_CAP = 500;       // hard cap on tokens rendered per collection

let _nftmState = {
  subTab: 'browse',      // browse | list | myOrders | import
  view: 'collections',   // browse sub-view: collections | tokens
  collections: [],       // all cw721 contract addresses (code_id=2)
  collMeta: {},          // contract -> { name, symbol }
  collShown: 0,          // how many collections currently rendered
  openContract: '',      // currently opened collection
  openTokens: [],        // token ids of opened collection
  openDisplays: {},      // tokenId -> display info
  tokenCursor: null,     // start_after cursor for the opened collection
  loading: false,
};

// ============================================================
// render
// ============================================================
function renderNftMarket() {
  const tabsArr = t('nftMarket.tabs') || ['Browse', 'List', 'My Orders', 'Import'];
  const keys = ['browse', 'list', 'myOrders', 'import'];
  const tabEls = tabsArr.map((label, i) => {
    const key = keys[i] || 'browse';
    return `<div class="tab ${_nftmState.subTab === key ? 'active' : ''}" data-nftm-tab="${key}">${escapeHtml(label)}</div>`;
  }).join('');

  let body = '';
  if (_nftmState.subTab === 'browse') body = _nftmRenderBrowse();
  else if (_nftmState.subTab === 'list') body = _nftmRenderList();
  else if (_nftmState.subTab === 'myOrders') body = _nftmRenderMyOrders();
  else if (_nftmState.subTab === 'import') body = _nftmRenderImport();

  return `
    <div class="card">
      <div class="card-title">${t('nftMarket.title')}</div>
      <div class="info-box">${t('nftMarket.disclaimer')}</div>
      <div class="tabs" id="nftmTabs">${tabEls}</div>
    </div>
    <div id="nftmBody">${body}</div>
  `;
}

// ---------- Browse ----------
function _nftmRenderBrowse() {
  if (_nftmState.view === 'tokens') return _nftmRenderTokensView();
  return `
    <div class="card">
      <div class="tool-desc">${t('nftMarket.galleryHint')}</div>
      <div class="status-msg info" id="nftmStatus" style="display:block;">⏳ ${t('nftMarket.loadingContracts')}</div>
      <div id="nftmCollections" style="margin-top:12px;"></div>
    </div>`;
}

function _nftmRenderTokensView() {
  const c = _nftmState.openContract;
  const info = _nftmState.collMeta[c] || {};
  const name = info.name || (c.slice(0, 10) + '...');
  return `
    <div class="card">
      <div class="back-bar" id="nftmBack">${t('nftMarket.backToCollections')}</div>
      <div class="card-title">${escapeHtml(name)}</div>
      <div class="tool-desc" style="word-break:break-all;">${escapeHtml(c)}</div>
      <div class="status-msg info" id="nftmStatus" style="display:block;">⏳ ${t('nftMarket.loadingTokens')}</div>
      <div class="nft-market-grid" id="nftmGrid"></div>
      <div id="nftmLoadMoreWrap" style="text-align:center;margin-top:14px;display:none;">
        <button class="btn btn-outline btn-sm" id="nftmLoadMore">Load More</button>
      </div>
    </div>`;
}

// ---------- List (post sale intent) ----------
function _nftmRenderList() {
  return `
    <div class="card">
      <div class="info-box">${t('nftMarket.listHint')}</div>
      <div class="form-group">
        <label class="form-label">${t('nftMarket.contractLabel')}</label>
        <input type="text" id="nftmIntentContract" placeholder="paxi1..." />
      </div>
      <div class="form-group">
        <label class="form-label">${t('nftMarket.tokenIdLabel')}</label>
        <input type="text" id="nftmIntentTokenId" placeholder="1786443480877_0" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">${t('nftMarket.priceLabel')}</label>
          <input type="number" id="nftmIntentPrice" placeholder="100" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('nftMarket.contactLabel')}</label>
          <input type="text" id="nftmIntentContact" placeholder="@handle / memo" />
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="nftmSaveIntent">${t('nftMarket.saveIntent')}</button>
      <div class="status-msg" id="nftmIntentStatus"></div>
    </div>`;
}

// ---------- My Orders ----------
function _nftmRenderMyOrders() {
  const tabsArr = t('nftMarket.tabs') || ['Browse', 'List', 'My Orders', 'Import'];
  const title = tabsArr[2] || 'My Orders';
  const intents = _nftmLoadIntents();
  if (!intents.length) {
    return `<div class="card"><div class="info-box">${t('nftMarket.myOrdersEmpty')}</div></div>`;
  }
  const items = intents.map((it, idx) => `
    <div class="listing-item">
      <div class="listing-item-main">
        <div class="listing-item-name">${escapeHtml(it.tokenId || '')}</div>
        <div class="listing-item-meta">${escapeHtml((it.contract || '').slice(0, 12))}… · ${escapeHtml(String(it.price))} PAXI${it.contact ? ' · ' + escapeHtml(it.contact) : ''}</div>
      </div>
      <div class="listing-item-actions">
        <button class="btn btn-outline btn-sm" data-nftm-copy="${idx}">${t('nftMarket.copyCard')}</button>
        <button class="btn btn-danger btn-sm" data-nftm-del="${idx}">${t('common.delete')}</button>
      </div>
    </div>`).join('');
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div class="card-title" style="margin:0;">${escapeHtml(title)}</div>
        <button class="btn btn-outline btn-sm" id="nftmExportIntents">${t('nftMarket.exportIntents')}</button>
      </div>
      ${items}
    </div>`;
}

// ---------- Import / Share ----------
function _nftmRenderImport() {
  const imported = _nftmLoadImported();
  let list = '';
  if (imported.length) {
    list = imported.map((it, idx) => `
      <div class="listing-item">
        <div class="listing-item-main">
          <div class="listing-item-name">${escapeHtml(it.tokenId || '')}</div>
          <div class="listing-item-meta">${escapeHtml((it.contract || '').slice(0, 12))}… · ${escapeHtml(String(it.price))} PAXI${it.contact ? ' · ' + escapeHtml(it.contact) : ''}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-nftm-delimp="${idx}">${t('common.delete')}</button>
      </div>`).join('');
  }
  return `
    <div class="card">
      <div class="tool-desc">${t('nftMarket.importHint')}</div>
      <div class="form-group">
        <textarea id="nftmImportText" placeholder="${t('nftMarket.importPlaceholder')}"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="nftmImportBtn">${t('nftMarket.importBtn')}</button>
      <div class="status-msg" id="nftmImportStatus"></div>
      ${list ? `<div style="margin-top:14px;"><div class="card-title" style="margin-bottom:8px;">${escapeHtml(t('nftMarket.importBtn'))}</div>${list}</div>` : ''}
    </div>`;
}

// ============================================================
// bind
// ============================================================
function bindNftMarketEvents() {
  setTimeout(() => {
    const tabsEl = document.getElementById('nftmTabs');
    if (tabsEl) tabsEl.querySelectorAll('.tab[data-nftm-tab]').forEach(el => {
      el.addEventListener('click', () => _nftmSwitchTab(el.dataset.nftmTab));
    });
    _nftmBindBody();
  }, 100);
}

function _nftmSwitchTab(key) {
  _nftmState.subTab = key;
  document.querySelectorAll('#nftmTabs .tab').forEach(el => {
    el.classList.toggle('active', el.dataset.nftmTab === key);
  });
  const body = document.getElementById('nftmBody');
  if (!body) return;
  let html = '';
  if (key === 'browse') {
    _nftmState.view = 'collections';     // 从其他 tab 切回浏览时总是回到合集列表（而非残留的 token 视图）
    _nftmState.openContract = '';
    html = _nftmRenderBrowse();
  }
  else if (key === 'list') html = _nftmRenderList();
  else if (key === 'myOrders') html = _nftmRenderMyOrders();
  else if (key === 'import') html = _nftmRenderImport();
  body.innerHTML = html;
  _nftmBindBody();
}

function _nftmBindBody() {
  const tab = _nftmState.subTab;
  if (tab === 'browse') {
    const back = document.getElementById('nftmBack');
    if (back) back.onclick = _nftmGoCollections;
    const collBox = document.getElementById('nftmCollections');
    if (collBox) collBox.onclick = (e) => {
      const card = e.target.closest('.nftm-coll');
      if (card) _nftmOpenCollection(card.dataset.contract);
    };
    const grid = document.getElementById('nftmGrid');
    if (grid) grid.onclick = (e) => {
      const card = e.target.closest('.nft-card[data-token-id]');
      if (card) _nftmShowDetail(card.dataset.tokenId, card.dataset.contract);
    };
    const more = document.getElementById('nftmLoadMore');
    if (more) more.onclick = _nftmLoadMoreTokens;
    if (_nftmState.view === 'collections') _nftmLoadCollections(); // always re-render; cached list is reused (no re-fetch), fixes blank after tab switch / back
  } else if (tab === 'list') {
    const save = document.getElementById('nftmSaveIntent');
    if (save) save.onclick = _nftmSaveIntent;
  } else if (tab === 'myOrders') {
    const exp = document.getElementById('nftmExportIntents');
    if (exp) exp.onclick = _nftmExportAllIntents;
    const body = document.getElementById('nftmBody');
    if (body) body.onclick = (e) => {
      const del = e.target.closest('[data-nftm-del]');
      if (del) { _nftmDeleteIntent(parseInt(del.dataset.nftmDel, 10)); return; }
      const cp = e.target.closest('[data-nftm-copy]');
      if (cp) _nftmCopyIntent(parseInt(cp.dataset.nftmCopy, 10));
    };
  } else if (tab === 'import') {
    const btn = document.getElementById('nftmImportBtn');
    if (btn) btn.onclick = _nftmImportCards;
    const body = document.getElementById('nftmBody');
    if (body) body.onclick = (e) => {
      const del = e.target.closest('[data-nftm-delimp]');
      if (del) _nftmDeleteImported(parseInt(del.dataset.nftmDelimp, 10));
    };
  }
}

// ============================================================
// data loading (read-only on-chain)
// ============================================================
async function _nftmLoadCollections() {
  const status = document.getElementById('nftmStatus');
  const box = document.getElementById('nftmCollections');
  if (!box) return;
  _nftmState.collShown = 0; // reset pagination; otherwise returning from a collection starts past the end and renders nothing
  box.innerHTML = ''; // clear stale grid so re-render starts clean (no duplicate appends across switch/back)
  try {
    if (!_nftmState.collections.length) {
      _nftmState.collections = await _getAllCw721Contracts(); // global from my-nfts.js
    }
    if (!_nftmState.collections.length) {
      if (status) { status.className = 'status-msg info'; status.style.display = 'block'; status.textContent = t('nftMarket.noContracts'); }
      return;
    }
    if (status) status.style.display = 'none';
    _nftmRenderCollectionList();
  } catch (e) {
    if (status) { status.className = 'status-msg error'; status.style.display = 'block'; status.innerHTML = '❌ ' + escapeHtml(e.message || e); }
  }
}

async function _nftmRenderCollectionList() {
  const box = document.getElementById('nftmCollections');
  if (!box) return;
  const start = _nftmState.collShown;
  const list = _nftmState.collections.slice(start, start + _NFTM_COLL_PER_PAGE);
  _nftmState.collShown = start + list.length;
  const grid = document.createElement('div');
  grid.className = 'nft-market-grid';
  grid.innerHTML = list.map(c => `
    <div class="nft-card nftm-coll" data-contract="${escapeHtml(c)}" style="cursor:pointer;">
      <div class="nft-card-body">
        <div class="nft-card-name" data-name="${escapeHtml(c)}">${escapeHtml(c.slice(0, 10))}…</div>
        <div class="nft-card-meta">${escapeHtml(c.slice(-6))}</div>
      </div>
    </div>`).join('');
  box.appendChild(grid);
  // load collection names concurrently (best-effort, non-blocking)
  await _queryBatch(async (c) => {
    try {
      const info = await _queryNftContractInfo(c);
      _nftmState.collMeta[c] = info || {};
      const el = box.querySelector(`.nftm-coll[data-contract="${c}"] [data-name]`);
      if (el && info && info.name) el.textContent = info.name;
    } catch (_) {}
  }, list, _NFTM_CONCURRENCY);
  // load-more button
  if (_nftmState.collShown < _nftmState.collections.length) {
    let more = document.getElementById('nftmCollMore');
    if (!more) {
      more = document.createElement('button');
      more.id = 'nftmCollMore';
      more.className = 'btn btn-outline btn-block';
      more.style.marginTop = '12px';
      more.textContent = 'Load more collections';
      more.onclick = _nftmRenderCollectionList;
      box.appendChild(more);
    }
  } else {
    const more = document.getElementById('nftmCollMore');
    if (more) more.remove();
  }
}

async function _queryNftContractInfo(contract) {
  try {
    const query = { contract_info: {} };
    const encoded = btoa(JSON.stringify(query));
    const url = `${CONFIG.lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return _decodeSmartQuery(data) || null;
  } catch (_) { return null; }
}

async function _nftmOpenCollection(contract) {
  _nftmState.view = 'tokens';
  _nftmState.openContract = contract;
  _nftmState.openTokens = [];
  _nftmState.openDisplays = {};
  _nftmState.tokenCursor = null;
  const body = document.getElementById('nftmBody');
  if (body) body.innerHTML = _nftmRenderTokensView();
  _nftmBindBody();        // re-bind back button / token grid / load-more after swapping to tokens view
  await _nftmLoadMoreTokens();
}

async function _nftmLoadMoreTokens() {
  const contract = _nftmState.openContract;
  if (!contract) return;
  const status = document.getElementById('nftmStatus');
  const grid = document.getElementById('nftmGrid');
  const wrap = document.getElementById('nftmLoadMoreWrap');
  try {
    const query = { all_tokens: { limit: _NFTM_TOKEN_PAGE, ...(_nftmState.tokenCursor ? { start_after: _nftmState.tokenCursor } : {}) } };
    const encoded = btoa(JSON.stringify(query));
    const url = `${CONFIG.lcd}/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const parsed = _decodeSmartQuery(data);
    const tokens = parsed && parsed.tokens ? parsed.tokens : [];
    if (!tokens.length) {
      if (status) { status.className = 'status-msg info'; status.style.display = 'block'; status.textContent = t('nftMarket.noTokens'); }
      if (wrap) wrap.style.display = 'none';
      return;
    }
    // register token ids + a placeholder display, then render placeholder cards IMMEDIATELY
    // so the grid appears at once instead of blocking on every metadata request
    const frag = document.createDocumentFragment();
    tokens.forEach(tid => {
      _nftmState.openTokens.push(tid);
      _nftmState.openDisplays[tid] = _nftmState.openDisplays[tid] || { name: '', image: '', desc: '', attrs: [], tokenUri: '' };
      const holder = document.createElement('div');
      holder.innerHTML = _nftmRenderTokenCard(tid, contract);
      frag.appendChild(holder.firstElementChild);
    });
    if (grid) grid.appendChild(frag);
    if (status) status.style.display = 'none';
    _nftmState.tokenCursor = tokens[tokens.length - 1];
    if (wrap) wrap.style.display = (tokens.length < _NFTM_TOKEN_PAGE || _nftmState.openTokens.length >= _NFTM_TOKEN_CAP) ? 'none' : 'block';
    // fill metadata in the background (progressive, non-blocking) — images/names pop in as they arrive
    _nftmFillMetadata(tokens, contract);
  } catch (e) {
    if (status) { status.className = 'status-msg error'; status.style.display = 'block'; status.innerHTML = '❌ ' + escapeHtml(e.message || e); }
  }
}

function _nftmTokenCardInner(tokenId, contract) {
  const d = _nftmState.openDisplays[tokenId] || {};
  const img = safeNftImgSrc(d.image);
  const name = d.name || tokenId;
  const attrs = d.attrs || [];
  return `
      <div class="nft-card-img">
        <div class="nft-card-placeholder" style="display:${img ? 'none' : 'flex'};">🎨</div>
        ${img ? `<img src="${img}" loading="lazy" onerror="this.style.display='none';this.previousElementSibling.style.display='flex';">` : ''}
      </div>
      <div class="nft-card-body">
        <div class="nft-card-name">${escapeHtml(name)}</div>
        <div class="nft-card-meta">Token #${escapeHtml(tokenId)}</div>
        ${attrs.length ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${attrs.slice(0, 2).map(a => escapeHtml(a.trait_type || '') + ': ' + escapeHtml(String(a.value ?? ''))).join(' · ')}</div>` : ''}
      </div>`;
}

function _nftmRenderTokenCard(tokenId, contract) {
  return `<div class="nft-card" data-token-id="${escapeHtml(tokenId)}" data-contract="${escapeHtml(contract)}" style="cursor:pointer;">${_nftmTokenCardInner(tokenId, contract)}</div>`;
}

// update a single token card in place (used during the progressive metadata fill)
function _nftmUpdateTokenCard(tokenId, contract) {
  const grid = document.getElementById('nftmGrid');
  if (!grid) return;
  const card = Array.from(grid.children).find(c => c.dataset && c.dataset.tokenId === tokenId && c.dataset.contract === contract);
  if (card) card.innerHTML = _nftmTokenCardInner(tokenId, contract);
}

// progressively fetch nft_info (and token_uri metadata when needed) and refresh cards as they arrive
let _nftmMetaPending = 0;
async function _nftmFillMetadata(tokens, contract) {
  _nftmMetaPending += tokens.length;
  _nftmSetMetaStatus();
  await _queryBatch(async (tid) => {
    try {
      const info = await _queryNftInfo(contract, tid);
      _nftmState.openDisplays[tid] = _resolveDisplay(info, null);
      _nftmUpdateTokenCard(tid, contract);
      const ext = info.extension || {};
      if (!ext.image && !ext.name && info.token_uri) {
        try {
          const meta = await fetchTokenUriMetadata(info.token_uri, 5000);
          _nftmState.openDisplays[tid] = _resolveDisplay(info, meta);
          _nftmUpdateTokenCard(tid, contract);
        } catch (_) {}
      }
    } catch (_) {}
    _nftmMetaPending = Math.max(0, _nftmMetaPending - 1);
    _nftmSetMetaStatus();
  }, tokens, _NFTM_CONCURRENCY);
}

function _nftmSetMetaStatus() {
  const status = document.getElementById('nftmStatus');
  if (!status) return;
  if (_nftmMetaPending > 0) {
    status.className = 'status-msg info';
    status.style.display = 'block';
    status.textContent = '⏳ ' + t('nftMarket.loadingTokens');
  } else {
    status.style.display = 'none';
  }
}

function _nftmShowDetail(tokenId, contract) {
  const d = _nftmState.openDisplays[tokenId] || {};
  const img = safeNftImgSrc(d.image);
  const attrs = d.attrs || [];
  const existing = document.getElementById('nftmModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'nftmModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;position:relative;">
      <button onclick="document.getElementById('nftmModal').remove()" style="position:absolute;top:12px;right:12px;background:var(--bg);border:1px solid var(--border);color:var(--text);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1;">✕</button>
      <div style="text-align:center;margin-bottom:14px;">
        <div style="width:100%;max-width:240px;aspect-ratio:1;margin:0 auto 12px;background:var(--bg);border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=&quot;font-size:48px;&quot;>🎨</div>'">` : '<div style="font-size:48px;">🎨</div>'}
        </div>
        <h3 style="font-size:17px;margin-bottom:4px;">${escapeHtml(d.name || tokenId)}</h3>
        <div style="font-size:12px;color:var(--text-muted);">Token #${escapeHtml(tokenId)}</div>
      </div>
      ${d.desc ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">${escapeHtml(d.desc)}</div>` : ''}
      ${attrs.length ? `<div style="font-size:12px;font-weight:700;margin-bottom:6px;">${t('myNfts.attributes')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
          ${attrs.map(a => `<div style="background:var(--bg);border-radius:6px;padding:6px 8px;font-size:11px;"><div style="color:var(--text-muted);font-size:10px;">${escapeHtml(a.trait_type || '')}</div><div style="font-weight:600;">${escapeHtml(String(a.value ?? ''))}</div></div>`).join('')}
        </div>` : ''}
      <div style="border-top:1px solid var(--border);padding-top:10px;font-size:11px;color:var(--text-muted);line-height:1.8;word-break:break-all;">
        <div><strong>${t('myNfts.contractAddr')}:</strong><br><code style="word-break:break-all;color:var(--primary)">${escapeHtml(contract)}</code></div>
      </div>
      <button class="btn btn-primary btn-block" id="nftmIntentFromDetail" style="margin-top:14px;">📋 ${t('nftMarket.saveIntent')}</button>
    </div>`;
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  const btn = modal.querySelector('#nftmIntentFromDetail');
  if (btn) btn.onclick = () => { modal.remove(); _nftmGotoListWithPrefill(contract, tokenId); };
}

function _nftmGoCollections() {
  _nftmState.view = 'collections';
  _nftmState.openContract = '';
  const body = document.getElementById('nftmBody');
  if (body) body.innerHTML = _nftmRenderBrowse();
  _nftmBindBody(); // view==='collections' triggers _nftmLoadCollections inside, re-rendering the cached grid without re-fetching
}

function _nftmGotoListWithPrefill(contract, tokenId) {
  _nftmSwitchTab('list');
  setTimeout(() => {
    const c = document.getElementById('nftmIntentContract');
    const tid = document.getElementById('nftmIntentTokenId');
    if (c) c.value = contract;
    if (tid) tid.value = tokenId;
  }, 60);
}

// ============================================================
// sale intent (local, non-custodial) CRUD
// ============================================================
function _nftmLoadIntents() {
  try { return JSON.parse(localStorage.getItem(_NFTM_INTENT_KEY) || '[]'); } catch (_) { return []; }
}
function _nftmLoadImported() {
  try { return JSON.parse(localStorage.getItem(_NFTM_IMPORT_KEY) || '[]'); } catch (_) { return []; }
}

function _nftmBuildCard(it) {
  return `Paxi NFT Sale Intent\nContract: ${it.contract}\nToken ID: ${it.tokenId}\nPrice: ${it.price} PAXI\nContact: ${it.contact || '-'}`;
}

async function _nftmSaveIntent() {
  const contract = (document.getElementById('nftmIntentContract')?.value || '').trim();
  const tokenId = (document.getElementById('nftmIntentTokenId')?.value || '').trim();
  const priceStr = (document.getElementById('nftmIntentPrice')?.value || '').trim();
  const contact = (document.getElementById('nftmIntentContact')?.value || '').trim();
  const status = document.getElementById('nftmIntentStatus');
  if (!contract) { showToast(t('nftMarket.needContract'), 'warning'); return; }
  if (!tokenId) { showToast(t('nftMarket.needTokenId'), 'warning'); return; }
  const price = parseFloat(priceStr);
  if (!(price > 0)) { showToast(t('nftMarket.needPrice'), 'warning'); return; }
  const intents = _nftmLoadIntents();
  intents.unshift({ contract, tokenId, price, contact, ts: Date.now() });
  localStorage.setItem(_NFTM_INTENT_KEY, JSON.stringify(intents));
  if (status) { status.className = 'status-msg success'; status.style.display = 'block'; status.textContent = t('nftMarket.savedIntent'); }
  showToast(t('nftMarket.savedIntent'), 'success');
  ['nftmIntentContract', 'nftmIntentTokenId', 'nftmIntentPrice', 'nftmIntentContact'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

function _nftmDeleteIntent(idx) {
  const intents = _nftmLoadIntents();
  intents.splice(idx, 1);
  localStorage.setItem(_NFTM_INTENT_KEY, JSON.stringify(intents));
  const body = document.getElementById('nftmBody');
  if (body) body.innerHTML = _nftmRenderMyOrders();
  _nftmBindBody();
}

function _nftmCopyIntent(idx) {
  const intents = _nftmLoadIntents();
  const it = intents[idx];
  if (!it) return;
  _copyText(_nftmBuildCard(it));
  showToast(t('nftMarket.cardCopied'), 'success');
}

function _nftmExportAllIntents() {
  const intents = _nftmLoadIntents();
  if (!intents.length) { showToast(t('nftMarket.myOrdersEmpty'), 'warning'); return; }
  const text = intents.map(_nftmBuildCard).join('\n\n----\n\n');
  _copyText(text);
  showToast(t('nftMarket.exportIntents') + ' ✓', 'success');
}

// ============================================================
// import / share
// ============================================================
function _nftmParseCard(text) {
  const c = /Contract:\s*(\S+)/i.exec(text);
  const tid = /Token\s*ID:\s*(\S+)/i.exec(text);
  const p = /Price:\s*([\d.]+)/i.exec(text);
  const ct = /Contact:\s*(.+)/i.exec(text);
  if (!c || !tid || !p) return null;
  return {
    contract: c[1].trim(),
    tokenId: tid[1].trim(),
    price: parseFloat(p[1]),
    contact: ct ? ct[1].trim() : '',
    ts: Date.now(),
  };
}

function _nftmImportCards() {
  const ta = document.getElementById('nftmImportText');
  const status = document.getElementById('nftmImportStatus');
  if (!ta) return;
  const raw = ta.value || '';
  const blocks = raw.split(/\n\s*----\s*\n|(?:\r?\n){2,}/).map(b => b.trim()).filter(Boolean);
  if (!blocks.length) { showToast(t('nftMarket.importFail'), 'warning'); return; }
  const parsed = [];
  for (const b of blocks) {
    const it = _nftmParseCard(b);
    if (it && it.price > 0) parsed.push(it);
  }
  if (!parsed.length) {
    if (status) { status.className = 'status-msg error'; status.style.display = 'block'; status.textContent = t('nftMarket.importFail'); }
    showToast(t('nftMarket.importFail'), 'error');
    return;
  }
  const imported = _nftmLoadImported();
  parsed.forEach(it => imported.unshift(it));
  localStorage.setItem(_NFTM_IMPORT_KEY, JSON.stringify(imported));
  if (status) { status.className = 'status-msg success'; status.style.display = 'block'; status.textContent = t('nftMarket.importOk').replace('{n}', parsed.length); }
  showToast(t('nftMarket.importOk').replace('{n}', parsed.length), 'success');
  const body = document.getElementById('nftmBody');
  if (body) body.innerHTML = _nftmRenderImport();
  _nftmBindBody();
}

function _nftmDeleteImported(idx) {
  const imported = _nftmLoadImported();
  imported.splice(idx, 1);
  localStorage.setItem(_NFTM_IMPORT_KEY, JSON.stringify(imported));
  const body = document.getElementById('nftmBody');
  if (body) body.innerHTML = _nftmRenderImport();
  _nftmBindBody();
}

function _copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => _copyTextFallback(text));
  } else {
    _copyTextFallback(text);
  }
}
function _copyTextFallback(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch (_) {}
}

// ============================================================
// register
// ============================================================
window.TOOL_REGISTRY['nft-market'] = {
  render: renderNftMarket,
  bind: bindNftMarketEvents,
};
