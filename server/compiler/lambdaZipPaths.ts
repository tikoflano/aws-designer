import { join } from "node:path";

import { lambdaDeploymentZipFileName } from "./lambdaZipConstants.ts";

export function absolutePathToLambdaDeploymentZip(
  assetsRoot: string,
  graphId: string,
  nodeId: string,
): string {
  return join(assetsRoot, lambdaDeploymentZipFileName(graphId, nodeId));
}
