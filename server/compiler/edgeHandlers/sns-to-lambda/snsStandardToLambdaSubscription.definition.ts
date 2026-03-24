import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaSubscribesSnsStandardConfigSchema = z.object({});

export const lambdaSubscribesSnsStandardDefinition: RelationshipDefinition = {
  id: "lambda_subscribes_sns_standard",
  version: RELATIONSHIP_VERSION,
  name: "Lambda subscribes to SNS (standard)",
  verb: "subscribes",
  description:
    "Subscribes the Lambda function to the standard SNS topic. CDK adds an SNS subscription on the topic to the function.",
  source: "lambda",
  target: "sns_standard",
  configSchema: lambdaSubscribesSnsStandardConfigSchema,
};
