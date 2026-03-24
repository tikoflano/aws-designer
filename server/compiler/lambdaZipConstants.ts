/** Lambda direct-upload zip limit (aligned with AWS). */
export const LAMBDA_ZIP_MAX_BYTES = 50 * 1024 * 1024;

const MAX_SEGMENT_LEN = 128;

/**
 * Sanitize graph/node ids for local filenames (no path separators).
 */
export function safeLambdaAssetSegment(id: string): string {
  const s = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (s.length === 0) return "_";
  return s.length > MAX_SEGMENT_LEN ? s.slice(0, MAX_SEGMENT_LEN) : s;
}

export function lambdaDeploymentZipFileName(graphId: string, nodeId: string): string {
  return `${safeLambdaAssetSegment(graphId)}__${safeLambdaAssetSegment(nodeId)}.zip`;
}
