/**
 * Outfit suggester — pure logic, no DB or network required.
 *
 * Takes context (location, place, activity, time, mood) + a list of WardrobeItems
 * and returns a ranked list of outfit combinations with reasoning.
 *
 * Import this into API routes or call it from the driver for testing.
 */

// ── Formality inference ──────────────────────────────────────────────────────

const FORMALITY_KEYWORDS = {
  formal:       ["gala", "wedding", "black tie", "ceremony", "court", "funeral", "awards"],
  business:     ["office", "meeting", "conference", "client", "work", "presentation", "interview", "board"],
  smart_casual: ["restaurant", "dinner", "date", "brunch", "lunch", "gallery", "theatre", "theater", "bar", "drinks", "show"],
  casual:       ["cafe", "coffee", "shopping", "errands", "friends", "park", "picnic", "beach", "market", "outdoor", "museum"],
  active:       ["gym", "workout", "yoga", "run", "running", "hike", "hiking", "sport", "exercise", "pilates", "spin", "class"],
};

const FORMALITY_RANK = { formal: 5, business: 4, smart_casual: 3, casual: 2, active: 1 };

function inferFormality(place = "", activity = "") {
  const text = `${place} ${activity}`.toLowerCase();
  for (const [level, keywords] of Object.entries(FORMALITY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return level;
  }
  return "casual"; // default
}

// ── Season inference ─────────────────────────────────────────────────────────

// Northern hemisphere by default; coarse month → season
const MONTH_TO_SEASON = {
  12: "winter", 1: "winter", 2: "winter",
  3:  "spring", 4: "spring", 5: "spring",
  6:  "summer", 7: "summer", 8: "summer",
  9:  "fall",  10: "fall",  11: "fall",
};

// Southern hemisphere cities (add more as needed)
const SOUTHERN_HEMISPHERE = ["sydney", "melbourne", "auckland", "johannesburg", "cape town",
  "buenos aires", "santiago", "lima", "bogota", "sao paulo"];

function inferSeason(location = "", month = new Date().getMonth() + 1) {
  const loc = location.toLowerCase();
  const isSouthern = SOUTHERN_HEMISPHERE.some(c => loc.includes(c));
  const base = MONTH_TO_SEASON[month] ?? "spring";
  if (!isSouthern) return base;
  const flip = { winter: "summer", summer: "winter", spring: "fall", fall: "spring" };
  return flip[base];
}

// ── Time-of-day inference ────────────────────────────────────────────────────

function inferTimeOfDay(time = "") {
  const t = time.toLowerCase();
  if (t.includes("morning") || t.match(/^[5-9]am/) || t.match(/^1[01]am/)) return "morning";
  if (t.includes("evening") || t.includes("night") || t.match(/^[6-9]pm/) || t.match(/^1[01]pm/)) return "evening";
  if (t.includes("afternoon") || t.match(/^[12][0-9]pm/)) return "afternoon";
  return "day";
}

// ── Item classification ──────────────────────────────────────────────────────

const ITEM_TOPS      = ["top", "shirt", "blouse", "sweater", "knitwear", "turtleneck",
  "t-shirt", "tshirt", "tank", "camisole", "crop", "polo", "henley", "tunic", "bodysuit"];
const ITEM_BOTTOMS   = ["pants", "trousers", "jeans", "skirt", "shorts", "leggings",
  "culottes", "joggers", "chinos", "flares", "wide-leg"];
const ITEM_FULL_BODY = ["dress", "jumpsuit", "romper", "playsuit", "co-ord", "coord",
  "overalls", "dungarees"];
const ITEM_OUTERWEAR = ["coat", "jacket", "blazer", "puffer", "anorak", "trench",
  "overcoat", "peacoat", "windbreaker", "raincoat", "bomber", "parka", "cardigan"];
const ITEM_FOOTWEAR  = ["shoes", "boots", "sneakers", "heels", "sandals", "flats",
  "loafers", "mules", "oxfords", "pumps", "trainers"];

function classify(itemType = "") {
  const t = itemType.toLowerCase();
  if (ITEM_FULL_BODY.some(k => t.includes(k))) return "full_body";
  if (ITEM_TOPS.some(k => t.includes(k)))      return "top";
  if (ITEM_BOTTOMS.some(k => t.includes(k)))   return "bottom";
  if (ITEM_OUTERWEAR.some(k => t.includes(k))) return "outerwear";
  if (ITEM_FOOTWEAR.some(k => t.includes(k)))  return "footwear";
  return "accessory";
}

// ── Scoring ──────────────────────────────────────────────────────────────────

const SEASON_COMPAT = {
  winter: ["winter", "fall", "all-season", "year-round", null, undefined, ""],
  summer: ["summer", "spring", "all-season", "year-round", null, undefined, ""],
  spring: ["spring", "summer", "all-season", "year-round", null, undefined, ""],
  fall:   ["fall",   "winter", "all-season", "year-round", null, undefined, ""],
};

const FORMALITY_COMPAT = {
  // item formalityLevel → which outfit formality levels it suits
  formal:       ["formal"],
  business:     ["formal", "business"],
  smart_casual: ["business", "smart_casual"],
  casual:       ["smart_casual", "casual"],
  relaxed:      ["casual"],
  active:       ["active"],
  athletic:     ["active"],
};

function scoreItem(item, { season, formality, mood, timeOfDay }) {
  let score = 0;
  const reasons = [];

  // Season match
  const itemSeason = (item.season ?? "").toLowerCase();
  const compatSeasons = SEASON_COMPAT[season] ?? [];
  if (!itemSeason || itemSeason === "" || compatSeasons.includes(itemSeason)) {
    score += 2;
  } else {
    score -= 3; // season mismatch is a strong signal
    reasons.push(`season mismatch (item: ${itemSeason}, context: ${season})`);
  }

  // Formality match
  const itemFormality = (item.formalityLevel ?? "casual").toLowerCase();
  const compatFormalities = FORMALITY_COMPAT[itemFormality] ?? ["casual"];
  if (compatFormalities.includes(formality)) {
    score += 3;
  } else {
    const itemRank = FORMALITY_RANK[itemFormality] ?? 2;
    const ctxRank  = FORMALITY_RANK[formality] ?? 2;
    score -= Math.abs(itemRank - ctxRank);
    reasons.push(`formality mismatch (item: ${itemFormality}, context: ${formality})`);
  }

  // Mood signals (tags and itemType)
  if (mood) {
    const moodLower = mood.toLowerCase();
    const tags = parseTags(item.tags);
    const allText = [item.itemType, item.color, item.pattern, ...tags].join(" ").toLowerCase();

    // Bold/statement mood
    if (moodLower.match(/bold|statement|stand out|daring|fierce/)) {
      if (allText.match(/bright|bold|pattern|print|colorful|red|yellow|orange/)) score += 2;
    }
    // Cozy/comfortable mood
    if (moodLower.match(/cozy|comfort|relaxed|cosy|soft|easy/)) {
      if (allText.match(/knit|sweater|oversized|soft|stretch|fleece/)) score += 2;
    }
    // Professional/polished mood
    if (moodLower.match(/professional|polished|put together|sharp|serious/)) {
      if (allText.match(/tailored|structured|blazer|trouser|button|crisp/)) score += 2;
    }
    // Romantic/feminine mood
    if (moodLower.match(/romantic|feminine|pretty|soft|dreamy/)) {
      if (allText.match(/floral|lace|wrap|midi|flowy|ruffle|silk/)) score += 2;
    }
    // Minimal/clean mood
    if (moodLower.match(/minimal|clean|simple|understated|quiet/)) {
      if (!allText.match(/print|pattern|bold|bright/)) score += 1;
      if (allText.match(/neutral|white|black|beige|navy|grey|gray/)) score += 1;
    }
  }

  // Evening boost for dressier items
  if (timeOfDay === "evening") {
    const tags = parseTags(item.tags);
    const allText = [item.itemType, ...tags].join(" ").toLowerCase();
    if (allText.match(/silk|satin|velvet|sequin|evening|formal|elegant/)) score += 1;
  }

  return { score, reasons };
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

// ── Outfit builder ───────────────────────────────────────────────────────────

function buildOutfits(items, context) {
  const scored = items.map(item => ({
    ...item,
    _class: classify(item.itemType),
    _score: scoreItem(item, context).score,
  }));

  const byClass = (cls) =>
    scored.filter(i => i._class === cls).sort((a, b) => b._score - a._score);

  const tops      = byClass("top");
  const bottoms   = byClass("bottom");
  const fullBody  = byClass("full_body");
  const outerwear = byClass("outerwear");
  const footwear  = byClass("footwear");

  const outfits = [];
  const needsOuterwear = ["winter", "fall"].includes(context.season);

  // Path A: full-body piece (dress / jumpsuit)
  for (const fb of fullBody.slice(0, 2)) {
    const outfit = { pieces: [fb], score: fb._score };
    if (needsOuterwear && outerwear.length > 0) {
      outfit.pieces.push(outerwear[0]);
      outfit.score += outerwear[0]._score;
    }
    if (footwear.length > 0) {
      outfit.pieces.push(footwear[0]);
      outfit.score += footwear[0]._score;
    }
    outfits.push(outfit);
  }

  // Path B: top + bottom combinations
  for (const top of tops.slice(0, 3)) {
    for (const bottom of bottoms.slice(0, 3)) {
      const outfit = { pieces: [top, bottom], score: top._score + bottom._score };
      if (needsOuterwear && outerwear.length > 0) {
        outfit.pieces.push(outerwear[0]);
        outfit.score += outerwear[0]._score;
      }
      if (footwear.length > 0) {
        outfit.pieces.push(footwear[0]);
        outfit.score += footwear[0]._score;
      }
      outfits.push(outfit);
    }
  }

  return outfits.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   location: string,
 *   place: string,
 *   activity: string,
 *   time: string,
 *   mood: string,
 *   month?: number,
 * }} context
 * @param {Array<{itemType: string, season?: string, warmthLevel?: string,
 *                formalityLevel?: string, color?: string, pattern?: string,
 *                tags?: string, id?: string}>} wardrobeItems
 * @returns {{
 *   context: object,
 *   outfits: Array<{pieces: object[], score: number, summary: string}>,
 * }}
 */
export function suggestOutfit(context, wardrobeItems) {
  const season    = inferSeason(context.location, context.month);
  const formality = inferFormality(context.place, context.activity);
  const timeOfDay = inferTimeOfDay(context.time);

  const resolved = { season, formality, timeOfDay, mood: context.mood };

  const outfits = buildOutfits(wardrobeItems, resolved).map(outfit => ({
    pieces: outfit.pieces.map(p => ({
      id:            p.id,
      itemType:      p.itemType,
      color:         p.color,
      season:        p.season,
      formalityLevel: p.formalityLevel,
    })),
    score: outfit.score,
    summary: outfit.pieces.map(p => p.itemType).join(" + "),
  }));

  return { context: resolved, outfits };
}
