import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import { s3NodeConfigSchema, s3ServiceDefinition } from "./s3Service.definition.ts";

export class S3NodeHandler implements NodeServiceHandler {
  public readonly definition = s3ServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = s3NodeConfigSchema.parse(node.config);
    const bucket = new s3.Bucket(stack, NodeIds.cfnId("Bucket", node.id), {
      bucketName: cfg.bucketName,
      encryption: cfg.enforceEncryption
        ? s3.BucketEncryption.S3_MANAGED
        : undefined,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    ctx.buckets.set(node.id, bucket);
  }
}
