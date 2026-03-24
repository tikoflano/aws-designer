import {
  lambdaReadsDynamodbConfigSchema,
  lambdaReadsDynamodbDefinition,
} from "./lambdaReadsDynamodb.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaReadsDynamodbHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaReadsDynamodbDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaReadsDynamodbConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const table = ctx.dynamoTables.get(targetNode.id);
    if (!fn || !table) return;
    table.grantReadData(fn);
  }
}
