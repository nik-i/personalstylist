# Personal Stylist — Hypotheses to Prove

*Draft v1 · Owner: Nikhita Bhoopati · Companion to validation-test-plan.md*

> These are the core beliefs the product is built on. Each must be tested — ideally with real users before any code is written. A hypothesis is not proven until real behavior (not self-reported intent) confirms it.

---

## H1 — Onboarding will convert despite the friction

**Hypothesis:**
> People will complete heavy wardrobe onboarding to unlock a daily styling feature that free apps already offer — and will then buy gap-pieces we recommend.

**Why it matters:** This is the primary kill condition. If people don't finish onboarding, there is no wardrobe data, no gap analysis, and no revenue. No amount of engineering downstream saves the product.

**What "proven" looks like:**
- ≥60% of recruited users complete enough onboarding to receive a first recommendation.
- ≥1–2 real purchases across the cohort after receiving a gap recommendation.

**What "failed" looks like:**
- <30% even start, or most quit mid-way.
- Zero intent to buy after receiving a rec.

**How to test:** Concierge / Wizard-of-Oz — you manually act as the app for 5–8 real target users. No code required. See `validation-test-plan.md`.

---

## H2 — Wardrobe size and onboarding completion are inversely correlated

**Hypothesis:**
> Onboarding completion is inversely correlated with wardrobe size — and wardrobe size is correlated with need. The users who most need this product are the least likely to finish setup.

**Why it matters:** If true, the acquisition funnel and the value proposition are pulling in opposite directions. Optimising for the easy-to-onboard user (small wardrobe) means ignoring the highest-need user (large wardrobe). The product strategy must address this directly or it will plateau at a low-pain segment.

**What "proven" looks like:**
- Large-wardrobe users (>150 items) show meaningfully lower completion rates than small-wardrobe users (<60 items) in the concierge test.
- Drop-off for large-wardrobe users clusters at the wardrobe-capture step specifically.

**What "failed" looks like:**
- Completion rates are similar across wardrobe sizes — friction is not size-dependent.

**How to test:** Segment completion rate by wardrobe size in the concierge test. Track *where* each person drops off. See `validation-test-plan.md` — large-wardrobe mini-experiment.

---

## H3 — Camera-roll auto-import is the single highest-leverage unlock

**Hypothesis:**
> Camera-roll auto-import (the app pulls clothing photos from the gallery and AI-tags them) is the highest-leverage intervention for improving onboarding completion — more than chunking, gamification, or any other mitigation.

**Why it matters:** Three of five synthetic users named manual capture as the dealbreaker. If auto-import meaningfully lifts completion, it moves from a nice-to-have (V1.5) to a must-have (V1). If it doesn't, a different mitigation (progressive grouping, "favorites + basics" start) becomes the priority.

**What "proven" looks like:**
- Simulating auto-import (you manually tag a shared camera-roll album) meaningfully increases completion willingness for large-wardrobe users vs. manual capture.
- Users describe the experience as "painless" or "I'd actually finish this."

**What "failed" looks like:**
- Even with manual-tagging effort removed, users still don't engage — the problem is motivation, not effort.
- "Favorites + basics only" provides sufficient value without full-wardrobe capture, making auto-import moot.

**How to test:** For 1–2 large-wardrobe participants in the concierge test, manually tag their shared camera-roll album (simulating auto-import). Compare their completion and reaction to participants doing manual capture. See `validation-test-plan.md` — onboarding-friction mini-experiments.

---

## Status tracker

| # | Hypothesis | Status | Signal so far |
|---|-----------|--------|---------------|
| H1 | Onboarding converts despite friction | ⬜ Not yet tested | Synthetic: borderline (~60%) — unvalidated |
| H2 | Inverse correlation: wardrobe size vs. completion | ⬜ Not yet tested | Synthetic: confirmed pattern — unvalidated |
| H3 | Auto-import is the highest-leverage unlock | ⬜ Not yet tested | Synthetic: 3/5 named manual capture as dealbreaker — unvalidated |

*Update status to ✅ Confirmed, ⚠️ Mixed, or ❌ Invalidated after the concierge test.*
