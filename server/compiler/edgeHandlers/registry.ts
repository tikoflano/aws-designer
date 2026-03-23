// Keep handler list in sync with relationships in relationshipsCatalog.ts when adding a relationship.
import { CloudFrontOriginS3Handler } from "./cloudfront-to-s3/cloudfrontOriginS3Handler.ts";
import { LambdaReadsSecretsManagerHandler } from "./lambda-to-secretsmanager/lambdaReadsSecretsManagerHandler.ts";
import { LambdaWritesSecretsManagerHandler } from "./lambda-to-secretsmanager/lambdaWritesSecretsManagerHandler.ts";
import { LambdaReadsS3Handler } from "./lambda-to-s3/lambdaReadsS3Handler.ts";
import { LambdaWritesS3Handler } from "./lambda-to-s3/lambdaWritesS3Handler.ts";
import { Route53AliasCloudFrontHandler } from "./route53-to-cloudfront/route53AliasCloudFrontHandler.ts";
import { S3TriggersLambdaHandler } from "./s3-to-lambda/s3TriggersLambdaHandler.ts";
import type { EdgeRelationshipHandler } from "./types.ts";

const ALL_HANDLERS: EdgeRelationshipHandler[] = [
  new LambdaReadsS3Handler(),
  new LambdaWritesS3Handler(),
  new LambdaReadsSecretsManagerHandler(),
  new LambdaWritesSecretsManagerHandler(),
  new S3TriggersLambdaHandler(),
  new CloudFrontOriginS3Handler(),
  new Route53AliasCloudFrontHandler(),
];

export const edgeRelationshipHandlers: Record<string, EdgeRelationshipHandler> =
  Object.fromEntries(ALL_HANDLERS.map((h) => [h.definition.id, h]));
