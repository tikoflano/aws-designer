import type { ServiceDefinition } from "../domain/catalogTypes.ts";
import type { ServiceId } from "../domain/serviceId.ts";

import { cloudfrontServiceDefinition } from "./cloudfront/cloudfrontService.definition.ts";
import { lambdaServiceDefinition } from "./lambda/lambdaService.definition.ts";
import { route53ServiceDefinition } from "./route53/route53Service.definition.ts";
import { secretsManagerServiceDefinition } from "./secretsmanager/secretsManagerService.definition.ts";
import { s3ServiceDefinition } from "./s3/s3Service.definition.ts";
import { snsServiceDefinition } from "./sns/snsService.definition.ts";
import { sqsServiceDefinition } from "./sqs/sqsService.definition.ts";

const SERVICE_ORDER: ServiceId[] = [
  "s3",
  "lambda",
  "cloudfront",
  "route53",
  "secretsmanager",
  "sns",
  "sqs",
];

const BY_ID: Record<ServiceId, ServiceDefinition> = {
  s3: s3ServiceDefinition,
  lambda: lambdaServiceDefinition,
  cloudfront: cloudfrontServiceDefinition,
  route53: route53ServiceDefinition,
  secretsmanager: secretsManagerServiceDefinition,
  sns: snsServiceDefinition,
  sqs: sqsServiceDefinition,
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
