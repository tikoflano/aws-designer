import { describe, expect, it } from "vitest";

import { RELATIONSHIP_VERSION } from "../registry/relationships";
import { SERVICE_VERSION } from "../registry/services";
import { validateGraph } from "./validateGraph";

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
});
