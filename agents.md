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

## Design (UI conventions)

The canvas app uses a **warm orange / amber** palette for overlays and primary workflow chrome (see [`ui/src/ui/relationship/RelationshipPicker.tsx`](ui/src/ui/relationship/RelationshipPicker.tsx) as the reference modal). New full-screen dialogs and similar surfaces should match it; avoid neutral-only slate modals unless the surface is intentionally secondary (e.g. small dropdown menus).

| Element | Convention |
|--------|----------------|
| **Modal backdrop** | `fixed inset-0 z-50`, `bg-orange-950/35`, `backdrop-blur-sm`, centered with `p-4`. Dismiss on backdrop mouse-down on the overlay root (not the panel). |
| **Modal panel** | `max-w-lg`, `max-h-[80vh]`, `rounded-xl`, `border-2 border-orange-400`, `ring-2 ring-orange-300`, `shadow-2xl`, gradient fill `bg-linear-to-b from-orange-100 via-amber-50 to-orange-50`. |
| **Modal header** | `border-b-2 border-orange-400`, `bg-linear-to-r from-orange-300 to-amber-200`, `px-4 py-3`. Title: `text-base font-semibold text-orange-950`. Secondary line (e.g. IDs): `text-sm font-medium text-orange-900 tabular-nums`. |
| **Scrollable body / lists** | `bg-amber-50`, list rows `divide-y divide-orange-200`, row hover `transition-colors hover:bg-orange-200`. Primary line `text-sm font-medium text-slate-900`, supporting line `text-xs text-slate-600`. |
| **Empty / loading copy** | Same amber-50 body background, `text-sm text-slate-700`. |
| **Errors** | Prefer `text-red-800` on warm backgrounds; optional inline banner `border-b-2 border-orange-300 bg-orange-100 text-sm text-orange-950` for non-blocking messages. |
| **Modal footer** | `border-t-2 border-orange-400`, `bg-orange-200`, `px-4 py-3`. Actions: `rounded-md border-2 border-orange-600 bg-amber-50 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-100` (disabled: `opacity-50`). |
| **Accessibility** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the visible title; close on **Escape** while open. |
| **Portals (React Flow)** | Full-screen modals opened from under `@xyflow/react` (e.g. inside a `<Panel>`) must render with `createPortal(..., document.body)`. React Flow’s transformed viewport creates a stacking context, so an in-tree `fixed` overlay cannot sit above **Controls** / **MiniMap** or apply `backdrop-blur` to them; portaling fixes both. |

Co-locate repeated class strings in a small constant block at the top of the component when it keeps the modal consistent and easier to update.

### Contextual help: info (`i`) popovers

For **short explanations** next to inspector fields, form labels, or modal headers (not full documentation), use a **click-to-open popover** tied to a circular **information** icon—not a second modal on top of a modal unless unavoidable.

| Aspect | Convention |
|--------|------------|
| **Component** | Prefer [`ui/src/ui/common/HelpInfoPopover.tsx`](ui/src/ui/common/HelpInfoPopover.tsx): toggle on button click, dismiss on **outside pointer down** and **Escape**, `aria-expanded` / `aria-controls` / `aria-label` on the trigger. |
| **Icon** | Hero-style filled “i” in circle (same SVG as in `HelpInfoPopover`); `aria-hidden` on the graphic, meaning on the button via `aria-label`. |
| **Variants** | `neutral` (slate/white panel, compact control) for **inspector** and secondary surfaces; `warm` (amber/orange panel, larger hit target) for **modal chrome** such as [`RelationshipPicker`](ui/src/ui/relationship/RelationshipPicker.tsx). |
| **Content** | `title` + a few short paragraphs or bullets; mention AWS behavior when the field maps to a real API (e.g. S3 notification prefix/suffix filters). Keep copy concise. |
| **Placement** | The panel is rendered with `createPortal(..., document.body)` and **`position: fixed`** (right edge aligned to the trigger’s right, below the trigger) so it is not clipped by inspector `overflow-auto` and stacks above React Flow. Reposition on window resize and `scroll` (capture). `z-index` ~`10000` so it sits above canvas chrome. |

Reuse this pattern whenever users need a **one-tap explanation** without leaving the form; add new instances with `HelpInfoPopover` rather than one-off popover state.

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

## Cursor Cloud specific instructions

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite UI | `npm run dev:ui` | 5173 | Proxies `/api` to the API server |
| Fastify API | `npm run dev:server` | 8787 | Auto-creates SQLite DB at `server/data/graphs.sqlite` |
| Both (recommended) | `npm run dev` | 5173 + 8787 | Uses `concurrently` to run both |

### Running commands

Standard commands are documented in `README.md` under **Scripts**. Key ones: `npm run dev`, `npm test`, `npm run lint`, `npm run build`.

### Non-obvious caveats

- `better-sqlite3` is a native Node.js addon. If `npm ci` fails with compilation errors, ensure `python3`, `make`, and `g++` are available (they are pre-installed in the Cloud Agent VM).
- The API wire format for nodes/edges is **flat** (not nested under React Flow's `type`/`data` keys). See `shared/api/schemas.ts` for the Zod schemas (`graphNodeSchema`, `graphEdgeSchema`).
- Deleting `server/data/graphs.sqlite` resets all graph data; the file is auto-created on server start.
- The Vite dev server deprecation warning (`fs.rmdir` with `recursive`) is harmless and comes from a transitive dependency.

### Cloudflare tunnel

The tunnel exposes the Vite dev server externally at `https://vite.tikoflano.work/`. It requires:
1. `cloudflared` installed (`sudo apt-get install -y cloudflared` via the Cloudflare apt repo, or download the binary).
2. The `VITE_DEV_TUNNEL` secret set in the environment (configured in Cursor Secrets).
3. Dev servers running first (`npm run dev`), then `npm run tunnel` in a separate terminal.

The tunnel proxies `vite.tikoflano.work` → `http://localhost:5173`. The domain has Cloudflare managed challenge enabled, so `curl` will get a 403; use a browser to verify. ICMP proxy warnings in the tunnel logs are harmless in the Cloud Agent VM.
