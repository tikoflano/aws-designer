import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  LAMBDA_ZIP_MAX_BYTES,
  lambdaDeploymentZipFileName,
  safeLambdaAssetSegment,
} from "../compiler/lambdaZipConstants.ts";

/** Default when running the API from the project root. */
export function getDefaultLambdaZipAssetsRoot(): string {
  return join(process.cwd(), "server", "data", "lambda-assets");
}

export function ensureLambdaZipAssetsDir(root: string = getDefaultLambdaZipAssetsRoot()): void {
  mkdirSync(root, { recursive: true });
}

export function pathForLambdaZip(
  graphId: string,
  nodeId: string,
  root: string = getDefaultLambdaZipAssetsRoot(),
): string {
  return join(root, lambdaDeploymentZipFileName(graphId, nodeId));
}

const ZIP_LOCAL_FILE_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function looksLikeZip(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_LOCAL_FILE_HEADER);
}

/**
 * Writes the deployment zip; replaces any existing file for the same graph+node.
 */
export function saveLambdaZipBuffer(
  graphId: string,
  nodeId: string,
  buffer: Buffer,
  root: string = getDefaultLambdaZipAssetsRoot(),
): void {
  if (buffer.length > LAMBDA_ZIP_MAX_BYTES) {
    throw new Error(`Zip exceeds maximum size of ${LAMBDA_ZIP_MAX_BYTES} bytes.`);
  }
  if (!looksLikeZip(buffer)) {
    throw new Error("File does not look like a zip (expected PK header).");
  }
  ensureLambdaZipAssetsDir(root);
  writeFileSync(pathForLambdaZip(graphId, nodeId, root), buffer);
}

export function removeLambdaZipsForGraph(
  graphId: string,
  root: string = getDefaultLambdaZipAssetsRoot(),
): void {
  if (!existsSync(root)) return;
  const prefix = `${safeLambdaAssetSegment(graphId)}__`;
  for (const name of readdirSync(root)) {
    if (name.startsWith(prefix) && name.endsWith(".zip")) {
      try {
        unlinkSync(join(root, name));
      } catch {
        /* ignore */
      }
    }
  }
}
