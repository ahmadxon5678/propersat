import path from "node:path";

const databaseUrl = process.env.DATABASE_URL || "";
const isProduction =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);

function fail(message) {
  console.error(`[database-guard] ${message}`);
  process.exit(1);
}

function sqlitePathFromUrl(url) {
  if (!url.startsWith("file:")) return null;
  let value = url.slice("file:".length);
  if (value.startsWith("//")) {
    try {
      return new URL(url).pathname;
    } catch {
      return value;
    }
  }
  return value;
}

if (isProduction) {
  if (!databaseUrl) {
    fail("DATABASE_URL is missing. Refusing to start because data would not persist.");
  }

  const sqlitePath = sqlitePathFromUrl(databaseUrl);
  if (sqlitePath === null) {
    fail(`This app is configured for SQLite, but DATABASE_URL is not a file: URL: ${databaseUrl}`);
  }

  const normalized = sqlitePath.replace(/\\/g, "/");
  const absolute = path.posix.isAbsolute(normalized);
  if (!absolute || !normalized.startsWith("/data/")) {
    fail(
      [
        "Production SQLite must live on the Railway persistent volume.",
        `Current DATABASE_URL: ${databaseUrl}`,
        "Set Railway DATABASE_URL to: file:/data/database.db",
        "Attach a Railway volume mounted at: /data",
      ].join("\n"),
    );
  }
}
