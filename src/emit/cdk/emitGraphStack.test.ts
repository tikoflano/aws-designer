import { describe, expect, it } from "vitest";

import { compileGraph } from "../../compile/compileGraph";
import { RELATIONSHIP_VERSION } from "../../registry/relationships";
import { SERVICE_VERSION } from "../../registry/services";
import { emitCdkStackSource } from "./emitGraphStack";

describe("emitGraphStack", () => {
  it("emits a CDK stack class referencing merged resources", () => {
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
    const ts = emitCdkStackSource(result.ir!, "DemoStack");
    expect(ts).toContain("export class DemoStack");
    expect(ts).toContain('type: "AWS::S3::Bucket"');
    expect(ts).toContain('type: "AWS::Lambda::Function"');
    expect(ts).toContain('type: "AWS::IAM::Policy"');
    expect(ts).toContain("cdk.Fn.");
  });
});
