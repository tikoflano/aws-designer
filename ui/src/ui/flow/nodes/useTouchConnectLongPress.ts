import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { useGraphStore } from "../../../state/graphStore";
import { useCoarsePointer } from "../useCoarsePointer";

const LONG_MS = 480;
const MOVE_CANCEL_PX = 14;

/**
 * Returns pointer-event handlers that detect a long-press on a node element.
 * On coarse (touch) pointers, a long-press sets `connectingMode = true` so
 * all handles become visible and tappable.  Returns `{}` on fine pointers.
 */
export function useTouchConnectLongPress(): Record<
  string,
  (e: ReactPointerEvent) => void
> {
  const coarse = useCoarsePointer();
  const setConnectingMode = useGraphStore((s) => s.setConnectingMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!coarse) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setConnectingMode(true);
      }, LONG_MS);
    },
    [coarse, setConnectingMode, clearTimer],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const onPointerUp = useCallback(() => {
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  const onPointerCancel = useCallback(() => {
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  if (!coarse) return {};

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
