import type { RelationshipId } from "../../domain/types";
import {
  DEFINITION_VERSION_V1,
  RelationshipIds,
} from "@compiler/catalog.ts";
import {
  CloudFrontOriginS3EdgeFields,
  LambdaReadsS3EdgeFields,
  LambdaWritesS3EdgeFields,
  Route53AliasCloudFrontEdgeFields,
  S3TriggersLambdaEdgeFields,
} from "./customEdgeFields";
import { SnsLambdaSubscriptionEdgeFields } from "./SnsLambdaSubscriptionEdgeFields";
import { EventbridgeSchedulerTargetEdgeFields } from "./EventbridgeSchedulerTargetEdgeFields";
import type { UiRelationshipModule } from "./types";

const BY_RELATIONSHIP_AND_VERSION: Partial<
  Record<string, Partial<Record<number, UiRelationshipModule>>>
> = {};

function registerUiRelationship(
  relationshipId: string,
  version: number,
  mod: UiRelationshipModule,
): void {
  const slot = (BY_RELATIONSHIP_AND_VERSION[relationshipId] ??= {});
  if (slot[version]) {
    throw new Error(
      `Duplicate UI relationship module for "${relationshipId}" v${String(version)}`,
    );
  }
  slot[version] = mod;
}

registerUiRelationship(RelationshipIds.lambda_reads_s3, DEFINITION_VERSION_V1, {
  EdgeConfigFields: LambdaReadsS3EdgeFields,
});
registerUiRelationship(RelationshipIds.lambda_writes_s3, DEFINITION_VERSION_V1, {
  EdgeConfigFields: LambdaWritesS3EdgeFields,
});
registerUiRelationship(RelationshipIds.s3_triggers_lambda, DEFINITION_VERSION_V1, {
  EdgeConfigFields: S3TriggersLambdaEdgeFields,
});
registerUiRelationship(RelationshipIds.cloudfront_origin_s3, DEFINITION_VERSION_V1, {
  EdgeConfigFields: CloudFrontOriginS3EdgeFields,
});
registerUiRelationship(
  RelationshipIds.route53_alias_cloudfront,
  DEFINITION_VERSION_V1,
  { EdgeConfigFields: Route53AliasCloudFrontEdgeFields },
);
registerUiRelationship(
  RelationshipIds.lambda_subscribes_sns_standard,
  DEFINITION_VERSION_V1,
  { EdgeConfigFields: SnsLambdaSubscriptionEdgeFields },
);

const eventbridgeSchedulerEdgeUi: UiRelationshipModule = {
  EdgeConfigFields: EventbridgeSchedulerTargetEdgeFields,
};

registerUiRelationship(
  RelationshipIds.eventbridge_scheduler_invokes_lambda,
  DEFINITION_VERSION_V1,
  eventbridgeSchedulerEdgeUi,
);
registerUiRelationship(
  RelationshipIds.eventbridge_scheduler_sends_sqs,
  DEFINITION_VERSION_V1,
  eventbridgeSchedulerEdgeUi,
);
registerUiRelationship(
  RelationshipIds.eventbridge_scheduler_publishes_sns_standard,
  DEFINITION_VERSION_V1,
  eventbridgeSchedulerEdgeUi,
);
registerUiRelationship(
  RelationshipIds.eventbridge_scheduler_publishes_sns_fifo,
  DEFINITION_VERSION_V1,
  eventbridgeSchedulerEdgeUi,
);

export function getUiRelationshipModule(
  relationshipId: RelationshipId,
  version: number,
): UiRelationshipModule | undefined {
  return BY_RELATIONSHIP_AND_VERSION[relationshipId]?.[version];
}
