import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaWritesDynamodbConfigSchema = z.object({});

export const lambdaWritesDynamodbDefinition: RelationshipDefinition = {
  id: "lambda_writes_dynamodb",
  version: DEFINITION_VERSION_V1,
  name: "Lambda writes DynamoDB",
  verb: "writes",
  description:
    "Grants the Lambda execution role DynamoDB write access on the table (PutItem, UpdateItem, DeleteItem, etc.).",
  source: "lambda",
  target: "dynamodb",
  configSchema: lambdaWritesDynamodbConfigSchema,
};
