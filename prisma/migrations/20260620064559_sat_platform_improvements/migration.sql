-- CreateTable
CREATE TABLE "VocabSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrugglePoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'failed_retest',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StrugglePoint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "durationMinutes" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "module" TEXT NOT NULL DEFAULT 'math',
    "setType" TEXT NOT NULL DEFAULT 'topical',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_QuestionSet" ("active", "createdAt", "description", "durationMinutes", "hidden", "id", "module", "title") SELECT "active", "createdAt", "description", "durationMinutes", "hidden", "id", "module", "title" FROM "QuestionSet";
DROP TABLE "QuestionSet";
ALTER TABLE "new_QuestionSet" RENAME TO "QuestionSet";
CREATE TABLE "new_VocabularyItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vocabSetId" INTEGER,
    "word" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT,
    "tag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabularyItem_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VocabularyItem" ("aliases", "createdAt", "definition", "difficulty", "id", "tag", "word") SELECT "aliases", "createdAt", "definition", "difficulty", "id", "tag", "word" FROM "VocabularyItem";
DROP TABLE "VocabularyItem";
ALTER TABLE "new_VocabularyItem" RENAME TO "VocabularyItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StrugglePoint_studentId_topic_source_key" ON "StrugglePoint"("studentId", "topic", "source");
