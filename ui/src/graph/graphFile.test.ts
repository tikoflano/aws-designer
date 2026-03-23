import { describe, expect, it } from "vitest";

import {
  GRAPH_FILE_FORMAT_VERSION,
  GRAPH_FILE_KIND,
  graphDocumentToFile,
  graphFileToDocument,
  parseGraphFileJson,
  serializeGraphFile,
} from "./graphFile";

describe("graphFile", () => {
  it("round-trips through JSON", () => {
    const doc = {
      nodes: [
        {
          id: "n1",
          serviceId: "s3" as const,
          serviceVersion: "1.0.0",
          position: { x: 1, y: 2 },
          config: {},
        },
      ],
      edges: [],
    };
    const file = graphDocumentToFile(doc);
    const json = serializeGraphFile(file);
    const parsed = parseGraphFileJson(JSON.parse(json));
    expect(parsed.formatVersion).toBe(GRAPH_FILE_FORMAT_VERSION);
    expect(parsed.kind).toBe(GRAPH_FILE_KIND);
    expect(graphFileToDocument(parsed)).toEqual(doc);
  });
});
