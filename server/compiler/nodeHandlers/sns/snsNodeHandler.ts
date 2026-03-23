import * as cdk from "aws-cdk-lib";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sns from "aws-cdk-lib/aws-sns";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import { snsServiceDefinition, snsTopicNodeConfigSchema } from "./snsService.definition.ts";

export class SnsNodeHandler implements NodeServiceHandler {
  public readonly definition = snsServiceDefinition;

  public apply(stack: cdk.Stack, _ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = snsTopicNodeConfigSchema.parse(node.config);
    const base = cfg.name.trim();

    const snsKey = kms.Alias.fromAliasName(
      stack,
      NodeIds.cfnId("SnsManagedKey", node.id),
      "alias/aws/sns",
    );

    if (cfg.topicType === "standard") {
      new sns.Topic(stack, NodeIds.cfnId("SnsTopic", node.id), {
        topicName: base,
        fifo: false,
        masterKey: snsKey,
      });
      return;
    }

    const topicName = base.endsWith(".fifo") ? base : `${base}.fifo`;
    const fifoThroughputScope =
      cfg.fifoThroughputScope === "topic"
        ? sns.FifoThroughputScope.TOPIC
        : sns.FifoThroughputScope.MESSAGE_GROUP;

    new sns.Topic(stack, NodeIds.cfnId("SnsTopic", node.id), {
      topicName,
      fifo: true,
      fifoThroughputScope,
      contentBasedDeduplication: true,
      masterKey: snsKey,
    });
  }
}
