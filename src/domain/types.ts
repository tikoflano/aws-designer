export type ServiceId = "s3" | "lambda";

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
  relationshipId: string;
  relationshipVersion: string;
  config: Record<string, unknown>;
};

export type GraphDocument = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
