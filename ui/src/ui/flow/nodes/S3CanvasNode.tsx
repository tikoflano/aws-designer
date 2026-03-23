import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";
import { TouchAwareGraphHandles } from "./TouchAwareGraphHandles";
import { useTouchConnectLongPress } from "./useTouchConnectLongPress";

type Props = {
  data: {
    title: string;
    useServiceIcons: boolean;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function S3CanvasNode({ data, selected }: Props) {
  const longPressHandlers = useTouchConnectLongPress();

  if (!data.useServiceIcons) {
    return (
      <div
        className={`group min-w-[140px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
          selected
            ? "border-orange-600 ring-2 ring-orange-300"
            : "border-slate-200"
        }`}
        {...longPressHandlers}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          S3
        </div>
        <div className="text-sm font-medium text-slate-900">{data.title}</div>
        <TouchAwareGraphHandles />
      </div>
    );
  }

  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="s3" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-orange-600 ring-2 ring-orange-300"
      idleClass="border-slate-200"
    />
  );
}
