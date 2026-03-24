/**
 * CDK-free entry: safe for the Vite UI bundle. Do not import handler modules here.
 */

export type { ServiceId } from "./domain/serviceId.ts";
export {
  SERVICE_ID_VALUES,
  serviceIdGraphSchema,
} from "./domain/serviceId.ts";
export type {
  RelationshipDefinition,
  ServiceDefinition,
} from "./domain/catalogTypes.ts";
export { DEFINITION_VERSION_V1 } from "./domain/catalogTypes.ts";

export {
  getRelationship,
  hasRelationshipBetween,
  listRelationships,
} from "./edgeHandlers/relationshipsCatalog.ts";

export type { RelationshipId } from "./edgeHandlers/relationshipIds.ts";
export {
  RELATIONSHIP_ID_TUPLE,
  RelationshipIds,
  relationshipIdZodSchema,
} from "./edgeHandlers/relationshipIds.ts";

export { getService, listServices } from "./nodeHandlers/servicesCatalog.ts";

export { NodeIds } from "./nodeHandlers/nodeIds.ts";

export {
  defaultInlineSourceForRuntime,
  lambdaNodeConfigSchema,
  LAMBDA_INLINE_SOURCE_MAX,
} from "./nodeHandlers/lambda/v1/lambdaService.definition.ts";
export type { LambdaRuntime } from "./nodeHandlers/lambda/v1/lambdaService.definition.ts";
export { logicalBucketId, s3NodeConfigSchema } from "./nodeHandlers/s3/v1/s3Service.definition.ts";
export {
  cloudfrontNodeConfigSchema,
} from "./nodeHandlers/cloudfront/v1/cloudfrontService.definition.ts";
export {
  route53NodeConfigSchema,
  route53RecordNameFromDomain,
} from "./nodeHandlers/route53/v1/route53Service.definition.ts";
export { secretsManagerNodeConfigSchema } from "./nodeHandlers/secretsmanager/v1/secretsManagerService.definition.ts";
export { snsFifoTopicNodeConfigSchema } from "./nodeHandlers/sns/v1/snsFifoService.definition.ts";
export { snsStandardTopicNodeConfigSchema } from "./nodeHandlers/sns/v1/snsStandardService.definition.ts";
export { sqsQueueNodeConfigSchema } from "./nodeHandlers/sqs/v1/sqsService.definition.ts";
export { dynamodbTableNodeConfigSchema } from "./nodeHandlers/dynamodb/v1/dynamodbService.definition.ts";

export {
  cloudfrontOriginS3ConfigSchema,
  lambdaReadsDynamodbConfigSchema,
  lambdaReadsSecretsManagerConfigSchema,
  lambdaReadsS3ConfigSchema,
  lambdaSubscribesSnsStandardConfigSchema,
  lambdaWritesDynamodbConfigSchema,
  lambdaWritesSecretsManagerConfigSchema,
  lambdaWritesS3ConfigSchema,
  route53AliasCloudFrontConfigSchema,
  s3TriggersLambdaConfigSchema,
  sqsSubscribesSnsFifoConfigSchema,
  sqsSubscribesSnsStandardConfigSchema,
} from "./edgeHandlers/relationshipEdgeSchemas.ts";
