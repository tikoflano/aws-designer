import { customAlphabet, nanoid } from "nanoid";
import { create } from "zustand";

import * as graphApi from "../api/graphApi";
import type { GraphDocument, GraphEdge, GraphNode, ServiceId } from "../domain/types";
import {
  getRelationship,
  RELATIONSHIP_VERSION,
  SERVICE_VERSION,
} from "@compiler/catalog.ts";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string };

/**
 * Start → end node order (matches RF `Connection` under Loose mode + all-source perimeter handles).
 */
export type PendingConnection = {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string;
  targetHandleId?: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const s3BucketNameSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

const DRAFT_KEY = "aws-designer-draft-v1";
const USE_SERVICE_ICONS_KEY = "aws-designer-use-service-icons-v1";

function readUseServiceIconsFromStorage(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const raw = localStorage.getItem(USE_SERVICE_ICONS_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return false;
  } catch {
    return false;
  }
}

function writeUseServiceIconsToStorage(value: boolean) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(USE_SERVICE_ICONS_KEY, value ? "true" : "false");
  } catch {
    /* quota / private mode */
  }
}

type DraftSnapshot = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  serverGraphId: string | null;
  serverUpdatedAt: string | null;
  serverVersion: number | null;
  graphTitle: string;
};

type GraphStateInner = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  graphTitle: string;
  selection: Selection | null;
  pendingConnection: PendingConnection | null;
  serverGraphId: string | null;
  serverUpdatedAt: string | null;
  serverVersion: number | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  /** Tap a service, then tap the canvas (mobile / no HTML5 DnD). Not persisted. */
  palettePlacement: ServiceId | null;
  setPalettePlacement: (serviceId: ServiceId | null) => void;
  /** When true, palette and canvas use AWS architecture icons (with delayed name tooltips). Persisted in localStorage. */
  useServiceIcons: boolean;
  setUseServiceIcons: (value: boolean) => void;
  /** True while the user is in "tap handles to connect" mode (entered via long-press on a node on touch devices). */
  connectingMode: boolean;
  setConnectingMode: (v: boolean) => void;
  /** Desktop: when true, inspector column is hidden. Starts true on load; cleared when selecting a node or edge. */
  inspectorDismissed: boolean;
  dismissInspector: () => void;
  addNode: (serviceId: ServiceId, position: { x: number; y: number }) => void;
  updateNode: (
    id: string,
    patch: Partial<Pick<GraphNode, "position" | "config">>,
  ) => void;
  removeNode: (id: string) => void;
  /** Start node → end node (matches RF Connection under Loose + all-source handles). */
  beginConnection: (
    sourceNodeId: string,
    targetNodeId: string,
    handles?: { sourceHandleId?: string; targetHandleId?: string },
  ) => void;
  cancelPendingConnection: () => void;
  confirmRelationship: (
    relationshipId: string,
    config?: Record<string, unknown>,
  ) => void;
  select: (selection: Selection | null) => void;
  updateEdgeConfig: (edgeId: string, config: Record<string, unknown>) => void;
  removeEdge: (edgeId: string) => void;
  replaceFromGraphDocument: (doc: GraphDocument) => void;
  setGraphTitle: (title: string) => void;
  commitGraphTitle: (
    title: string,
  ) => Promise<{ savedToServer: boolean }>;
  setServerMeta: (
    id: string | null,
    updatedAt: string | null,
    version: number | null,
  ) => void;
  saveToServer: () => Promise<void>;
  loadFromServer: (id: string, versionSeq?: number) => Promise<void>;
  newLocalGraph: () => void;
};

export type GraphState = GraphStateInner;

type GraphStateForDraft = Pick<
  GraphStateInner,
  | "nodes"
  | "edges"
  | "serverGraphId"
  | "serverUpdatedAt"
  | "serverVersion"
  | "graphTitle"
>;

function readDraftFromStorage(): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DraftSnapshot>;
    return {
      nodes: Array.isArray(p.nodes) ? p.nodes : [],
      edges: Array.isArray(p.edges) ? p.edges : [],
      serverGraphId:
        typeof p.serverGraphId === "string" ? p.serverGraphId : null,
      serverUpdatedAt:
        typeof p.serverUpdatedAt === "string" ? p.serverUpdatedAt : null,
      serverVersion:
        typeof p.serverVersion === "number" ? p.serverVersion : null,
      graphTitle: typeof p.graphTitle === "string" ? p.graphTitle : "",
    };
  } catch {
    return null;
  }
}

function writeDraftToStorage(s: DraftSnapshot) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
}

let lastPersistedJson = "";

export function persistDraftIfChanged(state: GraphStateForDraft) {
  const snap: DraftSnapshot = {
    nodes: state.nodes,
    edges: state.edges,
    serverGraphId: state.serverGraphId,
    serverUpdatedAt: state.serverUpdatedAt,
    serverVersion: state.serverVersion,
    graphTitle: state.graphTitle,
  };
  const json = JSON.stringify(snap);
  if (json === lastPersistedJson) return;
  lastPersistedJson = json;
  writeDraftToStorage(snap);
}

export function hydrateDraftFromStorage(): Partial<GraphStateInner> | null {
  const d = readDraftFromStorage();
  if (!d) return null;
  lastPersistedJson = JSON.stringify({
    nodes: d.nodes,
    edges: d.edges,
    serverGraphId: d.serverGraphId,
    serverUpdatedAt: d.serverUpdatedAt,
    serverVersion: d.serverVersion,
    graphTitle: d.graphTitle,
  });
  return {
    nodes: d.nodes,
    edges: d.edges,
    serverGraphId: d.serverGraphId,
    serverUpdatedAt: d.serverUpdatedAt,
    serverVersion: d.serverVersion,
    graphTitle: d.graphTitle,
  };
}

function defaultNodeConfig(serviceId: ServiceId): Record<string, unknown> {
  if (serviceId === "s3") {
    return { name: `b-${s3BucketNameSuffix()}` };
  }
  if (serviceId === "lambda") {
    return { functionName: `fn-${nanoid(6)}` };
  }
  if (serviceId === "route53") {
    return { name: "", type: "public" };
  }
  if (serviceId === "cloudfront") {
    return { name: `cf-${nanoid(6)}` };
  }
  return {};
}

export const useGraphStore = create<GraphStateInner>((set, get) => ({
  nodes: [],
  edges: [],
  graphTitle: "",
  selection: null,
  pendingConnection: null,
  serverGraphId: null,
  serverUpdatedAt: null,
  serverVersion: null,
  saveStatus: "idle",
  saveError: null,
  palettePlacement: null,
  useServiceIcons: readUseServiceIconsFromStorage(),
  connectingMode: false,
  inspectorDismissed: true,

  setPalettePlacement: (serviceId) => set({ palettePlacement: serviceId }),

  setConnectingMode: (v) => set({ connectingMode: v }),

  setUseServiceIcons: (value) => {
    writeUseServiceIconsToStorage(value);
    set({ useServiceIcons: value });
  },

  dismissInspector: () => set({ selection: null, inspectorDismissed: true }),

  addNode: (serviceId, position) => {
    const id = nanoid(10);
    const node: GraphNode = {
      id,
      serviceId,
      serviceVersion: SERVICE_VERSION,
      position,
      config: defaultNodeConfig(serviceId),
    };
    set((s) => ({
      nodes: [...s.nodes, node],
      selection: { kind: "node", id },
      palettePlacement: null,
      inspectorDismissed: false,
    }));
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

  beginConnection: (sourceNodeId, targetNodeId, handles) => {
    if (sourceNodeId === targetNodeId) return;
    set({
      pendingConnection: {
        sourceNodeId,
        targetNodeId,
        ...(handles?.sourceHandleId
          ? { sourceHandleId: handles.sourceHandleId }
          : {}),
        ...(handles?.targetHandleId
          ? { targetHandleId: handles.targetHandleId }
          : {}),
      },
    });
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
      ...(pending.sourceHandleId
        ? { sourceHandleId: pending.sourceHandleId }
        : {}),
      ...(pending.targetHandleId
        ? { targetHandleId: pending.targetHandleId }
        : {}),
      relationshipId: rel.id,
      relationshipVersion: rel.version,
      config: parsedConfig,
    };
    set((s) => ({
      edges: [...s.edges, edge],
      pendingConnection: null,
      selection: { kind: "edge", id: edge.id },
      inspectorDismissed: false,
    }));
  },

  select: (selection) =>
    set({
      selection,
      ...(selection ? { inspectorDismissed: false } : {}),
    }),

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

  replaceFromGraphDocument: (doc) => {
    set({
      nodes: doc.nodes,
      edges: doc.edges,
      selection: null,
      pendingConnection: null,
      palettePlacement: null,
      inspectorDismissed: true,
    });
  },

  setGraphTitle: (title) => set({ graphTitle: title }),

  commitGraphTitle: async (title) => {
    const trimmed = title.trim().slice(0, 200);
    set({ graphTitle: trimmed });
    const { serverGraphId } = get();
    if (!serverGraphId) return { savedToServer: false };
    const record = await graphApi.patchGraphTitle(serverGraphId, trimmed);
    set({
      serverUpdatedAt: record.updatedAt,
      serverVersion: record.version,
    });
    return { savedToServer: true };
  },

  setServerMeta: (id, updatedAt, version) => {
    set({
      serverGraphId: id,
      serverUpdatedAt: updatedAt,
      serverVersion: version,
    });
  },

  saveToServer: async () => {
    set({ saveStatus: "saving", saveError: null });
    try {
      const { nodes, edges, serverGraphId, graphTitle } = get();
      const graph: GraphDocument = { nodes, edges };
      const desiredTitle = graphTitle.trim().slice(0, 200);
      let record: graphApi.GraphRecord;
      if (!serverGraphId) {
        const created = await graphApi.postGraph();
        record = await graphApi.putGraph(created.id, graph);
      } else {
        record = await graphApi.putGraph(serverGraphId, graph);
      }
      if (desiredTitle !== record.title) {
        record = await graphApi.patchGraphTitle(record.id, desiredTitle);
      }
      set({
        serverGraphId: record.id,
        serverUpdatedAt: record.updatedAt,
        serverVersion: record.version,
        graphTitle: record.title,
        saveStatus: "saved",
        saveError: null,
      });
    } catch (e) {
      set({
        saveStatus: "error",
        saveError: e instanceof Error ? e.message : String(e),
      });
    }
  },

  loadFromServer: async (id, versionSeq) => {
    set({ saveStatus: "idle", saveError: null });
    const record =
      versionSeq === undefined
        ? await graphApi.getGraph(id)
        : await graphApi.getGraphVersion(id, versionSeq);
    set({
      nodes: record.graph.nodes,
      edges: record.graph.edges,
      graphTitle: record.title,
      selection: null,
      pendingConnection: null,
      palettePlacement: null,
      inspectorDismissed: true,
      serverGraphId: record.id,
      serverUpdatedAt: record.updatedAt,
      serverVersion: record.version,
    });
  },

  newLocalGraph: () => {
    lastPersistedJson = "";
    localStorage.removeItem(DRAFT_KEY);
    set({
      nodes: [],
      edges: [],
      graphTitle: "",
      selection: null,
      pendingConnection: null,
      palettePlacement: null,
      inspectorDismissed: true,
      serverGraphId: null,
      serverUpdatedAt: null,
      serverVersion: null,
      saveStatus: "idle",
      saveError: null,
    });
  },
}));

useGraphStore.subscribe((state) => {
  persistDraftIfChanged(state);
});
