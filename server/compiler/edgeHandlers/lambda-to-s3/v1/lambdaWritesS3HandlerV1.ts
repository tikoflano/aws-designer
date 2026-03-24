import { lambdaWritesS3ConfigSchema, lambdaWritesS3Definition } from "./lambdaWritesS3.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class LambdaWritesS3HandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = lambdaWritesS3Definition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = lambdaWritesS3ConfigSchema.parse(edge.config);
    const bucket = ctx.buckets.get(targetNode.id);
    const fn = ctx.functions.get(sourceNode.id);
    if (!bucket || !fn) return;
    const prefix = (cfg.objectKeyPrefix ?? "").replace(/\/$/, "");
    if (prefix.length > 0) {
      bucket.grantPut(fn, bucket.arnForObjects(`${prefix}/*`));
    } else {
      bucket.grantPut(fn);
    }
  }
}
