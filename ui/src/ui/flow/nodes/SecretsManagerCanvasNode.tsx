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

export function SecretsManagerCanvasNode({ data, selected }: Props) {
  const longPressHandlers = useTouchConnectLongPress();

  if (!data.useServiceIcons) {
    return (
      <div
        className={`group min-w-[150px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
          selected
            ? "border-violet-600 ring-2 ring-violet-300"
            : "border-slate-200"
        }`}
        {...longPressHandlers}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-800">
          Secrets Manager
        </div>
        <div className="text-sm font-medium text-slate-900">{data.title}</div>
        <TouchAwareGraphHandles />
      </div>
    );
  }

  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="secretsmanager" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-violet-600 ring-2 ring-violet-300"
      idleClass="border-slate-200"
    />
  );
}
