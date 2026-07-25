// Run from app/ directory: node scripts/fetch-wardrobe-images.cjs
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: "postgresql://frock:frock_dev@localhost:5432/frock",
});
const prisma = new PrismaClient({ adapter });

const OUTPUT_DIR = path.join(__dirname, "../public/wardrobe-images");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
};

function buildQuery(item) {
  const parts = [item.color, item.pattern, item.itemType, "women fashion"].filter(Boolean);
  return parts.join(" ");
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { ...HEADERS, ...headers } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location, headers).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function extractMurls(html) {
  // Bing embeds JSON in the page; murl holds the original image URL
  // Format: &quot;murl&quot;:&quot;https://...&quot;
  const decoded = html.replace(/&quot;/g, '"');
  const matches = [...decoded.matchAll(/"murl":"(https?:\/\/[^"]+)"/g)];
  return matches.map((m) => m[1]).filter((u) => /\.(jpg|jpeg|png|webp)/i.test(u));
}

async function searchBing(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC3&first=1&count=10&qft=+filterui:imagesize-medium`;
  const res = await get(url);
  if (res.status !== 200) throw new Error(`Bing returned ${res.status}`);
  return extractMurls(res.body.toString("utf8"));
}

async function downloadImage(imageUrl, outPath) {
  // Some URLs need different headers (no Accept-Language etc)
  const res = await get(imageUrl, { "Referer": "https://www.bing.com/" });
  if (res.status !== 200) throw new Error(`Image returned ${res.status}`);
  const ct = res.headers["content-type"] || "";
  if (!ct.includes("image")) throw new Error(`Not an image: ${ct}`);
  fs.writeFileSync(outPath, res.body);
}

async function fetchItem(item) {
  const query = buildQuery(item);
  console.log(`\n[${item.itemType} / ${item.color || ""}] → "${query}"`);

  // Try up to 3 different image URLs from Bing
  let urls;
  try {
    urls = await searchBing(query);
  } catch (e) {
    console.log(`  ✗ Bing search failed: ${e.message}`);
    return false;
  }

  if (!urls.length) {
    console.log(`  ✗ no image URLs found`);
    return false;
  }

  const ext = (u) => (u.match(/\.(jpg|jpeg|png|webp)/i) || ["", ".jpg"])[0];
  const outPath = path.join(OUTPUT_DIR, `${item.id}.jpg`);

  for (let i = 0; i < Math.min(urls.length, 4); i++) {
    try {
      await downloadImage(urls[i], outPath);
      console.log(`  ✓ saved (${urls[i].substring(0, 60)}…)`);
      return true;
    } catch (e) {
      console.log(`  ↩ url ${i + 1} failed: ${e.message}`);
    }
  }

  console.log(`  ✗ all URLs failed`);
  return false;
}

async function main() {
  const items = await prisma.wardrobeItem.findMany({
    where: { isActive: true },
    orderBy: { addedAt: "desc" },
  });
  console.log(`Found ${items.length} items`);

  let ok = 0;
  let fail = 0;

  for (const item of items) {
    const outPath = path.join(OUTPUT_DIR, `${item.id}.jpg`);

    if (fs.existsSync(outPath)) {
      console.log(`[${item.itemType}] already exists, updating DB`);
      await prisma.wardrobeItem.updateMany({
        where: { id: item.id },
        data: { imageUrl: `/wardrobe-images/${item.id}.jpg` },
      });
      ok++;
      continue;
    }

    const success = await fetchItem(item);
    if (success) {
      await prisma.wardrobeItem.updateMany({
        where: { id: item.id },
        data: { imageUrl: `/wardrobe-images/${item.id}.jpg` },
      });
      ok++;
    } else {
      fail++;
    }

    // Polite delay between searches
    await new Promise((r) => setTimeout(r, 800));
  }

  await prisma.$disconnect();
  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
