import { z } from "zod";

import {
  DEFINITION_VERSION_V1,
  type ServiceDefinition,
} from "../../../domain/catalogTypes.ts";
import { randomShortId } from "../../randomNodeDefaults.ts";
import type { ServiceId } from "../../../domain/serviceId.ts";
import { NodeIds } from "../../nodeIds.ts";

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

const envVarNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function coerceIntInRange(
  defaultVal: number,
  min: number,
  max: number,
  minMsg: string,
  maxMsg: string,
) {
  return z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return defaultVal;
    const n = typeof val === "number" ? val : Number(val);
    if (!Number.isFinite(n)) return defaultVal;
    return Math.trunc(n);
  }, z.number().int().min(min, { message: minMsg }).max(max, { message: maxMsg }));
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
  /** Memory in MB (128–10240). */
  memorySizeMb: coerceIntInRange(
    128,
    128,
    10240,
    "Memory must be at least 128 MB.",
    "Memory must be at most 10240 MB.",
  ),
  /** Ephemeral storage in MB (512–10240). */
  ephemeralStorageMb: coerceIntInRange(
    512,
    512,
    10240,
    "Ephemeral storage must be at least 512 MB.",
    "Ephemeral storage must be at most 10240 MB.",
  ),
  /** Function timeout in seconds (1–900). */
  timeoutSeconds: coerceIntInRange(
    3,
    1,
    900,
    "Timeout must be at least 1 second.",
    "Timeout must be at most 900 seconds.",
  ),
  environmentVariables: z
    .record(z.string(), z.string())
    .default({})
    .superRefine((env, ctx) => {
      for (const k of Object.keys(env)) {
        if (!envVarNameRegex.test(k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid environment variable name "${k}". Use [A-Za-z][A-Za-z0-9_]*.`,
            path: ["environmentVariables"],
          });
          return;
        }
        if (k.startsWith("AWS_")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Environment variable "${k}" cannot start with AWS_.`,
            path: ["environmentVariables"],
          });
          return;
        }
      }
    }),
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
  version: DEFINITION_VERSION_V1,
  displayName: "Lambda function",
  description: "AWS Lambda function with an execution role.",
  configSchema: lambdaNodeConfigSchema,
  createDefaultConfig: () => ({ functionName: `fn-${randomShortId(6)}` }),
};
