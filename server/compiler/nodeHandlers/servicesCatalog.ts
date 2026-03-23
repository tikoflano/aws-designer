import type { ServiceDefinition } from "../domain/catalogTypes.ts";
import type { ServiceId } from "../domain/serviceId.ts";

import { cloudfrontServiceDefinition } from "./cloudfront/cloudfrontService.definition.ts";
import { lambdaServiceDefinition } from "./lambda/lambdaService.definition.ts";
import { route53ServiceDefinition } from "./route53/route53Service.definition.ts";
import { s3ServiceDefinition } from "./s3/s3Service.definition.ts";

const SERVICE_ORDER: ServiceId[] = ["s3", "lambda", "cloudfront", "route53"];

const BY_ID: Record<ServiceId, ServiceDefinition> = {
  s3: s3ServiceDefinition,
  lambda: lambdaServiceDefinition,
  cloudfront: cloudfrontServiceDefinition,
  route53: route53ServiceDefinition,
};

export const ALL_SERVICES = SERVICE_ORDER.map((id) => BY_ID[id]);

export function listServices() {
  return ALL_SERVICES;
}

export function getService(id: ServiceId, version: string) {
  const def = BY_ID[id];
  if (!def || def.version !== version) return undefined;
  return def;
}
