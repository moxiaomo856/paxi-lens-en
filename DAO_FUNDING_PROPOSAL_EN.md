# Paxi Lens · Official DAO Funding Proposal (360,000 PAXI)

> Purpose: Apply to the Paxi DAO community pool for **360,000 PAXI** to deliver and operate the Paxi Lens on-chain data layer + non-custodial toolkit (one-time lump-sum grant; tool launch plus developer funding).
> Status: **Draft** — one-time lump-sum 360,000 PAXI (development 342,000 + operations 18,000 / 6 months).
> Supporting materials: `ARCHITECTURE.md` (full architecture & dev plan), `ARCHITECTURE_DIAGRAM.svg` (architecture diagram), `ROADMAP.md`, `LICENSE` (MIT), `DAO_FUNDING_PROPOSAL.md` (Chinese version).

---

## 1. Title
**Paxi Lens — The Paxi On-Chain Data Layer & Non-Custodial Toolkit. Applying for 360,000 PAXI (one-time lump-sum) from the Paxi DAO Community Pool**

## 2. Abstract
Paxi Lens is a **pure front-end, non-custodial** toolkit for the Paxi ecosystem. All 20 tools are live (live at **https://paxi-lens.paxicoin.workers.dev/** · open-source MIT repository `moxiaomo856/paxi-lens`, full commit history): decoder, token issuance, Swap helper (native AMM), allowance manager, burning, redelegation, governance proposals/voting, delegation, batch transfers, IBC queries, tx dry-run and more. **Private keys and funds never leave the user's wallet.** This grant of 360,000 PAXI (one-time lump-sum payment; the DAO disburses in a single tranche, and any further funding requires a new proposal) funds the launch of the toolkit plus developer funding: ① the official integration, maintenance and continued availability of the delivered v1; ② official adoption of the **delivered 6-language internationalization** (English / Japanese / Korean / Indonesian / Vietnamese / Traditional Chinese full UI, plus multilingual legal documents) to serve the ecosystem's international users; ③ building the **public read-only data layer** the chain currently lacks — whale tracking, large-tx feed, new-contract radar with contract safety checks, governance participation dashboard, and validator transparency; ④ 6 months of operations. All tool service fees go 100% to a single transparent address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`.

## 3. Problem Statement
- New users lack a **unified, trustworthy, non-custodial** entry point for Paxi; governance participation is hard.
- On-chain data is unobservable: whale movements, large transactions, new contract deployments, governance participation rates, validator performance — **the ecosystem has no public, reproducible dashboards**; 469k accounts operate in information asymmetry.
- Newly issued PRC-20 contracts lack public safety checks (mint authority revoked? liquidity? holder concentration), and users keep falling for honeypots.
- Existing third-party tools are custodial or semi-custodial, creating key/fund risk.

## 4. Solution & Feature Matrix
| Layer | Content |
|-------|---------|
| **Delivered v1 (20 tools, NOT funded by this grant)** | Decoder, issuance (PRC-20/721), Swap helper, allowance manager, batch transfer, burning, NFT launcher, balances, address book, IBC query, claim rewards/compound, delegate/undelegate, governance voting, redelegate, validator compare, proposals, tx dry-run, gas calc, address convert |
| **New: data service layer (core of the 100k)** | Block Scanner (read-only indexing, the architecture proven by pump-watch) + SQLite index + public REST API (rate-limited, OpenAPI, takeover-ready) |
| **New: data applications (front-end)** | Whale tracker, large-tx live feed, new-contract radar, contract safety check, governance dashboard, validator transparency, chain overview |

> Compliance exclusions (deliberately not shipped): NFT marketplace (Authz risk), mini-games, wallet itself, prediction-market clones (division of labor with the official team).

## 5. Deliverables
1. Deployable pure front-end dApp (20 tools + 7 data applications, 6-language i18n: en/ja/ko/id/vi/zh-Traditional, with multilingual legal documents).
2. Open-source `paxi-data` service: scanner + indexer + public API + replay tests (reproducibility evidence).
3. Single-fee-collector integration with pre-signature fee/receiver disclosure.
4. README + architecture diagram.
5. Public GitHub repositories (MIT, with commit history/releases/OpenAPI docs).

## 6. Milestones (~18 weeks)
- **M1 (wk 1–2) · Data service v1**: Block Scanner + SQLite + /healthz + replay tests. Acceptance: catch-up scan ≤5 min behind; replay matches on-chain sampling.
- **M2 (wk 3–5) · Whale tracker + large-tx feed**. Acceptance: large-tx latency <2 min; top-100 holders queryable.
- **M3 (wk 6–9) · New-contract radar + contract safety check**. Acceptance: new contracts listed <10 min; 6-check report complete.
- **M4 (wk 10–13) · Governance dashboard + validator transparency + chain overview**. Acceptance: voting-rate trend within <1% of on-chain sampling.
- **M5 (wk 14–18) · Public API docs + weekly-report automation + SDK self-hosting & SRI**. Acceptance: OpenAPI published; weekly report auto-generated.
- Throughout: weekly releases, monthly fund-usage reports (on-chain verifiable).

## 7. Budget Breakdown (final · 360,000 PAXI)
| Item | Amount (PAXI) | Share | Notes |
|------|--------------|-------|-------|
| Dev · Delivered v1 official integration & maintenance | 120,000 | 33.3% | Deep-link integration / official PR collaboration / docs / long-term availability (no repeat payment for what's built) |
| Dev · Multilingual internationalization (**delivered**) | 60,000 | 16.7% | 6-language UI (en/ja/ko/id/vi/zh-Traditional, ~845 keys × 5 packs) + 6-language legal documents, already shipped and live; grant covers official adoption & continued maintenance |
| Dev · Data service layer | 50,000 | 13.9% | Block scanner + SQLite index + public read-only REST API (open-source, takeover-ready) |
| Dev · Data application front-end | 60,000 | 16.7% | Whale tracker / large-tx feed / contract radar / safety check / governance dashboard / validator transparency / overview — 7 apps |
| Dev · Testing & security hardening | 30,000 | 8.3% | SDK self-hosting + SRI + declaration-collision guard + replay tests (closes known risks) |
| Dev · Community & content operations | 22,000 | 6.1% | ko/ru/es community expansion + weekly/monthly report content ops |
| Operations · 6 months | 18,000 | 5.0% | Scanner VPS 6 months + monthly fund-usage reports + community + contingency |
| **Total** | **360,000** | 100% | Development 342,000 + Operations 18,000 |

## 8. KPIs
- ≥ **500** monthly active wallets;
- ≥ **3,000** tool invocations / month;
- ≥ **1,500** on-chain transactions initiated via the toolkit / month;
- Governance proposal/voting participation **+20%** vs. launch baseline;
- Data layer: ≥ **2,000** monthly visits across whale/feed/dashboards; **3+** monthly fund-usage reports (on-chain verifiable);
- Multilingual: 6-language UI fully delivered and live (en/ja/ko/id/vi/zh-Traditional); non-English interface usage share ≥ **30%** within 3 months of the data-layer launch.

## 9. Risks & Mitigation
- **Key/fund safety**: non-custodial architecture, signing inside the wallet by design, no keys stored.
- **Data trustworthiness**: read-only indexing + full replay scripts — anyone can reproduce; official takeover-ready.
- **Service continuity**: single VPS + PM2 + health-check alerts; the front end degrades to direct LCD queries, so tool core functions survive data-service outages.
- **Compliance**: whale ranks / safety checks / yield simulations are data presentation with disclaimers; no prize pools.
- **Claim consistency**: the scanner is a disclosed read-only component (pump-watch precedent); the non-custodial promise is unchanged.

## 10. Decided Positions
1. **Service fees (Decision A — retained)**: all fees flow to the single transparent address. Wording: *"Service fees are part of the sustainable operating model; DAO funding buys the public goods that fees cannot justify — the data layer, governance tooling, official integration, documentation. Neither replaces the other."*
2. **Data service layer (fully disclosed)**: the Block Scanner is an open, read-only, takeover-ready component; its costs are budgeted under operations; non-custodial, holds no keys.
3. **Collector address**: `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` is the applicant-operated treasury — on-chain verifiable, monthly flow disclosure; DAO grant funds are managed at the same address.
4. **Materials**: architecture doc ✅ · architecture diagram ✅ (`ARCHITECTURE_DIAGRAM.svg`) · roadmap ✅ · LICENSE ✅ · bilingual proposal ✅.

## 11. Transparency Declaration
> **Service fees are transparently disclosed; no prize pools; contracts hold no user funds.** 100% of tool service fees go to the single address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` — on-chain verifiable, no intermediary accounts, no diversion. DAO grant funds are managed at the same address with monthly public flow reports. The data service layer is read-only, open-source, and takeover-ready.

## 12. Roadmap (see `ROADMAP.md` and `ARCHITECTURE.md`)
- **Phase 1 (data foundation)**: scanner v1 → whale tracker + large-tx feed.
- **Phase 2 (safety & governance)**: contract radar + safety check → governance dashboard + validator transparency + chain overview.
- **Phase 3 (public goods)**: public API documentation, weekly-report automation, SDK self-hosting.
- 2–4 items per period with monthly releases; future directions (deeper governance analytics, validator tooling, API ecosystem) each have trigger conditions and will be submitted separately — **deliberately not part of this request**.
