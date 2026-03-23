import * as cdk from "aws-cdk-lib";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sns from "aws-cdk-lib/aws-sns";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import {
  snsStandardServiceDefinition,
  snsStandardTopicNodeConfigSchema,
} from "./snsStandardService.definition.ts";

export class SnsStandardNodeHandler implements NodeServiceHandler {
  public readonly definition = snsStandardServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = snsStandardTopicNodeConfigSchema.parse(node.config);
    const topicName = cfg.name.trim();

    const snsKey = kms.Alias.fromAliasName(
      stack,
      NodeIds.cfnId("SnsManagedKey", node.id),
      "alias/aws/sns",
    );

    const topic = new sns.Topic(stack, NodeIds.cfnId("SnsTopic", node.id), {
      topicName,
      fifo: false,
      masterKey: snsKey,
    });
    ctx.snsTopics.set(node.id, topic);
  }
}
