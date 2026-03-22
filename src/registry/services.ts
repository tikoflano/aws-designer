import { z } from "zod";

import type { ServiceId } from "../domain/types";

export const SERVICE_VERSION = "1.0.0";

export const s3NodeConfigSchema = z.object({
  bucketName: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9.-]+$/)
    .optional(),
  enforceEncryption: z.boolean().optional().default(false),
});

export const lambdaNodeConfigSchema = z.object({
  functionName: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9-_]+$/)
    .default("function"),
  handler: z.string().min(1).default("index.handler"),
  runtime: z
    .enum([
      "nodejs18.x",
      "nodejs20.x",
      "nodejs22.x",
      "python3.12",
      "python3.13",
    ])
    .default("nodejs20.x"),
});

export type ServiceDefinition = {
  id: ServiceId;
  version: string;
  displayName: string;
  description: string;
  configSchema: z.ZodType<Record<string, unknown>>;
};

export function logicalBucketId(nodeId: string): string {
  return `s3-bucket-${sanitizeId(nodeId)}`;
}

export function logicalLambdaId(nodeId: string): string {
  return `lambda-fn-${sanitizeId(nodeId)}`;
}

export function logicalLambdaRoleId(nodeId: string): string {
  return `lambda-role-${sanitizeId(nodeId)}`;
}

/** Strips non-alphanumeric characters so IDs are safe as CFN logical ID segments. */
export function sanitizeNodeIdForLogical(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9]/g, "");
}

function sanitizeId(nodeId: string): string {
  return sanitizeNodeIdForLogical(nodeId);
}

const s3Service: ServiceDefinition = {
  id: "s3",
  version: SERVICE_VERSION,
  displayName: "S3 bucket",
  description: "Amazon S3 bucket for object storage.",
  configSchema: s3NodeConfigSchema,
};

const lambdaService: ServiceDefinition = {
  id: "lambda",
  version: SERVICE_VERSION,
  displayName: "Lambda function",
  description: "AWS Lambda function with an execution role.",
  configSchema: lambdaNodeConfigSchema,
};

const SERVICES: ServiceDefinition[] = [s3Service, lambdaService];

export function getService(
  id: ServiceId,
  version: string,
): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.id === id && s.version === version);
}

export function listServices(): ServiceDefinition[] {
  return SERVICES;
}
