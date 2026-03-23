/**
 * CDK-free entry: safe for the Vite UI bundle. Do not import handler modules here.
 */

export type { ServiceId } from "./domain/serviceId.ts";
export type {
  RelationshipDefinition,
  ServiceDefinition,
} from "./domain/catalogTypes.ts";
export {
  RELATIONSHIP_VERSION,
  SERVICE_VERSION,
} from "./domain/catalogTypes.ts";

export {
  getRelationship,
  listRelationships,
} from "./edgeHandlers/relationshipsCatalog.ts";

export { getService, listServices } from "./nodeHandlers/servicesCatalog.ts";

export { NodeIds } from "./nodeHandlers/nodeIds.ts";

export {
  defaultInlineSourceForRuntime,
  lambdaNodeConfigSchema,
  LAMBDA_INLINE_SOURCE_MAX,
} from "./nodeHandlers/lambda/lambdaService.definition.ts";
export type { LambdaRuntime } from "./nodeHandlers/lambda/lambdaService.definition.ts";
export { logicalBucketId, s3NodeConfigSchema } from "./nodeHandlers/s3/s3Service.definition.ts";
export {
  cloudfrontNodeConfigSchema,
} from "./nodeHandlers/cloudfront/cloudfrontService.definition.ts";
export {
  route53NodeConfigSchema,
  route53RecordNameFromDomain,
} from "./nodeHandlers/route53/route53Service.definition.ts";
export { secretsManagerNodeConfigSchema } from "./nodeHandlers/secretsmanager/secretsManagerService.definition.ts";
export { snsFifoTopicNodeConfigSchema } from "./nodeHandlers/sns/snsFifoService.definition.ts";
export { snsStandardTopicNodeConfigSchema } from "./nodeHandlers/sns/snsStandardService.definition.ts";
export { sqsQueueNodeConfigSchema } from "./nodeHandlers/sqs/sqsService.definition.ts";

export { lambdaReadsS3ConfigSchema } from "./edgeHandlers/lambda-to-s3/lambdaReadsS3.definition.ts";
export { lambdaWritesS3ConfigSchema } from "./edgeHandlers/lambda-to-s3/lambdaWritesS3.definition.ts";
export { lambdaReadsSecretsManagerConfigSchema } from "./edgeHandlers/lambda-to-secretsmanager/lambdaReadsSecretsManager.definition.ts";
export { lambdaWritesSecretsManagerConfigSchema } from "./edgeHandlers/lambda-to-secretsmanager/lambdaWritesSecretsManager.definition.ts";
export { s3TriggersLambdaConfigSchema } from "./edgeHandlers/s3-to-lambda/s3TriggersLambda.definition.ts";
export { cloudfrontOriginS3ConfigSchema } from "./edgeHandlers/cloudfront-to-s3/cloudfrontOriginS3.definition.ts";
export { route53AliasCloudFrontConfigSchema } from "./edgeHandlers/route53-to-cloudfront/route53AliasCloudFront.definition.ts";
