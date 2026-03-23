import type { GraphDocument } from "@shared/domain/graph.ts";
import { db } from "./db.js";

export type GraphRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  title: string;
  graph: GraphDocument;
};

const insertGraph = db.prepare(
  `INSERT INTO graphs (id, created_at, title) VALUES (?, ?, ?)`,
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

const selectGraphMeta = db.prepare(
  `SELECT created_at, title FROM graphs WHERE id = ?`,
);

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

const updateGraphTitleStmt = db.prepare(
  `UPDATE graphs SET title = ? WHERE id = ?`,
);

function rowFromParts(
  id: string,
  meta: { created_at: string; title: string },
  ver: { seq: number; updated_at: string; document_json: string },
): GraphRow {
  return {
    id,
    createdAt: meta.created_at,
    updatedAt: ver.updated_at,
    version: ver.seq,
    title: meta.title,
    graph: JSON.parse(ver.document_json) as GraphDocument,
  };
}

export function createGraph(): GraphRow {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const empty: GraphDocument = { nodes: [], edges: [] };
  const seq = 1;
  const title = "";

  insertGraph.run(id, createdAt, title);
  insertVersion.run(id, seq, createdAt, JSON.stringify(empty));

  return {
    id,
    createdAt,
    updatedAt: createdAt,
    version: seq,
    title,
    graph: empty,
  };
}

export function graphExists(id: string): boolean {
  return selectGraphExists.get(id) !== undefined;
}

export function getLatestGraph(id: string): GraphRow | null {
  if (!graphExists(id)) return null;
  const meta = selectGraphMeta.get(id) as
    | { created_at: string; title: string }
    | undefined;
  if (!meta) return null;
  const ver = selectLatestVersion.get(id) as
    | { seq: number; updated_at: string; document_json: string }
    | undefined;
  if (!ver) return null;
  return rowFromParts(id, meta, ver);
}

export function appendVersion(id: string, graph: GraphDocument): GraphRow | null {
  if (!graphExists(id)) return null;
  const row = nextSeqStmt.get(id) as { n: number };
  const seq = row.n;
  const updatedAt = new Date().toISOString();
  insertVersion.run(id, seq, updatedAt, JSON.stringify(graph));
  const meta = selectGraphMeta.get(id) as
    | { created_at: string; title: string }
    | undefined;
  if (!meta) return null;
  return {
    id,
    createdAt: meta.created_at,
    updatedAt,
    version: seq,
    title: meta.title,
    graph,
  };
}

export function updateGraphTitle(id: string, title: string): GraphRow | null {
  if (!graphExists(id)) return null;
  updateGraphTitleStmt.run(title, id);
  return getLatestGraph(id);
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
  const meta = selectGraphMeta.get(graphId) as
    | { created_at: string; title: string }
    | undefined;
  if (!meta) return null;
  const row = selectVersionBySeq.get(graphId, seq) as
    | { updated_at: string; document_json: string }
    | undefined;
  if (!row) return null;
  return rowFromParts(
    graphId,
    meta,
    { seq, updated_at: row.updated_at, document_json: row.document_json },
  );
}

const listSummariesStmt = db.prepare(`
  SELECT g.id, g.created_at, g.title, MAX(v.updated_at) AS updated_at
  FROM graphs g
  JOIN graph_versions v ON v.graph_id = g.id
  GROUP BY g.id, g.created_at, g.title
  ORDER BY updated_at DESC
  LIMIT 50
`);

const deleteGraphStmt = db.prepare(`DELETE FROM graphs WHERE id = ?`);

export function listGraphSummaries(): {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
}[] {
  const rows = listSummariesStmt.all() as {
    id: string;
    created_at: string;
    title: string;
    updated_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    title: r.title,
  }));
}

export function deleteGraph(id: string): boolean {
  if (!graphExists(id)) return false;
  deleteGraphStmt.run(id);
  return true;
}
