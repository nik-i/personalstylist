# Personal Stylist — Synthetic User Interview Simulation

*Companion to validation-test-plan.md · Draft v1*

> ⚠️ **Read this first.** These are *synthetic* users — modeled assumptions, not real people. They cannot validate demand; they reflect the simulator's priors about this segment. Use them to rehearse the interview, spot where recommendations/questions break, and sharpen hypotheses. The real concierge test in `validation-test-plan.md` is still required for any go/no-go decision.

---

## The 5 synthetic users

| # | Name | Age | City | Role | Wardrobe size | Trigger state | Used closet apps before? |
|---|------|-----|------|------|---------------|---------------|--------------------------|
| 1 | Maya | 24 | New York, NY | Marketing coordinator | Large (~120) | Live goal — friend's wedding | Yes (Whering, abandoned) |
| 2 | Priya | 28 | San Francisco, CA | Software engineer | Small (~40, capsule) | Curate + work trip | No |
| 3 | Destiny | 31 | Atlanta, GA | ICU nurse + part-time creator | Very large (~220) | Curate (decision fatigue) | Tried Acloset, quit |
| 4 | Sofia | 26 | Chicago, IL | Grad student (part-time job) | Medium (~70) | Live goal — new internship | No |
| 5 | Reagan | 33 | Austin, TX | Product manager, new mom | Medium, in flux (~80) | Life event — postpartum rebuild | No |

Spread is intentional: 2 likely advocates (Priya, Reagan), 2 mixed (Maya, Sofia), 1 likely churn (Destiny — the top-risk case).

---

## 1 — Maya, 24, NYC · marketing coordinator

**Trigger:** College friend's wedding in Charleston in 6 weeks; also "always feel like I have nothing despite a packed closet."
**Started onboarding?** Yes. **Finished?** No — partial.
**Time taken:** ~25 min before stopping at ~45 of ~120 items.
**Drop-off / complaints:** *"I was into it for the first 20 minutes, then realized I had like a hundred more things to photograph and just… closed it. I'll finish it later — which means never, honestly."*
**Daily-outfit score:** 7/10. *"The looks were cute and they were genuinely mine — but a couple suggested stuff I'd donated. It only knew the half I'd uploaded."* (→ **false-gap risk confirmed**)
**Gap recs accurate / non-redundant?** Partly. Loved the wedding-guest gap ("a midi in a warm tone — you skew cool neutrals, branch out"), but flagged it suggested heels she already owns.
**Bought anything?** Likely — clicked through on a recommended midi dress, "saved it, 70% I'll buy."
**Willingness to pay:** Free + affiliate only. *"I'd never pay a subscription for this. I barely keep Spotify."*
**Top quote:** *"The idea is great. The data-entry is the dealbreaker. Make it pull my camera roll automatically or I'm out."*

---

## 2 — Priya, 28, SF · software engineer

**Trigger:** Deliberately building a capsule wardrobe; has a 4-day work offsite in Seattle.
**Started onboarding?** Yes. **Finished?** Yes — fully.
**Time taken:** ~12 min (small, curated wardrobe = low friction).
**Drop-off / complaints:** None significant. *"Because I own less, this was painless. I can see how it'd be hell with a giant closet."*
**Daily-outfit score:** 8/10. *"It recombined things I hadn't paired before — that's the actual value. I don't need new clothes, I need new combinations."*
**Gap recs accurate / non-redundant?** Yes, strongly. *"It correctly said I don't need another white tee — I have three. It found a real gap: a structured layer for cold meeting rooms."*
**Bought anything?** Yes — a recommended merino overshirt in her palette. *"This is exactly the intentional-buy behavior I want."*
**Willingness to pay:** Yes — *"I'd pay $5–8/month for something that stops me over-buying. It pays for itself in one avoided mistake."*
**Top quote:** *"The honesty is the feature. An app that tells me NOT to buy something is one I'd trust to tell me what to buy."*

---

## 3 — Destiny, 31, Atlanta · ICU nurse + part-time creator

**Trigger:** Decision fatigue — *"I work three 12s, I have zero brain left for outfits, and I own way too much."*
**Started onboarding?** Yes. **Finished?** No — abandoned early.
**Time taken:** ~15 min, got through ~30 of ~220 items, quit.
**Drop-off / complaints:** *"Two hundred items. Are you serious? I tried Acloset and quit for the same reason. The people with the most clothes need this the most and can NEVER finish the setup."* (→ **the central risk, in one quote**)
**Daily-outfit score:** 8/10 *on concept* — but couldn't experience it properly with 30 items logged. *"If it actually knew my whole closet and just told me what to wear each morning? Ten. But it doesn't, because I couldn't finish."*
**Gap recs accurate / non-redundant?** N/A — inventory too incomplete to trust. Got false gaps immediately.
**Bought anything?** No — never reached a trustworthy recommendation.
**Willingness to pay:** *"I'd pay for the daily-outfit version. I will not do the homework to unlock it."*
**Top quote:** *"Solve the closet-upload problem and I'm your customer for life. Don't, and I'm gone in day one — like I was with the last one."*

---

## 4 — Sofia, 26, Chicago · grad student

**Trigger:** Starting a summer internship; needs business-casual on a tight budget.
**Started onboarding?** Yes. **Finished?** Yes — moderate effort (~70 items, ~20 min).
**Drop-off / complaints:** *"Long but doable on a Sunday. I'd have liked a 'just my work clothes' shortcut instead of everything."*
**Daily-outfit score:** 7/10. *"Helpful for stretching what I have — which is the whole point when you're broke."*
**Gap recs accurate / non-redundant?** Yes, and the **price-tier feature mattered most**: *"Other tools show me $200 'investment pieces.' This gave me a $35, a $70, and a splurge option. The $35 is the only realistic one and I appreciated it being there."*
**Bought anything?** Yes — a budget-tier blazer. *"Bought the cheap one. Would not have found it on my own."*
**Willingness to pay:** Free only. *"I'm the most price-sensitive person you'll interview. Affiliate is fine, subscription is a no."*
**Top quote:** *"Respect my budget and I'll trust you. The 3-price-tiers thing is the part that made it feel like it was actually for me."*

---

## 5 — Reagan, 33, Austin · PM, new mom

**Trigger:** Postpartum — body changed, *"nothing fits, I feel like a stranger in my own closet, and I have no time to figure it out."*
**Started onboarding?** Yes. **Finished?** Yes — motivated by acute pain (~80 items, ~22 min).
**Drop-off / complaints:** *"It was effort, but my pain is bad enough that I pushed through. A casual user wouldn't have."* (→ pain level, not patience, drove completion)
**Daily-outfit score:** 9/10. *"It found things that still fit and flatter the new me. That was almost emotional, honestly."*
**Gap recs accurate / non-redundant?** Yes. *"It understood I needed forgiving, nursing-friendly pieces without me having to spell out why."* Noted the highlight/downplay question landed well **because it was framed kindly** — *"if it had said 'hide your problem areas' I'd have deleted the app."* (→ validates the neutral-framing decision)
**Bought anything?** Yes — two recommended pieces. *"Highest-intent I've been about shopping in a year."*
**Willingness to pay:** Yes — *"$10/month, easily. This solved something I was genuinely distressed about."*
**Top quote:** *"Life events are when you most need this and have the least time. Catch women at those moments — new job, new baby, new city — and you've got them."*

---

## Synthesis — scored against the pass/kill bars

| Signal | Pass bar | Simulated result | Verdict |
|--------|----------|------------------|---------|
| **Onboarding completion** | ≥60% finish full capture | 3/5 finished (Priya, Sofia, Reagan), 1 partial (Maya), 1 abandoned (Destiny) → **~60%** | ⚠️ **Borderline** |
| Friction | "worth it" | Worth it *only* for small wardrobes or high pain | ⚠️ Conditional |
| Daily-outfit appeal | ≥7 avg + "better than X" | ~7.8 avg; beat prior apps for Maya/Destiny | ✅ Pass |
| Gap quality | mostly accurate | Accurate when inventory complete; **false gaps whenever it wasn't** | ⚠️ Pass *conditional on inventory* |
| Actually bought | ≥1–2 purchases | 4/5 bought or high-intent | ✅ Pass |
| Willingness to pay | — | Split: subscription only from high-pain (Priya, Reagan); others free+affiliate | Affiliate-first confirmed |

### The one insight that matters most
**Onboarding completion is inversely correlated with wardrobe size — and wardrobe size is correlated with need.** The people who most need daily styling help (Destiny, 220 items) are the *least* able to finish setup, while the people who finish easily (Priya, 40 items) need it least. Your acquisition funnel and your value proposition are pulling in opposite directions. This is the same top risk the brief named — the simulation just put a face and a wardrobe count on it.

### What pushes completion through anyway
**Acute pain beats friction.** Reagan (postpartum) finished despite the effort because the pain was high. This validates her own closing line: **target life-event moments** (new job, new baby, new city) where motivation is highest — that's where heavy onboarding survives.

### Hypotheses to carry into the *real* test
1. **Auto-import from camera roll is likely the single highest-leverage feature** — three of five named manual capture as the blocker. Test whether a gallery-pull meaningfully lifts completion.
2. **"Just my work clothes" / partial-wardrobe shortcut** (Sofia) may rescue completion without solving full auto-import. Cheap to test.
3. **Price-tier transparency drives trust for budget users** (Sofia) — keep it prominent.
4. **Neutral framing of highlight/downplay is load-bearing** (Reagan) — confirmed worth protecting.
5. **Monetization is affiliate-first; subscription only converts the high-pain segment** — don't gate core value behind a paywall.

### Honest caveat (again)
Every "yes I'd buy" above was generated by the simulator, not earned from a real wallet. Synthetic users are systematically more agreeable and more articulate than real ones, and they can't surprise you with a behavior you didn't think to model. Treat this as a *rehearsal and hypothesis generator* — then go run the real thing.
