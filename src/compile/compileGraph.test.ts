import { describe, expect, it } from "vitest";

import { compileGraph } from "./compileGraph";
import { RELATIONSHIP_VERSION } from "../registry/relationships";
import { SERVICE_VERSION } from "../registry/services";

describe("compileGraph", () => {
  it("merges S3 and Lambda bases with lambda_reads_s3 IAM", () => {
    const result = compileGraph({
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
          config: { functionName: "myfn" },
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
    expect(result.ir).not.toBeNull();
    const bucket = result.ir!.resources.find((r) =>
      r.logicalId.startsWith("s3-bucket"),
    );
    expect(bucket?.type).toBe("AWS::S3::Bucket");
    const fn = result.ir!.resources.find((r) => r.logicalId.startsWith("lambda-fn"));
    expect(fn?.type).toBe("AWS::Lambda::Function");
    expect(result.ir!.iamPolicies.length).toBe(1);
    expect(result.ir!.iamPolicies[0].statements.some((s) => s.Action === "s3:GetObject")).toBe(
      true,
    );
  });

  it("merges S3 notification fragment for s3_triggers_lambda", () => {
    const result = compileGraph({
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
          config: { functionName: "myfn" },
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
    const bucket = result.ir!.resources.find((r) =>
      r.logicalId.startsWith("s3-bucket"),
    );
    const nc = bucket?.properties.NotificationConfiguration as {
      LambdaConfigurations?: unknown[];
    };
    expect(nc?.LambdaConfigurations?.length).toBeGreaterThan(0);
    const permission = result.ir!.resources.find((r) =>
      r.logicalId.startsWith("lambda-permission-s3"),
    );
    expect(permission?.type).toBe("AWS::Lambda::Permission");
  });
});
