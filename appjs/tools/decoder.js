/* ============================================================================
 * Paxi Suite · On-chain decoder module (UI port of decoder-core.js v2)
 * Features: tx story decoding / contract function probing / contract sandbox / batch decode / failure diagnosis
 * Dependencies: decoder-core.js (window.PaxiDecoder), shared.js (escapeHtml/showToast)
 * ==========================================================================*/

window.TOOL_REGISTRY ||= {};

(function () {
  'use strict';
  const D = window.PaxiDecoder;

  /* ------------------------------------------------ i18n (tool-internal dictionary; en authoritative) */
  const DEC_DICT = {
  en: {
      title: '🔍 On-chain Decoder', searchPh: 'Tx hash / contract address / wallet address', decodeBtn: 'Decode', clearTitle: 'Clear', clear: 'Clear',
      tabDecode: '📖 Decode Tx', tabSandbox: '🧪 Sandbox', tabBatch: '📋 Batch Decode', tabDiagnose: '🩺 Failure Diagnosis',
      jumpBalance: '💰 Balance', jumpRedelegate: '🔄 Redelegate', jumpValidator: '📊 Validators', jumpProposal: '📦 Proposals',
      sandboxHint: 'Send read-only queries straight to the node — no signing, no gas. Not sure what to enter? Look up the contract on the Decode tab first; it lists every query method the contract actually supports.',
      contractAddr: 'Contract address', queryJson: 'Query JSON', runQuery: 'Run query',
      batchHint: 'One 64-char tx hash per line (spaces/commas also work), up to 200 txs.', runBatchBtn: 'Start Batch Decode', exportCsvBtn: '📥 Export CSV',
      diagHint: 'Enter a failed tx hash to auto-classify the failure reason with fix suggestions.', failHashPh: 'Hash of the failed tx...', diagBtn: 'Diagnose',
      footer: '⚠️ This tool only reads public on-chain data and explains it in plain words. No trading advice. Fully read-only: no signing, no asset access.',
      txOk: '✅ Tx succeeded', txFail: '❌ Tx failed', txFailCause: ': {0}', height: 'Height {0}', paren: ' ({0})',
      storyTitle: '📖 What this tx did', memo: '📝 Memo: {0}',
      feeTitle: 'Fee', amount: 'Amount', feePayer: 'Fee payer', txHash: 'Tx hash', copy: '⧉ Copy', sharePage: 'Share', copyLink: '🔗 Copy decode link',
      nativeDelta: 'Native balance changes (PAXI)', received: '📥 Received', sent: '📤 Sent', contractFlows: 'Smart contract asset transfers', from: 'From ', to: 'To ', qty: 'Amount: ',
      msgsTitle: 'Messages ({0})', sender: 'Sender: ', execMethod: 'Method: ', contractOf: ' · Contract ', viewArgs: 'View args', rawMsg: 'Raw message', failLog: 'Failure log',
      queryingChain: 'Querying on-chain data…', isContract: '🔗 This is a smart contract', profile: 'Contract profile', label: 'Label', kind: 'Category', creator: 'Creator',
      admin: 'Admin', upgradable: ' (upgradable)', noAdmin: 'Not upgradable (admin renounced)', createdHeight: 'Created at height',
      totalSupply: 'Total supply', tokenInfo: 'Token info', name: 'Name', symbol: 'Symbol', decimals: 'Decimals',
      srcEcho: 'from real contract echo', srcProbe: 'from per-method probing', srcNoEcho: 'no echo', srcErr: 'echo error',
      queryFeatures: 'Queryable methods (verified on-chain)',
      methodsFound: 'Found {0} real query methods on-chain. Click any method to load it into the sandbox.',
      noMethods: 'This contract did not echo a method list (custom implementation or no public query interface). You can still type method names and args manually in the sandbox.',
      openSandbox: '🧪 Open sandbox for this contract',
      nativeBalance: 'Native balance', noBalance: 'No native balance at this address',
      localNote: 'Local note (stored on this device only)', noteName: 'Note', notSet: 'Not set', address: 'Address',
      editNote: 'Edit', addNote: 'Add', notePrompt: 'Set a note for this address (stored in this browser only):',
      unknownInput: 'Cannot tell whether this is a hash or an address — is it copied in full?',
      inputHint: 'Paxi addresses start with <b>paxi1</b>; tx hashes are 64 alphanumeric characters.',
      parsingTx: 'Parsing tx {0}…', netErr: '⚠️ Network/node error (this is NOT a tx failure, please retry): {0}', nodeReturn: 'Node response',
      netErrHint: 'Common causes: hash not found, not yet indexed, or the node is temporarily unresponsive.',
      badAddr: 'Please enter a valid contract address (full paxi1... address)', noJson: 'Please enter query JSON', jsonErr: 'JSON syntax error: {0}',
      queryingNode: 'Querying the node (read-only)…', queryOk: '✅ Query succeeded',
      realMethods: '💡 Real query methods supported by this contract: ', expandAll: 'click to expand all {0}',
      notContract: 'This address is not a contract, or the contract was migrated/destroyed.', queryFail: 'Query failed: {0}', nodeRaw: 'Raw node response', realMethodsTitle: 'Real query methods',
      noValidHash: 'No valid hashes detected (one 64-char hex hash per line).', overLimit: 'Over the limit — only processing the first {0}.',
      parsing: 'Parsing {0}/{1}', stOk: 'Success', stFail: 'Failed', stQueryFail: 'Query failed', done: 'Done: {0} txs',
      needHash: 'Please enter a 64-char tx hash', diagnosing: 'Diagnosing…', netErr2: '⚠️ Network/node error (this is NOT a tx failure): {0}',
      txOkNoDiag: '✅ This tx executed successfully — nothing to diagnose.', noClassify: '• Could not auto-classify. Check the raw log below.',
      txFailCode: '❌ Tx failed (code {0})', diagTitle: 'Diagnosis', gasSet: 'Gas limit', gasUsed: 'Gas used', codespace: 'Codespace', rawLogTitle: 'Raw log',
      d1: 'Insufficient funds: the account cannot cover both the transfer and the fee.', d2: 'Out of gas: execution exceeded the gas limit — raise the Gas.',
      d3: 'Contract logic error: the contract itself returned this error — unrelated to gas.', d4: 'Unauthorized: the caller is not the contract admin/minter.',
      d5: 'Already exists: e.g. duplicate label or token_id.', d6: 'Not found: the target ID, contract address or proposal does not exist.',
      d7: 'Invalid args: JSON does not match the fields the contract expects.', d8: 'Sequence conflict: account nonce out of sync, or the tx was broadcast twice.',
      d9: 'Timed out: not included within the target height — you may rebroadcast.', d10: 'Decimals error: token decimals misconfigured.',
      welcome: 'Paste any <b>tx hash</b> or <b>address</b> above,<br>and I will explain what it did in plain words.',
      coreMissing: 'Core engine decoder-core.js failed to load.', copied: '✅ Copied', copyFail: '❌ Copy failed', addrCopied: '✅ Address copied',
      truncated: '\n…(truncated, {0} chars total)'
    }
  };
  const dcPt = (k, ...a) => {
    const lang = (typeof currentLang !== 'undefined' && currentLang) || 'zh';
    let s = (DEC_DICT[lang] && DEC_DICT[lang][k]) || DEC_DICT.en[k] || k;
    a.forEach((v, i) => { s = s.split('{' + i + '}').join(String(v)); });
    return s;
  };

  /* ------------------------------------------------ module state (closure-isolated) */
  let seq = 0;                       // race-condition guard sequence
  const schemaCache = new Map();     // contract address -> schema
  const tokenCache = new Map();      // contract address -> {symbol, decimals, name}

  /* local address book */
  const BOOK_KEY = 'paxi_book';
  function loadBook() {
    try { return JSON.parse(localStorage.getItem(BOOK_KEY) || '{}'); } catch (_) { return {}; }
  }
  function saveBook(b) {
    try { localStorage.setItem(BOOK_KEY, JSON.stringify(b)); } catch (_) {}
    if (D) D.setAddressBook(b);
  }

  const esc = (s) => D ? D.esc(s) : String(s == null ? '' : s);
  const clip = (s, n = 20000) => {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) + dcPt('truncated', s.length) : s;
  };

  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; }
    catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = s; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        return true;
      } catch (__) { return false; }
    }
  }

  /* ------------------------------------------------ page styles (scoped) */
  const STYLE = `
  #pg-decoder .d-sbar{display:flex;gap:8px;margin-bottom:10px}
  #pg-decoder .d-sbar input{flex:1;min-width:0;padding:13px 14px;border-radius:10px;
    border:1px solid var(--border);background:rgba(255,255,255,0.04);color:#fff;font-size:16px;
    font-family:ui-monospace,Menlo,Consolas,monospace}
  #pg-decoder .d-sbar input:focus{outline:none;border-color:var(--primary)}
  #pg-decoder .d-sbar button{background:var(--primary);border:none;color:#fff;font-weight:600;
    white-space:nowrap;padding:13px 20px;border-radius:10px;cursor:pointer}
  #pg-decoder .d-xbtn{width:42px;flex:none;border-radius:10px;border:1px solid var(--border);
    background:rgba(255,255,255,0.04);color:var(--text-muted);cursor:pointer;font-size:1rem}
  #pg-decoder .d-pills{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px;scrollbar-width:none}
  #pg-decoder .d-pills::-webkit-scrollbar{display:none}
  #pg-decoder .d-pill{white-space:nowrap;padding:7px 14px;border-radius:18px;font-size:.82rem;
    background:rgba(255,255,255,0.03);border:1px solid var(--border);color:var(--text-muted);cursor:pointer}
  #pg-decoder .d-pill.on{background:rgba(99,102,241,0.15);color:var(--primary);border-color:var(--primary)}
  #pg-decoder .d-panel{display:none}
  #pg-decoder .d-panel.on{display:block}
  #pg-decoder .d-card{background:rgba(255,255,255,0.03);border:1px solid var(--border);
    border-radius:12px;padding:14px;margin-bottom:12px}
  #pg-decoder .d-ct{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);
    margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  #pg-decoder .d-ct .src{font-size:.66rem;color:var(--primary);background:rgba(99,102,241,0.12);
    padding:2px 7px;border-radius:10px;text-transform:none;letter-spacing:0}
  #pg-decoder .d-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:.89rem;align-items:flex-start}
  #pg-decoder .d-row>span:first-child{color:var(--text-muted);flex:none}
  #pg-decoder .d-row>b{text-align:right;word-break:break-all;font-weight:600}
  #pg-decoder .d-hint{font-size:.82rem;color:var(--text-muted);line-height:1.6;margin-bottom:12px}
  #pg-decoder .d-lnk{color:#93c5fd;cursor:pointer;border-bottom:1px dashed var(--primary)}
  #pg-decoder .d-story{background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(255,255,255,0.02));
    border:1px solid var(--primary);border-radius:12px;padding:15px;margin-bottom:14px}
  #pg-decoder .d-story-h{font-size:.76rem;color:var(--primary);font-weight:700;margin-bottom:10px;letter-spacing:.04em}
  #pg-decoder .d-story-b{font-size:.95rem;line-height:1.85;white-space:pre-wrap;word-break:break-word}
  #pg-decoder .d-story-b b{color:var(--primary);font-weight:700}
  #pg-decoder .d-delta{display:flex;justify-content:space-between;align-items:center;gap:10px;
    padding:10px;border-radius:8px;margin-bottom:7px;background:rgba(255,255,255,0.03);
    border-left:3px solid var(--border);font-size:.88rem}
  #pg-decoder .d-delta.pos{border-left-color:var(--success);background:rgba(74,222,128,.05)}
  #pg-decoder .d-delta.neg{border-left-color:var(--danger);background:rgba(248,113,113,.05)}
  #pg-decoder .d-delta .amt{font-weight:700;white-space:nowrap}
  #pg-decoder .d-delta.pos .amt{color:var(--success)}
  #pg-decoder .d-delta.neg .amt{color:var(--danger)}
  #pg-decoder .d-cflow{background:rgba(255,255,255,0.03);border-radius:8px;padding:11px;margin-bottom:8px;
    border-left:3px solid var(--primary);font-size:.86rem}
  #pg-decoder .d-cf-h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
  #pg-decoder .d-cf-a{margin-top:5px;color:var(--text-muted)}
  #pg-decoder .d-cf-a b{color:var(--text)}
  #pg-decoder .d-tag{font-size:.68rem;background:rgba(99,102,241,0.12);color:var(--primary);
    padding:2px 8px;border-radius:10px;font-weight:600}
  #pg-decoder .d-msg{background:rgba(255,255,255,0.03);border-radius:8px;padding:11px;margin-bottom:9px;
    border-left:3px solid var(--primary)}
  #pg-decoder .d-msg-t{color:#93c5fd;font-weight:600;font-size:.84rem;margin-bottom:5px}
  #pg-decoder .d-msg-f{font-size:.83rem;color:var(--text-muted);margin-bottom:3px}
  #pg-decoder .d-msg-f b{color:var(--text)}
  #pg-decoder .d-fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
  #pg-decoder .d-fbtn{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;
    padding:9px 6px;font-size:.78rem;text-align:center;cursor:pointer;color:var(--primary);font-weight:600;
    font-family:ui-monospace,Menlo,monospace;word-break:break-all}
  #pg-decoder .d-fbtn:active{background:rgba(99,102,241,0.15)}
  #pg-decoder .d-sbtn{width:100%;margin-top:12px;padding:11px;border-radius:9px;border:1px solid var(--primary);
    background:rgba(99,102,241,0.12);color:var(--primary);font-size:.87rem;font-weight:600;cursor:pointer}
  #pg-decoder textarea{width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--border);
    background:rgba(255,255,255,0.04);color:#fff;font-size:14px;margin-bottom:12px;min-height:110px;
    font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.55;resize:vertical}
  #pg-decoder textarea:focus{outline:none;border-color:var(--primary)}
  #pg-decoder .d-run{width:100%;padding:13px;border-radius:10px;border:none;background:var(--primary);
    color:#fff;font-size:.95rem;font-weight:600;cursor:pointer}
  #pg-decoder .banner{padding:12px 14px;border-radius:10px;margin-bottom:14px;font-size:.87rem;
    display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  #pg-decoder .banner.ok{background:rgba(74,222,128,.1);border:1px solid #166534;color:var(--success)}
  #pg-decoder .banner.err{background:rgba(248,113,113,.1);border:1px solid #7f1d1d;color:var(--danger)}
  #pg-decoder .banner.info{background:rgba(99,102,241,0.1);border:1px solid #1e40af;color:#93c5fd}
  #pg-decoder .banner.warn{background:rgba(251,191,36,.08);border:1px solid #854d0e;color:#fbbf24}
  #pg-decoder .banner .mono{color:var(--text-muted)}
  #pg-decoder .banner details{width:100%;margin-top:6px}
  #pg-decoder .cp{padding:3px 10px;font-size:.72rem;border-radius:8px;border:1px solid var(--border);
    background:rgba(255,255,255,0.04);color:var(--text);cursor:pointer;font-weight:400}
  #pg-decoder details{margin-top:9px;background:rgba(0,0,0,0.35);border-radius:8px;padding:7px 11px}
  #pg-decoder summary{color:var(--text-muted);font-size:.82rem;cursor:pointer;outline:none;list-style:none}
  #pg-decoder summary::-webkit-details-marker{display:none}
  #pg-decoder summary::before{content:'▸ ';}
  #pg-decoder pre{margin-top:7px;font-size:.74rem;color:#9ca3af;white-space:pre-wrap;word-break:break-all;
    font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.5}
  #pg-decoder .spin{display:inline-block;width:13px;height:13px;border:2px solid var(--primary);
    border-top-color:transparent;border-radius:50%;animation:dsp .8s linear infinite;
    vertical-align:-2px;margin-right:6px}
  @keyframes dsp{to{transform:rotate(360deg)}}
  #pg-decoder .d-bcard{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;
    padding:11px;margin-bottom:8px}
  #pg-decoder .d-bh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:5px}
  #pg-decoder .d-bs{font-size:.79rem;color:var(--text-muted);word-break:break-all}
  #pg-decoder .d-s{font-size:.7rem;padding:2px 8px;border-radius:10px;font-weight:700;flex:none}
  #pg-decoder .d-s.ok{background:rgba(74,222,128,.15);color:var(--success)}
  #pg-decoder .d-s.bad{background:rgba(248,113,113,.15);color:var(--danger)}
  #pg-decoder .d-s.err{background:rgba(251,191,36,.15);color:#fbbf24}
  #pg-decoder .d-welcome{text-align:center;padding:44px 16px;color:var(--text-muted)}
  #pg-decoder .d-wico{font-size:3rem;opacity:.18;margin-bottom:14px}
  #pg-decoder .d-welcome p{font-size:.92rem;line-height:2}
  #pg-decoder .d-welcome b{color:var(--primary)}
  `;

  /* ------------------------------------------------ render */
  function render() {
    return `
    <style>${STYLE}</style>
    <div id="pg-decoder">
      <div class="d-card">
        <div class="d-ct">${esc(dcPt('title'))}</div>
        <div class="d-sbar">
          <input type="text" id="dq" placeholder="${esc(dcPt('searchPh'))}" autocomplete="off" spellcheck="false">
          <button id="dSearchBtn">${esc(dcPt('decodeBtn'))}</button>
          <button class="d-xbtn" id="dClearBtn" title="${esc(dcPt('clearTitle'))}">✕</button>
        </div>
        <div class="d-pills" id="dDemoPills"></div>
      </div>

        <div class="d-pills">
          <div class="d-pill on" data-dtool="decode">${esc(dcPt('tabDecode'))}</div>
          <div class="d-pill" data-dtool="sandbox">${esc(dcPt('tabSandbox'))}</div>
          <div class="d-pill" data-dtool="batch">${esc(dcPt('tabBatch'))}</div>
          <div class="d-pill" data-dtool="diagnose">${esc(dcPt('tabDiagnose'))}</div>
        </div>
        <div class="d-pills" style="margin-top:10px">
          <div class="d-pill" id="dJumpBalance">${esc(dcPt('jumpBalance'))}</div>
          <div class="d-pill" id="dJumpRedelegate">${esc(dcPt('jumpRedelegate'))}</div>
          <div class="d-pill" id="dJumpValidator">${esc(dcPt('jumpValidator'))}</div>
          <div class="d-pill" id="dJumpProposal">${esc(dcPt('jumpProposal'))}</div>
        </div>

      <div class="d-panel on" id="dpanel-decode"><div id="dOut"></div></div>

      <div class="d-panel" id="dpanel-sandbox">
        <div class="d-card">
          <div class="d-hint">${esc(dcPt('sandboxHint'))}</div>
          <div class="d-row"><span>${esc(dcPt('contractAddr'))}</span></div>
          <input type="text" id="dSbAddr" placeholder="paxi1..." style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;font-family:ui-monospace,Menlo,monospace">
          <div class="d-row"><span>${esc(dcPt('queryJson'))}</span></div>
          <textarea id="dSbMsg" placeholder='{"token_info":{}}'></textarea>
          <button class="d-run" id="dSbRun">${esc(dcPt('runQuery'))}</button>
          <button class="cp" id="dSbClear" style="width:100%;margin-top:8px;padding:9px">${esc(dcPt('clear'))}</button>
          <div id="dSbOut" style="margin-top:14px"></div>
        </div>
      </div>

      <div class="d-panel" id="dpanel-batch">
        <div class="d-card">
          <div class="d-hint">${esc(dcPt('batchHint'))}</div>
          <textarea id="dBtIn" placeholder="A1B2...&#10;C3D4..."></textarea>
          <button class="d-run" id="dBtRun">${esc(dcPt('runBatchBtn'))}</button>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
            <span class="d-hint" style="margin:0" id="dBtProg"></span>
            <button class="cp" id="dBtCsv" style="display:none">${esc(dcPt('exportCsvBtn'))}</button>
          </div>
          <div id="dBtOut" style="margin-top:12px"></div>
        </div>
      </div>

      <div class="d-panel" id="dpanel-diagnose">
        <div class="d-card">
          <div class="d-hint">${esc(dcPt('diagHint'))}</div>
          <input type="text" id="dDgIn" placeholder="${esc(dcPt('failHashPh'))}" style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;font-family:ui-monospace,Menlo,monospace;margin-bottom:12px">
          <button class="d-run" id="dDgRun">${esc(dcPt('diagBtn'))}</button>
          <div id="dDgOut" style="margin-top:14px"></div>
        </div>
      </div>

      <div class="d-card" style="margin-top:4px">
        <div class="d-hint" style="margin:0">${esc(dcPt('footer'))}</div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------ render: tx */
  function renderTx(data, tokens) {
    const out = document.getElementById('dOut');
    const txr = data.tx_response || data;
    const tx = data.tx || txr.tx || {};
    const msgs = (tx.body && tx.body.messages) || [];
    const ok = txr.code === 0 || txr.code === '0';
    const flows = D.extractFlows(txr);

    let feeStr = '', feePayer = flows.feePayer || '';
    if (tx.auth_info && tx.auth_info.fee && tx.auth_info.fee.amount) {
      feeStr = tx.auth_info.fee.amount.map(a => D.fmtCoin(a.amount, a.denom)).join(' + ');
      if (tx.auth_info.fee.payer) feePayer = tx.auth_info.fee.payer;
    } else if (flows.fee) {
      feeStr = flows.fee;
    }

    let html = '';

    let rootCause = '';
    if (!ok && txr.raw_log) {
      for (const [re, txt] of DIAG) if (re.test(txr.raw_log)) { rootCause = txt; break; }
    }
    const relTime = D.timeAgo(txr.timestamp);
    html += `<div class="banner ${ok ? 'ok' : 'err'}">
      ${ok ? dcPt('txOk') : dcPt('txFail') + (rootCause ? dcPt('txFailCause', esc(rootCause)) : ' · code ' + esc(txr.code))}
      <span class="mono">${esc(dcPt('height', txr.height))}</span>
      <span class="mono">${esc(txr.timestamp || '')}</span>
      ${relTime ? `<span class="mono">${esc(dcPt('paren', relTime))}</span>` : ''}
    </div>`;

    const memo = (tx.body && tx.body.memo) || '';
    html += `<div class="d-story">
      <div class="d-story-h">${esc(dcPt('storyTitle'))}</div>
      <div class="d-story-b">${D.buildStory(txr, msgs, flows, tokens)}${memo ? '\n' + dcPt('memo', esc(memo)) : ''}</div>
    </div>`;

    html += `<div class="d-card">
      <div class="d-ct">${esc(dcPt('feeTitle'))}</div>
      <div class="d-row"><span>${esc(dcPt('amount'))}</span><b>${esc(feeStr || '—')}</b></div>
      <div class="d-row"><span>${esc(dcPt('feePayer'))}</span>${
        feePayer ? `<span class="d-lnk mono" data-addr="${esc(feePayer)}">${esc(D.shortAddr(feePayer))}</span>` : '—'}</div>
      <div class="d-row"><span>Gas</span><b>${esc(txr.gas_used || '?')} / ${esc(txr.gas_wanted || '?')}</b></div>
      <div class="d-row"><span>${esc(dcPt('txHash'))}</span><span class="mono" style="font-size:.72rem;word-break:break-all">${esc(txr.txhash || '')}</span>
        <button class="cp" data-copy="${esc(txr.txhash || '')}">${esc(dcPt('copy'))}</button></div>
      <div class="d-row"><span>${esc(dcPt('sharePage'))}</span><button class="cp" data-copy="${
        esc(location.href.split('?')[0] + '?tool=decoder&hash=' + (txr.txhash || ''))}">${esc(dcPt('copyLink'))}</button></div>
    </div>`;

    if (flows.native.length) {
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('nativeDelta'))}</div>`;
      for (const d of flows.native) {
        const pos = d.delta > 0n;
        html += `<div class="d-delta ${pos ? 'pos' : 'neg'}">
          <div>${pos ? esc(dcPt('received')) : esc(dcPt('sent'))} <span class="d-lnk mono" data-addr="${esc(d.address)}">${esc(D.shortAddr(d.address))}</span></div>
          <div class="amt">${pos ? '+' : '-'}${esc(D.fmtCoin(d.delta < 0n ? -d.delta : d.delta, d.denom))}</div>
        </div>`;
      }
      html += `</div>`;
    }

    if (flows.contract.length) {
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('contractFlows'))}</div>`;
      for (const c of flows.contract) {
        const info = tokens && tokens[c.contract];
        const amtStr = info
          ? `${esc(D.formatToken(c.amount, info))}（${esc(c.amount)}）`
          : esc(c.amount || '');
        html += `<div class="d-cflow">
          <div class="d-cf-h"><span class="d-tag">${esc(c.kind)}</span>
            ${c.contract ? `<span class="d-lnk mono" style="font-size:.72rem" data-addr="${esc(c.contract)}">${esc(D.shortAddr(c.contract))}</span>` : ''}</div>
          ${c.from ? `<div>${esc(dcPt('from'))}<span class="d-lnk mono" data-addr="${esc(c.from)}">${esc(D.shortAddr(c.from))}</span></div>` : ''}
          ${c.to ? `<div>${esc(dcPt('to'))}<span class="d-lnk mono" data-addr="${esc(c.to)}">${esc(D.shortAddr(c.to))}</span></div>` : ''}
          <div class="d-cf-a">${esc(dcPt('qty'))}<b>${amtStr || (c.tokenId ? '#' + esc(c.tokenId) : '—')}</b></div>
        </div>`;
      }
      html += `</div>`;
    }

    if (msgs.length) {
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('msgsTitle', msgs.length))}</div>`;
      msgs.forEach((m, i) => {
        const info = D.readMsg(m);
        html += `<div class="d-msg">
          <div class="d-msg-t">${i + 1}. ${esc(D.labelOf(info.type))}
            <span class="mono" style="font-size:.7rem">${esc(info.type)}</span></div>
          <div class="d-msg-f">${esc(dcPt('sender'))}<span class="d-lnk mono" data-addr="${esc(info.from)}">${esc(D.shortAddr(info.from))}</span></div>`;
        if (info.type === '/cosmwasm.wasm.v1.MsgExecuteContract') {
          const c = D.decodeContractMsg(m);
          if (c.action) {
            html += `<div class="d-msg-f">${esc(dcPt('execMethod'))}<b>${esc(c.action)}</b>
              ${c.contract ? ` · ${esc(dcPt('contractOf'))}<span class="d-lnk mono" data-addr="${esc(c.contract)}">${esc(D.shortAddr(c.contract))}</span>` : ''}</div>`;
            html += `<details><summary>${esc(dcPt('viewArgs'))}</summary><pre>${esc(clip(JSON.stringify(c.args, null, 2)))}</pre></details>`;
          }
        }
        html += `<details><summary>${esc(dcPt('rawMsg'))}</summary><pre>${esc(clip(JSON.stringify(m, null, 2)))}</pre></details>
        </div>`;
      });
      html += `</div>`;
    }

    if (!ok && txr.raw_log) {
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('failLog'))}</div>
        <details open><summary>raw_log</summary><pre>${esc(clip(txr.raw_log))}</pre></details></div>`;
    }

    out.innerHTML = html;
  }

  /* ------------------------------------------------ token precision backfill */
  async function enrichTokens(contracts) {
    const tokens = {};
    for (const c of [...new Set(contracts)]) {
      if (!c) continue;
      if (tokenCache.has(c)) { tokens[c] = tokenCache.get(c); continue; }
      try {
        const r = await D.getJSON(
          `${D.LCD}/cosmwasm/wasm/v1/contract/${c}/smart/${D.getB64('{"token_info":{}}')}`, 8000);
        const ti = r.data;
        if (ti && ti.symbol !== undefined) {
          tokens[c] = { symbol: ti.symbol || '', decimals: Number(ti.decimals) || 0, name: ti.name || '' };
          tokenCache.set(c, tokens[c]);
        }
      } catch (_) { /* non-token contracts (e.g. NFT) fail token_info lookup; skip */ }
    }
    return tokens;
  }

  /* ------------------------------------------------ render: address/contract */
  async function renderAddress(addr) {
    const my = ++seq;
    const out = document.getElementById('dOut');
    out.innerHTML = `<div class="banner info"><span class="spin"></span>${esc(dcPt('queryingChain'))}</div>`;

    let info = null, codeInfo = null;
    try {
      const r = await D.getJSON(`${D.LCD}/cosmwasm/wasm/v1/contract/${addr}`, 12000);
      info = r.contract_info;
    } catch (_) {}
    if (my !== seq) return;

    let html = '';

    if (info) {
      try {
        const cr = await D.getJSON(`${D.LCD}/cosmwasm/wasm/v1/code/${info.code_id}`, 12000);
        codeInfo = cr.code_info;
      } catch (_) {}
      if (my !== seq) return;

      let schema = schemaCache.get(addr);
      if (!schema) {
        schema = await D.probeSchema(addr);
        schemaCache.set(addr, schema);
      }
      if (my !== seq) return;
      const kind = D.classify(info, schema);

      html += `<div class="banner ok">${esc(dcPt('isContract'))}</div>`;
      html += `<div class="d-card">
        <div class="d-ct">${esc(dcPt('profile'))}</div>
        <div class="d-row"><span>${esc(dcPt('label'))}</span><b>${esc(info.label || '—')}</b></div>
        <div class="d-row"><span>${esc(dcPt('kind'))}</span><b>${esc(kind)}</b></div>
        <div class="d-row"><span>Code ID</span><b class="mono">${esc(info.code_id)}</b></div>
        <div class="d-row"><span>${esc(dcPt('creator'))}</span>${
          codeInfo && codeInfo.creator
            ? `<span class="d-lnk mono" data-addr="${esc(codeInfo.creator)}">${esc(D.shortAddr(codeInfo.creator))}</span>`
            : '—'}</div>
        <div class="d-row"><span>${esc(dcPt('admin'))}</span>${
          info.admin
            ? `<span class="d-lnk mono" data-addr="${esc(info.admin)}">${esc(D.shortAddr(info.admin))}</span>${esc(dcPt('upgradable'))}`
            : esc(dcPt('noAdmin'))}</div>
        <div class="d-row"><span>${esc(dcPt('createdHeight'))}</span><b>${esc(info.created ? info.created.block_height : '—')}</b></div>
        <div class="d-row"><span>${esc(dcPt('contractAddr'))}</span><span class="mono" style="font-size:.72rem;word-break:break-all">${esc(addr)}</span>
          <button class="cp" data-copy="${esc(addr)}">${esc(dcPt('copy'))}</button></div>
      </div>`;

      if (kind.startsWith('PRC-20')) {
        try {
          const r = await D.getJSON(
            `${D.LCD}/cosmwasm/wasm/v1/contract/${addr}/smart/${D.getB64('{"token_info":{}}')}`, 8000);
          const ti = r.data;
          if (ti && ti.symbol !== undefined) {
            if (my !== seq) return;
            let supply = '';
            if (ti.total_supply !== undefined) {
              try {
                supply = `<div class="d-row"><span>${esc(dcPt('totalSupply'))}</span><b>${esc(D.formatToken(ti.total_supply, ti))}</b></div>`;
              } catch (_) { supply = `<div class="d-row"><span>${esc(dcPt('totalSupply'))}</span><b>${esc(ti.total_supply)}</b></div>`; }
            }
            html += `<div class="d-card">
              <div class="d-ct">${esc(dcPt('tokenInfo'))}</div>
              <div class="d-row"><span>${esc(dcPt('name'))}</span><b>${esc(ti.name || '—')}</b></div>
              <div class="d-row"><span>${esc(dcPt('symbol'))}</span><b>${esc(ti.symbol || '—')}</b></div>
              <div class="d-row"><span>${esc(dcPt('decimals'))}</span><b>${esc(ti.decimals ?? '—')}</b></div>
              ${supply}
            </div>`;
            tokenCache.set(addr, { symbol: ti.symbol, decimals: Number(ti.decimals) || 0, name: ti.name || '' });
          }
        } catch (_) {}
      }

      const srcText = schema.source === 'schema-echo' ? dcPt('srcEcho')
        : schema.source === 'known-probe' ? dcPt('srcProbe')
        : schema.source === 'no-echo' ? dcPt('srcNoEcho') : dcPt('srcErr');
      html += `<div class="d-card">
        <div class="d-ct">${esc(dcPt('queryFeatures'))}<span class="src">${esc(srcText)}</span></div>`;

      if (schema.methods && schema.methods.length) {
        html += `<div class="d-hint">${esc(dcPt('methodsFound', schema.methods.length))}
        <div class="d-fgrid">`;
        for (const m of schema.methods) {
          html += `<div class="d-fbtn" data-cmd='${esc(JSON.stringify(D.templateFor(m)))}'>${esc(m)}</div>`;
        }
        html += `</div>`;
      } else {
        html += `<div class="d-hint">${esc(dcPt('noMethods'))}</div>`;
      }
      html += `<button class="d-sbtn" id="dGoSandbox">${esc(dcPt('openSandbox'))}</button>
      </div>`;
    }

    try {
      const bank = await D.getJSON(`${D.LCD}/cosmos/bank/v1beta1/balances/${addr}`, 12000);
      if (my !== seq) return;
      const bals = bank.balances || [];
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('nativeBalance'))}</div>`;
      if (!bals.length) html += `<div class="d-hint">${esc(dcPt('noBalance'))}</div>`;
      else for (const b of bals) {
        html += `<div class="d-row"><span>${esc(b.denom.toUpperCase())}</span><b>${esc(D.fmtCoin(b.amount, b.denom))}</b></div>`;
      }
      html += `</div>`;
    } catch (_) {}

    if (!info) {
      const book = loadBook();
      const cur = book[addr] || '';
      html += `<div class="d-card"><div class="d-ct">${esc(dcPt('localNote'))}</div>
        <div class="d-row"><span>${esc(dcPt('noteName'))}</span><b>${cur ? esc(cur) : esc(dcPt('notSet'))}</b></div>
        <div class="d-row"><span>${esc(dcPt('address'))}</span><span class="mono" style="font-size:.72rem;word-break:break-all">${esc(addr)}</span>
          <button class="cp" data-copy="${esc(addr)}">${esc(dcPt('copy'))}</button></div>
        <button class="d-sbtn" id="dNoteBtn">🏷️ ${cur ? esc(dcPt('editNote')) : esc(dcPt('addNote'))}${esc(dcPt('noteName'))}</button></div>`;
    }

    out.innerHTML = html;

    out.querySelectorAll('.d-fbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        let cmd = btn.getAttribute('data-cmd');
        try { cmd = JSON.stringify(JSON.parse(cmd), null, 2); } catch (_) {}
        gotoSandbox(addr, cmd);
      });
    });
    const goSb = document.getElementById('dGoSandbox');
    if (goSb) goSb.addEventListener('click', () => gotoSandbox(addr, '{\n  \n}'));
    const noteBtn = document.getElementById('dNoteBtn');
    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        const book = loadBook();
        const cur = book[addr] || '';
        const name = prompt(dcPt('notePrompt'), cur);
        if (name === null) return;
        const trimmed = name.trim().slice(0, 24);
        if (trimmed) book[addr] = trimmed; else delete book[addr];
        saveBook(book);
        renderAddress(addr);
      });
    }
  }

  /* ------------------------------------------------ search routing */
  async function doSearch() {
    const val = document.getElementById('dq').value.trim();
    if (!val) return;
    if (/^(paxi1)[0-9a-z]{20,}$/i.test(val)) return renderAddress(val);
    if (/^[0-9A-Fa-f]{64}$/.test(val)) return renderTxByHash(val);

    document.getElementById('dOut').innerHTML =
      `<div class="banner err">${esc(dcPt('unknownInput'))}
        <div class="d-hint">${dcPt('inputHint')}</div></div>`;
  }

  async function renderTxByHash(hash) {
    const my = ++seq;
    const out = document.getElementById('dOut');
    out.innerHTML = `<div class="banner info"><span class="spin"></span>${esc(dcPt('parsingTx', D.shortAddr(hash)))}</div>`;
    let data;
    try {
      data = await D.getJSON(`${D.LCD}/cosmos/tx/v1beta1/txs/${hash}`);
    } catch (e) {
      if (my !== seq) return;
      out.innerHTML = `<div class="banner warn">${esc(dcPt('netErr', e.message))}
        ${e.body ? `<details><summary>${esc(dcPt('nodeReturn'))}</summary><pre>${esc(clip(e.body))}</pre></details>` : ''}
        <div class="d-hint">${esc(dcPt('netErrHint'))}</div></div>`;
      return;
    }
    if (my !== seq) return;

    const flows = D.extractFlows(data.tx_response || data);
    const contracts = flows.contract.map(c => c.contract);
    for (const m of (data.tx && data.tx.body && data.tx.body.messages) || []) {
      if ((m['@type'] || '').endsWith('.MsgExecuteContract')) {
        const c = D.decodeContractMsg(m);
        if (c.contract) contracts.push(c.contract);
      }
    }
    const tokens = await enrichTokens(contracts);
    if (my !== seq) return;

    renderTx(data, tokens);
  }

  /* ------------------------------------------------ sandbox */
  function gotoSandbox(addr, cmd) {
    switchDPanel('sandbox');
    document.getElementById('dSbAddr').value = addr || '';
    document.getElementById('dSbMsg').value = cmd || '{\n  \n}';
    window.scrollTo(0, 0);
  }

  async function runSandbox() {
    const addr = document.getElementById('dSbAddr').value.trim();
    const raw = document.getElementById('dSbMsg').value.trim();
    const out = document.getElementById('dSbOut');
    if (!/^paxi1[0-9a-z]{20,}$/i.test(addr)) {
      out.innerHTML = `<div class="banner err">${esc(dcPt('badAddr'))}</div>`;
      return;
    }
    if (!raw) { out.innerHTML = `<div class="banner err">${esc(dcPt('noJson'))}</div>`; return; }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      out.innerHTML = `<div class="banner err">${esc(dcPt('jsonErr', e.message))}</div>`;
      return;
    }
    out.innerHTML = `<div class="banner info"><span class="spin"></span>${esc(dcPt('queryingNode'))}</div>`;
    try {
      const url = `${D.LCD}/cosmwasm/wasm/v1/contract/${addr}/smart/${D.getB64(JSON.stringify(parsed))}`;
      const res = await D.getJSON(url);
      out.innerHTML = `<div class="banner ok">${esc(dcPt('queryOk'))}</div>
        <div class="d-card"><pre style="color:#e2e8f0;margin:0">${esc(clip(JSON.stringify(res.data !== undefined ? res.data : res, null, 2)))}</pre></div>`;
    } catch (e) {
      let tip = '';
      const body = e.body || '';
      const m = body.match(/unknown variant\s+\S+,\s*expected one of\s*:?\s*(.+)$/s);
      if (m) {
        const list = [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1]);
        tip = `<div class="d-hint">${esc(dcPt('realMethods'))}
          <span class="d-lnk" data-cmd='${esc(JSON.stringify(list))}'>${esc(dcPt('expandAll', list.length))}</span></div>`;
      } else if (/no such contract/i.test(body)) {
        tip = `<div class="d-hint">${esc(dcPt('notContract'))}</div>`;
      }
      out.innerHTML = `<div class="banner err">${esc(dcPt('queryFail', e.message))}</div>${tip}
        ${body ? `<details><summary>${esc(dcPt('nodeRaw'))}</summary><pre>${esc(clip(body))}</pre></details>` : ''}`;
      const l = out.querySelector('.d-lnk[data-cmd]');
      if (l) l.addEventListener('click', () => {
        const list = JSON.parse(l.getAttribute('data-cmd'));
        out.insertAdjacentHTML('beforeend',
          `<div class="d-card"><div class="d-ct">${esc(dcPt('realMethodsTitle'))}</div><div class="d-fgrid">${
            list.map(x => `<div class="d-fbtn" data-cmd='${esc(JSON.stringify(D.templateFor(x)))}'>${esc(x)}</div>`).join('')
          }</div></div>`);
        out.querySelectorAll('.d-fbtn').forEach(b2 => b2.addEventListener('click', () => {
          let c = b2.getAttribute('data-cmd');
          try { c = JSON.stringify(JSON.parse(c), null, 2); } catch (_) {}
          document.getElementById('dSbMsg').value = c;
          window.scrollTo(0, 0);
        }));
      });
    }
  }

  /* ------------------------------------------------ batch decode */
  const BATCH_MAX = 200;
  async function runBatch() {
    const raw = document.getElementById('dBtIn').value.trim();
    if (!raw) return;
    let hashes = raw.split(/[\s,;]+/).filter(s => /^[0-9A-Fa-f]{64}$/.test(s));
    if (!hashes.length) {
      document.getElementById('dBtOut').innerHTML =
        `<div class="banner err">${esc(dcPt('noValidHash'))}</div>`;
      return;
    }
    if (hashes.length > BATCH_MAX) {
      hashes = hashes.slice(0, BATCH_MAX);
      document.getElementById('dBtOut').innerHTML =
        `<div class="banner info">${esc(dcPt('overLimit', BATCH_MAX))}</div>`;
    }
    const rows = [];
    for (let i = 0; i < hashes.length; i++) {
      const h = hashes[i];
      document.getElementById('dBtProg').textContent = dcPt('parsing', i + 1, hashes.length);
      let status = dcPt('stOk'), stCls = 'ok', detail = '', kind = '', send = '', recv = '';
      try {
        const data = await D.getJSON(`${D.LCD}/cosmos/tx/v1beta1/txs/${h}`, 20000);
        const txr = data.tx_response;
        const tx = data.tx || txr.tx || {};
        const msgs = (tx.body && tx.body.messages) || [];
        const flows = D.extractFlows(txr);
        if (!(txr.code === 0 || txr.code === '0')) { status = dcPt('stFail'); stCls = 'bad'; }
        kind = msgs.length ? D.labelOf(msgs[0]['@type']) : '—';
        const f = flows.native.filter(d => d.delta !== 0n);
        if (f.length >= 2) {
          const s = f.find(x => x.delta < 0n), r = f.find(x => x.delta > 0n);
          send = D.shortAddr(s.address); recv = D.shortAddr(r.address);
          detail = D.fmtCoin(s.delta < 0n ? -s.delta : s.delta, s.denom);
        } else if (flows.contract.length) {
          send = D.shortAddr(flows.contract[0].from); recv = D.shortAddr(flows.contract[0].to);
          detail = flows.contract[0].amount || ('#' + flows.contract[0].tokenId);
        }
        rows.push({ h, status, kind, send, recv, detail });
      } catch (e) {
        status = dcPt('stQueryFail'); stCls = 'err';
        rows.push({ h, status, kind: '—', send: '', recv: '', detail: e.message });
      }
      document.getElementById('dBtOut').insertAdjacentHTML('beforeend',
        `<div class="d-bcard"><div class="d-bh"><span class="d-s ${stCls}">${esc(status)}</span>
          <span class="d-lnk mono" data-h="${esc(h)}" style="font-size:.75rem">${esc(D.shortAddr(h))}</span></div>
          <div class="d-bs">${esc(kind)}${detail ? ` · ${esc(send)} → ${esc(recv)} · ${esc(detail)}` : ''}</div></div>`);
    }
    document.getElementById('dBtProg').textContent = dcPt('done', hashes.length);
    const csvBtn = document.getElementById('dBtCsv');
    csvBtn.dataset.rows = JSON.stringify(rows);
    csvBtn.style.display = 'inline-block';
    document.getElementById('dBtOut').querySelectorAll('.d-lnk[data-h]').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('dq').value = el.dataset.h;
        switchDPanel('decode');
        doSearch();
      });
    });
  }

  function exportCsv() {
    const rows = JSON.parse(document.getElementById('dBtCsv').dataset.rows || '[]');
    const head = ['txhash', 'status', 'action', 'from', 'to', 'amount'];
    /* formula-injection guard: Excel treats values starting with =+-@ as formulas; prepend a single quote to neutralize */
    const safe = (v) => /^[=+\-@]/.test(String(v || '')) ? "'" + v : (v || '');
    const csv = [head.join(',')].concat(
      rows.map(r => [r.h, r.status, r.kind, r.send, r.recv, r.detail].map(x => `"${safe(String(x || '').replace(/"/g, '""'))}"`).join(','))
    ).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'paxi_batch_decode.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ------------------------------------------------ failure diagnosis */
  const DIAG = [
    [/insufficient funds/i, 'd1'],
    [/out of gas/i, 'd2'],
    [/wasm contract failed/i, 'd3'],
    [/Unauthorized|unauthorized/i, 'd4'],
    [/already exists/i, 'd5'],
    [/not found|not exist/i, 'd6'],
    [/invalid|parse error|unknown variant/i, 'd7'],
    [/duplicate|sequence mismatch/i, 'd8'],
    [/timed out waiting|tx already in cache/i, 'd9'],
    [/denom|decimals/i, 'd10'],
  ];

  async function runDiagnose() {
    const h = document.getElementById('dDgIn').value.trim();
    const out = document.getElementById('dDgOut');
    if (!/^[0-9A-Fa-f]{64}$/.test(h)) { out.innerHTML = `<div class="banner err">${esc(dcPt('needHash'))}</div>`; return; }
    out.innerHTML = `<div class="banner info"><span class="spin"></span>${esc(dcPt('diagnosing'))}</div>`;
    let data;
    try {
      data = await D.getJSON(`${D.LCD}/cosmos/tx/v1beta1/txs/${h}`);
    } catch (e) {
      out.innerHTML = `<div class="banner warn">${esc(dcPt('netErr2', e.message))}</div>`;
      return;
    }
    const txr = data.tx_response;
    const tx = data.tx || txr.tx || {};
    if (txr.code === 0 || txr.code === '0') {
      out.innerHTML = `<div class="banner ok">${esc(dcPt('txOkNoDiag'))}</div>`;
      return;
    }
    const log = txr.raw_log || '';
    const tips = [];
    for (const [re, key] of DIAG) if (re.test(log)) tips.push(dcPt(key));
    const fee = (tx.auth_info && tx.auth_info.fee) || {};
    const diag = tips.length
      ? tips.map(t => `<div class="d-hint">• ${esc(t)}</div>`).join('')
      : `<div class="d-hint">${esc(dcPt('noClassify'))}</div>`;

    out.innerHTML = `
      <div class="banner err">${esc(dcPt('txFailCode', txr.code))}</div>
      <div class="d-card">
        <div class="d-ct">${esc(dcPt('diagTitle'))}</div>
        ${diag}
        <div class="d-row" style="margin-top:12px"><span>${esc(dcPt('gasSet'))}</span><b>${esc(fee.gas_limit || '—')}</b></div>
        <div class="d-row"><span>${esc(dcPt('gasUsed'))}</span><b>${esc(txr.gas_used || '0')}</b></div>
        <div class="d-row"><span>${esc(dcPt('feeTitle'))}</span><b>${esc((fee.amount || []).map(a => D.fmtCoin(a.amount, a.denom)).join(' + ') || '—')}</b></div>
        <div class="d-row"><span>${esc(dcPt('codespace'))}</span><b>${esc(txr.codespace || '—')}</b></div>
      </div>
      <div class="d-card"><div class="d-ct">${esc(dcPt('rawLogTitle'))}</div><details open><summary>raw_log</summary><pre>${esc(clip(log))}</pre></details></div>`;
  }

  /* ------------------------------------------------ panel switching and events */
  function switchDPanel(name) {
    document.querySelectorAll('#pg-decoder .d-pill[data-dtool]').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('#pg-decoder .d-panel').forEach(p => p.classList.remove('on'));
    const pill = document.querySelector(`#pg-decoder .d-pill[data-dtool="${name}"]`);
    if (pill) pill.classList.add('on');
    const panel = document.getElementById('dpanel-' + name);
    if (panel) panel.classList.add('on');
  }

  const DEMOS = []; // sample hashes can be added later: {label, hash}

  function welcomeHTML() {
    return `<div class="d-welcome">
      <div class="d-wico">🔍</div>
      <p>${dcPt('welcome')}</p>
    </div>`;
  }

  window.TOOL_REGISTRY['decoder'] = {
    render,
    bind() {
      if (!D) {
        document.getElementById('dOut').innerHTML =
          `<div class="banner err">${esc(dcPt('coreMissing'))}</div>`;
        return;
      }
      D.setAddressBook(loadBook());

      document.getElementById('dSearchBtn').addEventListener('click', doSearch);
      document.getElementById('dq').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
      document.getElementById('dClearBtn').addEventListener('click', () => {
        document.getElementById('dq').value = '';
        document.getElementById('dOut').innerHTML = welcomeHTML();
      });
      document.getElementById('dSbRun').addEventListener('click', runSandbox);
      document.getElementById('dSbClear').addEventListener('click', () => {
        document.getElementById('dSbMsg').value = '';
        document.getElementById('dSbOut').innerHTML = '';
      });
      document.getElementById('dBtRun').addEventListener('click', runBatch);
      document.getElementById('dBtCsv').addEventListener('click', exportCsv);
      document.getElementById('dDgRun').addEventListener('click', runDiagnose);
      document.getElementById('dDgIn').addEventListener('keydown', e => { if (e.key === 'Enter') runDiagnose(); });

      // decoder cross-links: quick-jump to related tools
      [['dJumpBalance','balance-check'], ['dJumpRedelegate','redelegate'], ['dJumpValidator','validator-compare'], ['dJumpProposal','proposal']].forEach(([id, tool]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => { if (typeof navigateToTool === 'function') navigateToTool(tool); });
      });

      document.querySelectorAll('#pg-decoder .d-pill[data-dtool]').forEach(p => {
        p.addEventListener('click', () => switchDPanel(p.dataset.dtool));
      });

      document.getElementById('dDemoPills').innerHTML = DEMOS.map(d =>
        `<div class="d-pill" data-demo="${esc(d.hash)}">${esc(d.label)}</div>`).join('');
      document.querySelectorAll('#dDemoPills [data-demo]').forEach(b => {
        b.addEventListener('click', () => {
          document.getElementById('dq').value = b.dataset.demo;
          doSearch();
        });
      });

      document.getElementById('dOut').innerHTML = welcomeHTML();

      /* event delegation: fixes "copy / address-link clicks unresponsive" (copyText defined but listeners were never bound) */
      const decPage = document.getElementById('pg-decoder');
      if (decPage) {
        decPage.addEventListener('click', async (e) => {
          const cpBtn = e.target.closest('.cp[data-copy]');
          if (cpBtn) {
            const ok = await copyText(cpBtn.getAttribute('data-copy') || '');
            showToast(ok ? dcPt('copied') : dcPt('copyFail'), ok ? 'success' : 'error');
            return;
          }
          const lnk = e.target.closest('.d-lnk[data-addr]');
          if (lnk) {
            const ok = await copyText(lnk.getAttribute('data-addr') || '');
            showToast(ok ? dcPt('addrCopied') : dcPt('copyFail'), ok ? 'success' : 'error');
          }
        });
      }

      /* URL deep-link: ?tool=decoder&hash=xxx or &addr=xxx (clear params after reading to avoid re-query on language-switch re-render) */
      try {
        const params = new URLSearchParams(location.search);
        if ((params.get('tool') || '') === 'decoder') {
          const q0 = params.get('hash') || params.get('addr');
          if (q0) {
            document.getElementById('dq').value = q0;
            doSearch();
            history.replaceState(null, '', location.pathname);
          }
        }
      } catch (_) {}
    },
  };
})();
