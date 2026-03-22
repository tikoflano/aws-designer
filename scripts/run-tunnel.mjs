import { spawn } from "node:child_process";
import { loadEnv } from "vite";

const fileEnv = loadEnv("development", process.cwd(), "");
const token =
  process.env.TUNNEL_TOKEN?.trim() ||
  process.env.VITE_DEV_TUNNEL?.trim() ||
  fileEnv.VITE_DEV_TUNNEL?.trim() ||
  fileEnv.CLOUDFLARE_TUNNEL_TOKEN?.trim();

if (!token) {
  console.error(
    "No tunnel token found. Add VITE_DEV_TUNNEL to .env or .env.local, or set TUNNEL_TOKEN / VITE_DEV_TUNNEL in the environment.",
  );
  process.exit(1);
}

const bin = process.env.CLOUDFLARED_PATH || "cloudflared";
const child = spawn(bin, ["tunnel", "run"], {
  stdio: "inherit",
  env: { ...process.env, TUNNEL_TOKEN: token },
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
