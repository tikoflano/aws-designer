import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";
import { NodeIds } from "../../nodeIds.ts";

const bucketNameRules = z
  .string()
  .min(3, { message: "Bucket name must be at least 3 characters." })
  .max(63, { message: "Bucket name must be at most 63 characters." })
  .regex(/^[a-z0-9.-]+$/, {
    message:
      "Use only lowercase letters, numbers, dots, and hyphens (AWS S3 bucket naming rules).",
  });

const s3NodeConfigRawSchema = z.object({
  name: z.string().default(""),
  bucketName: z.string().optional(),
  enforceEncryption: z.boolean().optional(),
});

export const s3NodeConfigSchema = s3NodeConfigRawSchema
  .transform(({ name, bucketName }) => {
    const n = name.trim();
    return { name: n !== "" ? n : (bucketName?.trim() ?? "") };
  })
  .pipe(z.object({ name: bucketNameRules }));

export function logicalBucketId(nodeId: string): string {
  return `s3-bucket-${sanitizeId(nodeId)}`;
}

function sanitizeId(nodeId: string): string {
  return NodeIds.sanitizeNodeIdForLogical(nodeId);
}

export const s3ServiceDefinition: ServiceDefinition = {
  id: "s3" satisfies ServiceId,
  version: DEFINITION_VERSION_V1,
  displayName: "S3 bucket",
  description: "Amazon S3 bucket for object storage (SSE-S3 encryption enabled).",
  configSchema: s3NodeConfigSchema,
};
