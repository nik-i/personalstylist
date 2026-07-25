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

async function main() {
  console.log("Seeding brands...");
  await prisma.brand.createMany({ data: brands });
  console.log(`Seeded ${brands.length} brands.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
