import { useEffect, useState } from "react";

import {
  DEFINITION_VERSION_V1,
  getService,
  listIncomingRelationships,
  listOutgoingRelationships,
  type RelationshipDefinition,
  type ServiceId,
} from "@compiler/catalog.ts";

import { DirectionBadge } from "../relationship/RelationshipPicker";

type DirectionFilter = "both" | "outgoing" | "incoming";

const FILTER_BASE =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors";
const FILTER_ACTIVE =
  `${FILTER_BASE} border border-orange-600 bg-amber-50 text-orange-950 shadow-sm`;
const FILTER_INACTIVE =
  `${FILTER_BASE} border border-transparent text-orange-800 hover:bg-orange-200/60`;

type Props = {
  open: boolean;
  serviceId: ServiceId | null;
  onClose: () => void;
};

export function ServiceConnectionsModal({ open, serviceId, onClose }: Props) {
  const [filter, setFilter] = useState<DirectionFilter>("both");

  useEffect(() => {
    if (open && serviceId) setFilter("both");
  }, [open, serviceId]);

  if (!open || !serviceId) return null;

  const svc = getService(serviceId, DEFINITION_VERSION_V1);
  const label = svc?.displayName ?? serviceId;

  const outgoing = listOutgoingRelationships(serviceId);
  const incoming = listIncomingRelationships(serviceId);

  const items: { def: RelationshipDefinition }[] = [];
  if (filter === "both" || filter === "outgoing") {
    for (const r of outgoing) items.push({ def: r });
  }
  if (filter === "both" || filter === "incoming") {
    for (const r of incoming) items.push({ def: r });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/35 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-2 border-orange-400 bg-linear-to-b from-orange-100 via-amber-50 to-orange-50 shadow-2xl ring-2 ring-orange-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-connections-title"
      >
        <div className="border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-3">
          <h2
            id="service-connections-title"
            className="text-base font-semibold text-orange-950"
          >
            Available connections
          </h2>
          <p className="mt-0.5 text-sm text-orange-900">{label}</p>

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
              className={
                filter === "outgoing" ? FILTER_ACTIVE : FILTER_INACTIVE
              }
              onClick={() => setFilter("outgoing")}
            >
              {label} → others
            </button>
            <button
              type="button"
              className={
                filter === "incoming" ? FILTER_ACTIVE : FILTER_INACTIVE
              }
              onClick={() => setFilter("incoming")}
            >
              Others → {label}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-amber-50 p-3">
          {items.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-slate-600">
              No catalog relationships for the selected direction.
            </p>
          ) : (
            <ul className="flex list-none flex-col gap-2 p-0">
              {items.map(({ def: r }) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-1.5 rounded-lg border border-orange-200 bg-white px-3.5 py-3 text-left shadow-sm"
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
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t-2 border-orange-400 bg-orange-200 px-4 py-3">
          <button
            type="button"
            className="rounded-md border-2 border-orange-600 bg-amber-50 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
