import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import type { Construct } from "constructs";

import type { GraphDocument } from "../src/domain/types.ts";
import {
  lambdaReadsS3ConfigSchema,
  lambdaWritesS3ConfigSchema,
  s3TriggersLambdaConfigSchema,
} from "../src/registry/relationships.ts";
import {
  lambdaNodeConfigSchema,
  sanitizeNodeIdForLogical,
  s3NodeConfigSchema,
} from "../src/registry/services.ts";

function nodeById(doc: GraphDocument, id: string) {
  return doc.nodes.find((n) => n.id === id);
}

function cfnId(prefix: string, nodeId: string): string {
  return `${prefix}${sanitizeNodeIdForLogical(nodeId)}`;
}

function mapRuntime(runtime: string): lambda.Runtime {
  const m: Record<string, lambda.Runtime> = {
    "nodejs18.x": lambda.Runtime.NODEJS_18_X,
    "nodejs20.x": lambda.Runtime.NODEJS_20_X,
    "nodejs22.x": lambda.Runtime.NODEJS_22_X,
    "python3.12": lambda.Runtime.PYTHON_3_12,
    "python3.13": lambda.Runtime.PYTHON_3_13,
  };
  return m[runtime] ?? lambda.Runtime.NODEJS_20_X;
}

function lambdaInlineCode(runtime: lambda.Runtime): lambda.Code {
  if (
    runtime === lambda.Runtime.PYTHON_3_12 ||
    runtime === lambda.Runtime.PYTHON_3_13
  ) {
    return lambda.Code.fromInline(
      "def lambda_handler(event, context):\n    return {}\n",
    );
  }
  return lambda.Code.fromInline(
    'exports.handler = async () => ({ statusCode: 200, body: "ok" });',
  );
}

export type GraphCompilerStackProps = cdk.StackProps & {
  graph: GraphDocument;
};

/**
 * Builds real CDK constructs from a validated {@link GraphDocument}.
 */
export class GraphCompilerStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: GraphCompilerStackProps) {
    super(scope, id, props);

    const { graph } = props;
    const buckets = new Map<string, s3.Bucket>();
    const functions = new Map<string, lambda.Function>();

    for (const node of graph.nodes) {
      if (node.serviceId === "s3") {
        const cfg = s3NodeConfigSchema.parse(node.config);
        const bucket = new s3.Bucket(this, cfnId("Bucket", node.id), {
          bucketName: cfg.bucketName,
          encryption: cfg.enforceEncryption
            ? s3.BucketEncryption.S3_MANAGED
            : undefined,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        buckets.set(node.id, bucket);
      } else if (node.serviceId === "lambda") {
        const cfg = lambdaNodeConfigSchema.parse(node.config);
        const rt = mapRuntime(cfg.runtime);
        const handler = cfg.runtime.startsWith("python")
          ? "lambda_function.lambda_handler"
          : cfg.handler;
        const fn = new lambda.Function(this, cfnId("Fn", node.id), {
          functionName: cfg.functionName,
          runtime: rt,
          handler,
          code: lambdaInlineCode(rt),
        });
        fn.role?.addManagedPolicy(
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole",
          ),
        );
        functions.set(node.id, fn);
      }
    }

    for (const edge of graph.edges) {
      const sourceNode = nodeById(graph, edge.sourceNodeId);
      const targetNode = nodeById(graph, edge.targetNodeId);
      if (!sourceNode || !targetNode) continue;

      if (edge.relationshipId === "lambda_reads_s3") {
        const cfg = lambdaReadsS3ConfigSchema.parse(edge.config);
        const bucket = buckets.get(targetNode.id);
        const fn = functions.get(sourceNode.id);
        if (!bucket || !fn) continue;
        const prefix = (cfg.objectKeyPrefix ?? "").replace(/\/$/, "");
        if (prefix.length > 0) {
          bucket.grantRead(fn, bucket.arnForObjects(`${prefix}/*`));
        } else {
          bucket.grantRead(fn);
        }
        if (cfg.includeListBucket) {
          fn.role?.addToPrincipalPolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["s3:ListBucket"],
              resources: [bucket.bucketArn],
              conditions:
                prefix.length > 0
                  ? {
                      StringLike: {
                        "s3:prefix": [`${prefix}*`],
                      },
                    }
                  : undefined,
            }),
          );
        }
      } else if (edge.relationshipId === "lambda_writes_s3") {
        const cfg = lambdaWritesS3ConfigSchema.parse(edge.config);
        const bucket = buckets.get(targetNode.id);
        const fn = functions.get(sourceNode.id);
        if (!bucket || !fn) continue;
        const prefix = (cfg.objectKeyPrefix ?? "").replace(/\/$/, "");
        if (prefix.length > 0) {
          bucket.grantPut(fn, bucket.arnForObjects(`${prefix}/*`));
        } else {
          bucket.grantPut(fn);
        }
      } else if (edge.relationshipId === "s3_triggers_lambda") {
        const cfg = s3TriggersLambdaConfigSchema.parse(edge.config);
        const bucket = buckets.get(sourceNode.id);
        const fn = functions.get(targetNode.id);
        if (!bucket || !fn) continue;

        const dest = new s3n.LambdaDestination(fn);
        const filters: s3.NotificationKeyFilter[] = [];
        if (cfg.prefix) {
          filters.push({ prefix: cfg.prefix });
        }
        if (cfg.suffix) {
          filters.push({ suffix: cfg.suffix });
        }

        for (const ev of cfg.events) {
          const eventType = ev.includes("ObjectCreated")
            ? s3.EventType.OBJECT_CREATED
            : s3.EventType.OBJECT_REMOVED;
          bucket.addEventNotification(eventType, dest, ...filters);
        }
      }
    }
  }
}
