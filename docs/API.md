# HTTP API

Base URL: same origin as the UI in development (Vite proxies `/api` → `http://127.0.0.1:8787`). Override with `VITE_API_BASE` for production.

Health: `GET /health` (no `/api` prefix).

All graph routes are under **`/api`**.

## Response shape (format A)

Successful graph reads/writes return:

```json
{
  "id": "<uuid>",
  "createdAt": "<iso8601>",
  "updatedAt": "<iso8601>",
  "version": 42,
  "title": "",
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

`version` is a **per-graph sequence** (`seq` in SQLite): `1` for the first snapshot after `POST /api/graph`, then `2`, `3`, … on each `PUT`.

`title` is **graph-level metadata** (stored on the `graphs` row, not inside each version snapshot). Changing the title does **not** increment `version` or change `graph.nodes` / `graph.edges`.

---

## `POST /api/graph`

Creates a new graph with an **empty** `nodes` / `edges` array, an empty `title`, and an initial version row.

- **Body:** empty (no JSON required).
- **Response:** `201` + format A above (`Location: /api/graph/{id}`).

## `GET /api/graph/:id`

Returns the **latest** version for that graph and the current `title`.

- **Response:** `200` + format A, or `404`.

## `PATCH /api/graph/:id`

Updates the graph **title** only. Does **not** append a new version; `version` and `graph` stay as the latest snapshot until the next `PUT`. `updatedAt` in the response remains the latest snapshot’s timestamp.

- **Body:**

```json
{
  "title": "My production stack"
}
```

- **Validation:** `title` is trimmed; maximum length **200** characters.
- **Response:** `200` + format A, or `404` / `400`.

## `PUT /api/graph/:id`

Appends a **new** version (backup history). Each save updates `updatedAt` and increments `version`. The stored `title` is unchanged by this request.

- **Body:**

```json
{
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

- **Response:** `200` + format A, or `404` / `400`.

## `GET /api/graph/:id/versions`

Lists all stored versions.

- **Response:** `200` `{ "versions": [ { "version": 1, "updatedAt": "..." } ] }`, or `404`.

## `GET /api/graph/:id/versions/:versionId`

Loads a specific historical **topology** (`nodes` / `edges` from that snapshot). The response still includes the graph’s **current** `title` (the same value as `GET /api/graph/:id`), so restoring an old version does not revert the title.

- **Response:** `200` + format A, or `404` / `400`.

## `POST /api/graph/:graphId/nodes/:nodeId/lambda-zip`

Uploads a **Lambda deployment package** (a `.zip` file) for the given node. The file is stored on the API host under `server/data/lambda-assets/` (gitignored with the rest of `server/data/`). The graph’s **latest** version must already include that Lambda node with `codeSource.type === "uploadedZip"` before you rely on synthesis (save the graph after changing code mode, then upload).

- **Body:** `multipart/form-data` with a single file field named **`file`** (max **50 MB**, must start with the ZIP local file header `PK`).
- **Response:** `204` on success, or `400` / `404` with `{ "error": "invalid_body", "message": "..." }` or `not_found`.

## `GET /api/graph/:id/compiled`

Synthesizes the **latest** graph with CDK, zips the `cdk.out` directory, returns the zip.

- **Response:** `200` `application/zip` (`Content-Disposition: attachment`), or `404`, or `422` with `{ "error": "validation_failed", "issues": [...] }`.

## `GET /api/graphs`

Lists up to 50 graphs by most recently updated version.

- **Response:** `200` `{ "graphs": [ { "id", "createdAt", "updatedAt", "title" } ] }`.

## `DELETE /api/graph/:id`

Deletes the graph and all versions (`ON DELETE CASCADE`).

- **Response:** `204`, or `404`.

---

## SQLite

Default file: `server/data/graphs.sqlite` (gitignored). Enable foreign keys and use tables `graphs` (including `title`) + `graph_versions`.
