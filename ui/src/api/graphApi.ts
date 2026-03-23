import { apiPaths } from "@shared/api/paths.ts";
import {
  graphRecordSchema,
  notFoundErrorSchema,
  validationFailedErrorSchema,
  type GraphRecord,
} from "@shared/api/schemas.ts";

import type { GraphDocument } from "../domain/types";

const base = () =>
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

function url(path: string): string {
  const b = base();
  return b ? `${b}${path}` : path;
}

async function parseGraphRecordResponse(res: Response): Promise<GraphRecord> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON in graph API response");
  }
  const parsed = graphRecordSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Graph API response shape mismatch: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export type { GraphRecord };

export async function postGraph(): Promise<GraphRecord> {
  const res = await fetch(url(apiPaths.postGraph), { method: "POST" });
  if (!res.ok) {
    throw new Error(`POST ${apiPaths.postGraph} failed: ${res.status}`);
  }
  return parseGraphRecordResponse(res);
}

export async function getGraph(id: string): Promise<GraphRecord> {
  const path = apiPaths.graph(id);
  const res = await fetch(url(path));
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return parseGraphRecordResponse(res);
}

export async function putGraph(
  id: string,
  graph: GraphDocument,
): Promise<GraphRecord> {
  const path = apiPaths.graph(id);
  const res = await fetch(url(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ graph }),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status}`);
  }
  return parseGraphRecordResponse(res);
}

/**
 * GET /compiled runs CDK synth on the server and returns a zip of cdk.out.
 */
export async function fetchGraphCompiledZip(
  id: string,
): Promise<{ blob: Blob; filename: string }> {
  const path = apiPaths.graphCompiled(id);
  const res = await fetch(url(path));
  if (res.ok) {
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition");
    let filename = `graph-${id}-cdk-out.zip`;
    const m = cd?.match(/filename="([^"]+)"/i) ?? cd?.match(/filename=([^;\s]+)/i);
    if (m?.[1]) filename = m[1].replaceAll(/"/g, "");
    return { blob, filename };
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }

  const failed = validationFailedErrorSchema.safeParse(json);
  if (failed.success) {
    const lines = failed.data.issues.map((i) => `• ${i.message}`).join("\n");
    throw new Error(`Compilation failed:\n${lines}`);
  }

  if (notFoundErrorSchema.safeParse(json).success) {
    throw new Error("Graph not found on the server.");
  }

  throw new Error(`GET ${path} failed: ${res.status}`);
}
