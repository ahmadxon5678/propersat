ALTER TABLE "VocabSet" ADD COLUMN "ownerId" INTEGER;
ALTER TABLE "VocabSet" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'public';
ALTER TABLE "VocabSet" ADD COLUMN "isOfficial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VocabSet" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';
ALTER TABLE "VocabularyItem" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

UPDATE "VocabSet" SET "isOfficial" = true, "visibility" = 'public' WHERE "ownerId" IS NULL;
UPDATE "VocabularyItem" SET "order" = "id" WHERE "order" = 0;
