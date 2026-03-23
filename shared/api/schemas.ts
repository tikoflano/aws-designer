import { z } from "zod";

const serviceIdSchema = z.enum(["s3", "lambda"]);

const graphNodeSchema = z.object({
  id: z.string(),
  serviceId: serviceIdSchema,
  serviceVersion: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.string(), z.unknown()),
});

const graphEdgeSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  sourceHandleId: z.string().optional(),
  targetHandleId: z.string().optional(),
  relationshipId: z.string(),
  relationshipVersion: z.string(),
  config: z.record(z.string(), z.unknown()),
});

export const graphDocumentSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type GraphDocumentWire = z.infer<typeof graphDocumentSchema>;

export const graphRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
  title: z.string(),
  graph: graphDocumentSchema,
});

export type GraphRecord = z.infer<typeof graphRecordSchema>;

export const putGraphBodySchema = z.object({
  graph: graphDocumentSchema,
});

export type PutGraphBody = z.infer<typeof putGraphBodySchema>;

export const patchGraphTitleBodySchema = z.object({
  title: z
    .string()
    .max(200)
    .transform((s) => s.trim()),
});

export type PatchGraphTitleBody = z.infer<typeof patchGraphTitleBodySchema>;

export const graphSummarySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
});

export const graphsListResponseSchema = z.object({
  graphs: z.array(graphSummarySchema),
});

export type GraphsListResponse = z.infer<typeof graphsListResponseSchema>;

export const graphVersionEntrySchema = z.object({
  version: z.number(),
  updatedAt: z.string(),
});

export const graphVersionsListResponseSchema = z.object({
  versions: z.array(graphVersionEntrySchema),
});

export type GraphVersionsListResponse = z.infer<
  typeof graphVersionsListResponseSchema
>;

export const compileIssueWireSchema = z.object({
  code: z.string(),
  message: z.string(),
  edgeId: z.string().optional(),
  nodeId: z.string().optional(),
});

export const validationFailedErrorSchema = z.object({
  error: z.literal("validation_failed"),
  issues: z.array(compileIssueWireSchema),
});

export type ValidationFailedErrorBody = z.infer<
  typeof validationFailedErrorSchema
>;

export const notFoundErrorSchema = z.object({
  error: z.literal("not_found"),
});

export const invalidBodyErrorSchema = z.object({
  error: z.literal("invalid_body"),
  message: z.string(),
});

export const invalidVersionErrorSchema = z.object({
  error: z.literal("invalid_version"),
});
