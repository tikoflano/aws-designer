import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets";

import { synthesizeScheduleForSchedulerEdge } from "../../../eventbridgeScheduler/synthesizeScheduleForEdge.ts";
import { scheduleTargetInputFromJsonString } from "../../../eventbridgeScheduler/scheduleTargetInputFromJson.ts";
import { eventbridgeSchedulerNodeConfigSchema } from "../../../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";
import type {
  EdgeHandlerArgs,
  EdgeRelationshipHandler,
  GraphCompileContext,
} from "../../types.ts";
import {
  eventbridgeSchedulerInvokesLambdaConfigSchema,
  eventbridgeSchedulerInvokesLambdaDefinition,
} from "./eventbridgeSchedulerInvokesLambda.definition.ts";

export class EventbridgeSchedulerInvokesLambdaHandlerV1 implements EdgeRelationshipHandler {
  public readonly definition = eventbridgeSchedulerInvokesLambdaDefinition;

  public apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void {
    const { edge, sourceNode, targetNode } = args;
    const cfg = eventbridgeSchedulerNodeConfigSchema.parse(sourceNode.config);
    const edgeCfg = eventbridgeSchedulerInvokesLambdaConfigSchema.parse(edge.config);
    const fn = ctx.functions.get(targetNode.id);
    if (!fn) return;

    const input = scheduleTargetInputFromJsonString(edgeCfg.input);
    const target = new LambdaInvoke(fn, input !== undefined ? { input } : {});

    synthesizeScheduleForSchedulerEdge(ctx.stack, sourceNode.id, cfg, target);
  }
}
