-- AlterTable
ALTER TABLE "WardrobeItem" ADD COLUMN "aesthetic" TEXT;
ALTER TABLE "WardrobeItem" ADD COLUMN "occasionTags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "WardrobeItem" ADD COLUMN "isStatement" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WardrobeItem" ADD COLUMN "colorGroup" TEXT;
ALTER TABLE "WardrobeItem" ADD COLUMN "textureFinish" TEXT;
ALTER TABLE "WardrobeItem" ADD COLUMN "layeringRole" TEXT;
ALTER TABLE "WardrobeItem" ADD COLUMN "printScale" TEXT;
ALTER TABLE "WardrobeItem" ADD COLUMN "legOpening" TEXT;
