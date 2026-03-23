import type { ServiceId } from "../domain/serviceId.ts";

// Keep definition list in sync with handlers in registry.ts when adding a relationship.
import { lambdaReadsS3Definition } from "./lambda-to-s3/lambdaReadsS3.definition.ts";
import { lambdaWritesS3Definition } from "./lambda-to-s3/lambdaWritesS3.definition.ts";
import { s3TriggersLambdaDefinition } from "./s3-to-lambda/s3TriggersLambda.definition.ts";

export const ALL_RELATIONSHIPS = [
  lambdaReadsS3Definition,
  lambdaWritesS3Definition,
  s3TriggersLambdaDefinition,
];

export function listRelationships(source: ServiceId, target: ServiceId) {
  return ALL_RELATIONSHIPS.filter((r) => r.source === source && r.target === target);
}

export function getRelationship(id: string, version: string) {
  return ALL_RELATIONSHIPS.find((r) => r.id === id && r.version === version);
}
