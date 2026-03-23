import {
  Handle,
  Position,
  useConnection,
  useNodeId,
  useStore,
  useStoreApi,
} from "@xyflow/react";
import { XYHandle } from "@xyflow/system";
import type { HandleType } from "@xyflow/system";
import { useRef } from "react";

import { hasRelationshipBetween } from "@compiler/catalog.ts";
import { useGraphStore } from "../../../state/graphStore";
import { useCoarsePointer } from "../useCoarsePointer";

const MOVE_CANCEL_PX = 14;

const VISUAL_HANDLE_BASE =
  "!border transition-all duration-200";

const VISUAL_IDLE =
  `${VISUAL_HANDLE_BASE} !h-2.5 !w-2.5 !border-slate-300 !bg-white`;

const VISUAL_CONNECTING =
  `${VISUAL_HANDLE_BASE} !h-3 !w-3 !border-2 !border-orange-400 !bg-white`;

const VISUAL_SOURCE =
  `${VISUAL_HANDLE_BASE} !h-3.5 !w-3.5 !border-2 !border-orange-500 !bg-orange-400`;

function positionClass(position: Position): string {
  switch (position) {
    case Position.Left:
      return "left";
    case Position.Right:
      return "right";
    case Position.Top:
      return "top";
    case Position.Bottom:
      return "bottom";
    default:
      return "right";
  }
}

function TouchAwareHandle({
  type,
  position,
  handleId,
}: {
  type: HandleType;
  position: Position;
  /** Distinct per handle on the node (required for Loose mode + edge attachment). */
  handleId: string;
}) {
  const coarse = useCoarsePointer();
  const linkingActive = useStore(
    (s) => Boolean(s.connection.inProgress || s.connectionClickStartHandle),
  );
  const clickOriginNodeId = useStore(
    (s) => s.connectionClickStartHandle?.nodeId ?? null,
  );
  const { inProgress, fromNode } = useConnection((c) => ({
    inProgress: c.inProgress,
    fromNode: c.inProgress ? c.fromNode : null,
  }));
  const graphDragOriginNodeId = useGraphStore((s) => s.connectionOriginNodeId);
  const graphNodes = useGraphStore((s) => s.nodes);

  const originNodeId =
    clickOriginNodeId ??
    (inProgress ? (fromNode?.id ?? null) : null) ??
    graphDragOriginNodeId;

  const nodeId = useNodeId();
  const originSvc = originNodeId
    ? graphNodes.find((n) => n.id === originNodeId)?.serviceId
    : undefined;
  const thisSvc = nodeId
    ? graphNodes.find((n) => n.id === nodeId)?.serviceId
    : undefined;

  const isValidHandleTarget =
    !originNodeId ||
    nodeId === originNodeId ||
    (originSvc != null &&
      thisSvc != null &&
      hasRelationshipBetween(originSvc, thisSvc));

  const isSourceHandle = useStore((s) => {
    const start = s.connectionClickStartHandle;
    return Boolean(start && start.nodeId === nodeId && start.id === handleId);
  });
  const connectingMode = useGraphStore((s) => s.connectingMode);
  const store = useStoreApi();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const posKey = positionClass(position);

  const showForCoarse =
    (connectingMode && !linkingActive) ||
    (linkingActive && isValidHandleTarget);

  const tryCompleteClickConnect = (native: PointerEvent) => {
    if (!nodeId) return;
    const st = store.getState();
    const clickStart = st.connectionClickStartHandle;
    if (!clickStart) return;

    const { connection, isValid } = XYHandle.isValid(native, {
      handle: { nodeId, id: handleId, type },
      connectionMode: st.connectionMode,
      fromNodeId: clickStart.nodeId,
      fromHandleId: clickStart.id ?? null,
      fromType: clickStart.type,
      isValidConnection: st.isValidConnection,
      doc: document,
      lib: st.lib,
      flowId: st.rfId,
      nodeLookup: st.nodeLookup,
    });

    if (isValid && connection) {
      st.onConnect?.(connection);
    }
    store.setState({ connectionClickStartHandle: null });
  };

  let handleClass: string;

  if (coarse) {
    if (!showForCoarse) {
      handleClass = `${VISUAL_IDLE} !pointer-events-none opacity-0`;
    } else if (isSourceHandle) {
      handleClass = `${VISUAL_SOURCE} !pointer-events-none`;
    } else {
      handleClass = `${VISUAL_CONNECTING} !pointer-events-none`;
    }
  } else if (linkingActive && !isValidHandleTarget) {
    handleClass = `${VISUAL_IDLE} pointer-events-none opacity-0`;
  } else if (linkingActive) {
    handleClass = VISUAL_IDLE;
  } else {
    handleClass = `${VISUAL_IDLE} pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100`;
  }

  const showOverlay = coarse && showForCoarse;

  return (
    <>
      <Handle
        id={handleId}
        type={type}
        position={position}
        className={handleClass}
      />
      {showOverlay ? (
        <div
          className={`react-flow__handle react-flow__handle-${posKey} nodrag nopan z-[3] flex !h-11 !w-11 !min-h-[44px] !min-w-[44px] touch-manipulation items-center justify-center !bg-transparent`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            startRef.current = { x: e.clientX, y: e.clientY };
            movedRef.current = false;
          }}
          onPointerMove={(e) => {
            if (!startRef.current) return;
            const dx = e.clientX - startRef.current.x;
            const dy = e.clientY - startRef.current.y;
            if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
              movedRef.current = true;
            }
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(
                e.pointerId,
              );
            } catch {
              /* already released */
            }
            if (!nodeId || movedRef.current) {
              startRef.current = null;
              movedRef.current = false;
              return;
            }
            startRef.current = null;
            movedRef.current = false;

            const clickStart = store.getState().connectionClickStartHandle;
            if (clickStart) {
              tryCompleteClickConnect(e.nativeEvent);
            } else {
              const st = store.getState();
              st.onClickConnectStart?.(
                e.nativeEvent as unknown as MouseEvent,
                { nodeId, handleId, handleType: type },
              );
              store.setState({
                connectionClickStartHandle: { nodeId, type, id: handleId },
              });
            }
          }}
          onPointerCancel={() => {
            startRef.current = null;
            movedRef.current = false;
          }}
        />
      ) : null}
    </>
  );
}

/** Four perimeter handles, all `source` + Loose mode: RF `Connection` order matches start → end node. */
export function TouchAwareGraphHandles() {
  return (
    <>
      <TouchAwareHandle type="source" position={Position.Top} handleId="top" />
      <TouchAwareHandle
        type="source"
        position={Position.Right}
        handleId="right"
      />
      <TouchAwareHandle
        type="source"
        position={Position.Bottom}
        handleId="bottom"
      />
      <TouchAwareHandle type="source" position={Position.Left} handleId="left" />
    </>
  );
}
