import { listServices } from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";
import { AwsServiceArchitectureIcon } from "../awsServiceIcons";
import { DelayedTooltip } from "../common/DelayedTooltip";

const MIME = "application/aws-designer-service";

export function ServicePalette() {
  const services = listServices();
  const palettePlacement = useGraphStore((s) => s.palettePlacement);
  const setPalettePlacement = useGraphStore((s) => s.setPalettePlacement);
  const useServiceIcons = useGraphStore((s) => s.useServiceIcons);
  const setUseServiceIcons = useGraphStore((s) => s.setUseServiceIcons);

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 border-b border-slate-200 bg-slate-50 p-2 md:w-52 md:border-b-0 md:border-r md:p-3">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Services
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[11px] font-medium text-slate-600">Use icons</span>
          <button
            type="button"
            role="switch"
            aria-checked={useServiceIcons}
            aria-label="Use icons for services"
            onClick={() => setUseServiceIcons(!useServiceIcons)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              useServiceIcons ? "bg-sky-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                useServiceIcons ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
      <div
        className={
          useServiceIcons
            ? "grid grid-cols-2 gap-1.5"
            : "flex flex-row gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] md:flex-col md:overflow-visible md:pb-0"
        }
      >
        {useServiceIcons
          ? services.map((s) => (
              <DelayedTooltip
                key={s.id}
                label={s.displayName}
                className="flex min-w-0 justify-center"
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    setPalettePlacement(null);
                    e.dataTransfer.setData(MIME, s.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() =>
                    setPalettePlacement(palettePlacement === s.id ? null : s.id)
                  }
                  className={`flex min-w-0 cursor-grab flex-col items-center gap-1 rounded-md border bg-white px-1 py-1.5 shadow-sm active:cursor-grabbing ${
                    palettePlacement === s.id
                      ? "border-sky-500 ring-2 ring-sky-300"
                      : "border-slate-200"
                  }`}
                >
                  <AwsServiceArchitectureIcon serviceId={s.id} size={36} />
                  <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-slate-700">
                    {s.displayName}
                  </span>
                </div>
              </DelayedTooltip>
            ))
          : services.map((s) => (
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
                className={`min-w-38 shrink-0 cursor-grab rounded-md border bg-white px-3 py-2 text-sm shadow-sm active:cursor-grabbing md:min-w-0 ${
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
