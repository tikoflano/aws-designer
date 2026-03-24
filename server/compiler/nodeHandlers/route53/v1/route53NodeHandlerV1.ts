import * as cdk from "aws-cdk-lib";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import type { NodeServiceHandler } from "../../types.ts";
import {
  route53NodeConfigSchema,
  route53ServiceDefinition,
} from "./route53Service.definition.ts";

export class Route53NodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = route53ServiceDefinition;

  public apply(_stack: cdk.Stack, _ctx: GraphCompileContext, node: GraphNode): void {
    route53NodeConfigSchema.parse(node.config);
  }
}
