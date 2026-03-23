/** Strips non-alphanumeric characters so IDs are safe as CFN logical ID segments. */
export class NodeIds {
  public static sanitizeNodeIdForLogical(nodeId: string): string {
    return nodeId.replace(/[^a-zA-Z0-9]/g, "");
  }

  public static cfnId(prefix: string, nodeId: string): string {
    return `${prefix}${NodeIds.sanitizeNodeIdForLogical(nodeId)}`;
  }
}
