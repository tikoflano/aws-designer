import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";
import { eventbridgeSchedulerTargetInputSchema } from "../../eventbridge-scheduler-shared/eventbridgeSchedulerTargetEdgeSchemas.ts";

export const eventbridgeSchedulerPublishesSnsFifoConfigSchema =
  eventbridgeSchedulerTargetInputSchema;

export const eventbridgeSchedulerPublishesSnsFifoDefinition: RelationshipDefinition = {
  id: "eventbridge_scheduler_publishes_sns_fifo",
  version: DEFINITION_VERSION_V1,
  name: "Scheduler publishes to FIFO SNS",
  verb: "publishes to",
  description:
    "EventBridge Scheduler publishes to the FIFO SNS topic on each schedule tick. Optional JSON input is used as the message body.",
  source: "eventbridge_scheduler",
  target: "sns_fifo",
  configSchema: eventbridgeSchedulerPublishesSnsFifoConfigSchema,
};
