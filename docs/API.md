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
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

`version` is a **per-graph sequence** (`seq` in SQLite): `1` for the first snapshot after `POST /api/graph`, then `2`, `3`, … on each `PUT`.

---

## `POST /api/graph`

Creates a new graph with an **empty** `nodes` / `edges` array and an initial version row.

- **Body:** empty (no JSON required).
- **Response:** `201` + format A above (`Location: /api/graph/{id}`).

## `GET /api/graph/:id`

Returns the **latest** version for that graph.

- **Response:** `200` + format A, or `404`.

## `PUT /api/graph/:id`

Appends a **new** version (backup history). Each save updates `updatedAt` and increments `version`.

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

Loads a specific historical version (same format A body as latest).

- **Response:** `200` + format A, or `404` / `400`.

## `GET /api/graph/:id/compiled`

Synthesizes the **latest** graph with CDK, zips the `cdk.out` directory, returns the zip.

- **Response:** `200` `application/zip` (`Content-Disposition: attachment`), or `404`, or `422` with `{ "error": "validation_failed", "issues": [...] }`.

## `GET /api/graphs`

Lists up to 50 graphs by most recently updated.

- **Response:** `200` `{ "graphs": [ { "id", "createdAt", "updatedAt" } ] }`.

## `DELETE /api/graph/:id`

Deletes the graph and all versions (`ON DELETE CASCADE`).

- **Response:** `204`, or `404`.

---

## SQLite

Default file: `server/data/graphs.sqlite` (gitignored). Enable foreign keys and use tables `graphs` + `graph_versions`.
