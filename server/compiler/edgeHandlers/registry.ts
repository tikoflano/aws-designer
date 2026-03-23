// Keep handler list in sync with relationships in relationshipsCatalog.ts when adding a relationship.
import { CloudFrontOriginS3Handler } from "./cloudfront-to-s3/cloudfrontOriginS3Handler.ts";
import { LambdaReadsSecretsManagerHandler } from "./lambda-to-secretsmanager/lambdaReadsSecretsManagerHandler.ts";
import { LambdaWritesSecretsManagerHandler } from "./lambda-to-secretsmanager/lambdaWritesSecretsManagerHandler.ts";
import { LambdaReadsDynamodbHandler } from "./lambda-to-dynamodb/lambdaReadsDynamodbHandler.ts";
import { LambdaWritesDynamodbHandler } from "./lambda-to-dynamodb/lambdaWritesDynamodbHandler.ts";
import { LambdaReadsS3Handler } from "./lambda-to-s3/lambdaReadsS3Handler.ts";
import { LambdaWritesS3Handler } from "./lambda-to-s3/lambdaWritesS3Handler.ts";
import { Route53AliasCloudFrontHandler } from "./route53-to-cloudfront/route53AliasCloudFrontHandler.ts";
import { S3TriggersLambdaHandler } from "./s3-to-lambda/s3TriggersLambdaHandler.ts";
import { LambdaSubscribesSnsStandardHandler } from "./sns-to-lambda/snsStandardToLambdaSubscriptionHandler.ts";
import { SqsSubscribesSnsFifoHandler } from "./sns-to-sqs/snsFifoToSqsSubscriptionHandler.ts";
import { SqsSubscribesSnsStandardHandler } from "./sns-to-sqs/snsStandardToSqsSubscriptionHandler.ts";
import type { EdgeRelationshipHandler } from "./types.ts";

const ALL_HANDLERS: EdgeRelationshipHandler[] = [
  new LambdaReadsS3Handler(),
  new LambdaWritesS3Handler(),
  new LambdaReadsDynamodbHandler(),
  new LambdaWritesDynamodbHandler(),
  new LambdaReadsSecretsManagerHandler(),
  new LambdaWritesSecretsManagerHandler(),
  new S3TriggersLambdaHandler(),
  new CloudFrontOriginS3Handler(),
  new Route53AliasCloudFrontHandler(),
  new SqsSubscribesSnsFifoHandler(),
  new SqsSubscribesSnsStandardHandler(),
  new LambdaSubscribesSnsStandardHandler(),
];

export const edgeRelationshipHandlers: Record<string, EdgeRelationshipHandler> =
  Object.fromEntries(ALL_HANDLERS.map((h) => [h.definition.id, h]));
