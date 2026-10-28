# Paxi Lens · Official Wallet Listing + 360,000 PAXI DAO Community-Pool Grant (Combined Proposal)

> **Purpose (one proposal, two objectives)**:
> ① **Ask the official wallet team to list Paxi Lens in the wallet's in-app dApp search**, so users can find and open it without memorising a URL — reachable via the `paxi://` deep link (`paxi://hub/explorer?url=<page>`).
> ② **Apply for a one-time lump-sum 360,000 PAXI from the Paxi DAO community pool** as developer funding and sustained operations for the Paxi Lens team.
>
> Both objectives are submitted as a single proposal because they are the two ends of one value chain: **wallet listing solves "users can't find it"; the grant solves "the tool stays alive and keeps improving."** Neither is complete alone — a listed tool that rots is a burden on the ecosystem; funding without a distribution channel converts at nearly zero rate.
>
> **Status**: Draft. Amount structure: development 342,000 PAXI (including **official-wallet dApp listing adaptation 45,000** + delivered v1 integration & maintenance 75,000 + delivered 6-language internationalization 60,000 + data service layer 50,000 + data application front-end 60,000 + testing & security hardening 30,000 + community & content 22,000) + operations 18,000 PAXI (6 months).
> **Recipient (community-pool payout)**: `paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd`
> **Supporting materials**: `ARCHITECTURE.md` (full architecture & dev plan), `ARCHITECTURE_DIAGRAM.svg` (architecture diagram), `ROADMAP.md`, `LICENSE` (MIT).
> **Note**: Attach `DAO_FUNDING_PROPOSAL.md` (Chinese version) when formally submitting.

---

## 1. Title
**Paxi Lens — Requesting that the official wallet list Paxi Lens in its in-app dApp search, and applying for a 360,000 PAXI one-time grant from the DAO community pool for the development team (two objectives, one proposal)**

## 2. Abstract
Paxi Lens is a **pure front-end, non-custodial** all-in-one toolkit for the Paxi ecosystem. All 20 tools are live (live at **https://paxi-lens.paxicoin.workers.dev/** · MIT repository `moxiaomo856/paxi-lens`, full commit history, security-audited): decoder, token issuance, Swap helper (native AMM), allowance manager, burning, governance proposal/voting, batch transfers, IBC queries, tx dry-run and more. **Private keys and funds never leave the user's wallet.**

This proposal submits **one proposal with two objectives** to the DAO:

**Objective 1 · Official wallet dApp listing**: request that the official wallet team list Paxi Lens in the wallet's **dApp search interface**, opening the target tool page directly via the `paxi://` deep link (`paxi://hub/explorer?url=<page>`). Today, using Paxi Lens means first remembering and typing a URL in an external browser. PaxiHub is currently a **mobile-only wallet app (no desktop browser extension)**, so **deep links and QR scanning are the only mobile bridge**. After listing, users search "Paxi Lens" in the wallet and open it — the toolkit shifts from "a URL you have to know" to "a listed ecosystem application". Our side delivers: deep-link protocol adaptation, in-wallet WebView compatibility work and regression testing, 6-language dApp metadata (name / description / icon / search keywords), and version tracking after listing. The official wallet team delivers: dApp listing review and publication, deep-link allow-listing.

**Objective 2 · 360,000 PAXI community-pool grant**: apply for a **one-time lump-sum 360,000 PAXI** payout to the development team, covering: continued maintenance and official integration of the delivered v1, continued maintenance of the **delivered 6-language internationalization**, building the **public read-only data layer the chain currently lacks** (whale tracking, large-tx feed, new-contract radar with contract safety checks, governance participation dashboard, validator transparency), 6 months of operations, and the listing-adaptation work required by Objective 1. The DAO disburses in a single tranche; any further funding requires a new proposal.

All tool service fees go 100% to a single transparent address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`; **no prize pools, contracts hold no user funds, and no tool touches TKCC**. The community-pool funds requested here go to `paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd`, with monthly public flow reporting.

## 3. Problem Statement
- **Ecosystem apps have no entry point**: tool-class dApps across the Paxi ecosystem generally have no official listing slot; users only find them through community posts, screenshots and bookmarks. PaxiHub is the only official wallet entry point today, yet the wallet has no dApp search or favourites slot — so even wallet users struggle to discover that usable on-chain tooling exists. **This directly suppresses real user counts for every tool-class dApp.**
- **Deep links are the only mobile bridge, but there is no shared spec**: PaxiHub is mobile-only (no desktop extension), so `paxi://` deep links plus QR scanning are the single cross-device path. Each dApp currently implements its own deep link, with incompatible parameter formats, landing-page anchors and error fallbacks — users frequently land on the home page instead of the intended tool.
- New users lack a **unified, trustworthy, non-custodial** entry point for Paxi; governance participation is hard.
- On-chain data is unobservable: whale movements, large transactions, new contract deployments, governance participation rates, validator performance — **the ecosystem has no public, reproducible dashboards**; 469k accounts operate in information asymmetry.
- Newly issued PRC-20 contracts lack public safety checks (mint authority revoked? liquidity? holder concentration), and users keep falling for honeypots.
- Existing third-party tools are custodial or semi-custodial, creating key/fund risk.

## 4. Solution & Feature Matrix
| Layer | Content |
|-------|---------|
| **Objective 1: Official wallet dApp listing (new in this proposal)** | A Paxi Lens entry in the wallet's dApp search interface; a `paxi://hub/explorer?url=` deep-link spec (unified anchor params, tool allow-list, failure fallback); in-wallet WebView compatibility work and regression tests; 6-language dApp metadata (name / description / icon / search keywords); post-listing version tracking and compatibility maintenance |
| **Delivered v1 (20 tools, NOT funded by this grant)** | Decoder, issuance (PRC-20/721), Swap helper, allowance manager, batch transfer, burning, NFT launcher, balances, address book, IBC query, governance voting, redelegate, validator compare, proposals, tx dry-run, gas calc, address convert |
| **New: data service layer (50k)** | Block Scanner (read-only indexing, the architecture proven by pump-watch) + SQLite index + public REST API (rate-limited, OpenAPI, takeover-ready) |
| **New: data applications (front-end)** | Whale tracker, large-tx live feed, new-contract radar, contract safety check, governance dashboard, validator transparency, chain overview |

> Compliance exclusions (deliberately not shipped): NFT marketplace (Authz risk), mini-games, **the wallet itself (this proposal only asks the official wallet to list a third-party dApp — we do not build a wallet, and do not ship a wallet plugin/SDK)**, prediction-market clones (division of labor with the official team).

> Note: the live suite also ships an "NFT Market" tool, but it is only a **read-only gallery + non-custodial listing board** (no Authz, no on-chain settlement, no escrow — all settlement happens independently in the user's own wallet). This is fundamentally distinct from the excluded Authz-based NFT trading marketplace above and does not violate this exclusion.

## 5. Deliverables
1. **Official wallet dApp listing**: deep-link protocol spec and implementation, WebView compatibility package, 6-language dApp metadata pack (name / description / icon / keywords), compatibility regression report; support the official team through listing review and publication.
2. Deployable pure front-end dApp (20 tools + 7 data applications, 6-language i18n: en/ja/ko/id/vi/zh-Traditional, with multilingual legal documents).
3. Open-source `paxi-data` service: scanner + indexer + public API + replay tests (reproducibility evidence).
4. Single-fee-collector integration with pre-signature fee/receiver disclosure.
5. README + architecture diagram.
6. MIT repository (commit history / Releases / OpenAPI docs).

## 6. Milestones (~18 weeks)
- **M0 (wk 1–3) · Wallet dApp listing adaptation**: deep-link param spec frozen (unified `url` + tool anchor + version param + failure fallback); in-wallet WebView compatibility work; 6-language dApp metadata pack; submit the listing request to the official wallet team and follow up on review. Acceptance: 6-language metadata complete; deep links land correctly on all 20 tool pages inside iOS/Android wallet WebViews; compatibility regression suite fully green.
- **M1 (wk 4–6) · Data service v1**: Block Scanner + SQLite + /healthz + replay tests. Acceptance: catch-up scan ≤5 min behind; replay matches on-chain sampling.
- **M2 (wk 7–9) · Whale tracker + large-tx feed**. Acceptance: large-tx latency <2 min; top-100 holders queryable.
- **M3 (wk 10–13) · New-contract radar + contract safety check**. Acceptance: new contracts listed <10 min; 6-check report complete.
- **M4 (wk 14–16) · Governance dashboard + validator transparency + chain overview**. Acceptance: voting-rate trend within <1% of on-chain sampling.
- **M5 (wk 17–18) · Public API docs + weekly-report automation + SDK self-hosting & SRI**. Acceptance: OpenAPI published; weekly report auto-generated.
- **Listing go-live**: on the official wallet's release cadence, no later than end of M3; monthly disclosure of listing-driven traffic afterwards.
- Throughout: weekly releases, monthly fund-usage reports (on-chain verifiable).

## 7. Budget Breakdown (final · 360,000 PAXI)
| Item | Amount (PAXI) | Share | Notes |
|------|---------------|-------|-------|
| Dev · **Official wallet dApp listing adaptation** (new objective) | 45,000 | 12.5% | Deep-link spec & implementation / in-wallet WebView compatibility / 6-language dApp metadata / compatibility regression tests / post-listing version tracking |
| Dev · Delivered v1 official integration & maintenance | 75,000 | 20.8% | Official PR collaboration / audit / docs / long-term availability (no repeat payment for what's built) |
| Dev · Multilingual internationalization (**delivered**) | 60,000 | 16.7% | 6-language UI (en/ja/ko/id/vi/zh-Traditional, ~845 keys × 5 packs) + 6-language legal documents, already shipped and live; grant covers official adoption & continued maintenance |
| Dev · Data service layer | 50,000 | 13.9% | Block scanner + SQLite index + public read-only REST API (open-source, takeover-ready) |
| Dev · Data application front-end | 60,000 | 16.7% | Whale tracker / large tx feed / contract radar / safety check / governance dashboard / validator transparency / overview — 7 apps |
| Dev · Testing & security hardening | 30,000 | 8.3% | SDK self-hosting + SRI + declaration-collision guard + replay tests (closes known risks) |
| Dev · Community & content operations | 22,000 | 6.1% | ko/ru/es community expansion + weekly/monthly report content ops |
| Operations · 6 months | 18,000 | 5.0% | Scanner VPS 6 months + monthly fund-usage reports + community + contingency |
| **Total** | **360,000** | 100% | Development 342,000 + Operations 18,000 |

> Wallet listing adaptation is broken out as its own 45,000 PAXI line because it is a newly added, independently verifiable work package (deep-link spec + WebView work + metadata + regression tests). Keeping it separate makes progress and acceptance trackable without cannibalising other line items.

## 8. KPIs
- **Wallet listing**: Paxi Lens appears in the official wallet's dApp search and is hit by search under all 6 language names; ≥ **25%** of monthly visits arrive via the wallet entry point; deep-link landing success rate ≥ **98%**.
- ≥ **500** monthly active wallets;
- ≥ **3,000** tool invocations / month;
- ≥ **1,500** on-chain transactions initiated via the toolkit / month;
- Governance proposal/voting participation **+20%** vs. launch baseline;
- Data layer: ≥ **2,000** monthly visits across whale/feed/dashboards; **3+** monthly fund-usage reports (on-chain verifiable);
- Multilingual: 6-language UI fully delivered and live (en/ja/ko/id/vi/zh-Traditional); non-English interface usage share ≥ **30%** within 3 months of the data-layer launch.

## 9. Risks & Mitigation
- **Official wallet release cadence is out of our control**: listing review and publication are governed by the official team's schedule; we cannot commit to a go-live date. Mitigation: listing adaptation (M0) proceeds in parallel with the rest of the roadmap; our own deep-link and QR entry points remain usable without the listing; monthly progress disclosure; a listing delay does not affect the already-delivered capabilities or the remaining uses of the grant.
- **Listing amplifies the cost of product rot**: once listed by the official wallet, quality problems get amplified. Mitigation: WebView compatibility regression wired into CI; pre-chain-upgrade compatibility checks (ahead of any official PR); compatibility incidents reported in the monthly report.
- **Key/fund safety**: non-custodial architecture, signing inside the wallet by design, no keys stored.
- **Data trustworthiness**: read-only indexing + full replay scripts — anyone can reproduce; official takeover-ready.
- **Service continuity**: single VPS + PM2 + health-check alerts; the front end degrades to direct LCD queries, so tool core functions survive data-service outages.
- **Compliance**: whale ranks / safety checks / yield simulations are data presentation with disclaimers; no prize pools.
- **Claim consistency**: the scanner is a disclosed read-only component (pump-watch precedent); the non-custodial promise is unchanged.

## 10. Decided Positions
1. **Service fees (Decision A — retained)**: all fees flow to the single transparent address. Wording: *"Service fees are part of the sustainable operating model; DAO funding buys the public goods that fees cannot justify — the data layer, governance tooling, official integration and listing, documentation. Neither replaces the other."*
2. **Data service layer (fully disclosed)**: the Block Scanner is an open, read-only, takeover-ready component; its costs are budgeted under operations; non-custodial, holds no keys.
3. **Recipient of the community-pool payout**: the 360,000 PAXI requested here is paid to `paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd` — the same recipient as the already-passed on-chain DAO proposal #13 — verifiable on-chain and disclosed monthly. Tool service fees are accounted separately and always flow to `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`; **the two are never mixed**: service fees go to the operating collector address, the DAO grant goes to this proposal's recipient.
4. **Boundary of the wallet listing**: this proposal only asks the official wallet to list a third-party dApp and allow its deep link — **we do not build a wallet, do not ship a wallet plugin, and never take custody of wallet keys or assets**. The listed toolkit remains a pure front-end non-custodial app; signing happens inside the wallet.
5. **Materials**: architecture doc ✅ · architecture diagram ✅ (`ARCHITECTURE_DIAGRAM.svg`) · roadmap ✅ · LICENSE ✅ · bilingual proposal ✅.

## 11. Transparency Declaration
> **Service fees are transparently disclosed; no prize pools; contracts hold no user funds; no tool touches TKCC.** 100% of tool service fees go to the single address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` — on-chain verifiable, no intermediary accounts, no diversion. The community-pool funds requested here are paid in a single tranche to `paxi1rdarmm997hqwfdgl9wvnpffe28zmex3kfyg7xd`, managed separately from operating service fees, with monthly public flow reports. The data service layer is read-only, open-source, and takeover-ready.

## 12. Roadmap (see `ROADMAP.md` and `ARCHITECTURE.md`)
- **Phase 1 (entry point + foundation)**: wallet dApp listing adaptation + deep-link spec → scanner v1 → whale tracker + large transaction feed.
- **Phase 2 (safety & governance)**: contract radar + safety check → governance dashboard + validator transparency + data overview.
- **Phase 3 (public goods)**: public API documentation, weekly-report automation, SDK self-hosting.
- 2–4 items per period with monthly releases; future directions (deeper governance analytics, validator tooling, API ecosystem) each have trigger conditions and will be submitted separately — **deliberately not part of this request**.
