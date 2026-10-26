/**
 * @file Core module (language packs, state, wallet, home)
 */

// ============================================================
// Language packs
// ============================================================
const LANG = {
  en: {
    appTitle: 'Paxi Lens',
    back: '← Back',
    tools: {
      decoder: 'On-chain Decoder',
      batchTransfer: 'Batch Transfer',
      balanceCheck: 'Balance / Batch Query',
      pump: 'Custom Issuance',
      burn: 'Token Burner',
      nftMarket: 'NFT Market',
      txTracker: 'Tx Tracker',
      nftLauncher: 'NFT Launcher',
      myNfts: 'My NFTs',
      addressConvert: 'Address Convert',
      redelegate: 'Change Validator',
      gasCalc: 'Gas Calc',
      validatorCompare: 'Validators',
      proposal: 'Gov Proposal',
      games: 'Game Center',
      monitor: 'Chain Monitor',
      later: 'Coming Soon…',
      claimRewards: 'Claim Rewards',
      govVote: 'Governance Vote',
      stakeManage: 'Delegate/Undelegate',
      addressBook: 'Address Book',
      ibcQuery: 'IBC Query',
      txDryRun: 'Tx Dry-run',
      swap: 'Swap Helper',
      allowance: 'Allowances',
      catStake: 'Staking & Governance',
      catAssets: 'Assets & Query',
      catTrade: 'Trade & Issuance',
      catTools: 'Decoder & Tools',
      searchPlaceholder: 'Search tools...'
    },
    batchTransfer: {
      title: '📤 Batch Transfer',
      desc: 'Batch send PAXI, PRC-20, or NFT. Supports CSV import and uniform amounts.',
      modePack: '⚡ Packed mode: all transfers + fee in 1 tx, 1 signature, 100% success.',
      note: '💡 If recipient wallet doesn\'t show records, check "Transfer Records" in Balance Query.',
      native: 'PAXI Native',
      prc20: 'PRC-20 Token',
      nft: 'NFT (PRC-721)',
      csvMode: '📋 CSV Import (different amounts)',
      uniformMode: '🔄 Uniform Amount',
      upload: 'Click or drag CSV here',
      format: 'Format: address,amount (one per line)',
      pastePlaceholder: 'paxi1abc123...,100\npaxi1def456...,250',
      uniformPlaceholder: 'paxi1abc123...\npaxi1def456...',
      parseBtn: '📋 Parse & Preview',
      sendBtn: '🚀 Execute Batch Transfer',
      clearBtn: 'Clear',
      preview: '📋 Transfer Preview',
      history: '📜 Recent Transfers'
    },
    balanceCheck: {
      title: '💰 Balance / Batch Query',
      desc: 'Paste multiple Paxi addresses to query PAXI balances and PRC-20 holdings.',
      placeholder: 'paxi1abc123...\npaxi1def456...',
      queryBtn: '🔍 Query Balances',
      exportBtn: '📥 Export CSV',
      querying: 'Querying {count} addresses...',
      done: '✅ Done: {count} addresses',
      noAddr: 'No valid Paxi addresses',
      records: '📜 Transfer Records'
    },
    txTracker: {
      title: '🔍 Tx Tracker',
      desc: 'Enter TxHash to check transaction status and details.',
      placeholder: 'Enter TxHash...',
      queryBtn: '🔍 Query'
    },
    gasCalc: {
      title: '⛽ Gas Calculator',
      desc: 'Estimate gas fees for different transaction types.',
      type: 'Tx Type',
      send: 'Transfer (MsgSend)',
      prc20: 'PRC-20 Transfer',
      nft: 'NFT Transfer',
      swap: 'AMM Swap',
      stake: 'Stake/Delegate',
      vote: 'Governance Vote',
      price: 'Gas Price (upaxi)',
      calcBtn: '🧮 Calculate'
    },
    addressConvert: {
      title: '🔄 Address Convert',
      desc: 'Convert between Bech32 prefixes for different Cosmos chains.',
      inputPlaceholder: 'paxi1... or cosmos1... or osmosis1...',
      target: 'Target Prefix',
      convertBtn: '🔄 Convert'
    },
    validatorCompare: {
      title: '🏦 Validator Compare',
      desc: 'View APR, commission, voting power, and status of all active validators.',
      loadBtn: '🔄 Load Validators',
      loading: 'Loading...',
      done: '✅ Loaded: {count} validators'
    },
    tokenInfo: {
      title: '🪙 PRC-20 Token Info',
      desc: 'Query token name, symbol, total supply, decimals from PRC-20 contract.',
      placeholder: 'paxi1...',
      queryBtn: '🔍 Query'
    },
    nftMarket: {
      title: '🏪 NFT Market',
      desc: 'Decentralized NFT trading via Authz atomic swaps.',
      tabs: ['Browse', 'List', 'My Orders', 'Import']
    },
    redelegate: {
      title: '🔄 Redelegate',
      desc: 'Switch validator instantly, no 7-day unbonding. Service fee: 0.15% (1.5‰).',
      hint: 'Select your current validator, then target validator, enter amount to migrate.',
      from: 'From (current validator)',
      to: 'To (target validator)',
      amount: 'Amount (PAXI)',
      max: 'Max',
      fee: 'Service Fee',
      feeRate: 'Rate',
      execute: '🚀 Redelegate Now',
      selectFrom: 'Select...',
      selectTo: 'Select...',
      success: '✅ Validator changed successfully!',
      fail: '❌ Validator change failed: ',
      invalidInput: 'Please select both validators and amount',
      noDelegations: 'No delegations found'
    },
    proposal: {
      title: '📦 Governance Proposal',
      desc: 'Submit Paxi Network governance proposals. Deposit required, plus service fee.',
      submit: '📝 Submit Proposal',
      type: 'Proposal Type',
      typeText: 'Text Proposal',
      typeParam: 'Parameter Change Proposal',
      typePool: '🏦 Community Pool Spend (DAO Funding Request)',
      poolBlockTitle: '🏦 Community Pool Spend (CommunityPoolSpendProposal)',
      poolDesc: 'If the proposal passes, the community pool transfers the specified amount of PAXI to the recipient address (DAO funding request).',
      poolTip: '💡 Funding request notes: title and summary are public to all token holders voting. State the purpose, budget breakdown, milestones and delivery timeline in the description; use your project treasury address as recipient.',
      poolRecipient: 'Recipient address (recipient)',
      poolAmount: 'Spend amount (PAXI)',
      poolBalance: '💰 On-chain community pool balance: ',
      poolBalanceLoading: 'Querying on-chain community pool balance...',
      poolBalanceEmpty: 'Community pool is currently empty',
      poolBalanceFail: 'Failed to query community pool balance',
      poolNoRecipient: 'Please fill in the recipient address',
      poolBadRecipient: 'Invalid recipient address format (paxi1...)',
      poolBadAmount: 'Spend amount must be greater than 0',
      poolExceed: 'Spend amount exceeds the on-chain community pool balance',
      badgePool: '🏦 Pool Spend',
      badgeParam: '🔧 Param Change',
      badgeText: '📝 Text',
      badgeUpgrade: '⬆️ Software Upgrade',
      badgeClient: '🔗 IBC Client Recovery',
      confirmSubmitPool: 'Submit community pool spend proposal (DAO funding request)?\n\nAmount: {amount} PAXI\nRecipient: {rcv}\n\nIf passed, the community pool transfers {amount} PAXI to this address.\nService fee {fee} PAXI + deposit {deposit} PAXI.',
      daoTitle: '🏦 DAO Funding Request',
      daoDesc: 'Apply for funding from the community pool (CommunityPoolSpend). If the proposal passes, the pool transfers the amount to the recipient address.',
      daoInfo: '💡 Title and summary are public to all token holders voting. State the purpose, budget breakdown, milestones and delivery timeline; use your project treasury address as recipient.',
      daoLabelTitle: 'Proposal Title',
      daoTitlePlaceholder: 'e.g. Paxi Lens launch + 6-month maintenance funding (300,000 PAXI)',
      daoLabelSummary: 'Proposal Summary (summary)',
      daoSummaryPlaceholder: 'One sentence describing the request and amount…',
      daoLabelDesc: 'Proposal Description (description)',
      daoDescPlaceholder: 'Describe purpose, budget breakdown, milestones and delivery timeline…',
      daoSubmitBtn: 'Submit DAO Funding Request',
      daoNotAllowed: 'Current wallet address is not allowed to submit DAO funding requests',
      daoNoTitle: 'Please fill in the proposal title',
      daoNoSummary: 'Please fill in the proposal summary',
      daoNoDesc: 'Please fill in the proposal description',
      daoSuccess: '✅ DAO funding request submitted! Proposal ID: ',
      paramSubspace: 'Subspace (module)',
      paramKey: 'Key (parameter name)',
      paramValue: 'Value (JSON string)',
      paramValuePH: 'e.g. "0.050000000000000000"',
      addParam: '➕ Add Parameter',
      delParam: 'Remove',
      paramHint: 'Common subspace: gov / bank / staking / mint / slashing / distribution. Value must be a JSON string.',
      paramRefTitle: '📖 Common preset & reference',
      invalidParam: 'Please fill in Subspace / Key / Value for every parameter row',
      invalidParamRef: 'At least one parameter required for param-change proposal',
      paramBlockTitle: '🔧 Parameter Change Config (ParameterChangeProposal)',
      titleLabel: 'Proposal Title',
      titlePlaceholder: 'e.g. Lower transaction fees',
      descLabel: 'Proposal Description',
      descPlaceholder: 'Describe your proposal in detail...',
      deposit: 'Deposit (PAXI)',
      fee: 'Platform Fee (PAXI)',
      submitBtn: '🚀 Submit Proposal',
      submitting: 'Submitting...',
      success: '✅ Proposal submitted! Proposal ID: ',
      fail: '❌ Submit failed: ',
      list: '📋 Proposal List',
      listLoading: 'Loading...',
      listEmpty: 'No proposals yet',
      passed: 'Passed',
      rejected: 'Rejected',
      voting: 'Voting',
      depositFailed: 'Deposit Refunded',
      status: 'Status',
      submitTime: 'Submit Time',
      depositAmount: 'Deposit',
      connectFirst: 'Please connect wallet first',
      emptyFields: 'Please fill in title and description',
      invalidDeposit: 'Deposit must be greater than 0',
      confirmSubmit: 'Confirm to pay {fee} PAXI service fee + {deposit} PAXI deposit? Deposit will be refunded if proposal passes.',
      cancel: 'Cancel',
      cancelBtn: '🗑 Cancel Proposal',
      cancelConfirm: 'Cancel proposal #{id}? Deposit will be refunded.',
      canceling: 'Canceling...',
      cancelSuccess: '✅ Proposal #{id} cancelled. Deposit will be refunded.',
      cancelFail: '❌ Cancel failed: ',
      onlyDepositCanCancel: 'Only proposals in deposit period can be cancelled',
    },
    disclaimer: {
      siteWide: '⚠️ This website (and all subpages) is for on-chain data query and wallet operation assistance only. It does not provide any token exchange, transaction matching, pricing guidance, or information intermediary services. All user on-chain operations are independent actions and unrelated to this website. Please comply with the laws and regulations of your country or region.',
      balanceCheck: 'This tool only displays on-chain public data and does not involve any trading services. All data is sourced from the Paxi network and is for reference only.',
      txTracker: 'This tool only queries on-chain transaction status and does not provide trading advice or investment recommendations.',
      gasCalc: 'This estimate is for reference only; the actual fee is subject to on-chain execution.',
      validatorCompare: 'Validator data is sourced from on-chain public information and is for reference only, not investment advice.',
      prc20Info: 'This tool only displays basic token information and does not provide price or trading services.',
      proposalSubmit: 'This tool only provides a technical entry for submitting proposals. The proposal content is written and responsible by the user. Users should ensure that the proposal content complies with the laws and regulations of their jurisdiction.',
      proposalList: 'The proposal list is from on-chain public data, and the content is the responsibility of the proposer.',
      batchTransfer: '⚠️ This function is only for personal wallet asset management and must not be used for commercial payments, token exchange, or any form of virtual currency trading services. All user transfer actions are independent operations and unrelated to this tool.',
      redelegate: 'This operation is only for independent management of staking nodes and is an on-chain governance action, not investment advice.',
      nftLauncher: 'This tool only provides technical services for NFT minting and does not provide any transaction matching, pricing, or exchange functions. Users bear all consequences of holding and disposing of NFTs.'
    },
    myNfts: {
      title: '🖼️ My NFTs',
      desc: 'Enter a wallet address to view NFTs (image, name, attributes).',
      walletAddr: 'Wallet Address',
      contract: 'NFT Contract',
      selectContract: '-- Select deployed contract --',
      manualInput: 'Manual input address',
      query: '🔍 Query',
      queryHint: 'Precise query by the address + contract above',
      querying: 'Querying on-chain data...',
      loadingMeta: 'Loading metadata',
      noNft: 'No NFTs found for this address',
      noContract: 'Please select or enter a contract address',
      loadMore: 'Load More',
      exportCsv: '📥 Export CSV',
      tokenId: 'Token ID',
      name: 'Name',
      attributes: 'Attributes',
      image: 'Image',
      contractAddr: 'Contract Address',
      tokenUri: 'Token URI',
      description: 'Description',
      total: 'Total',
      nftUnit: 'NFTs',
      queryFail: 'Query failed',
      cached: '(cached)',
      exported: 'CSV exported',
      disclaimer: 'This tool only queries on-chain NFT data, no trading services.',
      transferTitle: '📤 Transfer NFT',
      transferDesc: 'Transfer an NFT from this contract to a recipient. Requires owner wallet signature, gas only, no service fee.',
      transferContract: 'NFT Contract *',
      transferTokenId: 'Token ID *',
      transferRecv: 'Recipient *',
      transferMemo: 'Memo (optional)',
      transferBtn: '📤 Transfer',
      transferConfirm: 'Confirm transferring this NFT to the address below?',
      transferSuccess: '✅ Transfer successful',
      transferAddrInvalid: 'Invalid address (paxi1..., 43 chars account or 63 chars contract)',
      transferNeedWallet: 'Please connect wallet first',
      transferring: 'Transferring...',
      modalSendTitle: '📤 Send / Transfer this NFT',
      modalSendRecipientPH: 'Recipient address paxi1...',
      modalSendBtn: '📤 Send to this address',
      modalSendHint: 'Gas only, no service fee; the NFT moves from your address to the recipient.',
      allChainBtn: '🌐 View my all-chain NFTs',
      allChainHint: 'Scans every cw721 contract on-chain automatically — no contract address needed',
      allChainLoading: 'Enumerating all-chain cw721 contracts and querying holdings...',
      allChainEmpty: 'This address has no NFT on any cw721 contract (code_id=2)',
      allChainCount: 'Covering {n} contracts · {m} NFTs total',
      allChainNeedWallet: 'Please connect wallet first to view all-chain NFTs'
    },
    games: {
      title: '🎮 Game Center',
      desc: 'Play casual games in the toolbox and have fun!',
      comingSoon: 'More games coming soon…'
    },
    planeWar: {
      title: '✈️ Plane War',
      hint: 'Touch/click screen to move plane, auto-fire',
      score: 'Score',
      hp: 'HP',
      start: 'Ready',
      touchToStart: 'Tap to Start',
      startBtn: 'Start Game',
      controls: '👆 Touch screen to move | ⌨️ Arrow keys/WASD to control',
      gameOver: 'Game Over',
      finalScore: 'Final Score',
      playAgain: 'Play Again',
      needWallet: 'Please connect wallet to play',
      payTitle: '🎮 Game Payment',
      payDesc: 'Pay 5 PAXI to play 10 rounds of Plane War',
      payBtn: '💳 Pay 5 PAXI to Start',
      paying: 'Paying...',
      paySuccess: 'Payment success! Got 10 rounds',
      payFailed: 'Payment failed',
      roundsLeft: 'Rounds Left',
      noRounds: 'No rounds left, please pay to continue',
      buyRounds: 'Buy Rounds',
      connectFirst: 'Please connect wallet first'
    },
    gamePay: {
      needWallet: 'Please connect wallet to play',
      payTitle: '🎮 Game Payment',
      payDesc: 'Pay 5 PAXI to play 10 rounds',
      payBtn: '💳 Pay 5 PAXI to Start',
      paying: 'Paying...',
      paySuccess: 'Payment success! Got 10 rounds',
      payFailed: 'Payment failed',
      roundsLeft: 'Rounds Left',
      noRounds: 'No rounds left, please pay to continue',
      buyRounds: 'Buy Rounds',
      connectFirst: 'Please connect wallet first',
      start: 'Ready',
      touchToStart: 'Tap to Start',
      startBtn: 'Start Game',
      gameOver: 'Game Over',
      finalScore: 'Final Score',
      playAgain: 'Play Again',
    },
    g2048: {
      title: '🔢 2048',
      desc: 'Merge same numbers, reach 2048!',
      score: 'Score',
      best: 'Best',
      controls: '⌨️ Arrow keys/WASD to move | 👆 Swipe screen',
    },
    klotski: {
      title: '🧩 Klotski',
      desc: 'Classic sliding puzzle, help Cao Cao escape',
      moves: 'Moves',
      controls: '👆 Tap block to select, swipe to move | ⌨️ Arrow keys/WASD',
      win: 'Victory',
    },
    bubble: {
      title: '🫧 Bubble Shooter',
      desc: 'Aim and shoot, pop same-color bubbles',
      score: 'Score',
      controls: '👆 Mouse/touch to aim, click to shoot',
      win: 'All Cleared',
    },
    tetris: {
      title: '🟦 Tetris',
      desc: 'Classic block-stacking game',
      score: 'Score',
      lines: 'Lines',
      controls: '⌨️ ←→ Move | ↑ Rotate | ↓ Soft drop | Space Hard drop | 👆 Swipe',
    },
    gomoku: {
      title: '⚫ Gomoku',
      desc: 'Play vs AI, connect five to win',
      turn: 'Turn',
      you: 'You (Black)',
      ai: 'AI (White)',
      youWin: 'You Win',
      aiWin: 'AI Wins',
      controls: '👆 Click/tap board to place stone',
    },
    common: {
      connectFirst: 'Please connect wallet first',
      sending: 'Sending...',
      loading: 'Loading...',
      connect: 'Connect Wallet',
      disconnect: 'Disconnect',
      mainnet: 'Mainnet',
      testnet: 'Testnet',
      langSwitch: 'Language',
    }
  }
};

// ============================================================
// Multi-language support
// Languages shown in the UI dropdown. Default = English.
// External packs live in langs/{ja,ko,id,vi,zh}.js (window.PAXI_LANGS) and are deep-merged
// over a clone of LANG.en, so every key always resolves (English is the fallback).
// ============================================================
const LANG_NAMES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
];

// Deep-merge an override object over a (shallow/deep) clone of base.
function _deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  if (!over || typeof over !== 'object') return out;
  for (const k of Object.keys(over)) {
    const bv = base ? base[k] : undefined;
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) &&
        bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[k] = _deepMerge(bv, over[k]);
    } else {
      out[k] = over[k];
    }
  }
  return out;
}

// Merge external language packs into LANG (English remains the fallback).
if (typeof window.PAXI_LANGS !== 'undefined') {
  for (const lc of ['ja', 'ko', 'id', 'vi', 'zh']) {
    if (window.PAXI_LANGS[lc]) {
      LANG[lc] = _deepMerge(LANG.en, window.PAXI_LANGS[lc]);
    }
  }
}

// Footer / disclaimer helper strings (also translated in langs/*.js).
if (LANG.en.common) {
  LANG.en.common.footerNote = 'Not an investment · Non-custodial · At your own risk';
  LANG.en.common.fullDisclaimer = 'Full disclaimer & legal notice →';
}

// Current language: persisted in localStorage, default English.
let currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('paxi_lang')) || 'en';
if (!LANG[currentLang]) currentLang = 'en';
let navStack = [];

function t(key) {
  const keys = key.split('.');
  // 1) current language
  let cur = LANG[currentLang] || LANG.en;
  let found = true;
  for (const k of keys) {
    if (cur && cur[k] !== undefined) cur = cur[k];
    else { found = false; break; }
  }
  if (found && cur !== undefined) return cur;
  // 2) fallback to English
  let en = LANG.en;
  for (const k of keys) {
    if (en && en[k] !== undefined) en = en[k];
    else return key;
  }
  return en || key;
}

// Switch language: persist + re-render the current view.
function setLanguage(code) {
  if (!LANG[code]) return;
  currentLang = code;
  try { localStorage.setItem('paxi_lang', code); } catch (e) {}
  updateHeaderUI();
  if (typeof state !== 'undefined' && state.currentView === 'tool' && state.currentTool &&
      window.TOOL_REGISTRY && window.TOOL_REGISTRY[state.currentTool]) {
    renderTool(state.currentTool, state.currentTool);
  } else if (typeof renderHome === 'function') {
    renderHome();
  }
}

function updateHeaderUI() {
  const appTitle = document.getElementById('appTitle');
  if (appTitle) appTitle.textContent = t('appTitle');
  const btnConnect = document.getElementById('btnConnect');
  if (btnConnect) btnConnect.textContent = t('common.connect');
  const btnDisconnect = document.getElementById('btnDisconnect');
  if (btnDisconnect) btnDisconnect.textContent = t('common.disconnect');
  if (typeof renderNetworkSelector === 'function') renderNetworkSelector('networkSelector');
  // Populate the language dropdown (built once, then kept in sync).
  const sel = document.getElementById('langSelect');
  if (sel) {
    if (!sel.dataset.built) {
      sel.innerHTML = LANG_NAMES.map((l) => `<option value="${l.code}">${l.label}</option>`).join('');
      sel.dataset.built = '1';
    }
    sel.value = currentLang;
  }
}

// ============================================================
// Configuration
// ============================================================
const CONFIG = {
  get rpc() { return getNetworkConfig().rpc; },
  get lcd() { return getLCD(); },
  get denom() { return getDenom(); },
  get denomDisplay() { return SHARED_CONFIG.denomDisplay; },
  get chainId() { return getChainId(); },
  gasPrice: SHARED_CONFIG.gasPrice,
  gasLimit: SHARED_CONFIG.gasLimit,
  maxMessagesPerTx: SHARED_CONFIG.maxMessagesPerTx,
  feeCollector: SHARED_CONFIG.feeCollector,
  feeRate: SHARED_CONFIG.feeRate,
  batchTransfer: SHARED_CONFIG.batchTransfer,
  nftMarket: SHARED_CONFIG.nftMarket,
};

// ============================================================
// State management
// ============================================================
const state = {
  wallet: null,
  balance: null,
  connected: false,
  currentView: 'home',
  currentTool: null,
  batchRecipients: [],
  batchTokenType: 'native',
  batchMode: 'csv',
  nftMarket: {
    subTab: 'browse',
    currentBuy: null,
    morePanel: false,
  },
  redelegate: {
    srcValidator: null,
    dstValidator: null,
    amount: '',
    delegations: [],
    validators: [],
  }
};

// ============================================================
// Initialization (actual entry point is initApp in app.js — not redeclared here)
// ============================================================

/* ------------------------------------------------ Deep-link launch (official DApp guide §2)
 * Official mode: if no wallet injected on mobile -> paxi://hub/explorer?url=<current page>; after ~1s if the app hasn't taken over, fall back to the install page.
 * This implementation uses an explicit user click (to avoid hijacking navigation); on desktop it offers a QR code. */
function showDeepLinkPrompt(force) {
  if (typeof window.paxihub !== 'undefined') return;
  if (!force && sessionStorage.getItem('paxi_deeplink_dismissed')) return;
  if (document.getElementById('paxiDeeplinkBar')) return;
  const zh = false; // English-only build
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const target = 'paxi://hub/explorer?url=' + encodeURIComponent(location.href);
  const DOCS = 'https://paxinet.io/paxi_docs/paxihub#paxihub-application';
  const btnCss = 'padding:9px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block';
  const bar = document.createElement('div');
  bar.id = 'paxiDeeplinkBar';
  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-radius:12px;background:var(--bg-card,#151b26);border:1px solid var(--primary);box-shadow:0 8px 30px rgba(0,0,0,.35);font-size:13px;color:var(--text,#e5e7eb)';
  bar.innerHTML = (isMobile
    ? `<span style="flex:1;min-width:180px">${zh ? 'Wallet not detected — open this page inside the PaxiHub app' : 'Wallet not detected — open this page inside the PaxiHub app'}</span>
       <button id="dlOpen" style="${btnCss}background:var(--primary,#6366f1);color:#fff;border:none">🚀 ${zh ? 'Open in PaxiHub' : 'Open in PaxiHub'}</button>`
    : `<span style="flex:1;min-width:180px">${zh ? 'No wallet injected on desktop: scan with the PaxiHub mobile app, or install it' : 'No wallet injected on desktop: scan with the PaxiHub mobile app, or install it'}</span>
       <button id="dlQr" style="${btnCss}background:transparent;color:inherit;border:1px solid var(--border,#334155)">📱 ${zh ? 'Show QR' : 'Show QR'}</button>`)
    + `<a href="${DOCS}" target="_blank" rel="noopener" style="${btnCss}background:transparent;color:inherit;border:1px solid var(--border,#334155)">⬇️ ${zh ? 'Install wallet' : 'Install wallet'}</a>
       <button id="dlClose" style="${btnCss}background:transparent;color:var(--text-muted,#94a3b8);border:none">✕</button>`;
  document.body.appendChild(bar);
  bar.querySelector('#dlClose').addEventListener('click', () => {
    sessionStorage.setItem('paxi_deeplink_dismissed', '1');
    bar.remove();
  });
  /* Mobile: clicking the deep link -> if the page isn't taken over by the app within 1.2s (still visible), fall back to the install page */
  const open = bar.querySelector('#dlOpen');
  if (open) open.addEventListener('click', () => {
    location.href = target;
    const t = setTimeout(() => { if (!document.hidden) location.href = DOCS; }, 1200);
    document.addEventListener('visibilitychange', function h() {
      if (document.hidden) { clearTimeout(t); document.removeEventListener('visibilitychange', h); }
    });
  }, { once: true });
  /* Desktop QR code: lazy-load qrcodejs, fall back to a plain-text link on failure */
  const qrBtn = bar.querySelector('#dlQr');
  if (qrBtn) qrBtn.addEventListener('click', () => {
    let panel = document.getElementById('paxiDeeplinkQr');
    if (panel) { panel.remove(); return; }
    panel = document.createElement('div');
    panel.id = 'paxiDeeplinkQr';
    panel.style.cssText = 'position:fixed;right:16px;bottom:70px;z-index:9999;background:#fff;padding:14px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.4);text-align:center;font-size:12px;color:#111;max-width:220px';
    panel.innerHTML = '<div id="qrBox" style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;word-break:break-all;font-size:10px">…</div><div style="margin-top:6px">' + (zh ? 'Scan with the PaxiHub app' : 'Scan with the PaxiHub app') + '</div>';
    document.body.appendChild(panel);
    const box = panel.querySelector('#qrBox');
    const draw = () => { try { new QRCode(box, { text: target, width: 180, height: 180 }); } catch (_) { box.textContent = target; } };
    if (typeof QRCode !== 'undefined') { draw(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = draw;
    s.onerror = () => { box.textContent = target; };
    document.head.appendChild(s);
  });
}

function checkWalletInjection() {
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (typeof window.paxihub !== 'undefined') {
      console.log('PaxiHub detected');
      clearInterval(interval);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      /* Injection timeout: show the official deep-link entry (open in the App on mobile / scan QR on desktop) */
      showDeepLinkPrompt(false);
    }
  }, 500);
}

// ============================================================
// Navigation
// ============================================================
function navigateHome() {
  // Cleanup current tool
  if (state.currentTool && window.TOOL_REGISTRY && window.TOOL_REGISTRY[state.currentTool]) {
    if (typeof window.TOOL_REGISTRY[state.currentTool].beforeUnmount === 'function') {
      window.TOOL_REGISTRY[state.currentTool].beforeUnmount();
    }
  }
  navStack = [];
  state.currentView = 'home';
  state.currentTool = null;
  renderHome();
}

function navigateToTool(tool) {
  const prevTool = state.currentTool;
  // Push current state to stack before navigating
  if (state.currentView === 'tool') {
    navStack.push({ view: 'tool', tool: state.currentTool });
  } else {
    navStack.push({ view: 'home' });
  }
  state.currentView = 'tool';
  state.currentTool = tool;
  renderTool(tool, prevTool);
}

function navigateBack() {
  // Cleanup current tool
  if (state.currentTool && window.TOOL_REGISTRY && window.TOOL_REGISTRY[state.currentTool]) {
    if (typeof window.TOOL_REGISTRY[state.currentTool].beforeUnmount === 'function') {
      window.TOOL_REGISTRY[state.currentTool].beforeUnmount();
    }
  }
  const prev = navStack.pop();
  if (!prev || prev.view === 'home') {
    navStack = [];
    state.currentView = 'home';
    state.currentTool = null;
    renderHome();
  } else {
    const prevTool = state.currentTool;
    state.currentView = 'tool';
    state.currentTool = prev.tool;
    renderTool(prev.tool, prevTool);
  }
}

// ============================================================
// Home rendering
// ============================================================
function renderHome() {
  const main = document.getElementById('mainContent');

  // Tool list (organized by category; register a new tool here to make it appear on the home page)
  const HOME_TOOLS = [
    // Staking & governance
    { id: 'claim-rewards', icon: '🎁', label: 'tools.claimRewards', cat: 'catStake' },
    { id: 'stake-manage', icon: '🥩', label: 'tools.stakeManage', cat: 'catStake' },
    { id: 'gov-vote', icon: '🗳️', label: 'tools.govVote', cat: 'catStake' },
    { id: 'redelegate', icon: '🔄', label: 'tools.redelegate', cat: 'catStake' },
    { id: 'validator-compare', icon: '🏦', label: 'tools.validatorCompare', cat: 'catStake' },
    { id: 'proposal', icon: '📦', label: 'tools.proposal', cat: 'catStake' },
    // Asset queries
    { id: 'balance-check', icon: '💰', label: 'tools.balanceCheck', cat: 'catAssets' },
    { id: 'my-nfts', icon: '🖼️', label: 'tools.myNfts', cat: 'catAssets' },
    { id: 'address-book', icon: '📒', label: 'tools.addressBook', cat: 'catAssets' },
    { id: 'allowance', icon: '🔑', label: 'tools.allowance', cat: 'catAssets' },
    { id: 'ibc-query', icon: '🔗', label: 'tools.ibcQuery', cat: 'catAssets' },
    // Trading & token launch
    { id: 'batch-transfer', icon: '📤', label: 'tools.batchTransfer', cat: 'catTrade' },
    { id: 'pump', icon: '🚀', label: 'tools.pump', cat: 'catTrade' },
    { id: 'burn', icon: '🔥', label: 'tools.burn', cat: 'catTrade' },
    { id: 'nft-launcher', icon: '🎨', label: 'tools.nftLauncher', cat: 'catTrade' },
    { id: 'swap', icon: '🔁', label: 'tools.swap', cat: 'catTrade' },
    // Decoder & tools
    { id: 'decoder', icon: '🔍', label: 'tools.decoder', cat: 'catTools' },
    { id: 'tx-dryrun', icon: '🧪', label: 'tools.txDryRun', cat: 'catTools' },
    { id: 'gas-calc', icon: '⛽', label: 'tools.gasCalc', cat: 'catTools' },
    { id: 'address-convert', icon: '🔄', label: 'tools.addressConvert', cat: 'catTools' },
  ];
  const CATS = ['catStake', 'catAssets', 'catTrade', 'catTools'];
  const CAT_ICON = { catStake: '🗳️', catAssets: '💰', catTrade: '💱', catTools: '🧰' };

  // Search matches: tool name + tool id (searchable in English)
  function toolSearchText(item) {
    const key = item.label.split('.')[1];
    const name = (LANG.en.tools && LANG.en.tools[key]) || '';
    return (name + ' ' + item.id + ' ' + item.label).toLowerCase();
  }

  // Re-render only the tool list area (keep the search box unchanged)
  function renderList(q) {
    const query = (q || '').trim().toLowerCase();
    const listEl = document.getElementById('homeToolList');
    if (!listEl) return;
    let html = '';
    let anyMatch = false;
    for (const cat of CATS) {
      const items = HOME_TOOLS.filter(it => it.cat === cat && (!query || toolSearchText(it).includes(query)));
      if (items.length === 0) continue;
      anyMatch = true;
      html += `<div class="home-cat"><span class="home-cat-icon">${CAT_ICON[cat] || ''}</span>${t('tools.' + cat)}</div>`;
      html += '<div class="home-grid">';
      html += items.map(item => `
        <div class="tool-card" data-tool="${item.id}">
          <div class="icon">${item.icon}</div>
          <div class="name">${t(item.label)}</div>
        </div>`).join('');
      html += '</div>';
    }
    if (!anyMatch) {
      html = `<div class="home-empty">No matching tools</div>`;
    }
    listEl.innerHTML = html;
    listEl.querySelectorAll('.tool-card[data-tool]').forEach(card => {
      card.addEventListener('click', () => navigateToTool(card.dataset.tool));
    });
  }

  main.innerHTML = `
    <div class="home-search">
      <input id="homeSearchInput" type="text" placeholder="${t('tools.searchPlaceholder')}" />
      <span id="homeSearchClear" class="home-search-clear" title="Clear" style="display:none">✕</span>
    </div>
    <div id="homeToolList"></div>
  `;

  const input = document.getElementById('homeSearchInput');
  if (input) {
    input.value = window.__homeSearch || '';
    input.addEventListener('input', (e) => {
      window.__homeSearch = e.target.value;
      renderList(e.target.value);
      const clearBtn = document.getElementById('homeSearchClear');
      if (clearBtn) clearBtn.style.display = e.target.value ? '' : 'none';
    });
  }
  const clearBtn = document.getElementById('homeSearchClear');
  if (clearBtn) {
    clearBtn.style.display = window.__homeSearch ? '' : 'none';
    clearBtn.addEventListener('click', () => {
      window.__homeSearch = '';
      if (input) input.value = '';
      clearBtn.style.display = 'none';
      renderList('');
      if (input) input.focus();
    });
  }

  renderList(window.__homeSearch || '');
}

// ============================================================
// Wallet connection
// ============================================================
/** Notify the current tool of wallet state changes (signing tools like pump/burn rely on this to refresh their internal wallet state) */
function notifyCurrentToolWalletChange() {
  const reg = window.TOOL_REGISTRY && window.TOOL_REGISTRY[state.currentTool];
  if (reg && typeof reg.onMount === 'function') {
    try { reg.onMount(); } catch (_) {}
  }
}

async function connectWallet() {
  if (typeof window.paxihub === 'undefined') {
    showToast('PaxiHub wallet not detected', 'error');
    /* Official deep-link entry: open in the App on mobile / scan QR on desktop (no longer auto-redirects) */
    showDeepLinkPrompt(true);
    return;
  }
  try {
    const sender = await window.paxihub.paxi.getAddress();
    state.wallet = sender;
    state.connected = true;
    updateWalletUI();
    await refreshBalance();
    showToast('Wallet connected', 'success');
    notifyCurrentToolWalletChange();
  } catch (e) {
    console.error('Wallet connection failed:', e);
    showToast('Wallet connection failed: ' + e.message, 'error');
  }
}

function disconnectWallet() {
  state.wallet = null;
  state.balance = null;
  state.connected = false;
  updateWalletUI();
  showToast('Wallet disconnected');
  notifyCurrentToolWalletChange();
}

function updateWalletUI() {
  const addrEl = document.getElementById('walletAddress');
  const balEl = document.getElementById('walletBalance');
  const btnConnect = document.getElementById('btnConnect');
  const btnDisconnect = document.getElementById('btnDisconnect');
  if (state.connected && state.wallet) {
    const addr = state.wallet.address;
    addrEl.textContent = addr.slice(0, 10) + '...' + addr.slice(-6);
    addrEl.style.display = 'inline-block';
    balEl.style.display = 'inline-block';
    btnConnect.style.display = 'none';
    btnDisconnect.style.display = 'inline-flex';
  } else {
    addrEl.style.display = 'none';
    balEl.style.display = 'none';
    btnConnect.style.display = 'inline-flex';
    btnDisconnect.style.display = 'none';
  }
}

async function refreshBalance() {
  if (!state.wallet) return;
  try {
    const res = await fetch(`${CONFIG.lcd}/cosmos/bank/v1beta1/balances/${state.wallet.address}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const paxiBalance = data.balances?.find(b => b.denom === CONFIG.denom);
    if (paxiBalance) {
      state.balance = parseFloat(upaxiToPaxi(paxiBalance.amount));
      document.getElementById('walletBalance').textContent =
        state.balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) + ' ' + CONFIG.denomDisplay;
    } else {
      state.balance = 0;
      document.getElementById('walletBalance').textContent = '0 ' + CONFIG.denomDisplay;
    }
  } catch (e) {
    console.error('Balance refresh failed:', e);
  }
}

// ============================================================
// Shared namespace & tool registration mechanism
// ============================================================
window.APP = {};
window.APP.LANG = LANG;
window.APP.currentLang = currentLang;
window.APP.getLang = () => currentLang;
window.APP.setLanguage = setLanguage;
window.APP.state = state;
window.APP.CONFIG = CONFIG;
window.APP.t = t;
window.APP.updateHeaderUI = updateHeaderUI;
window.APP.navigateHome = navigateHome;
window.APP.navigateBack = navigateBack;
window.APP.navigateToTool = navigateToTool;
window.APP.renderHome = renderHome;
window.APP.initApp = initApp;
window.APP.connectWallet = connectWallet;
window.APP.disconnectWallet = disconnectWallet;
window.APP.updateWalletUI = updateWalletUI;
window.APP.refreshBalance = refreshBalance;
window.APP.checkWalletInjection = checkWalletInjection;

window.TOOL_REGISTRY = {};

// ============================================================
// Add "Delete" to LANG.common (English-only build)
// ============================================================
if (LANG.en.common) LANG.en.common.delete = 'Delete';
