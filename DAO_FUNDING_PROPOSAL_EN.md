# Paxi Lens · Official Wallet Listing + 360,000 PAXI DAO Community-Pool Grant (Combined Proposal)

> **Purpose (one proposal, two objectives)**:
> ① **Ask the official wallet team to list Paxi Lens in the wallet's in-app dApp search**, so users can find and open it without memorising a URL — reachable via the `paxi://` deep link (`paxi://hub/explorer?url=<page>`).
> ② **Apply for a one-time lump-sum 360,000 PAXI from the Paxi DAO community pool** as developer funding and sustained operations for the Paxi Lens team.
>
> Both objectives are submitted as a single proposal because they are the two ends of one value chain: **wallet listing solves "users can't find it"; the grant solves "the tool stays alive and keeps improving."** Neither is complete alone — a listed tool that rots is a burden on the ecosystem; funding without a distribution channel converts at nearly zero rate.
>
> **Status**: Draft (budget final). Amount structure: **tool development funding 320,000 PAXI** + **post-launch maintenance 3 months 20,000 PAXI** + **new · large-address transaction tracking 20,000 PAXI** = total **360,000 PAXI** (one-time lump-sum payout; the DAO disburses in a single tranche; any further funding requires a new proposal).
> **Recipient (community-pool payout)**: `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` (Paxi Lens project treasury address — the same address as tool service fees, unified custody, on-chain verifiable, monthly flow disclosure)
> **Supporting materials**: `ARCHITECTURE.md` (full architecture & dev plan), `ARCHITECTURE_DIAGRAM.svg` (architecture diagram), `ROADMAP.md`, `LICENSE` (MIT).
> **Note**: Attach `DAO_FUNDING_PROPOSAL.md` (Chinese version) when formally submitting.

---

## 1. Title
**Paxi Lens — Requesting that the official wallet list Paxi Lens in its in-app dApp search, and applying for a 360,000 PAXI one-time grant from the DAO community pool for the development team (two objectives, one proposal)**

## 2. Abstract
Paxi Lens is a **pure front-end, non-custodial** all-in-one toolkit for the Paxi ecosystem. All 20 tools are live (live at **https://paxi-lens.paxicoin.workers.dev/** , security-audited): decoder, token issuance, Swap helper (native AMM), allowance manager, burning, governance proposal/voting, batch transfers, IBC queries, tx dry-run and more. **Private keys and funds never leave the user's wallet.**

This proposal submits **one proposal with two objectives** to the DAO:

**Objective 1 · Official wallet dApp listing**: request that the official wallet team list Paxi Lens in the wallet's **dApp search interface**, opening the target tool page directly via the `paxi://` deep link (`paxi://hub/explorer?url=<page>`). Today, using Paxi Lens means first remembering and typing a URL in an external browser. PaxiHub is currently a **mobile-only wallet app (no desktop browser extension)**, so **deep links and QR scanning are the only mobile bridge**. After listing, users search "Paxi Lens" in the wallet and open it — the toolkit shifts from "a URL you have to know" to "a listed ecosystem application". Our side delivers: deep-link protocol adaptation, in-wallet WebView compatibility work and regression testing, 6-language dApp metadata (name / description / icon / search keywords), and version tracking after listing. The official wallet team delivers: dApp listing review and publication, deep-link allow-listing. More importantly: **the in-wallet dApp browser and search of PaxiHub still lack the practical, everyday utilities users actually need**, and Paxi Lens is a ready-made, audited, non-custodial suite that fills that gap immediately — real capability for users (decode a tx, send, swap, vote, track whales) and a flagship practical dApp that keeps users engaged for the wallet.

**Objective 2 · 360,000 PAXI developer grant**: apply for a **one-time lump-sum 360,000 PAXI** payout to the development team as tool-development funding for Paxi Lens, structured as: **tool development funding 320,000 PAXI** (continuous development & iteration: official integration & maintenance of the delivered v1, 6-language i18n, the foundation of the public read-only data layer, testing & security hardening, community & content ops, and official-wallet dApp listing adaptation) + **post-launch maintenance 3 months 20,000 PAXI** (server / scanner VPS for 3 months, monthly fund-usage reports, community response, contingency) + **new · large-address transaction tracking 20,000 PAXI** (a dedicated build of the whale leaderboard + large-tx live feed + on-chain data dashboard, ring-fenced on top of the 320k development funding to guarantee delivery). The DAO disburses in a single tranche; any further funding requires a new proposal.

All tool service fees and the 360,000 PAXI community-pool grant requested here go 100% to the same project-treasury address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg`; **no prize pools and contracts hold no user funds** — on-chain verifiable, no intermediary accounts, no diversion, monthly public flow disclosure.

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
| **New: data service layer (included in dev funding)** | Block Scanner (read-only indexing, the architecture proven by pump-watch) + SQLite index + public REST API (rate-limited, OpenAPI, takeover-ready) |
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
| **Tool development funding** | 320,000 | 88.9% | Continuous development & iteration of the full Paxi Lens suite (20+ tools + data applications): official integration & maintenance of the delivered v1, 6-language i18n, foundation of the public read-only data layer, testing & security hardening, community & content ops, and official-wallet dApp listing adaptation |
| **Post-launch maintenance (3 months)** | 20,000 | 5.6% | Server / scanner VPS for 3 months + monthly fund-usage reports + community response + contingency |
| **New: large-address transaction tracking** | 20,000 | 5.6% | Dedicated build of the whale leaderboard + large-tx live feed + on-chain data dashboard (ring-fenced on top of the 320k dev funding to guarantee delivery) |
| **Total** | **360,000** | 100% | Development 320,000 + Maintenance 20,000 + Large-address tracking 20,000 |

> The 320,000 PAXI tool-development funding is an overall development package covering every workstream listed above (including wallet listing adaptation). The 20,000 PAXI large-address transaction tracking is broken out separately because it is the proposal's emphasised, independently verifiable deliverable (whale leaderboard + large-tx feed + dashboard) — keeping it ring-fenced makes progress and acceptance trackable without cannibalising other line items.

## 8. Risks & Mitigation
- **Official wallet release cadence is out of our control**: listing review and publication are governed by the official team's schedule; we cannot commit to a go-live date. Mitigation: listing adaptation (M0) proceeds in parallel with the rest of the roadmap; our own deep-link and QR entry points remain usable without the listing; monthly progress disclosure; a listing delay does not affect the already-delivered capabilities or the remaining uses of the grant.
- **Listing amplifies the cost of product rot**: once listed by the official wallet, quality problems get amplified. Mitigation: WebView compatibility regression wired into CI; pre-chain-upgrade compatibility checks (ahead of any official PR); compatibility incidents reported in the monthly report.
- **Key/fund safety**: non-custodial architecture, signing inside the wallet by design, no keys stored.
- **Data trustworthiness**: read-only indexing + full replay scripts — anyone can reproduce; official takeover-ready.
- **Service continuity**: single VPS + PM2 + health-check alerts; the front end degrades to direct LCD queries, so tool core functions survive data-service outages.
- **Compliance**: whale ranks / safety checks / yield simulations are data presentation with disclaimers; no prize pools.
- **Claim consistency**: the scanner is a disclosed read-only component (pump-watch precedent); the non-custodial promise is unchanged.

## 9. Decided Positions
1. **Service fees (Decision A — retained)**: all fees flow to the single transparent address. Wording: *"Service fees are part of the sustainable operating model; DAO funding buys the public goods that fees cannot justify — the data layer, governance tooling, official integration and listing, documentation. Neither replaces the other."*
2. **Data service layer (fully disclosed)**: the Block Scanner is an open, read-only, takeover-ready component; its costs are budgeted under operations; non-custodial, holds no keys.
3. **Recipient of the community-pool payout**: the 360,000 PAXI requested here is paid in a single tranche to the Paxi Lens project-treasury address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` — the same custody address as tool service fees, on-chain verifiable with monthly flow disclosure. Service fees and the DAO grant both flow to this single address, transparently managed with no intermediary accounts and no diversion.
4. **Boundary of the wallet listing**: this proposal only asks the official wallet to list a third-party dApp and allow its deep link — **we do not build a wallet, do not ship a wallet plugin, and never take custody of wallet keys or assets**. The listed toolkit remains a pure front-end non-custodial app; signing happens inside the wallet.
5. **Materials**: architecture doc ✅ · architecture diagram ✅ (`ARCHITECTURE_DIAGRAM.svg`) · roadmap ✅ · LICENSE ✅ · bilingual proposal ✅.

## 10. Transparency Declaration
> **Service fees are transparently disclosed; no prize pools; contracts hold no user funds.** 100% of tool service fees and the 360,000 PAXI community-pool grant requested here go to the same project-treasury address `paxi1ga6x5ljj547ax436sfc5kw6fn3vfdwqtn0kpwg` — on-chain verifiable, no intermediary accounts, no diversion, monthly public flow disclosure. The data service layer is read-only, open-source, and takeover-ready.

## 11. Roadmap (see `ROADMAP.md` and `ARCHITECTURE.md`)
- **Phase 1 (entry point + foundation)**: wallet dApp listing adaptation + deep-link spec → scanner v1 → whale tracker + large transaction feed.
- **Phase 2 (safety & governance)**: contract radar + safety check → governance dashboard + validator transparency + data overview.
- **Phase 3 (public goods)**: public API documentation, weekly-report automation, SDK self-hosting.
- 2–4 items per period with monthly releases; future directions (deeper governance analytics, validator tooling, API ecosystem) each have trigger conditions and will be submitted separately — **deliberately not part of this request**.
