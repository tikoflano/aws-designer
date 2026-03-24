import * as cdk from "aws-cdk-lib";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sns from "aws-cdk-lib/aws-sns";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import { NodeIds } from "../../nodeIds.ts";
import type { NodeServiceHandler } from "../../types.ts";
import {
  snsFifoServiceDefinition,
  snsFifoTopicNodeConfigSchema,
} from "./snsFifoService.definition.ts";

export class SnsFifoNodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = snsFifoServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = snsFifoTopicNodeConfigSchema.parse(node.config);
    const base = cfg.name.trim();
    const topicName = base.endsWith(".fifo") ? base : `${base}.fifo`;

    const snsKey = kms.Alias.fromAliasName(
      stack,
      NodeIds.cfnId("SnsManagedKey", node.id),
      "alias/aws/sns",
    );

    const fifoThroughputScope =
      cfg.fifoThroughputScope === "topic"
        ? sns.FifoThroughputScope.TOPIC
        : sns.FifoThroughputScope.MESSAGE_GROUP;

    const topic = new sns.Topic(stack, NodeIds.cfnId("SnsTopic", node.id), {
      topicName,
      fifo: true,
      fifoThroughputScope,
      contentBasedDeduplication: true,
      masterKey: snsKey,
    });
    ctx.snsTopics.set(node.id, topic);
  }
}
