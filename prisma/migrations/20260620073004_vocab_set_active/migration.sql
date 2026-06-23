-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VocabSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VocabSet" ("createdAt", "description", "id", "title") SELECT "createdAt", "description", "id", "title" FROM "VocabSet";
DROP TABLE "VocabSet";
ALTER TABLE "new_VocabSet" RENAME TO "VocabSet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
