import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const lambdaReadsS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
  includeListBucket: z.boolean().optional().default(false),
});

export const lambdaReadsS3Definition: RelationshipDefinition = {
  id: "lambda_reads_s3",
  version: DEFINITION_VERSION_V1,
  name: "Lambda reads from S3",
  verb: "reads",
  description:
    "Grants the Lambda execution role permission to read objects in the bucket (and optionally list by prefix).",
  source: "lambda",
  target: "s3",
  configSchema: lambdaReadsS3ConfigSchema,
};
