import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const sqsTriggersLambdaConfigSchema = z.object({});

export const sqsTriggersLambdaDefinition: RelationshipDefinition = {
  id: "sqs_triggers_lambda",
  version: DEFINITION_VERSION_V1,
  name: "SQS invokes Lambda",
  verb: "invokes",
  description:
    "The queue is an event source for the Lambda function (event source mapping). For reliable processing, set the queue visibility timeout to at least six times the function timeout.",
  source: "sqs",
  target: "lambda",
  configSchema: sqsTriggersLambdaConfigSchema,
};
