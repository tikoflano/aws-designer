import type { ServiceId } from "../domain/serviceId.ts";

import { DynamodbNodeHandler } from "./dynamodb/dynamodbNodeHandler.ts";
import { CloudFrontNodeHandler } from "./cloudfront/cloudfrontNodeHandler.ts";
import { LambdaNodeHandler } from "./lambda/lambdaNodeHandler.ts";
import { Route53NodeHandler } from "./route53/route53NodeHandler.ts";
import { SnsFifoNodeHandler } from "./sns/snsFifoNodeHandler.ts";
import { SnsStandardNodeHandler } from "./sns/snsStandardNodeHandler.ts";
import { SecretsManagerNodeHandler } from "./secretsmanager/secretsManagerNodeHandler.ts";
import { S3NodeHandler } from "./s3/s3NodeHandler.ts";
import { SqsNodeHandler } from "./sqs/sqsNodeHandler.ts";
import type { NodeServiceHandler } from "./types.ts";

export const nodeServiceHandlers: Record<ServiceId, NodeServiceHandler> = {
  s3: new S3NodeHandler(),
  lambda: new LambdaNodeHandler(),
  cloudfront: new CloudFrontNodeHandler(),
  route53: new Route53NodeHandler(),
  secretsmanager: new SecretsManagerNodeHandler(),
  sns_standard: new SnsStandardNodeHandler(),
  sns_fifo: new SnsFifoNodeHandler(),
  sqs: new SqsNodeHandler(),
  dynamodb: new DynamodbNodeHandler(),
};
