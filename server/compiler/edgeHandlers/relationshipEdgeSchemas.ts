/** Barrel: edge relationship config schemas re-exported for `@compiler/catalog.ts`. */
export { lambdaReadsS3ConfigSchema } from "./lambda-to-s3/v1/lambdaReadsS3.definition.ts";
export { lambdaWritesS3ConfigSchema } from "./lambda-to-s3/v1/lambdaWritesS3.definition.ts";
export { lambdaReadsDynamodbConfigSchema } from "./lambda-to-dynamodb/v1/lambdaReadsDynamodb.definition.ts";
export { lambdaWritesDynamodbConfigSchema } from "./lambda-to-dynamodb/v1/lambdaWritesDynamodb.definition.ts";
export { lambdaReadsSecretsManagerConfigSchema } from "./lambda-to-secretsmanager/v1/lambdaReadsSecretsManager.definition.ts";
export { lambdaWritesSecretsManagerConfigSchema } from "./lambda-to-secretsmanager/v1/lambdaWritesSecretsManager.definition.ts";
export { s3TriggersLambdaConfigSchema } from "./s3-to-lambda/v1/s3TriggersLambda.definition.ts";
export { cloudfrontOriginS3ConfigSchema } from "./cloudfront-to-s3/v1/cloudfrontOriginS3.definition.ts";
export { route53AliasCloudFrontConfigSchema } from "./route53-to-cloudfront/v1/route53AliasCloudFront.definition.ts";
export { lambdaSubscribesSnsStandardConfigSchema } from "./sns-to-lambda/v1/snsStandardToLambdaSubscription.definition.ts";
export { sqsSubscribesSnsFifoConfigSchema } from "./sns-to-sqs/v1/snsFifoToSqsSubscription.definition.ts";
export { sqsSubscribesSnsStandardConfigSchema } from "./sns-to-sqs/v1/snsStandardToSqsSubscription.definition.ts";
export { lambdaSendsSqsConfigSchema } from "./lambda-to-sqs/v1/lambdaSendsSqs.definition.ts";
export { sqsTriggersLambdaConfigSchema } from "./sqs-to-lambda/v1/sqsTriggersLambda.definition.ts";
