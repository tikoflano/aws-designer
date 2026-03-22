import { spawn } from "node:child_process";
import * as net from "node:net";

const tunnel = process.env.VITE_DEV_TUNNEL?.trim();
const port = Number(process.env.VITE_DEV_SERVER_PORT || 5173);
// Vite defaults to IPv6 loopback only (::1); use localhost so connect + cloudflared reach the dev server.
const host = process.env.VITE_DEV_TUNNEL_HOST || "localhost";

function spawnVite() {
  return spawn("vite", [], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}

/** Reject if something is already listening (avoids tunneling to a stale dev server). */
function assertDevPortFree() {
  return /** @type {Promise<void>} */ (
    new Promise((resolve, reject) => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        reject(
          new Error(
            `Port ${port} on ${host} is already in use. Stop the other process or set VITE_DEV_SERVER_PORT.`,
          ),
        );
      });
      socket.on("error", (err) => {
        if (err.code === "ECONNREFUSED" || err.code === "EADDRNOTAVAIL") resolve();
        else reject(err);
      });
    })
  );
}

function waitForPort(maxMs = 60_000) {
  const start = Date.now();
  return /** @type {Promise<void>} */ (
    new Promise((resolve, reject) => {
      const tryOnce = () => {
        if (Date.now() - start > maxMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        const socket = net.createConnection({ port, host }, () => {
          socket.end();
          resolve();
        });
        socket.on("error", () => {
          socket.destroy();
          setTimeout(tryOnce, 150);
        });
      };
      tryOnce();
    })
  );
}

function isQuickTunnel(value) {
  const v = value.toLowerCase();
  return v === "quick" || v === "1" || v === "true" || v === "yes";
}

const children = [];

function cleanup() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function main() {
  const useTunnel = tunnel && tunnel !== "0" && tunnel !== "false";

  if (useTunnel) {
    try {
      await assertDevPortFree();
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  const vite = spawnVite();
  children.push(vite);

  vite.on("exit", (code, signal) => {
    cleanup();
    process.exit(code ?? (signal ? 1 : 0));
  });

  if (!useTunnel) {
    return;
  }

  try {
    await waitForPort();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    cleanup();
    process.exit(1);
  }

  const cloudflaredBin = process.env.CLOUDFLARED_PATH || "cloudflared";
  const args = isQuickTunnel(tunnel)
    ? ["tunnel", "--url", `http://${host}:${port}`]
    : ["tunnel", "run", tunnel];

  const cf = spawn(cloudflaredBin, args, { stdio: "inherit" });
  children.push(cf);

  cf.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
