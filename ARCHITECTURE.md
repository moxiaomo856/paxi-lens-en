# Paxi Lens · 360k Grant Edition — Full Architecture & Development Recommendations

> Request amount: **360,000 PAXI** (tool development 320,000 + 3-month maintenance 20,000 + new large-address transaction tracking 20,000)
> Positioning upgrade: from "toolkit" → **"Paxi on-chain data layer + non-custodial toolkit"**
> This document: full architecture / data flow / new-feature specs / repo structure / security & compliance boundaries / cost model / step-by-step development plan

---

## 1. Architecture Overview (three layers)

```
┌─────────────────────────────────────────────────────────────┐
│  User layer: PaxiHub App built-in browser / Desktop browser (deep-link into App)│
└───────────────────────────┬─────────────────────────────────┘
                            │ window.paxihub (signing only) / HTTPS (read-only)
┌───────────────────────────▼─────────────────────────────────┐
│  Front-end layer  paxi-suite (GitHub Pages, pure static, MIT open-source)         │
│  · 20 live tools (signing type: build SignDoc locally → wallet signs)      │
│  · New data pages: whale tracking / large tx flow / new contract radar /           │
│     contract health check / governance dashboard / validator transparency                           │
│  · Data reads "Data Service API" first, degrades to direct LCD                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (public read-only API + rate limit)
┌───────────────────────────▼─────────────────────────────────┐
│  Data Service layer  paxi-data (new, single Node service, open-source & take-overable)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Block Scanner│→ │ SQLite Index │→ │ Public REST API  │  │
│  │ incremental  │  │ events/balance/proposal│  │ /api/v1/* read-only   │  │
│  │ scan         │  │ snapshot tables        │  │ OpenAPI docs     │  │
│  │ (pump-watch  │  │              │  │ rate-limit+CORS open   │  │
│  │  same arch)  │  │              │  │                       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  Principles: read-only, no private keys, no fund custody, reproducible data, official take-overable     │
└───────────────────────────┬─────────────────────────────────┘
                            │ LCD/RPC read-only
┌───────────────────────────▼─────────────────────────────────┐
│  Paxi Chain (Cosmos SDK + CosmWasm + native Swap + DAO + IBC)    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Service Layer Specs (server-side portion of the 100k)

### 2.1 Block Scanner (reuse pump-watch's validated architecture)
- **Incremental scan**: record last_height, each round scans from last+1 to latest (LCD `/cosmos/tx/v1beta1/txs/block/{height}` official endpoint, CLI command §2.2); on downtime use MAX_BLOCKS_PER_RUN as a safety cap; 6 concurrent fetches.
- **Event extraction** (each tx parsed into SQLite):
  | Event | Source message | Use |
  |-------|---------------|-----|
  | transfer | MsgSend/MultiSend | whale tracking, large tx flow, address timeline |
  | swap | /x.swap.types.MsgSwap, ProvideLiquidity, WithdrawLiquidity | large swap alerts, pool depth changes |
  | instantiate | MsgInstantiateContract2 | new contract radar |
  | burn / mint | wasm execute decode | burn stats, new-token issuance monitoring |
  | vote / deposit / submit | gov messages | governance dashboard, validator voting behavior |
  | delegate/undelegate/redelegate | staking messages | validator delegation flow |
- **Reproducibility**: a full-replay mode (`RESCAN=1`) can rebuild the index from height 0 — the "data credibility" evidence the DAO review values most.

### 2.2 SQLite Index (lightweight start, single VPS suffices)
- `blocks(height, ts)`, `txs(hash, height, code, ts, memo)`
- `transfers(tx_hash, from, to, denom, amount)` (denom+amount all strings)
- `swaps(tx_hash, prc20, offer_denom, offer_amount, min_receive, creator)`
- `contracts(addr, code_id, label, creator, created_height)` (new contract radar)
- `proposals/votes/validators` (governance dashboard; votes table accumulates history)
- Daily snapshot table `balances_snapshot(addr, denom, amount, date)` (whale leaderboard, portfolio dashboard history)

### 2.3 Public REST API (read-only, free, rate-limited)
| Endpoint | Content | Front-end use |
|----------|---------|---------------|
| `GET /api/v1/txs/large?min=1000000000&limit=50` | large tx flow | Large Tx Feed page |
| `GET /api/v1/whales/top?denom=upaxi&limit=100` | whale leaderboard | Whale Tracker page |
| `GET /api/v1/address/{addr}/timeline` | address activity timeline | address profile (decoder upgrade) |
| `GET /api/v1/contracts/new?limit=50` | newly listed contracts | new contract radar |
| `GET /api/v1/governance/stats` | turnout / proposal stats | governance dashboard |
| `GET /api/v1/validators/{addr}/stats` | missed blocks / delegation flow / voting record | validator transparency page |
| `GET /api/v1/stats/overview` | chain-wide overview | data overview dashboard |
- Spec: rate limit 60/min/IP, CORS `* ` (ecosystem reuse), OpenAPI 3 docs, status page `/healthz`.

### 2.4 Deployment & Cost (counted in the 36k operations)
- Single VPS (2C4G, ~$12/mo) + domain (~$10/yr); Node + PM2 + SQLite + Nginx reverse proxy.
- Can be co-deployed with the existing pump-watch on the same architecture/machine — marginal cost extremely low.
- 6-month operations service cost totals approx. **$80–100 ≈ 600–750 PAXI range** (at current price); the bulk of the operations budget is content and community (see §6).

## 3. New Feature Specs (development portion of the 100k)

### 3.1 Whale Tracker — data-layer facade
- **Chain-wide whale leaderboard**: Top holdings (upaxi + each PRC-20, valued by pool reserve); concentration metrics (Top10/Top50 share).
- **Watchlist tracking** (pure front-end, no login): user bookmarks any address → balance/activity change alerts (polling while page open + Notification API, **no backend push**).
- **Address profile page**: balance composition, recent activity timeline (API /address/timeline), first/last active.

### 3.2 Large Tx Live Feed
- Configurable threshold (default ≥100,000 PAXI or ≥ 5% of pool depth swap); web page 30s polling + manual refresh.
- Type tags: large transfer / large swap / pool in-out / new token deployment.
- Share cards (screenshot-friendly) — viral-design, naturally forwarded by community.

### 3.3 New Contract Radar + Contract Health Check (Token Sniffer-style public good)
- **Radar**: scanner flags instantiate into the leaderboard immediately (code_id/label/creator/time), one-click to inspect.
- **Health report** (reuse decoder probeSchema live capability + LP data):
  - Whether minting right is revoked (minter=null), whether admin is renounced, whether supply can be inflated
  - Whether liquidity pool exists / depth (anti-honeypot)
  - Holder concentration (Top5 share), total supply
  - Output "safety score" + risk-item list (**data presentation only, not investment advice** — compliance red line)

### 3.4 Governance Participation Dashboard (what the DAO most wants to hear)
- Chain-wide turnout trend, proposal pass rate, average participant count; **16 validators' voting behavior comparison** (who votes, who is absent).
- Governance participation weekly-report data source (auto-fed to content operations).

### 3.5 Validator Transparency Suite
- Uptime/missed-block history (scanner records signing_infos polling), commission change timeline, delegation in/out leaderboard.
- Delegator yield simulator (net APR = reward − commission).

### 3.6 Data Overview Dashboard
- Circulating/locked/unlock (circulating_supply/locked_vesting/unlock_schedules) + staking ratio + pool depth + total burned — see it all on one page, daily-active anchor.

## 4. Repo Structure (new standalone repo, MIT)

```
paxi-data/                 # new: data service (Node + SQLite, open-source)
  src/scanner.js           # block scan (pump-watch same architecture)
  src/indexer.js           # event extraction to DB
  src/api.js               # public REST API
  src/db.js                # SQLite schema + migration
  test/                    # replay tests (reproducibility evidence)
  docs/openapi.yaml        # API docs
  deploy/                  # PM2 + Nginx config
paxi-suite/                # existing: front-end (GitHub Pages)
  appjs/tools/whale-tracker.js   # new
  appjs/tools/large-tx.js        # new
  appjs/tools/contract-radar.js  # new
  appjs/tools/contract-check.js  # new (contract health check)
  appjs/tools/governance-dash.js # new
  appjs/tools/validator-suite.js # new
```

## 5. Security & Compliance Boundaries (written into the proposal)
1. **Read-only**: the data service only calls LCD/RPC read-only endpoints, never touches signing / private keys / funds.
2. **Take-overable**: fully open-source + replay scripts, the official team can take over and run with one click.
3. **Non-custodial**: consistent with the toolkit's "no custody" promise, only adding one publicly disclosed scanning service (pump-watch precedent).
4. **Disclaimer**: the whale leaderboard / health check / yield simulator are all data presentation, with "not investment advice" attached.

## 6. Next-Step Development Recommendations (5 phases, ~16–18 weeks total)

| Phase | Weeks | Content | Acceptance criteria |
|-------|-------|---------|---------------------|
| P0 | 1–2 | Scanner service v1: SQLite + block scanner + /healthz + replay tests | catch-up rescan ≤5 min; replay from height 0–N matches on-chain sampling |
| P1 | 3–5 | Whale tracker + large tx flow (front-end + API) | large tx latency <2 min; whale leaderboard Top100 queryable |
| P2 | 6–9 | New contract radar + contract health check | new contract listed within 10 min; all 6 health metrics output |
| P3 | 10–13 | Governance dashboard + validator transparency + data overview | voting-rate trend vs on-chain sampling error <1% |
| P4 | 14–18 | Public API documentation, weekly-report automation, monitoring alerts, local SRI | OpenAPI published; weekly report auto-generates draft |

**Weekly cadence**: small-step releases (front-end Pages auto-deploy); one data weekly report per month (governance dynamics / pool depth / whale movements), also serving as DAO monthly-report material.

## 7. Budget Mapping (360k)
| Item | Amount | Corresponding |
|------|--------|---------------|
| **Tool development funding** | 320,000 | Continuous dev & iteration of the full suite: v1 official integration & maintenance / 6-language i18n / data-layer foundation / testing & security / community & content / wallet listing adaptation |
| **Post-launch maintenance (3 months)** | 20,000 | VPS 3 months + monthly reports + community + contingency |
| **New: large-address transaction tracking** | 20,000 | Whale leaderboard + large-tx feed + on-chain data dashboard (ring-fenced to guarantee delivery) |
| **Total** | **360,000** | Development 320,000 + Maintenance 20,000 + Large-address tracking 20,000 |
