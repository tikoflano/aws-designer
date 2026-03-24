import type { CompileIssue, ValidateGraphResult } from "@shared/compile/types.ts";
import type { GraphDocument } from "@shared/domain/graph.ts";
import { migrateLegacyGraphDocument } from "@shared/domain/migrateLegacyGraph.ts";

import {
  EVENTBRIDGE_SCHEDULER_TARGET_RELATIONSHIP_IDS,
  RelationshipIds,
} from "./edgeHandlers/relationshipIds.ts";
import { eventbridgeSchedulerSendsSqsConfigSchema } from "./edgeHandlers/eventbridge-scheduler-to-sqs/v1/eventbridgeSchedulerSendsSqs.definition.ts";
import { getRelationship } from "./edgeHandlers/relationshipsCatalog.ts";
import { logicalBucketId } from "./nodeHandlers/s3/v1/s3Service.definition.ts";
import { sqsQueueNodeConfigSchema } from "./nodeHandlers/sqs/v1/sqsService.definition.ts";
import { domainInHostedZone } from "./nodeHandlers/route53/v1/route53Service.definition.ts";
import { getService } from "./nodeHandlers/servicesCatalog.ts";

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
  const validSecretsManagerNodeIds = new Set<string>();

  doc = migrateLegacyGraphDocument(doc);

  for (const node of doc.nodes) {
    const svc = getService(node.serviceId, node.serviceVersion);
    if (!svc) {
      issues.push({
        code: "unknown_service_version",
        message: `Unknown service "${node.serviceId}" version ${String(node.serviceVersion)}.`,
        nodeId: node.id,
      });
      continue;
    }
    try {
      svc.configSchema.parse(node.config);
      if (node.serviceId === "s3") {
        bucketLogicalIds.add(logicalBucketId(node.id));
      }
      if (node.serviceId === "secretsmanager") {
        validSecretsManagerNodeIds.add(node.id);
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
        message: `Unknown relationship "${edge.relationshipId}" version ${String(edge.relationshipVersion)}.`,
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
      rel.configSchema.parse(edge.config);
      if (rel.id === RelationshipIds.s3_triggers_lambda) {
        const b = logicalBucketId(sourceNode.id);
        if (!bucketLogicalIds.has(b)) {
          issues.push({
            code: "notification_without_bucket",
            message: `S3 notification references bucket for node "${sourceNode.id}" but that bucket was not created (missing or invalid S3 node).`,
            edgeId: edge.id,
          });
        }
      }
      if (
        rel.id === RelationshipIds.lambda_reads_secretsmanager ||
        rel.id === RelationshipIds.lambda_writes_secretsmanager
      ) {
        if (!validSecretsManagerNodeIds.has(targetNode.id)) {
          issues.push({
            code: "lambda_secret_edge_without_secret",
            message: `Lambda–Secrets Manager edge targets node "${targetNode.id}" but that node is not a valid Secrets Manager node (missing or invalid config).`,
            edgeId: edge.id,
          });
        }
      }
      if (rel.id === RelationshipIds.sqs_subscribes_sns_fifo) {
        const q = sqsQueueNodeConfigSchema.safeParse(sourceNode.config);
        if (q.success && q.data.queueType !== "fifo") {
          issues.push({
            code: "sns_fifo_sqs_requires_fifo_queue",
            message:
              "Subscribing to a FIFO SNS topic requires a FIFO SQS queue (set queue type to FIFO on the SQS node).",
            edgeId: edge.id,
            nodeId: sourceNode.id,
          });
        }
      }
      if (rel.id === RelationshipIds.eventbridge_scheduler_sends_sqs) {
        const q = sqsQueueNodeConfigSchema.safeParse(targetNode.config);
        if (q.success && q.data.queueType === "fifo") {
          const ec = eventbridgeSchedulerSendsSqsConfigSchema.safeParse(edge.config);
          if (ec.success && ec.data.messageGroupId.trim() === "") {
            issues.push({
              code: "scheduler_sqs_fifo_requires_message_group_id",
              message:
                "Scheduler → FIFO SQS requires a message group ID on the edge (EventBridge Scheduler requirement).",
              edgeId: edge.id,
              nodeId: targetNode.id,
            });
          }
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

  const cloudfrontNodeIds = new Set(
    doc.nodes.filter((n) => n.serviceId === "cloudfront").map((n) => n.id),
  );

  for (const cfId of cloudfrontNodeIds) {
    const cfNode = nodeById(doc, cfId);
    const nc = cfNode?.config as Record<string, unknown> | undefined;
    const displayName = String(nc?.name ?? "").trim();
    const legacyComment = String(nc?.comment ?? "").trim();
    if (displayName === "" && legacyComment === "") {
      issues.push({
        code: "cloudfront_missing_name",
        message: `CloudFront node "${cfId}" requires a distribution name.`,
        nodeId: cfId,
      });
    }

    const originEdges = doc.edges.filter(
      (e) =>
        e.sourceNodeId === cfId &&
        e.relationshipId === RelationshipIds.cloudfront_origin_s3 &&
        getRelationship(e.relationshipId, e.relationshipVersion) != null,
    );
    if (originEdges.length > 1) {
      issues.push({
        code: "cloudfront_origin_s3_duplicate",
        message: `CloudFront node "${cfId}" may have at most one "${RelationshipIds.cloudfront_origin_s3}" edge (found ${originEdges.length}).`,
        nodeId: cfId,
      });
    }
  }

  const route53AliasTargets = new Map<string, string[]>();
  for (const edge of doc.edges) {
    if (
      edge.relationshipId !== RelationshipIds.route53_alias_cloudfront ||
      getRelationship(edge.relationshipId, edge.relationshipVersion) == null
    ) {
      continue;
    }
    const targetNode = nodeById(doc, edge.targetNodeId);
    if (!targetNode) continue;
    if (targetNode.serviceId !== "cloudfront") continue;

    const hasOrigin = doc.edges.some(
      (e) =>
        e.sourceNodeId === edge.targetNodeId &&
        e.relationshipId === RelationshipIds.cloudfront_origin_s3 &&
        getRelationship(e.relationshipId, e.relationshipVersion) != null,
    );
    if (!hasOrigin) {
      issues.push({
        code: "route53_alias_without_distribution",
        message: `Route 53 alias targets CloudFront node "${edge.targetNodeId}" but that node has no "${RelationshipIds.cloudfront_origin_s3}" edge (distribution would not be created).`,
        edgeId: edge.id,
      });
    }

    const r53Source = nodeById(doc, edge.sourceNodeId);
    if (r53Source?.serviceId === "route53") {
      const nc = r53Source.config as Record<string, unknown>;
      const zoneName = String(nc.name ?? "").trim();
      const ec = edge.config as Record<string, unknown>;
      const domainName = String(ec.domainName ?? "").trim();
      if (domainName === "" || zoneName === "") {
        issues.push({
          code: "route53_alias_incomplete_dns",
          message: `Route 53 alias edge "${edge.id}" requires a domain name on the edge and a zone name on the Route 53 node "${r53Source.id}".`,
          edgeId: edge.id,
          nodeId: r53Source.id,
        });
      } else if (!domainInHostedZone(domainName, zoneName)) {
        issues.push({
          code: "route53_alias_domain_not_in_zone",
          message: `Route 53 alias domain "${domainName}" must be the zone apex or a subdomain of hosted zone "${zoneName}".`,
          edgeId: edge.id,
          nodeId: r53Source.id,
        });
      }
    }

    const list = route53AliasTargets.get(edge.targetNodeId) ?? [];
    list.push(edge.id);
    route53AliasTargets.set(edge.targetNodeId, list);
  }

  for (const [targetId, edgeIds] of route53AliasTargets) {
    if (edgeIds.length > 1) {
      for (const eid of edgeIds.slice(1)) {
        issues.push({
          code: "duplicate_route53_alias_cloudfront",
          message: `At most one "${RelationshipIds.route53_alias_cloudfront}" edge may target CloudFront node "${targetId}".`,
          edgeId: eid,
        });
      }
    }
  }

  const schedulerNodeIds = doc.nodes
    .filter((n) => n.serviceId === "eventbridge_scheduler")
    .map((n) => n.id);

  for (const sid of schedulerNodeIds) {
    const outgoing = doc.edges.filter(
      (e) =>
        e.sourceNodeId === sid &&
        EVENTBRIDGE_SCHEDULER_TARGET_RELATIONSHIP_IDS.has(e.relationshipId) &&
        getRelationship(e.relationshipId, e.relationshipVersion) != null,
    );
    if (outgoing.length !== 1) {
      issues.push({
        code: "eventbridge_scheduler_target_count",
        message:
          outgoing.length === 0
            ? `EventBridge Scheduler node "${sid}" needs exactly one connection to Lambda, SQS, or SNS.`
            : `EventBridge Scheduler node "${sid}" may only have one target schedule edge (found ${String(outgoing.length)}).`,
        nodeId: sid,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
