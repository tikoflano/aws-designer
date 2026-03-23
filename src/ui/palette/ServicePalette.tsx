import { listServices } from "../../registry/services";
import { useGraphStore } from "../../state/graphStore";

const MIME = "application/aws-designer-service";

export function ServicePalette() {
  const services = listServices();
  const palettePlacement = useGraphStore((s) => s.palettePlacement);
  const setPalettePlacement = useGraphStore((s) => s.setPalettePlacement);

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 border-b border-slate-200 bg-slate-50 p-2 md:w-52 md:border-b-0 md:border-r md:p-3">
      <div className="flex flex-col gap-1 md:gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Services
        </div>
        <p className="hidden text-xs text-slate-600 md:block">
          Drag onto the canvas (desktop), or{" "}
          <strong>tap a service then tap the canvas</strong> (phones and tablets).
          Connect handles to add a relationship.
        </p>
        <p className="text-xs text-slate-600 md:hidden">
          Tap a service, then tap the canvas. To connect: tap one node’s{" "}
          <strong>out</strong> handle, then the other’s <strong>in</strong> handle.
        </p>
      </div>
      <div className="flex flex-row gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] md:flex-col md:overflow-visible md:pb-0">
        {services.map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => {
              setPalettePlacement(null);
              e.dataTransfer.setData(MIME, s.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() =>
              setPalettePlacement(palettePlacement === s.id ? null : s.id)
            }
            className={`min-w-[9.5rem] shrink-0 cursor-grab rounded-md border bg-white px-3 py-2 text-sm shadow-sm active:cursor-grabbing md:min-w-0 ${
              palettePlacement === s.id
                ? "border-sky-500 ring-2 ring-sky-300"
                : "border-slate-200"
            }`}
          >
            <div className="font-medium text-slate-900">{s.displayName}</div>
            <div className="line-clamp-2 text-xs text-slate-500 md:line-clamp-none">
              {s.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PALETTE_DRAG_MIME = MIME;
