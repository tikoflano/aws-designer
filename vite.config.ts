import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);
const monacoEditorPlugin = require("vite-plugin-monaco-editor")
  .default as (opts?: object) => Plugin;

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
  plugins: [
    react(),
    tailwindcss(),
    // Bundles/serves Monaco web workers (loaded via createRequire — package default export is CJS).
    monacoEditorPlugin({ languageWorkers: ["editorWorkerService", "typescript"] }),
  ],
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
