import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";

type Props = {
  data: {
    title: string;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function EventbridgeSchedulerCanvasNode({ data, selected }: Props) {
  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="eventbridge_scheduler" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-violet-600 ring-2 ring-violet-300"
      idleClass="border-slate-200"
    />
  );
}
