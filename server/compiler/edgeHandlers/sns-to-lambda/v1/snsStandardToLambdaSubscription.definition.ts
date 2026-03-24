import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

import { snsSubscriptionFilterSchema } from "./snsSubscriptionFilterConfig.ts";

export const lambdaSubscribesSnsStandardConfigSchema = z.object({
  subscriptionFilter: snsSubscriptionFilterSchema.default({ kind: "none" }),
});

export const lambdaSubscribesSnsStandardDefinition: RelationshipDefinition = {
  id: "lambda_subscribes_sns_standard",
  version: DEFINITION_VERSION_V1,
  name: "Lambda subscribes to SNS (standard)",
  verb: "subscribes",
  description:
    "Subscribes the Lambda function to the standard SNS topic. CDK adds an SNS subscription on the topic to the function. Optional subscription filters apply to message attributes or top-level JSON message body keys (mutually exclusive), matching SNS filter policy behavior.",
  source: "lambda",
  target: "sns_standard",
  configSchema: lambdaSubscribesSnsStandardConfigSchema,
};
