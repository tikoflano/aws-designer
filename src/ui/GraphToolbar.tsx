import { useCallback, useRef, type ChangeEvent } from "react";

import { generateCdkFromGraph } from "../compile/generateCdkFromGraph";
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
  const replaceFromGraphDocument = useGraphStore(
    (s) => s.replaceFromGraphDocument,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const exportCdkStack = useCallback(() => {
    const result = generateCdkFromGraph({ nodes, edges });
    if (!result.ok) {
      const lines = result.issues.map((i) => `• ${i.message}`).join("\n");
      window.alert(`Compile failed. Fix issues before exporting CDK.\n\n${lines}`);
      return;
    }
    downloadTextFile(
      "GeneratedGraphStack.ts",
      result.cdkSource,
      "text/typescript;charset=utf-8",
    );
  }, [nodes, edges]);

  return (
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
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
        onClick={exportCdkStack}
      >
        Download CDK stack (.ts)
      </button>
    </div>
  );
}
