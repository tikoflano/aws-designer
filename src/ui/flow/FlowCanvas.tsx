import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
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
import { getRelationship } from "../../registry/relationships";
import { useGraphStore } from "../../state/graphStore";
import { PALETTE_DRAG_MIME } from "../palette/ServicePalette";
import { LambdaCanvasNode } from "./nodes/LambdaCanvasNode";
import { S3CanvasNode } from "./nodes/S3CanvasNode";

const nodeTypes: NodeTypes = {
  s3: S3CanvasNode,
  lambda: LambdaCanvasNode,
};

function toFlowNodes(
  nodes: ReturnType<typeof useGraphStore.getState>["nodes"],
  selection: ReturnType<typeof useGraphStore.getState>["selection"],
): Node[] {
  return nodes.map((n) => {
    const title =
      n.serviceId === "s3"
        ? ((n.config.bucketName as string | undefined) ?? "Bucket")
        : String(n.config.functionName ?? "Lambda");
    return {
      id: n.id,
      type: n.serviceId,
      position: n.position,
      data: {
        title,
        subtitle: `${n.serviceId} · ${n.id.slice(0, 6)}…`,
      },
      selected: selection?.kind === "node" && selection.id === n.id,
    };
  });
}

function toFlowEdges(
  edges: ReturnType<typeof useGraphStore.getState>["edges"],
  selection: ReturnType<typeof useGraphStore.getState>["selection"],
): Edge[] {
  return edges.map((e) => {
    const rel = getRelationship(e.relationshipId, e.relationshipVersion);
    return {
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      label: rel?.name ?? e.relationshipId,
      type: "smoothstep",
      animated: true,
      selected: selection?.kind === "edge" && selection.id === e.id,
    };
  });
}

function FlowCanvasBody() {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selection = useGraphStore((s) => s.selection);
  const addNode = useGraphStore((s) => s.addNode);
  const select = useGraphStore((s) => s.select);
  const beginConnection = useGraphStore((s) => s.beginConnection);
  const updateNode = useGraphStore((s) => s.updateNode);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);

  const flowNodes = useMemo(
    () => toFlowNodes(nodes, selection),
    [nodes, selection],
  );
  const flowEdges = useMemo(
    () => toFlowEdges(edges, selection),
    [edges, selection],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const { nodes: domainNodes, selection: sel } = useGraphStore.getState();
      const current = toFlowNodes(domainNodes, sel);
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

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      beginConnection(c.source, c.target);
    },
    [beginConnection],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(PALETTE_DRAG_MIME);
      if (raw !== "s3" && raw !== "lambda") return;
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
    [addNode, screenToFlowPosition, select],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
  }, [removeNode, removeEdge]);

  return (
    <ReactFlow
      className="h-full w-full bg-slate-100"
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

export function FlowCanvas() {
  return (
    <div className="h-full min-h-0 flex-1">
      <ReactFlowProvider>
        <FlowCanvasBody />
      </ReactFlowProvider>
    </div>
  );
}
