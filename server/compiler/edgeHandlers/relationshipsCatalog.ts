import type { ServiceId } from "../domain/serviceId.ts";

// Keep definition list in sync with handlers in registry.ts when adding a relationship.
import { cloudfrontOriginS3Definition } from "./cloudfront-to-s3/cloudfrontOriginS3.definition.ts";
import { lambdaReadsSecretsManagerDefinition } from "./lambda-to-secretsmanager/lambdaReadsSecretsManager.definition.ts";
import { lambdaWritesSecretsManagerDefinition } from "./lambda-to-secretsmanager/lambdaWritesSecretsManager.definition.ts";
import { lambdaReadsDynamodbDefinition } from "./lambda-to-dynamodb/lambdaReadsDynamodb.definition.ts";
import { lambdaWritesDynamodbDefinition } from "./lambda-to-dynamodb/lambdaWritesDynamodb.definition.ts";
import { lambdaReadsS3Definition } from "./lambda-to-s3/lambdaReadsS3.definition.ts";
import { lambdaWritesS3Definition } from "./lambda-to-s3/lambdaWritesS3.definition.ts";
import { route53AliasCloudFrontDefinition } from "./route53-to-cloudfront/route53AliasCloudFront.definition.ts";
import { s3TriggersLambdaDefinition } from "./s3-to-lambda/s3TriggersLambda.definition.ts";
import { lambdaSubscribesSnsStandardDefinition } from "./sns-to-lambda/snsStandardToLambdaSubscription.definition.ts";
import { sqsSubscribesSnsFifoDefinition } from "./sns-to-sqs/snsFifoToSqsSubscription.definition.ts";
import { sqsSubscribesSnsStandardDefinition } from "./sns-to-sqs/snsStandardToSqsSubscription.definition.ts";
import { RELATIONSHIP_ID_TUPLE } from "./relationshipIds.ts";

export const ALL_RELATIONSHIPS = [
  lambdaReadsS3Definition,
  lambdaWritesS3Definition,
  lambdaReadsDynamodbDefinition,
  lambdaWritesDynamodbDefinition,
  lambdaReadsSecretsManagerDefinition,
  lambdaWritesSecretsManagerDefinition,
  s3TriggersLambdaDefinition,
  cloudfrontOriginS3Definition,
  route53AliasCloudFrontDefinition,
  sqsSubscribesSnsFifoDefinition,
  sqsSubscribesSnsStandardDefinition,
  lambdaSubscribesSnsStandardDefinition,
];

if (ALL_RELATIONSHIPS.length !== RELATIONSHIP_ID_TUPLE.length) {
  throw new Error(
    "ALL_RELATIONSHIPS and RELATIONSHIP_ID_TUPLE length mismatch — update relationshipIds.ts",
  );
}
for (let i = 0; i < ALL_RELATIONSHIPS.length; i++) {
  if (ALL_RELATIONSHIPS[i].id !== RELATIONSHIP_ID_TUPLE[i]) {
    throw new Error(
      `Relationship id drift at index ${i}: catalog "${ALL_RELATIONSHIPS[i].id}" vs RELATIONSHIP_ID_TUPLE "${String(RELATIONSHIP_ID_TUPLE[i])}"`,
    );
  }
}

export function listRelationships(source: ServiceId, target: ServiceId) {
  return ALL_RELATIONSHIPS.filter((r) => r.source === source && r.target === target);
}

/** True if any catalog relationship allows an edge between the two service types (either direction). */
export function hasRelationshipBetween(a: ServiceId, b: ServiceId): boolean {
  if (a === b) return false;
  return ALL_RELATIONSHIPS.some(
    (r) =>
      (r.source === a && r.target === b) || (r.source === b && r.target === a),
  );
}

export function getRelationship(id: string, version: string) {
  return ALL_RELATIONSHIPS.find((r) => r.id === id && r.version === version);
}
