# PRD — personalstylist

*Draft v1 · Owner: Nikhita Bhoopati · Source docs: product-brief.md, validation-test-plan.md, synthetic-interviews.md*

> ⚠️ **Status: provisional.** This PRD encodes decisions that the validation test in `validation-test-plan.md` has **not yet confirmed**. Items marked **[ASSUMPTION — validate]** must be tested with real users before they are treated as settled. Do not start engineering on assumption-dependent features until they pass.

---

## 1. Summary
personalstylist is a styling app that knows a user's whole wardrobe and their taste. It helps them create outfits from clothes they already own, and — when a real occasion arrives — tells them exactly what is missing and the few pieces worth buying to fill the gap. This PRD defines the first version (V1) and what comes later.

## 2. Contacts
| Name | Role | Comment |
|------|------|---------|
| Nikhita Bhoopati | Product owner / founder | Domain lead; driving validation |
| *TBD* | Design | Owns onboarding + outfit UX (the make-or-break surfaces) |
| *TBD* | Engineering | Owns image handling, tagging, product matching |
| *TBD* | Data / ML | Owns garment recognition + recommendation logic |

## 3. Background
People own clothes they forget about, re-buy things they already have, and still feel they have "nothing to wear" for the moments that matter — a trip, an event, a new job, a new baby.

**Why now?** Two things changed:
1. Image understanding and language models are now good enough to recognize clothing and reason about style and fit from photos and plain-language goals.
2. Affiliate retail infrastructure makes it possible to recommend and link real, buyable products without holding inventory.

Existing tools fall into two camps and neither wins: closet apps catalog your wardrobe but give generic daily outfits; shopping tools recommend products with no idea what you already own. Nobody combines a complete, persistent wardrobe + a real taste profile + goal-driven gap analysis.

## 4. Objective
**Objective:** Help people use what they own and buy intentionally — fewer wasted purchases, less daily decision fatigue, better-dressed for the moments that matter.

**Why it matters:** It saves users money and time, and builds a defensible asset — a persistent, structured wardrobe + taste profile that improves over time and creates real switching cost. Revenue comes from affiliate purchases on recommended pieces.

**Design principle (non-negotiable):** *Honesty first, revenue follows.* The app must tell users when they already own something and shouldn't buy. The affiliate feed must never inflate the gap. This trust is the moat.

**Key results (SMART — provisional targets, refine after validation):**
- **KR1 (floor):** ≥60% of new users who start onboarding complete enough of it to get a first recommendation.
- **KR2 (engagement):** ≥40% of activated users return within 7 days for a "style what you own" outfit.
- **KR3 (monetization):** ≥15% of users who receive a gap recommendation click through to a product; ≥5% purchase.
- **KR4 (loop closed):** ≥10% of purchasers upload a photo of the bought item back into the app.

## 5. Market segment(s)
Defined by problem, not demographics. Initial wedge:

- **Primary:** People in a **life-event or occasion moment** (new job, new city, postpartum, big trip, seasonal reset) who feel acute pressure to dress well and little time to figure it out. *Synthetic insight: acute pain beats onboarding friction — these users push through setup.*
- **Secondary:** **Intentional curators** — people deliberately building a capsule wardrobe who want to stop over-buying.

**Constraints:**
- **Geography is mandatory** per user — it drives retailer/affiliate availability.
- **[ASSUMPTION — validate]** Initial market: women, 20–35, US cities, tech-savvy. (Drawn from synthetic personas, not market data.)
- **Known anti-segment / risk:** users with very large wardrobes have the highest need but the lowest odds of finishing capture (see §7.4).

## 6. Value proposition(s)
| Customer job | What they gain | Pain avoided | Why we beat alternatives |
|---|---|---|---|
| "Tell me what to wear from what I have" | Fresh outfits from owned clothes | Decision fatigue; forgotten items | We know the *whole* wardrobe + taste; generic apps don't reason about you |
| "Tell me what to buy for this occasion" | The gap + 3 specific buyable pieces | Wasted, redundant purchases | Grounded in what they own → no false gaps; ChatGPT has no persistent wardrobe |
| "Don't let me re-buy what I own" | Confidence + savings | Buyer's regret | Honesty-first design is the differentiator |
| "Respect my budget and taste" | Options in their price tier & palette | Irrelevant luxury suggestions | 3 price tiers + favorite retailers |

**Durable advantage:** the persistent wardrobe + taste profile (switching cost), not the AI itself.

## 7. Solution

### 7.1 UX / user flows

**A. Onboarding (build the profile once)**
1. Upload 3–5 **best-outfit photos** → seeds style, coloring, rough body shape, seed inventory.
2. Capture **wider wardrobe** → **[ASSUMPTION — validate]** preferred path is **camera-roll auto-import + AI tagging** (user edits, doesn't enter). Fallback: manual photos. *This is the single highest-risk, highest-leverage decision — see §7.4.*
3. Enter **sizes** (per category), confirm **body shape** (labeled silhouettes), set **highlight / downplay** preferences (neutral framing, optional & skippable).
4. Set **geography** (required), **budget** and **brand preferences by wear category** (day-to-day, office, occasion, athletic, activewear) — optional but used to personalise product matching immediately.

**B. Daily — "Style what you own" (the habit loop)**
- App shows 2–3 outfit ideas built only from owned items, factoring weather and (later) calendar.
- User can also ask in natural language: *"What should I wear today? I have back-to-back meetings and dinner after."*

**C. Goal-based gap analysis (the monetization moment)**
- User states a goal (trip / event / season / life change) — via a form *or* in plain conversation.
- Output, in order: **(1) the gap** (with explicit "you already own X, don't re-buy" honesty) → **(2) a general piece style** → **(3) three specific buyable pieces** in their favorite retailers, or **three price-tier options** if no retailer set.

**E. Travel & occasion planner**
- User describes a trip or event (destination, duration, type of activities).
- App builds a complete packing outfit list: what they can take from their wardrobe + any gaps worth filling before they go.
- For events 7–15 days out, proactively surfaces gap pieces with enough lead time to buy and receive them. *(Guardrail: only triggered when a genuine gap exists — not a shopping prompt in disguise.)*

**F. Work wear weekly planner**
- User initiates a weekly or fortnightly work outfit plan.
- App builds a day-by-day outfit schedule from owned items, factoring meeting types (if shared), weather, and rotation variety.
- Surfaces a gap only if a specific recurring need is unmet — not as a default nudge to shop.

**G. In-app shopping assistant**
- When the user signals they're ready to shop ("I want to buy the blazer"), the app shifts into an interactive mode: narrows options based on live feedback, compares pieces, and helps them decide.
- Grounded in the existing gap — not a free-range browsing experience.

**H. Look sharing**
- User can share a styled look (from daily outfits, trip plans, or gap recs) with friends via a link or image card.
- Shared view shows the outfit and — optionally — the gap piece(s) with buy links.

**D. Alerts (retention)**
- Sale / new-arrival notifications on the user's *gap* pieces, in their taste, size, and price range.

### 7.2 Key features (V1 unless noted)
| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | Profile & onboarding | Photos + sizes + body shape + prefs + geography + brand preferences by category | P0 |
| F2 | Wardrobe inventory | Store, tag, browse owned items | P0 |
| F3 | Wardrobe auto-import | Camera-roll pull + AI tagging | P0 **[ASSUMPTION — validate first]** |
| F4 | Gap analysis & recommendation | Goal → gap → style → 3 products / 3 tiers | P0 (the differentiator) |
| F5 | Product matching | Match recs to live, buyable products by geography/budget/brand via affiliate feed | P0 |
| F6 | "Style what you own" outfits | Daily outfit ideas from owned items | P1 |
| F7 | Honesty guardrail | Logic that flags owned items so recs never inflate the gap | P0 |
| F8 | Weather/calendar context | Factor conditions and plans into daily outfits | P2 |
| F9 | Sale / new-arrival alerts | Notify on gap-piece availability | P2 |
| F10 | Progressive / chunked onboarding | "Just your work clothes first," value after each chunk | P1 |
| F11 | Buy-loop capture | User uploads photo of purchased item | P2 |
| F12 | Natural language interface | Talk to the app in plain language — describe your plan, ask what to wear, get responses conversationally | P1 |
| F13 | Travel & occasion planner | Plan a full outfit set for a trip or event — packing list built from owned items + gap pieces | P1 |
| F14 | Work wear weekly planner | Plan a week or fortnight of work outfits in one session; considers meetings, weather, occasions | P1 |
| F15 | In-app shopping assistant | When the user is ready to shop, guides them through finding and deciding on pieces interactively | P2 |
| F16 | Brand preferences by wear category | Capture preferred brands per category (day-to-day, office, occasion, athletic, activewear) during onboarding | P0 |
| F17 | Lookahead buying suggestions | For events 7–15 days out, proactively surface gap pieces to buy in time — with strict honesty guardrails to avoid becoming a generic shopping prompt | P2 |
| F18 | Look sharing | User can share a styled outfit (owned or recommended) with friends via link or image | P2 |

### 7.3 Technology (high-level)
- Image storage + garment recognition/tagging (color, type, attributes).
- Recommendation logic combining taste profile, owned inventory, goal, and constraints.
- Product matching via affiliate networks (e.g., Rakuten / Awin / Skimlinks) or retailer feeds, filtered by geography/budget/brand.
- Coloring analysis from a clear face photo (kept — it works). **Deliberately excluded:** body-measurement estimation from photos (unreliable, trust landmine).
- Likely **mobile-first** (photos favor mobile). **[ASSUMPTION — validate]** platform choice.

### 7.4 Assumptions (flagged for validation)
| # | Assumption | Risk if wrong | How to test (see validation-test-plan.md) |
|---|---|---|---|
| A1 | Users will complete wardrobe capture | **Fatal** — primary kill condition | Onboarding completion rate; segment by wardrobe size |
| A2 | Auto-import meaningfully lifts completion vs. manual | High | Concierge: manually tag a shared camera-roll album |
| A3 | The "style what you own" hook pulls users despite a crowded category | High | Daily-outfit appeal score + return rate |
| A4 | Recommendations feel right and non-redundant | High | "Did we suggest something you already own?" |
| A5 | Affiliate-first monetization works; subscription only for high-pain users | Medium | Willingness-to-pay across segments |
| A6 | Large-wardrobe users are rescuable via grouping/auto-import | Medium | Completion rate among >150-item users specifically |
| A7 | Target = women 20–35, US, tech-savvy | Medium | Real recruiting demographics |

**Inverse-correlation warning:** the users who most need this (largest wardrobes) are least likely to finish onboarding. Mitigation priority: **reduce the work (auto-import) > progressive grouping > gamification.** Open reframe: *is full upfront capture even necessary, or can value start from favorites + basics and fill in over time?* — resolve before building F2/F3 at scale.

## 8. Release

**Pre-V1 gate (do this first):** Run the concierge validation test. Do **not** build until A1–A4 show positive signal.

**V1 — "Prove the core loop"**
- F1 Profile/onboarding (with whichever capture method validation favors)
- F2 Wardrobe inventory
- F4 Gap analysis & recommendation (the differentiator)
- F5 Product matching
- F7 Honesty guardrail
- Goal: prove people complete onboarding, get accurate non-redundant recs, and buy.

**V1.5 — "Make it sticky"**
- F6 Style what you own (daily habit)
- F10 Progressive / chunked onboarding
- F3 Auto-import (promote to V1 if validation shows it's the unlock for completion)
- F12 Natural language interface — conversational outfit and plan queries
- F13 Travel & occasion planner
- F14 Work wear weekly planner
- F16 Brand preferences by category (promote to V1 given it directly improves product matching from day one)

**V2 — "Retention & scale"**
- F8 Weather/calendar context
- F9 Sale / new-arrival alerts
- F11 Buy-loop capture
- F15 In-app shopping assistant
- F17 Lookahead buying suggestions (7–15 days out) — with honesty guardrail review before shipping
- F18 Look sharing with friends
- Gamification — only if grouping + auto-import don't move large-wardrobe completion.

*Timeframes are relative, not dated, and contingent on validation outcomes.*

---

### Open questions (must resolve)
- Platform: mobile vs. web (photos favor mobile; web is lighter to build).
- How complete must inventory be before gap analysis is trustworthy?
- Product-matching data source by region (affiliate network vs. retailer API vs. scraping).
- Privacy/consent model for face + wardrobe photos (sensitive PII) — needed before any real-user data is collected.
