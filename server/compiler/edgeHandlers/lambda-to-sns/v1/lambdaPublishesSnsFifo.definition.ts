import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaPublishesSnsFifoConfigSchema = z.object({});

export const lambdaPublishesSnsFifoDefinition: RelationshipDefinition = {
  id: "lambda_publishes_sns_fifo",
  version: DEFINITION_VERSION_V1,
  name: "Lambda publishes to SNS (FIFO)",
  verb: "publishes_to",
  description:
    "Grants the Lambda execution role permission to publish messages to the FIFO SNS topic (sns:Publish).",
  source: "lambda",
  target: "sns_fifo",
  configSchema: lambdaPublishesSnsFifoConfigSchema,
};
