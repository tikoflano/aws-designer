/** Barrel: edge relationship config schemas re-exported for `@compiler/catalog.ts`. */
export { lambdaReadsS3ConfigSchema } from "./lambda-to-s3/lambdaReadsS3.definition.ts";
export { lambdaWritesS3ConfigSchema } from "./lambda-to-s3/lambdaWritesS3.definition.ts";
export { lambdaReadsDynamodbConfigSchema } from "./lambda-to-dynamodb/lambdaReadsDynamodb.definition.ts";
export { lambdaWritesDynamodbConfigSchema } from "./lambda-to-dynamodb/lambdaWritesDynamodb.definition.ts";
export { lambdaReadsSecretsManagerConfigSchema } from "./lambda-to-secretsmanager/lambdaReadsSecretsManager.definition.ts";
export { lambdaWritesSecretsManagerConfigSchema } from "./lambda-to-secretsmanager/lambdaWritesSecretsManager.definition.ts";
export { s3TriggersLambdaConfigSchema } from "./s3-to-lambda/s3TriggersLambda.definition.ts";
export { cloudfrontOriginS3ConfigSchema } from "./cloudfront-to-s3/cloudfrontOriginS3.definition.ts";
export { route53AliasCloudFrontConfigSchema } from "./route53-to-cloudfront/route53AliasCloudFront.definition.ts";
export { lambdaSubscribesSnsStandardConfigSchema } from "./sns-to-lambda/snsStandardToLambdaSubscription.definition.ts";
export { sqsSubscribesSnsFifoConfigSchema } from "./sns-to-sqs/snsFifoToSqsSubscription.definition.ts";
export { sqsSubscribesSnsStandardConfigSchema } from "./sns-to-sqs/snsStandardToSqsSubscription.definition.ts";
