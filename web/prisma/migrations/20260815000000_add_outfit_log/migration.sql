-- CreateTable
CREATE TABLE "OutfitLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pieces" TEXT NOT NULL DEFAULT '[]',
    "occasion" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutfitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutfitLog_userId_date_key" ON "OutfitLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "OutfitLog" ADD CONSTRAINT "OutfitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
