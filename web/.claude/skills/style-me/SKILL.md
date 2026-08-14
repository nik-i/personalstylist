---
name: style-me
description: Generate a personalized outfit suggestion from the user's wardrobe for a specific occasion. Use this skill whenever the user wants to know what to wear, asks for outfit help for an event, triggers "Style Me Now", or describes an upcoming occasion and needs styling guidance — even casually ("got a thing tonight", "what goes with this?"). Always collect occasion, date/time, indoor/outdoor context, and desired impression before generating — never skip straight to suggestions. Even if the user gives partial context upfront, use this skill to fill the gaps conversationally.
---

# Style Me Now

Delegate entirely to the **personal-stylist agent**. Do not run the outfit-suggester bash pipeline. Do not read wardrobe JSON files manually.

## How to invoke

Use the Agent tool with `subagent_type: "personal-stylist"`. Pass the user's request — including any occasion, timing, venue, and impression details they've already shared — as the prompt.

If the user hasn't provided enough context yet, collect it conversationally first (one question at a time, not a list), then invoke the agent once you have:

1. **Occasion** — what is it? (work, dinner, wedding, party, brunch, casual, or free text)
2. **When** — date and time of day
3. **Setting** — indoors, outdoors, or mix
4. **Impression** — the vibe they're going for (polished, relaxed, bold, understated…)

If the user has already given all four, skip straight to invoking the agent — don't re-confirm what they've already said.

## What the personal-stylist agent does

The agent will:
- Fetch the user's real wardrobe via `wardrobe_list_items`
- Check their style profile via `wardrobe_get_profile`
- Fetch actual weather if location is available via `get_weather`
- Apply color theory, formality rules, and proportion guidelines
- Return a styled outfit recommendation with reasons for each piece

Your role here is only to collect context if needed, then hand off. The agent handles everything else.
