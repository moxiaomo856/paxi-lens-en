# Paxi Lens · Official DAO Funding Proposal (360,000 PAXI Edition)

> Purpose: To request **360,000 PAXI** from the Paxi DAO community pool for the launch of Paxi Lens — the "on-chain data layer + non-custodial toolkit" — and for developer funding (a one-time lump-sum payout).
> Status: **Draft**. Amount structure: 342,000 PAXI for development (including delivered v1 integration & maintenance + delivered 6-language internationalization + new data-layer features + testing & security + community & content) + 18,000 PAXI for operations (6 months).
> Supporting materials: `ARCHITECTURE.md` (full architecture & development plan), `ARCHITECTURE_DIAGRAM.svg` (architecture diagram), `ROADMAP.md` (feature roadmap), `LICENSE` (MIT).
> Recommendation: Attach an English version (`DAO_FUNDING_PROPOSAL_EN.md`) when formally submitting.

---

## 1. Title
**Paxi Lens — Paxi On-Chain Data Layer and Non-Custodial Toolkit, requesting a 360,000 PAXI grant from the DAO community pool (one-time lump-sum payout)**

## 2. Summary
Paxi Lens is a **pure front-end, non-custodial** all-in-one toolkit for the Paxi ecosystem. All 20 tools are already live (live at **https://paxi-lens.paxicoin.workers.dev/** · open-source MIT repository `moxiaomo856/paxi-lens`, with full commit history, and having passed a security audit): decoder, token issuance, Swap assistant (native AMM), authorization management, burning, staking migration, governance proposal/voting, delegation, batch transfer, IBC query, transaction simulation, and more. **Private keys and funds never leave the user's wallet.** This project requests **360,000 PAXI from the Paxi DAO community pool (one-time lump-sum payout; the DAO disburses as a single payment, and any further funding requires a new proposal)**, of the nature "tool launch + developer funding": ① official integration, maintenance, and continued availability of the delivered v1; ② official adoption of the **delivered 6-language internationalization** (English / Japanese / Korean / Indonesian / Vietnamese / Traditional Chinese full UI, plus multilingual legal documents) to serve the ecosystem's international users; ③ building a **public read-only data layer** that does not yet exist on-chain (whale tracking, large transaction feed, new contract radar & contract health check, governance participation dashboard, validator transparency); ④ 6 months of operations service. All tool service fees go 100% to a single transparent address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`.

## 3. Problem Statement
- New users lack a **unified, trustworthy, non-custodial** entry point for Paxi operations; governance participation has a high barrier to entry.
- On-chain data is unobservable: whale movements, large transactions, new contract launches, governance participation rates, validator performance — **the ecosystem has no public, reproducible data dashboard**; 469k accounts and the community operate under information asymmetry.
- Newly issued PRC-20 contracts lack public security checks (whether minting rights are revoked, whether there is liquidity, holder concentration), and users frequently hit honeypot/scam tokens.
- Existing third-party tools are mostly custodial or semi-custodial, posing private-key and fund risks.

## 4. Solution & Feature Matrix
| Layer | Content |
|-------|---------|
| **Delivered v1 (20 tools, not in scope of this grant)** | Decoder, token issuance (PRC-20/721), Swap assistant, authorization management, batch transfer, burning, NFT launch, balance, address book, IBC query, claim rewards/restake, delegate/undelegate, governance voting, change staking, validator comparison, governance proposal, transaction simulation, Gas calculation, address conversion |
| **New: Data Service Layer (100k core)** | Block Scanner (read-only block scan indexing, pump-watch validated architecture) + SQLite index + public REST API (rate-limited, OpenAPI, take-overable by the official team) |
| **New: Data Applications (front-end new tools)** | Whale tracker, large transaction live feed, new contract radar, contract health check, governance participation dashboard, validator transparency, data overview dashboard |

> Compliance exclusions (proactively avoided): NFT marketplace (Authz risk), mini-games, wallet itself, prediction-market replica (boundary with official division of labor).

> 说明：线上套件另含一个「NFT 市场」工具，但它只是**只读画廊 + 非托管挂单意向板**（无 Authz 授权、无链上结算、无资金托管，所有结算均在用户钱包内自行完成），与上方排除的「Authz 式 NFT 交易撮合市场」**本质不同**，不构成对排除项的违背。

## 5. Deliverables
1. Deployable pure front-end dApp (20 tools + 7 data applications, 6-language i18n: en/ja/ko/id/vi/zh-Traditional, with multilingual legal documents).
2. `paxi-data` open-source data service: scanner + index + public API + replay tests (reproducibility evidence).
3. Single receiving address integration with a pre-sign fee/recipient disclosure mechanism.
4. README + architecture diagram.
5. Public GitHub repository (MIT, with commit history / Releases / OpenAPI docs).

## 6. Milestones (360k · ~18 weeks total)
- **M1 (Weeks 1–2) · Data Service v1**: Block Scanner + SQLite + /healthz + replay tests; acceptance: catch-up rescan ≤5 min, replay consistent with on-chain sampling.
- **M2 (Weeks 3–5) · Whale Tracker + Large Tx Feed**: acceptance: large tx latency <2 min, whale leaderboard Top100 queryable.
- **M3 (Weeks 6–9) · New Contract Radar + Contract Health Check**: acceptance: new contract listed within 10 min, all 6 health-check metrics output.
- **M4 (Weeks 10–13) · Governance Dashboard + Validator Transparency + Data Overview**: acceptance: voting-rate trend vs on-chain sampling error <1%.
- **M5 (Weeks 14–18) · Public API documentation + weekly report automation + SDK localization + SRI**: acceptance: OpenAPI published, weekly report auto-generated.
- Throughout: weekly releases, monthly fund-use report (on-chain verifiable).

## 7. Budget Breakdown (finalized · 360,000 PAXI)
| Item | Amount (PAXI) | Share | Note |
|------|---------------|-------|------|
| Development · Delivered v1 official integration & maintenance | 120,000 | 33.3% | Deep-link integration / official PR collaboration / security audit / docs / ensuring long-term availability (no duplicate payment for already-built parts) |
| Development · Multilingual internationalization (**delivered**) | 60,000 | 16.7% | 6-language UI (en/ja/ko/id/vi/zh-Traditional, ~845 keys × 5 packs) + 6-language legal documents, already shipped and live; grant covers official adoption & continued maintenance |
| Development · Data service layer | 50,000 | 13.9% | Block scanning + SQLite index + public read-only REST API (open-source, take-overable) |
| Development · Data application front-end | 60,000 | 16.7% | Whale tracker / large tx feed / contract radar / contract health check / governance dashboard / validator transparency / overview, 7 in total |
| Development · Testing & security hardening | 30,000 | 8.3% | SDK localization + SRI + declaration-conflict guard + replay tests (closing known risks) |
| Development · Community & content operations | 22,000 | 6.1% | ko/ru/es community expansion + weekly/monthly content operation material |
| Operations · 6 months | 18,000 | 5.0% | Scanner VPS for 6 months + monthly fund-use report + community + contingency |
| **Total** | **360,000** | 100% | Development 342,000 + Operations 18,000 |

## 8. KPIs (baseline targets)
- Monthly active wallets ≥ **500**;
- Monthly tool invocations ≥ **3,000**;
- On-chain transactions initiated through this toolkit ≥ **1,500 tx/month**;
- Governance proposal/voting participation up ≥ **20%** vs launch baseline;
- Data layer: whale leaderboard / tx feed / governance dashboard monthly visits ≥ **2,000**; monthly fund-use reports **3+** (on-chain verifiable);
- Multilingual: 6-language UI fully delivered and live (en/ja/ko/id/vi/zh-Traditional); non-English interface usage share ≥ **30%** within 3 months of the data layer launch.

## 9. Risks & Mitigation
- **Private-key/fund security**: Non-custodial architecture + in-wallet signing (audit confirms no private key written to disk).
- **Data credibility**: Read-only index + full replay script, reproducible & verifiable by anyone; take-overable by the official team.
- **Service continuity**: Single VPS + PM2 + health-check alerts; front-end degrades to direct LCD connection, data-service failure does not affect core toolkit functionality.
- **Compliance**: Whale leaderboard / health check / yield simulation are all data presentation, with disclaimers attached; no prize pool.
- **Statement consistency**: The scanner service is a publicly disclosed read-only component (precedent: pump-watch); the non-custodial commitment is unchanged.

## 10. Settled Positions
1. **Service fee (Position A · retained)**: Existing service fees all go to a single transparent address. Wording: "Service fees are part of a sustainable operating model; what the DAO grant buys is the public good that fees cannot justify — the data layer, governance tools, official integration, documentation. The two do not substitute for each other."
2. **Data service layer (disclosed in full)**: Block Scanner is a public read-only component, open-source and take-overable, with its cost counted in the operations budget; non-custodial, no private keys held.
3. **Receiving address ownership**: `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` is the applicant's operating treasury address, on-chain verifiable and disclosed monthly; DAO grant funds are managed at the same address.
4. **Material checklist**: Architecture doc ✅, architecture diagram ✅ (`ARCHITECTURE_DIAGRAM.svg`), roadmap ✅, LICENSE ✅, CN/EN proposal ✅.

## 11. Fund-Use Transparency Statement (compliance selling point)
> **No user-fee dispute items — transparently disclosed; no prize pool; contracts do not hold user funds.** All tool service fees go 100% to a single official address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`, on-chain verifiable, no intermediate accounts, no misappropriation. DAO grant funds are managed at the same address, with monthly public flow disclosure. The data service layer is read-only, open-source, and take-overable by the official team.

## 12. Roadmap (see `ROADMAP.md` and `ARCHITECTURE.md`)
- **Phase One (data foundation)**: Scanner service v1 → whale tracker + large transaction feed.
- **Phase Two (security & governance)**: New contract radar + contract health check → governance dashboard + validator transparency + data overview.
- **Phase Three (public good)**: Public API documentation, weekly report automation, SDK localization.
- Each phase 2–4 items, a release every month; subsequent directions (deepening governance data services, validator tools, API ecosystem) each have trigger conditions and are reviewed separately after verification — **deliberately kept out of this application**.
