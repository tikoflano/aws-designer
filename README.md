# aws_designer

Visual AWS infrastructure builder (early MVP).

## End-to-end flow

1. **Author in the UI** — place S3/Lambda nodes, connect them with curated relationships, set configs in the inspector.
2. **Export graph JSON** — downloads a versioned document (`formatVersion`, `kind: "aws-designer-graph"`). **Import graph JSON** restores the canvas.
3. **Validate** (optional, in the UI) — runs the same checks the server compiler runs (services, relationships, Zod configs).
4. **Synthesize via the API** — after **Save to server**, **Download cdk.out (zip)** calls `GET /api/graph/:id/compiled`. The server builds a real `aws-cdk-lib` `App` + `Stack` using [`server/compiler/graphCompilerStack.ts`](./server/compiler/graphCompilerStack.ts), instantiates **L2 constructs** (`s3.Bucket`, `lambda.Function`, grants, event notifications), runs **`app.synth()`**, and returns a zip of the Cloud **assembly** (templates + `tree.json` + assets).
5. **Deploy** — use `cdk deploy` (or upload templates) so **AWS CloudFormation** applies the synthesized stack.

## MVP scope

- **Nodes:** Amazon S3, AWS Lambda (versioned service definitions, `1.0.0`).
- **Relationships:**
  - `lambda_reads_s3` — Lambda → S3 (`grantRead`, optional prefix; optional `ListBucket` + prefix condition).
  - `lambda_writes_s3` — Lambda → S3 (`grantPut`, optional prefix).
  - `s3_triggers_lambda` — S3 → Lambda (`addEventNotification` + `LambdaDestination`).
- **UI:** React + Vite + Tailwind + [@xyflow/react](https://reactflow.dev/).

## Scripts

With **Dev Containers** (VS Code / Cursor), use **Reopen in Container**; `npm ci` runs on first create and ports **5173** (Vite) and **8787** (API) are forwarded.

```bash
npm install
npm run dev           # UI + API — Vite :5173 + server :8787 (proxies /api → :8787)
npm run dev:ui        # UI only — http://localhost:5173
npm run dev:server    # API + SQLite — http://localhost:8787
npm run build
npm test
npm run lint
```

Graphs are stored in **`server/data/graphs.sqlite`** (gitignored). If you change the schema during development, delete that file and restart the server.

Full **API** reference: [docs/API.md](./docs/API.md).

### UI + API flow

- Edits are **autosaved to `localStorage`**; **Save to server** runs `POST /api/graph` (first time) then `PUT /api/graph/:id` (each save appends a new version in SQLite).
- **Load graph id** fetches `GET /api/graph/:id` (latest version).
- **Download cdk.out (zip)** opens `GET /api/graph/:id/compiled` (synthesizes latest graph with CDK).

## Docs for contributors / agents

See [agents.md](./agents.md) for the intended TypeScript stack and practices.
