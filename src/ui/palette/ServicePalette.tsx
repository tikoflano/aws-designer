import { listServices } from "../../registry/services";
import { useGraphStore } from "../../state/graphStore";

const MIME = "application/aws-designer-service";

export function ServicePalette() {
  const services = listServices();
  const palettePlacement = useGraphStore((s) => s.palettePlacement);
  const setPalettePlacement = useGraphStore((s) => s.setPalettePlacement);

  return (
    <div className="flex w-52 flex-col gap-2 border-r border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Services
      </div>
      <p className="text-xs text-slate-600">
        Drag onto the canvas (desktop), or{" "}
        <strong>tap a service then tap the canvas</strong> (phones and tablets).
        Connect handles to add a relationship.
      </p>
      <div className="flex flex-col gap-2">
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
            className={`cursor-grab rounded-md border bg-white px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${
              palettePlacement === s.id
                ? "border-sky-500 ring-2 ring-sky-300"
                : "border-slate-200"
            }`}
          >
            <div className="font-medium text-slate-900">{s.displayName}</div>
            <div className="text-xs text-slate-500">{s.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PALETTE_DRAG_MIME = MIME;
