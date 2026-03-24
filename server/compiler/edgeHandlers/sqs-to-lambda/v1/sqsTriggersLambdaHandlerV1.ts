import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

import {
  sqsTriggersLambdaConfigSchema,
  sqsTriggersLambdaDefinition,
} from "./sqsTriggersLambda.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class SqsTriggersLambdaHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = sqsTriggersLambdaDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    sqsTriggersLambdaConfigSchema.parse(edge.config);
    const queue = ctx.sqsQueues.get(sourceNode.id);
    const fn = ctx.functions.get(targetNode.id);
    if (!queue || !fn) return;

    fn.addEventSource(new SqsEventSource(queue, { batchSize: 10 }));
  }
}
