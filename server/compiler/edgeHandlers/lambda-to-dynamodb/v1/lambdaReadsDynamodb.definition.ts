import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaReadsDynamodbConfigSchema = z.object({});

export const lambdaReadsDynamodbDefinition: RelationshipDefinition = {
  id: "lambda_reads_dynamodb",
  version: RELATIONSHIP_VERSION,
  name: "Lambda reads DynamoDB",
  verb: "reads",
  description:
    "Grants the Lambda execution role DynamoDB read access on the table (GetItem, Query, Scan, etc.).",
  source: "lambda",
  target: "dynamodb",
  configSchema: lambdaReadsDynamodbConfigSchema,
};
