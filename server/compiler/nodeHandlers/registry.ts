import { CloudFrontNodeHandlerV1 } from "./cloudfront/v1/cloudfrontNodeHandlerV1.ts";
import { DynamodbNodeHandlerV1 } from "./dynamodb/v1/dynamodbNodeHandlerV1.ts";
import { LambdaNodeHandlerV1 } from "./lambda/v1/lambdaNodeHandlerV1.ts";
import { Route53NodeHandlerV1 } from "./route53/v1/route53NodeHandlerV1.ts";
import { SnsFifoNodeHandlerV1 } from "./sns/v1/snsFifoNodeHandlerV1.ts";
import { SnsStandardNodeHandlerV1 } from "./sns/v1/snsStandardNodeHandlerV1.ts";
import { SecretsManagerNodeHandlerV1 } from "./secretsmanager/v1/secretsManagerNodeHandlerV1.ts";
import { S3NodeHandlerV1 } from "./s3/v1/s3NodeHandlerV1.ts";
import { SqsNodeHandlerV1 } from "./sqs/v1/sqsNodeHandlerV1.ts";
import type { ServiceId } from "../domain/serviceId.ts";
import type { NodeServiceHandler } from "./types.ts";

const ALL_HANDLERS: NodeServiceHandler[] = [
  new S3NodeHandlerV1(),
  new LambdaNodeHandlerV1(),
  new CloudFrontNodeHandlerV1(),
  new Route53NodeHandlerV1(),
  new SecretsManagerNodeHandlerV1(),
  new SnsStandardNodeHandlerV1(),
  new SnsFifoNodeHandlerV1(),
  new SqsNodeHandlerV1(),
  new DynamodbNodeHandlerV1(),
];

const BY_SERVICE_AND_VERSION: Partial<
  Record<ServiceId, Record<number, NodeServiceHandler>>
> = {};
for (const h of ALL_HANDLERS) {
  const id = h.definition.id;
  const ver = h.definition.version;
  const slot = (BY_SERVICE_AND_VERSION[id] ??= {});
  if (slot[ver]) {
    throw new Error(
      `Duplicate node handler for service "${id}" version ${String(ver)}`,
    );
  }
  slot[ver] = h;
}

export function getNodeHandler(
  serviceId: ServiceId,
  version: number,
): NodeServiceHandler | undefined {
  return BY_SERVICE_AND_VERSION[serviceId]?.[version];
}

/** For tests: stable order matches {@link ALL_HANDLERS} construction order. */
export function listNodeServiceHandlers(): NodeServiceHandler[] {
  return [...ALL_HANDLERS];
}
