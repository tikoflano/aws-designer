import {
  Background,
  Controls,
  ConnectionMode,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useStoreApi,
  type Connection,
  type Edge,
  type EdgeTypes,
  type IsValidConnection,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnectEnd,
  type OnConnectStart,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useCallback,
  useEffect,
  useMemo,
  type DragEvent,
  type MouseEvent,
} from "react";

import type { ServiceId } from "../../domain/types";
import {
  getRelationship,
  getService,
  hasRelationshipBetween,
  listServices,
} from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";
import { PALETTE_DRAG_MIME } from "../palette/ServicePalette";
import { CanvasGraphMenu } from "./CanvasGraphMenu";
import { CanvasPaletteToggle } from "./CanvasPaletteToggle";
import { CloudFrontCanvasNode } from "./nodes/CloudFrontCanvasNode";
import { LambdaCanvasNode } from "./nodes/LambdaCanvasNode";
import { Route53CanvasNode } from "./nodes/Route53CanvasNode";
import { SecretsManagerCanvasNode } from "./nodes/SecretsManagerCanvasNode";
import { SnsCanvasNode } from "./nodes/SnsCanvasNode";
import { SqsCanvasNode } from "./nodes/SqsCanvasNode";
import { DynamodbCanvasNode } from "./nodes/DynamodbCanvasNode";
import { S3CanvasNode } from "./nodes/S3CanvasNode";
import { CanvasSmoothStepEdge } from "./edges/CanvasSmoothStepEdge";

const PALETTE_SERVICE_IDS = new Set<ServiceId>(
  listServices().map((s) => s.id),
);

const nodeTypes: NodeTypes = {
  s3: S3CanvasNode,
  lambda: LambdaCanvasNode,
  cloudfront: CloudFrontCanvasNode,
  route53: Route53CanvasNode,
  secretsmanager: SecretsManagerCanvasNode,
  sns_standard: SnsCanvasNode,
  sns_fifo: SnsCanvasNode,
  sqs: SqsCanvasNode,
  dynamodb: DynamodbCanvasNode,
};

const edgeTypes = {
  canvasSmoothstep: CanvasSmoothStepEdge,
} satisfies EdgeTypes;

function toFlowNodes(
  nodes: ReturnType<typeof useGraphStore.getState>["nodes"],
  selection: ReturnType<typeof useGraphStore.getState>["selection"],
  connectingMode: boolean,
): Node[] {
  return nodes.map((n) => {
    const title =
      n.serviceId === "s3"
        ? String(
            (n.config.name as string | undefined)?.trim() ||
              (n.config.bucketName as string | undefined)?.trim() ||
              "Bucket",
          )
        : n.serviceId === "lambda"
          ? String(n.config.functionName ?? "Lambda")
          : n.serviceId === "route53"
            ? String(
                (n.config.name as string | undefined)?.trim() || "DNS",
              )
            : n.serviceId === "cloudfront"
              ? String(
                  (n.config.name as string | undefined)?.trim() ||
                    (n.config.comment as string | undefined)?.trim() ||
                    "Distribution",
                )
              : n.serviceId === "secretsmanager"
                ? String(
                    (n.config.name as string | undefined)?.trim() || "Secret",
                  )
                : n.serviceId === "sns_standard" || n.serviceId === "sns_fifo"
                  ? String(
                      (n.config.name as string | undefined)?.trim() || "Topic",
                    )
                  : n.serviceId === "sqs"
                    ? String(
                        (n.config.name as string | undefined)?.trim() ||
                          "Queue",
                      )
                    : n.serviceId === "dynamodb"
                      ? String(
                          (n.config.name as string | undefined)?.trim() ||
                            "Table",
                        )
                      : n.serviceId;
    const svc = getService(n.serviceId, n.serviceVersion);
    const serviceDisplayName = svc?.displayName ?? n.serviceId;
    return {
      id: n.id,
      type: n.serviceId,
      position: n.position,
      data: { title, serviceDisplayName },
      selected: selection?.kind === "node" && selection.id === n.id,
      draggable: !connectingMode,
    };
  });
}

const EDGE_ARROW = { width: 18, height: 18 } as const;
const EDGE_MARKER_SLATE = "#64748b";
const EDGE_MARKER_SELECTED = "#ea580c";

function toFlowEdges(
  edges: ReturnType<typeof useGraphStore.getState>["edges"],
  selection: ReturnType<typeof useGraphStore.getState>["selection"],
): Edge[] {
  return edges.map((e) => {
    const rel = getRelationship(e.relationshipId, e.relationshipVersion);
    const selected = selection?.kind === "edge" && selection.id === e.id;
    return {
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      ...(e.sourceHandleId ? { sourceHandle: e.sourceHandleId } : {}),
      ...(e.targetHandleId ? { targetHandle: e.targetHandleId } : {}),
      label: rel?.verb ?? rel?.name ?? e.relationshipId,
      type: "canvasSmoothstep",
      animated: true,
      selected,
      data: { labelAlongPath: e.labelAlongPath },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selected ? EDGE_MARKER_SELECTED : EDGE_MARKER_SLATE,
        ...EDGE_ARROW,
      },
    };
  });
}

export type FlowCanvasProps = {
  servicePaletteOpen: boolean;
  onToggleServicePalette: () => void;
};

function FlowCanvasBody({
  servicePaletteOpen,
  onToggleServicePalette,
}: FlowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const rfStore = useStoreApi();
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selection = useGraphStore((s) => s.selection);
  const connectingMode = useGraphStore((s) => s.connectingMode);
  const setConnectingMode = useGraphStore((s) => s.setConnectingMode);
  const setConnectionOriginNodeId = useGraphStore(
    (s) => s.setConnectionOriginNodeId,
  );
  const addNode = useGraphStore((s) => s.addNode);
  const select = useGraphStore((s) => s.select);
  const beginConnection = useGraphStore((s) => s.beginConnection);
  const updateNode = useGraphStore((s) => s.updateNode);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const reconnectEdgeInStore = useGraphStore((s) => s.reconnectEdge);

  const flowNodes = useMemo(
    () => toFlowNodes(nodes, selection, connectingMode),
    [nodes, selection, connectingMode],
  );
  const flowEdges = useMemo(
    () => toFlowEdges(edges, selection),
    [edges, selection],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const { nodes: domainNodes, selection: sel, connectingMode: cm } =
        useGraphStore.getState();
      const current = toFlowNodes(domainNodes, sel, cm);
      const next = applyNodeChanges(changes, current);
      next.forEach((n) => {
        const dom = domainNodes.find((g) => g.id === n.id);
        if (!dom) return;
        if (
          dom.position.x !== n.position.x ||
          dom.position.y !== n.position.y
        ) {
          updateNode(n.id, { position: n.position });
        }
      });
    },
    [updateNode],
  );

  const isValidConnection = useCallback<IsValidConnection>((edge) => {
    const { source, target } = edge;
    if (!source || !target || source === target) return false;
    const gn = useGraphStore.getState().nodes;
    const sa = gn.find((n) => n.id === source)?.serviceId;
    const tb = gn.find((n) => n.id === target)?.serviceId;
    if (!sa || !tb) return false;
    return hasRelationshipBetween(sa, tb);
  }, []);

  /** Loose mode + all `source` handles: `c.source` / `c.target` match interaction order. */
  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      setConnectingMode(false);
      setConnectionOriginNodeId(null);
      beginConnection(c.source, c.target, {
        sourceHandleId: c.sourceHandle ?? undefined,
        targetHandleId: c.targetHandle ?? undefined,
      });
    },
    [beginConnection, setConnectingMode, setConnectionOriginNodeId],
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, c: Connection) => {
      reconnectEdgeInStore(oldEdge.id, c);
    },
    [reconnectEdgeInStore],
  );

  const onConnectStart = useCallback<OnConnectStart>((_event, params) => {
    if (params.nodeId) {
      setConnectionOriginNodeId(params.nodeId);
    }
  }, [setConnectionOriginNodeId]);

  const onConnectEnd = useCallback<OnConnectEnd>(() => {
    setConnectionOriginNodeId(null);
  }, [setConnectionOriginNodeId]);

  const clearClickConnectIntent = useCallback(() => {
    rfStore.setState({ connectionClickStartHandle: null });
  }, [rfStore]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(PALETTE_DRAG_MIME);
      if (!PALETTE_SERVICE_IDS.has(raw as ServiceId)) return;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addNode(raw as ServiceId, position);
    },
    [addNode, screenToFlowPosition],
  );

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      select({ kind: "node", id: node.id });
    },
    [select],
  );

  const onEdgeClick = useCallback(
    (_: MouseEvent, edge: Edge) => {
      select({ kind: "edge", id: edge.id });
    },
    [select],
  );

  const onPaneClick = useCallback(
    (e: MouseEvent) => {
      clearClickConnectIntent();
      setConnectingMode(false);
      setConnectionOriginNodeId(null);
      const placement = useGraphStore.getState().palettePlacement;
      if (placement) {
        const position = screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        addNode(placement, position);
        return;
      }
      select(null);
    },
    [
      addNode,
      clearClickConnectIntent,
      setConnectingMode,
      setConnectionOriginNodeId,
      screenToFlowPosition,
      select,
    ],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearClickConnectIntent();
        setConnectingMode(false);
        setConnectionOriginNodeId(null);
        useGraphStore.getState().setPalettePlacement(null);
        return;
      }
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable
      ) {
        return;
      }
      const { selection: sel } = useGraphStore.getState();
      if (!sel) return;
      e.preventDefault();
      if (sel.kind === "node") removeNode(sel.id);
      else removeEdge(sel.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    removeNode,
    removeEdge,
    clearClickConnectIntent,
    setConnectingMode,
    setConnectionOriginNodeId,
  ]);

  return (
    <ReactFlow
      className="h-full w-full bg-slate-100"
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{
        type: "canvasSmoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_MARKER_SLATE,
          ...EDGE_ARROW,
        },
      }}
      connectionMode={ConnectionMode.Loose}
      isValidConnection={isValidConnection}
      onNodesChange={onNodesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onConnect={onConnect}
      onReconnect={onReconnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      connectOnClick
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Panel position="top-left" className="m-3">
        <CanvasPaletteToggle
          paletteOpen={servicePaletteOpen}
          onToggle={onToggleServicePalette}
        />
      </Panel>
      <Panel position="top-right" className="m-3">
        <CanvasGraphMenu />
      </Panel>
      <Controls />
    </ReactFlow>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <div className="h-full min-h-0 min-w-0 flex-1">
      <ReactFlowProvider>
        <FlowCanvasBody {...props} />
      </ReactFlowProvider>
    </div>
  );
}
