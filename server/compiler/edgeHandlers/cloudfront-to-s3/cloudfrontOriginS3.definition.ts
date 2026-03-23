import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  type RelationshipDefinition,
} from "../../domain/catalogTypes.ts";

export const cloudfrontOriginS3ConfigSchema = z.object({
  originPath: z.string().optional().default(""),
});

export const cloudfrontOriginS3Definition: RelationshipDefinition = {
  id: "cloudfront_origin_s3",
  version: RELATIONSHIP_VERSION,
  name: "CloudFront origin from S3",
  description: "Uses the bucket as the default origin for this CloudFront distribution.",
  source: "cloudfront",
  target: "s3",
  configSchema: cloudfrontOriginS3ConfigSchema,
};
