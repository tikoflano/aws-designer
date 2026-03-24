import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";

import { graphFileToDocument, parseGraphFileJson } from "../../ui/src/graph/graphFile.ts";
import { RelationshipIds } from "./catalog.ts";
import { GraphCompilerStack } from "./graphCompilerStack.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("GraphCompilerStack", () => {
  it("synthesizes bucket, function, and policies for lambda_reads_s3 fixture", () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "fixtures/lambda-reads-s3.json"), "utf-8"),
    );
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "FixtureStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::IAM::Policy", 1);
  });

  it("embeds custom lambda inlineSource in the synthesized template", () => {
    const marker = "exports.handler = async () => ({ statusCode: 418 });";
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            functionName: "customInlineFn",
            inlineSource: marker,
          },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "InlineSourceStack", { graph: doc });
    const template = Template.fromStack(stack);

    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("418");
  });

  it("synthesizes CloudFront distribution and Route 53 alias for fixture", () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "fixtures/cloudfront-route53-s3.json"), "utf-8"),
    );
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "CfR53Stack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
    template.resourceCountIs("AWS::Route53::RecordSet", 1);
  });

  it("synthesizes Secrets Manager secret with JSON key/value", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "sm1",
          serviceId: "secretsmanager",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture/other-secret",
            secretKey: "apiKey",
            secretValue: "fixture-value-xyz",
          },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SecretsStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SecretsManager::Secret", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture/other-secret");
    expect(json).toContain("apiKey");
    expect(json).toContain("fixture-value-xyz");
  });

  it("grants Lambda read/write on Secrets Manager via graph edges", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { functionName: "fnWithSecrets" },
        },
        {
          id: "sm1",
          serviceId: "secretsmanager",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture/lambda-secret",
            secretKey: "k",
            secretValue: "v",
          },
        },
      ],
      edges: [
        {
          id: "er",
          sourceNodeId: "l1",
          targetNodeId: "sm1",
          relationshipId: RelationshipIds.lambda_reads_secretsmanager,
          relationshipVersion: 1,
          config: {},
        },
        {
          id: "ew",
          sourceNodeId: "l1",
          targetNodeId: "sm1",
          relationshipId: RelationshipIds.lambda_writes_secretsmanager,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "LambdaSecretStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SecretsManager::Secret", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("secretsmanager:GetSecretValue");
    expect(json).toContain("secretsmanager:PutSecretValue");
  });

  it("synthesizes FIFO SNS topic with encryption and deduplication", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "n1",
          serviceId: "sns_fifo",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture-events.fifo",
            fifoThroughputScope: "topic",
          },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SnsStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Topic", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture-events.fifo");
    expect(json).toContain('"FifoTopic":true');
    expect(json).toContain('"ContentBasedDeduplication":true');
    expect(json).toContain("FifoThroughputScope");
    expect(json).toContain("Topic");
  });

  it("synthesizes standard SNS topic without FIFO attributes", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "n1",
          serviceId: "sns_standard",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-standard" },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SnsStdStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Topic", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture-standard");
    expect(json).toContain('"FifoTopic":false');
    expect(json).not.toContain("FifoThroughputScope");
    expect(json).not.toContain("ContentBasedDeduplication");
  });

  it("synthesizes standard SQS queue with DLQ and resolver defaults", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-work", queueType: "standard" },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SqsStdStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture-work");
    expect(json).toContain("fixture-work-dlq");
    expect(json).toContain('"VisibilityTimeout":30');
    expect(json).toContain('"MessageRetentionPeriod":345600');
    expect(json).toContain('"MaximumMessageSize":1048576');
    expect(json).toContain('"SqsManagedSseEnabled":true');
    expect(json).toContain('"maxReceiveCount":10');
    expect(json).not.toContain('"FifoQueue":true');
  });

  it("synthesizes FIFO SQS queue and FIFO DLQ", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-jobs.fifo", queueType: "fifo" },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SqsFifoStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SQS::Queue", 2);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture-jobs.fifo");
    expect(json).toContain("fixture-jobs-dlq.fifo");
    expect(json).toContain('"FifoQueue":true');
  });

  it("creates SNS subscription from standard topic to SQS queue", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-sub-q", queueType: "standard" },
        },
        {
          id: "t1",
          serviceId: "sns_standard",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-sub-topic" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.sqs_subscribes_sns_standard,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SnsSqsSubStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Subscription", 1);
  });

  it("creates SNS subscription from standard topic to Lambda", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSnsSubFn" },
        },
        {
          id: "t1",
          serviceId: "sns_standard",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-lambda-topic" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.lambda_subscribes_sns_standard,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SnsLambdaSubStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Subscription", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("lambda:InvokeFunction");
  });

  it("creates SNS subscription from FIFO topic to FIFO queue", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-fifo-q.fifo", queueType: "fifo" },
        },
        {
          id: "t1",
          serviceId: "sns_fifo",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture-fifo-topic.fifo",
            fifoThroughputScope: "message_group",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.sqs_subscribes_sns_fifo,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SnsFifoSqsSubStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::SNS::Subscription", 1);
  });

  it("synthesizes DynamoDB table with partition key only", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "d1",
          serviceId: "dynamodb",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture-ddb-table",
            partitionKeyName: "pk",
            partitionKeyType: "string",
          },
        },
      ],
      edges: [],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "DdbStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::DynamoDB::Table", 1);
    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("fixture-ddb-table");
    expect(json).toContain("PAY_PER_REQUEST");
  });

  it("grants Lambda read/write on DynamoDB via graph edges", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureDdbFn" },
        },
        {
          id: "d1",
          serviceId: "dynamodb",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture-ddb-access",
            partitionKeyName: "id",
            partitionKeyType: "string",
          },
        },
      ],
      edges: [
        {
          id: "er",
          sourceNodeId: "l1",
          targetNodeId: "d1",
          relationshipId: RelationshipIds.lambda_reads_dynamodb,
          relationshipVersion: 1,
          config: {},
        },
        {
          id: "ew",
          sourceNodeId: "l1",
          targetNodeId: "d1",
          relationshipId: RelationshipIds.lambda_writes_dynamodb,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "LambdaDdbStack", { graph: doc });
    const template = Template.fromStack(stack);

    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("dynamodb:GetItem");
    expect(json).toContain("dynamodb:PutItem");
  });

  it("creates Lambda event source mapping from SQS queue", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-esm-q", queueType: "standard" },
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSqsEsmFn" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "l1",
          relationshipId: RelationshipIds.sqs_triggers_lambda,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "SqsLambdaEsmStack", { graph: doc });
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);
  });

  it("grants Lambda sqs:SendMessage on queue via lambda_sends_sqs edge", () => {
    const raw = {
      formatVersion: 1,
      kind: "aws-designer-graph",
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSqsSendFn" },
        },
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: 1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-send-target-q", queueType: "standard" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "q1",
          relationshipId: RelationshipIds.lambda_sends_sqs,
          relationshipVersion: 1,
          config: {},
        },
      ],
    };
    const doc = graphFileToDocument(parseGraphFileJson(raw));

    const app = new App({ outdir: join(__dirname, "../../cdk.out.test") });
    const stack = new GraphCompilerStack(app, "LambdaSqsSendStack", { graph: doc });
    const template = Template.fromStack(stack);

    const json = JSON.stringify(template.toJSON());
    expect(json).toContain("sqs:SendMessage");
  });
});
