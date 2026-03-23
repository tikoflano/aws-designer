import type { ServiceId } from "../domain/serviceId.ts";

import { LambdaNodeHandler } from "./lambda/lambdaNodeHandler.ts";
import { S3NodeHandler } from "./s3/s3NodeHandler.ts";
import type { NodeServiceHandler } from "./types.ts";

export const nodeServiceHandlers: Record<ServiceId, NodeServiceHandler> = {
  s3: new S3NodeHandler(),
  lambda: new LambdaNodeHandler(),
};
