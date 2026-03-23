import type { RelationshipDefinition } from "../domain/catalogTypes.ts";
import type { GraphEdge, GraphNode } from "@shared/domain/graph.ts";

import type { GraphCompileContext } from "../graphCompileContext.ts";

export type { GraphCompileContext };

export type EdgeHandlerArgs = {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
};

export interface EdgeRelationshipHandler {
  readonly definition: RelationshipDefinition;
  apply(ctx: GraphCompileContext, args: EdgeHandlerArgs): void;
}
