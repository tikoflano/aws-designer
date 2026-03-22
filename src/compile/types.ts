export type CompileIssue = {
  code: string;
  message: string;
  edgeId?: string;
  nodeId?: string;
};

/** Result of validating the graph and generating CDK TypeScript source (no separate IR). */
export type GenerateCdkResult = {
  ok: boolean;
  cdkSource: string;
  issues: CompileIssue[];
};
