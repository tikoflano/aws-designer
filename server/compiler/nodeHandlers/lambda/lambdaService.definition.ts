import { z } from "zod";

import {
  SERVICE_VERSION,
  type ServiceDefinition,
} from "../../domain/catalogTypes.ts";
import type { ServiceId } from "../../domain/serviceId.ts";
import { NodeIds } from "../nodeIds.ts";

/** CloudFormation inline ZipFile limit is 4096 bytes; stay under for safety. */
export const LAMBDA_INLINE_SOURCE_MAX = 4000 as const;

const lambdaRuntimeSchema = z.enum([
  "nodejs18.x",
  "nodejs20.x",
  "nodejs22.x",
  "python3.12",
  "python3.13",
]);

export type LambdaRuntime = z.infer<typeof lambdaRuntimeSchema>;

const DEFAULT_INLINE_NODE =
  'exports.handler = async () => ({ statusCode: 200, body: "ok" });';

const DEFAULT_INLINE_PYTHON = `def lambda_handler(event, context):
    return {}
`;

export function defaultInlineSourceForRuntime(runtime: LambdaRuntime): string {
  return runtime.startsWith("python") ? DEFAULT_INLINE_PYTHON : DEFAULT_INLINE_NODE;
}

export const lambdaNodeConfigSchema = z.object({
  functionName: z
    .string()
    .min(1, { message: "Function name is required." })
    .max(64, { message: "Function name must be at most 64 characters." })
    .regex(/^[a-zA-Z0-9-_]+$/, {
      message: "Use only letters, numbers, hyphens, and underscores.",
    })
    .default("function"),
  handler: z
    .string()
    .min(1, { message: "Handler is required (e.g. index.handler)." })
    .default("index.handler"),
  runtime: lambdaRuntimeSchema.default("nodejs20.x"),
  inlineSource: z
    .string()
    .max(LAMBDA_INLINE_SOURCE_MAX, {
      message: `Inline source must be at most ${LAMBDA_INLINE_SOURCE_MAX} characters (CloudFormation inline limit).`,
    })
    .optional(),
});

export function logicalLambdaId(nodeId: string): string {
  return `lambda-fn-${sanitizeId(nodeId)}`;
}

export function logicalLambdaRoleId(nodeId: string): string {
  return `lambda-role-${sanitizeId(nodeId)}`;
}

function sanitizeId(nodeId: string): string {
  return NodeIds.sanitizeNodeIdForLogical(nodeId);
}

export const lambdaServiceDefinition: ServiceDefinition = {
  id: "lambda" satisfies ServiceId,
  version: SERVICE_VERSION,
  displayName: "Lambda function",
  description: "AWS Lambda function with an execution role.",
  configSchema: lambdaNodeConfigSchema,
};
