import {
  lambdaPublishesSnsStandardConfigSchema,
  lambdaPublishesSnsStandardDefinition,
} from "./lambdaPublishesSnsStandard.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaPublishesSnsStandardHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaPublishesSnsStandardDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaPublishesSnsStandardConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!fn || !topic) return;

    topic.grantPublish(fn);
  }
}
