import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Keep port stable so it matches the service URL configured for the tunnel in Zero Trust.
    strictPort: Boolean(
      process.env.CLOUDFLARE_TUNNEL_TOKEN?.trim() || process.env.VITE_DEV_TUNNEL?.trim(),
    ),
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
