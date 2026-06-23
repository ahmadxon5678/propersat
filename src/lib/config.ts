export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "local-admin-password");

export const DEFAULT_SECRET_PASSWORD = process.env.SECRET_TEST_PASSWORD || "retest2026";
