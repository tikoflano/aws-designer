import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";
import { TouchAwareGraphHandles } from "./TouchAwareGraphHandles";

type Props = {
  data: {
    title: string;
    useServiceIcons: boolean;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function Route53CanvasNode({ data, selected }: Props) {
  if (!data.useServiceIcons) {
    return (
      <div
        className={`group min-w-[150px] rounded-lg border bg-white px-3 py-2 shadow-sm ${
          selected
            ? "border-orange-600 ring-2 ring-orange-300"
            : "border-slate-200"
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-teal-800">
          Route 53
        </div>
        <div className="text-sm font-medium text-slate-900">{data.title}</div>
        <TouchAwareGraphHandles />
      </div>
    );
  }

  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="route53" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-orange-600 ring-2 ring-orange-300"
      idleClass="border-slate-200"
    />
  );
}
