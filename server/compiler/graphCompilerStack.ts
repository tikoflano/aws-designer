import * as cdk from "aws-cdk-lib";
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

export type GraphCompilerStackProps = cdk.StackProps & {
  graph: GraphDocument;
};

/**
 * Builds real CDK constructs from a validated {@link GraphDocument}.
 */
export class GraphCompilerStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: GraphCompilerStackProps) {
    super(scope, id, props);

    const { graph } = props;
    const ctx: GraphCompileContext = {
      buckets: new Map<string, s3.Bucket>(),
      functions: new Map<string, lambda.Function>(),
    };

    for (const node of graph.nodes) {
      nodeServiceHandlers[node.serviceId]?.apply(this, ctx, node);
    }

    for (const edge of graph.edges) {
      const sourceNode = nodeById(graph, edge.sourceNodeId);
      const targetNode = nodeById(graph, edge.targetNodeId);
      if (!sourceNode || !targetNode) continue;

      const handler = edgeRelationshipHandlers[edge.relationshipId];
      if (handler) {
        handler.apply(ctx, { edge, sourceNode, targetNode });
      }
    }
  }
}
