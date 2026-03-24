import {
  lambdaPublishesSnsFifoConfigSchema,
  lambdaPublishesSnsFifoDefinition,
} from "./lambdaPublishesSnsFifo.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaPublishesSnsFifoHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaPublishesSnsFifoDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaPublishesSnsFifoConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!fn || !topic) return;

    topic.grantPublish(fn);
  }
}
