// Paxi Lens — Traditional Chinese (zh) language pack
// Mirrors every key in core.js LANG.en (shared) plus the per-tool namespaces.
window.PAXI_LANGS = window.PAXI_LANGS || {};
window.PAXI_LANGS.zh = {
  appTitle: 'Paxi Lens',
  back: '← 返回',
  tools: {
    decoder: '鏈上解碼器', batchTransfer: '批量轉帳', balanceCheck: '餘額 / 批量查詢', pump: '自訂發行',
    burn: '代幣銷毀', nftMarket: 'NFT 市場', txTracker: 'Tx 追蹤', nftLauncher: 'NFT 發行器', myNfts: '我的 NFT',
    addressConvert: '地址轉換', redelegate: '重新委託', gasCalc: 'Gas 計算', validatorCompare: '驗證人', proposal: '治理提案',
    games: '遊戲中心', monitor: '鏈上監控', later: '準備中…', claimRewards: '領取獎勵', govVote: '治理投票',
    stakeManage: '質押 / 解除質押', addressBook: '通訊錄', ibcQuery: 'IBC 查詢', txDryRun: 'Tx 模擬', swap: 'Swap 助手', allowance: '授權額度 (Allowance)',
    catStake: '質押與治理', catAssets: '資產與查詢', catTrade: '交易與發行', catTools: '解碼器與工具', searchPlaceholder: '搜尋工具...'
  },
  batchTransfer: {
    title: '📤 批量轉帳', desc: '批量發送 PAXI·PRC-20·NFT。支援 CSV 匯入與統一金額。', modePack: '⚡ 套裝模式：所有轉帳+手續費在 1 筆交易·1 次簽章下 100% 成功。',
    note: '💡 若收款錢包未顯示紀錄，請查看「餘額查詢」中的「轉帳紀錄」。',
    native: 'PAXI 原生', prc20: 'PRC-20 代幣', nft: 'NFT（PRC-721）',
    csvMode: '📋 CSV 匯入（金額個別）', uniformMode: '🔄 統一金額',
    upload: '點擊或拖曳 CSV', format: '格式：address,amount（每行一筆）',
    pastePlaceholder: 'paxi1abc123...,100\npaxi1def456...,250', uniformPlaceholder: 'paxi1abc123...\npaxi1def456...',
    parseBtn: '📋 解析並預覽', sendBtn: '🚀 執行批量轉帳', clearBtn: '清除',
    preview: '📋 轉帳預覽', history: '📜 最近轉帳'
  },
  balanceCheck: {
    title: '💰 餘額 / 批量查詢', desc: '貼上多個 Paxi 地址以查詢 PAXI 餘額與 PRC-20 持有量。',
    placeholder: 'paxi1abc123...\npaxi1def456...', queryBtn: '🔍 查詢餘額', exportBtn: '📥 匯出 CSV',
    querying: '正在查詢 {count} 個地址...', done: '✅ 完成：{count}', noAddr: '沒有有效的 Paxi 地址', records: '📜 轉帳紀錄'
  },
  txTracker: {
    title: '🔍 Tx 追蹤', desc: '輸入 TxHash 查看交易狀態與詳情。', placeholder: '輸入 TxHash...', queryBtn: '🔍 查詢'
  },
  gasCalc: {
    title: '⛽ Gas 計算', desc: '依交易類型估算 Gas 費用。', type: 'Tx 類型', send: '轉帳（MsgSend）', prc20: 'PRC-20 轉帳', nft: 'NFT 轉帳',
    swap: 'AMM 兌換', stake: '質押/委託', vote: '治理投票', price: 'Gas 價格（upaxi）', calcBtn: '🧮 計算'
  },
  addressConvert: {
    title: '🔄 地址轉換', desc: '在 Cosmos 鏈之間轉換 Bech32 前綴。', inputPlaceholder: 'paxi1... 或 cosmos1... 或 osmosis1...', target: '目標前綴', convertBtn: '🔄 轉換'
  },
  validatorCompare: {
    title: '🏦 驗證人比較', desc: '顯示所有活躍驗證人的 APR·手續費·投票權·狀態。', loadBtn: '🔄 載入驗證人', loading: '載入中...', done: '✅ 載入完成：{count} 筆'
  },
  tokenInfo: {
    title: '🪙 PRC-20 代幣資訊', desc: '從 PRC-20 合約查詢代幣名稱·符號·總供應量·小數位數。', placeholder: 'paxi1...', queryBtn: '🔍 查詢'
  },
  nftMarket: {
    title: '🏪 NFT 市場', desc: '基於 Authz 原子交換的分散式 NFT 交易。', tabs: ['瀏覽', '上架', '訂單管理', '匯入']
  },
  redelegate: {
    title: '🔄 重新委託', desc: '即時切換驗證人（無 7 天解綁）。手續費：0.15%（1.5‰）。', hint: '選擇目前驗證人與目標驗證人，並輸入移動金額。',
    from: '來源（目前驗證人）', to: '目標（目標驗證人）', amount: '金額（PAXI）', max: '最大', fee: '手續費', feeRate: '費率',
    execute: '🚀 執行重新委託', selectFrom: '選擇...', selectTo: '選擇...', success: '✅ 重新委託成功！', fail: '❌ 重新委託失敗：',
    invalidInput: '請選擇兩個驗證人與金額', noDelegations: '找不到委託'
  },
  proposal: {
    title: '📦 治理提案', desc: '提交 Paxi 網路的治理提案。需要押金+服務手續費。',
    submit: '📝 提交提案', type: '提案類型', typeText: '文字提案', typeParam: '參數變更提案', typePool: '🏦 社群資金池支出（DAO 資金申請）',
    poolBlockTitle: '🏦 社群資金池支出（CommunityPoolSpendProposal）', poolDesc: '提案通過後，社群資金池將指定數量的 PAXI 發送至收款地址（DAO 資金申請）。',
    poolTip: '💡 資金申請注意：標題與摘要會公開給所有投票的代幣持有者。請在說明欄寫明目的·預算細項·里程碑·期限，並使用專案金庫地址作為收款方。',
    poolRecipient: '收款地址（recipient）', poolAmount: '支出金額（PAXI）', poolBalance: '💰 鏈上社群資金池餘額：', poolBalanceLoading: '正在查詢社群資金池餘額...',
    poolBalanceEmpty: '社群資金池目前為空', poolBalanceFail: '查詢社群資金池餘額失敗', poolNoRecipient: '請輸入收款地址', poolBadRecipient: '收款地址格式無效（paxi1...）',
    poolBadAmount: '支出金額必須大於 0', poolExceed: '支出金額超過鏈上社群資金池餘額',
    badgePool: '🏦 資金池支出', badgeParam: '🔧 參數變更', badgeText: '📝 文字', badgeUpgrade: '⬆️ 軟體升級', badgeClient: '🔗 IBC 客戶端復原',
    confirmSubmitPool: '提交社群資金池支出提案（DAO 資金申請）嗎？\n\n金額：{amount} PAXI\n收款方：{rcv}\n\n若通過，資金池將發送 {amount} PAXI 至此地址。\n服務手續費 {fee} PAXI ＋ 押金 {deposit} PAXI。',
    daoTitle: '🏦 DAO 資金申請', daoDesc: '從社群資金池（CommunityPoolSpend）申請資金。提案通過後資金池將發送至收款地址。',
    daoInfo: '💡 標題與摘要會公開給所有投票的代幣持有者。請寫明目的·預算細項·里程碑·期限，並使用專案金庫地址作為收款方。',
    daoLabelTitle: '提案標題', daoTitlePlaceholder: '例：Paxi Lens 上線 ＋ 6 個月維運資金（300,000 PAXI）', daoLabelSummary: '提案摘要（summary）', daoSummaryPlaceholder: '用一句話寫出申請內容與金額...',
    daoLabelDesc: '提案說明（description）', daoDescPlaceholder: '寫明目的·預算細項·里程碑·期限...', daoSubmitBtn: '提交 DAO 資金申請', daoNotAllowed: '目前錢包地址無法提交 DAO 資金申請',
    daoNoTitle: '請輸入提案標題', daoNoSummary: '請輸入提案摘要', daoNoDesc: '請輸入提案說明', daoSuccess: '✅ 已提交 DAO 資金申請！提案 ID：',
    paramSubspace: 'Subspace（模組）', paramKey: 'Key（參數名）', paramValue: 'Value（JSON 字串）', paramValuePH: '例："0.050000000000000000"',
    addParam: '➕ 新增參數', delParam: '刪除', paramHint: '常見 subspace：gov / bank / staking / mint / slashing / distribution。Value 為 JSON 字串。',
    paramRefTitle: '📖 通用預設與參考', invalidParam: '請填寫每個參數列的 Subspace / Key / Value', invalidParamRef: '參數變更提案至少需要 1 個參數',
    paramBlockTitle: '🔧 參數變更設定（ParameterChangeProposal）', titleLabel: '提案標題', titlePlaceholder: '例：下調交易手續費', descLabel: '提案說明', descPlaceholder: '詳細描述提案...',
    deposit: '押金（PAXI）', fee: '平台手續費（PAXI）', submitBtn: '🚀 提交提案', submitting: '提交中...', success: '✅ 已提交提案！提案 ID：', fail: '❌ 提交失敗：',
    list: '📋 提案清單', listLoading: '載入中...', listEmpty: '尚無提案', passed: '已通過', rejected: '已否決', voting: '投票中', depositFailed: '押金已退還',
    status: '狀態', submitTime: '提交時間', depositAmount: '押金', connectFirst: '請先連接錢包', emptyFields: '請填寫標題與說明',
    invalidDeposit: '押金必須大於 0', confirmSubmit: '確認支付服務手續費 {fee} PAXI ＋ 押金 {deposit} PAXI？若通過將退還押金。',
    cancel: '取消', cancelBtn: '🗑 取消提案', cancelConfirm: '取消提案 #{id}？押金將退還。', canceling: '取消中...',
    cancelSuccess: '✅ 已取消 #{id}。押金已退還。', cancelFail: '❌ 取消失敗：', onlyDepositCanCancel: '僅押金期間的提案可取消'
  },
  disclaimer: {
    siteWide: '⚠️ 本網站（含所有子頁面）僅用於鏈上資料查詢與錢包操作協助。不提供任何代幣兌換·交易仲介·價格指導·資訊仲介服務。所有鏈上操作皆為使用者的獨立行為，與本網站無關。請遵守所在國家/地區的法律。',
    balanceCheck: '本工具僅顯示鏈上公開資料，不含任何交易服務。所有資料來自 Paxi 網路，僅供參考。',
    txTracker: '本工具僅查詢鏈上交易狀態，不提供交易建議或投資推薦。',
    gasCalc: '本估算僅供參考。實際費用以鏈上執行為準。',
    validatorCompare: '驗證人資料來自鏈上公開資訊，僅供參考，非投資建議。',
    prc20Info: '本工具僅顯示代幣基本資訊，不提供價格或交易服務。',
    proposalSubmit: '本工具僅提供提案提交的技術入口。提案內容的撰寫與責任歸屬使用者。請確認提案內容符合管轄法規。',
    proposalList: '提案清單為鏈上公開資料，內容責任歸屬提案者。',
    batchTransfer: '⚠️ 本功能僅用於個人錢包資產管理，不得用於商業支付·代幣兌換·或任何虛擬資產交易服務。所有轉帳皆為使用者的獨立操作，與本工具無關。',
    redelegate: '本操作為純粹的鏈上治理行為，僅用於質押節點的獨立管理，非投資建議。',
    nftLauncher: '本工具僅提供 NFT 鑄造的技術服務，不提供交易仲介·定價·兌換功能。NFT 持有·處分的一切後果由使用者自行承擔。'
  },
  myNfts: {
    title: '🖼️ 我的 NFT', desc: '輸入錢包地址以顯示 NFT（圖片·名稱·屬性）。', walletAddr: '錢包地址', contract: 'NFT 合約', selectContract: '-- 選擇已部署合約 --',
    manualInput: '手動輸入地址', query: '🔍 查詢', queryHint: '以上方地址+合約進行精確查詢', querying: '正在查詢鏈上資料...', loadingMeta: '正在載入元資料',
    noNft: '此地址找不到 NFT', noContract: '請選擇或輸入合約地址', loadMore: '載入更多', exportCsv: '📥 匯出 CSV', tokenId: '代幣 ID', name: '名稱',
    attributes: '屬性', image: '圖片', contractAddr: '合約地址', tokenUri: '代幣 URI', description: '描述', total: '總計', nftUnit: 'NFT', queryFail: '查詢失敗', cached: '（快取）', exported: '已匯出 CSV',
    disclaimer: '本工具僅查詢鏈上 NFT 資料，無交易服務。',
    transferTitle: '📤 發送 NFT', transferDesc: '將此合約的 NFT 發送給收款人。需要持有者錢包簽章，僅 Gas 無服務手續費。',
    transferContract: 'NFT 合約 *', transferTokenId: '代幣 ID *', transferRecv: '收款人 *', transferMemo: '備註（選填）', transferBtn: '📤 發送',
    transferConfirm: '將此 NFT 發送至以下地址？', transferSuccess: '✅ 發送成功', transferAddrInvalid: '地址無效（paxi1...，帳戶 43 字或合約 63 字）', transferNeedWallet: '請先連接錢包', transferring: '發送中...',
    modalSendTitle: '📤 發送此 NFT', modalSendRecipientPH: '收款地址 paxi1...', modalSendBtn: '📤 發送至此地址', modalSendHint: '僅 Gas 無服務手續費。NFT 會從你的地址移至收款人。',
    allChainBtn: '🌐 顯示全鏈 NFT', allChainHint: '自動掃描鏈上所有 cw721 合約（不需合約地址）', allChainLoading: '正在列舉全鏈 cw721 合約並查詢持有...',
    allChainEmpty: '此地址沒有 NFT（全鏈 cw721 合約，code_id=2）', allChainCount: '掃描 {n} 個合約·共 {m} 個 NFT', allChainNeedWallet: '查看全鏈 NFT 請先連接錢包'
  },
  games: { title: '🎮 遊戲中心', desc: '在工具箱內暢玩休閒遊戲！', comingSoon: '更多遊戲即將推出…' },
  planeWar: {
    title: '✈️ 飛機大戰', hint: '觸碰/點擊畫面移動機體，自動射擊', score: '分數', hp: '血量', start: '準備就緒', touchToStart: '點擊開始', startBtn: '開始遊戲',
    controls: '👆 觸碰畫面移動 | ⌨️ 方向鍵/WASD', gameOver: '遊戲結束', finalScore: '最終分數', playAgain: '再玩一次', needWallet: '請連接錢包才能遊玩',
    payTitle: '🎮 遊戲付費', payDesc: '支付 5 PAXI 遊玩飛機大戰 10 次', payBtn: '💳 支付 5 PAXI 並開始', paying: '支付中...', paySuccess: '支付成功！獲得 10 次', payFailed: '支付失敗',
    roundsLeft: '剩餘次數', noRounds: '次數用盡。請付費繼續', buyRounds: '購買次數', connectFirst: '請先連接錢包'
  },
  gamePay: {
    needWallet: '請連接錢包才能遊玩', payTitle: '🎮 遊戲付費', payDesc: '支付 5 PAXI 遊玩 10 次', payBtn: '💳 支付 5 PAXI 並開始', paying: '支付中...',
    paySuccess: '支付成功！獲得 10 次', payFailed: '支付失敗', roundsLeft: '剩餘次數', noRounds: '次數用盡。請付費繼續', buyRounds: '購買次數', connectFirst: '請先連接錢包',
    start: '準備就緒', touchToStart: '點擊開始', startBtn: '開始遊戲', gameOver: '遊戲結束', finalScore: '最終分數', playAgain: '再玩一次'
  },
  g2048: { title: '🔢 2048', desc: '合併相同數字挑戰 2048！', score: '分數', best: '最高', controls: '⌨️ 方向鍵/WASD 移動 | 👆 滑動' },
  klotski: { title: '🧩 華容道', desc: '經典滑塊益智，救出曹操', moves: '步數', controls: '👆 點擊方塊選取，滑動移動 | ⌨️ 方向鍵/WASD', win: '勝利' },
  bubble: { title: '🫧 泡泡射擊', desc: '瞄準射擊，擊破同色泡泡', score: '分數', controls: '👆 滑鼠/觸控瞄準，點擊發射', win: '全部消除' },
  tetris: { title: '🟦 俄羅斯方塊', desc: '經典疊方塊遊戲', score: '分數', lines: '行數', controls: '⌨️ ←→ 移動 | ↑ 旋轉 | ↓ 軟降 | 空白 硬降 | 👆 滑動' },
  gomoku: { title: '⚫ 五子棋', desc: '對戰 AI，連成五子獲勝', turn: '回合', you: '你（黑）', ai: 'AI（白）', youWin: '你獲勝', aiWin: 'AI 獲勝', controls: '👆 點擊/觸碰棋盤落子' },
  common: {
    connectFirst: '請先連接錢包', sending: '發送中...', loading: '載入中...', connect: '連接錢包', disconnect: '斷開',
    mainnet: '主網', testnet: '測試網',     langSwitch: '語言',
    footerNote: '非投資 · 非託管 · 風險自負',
    fullDisclaimer: '完整免責聲明與法律通知 →'
  },
  decoder: {
    title: '🔍 鏈上解碼器', searchPh: 'Tx 雜湊 / 合約地址 / 錢包地址', decodeBtn: '解碼', clearTitle: '清除', clear: '清除',
    tabDecode: '📖 Tx 解碼', tabSandbox: '🧪 沙盒', tabBatch: '📋 批量解碼', tabDiagnose: '🩺 失敗診斷',
    jumpBalance: '💰 餘額', jumpRedelegate: '🔄 重新委託', jumpValidator: '📊 驗證人', jumpProposal: '📦 提案',
    sandboxHint: '直接向節點發送唯讀查詢（無需簽章·Gas）。若不知如何輸入，請先在解碼分頁查看合約，確認實際支援的查詢方法。',
    contractAddr: '合約地址', queryJson: '查詢 JSON', runQuery: '執行查詢',
    batchHint: '每行一筆 64 字 Tx 雜湊（空白/逗號亦可），最多 200 筆。', runBatchBtn: '開始批量解碼', exportCsvBtn: '📥 匯出 CSV',
    diagHint: '輸入失敗的 Tx 雜湊，自動分類失敗原因並提供修正建議。', failHashPh: '失敗 Tx 的雜湊...', diagBtn: '診斷',
    footer: '⚠️ 本工具僅讀取公開鏈上資料並以淺顯方式說明。不含投資建議。完全唯讀：無簽章·無資產存取。',
    txOk: '✅ Tx 成功', txFail: '❌ Tx 失敗', txFailCause: '：{0}', height: '高度 {0}', paren: '（{0}）',
    storyTitle: '📖 此 Tx 的內容', memo: '📝 備註：{0}', feeTitle: '手續費', amount: '金額', feePayer: '手續費支付者', txHash: 'Tx 雜湊', copy: '⧉ 複製', sharePage: '分享', copyLink: '🔗 複製解碼連結',
    nativeDelta: '原生餘額變動（PAXI）', received: '📥 收到', sent: '📤 送出', contractFlows: '智慧合約資產移動', from: '發送方 ', to: '接收方 ', qty: '金額：',
    msgsTitle: '訊息（{0}）', sender: '發送者：', execMethod: '方法：', contractOf: ' · 合約 ', viewArgs: '檢視參數', rawMsg: '原始訊息', failLog: '失敗日誌',
    queryingChain: '正在查詢鏈上資料…', isContract: '🔗 這是智慧合約', profile: '合約檔案', label: '標籤', kind: '分類', creator: '創建者',
    admin: '管理員', upgradable: '（可升級）', noAdmin: '不可升級（已放棄管理員）', createdHeight: '創建高度',
    totalSupply: '總供應量', tokenInfo: '代幣資訊', name: '名稱', symbol: '符號', decimals: '小數位數',
    srcEcho: '來自合約實際回應', srcProbe: '來自個別方法探測', srcNoEcho: '無回應', srcErr: '回應錯誤',
    queryFeatures: '可查詢方法（鏈上已驗證）', methodsFound: '在鏈上發現 {0} 個實際方法。點擊載入至沙盒。',
    noMethods: '此合約未回應方法清單（自訂實作或無公開查詢）。亦可在沙盒手動輸入。',
    openSandbox: '🧪 開啟此合約的沙盒',
    nativeBalance: '原生餘額', noBalance: '此地址無原生餘額', localNote: '本地備註（僅此裝置）', noteName: '備註', notSet: '未設定', address: '地址',
    editNote: '編輯', addNote: '新增', notePrompt: '設定此地址的備註（僅儲存於此瀏覽器）：', unknownInput: '無法判斷為雜湊或地址。是否完整複製？',
    inputHint: 'Paxi 地址以 <b>paxi1</b> 開頭，Tx 雜湊為 64 字英數字。', parsingTx: '正在解析 Tx {0}…', netErr: '⚠️ 網路/節點錯誤（這不是 Tx 失敗，請重試）：{0}', nodeReturn: '節點回應',
    netErrHint: '常見原因：雜湊找不到、未建立索引、節點暫時無回應。', badAddr: '請輸入有效的合約地址（完整 paxi1...）', noJson: '請輸入查詢 JSON', jsonErr: 'JSON 語法錯誤：{0}',
    queryingNode: '正在查詢節點（唯讀）…', queryOk: '✅ 查詢成功', realMethods: '💡 此合約支援的實際查詢方法：', expandAll: '點擊展開全部 {0} 項',
    notContract: '此地址不是合約，或已遷移/刪除。', queryFail: '查詢失敗：{0}', nodeRaw: '原始節點回應', realMethodsTitle: '實際查詢方法',
    noValidHash: '沒有有效的雜湊（每行一筆 64 字十六進位雜湊）。', overLimit: '超過上限 — 僅處理前 {0} 筆。', parsing: '解析 {0}/{1}', stOk: '成功', stFail: '失敗', stQueryFail: '查詢失敗', done: '完成：{0} 筆',
    needHash: '請輸入 64 字 Tx 雜湊', diagnosing: '診斷中…', netErr2: '⚠️ 網路/節點錯誤（這不是 Tx 失敗）：{0}',
    txOkNoDiag: '✅ 此 Tx 已正常執行 — 無需診斷。', noClassify: '• 無法自動分類。請查看下方原始日誌。',
    txFailCode: '❌ Tx 失敗（code {0}）', diagTitle: '診斷', gasSet: 'Gas 上限', gasUsed: 'Gas 用量', codespace: 'Codespace', rawLogTitle: '原始日誌',
    d1: '餘額不足：帳戶無法同時支付轉帳與手續費。', d2: 'Gas 不足：執行超出 Gas 上限 — 請調高 Gas。',
    d3: '合約邏輯錯誤：合約自身回傳錯誤 — 與 Gas 無關。', d4: '權限不足：呼叫者非合約管理員/鑄造者。',
    d5: '已存在：重複的標籤或 token_id 等。', d6: '找不到：目標 ID·合約地址·提案不存在。',
    d7: '參數無效：JSON 與合約預期欄位不符。', d8: '序號衝突：帳戶 nonce 不一致，或 Tx 被廣播兩次。',
    d9: '逾時：未在目標高度前被打包 — 可重新廣播。', d10: '小數位數錯誤：代幣小數設定不正確。',
    welcome: '在上方貼上任意 <b>Tx 雜湊</b> 或 <b>地址</b>，我們會用淺顯語言說明發生了什麼。',
    coreMissing: '載入核心引擎 decoder-core.js 失敗。', copied: '✅ 已複製', copyFail: '❌ 複製失敗', addrCopied: '✅ 已複製地址', truncated: '\n…（已截斷，共 {0} 字）'
  },
  burn: {
    title: '🔥 代幣銷毀', desc: '呼叫 PRC-20 合約的 burn 方法永久銷毀代幣（總供應量減少·不可撤銷）。無平台手續費 — 僅鏈上 Gas。',
    contractLabel: '代幣合約地址（PRC-20 / CW20）', amountLabel: '銷毀數量（顯示單位，例：100）', amountPlaceholder: '例：100',
    burnBtn: '🔥 立即銷毀', connected: '✅ 已連接：<span class="mono">{0}…</span>', notConnected: '未連接（請先連接右上角錢包）', disconnected: '未連接',
    queryFailHttp: '合約查詢失敗（HTTP {0}）。請確認是否為 PRC-20 合約地址', notToken: '此合約未回傳 token_info — 非標準 PRC-20，無法銷毀',
    signFail: 'PaxiHub 簽章失敗', connectFirst: '請先連接錢包', badContract: '請輸入有效的 PRC-20 合約地址（完整 paxi1...）', badAmount: '請輸入有效的銷毀數量（正數）',
    querying: '⏳ 正在查詢代幣資訊...', tokenLabel: '代幣：', decimalsInfo: '、小數位數：{0}', zeroAmount: '轉換後的銷毀數量為 0 — 請檢查小數位數',
    confirmTitle: '確認銷毀 {0} {1}？', confirmConverted: '→ 實際銷毀數量：{0} {1}（基礎單位：{2}）', confirmIrreversible: '→ 總供應量將永久減少。不可撤銷！',
    signing: '⏳ 正在簽章銷毀...', preparing: '⏳ 正在準備銷毀 {0} {1}', noTxHash: '節點未回傳 Tx 雜湊 — 結果不明。請勿貿然重試，先以鏈上解碼器確認',
    successHtml: '🔥 銷毀成功！總供應量已永久減少。', successToast: '🔥 銷毀成功！總供應量已永久減少！', failPrefix: '❌ 失敗：',
    warn: '⚠️ 銷毀不可撤銷。僅支援實作標準 burn 方法的 PRC-20 合約。銷毀前請再次確認合約地址與數量。', unitFull: '代幣', unit: '代幣'
  },
  allowance: {
    title: '🔑 授權額度（Allowance）管理', desc: '顯示並管理授予其他地址（如 Swap 模組）的代幣授權。授權如同「自動扣款額度」— 越大風險越高，用完請縮小。免費工具，僅鏈上 Gas。',
    contractLabel: 'PRC-20 合約地址', ownerLabel: '擁有者（授權對象）', spenderLabel: '使用者（可使用者）', spenderHint: '一般：Swap 模組（官方 Swap 模組地址）', spenderCustom: '自訂地址',
    queryBtn: '🔍 查詢授權', amountLabel: '金額（顯示單位，例：100）', increaseBtn: '➕ 增加', decreaseBtn: '➖ 減少', revokeBtn: '🚫 全部 revoke',
    querying: '查詢中...', noAllowance: '無授權（目前額度為 0）', allowanceResult: '目前授權', balanceLabel: '擁有者餘額',
    confirmIncrease: '確認增加？\n\n· 合約：{0}\n· 使用者：{1}\n· 增加：{2}\n· 手續費：無（僅鏈上 Gas）',
    confirmDecrease: '確認減少？\n\n· 合約：{0}\n· 使用者：{1}\n· 減少：{2}\n· 手續費：無（僅鏈上 Gas）',
    confirmRevoke: '確認全部 revoke？\n\n· 合約：{0}\n· 使用者：{1}\n· revoke：{2}（設為零 — 無法再移動代幣）\n· 手續費：無（僅鏈上 Gas）',
    success: '✅ 完成 — 授權已更新！', failPrefix: '❌ 失敗：', connectFirst: '請先連接錢包（右上角）', badContract: '請輸入有效的 PRC-20 合約地址（paxi1...）',
    badAddr: '無效地址（需完整 paxi1...）', badAmount: '請輸入大於 0 的金額', noQueryYet: '請先查詢目前授權', queryingTx: '⏳ 簽章並廣播中...', done: '完成',
    viewTx: '🧭 在解碼器檢查此 Tx', tokenFail: '載入代幣資訊失敗（是 PRC-20 合約嗎？）', unlimitedNote: '⚠️ 注意：revoke = 一次性歸零。使用者除非重新授權，否則無法動用代幣。'
  },
  swap: {
    title: '🔁 Swap 助手（原生模組）', desc: '透過 Paxi 原生 Swap 模組兌換代幣。簽章前計算保證最低接收額 — 取代官方範例的固定 50% 滑點。免費，僅鏈上 Gas。',
    poolListTitle: '📈 所有資金池（點擊選擇）', poolLoading: '載入資金池中...', poolFail: '載入資金池失敗', poolEmpty: '無資金池 — 可直接貼上 PRC-20 合約地址',
    price: '價格', reserve: '準備金', contractLabel: 'PRC-20 合約地址（資金池）', loadPoolBtn: '🔄 載入資金池',
    direction: '方向', dirSellToken: '賣出 PRC-20 → PAXI', dirSellPaxi: '賣出 PAXI → PRC-20', amountLabel: '賣出數量（顯示單位）', balanceLabel: '我的餘額',
    slippageLabel: '滑點保護（%）', quoteTitle: '報價預覽', qRatio: '預估接收（資金池比例）', qCp: '常數乘積預估（含衝擊）', qImpact: '價格衝擊',
    qMin: '🛡️ 最低接收額（低於此值 Tx 自動失敗 — 你的保護）', quoteHint: '簽章前請更新報價。數量/方向改變時報價即失效。', refreshQuote: '🔄 更新報價',
    execBtn: '🔁 簽章並 Swap', confirm: '確認 Swap？\n\n· 方向：{0}\n· 賣出：{1}\n· 🛡️ 最低接收：{2}\n· 滑點：{3}%\n· 手續費：無（僅鏈上 Gas）\n\n賣出 PRC-20 時，授權增加會原子性地包含在同一筆 Tx 中。',
    queryingTx: '⏳ 簽章並廣播中...', success: '✅ Swap Tx 已鏈上確认！', failPrefix: '❌ 失敗：', connectFirst: '請先連接錢包（右上角）', badContract: '請輸入有效的 PRC-20 合約地址（paxi1...）',
    badAmount: '請輸入大於 0 的金額', noPool: '此地址無資金池（請先建立代幣，由流動性提供者開設資金池）', needQuote: '請先更新報價', minSlip: '滑點不得超過 50',
    typeUrlHint: '節點無法辨識此訊息類型。請稍後重試或回報。', viewTx: '🧭 在解碼器檢查此 Tx', allowanceAdded: '（已自動附帶授權增加：{0} — 僅此 Swap 所需部分）'
  },
  govVote: {
    title: '治理投票', desc: '瀏覽鏈上治理提案，並對投票期中的提案投票。本工具無平台手續費。',
    info: '💡 僅「投票中」的提案可投票。投票需要錢包簽章與鏈上廣播，鏈上紀錄才正確。',
    voting: '投票中', passed: '已通過', rejected: '已否決', deposit: '押金', connectFirst: '投票前請連接錢包', yes: '贊成', no: '反對', abstain: '棄權', veto: '否決權',
    voted: '你的投票：', confirmMsg: (id, opt) => `對提案 #${id} 投「${opt}」嗎？\n\n按「OK」進行錢包簽章與廣播。`, success: '✅ 已提交投票', failPrefix: '投票失敗：', sdkErr: 'SDK 不支援此訊息類型', noProposals: '無提案', loading: '載入中...', statusUnknown: '未知', voteFailed: '投票失敗'
  },
  claimRewards: {
    title: '領取獎勵', desc: '一鍵查詢並領取 PAXI 質押獎勵。可選擇啟用「複利」，領取後重新委託至同一驗證人。',
    info: '本工具僅廣播領取/複利 Tx，無平台手續費 — 僅鏈上 Gas。獎勵以 upaxi 為單位（1 PAXI = 1,000,000 upaxi）。',
    compound: '領取後複利至同一驗證人', claimBtn: '領取全部', connectFirst: '請連接錢包', noRewards: '無可領取的質押獎勵',
    colValidator: '驗證人', colAmount: '可領取（PAXI）', colAction: '操作', total: '領取總額：', loading: '⏳ 載入質押獎勵中...',
    confirmMsg: (paxi, compound) => `領取質押獎勵 ${paxi} PAXI？` + (compound ? '\n（已啟用複利：領取後重新委託至同一驗證人）' : '') + '\n\n按 OK 進行錢包簽章。',
    success: '✅ 領取成功', failPrefix: '領取失敗：', sdkErr: 'SDK 不支援此訊息類型', queryFail: '獎勵查詢失敗：'
  },
  ibcQuery: {
    title: 'IBC 查詢', desc: '對 Paxi 的 IBC 通道·客戶端·跨鏈 denom 追蹤進行唯讀查詢。',
    channelsBtn: '查詢通道', denomTracesBtn: '查詢 denom 追蹤', clientsBtn: '查詢客戶端', resolveBtn: '解析 denom', hashPh: '輸入 ibc/... 雜湊或原始雜湊',
    notEnabled: '此 IBC 端點回傳錯誤。Paxi 主網可能尚未啟用 IBC（其他功能不受影響）。', loading: '查詢中...', noData: '無資料', resolved: '已解析', info: '本工具為唯讀，不發送 Tx。若 Paxi 主網未啟用 IBC，端點會回傳錯誤 — 此為預期行為。'
  },
  addressBook: {
    title: '通訊錄', desc: '將常用的 Paxi 地址本地儲存於瀏覽器。', addBtn: '新增', exportBtn: '匯出', importBtn: '匯入', name: '名稱', address: '地址', note: '備註', search: '依名稱或地址搜尋...', empty: '尚無儲存地址', invalidAddr: '地址格式無效', added: '已新增', deleted: '已刪除', exported: '已匯出', imported: '已匯入', confirmDel: '刪除此地址？'
  },
  pump: {
    templateLabel: '選擇範本', feeLabel: '服務手續費', feeUnit: ' PAXI', deployBtn: '🚀 部署', deployingBtn: '部署中...', revokingBtn: '移除權限中...',
    walletDisconnected: '未連接', walletConnectedPrefix: '✅', connectHint: '請先在頁首連接錢包', templateLoadFail: '載入範本失敗', alertConnectFirst: '請先連接錢包', alertSelectTemplate: '請先選擇範本',
    alertUploadFail: '圖片上傳失敗：', alertDeployFail: '部署失敗：', alertImageType: '請選擇圖片檔（JPG / PNG / GIF 等）', alertImageSize: '圖片大小需 ≤ 32MB', alertReadFileFail: '讀取圖片檔失敗', alertUploadGeneral: '圖片上傳失敗',
    fields: { name: '代幣名稱', symbol: '代幣符號', total_supply: '總供應量（單位）', project: '專案 URL', description: '代幣描述', logo_url: 'Logo URL（必填）', minter: '鑄造者地址' },
    placeholders: { name: '代幣名稱', symbol: '代幣符號（例：PAXI）', project: '專案 URL https://…', description: '代幣描述' },
    templates: { prc20: 'PRC-20 替代代幣', prc721: 'PRC-721 NFT 收藏' },
    logoUrlPlaceholder: '或貼上圖片 URL（https://…）', uploadingBtn: '上傳中...', resultSuccessTitle: '✅ 發行成功！', resultContractAddr: '合約地址：', resultTxHash: 'Tx 雜湊：',
    resultTotalSupply: '總供應量：', resultTotalSupplySuffix: '（全部鑄造至你的錢包）', resultFee: '服務手續費：', resultFeeSuffix: ' PAXI（自動扣除）', resultLogoUrl: 'Logo URL：', resultNoLogo: 'N/A',
    resultMinter: '鑄造者：', resultMinterSuffix: '（此地址可用於後續鑄造）', resultMinterRevokedSuffix: '（發行後自動放棄鑄造與凍結權限）', resultRevokeLabel: '鑄造/凍結權限：',
    resultRevokeOk: '已自動放棄（日後無法鑄造，無法凍結帳戶）', resultRevokeFail: '自動放棄失敗！請手動發送 update_minter(null) Tx 至合約。', resultNotReadyTitle: '⚠️ Tx 已發送但合約地址尚未確定。',
    resultNotReadyTip: '稍後請以鏈上解碼器確認。', errNameRequired: '代幣名稱為必填', errSymbolRequired: '代幣符號為必填', errNftNameRequired: 'NFT 名稱為必填', errNftSymbolRequired: 'NFT 符號為必填',
    errDecimalsRange: '小數位數為 0~36', errTotalSupplyPositive: '總供應量須為正整數', errTotalSupplyInteger: '總供應量須為非負整數', errLogoRequired: 'Logo URL 為必填！請上傳圖片並貼上公開連結。', errLogoScheme: 'Logo URL 須以 http://, https://, ipfs:// 開頭',
    errProjectUrl: '專案 URL 須以 http:// 或 https:// 開頭', errMinterInvalid: '無效的鑄造者地址（以 paxi1 開頭）', errReceiverConfig: '收款地址設定錯誤', errPubkeyMissing: '無公鑰，請重新連接錢包',
    errUnknownTemplate: '未知範本', errChainId: '取得 chainId 失敗', errAccount: '取得帳戶資訊失敗', errSignPaxihub: 'PaxiHub 簽章失敗', errBroadcast: '廣播失敗：', errTxFail: (c, l) => `交易失敗（code=${c}）：${l || ''}`, errTxOnchain: '鏈上交易失敗：', errUnknownWallet: '未知錢包類型'
  },
  stakeManage: {
    title: '質押 / 解除質押', desc: '將 PAXI 委託給驗證人以獲取質押獎勵，或於需要時解除委託（約 7 天解綁期）。本工具無平台手續費。',
    info: '💡 委託後每個區塊累積獎勵。解除委託資金在可用前鎖定約 7 天。', delegateSection: '委託（質押）', undelegateSection: '解除委託（解質押）', unbondingSection: '解綁（倒數）',
    delegateBtn: '委託', undelegateBtn: '解除委託', connectFirst: '請連接錢包', confirmDelegate: (val, amt) => `確認委託？\n\n目標驗證人：${val}\n金額：${amt} PAXI\n\n按「OK」進行錢包簽章。`, confirmUndelegate: (val, amt) => `確認解除委託？\n\n目前委託：${val}\n金額：${amt} PAXI\n\n⚠️ 解除委託資金進入約 7 天解綁期，無法轉移或使用。按「OK」進行錢包簽章。`,
    success: '✅ 成功', failPrefix: '失敗：', sdkErr: 'SDK 不支援此訊息類型', noDelegations: '無委託', loading: '載入中...', unbondPeriod: 'Paxi 解綁期約 7 天', selectValidator: '選擇驗證人', selectDelegation: '選擇委託',
    invalidAmt: '請輸入有效金額', selectSource: '請選擇要解除的目前委託', amountLabel: '金額（PAXI）', unbondComplete: '✅ 解綁完成', days: '天', hours: '小時', mins: '分', secs: '秒'
  },
  txDryRun: {
    title: 'Tx 模擬', desc: '在鏈上模擬 Tx 以估算 Gas，並判斷是否會失敗。', info: '本工具僅模擬鏈上，不廣播。用於估算 Gas 與判斷 Tx 是否失敗。',
    modeA: '模式 A：快速轉帳模擬', modeB: '模式 B：貼上 tx_bytes 模擬', from: '發送者（錢包地址）', to: '接收地址', amount: '金額（PAXI）', simTransferBtn: '模擬轉帳', simBytesBtn: '模擬貼上的 tx_bytes',
    bytesPh: '貼上 Base64 編碼 tx_bytes', connectFirst: '請連接錢包', invalidAddr: '無效的接收地址', invalidAmt: '請輸入有效金額', gasUsed: '預估 Gas 用量', estFee: '預估 Gas 手續費',
    wouldFail: '模擬備註：', success: '模擬成功', failPrefix: '模擬失敗：', loading: '模擬中...', gasWanted: 'Gas Wanted', paxiUnit: 'PAXI', notConnected: '錢包未連接，發送者地址為空。'
  },
  nftLauncher: {
    title: '🎨 NFT 發行器', desc: '一鍵將 PRC-721 NFT 合約部署至 Paxi 網路。部署後可批量鑄造。',
    step1: '收藏資訊', step2: '資產上傳', step3: '預覽與部署', next: '下一步：上傳 →', prev: '← 返回', nextDeploy: '下一步：預覽與部署 →', deploy: '部署 NFT 合約',
    collectionName: '收藏名稱', symbol: '符號', description: '描述', maxSupply: '最大供應量', royalty: '版稅（%）', mintPrice: '鑄造價格（PAXI）', maxPerWallet: '每錢包最大鑄造數',
    deployBtn: '🚀 部署 NFT 合約', uploadCover: 'NFT 封面圖片', uploadCoverHint: '點擊上傳封面', uploadSupport: '支援 JPG/PNG/GIF/SVG', imageUri: 'Image URI（關閉 IPFS 時，或覆寫）', preview: '預覽', previewPlaceholder: '🖼️',
    batchMint: '批量鑄造 NFT', batchMintDesc: '對已部署的 PRC-721 合約批量鑄造。每筆 Tx 最多 10 個。每個 NFT 取得唯一 Token ID。', contractAddr: 'NFT 合約地址', contractAddrHint: '部署後自動填入', mint: '鑄造數量',
    mintFeeTitle: '💰 預估手續費', mintCountLabel: '鑄造數量', estimatedFee: '預估手續費', mintBtn: '🏭 執行批量鑄造', mintTokenIds: '代幣 ID', blockHeight: '區塊高度',
    metadataTitle: '📝 自訂元資料', metadataDesc: '為已鑄造的 NFT 新增自訂名稱與圖片。生成符合 CW721 的元資料 JSON。', tokenId: '代幣 ID', nftName: 'NFT 名稱', imageUriLabel: 'Image URI', saveMetadataBtn: '📝 生成元資料 JSON',
    metadataExplain: 'PRC-721 透過指向外部 JSON 的 token_uri 管理元資料。將下方 JSON 上傳至伺服器/IPFS，並在鑄造時以該 URL 作為 token_uri。', copyJson: '📋 複製 JSON', contractHistory: '已部署合約', contractHistoryDesc: '在 Paxi 鏈上部署成功的 NFT 合約。',
    noHistory: '無已部署合約', toContract: '→ 輸入地址', needWallet: '請先連接錢包', fillAll: '請填寫所有必填欄位', deploying: '建構部署 Tx 中...', waiting: '等待錢包簽章...', broadcasting: 'Tx 已廣播。等待確認...', confirmWait: '等待鏈上確認...',
    success: '✅ 成功', failed: '❌ 失敗', deploySuccess: '✅ 已部署 NFT 合約！', nextStep: '👇 下一步：將上方地址複製至下方批量鑄造欄', mintSuccess: '鑄造成功', nftMintCount: 'NFT',
    connected: '已連接', warning: '⚠️ 本工具僅提供 NFT 鑄造的技術服務。無交易仲介·定價·兌換功能。一切後果由使用者自行承擔。', warningEn: '⚠️ 本工具僅提供 NFT 鑄造的技術服務。無交易仲介·定價·兌換功能。一切後果由使用者自行承擔。',
    max10Hint: '每筆交易最多 10 個 NFT', mintConfirm: '確認批量鑄造？\n\n· 服務手續費：5 PAXI\n· 收款人：', buildTx: '建構鑄造 Tx 中...',
    ipfsHint: '💡 上傳圖片儲存於 IPFS，確保 NFT 永久可存取。', ipfsToggle: '使用 IPFS 儲存（建議）', ipfsConfig: '⚙️ IPFS 設定（Pinata）', ipfsJwtLabel: 'Pinata JWT', ipfsJwtPlaceholder: '貼上 Pinata JWT...', ipfsSave: '💾 儲存', ipfsConfigured: '✓ 已設定', ipfsNotConfigured: '⚠ 未設定', ipfsGetKey: '🔗 取得 Pinata JWT',
    ipfsUploading: '上傳中', ipfsImageOk: '✅ 圖片已上傳 IPFS', ipfsMetaGen: '生成並上傳元資料中...', ipfsUploadFail: '❌ IPFS 上傳失敗', ipfsNoJwt: '請先在 IPFS 設定中輸入 Pinata JWT', ipfsGateway: '閘道', ipfsFallback: 'IPFS 不可用，切換至基本模式', ipfsNeedImage: '請上傳封面圖或輸入 Image URI', ipfsLargeImg: '圖片超過 100KB，請啟用 IPFS 以降低 Gas',
    updTitle: '🔄 鏈上元資料更新', updDescInfo: '直接覆寫已鑄造 NFT 的鏈上元資料（名稱/圖片/描述/屬性）— 無需重新鑄造。由鑄造者或代幣擁有者錢包簽章，僅 Gas 無服務手續費。',
    updDescLabel: 'NFT 描述', updAttrsLabel: '屬性 JSON（選填）', updAttrsPlaceholder: '[{"trait_type":"Series","value":"Genesis"}]', updBtn: '🔄 發送鏈上更新', updSuccess: '✅ 元資料已更新', updAttrsInvalid: '屬性 JSON 無效 — 預期為 [{"trait_type":"...","value":"..."}] 形式的陣列', updAddrInvalid: '合約地址格式無效（paxi1...，帳戶 43 字/合約 63 字）。請從部署紀錄完整複製。',
    updConfirm: '將此元資料寫入鏈上？NFT 的名稱/圖片/屬性會直接變更。僅 Gas。\n\n', buildUpdTx: '建構更新 Tx 中...', updUriTooLarge: '元資料 token_uri 超過 64KB 可能導致鏈上 Tx 失敗。更新前請使用 IPFS 連結或壓縮圖片。'
  }
};
