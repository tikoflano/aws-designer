import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type RelationshipDefinition,
} from "../../../domain/catalogTypes.ts";

export const cloudfrontOriginS3ConfigSchema = z.object({
  originPath: z.string().optional().default(""),
});

export const cloudfrontOriginS3Definition: RelationshipDefinition = {
  id: "cloudfront_origin_s3",
  version: DEFINITION_VERSION_V1,
  name: "CloudFront origin from S3",
  verb: "origin",
  description: "Uses the bucket as the default origin for this CloudFront distribution.",
  source: "cloudfront",
  target: "s3",
  configSchema: cloudfrontOriginS3ConfigSchema,
};
