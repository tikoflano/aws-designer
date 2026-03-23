import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

export const cloudfrontNodeConfigSchema = z.object({
  comment: z.string().optional().default(""),
});

export const cloudfrontServiceDefinition: ServiceDefinition = {
  id: "cloudfront" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "CloudFront",
  description: "Amazon CloudFront CDN distribution (S3 origin via graph edge).",
  configSchema: cloudfrontNodeConfigSchema,
};
