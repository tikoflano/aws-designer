import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";
import { NodeIds } from "../nodeIds.ts";

export const s3NodeConfigSchema = z.object({
  bucketName: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9.-]+$/)
    .optional(),
  enforceEncryption: z.boolean().optional().default(false),
});

export function logicalBucketId(nodeId: string): string {
  return `s3-bucket-${sanitizeId(nodeId)}`;
}

function sanitizeId(nodeId: string): string {
  return NodeIds.sanitizeNodeIdForLogical(nodeId);
}

export const s3ServiceDefinition: ServiceDefinition = {
  id: "s3" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "S3 bucket",
  description: "Amazon S3 bucket for object storage.",
  configSchema: s3NodeConfigSchema,
};
