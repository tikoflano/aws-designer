import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@compiler": path.resolve(repoRoot, "server/compiler"),
      "@shared": path.resolve(repoRoot, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["ui/**/*.test.ts", "server/compiler/**/*.test.ts"],
  },
});
