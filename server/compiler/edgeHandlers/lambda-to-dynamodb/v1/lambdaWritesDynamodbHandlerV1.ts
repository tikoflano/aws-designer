import {
  lambdaWritesDynamodbConfigSchema,
  lambdaWritesDynamodbDefinition,
} from "./lambdaWritesDynamodb.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../types.ts";

export class LambdaWritesDynamodbHandler implements EdgeRelationshipHandler {
  public readonly definition = lambdaWritesDynamodbDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaWritesDynamodbConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const table = ctx.dynamoTables.get(targetNode.id);
    if (!fn || !table) return;
    table.grantWriteData(fn);
  }
}
