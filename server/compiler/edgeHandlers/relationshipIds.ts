import { z } from "zod";

/**
 * Single source for relationship id strings. Tuple order must match ALL_RELATIONSHIPS
 * in relationshipsCatalog.ts (parity is asserted at module load).
 */
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

export const RELATIONSHIP_ID_TUPLE = [
  lambdaReadsS3Definition.id,
  lambdaWritesS3Definition.id,
  lambdaReadsDynamodbDefinition.id,
  lambdaWritesDynamodbDefinition.id,
  lambdaReadsSecretsManagerDefinition.id,
  lambdaWritesSecretsManagerDefinition.id,
  s3TriggersLambdaDefinition.id,
  cloudfrontOriginS3Definition.id,
  route53AliasCloudFrontDefinition.id,
  sqsSubscribesSnsFifoDefinition.id,
  sqsSubscribesSnsStandardDefinition.id,
  lambdaSubscribesSnsStandardDefinition.id,
] as const;

export type RelationshipId = (typeof RELATIONSHIP_ID_TUPLE)[number];

export const relationshipIdZodSchema = z.enum(
  RELATIONSHIP_ID_TUPLE as unknown as [RelationshipId, ...RelationshipId[]],
);

/** Named ids for validation / compiler (values equal definition.id). */
export const RelationshipIds = {
  lambda_reads_s3: lambdaReadsS3Definition.id,
  lambda_writes_s3: lambdaWritesS3Definition.id,
  lambda_reads_dynamodb: lambdaReadsDynamodbDefinition.id,
  lambda_writes_dynamodb: lambdaWritesDynamodbDefinition.id,
  lambda_reads_secretsmanager: lambdaReadsSecretsManagerDefinition.id,
  lambda_writes_secretsmanager: lambdaWritesSecretsManagerDefinition.id,
  s3_triggers_lambda: s3TriggersLambdaDefinition.id,
  cloudfront_origin_s3: cloudfrontOriginS3Definition.id,
  route53_alias_cloudfront: route53AliasCloudFrontDefinition.id,
  sqs_subscribes_sns_fifo: sqsSubscribesSnsFifoDefinition.id,
  sqs_subscribes_sns_standard: sqsSubscribesSnsStandardDefinition.id,
  lambda_subscribes_sns_standard: lambdaSubscribesSnsStandardDefinition.id,
} as const;
