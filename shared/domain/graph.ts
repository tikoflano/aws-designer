import type { ServiceId } from "@compiler/domain/serviceId.ts";
import { RELATIONSHIP_VERSION } from "@compiler/domain/catalogTypes.ts";
import type { RelationshipId } from "@compiler/edgeHandlers/relationshipIds.ts";

export type { RelationshipId, ServiceId };

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
  relationshipId: RelationshipId;
  relationshipVersion: typeof RELATIONSHIP_VERSION;
  config: Record<string, unknown>;
  /**
   * Position of the edge label along the connection path, 0 = start → 1 = end (by path length).
   * Omitted: use the path point closest to React Flow’s default label anchor.
   */
  labelAlongPath?: number;
};

export type GraphDocument = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
