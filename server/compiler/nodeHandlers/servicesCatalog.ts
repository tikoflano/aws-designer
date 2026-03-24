import type { ServiceDefinition } from "../domain/catalogTypes.ts";
import { SERVICE_ID_VALUES, type ServiceId } from "../domain/serviceId.ts";

import { dynamodbServiceDefinition } from "./dynamodb/v1/dynamodbService.definition.ts";
import { cloudfrontServiceDefinition } from "./cloudfront/v1/cloudfrontService.definition.ts";
import { lambdaServiceDefinition } from "./lambda/v1/lambdaService.definition.ts";
import { route53ServiceDefinition } from "./route53/v1/route53Service.definition.ts";
import { snsFifoServiceDefinition } from "./sns/v1/snsFifoService.definition.ts";
import { snsStandardServiceDefinition } from "./sns/v1/snsStandardService.definition.ts";
import { secretsManagerServiceDefinition } from "./secretsmanager/v1/secretsManagerService.definition.ts";
import { s3ServiceDefinition } from "./s3/v1/s3Service.definition.ts";
import { sqsServiceDefinition } from "./sqs/v1/sqsService.definition.ts";
import { eventbridgeSchedulerServiceDefinition } from "./eventbridge_scheduler/v1/eventbridgeSchedulerService.definition.ts";

const SERVICE_ORDER: ServiceId[] = [...SERVICE_ID_VALUES];

const BY_ID: Record<ServiceId, ServiceDefinition> = {
  s3: s3ServiceDefinition,
  lambda: lambdaServiceDefinition,
  cloudfront: cloudfrontServiceDefinition,
  route53: route53ServiceDefinition,
  secretsmanager: secretsManagerServiceDefinition,
  sns_standard: snsStandardServiceDefinition,
  sns_fifo: snsFifoServiceDefinition,
  sqs: sqsServiceDefinition,
  dynamodb: dynamodbServiceDefinition,
  eventbridge_scheduler: eventbridgeSchedulerServiceDefinition,
};

export const ALL_SERVICES = SERVICE_ORDER.map((id) => BY_ID[id]);

export function listServices() {
  return ALL_SERVICES;
}

export function getService(id: ServiceId, version: number) {
  const def = BY_ID[id];
  if (!def || def.version !== version) return undefined;
  return def;
}
