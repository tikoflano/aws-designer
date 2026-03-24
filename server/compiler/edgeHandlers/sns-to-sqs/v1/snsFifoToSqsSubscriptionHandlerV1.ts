import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

import {
  sqsSubscribesSnsFifoConfigSchema,
  sqsSubscribesSnsFifoDefinition,
} from "./snsFifoToSqsSubscription.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../types.ts";

export class SqsSubscribesSnsFifoHandler implements EdgeRelationshipHandler {
  public readonly definition = sqsSubscribesSnsFifoDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    sqsSubscribesSnsFifoConfigSchema.parse(edge.config);
    const queue = ctx.sqsQueues.get(sourceNode.id);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!topic || !queue) return;

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
