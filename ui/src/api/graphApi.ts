import { apiPaths } from "@shared/api/paths.ts";
import {
  graphRecordSchema,
  graphsListResponseSchema,
  graphVersionsListResponseSchema,
  notFoundErrorSchema,
  validationFailedErrorSchema,
  type GraphRecord,
  type GraphsListResponse,
  type GraphVersionsListResponse,
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

async function parseJsonResponse<T>(
  res: Response,
  parse: (json: unknown) => { success: true; data: T } | { success: false; message: string },
): Promise<T> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON in graph API response");
  }
  const parsed = parse(json);
  if (!parsed.success) {
    throw new Error(parsed.message);
  }
  return parsed.data;
}

export type { GraphRecord };
export type GraphSummary = GraphsListResponse["graphs"][number];
export type GraphVersionEntry = GraphVersionsListResponse["versions"][number];

export async function listGraphs(): Promise<GraphSummary[]> {
  const path = apiPaths.graphs;
  const res = await fetch(url(path));
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return (
    await parseJsonResponse(res, (json) => {
      const parsed = graphsListResponseSchema.safeParse(json);
      if (!parsed.success) {
        return {
          success: false,
          message: `Graph API response shape mismatch: ${parsed.error.message}`,
        };
      }
      return { success: true, data: parsed.data.graphs };
    })
  );
}

export async function listGraphVersions(
  id: string,
): Promise<GraphVersionEntry[]> {
  const path = apiPaths.graphVersions(id);
  const res = await fetch(url(path));
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return (
    await parseJsonResponse(res, (json) => {
      const parsed = graphVersionsListResponseSchema.safeParse(json);
      if (!parsed.success) {
        return {
          success: false,
          message: `Graph API response shape mismatch: ${parsed.error.message}`,
        };
      }
      return { success: true, data: parsed.data.versions };
    })
  );
}

export async function getGraphVersion(
  id: string,
  versionSeq: number,
): Promise<GraphRecord> {
  const path = apiPaths.graphVersion(id, versionSeq);
  const res = await fetch(url(path));
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return parseGraphRecordResponse(res);
}

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

export async function patchGraphTitle(
  id: string,
  title: string,
): Promise<GraphRecord> {
  const path = apiPaths.graph(id);
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`PATCH ${path} failed: ${res.status}`);
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
