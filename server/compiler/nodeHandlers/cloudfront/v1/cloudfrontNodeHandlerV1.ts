import * as cdk from "aws-cdk-lib";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import type { NodeServiceHandler } from "../../types.ts";
import {
  cloudfrontNodeConfigSchema,
  cloudfrontServiceDefinition,
} from "./cloudfrontService.definition.ts";

export class CloudFrontNodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = cloudfrontServiceDefinition;

  public apply(_stack: cdk.Stack, _ctx: GraphCompileContext, node: GraphNode): void {
    cloudfrontNodeConfigSchema.parse(node.config);
  }
}
