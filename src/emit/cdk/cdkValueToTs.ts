/**
 * Turns IR values (including CloudFormation-style intrinsics) into TypeScript
 * expressions using `aws-cdk-lib` helpers.
 */
export function cdkExpressionFromValue(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => cdkExpressionFromValue(v, depth + 1));
    const oneLine = `[${items.join(", ")}]`;
    if (oneLine.length <= 100) return oneLine;
    return `[\n${pad}  ${items.join(`,\n${pad}  `)}\n${pad}]`;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    if (
      Object.keys(obj).length === 1 &&
      "Ref" in obj &&
      typeof obj.Ref === "string"
    ) {
      return `cdk.Fn.ref(${JSON.stringify(obj.Ref)})`;
    }

    if ("Fn::GetAtt" in obj && Array.isArray(obj["Fn::GetAtt"])) {
      const pair = obj["Fn::GetAtt"] as unknown[];
      if (pair.length === 2 && typeof pair[0] === "string" && typeof pair[1] === "string") {
        return `cdk.Fn.getAtt(${JSON.stringify(pair[0])}, ${JSON.stringify(pair[1])})`;
      }
    }

    if ("Fn::Join" in obj && Array.isArray(obj["Fn::Join"])) {
      const join = obj["Fn::Join"] as unknown[];
      if (
        join.length === 2 &&
        typeof join[0] === "string" &&
        Array.isArray(join[1])
      ) {
        const sep = join[0];
        const parts = join[1].map((p) => cdkExpressionFromValue(p, depth + 1));
        return `cdk.Fn.join(${JSON.stringify(sep)}, [${parts.join(", ")}])`;
      }
    }

    if ("Fn::Sub" in obj && Array.isArray(obj["Fn::Sub"])) {
      const sub = obj["Fn::Sub"] as unknown[];
      if (
        sub.length === 2 &&
        typeof sub[0] === "string" &&
        sub[1] !== null &&
        typeof sub[1] === "object" &&
        !Array.isArray(sub[1])
      ) {
        const template = sub[0];
        const vars = sub[1] as Record<string, unknown>;
        const varPairs = Object.entries(vars).map(
          ([k, v]) => `${JSON.stringify(k)}: ${cdkExpressionFromValue(v, depth + 1)}`,
        );
        return `cdk.Fn.sub(${JSON.stringify(template)}, { ${varPairs.join(", ")} })`;
      }
    }

    const entries = Object.entries(obj).map(
      ([k, v]) => `${JSON.stringify(k)}: ${cdkExpressionFromValue(v, depth + 1)}`,
    );
    const oneLine = `{ ${entries.join(", ")} }`;
    if (oneLine.length <= 120) return oneLine;
    return `{\n${pad}  ${entries.join(`,\n${pad}  `)}\n${pad}}`;
  }

  return "undefined";
}
