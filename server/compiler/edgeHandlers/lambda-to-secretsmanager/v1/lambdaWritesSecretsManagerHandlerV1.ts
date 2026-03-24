import {
  lambdaWritesSecretsManagerConfigSchema,
  lambdaWritesSecretsManagerDefinition,
} from "./lambdaWritesSecretsManager.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaWritesSecretsManagerHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaWritesSecretsManagerDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaWritesSecretsManagerConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const secret = ctx.secrets.get(targetNode.id);
    if (!fn || !secret) return;
    secret.grantWrite(fn);
  }
}
