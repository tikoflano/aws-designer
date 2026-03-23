import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { GraphSummary } from "../../api/graphApi";
import { listGraphs, listGraphVersions } from "../../api/graphApi";
import { useGraphStore } from "../../state/graphStore";

type Step = "list" | "versions";

/** Matches RelationshipPicker / app modal conventions (see agents.md — Design). */
const overlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-orange-950/35 p-4 backdrop-blur-sm";
const panelClass =
  "flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-2 border-orange-400 bg-linear-to-b from-orange-100 via-amber-50 to-orange-50 shadow-2xl ring-2 ring-orange-300";
const headerClass =
  "flex shrink-0 items-start justify-between gap-2 border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-3";
const titleClass = "text-base font-semibold text-orange-950";
const footerClass =
  "flex shrink-0 items-center gap-2 border-t-2 border-orange-400 bg-orange-200 px-4 py-3";
const footerButtonClass =
  "rounded-md border-2 border-orange-600 bg-amber-50 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-100 disabled:opacity-50";
const listRowButtonClass =
  "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-orange-200 disabled:opacity-50";
const listUlClass = "min-h-0 flex-1 divide-y divide-orange-200 overflow-y-auto bg-amber-50";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

function graphDisplayName(g: GraphSummary): string {
  const t = g.title.trim();
  if (t) return t;
  return `Graph ${g.id.slice(0, 8)}…`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onLoaded: () => void;
};

export function LoadGraphFromServerDialog({
  open,
  onClose,
  onLoaded,
}: Props) {
  const loadFromServer = useGraphStore((s) => s.loadFromServer);

  const [step, setStep] = useState<Step>("list");
  const [graphs, setGraphs] = useState<GraphSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const [picked, setPicked] = useState<GraphSummary | null>(null);
  const [versions, setVersions] = useState<
    { version: number; updatedAt: string }[] | null
  >(null);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [loadBusy, setLoadBusy] = useState(false);
  const versionsFetchTokenRef = useRef(0);

  const reset = useCallback(() => {
    versionsFetchTokenRef.current += 1;
    setStep("list");
    setGraphs(null);
    setListError(null);
    setListLoading(false);
    setPicked(null);
    setVersions(null);
    setVersionsError(null);
    setVersionsLoading(false);
    setLoadBusy(false);
  }, []);

  const fetchGraphs = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await listGraphs();
      setGraphs(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
      setGraphs(null);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reset();
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    void (async () => {
      try {
        const data = await listGraphs();
        if (!cancelled) setGraphs(data);
      } catch (e) {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : String(e));
          setGraphs(null);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const openVersions = useCallback(async (g: GraphSummary) => {
    const graphId = g.id;
    const token = ++versionsFetchTokenRef.current;
    setPicked(g);
    setStep("versions");
    setVersions(null);
    setVersionsError(null);
    setVersionsLoading(true);
    try {
      const v = await listGraphVersions(graphId);
      if (versionsFetchTokenRef.current !== token) return;
      setVersions(v);
    } catch (e) {
      if (versionsFetchTokenRef.current !== token) return;
      setVersionsError(e instanceof Error ? e.message : String(e));
      setVersions(null);
    } finally {
      if (versionsFetchTokenRef.current === token) {
        setVersionsLoading(false);
      }
    }
  }, []);

  const goBack = useCallback(() => {
    versionsFetchTokenRef.current += 1;
    setStep("list");
    setPicked(null);
    setVersions(null);
    setVersionsError(null);
    setVersionsLoading(false);
  }, []);

  const onLoadLatest = useCallback(async () => {
    if (!picked) return;
    setVersionsError(null);
    setLoadBusy(true);
    try {
      await loadFromServer(picked.id);
      onLoaded();
      onClose();
    } catch (e) {
      setVersionsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadBusy(false);
    }
  }, [picked, loadFromServer, onLoaded, onClose]);

  const onLoadVersion = useCallback(
    async (versionSeq: number) => {
      if (!picked) return;
      setVersionsError(null);
      setLoadBusy(true);
      try {
        await loadFromServer(picked.id, versionSeq);
        onLoaded();
        onClose();
      } catch (e) {
        setVersionsError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadBusy(false);
      }
    },
    [picked, loadFromServer, onLoaded, onClose],
  );

  if (!open) return null;

  if (typeof document === "undefined") return null;

  const latestSeq =
    versions && versions.length > 0
      ? Math.max(...versions.map((v) => v.version))
      : null;
  const olderSorted =
    latestSeq === null || !versions
      ? []
      : [...versions]
          .filter((v) => v.version !== latestSeq)
          .sort((a, b) => b.version - a.version);

  const latestRow =
    latestSeq !== null && versions
      ? versions.find((v) => v.version === latestSeq)
      : undefined;

  return createPortal(
    <div
      className={overlayClass}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="load-graph-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={headerClass}>
          <div className="min-w-0 flex-1">
            <h2 id="load-graph-dialog-title" className={titleClass}>
              {step === "list"
                ? "Load from server"
                : `Versions — ${picked ? graphDisplayName(picked) : ""}`}
            </h2>
            {step === "versions" && picked ? (
              <p className="mt-1 truncate text-sm font-medium text-orange-900 tabular-nums">
                {picked.id}
              </p>
            ) : null}
          </div>
        </div>

        {step === "list" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {listLoading ? (
              <div className="bg-amber-50 px-4 py-8 text-center text-sm text-slate-700">
                Loading graphs…
              </div>
            ) : listError ? (
              <div className="flex flex-col gap-3 bg-amber-50 px-4 py-6">
                <p className="text-sm text-red-800">{listError}</p>
                <button
                  type="button"
                  className={`self-start ${footerButtonClass}`}
                  onClick={() => void fetchGraphs()}
                >
                  Retry
                </button>
              </div>
            ) : graphs && graphs.length === 0 ? (
              <div className="bg-amber-50 px-4 py-8 text-center text-sm text-slate-700">
                No saved graphs on the server yet.
              </div>
            ) : (
              <ul className={listUlClass}>
                {graphs?.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={listRowButtonClass}
                      disabled={listLoading}
                      onClick={() => void openVersions(g)}
                    >
                      <span className="text-sm font-medium text-slate-900">
                        {graphDisplayName(g)}
                      </span>
                      <span className="text-xs text-slate-600 tabular-nums">
                        Last saved {formatUpdatedAt(g.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={footerClass}>
              <button
                type="button"
                className={`ml-auto ${footerButtonClass}`}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {versionsLoading ? (
              <div className="bg-amber-50 px-4 py-8 text-center text-sm text-slate-700">
                Loading versions…
              </div>
            ) : versionsError && !versions ? (
              <div className="flex flex-col gap-3 bg-amber-50 px-4 py-6">
                <p className="text-sm text-red-800">{versionsError}</p>
                <button
                  type="button"
                  className={`self-start ${footerButtonClass}`}
                  onClick={() => picked && void openVersions(picked)}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {versionsError ? (
                  <p className="shrink-0 border-b-2 border-orange-300 bg-orange-100 px-4 py-2 text-sm text-orange-950">
                    {versionsError}
                  </p>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto bg-amber-50">
                  {latestSeq !== null && latestRow ? (
                    <button
                      type="button"
                      className={`border-b border-orange-200 ${listRowButtonClass}`}
                      disabled={loadBusy}
                      onClick={() => void onLoadLatest()}
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        Latest (v{latestSeq})
                      </span>
                      <span className="text-xs text-slate-600 tabular-nums">
                        {formatUpdatedAt(latestRow.updatedAt)}
                      </span>
                    </button>
                  ) : null}
                  {olderSorted.length > 0 ? (
                    <p className="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-orange-800 uppercase">
                      Older snapshots
                    </p>
                  ) : null}
                  <ul className="divide-y divide-orange-200">
                    {olderSorted.map((v) => (
                      <li key={v.version}>
                        <button
                          type="button"
                          className={listRowButtonClass}
                          disabled={loadBusy}
                          onClick={() => void onLoadVersion(v.version)}
                        >
                          <span className="text-sm font-medium text-slate-900">
                            Version {v.version}
                          </span>
                          <span className="text-xs text-slate-600 tabular-nums">
                            {formatUpdatedAt(v.updatedAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={footerClass}>
                  <button
                    type="button"
                    className={footerButtonClass}
                    disabled={loadBusy}
                    onClick={goBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={`ml-auto ${footerButtonClass}`}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
