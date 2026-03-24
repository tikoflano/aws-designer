import type { GraphDocument, GraphEdge, GraphNode } from "./graph.ts";

/**
 * Maps deprecated `sns` nodes to `sns_standard` or `sns_fifo` (API / stored graphs).
 * Drops legacy `labelOffset` (free placement); use `labelAlongPath` only.
 */
export function migrateLegacyGraphDocument(doc: GraphDocument): GraphDocument {
  return {
    nodes: doc.nodes.map(migrateSnsNode),
    edges: doc.edges.map(migrateEdge),
  };
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
