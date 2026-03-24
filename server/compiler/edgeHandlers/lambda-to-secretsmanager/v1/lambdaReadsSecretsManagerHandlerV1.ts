import {
  lambdaReadsSecretsManagerConfigSchema,
  lambdaReadsSecretsManagerDefinition,
} from "./lambdaReadsSecretsManager.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaReadsSecretsManagerHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaReadsSecretsManagerDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    lambdaReadsSecretsManagerConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(sourceNode.id);
    const secret = ctx.secrets.get(targetNode.id);
    if (!fn || !secret) return;
    secret.grantRead(fn);
  }
}
