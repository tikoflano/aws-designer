import type { ServiceId } from "@compiler/domain/serviceId.ts";

export type { ServiceId };

export type GraphNode = {
  id: string;
  serviceId: ServiceId;
  serviceVersion: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  /** React Flow handle id on the source node (when using multi-handle nodes). */
  sourceHandleId?: string;
  /** React Flow handle id on the target node. */
  targetHandleId?: string;
  relationshipId: string;
  relationshipVersion: string;
  config: Record<string, unknown>;
};

export type GraphDocument = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
