import * as cdk from "aws-cdk-lib";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

import type { GraphDocument } from "@shared/domain/graph.ts";
import { edgeRelationshipHandlers } from "./edgeHandlers/registry.ts";
import type { GraphCompileContext } from "./graphCompileContext.ts";
import { nodeServiceHandlers } from "./nodeHandlers/registry.ts";

function nodeById(doc: GraphDocument, id: string) {
  return doc.nodes.find((n) => n.id === id);
}

const CLOUDFRONT_ORIGIN_S3_ID = "cloudfront_origin_s3";

function applyEdge(
  graph: GraphDocument,
  ctx: GraphCompileContext,
  edge: GraphDocument["edges"][number],
): void {
  const sourceNode = nodeById(graph, edge.sourceNodeId);
  const targetNode = nodeById(graph, edge.targetNodeId);
  if (!sourceNode || !targetNode) return;

  const handler = edgeRelationshipHandlers[edge.relationshipId];
  if (handler) {
    handler.apply(ctx, { edge, sourceNode, targetNode });
  }
}

export type GraphCompilerStackProps = cdk.StackProps & {
  graph: GraphDocument;
};

/**
 * Builds real CDK constructs from a validated {@link GraphDocument}.
 */
export class GraphCompilerStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: GraphCompilerStackProps) {
    const { graph, ...stackProps } = props;
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
      buckets: new Map<string, s3.Bucket>(),
      functions: new Map<string, lambda.Function>(),
      distributions: new Map<string, cloudfront.Distribution>(),
    };

    for (const node of graph.nodes) {
      nodeServiceHandlers[node.serviceId]?.apply(this, ctx, node);
    }

    const originEdges = graph.edges.filter((e) => e.relationshipId === CLOUDFRONT_ORIGIN_S3_ID);
    const otherEdges = graph.edges.filter((e) => e.relationshipId !== CLOUDFRONT_ORIGIN_S3_ID);

    for (const edge of originEdges) {
      applyEdge(graph, ctx, edge);
    }
    for (const edge of otherEdges) {
      applyEdge(graph, ctx, edge);
    }
  }
}
