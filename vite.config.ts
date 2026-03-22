import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Avoid port drift (cloudflared URL must match the dev server) when tunneling.
    strictPort: Boolean(process.env.VITE_DEV_TUNNEL?.trim()),
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
