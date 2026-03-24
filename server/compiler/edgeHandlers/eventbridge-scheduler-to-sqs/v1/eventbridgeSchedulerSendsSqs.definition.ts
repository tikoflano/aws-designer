import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";
import { eventbridgeSchedulerSqsTargetSchema } from "../../eventbridge-scheduler-shared/eventbridgeSchedulerTargetEdgeSchemas.ts";

export const eventbridgeSchedulerSendsSqsConfigSchema =
  eventbridgeSchedulerSqsTargetSchema;

export const eventbridgeSchedulerSendsSqsDefinition: RelationshipDefinition = {
  id: "eventbridge_scheduler_sends_sqs",
  version: DEFINITION_VERSION_V1,
  name: "Scheduler sends to SQS",
  verb: "sends to",
  description:
    "EventBridge Scheduler sends a message to the SQS queue on each schedule tick. FIFO queues require a message group ID on this edge.",
  source: "eventbridge_scheduler",
  target: "sqs",
  configSchema: eventbridgeSchedulerSendsSqsConfigSchema,
};
