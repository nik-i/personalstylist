# Epic B — Style Me Now
**Product:** The Wardrobe Collective
**Epic:** EPIC B — Style Me Now
**Scope:** Home → Maya conversation flow → Weather fetch → Outfit generation → Outfit display
**Format:** 3 C's + INVEST
**Status:** Draft v1

---

## Flow Map

```
Home Screen → [Style Me Now]
  └── B1: Enter Style Me Flow (Maya greeting)
        └── B2: Maya Asks — What's the Occasion?
              └── B3: Maya Asks — When Is It?
                    └── B4: Maya Asks — Where Is It?
                          └── B5: Maya Asks — Indoor or Outdoor?
                                └── B6: Loading State (Thinking)
                                      ├── BA1: Fetch Weather Data        [Agentic]
                                      ├── BA2: Generate Outfit from Wardrobe [Agentic]
                                      └── B7: Display Suggested Outfit
```

---

## App / UI Stories

---

### Story B1: Navigate to Style Me from Home Screen

**Title:** Navigate to Style Me from Home Screen

**Description:** As a user, I want to tap "Style Me Now" on the Home Screen and be taken into the styling flow, so that I can get an outfit suggestion for a specific occasion.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Tapping **Style Me Now** on the Home Screen navigates the user into the Style Me flow.
2. Maya (the app mascot) appears on screen with a greeting and the first question.
3. A `<` button is present in the top-left, returning the user to the Home Screen.
4. If the user has no wardrobe items saved, Maya communicates this and prompts the user to add items first before proceeding.

---

### Story B2: Maya Asks — What's the Occasion?

**Title:** Maya Asks the User for Their Occasion

**Description:** As a user, I want Maya to ask me what the occasion is, so that the outfit suggestion is relevant to where I'm going.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Maya displays the question "What's the occasion?" in a conversational UI format.
2. The user can respond via pre-set quick-reply options (e.g. Work, Casual, Dinner, Wedding, Party, Other) and/or a free-text input field.
3. Selecting or submitting an answer stores the occasion and advances to the next question.
4. The user can type a custom occasion if none of the options fit.
5. The user cannot advance without answering this question — it is required.
6. The previously given answer is visible in the conversation thread above each new question so the user can see their responses in context.

---

### Story B3: Maya Asks — When Is It?

**Title:** Maya Asks the User for the Date and Time

**Description:** As a user, I want Maya to ask me when the occasion is, so that the outfit accounts for the right time of day and season.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. After the occasion is answered, Maya asks "When is it?"
2. The user can pick a date and time via a date-time picker or respond in natural language (e.g. "Tonight at 8" or "This Saturday afternoon").
3. The selected or interpreted date and time are displayed back to the user in the conversation thread for confirmation.
4. The date/time is stored and passed forward to the weather fetch (BA1) and outfit generation (BA2).
5. If the user selects a date in the past, Maya flags it with a gentle prompt (e.g. "That date has passed — did you mean a future date?").
6. The user cannot advance without answering — this field is required for weather lookup.

---

### Story B4: Maya Asks — Where Is It?

**Title:** Maya Asks the User for the Location

**Description:** As a user, I want Maya to ask me where the occasion is taking place, so that the weather at that location can be factored into the outfit.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. After the date/time is answered, Maya asks "Where is it?"
2. The user can type a city, venue, or postcode, with autocomplete suggestions appearing as they type.
3. The resolved location is displayed back in the conversation thread for the user to confirm.
4. The location is stored and passed to the weather fetch (BA1).
5. If location access is enabled on the device, a "Use my current location" shortcut is offered.
6. If the user skips or cannot provide a location, the outfit is generated without weather context and a note is shown (e.g. "No location provided — weather won't be factored in").

---

### Story B5: Maya Asks — Indoor or Outdoor?

**Title:** Maya Asks Whether the Occasion Is Indoor or Outdoor

**Description:** As a user, I want to tell Maya whether the occasion is inside or outside, so that the outfit accounts for exposure to weather conditions.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. After location is answered, Maya asks "Will this be indoors or outdoors?"
2. The user is presented with three clear options: **Indoors**, **Outdoors**, **Mix of both**.
3. The selected answer is shown in the conversation thread.
4. The answer is passed to the outfit generation agent (BA2) to weight weather sensitivity accordingly.
5. For **Indoors**, weather data is used for travel context only (e.g. coat to get there); for **Outdoors** or **Mix**, weather is weighted more heavily in outfit selection.
6. This question is required before the outfit is generated.

---

### Story B6: Loading State While Outfit Is Being Generated

**Title:** Show a Thinking State While Maya Generates the Outfit

**Description:** As a user, I want to see that Maya is working on my outfit after I've answered all the questions, so that I know the app is processing and hasn't stalled.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. Once all four questions are answered, the UI transitions to a loading/thinking state without requiring the user to tap a "Generate" button.
2. Maya displays a contextual loading message (e.g. "Let me check your wardrobe and the weather…").
3. A visual animation (e.g. thinking indicator, progress dots) is shown during generation.
4. If generation takes longer than 10 seconds, an additional message is shown to reassure the user (e.g. "Almost there…").
5. The user cannot re-edit their answers during this state without explicitly tapping a "Start over" option.
6. If generation fails, an error message is shown with the option to try again without re-entering answers.

---

### Story B7: Display the Suggested Outfit

**Title:** Show the Generated Outfit to the User

**Description:** As a user, I want to see the outfit Maya has put together for me, so that I can decide whether to wear it and understand why each piece was chosen.

**Design:** *(link to design file)*

**Acceptance Criteria:**
1. The results screen shows the full suggested outfit as a collection of item cards (images of the individual pieces from the user's wardrobe).
2. Each item card shows the garment image, category (e.g. Top, Trousers, Shoes), and a brief reason for inclusion (e.g. "Lightweight — good for warm weather").
3. Maya provides a short summary at the top explaining the overall outfit choice (e.g. "A smart-casual look suited for an outdoor dinner on a warm evening").
4. The weather context used is shown (e.g. "Based on 22°C and clear skies in London on Saturday").
5. A `<` button is present in the top-left, returning the user to the Home Screen.
6. The user can tap "Try Again" to restart the flow and get a different suggestion.

---

## Agentic Stories

---

### Story BA1: Fetch Weather Data for Given Location and Date

**Title:** Retrieve Weather Forecast for Occasion Location and Time

**Description:** As the system, I need to fetch accurate weather data for the user's specified location and date/time, so that the outfit generation agent has real environmental context to work with.

**Design:** N/A — backend capability

**Acceptance Criteria:**
1. When location and date/time are confirmed, the system calls a weather API with the resolved location (lat/long or city) and the occasion date/time.
2. The API response returns at minimum: temperature, precipitation probability, wind speed, and a general condition label (e.g. sunny, cloudy, rainy).
3. If the occasion date is more than 10 days out (beyond reliable forecast range), the system falls back to historical average data for that location and month, and flags this to the user (e.g. "Forecast not available yet — using seasonal averages for that area").
4. If the weather fetch fails (API error, network issue), the outfit generation proceeds without weather context and the user is informed.
5. Weather data is not stored permanently — it is fetched per request and used only within the active styling session.
6. The agent passes the structured weather payload (temp, condition, precipitation, wind) to the outfit generation agent (BA2).

---

### Story BA2: AI Agent Selects Outfit from Wardrobe Using All Context

**Title:** AI Agent Selects Outfit from User's Wardrobe Based on All Context

**Description:** As the system, I need an AI agent to analyse the user's wardrobe alongside the occasion, timing, location, indoor/outdoor setting, and weather data, and return a coherent outfit recommendation.

**Design:** N/A — backend/agentic capability

**Acceptance Criteria:**
1. The agent receives the full context payload: occasion type, date/time, location, indoor/outdoor setting, and weather data (from BA1).
2. The agent queries the user's saved wardrobe items and selects pieces appropriate to the occasion, weather, and setting.
3. The agent selects a complete outfit — at minimum a top, bottom (or dress/jumpsuit), and shoes; outerwear is included when weather or setting warrants it.
4. Each selected item is accompanied by a reason string (1 sentence) explaining why it was chosen.
5. The agent applies the user's stored style preferences and highlight/downplay settings when selecting cuts and silhouettes.
6. The agent must not suggest items the user does not own — outfit is built exclusively from the user's saved wardrobe.
7. If the wardrobe does not have sufficient items to build a complete outfit for the occasion, the agent returns a partial outfit and flags what's missing (e.g. "No formal shoes found in your wardrobe").
8. The agent returns a structured response: list of item IDs, per-item reason strings, and an overall outfit summary sentence.
9. Response time target: outfit generation completes within 8 seconds under normal conditions.
10. The agent is stateless per request — it does not retain conversation context between separate Style Me sessions.

---

## Story Summary

| # | Title | Type | Priority |
|---|-------|------|----------|
| B1 | Navigate to Style Me from Home Screen | App / UI | P0 |
| B2 | Maya Asks — What's the Occasion? | App / UI | P0 |
| B3 | Maya Asks — When Is It? | App / UI | P0 |
| B4 | Maya Asks — Where Is It? | App / UI | P0 |
| B5 | Maya Asks — Indoor or Outdoor? | App / UI | P0 |
| B6 | Loading State While Outfit Is Being Generated | App / UI | P0 |
| B7 | Display the Suggested Outfit | App / UI | P0 |
| BA1 | Fetch Weather Data for Given Location and Date | Agentic | P0 |
| BA2 | AI Agent Selects Outfit from Wardrobe Using All Context | Agentic | P0 |

**Suggested build order:** BA1 → BA2 (spike first to validate feasibility) → B1 → B2 → B3 → B4 → B5 → B6 → B7
