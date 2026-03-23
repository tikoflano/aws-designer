import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "ui",
  resolve: {
    alias: {
      "@compiler": path.resolve(repoRoot, "server/compiler"),
      "@shared": path.resolve(repoRoot, "shared"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["vite.tikoflano.work"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
