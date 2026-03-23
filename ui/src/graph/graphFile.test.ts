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
          config: { name: "roundtrip-bucket-name" },
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

  it("includes title in export when provided", () => {
    const doc = { nodes: [], edges: [] };
    const file = graphDocumentToFile(doc, "  My stack  ");
    expect(file.title).toBe("My stack");
    const parsed = parseGraphFileJson(JSON.parse(serializeGraphFile(file)));
    expect(parsed.title).toBe("My stack");
    expect(graphFileToDocument(parsed)).toEqual(doc);
  });

  it("omits title in JSON when empty", () => {
    const doc = { nodes: [], edges: [] };
    const file = graphDocumentToFile(doc, "   ");
    expect(file.title).toBeUndefined();
  });

  it("migrates legacy sns nodes to sns_standard or sns_fifo on parse", () => {
    const raw = {
      formatVersion: GRAPH_FILE_FORMAT_VERSION,
      kind: GRAPH_FILE_KIND,
      nodes: [
        {
          id: "a",
          serviceId: "sns",
          serviceVersion: "1.0.0",
          position: { x: 0, y: 0 },
          config: { name: "std", topicType: "standard" },
        },
        {
          id: "b",
          serviceId: "sns",
          serviceVersion: "1.0.0",
          position: { x: 0, y: 0 },
          config: { name: "q.fifo", topicType: "fifo", fifoThroughputScope: "topic" },
        },
      ],
      edges: [],
    };
    const parsed = parseGraphFileJson(raw);
    expect(parsed.nodes[0].serviceId).toBe("sns_standard");
    expect(parsed.nodes[0].config).toEqual({ name: "std" });
    expect(parsed.nodes[1].serviceId).toBe("sns_fifo");
    expect(parsed.nodes[1].config).toEqual({
      name: "q.fifo",
      fifoThroughputScope: "topic",
    });
  });
});
