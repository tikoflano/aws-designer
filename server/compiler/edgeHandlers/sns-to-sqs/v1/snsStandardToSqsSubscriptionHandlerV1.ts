import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

import {
  sqsSubscribesSnsStandardConfigSchema,
  sqsSubscribesSnsStandardDefinition,
} from "./snsStandardToSqsSubscription.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class SqsSubscribesSnsStandardHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = sqsSubscribesSnsStandardDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    sqsSubscribesSnsStandardConfigSchema.parse(edge.config);
    const queue = ctx.sqsQueues.get(sourceNode.id);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!topic || !queue) return;

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
