import type { RelationshipDefinition } from "@compiler/catalog.ts";
import { useEffect, useRef, useState } from "react";

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
  return id;
}

function InfoPopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-orange-900 hover:bg-orange-200 hover:text-orange-950"
        aria-expanded={open}
        aria-controls="relationship-picker-how-it-works"
        aria-label="How relationships work"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div
          id="relationship-picker-how-it-works"
          role="note"
          className="absolute right-0 top-full z-60 mt-1 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-orange-300 bg-linear-to-b from-amber-50 to-orange-100 p-3 text-sm leading-snug text-slate-700 shadow-lg"
        >
          <p className="font-medium text-orange-950">How relationships work</p>
          <p className="mt-2">
            Relationships follow the order you picked: first node → second node.
            To connect S3 to Lambda instead, cancel and click the S3 node first.
          </p>
        </div>
      ) : null}
    </div>
  );
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
          <InfoPopover />
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
