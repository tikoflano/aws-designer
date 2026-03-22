import { z } from "zod";

import type { ServiceId } from "../domain/types";

export const RELATIONSHIP_VERSION = "1.0.0";

export const lambdaReadsS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
  includeListBucket: z.boolean().optional().default(false),
});

export const lambdaWritesS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
});

export const s3TriggersLambdaConfigSchema = z.object({
  events: z
    .array(z.enum(["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]))
    .min(1)
    .default(["s3:ObjectCreated:*"]),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
});

export type RelationshipDefinition = {
  id: string;
  version: string;
  name: string;
  description: string;
  source: ServiceId;
  target: ServiceId;
  configSchema: z.ZodType<Record<string, unknown>>;
};

export const lambdaReadsS3: RelationshipDefinition = {
  id: "lambda_reads_s3",
  version: RELATIONSHIP_VERSION,
  name: "Lambda reads from S3",
  description:
    "Grants the Lambda execution role permission to read objects in the bucket (and optionally list by prefix).",
  source: "lambda",
  target: "s3",
  configSchema: lambdaReadsS3ConfigSchema,
};

export const lambdaWritesS3: RelationshipDefinition = {
  id: "lambda_writes_s3",
  version: RELATIONSHIP_VERSION,
  name: "Lambda writes to S3",
  description:
    "Grants the Lambda execution role permission to put objects into the bucket.",
  source: "lambda",
  target: "s3",
  configSchema: lambdaWritesS3ConfigSchema,
};

export const s3TriggersLambda: RelationshipDefinition = {
  id: "s3_triggers_lambda",
  version: RELATIONSHIP_VERSION,
  name: "S3 invokes Lambda",
  description:
    "Object create/remove events in the bucket invoke the target Lambda (notification + invoke permission).",
  source: "s3",
  target: "lambda",
  configSchema: s3TriggersLambdaConfigSchema,
};

const ALL: RelationshipDefinition[] = [
  lambdaReadsS3,
  lambdaWritesS3,
  s3TriggersLambda,
];

export function listRelationships(
  source: ServiceId,
  target: ServiceId,
): RelationshipDefinition[] {
  return ALL.filter((r) => r.source === source && r.target === target);
}

export function getRelationship(
  id: string,
  version: string,
): RelationshipDefinition | undefined {
  return ALL.find((r) => r.id === id && r.version === version);
}
