import { defineConfig } from "drizzle-kit";
import { requireEnv } from "./src/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: requireEnv("DATABASE_URL") },
});
