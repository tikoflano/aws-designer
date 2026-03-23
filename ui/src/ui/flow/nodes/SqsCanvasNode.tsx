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

export function SqsCanvasNode({ data, selected }: Props) {
  const longPressHandlers = useTouchConnectLongPress();

  if (!data.useServiceIcons) {
    return (
      <div
        className={`group min-w-[150px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
          selected
            ? "border-pink-600 ring-2 ring-pink-300"
            : "border-slate-200"
        }`}
        {...longPressHandlers}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-pink-800">
          SQS
        </div>
        <div className="text-sm font-medium text-slate-900">{data.title}</div>
        <TouchAwareGraphHandles />
      </div>
    );
  }

  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="sqs" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-pink-600 ring-2 ring-pink-300"
      idleClass="border-slate-200"
    />
  );
}
