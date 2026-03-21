import { z } from "zod";

import type { GraphEdge, GraphNode, ServiceId } from "../domain/types";
import type { InfrastructureFragment } from "../ir/types";

import { logicalBucketId, logicalLambdaId } from "./services";

export const RELATIONSHIP_VERSION = "1.0.0";

export const lambdaReadsS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
  includeListBucket: z.boolean().optional().default(false),
});

export const lambdaWritesS3ConfigSchema = z.object({
  objectKeyPrefix: z.string().optional().default(""),
});

export const s3TriggersLambdaConfigSchema = z.object({
  events: z
    .array(z.enum(["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]))
    .min(1)
    .default(["s3:ObjectCreated:*"]),
  prefix: z.string().optional().default(""),
  suffix: z.string().optional().default(""),
});

export type RelationshipDefinition = {
  id: string;
  version: string;
  name: string;
  description: string;
  source: ServiceId;
  target: ServiceId;
  configSchema: z.ZodType<Record<string, unknown>>;
  expand: (input: {
    edge: GraphEdge;
    sourceNode: GraphNode;
    targetNode: GraphNode;
  }) => InfrastructureFragment;
};

function objectArnForBucket(bucketLogicalId: string): unknown {
  return {
    "Fn::Join": ["", ["arn:aws:s3:::", { Ref: bucketLogicalId }, "/*"]],
  };
}

function bucketArnForList(bucketLogicalId: string): unknown {
  return { "Fn::Join": ["", ["arn:aws:s3:::", { Ref: bucketLogicalId }]] };
}

export const lambdaReadsS3: RelationshipDefinition = {
  id: "lambda_reads_s3",
  version: RELATIONSHIP_VERSION,
  name: "Lambda reads from S3",
  description:
    "Grants the Lambda execution role permission to read objects in the bucket (and optionally list by prefix).",
  source: "lambda",
  target: "s3",
  configSchema: lambdaReadsS3ConfigSchema,
  expand: ({ edge, sourceNode, targetNode }): InfrastructureFragment => {
    const cfg = lambdaReadsS3ConfigSchema.parse(edge.config);
    const bucketId = logicalBucketId(targetNode.id);
    const prefix = cfg.objectKeyPrefix ?? "";
    const objectResource =
      prefix.length > 0
        ? {
            "Fn::Sub": [
              `arn:aws:s3:::\${Bucket}/${prefix.replace(/\/$/, "")}/*`,
              { Bucket: { Ref: bucketId } },
            ],
          }
        : objectArnForBucket(bucketId);
    const statements = [
      {
        Effect: "Allow" as const,
        Action: "s3:GetObject",
        Resource: objectResource,
      },
    ];
    if (cfg.includeListBucket) {
      statements.push({
        Effect: "Allow" as const,
        Action: "s3:ListBucket",
        Resource: bucketArnForList(bucketId),
        ...(prefix
          ? {
              Condition: {
                StringLike: {
                  "s3:prefix": [`${prefix.replace(/\/$/, "")}*`],
                },
              },
            }
          : {}),
      });
    }
    return {
      resources: [],
      iamPolicies: [
        {
          id: `iam-${edge.id}-read`,
          attachment: {
            kind: "lambda_execution_role",
            lambdaNodeId: sourceNode.id,
          },
          statements,
        },
      ],
      links: [
        {
          id: `link-${edge.id}`,
          kind: "lambda_reads_s3",
          metadata: {
            edgeId: edge.id,
            lambdaNodeId: sourceNode.id,
            bucketNodeId: targetNode.id,
            objectKeyPrefix: prefix,
          },
        },
      ],
    };
  },
};

export const lambdaWritesS3: RelationshipDefinition = {
  id: "lambda_writes_s3",
  version: RELATIONSHIP_VERSION,
  name: "Lambda writes to S3",
  description:
    "Grants the Lambda execution role permission to put objects into the bucket.",
  source: "lambda",
  target: "s3",
  configSchema: lambdaWritesS3ConfigSchema,
  expand: ({ edge, sourceNode, targetNode }): InfrastructureFragment => {
    const cfg = lambdaWritesS3ConfigSchema.parse(edge.config);
    const bucketId = logicalBucketId(targetNode.id);
    const prefix = cfg.objectKeyPrefix ?? "";
    const objectResource =
      prefix.length > 0
        ? {
            "Fn::Sub": [
              `arn:aws:s3:::\${Bucket}/${prefix.replace(/\/$/, "")}/*`,
              { Bucket: { Ref: bucketId } },
            ],
          }
        : objectArnForBucket(bucketId);
    return {
      resources: [],
      iamPolicies: [
        {
          id: `iam-${edge.id}-write`,
          attachment: {
            kind: "lambda_execution_role",
            lambdaNodeId: sourceNode.id,
          },
          statements: [
            {
              Effect: "Allow",
              Action: ["s3:PutObject", "s3:PutObjectAcl"],
              Resource: objectResource,
            },
          ],
        },
      ],
      links: [
        {
          id: `link-${edge.id}`,
          kind: "lambda_writes_s3",
          metadata: {
            edgeId: edge.id,
            lambdaNodeId: sourceNode.id,
            bucketNodeId: targetNode.id,
            objectKeyPrefix: prefix,
          },
        },
      ],
    };
  },
};

export const s3TriggersLambda: RelationshipDefinition = {
  id: "s3_triggers_lambda",
  version: RELATIONSHIP_VERSION,
  name: "S3 invokes Lambda",
  description:
    "Object create/remove events in the bucket invoke the target Lambda (notification + invoke permission).",
  source: "s3",
  target: "lambda",
  configSchema: s3TriggersLambdaConfigSchema,
  expand: ({ edge, sourceNode, targetNode }): InfrastructureFragment => {
    const cfg = s3TriggersLambdaConfigSchema.parse(edge.config);
    const bucketId = logicalBucketId(sourceNode.id);
    const fnId = logicalLambdaId(targetNode.id);
    const permissionId = `lambda-permission-s3-${edge.id}`;
    const filterRules: { Name: string; Value: string }[] = [];
    if (cfg.prefix) filterRules.push({ Name: "prefix", Value: cfg.prefix });
    if (cfg.suffix) filterRules.push({ Name: "suffix", Value: cfg.suffix });
    const lambdaConfigurations = cfg.events.map((event) => {
      const entry: Record<string, unknown> = {
        Event: event,
        Function: { "Fn::GetAtt": [fnId, "Arn"] },
      };
      if (filterRules.length > 0) {
        entry.Filter = { S3Key: { Rules: filterRules } };
      }
      return entry;
    });
    return {
      resources: [
        {
          logicalId: bucketId,
          type: "AWS::S3::Bucket",
          properties: {
            NotificationConfiguration: {
              LambdaConfigurations: lambdaConfigurations,
            },
          },
        },
        {
          logicalId: permissionId,
          type: "AWS::Lambda::Permission",
          properties: {
            Action: "lambda:InvokeFunction",
            FunctionName: { Ref: fnId },
            Principal: "s3.amazonaws.com",
            SourceArn: { "Fn::GetAtt": [bucketId, "Arn"] },
            SourceAccount: { Ref: "AWS::AccountId" },
          },
        },
      ],
      iamPolicies: [],
      links: [
        {
          id: `link-${edge.id}`,
          kind: "s3_triggers_lambda",
          metadata: {
            edgeId: edge.id,
            bucketNodeId: sourceNode.id,
            lambdaNodeId: targetNode.id,
            events: cfg.events,
            prefix: cfg.prefix,
            suffix: cfg.suffix,
          },
        },
      ],
    };
  },
};

const ALL: RelationshipDefinition[] = [
  lambdaReadsS3,
  lambdaWritesS3,
  s3TriggersLambda,
];

export function listRelationships(
  source: ServiceId,
  target: ServiceId,
): RelationshipDefinition[] {
  return ALL.filter((r) => r.source === source && r.target === target);
}

export function getRelationship(
  id: string,
  version: string,
): RelationshipDefinition | undefined {
  return ALL.find((r) => r.id === id && r.version === version);
}
