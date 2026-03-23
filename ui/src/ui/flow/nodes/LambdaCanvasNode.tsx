import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";

type Props = {
  data: {
    title: string;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function LambdaCanvasNode({ data, selected }: Props) {
  return (
    <AwsServiceFlowNode
      icon={<AwsServiceArchitectureIcon serviceId="lambda" />}
      title={data.title}
      serviceDisplayName={data.serviceDisplayName}
      selected={selected}
      selectedClass="border-orange-600 ring-2 ring-orange-300"
      idleClass="border-slate-200"
    />
  );
}
