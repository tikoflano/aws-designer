import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const s3TriggersLambdaConfigSchema = z.object({
  events: z
    .array(z.enum(["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]))
    .min(1)
    .default(["s3:ObjectCreated:*"]),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
});

export const s3TriggersLambdaDefinition: RelationshipDefinition = {
  id: "s3_triggers_lambda",
  version: RELATIONSHIP_VERSION,
  name: "S3 invokes Lambda",
  description:
    "Object create/remove events in the bucket invoke the target Lambda (notification + invoke permission).",
  source: "s3",
  target: "lambda",
  configSchema: s3TriggersLambdaConfigSchema,
};
