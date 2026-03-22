# aws_designer

Visual AWS infrastructure builder (early MVP).

## End-to-end flow

1. **Author in the UI** — place S3/Lambda nodes, connect them with curated relationships, set configs in the inspector.
2. **Export graph JSON** — downloads a versioned document (`formatVersion`, `kind: "aws-designer-graph"`). **Import graph JSON** restores the canvas.
3. **Validate** (optional, in the UI) — runs the same checks the compiler runs (services, relationships, Zod configs).
4. **Run the CDK compiler (Node)** — builds a real `aws-cdk-lib` `App` + `Stack`, instantiates **L2 constructs** (`s3.Bucket`, `lambda.Function`, grants, event notifications), then calls **`app.synth()`**. Output is a Cloud **assembly** under `cdk.out/` (templates + `tree.json` + assets), same as any CDK app.
5. **Deploy** — use `cdk deploy` (or upload templates) so **AWS CloudFormation** applies the synthesized stack.

### Compiler command

From the repo root (after `npm install`):

```bash
npx tsx compiler/synth.ts path/to/aws-designer-graph.json
npx tsx compiler/synth.ts path/to/aws-designer-graph.json --outdir ./my-cdk-out
```

Shortcut:

```bash
npm run compiler:synth -- path/to/aws-designer-graph.json
```

The compiler loads [`compiler/graphCompilerStack.ts`](./compiler/graphCompilerStack.ts), which maps graph nodes and edges to CDK APIs (no generated `.ts` file).

## MVP scope

- **Nodes:** Amazon S3, AWS Lambda (versioned service definitions, `1.0.0`).
- **Relationships:**
  - `lambda_reads_s3` — Lambda → S3 (`grantRead`, optional prefix; optional `ListBucket` + prefix condition).
  - `lambda_writes_s3` — Lambda → S3 (`grantPut`, optional prefix).
  - `s3_triggers_lambda` — S3 → Lambda (`addEventNotification` + `LambdaDestination`).
- **UI:** React + Vite + Tailwind + [@xyflow/react](https://reactflow.dev/).

## Scripts

```bash
npm install
npm run dev           # UI — http://localhost:5173 (proxies /api → :8787)
npm run server:dev    # API + SQLite — http://localhost:8787 (run in a second terminal)
npm run build
npm test
npm run lint
npm run compiler:synth -- compiler/fixtures/lambda-reads-s3.json
```

Graphs are stored in **`server/data/graphs.sqlite`** (gitignored). If you change the schema during development, delete that file and restart the server.

Full **API** reference: [docs/API.md](./docs/API.md).

### UI + API flow

- Edits are **autosaved to `localStorage`**; **Save to server** runs `POST /api/graph` (first time) then `PUT /api/graph/:id` (each save appends a new version in SQLite).
- **Load graph id** fetches `GET /api/graph/:id` (latest version).
- **Download cdk.out (zip)** opens `GET /api/graph/:id/compiled` (synthesizes latest graph with CDK).

## Docs for contributors / agents

See [agents.md](./agents.md) for the intended TypeScript stack and practices.
