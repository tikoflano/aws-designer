import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const sqsSubscribesSnsStandardConfigSchema = z.object({});

export const sqsSubscribesSnsStandardDefinition: RelationshipDefinition = {
  id: "sqs_subscribes_sns_standard",
  version: DEFINITION_VERSION_V1,
  name: "SQS subscribes to SNS (standard)",
  verb: "subscribes",
  description:
    "Subscribes the queue to the standard SNS topic. CDK adds an SNS subscription on the topic to the queue.",
  source: "sqs",
  target: "sns_standard",
  configSchema: sqsSubscribesSnsStandardConfigSchema,
};
