import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaPublishesSnsStandardConfigSchema = z.object({});

export const lambdaPublishesSnsStandardDefinition: RelationshipDefinition = {
  id: "lambda_publishes_sns_standard",
  version: DEFINITION_VERSION_V1,
  name: "Lambda publishes to SNS (standard)",
  verb: "publishes_to",
  description:
    "Grants the Lambda execution role permission to publish messages to the standard SNS topic (sns:Publish).",
  source: "lambda",
  target: "sns_standard",
  configSchema: lambdaPublishesSnsStandardConfigSchema,
};
