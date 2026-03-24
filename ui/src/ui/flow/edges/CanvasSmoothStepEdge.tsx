import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useGraphStore } from "../../../state/graphStore";
import {
  clampLabelAlongPathT,
  defaultLabelTFromRfAnchor,
  flowPointToPathT,
  pointOnPathAtT,
} from "./edgePathGeometry";

type EdgeData = { labelAlongPath?: number };

export const CanvasSmoothStepEdge = memo(function CanvasSmoothStepEdge(
  props: EdgeProps,
) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    style,
    markerEnd,
    markerStart,
    interactionWidth,
    pathOptions,
    data,
  } = props;

  const { screenToFlowPosition } = useReactFlow();
  const labelAlongPath = (data as EdgeData | undefined)?.labelAlongPath;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius,
    offset: pathOptions?.offset,
    stepPosition: pathOptions?.stepPosition,
  });

  const pathRef = useRef(path);
  pathRef.current = path;

  const [dragT, setDragT] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragTRef = useRef<number | null>(null);

  const rfDefaultT = useMemo(
    () => defaultLabelTFromRfAnchor(path, labelX, labelY),
    [path, labelX, labelY],
  );

  const effectiveT = useMemo(() => {
    if (dragT !== null) return clampLabelAlongPathT(dragT);
    if (labelAlongPath !== undefined) {
      return clampLabelAlongPathT(labelAlongPath);
    }
    return rfDefaultT;
  }, [dragT, labelAlongPath, rfDefaultT]);

  const { x: lx, y: ly } = useMemo(
    () => pointOnPathAtT(path, effectiveT, { x: labelX, y: labelY }),
    [path, effectiveT, labelX, labelY],
  );

  const commitLabelDrag = useCallback(() => {
    const t = dragTRef.current;
    isDraggingRef.current = false;
    dragTRef.current = null;
    setDragT(null);
    if (t !== null) {
      useGraphStore.getState().updateEdgeLabelAlongPath(id, t);
    }
  }, [id]);

  const discardLabelDrag = useCallback(() => {
    isDraggingRef.current = false;
    dragTRef.current = null;
    setDragT(null);
  }, []);

  const onLabelPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const t = flowPointToPathT(pathRef.current, p.x, p.y);
      isDraggingRef.current = true;
      dragTRef.current = t;
      setDragT(t);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [screenToFlowPosition],
  );

  const onLabelPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const t = flowPointToPathT(pathRef.current, p.x, p.y);
      dragTRef.current = t;
      setDragT(t);
    },
    [screenToFlowPosition],
  );

  const onLabelPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      commitLabelDrag();
    },
    [commitLabelDrag],
  );

  const onLabelPointerCancel = useCallback(() => {
    if (!isDraggingRef.current) return;
    discardLabelDrag();
  }, [discardLabelDrag]);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />
      {label != null && label !== "" ? (
        <EdgeLabelRenderer>
          <div
            role="presentation"
            className="nodrag nopan cursor-grab rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm active:cursor-grabbing"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${lx}px,${ly}px)`,
              pointerEvents: "all",
            }}
            onPointerDown={onLabelPointerDown}
            onPointerMove={onLabelPointerMove}
            onPointerUp={onLabelPointerUp}
            onPointerCancel={onLabelPointerCancel}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});

CanvasSmoothStepEdge.displayName = "CanvasSmoothStepEdge";
