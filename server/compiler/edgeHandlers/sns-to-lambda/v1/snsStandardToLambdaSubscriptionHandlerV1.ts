import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

import {
  lambdaSubscribesSnsStandardConfigSchema,
  lambdaSubscribesSnsStandardDefinition,
} from "./snsStandardToLambdaSubscription.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaSubscribesSnsStandardHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaSubscribesSnsStandardDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaSubscribesSnsStandardConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!topic || !fn) return;

    topic.addSubscription(new subs.LambdaSubscription(fn));
  }
}
