import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dbPath = join(dataDir, "graphs.sqlite");

mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS graphs (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS graph_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    graph_id TEXT NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    document_json TEXT NOT NULL,
    UNIQUE(graph_id, seq)
  );

  CREATE INDEX IF NOT EXISTS idx_graph_versions_graph_id
    ON graph_versions(graph_id);
`);

/** Pre-`title` DBs: `CREATE TABLE IF NOT EXISTS` does not alter existing tables. */
function ensureGraphTitleColumn() {
  try {
    db.exec(
      `ALTER TABLE graphs ADD COLUMN title TEXT NOT NULL DEFAULT '';`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(message)) throw e;
  }
}

ensureGraphTitleColumn();
