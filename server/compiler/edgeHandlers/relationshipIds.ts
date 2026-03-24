import { z } from "zod";

/**
 * Single source for relationship id strings. Tuple order must match ALL_RELATIONSHIPS
 * in relationshipsCatalog.ts (parity is asserted at module load).
 */
import { cloudfrontOriginS3Definition } from "./cloudfront-to-s3/v1/cloudfrontOriginS3.definition.ts";
import { lambdaReadsSecretsManagerDefinition } from "./lambda-to-secretsmanager/v1/lambdaReadsSecretsManager.definition.ts";
import { lambdaWritesSecretsManagerDefinition } from "./lambda-to-secretsmanager/v1/lambdaWritesSecretsManager.definition.ts";
import { lambdaReadsDynamodbDefinition } from "./lambda-to-dynamodb/v1/lambdaReadsDynamodb.definition.ts";
import { lambdaWritesDynamodbDefinition } from "./lambda-to-dynamodb/v1/lambdaWritesDynamodb.definition.ts";
import { lambdaReadsS3Definition } from "./lambda-to-s3/v1/lambdaReadsS3.definition.ts";
import { lambdaWritesS3Definition } from "./lambda-to-s3/v1/lambdaWritesS3.definition.ts";
import { route53AliasCloudFrontDefinition } from "./route53-to-cloudfront/v1/route53AliasCloudFront.definition.ts";
import { s3TriggersLambdaDefinition } from "./s3-to-lambda/v1/s3TriggersLambda.definition.ts";
import { lambdaSubscribesSnsStandardDefinition } from "./sns-to-lambda/v1/snsStandardToLambdaSubscription.definition.ts";
import { sqsSubscribesSnsFifoDefinition } from "./sns-to-sqs/v1/snsFifoToSqsSubscription.definition.ts";
import { sqsSubscribesSnsStandardDefinition } from "./sns-to-sqs/v1/snsStandardToSqsSubscription.definition.ts";
import { lambdaPublishesSnsFifoDefinition } from "./lambda-to-sns/v1/lambdaPublishesSnsFifo.definition.ts";
import { lambdaPublishesSnsStandardDefinition } from "./lambda-to-sns/v1/lambdaPublishesSnsStandard.definition.ts";
import { lambdaSendsSqsDefinition } from "./lambda-to-sqs/v1/lambdaSendsSqs.definition.ts";
import { sqsTriggersLambdaDefinition } from "./sqs-to-lambda/v1/sqsTriggersLambda.definition.ts";
import { eventbridgeSchedulerInvokesLambdaDefinition } from "./eventbridge-scheduler-to-lambda/v1/eventbridgeSchedulerInvokesLambda.definition.ts";
import { eventbridgeSchedulerSendsSqsDefinition } from "./eventbridge-scheduler-to-sqs/v1/eventbridgeSchedulerSendsSqs.definition.ts";
import { eventbridgeSchedulerPublishesSnsStandardDefinition } from "./eventbridge-scheduler-to-sns-standard/v1/eventbridgeSchedulerPublishesSnsStandard.definition.ts";
import { eventbridgeSchedulerPublishesSnsFifoDefinition } from "./eventbridge-scheduler-to-sns-fifo/v1/eventbridgeSchedulerPublishesSnsFifo.definition.ts";

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
  sqsTriggersLambdaDefinition.id,
  lambdaSendsSqsDefinition.id,
  lambdaPublishesSnsStandardDefinition.id,
  lambdaPublishesSnsFifoDefinition.id,
  eventbridgeSchedulerInvokesLambdaDefinition.id,
  eventbridgeSchedulerSendsSqsDefinition.id,
  eventbridgeSchedulerPublishesSnsStandardDefinition.id,
  eventbridgeSchedulerPublishesSnsFifoDefinition.id,
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
  sqs_triggers_lambda: sqsTriggersLambdaDefinition.id,
  lambda_sends_sqs: lambdaSendsSqsDefinition.id,
  lambda_publishes_sns_standard: lambdaPublishesSnsStandardDefinition.id,
  lambda_publishes_sns_fifo: lambdaPublishesSnsFifoDefinition.id,
  eventbridge_scheduler_invokes_lambda: eventbridgeSchedulerInvokesLambdaDefinition.id,
  eventbridge_scheduler_sends_sqs: eventbridgeSchedulerSendsSqsDefinition.id,
  eventbridge_scheduler_publishes_sns_standard:
    eventbridgeSchedulerPublishesSnsStandardDefinition.id,
  eventbridge_scheduler_publishes_sns_fifo:
    eventbridgeSchedulerPublishesSnsFifoDefinition.id,
} as const;

/** Outgoing scheduler → target relationships (exactly one per `eventbridge_scheduler` node). */
export const EVENTBRIDGE_SCHEDULER_TARGET_RELATIONSHIP_IDS: ReadonlySet<string> = new Set([
  RelationshipIds.eventbridge_scheduler_invokes_lambda,
  RelationshipIds.eventbridge_scheduler_sends_sqs,
  RelationshipIds.eventbridge_scheduler_publishes_sns_standard,
  RelationshipIds.eventbridge_scheduler_publishes_sns_fifo,
]);
