import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";

type Props = {
  data: {
    title: string;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function SqsCanvasNode({ data, selected }: Props) {
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
