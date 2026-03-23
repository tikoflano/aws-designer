import { useCallback, useRef, useState, type ChangeEvent } from "react";

import { compiledDownloadUrl } from "../api/graphApi";
import {
  graphDocumentToFile,
  graphFileToDocument,
  parseGraphFileJson,
  serializeGraphFile,
} from "../graph/graphFile";
import { useGraphStore } from "../state/graphStore";
import { downloadTextFile } from "./download";

export function GraphToolbar() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const serverGraphId = useGraphStore((s) => s.serverGraphId);
  const serverUpdatedAt = useGraphStore((s) => s.serverUpdatedAt);
  const serverVersion = useGraphStore((s) => s.serverVersion);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const saveError = useGraphStore((s) => s.saveError);
  const replaceFromGraphDocument = useGraphStore(
    (s) => s.replaceFromGraphDocument,
  );
  const saveToServer = useGraphStore((s) => s.saveToServer);
  const loadFromServer = useGraphStore((s) => s.loadFromServer);
  const newLocalGraph = useGraphStore((s) => s.newLocalGraph);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadId, setLoadId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

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
      } catch (e) {
        window.alert(
          e instanceof Error
            ? e.message
            : "Invalid graph JSON. Expected formatVersion 1 aws-designer-graph file.",
        );
      }
    },
    [replaceFromGraphDocument],
  );

  const onImportButtonClick = useCallback(() => {
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

  const onSave = useCallback(async () => {
    await saveToServer();
  }, [saveToServer]);

  const onLoad = useCallback(async () => {
    const id = loadId.trim();
    if (!id) return;
    setLoadError(null);
    try {
      await loadFromServer(id);
      setLoadId("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [loadId, loadFromServer]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          onClick={exportGraphJson}
        >
          Export graph JSON
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          onClick={onImportButtonClick}
        >
          Import graph JSON
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={() => void onSave()}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving…" : "Save to server"}
        </button>
        <button
          type="button"
          className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          onClick={() => {
            if (
              window.confirm(
                "Start a new local graph? Unsaved server changes are still on the server; local draft will be cleared.",
              )
            ) {
              newLocalGraph();
            }
          }}
        >
          New local graph
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-xs text-slate-600">
          Load graph id
          <input
            className="w-48 rounded border border-slate-200 px-2 py-1 text-sm"
            value={loadId}
            onChange={(e) => setLoadId(e.target.value)}
            placeholder="uuid"
          />
        </label>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          onClick={() => void onLoad()}
        >
          Load
        </button>
        {serverGraphId && (
          <a
            className="text-xs font-medium text-violet-700 underline"
            href={compiledDownloadUrl(serverGraphId)}
            target="_blank"
            rel="noreferrer"
          >
            Download cdk.out (zip)
          </a>
        )}
      </div>
      {(serverGraphId || serverUpdatedAt != null) && (
        <p className="text-[11px] text-slate-500">
          Server:{" "}
          <span className="font-mono text-slate-700">
            {serverGraphId ?? "—"}
          </span>
          {serverVersion != null && (
            <> · v{serverVersion} · {serverUpdatedAt}</>
          )}
        </p>
      )}
      {saveStatus === "saved" && (
        <p className="text-[11px] text-emerald-700">Saved to server.</p>
      )}
      {saveStatus === "error" && saveError && (
        <p className="text-[11px] text-red-700">Save failed: {saveError}</p>
      )}
      {loadError && (
        <p className="text-[11px] text-red-700">Load failed: {loadError}</p>
      )}
      <p className="text-[11px] text-slate-500">
        Draft (nodes/edges) syncs to browser local storage on each edit. Use
        Save to append a new version on the server.
      </p>
    </div>
  );
}
