export type CompileIssue = {
  code: string;
  message: string;
  edgeId?: string;
  nodeId?: string;
};

/** Result of graph validation (UI + compiler preflight). */
export type ValidateGraphResult = {
  ok: boolean;
  issues: CompileIssue[];
};
