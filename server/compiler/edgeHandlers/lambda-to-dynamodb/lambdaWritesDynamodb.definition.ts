import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaWritesDynamodbConfigSchema = z.object({});

export const lambdaWritesDynamodbDefinition: RelationshipDefinition = {
  id: "lambda_writes_dynamodb",
  version: RELATIONSHIP_VERSION,
  name: "Lambda writes DynamoDB",
  verb: "writes",
  description:
    "Grants the Lambda execution role DynamoDB write access on the table (PutItem, UpdateItem, DeleteItem, etc.).",
  source: "lambda",
  target: "dynamodb",
  configSchema: lambdaWritesDynamodbConfigSchema,
};
