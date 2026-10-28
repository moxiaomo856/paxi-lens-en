# Paxi Lens · Later-Stage Feature Roadmap (DAO Grant Supplement)

> Purpose: As an attachment to the 360,000 PAXI proposal, to answer the core reviewer doubt — "everything is already built, where does the grant money go?"
> Narrative thread: **v1 (20 tools already live) = a credibility asset of execution capability, not the reason for this application; this application buys "official integration + 6-month operations guarantee + a continuously evolving phase."**

---

## 0. Why "having delivered a lot" is actually a plus
| Reviewer doubt | Solution |
|---------------|---------|
| "Where does the money go?" | The 20 tools are free public goods; the grant prevents them from rotting (Cosmos front-end tools rotting after chain upgrades is a historical lesson) — grant funds go to integration, operations, and continuous evolution, **no duplicate payment for already-built parts** |
| "Disappears after delivery" | Use KPI achievement as internal delivery milestones — the phased delivery structure makes "continuous output" a structural fact (lump-sum payout, self-check against milestones) |
| "Why fund if there are fees?" | Fees cover marginal cost; DAO funds only buy the public good that fees cannot justify (governance tools, official integration, docs) — the two do not substitute for each other |
| "Feature stuffing" | Each feature is bound to a chain-level KPI (governance participation +20%, tx volume 1500/month), not just padding |

## 1. Roadmap Master Table

| Phase | Feature | KPI contribution | Person-days |
|-------|---------|------------------|-------------|
| **Phase One · Headline** | **Official wallet dApp listing** (deep-link spec `paxi://hub/explorer?url=` + in-wallet WebView compatibility + 6-language dApp metadata + regression suite) | Wallet listing (25% of monthly visits via the wallet entry; deep-link success ≥98%); MAU ≥500 | 5 |
| **Phase One wrap-up** | Weighted voting MsgVoteWeighted (70/30 split options) | Governance participation +20% (main); tx volume | 0.5 |
| **Phase One wrap-up** | Three high-frequency tools mobile polish (batch transfer / balance / decoder) | MAU ≥500 (main, PaxiHub is mobile-only) | 1–2 |
| **Phase One wrap-up** | SIWP signed-message verifier + phishing-injection detection | MAU (trust conversion) | 1.5 |
| **Phase One wrap-up** | Official PR collaboration (fix doc public-key bug + signDirect suggestion) | Indirect MAU, ecosystem endorsement | 0.5–1 |
| **Phase One wrap-up** | KPI baseline instrumentation (governance participation / call baseline) | Prerequisite for KPI acceptance | 0.5 |
| **Phase Two · Headline A** | **LP liquidity management** (add/remove + min_shares/min_liquidity protection) | Tx volume 1500/month (LP is the highest-frequency cohort); continues the only monetization potential | 3 |
| **Phase Two · Headline B** | **Portfolio overview dashboard** (six asset classes + PRC-20 pool reserve valuation + 30-day sparkline) | MAU (daily return anchor) | 2.5 |
| **Phase Two · Headline C** | **Feegrant + Authz dual panel** (delivers on the "≥2 new governance-type tools" promise) | MAU (security retention); tx volume | 3 |
| **Phase Two** | Delegation yield analyzer (net APR + local history curve) | Governance participation, MAU | 2 |
| **Phase Two** | Tax CSV export (address + time-period full transactions) | Heavy-user word-of-mouth | 2.5 |
| **Phase Two** | SDK localization + SRI + monthly report ×3 | Close risk items | 1+ |
| **Future proposal** | Governance participation data dashboard (Governance Analytics) | Chain-level governance participation | Separate review |
| **Future proposal** | Validator transparency tool (16 profiles + delegator yield simulation) | Governance participation closed loop | Separate review |
| **Future proposal** | Public read-only data API (pool/channel/denom/feegrant) | Infrastructure positioning | Separate review |

**Cadence**: Each phase 2–4 items, a release every month — doing it all at once would dilute the growth narrative, run out of monthly-report material, and make reviewers suspect "only acts when paid."

## 2. Phase Two Three Headlines (MVP definitions)

**Headline A · LP Liquidity Management**: Pool list + single-pool detail (dual-side reserve / total LP supply / my share); add with auto-rebalance hint by pool ratio; remove with share % slider; both-side min protection forcibly displayed; PRC-20 side allowance atomic packaging; acceptance = real pool completes add→withdraw full flow. **The only feature continuing the monetization narrative** (proof of self-sufficiency after the grant).

**Headline B · Portfolio Dashboard**: One page aggregates PAXI/PRC-20/NFT/delegation/unbonding/unclaimed rewards; net asset PAXI valuation (PRC-20 via swap reserve — network-wide unique); localStorage daily snapshot 30-day sparkline (inline SVG zero dependency); each number annotated with its data-source endpoint.

**Headline C · Feegrant + Authz Dual Panel**: Who subsidizes me / whom I subsidize + initiate/revoke; granted-to-me / granted-by-me dual view + SendAuthorization + revoke. Turns the proposal's "compliance excludes NFT-marketplace Authz risk" into professional endorsement.

## 3. Future Proposal Hooks (Chapter 2, **deliberately not in this application**)
| Hook | Content | Trigger condition |
|------|---------|-------------------|
| Governance data service | Voting-rate trend / proposal analysis / validator voting-behavior dashboard | Phase Two governance participation +20% achieved |
| Validator transparency | 16 uptime/commission/governance-record/delegator-yield-sim | Dashboard MAU≥500 achieved |
| Public read-only API | Pool/channel/denom/feegrant query wrapper | Any of the above achieved; **read-only, non-custodial, take-overable by official** |

> Writing "not in this proposal" explicitly is actually a plus: feature priority should be decided by real data, not a one-time three-year commitment.

## 4. Growth Levers Top 5
1. Mobile polish (469k accounts mostly on mobile, official is App-only) 2. Governance suite (voting hits two KPIs at once; only 16 validators → strong delegator-education story) 3. Portfolio dashboard (retention king) 4. LP management (highest tx-frequency cohort + monetization continuation) 5. ru/es multilingual expansion (6-language UI en/ja/ko/id/vi/zh-Traditional already delivered and live; ru/es opens the remaining communities at near-zero marginal cost).

**Community actions (grow without writing code)**: Weekly on-chain data report (governance/APR/pool depth), validator transparency profiles, new-contract hands-on series, newbie onboarding education, community feature voting (GitHub vote), good first issue.

## 5. Explicitly Not Building (red-line self-check)
Wallet core / prediction-market replica (clashes with official); limit order / DCA / push notifications (need backend custody); front-end self-built multisig (wallet API only returns single-sig, wait for official); K-line history (no price index on-chain); token-incentive user acquisition (compliance); fees overlapping with official free features.

## 6. Proposal Roadmap Section Wording (ready to use)
> **Delivered baseline (v1, not in scope of this grant)**: All 20 tools live, MIT public repository with full commit history, having passed security audit. This proposal does not duplicate-pay for already-built parts, but provides official integration, operations guarantee, and next-phase evolution for them.
> **Phase One (0–2 months)**: Deep-link launch & official PR collaboration, Swap assistant, Allowance management, SIWP signature verification, weighted voting, mobile polish; instrument in parallel to establish KPI baseline.
> **Phase Two (3–5 months, KPI-gated)**: LP liquidity management, portfolio dashboard, Feegrant/Authz panel, yield analyzer, tax CSV; monthly report ×3 on-chain verifiable.
> **Future sections (not in this proposal)**: Governance data dashboard, validator transparency tool, public read-only API, each with trigger conditions, separately reviewed after verification. We deliberately do not cram the future into this application.
