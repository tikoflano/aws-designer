import { describe, expect, it } from "vitest";

import { RELATIONSHIP_VERSION } from "../registry/relationships";
import { SERVICE_VERSION } from "../registry/services";
import { generateCdkFromGraph } from "./generateCdkFromGraph";

describe("generateCdkFromGraph", () => {
  it("emits CDK for S3, Lambda, and lambda_reads_s3", () => {
    const result = generateCdkFromGraph(
      {
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
      },
      "DemoStack",
    );

    expect(result.ok).toBe(true);
    expect(result.cdkSource).toContain("export class DemoStack");
    expect(result.cdkSource).toContain('type: "AWS::S3::Bucket"');
    expect(result.cdkSource).toContain('type: "AWS::Lambda::Function"');
    expect(result.cdkSource).toContain('type: "AWS::IAM::Policy"');
    expect(result.cdkSource).toContain("cdk.Fn.");
  });

  it("merges S3 notification configs for s3_triggers_lambda", () => {
    const result = generateCdkFromGraph({
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
    expect(result.cdkSource).toContain("LambdaConfigurations");
    expect(result.cdkSource).toContain('type: "AWS::Lambda::Permission"');
  });
});
