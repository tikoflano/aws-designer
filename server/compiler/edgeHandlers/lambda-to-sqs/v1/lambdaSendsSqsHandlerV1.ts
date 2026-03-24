import { lambdaSendsSqsConfigSchema, lambdaSendsSqsDefinition } from "./lambdaSendsSqs.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaSendsSqsHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaSendsSqsDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaSendsSqsConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const queue = ctx.sqsQueues.get(targetNode.id);
    if (!fn || !queue) return;

    queue.grantSendMessages(fn);
  }
}
