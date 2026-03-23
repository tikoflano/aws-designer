import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";

type Props = {
  data: {
    title: string;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function DynamodbCanvasNode({ data, selected }: Props) {
  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="dynamodb" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-cyan-600 ring-2 ring-cyan-300"
      idleClass="border-slate-200"
    />
  );
}
