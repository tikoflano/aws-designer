import { z } from "zod";

import type { GraphNode, ServiceId } from "../domain/types";
import type { InfrastructureFragment } from "../ir/types";

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
  expandBase: (node: GraphNode) => InfrastructureFragment;
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

function sanitizeId(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9]/g, "");
}

const s3Service: ServiceDefinition = {
  id: "s3",
  version: SERVICE_VERSION,
  displayName: "S3 bucket",
  description: "Amazon S3 bucket for object storage.",
  configSchema: s3NodeConfigSchema,
  expandBase: (node): InfrastructureFragment => {
    const cfg = s3NodeConfigSchema.parse(node.config);
    const bucketId = logicalBucketId(node.id);
    const properties: Record<string, unknown> = {};
    if (cfg.bucketName) properties.BucketName = cfg.bucketName;
    if (cfg.enforceEncryption) {
      properties.BucketEncryption = {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
          },
        ],
      };
    }
    return {
      resources: [
        {
          logicalId: bucketId,
          type: "AWS::S3::Bucket",
          properties,
        },
      ],
      iamPolicies: [],
      links: [
        {
          id: `svc-link-s3-${node.id}`,
          kind: "service_node",
          metadata: { serviceId: "s3", nodeId: node.id },
        },
      ],
    };
  },
};

const lambdaService: ServiceDefinition = {
  id: "lambda",
  version: SERVICE_VERSION,
  displayName: "Lambda function",
  description: "AWS Lambda function with an execution role.",
  configSchema: lambdaNodeConfigSchema,
  expandBase: (node): InfrastructureFragment => {
    const cfg = lambdaNodeConfigSchema.parse(node.config);
    const fnId = logicalLambdaId(node.id);
    const roleId = logicalLambdaRoleId(node.id);
    return {
      resources: [
        {
          logicalId: roleId,
          type: "AWS::IAM::Role",
          properties: {
            AssumeRolePolicyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: { Service: "lambda.amazonaws.com" },
                  Action: "sts:AssumeRole",
                },
              ],
            },
            ManagedPolicyArns: [
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            ],
          },
        },
        {
          logicalId: fnId,
          type: "AWS::Lambda::Function",
          properties: {
            FunctionName: cfg.functionName,
            Handler: cfg.handler,
            Runtime: cfg.runtime,
            Role: { "Fn::GetAtt": [roleId, "Arn"] },
            Code: {
              ZipFile:
                'exports.handler = async () => ({ statusCode: 200, body: "ok" });',
            },
          },
          dependsOn: [roleId],
        },
      ],
      iamPolicies: [],
      links: [
        {
          id: `svc-link-lambda-${node.id}`,
          kind: "service_node",
          metadata: { serviceId: "lambda", nodeId: node.id },
        },
      ],
    };
  },
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
