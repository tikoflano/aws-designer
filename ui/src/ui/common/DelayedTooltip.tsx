import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const DEFAULT_DELAY_MS = 500;

type Props = {
  children: ReactNode;
  /** Shown after hover delay (e.g. service display name). */
  label: string;
  delayMs?: number;
  className?: string;
};

/**
 * Shows `label` in a floating tooltip after pointer rests ~500ms; clears on leave.
 */
export function DelayedTooltip({
  children,
  label,
  delayMs = DEFAULT_DELAY_MS,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <div
      ref={triggerRef}
      className={className}
      onPointerEnter={() => {
        clearTimer();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          const el = triggerRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          setPos({
            top: r.bottom + 6,
            left: r.left + r.width / 2,
          });
          setOpen(true);
        }, delayMs);
      }}
      onPointerLeave={() => {
        clearTimer();
        setOpen(false);
      }}
      {...(open ? { "aria-describedby": tooltipId } : {})}
    >
      {children}
      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, 0)",
                zIndex: 9999,
              }}
              className="pointer-events-none max-w-[240px] rounded-md bg-slate-900 px-2 py-1 text-center text-xs font-medium text-white shadow-lg"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
