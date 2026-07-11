# Personal Stylist — ER Diagram

*Scope: onboarding + occasion-based outfit recommendations (current location, live weather)*
*Draft v2*

```mermaid
erDiagram

    USER {
        uuid id PK
        string email
        string name
        timestamp created_at
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK
        string coloring
        string body_shape
        string style_signals
        string highlight_prefs
        string downplay_prefs
        timestamp updated_at
    }

    SIZE {
        uuid id PK
        uuid user_id FK
        string category
        string size_value
        string region
    }

    BRAND {
        uuid id PK
        string name
        string website_url
        timestamp created_at
    }

    BRAND_PREFERENCE {
        uuid id PK
        uuid user_id FK
        uuid brand_id FK
        string wear_category
    }

    BEST_OUTFIT_PHOTO {
        uuid id PK
        uuid user_id FK
        string photo_url
        string extracted_style_signals
        timestamp uploaded_at
    }

    WARDROBE_ITEM {
        uuid id PK
        uuid user_id FK
        string item_type
        string color
        string pattern
        string fabric_type
        string formality_level
        string season
        string warmth_level
        json tags
        string image_url
        string source
        boolean is_active
        timestamp added_at
    }

    OCCASION {
        uuid id PK
        uuid user_id FK
        string occasion_type
        string description
        date event_date
        string formality_level
        timestamp created_at
    }

    OUTFIT_SUGGESTION {
        uuid id PK
        uuid user_id FK
        uuid occasion_id FK
        string vibe_note
        int version
        json weather_snapshot
        timestamp generated_at
    }

    OUTFIT_ITEM {
        uuid outfit_suggestion_id FK
        uuid wardrobe_item_id FK
    }

    OUTFIT_FEEDBACK {
        uuid id PK
        uuid outfit_suggestion_id FK
        string feedback_source
        text transcript
        boolean will_wear
        text free_text
        timestamp created_at
    }

    USER ||--|| USER_PROFILE : "has"
    USER ||--o{ SIZE : "has sizes for"
    USER ||--o{ BRAND_PREFERENCE : "prefers"
    BRAND ||--o{ BRAND_PREFERENCE : "appears in"
    USER ||--o{ BEST_OUTFIT_PHOTO : "uploads"
    USER ||--o{ WARDROBE_ITEM : "owns"
    USER ||--o{ OCCASION : "creates"
    OCCASION ||--o{ OUTFIT_SUGGESTION : "generates"
    OUTFIT_SUGGESTION ||--o{ OUTFIT_ITEM : "is made of"
    WARDROBE_ITEM ||--o{ OUTFIT_ITEM : "appears in"
    OUTFIT_SUGGESTION ||--o{ OUTFIT_FEEDBACK : "receives"
```

---

## Entity notes

| Entity | Purpose |
|---|---|
| `USER` | Core account only. Location read live from phone at recommendation time — nothing stored. |
| `USER_PROFILE` | Style signals extracted from best-outfit photos — coloring, body shape, highlight/downplay prefs. |
| `SIZE` | One row per wear category (tops, bottoms, dresses, shoes) per user. Region-aware for international sizing. |
| `BRAND` | Brands as their own entity — reusable across users. |
| `BRAND_PREFERENCE` | Junction: USER ↔ BRAND with wear_category (day-to-day, office, occasion, athletic, activewear). Multiple brands per category supported. |
| `BEST_OUTFIT_PHOTO` | Photos uploaded during onboarding. AI extracts style signals stored in USER_PROFILE. |
| `WARDROBE_ITEM` | Structured columns for stylist-critical attributes (formality_level, season, pattern, fabric_type, warmth_level) + flexible JSON tags. warmth_level (light / medium / warm / heavy) is the AI's primary signal for weather-based filtering. |
| `OCCASION` | What the user is dressing for — occasion_type, description, when (event_date), formality_level. No location stored. |
| `OUTFIT_SUGGESTION` | Outfit built from owned wardrobe items for the occasion. Versioned — each change request creates a new record. weather_snapshot (JSON: temp, conditions) stores the live weather at generation time so feedback is contextually meaningful. |
| `OUTFIT_ITEM` | Junction: which wardrobe items make up a given outfit suggestion. |
| `OUTFIT_FEEDBACK` | feedback_source (audio \| text), transcript only — audio transcribed in real-time, never stored. will_wear is the strongest positive signal and feeds future recommendations. |
