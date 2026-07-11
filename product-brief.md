# Personal Stylist — Product Brief

*Working name: personalstylist · Draft v1 · 2026-06-27*

## One-liner
A personal styling app that knows your **whole wardrobe** and your **taste**, helps you style what you already own day-to-day, and — when a real occasion hits — tells you the **gap** and the exact 3 pieces to buy to fill it.

## The problem
People own clothes they forget about, re-buy things they already have, and still feel they have "nothing to wear" for the moments that matter (a trip, an event, a new job). Existing tools either:
- catalog your closet but give generic daily outfits (crowded, low monetization), or
- recommend products with zero knowledge of what you already own (the ChatGPT/Pinterest problem — leads to redundant buys).

No tool combines **a complete, persistent wardrobe + a real taste profile + goal-driven gap analysis.**

## Target user *(assumption — to validate)*
Style-conscious people (initial wedge likely women) who shop online, own enough clothing to have a "wardrobe," and hit recurring life moments that trigger shopping. Geography captured per user (drives retailer/affiliate availability).

## Why this wins (durable differentiator)
The moat is **not** the AI — it's the **persistent, structured wardrobe + taste profile** that:
- improves over time and creates a real **switching cost** (no one wants to re-enter their closet elsewhere), and
- lets every recommendation be grounded in what the user *already owns + perceives as their best looks* — something a fresh ChatGPT prompt can't replicate.

**Design principle — honesty first, revenue follows:** telling someone "you already own this, don't buy it" is what earns the trust that makes them buy the *other* recommended pieces. The affiliate feed must never inflate the gap.

## Product structure (four layers)

### 1. Habit layer — "Style what you own" *(free, recurring)*
- Daily/weekly outfit ideas built from the user's existing wardrobe.
- **Natural language interface:** user can talk to the app — *"What should I wear today? I have back-to-back meetings and dinner after"* — and get a conversational, context-aware response.
- Sale / new-arrival alerts on the user's *gap* pieces, in their taste, size, and price range.
- **Purpose:** acquisition, retention, and keeping wardrobe data fresh.
- ⚠️ This is also the **riskiest assumption** — it's the most crowded category (Whering, Acloset, Indyx) and is gated behind the heaviest onboarding. Test before over-investing.

### 2. Planning layer — "Help me prepare" *(proactive, recurring)*
Triggered by upcoming events or routines:

- **Work wear weekly / fortnightly planner:** plan a full week of work outfits in one session. Day-by-day schedule from owned items, factoring meeting types and weather. A gap is only surfaced if a structural need recurs across multiple days — not as a default nudge to shop.
- **Travel & occasion planner:** describe a trip or event, get a complete outfit plan + packing list from your existing wardrobe. Genuine gaps surfaced with enough lead time to buy. For events 7–15 days out, proactively suggests gap pieces the user can order and receive in time — **only when a real gap exists** (not a shopping prompt in disguise).
- **Conversational planning:** user describes a plan in plain language; the app identifies what kind of planning is needed and routes accordingly.

### 3. Monetization layer — Goal-based gap analysis *(episodic, high-intent)*
Triggered by life moments: office event, season change, special day, trip, new job, motherhood, relocation, or simply having time to curate.

**Output flow:**
1. **The gap** — what kinds of things they need for the goal (grounded in current wardrobe, so no false gaps).
2. **General piece style** — e.g., "a structured neutral blazer in your palette that skims the hips."
3. **3 specific pieces** in their favorite retailers — or, if no retailers selected, **3 options across price tiers** matching their stated range.
- **Geography mandatory** (retailer/affiliate availability). Brands captured per wear category during onboarding (day-to-day, office, occasion, athletic, activewear).

**In-app shopping assistant:** when the user is ready to buy, the app shifts into an interactive mode — narrows options based on real-time feedback, compares pieces, and helps them decide. Grounded in the identified gap, not a free-range browse.

### 4. Social layer — "Share with friends" *(viral, lightweight)*
- User can share any styled look — daily outfit, trip plan, or gap recommendation — as a shareable image card.
- Includes buy links only if the user opts in. No account required to view.
- Drives organic reach without requiring a social feed to maintain.

## User profile & onboarding
Built once, reused everywhere:
- **Best-outfit photos** → style, coloring, rough body shape, seed inventory.
- **Full wardrobe capture** → gallery scrape (last ~10 months) *or* user photographs items. *Recommend progressive inventory:* usable from favorites + a quick "add your basics," filling in over time — do **not** wall off all value behind photographing 60 items.
- **Sizes** per category (asked, not estimated from photos).
- **Body shape** (self-ID from labeled silhouettes, optionally photo-confirmed).
- **Highlight / downplay preferences** — neutral framing ("anything you'd like to show off / draw attention away from"), optional and skippable. *Never* "insecurities/flaws."
- **Geography** (required), **budget** (optional).
- **Brand preferences by wear category** (optional but high-value): captured per context — day-to-day, office, occasion, athletic, activewear. Each category is independent; skipping one defaults to price-tier matching for that context.

*Deliberately avoided:* body-measurement estimation from photos (unreliable, trust landmine). Coloring from a face photo is kept (it works).

## Business model
Affiliate commission on recommended pieces; favorite-brand and price-tier targeting. Honesty-first guardrail protects long-term trust and conversion.

## Key risks & assumptions
1. **Onboarding friction (TOP RISK).** Full-wardrobe capture is the highest-effort step and maps directly to the primary kill condition. Mitigate with progressive inventory.
2. **Crowded acquisition hook.** "Use what you own" competes with free closet apps; differentiation must come through faster.
3. **Affiliate vs. honesty conflict** — managed via the honesty-first principle.
4. **False gaps** if inventory is incomplete — the entire value prop depends on knowing what's owned.

## Onboarding friction — ranked fixes *(hypothesis, from synthetic interviews — unvalidated)*
Synthetic interviews surfaced an **inverse correlation: the larger the wardrobe, the higher the need but the lower the odds of finishing capture.** Big-closet users (who need daily styling most) are most likely to abandon onboarding. Candidate fixes, weakest → strongest:

1. **Gamify** (streaks/progress/rewards) — ⚠️ weakest. Makes a slog more pleasant but doesn't shrink it; suited to small repeated actions, not a 200-item upfront chore. Use last, if at all.
2. **Group / chunk (progressive)** — ✅ good. Capture in batches ("just your work clothes first"), deliver value after each chunk. Attacks *perceived* effort and time-to-value.
3. **Reduce the actual work (camera-roll auto-import + AI tagging)** — ✅✅ strongest. Attacks the root cause. 3 of 5 synthetic users named manual capture as the dealbreaker.

**Deeper reframe to resolve before building:** *does the user need to log their whole wardrobe upfront at all?* Preferred answer = no — be useful from favorites + basics, let inventory fill in over time. This sidesteps the wall entirely rather than dressing it up. **Prioritize auto-import > progressive grouping > gamification.** All three are cheap to test on real users first.

## Success & kill signals
- **Success (ceiling):** users buy recommended products *and* upload photos of them (loop closed).
- **Success (floor):** users complete onboarding and return.
- **Kill:** users don't even complete onboarding.

## Riskiest assumption to test first
> "People will complete heavy wardrobe onboarding to get a daily feature that free apps already offer — and will then buy gap-pieces we recommend."

Test the cheapest version: get a handful of real target users through onboarding (even concierge / manual), deliver one daily-outfit experience + one goal-based gap recommendation, and measure: (a) onboarding completion, (b) return, (c) do they buy.

## Open questions
- Precise target demographic & initial geographic market.
- Platform (mobile app vs. web) — photos favor mobile but it's heavier to build.
- How complete must inventory be before gap analysis is trustworthy?
- Product-matching data source: affiliate networks (Rakuten/Awin/Skimlinks), retailer APIs, or scraping — by region.
- Privacy/consent model for face + wardrobe photos (sensitive PII).
