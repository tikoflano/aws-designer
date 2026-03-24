import { SnsPublish } from "aws-cdk-lib/aws-scheduler-targets";

import { synthesizeScheduleForSchedulerEdge } from "../../../eventbridgeScheduler/synthesizeScheduleForEdge.ts";
import { scheduleTargetInputFromJsonString } from "../../../eventbridgeScheduler/scheduleTargetInputFromJson.ts";
import { eventbridgeSchedulerNodeConfigSchema } from "../../../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";
import {
  eventbridgeSchedulerPublishesSnsFifoConfigSchema,
  eventbridgeSchedulerPublishesSnsFifoDefinition,
} from "./eventbridgeSchedulerPublishesSnsFifo.definition.ts";

export class EventbridgeSchedulerPublishesSnsFifoHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = eventbridgeSchedulerPublishesSnsFifoDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse(sourceNode.config);
    const edgeCfg = eventbridgeSchedulerPublishesSnsFifoConfigSchema.parse(edge.config);
    const topic = ctx.snsTopics.get(targetNode.id);
    if (!topic) return;

    const input = scheduleTargetInputFromJsonString(edgeCfg.input);
    const target = new SnsPublish(topic, input !== undefined ? { input } : {});

    synthesizeScheduleForSchedulerEdge(ctx.stack, sourceNode.id, cfg, target);
  }
}
