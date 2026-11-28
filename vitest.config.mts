import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      // `server-only` melempar error di luar server Next.js. Di tes diganti stub kosong.
      "server-only": path.resolve(root, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/features/**/*.ts", "src/lib/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
