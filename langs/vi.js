// Paxi Lens — Vietnamese (vi) language pack
// Mirrors every key in core.js LANG.en (shared) plus the per-tool namespaces.
window.PAXI_LANGS = window.PAXI_LANGS || {};
window.PAXI_LANGS.vi = {
  appTitle: 'Paxi Lens',
  back: '← quay lại',
  tools: {
    decoder: 'Bộ giải On-Chain', batchTransfer: 'Chuyển hàng loạt', balanceCheck: 'Số dư / Kiểm tra hàng loạt', pump: 'Phát hành tùy chỉnh',
    burn: 'Đốt Token', nftMarket: 'Chợ NFT', txTracker: 'Theo dõi Tx', nftLauncher: 'Trình phát hành NFT', myNfts: 'NFT của tôi',
    addressConvert: 'Chuyển đổi địa chỉ', redelegate: 'Ủy quyền lại', gasCalc: 'Tính Gas', validatorCompare: 'Validator', proposal: 'Đề xuất quản trị',
    games: 'Trung tâm Game', monitor: 'Giám sát chuỗi', later: 'Sắp ra mắt…', claimRewards: 'Nhận thưởng', govVote: 'Bỏ phiếu quản trị',
    stakeManage: 'Stake / Unstake', addressBook: 'Sổ địa chỉ', ibcQuery: 'Truy vấn IBC', txDryRun: 'Mô phỏng Tx', swap: 'Hỗ trợ Swap', allowance: 'Allowance (Quyền)',
    catStake: 'Staking & Quản trị', catAssets: 'Tài sản & Truy vấn', catTrade: 'Giao dịch & Phát hành', catTools: 'Bộ giải & Công cụ', searchPlaceholder: 'Tìm công cụ...'
  },
  batchTransfer: {
    title: '📤 Chuyển hàng loạt', desc: 'Chuyển PAXI·PRC-20·NFT hàng loạt. Hỗ trợ nhập CSV và số tiền đồng nhất.', modePack: '⚡ Chế độ gói: mọi chuyển tiền+phí trong 1tx·1chữ ký, thành công 100%.',
    note: '💡 Nếu lịch sử không hiện ở ví người nhận, xem "Lịch sử chuyển" trong "Kiểm tra số dư".',
    native: 'PAXI gốc', prc20: 'Token PRC-20', nft: 'NFT (PRC-721)',
    csvMode: '📋 Nhập CSV (số tiền từng dòng)', uniformMode: '🔄 Số tiền đồng nhất',
    upload: 'Nhấp hoặc kéo CSV vào', format: 'Định dạng: address,sốtiền (1 dòng 1 mục)',
    pastePlaceholder: 'paxi1abc123...,100\npaxi1def456...,250', uniformPlaceholder: 'paxi1abc123...\npaxi1def456...',
    parseBtn: '📋 Phân tích & Xem trước', sendBtn: '🚀 Thực hiện chuyển hàng loạt', clearBtn: 'Xóa',
    preview: '📋 Xem trước chuyển', history: '📜 Chuyển gần đây'
  },
  balanceCheck: {
    title: '💰 Số dư / Kiểm tra hàng loạt', desc: 'Dán nhiều địa chỉ Paxi để kiểm tra số dư PAXI và nắm giữ PRC-20.',
    placeholder: 'paxi1abc123...\npaxi1def456...', queryBtn: '🔍 Kiểm tra số dư', exportBtn: '📥 Xuất CSV',
    querying: 'Đang kiểm tra {count} địa chỉ...', done: '✅ Xong: {count}', noAddr: 'Không có địa chỉ Paxi hợp lệ', records: '📜 Lịch sử chuyển'
  },
  txTracker: {
    title: '🔍 Theo dõi Tx', desc: 'Nhập TxHash để xem trạng thái và chi tiết giao dịch.', placeholder: 'Nhập TxHash...', queryBtn: '🔍 Tra'
  },
  gasCalc: {
    title: '⛽ Tính Gas', desc: 'Ước tính phí gas theo loại giao dịch.', type: 'Loại Tx', send: 'Chuyển (MsgSend)', prc20: 'Chuyển PRC-20', nft: 'Chuyển NFT',
    swap: 'Swap AMM', stake: 'Stake/Ủy quyền', vote: 'Bỏ phiếu quản trị', price: 'Giá gas (upaxi)', calcBtn: '🧮 Tính'
  },
  addressConvert: {
    title: '🔄 Chuyển đổi địa chỉ', desc: 'Đổi tiền tố Bech32 giữa các chuỗi Cosmos.', inputPlaceholder: 'paxi1... hoặc cosmos1... hoặc osmosis1...', target: 'Tiền tố đích', convertBtn: '🔄 Chuyển'
  },
  validatorCompare: {
    title: '🏦 So sánh Validator', desc: 'Hiển thị APR·phí·sức vote·trạng thái của mọi validator hoạt động.', loadBtn: '🔄 Tải Validator', loading: 'Đang tải...', done: '✅ Tải xong: {count}'
  },
  tokenInfo: {
    title: '🪙 Thông tin Token PRC-20', desc: 'Truy vấn tên token·ký hiệu·tổng cung·số thập phân từ hợp đồng PRC-20.', placeholder: 'paxi1...', queryBtn: '🔍 Tra'
  },
  nftMarket: {
    title: '🏪 Chợ NFT', desc: 'Giao dịch NFT phi tập trung qua Atomic Swap Authz.', tabs: ['Khám phá', 'Bán', 'Quản lý lệnh', 'Nhập']
  },
  redelegate: {
    title: '🔄 Ủy quyền lại', desc: 'Chuyển validator tức thì (không unbond 7 ngày). Phí: 0,15% (1,5‰).', hint: 'Chọn validator hiện tại và đích, rồi nhập số tiền.',
    from: 'Từ (validator hiện tại)', to: 'Đến (validator đích)', amount: 'Số tiền (PAXI)', max: 'Tối đa', fee: 'Phí', feeRate: 'Tỷ lệ',
    execute: '🚀 Thực hiện ủy quyền lại', selectFrom: 'Chọn...', selectTo: 'Chọn...', success: '✅ Ủy quyền lại thành công!', fail: '❌ Ủy quyền lại thất bại: ',
    invalidInput: 'Chọn cả hai validator và số tiền', noDelegations: 'Không tìm thấy ủy quyền'
  },
  proposal: {
    title: '📦 Đề xuất quản trị', desc: 'Gửi đề xuất quản trị Paxi Network. Cần deposit+phí dịch vụ.',
    submit: '📝 Gửi đề xuất', type: 'Loại đề xuất', typeText: 'Đề xuất văn bản', typeParam: 'Đề xuất đổi tham số', typePool: '🏦 Chi tiêu Community Pool (Xin quỹ DAO)',
    poolBlockTitle: '🏦 Chi tiêu Community Pool (CommunityPoolSpendProposal)', poolDesc: 'Nếu được thông qua, community pool gửi PAXI đến địa chỉ nhận (xin quỹ DAO).',
    poolTip: '💡 Lưu ý xin quỹ: tiêu đề và tóm tắt công khai với mọi holder vote. Ghi rõ mục đích·chi tiết ngân sách·cột mốc·thời hạn trong mô tả, và dùng địa chỉ kho bạc dự án làm người nhận.',
    poolRecipient: 'Địa chỉ nhận (recipient)', poolAmount: 'Số chi (PAXI)', poolBalance: '💰 Số dư community pool on-chain: ', poolBalanceLoading: 'Đang tra số dư community pool...',
    poolBalanceEmpty: 'Community pool hiện đang trống', poolBalanceFail: 'Tra số dư community pool thất bại', poolNoRecipient: 'Nhập địa chỉ nhận', poolBadRecipient: 'Sai định dạng địa chỉ nhận (paxi1...)',
    poolBadAmount: 'Số chi phải > 0', poolExceed: 'Số chi vượt quá số dư community pool on-chain',
    badgePool: '🏦 Chi Pool', badgeParam: '🔧 Đổi tham số', badgeText: '📝 Văn bản', badgeUpgrade: '⬆️ Nâng cấp phần mềm', badgeClient: '🔗 Khôi phục client IBC',
    confirmSubmitPool: 'Gửi đề xuất chi tiêu community pool (xin quỹ DAO)?\n\nSố tiền: {amount} PAXI\nNhận: {rcv}\n\nNếu thông qua, pool gửi {amount} PAXI đến địa chỉ này.\nPhí dịch vụ {fee} PAXI + deposit {deposit} PAXI.',
    daoTitle: '🏦 Xin quỹ DAO', daoDesc: 'Xin quỹ từ Community Pool (CommunityPoolSpend). Nếu thông qua, pool gửi đến địa chỉ nhận.',
    daoInfo: '💡 Tiêu đề và tóm tắt công khai với mọi holder vote. Ghi rõ mục đích·chi tiết ngân sách·cột mốc·thời hạn, dùng địa chỉ kho bạc dự án làm người nhận.',
    daoLabelTitle: 'Tiêu đề đề xuất', daoTitlePlaceholder: 'Ví dụ: Ra mắt Paxi Lens + quỹ bảo trì 6 tháng (300.000 PAXI)', daoLabelSummary: 'Tóm tắt đề xuất (summary)', daoSummaryPlaceholder: 'Viết nội dung và số tiền trong một câu...',
    daoLabelDesc: 'Mô tả đề xuất (description)', daoDescPlaceholder: 'Ghi mục đích·chi tiết ngân sách·cột mốc·thời hạn...', daoSubmitBtn: 'Gửi xin quỹ DAO', daoNotAllowed: 'Ví hiện tại không thể gửi xin quỹ DAO',
    daoNoTitle: 'Nhập tiêu đề đề xuất', daoNoSummary: 'Nhập tóm tắt đề xuất', daoNoDesc: 'Nhập mô tả đề xuất', daoSuccess: '✅ Đã gửi xin quỹ DAO! ID đề xuất: ',
    paramSubspace: 'Subspace (module)', paramKey: 'Key (tên tham số)', paramValue: 'Value (chuỗi JSON)', paramValuePH: 'Ví dụ: "0.050000000000000000"',
    addParam: '➕ Thêm tham số', delParam: 'Xóa', paramHint: 'Subspace phổ biến: gov / bank / staking / mint / slashing / distribution. Value là chuỗi JSON.',
    paramRefTitle: '📖 Preset & Tham khảo chung', invalidParam: 'Điền Subspace / Key / Value cho mỗi dòng tham số', invalidParamRef: 'Đề xuất đổi tham số cần ít nhất 1 tham số',
    paramBlockTitle: '🔧 Cài đặt đổi tham số (ParameterChangeProposal)', titleLabel: 'Tiêu đề đề xuất', titlePlaceholder: 'Ví dụ: Giảm phí giao dịch', descLabel: 'Mô tả đề xuất', descPlaceholder: 'Mô tả chi tiết đề xuất...',
    deposit: 'Deposit (PAXI)', fee: 'Phí nền tảng (PAXI)', submitBtn: '🚀 Gửi đề xuất', submitting: 'Đang gửi...', success: '✅ Đã gửi! ID: ', fail: '❌ Gửi thất bại: ',
    list: '📋 Danh sách đề xuất', listLoading: 'Đang tải...', listEmpty: 'Chưa có đề xuất', passed: 'Đã qua', rejected: 'Bị từ chối', voting: 'Đang vote', depositFailed: 'Hoàn deposit',
    status: 'Trạng thái', submitTime: 'Thời gian gửi', depositAmount: 'Deposit', connectFirst: 'Kết nối ví trước', emptyFields: 'Điền tiêu đề và mô tả',
    invalidDeposit: 'Deposit phải > 0', confirmSubmit: 'Xác nhận trả phí dịch vụ {fee} PAXI + deposit {deposit} PAXI? Deposit hoàn lại nếu được thông qua.',
    cancel: 'Hủy', cancelBtn: '🗑 Hủy đề xuất', cancelConfirm: 'Hủy đề xuất #{id}? Deposit hoàn lại.', canceling: 'Đang hủy...',
    cancelSuccess: '✅ Đã hủy #{id}. Deposit hoàn lại.', cancelFail: '❌ Hủy thất bại: ', onlyDepositCanCancel: 'Chỉ đề xuất đang trong kỳ deposit mới hủy được'
  },
  disclaimer: {
    siteWide: '⚠️ Trang này (và mọi trang con) chỉ phục vụ truy vấn dữ liệu on-chain và hỗ trợ thao tác ví. Không cung cấp dịch vụ trao đổi token, môi giới giao dịch, hướng dẫn giá hay môi giới thông tin nào. Mọi thao tác on-chain là hành vi độc lập của người dùng, không liên quan trang này. Tuân thủ pháp luật nơi bạn cư trú.',
    balanceCheck: 'Công cụ này chỉ hiển thị dữ liệu công khai on-chain, không bao gồm dịch vụ giao dịch nào. Mọi dữ liệu từ mạng Paxi, chỉ tham khảo.',
    txTracker: 'Công cụ này chỉ tra trạng thái giao dịch on-chain, không tư vấn giao dịch hay khuyến nghị đầu tư.',
    gasCalc: 'Ước tính này chỉ tham khảo. Phí thực tế theo thực thi on-chain.',
    validatorCompare: 'Dữ liệu validator từ thông tin công khai on-chain, chỉ tham khảo, không phải tư vấn đầu tư.',
    prc20Info: 'Công cụ này chỉ hiển thị thông tin cơ bản token, không cung cấp giá hay dịch vụ giao dịch.',
    proposalSubmit: 'Công cụ này chỉ cung cấp cửa ngõ kỹ thuật gửi đề xuất. Soạn thảo và trách nhiệm nội dung thuộc về người dùng. Đảm bảo nội dung tuân thủ pháp luật.',
    proposalList: 'Danh sách đề xuất là dữ liệu công khai on-chain, trách nhiệm nội dung thuộc người đề xuất.',
    batchTransfer: '⚠️ Tính năng này chỉ phục vụ quản lý tài sản ví cá nhân, không được dùng cho thanh toán thương mại, trao đổi token, hay bất kỳ dịch vụ giao dịch tài sản crypto nào. Mọi chuyển tiền là thao tác độc lập của người dùng, không liên quan công cụ này.',
    redelegate: 'Thao tác này là hành vi quản trị on-chain thuần túy để quản lý node staking độc lập, không phải tư vấn đầu tư.',
    nftLauncher: 'Công cụ này chỉ cung cấp dịch vụ kỹ thuật mint NFT, không có môi giới giao dịch, định giá hay chức năng trao đổi. Mọi hậu quả sở hữu/xử lý NFT do người dùng tự chịu.'
  },
  myNfts: {
    title: '🖼️ NFT của tôi', desc: 'Nhập địa chỉ ví để hiển thị NFT (hình·tên·thuộc tính).', walletAddr: 'Địa chỉ ví', contract: 'Hợp đồng NFT', selectContract: '-- chọn hợp đồng đã deploy --',
    manualInput: 'Nhập địa chỉ thủ công', query: '🔍 Tra', queryHint: 'Truy vấn chính xác bằng địa chỉ+hợp đồng trên', querying: 'Đang tra dữ liệu on-chain...', loadingMeta: 'Đang tải metadata',
    noNft: 'Không tìm thấy NFT ở địa chỉ này', noContract: 'Chọn hoặc nhập địa chỉ hợp đồng', loadMore: 'Tải thêm', exportCsv: '📥 Xuất CSV', tokenId: 'Token ID', name: 'Tên',
    attributes: 'Thuộc tính', image: 'Hình', contractAddr: 'Địa chỉ hợp đồng', tokenUri: 'Token URI', description: 'Mô tả', total: 'Tổng', nftUnit: 'NFT', queryFail: 'Tra thất bại', cached: '(cache)', exported: 'Xuất CSV xong',
    disclaimer: 'Công cụ này chỉ tra dữ liệu NFT on-chain, không có dịch vụ giao dịch.',
    transferTitle: '📤 Gửi NFT', transferDesc: 'Gửi NFT hợp đồng này cho người nhận. Cần chữ ký ví chủ sở hữu, chỉ gas không phí dịch vụ.',
    transferContract: 'Hợp đồng NFT *', transferTokenId: 'Token ID *', transferRecv: 'Người nhận *', transferMemo: 'Ghi chú (tùy chọn)', transferBtn: '📤 Gửi',
    transferConfirm: 'Gửi NFT này đến địa chỉ sau?', transferSuccess: '✅ Gửi thành công', transferAddrInvalid: 'Địa chỉ không hợp lệ (paxi1... tài khoản 43 hoặc hợp đồng 63 ký tự)', transferNeedWallet: 'Kết nối ví trước', transferring: 'Đang gửi...',
    modalSendTitle: '📤 Gửi NFT này', modalSendRecipientPH: 'Địa chỉ nhận paxi1...', modalSendBtn: '📤 Gửi đến địa chỉ này', modalSendHint: 'Chỉ gas không phí dịch vụ. NFT chuyển từ địa chỉ bạn sang người nhận.',
    allChainBtn: '🌐 Hiển thị NFT mọi chuỗi', allChainHint: 'Quét tự động mọi hợp đồng cw721 on-chain (không cần địa chỉ hợp đồng)', allChainLoading: 'Đang liệt kê hợp đồng cw721 mọi chuỗi & tra nắm giữ...',
    allChainEmpty: 'Không có NFT ở địa chỉ này (mọi hợp đồng cw721, code_id=2)', allChainCount: '{n} hợp đồng được quét·tổng {m} NFT', allChainNeedWallet: 'Kết nối ví trước để xem NFT mọi chuỗi'
  },
  games: { title: '🎮 Trung tâm Game', desc: 'Thưởng thức game giải trí trong toolbox!', comingSoon: 'Thêm game sắp ra mắt…' },
  planeWar: {
    title: '✈️ Plane War', hint: 'Chạm/nhấp màn hình để di chuyển máy bay, bắn tự động', score: 'Điểm', hp: 'HP', start: 'Sẵn sàng', touchToStart: 'Chạm để bắt đầu', startBtn: 'Bắt đầu',
    controls: '👆 Chạm màn hình để di chuyển | ⌨️ Mũi tên/WASD', gameOver: 'Kết thúc', finalScore: 'Điểm cuối', playAgain: 'Chơi lại', needWallet: 'Kết nối ví để chơi',
    payTitle: '🎮 Thanh toán game', payDesc: 'Trả 5 PAXI để chơi Plane War 10 lần', payBtn: '💳 Trả 5 PAXI & Bắt đầu', paying: 'Đang trả...', paySuccess: 'Thành công! Nhận 10 lượt', payFailed: 'Trả thất bại',
    roundsLeft: 'Lượt còn lại', noRounds: 'Hết lượt. Trả để tiếp tục', buyRounds: 'Mua lượt', connectFirst: 'Kết nối ví trước'
  },
  gamePay: {
    needWallet: 'Kết nối ví để chơi', payTitle: '🎮 Thanh toán game', payDesc: 'Trả 5 PAXI để chơi 10 lần', payBtn: '💳 Trả 5 PAXI & Bắt đầu', paying: 'Đang trả...',
    paySuccess: 'Thành công! Nhận 10 lượt', payFailed: 'Trả thất bại', roundsLeft: 'Lượt còn lại', noRounds: 'Hết lượt. Trả để tiếp tục', buyRounds: 'Mua lượt', connectFirst: 'Kết nối ví trước',
    start: 'Sẵn sàng', touchToStart: 'Chạm để bắt đầu', startBtn: 'Bắt đầu', gameOver: 'Kết thúc', finalScore: 'Điểm cuối', playAgain: 'Chơi lại'
  },
  g2048: { title: '🔢 2048', desc: 'Ghép số giống nhau để đạt 2048!', score: 'Điểm', best: 'Cao nhất', controls: '⌨️ Mũi tên/WASD để di chuyển | 👆 Vuốt' },
  klotski: { title: '🧩 Klotski', desc: 'Câu đố trượt cổ điển, giải cứu Tào Tháo', moves: 'Bước', controls: '👆 Chạm khối để chọn, vuốt để di chuyển | ⌨️ Mũi tên/WASD', win: 'Thắng' },
  bubble: { title: '🫧 Bắn bóng', desc: 'Ngắm và bắn, vỡ các bóng cùng màu', score: 'Điểm', controls: '👆 Chuột/chạm để ngắm, nhấp để bắn', win: 'Xóa hết' },
  tetris: { title: '🟦 Tetris', desc: 'Game xếp gạch cổ điển', score: 'Điểm', lines: 'Dòng', controls: '⌨️ ←→ di chuyển | ↑ xoay | ↓ rơi mềm | cách rơi cứng | 👆 Vuốt' },
  gomoku: { title: '⚫ Cờ Caro', desc: 'Đấu với AI, xếp 5 liên tiếp để thắng', turn: 'Lượt', you: 'Bạn (đen)', ai: 'AI (trắng)', youWin: 'Bạn thắng', aiWin: 'AI thắng', controls: '👆 Nhấp/chạm bàn cờ để đặt quân' },
  common: {
    connectFirst: 'Kết nối ví trước', sending: 'Đang gửi...', loading: 'Đang tải...', connect: 'Kết nối ví', disconnect: 'Ngắt',
    mainnet: 'Mainnet', testnet: 'Testnet',     langSwitch: 'Ngôn ngữ',
    footerNote: 'Không phải đầu tư · Phi lưu ký · Tự chịu rủi ro',
    fullDisclaimer: 'Miễn trừ trách nhiệm & thông báo pháp lý →'
  },
  decoder: {
    title: '🔍 Bộ giải On-Chain', searchPh: 'Tx Hash / Địa chỉ hợp đồng / Địa chỉ ví', decodeBtn: 'Giải mã', clearTitle: 'Xóa', clear: 'Xóa',
    tabDecode: '📖 Giải mã Tx', tabSandbox: '🧪 Sandbox', tabBatch: '📋 Giải mã hàng loạt', tabDiagnose: '🩺 Chẩn đoán lỗi',
    jumpBalance: '💰 Số dư', jumpRedelegate: '🔄 Ủy quyền lại', jumpValidator: '📊 Validator', jumpProposal: '📦 Đề xuất',
    sandboxHint: 'Gửi truy vấn chỉ đọc trực tiếp đến node (không chữ ký·gas). Nếu bối rối đầu vào, hãy tra hợp đồng ở tab giải mã trước và xem các phương thức truy vấn thực sự được hỗ trợ.',
    contractAddr: 'Địa chỉ hợp đồng', queryJson: 'Truy vấn JSON', runQuery: 'Chạy truy vấn',
    batchHint: '1 dòng 1 Tx hash 64 ký tự (cách/không gian cũng được), tối đa 200.', runBatchBtn: 'Bắt đầu giải mã hàng loạt', exportCsvBtn: '📥 Xuất CSV',
    diagHint: 'Nhập Tx hash thất bại để tự phân loại nguyên nhân & gợi ý sửa.', failHashPh: 'Hash Tx thất bại...', diagBtn: 'Chẩn đoán',
    footer: '⚠️ Công cụ này chỉ đọc dữ liệu công khai on-chain & giải thích đơn giản. Không tư vấn đầu tư. Hoàn toàn chỉ đọc: không chữ ký·truy cập tài sản.',
    txOk: '✅ Tx thành công', txFail: '❌ Tx thất bại', txFailCause: ': {0}', height: 'Cao {0}', paren: '({0})',
    storyTitle: '📖 Nội dung Tx này', memo: '📝 Ghi chú: {0}', feeTitle: 'Phí', amount: 'Số tiền', feePayer: 'Người trả phí', txHash: 'Tx Hash', copy: '⧉ Sao chép', sharePage: 'Chia sẻ', copyLink: '🔗 Sao chép liên kết giải mã',
    nativeDelta: 'Biến động số dư gốc (PAXI)', received: '📥 Nhận', sent: '📤 Gửi', contractFlows: 'Di chuyển tài sản hợp đồng thông minh', from: 'Từ ', to: 'Đến ', qty: 'Số lượng: ',
    msgsTitle: 'Thông điệp ({0})', sender: 'Người gửi: ', execMethod: 'Phương thức: ', contractOf: ' · Hợp đồng ', viewArgs: 'Xem đối số', rawMsg: 'Thông điệp thô', failLog: 'Log lỗi',
    queryingChain: 'Đang tra dữ liệu on-chain…', isContract: '🔗 Đây là hợp đồng thông minh', profile: 'Hồ sơ hợp đồng', label: 'Nhãn', kind: 'Loại', creator: 'Người tạo',
    admin: 'Admin', upgradable: '(có thể nâng cấp)', noAdmin: 'Không thể nâng cấp (đã bỏ admin)', createdHeight: 'Cao tạo',
    totalSupply: 'Tổng cung', tokenInfo: 'Thông tin token', name: 'Tên', symbol: 'Ký hiệu', decimals: 'Số thập phân',
    srcEcho: 'từ phản hồi hợp đồng thật', srcProbe: 'từ probing từng phương thức', srcNoEcho: 'không có phản hồi', srcErr: 'phản hồi lỗi',
    queryFeatures: 'Phương thức có thể truy vấn (đã xác minh on-chain)', methodsFound: 'Tìm thấy {0} phương thức thật on-chain. Nhấp để tải vào sandbox.',
    noMethods: 'Hợp đồng này không trả về danh sách phương thức (tự triển khai hoặc không có truy vấn công khai). Có thể nhập thủ công trong sandbox.',
    openSandbox: '🧪 Mở sandbox hợp đồng này',
    nativeBalance: 'Số dư gốc', noBalance: 'Địa chỉ này không có số dư gốc', localNote: 'Ghi chú cục bộ (chỉ thiết bị này)', noteName: 'Ghi chú', notSet: 'Chưa đặt', address: 'Địa chỉ',
    editNote: 'Sửa', addNote: 'Thêm', notePrompt: 'Đặt ghi chú cho địa chỉ này (chỉ lưu trình duyệt này): ', unknownInput: 'Không xác định được hash hay địa chỉ. Đã sao chép toàn bộ?',
    inputHint: 'Địa chỉ Paxi bắt đầu <b>paxi1</b>, Tx hash 64 ký tự alphanumeric.', parsingTx: 'Đang phân tích Tx {0}…', netErr: '⚠️ Lỗi mạng/node (không phải lỗi Tx, thử lại): {0}', nodeReturn: 'Phản hồi node',
    netErrHint: 'Nguyên nhân thường: hash không tìm thấy, chưa lập chỉ mục, node tạm không phản hồi.', badAddr: 'Nhập địa chỉ hợp đồng hợp lệ (paxi1... đầy đủ)', noJson: 'Nhập truy vấn JSON', jsonErr: 'Lỗi cú pháp JSON: {0}',
    queryingNode: 'Đang tra node (chỉ đọc)…', queryOk: '✅ Truy vấn thành công', realMethods: '💡 Các phương thức truy vấn thật hợp đồng hỗ trợ: ', expandAll: 'Nhấp để mở rộng {0} mục',
    notContract: 'Địa chỉ này không phải hợp đồng hoặc đã chuyển/xóa.', queryFail: 'Truy vấn thất bại: {0}', nodeRaw: 'Phản hồi node thô', realMethodsTitle: 'Phương thức truy vấn thật',
    noValidHash: 'Không có hash hợp lệ (1 dòng 1 hash thập lục 64 ký tự).', overLimit: 'Vượt giới hạn — chỉ xử lý {0} mục đầu.', parsing: 'Phân tích {0}/{1}', stOk: 'Thành công', stFail: 'Thất bại', stQueryFail: 'Truy vấn thất bại', done: 'Xong: {0}',
    needHash: 'Nhập Tx hash 64 ký tự', diagnosing: 'Đang chẩn đoán…', netErr2: '⚠️ Lỗi mạng/node (không phải lỗi Tx): {0}',
    txOkNoDiag: '✅ Tx này thực thi bình thường — không có gì để chẩn đoán.', noClassify: '• Không thể tự phân loại. Xem log thô bên dưới.',
    txFailCode: '❌ Tx thất bại (code {0})', diagTitle: 'Chẩn đoán', gasSet: 'Giới hạn Gas', gasUsed: 'Gas đã dùng', codespace: 'Codespace', rawLogTitle: 'Log thô',
    d1: 'Không đủ số dư: tài khoản không đủ trả cả chuyển và phí.', d2: 'Không đủ gas: thực thi vượt giới hạn gas — tăng gas.',
    d3: 'Lỗi logic hợp đồng: hợp đồng tự trả về lỗi — không liên quan gas.', d4: 'Không có quyền: người gọi không phải admin/minter hợp đồng.',
    d5: 'Đã tồn tại: trùng nhãn hoặc token_id, v.v.', d6: 'Không tìm thấy: ID mục tiêu·địa chỉ hợp đồng·đề xuất không tồn tại.',
    d7: 'Đối số không hợp lệ: JSON không khớp trường hợp đồng mong đợi.', d8: 'Xung đột chuỗi: nonce tài khoản không khớp, hoặc Tx phát đi hai lần.',
    d9: 'Hết giờ: không được đưa vào cao mục tiêu — có thể phát lại.', d10: 'Lỗi số thập phân: cài đặt thập phân token sai.',
    welcome: 'Dán <b>Tx Hash</b> hoặc <b>Địa chỉ</b> bên trên, chúng tôi giải thích bằng ngôn ngữ đơn giản.',
    coreMissing: 'Tải engine cốt lõi decoder-core.js thất bại.', copied: '✅ Đã sao chép', copyFail: '❌ Sao chép thất bại', addrCopied: '✅ Đã sao chép địa chỉ', truncated: '\n…(cắt ngắn, tổng {0} ký tự)'
  },
  burn: {
    title: '🔥 Đốt Token', desc: 'Gọi phương thức burn của hợp đồng PRC-20 để hủy token vĩnh viễn (giảm tổng cung·không thể hoàn tác). Không phí nền tảng — chỉ gas on-chain.',
    contractLabel: 'Địa chỉ hợp đồng token (PRC-20 / CW20)', amountLabel: 'Số đốt (đơn vị hiển thị, vd: 100)', amountPlaceholder: 'Vd: 100',
    burnBtn: '🔥 Đốt ngay', connected: '✅ Đã kết nối: <span class="mono">{0}…</span>', notConnected: 'Chưa kết nối (kết nối ví góc phải trước)', disconnected: 'Chưa kết nối',
    queryFailHttp: 'Truy vấn hợp đồng thất bại (HTTP {0}). Kiểm tra địa chỉ hợp đồng PRC-20', notToken: 'Hợp đồng này không trả về token_info — không phải PRC-20 chuẩn, không đốt được',
    signFail: 'Ký PaxiHub thất bại', connectFirst: 'Kết nối ví trước', badContract: 'Nhập địa chỉ hợp đồng PRC-20 hợp lệ (paxi1... đầy đủ)', badAmount: 'Nhập số đốt hợp lệ (dương)',
    querying: '⏳ Đang tra thông tin token...', tokenLabel: 'Token: ', decimalsInfo: ', thập phân: {0}', zeroAmount: 'Số đốt sau chuyển đổi = 0 — kiểm tra thập phân',
    confirmTitle: 'Xác nhận đốt {0} {1}?', confirmConverted: '→ Số đốt thực tế: {0} {1} (đơn vị cơ sở: {2})', confirmIrreversible: '→ Tổng cung sẽ giảm vĩnh viễn. Không thể hoàn tác!',
    signing: '⏳ Đang ký đốt...', preparing: '⏳ Đang chuẩn bị đốt {0} {1}', noTxHash: 'Node không trả về Tx hash — kết quả không rõ. Đừng thử lại bừa, tra bộ giải on-chain trước',
    successHtml: '🔥 Đốt thành công! Tổng cung giảm vĩnh viễn.', successToast: '🔥 Đốt thành công! Tổng cung giảm vĩnh viễn!', failPrefix: '❌ Thất bại: ',
    warn: '⚠️ Đốt không thể hoàn tác. Chỉ hỗ trợ hợp đồng PRC-20 có phương thức burn chuẩn. Kiểm tra địa chỉ hợp đồng & số lượng trước khi đốt.', unitFull: 'Token', unit: 'Token'
  },
  allowance: {
    title: '🔑 Quản lý Allowance (Quyền)', desc: 'Hiển thị & quản lý quyền token đã cấp cho địa chỉ khác (vd: module Swap). Quyền như "hạn mức rút tự động" — càng lớn càng rủi ro, thu nhỏ sau khi xong. Công cụ miễn phí, chỉ gas on-chain.',
    contractLabel: 'Địa chỉ hợp đồng PRC-20', ownerLabel: 'Chủ sở hữu (mục tiêu quyền)', spenderLabel: 'Spender (người được dùng)', spenderHint: 'Thường: module Swap (địa chỉ module Swap chính thức)', spenderCustom: 'Địa chỉ tùy chỉnh',
    queryBtn: '🔍 Tra Allowance', amountLabel: 'Số tiền (đơn vị hiển thị, vd: 100)', increaseBtn: '➕ Tăng', decreaseBtn: '➖ Giảm', revokeBtn: '🚫 Thu hồi tất cả',
    querying: 'Đang tra...', noAllowance: 'Không có quyền (hạn mức hiện tại 0)', allowanceResult: 'Allowance hiện tại', balanceLabel: 'Số dư chủ',
    confirmIncrease: 'Xác nhận tăng?\n\n· Hợp đồng: {0}\n· Spender: {1}\n· Tăng: {2}\n· Phí: không (chỉ gas on-chain)',
    confirmDecrease: 'Xác nhận giảm?\n\n· Hợp đồng: {0}\n· Spender: {1}\n· Giảm: {2}\n· Phí: không (chỉ gas on-chain)',
    confirmRevoke: 'Xác nhận thu hồi tất cả?\n\n· Hợp đồng: {0}\n· Spender: {1}\n· Thu hồi: {2} (đặt về 0 — không thể chuyển token nữa)\n· Phí: không (chỉ gas on-chain)',
    success: '✅ Xong — allowance đã cập nhật!', failPrefix: '❌ Thất bại: ', connectFirst: 'Kết nối ví trước (góc phải)', badContract: 'Nhập địa chỉ hợp đồng PRC-20 hợp lệ (paxi1...)',
    badAddr: 'Địa chỉ không hợp lệ (cần paxi1... đầy đủ)', badAmount: 'Nhập số > 0', noQueryYet: 'Tra allowance hiện tại trước', queryingTx: '⏳ Đang ký & phát...', done: 'Xong',
    viewTx: '🧭 Kiểm tra Tx này trong bộ giải', tokenFail: 'Tải thông tin token thất bại (hợp đồng PRC-20?)', unlimitedNote: '⚠️ Lưu ý: thu hồi = về 0 một lần. Spender không thể động vào token trừ khi được duyệt lại.'
  },
  swap: {
    title: '🔁 Hỗ trợ Swap (Module gốc)', desc: 'Đổi token qua module swap gốc Paxi. Tính min received bảo đảm trước khi ký — thay thế slippage 50% cố định của ví dụ chính thức. Miễn phí, chỉ gas on-chain.',
    poolListTitle: '📈 Mọi Pool (nhấp để chọn)', poolLoading: 'Đang tải pool...', poolFail: 'Tải pool thất bại', poolEmpty: 'Không có pool — có thể dán địa chỉ hợp đồng PRC-20 trực tiếp',
    price: 'Giá', reserve: 'Dự trữ', contractLabel: 'Địa chỉ hợp đồng PRC-20 (pool)', loadPoolBtn: '🔄 Tải Pool',
    direction: 'Hướng', dirSellToken: 'Bán PRC-20 → PAXI', dirSellPaxi: 'Bán PAXI → PRC-20', amountLabel: 'Số bán (đơn vị hiển thị)', balanceLabel: 'Số dư của tôi',
    slippageLabel: 'Bảo vệ Slippage (%)', quoteTitle: 'Xem trước ước tính', qRatio: 'Ước nhận (tỷ lệ pool)', qCp: 'Ước hằng số-nhân (có impact)', qImpact: 'Tác động giá',
    qMin: '🛡️ Min Received (dưới này Tx tự thất bại — bảo vệ bạn)', quoteHint: 'Cập nhật ước tính trước khi ký. Nếu số lượng/hướng đổi, ước tính hết hạn.', refreshQuote: '🔄 Cập nhật ước tính',
    execBtn: '🔁 Ký & Swap', confirm: 'Xác nhận swap?\n\n· Hướng: {0}\n· Bán: {1}\n· 🛡️ Min Received: {2}\n· Slippage: {3}%\n· Phí: không (chỉ gas on-chain)\n\nKhi bán PRC-20, tăng allowance được gộp nguyên tử trong cùng Tx.',
    queryingTx: '⏳ Đang ký & phát...', success: '✅ Tx swap đã final on-chain!', failPrefix: '❌ Thất bại: ', connectFirst: 'Kết nối ví trước (góc phải)', badContract: 'Nhập địa chỉ hợp đồng PRC-20 hợp lệ (paxi1...)',
    badAmount: 'Nhập số > 0', noPool: 'Không có pool ở địa chỉ này (tạo token trước, nhà cung cấp thanh khoản mở pool)', needQuote: 'Cập nhật ước tính trước', minSlip: 'Slippage không được > 50',
    typeUrlHint: 'Node không nhận ra loại thông điệp. Thử lại sau hoặc báo cáo.', viewTx: '🧭 Kiểm tra Tx này trong bộ giải', allowanceAdded: '(Tăng allowance tự động gộp: {0} — chỉ phần swap này cần)'
  },
  govVote: {
    title: 'Bỏ phiếu quản trị', desc: 'Xem đề xuất quản trị on-chain, và vote đề xuất đang trong kỳ vote. Công cụ này không phí nền tảng.',
    info: '💡 Chỉ đề xuất "đang vote" mới vote được. Vote cần chữ ký ví & phát on-chain, ghi chuỗi chính xác.',
    voting: 'Đang vote', passed: 'Đã qua', rejected: 'Bị từ chối', deposit: 'Deposit', connectFirst: 'Kết nối ví trước khi vote', yes: 'Thuận', no: 'Chống', abstain: 'Trung lập', veto: 'Phủ quyết',
    voted: 'Phiếu của bạn: ', confirmMsg: (id, opt) => `Vote đề xuất #${id} với "${opt}"?\n\n"OK" để ký & phát ví.`, success: '✅ Đã gửi phiếu', failPrefix: 'Vote thất bại: ', sdkErr: 'SDK không hỗ trợ loại thông điệp này', noProposals: 'Không có đề xuất', loading: 'Đang tải...', statusUnknown: 'Không rõ', voteFailed: 'Vote thất bại'
  },
  claimRewards: {
    title: 'Nhận thưởng', desc: 'Kiểm & nhận thưởng stake PAXI một cú nhấp. Tùy chọn bật "compound" để ủy quyền lại validator same sau khi nhận.',
    info: 'Công cụ này chỉ phát Tx nhận/compound, không phí nền tảng — chỉ gas on-chain. Thưởng đơn vị upaxi (1 PAXI = 1.000.000 upaxi).',
    compound: 'Compound vào validator same sau nhận', claimBtn: 'Nhận tất cả', connectFirst: 'Kết nối ví', noRewards: 'Không có thưởng stake để nhận',
    colValidator: 'Validator', colAmount: 'Có thể nhận (PAXI)', colAction: 'Hành động', total: 'Tổng nhận: ', loading: '⏳ Đang tải thưởng stake...',
    confirmMsg: (paxi, compound) => `Nhận thưởng stake ${paxi} PAXI?\n` + (compound ? '(Compound bật: ủy quyền lại validator same sau nhận)' : '') + '\n\nOK để ký ví.',
    success: '✅ Nhận thành công', failPrefix: 'Nhận thất bại: ', sdkErr: 'SDK không hỗ trợ loại thông điệp này', queryFail: 'Tra thưởng thất bại: '
  },
  ibcQuery: {
    title: 'Truy vấn IBC', desc: 'Truy vấn chỉ đọc kênh IBC·client·dấu vết denom cross-chain của Paxi.',
    channelsBtn: 'Truy vấn kênh', denomTracesBtn: 'Truy vấn dấu vết denom', clientsBtn: 'Truy vấn client', resolveBtn: 'Giải denom', hashPh: 'Nhập hash ibc/... hoặc hash thô',
    notEnabled: 'Endpoint IBC này trả về lỗi. Paxi mainnet có thể chưa bật IBC (các tính năng khác không ảnh hưởng).', loading: 'Đang truy vấn...', noData: 'Không có dữ liệu', resolved: 'Đã giải', info: 'Công cụ này chỉ đọc, không gửi Tx. Nếu Paxi mainnet tắt IBC, endpoint trả lỗi — bình thường.'
  },
  addressBook: {
    title: 'Sổ địa chỉ', desc: 'Lưu cục bộ các địa chỉ Paxi thường dùng trong trình duyệt.', addBtn: 'Thêm', exportBtn: 'Xuất', importBtn: 'Nhập', name: 'Tên', address: 'Địa chỉ', note: 'Ghi chú', search: 'Tìm theo tên hoặc địa chỉ...', empty: 'Chưa có địa chỉ', invalidAddr: 'Sai định dạng địa chỉ', added: 'Đã thêm', deleted: 'Đã xóa', exported: 'Đã xuất', imported: 'Đã nhập', confirmDel: 'Xóa địa chỉ này?'
  },
  pump: {
    templateLabel: 'Chọn mẫu', feeLabel: 'Phí dịch vụ', feeUnit: ' PAXI', deployBtn: '🚀 Deploy', deployingBtn: 'Đang deploy...', revokingBtn: 'Đang xóa quyền...',
    walletDisconnected: 'Chưa kết nối', walletConnectedPrefix: '✅', connectHint: 'Kết nối ví ở header trước', templateLoadFail: 'Tải mẫu thất bại', alertConnectFirst: 'Kết nối ví trước', alertSelectTemplate: 'Chọn mẫu trước',
    alertUploadFail: 'Upload ảnh thất bại: ', alertDeployFail: 'Deploy thất bại: ', alertImageType: 'Chọn file ảnh (JPG / PNG / GIF vv)', alertImageSize: 'Ảnh tối đa 32MB', alertReadFileFail: 'Đọc file ảnh thất bại', alertUploadGeneral: 'Upload ảnh thất bại',
    fields: { name: 'Tên token', symbol: 'Ký hiệu token', total_supply: 'Tổng cung (đơn vị)', project: 'URL dự án', description: 'Mô tả token', logo_url: 'URL logo (bắt buộc)', minter: 'Địa chỉ minter' },
    placeholders: { name: 'Tên token', symbol: 'Ký hiệu token (vd: PAXI)', project: 'URL dự án https://…', description: 'Mô tả token' },
    templates: { prc20: 'Token thay thế PRC-20', prc721: 'Bộ sưu tập NFT PRC-721' },
    logoUrlPlaceholder: 'Hoặc dán URL ảnh (https://…)', uploadingBtn: 'Đang upload...', resultSuccessTitle: '✅ Phát hành thành công!', resultContractAddr: 'Địa chỉ hợp đồng: ', resultTxHash: 'Tx Hash: ',
    resultTotalSupply: 'Tổng cung: ', resultTotalSupplySuffix: '(tất cả mint vào ví bạn)', resultFee: 'Phí dịch vụ: ', resultFeeSuffix: ' PAXI (tự động trừ)', resultLogoUrl: 'URL logo: ', resultNoLogo: 'N/A',
    resultMinter: 'Minter: ', resultMinterSuffix: '(địa chỉ này dùng mint tiếp)', resultMinterRevokedSuffix: '(sau phát hành, quyền mint & freeze tự bỏ)', resultRevokeLabel: 'Quyền mint/freeze: ',
    resultRevokeOk: 'Tự bỏ (không mint được nữa, không freeze tài khoản)', resultRevokeFail: 'Tự bỏ thất bại! Gửi Tx update_minter(null) thủ công đến hợp đồng.', resultNotReadyTitle: '⚠️ Tx đã gửi nhưng địa chỉ hợp đồng chưa xác định.',
    resultNotReadyTip: 'Tra trong bộ giải on-chain sau.', errNameRequired: 'Tên token bắt buộc', errSymbolRequired: 'Ký hiệu token bắt buộc', errNftNameRequired: 'Tên NFT bắt buộc', errNftSymbolRequired: 'Ký hiệu NFT bắt buộc',
    errDecimalsRange: 'Số thập phân 0~36', errTotalSupplyPositive: 'Tổng cung phải số nguyên dương', errTotalSupplyInteger: 'Tổng cung phải số nguyên không âm', errLogoRequired: 'URL logo bắt buộc! Upload ảnh & dán link công khai.', errLogoScheme: 'URL logo phải bắt đầu http://, https://, ipfs://',
    errProjectUrl: 'URL dự án phải bắt đầu http:// hoặc https://', errMinterInvalid: 'Địa chỉ minter không hợp lệ (bắt đầu paxi1)', errReceiverConfig: 'Lỗi cài đặt địa chỉ nhận', errPubkeyMissing: 'Không có public key, kết nối lại ví',
    errUnknownTemplate: 'Mẫu không rõ', errChainId: 'Lấy chainId thất bại', errAccount: 'Lấy info tài khoản thất bại', errSignPaxihub: 'Ký PaxiHub thất bại', errBroadcast: 'Phát thất bại: ', errTxFail: (c, l) => `Giao dịch thất bại (code=${c}): ${l || ''}`, errTxOnchain: 'Giao dịch thất bại on-chain: ', errUnknownWallet: 'Loại ví không rõ'
  },
  stakeManage: {
    title: 'Stake / Unstake', desc: 'Ủy quyền PAXI cho validator để nhận thưởng stake, hoặc undelegate khi cần (unbond ~7 ngày). Công cụ này không phí nền tảng.',
    info: '💡 Sau ủy quyền, thưởng tích lũy mỗi khối. Tiền undelegate bị khóa ~7 ngày đến khi dùng được.', delegateSection: 'Ủy quyền (Stake)', undelegateSection: 'Hủy ủy quyền (Unstake)', unbondingSection: 'Unbond (Đếm ngược)',
    delegateBtn: 'Ủy quyền', undelegateBtn: 'Hủy ủy quyền', connectFirst: 'Kết nối ví', confirmDelegate: (val, amt) => `Xác nhận ủy quyền?\n\nValidator đích: ${val}\nSố tiền: ${amt} PAXI\n\n"OK" để ký ví.`, confirmUndelegate: (val, amt) => `Xác nhận hủy ủy quyền?\n\nỦy quyền hiện tại: ${val}\nSố tiền: ${amt} PAXI\n\n⚠️ Tiền hủy ủy quyền vào kỳ unbond ~7 ngày, không thể chuyển/dùng. "OK" để ký ví.`,
    success: '✅ Thành công', failPrefix: 'Thất bại: ', sdkErr: 'SDK không hỗ trợ loại thông điệp này', noDelegations: 'Không có ủy quyền', loading: 'Đang tải...', unbondPeriod: 'Kỳ unbond Paxi ~7 ngày', selectValidator: 'Chọn Validator', selectDelegation: 'Chọn ủy quyền',
    invalidAmt: 'Nhập số hợp lệ', selectSource: 'Chọn ủy quyền hiện tại để hủy', amountLabel: 'Số tiền (PAXI)', unbondComplete: '✅ Unbond xong', days: 'ngày', hours: 'giờ', mins: 'phút', secs: 'giây'
  },
  txDryRun: {
    title: 'Mô phỏng Tx', desc: 'Mô phỏng Tx on-chain để ước tính gas & xác định có thất bại không.', info: 'Công cụ này chỉ mô phỏng on-chain, không phát. Dùng ước gas & xác định thất bại Tx.',
    modeA: 'Chế độ A: Mô phỏng chuyển nhanh', modeB: 'Chế độ B: Mô phỏng dán tx_bytes', from: 'Người gửi (địa chỉ ví)', to: 'Địa chỉ nhận', amount: 'Số tiền (PAXI)', simTransferBtn: 'Mô phỏng chuyển', simBytesBtn: 'Mô phỏng tx_bytes dán',
    bytesPh: 'Dán tx_bytes Base64', connectFirst: 'Kết nối ví', invalidAddr: 'Địa chỉ nhận không hợp lệ', invalidAmt: 'Nhập số hợp lệ', gasUsed: 'Ước gas đã dùng', estFee: 'Ước phí gas',
    wouldFail: 'Ghi chú mô phỏng: ', success: 'Mô phỏng thành công', failPrefix: 'Mô phỏng thất bại: ', loading: 'Đang mô phỏng...', gasWanted: 'Gas Wanted', paxiUnit: 'PAXI', notConnected: 'Ví chưa kết nối, địa chỉ người gửi trống.'
  },
  nftLauncher: {
    title: '🎨 Trình phát hành NFT', desc: 'Deploy hợp đồng NFT PRC-721 lên mạng Paxi một cú nhấp. Sau deploy, batch mint.',
    step1: 'Thông tin bộ sưu tập', step2: 'Upload tài sản', step3: 'Xem trước & Deploy', next: 'Tiếp: Upload →', prev: '← Quay lại', nextDeploy: 'Tiếp: Xem trước & Deploy →', deploy: 'Deploy hợp đồng NFT',
    collectionName: 'Tên bộ sưu tập', symbol: 'Ký hiệu', description: 'Mô tả', maxSupply: 'Tổng cung tối đa', royalty: 'Royalty (%)', mintPrice: 'Giá mint (PAXI)', maxPerWallet: 'Mint tối đa mỗi ví',
    deployBtn: '🚀 Deploy hợp đồng NFT', uploadCover: 'Ảnh bìa NFT', uploadCoverHint: 'Nhấp để upload bìa', uploadSupport: 'Hỗ trợ JPG/PNG/GIF/SVG', imageUri: 'Image URI (nếu tắt IPFS, hoặc ghi đè)', preview: 'Xem trước', previewPlaceholder: '🖼️',
    batchMint: 'Batch Mint NFT', batchMintDesc: 'Batch mint vào hợp đồng PRC-721 đã deploy. Tối đa 10 mỗi Tx. Mỗi NFT có Token ID riêng.', contractAddr: 'Địa chỉ hợp đồng NFT', contractAddrHint: 'Tự điền sau deploy', mint: 'Số mint',
    mintFeeTitle: '💰 Ước tính phí', mintCountLabel: 'Số mint', estimatedFee: 'Ước tính phí', mintBtn: '🏭 Thực hiện batch mint', mintTokenIds: 'Token ID', blockHeight: 'Cao khối',
    metadataTitle: '📝 Metadata tùy chỉnh', metadataDesc: 'Thêm tên & ảnh tùy chỉnh cho NFT đã mint. Tạo JSON metadata tuân thủ CW721.', tokenId: 'Token ID', nftName: 'Tên NFT', imageUriLabel: 'Image URI', saveMetadataBtn: '📝 Tạo JSON Metadata',
    metadataExplain: 'PRC-721 quản lý metadata qua token_uri trỏ JSON ngoài. Upload JSON dưới lên server/IPFS, dùng URL đó làm token_uri khi mint.', copyJson: '📋 Sao chép JSON', contractHistory: 'Hợp đồng đã deploy', contractHistoryDesc: 'Hợp đồng NFT deploy thành công trên chuỗi Paxi.',
    noHistory: 'Chưa có hợp đồng deploy', toContract: '→ Nhập địa chỉ', needWallet: 'Kết nối ví trước', fillAll: 'Điền mọi trường bắt buộc', deploying: 'Đang dựng Tx deploy...', waiting: 'Chờ ký ví...', broadcasting: 'Đã phát Tx. Chờ xác nhận...', confirmWait: 'Chờ xác nhận on-chain...',
    success: '✅ Thành công', failed: '❌ Thất bại', deploySuccess: '✅ Đã deploy hợp đồng NFT!', nextStep: '👇 Tiếp: sao chép địa chỉ trên vào ô batch mint dưới', mintSuccess: 'Mint thành công', nftMintCount: 'NFT',
    connected: 'Đã kết nối', warning: '⚠️ Công cụ này chỉ cung cấp dịch vụ kỹ thuật mint NFT. Không môi giới giao dịch, định giá hay trao đổi. Mọi hậu quả do người dùng chịu.', warningEn: '⚠️ Công cụ này chỉ cung cấp dịch vụ kỹ thuật mint NFT. Không môi giới giao dịch, định giá hay trao đổi. Mọi hậu quả do người dùng chịu.',
    max10Hint: 'Tối đa 10 NFT mỗi giao dịch', mintConfirm: 'Xác nhận batch mint?\n\n· Phí dịch vụ: 5 PAXI\n· Người nhận: ', buildTx: 'Đang dựng Tx mint...',
    ipfsHint: '💡 Ảnh upload lưu trên IPFS, đảm bảo truy cập vĩnh viễn NFT.', ipfsToggle: 'Dùng lưu trữ IPFS (khuyên)', ipfsConfig: '⚙️ Cài đặt IPFS (Pinata)', ipfsJwtLabel: 'Pinata JWT', ipfsJwtPlaceholder: 'Dán Pinata JWT...', ipfsSave: '💾 Lưu', ipfsConfigured: '✓ Đã cài', ipfsNotConfigured: '⚠ Chưa cài', ipfsGetKey: '🔗 Lấy Pinata JWT',
    ipfsUploading: 'Đang upload', ipfsImageOk: '✅ Ảnh đã upload IPFS', ipfsMetaGen: 'Đang tạo & upload metadata...', ipfsUploadFail: '❌ Upload IPFS thất bại', ipfsNoJwt: 'Nhập Pinata JWT trong cài đặt IPFS trước', ipfsGateway: 'Gateway', ipfsFallback: 'IPFS không dùng được, chế độ cơ bản', ipfsNeedImage: 'Upload ảnh bìa hoặc nhập Image URI', ipfsLargeImg: 'Ảnh >100KB, bật IPFS để giảm gas',
    updTitle: '🔄 Cập nhật metadata on-chain', updDescInfo: 'Ghi đè metadata on-chain NFT đã mint (tên/ảnh/mô tả/thuộc tính) trực tiếp — không cần mint lại. Ký ví minter/chủ, chỉ gas không phí dịch vụ.',
    updDescLabel: 'Mô tả NFT', updAttrsLabel: 'Thuộc tính JSON (tùy chọn)', updAttrsPlaceholder: '[{"trait_type":"Series","value":"Genesis"}]', updBtn: '🔄 Gửi cập nhật on-chain', updSuccess: '✅ Đã cập nhật metadata', updAttrsInvalid: 'Thuộc tính JSON không hợp lệ — cần mảng như [{"trait_type":"...","value":"..."}]', updAddrInvalid: 'Sai định dạng địa chỉ hợp đồng (paxi1... tài khoản 43/hợp đồng 63 ký tự). Sao chép toàn bộ từ lịch sử deploy.',
    updConfirm: 'Ghi metadata này vào on-chain? Tên/ảnh/thuộc tính NFT đổi trực tiếp. Chỉ gas.\n\n', buildUpdTx: 'Đang dựng Tx cập nhật...', updUriTooLarge: 'token_uri metadata >64KB có thể làm Tx on-chain thất bại. Dùng link IPFS hoặc nén ảnh trước khi cập nhật.'
  }
};
