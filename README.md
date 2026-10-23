# Paxi Lens · Paxi On-Chain Toolkit

Paxi Network ecosystem all-in-one toolkit: **on-chain decoding + token issuance + burning + asset management + staking + governance**, pure front-end deployment, zero server cost.

> Consolidated from several independent projects: paxi-lens (originally the paxi-toolbox main repo, now moxiaomo856/paxi-lens), paxi-decoder (on-chain decoder), paxi-pump (one-click token issuance), burn (token burner).
> The consolidation was parallel-audited by two domain experts (consolidation correctness + security & compliance); all issues found in the audit have been fixed.

## Feature Overview

| Feature | Type | Description |
|---------|------|-------------|
| 🔍 On-chain Decoder | read-only | Translates transaction stories into plain language, discovers contract functions via live testing, sandbox, batch decode, failure diagnosis |
| 🚀 Custom Token Issuance | signing | Templated PRC-20 (25 PAXI) / PRC-721 (50 PAXI) deployment, minting permission auto-revoked after issuance |
| 🔥 Token Burner | signing | Calls PRC-20 burn method to permanently destroy tokens, no platform fee |
| 📤 Batch Transfer | signing | PAXI/PRC-20/NFT batch send, CSV import, packaged single signature |
| 💰 Balance Query | read-only | Batch multi-address balance + PRC-20 holdings, export CSV |
| 🎨 NFT Launch | signing | Three-step NFT collection creation (IPFS metadata) |
| 🖼️ My NFT | read-only | View all info of NFTs held by an address |
| 🔄 Address Conversion | read-only | Bech32 cross-chain prefix conversion |
| 🔄 Staking Migration | signing | One-click validator switch, no unbonding wait |
| ⛽ Gas Calculator | read-only | Fee estimation for various transaction types |
| 🏦 Validator Comparison | read-only | APR / commission rate / voting weight |
| 📦 Governance Proposal | signing | Text / parameter-change proposal submission and withdrawal |

**Not consolidated** (compliance considerations, code not included in repo): NFT marketplace (Authz authorization risk), mini-games.

## Running

```bash
cd paxi-suite
python -m http.server 8080
# Open http://127.0.0.1:8080 in browser (recommended to open inside PaxiHub App's built-in browser to connect wallet)
```

- Supports mainnet/testnet switching (top-right); decoder currently fixed to mainnet (testnet has no contract ecosystem)
- Supports `?tool=decoder&hash=<tx-hash>` URL direct decode

## Consolidation Architecture

```
index.html
├── shared.js            # Common layer: network config / sign-broadcast / Gas simulation / error mapping
├── compat.js            # PaxiCosmJS compatibility layer (message encoder)
├── decoder-core.js      # Decoder core engine v2 (event parsing / story generation / schema probing)
├── appjs/core.js        # Shell: i18n / state / wallet / home
├── appjs/tools/*.js     # 12 tool modules (TOOL_REGISTRY registration, IIFE closure isolation)
└── templates.json       # Pump issuance template
```

- Module isolation: all three newly ported modules use IIFE closures, no global leakage; `test/check-decls.js` guards 221 top-level declarations with zero conflicts
- Wallet linkage: top bar connect/disconnect wallet notifies pump/burn in real time to refresh status
- Network linkage: pump/burn follow the top-right main/testnet switch

## Security Audit Conclusion (fixed)

- ✅ pump/burn clearly display service fee amount and receiving address before signing, so users can see where funds go
- ✅ burn amount conversion uses BigInt (`parseFloatToRawUnits`), no floating-point error, truncation rounds down (no over-burn); confirmation box shows both original input and converted result
- ✅ All on-chain data rendering passes through esc escaping (including single and double quotes); CSV export has formula-injection protection
- ✅ Broadcast result validates txhash, node anomalies do not falsely report success
- ⚠️ Known risk: `paxi-cosmjs.umd.js` loads from official domain (no SRI), ImgBB API key exposed in front-end — both are pre-existing designs of the original project; recommend localizing SDK later

## Testing

```bash
node test/check-decls.js    # Global declaration conflict check (0 conflicts)
# Decoder core engine tests see ../paxi-decoder (same decoder-core.js, all 181 pass)
```

## Disclaimer

This toolkit is provided solely for on-chain data query and wallet-operation assistance. It does not provide any token exchange, trade matching, pricing guidance, or information-intermediation service, and does not constitute any investment advice. All on-chain operations by users are self-initiated; please comply with the laws and regulations of your country or region.
