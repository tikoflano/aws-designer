import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { toast, Toaster } from "sonner";

import { useGraphStore } from "../state/graphStore";
import { listRelationships } from "@compiler/catalog.ts";
import { FlowCanvas } from "./flow/FlowCanvas";
import { InspectorPanel } from "./inspector/InspectorPanel";
import { GraphToasts } from "./notifications/GraphToasts";
import { ServicePalette } from "./palette/ServicePalette";
import { RelationshipPicker } from "./relationship/RelationshipPicker";

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function GraphHeaderTitle() {
  const graphTitle = useGraphStore((s) => s.graphTitle);
  const commitGraphTitle = useGraphStore((s) => s.commitGraphTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  const displayTitle = graphTitle.trim() || "Untitled";

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const finishEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const commit = useCallback(async () => {
    try {
      const { savedToServer } = await commitGraphTitle(draft);
      if (savedToServer) {
        toast.success("Title saved");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
    finishEditing();
  }, [commitGraphTitle, draft, finishEditing]);

  const cancelEditing = useCallback(() => {
    skipBlurCommitRef.current = true;
    finishEditing();
  }, [finishEditing]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        skipBlurCommitRef.current = true;
        void commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditing();
      }
    },
    [cancelEditing, commit],
  );

  const onBlur = useCallback(() => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    void commit();
  }, [commit]);

  const actionBtnClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded text-orange-900/80 hover:bg-orange-950/10 hover:text-orange-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-700";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 text-sm font-semibold leading-none text-orange-950">
        AWS Designer —
      </span>
      <div className="flex min-h-7 min-w-0 flex-1 items-center">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="box-border h-7 w-full min-w-0 rounded border border-orange-800/30 bg-white/80 px-2 py-0 text-sm font-semibold leading-none text-orange-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            aria-label="Graph title"
          />
        ) : (
          <h1 className="flex min-h-7 w-full min-w-0 items-center py-0 text-sm font-semibold leading-none text-orange-950">
            <span className="min-w-0 truncate">{displayTitle}</span>
          </h1>
        )}
      </div>
      {editing ? (
        <button
          type="button"
          className={actionBtnClass}
          aria-label="Cancel editing title"
          onMouseDown={(e) => {
            e.preventDefault();
            cancelEditing();
          }}
        >
          <IconX className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          className={actionBtnClass}
          aria-label="Edit graph title"
          onClick={() => {
            setDraft(graphTitle);
            setEditing(true);
          }}
        >
          <IconPencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function App() {
  const [servicePaletteOpen, setServicePaletteOpen] = useState(true);

  const graphTitle = useGraphStore((s) => s.graphTitle);
  useEffect(() => {
    const display = graphTitle.trim() || "Untitled";
    document.title = `AWS Designer — ${display}`;
  }, [graphTitle]);

  const pendingConnection = useGraphStore((s) => s.pendingConnection);
  const nodes = useGraphStore((s) => s.nodes);
  const cancelPendingConnection = useGraphStore((s) => s.cancelPendingConnection);
  const confirmRelationship = useGraphStore((s) => s.confirmRelationship);

  const sourceNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.sourceNodeId)
    : undefined;
  const targetNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.targetNodeId)
    : undefined;

  const options =
    sourceNode && targetNode
      ? listRelationships(sourceNode.serviceId, targetNode.serviceId)
      : [];

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <Toaster
        position="bottom-right"
        theme="light"
        closeButton
        toastOptions={{
          classNames: {
            // Sonner injects background/border on [data-styled]; ! overrides so header-matching orange shows through.
            toast:
              "!border-2 !border-orange-400 !bg-linear-to-r !from-orange-300 !to-amber-200 !text-orange-950 !shadow-lg",
            title: "!text-orange-950",
            description: "!text-orange-950/80",
            icon: "!text-orange-900",
            closeButton:
              "!border !border-orange-400/60 !bg-white/50 !text-orange-950 hover:!bg-white/80",
            success: "!border-orange-500",
            error:
              "!border-orange-800 !from-orange-200 !to-amber-100",
          },
        }}
      />
      <GraphToasts />
      <header className="flex items-center border-b-2 border-orange-400 bg-linear-to-r from-orange-300 to-amber-200 px-4 py-2.5 shadow-sm">
        <GraphHeaderTitle />
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        {servicePaletteOpen ? <ServicePalette /> : null}
        <FlowCanvas
          servicePaletteOpen={servicePaletteOpen}
          onToggleServicePalette={() =>
            setServicePaletteOpen((open) => !open)
          }
        />
        <InspectorPanel />
      </div>
      <RelationshipPicker
        open={Boolean(pendingConnection)}
        fromServiceId={sourceNode?.serviceId}
        toServiceId={targetNode?.serviceId}
        relationships={options}
        onCancel={() => cancelPendingConnection()}
        onSelect={(relationshipId) => confirmRelationship(relationshipId)}
      />
    </div>
  );
}
