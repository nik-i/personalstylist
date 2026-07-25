---
name: outfit-suggester
description: Suggest an outfit from a user's wardrobe based on location, place, activity, time of day, and mood. Use when implementing or testing outfit recommendation logic.
---

# Outfit Suggester

Pure-logic outfit suggestion engine. Takes context (location, place, activity, time, mood) and a list of `WardrobeItem`s, returns ranked outfit combinations. No database or network required — import into API routes or drive directly.

All paths are relative to `app/`.

## What it infers

| Input | What it derives |
|-------|----------------|
| `location` + `month` | Season (flips for southern hemisphere cities) |
| `place` + `activity` | Formality level (formal → business → smart_casual → casual → active) |
| `time` | Time of day (morning / afternoon / evening) — boosts dressier pieces for evening |
| `mood` | Free text — matched to style signals (bold, cozy, romantic, professional, minimal) |

## Run the test suite

```bash
node .claude/skills/outfit-suggester/driver.mjs
```

Expected: `5/5 tests passed`

## Ad-hoc suggestion (stdin)

Pass a JSON object with `context` and optionally `items` (defaults to a 20-piece sample wardrobe):

```bash
echo '{
  "context": {
    "location": "Dallas, TX",
    "place": "rooftop bar",
    "activity": "birthday dinner",
    "time": "8pm",
    "mood": "I want to feel glamorous but not overdressed"
  }
}' | node .claude/skills/outfit-suggester/driver.mjs --stdin
```

To test against a real wardrobe, include `"items": [...]` — each item needs at minimum `{ "itemType": "..." }`. `season`, `formalityLevel`, `color`, `tags` improve accuracy.

## Import into API routes

```js
import { suggestOutfit } from ".claude/skills/outfit-suggester/suggester.mjs";

const { context, outfits } = suggestOutfit(
  {
    location:  user.profile.country,
    place:     occasion.occasionType,
    activity:  occasion.description,
    time:      new Date().toLocaleTimeString(),
    mood:      req.body.mood,        // free text from user input
    month:     new Date().getMonth() + 1,
  },
  user.wardrobeItems                 // WardrobeItem[] from Prisma
);
// outfits[0] is the top suggestion
// outfits[0].pieces is the array of WardrobeItems to show
```

## Formality levels (reference)

| Place / activity keywords | Resolved formality |
|---------------------------|-------------------|
| gala, wedding, black tie, interview | `formal` |
| office, meeting, client, presentation | `business` |
| restaurant, dinner, date, brunch, bar | `smart_casual` |
| cafe, errands, park, shopping | `casual` |
| gym, workout, yoga, run, hike | `active` |

## Mood keywords (reference)

| Mood phrase | Boosts |
|-------------|--------|
| bold, statement, fierce | bright colors, prints |
| cozy, comfortable, soft | knits, sweaters, stretch |
| professional, polished, sharp | tailored, structured, button-up |
| romantic, feminine, dreamy | floral, wrap, silk, ruffle |
| minimal, clean, understated | neutrals, no prints |

## Gotchas

- `month` defaults to the current calendar month when omitted — results will vary by when you call it.
- Southern hemisphere flip applies to: Sydney, Melbourne, Auckland, Johannesburg, Cape Town, Buenos Aires, Santiago, Lima, Bogota, São Paulo. All other cities use Northern Hemisphere seasons.
- Items with no `season` set are treated as all-season — they appear in every context without penalty.
- Outerwear is only included in suggestions when the resolved season is `winter` or `fall`.
- Formality scoring uses relative distance — a casual item in a business context loses 2 points, not a hard exclude. An outfit can still surface with mismatched pieces if the wardrobe is sparse.
- The `active` formality bucket has no athletic items in the sample wardrobe, so it falls back to casual items. In a real wardrobe with leggings/sports bras this works correctly.
