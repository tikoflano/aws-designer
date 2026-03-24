import * as cdk from "aws-cdk-lib";

import type { GraphNode } from "@shared/domain/graph.ts";
import type { GraphCompileContext } from "../../../graphCompileContext.ts";
import type { NodeServiceHandler } from "../../types.ts";
import { eventbridgeSchedulerServiceDefinition } from "./eventbridgeSchedulerService.definition.ts";

/**
 * Schedule resources are created by edge handlers (scheduler → target). The node
 * carries configuration only.
 */
export class EventbridgeSchedulerNodeHandlerV1 implements NodeServiceHandler {
  public readonly definition = eventbridgeSchedulerServiceDefinition;

  public apply(stack: cdk.Stack, ctx: GraphCompileContext, node: GraphNode): void {
    void stack;
    void ctx;
    void node;
  }
}
