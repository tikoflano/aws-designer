import { useGraphStore } from "../state/graphStore";

export function CompilePanel() {
  const lastCompile = useGraphStore((s) => s.lastCompile);
  const runCompile = useGraphStore((s) => s.runCompile);

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Validate graph
        </div>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
          onClick={() => runCompile()}
        >
          Validate
        </button>
      </div>
      {!lastCompile && (
        <p className="text-xs text-slate-600">
          Export <strong>graph JSON</strong>, then run the CDK compiler to produce{" "}
          <code className="rounded bg-slate-100 px-1">cdk.out</code> (real constructs,
          not generated source):
        </p>
      )}
      {!lastCompile && (
        <pre className="mt-1 overflow-x-auto rounded border border-slate-200 bg-white p-2 text-[10px] text-slate-800">
          npx tsx compiler/synth.ts path/to/aws-designer-graph.json
        </pre>
      )}
      {!lastCompile && (
        <p className="mt-1 text-xs text-slate-600">
          Optional:{" "}
          <code className="rounded bg-slate-100 px-1">
            --outdir ./cdk.out
          </code>{" "}
          (defaults to <code className="rounded bg-slate-100 px-1">cdk.out</code> in
          the current working directory).
        </p>
      )}
      {lastCompile && (
        <div className="flex max-h-40 flex-col gap-2">
          <div
            className={`text-xs font-medium ${
              lastCompile.ok ? "text-emerald-700" : "text-amber-800"
            }`}
          >
            {lastCompile.ok ? "OK" : "Issues found"}
            {lastCompile.issues.length > 0 &&
              ` — ${lastCompile.issues.length} issue(s)`}
          </div>
          {lastCompile.issues.length > 0 && (
            <ul className="max-h-24 list-inside list-disc overflow-auto text-xs text-red-700">
              {lastCompile.issues.map((i, idx) => (
                <li key={`${i.code}-${idx}`}>
                  [{i.code}] {i.message}
                  {i.nodeId && ` (node ${i.nodeId})`}
                  {i.edgeId && ` (edge ${i.edgeId})`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
