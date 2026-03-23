import type { ServiceId } from "../domain/serviceId.ts";

import { lambdaServiceDefinition } from "./lambda/lambdaService.definition.ts";
import { s3ServiceDefinition } from "./s3/s3Service.definition.ts";

const SERVICE_ORDER: ServiceId[] = ["s3", "lambda"];

export const ALL_SERVICES = SERVICE_ORDER.map((id) =>
  id === "s3" ? s3ServiceDefinition : lambdaServiceDefinition,
);

export function listServices() {
  return ALL_SERVICES;
}

export function getService(id: ServiceId, version: string) {
  const def = ALL_SERVICES.find((s) => s.id === id);
  if (!def || def.version !== version) return undefined;
  return def;
}
