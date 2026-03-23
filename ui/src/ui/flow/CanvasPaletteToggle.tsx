const iconSvgProps = {
  xmlns: "http://www.w3.org/2000/svg" as const,
  viewBox: "0 0 24 24" as const,
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Layout with left sidebar strip — services palette */
function IconServicesSidebar({ className }: { className?: string }) {
  return (
    <svg {...iconSvgProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

export function CanvasPaletteToggle({
  paletteOpen,
  onToggle,
}: {
  paletteOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-slate-200 bg-white p-2 text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      aria-label={paletteOpen ? "Hide services sidebar" : "Show services sidebar"}
      onClick={onToggle}
    >
      <IconServicesSidebar className="h-5 w-5" />
    </button>
  );
}
