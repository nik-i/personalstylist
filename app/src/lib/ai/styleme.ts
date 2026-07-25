// Pure-logic outfit suggestion engine — TypeScript port of the outfit-suggester skill.
// No DB or network calls; import into API routes and pass wardrobe items directly.

export type StyleMeItem = {
  id: string;
  itemType: string;
  color?: string | null;
  pattern?: string | null;
  formalityLevel?: string | null;
  season?: string | null;
  warmthLevel?: string | null;
  tags: string[];
  imageUrl?: string | null;
};

export type StyleMeContext = {
  location: string;
  place: string;
  activity: string;
  time: string;
  mood: string;
  month: number;
};

export type StyleMeOutfitPiece = {
  id: string;
  itemType: string;
  color?: string | null;
  formalityLevel?: string | null;
  season?: string | null;
  imageUrl?: string | null;
  reason: string;
};

export type StyleMeOutfit = {
  pieces: StyleMeOutfitPiece[];
  score: number;
  summary: string;
};

export type StyleMeResult = {
  context: { season: string; formality: string; timeOfDay: string; mood: string };
  outfits: StyleMeOutfit[];
};

// ── Occasion context mapping ──────────────────────────────────────────────────

const OCCASION_MAP: Record<string, { place: string; activity: string }> = {
  work:    { place: "office",      activity: "client meeting"     },
  dinner:  { place: "restaurant",  activity: "dinner date"        },
  wedding: { place: "wedding",     activity: "wedding ceremony"   },
  party:   { place: "bar",         activity: "birthday party"     },
  brunch:  { place: "cafe",        activity: "brunch with friends" },
  casual:  { place: "friends",     activity: "casual outing"      },
};

export function buildContext(
  occasion: string,
  when: { preset?: string; date?: string; time?: string },
  indoorOutdoor: "indoors" | "outdoors" | "mix",
): StyleMeContext {
  const mapped = OCCASION_MAP[occasion] ?? { place: occasion, activity: occasion };

  let month = new Date().getMonth() + 1;
  let time = "afternoon";

  if (when.preset === "tonight") time = "evening";
  if (when.date) {
    const d = new Date(when.date);
    if (!isNaN(d.getTime())) month = d.getMonth() + 1;
  }
  if (when.time) time = when.time;

  const outdoorPrefix =
    indoorOutdoor === "outdoors" ? "weather-appropriate and practical, " :
    indoorOutdoor === "mix"      ? "practical for indoor and outdoor, " : "";

  return {
    location: "",
    place:    mapped.place,
    activity: mapped.activity,
    time,
    mood:     `${outdoorPrefix}${occasion} occasion`,
    month,
  };
}

// ── Formality inference ───────────────────────────────────────────────────────

const FORMALITY_KEYWORDS: Record<string, string[]> = {
  formal:       ["gala", "wedding", "black tie", "ceremony", "court", "funeral", "awards"],
  business:     ["office", "meeting", "conference", "client", "work", "presentation", "interview", "board"],
  smart_casual: ["restaurant", "dinner", "date", "brunch", "lunch", "gallery", "theatre", "theater", "bar", "drinks"],
  casual:       ["cafe", "coffee", "shopping", "errands", "friends", "park", "picnic", "beach", "market", "museum"],
  active:       ["gym", "workout", "yoga", "run", "hike", "sport", "exercise", "pilates", "spin"],
};

const FORMALITY_RANK: Record<string, number> = {
  formal: 5, business: 4, smart_casual: 3, "smart-casual": 3, casual: 2, relaxed: 2, active: 1,
};

function inferFormality(place: string, activity: string): string {
  const text = `${place} ${activity}`.toLowerCase();
  for (const [level, keywords] of Object.entries(FORMALITY_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) return level;
  }
  return "casual";
}

// ── Season inference ──────────────────────────────────────────────────────────

const MONTH_TO_SEASON: Record<number, string> = {
  12: "winter", 1: "winter", 2: "winter",
  3: "spring",  4: "spring", 5: "spring",
  6: "summer",  7: "summer", 8: "summer",
  9: "fall",   10: "fall",  11: "fall",
};

const SOUTHERN_CITIES = ["sydney", "melbourne", "auckland", "johannesburg", "cape town",
  "buenos aires", "santiago", "lima", "bogota", "sao paulo"];

function inferSeason(location: string, month: number): string {
  const loc = location.toLowerCase();
  const isSouthern = SOUTHERN_CITIES.some((c) => loc.includes(c));
  const base = MONTH_TO_SEASON[month] ?? "spring";
  if (!isSouthern) return base;
  const flip: Record<string, string> = { winter: "summer", summer: "winter", spring: "fall", fall: "spring" };
  return flip[base];
}

// ── Time of day inference ─────────────────────────────────────────────────────

function inferTimeOfDay(time: string): string {
  const t = time.toLowerCase();
  if (t.includes("morning") || /^[5-9]am/.test(t) || /^1[01]am/.test(t)) return "morning";
  if (t.includes("evening") || t.includes("night") || /^[6-9]pm/.test(t)) return "evening";
  if (t.includes("afternoon") || /^[12][0-9]pm/.test(t)) return "afternoon";
  return "day";
}

// ── Item classification ───────────────────────────────────────────────────────

const TOPS      = ["top", "shirt", "blouse", "sweater", "knitwear", "turtleneck", "t-shirt",
                   "tshirt", "tank", "camisole", "crop", "polo", "tunic", "bodysuit"];
const BOTTOMS   = ["pants", "trousers", "jeans", "skirt", "shorts", "leggings",
                   "culottes", "joggers", "chinos", "flares"];
const FULL_BODY = ["dress", "jumpsuit", "romper", "playsuit", "co-ord", "overalls", "dungarees",
                   "gown", "kaftan", "sari", "suit set"];
const OUTERWEAR = ["coat", "jacket", "blazer", "puffer", "anorak", "trench", "overcoat",
                   "peacoat", "windbreaker", "raincoat", "bomber", "parka", "cardigan"];
const FOOTWEAR  = ["shoes", "boots", "sneakers", "heels", "sandals", "flats", "loafers",
                   "mules", "oxfords", "pumps", "trainers"];

function classify(itemType: string): string {
  const t = itemType.toLowerCase();
  if (FULL_BODY.some((k)  => t.includes(k))) return "full_body";
  if (TOPS.some((k)       => t.includes(k))) return "top";
  if (BOTTOMS.some((k)    => t.includes(k))) return "bottom";
  if (OUTERWEAR.some((k)  => t.includes(k))) return "outerwear";
  if (FOOTWEAR.some((k)   => t.includes(k))) return "footwear";
  return "accessory";
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const SEASON_COMPAT: Record<string, (string | null | undefined)[]> = {
  winter: ["winter", "fall",   "all-season", "year-round", null, undefined, ""],
  summer: ["summer", "spring", "all-season", "year-round", null, undefined, ""],
  spring: ["spring", "summer", "all-season", "year-round", null, undefined, ""],
  fall:   ["fall",   "winter", "all-season", "year-round", null, undefined, ""],
};

// When an item has no formalityLevel, infer from item type rather than defaulting to "casual".
// Dresses/jumpsuits skew smart-casual; blazers/structured jackets skew business.
function defaultFormality(itemType: string): string {
  const t = itemType.toLowerCase();
  if (FULL_BODY.some((k) => t.includes(k))) return "smart_casual";
  if (/blazer|structured jacket|tailored jacket/.test(t)) return "business";
  return "casual";
}

function scoreItem(
  item: StyleMeItem,
  ctx: { season: string; formality: string; timeOfDay: string; mood: string },
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Season
  const itemSeason = (item.season ?? "").toLowerCase();
  const compatSeasons = SEASON_COMPAT[ctx.season] ?? [];
  if (!itemSeason || compatSeasons.includes(itemSeason)) {
    score += 2;
    reasons.push(`suits the ${ctx.season} season`);
  } else {
    score -= 3;
  }

  // Formality — graded scoring: exact match = +4, 1 rank apart = +2, 2 apart = 0, 3 apart = -2, 4 apart = -4.
  // This replaces the old binary compat table so occasion differences actually affect the ranking.
  const rawFormality = (item.formalityLevel ?? "").toLowerCase() || defaultFormality(item.itemType);
  const itemRank = FORMALITY_RANK[rawFormality] ?? FORMALITY_RANK["casual"];
  const ctxRank  = FORMALITY_RANK[ctx.formality] ?? FORMALITY_RANK["casual"];
  const rankDiff = Math.abs(itemRank - ctxRank);
  const formalityScore = Math.max(-4, 4 - rankDiff * 2);
  score += formalityScore;
  if (formalityScore >= 4) reasons.push("perfect formality for the occasion");
  else if (formalityScore >= 2) reasons.push("right formality for the occasion");
  else if (formalityScore < 0) reasons.push("slightly off-formality but works with styling");

  // Structural bonus: full-body pieces (dresses, jumpsuits) are inherently more occasion-appropriate
  // for formal and smart-casual events, even when not explicitly tagged as formal.
  const cls = classify(item.itemType);
  if (cls === "full_body") {
    if (ctx.formality === "formal")       { score += 5; reasons.unshift("elegant one-piece for a formal occasion"); }
    else if (ctx.formality === "smart_casual") { score += 7; reasons.unshift("polished one-piece look for the occasion"); }
  }

  // Tag/text matching for occasion keywords
  const allText = [item.itemType, item.color, item.pattern, ...item.tags].join(" ").toLowerCase();
  if (ctx.formality === "formal"       && /gown|formal|wedding|evening|elegant|silk|satin|lace|velvet/.test(allText)) { score += 3; reasons.unshift("made for this occasion"); }
  if (ctx.formality === "business"     && /blazer|tailored|structured|button|oxford|formal shirt/.test(allText))       { score += 2; reasons.unshift("sharp and office-ready"); }
  if (ctx.formality === "smart_casual" && /midi|wrap|knit|linen|chic/.test(allText))                                  { score += 1; reasons.unshift("great smart-casual choice"); }
  if (ctx.formality === "casual"       && /denim|cotton|jersey|casual|relaxed|comfy/.test(allText))                   { score += 1; reasons.unshift("perfectly casual"); }
  if (ctx.formality === "active"       && /sport|gym|stretch|athletic|legging|yoga/.test(allText))                    { score += 2; reasons.unshift("built for movement"); }

  // Mood signals
  if (ctx.mood) {
    const moodLower = ctx.mood.toLowerCase();

    // User impression/vibe signals
    if (/bold|statement|fierce/.test(moodLower) && /bright|bold|print|colorful|red|yellow/.test(allText)) { score += 2; reasons.push("bold choice for the mood"); }
    if (/cozy|comfort|soft/.test(moodLower) && /knit|sweater|soft|stretch/.test(allText)) { score += 2; reasons.push("comfortably cozy"); }
    if (/professional|polished|sharp/.test(moodLower) && /tailored|structured|blazer|button/.test(allText)) { score += 2; reasons.push("polished and professional"); }
    if (/romantic|feminine|dreamy/.test(moodLower) && /floral|lace|wrap|midi|silk|ruffle/.test(allText)) { score += 2; reasons.push("romantic and elegant"); }
    if (/minimal|clean|understated/.test(moodLower) && !/print|pattern|bold/.test(allText)) { score += 1; reasons.push("clean and minimal"); }

    // Activity differentiation — same formality tier, different vibe.
    // Party/night out: favour bold colours and statement pieces; penalise safe neutrals on full-body items.
    if (/party|bar|club|birthday|night out|celebrate/.test(moodLower)) {
      if (/yellow|red|orange|pink|cobalt|sequin|metallic|pattern|print|bold|bright/.test(allText)) { score += 3; reasons.unshift("perfect party energy"); }
      else if (/\bblack\b/.test(allText)) { score += 2; reasons.unshift("classic party-ready"); }
      if (cls === "full_body" && /\bcream\b|\bivory\b|\bnude\b|\bbeige\b/.test(allText)) { score -= 2; }
    }

    // Dinner/date: favour silhouettes and fabrics that read as considered and put-together.
    if (/dinner|date|restaurant|romantic/.test(moodLower)) {
      if (/wrap|silk|midi|satin|velvet|lace|drape|elegant/.test(allText)) { score += 2; reasons.unshift("dinner-ready elegance"); }
    }

    // Brunch/casual daytime: favour light, textured, effortless pieces.
    if (/brunch|morning|picnic|weekend|day out/.test(moodLower)) {
      if (/floral|cotton|linen|light|pastel|stripe|print/.test(allText)) { score += 1; reasons.unshift("great brunch pick"); }
    }
  }

  // Evening boost
  if (ctx.timeOfDay === "evening") {
    if (/silk|satin|velvet|sequin|evening|formal|elegant/.test(allText)) { score += 1; reasons.push("elevated for the evening"); }
  }

  const reason = reasons.length > 0 ? reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) : "Good match for the occasion";
  return { score, reason };
}

// ── Outfit builder ────────────────────────────────────────────────────────────

function buildOutfits(items: StyleMeItem[], ctx: { season: string; formality: string; timeOfDay: string; mood: string }): StyleMeOutfit[] {
  const scored = items.map((item) => {
    const { score, reason } = scoreItem(item, ctx);
    return { ...item, _class: classify(item.itemType), _score: score, _reason: reason };
  });

  const byClass = (cls: string) => scored.filter((i) => i._class === cls).sort((a, b) => b._score - a._score);

  const tops      = byClass("top");
  const bottoms   = byClass("bottom");
  const fullBody  = byClass("full_body");
  const outerwear = byClass("outerwear");
  const footwear  = byClass("footwear");

  const needsOuterwear = ["winter", "fall"].includes(ctx.season);
  const outfits: { pieces: typeof scored; score: number }[] = [];

  const makePiece = (i: typeof scored[0]): StyleMeOutfitPiece => ({
    id:            i.id,
    itemType:      i.itemType,
    color:         i.color,
    formalityLevel: i.formalityLevel,
    season:        i.season,
    imageUrl:      i.imageUrl,
    reason:        i._reason,
  });

  // Path A: full-body piece
  for (const fb of fullBody.slice(0, 2)) {
    const pieces = [fb];
    let score = fb._score;
    if (needsOuterwear && outerwear.length > 0) { pieces.push(outerwear[0]); score += outerwear[0]._score; }
    if (footwear.length > 0) { pieces.push(footwear[0]); score += footwear[0]._score; }
    outfits.push({ pieces, score });
  }

  // Path B: top + bottom
  for (const top of tops.slice(0, 3)) {
    for (const bottom of bottoms.slice(0, 3)) {
      const pieces = [top, bottom];
      let score = top._score + bottom._score;
      if (needsOuterwear && outerwear.length > 0) { pieces.push(outerwear[0]); score += outerwear[0]._score; }
      if (footwear.length > 0) { pieces.push(footwear[0]); score += footwear[0]._score; }
      outfits.push({ pieces, score });
    }
  }

  return outfits
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o) => ({
      pieces: o.pieces.map(makePiece),
      score: o.score,
      summary: o.pieces.map((p) => p.itemType).join(" + "),
    }));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function suggestOutfit(ctx: StyleMeContext, items: StyleMeItem[]): StyleMeResult {
  const season    = inferSeason(ctx.location, ctx.month);
  const formality = inferFormality(ctx.place, ctx.activity);
  const timeOfDay = inferTimeOfDay(ctx.time);
  const resolved  = { season, formality, timeOfDay, mood: ctx.mood };

  return { context: resolved, outfits: buildOutfits(items, resolved) };
}
