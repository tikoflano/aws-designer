import type { GraphDocument } from "../domain/types";
import type { CompileIssue, CompileResult, InfrastructureFragment } from "../ir/types";
import { mergeFragments } from "../merge/mergeFragments";
import { getRelationship } from "../registry/relationships";
import { getService } from "../registry/services";

function nodeById(doc: GraphDocument, id: string) {
  return doc.nodes.find((n) => n.id === id);
}

export function compileGraph(doc: GraphDocument): CompileResult {
  const issues: CompileIssue[] = [];
  const fragments: InfrastructureFragment[] = [];

  for (const node of doc.nodes) {
    const svc = getService(node.serviceId, node.serviceVersion);
    if (!svc) {
      issues.push({
        code: "unknown_service_version",
        message: `Unknown service "${node.serviceId}" version "${node.serviceVersion}".`,
        nodeId: node.id,
      });
      continue;
    }
    try {
      fragments.push(svc.expandBase(node));
    } catch (e) {
      issues.push({
        code: "invalid_node_config",
        message:
          e instanceof Error
            ? e.message
            : "Invalid configuration for service node.",
        nodeId: node.id,
      });
    }
  }

  for (const edge of doc.edges) {
    const sourceNode = nodeById(doc, edge.sourceNodeId);
    const targetNode = nodeById(doc, edge.targetNodeId);
    if (!sourceNode || !targetNode) {
      issues.push({
        code: "edge_missing_node",
        message: "Edge references a node that does not exist.",
        edgeId: edge.id,
      });
      continue;
    }
    const rel = getRelationship(edge.relationshipId, edge.relationshipVersion);
    if (!rel) {
      issues.push({
        code: "unknown_relationship_version",
        message: `Unknown relationship "${edge.relationshipId}" version "${edge.relationshipVersion}".`,
        edgeId: edge.id,
      });
      continue;
    }
    if (
      rel.source !== sourceNode.serviceId ||
      rel.target !== targetNode.serviceId
    ) {
      issues.push({
        code: "relationship_direction_mismatch",
        message: `Relationship "${rel.id}" expects ${rel.source} → ${rel.target}, but edge connects ${sourceNode.serviceId} → ${targetNode.serviceId}.`,
        edgeId: edge.id,
      });
      continue;
    }
    try {
      fragments.push(
        rel.expand({ edge, sourceNode, targetNode }),
      );
    } catch (e) {
      issues.push({
        code: "invalid_edge_config",
        message:
          e instanceof Error
            ? e.message
            : "Invalid configuration for relationship edge.",
        edgeId: edge.id,
      });
    }
  }

  try {
    const ir = mergeFragments(fragments);
    return {
      ok: issues.length === 0,
      ir,
      issues,
    };
  } catch (e) {
    issues.push({
      code: "merge_failed",
      message: e instanceof Error ? e.message : "Failed to merge infrastructure fragments.",
    });
    return { ok: false, ir: null, issues };
  }
}
