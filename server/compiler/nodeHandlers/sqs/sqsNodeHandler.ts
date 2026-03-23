import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../graphCompileContext.ts";
import { NodeIds } from "../nodeIds.ts";
import type { NodeServiceHandler } from "../types.ts";
import { sqsQueueNodeConfigSchema, sqsServiceDefinition } from "./sqsService.definition.ts";

/** Max message size 1024 KiB (within SQS 1 KiB–1 MiB range). */
const MAX_MESSAGE_BYTES = 1024 * 1024;

function stripFifoSuffix(name: string): string {
  return name.replace(/\.fifo$/, "");
}

export class SqsNodeHandler implements NodeServiceHandler {
  public readonly definition = sqsServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    const cfg = sqsQueueNodeConfigSchema.parse(node.config);
    const base = cfg.name.trim();
    const fifo = cfg.queueType === "fifo";

    const queueName = fifo
      ? base.endsWith(".fifo")
        ? base
        : `${base}.fifo`
      : base;

    const stem = stripFifoSuffix(base);
    const dlqName = fifo ? `${stem}-dlq.fifo` : `${stem}-dlq`;

    const queueProps = {
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(4),
      maxMessageSizeBytes: MAX_MESSAGE_BYTES,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    } as const;

    const dlq = new sqs.Queue(stack, NodeIds.cfnId("SqsDlq", node.id), {
      ...queueProps,
      queueName: dlqName,
      fifo,
    });

    const queue = new sqs.Queue(stack, NodeIds.cfnId("SqsQueue", node.id), {
      ...queueProps,
      queueName,
      fifo,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 10,
      },
    });
    ctx.sqsQueues.set(node.id, queue);
  }
}
