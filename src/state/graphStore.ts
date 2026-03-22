import { nanoid } from "nanoid";
import { create } from "zustand";

import { generateCdkFromGraph } from "../compile/generateCdkFromGraph";
import type { GenerateCdkResult } from "../compile/types";
import type { GraphDocument, GraphEdge, GraphNode, ServiceId } from "../domain/types";
import { getRelationship, RELATIONSHIP_VERSION } from "../registry/relationships";
import { SERVICE_VERSION } from "../registry/services";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

export type PendingConnection = {
  sourceNodeId: string;
  targetNodeId: string;
};

type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selection: Selection | null;
  pendingConnection: PendingConnection | null;
  lastCompile: GenerateCdkResult | null;
  addNode: (serviceId: ServiceId, position: { x: number; y: number }) => void;
  updateNode: (
    id: string,
    patch: Partial<Pick<GraphNode, "position" | "config">>,
  ) => void;
  removeNode: (id: string) => void;
  beginConnection: (sourceNodeId: string, targetNodeId: string) => void;
  cancelPendingConnection: () => void;
  confirmRelationship: (
    relationshipId: string,
    config?: Record<string, unknown>,
  ) => void;
  select: (selection: Selection | null) => void;
  updateEdgeConfig: (edgeId: string, config: Record<string, unknown>) => void;
  removeEdge: (edgeId: string) => void;
  runCompile: () => void;
  replaceFromGraphDocument: (doc: GraphDocument) => void;
};

function defaultNodeConfig(serviceId: ServiceId): Record<string, unknown> {
  if (serviceId === "lambda") {
    return { functionName: `fn-${nanoid(6)}` };
  }
  return {};
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selection: null,
  pendingConnection: null,
  lastCompile: null,

  addNode: (serviceId, position) => {
    const id = nanoid(10);
    const node: GraphNode = {
      id,
      serviceId,
      serviceVersion: SERVICE_VERSION,
      position,
      config: defaultNodeConfig(serviceId),
    };
    set((s) => ({ nodes: [...s.nodes, node], selection: { kind: "node", id } }));
  },

  updateNode: (id, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          ...(patch.position !== undefined ? { position: patch.position } : {}),
          ...(patch.config !== undefined ? { config: patch.config } : {}),
        };
      }),
    }));
  },

  removeNode: (id) => {
    set((s) => {
      const edges = s.edges.filter(
        (e) => e.sourceNodeId !== id && e.targetNodeId !== id,
      );
      let selection = s.selection;
      if (selection?.kind === "node" && selection.id === id) {
        selection = null;
      } else if (selection && selection.kind === "edge") {
        const selectedEdgeId = selection.id;
        const e = s.edges.find((x) => x.id === selectedEdgeId);
        if (e && (e.sourceNodeId === id || e.targetNodeId === id)) {
          selection = null;
        }
      }
      return {
        nodes: s.nodes.filter((n) => n.id !== id),
        edges,
        selection,
      };
    });
  },

  beginConnection: (sourceNodeId, targetNodeId) => {
    if (sourceNodeId === targetNodeId) return;
    set({ pendingConnection: { sourceNodeId, targetNodeId } });
  },

  cancelPendingConnection: () => set({ pendingConnection: null }),

  confirmRelationship: (relationshipId, config) => {
    const pending = get().pendingConnection;
    if (!pending) return;
    const rel = getRelationship(relationshipId, RELATIONSHIP_VERSION);
    if (!rel) {
      set({ pendingConnection: null });
      return;
    }
    const parsedConfig = rel.configSchema.parse(config ?? {});
    const edge: GraphEdge = {
      id: nanoid(10),
      sourceNodeId: pending.sourceNodeId,
      targetNodeId: pending.targetNodeId,
      relationshipId: rel.id,
      relationshipVersion: rel.version,
      config: parsedConfig,
    };
    set((s) => ({
      edges: [...s.edges, edge],
      pendingConnection: null,
      selection: { kind: "edge", id: edge.id },
    }));
  },

  select: (selection) => set({ selection }),

  updateEdgeConfig: (edgeId, config) => {
    set((s) => ({
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, config } : e)),
    }));
  },

  removeEdge: (edgeId) => {
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== edgeId),
      selection:
        s.selection?.kind === "edge" && s.selection.id === edgeId
          ? null
          : s.selection,
    }));
  },

  runCompile: () => {
    const { nodes, edges } = get();
    const result = generateCdkFromGraph({ nodes, edges });
    set({ lastCompile: result });
  },

  replaceFromGraphDocument: (doc) => {
    set({
      nodes: doc.nodes,
      edges: doc.edges,
      selection: null,
      pendingConnection: null,
      lastCompile: null,
    });
  },
}));
