import type * as cdk from "aws-cdk-lib";
import type { IScheduleTarget } from "aws-cdk-lib/aws-scheduler";
import { Schedule } from "aws-cdk-lib/aws-scheduler";

import type { EventbridgeSchedulerNodeConfig } from "../nodeHandlers/eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";
import { NodeIds } from "../nodeHandlers/nodeIds.ts";

import { scheduleTimingFromNodeConfig } from "./scheduleFromNodeConfig.ts";

export function synthesizeScheduleForSchedulerEdge(
  stack: cdk.Stack,
  schedulerNodeId: string,
  cfg: EventbridgeSchedulerNodeConfig,
  target: IScheduleTarget,
): Schedule {
  const { schedule, timeWindow, start, end } = scheduleTimingFromNodeConfig(cfg);
  return new Schedule(stack, NodeIds.cfnId("EvSched", schedulerNodeId), {
    schedule,
    scheduleName: cfg.scheduleName,
    description: cfg.description.trim() || undefined,
    enabled: cfg.enabled,
    timeWindow,
    start,
    end,
    target,
  });
}
