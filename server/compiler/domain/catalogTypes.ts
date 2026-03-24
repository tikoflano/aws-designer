import type { ZodType } from "zod";

import type { ServiceId } from "./serviceId.ts";

export const SERVICE_VERSION = "1.0.0";
export const RELATIONSHIP_VERSION = "1.0.0" as const;

export type ServiceDefinition = {
  id: ServiceId;
  version: string;
  displayName: string;
  description: string;
  configSchema: ZodType<Record<string, unknown>>;
};

export type RelationshipDefinition = {
  id: string;
  version: string;
  name: string;
  verb: string;
  description: string;
  source: ServiceId;
  target: ServiceId;
  configSchema: ZodType<Record<string, unknown>>;
};
