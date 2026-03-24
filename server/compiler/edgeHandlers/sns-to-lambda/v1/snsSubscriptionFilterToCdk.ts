import type { LambdaSubscriptionProps } from "aws-cdk-lib/aws-sns-subscriptions";
import { FilterOrPolicy, SubscriptionFilter } from "aws-cdk-lib/aws-sns";

import type {
  SnsSubscriptionFilter,
  SnsSubscriptionLeafFilter,
} from "./snsSubscriptionFilterConfig.ts";

function leafToSubscriptionFilter(leaf: SnsSubscriptionLeafFilter): SubscriptionFilter {
  switch (leaf.filterKind) {
    case "string": {
      return SubscriptionFilter.stringFilter({
        ...(leaf.allowlist?.length ? { allowlist: leaf.allowlist } : {}),
        ...(leaf.denylist?.length ? { denylist: leaf.denylist } : {}),
        ...(leaf.matchPrefixes?.length ? { matchPrefixes: leaf.matchPrefixes } : {}),
        ...(leaf.matchSuffixes?.length ? { matchSuffixes: leaf.matchSuffixes } : {}),
      });
    }
    case "numeric": {
      return SubscriptionFilter.numericFilter({
        ...(leaf.allowlist?.length ? { allowlist: leaf.allowlist } : {}),
        ...(leaf.greaterThan !== undefined ? { greaterThan: leaf.greaterThan } : {}),
        ...(leaf.greaterThanOrEqualTo !== undefined
          ? { greaterThanOrEqualTo: leaf.greaterThanOrEqualTo }
          : {}),
        ...(leaf.lessThan !== undefined ? { lessThan: leaf.lessThan } : {}),
        ...(leaf.lessThanOrEqualTo !== undefined
          ? { lessThanOrEqualTo: leaf.lessThanOrEqualTo }
          : {}),
        ...(leaf.between ? { between: leaf.between } : {}),
        ...(leaf.betweenStrict ? { betweenStrict: leaf.betweenStrict } : {}),
      });
    }
    case "exists":
      return SubscriptionFilter.existsFilter();
    case "notExists":
      return SubscriptionFilter.notExistsFilter();
  }
}

/** Maps validated graph config to CDK `LambdaSubscription` filter props (at most one of the two policies). */
export function subscriptionFilterToLambdaSubscriptionProps(
  filter: SnsSubscriptionFilter,
): Pick<LambdaSubscriptionProps, "filterPolicy" | "filterPolicyWithMessageBody"> {
  if (filter.kind === "none") {
    return {};
  }
  if (filter.kind === "messageAttributes") {
    const filterPolicy: Record<string, SubscriptionFilter> = {};
    for (const r of filter.rules) {
      const { attributeName, ...leaf } = r;
      filterPolicy[attributeName] = leafToSubscriptionFilter(
        leaf as SnsSubscriptionLeafFilter,
      );
    }
    return { filterPolicy };
  }
  const filterPolicyWithMessageBody: Record<string, FilterOrPolicy> = {};
  for (const r of filter.rules) {
    const { fieldName, ...leaf } = r;
    filterPolicyWithMessageBody[fieldName] = FilterOrPolicy.filter(
      leafToSubscriptionFilter(leaf as SnsSubscriptionLeafFilter),
    );
  }
  return { filterPolicyWithMessageBody };
}
