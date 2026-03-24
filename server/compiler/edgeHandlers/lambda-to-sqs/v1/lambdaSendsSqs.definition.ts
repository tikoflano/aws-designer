import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaSendsSqsConfigSchema = z.object({});

export const lambdaSendsSqsDefinition: RelationshipDefinition = {
  id: "lambda_sends_sqs",
  version: DEFINITION_VERSION_V1,
  name: "Lambda sends to SQS",
  verb: "sends_to",
  description:
    "Grants the Lambda execution role permission to send messages to the queue (sqs:SendMessage and related queue metadata actions).",
  source: "lambda",
  target: "sqs",
  configSchema: lambdaSendsSqsConfigSchema,
};
