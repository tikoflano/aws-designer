import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

import {
  s3TriggersLambdaConfigSchema,
  s3TriggersLambdaDefinition,
} from "./s3TriggersLambda.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../types.ts";

export class S3TriggersLambdaHandler implements EdgeRelationshipHandler {
  public readonly definition = s3TriggersLambdaDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = s3TriggersLambdaConfigSchema.parse(edge.config);
    const bucket = ctx.buckets.get(sourceNode.id);
    const fn = ctx.functions.get(targetNode.id);
    if (!bucket || !fn) return;

    const dest = new s3n.LambdaDestination(fn);
    const filters: s3.NotificationKeyFilter[] = [];
    if (cfg.prefix) {
      filters.push({ prefix: cfg.prefix });
    }
    if (cfg.suffix) {
      filters.push({ suffix: cfg.suffix });
    }

    for (const ev of cfg.events) {
      const eventType = ev.includes("ObjectCreated")
        ? s3.EventType.OBJECT_CREATED
        : s3.EventType.OBJECT_REMOVED;
      bucket.addEventNotification(eventType, dest, ...filters);
    }
  }
}
