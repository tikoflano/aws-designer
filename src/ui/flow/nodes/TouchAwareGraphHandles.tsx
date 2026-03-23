import {
  Handle,
  Position,
  useNodeId,
  useStoreApi,
} from "@xyflow/react";
import { XYHandle } from "@xyflow/system";
import type { HandleType } from "@xyflow/system";
import { useRef } from "react";

import { useGraphStore } from "../../../state/graphStore";
import { useCoarsePointer } from "../useCoarsePointer";

const LONG_MS = 480;
const MOVE_CANCEL_PX = 14;

const VISUAL_HANDLE =
  "!h-2.5 !w-2.5 !border !border-slate-300 !bg-white";

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
}: {
  type: HandleType;
  position: Position;
}) {
  const coarse = useCoarsePointer();
  const nodeId = useNodeId();
  const store = useStoreApi();
  const select = useGraphStore((s) => s.select);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const longFiredRef = useRef(false);

  const posKey = positionClass(position);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const tryCompleteClickConnect = (native: PointerEvent) => {
    if (!nodeId) return;
    const st = store.getState();
    const clickStart = st.connectionClickStartHandle;
    if (!clickStart) return;

    const { connection, isValid } = XYHandle.isValid(native, {
      handle: { nodeId, id: null, type },
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

  return (
    <>
      <Handle
        type={type}
        position={position}
        className={
          coarse ? `${VISUAL_HANDLE} !pointer-events-none` : VISUAL_HANDLE
        }
      />
      {coarse ? (
        <div
          className={`react-flow__handle react-flow__handle-${posKey} nodrag nopan z-[3] flex !h-11 !w-11 !min-h-[44px] !min-w-[44px] touch-manipulation items-center justify-center bg-transparent`}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") return;
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            longFiredRef.current = false;
            startRef.current = { x: e.clientX, y: e.clientY };
            clearTimer();
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              longFiredRef.current = true;
              if (!nodeId) return;
              const st = store.getState();
              st.onClickConnectStart?.(e.nativeEvent as unknown as MouseEvent, {
                nodeId,
                handleId: null,
                handleType: type,
              });
              store.setState({
                connectionClickStartHandle: { nodeId, type, id: null },
              });
            }, LONG_MS);
          }}
          onPointerMove={(e) => {
            if (!startRef.current) return;
            const dx = e.clientX - startRef.current.x;
            const dy = e.clientY - startRef.current.y;
            if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
              clearTimer();
            }
          }}
          onPointerUp={(e) => {
            if (e.pointerType === "mouse") return;
            clearTimer();
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(
                e.pointerId,
              );
            } catch {
              /* already released */
            }
            if (!nodeId) return;
            if (!longFiredRef.current) {
              const pending = store.getState().connectionClickStartHandle;
              if (pending) {
                tryCompleteClickConnect(e.nativeEvent);
              } else {
                select({ kind: "node", id: nodeId });
              }
            }
            startRef.current = null;
            longFiredRef.current = false;
          }}
          onPointerCancel={() => {
            clearTimer();
            startRef.current = null;
            longFiredRef.current = false;
          }}
        />
      ) : null}
    </>
  );
}

export function TouchAwareGraphHandles() {
  return (
    <>
      <TouchAwareHandle type="target" position={Position.Left} />
      <TouchAwareHandle type="source" position={Position.Right} />
    </>
  );
}
