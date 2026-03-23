import type { RelationshipDefinition } from "@compiler/catalog.ts";

import { HelpInfoPopover } from "../common/HelpInfoPopover";

type Props = {
  open: boolean;
  /** Click order: first node’s service, then second (shown in modal title). */
  fromServiceId?: string;
  toServiceId?: string;
  relationships: RelationshipDefinition[];
  onCancel: () => void;
  onSelect: (relationshipId: string) => void;
};

function formatServiceLabel(id: string): string {
  if (id === "s3") return "S3";
  if (id === "lambda") return "Lambda";
  if (id === "cloudfront") return "CloudFront";
  if (id === "route53") return "Route 53";
  return id;
}

export function RelationshipPicker({
  open,
  fromServiceId,
  toServiceId,
  relationships,
  onCancel,
  onSelect,
}: Props) {
  if (!open) return null;

  const directionInTitle =
    fromServiceId && toServiceId
      ? `${formatServiceLabel(fromServiceId)} → ${formatServiceLabel(toServiceId)}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/35 p-4 backdrop-blur-sm">
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-orange-400 bg-linear-to-b from-orange-100 via-amber-50 to-orange-50 shadow-2xl ring-2 ring-orange-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-picker-title"
      >
        <div className="flex items-start justify-between gap-2 border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2
              id="relationship-picker-title"
              className="text-base font-semibold text-orange-950"
            >
              Choose relationship
            </h2>
            {directionInTitle ? (
              <p className="mt-1 text-sm font-medium text-orange-900 tabular-nums">
                {directionInTitle}
              </p>
            ) : null}
          </div>
          <HelpInfoPopover
            ariaLabel="How relationships work"
            title="How relationships work"
            variant="warm"
          >
            <p>
              Relationships follow the order you picked: first node → second
              node. To connect S3 to Lambda instead, cancel and click the S3
              node first.
            </p>
          </HelpInfoPopover>
        </div>
        {relationships.length === 0 ? (
          <div className="bg-amber-50 px-4 py-6 text-sm text-slate-700">
            No curated relationships exist for this pair. Try connecting the
            other node first, then the second.
          </div>
        ) : (
          <ul className="divide-y divide-orange-200 bg-amber-50">
            {relationships.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-orange-200"
                  onClick={() => onSelect(r.id)}
                >
                  <span className="text-sm font-medium text-slate-900">
                    {r.name}
                  </span>
                  <span className="text-xs text-slate-600">{r.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 border-t-2 border-orange-400 bg-orange-200 px-4 py-3">
          <button
            type="button"
            className="rounded-md border-2 border-orange-600 bg-amber-50 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-100"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
