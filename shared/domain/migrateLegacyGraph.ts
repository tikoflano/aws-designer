import type { GraphDocument, GraphEdge, GraphNode } from "./graph.ts";

const LEGACY_SEMVER_TO_INT: Record<string, number> = {
  "1.0.0": 1,
};

/**
 * Normalizes legacy semver or stringified integers to a positive definition version.
 * Returns 0 if the value cannot be mapped (validation should treat as unknown).
 */
export function normalizeDefinitionVersion(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const mapped = LEGACY_SEMVER_TO_INT[trimmed];
    if (mapped !== undefined) return mapped;
    const n = Number(trimmed);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return 0;
}

/**
 * Maps deprecated `sns` nodes to `sns_standard` or `sns_fifo` (API / stored graphs).
 * Drops legacy `labelOffset` (free placement); use `labelAlongPath` only.
 * Coerces legacy string semver versions on nodes/edges to integer definition versions.
 */
export function migrateLegacyGraphDocument(doc: GraphDocument): GraphDocument {
  const nodes = doc.nodes
    .map(migrateSnsNode)
    .map((n) => ({ ...n, serviceVersion: normalizeDefinitionVersion(n.serviceVersion) }));
  const edges = doc.edges
    .map(migrateEdge)
    .map((e) => ({
      ...e,
      relationshipVersion: normalizeDefinitionVersion(e.relationshipVersion),
    }));
  return { nodes, edges };
}

function migrateEdge(edge: GraphEdge): GraphEdge {
  if (!("labelOffset" in edge)) return edge;
  const copy = { ...edge } as GraphEdge & { labelOffset?: unknown };
  delete copy.labelOffset;
  return copy;
}

function migrateSnsNode(node: GraphNode): GraphNode {
  const sid = node.serviceId as string;
  if (sid !== "sns") return node;

  const cfg = { ...node.config };
  const topicType = String(cfg.topicType ?? "fifo");
  delete cfg.topicType;

  if (topicType === "standard") {
    delete cfg.fifoThroughputScope;
    return { ...node, serviceId: "sns_standard", config: cfg };
  }

  if (cfg.fifoThroughputScope === undefined) {
    cfg.fifoThroughputScope = "message_group";
  }
  return { ...node, serviceId: "sns_fifo", config: cfg };
}
