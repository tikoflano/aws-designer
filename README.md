# aws_designer

Visual AWS infrastructure builder (early MVP).

## MVP scope

- **Nodes:** Amazon S3, AWS Lambda (versioned service definitions, `1.0.0`).
- **Relationships:**
  - `lambda_reads_s3` — Lambda → S3 (read IAM).
  - `lambda_writes_s3` — Lambda → S3 (write IAM).
  - `s3_triggers_lambda` — S3 → Lambda (bucket notifications + invoke permission).
- **UI:** React + Vite + Tailwind, infinite-style canvas with [@xyflow/react](https://reactflow.dev/), drag services from the palette, connect handles to pick a relationship, edit node/edge config in the inspector, **Compile graph** to preview merged **IR** (resources + IAM + links).

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
