import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

import { NodeIds } from "../../../nodeHandlers/nodeIds.ts";
import { cloudfrontNodeConfigSchema } from "../../../nodeHandlers/cloudfront/v1/cloudfrontService.definition.ts";
import { cloudfrontOriginS3ConfigSchema, cloudfrontOriginS3Definition } from "./cloudfrontOriginS3.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";

export class CloudFrontOriginS3HandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = cloudfrontOriginS3Definition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const edgeCfg = cloudfrontOriginS3ConfigSchema.parse(edge.config);
    cloudfrontNodeConfigSchema.parse(sourceNode.config);
    const bucket = ctx.buckets.get(targetNode.id);
    if (!bucket) return;

    const originPath =
      edgeCfg.originPath.trim() === "" ? undefined : edgeCfg.originPath.replace(/\/$/, "");
    const cfCfg = cloudfrontNodeConfigSchema.parse(sourceNode.config);
    const comment = cfCfg.name.trim() !== "" ? cfCfg.name.trim() : undefined;

    const distribution = new cloudfront.Distribution(
      ctx.stack,
      NodeIds.cfnId("CfDist", sourceNode.id),
      {
        comment,
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(bucket, { originPath }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    );
    ctx.distributions.set(sourceNode.id, distribution);
  }
}
