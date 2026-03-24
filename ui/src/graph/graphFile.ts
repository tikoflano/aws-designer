import { z } from "zod";

import {
  RELATIONSHIP_VERSION,
  relationshipIdZodSchema,
  serviceIdGraphSchema,
} from "@compiler/catalog.ts";
import { migrateLegacyGraphDocument } from "@shared/domain/migrateLegacyGraph.ts";
import type { GraphDocument, GraphEdge, GraphNode } from "../domain/types";

export const GRAPH_FILE_FORMAT_VERSION = 1 as const;

export const GRAPH_FILE_KIND = "aws-designer-graph" as const;

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const graphNodeSchema = z.object({
  id: z.string().min(1),
  serviceId: serviceIdGraphSchema,
  serviceVersion: z.string().min(1),
  position: positionSchema,
  config: z.record(z.string(), z.unknown()),
});

const graphEdgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  sourceHandleId: z.string().min(1).optional(),
  targetHandleId: z.string().min(1).optional(),
  relationshipId: relationshipIdZodSchema,
  relationshipVersion: z.literal(RELATIONSHIP_VERSION),
  config: z.record(z.string(), z.unknown()),
  labelAlongPath: z.number().min(0).max(1).optional(),
});

export const graphFileSchema = z.object({
  formatVersion: z.literal(GRAPH_FILE_FORMAT_VERSION),
  kind: z.literal(GRAPH_FILE_KIND),
  title: z.string().optional(),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type GraphFileV1 = z.infer<typeof graphFileSchema>;

export function graphDocumentToFile(
  doc: GraphDocument,
  title?: string,
): GraphFileV1 {
  const t = title?.trim() ?? "";
  return {
    formatVersion: GRAPH_FILE_FORMAT_VERSION,
    kind: GRAPH_FILE_KIND,
    ...(t ? { title: t } : {}),
    nodes: doc.nodes as GraphNode[],
    edges: doc.edges as GraphEdge[],
  };
}

export function graphFileToDocument(file: GraphFileV1): GraphDocument {
  return migrateLegacyGraphDocument({
    nodes: file.nodes as GraphNode[],
    edges: file.edges,
  });
}

export function parseGraphFileJson(raw: unknown): GraphFileV1 {
  const parsed = graphFileSchema.parse(raw);
  const migrated = migrateLegacyGraphDocument({
    nodes: parsed.nodes as GraphNode[],
    edges: parsed.edges,
  });
  return {
    ...parsed,
    nodes: migrated.nodes as GraphFileV1["nodes"],
  };
}

export function serializeGraphFile(file: GraphFileV1): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}
