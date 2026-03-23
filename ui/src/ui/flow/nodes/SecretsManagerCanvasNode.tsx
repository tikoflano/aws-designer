import { AwsServiceArchitectureIcon } from "../../awsServiceIcons";
import { AwsServiceFlowNode } from "./AwsServiceFlowNode";

type Props = {
  data: {
    title: string;
    serviceDisplayName: string;
  };
  selected?: boolean;
};

export function SecretsManagerCanvasNode({ data, selected }: Props) {
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
