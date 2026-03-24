import { SqsSendMessage } from "aws-cdk-lib/aws-scheduler-targets";

import { synthesizeScheduleForSchedulerEdge } from "../../../eventbridgeScheduler/synthesizeScheduleForEdge.ts";
import { scheduleTargetInputFromJsonString } from "../../../eventbridgeScheduler/scheduleTargetInputFromJson.ts";
import { eventbridgeSchedulerNodeConfigSchema } from "../../../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";
import {
  eventbridgeSchedulerSendsSqsConfigSchema,
  eventbridgeSchedulerSendsSqsDefinition,
} from "./eventbridgeSchedulerSendsSqs.definition.ts";

export class EventbridgeSchedulerSendsSqsHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = eventbridgeSchedulerSendsSqsDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse(sourceNode.config);
    const edgeCfg = eventbridgeSchedulerSendsSqsConfigSchema.parse(edge.config);
    const queue = ctx.sqsQueues.get(targetNode.id);
    if (!queue) return;

    const input = scheduleTargetInputFromJsonString(edgeCfg.input);
    const messageGroupId = edgeCfg.messageGroupId.trim();
    const target = new SqsSendMessage(queue, {
      ...(input !== undefined ? { input } : {}),
      ...(messageGroupId !== "" ? { messageGroupId } : {}),
    });

    synthesizeScheduleForSchedulerEdge(ctx.stack, sourceNode.id, cfg, target);
  }
}
