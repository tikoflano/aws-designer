import { useState } from "react";

import {
  DEFINITION_VERSION_V1,
  getService,
  type RelationshipDefinition,
  type RelationshipId,
  type ServiceId,
} from "@compiler/catalog.ts";

type DirectionFilter = "both" | "forward" | "reverse";

type Props = {
  open: boolean;
  fromServiceId?: string;
  toServiceId?: string;
  forwardRelationships: RelationshipDefinition[];
  reverseRelationships: RelationshipDefinition[];
  onCancel: () => void;
  onSelect: (relationshipId: RelationshipId, reversed: boolean) => void;
};

function formatServiceLabel(id: string): string {
  return (
    getService(id as ServiceId, DEFINITION_VERSION_V1)?.displayName ?? id
  );
}

function DirectionBadge({
  source,
  target,
}: {
  source: string;
  target: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800">
      {formatServiceLabel(source)}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3 shrink-0"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
          clipRule="evenodd"
        />
      </svg>
      {formatServiceLabel(target)}
    </span>
  );
}

const FILTER_BASE =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";
const FILTER_ACTIVE =
  `${FILTER_BASE} border border-orange-600 bg-amber-50 text-orange-950 shadow-sm`;
const FILTER_INACTIVE =
  `${FILTER_BASE} border border-transparent text-orange-800 hover:bg-orange-200/60`;

export function RelationshipPicker({
  open,
  fromServiceId,
  toServiceId,
  forwardRelationships,
  reverseRelationships,
  onCancel,
  onSelect,
}: Props) {
  const [filter, setFilter] = useState<DirectionFilter>("both");

  if (!open) return null;

  const fromLabel = fromServiceId ? formatServiceLabel(fromServiceId) : "A";
  const toLabel = toServiceId ? formatServiceLabel(toServiceId) : "B";

  const items: { def: RelationshipDefinition; reversed: boolean }[] = [];
  if (filter === "both" || filter === "forward") {
    for (const r of forwardRelationships) items.push({ def: r, reversed: false });
  }
  if (filter === "both" || filter === "reverse") {
    for (const r of reverseRelationships) items.push({ def: r, reversed: true });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/35 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-2 border-orange-400 bg-linear-to-b from-orange-100 via-amber-50 to-orange-50 shadow-2xl ring-2 ring-orange-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-picker-title"
      >
        {/* Header */}
        <div className="border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-3">
          <h2
            id="relationship-picker-title"
            className="text-base font-semibold text-orange-950"
          >
            Choose relationship
          </h2>
          {fromServiceId && toServiceId ? (
            <p className="mt-0.5 text-sm text-orange-900">
              {fromLabel} &amp; {toLabel}
            </p>
          ) : null}

          {/* Direction filter */}
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className={filter === "both" ? FILTER_ACTIVE : FILTER_INACTIVE}
              onClick={() => setFilter("both")}
            >
              Both directions
            </button>
            <button
              type="button"
              className={filter === "forward" ? FILTER_ACTIVE : FILTER_INACTIVE}
              onClick={() => setFilter("forward")}
            >
              {fromLabel} → {toLabel}
            </button>
            <button
              type="button"
              className={filter === "reverse" ? FILTER_ACTIVE : FILTER_INACTIVE}
              onClick={() => setFilter("reverse")}
            >
              {toLabel} → {fromLabel}
            </button>
          </div>
        </div>

        {/* Relationship cards */}
        <div className="flex-1 overflow-y-auto bg-amber-50 p-3">
          {items.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-slate-600">
              No relationships available for the selected direction.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(({ def: r, reversed }) => (
                <button
                  key={`${r.id}-${reversed ? "r" : "f"}`}
                  type="button"
                  className="flex flex-col gap-1.5 rounded-lg border border-orange-200 bg-white px-3.5 py-3 text-left shadow-sm transition-colors hover:border-orange-400 hover:bg-orange-50"
                  onClick={() => onSelect(r.id as RelationshipId, reversed)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {r.name}
                    </span>
                    <DirectionBadge source={r.source} target={r.target} />
                  </div>
                  <span className="text-xs leading-relaxed text-slate-600">
                    {r.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
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
