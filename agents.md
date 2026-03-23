# Agent guidelines: tech stack and coding practices

This repository targets a **visual AWS infrastructure builder** (infinite canvas, versioned service nodes and relationships, graph-to-CDK generation). Synthesis runs on the **API** (`server/src/synthZip.ts` + `GraphCompilerStack` + `app.synth()`), not via a separate CLI. Agents must follow these defaults unless a task explicitly overrides them.

## Language and runtime

- **TypeScript everywhere** for application code, tooling, and CDK: `strict` mode enabled (`strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` unless a file has a documented exception).
- **Node.js**: use the version pinned in `.nvmrc` or `package.json` `engines` when present; otherwise document the chosen LTS in the root README when a project is initialized.
- Prefer **ESM** for new packages where the toolchain supports it consistently; avoid mixing module systems in one package without a clear boundary.

## Prefer libraries over custom implementations

- **Do not hand-roll** primitives when a maintained library fits: validation, schema forms, graph layout, HTTP clients, dates, IDs, state management, etc.
- Before adding bespoke utilities, search for a small, well-used dependency or use the standard library patterns from the chosen framework.
- Wrap third-party APIs in thin internal modules so swapping implementations stays localized.

## Recommended stack (when starting greenfield UI + compiler)

These are the default choices for this product unless the repo already committed to alternatives:

| Area | Preference | Notes |
|------|------------|--------|
| UI framework | **React** | Widest ecosystem for graph and form libraries. |
| Build tool | **Vite** | Fast dev server and sensible TS defaults. |
| Canvas / graph | **React Flow** (`@xyflow/react`) | Node/edge model maps directly to the product; use for drag-drop and connections. |
| Component primitives | **Radix UI** + **Tailwind CSS**, or **MUI** | Pick one system per app and stay consistent; avoid mixing unstyled headless + multiple full kits. |
| Forms + validation | **React Hook Form** + **Zod** | Co-locate Zod schemas with relationship/service `configSchema` where possible; use `@hookform/resolvers`. |
| JSON Schema (when spec requires it) | **Ajv** (or Zod-from-JSON-schema pipeline) | Relationships/services may expose JSON Schema; validate consistently on server and client. |
| State | **TanStack Query** for server/async state; **Zustand** or **Jotai** for local UI/graph if needed | Avoid global singletons for testability. |
| Infra emission | **AWS CDK** (`aws-cdk-lib`) in TypeScript | Graph compiles to real constructs in `server/compiler/`; the server zips the synthesized `cdk.out` assembly (`GET /api/graph/:id/compiled`). |
| Testing | **Vitest** + **Testing Library** | Unit-test graph→CDK generation and critical UI flows. |
| Lint/format | **ESLint** (typescript-eslint, react hooks) + **Prettier** | Single source of formatting truth. |

If the repository already uses different but equivalent libraries, **follow the existing codebase** rather than introducing parallel stacks.

## Project structure (guidance)

Prefer clarity over deep nesting:

- `packages/` or `apps/` monorepo layout if UI and compiler deploy separately; otherwise bounded top-level folders (this repo uses `ui/` + `server/`).
- Suggested layout for this repo: `ui/src/` (React app plus domain, registry, compile, graph modules consumed by the server), `server/src/` (Fastify + SQLite API), `server/compiler/` (graph → real CDK `App` + `synth()`).
- **Barrel files** (`index.ts`): use sparingly; avoid circular imports.

## Code quality practices

- **Types**: explicit public APIs; avoid `any`; use `unknown` + narrowing at boundaries (JSON, config).
- **Immutability**: treat graph updates as immutable snapshots or use explicit update helpers; easier undo/redo and debugging.
- **Pure functions** for graph validation in the web bundle; the Node **compiler** (used by the server) may call `aws-cdk-lib` and `app.synth()` (temp `cdk.out` then zipped for download).
- **Errors**: use typed errors or Result-style outcomes for compile/validation failures; include node id, edge id, and relationship id in messages.
- **Versioning**: respect pinned **semver** on nodes and relationships; never silently change meaning of stored graph data.
- **Security**: no secrets in graph JSON; use placeholders and environment/credential resolution at deploy time.

## Dependencies

- Prefer **dependencies with active maintenance**, reasonable bundle size for UI, and TypeScript types (bundled or `@types/`).
- Lock versions with the repo’s lockfile; run audit checks when adding packages.
- Document any **AWS credential** or **CDK bootstrap** assumptions in README, not only in chat.

## What agents should do when implementing

1. Match existing patterns in the nearest sibling files (naming, imports, test layout).
2. Add or update tests for merge logic, validation, and any new relationship/service definition behavior.
3. Keep diffs focused: no drive-by refactors or unrelated formatting churn.
4. After substantive edits, run the project’s lint and test scripts if they exist; fix new issues introduced by the change.

## What agents should avoid

- New custom graph engines, ad-hoc schema DSLs, or CSS frameworks parallel to the chosen UI system.
- Generating CloudFormation by ad-hoc string concatenation from the graph; prefer **real CDK constructs** in Node (`server/compiler/`) plus `Template.fromStack` tests where useful.
- Dropping versioning from persisted nodes or edges.

---

Update this file when the team adopts concrete package versions or replaces a default library so agents stay aligned with the repo.
