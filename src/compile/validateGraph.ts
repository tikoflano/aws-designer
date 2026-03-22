import type { GraphDocument } from "../domain/types";
import {
  getRelationship,
  lambdaReadsS3ConfigSchema,
  lambdaWritesS3ConfigSchema,
  s3TriggersLambdaConfigSchema,
} from "../registry/relationships";
import {
  getService,
  lambdaNodeConfigSchema,
  logicalBucketId,
  s3NodeConfigSchema,
} from "../registry/services";
import type { CompileIssue, ValidateGraphResult } from "./types";

function nodeById(doc: GraphDocument, id: string) {
  return doc.nodes.find((n) => n.id === id);
}

/**
 * Validates node/edge shapes, known service and relationship versions, and Zod configs.
 * Used by the UI and by the Node CDK compiler before synthesis.
 */
export function validateGraph(doc: GraphDocument): ValidateGraphResult {
  const issues: CompileIssue[] = [];
  const bucketLogicalIds = new Set<string>();

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
      if (node.serviceId === "s3") {
        s3NodeConfigSchema.parse(node.config);
        bucketLogicalIds.add(logicalBucketId(node.id));
      } else {
        lambdaNodeConfigSchema.parse(node.config);
      }
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
      if (rel.id === "lambda_reads_s3") {
        lambdaReadsS3ConfigSchema.parse(edge.config);
      } else if (rel.id === "lambda_writes_s3") {
        lambdaWritesS3ConfigSchema.parse(edge.config);
      } else if (rel.id === "s3_triggers_lambda") {
        s3TriggersLambdaConfigSchema.parse(edge.config);
        const b = logicalBucketId(sourceNode.id);
        if (!bucketLogicalIds.has(b)) {
          issues.push({
            code: "notification_without_bucket",
            message: `S3 notification references bucket for node "${sourceNode.id}" but that bucket was not created (missing or invalid S3 node).`,
            edgeId: edge.id,
          });
        }
      }
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

  return {
    ok: issues.length === 0,
    issues,
  };
}
