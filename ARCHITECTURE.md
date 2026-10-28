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
│  Data Service layer  paxi-data (Cloudflare Worker + D1, open-source & take-overable)   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Aggregation  │→ │ D1 Index     │→ │ Public REST API  │  │
│  │ snapshot sync│  │ proposal/val │  │ /api/v1/* read-only   │  │
│  │ Cron hourly  │  │ signing/supply│  │ OpenAPI docs     │  │
│  │ (on the hour)│  │ snapshot tables│  │ rate-limit+CORS open   │  │
│  │ LCD aggreg.  │  │              │  │                       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  Principles: read-only, no private keys, no fund custody, reproducible data, official take-overable     │
└───────────────────────────┬─────────────────────────────────┘
                            │ LCD/RPC read-only
┌───────────────────────────▼─────────────────────────────────┐
│  Paxi Chain (Cosmos SDK + CosmWasm + native Swap + DAO + IBC)    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Service Layer Specs (Aggregation Snapshot Layer · Cloudflare Workers + D1)

> **Design basis (mainnet measurements, 2026-10-28)**: this chain produces roughly **807 blocks/hour** (1,000 blocks ≈ 74 minutes), but 22 sampled blocks cross-verified against RPC `block_results` show **zero transactions in every block** (`data.txs: []` / `txs_results: null`) — the chain is in a quiet period. Measurements also confirmed: mainnet LCD's `blocks?pagination` and `cosmwasm/wasm/v1/contracts` are **not implemented**, `txs?query=tx.height>=X` returns **502**, while the **governance, validator, signing-info, supply and denom-metadata aggregation endpoints all work and return the full set in a single request**.
>
> The data layer therefore does **not** scan block by block. It uses an **aggregation snapshot model**: one request per dataset → write to D1 → incremental sync every hour. Under the chain's current state, this is the only approach that is both accurate and stable within Cloudflare's free-tier limits.

### 2.1 Data Sources (all mainnet LCD endpoints verified working)
| Snapshot | Endpoint | Returns | Use |
|---------|----------|---------|-----|
| Governance proposals | `/cosmos/gov/v1/proposals` (paginated) | full set (13 today) | governance dashboard, proposal list |
| Proposal tally | `/cosmos/gov/v1/proposals/{id}/tally` | one proposal | turnout, pass rate |
| Validators | `/cosmos/staking/v1beta1/validators` | full set (100+) | validator transparency |
| Signing / missed blocks | `/cosmos/slashing/v1beta1/signing_infos` | full set (100+) | missed-block history, commission changes |
| Total supply | `/cosmos/bank/v1beta1/supply` | full set | chain overview |
| Denom metadata | `/cosmos/bank/v1beta1/denoms_metadata` | full set | token list, decimals |
| Address balance | `/cosmos/bank/v1beta1/balances/{addr}` | one address | whale board, address profile |

- **Zero per-block scanning**: no dependency on the unimplemented `blocks` pagination endpoint nor on the broken tx index query — this removes the LCD 501/502 failure modes entirely.
- **Incremental, not full rescan**: a `last_synced_height` / `last_synced_at` watermark drives each round; only changed rows are written (proposals diffed by id, signing infos detected by `missed_blocks_counter` changes).

### 2.2 D1 Storage (Cloudflare-hosted SQLite)
- `proposals(id, title, status, submit_time, deposit_end_time, voting_end_time, final_tally, synced_at)`
- `validators(operator_address, moniker, status, jailed, tokens, commission, voting_power, synced_at)`
- `signing_infos(address, start_height, missed_blocks_counter, jailed_until, tombstoned, synced_at)`
- `supply(denom, amount, synced_at)`, `denom_metadata(base, display, symbol, exponent, synced_at)`
- `balances_snapshot(addr, denom, amount, date)` (whale board and portfolio dashboard history)
- `sync_state(key, value)` (watermarks, last success time, error counters)

### 2.3 Public REST API (read-only, free, rate-limited)
| Endpoint | Content | Front-end use |
|----------|---------|---------------|
| `GET /api/v1/governance/proposals` | proposal list + tallies | governance dashboard |
| `GET /api/v1/governance/stats` | turnout / proposal stats | governance dashboard |
| `GET /api/v1/validators` | full validator set + signing status | validator transparency page |
| `GET /api/v1/validators/{addr}/stats` | missed blocks / voting record | validator transparency page |
| `GET /api/v1/whales/top?denom=upaxi&limit=100` | whale leaderboard | whale tracker page |
| `GET /api/v1/address/{addr}/balance` | balance composition | address profile |
| `GET /api/v1/stats/overview` | chain-wide overview | data overview dashboard |
| `GET /healthz` | data-layer health status | status page |
- Spec: rate limit 60/min/IP, CORS `* ` (ecosystem reuse), OpenAPI 3 docs.
- **Front-end fallback**: every data page can query LCD directly, so functionality continues if the data layer is unavailable.

### 2.4 Deployment & Cost (Cloudflare · near-zero)
- **Shape**: Cloudflare Workers (static assets + API in one Worker) + D1-hosted SQLite + Cron Trigger.
- **Trigger cadence**: Cron runs **once per hour on the hour** (the chain is quiet — minute-level polling adds LCD load and rate-limit risk for no benefit).
- **Cost**: Workers Paid $5/mo (includes 10M requests/mo and 30M CPU-ms); D1's free allowance is 5M rows read/day, 100K rows written/day and 5GB storage — this workload writes far below that.
- **Same platform as production**: shares the account and platform with the live Paxi Lens (`paxi-lens.paxicoin.workers.dev`) — no extra server or domain.
- Operations service cost therefore drops sharply; the bulk of the operations budget is content and community (see §6).

### 2.5 Reproducibility
- Each sync records `synced_at` and its watermark, so anyone can independently reproduce a point-in-time snapshot from the same endpoints with the same parameters — the "data credibility" evidence the DAO review values most.
- A `RESYNC=1` full-rebuild mode can recreate every D1 snapshot table from scratch.

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
- **Radar**: polls for newly deployed contracts by code_id (code_id/label/creator/time), one-click to inspect.
- **Health report** (reuse decoder probeSchema live capability + LP data):
  - Whether minting right is revoked (minter=null), whether admin is renounced, whether supply can be inflated
  - Whether liquidity pool exists / depth (anti-honeypot)
  - Holder concentration (Top5 share), total supply
  - Output "safety score" + risk-item list (**data presentation only, not investment advice** — compliance red line)

### 3.4 Governance Participation Dashboard (what the DAO most wants to hear)
- Chain-wide turnout trend, proposal pass rate, average participant count; **16 validators' voting behavior comparison** (who votes, who is absent).
- Governance participation weekly-report data source (auto-fed to content operations).

### 3.5 Validator Transparency Suite
- Uptime/missed-block history (hourly snapshots record signing_infos), commission change timeline, delegation in/out leaderboard.
- Delegator yield simulator (net APR = reward − commission).

### 3.6 Data Overview Dashboard
- Circulating/locked/unlock (circulating_supply/locked_vesting/unlock_schedules) + staking ratio + pool depth + total burned — see it all on one page, daily-active anchor.

## 4. Repo Structure (new standalone repo, MIT)

```
paxi-data/                 # new: aggregation data layer (Cloudflare Worker + D1, open-source)
  src/sync.js               # Cron scheduled sync (hourly on the hour, incremental)
  src/sources.js            # LCD aggregation endpoint adapters (gov/validators/signing/supply)
  src/indexer.js            # snapshot persistence
  src/api.js                # public REST API
  src/db.js                 # D1 schema + migration
  test/                     # replay verification tests (reproducibility evidence)
  docs/openapi.yaml         # API docs
  deploy/                   # wrangler.toml + Cron trigger config
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
3. **Non-custodial**: consistent with the toolkit's "no custody" promise, only adding one publicly disclosed read-only data service (pump-watch precedent).
4. **Disclaimer**: the whale leaderboard / health check / yield simulator are all data presentation, with "not investment advice" attached.

## 6. Next-Step Development Recommendations (5 phases, ~16–18 weeks total)

| Phase | Weeks | Content | Acceptance criteria |
|-------|-------|---------|---------------------|
| P0 | 1–2 | Aggregation data layer v1: Cloudflare Worker + D1 + hourly Cron sync + /healthz + replay verification | snapshot coverage matches on-chain sampling; Cron hourly success rate ≥99% |
| P1 | 3–5 | Whale tracker + large tx flow (front-end + API) | large tx latency <2 min; whale leaderboard Top100 queryable |
| P2 | 6–9 | New contract radar + contract health check | new contract listed within 10 min; all 6 health metrics output |
| P3 | 10–13 | Governance dashboard + validator transparency + data overview | voting-rate trend vs on-chain sampling error <1% |
| P4 | 14–18 | Public API documentation, weekly-report automation, monitoring alerts, local SRI | OpenAPI published; weekly report auto-generates draft |

**Weekly cadence**: small-step releases (front-end Pages auto-deploy); one data weekly report per month (governance dynamics / pool depth / whale movements), also serving as DAO monthly-report material.

## 7. Budget Mapping (360k)
| Item | Amount | Corresponding |
|------|--------|---------------|
| **Tool development funding** | 320,000 | Continuous dev & iteration of the full suite: v1 official integration & maintenance / 6-language i18n / data-layer foundation / testing & security / community & content / wallet listing adaptation |
| **Post-launch maintenance (3 months)** | 20,000 | Cloudflare Workers + D1 data-layer running cost + monthly reports + community + contingency |
| **New: large-address transaction tracking** | 20,000 | Whale leaderboard + large-tx feed + on-chain data dashboard (ring-fenced to guarantee delivery) |
| **Total** | **360,000** | Development 320,000 + Maintenance 20,000 + Large-address tracking 20,000 |
