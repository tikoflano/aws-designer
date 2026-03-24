import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const lambdaWritesS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
});

export const lambdaWritesS3Definition: RelationshipDefinition = {
  id: "lambda_writes_s3",
  version: RELATIONSHIP_VERSION,
  name: "Lambda writes to S3",
  verb: "writes",
  description:
    "Grants the Lambda execution role permission to put objects into the bucket.",
  source: "lambda",
  target: "s3",
  configSchema: lambdaWritesS3ConfigSchema,
};
