import { describe, expect, it } from "vitest";

import {
  RELATIONSHIP_VERSION,
  SERVICE_VERSION,
} from "@compiler/catalog.ts";
import { validateGraph } from "@compiler/validateGraph.ts";

describe("validateGraph", () => {
  it("accepts S3 + Lambda + lambda_reads_s3", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "s1",
          serviceId: "s3",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "l1",
          targetNodeId: "s1",
          relationshipId: "lambda_reads_s3",
          relationshipVersion: RELATIONSHIP_VERSION,
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
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "l1",
          serviceId: "lambda",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: { functionName: "demo" },
        },
      ],
      edges: [
        {
          id: "e1",
          sourceNodeId: "s1",
          targetNodeId: "l1",
          relationshipId: "s3_triggers_lambda",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {},
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects cloudfront node without exactly one cloudfront_origin_s3 edge", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      edges: [],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "cloudfront_origin_s3_count")).toBe(true);
  });

  it("accepts S3 + cloudfront + route53 with origin and alias edges", () => {
    const result = validateGraph({
      nodes: [
        {
          id: "b1",
          serviceId: "s3",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: SERVICE_VERSION,
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
          relationshipId: "cloudfront_origin_s3",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {},
        },
        {
          id: "ea",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: "route53_alias_cloudfront",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {
            domainName: "www.example.com",
            hostedZoneId: "Z123",
            certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/abc",
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
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
        {
          id: "r2",
          serviceId: "route53",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: "cloudfront_origin_s3",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {},
        },
        {
          id: "ea1",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: "route53_alias_cloudfront",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {
            domainName: "www.example.com",
            hostedZoneId: "Z123",
            certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/abc",
          },
        },
        {
          id: "ea2",
          sourceNodeId: "r2",
          targetNodeId: "cf1",
          relationshipId: "route53_alias_cloudfront",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {
            domainName: "app.example.com",
            hostedZoneId: "Z123",
            certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/abc",
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
          serviceVersion: SERVICE_VERSION,
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
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "cf1",
          serviceId: "cloudfront",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "r1",
          serviceId: "route53",
          serviceVersion: SERVICE_VERSION,
          position: { x: 0, y: 0 },
          config: { name: "example.com", type: "public" },
        },
      ],
      edges: [
        {
          id: "eo",
          sourceNodeId: "cf1",
          targetNodeId: "b1",
          relationshipId: "cloudfront_origin_s3",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {},
        },
        {
          id: "ea",
          sourceNodeId: "r1",
          targetNodeId: "cf1",
          relationshipId: "route53_alias_cloudfront",
          relationshipVersion: RELATIONSHIP_VERSION,
          config: {
            domainName: "",
            hostedZoneId: "Z1",
            certificateArn: "arn:aws:acm:us-east-1:123:certificate/x",
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.code === "route53_alias_incomplete_dns"),
    ).toBe(true);
  });
});
