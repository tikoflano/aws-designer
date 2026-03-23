import { Controller, type Control, type FieldErrors } from "react-hook-form";

type FormValues = Record<string, unknown>;

function pairsFromRecord(rec: Record<string, string>): { key: string; value: string }[] {
  const e = Object.entries(rec);
  return e.length > 0 ? e.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
}

function recordFromPairs(pairs: { key: string; value: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of pairs) {
    const k = key.trim();
    if (k === "") continue;
    out[k] = value;
  }
  return out;
}

export function LambdaEnvVarsField({
  control,
  formId,
  errors,
}: {
  control: Control<FormValues>;
  formId: string;
  errors: FieldErrors<FormValues>;
}) {
  const envErr = errors.environmentVariables;

  return (
    <Controller
      name="environmentVariables"
      control={control}
      render={({ field: { value, onChange } }) => {
        const rec = (value && typeof value === "object" ? value : {}) as Record<
          string,
          string
        >;
        const pairs = pairsFromRecord(rec);

        const sync = (next: { key: string; value: string }[]) => {
          onChange(recordFromPairs(next));
        };

        const setPair = (i: number, patch: Partial<{ key: string; value: string }>) => {
          const next = pairs.map((p, j) => (j === i ? { ...p, ...patch } : p));
          sync(next);
        };

        const addRow = () => {
          sync([...pairs, { key: "", value: "" }]);
        };

        const removeRow = (i: number) => {
          const next = pairs.filter((_, j) => j !== i);
          sync(next.length > 0 ? next : [{ key: "", value: "" }]);
        };

        return (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-slate-700">Environment variables</span>
            <span className="text-xs text-slate-500">
              Names must match [A-Za-z][A-Za-z0-9_]* and cannot start with{" "}
              <code className="rounded bg-slate-100 px-1 font-mono">AWS_</code>.
            </span>
            <div className="flex flex-col gap-2">
              {pairs.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    className="min-w-[8rem] flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                    placeholder="KEY"
                    aria-label={`Environment variable name ${i + 1}`}
                    value={row.key}
                    onChange={(e) => setPair(i, { key: e.target.value })}
                  />
                  <input
                    className="min-w-[8rem] flex-[2] rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                    placeholder="value"
                    aria-label={`Environment variable value ${i + 1}`}
                    value={row.value}
                    onChange={(e) => setPair(i, { value: e.target.value })}
                  />
                  <button
                    type="button"
                    className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    onClick={() => removeRow(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="self-start rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              onClick={addRow}
            >
              Add variable
            </button>
            {typeof envErr?.message === "string" && (
              <p
                id={`${formId}-environmentVariables-err`}
                className="text-xs text-red-600"
                role="alert"
              >
                {envErr.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
