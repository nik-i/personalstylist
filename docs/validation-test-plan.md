# Personal Stylist — Validation Test Plan

*Companion to product-brief.md · Draft v1*

## Goal
Test the **riskiest assumption** before writing any code:

> "People will complete heavy wardrobe onboarding to get a daily feature free apps already offer — and will then buy gap-pieces we recommend."

If this fails, no amount of engineering saves the product. If it holds, you've retired the one fatal risk and earned the right to build.

## Method: concierge (Wizard-of-Oz)
**You are the app.** No code, no models, no UI. You manually do what the product would do, so you test *demand and value* — not your ability to build software. Use a shared folder / chat / simple form for intake and a slide or doc for delivery.

## Who to recruit
- **5–8 real target users.** Not friends who'll be polite — people who actually shop online and care about clothes.
- Mix of trigger states: at least 2 with a *live goal* (upcoming trip / event / new job), and 2 in "just curate" mode.
- Recruit from your network, a relevant community, or a short social post. Screen out anyone who says "I don't really think about clothes."

## The protocol (per participant)

### Step 1 — Onboarding (the friction test)
Ask each person to provide, on their own:
- A handful of **best-outfit photos** of themselves.
- Photos of their **wider wardrobe** (gallery pull or quick shots) — *this is the friction you're measuring.*
- **Sizes**, **body shape** (from labeled silhouettes), **highlight/downplay** prefs (neutral framing, optional).
- **Geography**, **budget**, **favorite brands** (optional).

📏 **Measure here:** Did they start? Did they *finish*? How long did it take? Where did they drop off or complain? This is the core data point — onboarding completion is your floor metric and primary kill condition.

### Step 2 — Daily value (the retention hook test)
Manually create **2–3 "style what you own" outfits** from their existing wardrobe and send them.
- 📏 **Measure:** reaction. Would they open this daily/weekly? Is it better than what free closet apps give them? Get a 1–10 and a "why."

### Step 3 — Gap recommendation (the monetization test)
For the participants with a live goal, manually deliver the full output flow:
1. The gap, 2. general piece style, 3. **3 specific buyable pieces** in their retailers/price tier with real links.
- 📏 **Measure:** Do the recs feel right and *non-redundant* (no false gaps)? Would they buy?

### Step 4 — The truth test
- 📏 **Measure (ceiling):** Did they **actually buy** anything you recommended? Did they share a photo wearing it?
- Ask willingness to pay / how much they'd expect this to cost.

## Metrics & thresholds

| Signal | Metric | Pass bar | Kill bar |
|---|---|---|---|
| **Floor** | Onboarding completion | ≥ 60% finish full wardrobe capture | < 30% even start, or most quit mid-way |
| Friction | Time + complaints to onboard | Tolerable / "worth it" | "Too much work" is the dominant theme |
| Retention hook | Daily-outfit appeal (1–10) | ≥ 7 avg *and* "better than X I use" | Generic / "I'd use my own apps" |
| Gap quality | Recs feel right, no false gaps | Majority "yes, accurate" | Frequent "I already own that" |
| **Ceiling** | Actually bought a rec | ≥ 1–2 real purchases across cohort | Zero intent to buy |

## Onboarding-friction mini-experiments *(for large-wardrobe users)*
Synthetic interviews flagged that big-closet users (highest need) are likeliest to abandon capture. Test the fixes *cheaply* before building any — ranked by leverage:

1. **Reduce the work (highest leverage):** for 1–2 large-wardrobe participants, *you* manually tag items from a camera-roll album they share (simulating auto-import). Measure: does removing manual entry change whether they'd complete? This is the single most important variant to test.
2. **Group / chunk:** offer a "just your work clothes first" partial start. Measure: do they finish a chunk and come back for more?
3. **Gamify:** lowest priority — only test if 1 and 2 fail to move completion.

📏 **Key metric:** completion rate among **large-wardrobe (>150 item)** participants specifically — segment this separately, since it's where the product is most at risk.
**Reframe to test alongside:** can a user get real value from *favorites + basics only*, with inventory filling in over time — i.e., is full upfront capture even necessary?

## Timeline & cost
- ~2 weeks: 1 week recruit + intake, 1 week deliver + interview.
- Cost ≈ £0 + your time. No tools beyond a form, a folder, and a doc.

## What each outcome means
- **Pass:** onboarding completes *and* people buy → retire the fatal risk → start the leanest build (begin with the gap-analysis monetization flow + progressive inventory).
- **Mixed (buy yes, onboarding no):** the value is real but the wardrobe-capture friction is the wall. Pivot onboarding to progressive/lighter inventory and re-test before building.
- **Fail (onboarding no, or no buying):** stop. You learned it for £0 instead of 3 months.

## Results log (fill per participant)
```
Participant:
Trigger state (live goal / curate):
Started onboarding?  Finished?  Time taken:
Drop-off point / complaints:
Daily-outfit score (1–10) + why:
Gap recs accurate / non-redundant?
Bought anything? What? Photo shared?
Willingness to pay:
Top quote:
```
