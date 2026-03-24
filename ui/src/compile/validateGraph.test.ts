import { describe, expect, it } from "vitest";

import { DEFINITION_VERSION_V1, RelationshipIds } from "@compiler/catalog.ts";
import { validateGraph } from "@compiler/validateGraph.ts";

describe("validateGraph", () => {
  it("accepts S3 + Lambda + lambda_reads_s3", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "s1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "s1",
          relationshipId: RelationshipIds.lambda_reads_s3,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts s3_triggers_lambda when S3 node exists", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "s1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "s1",
          targetNodeId: "l1",
          relationshipId: RelationshipIds.s3_triggers_lambda,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects cloudfront node without a distribution name", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      edges: [],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "cloudfront_missing_name")).toBe(true);
  });

  it("accepts cloudfront node with only a name (no S3 origin edge yet)", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "cdn" },
        },
      ],
      edges: [],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts S3 + cloudfront + route53 with origin and alias edges", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "b1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "app-cdn" },
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {
            name: "example.com",
            type: "public",
          },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: RelationshipIds.cloudfront_origin_s3,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
        {
          id: "ea",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: RelationshipIds.route53_alias_cloudfront,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {
            domainName: "www.example.com",
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate route53_alias_cloudfront targeting the same distribution", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "b1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "app-cdn" },
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
        {
          id: "r2",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: RelationshipIds.cloudfront_origin_s3,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
        {
          id: "ea1",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: RelationshipIds.route53_alias_cloudfront,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {
            domainName: "www.example.com",
          },
        },
        {
          id: "ea2",
          sourceNodeId: "r2",
          targetNodeId: "cf1",
          relationshipId: RelationshipIds.route53_alias_cloudfront,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {
            domainName: "app.example.com",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "duplicate_route53_alias_cloudfront"),
    ).toBe(true);
  });

  it("accepts Route 53 node with empty name when no alias edge exists", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "", type: "public" },
        },
      ],
      edges: [],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects route53_alias_cloudfront when Route 53 DNS fields are incomplete", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "b1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "app-cdn" },
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: RelationshipIds.cloudfront_origin_s3,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
        {
          id: "ea",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: RelationshipIds.route53_alias_cloudfront,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {
            domainName: "",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "route53_alias_incomplete_dns"),
    ).toBe(true);
  });

  it("rejects route53_alias_cloudfront when domain is not under the hosted zone", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "b1",
          serviceId: "s3",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "validate-test-bucket" },
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "app-cdn" },
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: RelationshipIds.cloudfront_origin_s3,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
        {
          id: "ea",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: RelationshipIds.route53_alias_cloudfront,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {
            domainName: "www.other.com",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "route53_alias_domain_not_in_zone"),
    ).toBe(true);
  });

  it("accepts Lambda + Secrets Manager + lambda_reads_secretsmanager", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
        {
          id: "sm1",
          serviceId: "secretsmanager",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {
            name: "app/other",
            secretKey: "token",
            secretValue: "",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "sm1",
          relationshipId: RelationshipIds.lambda_reads_secretsmanager,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects lambda_reads_secretsmanager when target is not a valid secret node", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
        {
          id: "sm1",
          serviceId: "secretsmanager",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "sm1",
          relationshipId: RelationshipIds.lambda_reads_secretsmanager,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "lambda_secret_edge_without_secret"),
    ).toBe(true);
  });

  it("rejects sqs_subscribes_sns_fifo when the queue is not FIFO", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "std-q", queueType: "standard" },
        },
        {
          id: "t1",
          serviceId: "sns_fifo",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "ev.fifo", fifoThroughputScope: "message_group" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.sqs_subscribes_sns_fifo,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "sns_fifo_sqs_requires_fifo_queue"),
    ).toBe(true);
  });

  it("accepts lambda_reads_dynamodb and lambda_writes_dynamodb", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
        {
          id: "d1",
          serviceId: "dynamodb",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {
            name: "app-items",
            partitionKeyName: "pk",
            partitionKeyType: "string",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "d1",
          relationshipId: RelationshipIds.lambda_reads_dynamodb,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
        {
          id: "e2",
          sourceNodeId: "l1",
          targetNodeId: "d1",
          relationshipId: RelationshipIds.lambda_writes_dynamodb,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts sqs_subscribes_sns_fifo with a FIFO queue", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "jobs.fifo", queueType: "fifo" },
        },
        {
          id: "t1",
          serviceId: "sns_fifo",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "ev.fifo", fifoThroughputScope: "message_group" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.sqs_subscribes_sns_fifo,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts sqs_triggers_lambda when SQS and Lambda nodes exist", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-lambda-trigger-q", queueType: "standard" },
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSqsConsumer" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "q1",
          targetNodeId: "l1",
          relationshipId: RelationshipIds.sqs_triggers_lambda,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts lambda_sends_sqs when Lambda and SQS nodes exist", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSqsProducer" },
        },
        {
          id: "q1",
          serviceId: "sqs",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-lambda-send-q", queueType: "standard" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "q1",
          relationshipId: RelationshipIds.lambda_sends_sqs,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts lambda_publishes_sns_standard when Lambda and standard SNS exist", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSnsPublishStdFn" },
        },
        {
          id: "t1",
          serviceId: "sns_standard",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { name: "fixture-pub-std-topic" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.lambda_publishes_sns_standard,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("accepts lambda_publishes_sns_fifo when Lambda and FIFO SNS exist", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: { functionName: "fixtureSnsPublishFifoFn" },
        },
        {
          id: "t1",
          serviceId: "sns_fifo",
          serviceVersion: DEFINITION_VERSION_V1,
          position: { x: 0, y: 0 },
          config: {
            name: "fixture-pub-fifo.fifo",
            fifoThroughputScope: "message_group",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "t1",
          relationshipId: RelationshipIds.lambda_publishes_sns_fifo,
          relationshipVersion: DEFINITION_VERSION_V1,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("migrates legacy semver 1.0.0 version strings to integers", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "s1",
          serviceId: "s3",
          serviceVersion: "1.0.0",
          position: { x: 0, y: 0 },
          config: { name: "legacy-ver-bucket" },
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: "1.0.0",
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "s1",
          relationshipId: RelationshipIds.lambda_reads_s3,
          relationshipVersion: "1.0.0",
          config: {},
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wire input before migration
    } as any);
    expect(result.ok).toBe(true);
  });
});
