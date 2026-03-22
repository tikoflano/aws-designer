import { useGraphStore } from "../state/graphStore";

export function CompilePanel() {
  const lastCompile = useGraphStore((s) => s.lastCompile);
  const runCompile = useGraphStore((s) => s.runCompile);

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Compile (IR preview)
        </div>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
          onClick={() => runCompile()}
        >
          Compile graph
        </button>
      </div>
      {!lastCompile && (
        <p className="text-xs text-slate-600">
          Run compile to merge node bases and relationship fragments into one IR.
          Use <strong>Export graph JSON</strong> in the header to persist the
          canvas; <strong>Download CDK stack</strong> turns the same graph into
          TypeScript for <code className="rounded bg-slate-100 px-1">cdk synth</code>{" "}
          (CloudFormation templates in <code className="rounded bg-slate-100 px-1">cdk.out/</code>
          ).
        </p>
      )}
      {lastCompile && (
        <div className="flex max-h-48 flex-col gap-2">
          <div
            className={`text-xs font-medium ${
              lastCompile.ok ? "text-emerald-700" : "text-amber-800"
            }`}
          >
            {lastCompile.ok ? "OK" : "Completed with issues"}
            {lastCompile.issues.length > 0 &&
              ` — ${lastCompile.issues.length} issue(s)`}
          </div>
          {lastCompile.issues.length > 0 && (
            <ul className="max-h-20 list-inside list-disc overflow-auto text-xs text-red-700">
              {lastCompile.issues.map((i, idx) => (
                <li key={`${i.code}-${idx}`}>
                  [{i.code}] {i.message}
                  {i.nodeId && ` (node ${i.nodeId})`}
                  {i.edgeId && ` (edge ${i.edgeId})`}
                </li>
              ))}
            </ul>
          )}
          {lastCompile.ir && (
            <pre className="max-h-32 overflow-auto rounded border border-slate-200 bg-white p-2 text-[10px] leading-snug text-slate-800">
              {JSON.stringify(lastCompile.ir, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
