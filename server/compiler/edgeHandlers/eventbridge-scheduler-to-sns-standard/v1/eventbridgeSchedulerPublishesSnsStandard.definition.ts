import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";
import { eventbridgeSchedulerTargetInputSchema } from "../../eventbridge-scheduler-shared/eventbridgeSchedulerTargetEdgeSchemas.ts";

export const eventbridgeSchedulerPublishesSnsStandardConfigSchema =
  eventbridgeSchedulerTargetInputSchema;

export const eventbridgeSchedulerPublishesSnsStandardDefinition: RelationshipDefinition =
  {
    id: "eventbridge_scheduler_publishes_sns_standard",
    version: DEFINITION_VERSION_V1,
    name: "Scheduler publishes to SNS",
    verb: "publishes to",
    description:
      "EventBridge Scheduler publishes to the standard SNS topic on each schedule tick. Optional JSON input is used as the message body.",
    source: "eventbridge_scheduler",
    target: "sns_standard",
    configSchema: eventbridgeSchedulerPublishesSnsStandardConfigSchema,
  };
