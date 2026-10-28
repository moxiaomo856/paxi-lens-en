/**
 * Paxi Toolbox - common module
 * Shared by app.js (toolbox home) and nft-launcher/index.html (NFT launch platform)
 * Includes: network config, tx build/sign/broadcast, gas simulation, tx polling, error-code mapping, common utilities
 */

// ============================================================
// Network configuration (supports mainnet/testnet switching)
// ============================================================
const NETWORKS = {
  mainnet: {
    name: 'Mainnet',
    rpc: 'https://mainnet-rpc.paxinet.io',
    lcd: 'https://mainnet-lcd.paxinet.io',
    chainId: 'paxi-mainnet',
    denom: 'upaxi',
    denomDisplay: 'PAXI',
    sdkUrl: 'https://mainnet-api.paxinet.io/resources/js/paxi-cosmjs.umd.js',
  },
  testnet: {
    name: 'Testnet',
    rpc: 'https://testnet-rpc.paxinet.io',
    lcd: 'https://testnet-lcd.paxinet.io',
    chainId: 'paxi-testnet',
    denom: 'upaxi',
    denomDisplay: 'PAXI',
    sdkUrl: 'https://testnet-api.paxinet.io/resources/js/paxi-cosmjs.umd.js',
  },
};

// Current network (read from localStorage, default mainnet)
let currentNetwork = localStorage.getItem('paxi_network') || 'mainnet';

function getNetworkConfig() {
  return NETWORKS[currentNetwork] || NETWORKS.mainnet;
}

function getLCD() {
  return getNetworkConfig().lcd;
}

function getChainId() {
  return getNetworkConfig().chainId;
}

function getDenom() {
  return getNetworkConfig().denom;
}

function switchNetwork(network) {
  if (!NETWORKS[network]) return;
  currentNetwork = network;
  localStorage.setItem('paxi_network', network);
  // Reload the page to apply the new network
  window.location.reload();
}

const SHARED_CONFIG = {
  get denom() { return getDenom(); },
  get denomDisplay() { return getNetworkConfig().denomDisplay; },
  get lcd() { return getLCD(); },
  get chainId() { return getChainId(); },
  gasPrice: '0.25upaxi',
  gasLimit: 600000,
  maxMessagesPerTx: 100,
  feeCollector: 'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg',
  feeRate: 1.5,
  // Batch transfer charges per address (PAXI/address)
  batchTransfer: {
    feePerAddress: 0.03838,     // service fee per address for native/PRC-20
    nftFeePerAddress: 1,        // service fee per address for NFT
    maxAddressesPerTx: 100,     // max addresses per transaction
    maxTotalAddresses: 1000,    // total cap
  },
  // NFT market configuration
  nftMarket: {
    listingFee: 2,
    buyFeeRate: 1,
    grantDurationSec: 300,
    listingDurationSec: 86400,
    msgTypeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
  },
  // Governance proposal configuration
  governance: {
    submitFee: 0,
    defaultDeposit: 100,
    // DAO proposal (community-pool grant / funding request) whitelist: only these wallet addresses see the feature once connected
    daoProposerWhitelist: [
      'paxi1gzrza9s6frtwenz0p4dpjftjpvjaznn6f2lvh3',
      'paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg',
      'paxi1qvrmsftn402cumn0axqjc4dgvmkge6lhp0y39j',
      'paxi1fl8j6gewhs2yz3tztr5dlvsmpp0d7gaxka73e5',
    ],
  },
};

// ============================================================
// Common utility functions
// ============================================================

// Safe Uint8Array -> Base64 conversion (avoids stack overflow on large arrays)
function toBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Safe Base64 -> Uint8Array conversion
function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// HTML escaping (prevents XSS) — uses DOM API to stay safe
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Validate URL scheme (prevents injection of malicious protocols like javascript:)
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Only allow http/https/data:image protocols
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '';
}

// Parse amount as plain string -> raw units (avoids parseFloat precision loss)
// Input: "1.5", 6 -> "1500000"
// Input: "0.000001", 6 -> "1"
// Uses BigInt math throughout, never floats
function parseFloatToRawUnits(amountStr, decimals) {
  if (!amountStr || typeof amountStr !== 'string') return '0';
  const str = amountStr.trim();
  if (!str || str === '.' || !/^\d+\.?\d*$/.test(str)) return '0';

  const dotIdx = str.indexOf('.');
  let intPart, decPart;
  if (dotIdx === -1) {
    intPart = str;
    decPart = '';
  } else {
    intPart = str.substring(0, dotIdx) || '0';
    decPart = str.substring(dotIdx + 1);
  }

  // Pad or truncate the fractional part
  if (decPart.length < decimals) {
    decPart = decPart.padEnd(decimals, '0');
  } else if (decPart.length > decimals) {
    decPart = decPart.substring(0, decimals);
  }

  try {
    const intBig = BigInt(intPart || '0');
    const decBig = BigInt(decPart || '0');
    const multiplier = BigInt(10) ** BigInt(decimals);
    return (intBig * multiplier + decBig).toString();
  } catch (e) {
    return '0';
  }
}

// PAXI -> upaxi convenience wrapper (6 decimals)
function paxiToUpaxi(amountStr) {
  return parseFloatToRawUnits(amountStr, 6);
}

// upaxi -> PAXI readable format (string math avoids precision loss)
function upaxiToPaxi(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return '0';
  const padded = rawStr.padStart(7, '0');
  const intPart = padded.slice(0, -6);
  const decPart = padded.slice(-6).replace(/0+$/, '');
  return decPart ? intPart + '.' + decPart : intPart;
}

// Copy to clipboard (mobile-compatible)
async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (e) { /* fallback */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

// Toast notification
function showToast(msg, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Status message display
function showStatus(containerId, msg, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  el.style.display = 'block';
}

// ============================================================
// Error code mapping (human-friendly on-chain error messages)
// ============================================================
const ERROR_CODE_MAP = {
  0: 'Success',
  1: 'Generic on-chain error (possibly empty address or encoding issue)',
  2: 'Serialization error',
  3: 'Invalid transaction bytes',
  4: 'Insufficient storage',
  5: 'Type decode failed',
  6: 'Out of bounds',
  7: 'Serialization error',
  8: 'Invalid request type',
  9: 'Invalid address',
  10: 'Message serialization conflict',
  11: 'Out-of-bounds access',
  12: 'Insufficient permission (conditions not met)',
  13: 'Internal logic error',
  14: 'Parse failed',
  15: 'Invalid coin prefix',
  16: 'Invalid hex string',
  17: 'Unknown request type',
  18: 'Gas estimation failed',
  19: 'Account sequence mismatch (you may have sent another tx; please retry)',
  20: 'Signature mismatch',
  21: 'Invalid public key',
  22: 'Insufficient gas',
  23: 'Memo too long',
  24: 'Invalid signature',
  25: 'Insufficient gas (tx required more gas than the limit; please raise the Gas Limit)',
  26: 'Invalid signer count',
  27: 'Address parse failed',
  28: 'WASM contract execution failed (contract logic returned an error)',
  29: 'Proposal does not exist',
  30: 'Invalid proposal status',
  31: 'Insufficient deposit',
  32: 'Invalid vote option',
  33: 'Authorization does not exist or has expired',
  111: 'Invalid Genesis file',
};

const ERROR_KEYWORD_MAP = [
  { pattern: /insufficient fund/i, msg: 'Insufficient account balance; make sure you have enough PAXI for transfer + gas' },
  { pattern: /insufficient fee/i, msg: 'Gas fee insufficient; please raise the Gas Price' },
  { pattern: /unauthorized|not authorized|permission/i, msg: 'Insufficient permission: you are not authorized to perform this action' },
  { pattern: /authz.*not found|grant.*not found|no.*authorization/i, msg: 'Authorization does not exist or has expired/been revoked; ask the seller to re-authorize' },
  { pattern: /account sequence mismatch|expected.*got/i, msg: 'Account sequence mismatch; you may have sent another tx, please retry shortly' },
  { pattern: /out of gas|gas.*exhausted/i, msg: 'Insufficient gas; tx required more gas than the set limit' },
  { pattern: /contract.*not found|no such contract/i, msg: 'Contract address does not exist or is not a valid contract' },
  { pattern: /nft.*not found|token.*not.*exist/i, msg: 'NFT does not exist or token_id is invalid' },
  { pattern: /not.*owner|unauthorized.*transfer/i, msg: 'You are not the owner of this NFT and cannot transfer it' },
  { pattern: /duplicate|already exists/i, msg: 'Duplicate operation: this resource already exists' },
  { pattern: /timeout|timed out/i, msg: 'Network timeout; please check your connection and retry' },
  { pattern: /rejected|denied|cancelled/i, msg: 'User rejected the transaction in the wallet' },
];

function mapError(code, rawLog) {
  const log = (rawLog && typeof rawLog === 'string') ? rawLog.replace(/\s+/g, ' ').trim() : '';
  // 1) keyword map FIRST — it holds the most actionable messages (sequence mismatch, insufficient
  //    funds, ...). The old order mapped by error code first and THREW THE RAW LOG AWAY, so a
  //    generic "code 1" hid the real reason.
  if (log) {
    for (const { pattern, msg } of ERROR_KEYWORD_MAP) {
      if (pattern.test(log)) {
        return `${msg} (code ${code}, original message: ${log.slice(0, 140)})`;
      }
    }
  }
  // 2) error code map — always append the raw log so the chain's own wording is never lost
  if (code !== undefined && code !== 0 && ERROR_CODE_MAP[code]) {
    const base = `${ERROR_CODE_MAP[code]} (code ${code})`;
    return log ? `${base} | original message: ${log.slice(0, 180)}` : base;
  }
  // 3) raw message (truncated)
  return log ? log.slice(0, 200) : 'Unknown error';
}

// ============================================================
// LCD request helpers
// ============================================================
// Cached LCD request (for rarely-changing data, e.g. validator list)
// cacheKey: localStorage key name, cacheTtl: cache validity in milliseconds
async function fetchAPIWithCache(path, cacheKey, cacheTtl = 60000) {
  // Try reading the cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < cacheTtl) {
        return data;
      }
    }
  } catch (e) {}
  // Cache miss or expired, request from LCD
  const data = await fetchAPI(path);
  // Write to cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {}
  return data;
}

// LCD 会限流：超限时返回的是 HTML 错误页（状态码还可能是 200），直接 res.json() 会抛，
// 一个限流响应就能把整个工具打挂。统一在这里做防御解析 + 退避重试，所有工具共用。
// opts: { retries: 重试次数（默认 3） }
async function fetchAPI(path, opts) {
  const retries = (opts && typeof opts.retries === 'number') ? opts.retries : 3;
  const url = `${getLCD()}${path}`;
  let lastErr = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 300 * attempt * attempt)); // 300ms / 1200ms
    let res;
    try { res = await fetch(url); }
    catch (e) { lastErr = e; continue; }                                   // 网络抖动 -> 重试
    if (!res.ok) {
      lastErr = new Error(`API request failed: HTTP ${res.status}`);
      if (res.status === 429 || res.status >= 500) continue;               // 限流 / 服务端错误 -> 重试
      throw lastErr;                                                      // 其它 4xx -> 直接报错
    }
    let text;
    try { text = await res.text(); }
    catch (e) { lastErr = e; continue; }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const trimmed = (text || '').trim();
    if (!ct.includes('json') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      lastErr = new Error('API returned a non-JSON response (the node may be rate limiting)');
      continue;                                                            // 限流 HTML -> 重试
    }
    try { return JSON.parse(text); }
    catch (e) { lastErr = e; continue; }
  }
  throw lastErr || new Error('API request failed');
}

// ============ validator list (shared by redelegate / stake-manage / validator-compare) ============
// 三个工具拉的是同一份数据（主网 138 个，2 页），实测每页约 1.6s。
// 统一走这里：内存 + localStorage 双层缓存 -> 第二个工具秒开；第一页先回调让用户立刻能选，
// 第二页在后台补齐。
const _VALIDATORS_CACHE_KEY = 'paxi_validators_cache';
const _VALIDATORS_TTL_MS = 30 * 60 * 1000;   // 30 分钟内直接用缓存
let _validatorsMem = null;      // { validators, ts }
let _validatorsInflight = null; // Promise<validators>

function _readValidatorsCache() {
  try {
    const raw = localStorage.getItem(_VALIDATORS_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    const list = (c && c.data && c.data.validators) || [];
    return list.length ? { validators: list, ts: c.ts || 0 } : null;
  } catch (_) { return null; }
}

function _writeValidatorsCache(list) {
  _validatorsMem = { validators: list, ts: Date.now() };
  try { localStorage.setItem(_VALIDATORS_CACHE_KEY, JSON.stringify({ data: { validators: list }, ts: Date.now() })); } catch (_) {}
}

async function _fetchValidatorPages(onPage) {
  const all = [];
  let nextKey = null;
  for (let page = 0; page < 6; page++) {
    const q = nextKey
      ? `/cosmos/staking/v1beta1/validators?pagination.limit=100&pagination.key=${encodeURIComponent(nextKey)}`
      : '/cosmos/staking/v1beta1/validators?pagination.limit=100';
    const data = await fetchAPI(q);
    const list = data.validators || [];
    all.push(...list);
    if (typeof onPage === 'function') { try { onPage(all.slice()); } catch (_) {} }
    nextKey = (data.pagination && data.pagination.next_key) ? data.pagination.next_key : null;
    if (!nextKey || list.length === 0) break;
  }
  return all;
}

function _loadValidatorsFresh(o) {
  return _fetchValidatorPages(o && o.onPage).then(list => { _writeValidatorsCache(list); return list; });
}

function _refreshValidators(o) {
  if (_validatorsInflight) return _validatorsInflight;
  const p = _loadValidatorsFresh(o).catch(() => null);
  _validatorsInflight = p;
  p.finally(() => { if (_validatorsInflight === p) _validatorsInflight = null; });
  return p;
}

// opts: { force: 跳过缓存强制刷新, onPage: 每页到达时的回调（先用第一页渲染） }
async function loadValidatorsCached(opts) {
  const o = opts || {};
  const now = Date.now();
  if (!o.force) {
    if (_validatorsMem && now - _validatorsMem.ts < _VALIDATORS_TTL_MS) return _validatorsMem.validators;
    const cached = _readValidatorsCache();
    if (cached && cached.validators.length) {
      _validatorsMem = { validators: cached.validators, ts: cached.ts };
      if (now - cached.ts < _VALIDATORS_TTL_MS) return cached.validators;  // 命中新鲜缓存：立即返回
      _refreshValidators(o);                                             // 缓存过期：先用旧的顶上，后台刷新
      return cached.validators;
    }
  }
  if (!_validatorsInflight) {
    const p = _loadValidatorsFresh(o);
    _validatorsInflight = p;
    p.finally(() => { if (_validatorsInflight === p) _validatorsInflight = null; });
  }
  return _validatorsInflight;
}

// ============================================================
// IPFS / Pinata upload helpers (integrated when minting NFTs)
// Users fill in their own Pinata JWT, stored in localStorage; hardcoding it
// in the front-end is risky for abuse, so it is not built-in
// ============================================================
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
const PINATA_PIN_API = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

function getPinataJwt() {
  return localStorage.getItem('paxi_pinata_jwt') || '';
}
function setPinataJwt(jwt) {
  const v = (jwt || '').trim();
  if (v) localStorage.setItem('paxi_pinata_jwt', v);
  else localStorage.removeItem('paxi_pinata_jwt');
}
function hasPinataJwt() {
  return !!getPinataJwt();
}

// Extract CID from ipfs://Qm... or https://gateway/ipfs/Qm...
function ipfsCidFromUri(uri) {
  if (!uri) return '';
  let s = String(uri).trim();
  if (s.startsWith('ipfs://')) return s.slice(7).replace(/\/.*$/, '');
  const m = s.match(/\/ipfs\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{44,})/);
  return m ? m[1] : '';
}

// Convert an ipfs:// URI or bare CID into an accessible https gateway URL; http(s)/data returned as-is
function ipfsToHttp(uri) {
  if (!uri) return '';
  const s = String(uri).trim();
  if (s.startsWith('ipfs://')) {
    const cid = s.slice(7).replace(/\/.*$/, '');
    return cid ? IPFS_GATEWAY + cid : '';
  }
  // Bare CID (Qm... or baf...)
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{44,})$/.test(s)) {
    return IPFS_GATEWAY + s;
  }
  // Already http(s)/data, return directly
  if (/^(https?:\/\/|data:)/i.test(s)) return s;
  return '';
}

// Paxi NFTs store the image / metadata in several different shapes:
//   1) direct image URI in token_uri  — https://i.ibb.co/xxx.png, https://.../a.jpg, data:image/png;base64,...
//   2) JSON metadata in token_uri    — data:application/json;base64,... or https://.../metadata.json
//   3) ipfs:// / ar:// metadata URI  — points at a JSON metadata document
// Only shape 1 may be used directly as an <img src>. Shapes 2/3 must be parsed as metadata first,
// otherwise the browser gets JSON where it expects an image and falls back to the 🎨 placeholder.
function isDirectImageUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  const s = uri.trim();
  if (/^data:image\//i.test(s)) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?[^#]*)?$/i.test(s);
}

// Parse a data: URI that carries JSON (base64 or percent-encoded) — decoded locally, no network
function parseDataUriJson(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const m = /^data:([^,]*),([\s\S]*)$/i.exec(uri.trim());
  if (!m) return null;
  const mime = m[1] || '';
  const payload = m[2] || '';
  try {
    if (/base64/i.test(mime)) {
      const bin = atob(payload);
      return JSON.parse(decodeURIComponent(escape(bin))); // UTF-8 safe
    }
    return JSON.parse(decodeURIComponent(payload));
  } catch (e) { return null; }
}

// Upload a file to Pinata (XHR to support upload progress), returns { cid, url, size }
function uploadFileToIpfs(file, onProgress) {
  return new Promise((resolve, reject) => {
    const jwt = getPinataJwt();
    if (!jwt) { reject(new Error('Pinata JWT not configured')); return; }
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', PINATA_PIN_API);
    xhr.setRequestHeader('Authorization', 'Bearer ' + jwt);
    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      };
    }
    xhr.timeout = 120000;
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.IpfsHash) {
          resolve({ cid: data.IpfsHash, url: IPFS_GATEWAY + data.IpfsHash, size: data.PinSize });
        } else {
          reject(new Error(data.error || data.message || ('HTTP ' + xhr.status)));
        }
      } catch (e) {
        reject(new Error('Failed to parse IPFS response: ' + (xhr.responseText || '').slice(0, 120)));
      }
    };
    xhr.onerror = () => reject(new Error('Network error, IPFS upload failed'));
    xhr.ontimeout = () => reject(new Error('IPFS upload timed out'));
    xhr.send(fd);
  });
}

// Upload JSON object to Pinata (as metadata.json), returns { cid, url }
async function uploadJsonToIpfs(jsonObj, filename) {
  const jwt = getPinataJwt();
  if (!jwt) throw new Error('Pinata JWT not configured');
  const blob = new Blob([JSON.stringify(jsonObj)], { type: 'application/json' });
  const fd = new FormData();
  fd.append('file', blob, filename || 'metadata.json');
  const res = await fetch(PINATA_PIN_API, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + jwt },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.IpfsHash) throw new Error(data.error || data.message || ('HTTP ' + res.status));
  return { cid: data.IpfsHash, url: IPFS_GATEWAY + data.IpfsHash };
}

// Build a metadata object conforming to the CW721 standard
function buildCw721Metadata(name, description, imageUri, attributes) {
  return {
    name: name || 'Untitled NFT',
    description: description || '',
    image: imageUri || '',
    external_url: '',
    attributes: Array.isArray(attributes) ? attributes : [],
  };
}

// Resolve token_uri to fetch the metadata JSON (supports ipfs/https/data, with timeout)
async function fetchTokenUriMetadata(tokenUri, timeoutMs) {
  const http = ipfsToHttp(tokenUri);
  if (!http) return null;
  // data: URI holding JSON metadata (base64 or percent-encoded) — decode locally, no network
  if (http.startsWith('data:')) return parseDataUriJson(http);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 5000);
  try {
    const res = await fetch(http, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

// Resolve any image URI into an address safe for <img src> (returns escaped; empty string if unusable)
function safeNftImgSrc(uri) {
  if (!uri) return '';
  const http = ipfsToHttp(uri);
  if (!http) return '';
  // Only allow http/https/data:image, and escape
  return sanitizeUrl(http);
}

// UTF-8-safe JSON -> base64 data URI (fallback when IPFS is unavailable)
function jsonToDataUri(jsonObj) {
  const bytes = new TextEncoder().encode(JSON.stringify(jsonObj));
  return 'data:application/json;base64,' + toBase64(bytes);
}

// ============================================================
// Transaction build & sign & broadcast (common functions)
// wallet: { address, public_key, algo } or { address, publicKey, connected }
// ============================================================

// On-chain simulation: send a "zero-signature" tx to the node so it tells us the real gas used
async function simulateGas(messages, memo, accountNumber, sequence, pubKey, address) {
  const chainId = getChainId();
  const denom = getDenom();

  // Build a dummy fee (static estimate as fallback; overwritten during simulation)
  let gasSum = 0;
  for (const msg of messages) {
    if (msg.typeUrl?.includes('MsgSend')) gasSum += 90000;
    else if (msg.typeUrl?.includes('MsgExecuteContract')) gasSum += 250000;
    else if (msg.typeUrl?.includes('MsgInstantiateContract')) gasSum += 500000;
    else if (msg.typeUrl?.includes('MsgSubmitProposal')) gasSum += 562000;
    else if (msg.typeUrl?.includes('MsgDeposit')) gasSum += 200000;
    else if (msg.typeUrl?.includes('MsgVote')) gasSum += 100000;
    else if (msg.typeUrl?.includes('MsgBeginRedelegate')) gasSum += 200000;
    else gasSum += 200000;
  }
  const dummyGas = gasSum + 100000;
  const dummyFeeAmount = PaxiCosmJS.coins(Math.floor(dummyGas * 0.25).toString(), denom)[0];

  const pubkeyBytes = typeof pubKey === 'string' ? fromBase64(pubKey) : new Uint8Array(pubKey);
  const pubkeyAny = {
    typeUrl: '/cosmos.crypto.secp256k1.PubKey',
    value: PaxiCosmJS.PubKey.encode({ key: pubkeyBytes }).finish(),
  };

  const txBody = PaxiCosmJS.TxBody.fromPartial({ messages, memo: memo || '' });
  const authInfo = PaxiCosmJS.AuthInfo.fromPartial({
    signerInfos: [{
      publicKey: pubkeyAny,
      modeInfo: { single: { mode: 1 } },
      sequence: BigInt(sequence),
    }],
    fee: { amount: [dummyFeeAmount], gasLimit: BigInt(dummyGas) },
  });

  // Build an empty signature (32 zero bytes)
  const emptySig = new Uint8Array(64);
  const txRaw = PaxiCosmJS.TxRaw.fromPartial({
    bodyBytes: PaxiCosmJS.TxBody.encode(txBody).finish(),
    authInfoBytes: PaxiCosmJS.AuthInfo.encode(authInfo).finish(),
    signatures: [emptySig],
  });

  const base64Tx = toBase64(PaxiCosmJS.TxRaw.encode(txRaw).finish());

  const res = await fetch(`${getLCD()}/cosmos/tx/v1beta1/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: base64Tx }),
  });

  if (!res.ok) {
    // Some nodes don't support /simulate; throw so the caller can fall back
    throw new Error(`simulate HTTP ${res.status}`);
  }
  const data = await res.json();
  // Response structure: { gas_info: { gas_used: "12345", gas_wanted: "67890" }, ... }
  //                   or { gasUsed: "..." }
  const gasUsed = data.gas_info?.gas_used || data.gasUsed || data.gas_info?.gas_wanted;
  if (gasUsed && Number(gasUsed) > 0) {
    return Number(gasUsed);
  }
  throw new Error('simulate returned no valid gas');
}

async function buildSignAndBroadcast(messages, memo, gasLimit, wallet) {
  if (!wallet || !wallet.address) {
    throw new Error('Wallet not connected');
  }

  // Support both wallet formats
  const pubKey = wallet.public_key || wallet.publicKey;
  if (!pubKey) throw new Error('Wallet public key missing');

  // Fetch account info
  const accountRes = await fetch(`${getLCD()}/cosmos/auth/v1beta1/accounts/${wallet.address}`);
  if (!accountRes.ok) throw new Error(`Failed to fetch account info: HTTP ${accountRes.status}`);
  const accountData = await accountRes.json();
  const account = accountData.account?.base_account || accountData.account;
  const accountNumber = Number(account.account_number);
  const sequence = Number(account.sequence);

  const chainId = getChainId();
  const denom = getDenom();

  // 1) Static estimate (fallback)
  let totalGas = gasLimit;
  if (!totalGas) {
    let gasSum = 0;
    for (const msg of messages) {
      if (msg.typeUrl?.includes('MsgSend')) gasSum += 90000;
      else if (msg.typeUrl?.includes('MsgExecuteContract')) gasSum += 250000;
      else if (msg.typeUrl?.includes('MsgInstantiateContract')) gasSum += 500000;
      else if (msg.typeUrl?.includes('MsgGrant')) gasSum += 120000;
      else if (msg.typeUrl?.includes('MsgExec')) gasSum += 300000;
      else if (msg.typeUrl?.includes('MsgRevoke')) gasSum += 100000;
      else if (msg.typeUrl?.includes('MsgSubmitProposal')) gasSum += 562000;
      else if (msg.typeUrl?.includes('MsgDeposit')) gasSum += 200000;
      else if (msg.typeUrl?.includes('MsgVote')) gasSum += 100000;
      else if (msg.typeUrl?.includes('MsgBeginRedelegate')) gasSum += 200000;
      else if (msg.typeUrl?.includes('MsgCancelProposal')) gasSum += 150000;
      else gasSum += 200000;
    }
    totalGas = gasSum + 100000;
  }

  // 2) On-chain simulation (simulate) — override the estimate with the precise gas returned by the node
  //    to avoid out of gas caused by inaccurate static estimates
  if (!gasLimit) {
    try {
      const simulatedGas = await simulateGas(messages, memo, accountNumber, sequence, pubKey, wallet.address);
      if (simulatedGas > 0) {
        // Add 15% buffer to the simulated value to absorb on-chain fluctuations
        totalGas = Math.floor(simulatedGas * 1.15);
      }
    } catch (e) {
      // Fall back to static estimate (the value above) when simulation fails
      console.warn('[Tx] simulate failed, using static estimate:', e.message);
    }
  }

  // TxBody
  const txBody = PaxiCosmJS.TxBody.fromPartial({ messages, memo });

  // Fee - parse the per-gas upaxi price from SHARED_CONFIG.gasPrice (e.g. '0.25upaxi' → 0.25)
  const gasPriceMatch = /^([\d.]+)\s*upaxi$/i.exec(SHARED_CONFIG.gasPrice || '0.25upaxi');
  const gasPricePerUnit = gasPriceMatch ? parseFloat(gasPriceMatch[1]) : 0.25;
  const fee = {
    amount: [PaxiCosmJS.coins(Math.floor(totalGas * gasPricePerUnit).toString(), denom)[0]],
    gasLimit: BigInt(totalGas),
  };

  // PubKey
  const pubkeyBytes = typeof pubKey === 'string' ? fromBase64(pubKey) : new Uint8Array(pubKey);
  const pubkeyAny = {
    typeUrl: '/cosmos.crypto.secp256k1.PubKey',
    value: PaxiCosmJS.PubKey.encode({ key: pubkeyBytes }).finish(),
  };

  // AuthInfo
  const authInfo = PaxiCosmJS.AuthInfo.fromPartial({
    signerInfos: [{
      publicKey: pubkeyAny,
      modeInfo: { single: { mode: 1 } },
      sequence: BigInt(sequence),
    }],
    fee,
  });

  // SignDoc
  const signDoc = PaxiCosmJS.SignDoc.fromPartial({
    bodyBytes: PaxiCosmJS.TxBody.encode(txBody).finish(),
    authInfoBytes: PaxiCosmJS.AuthInfo.encode(authInfo).finish(),
    chainId,
    accountNumber: BigInt(accountNumber),
  });

  // Sign — chunked Base64 encoding to avoid stack overflow on large txs
  const txObj = {
    bodyBytes: toBase64(signDoc.bodyBytes),
    authInfoBytes: toBase64(signDoc.authInfoBytes),
    chainId,
    accountNumber: signDoc.accountNumber.toString(),
  };

  const result = await window.paxihub.paxi.signAndSendTransaction(txObj);
  if (!result || !result.success) {
    throw new Error(result?.message || 'Wallet signing failed or was rejected');
  }

  const sigBytes = fromBase64(result.success);
  const txRaw = PaxiCosmJS.TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [sigBytes],
  });
  const txBytes = PaxiCosmJS.TxRaw.encode(txRaw).finish();
  const base64Tx = toBase64(txBytes);

  // Broadcast
  const broadcastRes = await fetch(`${getLCD()}/cosmos/tx/v1beta1/txs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: base64Tx, mode: 'BROADCAST_MODE_SYNC' }),
  }).then(r => r.json());

  return broadcastRes;
}

// Check transaction result
function checkTxResult(broadcastRes) {
  const tx = broadcastRes.tx_response || broadcastRes;
  return {
    ok: tx?.code === 0 && tx?.txhash,
    txhash: tx?.txhash || '',
    code: tx?.code,
    rawLog: tx?.raw_log || broadcastRes.message || 'Unknown error',
  };
}

// ============================================================
// Transaction polling confirmation (poll whether the tx was included on-chain after broadcast)
// Improvement: users can confirm whether the tx was truly packed into a block
// ============================================================
async function pollTxStatus(txhash, maxAttempts = 30, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const data = await fetchAPI(`/cosmos/tx/v1beta1/txs/${txhash}`);
      const tx = data.tx_response || data;
      if (tx && tx.height && parseInt(tx.height) > 0) {
        return {
          confirmed: true,
          success: tx.code === 0,
          height: tx.height,
          gasUsed: tx.gas_used,
          code: tx.code,
          rawLog: tx.raw_log || '',
        };
      }
    } catch (e) {
      // Tx may not be on-chain yet, keep waiting
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { confirmed: false };
}

// ============================================================
// localStorage cleanup (clear expired data)
// ============================================================
function cleanupLocalStorage() {
  const now = Date.now();
  const CLEAN_KEYS = [
    'paxi_nft_market_listings',
    'paxi_nft_market_imported',
    'paxi_nft_deployed',
  ];
  for (const key of CLEAN_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;
      // Keep records that are unexpired or have a contract address; remove data older than 30 days
      const cleaned = list.filter(item => {
        if (item.expiresAt && new Date(item.expiresAt) < new Date(now - 30 * 86400000)) {
          return false; // Expired for more than 30 days
        }
        if (item.timestamp && new Date(item.timestamp) < new Date(now - 30 * 86400000)) {
          // Deployment records older than 30 days are cleaned if they have no contract address
          if (!item.contractAddr) return false;
        }
        // Remove base64 image data from initMsg (reduce storage)
        if (item.initMsg?.collection_info?.image?.startsWith('data:image')) {
          item.initMsg.collection_info.image = '[large data cleaned]';
        }
        return true;
      });
      if (cleaned.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(cleaned));
        console.log(`[Cleanup] ${key}: cleaned ${list.length - cleaned.length} expired records`);
      }
    } catch (e) { /* ignore */ }
  }
}

// ============================================================
// Network selector UI (injected into the header)
// Supports multilingual display
// ============================================================
function renderNetworkSelector(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Read from the global language setting (if present)
  const hasLang = typeof currentLang !== 'undefined';
  const mainnetLabel = (hasLang && typeof t === 'function') ? t('common.mainnet') : 'Mainnet';
  const testnetLabel = (hasLang && typeof t === 'function') ? t('common.testnet') : 'Testnet';

  // fallback: read the name from NETWORKS directly (for backward compatibility)
  const finalMain = currentNetwork === 'mainnet' && !hasLang ? NETWORKS.mainnet.name : mainnetLabel;
  const finalTest = currentNetwork === 'testnet' && !hasLang ? NETWORKS.testnet.name : testnetLabel;

  el.innerHTML = `
    <select id="networkSelect" onchange="switchNetwork(this.value)" style="font-size:11px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
      <option value="mainnet" ${currentNetwork === 'mainnet' ? 'selected' : ''}>${mainnetLabel}</option>
      <option value="testnet" ${currentNetwork === 'testnet' ? 'selected' : ''}>${testnetLabel}</option>
    </select>
  `;
}

// Clean expired data on page load
if (document.readyState !== 'loading') {
  cleanupLocalStorage();
} else {
  document.addEventListener('DOMContentLoaded', cleanupLocalStorage);
}
