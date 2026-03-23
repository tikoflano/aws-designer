import * as iam from "aws-cdk-lib/aws-iam";

import { lambdaReadsS3ConfigSchema, lambdaReadsS3Definition } from "./lambdaReadsS3.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../types.ts";

export class LambdaReadsS3Handler implements EdgeRelationshipHandler {
  public readonly definition = lambdaReadsS3Definition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = lambdaReadsS3ConfigSchema.parse(edge.config);
    const bucket = ctx.buckets.get(targetNode.id);
    const fn = ctx.functions.get(sourceNode.id);
    if (!bucket || !fn) return;
    const prefix = (cfg.objectKeyPrefix ?? "").replace(/\/$/, "");
    if (prefix.length > 0) {
      bucket.grantRead(fn, bucket.arnForObjects(`${prefix}/*`));
    } else {
      bucket.grantRead(fn);
    }
    if (cfg.includeListBucket) {
      fn.role?.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:ListBucket"],
          resources: [bucket.bucketArn],
          conditions:
            prefix.length > 0
              ? {
                  StringLike: {
                    "s3:prefix": [`${prefix}*`],
                  },
                }
              : undefined,
        }),
      );
    }
  }
}
