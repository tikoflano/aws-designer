import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaReadsDynamodbConfigSchema = z.object({});

export const lambdaReadsDynamodbDefinition: RelationshipDefinition = {
  id: "lambda_reads_dynamodb",
  version: DEFINITION_VERSION_V1,
  name: "Lambda reads DynamoDB",
  verb: "reads",
  description:
    "Grants the Lambda execution role DynamoDB read access on the table (GetItem, Query, Scan, etc.).",
  source: "lambda",
  target: "dynamodb",
  configSchema: lambdaReadsDynamodbConfigSchema,
};
