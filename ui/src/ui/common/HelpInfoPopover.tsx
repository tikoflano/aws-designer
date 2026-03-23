import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Panel is portaled to `document.body` with fixed positioning (inspector uses overflow-auto; canvas has its own stacking). */
const PANEL_Z = 10000;

const panelVariants = {
  neutral:
    "w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-sm leading-snug text-slate-600 shadow-lg",
  warm: "w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-orange-300 bg-linear-to-b from-amber-50 to-orange-100 p-3 text-sm leading-snug text-slate-700 shadow-lg",
} as const;

const titleVariants = {
  neutral: "font-medium text-slate-900",
  warm: "font-medium text-orange-950",
} as const;

const defaultButtonVariants = {
  neutral:
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700",
  warm: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-orange-900 hover:bg-orange-200 hover:text-orange-950",
} as const;

type Props = {
  /** Accessible name for the icon button (e.g. "About prefix and suffix filters"). */
  ariaLabel: string;
  title: string;
  children: ReactNode;
  variant?: keyof typeof panelVariants;
  buttonClassName?: string;
};

/**
 * Click the (i) icon to open contextual help; closes on outside click or Escape.
 */
export function HelpInfoPopover({
  ariaLabel,
  title,
  children,
  variant = "neutral",
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const updatePanelPosition = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 4,
      right: globalThis.innerWidth - r.right,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePanelPosition();
    globalThis.addEventListener("resize", onScrollOrResize);
    globalThis.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      globalThis.removeEventListener("resize", onScrollOrResize);
      globalThis.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        wrapRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const btnClass = buttonClassName ?? defaultButtonVariants[variant];

  const panel = open ? (
    <div
      ref={panelRef}
      id={panelId}
      role="note"
      style={{
        position: "fixed",
        top: panelPos.top,
        right: panelPos.right,
        zIndex: PANEL_Z,
      }}
      className={panelVariants[variant]}
    >
      <p className={titleVariants[variant]}>{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  ) : null;

  return (
    <div className="inline-flex" ref={wrapRef}>
      <button
        type="button"
        className={btnClass}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <InfoCircleIcon className={variant === "warm" ? "h-5 w-5" : "h-4 w-4"} />
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
