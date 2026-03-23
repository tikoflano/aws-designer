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
    const topicName = cfg.name.endsWith(".fifo") ? cfg.name : `${cfg.name}.fifo`;

    const snsKey = kms.Alias.fromAliasName(
      stack,
      NodeIds.cfnId("SnsManagedKey", node.id),
      "alias/aws/sns",
    );

    new sns.Topic(stack, NodeIds.cfnId("SnsTopic", node.id), {
      topicName,
      fifo: true,
      fifoThroughputScope: sns.FifoThroughputScope.TOPIC,
      contentBasedDeduplication: true,
      masterKey: snsKey,
    });
  }
}
