# Paxi Suite × PaxiHub Feature Gap Analysis (industry-expert comparison)

> Method: Scraped PaxiHub official docs to verify its real capabilities → 2 industry experts analyzed in parallel (wallet product strategy + Cosmos/DeFi deep toolchain) → conclusions converged.
> Positioning principle: **PaxiHub = mass-market entry layer (wallet + flagship dApp); paxi-suite = the "professional + batch + precise" tool layer built on top of the official 3 injected APIs.**

## I. PaxiHub Actual Capabilities (verified against official docs)
- Only 3 injection interfaces: `getAddress()` / `signMessage()` / `signAndSendTransaction()` (no signDirect native message, no event subscription)
- Built-in: dApp browser, PAXI/PRC-20/NFT single transfer, mobile App (deep link `paxi://hub/explorer?url=` can be launched)
- Official flagship dApp: Paxi Pick (prediction market)
- **Chain has a native AMM Swap module but no usable front-end**: official example slippage protection is fixed at **50%** (effectively useless)
- ⚠️ Official doc sample code has a `new Uint8Array(sender.public_key)` public-key bug (already fixed in paxi-suite, can serve as a collaboration entry point for an official PR)

## II. Gap Matrix (expert converged version)

| Feature | PaxiHub | paxi-suite | Recommendation | Priority | Fee compatible | Effort |
|---------|---------|------------|----------------|----------|----------------|--------|
| **Swap Assistant** (pool query / quote / price impact / custom slippage / MinReceive / atomic allowance packaging) | ❌ None | ❌ None | **Add** (addresses the pain of official 50% slippage) | **P0** | ✅ per-tx fee | 3–4 person-days |
| **Deep-link launch** (mobile "Open in PaxiHub App" + desktop QR code) | ✅ launchable | ❌ dead-link doc page when wallet not installed | **Add** (best ROI) | **P0** | free traffic | 0.5 person-days |
| **Allowance authorization management** (query / increase / decrease / zero-out revoke) | ❌ None | ❌ only decoder can view | **Add** (security must-have, Swap prerequisite) | **P0** | free / can charge | 2 person-days |
| Signed-message verifier (signature verification + SIWP template + phishing-injection detection) | ⚠️ can sign but not verify | ❌ None | Add (trust brand) | P1 | free | 1–2 person-days |
| Portfolio overview dashboard (PAXI+PRC-20+NFT+delegation+rewards, using pool reserve for PRC-20 valuation) | ❌ None | ⚠️ scattered across tools | Add | P1 | free | 2.5 person-days |
| MsgVoteWeighted weighted voting (e.g., 70/30 split) | ❌ None | ⚠️ only equal-weight 4 options | Refine | P1 | — | 0.5 person-days |
| Feegrant management (who I subsidized / who subsidizes me + initiate/revoke) | ❌ None | ⚠️ only decode | Add | P1 | — | 1.5 person-days |
| Authz panel (granter/grantee dual view + revoke) | ❌ None | ⚠️ no standalone panel | Add | P1 | — | 1.5 person-days |
| Delegation yield analyzer (by validator net APR, localStorage snapshots accumulate history) | ❌ None | ⚠️ only network-wide APR | Add | P1 | free | 2 person-days |
| History/tax CSV export (by address + time period, pull transactions) | ❌ None | ⚠️ only scattered exports | Add | P1 | free | 2 person-days |
| LP liquidity management (add/remove + LP share) | ❌ None | ❌ only decode | Swap phase 2 | P1 | ✅ can charge | 1.5 person-days |
| Multilingual expansion (ko/ru/es, structure already templated) | ✅ official multilingual | ⚠️ only zh/en | Refine | P1 | free traffic | 2–3 person-days |
| Mobile responsive (batch transfer / balance / decoder — three high-frequency pages) | ⚠️ in-App rendering average | ⚠️ desktop-first | Refine | P1 | free | 1–2 person-days |
| IBC Transfer initiate + packet tracking | ❌ only same-chain transfer | ❌ ibc-query pure read-only | P2 watch (channel not enabled) | P2 | ✅ | 2 person-days |
| NFT single transfer | ✅ has | ✅ batch already covers, stronger | only need to add single-item action in "My NFT" | P2 | — | 0.5 person-days |
| Official collaboration PR (fix doc public-key bug + suggest adding signDirect API) | — | ✅ already has fix experience | **strategic asset**, exchange for official listing / deep-link whitelist | P1 | free | 0.5 person-days |

## III. P0 MVP Key Points

**1. Swap Assistant (the only blank with monetization potential)**
- Pool query `GET /paxi/swap/pool/{contract}` → reserve_paxi/reserve_prc20 **full BigInt string arithmetic**; read token_info per PRC-20 contract for decimals, do not hardcode 6.
- Quote (constant product x·y=k): `out = reserveOut·in / (reserveIn·10000 + in·feeBps) · 10000`; slippage customizable 0.1%–50% (default 1%); `minReceive = out × (10000 - slipBps) / 10000`, confirmation box before signing **must forcibly display "minimum received"**.
- ⚠️ typeUrl must be verified first: official example `/x.swap.types.MsgSwap` vs decoder-core.js:340's `/paxi.swap.v1.MsgSwap` — verify both typeUrls against one real historical swap using tx-dryrun before hardcoding; if UMD has not registered this type, hand-write proto encode.
- PRC-20→PAXI direction: `[increase_allowance→swap module(paxi1mfru9azs5nua2wxcd4sq64g5nt7nn4n80r745t), MsgSwap]` atomically packaged in same Tx, reuse `buildSignAndBroadcast`; PAXI→PRC-20 direct MsgSwap.
- Pool discovery: LCD has no pool-list endpoint → localStorage whitelist + paste-address manual add. Fee model consistent with batch transfer (fixed per-tx fee to single address).

**2. Deep-link integration (0.5 person-days)**
- Modify `checkWalletInjection` failure branch: mobile UA → "🚀 Open in PaxiHub App" button (`paxi://hub/explorer?url=<encodeURIComponent(location.href)>`); desktop → canvas QR code; doc redirect downgraded to secondary option; support `?deep=1` to force display.

**3. Allowance management (2 person-days)**
- Query `smart/{btoa({allowance:{owner,spender}})}`; revoke = decrease until current allowance reaches zero; spender whitelist includes swap module and NFT marketplace grant address.

## IV. Explicitly Not Building (expert consensus)
| Feature | Reason |
|---------|--------|
| Wallet core / mnemonic management / built-in browser | Directly conflicts with official; violates non-custodial positioning |
| Prediction market / generic trading UI replica | Conflicts with Paxi Pick / no differentiation |
| Limit order / DCA conditional order | Native AMM has no order book; pure front-end becomes invalid on page close; building it requires backend + custody, violating hard constraints |
| Front-end self-built multisig | PaxiHub `signAndSendTransaction` only returns single-sig, cannot split-sign; wait for official multisig interface |
| Transaction push notifications | Requires always-on backend; pump-watch is already the only backend exception, do not expand |

## V. Found Along the Way (to fix)
- `validator-compare.js:69` uses `Number(allSum)` to convert network-wide staking BigInt, risking precision overflow as total grows → change to `Number(allSum / 1000000n)`.

## VI. Strategic One-Liner
The official team does "wallet + flagship dApp"; paxi-suite does the "professional + batch + precise" layer on top of the official 3 APIs that the official team itself hasn't done well. **The Swap Assistant is the only blank with monetization potential; deep-link integration is a zero-cost user-return pipeline; submitting the public-key bug PR to the official team is the ticket to ecosystem collaboration and DAO grant endorsement.**
