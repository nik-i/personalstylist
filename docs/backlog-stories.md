# personalstylist — Feature & Story Backlog

*Derived from PRD-personalstylist.md · Draft v1 · Format: 3 C's + INVEST*

> ⚠️ **Provisional.** Flags carried from the PRD. **[VALIDATE]** = assumption-dependent; do not build until the concierge test (validation-test-plan.md) gives positive signal. Priorities: P0 = V1 core, P1 = V1.5, P2 = V2.

**Roles used:** *New User* (onboarding), *User* (activated), *Big-Closet User* (>150 items), *Returning User*, *Shopper* (in a buying moment).

---

## EPIC A — Onboarding & Profile
*Goal: build the persistent taste + wardrobe profile with the least friction. This epic contains the product's biggest risk (completion).*

### F1 — Profile & onboarding · P0
**A1.1 — Upload best-outfit photos**
*As a New User, I want to upload a few photos of outfits I love, so the app learns my taste without a long quiz.*
- AC1: User can add 3–5 photos from camera or gallery.
- AC2: System extracts coloring, rough body shape, and style signals; seeds these into the profile.
- AC3: Each uploaded outfit is added as seed inventory items.
- AC4: User can remove a photo before continuing.
- AC5: A privacy note states photos are private and not shared.

**A1.2 — Enter sizes**
*As a New User, I want to enter my usual sizes per category, so recommendations come in sizes I can actually buy.*
- AC1: User can enter sizes for tops, bottoms, dresses, shoes.
- AC2: Sizes are optional per field; skipped fields don't block progress.
- AC3: Sizes are editable later from the profile.
- AC4: System supports common regional size systems based on geography.

**A1.3 — Confirm body shape**
*As a New User, I want to pick my body shape from labeled silhouettes, so advice fits me without estimating measurements from photos.*
- AC1: User sees labeled silhouette options plus a "not sure" choice.
- AC2: "Not sure" is allowed and does not block onboarding.
- AC3: No body measurements are estimated from photos (excluded by design).
- AC4: Selection is editable later.

**A1.4 — Set highlight / downplay preferences**
*As a New User, I want to say what I'd like to show off or draw attention away from, so outfits flatter me — without feeling judged.*
- AC1: Question uses neutral framing ("show off" / "draw attention away from"); never "flaws/insecurities."
- AC2: Entire step is optional and skippable.
- AC3: User taps body areas with highlight / downplay / no-preference.
- AC4: Preferences feed silhouette/cut logic in recommendations.

**A1.5 — Set geography, budget, and brand preferences by category**
*As a New User, I want to tell the app which brands I like for different parts of my life, so recommendations feel right for the context — not just generically "my style."*
- AC1: Geography is **required** to finish onboarding.
- AC2: Budget range is optional.
- AC3: Brand preferences are captured **per wear category**: day-to-day, office, occasion, athletic, activewear. Each category is independent and optional.
- AC4: If no brands set for a category, system defaults to 3 price tiers for that context.
- AC5: All fields editable later from profile.
- AC6: Brand selections feed product matching immediately — a user who lists Zara for office wear and Lululemon for activewear gets contextually appropriate options.

### F3 — Wardrobe auto-import · P0 **[VALIDATE — highest-leverage, highest-risk]**
**A3.1 — Import wardrobe from camera roll**
*As a New User, I want the app to pull clothing photos from my camera roll, so I don't photograph every item by hand.*
- AC1: With consent, system scans the gallery for clothing/outfit images.
- AC2: Detected garments are auto-tagged (type, color, attributes).
- AC3: User reviews and edits/confirms tags rather than entering from scratch.
- AC4: User can exclude any photo or item.
- AC5: **[VALIDATE]** Measure completion lift vs. manual capture, segmented by wardrobe size.

**A3.2 — Manual photo fallback**
*As a New User without usable gallery photos, I want to photograph items myself, so I can still build my wardrobe.*
- AC1: User can capture/upload item photos one by one.
- AC2: System auto-tags each; user can correct.
- AC3: Manual and imported items live in one unified wardrobe.

### F10 — Progressive / chunked onboarding · P1
**A10.1 — Start with a wardrobe subset**
*As a Big-Closet User, I want to start with just one category (e.g., work clothes), so I get value before logging everything.*
- AC1: User can choose a starting subset instead of full capture.
- AC2: App delivers a usable recommendation after the first chunk.
- AC3: User is prompted (not forced) to add more chunks over time.
- AC4: Progress toward a fuller wardrobe is visible.

**A10.2 — Value from favorites + basics only**
*As a New User, I want useful results from just my favorites and basics, so full capture isn't required upfront.*
- AC1: Gap analysis runs on a partial wardrobe with a clear confidence caveat.
- AC2: App flags when low inventory may cause inaccurate ("false") gaps.
- AC3: **[VALIDATE]** Confirm whether full upfront capture is necessary at all.

---

## EPIC B — Wardrobe Management

### F2 — Wardrobe inventory · P0
**B2.1 — Browse my wardrobe**
*As a User, I want to see all my items in one place, so I know what I own.*
- AC1: Items display as cards with image, type, and color.
- AC2: User can filter by category and color.
- AC3: Empty state guides the user to add items.

**B2.2 — Edit or remove an item**
*As a User, I want to fix tags or remove items I no longer own, so my wardrobe stays accurate.*
- AC1: User can edit type, color, and attributes of any item.
- AC2: User can delete an item (e.g., donated clothes).
- AC3: Removed items stop appearing in outfits and gap analysis immediately.
- AC4: Removing items reduces false-gap risk (links to honesty guardrail).

---

## EPIC C — Styling & Recommendations
*Goal: the differentiated value — grounded, honest, goal-driven advice.*

### F4 — Gap analysis & recommendation · P0 *(the differentiator)*
**C4.1 — State a styling goal**
*As a Shopper, I want to tell the app my goal (trip / event / season / life change), so advice fits the occasion.*
- AC1: User can choose a goal type and add a free-text detail.
- AC2: User can state their biggest wardrobe frustration.
- AC3: Goal context is used in the resulting recommendation.

**C4.2 — See the gap (grounded, honest)**
*As a Shopper, I want to see what's missing for my goal based on what I already own, so I don't buy things I don't need.*
- AC1: Output explicitly names what the user already owns and should NOT re-buy.
- AC2: Gap is computed against current inventory (no false gaps when inventory is complete).
- AC3: If inventory is sparse, a confidence caveat is shown.

**C4.3 — Get a recommended piece style**
*As a Shopper, I want a described piece style in my colors and shapes, so I know what to look for.*
- AC1: Recommendation states piece type, color/palette fit, and flattering cut.
- AC2: Style reflects the user's taste and highlight/downplay preferences.

**C4.4 — Get 3 specific buyable options**
*As a Shopper, I want three real products to consider, so I can act immediately.*
- AC1: Three products shown with image, price, retailer, and link.
- AC2: If favorite retailers are set, options come from them.
- AC3: If none set, options span 3 price tiers (low / mid / higher).
- AC4: All options respect the user's geography and budget.

### F7 — Honesty guardrail · P0
**C7.1 — Suppress recommendations for owned items**
*As a User, I want the app to never tell me to buy something I already own, so I trust its advice.*
- AC1: Recommendation engine cross-checks every suggestion against inventory.
- AC2: Owned/near-duplicate items are excluded from "buy" suggestions and surfaced as "you already have this."
- AC3: Affiliate availability never inflates the gap (no suggestion the goal doesn't justify).
- AC4: Rule is testable: given an owned item matching a gap, no buy is recommended for it.

### F6 — Style what you own · P1
**C6.1 — Daily outfits from owned items**
*As a Returning User, I want daily outfit ideas using only clothes I own, so getting dressed is easy.*
- AC1: App shows 2–3 outfits built solely from inventory.
- AC2: Outfits respect taste and highlight/downplay preferences.
- AC3: User can mark "love / not for me" to improve future suggestions.
- AC4: **[VALIDATE]** Track appeal score and 7-day return rate.

### F8 — Weather / calendar context · P2
**C8.1 — Weather-aware outfits**
*As a User, I want outfits suited to today's weather, so I dress appropriately.*
- AC1: Daily outfits factor in local forecast.
- AC2: Inappropriate items for conditions are de-prioritized.

**C8.2 — Plan-aware outfits**
*As a User, I want outfits that fit tomorrow's plans, so I'm prepared.*
- AC1: With consent, app reads calendar events.
- AC2: App can ask the night before about next-day plans.
- AC3: Outfit suggestions reflect the event type.

---

## EPIC D — Commerce & Retention

### F5 — Product matching · P0
**D5.1 — Match recommendations to live products**
*As a Shopper, I want recommendations linked to in-stock, buyable products, so I can purchase.*
- AC1: System matches a recommended style to real products via affiliate feed / retailer data.
- AC2: Results filtered by geography, budget, and brand.
- AC3: Out-of-stock or out-of-region products are excluded.
- AC4: Each product links out with affiliate attribution.

### F9 — Sale / new-arrival alerts · P2
**D9.1 — Alerts on my gap pieces**
*As a User, I want to be notified when a gap piece in my taste and size goes on sale or arrives, so I buy at the right time.*
- AC1: User can opt into alerts.
- AC2: Alerts match the user's gap, size, taste, and price range.
- AC3: User can mute or unsubscribe easily.

### F11 — Buy-loop capture · P2
**D11.1 — Add a purchased item back to my wardrobe**
*As a User, I want to upload a photo of something I bought, so my wardrobe stays current and recommendations improve.*
- AC1: User can upload a photo of a purchased item.
- AC2: Item is tagged and added to inventory.
- AC3: **[VALIDATE]** Track % of purchasers who close the loop (KR4).

---

---

## EPIC E — Natural Language Interface · P1

*Goal: let users talk to the app the way they'd talk to a friend who knows their wardrobe.*

### F12 — Conversational interface
**E12.1 — Ask what to wear in plain language**
*As a User, I want to describe my day and ask what to wear, so I don't have to navigate menus or fill out forms.*
- AC1: User can type or speak a natural-language prompt (e.g., "I have a panel interview at 10 and dinner with friends after — what should I wear?").
- AC2: App interprets context (formality, timing, activities) and responds with a specific outfit from owned items.
- AC3: Response is conversational — it explains *why* each piece works, not just a list.
- AC4: User can reply to refine ("something warmer" / "I already wore that Tuesday") and the app adjusts.
- AC5: Voice input supported on mobile.

**E12.2 — Talk through a plan**
*As a User, I want to describe a future plan and get advice on what it means for my wardrobe, so I can prepare without thinking in outfit-app terms.*
- AC1: User can describe an upcoming situation in free text (e.g., "I'm flying to Edinburgh for 4 days — lots of walking, one nice dinner").
- AC2: App identifies the planning need (travel, occasion, weather context) and routes to the appropriate flow (trip planner, gap analysis, etc.).
- AC3: Conversation state persists so follow-up questions stay in context.

---

## EPIC F — Planning · P1

*Goal: help users dress intentionally for what's coming — trips, work weeks, and occasions — without manual outfit-by-outfit thinking.*

### F13 — Travel & occasion planner
**F13.1 — Plan outfits for a trip**
*As a User, I want to tell the app about an upcoming trip and get a full outfit plan, so I pack right and don't over-buy or under-pack.*
- AC1: User inputs destination, trip length, and activity types (business, leisure, mix, one nice dinner, etc.).
- AC2: App builds a day-by-day or activity-by-activity outfit set from owned wardrobe items.
- AC3: Gaps are surfaced honestly — only pieces that are genuinely missing for the trip, grounded in current inventory.
- AC4: Output includes a packing list grouped by outfit.
- AC5: Owned-item honesty guardrail applies: no item is flagged as a "gap" if the user already owns something that covers it.

**F13.2 — Lookahead buying for upcoming events**
*As a User with something coming up in 7–15 days, I want to be alerted to any genuine gaps early enough to buy and receive pieces before the event.*
- AC1: Triggered only when (a) a future event is registered and (b) a genuine gap exists based on current inventory.
- AC2: Lead time check: only surfaces buying suggestions if there's realistically enough time to receive the item based on the user's location and retailer shipping times.
- AC3: **Guardrail — thin line:** the lookahead prompt must not fire as a default nudge to browse. It fires only when a specific named gap exists. If inventory is sufficient, no buying suggestion is made.
- AC4: User can dismiss or snooze the suggestion.
- AC5: Framing is explicit: "You've got [event] in [X days]. Based on your wardrobe, you're missing [specific gap] — here are options that can arrive in time."

### F14 — Work wear weekly planner
**F14.1 — Plan a week of work outfits**
*As a User, I want to plan my work outfits for the week in one go, so I'm not deciding each morning.*
- AC1: User initiates a weekly or fortnightly planning session (manually or via a recurring prompt).
- AC2: App generates a day-by-day outfit schedule from owned work-appropriate items.
- AC3: Factored in: meeting types (if user provides them), weather forecast, and rotation variety (no item repeated within the plan unless the wardrobe requires it).
- AC4: User can swap individual days or items.
- AC5: Plan is saved and surfaced each morning as the day's recommendation.

**F14.2 — Surface a work wear gap (sparingly)**
*As a User doing weekly planning, I want to know if there's something genuinely missing from my work wardrobe — not just prompted to shop.*
- AC1: App flags a gap only if a recurring work-week need is unmet across multiple planned days (e.g., "you have no tailored trouser option — this comes up 3 days of 5").
- AC2: Gap is surfaced as an observation, not a push notification or sales moment.
- AC3: **Guardrail:** No gap is flagged just because the wardrobe is small or because shopping would improve variety. Only flags structural gaps (a category genuinely missing).

---

## EPIC G — Shopping Assistant · P2

*Goal: when the user is ready to buy, help them find and decide — actively, not passively.*

### F15 — In-app shopping assistant
**G15.1 — Interactive shopping mode**
*As a Shopper who's decided to buy, I want the app to help me narrow down and choose, so I don't get overwhelmed by options.*
- AC1: Triggered when user explicitly signals intent to shop ("I want to buy the blazer" / "Help me find this").
- AC2: App enters an interactive mode: presents options, asks clarifying questions (colour preference, delivery timing, price ceiling), and narrows the field.
- AC3: User can compare two items side-by-side.
- AC4: App makes a recommendation with a reason ("This one fits your palette better and ships in 2 days").
- AC5: Grounded in the existing identified gap — not a free-range browsing session. User can exit to free browse but the gap context is preserved.

---

## EPIC H — Social · P2

*Goal: let users share looks with friends — for fun, for feedback, and as organic reach.*

### F18 — Look sharing
**H18.1 — Share a styled look**
*As a User, I want to share an outfit the app styled for me with a friend, so I can get their opinion or just show it off.*
- AC1: Any outfit card (daily outfit, trip plan, or gap recommendation) has a share option.
- AC2: Sharing generates a clean image card showing the outfit and (optionally) the pieces.
- AC3: Shared card includes a link to the app with a brief "styled by personalstylist" attribution — no account required to view.
- AC4: Gap-piece buy links are included in the shared card only if the user opts in.
- AC5: User controls whether sharing includes their name/handle or is anonymous.

---

## Build-order summary
- **V1 (P0):** F1, F2, F3 *(if validated)*, F4, F5, F7, F16
- **V1.5 (P1):** F6, F10, F12, F13, F14 — promote F3 here if auto-import fails the value test
- **V2 (P2):** F8, F9, F11, F15, F17, F18; gamification only if grouping/auto-import don't lift big-closet completion

**Gate:** Stories tagged **[VALIDATE]** stay in the backlog as *spikes/experiments* until the concierge test confirms their assumption. Everything downstream of A1 (will users complete capture?) depends on that result.
