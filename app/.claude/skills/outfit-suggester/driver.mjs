/**
 * Outfit suggester driver — run directly to test scenarios, or pipe a JSON
 * request via stdin for ad-hoc suggestions.
 *
 * Test suite:
 *   node .claude/skills/outfit-suggester/driver.mjs
 *
 * Ad-hoc (stdin):
 *   echo '{"context":{"location":"Dallas, TX","place":"office","activity":"client meeting","time":"9am","mood":"professional but relaxed"},"items":[...]}' \
 *     | node .claude/skills/outfit-suggester/driver.mjs --stdin
 */

import { suggestOutfit } from "./suggester.mjs";
import { createInterface } from "readline";

// ── Sample wardrobe ──────────────────────────────────────────────────────────
// Represents a typical mixed wardrobe to test against

const SAMPLE_WARDROBE = [
  { id: "1",  itemType: "silk blouse",       color: "cream",  season: "all-season",  formalityLevel: "smart_casual", tags: '["silk","elegant"]' },
  { id: "2",  itemType: "white shirt",        color: "white",  season: "all-season",  formalityLevel: "business",     tags: '["crisp","button"]' },
  { id: "3",  itemType: "cashmere sweater",   color: "camel",  season: "winter",      formalityLevel: "smart_casual", tags: '["knit","cozy","soft"]' },
  { id: "4",  itemType: "graphic tshirt",     color: "black",  season: "summer",      formalityLevel: "casual",       tags: '["relaxed"]' },
  { id: "5",  itemType: "tank top",           color: "white",  season: "summer",      formalityLevel: "casual",       tags: '[]' },
  { id: "6",  itemType: "straight-leg jeans", color: "indigo", season: "all-season",  formalityLevel: "casual",       tags: '["denim"]' },
  { id: "7",  itemType: "tailored trousers",  color: "black",  season: "all-season",  formalityLevel: "business",     tags: '["tailored","structured"]' },
  { id: "8",  itemType: "midi skirt",         color: "rust",   season: "fall",        formalityLevel: "smart_casual", tags: '["flowy","floral"]' },
  { id: "9",  itemType: "linen shorts",       color: "beige",  season: "summer",      formalityLevel: "casual",       tags: '["linen","lightweight"]' },
  { id: "10", itemType: "midi dress",         color: "navy",   season: "all-season",  formalityLevel: "smart_casual", tags: '["elegant","wrap"]' },
  { id: "11", itemType: "floral wrap dress",  color: "floral", season: "spring",      formalityLevel: "smart_casual", tags: '["floral","romantic","feminine"]' },
  { id: "12", itemType: "velvet jumpsuit",    color: "emerald",season: "winter",      formalityLevel: "formal",       tags: '["velvet","evening","statement"]' },
  { id: "13", itemType: "wool coat",          color: "camel",  season: "winter",      formalityLevel: "smart_casual", tags: '["warm","structured"]' },
  { id: "14", itemType: "trench coat",        color: "beige",  season: "fall",        formalityLevel: "business",     tags: '["classic"]' },
  { id: "15", itemType: "denim jacket",       color: "blue",   season: "spring",      formalityLevel: "casual",       tags: '["casual"]' },
  { id: "16", itemType: "blazer",             color: "ivory",  season: "all-season",  formalityLevel: "business",     tags: '["tailored","structured"]' },
  { id: "17", itemType: "ankle boots",        color: "tan",    season: "fall",        formalityLevel: "smart_casual", tags: '[]' },
  { id: "18", itemType: "white sneakers",     color: "white",  season: "all-season",  formalityLevel: "casual",       tags: '[]' },
  { id: "19", itemType: "heels",              color: "nude",   season: "all-season",  formalityLevel: "formal",       tags: '["evening"]' },
  { id: "20", itemType: "loafers",            color: "black",  season: "all-season",  formalityLevel: "business",     tags: '[]' },
];

// ── Test cases ───────────────────────────────────────────────────────────────

const TESTS = [
  {
    name: "Office meeting, Dallas July, professional mood",
    context: {
      location: "Dallas, TX",
      place: "office",
      activity: "client meeting",
      time: "9am",
      mood: "professional but relaxed",
      month: 7,
    },
    expect: {
      formality: "business",
      season: "summer",
      minOutfits: 1,
    },
  },
  {
    name: "Dinner date, NYC December, romantic mood",
    context: {
      location: "New York, NY",
      place: "restaurant",
      activity: "dinner date",
      time: "7pm",
      mood: "romantic and feminine",
      month: 12,
    },
    expect: {
      formality: "smart_casual",
      season: "winter",
      minOutfits: 1,
    },
  },
  {
    name: "Yoga class, London March, cozy mood",
    context: {
      location: "London",
      place: "gym",
      activity: "yoga class",
      time: "morning",
      mood: "cozy and comfortable",
      month: 3,
    },
    expect: {
      formality: "active",
      season: "spring",
      minOutfits: 0, // wardrobe has no athletic wear — should return empty gracefully
    },
  },
  {
    name: "Weekend brunch, Sydney January, bold mood",
    context: {
      location: "Sydney",
      place: "cafe",
      activity: "brunch with friends",
      time: "11am",
      mood: "feeling bold and colorful",
      month: 1,
    },
    expect: {
      formality: "smart_casual", // brunch maps to smart_casual, not casual
      season: "summer", // southern hemisphere flip
      minOutfits: 1,
    },
  },
  {
    name: "Gallery opening, Paris October, minimal mood",
    context: {
      location: "Paris",
      place: "gallery",
      activity: "art opening",
      time: "evening",
      mood: "minimal and understated",
      month: 10,
    },
    expect: {
      formality: "smart_casual",
      season: "fall",
      minOutfits: 1,
    },
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────

function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    const result = suggestOutfit(test.context, SAMPLE_WARDROBE);

    const formalityOk = result.context.formality === test.expect.formality;
    const seasonOk    = result.context.season    === test.expect.season;
    const outfitsOk   = result.outfits.length    >= test.expect.minOutfits;
    const ok = formalityOk && seasonOk && outfitsOk;

    if (ok) {
      passed++;
      console.log(`  PASS  ${test.name}`);
    } else {
      failed++;
      console.log(`  FAIL  ${test.name}`);
      if (!formalityOk) console.log(`        formality: expected ${test.expect.formality}, got ${result.context.formality}`);
      if (!seasonOk)    console.log(`        season:    expected ${test.expect.season}, got ${result.context.season}`);
      if (!outfitsOk)   console.log(`        outfits:   expected ≥${test.expect.minOutfits}, got ${result.outfits.length}`);
    }

    if (result.outfits.length > 0) {
      console.log(`        → Top suggestion: ${result.outfits[0].summary}`);
    } else {
      console.log(`        → No compatible outfit found in wardrobe`);
    }
  }

  console.log(`\n${passed}/${passed + failed} tests passed`);
  if (failed > 0) process.exit(1);
}

// ── Stdin mode ───────────────────────────────────────────────────────────────

async function runStdin() {
  const rl = createInterface({ input: process.stdin });
  let raw = "";
  for await (const line of rl) raw += line;
  const { context, items } = JSON.parse(raw);
  const result = suggestOutfit(context, items ?? SAMPLE_WARDROBE);
  console.log(JSON.stringify(result, null, 2));
}

// ── Entry point ──────────────────────────────────────────────────────────────

if (process.argv.includes("--stdin")) {
  runStdin().catch(e => {
    console.error("Invalid JSON on stdin:", e.message);
    process.exit(1);
  });
} else {
  console.log("Running outfit suggester test suite…\n");
  runTests();
}
