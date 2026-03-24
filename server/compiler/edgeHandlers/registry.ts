import { CloudFrontOriginS3HandlerV1 } from "./cloudfront-to-s3/v1/cloudfrontOriginS3HandlerV1.ts";
import { LambdaReadsSecretsManagerHandlerV1 } from "./lambda-to-secretsmanager/v1/lambdaReadsSecretsManagerHandlerV1.ts";
import { LambdaWritesSecretsManagerHandlerV1 } from "./lambda-to-secretsmanager/v1/lambdaWritesSecretsManagerHandlerV1.ts";
import { LambdaReadsDynamodbHandlerV1 } from "./lambda-to-dynamodb/v1/lambdaReadsDynamodbHandlerV1.ts";
import { LambdaWritesDynamodbHandlerV1 } from "./lambda-to-dynamodb/v1/lambdaWritesDynamodbHandlerV1.ts";
import { LambdaReadsS3HandlerV1 } from "./lambda-to-s3/v1/lambdaReadsS3HandlerV1.ts";
import { LambdaWritesS3HandlerV1 } from "./lambda-to-s3/v1/lambdaWritesS3HandlerV1.ts";
import { Route53AliasCloudFrontHandlerV1 } from "./route53-to-cloudfront/v1/route53AliasCloudFrontHandlerV1.ts";
import { S3TriggersLambdaHandlerV1 } from "./s3-to-lambda/v1/s3TriggersLambdaHandlerV1.ts";
import { LambdaSubscribesSnsStandardHandlerV1 } from "./sns-to-lambda/v1/snsStandardToLambdaSubscriptionHandlerV1.ts";
import { SqsSubscribesSnsFifoHandlerV1 } from "./sns-to-sqs/v1/snsFifoToSqsSubscriptionHandlerV1.ts";
import { SqsSubscribesSnsStandardHandlerV1 } from "./sns-to-sqs/v1/snsStandardToSqsSubscriptionHandlerV1.ts";
import type { EdgeRelationshipHandler } from "./types.ts";

const ALL_HANDLERS: EdgeRelationshipHandler[] = [
  new LambdaReadsS3HandlerV1(),
  new LambdaWritesS3HandlerV1(),
  new LambdaReadsDynamodbHandlerV1(),
  new LambdaWritesDynamodbHandlerV1(),
  new LambdaReadsSecretsManagerHandlerV1(),
  new LambdaWritesSecretsManagerHandlerV1(),
  new S3TriggersLambdaHandlerV1(),
  new CloudFrontOriginS3HandlerV1(),
  new Route53AliasCloudFrontHandlerV1(),
  new SqsSubscribesSnsFifoHandlerV1(),
  new SqsSubscribesSnsStandardHandlerV1(),
  new LambdaSubscribesSnsStandardHandlerV1(),
];

const BY_RELATIONSHIP_AND_VERSION: Record<string, Record<number, EdgeRelationshipHandler>> =
  {};
for (const h of ALL_HANDLERS) {
  const id = h.definition.id;
  const ver = h.definition.version;
  const slot = (BY_RELATIONSHIP_AND_VERSION[id] ??= {});
  if (slot[ver]) {
    throw new Error(
      `Duplicate edge handler for relationship "${id}" version ${String(ver)}`,
    );
  }
  slot[ver] = h;
}

export function getEdgeHandler(
  relationshipId: string,
  version: number,
): EdgeRelationshipHandler | undefined {
  return BY_RELATIONSHIP_AND_VERSION[relationshipId]?.[version];
}

/** For tests: stable order matches {@link ALL_HANDLERS} construction order. */
export function listEdgeRelationshipHandlers(): EdgeRelationshipHandler[] {
  return [...ALL_HANDLERS];
}
