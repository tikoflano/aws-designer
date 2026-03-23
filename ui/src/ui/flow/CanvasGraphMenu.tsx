import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { toast } from "sonner";

import { fetchGraphCompiledZip } from "../../api/graphApi";
import {
  graphDocumentToFile,
  graphFileToDocument,
  parseGraphFileJson,
  serializeGraphFile,
} from "../../graph/graphFile";
import { useGraphStore } from "../../state/graphStore";
import { downloadBlobFile, downloadTextFile } from "../download";

const iconSvgProps = {
  xmlns: "http://www.w3.org/2000/svg" as const,
  viewBox: "0 0 24 24" as const,
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

/** New blank graph — document with plus */
function IconNewGraph({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
      <path d="M12 12v6" />
    </svg>
  );
}

/** Push to server — arrow up in circle */
function IconSaveServer({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8" />
      <path d="m8 12 4-4 4 4" />
    </svg>
  );
}

/** Pull from server — arrow down in circle */
function IconLoadServer({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="m8 12 4 4 4-4" />
    </svg>
  );
}

/** Export JSON — tray with down arrow */
function IconExport({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Import JSON — tray with up arrow */
function IconImport({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <path d="M12 21V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** cdk.out zip — archive box */
function IconCdkZip({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
      <path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
      <path d="M12 8v13" />
      <path d="m8 5 4-3 4 3" />
    </svg>
  );
}

const menuItemIconClass = "h-4 w-4 shrink-0 text-slate-500";

const menuItemClass =
  "flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50";

export function CanvasGraphMenu() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const serverGraphId = useGraphStore((s) => s.serverGraphId);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const replaceFromGraphDocument = useGraphStore(
    (s) => s.replaceFromGraphDocument,
  );
  const saveToServer = useGraphStore((s) => s.saveToServer);
  const loadFromServer = useGraphStore((s) => s.loadFromServer);
  const newLocalGraph = useGraphStore((s) => s.newLocalGraph);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cdkDownloadBusy, setCdkDownloadBusy] = useState(false);

  const exportGraphJson = useCallback(() => {
    const file = graphDocumentToFile({ nodes, edges });
    downloadTextFile(
      "aws-designer-graph.json",
      serializeGraphFile(file),
      "application/json",
    );
  }, [nodes, edges]);

  const importGraphFromText = useCallback(
    (text: string) => {
      try {
        const parsed = parseGraphFileJson(JSON.parse(text));
        replaceFromGraphDocument(graphFileToDocument(parsed));
        toast.success("Graph imported");
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : "Invalid graph JSON. Expected formatVersion 1 aws-designer-graph file.",
        );
      }
    },
    [replaceFromGraphDocument],
  );

  const onImportClick = useCallback(() => {
    setOpen(false);
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        importGraphFromText(String(reader.result ?? ""));
      };
      reader.readAsText(f);
    },
    [importGraphFromText],
  );

  const onLoadFromServer = useCallback(async () => {
    setOpen(false);
    const id = window.prompt("Graph ID (UUID)", "")?.trim();
    if (!id) return;
    try {
      await loadFromServer(id);
      toast.success("Graph loaded from server");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [loadFromServer]);

  const onDownloadCdkOut = useCallback(async () => {
    if (!serverGraphId) return;
    setCdkDownloadBusy(true);
    try {
      const { blob, filename } = await fetchGraphCompiledZip(serverGraphId);
      downloadBlobFile(filename, blob);
      setOpen(false);
      toast.success("cdk.out download started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCdkDownloadBusy(false);
    }
  }, [serverGraphId]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        className="rounded-md border border-slate-200 bg-white p-2 text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label="Graph menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <HamburgerIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              setOpen(false);
              if (
                window.confirm(
                  "Start a new local graph? Unsaved server changes are still on the server; local draft will be cleared.",
                )
              ) {
                newLocalGraph();
                toast.success("New local graph");
              }
            }}
          >
            <IconNewGraph className={menuItemIconClass} />
            <span>New graph</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            disabled={saveStatus === "saving"}
            onClick={() => {
              setOpen(false);
              void saveToServer();
            }}
          >
            <IconSaveServer className={menuItemIconClass} />
            <span>
              {saveStatus === "saving" ? "Saving…" : "Save to server"}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => void onLoadFromServer()}
          >
            <IconLoadServer className={menuItemIconClass} />
            <span>Load from server</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              setOpen(false);
              exportGraphJson();
              toast.success("Graph exported");
            }}
          >
            <IconExport className={menuItemIconClass} />
            <span>Export</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={onImportClick}
          >
            <IconImport className={menuItemIconClass} />
            <span>Import</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            disabled={!serverGraphId || cdkDownloadBusy}
            title={
              serverGraphId
                ? undefined
                : "Save the graph to the server first to download cdk.out"
            }
            onClick={() => void onDownloadCdkOut()}
          >
            <IconCdkZip className={menuItemIconClass} />
            <span>
              {cdkDownloadBusy ? "Compiling…" : "Download cdk.out"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
