/* ============================================================================
 * Paxi Suite · Governance Vote module (Governance Vote)
 *  - Read on-chain governance proposals and cast Yes/No/Abstain/NoWithVeto votes on proposals in the voting period
 *  - No platform fee (pure governance operation)
 * Dependencies: PaxiCosmJS (official SDK), shared.js (escapeHtml/showStatus/showToast),
 *       core.js (state wallet status, currentLang, fetchAPI, getLCD, buildSignAndBroadcast)
 * ==========================================================================*/

window.TOOL_REGISTRY ||= {};

(function () {
  'use strict';

  /* ------------------------------------------------ Governance-vote-specific i18n */
  const PT_DICT = {
  en: {
      title: 'Governance Vote',
      desc: 'Browse on-chain governance proposals and cast your vote on proposals in the voting period. This tool charges no platform fee.',
      info: '💡 Only proposals in the "Voting" period can be voted on. Voting requires wallet signing and on-chain broadcast; the chain record is authoritative.',
      voting: 'Voting',
      passed: 'Passed',
      rejected: 'Rejected',
      deposit: 'Deposit',
      connectFirst: 'Please connect a wallet before voting',
      yes: 'Yes',
      no: 'No',
      abstain: 'Abstain',
      veto: 'NoWithVeto',
      voted: 'You voted: ',
      confirmMsg: (id, opt) => `Confirm voting "${opt}" on proposal #${id}?\n\nClick "OK" to sign and broadcast via your wallet.`,
      success: '✅ Vote submitted',
      failPrefix: 'Vote failed: ',
      sdkErr: 'SDK does not support this message type',
      noProposals: 'No proposals',
      loading: 'Loading...',
      statusUnknown: 'Unknown',
      voteFailed: 'Vote failed',
    }
  };
  const pt = (key, ...args) => {
    const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'zh';
    let v = PT_DICT[lang][key];
    if (v === undefined) v = PT_DICT.en[key];
    return typeof v === 'function' ? v(...args) : v;
  };

  const esc = (s) => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s);

  // Status -> label (multilingual)
  function statusLabel(status) {
    switch (status) {
      case 'PROPOSAL_STATUS_VOTING_PERIOD': return pt('voting');
      case 'PROPOSAL_STATUS_PASSED': return pt('passed');
      case 'PROPOSAL_STATUS_REJECTED': return pt('rejected');
      case 'PROPOSAL_STATUS_DEPOSIT_PERIOD': return pt('deposit');
      default: return pt('statusUnknown');
    }
  }

  // Vote option -> display label
  function optionLabel(option) {
    switch (option) {
      case 'VOTE_OPTION_YES': return pt('yes');
      case 'VOTE_OPTION_NO': return pt('no');
      case 'VOTE_OPTION_ABSTAIN': return pt('abstain');
      case 'VOTE_OPTION_NO_WITH_VETO': return pt('veto');
      default: return option;
    }
  }

  /* ------------------------------------------------ render */
  function renderGovVote() {
    return `
      <div class="card">
        <div class="card-title">${esc(pt('title'))}</div>
        <div class="tool-desc">${esc(pt('desc'))}</div>
        <div class="info-box">
          <strong>${esc(pt('info'))}</strong>
        </div>
        <div class="status-msg" id="gvStatus"></div>
        <div id="gvList"></div>
      </div>
    `;
  }

  /* ------------------------------------------------ data loading (onMount) */
  let gvLoadSeq = 0;
  async function loadGovVote() {
    const listEl = document.getElementById('gvList');
    if (!listEl) return;
    const my = ++gvLoadSeq;
    listEl.innerHTML = `<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">⏳ ${esc(pt('loading'))}</div>`;
    try {
      const data = await fetchAPI('/cosmos/gov/v1beta1/proposals');
      if (my !== gvLoadSeq) return; // Prevent language switch/reload race condition
      const proposals = (data && data.proposals) || [];
      if (proposals.length === 0) {
        listEl.innerHTML = `<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">${esc(pt('noProposals'))}</div>`;
        return;
      }
      listEl.innerHTML = '';
      for (const p of proposals) {
        const id = p.id;
        const title = p.title || (p.content && p.content.title) || ('# ' + id);
        const status = p.status || '';
        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px;background:rgba(255,255,255,0.02);';
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="font-weight:600;font-size:14px;">#${esc(id)} · ${esc(title)}</div>
            <span class="badge" style="font-size:11px;padding:3px 8px;border-radius:20px;background:rgba(74,222,128,.12);color:var(--success);white-space:nowrap;">${esc(statusLabel(status))}</span>
          </div>
          <div id="gvVote_${esc(id)}" style="margin-top:10px;"></div>
        `;
        listEl.appendChild(card);

        const voteEl = card.querySelector(`#gvVote_${CSS.escape ? CSS.escape(String(id)) : id}`);

        if (status === 'PROPOSAL_STATUS_VOTING_PERIOD') {
          const options = [
            ['VOTE_OPTION_YES', pt('yes')],
            ['VOTE_OPTION_NO', pt('no')],
            ['VOTE_OPTION_ABSTAIN', pt('abstain')],
            ['VOTE_OPTION_NO_WITH_VETO', pt('veto')],
          ];
          const btnWrap = document.createElement('div');
          btnWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
          for (const [opt, label] of options) {
            const b = document.createElement('button');
            b.className = 'btn btn-outline btn-sm';
            b.style.minHeight = '38px';
            b.textContent = label;
            b.onclick = () => castVote(id, opt);
            btnWrap.appendChild(b);
          }
          voteEl.appendChild(btnWrap);

          // When wallet connected, query whether self has already voted
          if (typeof state !== 'undefined' && state.connected && state.wallet && state.wallet.address) {
            const votedLabel = document.createElement('div');
            votedLabel.id = `gvVoted_${esc(id)}`;
            votedLabel.style.cssText = 'margin-top:8px;font-size:12px;color:var(--primary);';
            voteEl.appendChild(votedLabel);
            try {
              const vData = await fetchAPI(`/cosmos/gov/v1beta1/proposals/${encodeURIComponent(String(id))}/votes/${encodeURIComponent(state.wallet.address)}`);
              if (my !== gvLoadSeq) return;
              const v = vData && vData.vote;
              if (v && v.option) {
                votedLabel.textContent = pt('voted') + optionLabel(v.option);
              }
            } catch (_) {
              // Some chain endpoints may differ; on failure silently skip the "voted" label
            }
          }
        }
      }
    } catch (e) {
      if (my !== gvLoadSeq) return;
      console.error('[GovVote] proposal load failed:', e);
      listEl.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:8px 0;">❌ ${esc(e.message || String(e))}</div>`;
    }
  }

  /* ------------------------------------------------ voting */
  async function castVote(id, option) {
    if (typeof state === 'undefined' || !state.connected) {
      showStatusSafe(pt('connectFirst'), 'warning');
      if (typeof showToast === 'function') showToast(pt('connectFirst'), 'error');
      return;
    }
    const address = state.wallet.address;

    // SDK support guard
    if (typeof PaxiCosmJS === 'undefined' || typeof PaxiCosmJS.MsgVote === 'undefined' || typeof PaxiCosmJS.Any === 'undefined') {
      showStatusSafe(pt('sdkErr'), 'error');
      if (typeof showToast === 'function') showToast(pt('sdkErr'), 'error');
      return;
    }

    const ok = confirm(pt('confirmMsg', id, optionLabel(option)));
    if (!ok) return;

    // Disable all vote buttons for this proposal during signing to prevent duplicate votes from repeated clicks
    const voteBtns = document.querySelectorAll('#gvVote_' + (CSS.escape ? CSS.escape(String(id)) : id) + ' button');
    voteBtns.forEach(b => b.disabled = true);

    const statusEl = document.getElementById('gvStatus');
    if (statusEl) { statusEl.textContent = '⏳ ...'; statusEl.className = 'status-msg'; }
    try {
      // MsgVote.option must be a numeric enum (v1beta1); a string would be encoded as 0 (UNSPECIFIED) causing the vote to be rejected by the chain
      const VOTE_OPT = { VOTE_OPTION_YES: 1, VOTE_OPTION_ABSTAIN: 2, VOTE_OPTION_NO: 3, VOTE_OPTION_NO_WITH_VETO: 4, YES: 1, ABSTAIN: 2, NO: 3, NO_WITH_VETO: 4 };
      const optNum = (typeof option === 'number') ? option : (VOTE_OPT[option] || 1);
      const m = PaxiCosmJS.MsgVote.fromPartial({
        voter: address,
        proposal_id: BigInt(id),
        option: optNum,
      });
      const any = PaxiCosmJS.Any.fromPartial({
        typeUrl: '/cosmos.gov.v1beta1.MsgVote',
        value: PaxiCosmJS.MsgVote.encode(m).finish(),
      });

      const memo = `Paxi Suite Gov Vote #${id} ${option}`;
      const res = await buildSignAndBroadcast([any], memo, null, state.wallet);
      const r = checkTxResult(res);
      if (r.ok) {
        // SYNC only means CheckTx passed; poll to confirm DeliverTx actually landed on-chain to avoid "false success"
        const final = (typeof pollTxStatus === 'function') ? await pollTxStatus(r.txhash) : null;
        if (final && final.confirmed && !final.success) {
          showStatusSafe(pt('failPrefix') + mapErrorSafe(final.code, final.rawLog), 'error');
        } else {
          showStatusSafe(pt('success') + ' TxHash: ' + (r.txhash ? r.txhash.slice(0, 20) + '...' : ''), 'success');
          if (typeof showToast === 'function') showToast(pt('success'), 'success');
          // Re-render the list to refresh the "voted" status
          await loadGovVote();
        }
      } else {
        const detail = mapErrorSafe(r.code, r.rawLog);
        showStatusSafe(pt('failPrefix') + detail, 'error');
      }
    } catch (e) {
      showStatusSafe(pt('failPrefix') + (e.message || String(e)), 'error');
    } finally {
      voteBtns.forEach(b => b.disabled = false);
    }
  }

  function showStatusSafe(msg, type) {
    if (typeof showStatus === 'function') {
      showStatus('gvStatus', msg, type);
      return;
    }
    const el = document.getElementById('gvStatus');
    if (el) {
      el.textContent = msg;
      el.className = 'status-msg' + (type ? ' ' + type : '');
    }
  }

  function mapErrorSafe(code, rawLog) {
    if (typeof mapError === 'function') return mapError(code, rawLog);
    return `code=${code}` + (rawLog ? ` ${rawLog}` : '');
  }

  /* ------------------------------------------------ Bind */
  function bindGovVote() {
    // Voting uses inline onclick / dynamically bound buttons; no extra event delegation needed
    // Reserved here: if wallet connection state change monitoring is needed later, extend here
  }

  /* ------------------------------------------------ Register */
  window.TOOL_REGISTRY['gov-vote'] = {
    render: renderGovVote,
    bind: bindGovVote,
    onMount: loadGovVote,
  };
})();
