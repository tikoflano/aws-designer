import { listServices } from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";
import { AwsServiceArchitectureIcon } from "../awsServiceIcons";
import { DelayedTooltip } from "../common/DelayedTooltip";

const MIME = "application/aws-designer-service";

export function ServicePalette() {
  const services = listServices();
  const palettePlacement = useGraphStore((s) => s.palettePlacement);
  const setPalettePlacement = useGraphStore((s) => s.setPalettePlacement);

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 border-b border-slate-200 bg-slate-50 p-2 md:w-52 md:border-b-0 md:border-r md:p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Services
      </div>
      <div className="grid grid-cols-2 items-stretch gap-1.5">
        {services.map((s) => (
          <DelayedTooltip
            key={s.id}
            label={s.displayName}
            className="flex min-h-0 min-w-0 w-full"
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
              className={`flex aspect-square w-full min-w-0 cursor-grab flex-col items-center justify-start gap-1 rounded-md border bg-white p-1.5 shadow-sm active:cursor-grabbing ${
                palettePlacement === s.id
                  ? "border-sky-500 ring-2 ring-sky-300"
                  : "border-slate-200"
              }`}
            >
              <AwsServiceArchitectureIcon serviceId={s.id} size={32} />
              <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-slate-700">
                {s.displayName}
              </span>
            </div>
          </DelayedTooltip>
        ))}
      </div>
    </div>
  );
}

export const PALETTE_DRAG_MIME = MIME;
