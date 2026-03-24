import * as cdk from "aws-cdk-lib";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as route53 from "aws-cdk-lib/aws-route53";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

import type { GraphDocument } from "@shared/domain/graph.ts";
import { migrateLegacyGraphDocument } from "@shared/domain/migrateLegacyGraph.ts";
import { RelationshipIds } from "./edgeHandlers/relationshipIds.ts";
import { getEdgeHandler } from "./edgeHandlers/registry.ts";
import type { GraphCompileContext } from "./graphCompileContext.ts";
import { getNodeHandler } from "./nodeHandlers/registry.ts";

function nodeById(doc: GraphDocument, id: string) {
  return doc.nodes.find((n) => n.id === id);
}

function applyEdge(
  graph: GraphDocument,
  ctx: GraphCompileContext,
  edge: GraphDocument["edges"][number],
): void {
  const sourceNode = nodeById(graph, edge.sourceNodeId);
  const targetNode = nodeById(graph, edge.targetNodeId);
  if (!sourceNode || !targetNode) return;

  const handler = getEdgeHandler(edge.relationshipId, edge.relationshipVersion);
  if (handler) {
    handler.apply(ctx, { edge, sourceNode, targetNode });
  }
}

export type GraphCompilerStackProps = cdk.StackProps & {
  graph: GraphDocument;
  /** Required on the server when any Lambda uses `codeSource.type === "uploadedZip"`. */
  graphId?: string;
  lambdaZipAssetsRoot?: string;
};

/**
 * Builds real CDK constructs from a validated {@link GraphDocument}.
 */
export class GraphCompilerStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: GraphCompilerStackProps) {
    const { graph: rawGraph, graphId, lambdaZipAssetsRoot, ...stackProps } = props;
    const graph = migrateLegacyGraphDocument(rawGraph);
    super(scope, id, {
      ...stackProps,
      env:
        stackProps.env ??
        (process.env.CDK_DEFAULT_ACCOUNT && process.env.CDK_DEFAULT_REGION
          ? {
              account: process.env.CDK_DEFAULT_ACCOUNT,
              region: process.env.CDK_DEFAULT_REGION,
            }
          : {
              account: "123456789012",
              region: "us-east-1",
            }),
    });
    const ctx: GraphCompileContext = {
      stack: this,
      lambdaZipCompile:
        graphId !== undefined && lambdaZipAssetsRoot !== undefined
          ? { graphId, lambdaZipAssetsRoot }
          : undefined,
      buckets: new Map<string, s3.Bucket>(),
      functions: new Map<string, lambda.Function>(),
      distributions: new Map<string, cloudfront.Distribution>(),
      hostedZones: new Map<string, route53.IHostedZone>(),
      secrets: new Map<string, secretsmanager.ISecret>(),
      snsTopics: new Map(),
      sqsQueues: new Map(),
      dynamoTables: new Map<string, dynamodb.ITable>(),
    };

    for (const node of graph.nodes) {
      getNodeHandler(node.serviceId, node.serviceVersion)?.apply(this, ctx, node);
    }

    const originEdges = graph.edges.filter(
      (e) => e.relationshipId === RelationshipIds.cloudfront_origin_s3,
    );
    const otherEdges = graph.edges.filter(
      (e) => e.relationshipId !== RelationshipIds.cloudfront_origin_s3,
    );

    for (const edge of originEdges) {
      applyEdge(graph, ctx, edge);
    }
    for (const edge of otherEdges) {
      applyEdge(graph, ctx, edge);
    }
  }
}
