import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";

const cloudfrontNodeConfigRawSchema = z.object({
  name: z.string().default(""),
  comment: z.string().optional(),
});

export const cloudfrontNodeConfigSchema = cloudfrontNodeConfigRawSchema.transform(
  ({ name, comment }) => {
    const n = name.trim();
    if (n !== "") return { name: n };
    const fromComment = comment?.trim() ?? "";
    return { name: fromComment };
  },
);

export const cloudfrontServiceDefinition: ServiceDefinition = {
  id: "cloudfront" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "CloudFront",
  description: "Amazon CloudFront CDN distribution (S3 origin via graph edge).",
  configSchema: cloudfrontNodeConfigSchema,
};
