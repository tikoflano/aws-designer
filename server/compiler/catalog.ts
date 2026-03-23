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

export { lambdaNodeConfigSchema } from "./nodeHandlers/lambda/lambdaService.definition.ts";
export { logicalBucketId, s3NodeConfigSchema } from "./nodeHandlers/s3/s3Service.definition.ts";

export { lambdaReadsS3ConfigSchema } from "./edgeHandlers/lambda-to-s3/lambdaReadsS3.definition.ts";
export { lambdaWritesS3ConfigSchema } from "./edgeHandlers/lambda-to-s3/lambdaWritesS3.definition.ts";
export { s3TriggersLambdaConfigSchema } from "./edgeHandlers/s3-to-lambda/s3TriggersLambda.definition.ts";
