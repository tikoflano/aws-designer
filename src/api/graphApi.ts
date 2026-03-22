import type { GraphDocument } from "../domain/types";

const base = () =>
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export type GraphRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  graph: GraphDocument;
};

export async function postGraph(): Promise<GraphRecord> {
  const res = await fetch(`${base()}/api/graph`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`POST /api/graph failed: ${res.status}`);
  }
  return parseJson<GraphRecord>(res);
}

export async function getGraph(id: string): Promise<GraphRecord> {
  const res = await fetch(`${base()}/api/graph/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`GET /api/graph/${id} failed: ${res.status}`);
  }
  return parseJson<GraphRecord>(res);
}

export async function putGraph(
  id: string,
  graph: GraphDocument,
): Promise<GraphRecord> {
  const res = await fetch(`${base()}/api/graph/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ graph }),
  });
  if (!res.ok) {
    throw new Error(`PUT /api/graph/${id} failed: ${res.status}`);
  }
  return parseJson<GraphRecord>(res);
}

export function compiledDownloadUrl(id: string): string {
  return `${base()}/api/graph/${encodeURIComponent(id)}/compiled`;
}
