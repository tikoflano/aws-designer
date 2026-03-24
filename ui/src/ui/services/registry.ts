import type { NodeTypes } from "@xyflow/react";

import type { ServiceId } from "../../domain/types";
import { DEFINITION_VERSION_V1 } from "@compiler/catalog.ts";
import type { UiServiceModule } from "./types";
import { cloudfrontUiModule } from "./cloudfrontUiModule";
import { dynamodbUiModule } from "./dynamodbUiModule";
import { lambdaUiModule } from "./lambdaUiModule";
import { route53UiModule } from "./route53UiModule";
import { s3UiModule } from "./s3UiModule";
import { secretsmanagerUiModule } from "./secretsmanagerUiModule";
import { snsFifoUiModule } from "./snsFifoUiModule";
import { snsStandardUiModule } from "./snsStandardUiModule";
import { sqsUiModule } from "./sqsUiModule";

const UI_SERVICE_MODULES_V1: Record<ServiceId, UiServiceModule> = {
  s3: s3UiModule,
  lambda: lambdaUiModule,
  cloudfront: cloudfrontUiModule,
  route53: route53UiModule,
  secretsmanager: secretsmanagerUiModule,
  sns_standard: snsStandardUiModule,
  sns_fifo: snsFifoUiModule,
  sqs: sqsUiModule,
  dynamodb: dynamodbUiModule,
};

const BY_SERVICE_AND_VERSION: Partial<
  Record<ServiceId, Partial<Record<number, UiServiceModule>>>
> = {};
for (const [id, mod] of Object.entries(UI_SERVICE_MODULES_V1) as [
  ServiceId,
  UiServiceModule,
][]) {
  (BY_SERVICE_AND_VERSION[id] ??= {})[DEFINITION_VERSION_V1] = mod;
}

export function getUiServiceModule(
  serviceId: ServiceId,
  version: number,
): UiServiceModule | undefined {
  return BY_SERVICE_AND_VERSION[serviceId]?.[version];
}

export function buildNodeTypes(): NodeTypes {
  return Object.fromEntries(
    (Object.entries(UI_SERVICE_MODULES_V1) as [ServiceId, UiServiceModule][]).map(
      ([id, mod]) => [id, mod.canvasNode],
    ),
  ) as NodeTypes;
}
