# aws_designer

Visual AWS infrastructure builder (early MVP).

## End-to-end flow

1. **Author in the UI** — place S3/Lambda nodes, connect them with curated relationships, set configs in the inspector.
2. **Export graph JSON** — downloads a versioned document (`formatVersion`, `kind: "aws-designer-graph"`) that fully describes nodes, edges, positions, and configs. **Import graph JSON** restores the canvas from that file.
3. **Compile** — validates the graph and generates **CDK TypeScript** in one step (no separate IR). You can preview the generated stack source in the app.
4. **Download CDK stack (.ts)** — same generator as compile; saves `GeneratedGraphStack` (`aws-cdk-lib` + `CfnResource` / `Fn.*` intrinsics).
5. **CDK → CloudFormation** — in a CDK app that depends on `aws-cdk-lib`, add the generated stack, then run `cdk synth`. CDK writes **CloudFormation templates and assets** under `cdk.out/`. **AWS CloudFormation** (not CloudFront) executes those templates when you deploy.

## MVP scope

- **Nodes:** Amazon S3, AWS Lambda (versioned service definitions, `1.0.0`).
- **Relationships:**
  - `lambda_reads_s3` — Lambda → S3 (read IAM).
  - `lambda_writes_s3` — Lambda → S3 (write IAM).
  - `s3_triggers_lambda` — S3 → Lambda (bucket notifications + invoke permission).
- **UI:** React + Vite + Tailwind, infinite-style canvas with [@xyflow/react](https://reactflow.dev/), drag services from the palette, connect handles to pick a relationship, edit node/edge config in the inspector.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm test
npm run lint
```

## Docs for contributors / agents

See [agents.md](./agents.md) for the intended TypeScript stack and practices.
