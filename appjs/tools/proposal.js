/**
 * Tool module: Governance Proposal
 * Supports three proposal types:
 *  - TextProposal
 *  - ParameterChangeProposal — supports multiple subspace/key/value entries
 *  - CommunityPoolSpendProposal — DAO funding request, pays out from the community pool to a recipient address
 * Service fee: SHARED_CONFIG.governance.submitFee (default 50 PAXI)
 */
if (!window.TOOL_REGISTRY) window.TOOL_REGISTRY = {};

const GOV_TYPE_URL = {
  text: '/cosmos.gov.v1beta1.TextProposal',
  param: '/cosmos.params.v1beta1.ParameterChangeProposal',
  pool: '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
};
// Submit community-pool spend via gov v1 (isomorphic to the on-chain proposal #13)
const GOV_V1_TYPE_URL = {
  poolMsg: '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend',
  submitV1: '/cosmos.gov.v1.MsgSubmitProposal',
};
// gov module account (must be the authority of MsgCommunityPoolSpend)
const GOV_MODULE_ACCOUNT = 'paxi10d07y265gmmuvt4z0w9aw880jnsr700je7h2vr';
const GOV_STATUS = {
  0: { label: 'Unknown', cls: 'warning' },
  1: { label: 'Deposit', cls: 'info' },
  2: { label: 'Voting', cls: 'primary' },
  3: { label: 'Passed', cls: 'success' },
  4: { label: 'Rejected', cls: 'danger' },
  5: { label: 'Failed (deposit refunded)', cls: 'warning' },
};
// Common reference parameters (displayed for reference only, not enforced)
const GOV_PARAM_PRESETS = [
  { s: 'staking',     k: 'UnbondingTime',     v: '"1814400000000000"' },
  { s: 'staking',     k: 'MaxValidators',     v: '100' },
  { s: 'staking',     k: 'MinDelegation',     v: '"1000000"' },
  { s: 'mint',        k: 'InflationRateChange', v: '"0.130000000000000000"' },
  { s: 'slashing',    k: 'MaxEvidenceAge',    v: '"1209600000000000"' },
  { s: 'gov',         k: 'DepositPeriod',     v: '"1209600000000000"' },
  { s: 'gov',         k: 'VotingPeriod',      v: '"1209600000000000"' },
];

function _t(k, fallback) { if (typeof t === 'function') { const v = t(k); return v && v !== k ? v : fallback; } return fallback; }

// ===== bech32 address validation (paxi1 prefix, account 43 chars / contract 63 chars, with checksum) =====
const _PROP_BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const _PROP_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function _isValidPaxiAddress(a) {
  if (typeof a !== 'string') return false;
  const s = a.trim();
  const m = /^paxi1([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})$/.exec(s);
  if (!m) return false;
  const hrp = [];
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) >> 5);
  hrp.push(0);
  for (const c of 'paxi') hrp.push(c.charCodeAt(0) & 31);
  const data = [];
  for (const c of m[1]) data.push(_PROP_BECH32.indexOf(c));
  let chk = 1;
  for (const v of hrp.concat(data)) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= _PROP_GEN[i];
  }
  return chk === 1;
}

// Build gov v1 MsgSubmitProposal{messages:[MsgCommunityPoolSpend]} (isomorphic to on-chain proposal #13)
// Returns an Any (can be placed in tx messages)
function _buildPoolSpendProposalAny({ title, summary, recipient, amountMicro, depositMicro, proposer, denom }) {
  if (typeof PaxiMsgCodec === 'undefined' || !PaxiMsgCodec.encodeMsgSubmitProposal) {
    throw new Error('Message codec not loaded (appjs/msg-codec.js)');
  }
  // The chain's CosmJS bundle exports neither MsgCommunityPoolSpend nor MsgSubmitProposal,
  // so both are encoded by hand (appjs/msg-codec.js — verified against the chain's decoder).
  const spendValue = PaxiMsgCodec.encodeMsgCommunityPoolSpend(
    GOV_MODULE_ACCOUNT,
    recipient,
    [{ denom, amount: amountMicro }]
  );
  const submitValue = PaxiMsgCodec.encodeMsgSubmitProposal(
    [{ typeUrl: GOV_V1_TYPE_URL.poolMsg, value: spendValue }],
    [{ denom, amount: depositMicro }],
    proposer,
    '',
    title,
    (summary || '').length > 2000 ? summary.slice(0, 2000) : (summary || ''),
    false
  );
  return PaxiCosmJS.Any.fromPartial({
    typeUrl: GOV_V1_TYPE_URL.submitV1,
    value: submitValue,
  });
}

function govConfig() {
  return (typeof SHARED_CONFIG !== 'undefined' && SHARED_CONFIG.governance) || { submitFee: 50, defaultDeposit: 100 };
}

// ===== DAO proposal whitelist =====
// Only whitelisted wallet addresses can see/use the "DAO funding request (community pool spend)" feature after connecting
function daoWhitelist() {
  const cfg = govConfig();
  return Array.isArray(cfg.daoProposerWhitelist) ? cfg.daoProposerWhitelist : [];
}

// Whether the currently connected wallet is on the DAO whitelist
function isDaoProposerAllowed() {
  if (typeof state === 'undefined' || !state.connected || !state.wallet || !state.wallet.address) return false;
  return daoWhitelist().includes(state.wallet.address);
}

function renderProposal() {
  const cfg = govConfig();
  const typeSelect = `
    <select id="proposalType" onchange="toggleProposalType(this.value)">
      <option value="text">${_t('proposal.typeText','Text Proposal')}</option>
      <option value="param">${_t('proposal.typeParam','Parameter Change Proposal')}</option>
    </select>`;
  const paramSubL = _t('proposal.paramSubspace','Parameter subspace');
  const paramKL  = _t('proposal.paramKey','Parameter key');
  const paramVL  = _t('proposal.paramValue','Parameter value (JSON string)');
  const paramPH  = _t('proposal.paramValuePH','e.g. \\"0.050000000000000000\\"');
  const addBtn   = _t('proposal.addParam','➕ Add parameter');
  const delBtn   = _t('proposal.delParam','Delete');
  const hint     = _t('proposal.paramHint','Hint: subspace examples: gov / bank / staking / mint / slashing / distribution; value is a JSON string.');
  const refTitle = _t('proposal.paramRefTitle','📖 Common parameters & reference examples');
  const blockTitle = _t('proposal.paramBlockTitle','🔧 Parameter change config (ParameterChangeProposal)');

  // Build the preset reference list
  const refs = GOV_PARAM_PRESETS.map(p => `<div style="padding:4px 10px;border-left:2px solid var(--primary);background:var(--bg);border-radius:4px;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-mono, monospace);">${p.s} / ${p.k} = ${p.v}</div>`).join('');

  // One empty parameter row by default
  const defaultRows = 1;
  let rowsHtml = '';
  for (let i = 0; i < defaultRows; i++) rowsHtml += paramRowHtml(i, '', '', '', paramSubL, paramKL, paramVL, paramPH, delBtn);

  return `
    <div class="card">
      <div class="card-title">${_t('proposal.title','Governance Proposals')}</div>
      <div class="tool-desc" style="margin-bottom:14px;">${_t('proposal.desc','Submit Paxi governance proposals and take part in community decision-making. Proposals require a deposit plus the platform service fee.')}</div>

      <div class="card" style="background:var(--bg);padding:16px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;font-weight:700;font-size:15px;">
          📝 ${_t('proposal.submit','Submit Proposal')}
        </div>

        <div class="form-group">
          <label class="form-label">${_t('proposal.type','Proposal type')}</label>
          ${typeSelect}
        </div>

        <div class="form-group">
          <label class="form-label">${_t('proposal.titleLabel','Proposal title')}</label>
          <input type="text" id="proposalTitle" placeholder="${_t('proposal.titlePlaceholder','e.g. Suggest lowering the transaction service fee')}">
        </div>

        <div class="form-group">
          <label class="form-label">${_t('proposal.descLabel','Proposal description')}</label>
          <textarea id="proposalDesc" rows="4" placeholder="${_t('proposal.descPlaceholder','Describe your proposal in detail...')}"></textarea>
        </div>

        <!-- Parameter-change section (hidden by default) -->
        <div id="proposalParamBlock" style="display:none;margin-bottom:14px;">
          <div style="padding:12px 14px;background:rgba(88,101,242,.08);border:1px dashed var(--primary);border-radius:var(--radius);">
            <div style="font-weight:700;font-size:13px;margin-bottom:10px;">${blockTitle}</div>

            <div id="proposalParamRows">${rowsHtml}</div>

            <button type="button" class="btn btn-ghost" style="width:100%;margin:8px 0 10px;" onclick="addProposalParamRow()">${addBtn}</button>

            <div style="font-size:11px;color:var(--text-muted);padding:8px 10px;background:var(--bg-card);border-radius:6px;">${hint}</div>

            <div style="margin-top:12px;">
              <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-muted);">${refTitle}</div>
              ${refs}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">${_t('proposal.deposit','Deposit (PAXI)')}</label>
          <input type="number" id="proposalDeposit" value="${cfg.defaultDeposit}" min="0" step="0.01">
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;">
          <span style="font-size:13px;color:var(--text-muted);">${_t('proposal.fee','Service fee (PAXI)')}</span>
          <span style="color:var(--primary);font-weight:700;font-size:15px;">${cfg.submitFee} PAXI</span>
        </div>

        <div style="margin:0 0 12px;padding:8px 12px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;font-size:12px;color:#ffd700;line-height:1.6;">
          ${t('disclaimer.proposalSubmit')}
        </div>

        <button class="btn btn-primary" id="proposalSubmitBtn" style="width:100%;font-weight:700;font-size:14px;min-height:42px;" onclick="submitProposal()">
          🚀 ${_t('proposal.submitBtn','Submit Proposal')}
        </button>
        <div class="status-msg" id="proposalStatus" style="margin-top:10px;"></div>
      </div>
    </div>

    <div id="daoProposalSlot">${renderDaoProposalCard()}</div>

    <div class="card">
      <div class="card-title">${_t('proposal.list','Proposal List')}</div>
      <div style="margin:0 0 12px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.6;">
        ${t('disclaimer.proposalList')}
      </div>
      <div id="proposalList"><p style="color:var(--text-muted);text-align:center;padding:20px;">${_t('proposal.listLoading','Loading...')}</p></div>
    </div>
  `;
}

// ===== DAO funding request card (visible to whitelisted wallets only) =====
function renderDaoProposalCard() {
  // Wallet not connected: hide this feature
  if (typeof state === 'undefined' || !state.connected || !state.wallet || !state.wallet.address) return '';
  // Connected but not whitelisted: hide this feature
  if (!isDaoProposerAllowed()) return '';

  const cfg = govConfig();
  return `
    <div class="card" id="daoProposalCard">
      <div class="card-title">${_t('proposal.daoTitle','🏦 DAO Funding Request')}</div>
      <div class="tool-desc" style="margin-bottom:12px;">${_t('proposal.daoDesc','Request funding from the community pool (CommunityPoolSpend). Once the proposal passes, the pool pays out to the specified recipient address.')}</div>
      <div class="info-box" style="margin-bottom:12px;">${_t('proposal.daoInfo','💡 The title and summary are shown to all token holders for voting. State the purpose, budget breakdown, milestones, and delivery timeline; use your project operations treasury as the recipient address.')}</div>

      <div class="form-group">
        <label class="form-label">${_t('proposal.daoLabelTitle','Proposal title')}</label>
        <input type="text" id="daoPropTitle" placeholder="${_t('proposal.daoTitlePlaceholder','e.g. Paxi Lens launch & 6-month operations funding (360,000 PAXI)')}">
      </div>

      <div class="form-group">
        <label class="form-label">${_t('proposal.daoLabelSummary','Summary')}</label>
        <textarea id="daoPropSummary" rows="3" placeholder="${_t('proposal.daoSummaryPlaceholder','One sentence summarizing the request and amount...')}"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">${_t('proposal.daoLabelDesc','Description')}</label>
        <textarea id="daoPropDesc" rows="5" placeholder="${_t('proposal.daoDescPlaceholder','Explain the purpose, budget breakdown, milestones, and delivery timeline...')}"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">${_t('proposal.poolRecipient','Recipient address')}</label>
        <input type="text" id="daoPropRecipient" placeholder="paxi1...">
      </div>

      <div class="form-group" style="margin-bottom:8px;">
        <label class="form-label">${_t('proposal.poolAmount','Grant amount (PAXI)')}</label>
        <input type="number" id="daoPropAmount" min="0" step="0.01" placeholder="300000">
      </div>

      <div style="font-size:11px;color:var(--text-muted);padding:8px 10px;background:var(--bg-card);border-radius:6px;margin-bottom:12px;" id="daoPropBalance">
        ${_t('proposal.poolBalanceLoading','Querying the on-chain community pool balance...')}
      </div>

      <div class="form-group">
        <label class="form-label">${_t('proposal.deposit','Deposit (PAXI)')}</label>
        <input type="number" id="daoPropDeposit" value="${cfg.defaultDeposit}" min="0" step="0.01">
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;">
        <span style="font-size:13px;color:var(--text-muted);">${_t('proposal.fee','Service fee (PAXI)')}</span>
        <span style="color:var(--primary);font-weight:700;font-size:15px;">${cfg.submitFee} PAXI</span>
      </div>

      <div style="margin:0 0 12px;padding:8px 12px;background:rgba(255,255,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;font-size:12px;color:#ffd700;line-height:1.6;">
        ${t('disclaimer.proposalSubmit')}
      </div>

      <button class="btn btn-chain" id="daoPropSubmitBtn" style="width:100%;font-weight:700;font-size:14px;min-height:42px;">
        🏦 ${_t('proposal.daoSubmitBtn','Submit DAO Funding Request')}
      </button>
      <div class="status-msg" id="daoPropStatus" style="margin-top:10px;"></div>
    </div>
  `;
}

function paramRowHtml(idx, sub, key, val, subL, keyL, valL, ph, delBtn) {
  return `
    <div class="param-row" data-idx="${idx}" style="margin-bottom:10px;padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <div>
          <label style="font-size:11px;color:var(--text-muted);font-weight:600;">${subL}</label>
          <input type="text" class="param-sub" value="${escapeAttr(sub)}" placeholder="staking">
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);font-weight:600;">${keyL}</label>
          <input type="text" class="param-key" value="${escapeAttr(key)}" placeholder="MinDelegation">
        </div>
      </div>
      <div>
        <label style="font-size:11px;color:var(--text-muted);font-weight:600;">${valL}</label>
        <input type="text" class="param-val" value="${escapeAttr(val)}" placeholder="${ph}">
      </div>
      <div style="text-align:right;margin-top:6px;">
        <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:11px;color:var(--danger);" onclick="removeProposalParamRow(this)">✕ ${delBtn}</button>
      </div>
    </div>
  `;
}
function escapeAttr(s) { if (s == null) return ''; return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toggleProposalType(val) {
  const box = document.getElementById('proposalParamBlock');
  if (box) box.style.display = (val === 'param') ? 'block' : 'none';
}

// Query the on-chain community pool balance (read-only, no fee)
// ===== DecCoin conversion =====
// community_pool returns DecCoin: amount is an 18-decimal string (unit = upaxi)
// e.g. "5138152097007.919489561159935055" -> 5138152097007 upaxi = 5138152.097007 PAXI
// Note: cannot use upaxiToPaxi directly (it only accepts pure integer strings and would mis-align on the decimal point)
function _decCoinToPaxi(amountStr) {
  if (amountStr == null) return '0';
  const s = String(amountStr).trim();
  const dot = s.indexOf('.');
  const intPart = dot >= 0 ? s.slice(0, dot) : s;
  if (!/^\d+$/.test(intPart)) return '0';
  return typeof upaxiToPaxi === 'function' ? upaxiToPaxi(intPart) : (parseInt(intPart, 10) / 1e6).toFixed(6);
}

async function loadCommunityPoolBalance(elId) {
  const el = document.getElementById(elId || 'proposalPoolBalance');
  if (!el) return;
  try {
    const data = await fetchAPI('/cosmos/distribution/v1beta1/community_pool');
    const pool = (data.pool || []).find(c => c.denom === (CONFIG.denom || 'upaxi')) || (data.pool || [])[0];
    if (!pool) {
      el.innerHTML = _t('proposal.poolBalanceEmpty','Community pool is currently empty');
      return;
    }
    const paxi = _decCoinToPaxi(pool.amount);
    el.innerHTML = _t('proposal.poolBalance','💰 On-chain community pool balance: ') +
      `<strong style="color:#0ea5e9;">${paxi} PAXI</strong>`;
  } catch (e) {
    el.innerHTML = _t('proposal.poolBalanceFail','Failed to query the community pool balance') + ': ' + escapeHtmlSafe(e.message || String(e));
  }
}

function addProposalParamRow() {
  const rowsBox = document.getElementById('proposalParamRows');
  if (!rowsBox) return;
  const subL = _t('proposal.paramSubspace','Parameter subspace');
  const keyL = _t('proposal.paramKey','Parameter key');
  const valL = _t('proposal.paramValue','Parameter value (JSON string)');
  const ph   = _t('proposal.paramValuePH','e.g. \\"0.050000000000000000\\"');
  const del  = _t('proposal.delParam','Delete');
  const idx = rowsBox.querySelectorAll('.param-row').length;
  const el = document.createElement('div');
  el.innerHTML = paramRowHtml(idx, '', '', '', subL, keyL, valL, ph, del);
  rowsBox.appendChild(el.firstElementChild);
}

function removeProposalParamRow(btn) {
  const rowsBox = document.getElementById('proposalParamRows');
  if (!rowsBox) return;
  const row = btn && btn.closest ? btn.closest('.param-row') : null;
  if (!row) return;
  if (rowsBox.querySelectorAll('.param-row').length <= 1) {
    // Keep at least one row; clear its value
    row.querySelectorAll('input').forEach(i => i.value = '');
    return;
  }
  row.remove();
}

// ===== DAO funding request (community pool spend) =====
// Separate from regular governance proposals: visible/usable by whitelisted wallets only

// Bind DAO card internal events
function bindDaoProposalEvents() {
  const btn = document.getElementById('daoPropSubmitBtn');
  if (btn && !btn._daoBound) {
    btn._daoBound = true;
    btn.addEventListener('click', submitDaoProposal);
  }
  const balEl = document.getElementById('daoPropBalance');
  if (balEl && !balEl._balanceLoaded) {
    balEl._balanceLoaded = true;
    loadCommunityPoolBalance('daoPropBalance');
  }
}

// Refresh DAO card visibility after wallet connect/disconnect (returns true if the DOM changed)
function refreshDaoProposalSlot() {
  const slot = document.getElementById('daoProposalSlot');
  if (!slot) return false;
  const allowed = isDaoProposerAllowed();
  const has = !!slot.querySelector('#daoProposalCard');
  if (allowed === has) return false;
  slot.innerHTML = renderDaoProposalCard();
  if (allowed) bindDaoProposalEvents();
  return true;
}

// Submit DAO funding request (community pool spend)
async function submitDaoProposal() {
  // Second whitelist check (front-end visibility is only the first gate; this is the hard check before submit)
  if (!isDaoProposerAllowed()) {
    showStatus('daoPropStatus', _t('proposal.daoNotAllowed','The connected wallet is not authorized for DAO funding requests'), 'error');
    return;
  }
  if (typeof state === 'undefined' || !state.connected || !state.wallet || !state.wallet.address) {
    showStatus('daoPropStatus', _t('proposal.connectFirst','Please connect your wallet first'), 'warning');
    return;
  }

  const titleEl = document.getElementById('daoPropTitle');
  const sumEl   = document.getElementById('daoPropSummary');
  const descEl  = document.getElementById('daoPropDesc');
  const rcvEl   = document.getElementById('daoPropRecipient');
  const amtEl   = document.getElementById('daoPropAmount');
  const depEl   = document.getElementById('daoPropDeposit');
  const btn     = document.getElementById('daoPropSubmitBtn');
  if (!titleEl || !sumEl || !descEl || !rcvEl || !amtEl || !depEl) return;

  const title = titleEl.value.trim();
  const summary = sumEl.value.trim();
  const desc = descEl.value.trim();
  const recipient = rcvEl.value.trim();
  const amount = parseFloat(amtEl.value) || 0;
  const depositNum = parseFloat(depEl.value) || 0;
  const cfg = govConfig();
  const feeNum = Number(cfg.submitFee) || 0;

  if (!title) {
    showStatus('daoPropStatus', _t('proposal.daoNoTitle','Please enter the proposal title'), 'warning');
    return;
  }
  if (!summary) {
    showStatus('daoPropStatus', _t('proposal.daoNoSummary','Please enter the summary'), 'warning');
    return;
  }
  if (!desc) {
    showStatus('daoPropStatus', _t('proposal.daoNoDesc','Please enter the description'), 'warning');
    return;
  }
  if (!recipient) {
    showStatus('daoPropStatus', _t('proposal.poolNoRecipient','Please enter the recipient address'), 'warning');
    return;
  }
  if (!_isValidPaxiAddress(recipient)) {
    showStatus('daoPropStatus', _t('proposal.poolBadRecipient','Invalid recipient address format (paxi1...)'), 'error');
    return;
  }
  if (!(amount > 0)) {
    showStatus('daoPropStatus', _t('proposal.poolBadAmount','Grant amount must be greater than 0'), 'warning');
    return;
  }
  if (depositNum <= 0) {
    showStatus('daoPropStatus', _t('proposal.invalidDeposit','Deposit must be greater than 0'), 'warning');
    return;
  }
  // Amount must not exceed the on-chain community pool balance
  try {
    const data = await fetchAPI('/cosmos/distribution/v1beta1/community_pool');
    const denom = CONFIG.denom || 'upaxi';
    const pool = (data.pool || []).find(c => c.denom === denom) || (data.pool || [])[0];
    if (pool) {
      const poolPaxi = _decCoinToPaxi(pool.amount);
      if (amount > parseFloat(poolPaxi)) {
        showStatus('daoPropStatus',
          _t('proposal.poolExceed','Grant amount exceeds the on-chain community pool balance') + ` (${poolPaxi} PAXI)`, 'error');
        return;
      }
    }
  } catch (e) { /* a balance-check failure does not block submission; the chain will decide */ }

  // Explicitly confirm the amount and recipient
  const confirmMsg = _t('proposal.confirmSubmitPool','Confirm submitting the community pool spend proposal (DAO funding request)?\n\nGrant amount: {amount} PAXI\nRecipient: {rcv}\n\nOnce passed, the pool will send {amount} PAXI to this address.\nService fee {fee} PAXI + deposit {deposit} PAXI.')
    .replace('{amount}', amount).replace('{rcv}', recipient)
    .replace('{fee}', feeNum).replace('{deposit}', depositNum);
  if (!confirm(confirmMsg)) return;

  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${_t('proposal.submitting','Submitting...')}`;
  showStatus('daoPropStatus', _t('common.loading','Loading...'), 'info');

  try {
    const denom = CONFIG.denom;
    const proposer = state.wallet.address;
    const amountMicro = paxiToUpaxi(amount.toFixed(6));
    const depositMicro = paxiToUpaxi(depositNum.toFixed(6));

    const messages = [
      _buildPoolSpendProposalAny({
        title, summary, recipient, amountMicro, depositMicro, proposer, denom,
      }),
    ];

    // Platform service fee (single recipient)
    if (feeNum > 0) {
      const feeMicro = paxiToUpaxi(feeNum.toFixed(6));
      const feeCollector = (typeof SHARED_CONFIG !== 'undefined' && SHARED_CONFIG.feeCollector) || CONFIG.feeCollector;
      const feeMsg = PaxiCosmJS.MsgSend.fromPartial({
        fromAddress: proposer,
        toAddress: feeCollector,
        amount: [PaxiCosmJS.coins(feeMicro, denom)[0]],
      });
      messages.push(PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: PaxiCosmJS.MsgSend.encode(feeMsg).finish(),
      }));
    }

    const res = await buildSignAndBroadcast(messages, `[DAO Funding] ${title.substring(0, 40)}`, null, state.wallet);

    const txResp = res?.tx_response || res;
    const txHash = txResp?.txhash;
    const txCode = txResp?.code;
    const txRawLog = txResp?.raw_log || res?.message || '';
    if (txCode !== undefined && txCode !== 0) {
      throw new Error(`Tx failed (code=${txCode}): ${txRawLog}`);
    }

    showStatus('daoPropStatus', `📡 Broadcast, awaiting confirmation (tx: ${txHash ? txHash.slice(0,12)+'...' : '-'})`, 'info');

    let proposalId = null;
    let txConfirmed = false;
    let txErrorMessage = '';
    if (typeof pollTxStatus === 'function' && txHash) {
      try {
        const info = await pollTxStatus(txHash, 25);
        if (info) {
          if (info.confirmed && info.success) {
            txConfirmed = true;
            if (info.events) {
              for (const ev of info.events) {
                if (ev.type === 'submit_proposal' && ev.attributes) {
                  for (const attr of ev.attributes) {
                    const k = attr.key ? (typeof atob === 'function' ? atob(attr.key) : attr.key) : '';
                    const v = attr.value ? (typeof atob === 'function' ? atob(attr.value) : attr.value) : '';
                    if (k === 'proposal_id') { proposalId = v; break; }
                  }
                }
                if (proposalId) break;
              }
            }
          } else if (info.confirmed && !info.success) {
            txErrorMessage = info.rawLog || `code=${info.code}`;
          } else {
            txErrorMessage = 'Timed out without confirmation (possibly out of gas or network congestion)';
          }
        } else {
          txErrorMessage = 'Timed out without confirmation';
        }
      } catch (e) {
        txErrorMessage = e.message || String(e);
      }
    }

    if (!txConfirmed) {
      const failMsg = _t('proposal.fail','❌ Proposal submission failed: ') + (txErrorMessage || 'tx not confirmed on chain');
      showStatus('daoPropStatus', failMsg, 'error');
      showToast(failMsg, 'error');
      return;
    }

    const okText = _t('proposal.daoSuccess','✅ DAO funding request submitted! Proposal ID: ') + (proposalId || '(on chain — see the list below)');
    showStatus('daoPropStatus', okText, 'success');
    showToast(okText, 'success');
    setTimeout(loadProposalList, 2500);
  } catch (e) {
    console.error(e);
    let msg = _t('proposal.fail','❌ Proposal submission failed: ') + (e.message || String(e));
    if (typeof mapError === 'function') msg = _t('proposal.fail','❌ Proposal submission failed: ') + mapError(e);
    showStatus('daoPropStatus', msg, 'error');
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

function bindProposalEvents() {
  // Default type is text, so the param section is hidden
  const sel = document.getElementById('proposalType');
  if (sel) toggleProposalType(sel.value);
  // DAO card: visibility tied to wallet state + bind internal events
  refreshDaoProposalSlot();
  bindDaoProposalEvents();
  loadProposalList();
}

// Triggered by notifyCurrentToolWalletChange() on wallet connect/disconnect
// Only refresh DAO card visibility; do not reload the proposal list (avoids needless on-chain requests)
function onProposalWalletChange() {
  refreshDaoProposalSlot();
  bindDaoProposalEvents();
}

function collectParamChanges() {
  const rows = document.querySelectorAll('#proposalParamRows .param-row');
  const out = [];
  rows.forEach(row => {
    const sub = (row.querySelector('.param-sub') || {}).value || '';
    const key = (row.querySelector('.param-key') || {}).value || '';
    const val = (row.querySelector('.param-val') || {}).value || '';
    out.push({ sub: sub.trim(), key: key.trim(), val: val.trim() });
  });
  return out;
}

async function submitProposal() {
  if (typeof state !== 'undefined' && !state.connected) {
    showStatus('proposalStatus', _t('proposal.connectFirst','Please connect your wallet first'), 'warning');
    return;
  }
  const titleEl = document.getElementById('proposalTitle');
  const descEl = document.getElementById('proposalDesc');
  const depositEl = document.getElementById('proposalDeposit');
  const typeEl = document.getElementById('proposalType');
  const btn = document.getElementById('proposalSubmitBtn');
  if (!titleEl || !descEl || !depositEl || !typeEl) return;

  const type = typeEl.value === 'param' ? 'param' : 'text';
  const title = titleEl.value.trim();
  const desc = descEl.value.trim();
  const depositNum = parseFloat(depositEl.value) || 0;
  const cfg = govConfig();
  const feeNum = Number(cfg.submitFee) || 0;

  if (!title || !desc) {
    showStatus('proposalStatus', _t('proposal.emptyFields','Please enter the proposal title and description'), 'warning');
    return;
  }
  if (depositNum <= 0) {
    showStatus('proposalStatus', _t('proposal.invalidDeposit','Deposit must be greater than 0'), 'warning');
    return;
  }
  // Parameter validation
  let changes = [];
  if (type === 'param') {
    const rows = collectParamChanges();
    if (!rows.length) {
      showStatus('proposalStatus', _t('proposal.invalidParamRef','A parameter change proposal needs at least one parameter'), 'warning');
      return;
    }
    for (const r of rows) {
      if (!r.sub || !r.key || r.val === '') {
        showStatus('proposalStatus', _t('proposal.invalidParam','Please fill in Subspace / Key / Value for every parameter'), 'warning');
        return;
      }
    }
    changes = rows.map(r => ({ subspace: r.sub, key: r.key, value: r.val }));
  }

  const confirmMsg = _t('proposal.confirmSubmit','Pay {fee} PAXI service fee + {deposit} PAXI deposit to submit this proposal? The deposit is refunded if the proposal passes.')
    .replace('{fee}', feeNum).replace('{deposit}', depositNum);
  if (!confirm(confirmMsg)) return;

  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${_t('proposal.submitting','Submitting...')}`;
  showStatus('proposalStatus', _t('common.loading','Loading...'), 'info');

  try {
    const denom = CONFIG.denom;
    const proposer = state.wallet.address;

    // This chain's gov module only supports gov v1: the legacy content types
    // (TextProposal / ParameterChangeProposal) are NOT registered on chain, and the CosmJS bundle
    // does not export the corresponding classes either. A text proposal is therefore submitted as a
    // gov v1 MsgSubmitProposal with no messages and the body in metadata/summary — the chain
    // requires "metadata or messages" to be non-empty.
    if (type === 'param') {
      showStatus('proposalStatus',
        _t('proposal.paramUnsupported',
          'This chain does not register the legacy ParameterChangeProposal type. Only text proposals and community-pool-spend proposals can be submitted here.'),
        'error');
      return;
    }
    if (typeof PaxiMsgCodec === 'undefined' || !PaxiMsgCodec.encodeMsgSubmitProposal) {
      showStatus('proposalStatus', 'Message codec not loaded (appjs/msg-codec.js)', 'error');
      return;
    }

    // MsgSubmitProposal (gov v1)
    const depositMicro = paxiToUpaxi(depositNum.toFixed(6));
    const depositCoins = [{ denom, amount: depositMicro }];
    const submitValueBytes = PaxiMsgCodec.encodeMsgSubmitProposal(
      [],                                   // no messages -> body goes into metadata/summary
      depositCoins,
      proposer,
      desc.slice(0, 255),                  // metadata: max 255 chars
      title,
      desc.slice(0, 65535),                // summary: full body
      false
    );

    const messages = [
      PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
        value: submitValueBytes,
      }),
    ];

    // Platform service fee
    if (feeNum > 0) {
      const feeMicro = paxiToUpaxi(feeNum.toFixed(6));
      const feeCollector = (typeof SHARED_CONFIG !== 'undefined' && SHARED_CONFIG.feeCollector) || CONFIG.feeCollector;
      const feeMsg = PaxiCosmJS.MsgSend.fromPartial({
        fromAddress: proposer,
        toAddress: feeCollector,
        amount: [PaxiCosmJS.coins(feeMicro, denom)[0]],
      });
      messages.push(PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: PaxiCosmJS.MsgSend.encode(feeMsg).finish(),
      }));
    }

    const typeTag = type === 'text' ? 'Text' : 'ParamChange';
    const summary = `[${typeTag} Proposal] ${title.substring(0, 40)}`;
    const res = await buildSignAndBroadcast(messages, summary, null, state.wallet);

    // Check the broadcast result — shape is { tx_response: { txhash, code, raw_log } } or { txhash, code, raw_log }
    const txResp = res?.tx_response || res;
    const txHash = txResp?.txhash;
    const txCode = txResp?.code;
    const txRawLog = txResp?.raw_log || res?.message || '';

    // A synchronous broadcast returning code≠0 means the tx was rejected outright (serialization/signature/gas issue)
    if (txCode !== undefined && txCode !== 0) {
      throw new Error(`Tx failed (code=${txCode}): ${txRawLog}`);
    }

    showStatus('proposalStatus', `📡 Broadcast, awaiting confirmation (tx: ${txHash ? txHash.slice(0,12)+'...' : '-'})`, 'info');

    // Poll to confirm the tx actually landed on chain
    let proposalId = null;
    let txConfirmed = false;
    let txErrorMessage = '';
    if (typeof pollTxStatus === 'function' && txHash) {
      try {
        const info = await pollTxStatus(txHash, 25);
        if (info) {
          if (info.confirmed && info.success) {
            txConfirmed = true;
            if (info.events) {
              for (const ev of info.events) {
                if (ev.type === 'submit_proposal' && ev.attributes) {
                  for (const attr of ev.attributes) {
                    const k = attr.key ? (typeof atob === 'function' ? atob(attr.key) : attr.key) : '';
                    const v = attr.value ? (typeof atob === 'function' ? atob(attr.value) : attr.value) : '';
                    if (k === 'proposal_id') { proposalId = v; break; }
                  }
                }
                if (proposalId) break;
              }
            }
          } else if (info.confirmed && !info.success) {
            // Tx landed on chain but failed execution (e.g. bad params, insufficient permissions)
            txErrorMessage = info.rawLog || `code=${info.code}`;
          } else {
            txErrorMessage = 'Timed out without confirmation (possibly out of gas or network congestion)';
          }
        } else {
          txErrorMessage = 'Timed out without confirmation';
        }
      } catch (e) {
        txErrorMessage = e.message || String(e);
      }
    }

    if (!txConfirmed) {
      const failMsg = _t('proposal.fail','❌ Proposal submission failed: ') + (txErrorMessage || 'tx not confirmed on chain');
      showStatus('proposalStatus', failMsg, 'error');
      showToast(failMsg, 'error');
      return;
    }

    const okText = _t('proposal.success','✅ Proposal submitted! Proposal ID: ') + (proposalId || '(on chain — see the list below)');
    showStatus('proposalStatus', okText, 'success');
    showToast(okText, 'success');
    setTimeout(loadProposalList, 2500);
  } catch (e) {
    console.error(e);
    let msg = _t('proposal.fail','❌ Proposal submission failed: ') + (e.message || String(e));
    if (typeof mapError === 'function') msg = _t('proposal.fail','❌ Proposal submission failed: ') + mapError(e);
    showStatus('proposalStatus', msg, 'error');
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

// ============ Proposal list ============

// Hand-encode MsgCancelProposal (not built into PaxiCosmJS)
// protobuf: message MsgCancelProposal { uint64 proposal_id = 1; string proposer = 2; }
function _encodeMsgCancelProposal(proposalId, proposer) {
  const bytes = [];
  // ---- Field 1: proposal_id (uint64, varint), tag = (1<<3)|0 = 0x08 ----
  bytes.push(0x08);
  let pidNum = Number(proposalId);
  if (!(pidNum >= 0)) pidNum = 0;
  if (pidNum === 0) {
    bytes.push(0);
  } else {
    // Use Number for varint to avoid BigInt bitwise-op compatibility issues in some older browsers
    // proposal_id never exceeds 2^53; Number is safe
    let v = pidNum >>> 0;
    let hi = Math.floor(pidNum / 0x100000000); // high bits
    while (v >= 0x80 || hi > 0) {
      bytes.push((v & 0x7f) | 0x80);
      v = ((v >>> 7) | (hi & 0x7f) << 25) >>> 0;
      hi >>>= 7;
    }
    bytes.push(v & 0x7f);
  }
  // ---- Field 2: proposer (string, length-delimited), tag = (2<<3)|2 = 0x12 ----
  const proposerBytes = new TextEncoder().encode(proposer);
  bytes.push(0x12);
  let len = proposerBytes.length >>> 0;
  while (len >= 0x80) {
    bytes.push((len & 0x7f) | 0x80);
    len >>>= 7;
  }
  bytes.push(len & 0x7f);
  for (let i = 0; i < proposerBytes.length; i++) bytes.push(proposerBytes[i]);
  return new Uint8Array(bytes);
}

// Global store of proposal status and proposer for fetchProposer
const _proposalStatusMap = {};
const _proposalProposerMap = {};

// Probe which MsgCancelProposal typeUrl the chain accepts
// Strategy: prefer v1beta1 (same as MsgSubmitProposal); fall back to v1
let _cachedCancelTypeUrl = null;
async function _probeCancelTypeUrl(proposer, msgBytes) {
  if (_cachedCancelTypeUrl) return _cachedCancelTypeUrl;
  const candidates = [
    '/cosmos.gov.v1beta1.MsgCancelProposal',
    '/cosmos.gov.v1.MsgCancelProposal',
  ];
  const lcd = typeof CONFIG !== 'undefined' ? CONFIG.lcd : getLCD();
  for (const typeUrl of candidates) {
    try {
      const msgAny = PaxiCosmJS.Any.fromPartial({ typeUrl, value: msgBytes });
      const txBody = PaxiCosmJS.TxBody.fromPartial({
        messages: [msgAny],
        memo: `Cancel Proposal probe`,
      });
      const bodyBytes = PaxiCosmJS.TxBody.encode(txBody).finish();
      // Build an empty signer (simulate needs no real signature; the gas estimate is returned)
      const authInfo = PaxiCosmJS.AuthInfo.fromPartial({
        signerInfos: [],
        fee: PaxiCosmJS.Fee.fromPartial({
          amount: [PaxiCosmJS.Coin.fromPartial({ denom: CONFIG.denom, amount: '0' })],
          gasLimit: 0,
        }),
      });
      const authBytes = PaxiCosmJS.AuthInfo.encode(authInfo).finish();
      const txRaw = PaxiCosmJS.TxRaw.fromPartial({
        bodyBytes, authInfoBytes: authBytes, signatures: [new Uint8Array()],
      });
      const txBytesB64 = btoa(String.fromCharCode.apply(null, PaxiCosmJS.TxRaw.encode(txRaw).finish()));
      const res = await fetch(`${lcd}/cosmos/tx/v1beta1/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_bytes: txBytesB64 }),
      });
      if (res.ok) {
        const data = await res.json();
        const gas = data?.gas_info?.gas_used || data?.gasUsed;
        // If a valid gas value returns, the typeUrl is recognized (other errors from the missing signature do not matter)
        if (gas && Number(gas) > 0) {
          _cachedCancelTypeUrl = typeUrl;
          return typeUrl;
        }
        // If no gas but the error is neither "unknown" nor "not found", the type may still be recognized
        const err = data?.error || '';
        if (err && !/unknown|unrecognized|not found|route/i.test(err)) {
          _cachedCancelTypeUrl = typeUrl;
          return typeUrl;
        }
      } else {
        const text = await res.text();
        // Within 500/400, a decode error (not "unknown") also indicates the message type is recognized
        if (!/unknown|unrecognized|not found|route/i.test(text)) {
          _cachedCancelTypeUrl = typeUrl;
          return typeUrl;
        }
      }
    } catch (e) {
      // Probe failed; skip this candidate
      console.debug(`[probe] ${typeUrl} failed:`, e.message);
    }
  }
  // If nothing probes successfully, default to v1beta1 (same as submission)
  _cachedCancelTypeUrl = '/cosmos.gov.v1beta1.MsgCancelProposal';
  return _cachedCancelTypeUrl;
}

// Read the current wallet balance (upaxi)
async function _getBalance(addr) {
  try {
    const denom = CONFIG.denom;
    const data = await fetchAPI(`/cosmos/bank/v1beta1/balances/${addr}/by_denom?denom=${denom}`);
    return data?.balance?.amount || null;
  } catch (e) { return null; }
}

async function cancelProposal(proposalId) {
  if (typeof state !== 'undefined' && !state.connected) {
    showToast(_t('proposal.connectFirst','Please connect your wallet first'), 'error');
    return;
  }
  const confirmMsg = _t('proposal.cancelConfirm','Cancel proposal #{id}? The deposit will be refunded after cancellation.').replace('{id}', proposalId);
  if (!confirm(confirmMsg)) return;

  // Create the status element
  let statusEl = document.getElementById('proposalStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'proposalStatus';
    statusEl.className = 'status-msg';
    const listEl = document.getElementById('proposalList');
    if (listEl) listEl.parentNode.insertBefore(statusEl, listEl);
  }
  statusEl.style.display = 'block';
  statusEl.className = 'status-msg info';
  statusEl.textContent = _t('proposal.canceling','Cancelling...') + ' (probing the on-chain message type...)';

  try {
    const proposer = state.wallet.address;
    const msgBytes = _encodeMsgCancelProposal(proposalId, proposer);
    // Probe the supported on-chain typeUrl version first
    const cancelTypeUrl = await _probeCancelTypeUrl(proposer, msgBytes);

    // Record the pre-cancel balance to verify the deposit refund afterwards
    const balanceBefore = await _getBalance(proposer);

    statusEl.textContent = _t('proposal.canceling','Cancelling...') + ` (using ${cancelTypeUrl.includes('v1beta1') ? 'v1beta1' : 'v1'} API)`;

    const messages = [PaxiCosmJS.Any.fromPartial({
      typeUrl: cancelTypeUrl,
      value: msgBytes,
    })];

    const summary = `Cancel Proposal #${proposalId}`;
    const res = await buildSignAndBroadcast(messages, summary, null, state.wallet);

    const txResp = res?.tx_response || res;
    const txHash = txResp?.txhash;
    const txCode = txResp?.code;
    const txRawLog = txResp?.raw_log || res?.message || '';

    if (txCode !== undefined && txCode !== 0) {
      throw new Error(`Tx failed (code=${txCode}): ${txRawLog}`);
    }

    // Poll for confirmation
    let txConfirmed = false;
    let txErrorMessage = '';
    let pollInfo = null;
    if (typeof pollTxStatus === 'function' && txHash) {
      try {
        pollInfo = await pollTxStatus(txHash, 25);
        if (pollInfo) {
          if (pollInfo.confirmed && pollInfo.success) {
            txConfirmed = true;
          } else if (pollInfo.confirmed && !pollInfo.success) {
            txErrorMessage = pollInfo.rawLog || `code=${pollInfo.code}`;
          } else {
            txErrorMessage = 'Timed out without confirmation';
          }
        } else {
          txErrorMessage = 'Timed out without confirmation';
        }
      } catch (e) {
        txErrorMessage = e.message || String(e);
      }
    }

    if (!txConfirmed) {
      const failMsg = _t('proposal.cancelFail','❌ Proposal cancellation failed: ') + (txErrorMessage || 'tx not confirmed on chain');
      statusEl.className = 'status-msg error';
      statusEl.textContent = failMsg;
      showToast(failMsg, 'error');
      return;
    }

    // ===== Deposit refund balance verification =====
    statusEl.className = 'status-msg info';
    statusEl.textContent = _t('proposal.cancelSuccess','✅ Proposal #{id} cancelled; the deposit will be refunded.').replace('{id}', proposalId) + ' waiting for the balance to update...';
    let balanceAfter = null;
    let refundPaxi = null;
    let gasPaxi = null;
    for (let retry = 0; retry < 6; retry++) {
      await new Promise(r => setTimeout(r, 1500));
      balanceAfter = await _getBalance(proposer);
      if (balanceAfter && balanceBefore) {
        const diff = BigInt(balanceAfter) - BigInt(balanceBefore);
        // In theory: deposit refund - tx gas fee = positive or negative
        if (typeof upaxiToPaxi === 'function') {
          refundPaxi = upaxiToPaxi(diff.toString());
        } else {
          refundPaxi = (Number(diff) / 1e6).toFixed(6);
        }
        // Estimate the gas fee: look it up in the tx record or show a simple note
        gasPaxi = pollInfo && pollInfo.gasWanted ? (Number(pollInfo.gasWanted) * 0.25 / 1e6).toFixed(6) : null;
        break;
      }
    }

    let okHtml = `<strong>${_t('proposal.cancelSuccess','✅ Proposal #{id} cancelled; the deposit will be refunded.').replace('{id}', proposalId)}</strong>`;
    okHtml += `<br><span style="font-size:11px;">Tx: <code>${txHash ? txHash.slice(0,12)+'...' : '-'}</code></span>`;
    if (refundPaxi != null && balanceBefore && balanceAfter) {
      const sign = parseFloat(refundPaxi) >= 0 ? '+' : '';
      const netBadge = parseFloat(refundPaxi) >= 0
        ? `<span style="color:#52c41a;font-weight:700;">${sign}${refundPaxi} PAXI</span>`
        : `<span style="color:var(--danger);font-weight:700;">${sign}${refundPaxi} PAXI</span>`;
      okHtml += `<br><span style="font-size:12px;">Wallet balance change: ${netBadge}`;
      okHtml += `<br>&nbsp;&nbsp;✓ Deposit refunded (refund = proposal deposit - cancellation gas fee)`;
      if (gasPaxi) okHtml += `<br>&nbsp;&nbsp;💰 Cancellation gas fee approx.: ${gasPaxi} PAXI`;
      okHtml += `</span>`;
    } else {
      okHtml += `<br><span style="font-size:12px;color:var(--text-muted);">The deposit has been refunded on chain; refresh to see the balance on the home page.</span>`;
    }
    statusEl.className = 'status-msg success';
    statusEl.innerHTML = okHtml;
    showToast(_t('proposal.cancelSuccess','✅ Proposal #{id} cancelled; the deposit will be refunded.').replace('{id}', proposalId), 'success');
    setTimeout(loadProposalList, 3000);
  } catch (e) {
    console.error(e);
    let msg = _t('proposal.cancelFail','❌ Proposal cancellation failed: ') + (e.message || String(e));
    if (typeof mapError === 'function') msg = _t('proposal.cancelFail','❌ Proposal cancellation failed: ') + mapError(e);
    statusEl.className = 'status-msg error';
    statusEl.textContent = msg;
    showToast(msg, 'error');
  }
}

function statusLabel(status) {
  const s = GOV_STATUS[Number(status)] || { label: status, cls: 'warning' };
  let zhLabel = s.label;
  if (Number(status) === 2 || Number(status) === 1) zhLabel = _t('proposal.voting','Voting');
  else if (Number(status) === 3) zhLabel = _t('proposal.passed','Passed');
  else if (Number(status) === 4) zhLabel = _t('proposal.rejected','Rejected');
  else if (Number(status) === 5) zhLabel = _t('proposal.depositFailed','Failed (deposit refunded)');
  return { label: zhLabel, cls: s.cls };
}

function statusStrToNum(s) {
  if (typeof s !== 'string') return 0;
  if (s.includes('DEPOSIT_PERIOD')) return 1;
  if (s.includes('VOTING_PERIOD')) return 2;
  if (s.includes('PASSED')) return 3;
  if (s.includes('REJECTED')) return 4;
  if (s.includes('FAILED')) return 5;
  return 0;
}
function normalizeProposal(p) {
  // Extract the proposer: field location differs across API versions
  let proposer = p.proposer || null;
  if (!proposer && p.proposal) proposer = p.proposal.proposer || null;
  // v1 API uses id; v1beta1 uses proposal_id
  const pid = p.proposal_id || p.id || null;
  return {
    proposal_id: pid,
    id: pid,
    status: typeof p.status === 'number' ? p.status : statusStrToNum(p.status),
    total_deposit: p.total_deposit || [],
    submit_time: p.submit_time || '',
    content: p.content || null,
    // v1 API: messages array
    messages: p.messages || null,
    title: extractProposalTitle(p),
    proposer: proposer,
    // Save the raw data for further digging later
    _raw: p,
  };
}
// Extract the proposal type from content (for list badges)
function proposalTypeTag(p) {
  // v1 API: messages array (each entry carries @type)
  const msgs = p?.messages || p?._raw?.messages || null;
  if (Array.isArray(msgs) && msgs.length) {
    const t = msgs[0]?.['@type'] || msgs[0]?.type_url || msgs[0]?.typeUrl || '';
    if (t) return _govTypeTagByUrl(t);
  }
  // v1beta1 API: content ({ "@type": ... } or { type_url, value })
  const c = p?.content || p?._raw?.content || null;
  let typeUrl = '';
  if (c) {
    if (typeof c === 'string') typeUrl = c;
    else if (c['@type']) typeUrl = c['@type'];
    else if (c.type_url || c.typeUrl) typeUrl = c.type_url || c.typeUrl;
  }
  if (!typeUrl) return null;
  return _govTypeTagByUrl(typeUrl);
}

function _govTypeTagByUrl(typeUrl) {
  if (!typeUrl) return null;
  if (typeUrl.includes('CommunityPoolSpend')) {
    return { label: _t('proposal.badgePool','🏦 Community Pool Spend'), color: '#0ea5e9', bg: 'rgba(14,165,233,.15)' };
  }
  if (typeUrl.includes('ParameterChange')) {
    return { label: _t('proposal.badgeParam','🔧 Param Change'), color: '#f59e0b', bg: 'rgba(245,158,11,.15)' };
  }
  if (typeUrl.includes('Text')) {
    return { label: _t('proposal.badgeText','📝 Text'), color: 'var(--primary)', bg: 'rgba(88,101,242,.15)' };
  }
  if (typeUrl.includes('SoftwareUpgrade')) {
    return { label: _t('proposal.badgeUpgrade','⬆️ Software Upgrade'), color: '#22c55e', bg: 'rgba(34,197,94,.15)' };
  }
  if (typeUrl.includes('MsgUpdateParams')) {
    return { label: _t('proposal.badgeParam','🔧 Param Change'), color: '#f59e0b', bg: 'rgba(245,158,11,.15)' };
  }
  if (typeUrl.includes('MsgRecoverClient')) {
    return { label: _t('proposal.badgeClient','🔗 IBC Client Recovery'), color: '#a855f7', bg: 'rgba(168,85,247,.15)' };
  }
  return { label: typeUrl.split('.').pop(), color: 'var(--text-muted)', bg: 'rgba(255,255,255,.08)' };
}

function extractProposalTitle(p) {
  try {
    // v1 API: has the title field directly
    if (typeof p.title === 'string' && p.title) return p.title;
    if (typeof p.summary === 'string' && p.summary) return p.summary;
    if (p.content) {
      // v1beta1 Any: { typeUrl, value(base64 of TextProposal) }
      if (p.content.type_url || p.content.typeUrl) {
        const v = p.content.value || '';
        if (v && typeof atob === 'function') {
          const decoded = atob(v);
          // TextProposal: title is field 1 (len-delim string), ParameterChangeProposal: title field 1 too
          // Simple heuristic: first length-delimited string before 0x12 (field 2)
          const bs = []; for (let i = 0; i < decoded.length; i++) bs.push(decoded.charCodeAt(i));
          const raw = new Uint8Array(bs);
          const title = readFirstLenDelim(raw);
          if (title) return title;
        }
      }
      if (typeof p.content.title === 'string') return p.content.title;
    }
  } catch (e) {}
  return `Proposal #${p.proposal_id || p.id || '?'}`;
}
// protobuf: read field 1 length-delimited string from raw bytes
function readFirstLenDelim(raw) {
  let i = 0;
  // tag
  if (i >= raw.length) return null;
  const tag = raw[i++];
  if ((tag & 0x07) !== 2) return null; // must be len-delim
  // length (varint)
  let len = 0, shift = 0;
  while (true) {
    if (i >= raw.length) return null;
    const b = raw[i++];
    len |= (b & 0x7F) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift > 63) return null;
  }
  if (len < 0 || i + len > raw.length) return null;
  let s = '';
  for (let j = 0; j < len; j++) s += String.fromCharCode(raw[i + j]);
  // utf8 decode in case title contains non-ASCII
  try { return decodeURIComponent(escape(s)); }
  catch (e) { return s; }
}
function formatDeposit(arr) {
  if (!arr || !arr.length) return '0 PAXI';
  const paxi = arr.find(c => c.denom === 'upaxi' || c.denom === 'PAXI');
  if (!paxi) return `${arr[0].amount} ${arr[0].denom}`;
  const n = typeof upaxiToPaxi === 'function' ? upaxiToPaxi(paxi.amount) : (parseFloat(paxi.amount) / 1e6).toString();
  return `${n} PAXI`;
}
function formatTimeSafe(t) {
  if (!t) return '-';
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) { return t; }
}
function escapeHtmlSafe(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function loadProposalList() {
  const container = document.getElementById('proposalList');
  if (!container) return;
  try {
    const lcd = typeof CONFIG !== 'undefined' ? CONFIG.lcd : getLCD();
    let proposals = [];
    let err = null;
    // The Cosmos SDK gov API only returns voting-period proposals by default
    // Query deposit_period / voting_period / passed / rejected separately to see all
    const statuses = [
      'PROPOSAL_STATUS_DEPOSIT_PERIOD',
      'PROPOSAL_STATUS_VOTING_PERIOD',
      'PROPOSAL_STATUS_PASSED',
      'PROPOSAL_STATUS_REJECTED',
      'PROPOSAL_STATUS_FAILED',
    ];
    // Prefer the v1 API (has title/summary/messages and full proposer fields);
    // v1beta1's status filter is incompatible (HTTP 400) and returns no title -> fallback only
    for (const apiVer of ['/cosmos/gov/v1/proposals', '/cosmos/gov/v1beta1/proposals']) {
      // The 5 status queries are independent -> run them in parallel.
      // Measured: serial ~5.1s, parallel ~1.2s.
      const settled = await Promise.allSettled(
        statuses.map(st => fetchAPI(`${apiVer}?proposal_status=${st}&pagination.limit=100&pagination.reverse=true`))
      );
      const all = [];
      let okCount = 0;
      settled.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          all.push(...(r.value.proposals || []));
          okCount++;
        }
      });
      if (okCount > 0) {
        proposals = all.map(p => normalizeProposal(p));
        break;
      }
      // If querying all statuses separately fails, try fetching all without a status filter
      if (apiVer === '/cosmos/gov/v1/proposals') {
        try {
          const data = await fetchAPI(`${apiVer}?pagination.limit=100&pagination.reverse=true`);
          proposals = (data.proposals || []).map(p => normalizeProposal(p));
          break;
        } catch (e) {}
      }
    }
    if (!proposals.length) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">${_t('proposal.listEmpty','No proposals yet')}${err ? '<br><span style="font-size:11px;">(' + escapeHtmlSafe(err) + ')</span>' : ''}</p>`;
      return;
    }
    proposals.sort((a, b) => Number(b.proposal_id || b.id || 0) - Number(a.proposal_id || a.id || 0));

    // Render the list first: show the proposer inline if present, otherwise show "querying"
    container.innerHTML = proposals.map(p => {
      const st = statusLabel(p.status);
      const time = p.submit_time || '';
      const deposit = formatDeposit(p.total_deposit || []);
      const pid = p.proposal_id || p.id || '?';
      // Store status and proposer for later use
      _proposalStatusMap[pid] = p.status;
      if (p.proposer) _proposalProposerMap[pid] = p.proposer;
      const statusBadge = `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;${
        st.cls === 'success' ? 'background:rgba(82,196,26,.15);color:#52c41a;' :
        st.cls === 'danger' ? 'background:rgba(255,77,79,.15);color:#ff4d4f;' :
        st.cls === 'primary' ? 'background:rgba(88,101,242,.2);color:var(--primary);' :
        'background:rgba(250,173,20,.15);color:#faad14;'
      }">${st.label}</span>`;
      const leftColor = st.cls==='success'?'#52c41a':st.cls==='danger'?'#ff4d4f':st.cls==='primary'?'var(--primary)':'#faad14';
      // If the list data already has the proposer, render it directly
      const proposerHtml = p.proposer ? renderProposerHtml(pid, p.proposer) : `<span id="proposer-${pid}" style="font-family:var(--font-mono,monospace);">Querying...</span>`;
      // If the proposer is known and conditions are met, render the cancel button directly
      const cancelBtnHtml = (p.proposer && shouldShowCancelBtn(pid, p.status, p.proposer))
        ? renderCancelBtnHtml(pid)
        : `<span id="cancel-btn-${pid}"></span>`;
      return `
        <div style="border-left:3px solid ${leftColor};background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-weight:700;">#${pid}</div>
            ${statusBadge}
          </div>
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtmlSafe(p.title)}</div>
          ${(() => { const tag = proposalTypeTag(p); return tag ? `<div style="margin-bottom:6px;"><span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:${tag.bg};color:${tag.color};">${escapeHtmlSafe(tag.label)}</span></div>` : ''; })()}
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);margin-bottom:4px;">
            <span>💰 ${deposit}</span>
            <span>📅 ${formatTimeSafe(time)}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="display:flex;align-items:center;gap:2px;min-width:0;">👤 ${proposerHtml}</span>
            ${cancelBtnHtml}
          </div>
        </div>
      `;
    }).join('');

    // Async-fill the proposers (only query those missing from the list data).
    // Concurrency is capped at 3: firing one request per proposal at once trips the LCD rate limiter.
    const needProposer = proposals
      .map(p => p.proposal_id || p.id)
      .filter(pid => pid && !p.proposer);
    let ppIdx = 0;
    const ppWorker = async () => {
      while (ppIdx < needProposer.length) {
        const pid = needProposer[ppIdx++];
        try { await fetchProposer(pid, lcd); } catch (_) {}
      }
    };
    for (let i = 0; i < 3; i++) ppWorker();
  } catch (e) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:10px;">Failed to load: ${escapeHtmlSafe(e.message)}</p>`;
  }
}

// Whether the cancel button should be shown
function shouldShowCancelBtn(proposalId, status, proposer) {
  if (!proposer) return false;
  if (status !== 1) return false; // must be in DepositPeriod
  if (typeof state === 'undefined' || !state.wallet || !state.wallet.address) return false;
  return state.wallet.address === proposer;
}

// Render the proposer HTML
function renderProposerHtml(proposalId, addr) {
  if (!addr) return 'Unknown';
  const mine = (typeof state !== 'undefined' && state.wallet && state.wallet.address === addr);
  const short = addr.length > 20 ? addr.slice(0, 12) + '...' + addr.slice(-6) : addr;
  return mine
    ? `<span id="proposer-${proposalId}" style="color:var(--primary);font-weight:600;">${short}</span> <span style="background:var(--primary);color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">Me</span>`
    : `<span id="proposer-${proposalId}" title="${addr}">${short}</span>`;
}

// Render the cancel button HTML
function renderCancelBtnHtml(proposalId) {
  return `<button class="btn btn-ghost" style="padding:2px 10px;font-size:11px;color:var(--danger);border:1px solid var(--danger);border-radius:4px;" onclick="cancelProposal('${proposalId}')">${_t('proposal.cancelBtn','🗑 Cancel Proposal')}</button>`;
}

// Fetch the proposer address and fill it back into the list
async function fetchProposer(proposalId, lcd) {
  const el = document.getElementById(`proposer-${proposalId}`);
  try {
    let addr = _proposalProposerMap[proposalId] || null;
    // Try the dedicated proposer API
    if (!addr) {
      for (const apiVer of ['/cosmos/gov/v1/proposals', '/cosmos/gov/v1beta1/proposals']) {
        try {
          const data = await fetchAPI(`${apiVer}/${proposalId}/proposer`);
          console.debug('[fetchProposer] API resp:', proposalId, data);
          addr = data.proposer || (data.proposal && data.proposal.proposer) || null;
          if (addr) break;
        } catch (e) { /* try next */ }
      }
    }
    // Try again: fetch the single proposal detail, which may contain the proposer
    if (!addr) {
      for (const apiVer of ['/cosmos/gov/v1/proposals', '/cosmos/gov/v1beta1/proposals']) {
        try {
          const data = await fetchAPI(`${apiVer}/${proposalId}`);
          const p = data.proposal || data;
          addr = p.proposer || (p.proposal && p.proposal.proposer) || null;
          if (addr) break;
        } catch (e) { /* try next */ }
      }
    }
    if (addr) {
      _proposalProposerMap[proposalId] = addr;
      // Replace the display
      if (el) {
        const mine = (typeof state !== 'undefined' && state.wallet && state.wallet.address === addr);
        const short = addr.length > 20 ? addr.slice(0, 12) + '...' + addr.slice(-6) : addr;
        el.outerHTML = renderProposerHtml(proposalId, addr);
      }
      // If it is the user's own proposal in deposit period, show the cancel button
      const status = _proposalStatusMap[proposalId];
      if (shouldShowCancelBtn(proposalId, status, addr)) {
        const cancelBtnEl = document.getElementById(`cancel-btn-${proposalId}`);
        if (cancelBtnEl) cancelBtnEl.innerHTML = renderCancelBtnHtml(proposalId);
      }
    } else {
      if (el) el.textContent = 'Unknown';
    }
  } catch (e) {
    console.error('[fetchProposer] error:', proposalId, e);
    if (el) el.textContent = 'Query failed';
  }
}

window.TOOL_REGISTRY['proposal'] = { render: renderProposal, bind: bindProposalEvents, onMount: onProposalWalletChange };
window.cancelProposal = cancelProposal;
