---
name: style-me
description: Generate a personalized outfit suggestion from the user's wardrobe for a specific occasion. Use this skill whenever the user wants to know what to wear, asks for outfit help for an event, triggers "Style Me Now", or describes an upcoming occasion and needs styling guidance — even casually ("got a thing tonight", "what goes with this?"). Always collect occasion, date/time, indoor/outdoor context, and desired impression before generating — never skip straight to suggestions. Even if the user gives partial context upfront, use this skill to fill the gaps conversationally.
---

# Style Me Now

Conversational outfit suggestion flow for The Wardrobe Collective. Collect context from the user like a stylist would — occasion, timing, setting, and the impression they want to make — then run the outfit-suggester engine to return a ranked outfit from their wardrobe.

All paths are relative to `app/`.

## The core questions

Ask these in order, one at a time, conversationally. Don't list them all at once — each answer informs how you ask the next.

If the user already gave an answer in their original message (e.g. "dinner date this Saturday evening, outdoors"), skip that question. If they answered everything upfront, confirm all answers in a single line ("Got it — outdoor dinner date, Saturday evening. Let's do this.") rather than confirming each one separately, then go straight to generating.

---

### 1. What's the occasion?

Ask: **"What's the occasion?"**

Accept free text or steer toward: Work, Casual, Dinner, Wedding, Party, Date, Brunch, Interview, Other.

Map to suggester inputs:

| Occasion | `place` | `activity` |
|----------|---------|------------|
| Work | `"office"` | `"client meeting"` |
| Interview | `"office"` | `"job interview"` |
| Dinner / Date | `"restaurant"` | `"dinner date"` |
| Wedding | `"wedding"` | `"wedding ceremony"` |
| Party | `"bar"` | `"birthday party"` |
| Brunch | `"cafe"` | `"brunch with friends"` |
| Casual / Errands | `"friends"` | `"casual outing"` |
| Free text | pass as-is | pass as-is |

**High-stakes follow-ups.** Two occasions span too wide a formality range to map blindly — ask one extra question for each:

- **Wedding** → "Is there a dress code on the invite — black tie, cocktail, beach casual?" Fold the answer into mood (e.g. `"black tie formal"`). If unknown, default to cocktail-level formality.
- **Interview** → "What kind of company — corporate, startup, creative?" Corporate/legal/finance → mood `"conservative, sharply professional"`. Startup/creative → mood `"smart but relaxed, polished casual"`. If unknown, err on the more formal side.

---

### 2. When is it?

Ask: **"When is it?"**

Parse date and time from natural language — "Tonight at 8", "This Saturday afternoon", "Next Friday morning" all work.

Derive:
- `month`: calendar month number (1–12) from the date
- `time`: time string, e.g. `"8pm"`, `"morning"`, `"afternoon"`

**Defaults when partially specified:**
- Time of day given but no date → use the current month.
- Date given but no time → default by occasion: Dinner, Date, Party → `"evening"`; everything else → `"afternoon"`.

If the date has already passed, gently flag it: "That date's already gone — did you mean a future date?"

**Evening formality shift:** the same occasion reads dressier after dark. If the resolved time is evening/night, append `"evening-appropriate"` to mood; if morning/daytime, append `"daytime-appropriate"`.

---

### 3. Indoor or outdoor?

Ask: **"Will this be indoors, outdoors, or a mix of both? And will you be on your feet much — walking, standing, dancing?"**

Offer three setting options: **Indoors** | **Outdoors** | **Mix of both**

Map to `mood` context passed to the suggester:
- Indoors → leave mood from user's tone / occasion only
- Outdoors → prepend `"weather-appropriate and practical"` to mood
- Mix → prepend `"practical for both indoor and outdoor"` to mood

If the user indicates lots of walking, standing, dancing, or uneven ground (grass, sand, cobblestones), append `"comfortable practical footwear required"` to mood — and apply the footwear sanity checks below when presenting.

---

### 4. What impression do you want to make?

Ask: **"Last one — what's the vibe you're going for? Polished, relaxed, a bit bold, understated?"**

This is the highest-leverage stylist question. Accept free text and pass it into mood alongside the occasion/setting signals. If the user shrugs ("whatever works"), infer from occasion (interview → polished; brunch → relaxed) and don't press.

If the user has previously stated style preferences or no-gos in this conversation (or in the suggestion history file — see below), apply them here without re-asking.

---

## Location and season

`month` alone can't determine season — July is summer in London and winter in Sydney. Resolve location in this priority order:

1. A location the user has mentioned in this conversation or in the suggestion history file
2. Ask once, casually, alongside question 2 or 3: "And roughly where will this be?" — then cache it in the history file for future sessions
3. If genuinely unavailable, leave location empty and assume northern-hemisphere seasons, but say so when presenting: "I've assumed [season] — shout if you're in the southern hemisphere."

**Near-term weather:** if the event is within 7 days, the location is known, and a weather lookup tool is available in the environment, fetch the forecast and fold it into mood (e.g. `"rain expected, needs a waterproof layer"`). If no such tool exists, fall back to season inference — don't invent a forecast.

---

## Suggestion memory

Keep a lightweight history so styling builds on itself. Store at `/tmp/style-me-history.json` (create if missing):

```json
{
  "location": "London",
  "no_gos": ["yellow", "anything strapless"],
  "loved": ["floral wrap dress"],
  "suggestions": [
    { "date": "2026-07-18", "occasion": "dinner date", "items": ["floral wrap dress", "nude heels"] }
  ]
}
```

Use it three ways:

- **Avoid repeats** — don't suggest the same core outfit for the same occasion type within the last ~3 suggestions. If the engine's top pick is a repeat and alternatives exist, lead with the next-ranked outfit and mention it: "You wore the wrap dress to your last dinner — let's mix it up."
- **Respect no-gos** — filter out items matching stated dislikes before presenting. Add new no-gos whenever the user expresses one ("I hate that jacket").
- **Lean into loves** — if a loved item fits the occasion and isn't a repeat, weight toward it.

After presenting, append the suggestion to the history. If the user later reports how it went ("that outfit was perfect" / "the heels were a mistake"), record it under `loved` / `no_gos` accordingly.

---

## Running the suggestion

Once the answers are collected, run these two steps from the `app/` directory.

### Step 1 — fetch the user's real wardrobe

```bash
node .claude/skills/style-me/fetch-wardrobe.cjs > /tmp/style-me-wardrobe.json
```

Cache this for the rest of the conversation — do not re-fetch for follow-up requests ("what about Sunday brunch instead?") unless the user says they've added or removed items, or the fetch is more than a session old.

If this fails (non-zero exit or empty output), stop and tell the user:
> "I couldn't reach your wardrobe — make sure `MCP_USER_ID` is set in `.env.local` and try again."

If it returns an empty array (`[]`), tell the user:
> "Your wardrobe is empty. Add some items first and I'll be able to suggest an outfit."

### Step 2 — run the outfit-suggester with the real items

```bash
node -e "
const items = require('/tmp/style-me-wardrobe.json');
const input = {
  context: {
    location: '<resolved location or empty string>',
    place: '<mapped place>',
    activity: '<mapped activity>',
    time: '<parsed time string>',
    mood: '<impression + occasion mood + setting/footwear signals + evening/daytime + weather if known>',
    month: <month number>
  },
  items
};
process.stdout.write(JSON.stringify(input));
" | node .claude/skills/outfit-suggester/driver.mjs --stdin
```

Never fall back to the sample wardrobe for a real user request — the suggestion must come from their actual items.

---

## Stylist rules

Apply these checks to the engine's output before presenting. If a rule forces a change, prefer the next-ranked outfit that passes; if none passes, present the best available and flag the issue honestly.

**Blazer rule (business/office):** If the resolved formality is `business` and the top outfit does not already include a blazer, scan the wardrobe for any blazer, structured jacket, or tailored outerwear. If one exists, suggest layering it: "Throw your [blazer] over this for an extra layer of polish." If none exists, flag the gap: "One thing your wardrobe is missing for office days — a blazer would pull this together instantly."

**Wedding guest rule:** Never suggest white, ivory, cream, or off-white as the dominant piece for a wedding guest. If the engine's top pick violates this, use the next-ranked outfit. If the wardrobe genuinely has nothing else suitable, say so plainly rather than suggesting the white piece.

**Interview conservatism:** For interviews, bias toward darker solids and structured pieces; deprioritize loud prints, distressed items, and anything the user tagged as party wear. Interviews resolve to a formality at or above regular office wear, never below.

**Footwear–venue sanity check:** No stiletto or delicate heels for outdoor, mixed, grass, sand, or heavy-walking contexts. Swap for the most polished practical option in the wardrobe (block heel, loafer, clean sneaker) and explain the swap: "Skipping the stilettos — rooftop gravel is not their friend. The block heels give you the height without the wobble."

**Weather layering:** If weather or season suggests cold or rain, ensure outerwear is included or its absence is flagged. Explain when to wear it ("for the journey there — check it once you're inside").

---

## Presenting the result

Present the top passing outfit in Maya's voice — warm, direct, and confident. Don't dump raw JSON.

**Format:**
1. A one-sentence opener: why this outfit works for the occasion, setting, and the impression they asked for
2. Each piece on its own line: type + color, then a brief reason (season fit, formality, weather suitability)
3. If outerwear is included, explain when/whether to wear it
4. **Finishing touches** — one line on accessories/grooming, even generic if the wardrobe has no accessory data ("keep jewelry minimal — the print is doing the work")
5. **The why-not** — one sentence on a notable piece you passed over and why ("I skipped the black midi — too heavy for a July afternoon"). Skip this if nothing was meaningfully in contention.

**Hero + backup:** if the engine returned multiple outfits, lead with the confident pick, then offer one alternative with deliberately different energy: "If you're feeling bolder, there's a second look — say the word." Don't present all alternatives unprompted.

**Example tone:**
> For an outdoor rooftop dinner on a warm summer evening, here's what I'd pull together:
> - **Floral wrap dress** (floral) — the right amount of dressed-up without trying too hard, and breathable for the heat
> - **Block heels** (nude) — elevate the look and won't fight the rooftop decking
>
> Keep jewelry minimal — the print is doing the work. I skipped the black midi; too heavy for July. The dress does the heavy lifting here. Leave the coat at home — it's warm enough.

---

## Edge cases

**Empty result** — if `outfits` is empty, name the gap type rather than just apologizing:
> "Your wardrobe doesn't have enough pieces for this occasion yet — you're covered on tops, but there's nothing formal enough on the bottom half. Add a piece or two and I'll style you properly."

Never suggest buying anything specific or link to products. The suggestion must come exclusively from what the user actually owns; naming a gap category ("a formal shoe option") is as far as it goes.

**Partial outfit** (e.g. no footwear found) — present what was found and flag the gap:
> "I couldn't find shoes in your wardrobe that match this occasion — everything else is here, but you'll want to pair it with something smart."

**Date > 10 days out** — note that weather isn't factored in:
> "That's a little far out for a reliable weather read, so I've gone by the season and occasion instead."

**Rule conflict with a thin wardrobe** — if a stylist rule (wedding white, footwear check) eliminates every option, present the best-ranked outfit anyway with an honest caveat, and name the gap. Never silently break a rule.
