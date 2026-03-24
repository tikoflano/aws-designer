import { z } from "zod";

/**
 * Canonical list of supported node service ids (palette + compiler). Single source for `ServiceId`.
 */
export const SERVICE_ID_VALUES = [
  "s3",
  "lambda",
  "cloudfront",
  "route53",
  "secretsmanager",
  "sns_standard",
  "sns_fifo",
  "sqs",
  "dynamodb",
] as const;

export type ServiceId = (typeof SERVICE_ID_VALUES)[number];

/**
 * Wire/API/file parse set: current ids plus legacy `sns` (stripped by migrateLegacyGraphDocument).
 */
export const GRAPH_SERVICE_ID_WIRE_VALUES = [
  ...SERVICE_ID_VALUES,
  "sns",
] as const;

export type GraphServiceIdWire =
  (typeof GRAPH_SERVICE_ID_WIRE_VALUES)[number];

export const serviceIdGraphSchema = z.enum(
  GRAPH_SERVICE_ID_WIRE_VALUES as unknown as [
    GraphServiceIdWire,
    ...GraphServiceIdWire[],
  ],
);
