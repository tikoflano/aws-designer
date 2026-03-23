import type { CompileIssue, ValidateGraphResult } from "@shared/compile/types.ts";
import type { GraphDocument } from "@shared/domain/graph.ts";

import { RELATIONSHIP_VERSION } from "./domain/catalogTypes.ts";
import { getRelationship } from "./edgeHandlers/relationshipsCatalog.ts";
import { logicalBucketId } from "./nodeHandlers/s3/s3Service.definition.ts";
import { domainInHostedZone } from "./nodeHandlers/route53/route53Service.definition.ts";
import { getService } from "./nodeHandlers/servicesCatalog.ts";

const CLOUDFRONT_ORIGIN_S3 = "cloudfront_origin_s3";
const ROUTE53_ALIAS_CLOUDFRONT = "route53_alias_cloudfront";

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
      svc.configSchema.parse(node.config);
      if (node.serviceId === "s3") {
        bucketLogicalIds.add(logicalBucketId(node.id));
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
      rel.configSchema.parse(edge.config);
      if (rel.id === "s3_triggers_lambda") {
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
        e.relationshipId === CLOUDFRONT_ORIGIN_S3 &&
        e.relationshipVersion === RELATIONSHIP_VERSION,
    );
    if (originEdges.length > 1) {
      issues.push({
        code: "cloudfront_origin_s3_duplicate",
        message: `CloudFront node "${cfId}" may have at most one "${CLOUDFRONT_ORIGIN_S3}" edge (found ${originEdges.length}).`,
        nodeId: cfId,
      });
    }
  }

  const route53AliasTargets = new Map<string, string[]>();
  for (const edge of doc.edges) {
    if (
      edge.relationshipId !== ROUTE53_ALIAS_CLOUDFRONT ||
      edge.relationshipVersion !== RELATIONSHIP_VERSION
    ) {
      continue;
    }
    const targetNode = nodeById(doc, edge.targetNodeId);
    if (!targetNode) continue;
    if (targetNode.serviceId !== "cloudfront") continue;

    const hasOrigin = doc.edges.some(
      (e) =>
        e.sourceNodeId === edge.targetNodeId &&
        e.relationshipId === CLOUDFRONT_ORIGIN_S3 &&
        e.relationshipVersion === RELATIONSHIP_VERSION,
    );
    if (!hasOrigin) {
      issues.push({
        code: "route53_alias_without_distribution",
        message: `Route 53 alias targets CloudFront node "${edge.targetNodeId}" but that node has no "${CLOUDFRONT_ORIGIN_S3}" edge (distribution would not be created).`,
        edgeId: edge.id,
      });
    }

    const r53Source = nodeById(doc, edge.sourceNodeId);
    if (r53Source?.serviceId === "route53") {
      const nc = r53Source.config as Record<string, unknown>;
      const zoneName = String(nc.name ?? "").trim();
      const hostedZoneId = String(nc.hostedZoneId ?? "").trim();
      const ec = edge.config as Record<string, unknown>;
      const domainName = String(ec.domainName ?? "").trim();
      if (domainName === "" || zoneName === "" || hostedZoneId === "") {
        issues.push({
          code: "route53_alias_incomplete_dns",
          message: `Route 53 alias edge "${edge.id}" requires a domain name on the edge, and zone name plus hosted zone ID on the Route 53 node "${r53Source.id}".`,
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
          message: `At most one "${ROUTE53_ALIAS_CLOUDFRONT}" edge may target CloudFront node "${targetId}".`,
          edgeId: eid,
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
