import { existsSync } from "node:fs";

import type { GraphDocument } from "@shared/domain/graph.ts";
import { migrateLegacyGraphDocument } from "@shared/domain/migrateLegacyGraph.ts";

import { absolutePathToLambdaDeploymentZip } from "./lambdaZipPaths.ts";
import { lambdaNodeConfigSchema } from "./nodeHandlers/lambda/v1/lambdaService.definition.ts";

export function graphHasUploadedLambdaZip(doc: GraphDocument): boolean {
  const graph = migrateLegacyGraphDocument(doc);
  for (const node of graph.nodes) {
    if (node.serviceId !== "lambda") continue;
    try {
      const cfg = lambdaNodeConfigSchema.parse(node.config);
      if (cfg.codeSource.type === "uploadedZip") return true;
    } catch {
      continue;
    }
  }
  return false;
}

export type LambdaZipIssue = {
  code: string;
  message: string;
  nodeId?: string;
};

/**
 * Ensures each Lambda with `codeSource.type === "uploadedZip"` has a zip on disk under `assetsRoot`.
 */
export function issuesForMissingLambdaZips(
  doc: GraphDocument,
  graphId: string,
  assetsRoot: string,
): LambdaZipIssue[] {
  const graph = migrateLegacyGraphDocument(doc);
  const issues: LambdaZipIssue[] = [];

  for (const node of graph.nodes) {
    if (node.serviceId !== "lambda") continue;
    let cfg: ReturnType<typeof lambdaNodeConfigSchema.parse>;
    try {
      cfg = lambdaNodeConfigSchema.parse(node.config);
    } catch {
      continue;
    }
    if (cfg.codeSource.type !== "uploadedZip") continue;
    const p = absolutePathToLambdaDeploymentZip(assetsRoot, graphId, node.id);
    if (!existsSync(p)) {
      issues.push({
        code: "lambda_zip_missing",
        message:
          "This function uses an uploaded deployment package, but no zip was found on the server. Upload a .zip or switch to inline code.",
        nodeId: node.id,
      });
    }
  }

  return issues;
}
