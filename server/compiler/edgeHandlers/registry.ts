// Keep handler list in sync with relationships in relationshipsCatalog.ts when adding a relationship.
import { LambdaReadsS3Handler } from "./lambda-to-s3/lambdaReadsS3Handler.ts";
import { LambdaWritesS3Handler } from "./lambda-to-s3/lambdaWritesS3Handler.ts";
import { S3TriggersLambdaHandler } from "./s3-to-lambda/s3TriggersLambdaHandler.ts";
import type { EdgeRelationshipHandler } from "./types.ts";

const ALL_HANDLERS: EdgeRelationshipHandler[] = [
  new LambdaReadsS3Handler(),
  new LambdaWritesS3Handler(),
  new S3TriggersLambdaHandler(),
];

export const edgeRelationshipHandlers: Record<string, EdgeRelationshipHandler> =
  Object.fromEntries(ALL_HANDLERS.map((h) => [h.definition.id, h]));
