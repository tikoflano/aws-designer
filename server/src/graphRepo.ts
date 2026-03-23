import type { GraphDocument } from "@shared/domain/graph.ts";
import { db } from "./db.js";

export type GraphRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  graph: GraphDocument;
};

const insertGraph = db.prepare(
  `INSERT INTO graphs (id, created_at) VALUES (?, ?)`,
);

const insertVersion = db.prepare(
  `INSERT INTO graph_versions (graph_id, seq, updated_at, document_json)
   VALUES (?, ?, ?, ?)`,
);

const selectGraphExists = db.prepare(`SELECT 1 AS ok FROM graphs WHERE id = ?`);

const selectLatestVersion = db.prepare(
  `SELECT seq, updated_at, document_json FROM graph_versions
   WHERE graph_id = ?
   ORDER BY seq DESC
   LIMIT 1`,
);

const selectCreatedAt = db.prepare(`SELECT created_at FROM graphs WHERE id = ?`);

const nextSeqStmt = db.prepare(
  `SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM graph_versions WHERE graph_id = ?`,
);

const listVersionsStmt = db.prepare(
  `SELECT seq, updated_at FROM graph_versions WHERE graph_id = ? ORDER BY seq ASC`,
);

const selectVersionBySeq = db.prepare(
  `SELECT updated_at, document_json FROM graph_versions
   WHERE graph_id = ? AND seq = ?`,
);

export function createGraph(): GraphRow {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const empty: GraphDocument = { nodes: [], edges: [] };
  const seq = 1;

  insertGraph.run(id, createdAt);
  insertVersion.run(id, seq, createdAt, JSON.stringify(empty));

  return {
    id,
    createdAt,
    updatedAt: createdAt,
    version: seq,
    graph: empty,
  };
}

export function graphExists(id: string): boolean {
  return selectGraphExists.get(id) !== undefined;
}

export function getLatestGraph(id: string): GraphRow | null {
  if (!graphExists(id)) return null;
  const created = selectCreatedAt.get(id) as { created_at: string } | undefined;
  if (!created) return null;
  const ver = selectLatestVersion.get(id) as
    | { seq: number; updated_at: string; document_json: string }
    | undefined;
  if (!ver) return null;
  return {
    id,
    createdAt: created.created_at,
    updatedAt: ver.updated_at,
    version: ver.seq,
    graph: JSON.parse(ver.document_json) as GraphDocument,
  };
}

export function appendVersion(id: string, graph: GraphDocument): GraphRow | null {
  if (!graphExists(id)) return null;
  const row = nextSeqStmt.get(id) as { n: number };
  const seq = row.n;
  const updatedAt = new Date().toISOString();
  insertVersion.run(id, seq, updatedAt, JSON.stringify(graph));
  const created = selectCreatedAt.get(id) as { created_at: string } | undefined;
  if (!created) return null;
  return {
    id,
    createdAt: created.created_at,
    updatedAt,
    version: seq,
    graph,
  };
}

export function listGraphVersions(
  graphId: string,
): { version: number; updatedAt: string }[] {
  const rows = listVersionsStmt.all(graphId) as {
    seq: number;
    updated_at: string;
  }[];
  return rows.map((r) => ({ version: r.seq, updatedAt: r.updated_at }));
}

export function getGraphVersion(
  graphId: string,
  seq: number,
): GraphRow | null {
  if (!graphExists(graphId)) return null;
  const created = selectCreatedAt.get(graphId) as { created_at: string } | undefined;
  if (!created) return null;
  const row = selectVersionBySeq.get(graphId, seq) as
    | { updated_at: string; document_json: string }
    | undefined;
  if (!row) return null;
  return {
    id: graphId,
    createdAt: created.created_at,
    updatedAt: row.updated_at,
    version: seq,
    graph: JSON.parse(row.document_json) as GraphDocument,
  };
}

const listSummariesStmt = db.prepare(`
  SELECT g.id, g.created_at, MAX(v.updated_at) AS updated_at
  FROM graphs g
  JOIN graph_versions v ON v.graph_id = g.id
  GROUP BY g.id
  ORDER BY updated_at DESC
  LIMIT 50
`);

const deleteGraphStmt = db.prepare(`DELETE FROM graphs WHERE id = ?`);

export function listGraphSummaries(): {
  id: string;
  createdAt: string;
  updatedAt: string;
}[] {
  const rows = listSummariesStmt.all() as {
    id: string;
    created_at: string;
    updated_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function deleteGraph(id: string): boolean {
  if (!graphExists(id)) return false;
  deleteGraphStmt.run(id);
  return true;
}
