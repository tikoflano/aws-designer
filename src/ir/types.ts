export type JsonObject = Record<string, unknown>;

export type IAMPolicyStatement = {
  Effect: "Allow" | "Deny";
  Action: string | string[];
  /** CloudFormation allows intrinsic functions here (Ref, Fn::Join, etc.). */
  Resource: unknown;
  Condition?: JsonObject;
};

export type IAMPolicyAttachment = {
  kind: "lambda_execution_role";
  lambdaNodeId: string;
};

export type IAMPolicy = {
  id: string;
  attachment: IAMPolicyAttachment;
  statements: IAMPolicyStatement[];
};

export type Resource = {
  logicalId: string;
  type: string;
  properties: JsonObject;
  dependsOn?: string[];
};

export type LogicalLink = {
  id: string;
  kind: string;
  metadata: JsonObject;
};

export type InfrastructureFragment = {
  resources: Resource[];
  iamPolicies: IAMPolicy[];
  links: LogicalLink[];
};

export type InfrastructureIR = InfrastructureFragment;

export type CompileIssue = {
  code: string;
  message: string;
  edgeId?: string;
  nodeId?: string;
};

export type CompileResult =
  | { ok: true; ir: InfrastructureIR; issues: CompileIssue[] }
  | { ok: false; ir: InfrastructureIR | null; issues: CompileIssue[] };
