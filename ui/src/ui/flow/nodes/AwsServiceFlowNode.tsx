import type { ReactNode } from "react";

import { DelayedTooltip } from "../../common/DelayedTooltip";
import { TouchAwareGraphHandles } from "./TouchAwareGraphHandles";

type Props = {
  icon: ReactNode;
  title: string;
  serviceDisplayName: string;
  selected?: boolean;
  selectedClass: string;
  idleClass: string;
};

export function AwsServiceFlowNode({
  icon,
  title,
  serviceDisplayName,
  selected,
  selectedClass,
  idleClass,
}: Props) {
  return (
    <DelayedTooltip
      label={serviceDisplayName}
      className={`relative flex min-w-[88px] flex-col items-center gap-0.5 rounded-lg border bg-white px-1.5 py-1 shadow-sm ${
        selected ? selectedClass : idleClass
      }`}
    >
      <div className="flex shrink-0 items-center justify-center">{icon}</div>
      <div className="max-w-[120px] truncate text-center text-xs font-medium text-slate-900">
        {title}
      </div>
      <TouchAwareGraphHandles />
    </DelayedTooltip>
  );
}
