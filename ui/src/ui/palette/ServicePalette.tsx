import { useEffect, useRef, useState } from "react";

import { listServices, type ServiceId } from "@compiler/catalog.ts";
import { useGraphStore } from "../../state/graphStore";
import { AwsServiceArchitectureIcon } from "../awsServiceIcons";
import { DelayedTooltip } from "../common/DelayedTooltip";
import { ServiceConnectionsModal } from "./ServiceConnectionsModal";

const MIME = "application/aws-designer-service";

const PALETTE_CLICK_DELAY_MS = 280;

export function ServicePalette() {
  const services = listServices();
  const palettePlacement = useGraphStore((s) => s.palettePlacement);
  const setPalettePlacement = useGraphStore((s) => s.setPalettePlacement);
  const [connectionsServiceId, setConnectionsServiceId] =
    useState<ServiceId | null>(null);
  const paletteClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (paletteClickTimerRef.current != null) {
        clearTimeout(paletteClickTimerRef.current);
      }
    };
  }, []);

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
            className="flex h-full min-h-0 min-w-0 w-full"
          >
            <div
              draggable
              onDragStart={(e) => {
                setPalettePlacement(null);
                e.dataTransfer.setData(MIME, s.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => {
                if (paletteClickTimerRef.current != null) {
                  clearTimeout(paletteClickTimerRef.current);
                }
                paletteClickTimerRef.current = setTimeout(() => {
                  paletteClickTimerRef.current = null;
                  const { palettePlacement: placed, setPalettePlacement: setPlaced } =
                    useGraphStore.getState();
                  setPlaced(placed === s.id ? null : s.id);
                }, PALETTE_CLICK_DELAY_MS);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                if (paletteClickTimerRef.current != null) {
                  clearTimeout(paletteClickTimerRef.current);
                  paletteClickTimerRef.current = null;
                }
                setConnectionsServiceId(s.id);
              }}
              className={`flex h-full min-h-0 w-full min-w-0 cursor-grab flex-col items-center justify-start gap-0.5 rounded-md border bg-white px-1.5 pt-1.5 pb-1 shadow-sm active:cursor-grabbing ${
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
      <ServiceConnectionsModal
        open={connectionsServiceId != null}
        serviceId={connectionsServiceId}
        onClose={() => setConnectionsServiceId(null)}
      />
    </div>
  );
}

export const PALETTE_DRAG_MIME = MIME;
