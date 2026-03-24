import type { ZodType } from "zod";

import type { ServiceId } from "./serviceId.ts";

/** Current integer version for all v1 service and relationship definitions. */
export const DEFINITION_VERSION_V1 = 1 as const;

export type ServiceDefinition = {
  id: ServiceId;
  version: number;
  displayName: string;
  description: string;
  configSchema: ZodType<Record<string, unknown>>;
  /** Fresh node config when the user adds this service on the canvas (UI). */
  createDefaultConfig: () => Record<string, unknown>;
};

export type RelationshipDefinition = {
  id: string;
  version: number;
  name: string;
  verb: string;
  description: string;
  source: ServiceId;
  target: ServiceId;
  configSchema: ZodType<Record<string, unknown>>;
};
