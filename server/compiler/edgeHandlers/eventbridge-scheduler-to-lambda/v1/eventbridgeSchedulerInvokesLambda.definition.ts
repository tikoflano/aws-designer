import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";
import { eventbridgeSchedulerTargetInputSchema } from "../../eventbridge-scheduler-shared/eventbridgeSchedulerTargetEdgeSchemas.ts";

export const eventbridgeSchedulerInvokesLambdaConfigSchema =
  eventbridgeSchedulerTargetInputSchema;

export const eventbridgeSchedulerInvokesLambdaDefinition: RelationshipDefinition = {
  id: "eventbridge_scheduler_invokes_lambda",
  version: DEFINITION_VERSION_V1,
  name: "Scheduler invokes Lambda",
  verb: "invokes",
  description:
    "EventBridge Scheduler invokes the Lambda function on the schedule defined on the scheduler node. Optional JSON input is passed as the invocation payload.",
  source: "eventbridge_scheduler",
  target: "lambda",
  configSchema: eventbridgeSchedulerInvokesLambdaConfigSchema,
};
