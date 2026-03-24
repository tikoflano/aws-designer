import * as cdk from "aws-cdk-lib";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import type { NodeServiceHandler } from "../../types.ts";
import {
  cloudfrontNodeConfigSchema,
  cloudfrontServiceDefinition,
} from "./cloudfrontService.definition.ts";

/**
 * Does not instantiate `cloudfront.Distribution` here on purpose:
 * - CDK requires a real default origin when constructing `Distribution`; the S3 origin (and
 *   optional origin path) come from the `cloudfront_origin_s3` edge, which runs after all node
 *   handlers in {@link GraphCompilerStack}.
 * - L2 has no supported way to swap the default behavior’s origin later; only `addBehavior`
 *   adds path patterns, so a “dummy” origin in this handler would not be replaceable cleanly.
 * The distribution is created in `cloudfrontOriginS3HandlerV1` and stored on `ctx.distributions`.
 */
export class CloudFrontNodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = cloudfrontServiceDefinition;

  public apply(_stack: cdk.Stack, _ctx: GraphCompileContext, node: GraphNode): void {
    cloudfrontNodeConfigSchema.parse(node.config);
  }
}
