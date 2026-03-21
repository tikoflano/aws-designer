import type { RelationshipDefinition } from "../../registry/relationships";

type Props = {
  open: boolean;
  relationships: RelationshipDefinition[];
  onCancel: () => void;
  onSelect: (relationshipId: string) => void;
};

export function RelationshipPicker({
  open,
  relationships,
  onCancel,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-picker-title"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2
            id="relationship-picker-title"
            className="text-base font-semibold text-slate-900"
          >
            Choose relationship
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick how these two services are connected. Direction matters: from
            source handle to target handle.
          </p>
        </div>
        {relationships.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-600">
            No curated relationships exist for this pair. Try reversing the
            connection direction.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {relationships.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-slate-50"
                  onClick={() => onSelect(r.id)}
                >
                  <span className="text-sm font-medium text-slate-900">
                    {r.name}{" "}
                    <span className="font-normal text-slate-500">v{r.version}</span>
                  </span>
                  <span className="text-xs text-slate-600">{r.description}</span>
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    {r.source} → {r.target}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
