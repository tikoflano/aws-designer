import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import archiver from "archiver";
import { App } from "aws-cdk-lib";

import type { GraphDocument } from "@shared/domain/graph.ts";
import { validateGraph } from "../compiler/validateGraph.ts";
import { GraphCompilerStack } from "../compiler/graphCompilerStack.ts";

/**
 * Zips a directory into a buffer (zip archive).
 */
export function zipDirectoryToBuffer(dir: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", reject);
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    function addDir(absPath: string, entryPrefix: string) {
      for (const name of readdirSync(absPath)) {
        const full = join(absPath, name);
        const rel = entryPrefix ? `${entryPrefix}/${name}` : name;
        const st = statSync(full);
        if (st.isDirectory()) {
          addDir(full, rel);
        } else {
          archive.append(readFileSync(full), { name: rel });
        }
      }
    }

    addDir(dir, "");
    void archive.finalize();
  });
}

export function synthGraphToCdkOut(graph: GraphDocument): {
  ok: true;
  dir: string;
  cleanup: () => void;
} | {
  ok: false;
  issues: { code: string; message: string; nodeId?: string; edgeId?: string }[];
} {
  const validation = validateGraph(graph);
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }

  const root = mkdtempSync(join(tmpdir(), "aws-designer-cdk-"));
  const outdir = join(root, "cdk.out");
  const app = new App({ outdir });
  new GraphCompilerStack(app, "DesignerGraphStack", {
    graph,
    description: "Synthesized from aws_designer API",
  });
  app.synth();

  return {
    ok: true,
    dir: outdir,
    cleanup: () => {
      try {
        rmSync(root, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

export async function synthGraphToZipBuffer(
  graph: GraphDocument,
): Promise<
  | { ok: true; buffer: Buffer }
  | { ok: false; issues: { code: string; message: string }[] }
> {
  const result = synthGraphToCdkOut(graph);
  if (!result.ok) {
    return result;
  }
  try {
    const buffer = await zipDirectoryToBuffer(result.dir);
    return { ok: true, buffer };
  } finally {
    result.cleanup();
  }
}
