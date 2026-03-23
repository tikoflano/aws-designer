import type { ServiceId } from "../domain/serviceId.ts";

import { CloudFrontNodeHandler } from "./cloudfront/cloudfrontNodeHandler.ts";
import { LambdaNodeHandler } from "./lambda/lambdaNodeHandler.ts";
import { Route53NodeHandler } from "./route53/route53NodeHandler.ts";
import { S3NodeHandler } from "./s3/s3NodeHandler.ts";
import type { NodeServiceHandler } from "./types.ts";

export const nodeServiceHandlers: Record<ServiceId, NodeServiceHandler> = {
  s3: new S3NodeHandler(),
  lambda: new LambdaNodeHandler(),
  cloudfront: new CloudFrontNodeHandler(),
  route53: new Route53NodeHandler(),
};
