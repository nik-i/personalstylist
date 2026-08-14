import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const brands = [
  { name: "Zara", websiteUrl: "https://www.zara.com" },
  { name: "COS", websiteUrl: "https://www.cos.com" },
  { name: "Everlane", websiteUrl: "https://www.everlane.com" },
  { name: "Mango", websiteUrl: "https://www.mango.com" },
  { name: "& Other Stories", websiteUrl: "https://www.stories.com" },
  { name: "Reiss", websiteUrl: "https://www.reiss.com" },
  { name: "Theory", websiteUrl: "https://www.theory.com" },
  { name: "Banana Republic", websiteUrl: "https://www.bananarepublic.com" },
  { name: "J.Crew", websiteUrl: "https://www.jcrew.com" },
  { name: "Sézane", websiteUrl: "https://www.sezane.com" },
  { name: "Self-Portrait", websiteUrl: "https://www.self-portrait-studio.com" },
  { name: "Reformation", websiteUrl: "https://www.thereformation.com" },
  { name: "Club Monaco", websiteUrl: "https://www.clubmonaco.com" },
  { name: "Ted Baker", websiteUrl: "https://www.tedbaker.com" },
  { name: "Karen Millen", websiteUrl: "https://www.karenmillen.com" },
  { name: "Lululemon", websiteUrl: "https://www.lululemon.com" },
  { name: "Gymshark", websiteUrl: "https://www.gymshark.com" },
  { name: "Alo Yoga", websiteUrl: "https://www.aloyoga.com" },
  { name: "Outdoor Voices", websiteUrl: "https://www.outdoorvoices.com" },
  { name: "Nike", websiteUrl: "https://www.nike.com" },
  { name: "Toteme", websiteUrl: "https://www.toteme-studio.com" },
  { name: "A.P.C.", websiteUrl: "https://www.apc.fr" },
  { name: "Vince", websiteUrl: "https://www.vince.com" },
  { name: "Rag & Bone", websiteUrl: "https://www.rag-bone.com" },
  { name: "Massimo Dutti", websiteUrl: "https://www.massimodutti.com" },
];

// Demo user for local grouping tests (no real auth needed)
const DEMO_USER_ID = process.env.MCP_USER_ID ?? "demo-user";

type GarmentSeed = {
  itemType: string;
  color: string;
  pattern: string;
  fabricType: string | null;
  formalityLevel: string;
  season: string;
  warmthLevel: string;
  category: string;
  subcategory: string;
  colorPrimary: string;
  colorSecondary: string | null;
  undertone: string;
  fabric: string;
  fit: string[];
  formality: string;
  seasonWeight: string;
  neckline: string | null;
  sleeveLength: string | null;
  rise: string | null;
  hemLength: string | null;
  status: string;
};

const sampleGarments: GarmentSeed[] = [
  {
    itemType: "blazer", color: "navy", pattern: "solid", fabricType: "wool", formalityLevel: "business", season: "all-season", warmthLevel: "mid",
    category: "outerwear", subcategory: "blazer", colorPrimary: "navy", colorSecondary: null,
    undertone: "cool", fabric: "wool", fit: ["tailored"], formality: "business",
    seasonWeight: "midweight", neckline: "collared", sleeveLength: "long", rise: null, hemLength: "hip", status: "classified",
  },
  {
    itemType: "camel coat", color: "camel", pattern: "solid", fabricType: "wool", formalityLevel: "smart-casual", season: "autumn", warmthLevel: "warm",
    category: "outerwear", subcategory: "overcoat", colorPrimary: "camel", colorSecondary: null,
    undertone: "warm", fabric: "wool", fit: ["relaxed"], formality: "smart_casual",
    seasonWeight: "heavy", neckline: "collared", sleeveLength: "long", rise: null, hemLength: "knee", status: "classified",
  },
  {
    itemType: "cream knit", color: "cream", pattern: "solid", fabricType: "knit", formalityLevel: "casual", season: "all-season", warmthLevel: "mid",
    category: "top", subcategory: "crew-neck knit", colorPrimary: "cream", colorSecondary: null,
    undertone: "warm", fabric: "knit", fit: ["relaxed"], formality: "casual",
    seasonWeight: "midweight", neckline: "crew", sleeveLength: "long", rise: null, hemLength: "hip", status: "classified",
  },
  {
    itemType: "straight-leg jeans", color: "denim", pattern: "solid", fabricType: "denim", formalityLevel: "casual", season: "all-season", warmthLevel: "mid",
    category: "bottom", subcategory: "straight-leg jeans", colorPrimary: "mid-blue", colorSecondary: null,
    undertone: "cool", fabric: "denim", fit: ["straight"], formality: "casual",
    seasonWeight: "midweight", neckline: null, sleeveLength: null, rise: "mid", hemLength: "ankle", status: "classified",
  },
  {
    itemType: "rust midi skirt", color: "rust", pattern: "solid", fabricType: null, formalityLevel: "smart-casual", season: "autumn", warmthLevel: "light",
    category: "bottom", subcategory: "midi skirt", colorPrimary: "rust", colorSecondary: null,
    undertone: "warm", fabric: "synthetic", fit: ["a_line", "flowy"], formality: "smart_casual",
    seasonWeight: "lightweight", neckline: null, sleeveLength: null, rise: "high", hemLength: "midi", status: "classified",
  },
  {
    itemType: "white linen shirt", color: "white", pattern: "solid", fabricType: "linen", formalityLevel: "smart-casual", season: "summer", warmthLevel: "light",
    category: "top", subcategory: "relaxed linen shirt", colorPrimary: "white", colorSecondary: null,
    undertone: "neutral", fabric: "linen", fit: ["relaxed"], formality: "smart_casual",
    seasonWeight: "lightweight", neckline: "collared", sleeveLength: "long", rise: null, hemLength: "hip", status: "classified",
  },
  {
    itemType: "black trousers", color: "black", pattern: "solid", fabricType: "synthetic", formalityLevel: "business", season: "all-season", warmthLevel: "mid",
    category: "bottom", subcategory: "tailored trousers", colorPrimary: "black", colorSecondary: null,
    undertone: "neutral", fabric: "synthetic", fit: ["tailored", "straight"], formality: "business",
    seasonWeight: "midweight", neckline: null, sleeveLength: null, rise: "mid", hemLength: "ankle", status: "classified",
  },
  {
    itemType: "silk blouse", color: "ivory", pattern: "solid", fabricType: "silk", formalityLevel: "business", season: "all-season", warmthLevel: "light",
    category: "top", subcategory: "silk blouse", colorPrimary: "ivory", colorSecondary: null,
    undertone: "warm", fabric: "silk_like", fit: ["relaxed"], formality: "business",
    seasonWeight: "lightweight", neckline: "v_neck", sleeveLength: "long", rise: null, hemLength: "hip", status: "classified",
  },
  {
    itemType: "striped t-shirt", color: "navy", pattern: "stripe", fabricType: "cotton", formalityLevel: "casual", season: "summer", warmthLevel: "light",
    category: "top", subcategory: "striped t-shirt", colorPrimary: "navy", colorSecondary: "white",
    undertone: "cool", fabric: "cotton", fit: ["relaxed"], formality: "casual",
    seasonWeight: "lightweight", neckline: "crew", sleeveLength: "short", rise: null, hemLength: "hip", status: "classified",
  },
  {
    itemType: "floral midi dress", color: "green", pattern: "floral", fabricType: null, formalityLevel: "smart-casual", season: "spring", warmthLevel: "light",
    category: "dress", subcategory: "midi dress", colorPrimary: "green", colorSecondary: "cream",
    undertone: "warm", fabric: "synthetic", fit: ["a_line", "flowy"], formality: "smart_casual",
    seasonWeight: "lightweight", neckline: "v_neck", sleeveLength: "short", rise: null, hemLength: "midi", status: "classified",
  },
];

async function main() {
  console.log("Seeding brands...");
  await prisma.brand.createMany({ data: brands, skipDuplicates: true });
  console.log(`Seeded ${brands.length} brands.`);

  // Seed demo wardrobe items only if a demo user exists
  const demoUser = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });
  if (!demoUser) {
    console.log(`No user with id="${DEMO_USER_ID}" — skipping garment seed.`);
    console.log('Create a user first, or set MCP_USER_ID to an existing user id.');
    return;
  }

  const existingCount = await prisma.wardrobeItem.count({ where: { userId: DEMO_USER_ID } });
  if (existingCount > 0) {
    console.log(`Demo user already has ${existingCount} items — skipping garment seed.`);
    return;
  }

  console.log("Seeding sample garments...");
  for (const g of sampleGarments) {
    await prisma.wardrobeItem.create({
      data: {
        userId: DEMO_USER_ID,
        itemType: g.itemType,
        color: g.color,
        pattern: g.pattern,
        fabricType: g.fabricType,
        formalityLevel: g.formalityLevel,
        season: g.season,
        warmthLevel: g.warmthLevel,
        source: "seed",
        status: g.status,
        category: g.category,
        subcategory: g.subcategory,
        colorPrimary: g.colorPrimary,
        colorSecondary: g.colorSecondary,
        undertone: g.undertone,
        fabric: g.fabric,
        fit: JSON.stringify(g.fit),
        formality: g.formality,
        seasonWeight: g.seasonWeight,
        neckline: g.neckline,
        sleeveLength: g.sleeveLength,
        rise: g.rise,
        hemLength: g.hemLength,
      },
    });
  }
  console.log(`Seeded ${sampleGarments.length} sample garments for user "${DEMO_USER_ID}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
