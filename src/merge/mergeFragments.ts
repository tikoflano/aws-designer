import type {
  IAMPolicy,
  InfrastructureFragment,
  InfrastructureIR,
  JsonObject,
  Resource,
} from "../ir/types";

function mergeNotificationConfiguration(
  a: JsonObject,
  b: JsonObject,
): JsonObject {
  const aLambda = (a.LambdaConfigurations as unknown[] | undefined) ?? [];
  const bLambda = (b.LambdaConfigurations as unknown[] | undefined) ?? [];
  return {
    ...a,
    ...b,
    LambdaConfigurations: [...aLambda, ...bLambda],
  };
}

function mergeResourceProperties(a: JsonObject, b: JsonObject): JsonObject {
  const out: JsonObject = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (key === "NotificationConfiguration") {
      const existing = out.NotificationConfiguration;
      if (
        existing &&
        typeof existing === "object" &&
        !Array.isArray(existing) &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        out.NotificationConfiguration = mergeNotificationConfiguration(
          existing as JsonObject,
          value as JsonObject,
        );
        continue;
      }
    }
    const prev = out[key];
    if (
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      out[key] = mergeResourceProperties(prev as JsonObject, value as JsonObject);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function policyAttachmentKey(
  attachment: InfrastructureFragment["iamPolicies"][0]["attachment"],
): string {
  if (attachment.kind === "lambda_execution_role") {
    return `lambda_execution_role:${attachment.lambdaNodeId}`;
  }
  return JSON.stringify(attachment);
}

export function mergeFragments(fragments: InfrastructureFragment[]): InfrastructureIR {
  const resourceMap = new Map<string, Resource>();
  const iamMap = new Map<
    string,
    {
      id: string;
      attachment: IAMPolicy["attachment"];
      statements: IAMPolicy["statements"];
    }
  >();
  const links: InfrastructureIR["links"] = [];

  for (const frag of fragments) {
    for (const r of frag.resources) {
      const existing = resourceMap.get(r.logicalId);
      if (!existing) {
        resourceMap.set(r.logicalId, {
          logicalId: r.logicalId,
          type: r.type,
          properties: { ...r.properties },
          dependsOn: r.dependsOn ? [...r.dependsOn] : undefined,
        });
      } else {
        if (existing.type !== r.type) {
          throw new Error(
            `Resource logicalId "${r.logicalId}" has conflicting types: ${existing.type} vs ${r.type}`,
          );
        }
        existing.properties = mergeResourceProperties(
          existing.properties,
          r.properties,
        );
        if (r.dependsOn?.length) {
          const merged = [...(existing.dependsOn ?? []), ...r.dependsOn];
          existing.dependsOn = [...new Set(merged)];
        }
      }
    }

    for (const p of frag.iamPolicies) {
      const key = policyAttachmentKey(p.attachment);
      const existing = iamMap.get(key);
      if (!existing) {
        iamMap.set(key, {
          id: `merged-iam-${key}`,
          attachment: p.attachment,
          statements: [...p.statements],
        });
      } else {
        existing.statements.push(...p.statements);
      }
    }

    links.push(...frag.links);
  }

  return {
    resources: [...resourceMap.values()],
    iamPolicies: [...iamMap.values()],
    links,
  };
}
